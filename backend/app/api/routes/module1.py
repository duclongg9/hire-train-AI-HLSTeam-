from __future__ import annotations

from uuid import UUID

import logging
import io
import zipfile
import pdfplumber
import asyncio
import websockets
import json
from fastapi import APIRouter, Body, Depends, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect

from app.schemas.module1 import (
    BulkCandidateScoreRequest,
    BulkEmailRequest,
    CampaignCreate,
    CampaignStatus,
    CampaignUpdate,
    CandidateApplyRequest,
    CandidateCompareRequest,
    CandidateScoreRequest,
    CandidateStatusUpdateRequest,
    FinalDecisionRequest,
    GenerateTestQuestionsRequest,
    InterviewCheckInRequest,
    InterviewEventCreate,
    InterviewRubricUpsertRequest,
    MockLoginRequest,
    PositionCreate,
    PositionStatus,
    RubricUpsertRequest,
    TestQuestionUpsertRequest,
    TestSubmitRequest,
    UserCreate,
)
from app.services.module1_service import Module1Service, get_module1_service
from app.core.errors import AppError

router = APIRouter()
logger = logging.getLogger(__name__)


def service_dep() -> Module1Service:
    return get_module1_service()


def process_cv_batch_task(campaign_id: UUID, file_content: bytes, service: Module1Service):
    from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx
    import re
    try:
        candidate_ids = []
        with zipfile.ZipFile(io.BytesIO(file_content)) as z:
            for file_info in z.infolist():
                filename = file_info.filename
                if filename.startswith("__MACOSX") or file_info.is_dir():
                    continue
                    
                ext = filename.split(".")[-1].lower()
                if ext not in ("pdf", "docx", "doc"):
                    continue
                    
                try:
                    with z.open(file_info) as f:
                        file_bytes = f.read()
                    
                    if ext == "pdf":
                        text = extract_text_from_pdf(file_bytes)
                    else:
                        text = extract_text_from_docx(file_bytes)
                        
                    if not text.strip():
                        print(f"Skipping empty or unscannable file: {filename}")
                        continue
                    
                    # Extract contact info via Gemini
                    info = service.ai.extract_candidate_info(text)
                    
                    fallback_name = filename.split("/")[-1].replace(f".{ext}", "")
                    name = info.get("full_name") or fallback_name
                    email = info.get("email")
                    phone = info.get("phone")
                    
                    # Fallback regex email
                    if not email:
                        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
                        if email_match:
                            email = email_match.group(0)
                        else:
                            email = f"{name.lower().replace(' ', '.')}@example.com"
                            
                    candidate = service.apply_candidate(
                        campaign_id,
                        CandidateApplyRequest(
                            full_name=name,
                            email=email,
                            phone=phone,
                            cv_text=text,
                            cv_file_name=filename
                        )
                    )
                    candidate_ids.append(candidate.id)
                except Exception as e:
                    print(f"Failed to process {filename}: {e}")
        
        # Once all candidates are applied, bulk score them
        if candidate_ids:
            service.bulk_score_candidates(campaign_id, candidate_ids)
    except Exception as e:
        print(f"Batch CV processing failed: {e}")


@router.post("/campaigns/{campaign_id}/batch-evaluate")
def batch_evaluate(
    campaign_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    service: Module1Service = Depends(service_dep),
):
    if not file.filename.endswith(".zip"):
        raise AppError(400, "Only ZIP files are supported.")
    
    # Check if rubric exists before processing
    service._rubric_or_error(campaign_id)
    
    try:
        content = file.file.read()
        background_tasks.add_task(process_cv_batch_task, campaign_id, content, service)
        return {"message": "Batch evaluation started in the background."}
    except Exception as e:
        raise AppError(500, f"Failed to start batch evaluation: {str(e)}")


@router.post("/auth/mock-login")
def mock_login(payload: MockLoginRequest, service: Module1Service = Depends(service_dep)):
    return service.mock_login(payload)


@router.get("/admin/users")
def list_users(service: Module1Service = Depends(service_dep)):
    return service.list_users()


@router.post("/admin/users", status_code=201)
def create_user(payload: UserCreate, service: Module1Service = Depends(service_dep)):
    return service.create_user(payload)


@router.get("/admin/audit-logs")
def list_admin_audit_logs(service: Module1Service = Depends(service_dep)):
    return service.list_audit_logs()


@router.get("/campaigns")
def list_campaigns(service: Module1Service = Depends(service_dep)):
    return service.list_campaigns()


@router.post("/campaigns", status_code=201)
def create_campaign(payload: CampaignCreate, service: Module1Service = Depends(service_dep)):
    return service.create_campaign(payload)


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.get_campaign(campaign_id)


@router.patch("/campaigns/{campaign_id}")
def update_campaign(campaign_id: UUID, payload: CampaignUpdate, service: Module1Service = Depends(service_dep)):
    return service.update_campaign(campaign_id, payload)


@router.post("/campaigns/{campaign_id}/close")
def close_campaign(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.update_campaign(campaign_id, CampaignUpdate(status=CampaignStatus.CLOSED))


@router.get("/campaigns/{campaign_id}/positions")
def list_positions(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.list_positions(campaign_id)


@router.post("/campaigns/{campaign_id}/positions", status_code=201)
def create_position(campaign_id: UUID, payload: PositionCreate, service: Module1Service = Depends(service_dep)):
    return service.create_position(campaign_id, payload)


@router.post("/campaigns/{campaign_id}/positions/upload", status_code=201)
def create_position_upload(
    campaign_id: UUID,
    title: str = Form(...),
    headcount: int = Form(...),
    budget: str | None = Form(default=None),
    file: UploadFile = File(...),
    service: Module1Service = Depends(service_dep),
):
    from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "docx", "doc"):
        raise AppError(400, "Only PDF and DOCX files are supported.")
        
    try:
        content = file.file.read()
        if ext == "pdf":
            text = extract_text_from_pdf(content)
        else:
            text = extract_text_from_docx(content)
            
        if not text.strip():
            raise AppError(400, "Could not extract text from the JD file.")
        
        payload = PositionCreate(
            title=title,
            headcount=headcount,
            budget=budget,
            jd_text=text
        )
        return service.create_position(campaign_id, payload)
    except AppError as e:
        raise e
    except Exception as e:
        raise AppError(500, f"Error processing JD file: {str(e)}")


@router.post("/positions/{position_id}/analyze-jd")
def analyze_jd(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.analyze_jd(position_id)


@router.post("/positions/ai-core/jd/extract-rubric")
def extract_rubric(
    position_id: UUID = Body(...),
    file: UploadFile = File(...),
    service: Module1Service = Depends(service_dep),
):
    from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "docx", "doc"):
        raise AppError(400, "Only PDF and DOCX files are supported.")
        
    try:
        content = file.file.read()
        if ext == "pdf":
            text = extract_text_from_pdf(content)
        else:
            text = extract_text_from_docx(content)
            
        if not text.strip():
            raise AppError(400, "Could not extract text from the JD file.")
        
        # Update JD text in position
        service.repo.update_position(position_id, {"jd_text": text})
        
        # Analyze JD and return Rubric
        return service.analyze_jd(position_id)
    except AppError as e:
        raise e
    except Exception as e:
        raise AppError(500, f"Error processing JD file: {str(e)}")


@router.get("/positions/{position_id}/rubric")
def get_rubric(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.repo.list_rubric(position_id)


@router.put("/positions/{position_id}/rubric")
def upsert_rubric(position_id: UUID, payload: RubricUpsertRequest, service: Module1Service = Depends(service_dep)):
    return service.upsert_rubric(position_id, payload)


@router.post("/campaigns/{campaign_id}/publish")
def publish_campaign(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    # Hard-Gate Validation: A campaign can only be ACTIVE if all its positions are fully configured
    positions = service.repo.list_positions(campaign_id)
    if not positions:
        raise AppError(400, "Cannot publish campaign: No positions found.")
        
    for pos in positions:
        # Check CV Rubric
        cv_rubric = service.repo.list_rubric(pos.id)
        if not cv_rubric:
            raise AppError(400, f"Cannot publish campaign: Position '{pos.title}' is missing CV Rubric.")
            
        # Check Test Questions
        test_questions = service.repo.list_test_questions(pos.id)
        if not test_questions:
            raise AppError(400, f"Cannot publish campaign: Position '{pos.title}' is missing Test Questions.")
            
        # Check Interview Rubric
        interview_rubric = service.repo.list_interview_rubrics(pos.id)
        if not interview_rubric:
            raise AppError(400, f"Cannot publish campaign: Position '{pos.title}' is missing Interview Rubric.")
            
    return service.publish_campaign(campaign_id)


@router.post("/positions/{position_id}/test-questions/generate")
def generate_test_questions(position_id: UUID, payload: GenerateTestQuestionsRequest, service: Module1Service = Depends(service_dep)):
    return service.generate_test_questions(position_id, payload)


@router.get("/positions/{position_id}/test-questions")
def list_test_questions(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.list_test_questions(position_id)


@router.put("/positions/{position_id}/test-questions")
def upsert_test_questions(position_id: UUID, payload: TestQuestionUpsertRequest, service: Module1Service = Depends(service_dep)):
    return service.upsert_test_questions(position_id, payload)


@router.get("/positions/{position_id}/interview-rubric")
def get_interview_rubric(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.repo.list_interview_rubrics(position_id)


@router.put("/positions/{position_id}/interview-rubric")
def upsert_interview_rubric(position_id: UUID, payload: InterviewRubricUpsertRequest, service: Module1Service = Depends(service_dep)):
    return service.repo.replace_interview_rubrics(position_id, payload.groups)


@router.post("/positions/{position_id}/publish")
def publish_position(position_id: UUID, service: Module1Service = Depends(service_dep)):
    # Hard-Gate Validation: Check CV Rubric, Test Questions, and Interview Rubric
    cv_rubric = service.repo.list_rubric(position_id)
    if not cv_rubric:
        raise AppError(400, "Cannot publish position: CV Rubric is missing.")
    
    test_questions = service.repo.list_test_questions(position_id)
    if not test_questions:
        raise AppError(400, "Cannot publish position: Test Questions are missing.")
        
    interview_rubric = service.repo.list_interview_rubrics(position_id)
    if not interview_rubric:
        raise AppError(400, "Cannot publish position: Interview Rubric is missing.")
        
    return service.publish_position(position_id)


@router.post("/positions/{position_id}/close")
def close_position(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.repo.update_position(position_id, {"status": "CLOSED"})


@router.get("/public/positions")
def list_public_positions(service: Module1Service = Depends(service_dep)):
    return service.list_public_positions()


@router.get("/public/jobs/{position_id}")
def get_public_job(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.get_public_job(position_id)


@router.post("/public/jobs/{position_id}/apply", status_code=201)
def apply_candidate(position_id: UUID, payload: CandidateApplyRequest, service: Module1Service = Depends(service_dep)):
    return service.apply_candidate(position_id, payload)


@router.post("/public/jobs/{position_id}/apply-file", status_code=201)
def apply_candidate_file(
    position_id: UUID,
    file: UploadFile = File(...),
    service: Module1Service = Depends(service_dep),
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ("pdf", "docx", "doc"):
        raise AppError(400, "Only PDF and DOCX files are supported.")
        
    try:
        content = file.file.read()
        return service.apply_candidate_file(position_id, content, file.filename)
    except AppError as e:
        raise e
    except Exception as e:
        raise AppError(500, f"Error processing CV file: {str(e)}")


@router.get("/positions/{position_id}/candidates")
def list_candidates(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.list_candidates(position_id)


@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.get_candidate(candidate_id)


@router.get("/positions/{position_id}/leaderboard")
def leaderboard(position_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.leaderboard(position_id)


@router.post("/positions/{position_id}/candidates/score")
def score_candidate(position_id: UUID, payload: CandidateScoreRequest | None = Body(default=None), service: Module1Service = Depends(service_dep)):
    if payload and payload.candidate_id:
        return service.score_candidate(position_id, payload.candidate_id)
    return service.bulk_score_candidates(position_id)


@router.post("/positions/{position_id}/candidates/bulk-score")
def bulk_score_candidates(position_id: UUID, payload: BulkCandidateScoreRequest | None = Body(default=None), service: Module1Service = Depends(service_dep)):
    return service.bulk_score_candidates(position_id, payload.candidate_ids if payload else None)


@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: UUID, payload: CandidateStatusUpdateRequest, service: Module1Service = Depends(service_dep)):
    return service.update_candidate_status(candidate_id, payload)


@router.post("/positions/{position_id}/candidates/compare")
def compare_candidates(position_id: UUID, payload: CandidateCompareRequest, service: Module1Service = Depends(service_dep)):
    return service.compare_candidates(position_id, payload)


@router.post("/candidates/{candidate_id}/invite-test")
def invite_test(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.invite_test(candidate_id)


@router.post("/candidates/{candidate_id}/invite-interview")
def invite_interview(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.invite_interview(candidate_id)


@router.get("/candidate/test/{token}")
def open_test(token: str, service: Module1Service = Depends(service_dep)):
    return service.open_test(token)


@router.post("/candidate/test/{token}/start")
def start_test(token: str, service: Module1Service = Depends(service_dep)):
    return service.start_test(token)


@router.post("/candidate/test/{token}/submit")
def submit_test(token: str, payload: TestSubmitRequest, service: Module1Service = Depends(service_dep)):
    return service.submit_test(token, payload)


@router.get("/candidate/test/{token}/result")
def test_result(token: str, service: Module1Service = Depends(service_dep)):
    return service.test_result(token)


@router.get("/candidate/interview/{token}")
def open_interview(token: str, service: Module1Service = Depends(service_dep)):
    return service.open_interview(token)


@router.post("/candidate/interview/{token}/check-in")
def check_in_interview(token: str, payload: InterviewCheckInRequest, service: Module1Service = Depends(service_dep)):
    return service.check_in_interview(token, payload)


@router.post("/candidate/interview/{token}/start")
def start_interview(token: str, service: Module1Service = Depends(service_dep)):
    return service.start_interview(token)


@router.post("/candidate/interview/{token}/event")
def ingest_interview_event(token: str, payload: InterviewEventCreate, service: Module1Service = Depends(service_dep)):
    return service.ingest_interview_event(token, payload)


@router.post("/candidate/interview/{token}/finish")
def finish_interview(token: str, service: Module1Service = Depends(service_dep)):
    return service.finish_interview(token)


@router.get("/candidate/interview/{token}/report")
def candidate_interview_report(token: str, service: Module1Service = Depends(service_dep)):
    invitation = service._valid_interview_invitation(token)
    return service.interview_report(invitation.candidate_id)


@router.get("/candidates/{candidate_id}/interview-report")
def interview_report(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.interview_report(candidate_id)


@router.get("/candidates/{candidate_id}/final-review")
def final_review(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.final_review(candidate_id)


@router.post("/candidates/{candidate_id}/final-decision")
def final_decision(candidate_id: UUID, payload: FinalDecisionRequest, service: Module1Service = Depends(service_dep)):
    return service.final_decision(candidate_id, payload)


@router.post("/positions/{position_id}/bulk-email")
def bulk_email(position_id: UUID, payload: BulkEmailRequest, service: Module1Service = Depends(service_dep)):
    return service.bulk_email(position_id, payload)


@router.get("/emails")
def list_email_events(position_id: UUID | None = None, service: Module1Service = Depends(service_dep)):
    return service.list_email_events(position_id)


@router.websocket("/interview/live")
async def websocket_proxy(websocket: WebSocket):
    from config import settings
    await websocket.accept()

    try:
        # Nhận tin nhắn đầu tiên chứa token và role từ client
        init_msg = await websocket.receive_text()
        init_data = json.loads(init_msg)
        token = init_data.get("token")
        
        # Verify token using Module1Service
        service = get_module1_service()
        try:
            invitation = service._valid_interview_invitation(token)
            # Update session status via service
            # service.start_interview(token) could be called here if needed
        except Exception as e:
            await websocket.close(code=4003, reason=str(e))
            return

        print(f"[WebSocket] Client connected with valid token for candidate {invitation.candidate_id}")
        
        gemini_api_key = settings.GEMINI_LIVE_API_KEY
        if not gemini_api_key:
            gemini_api_key = settings.GEMINI_API_KEY # fallback
        if not gemini_api_key:
            await websocket.close(code=1011, reason="Missing GEMINI_API_KEY on server")
            return

        model = "models/gemini-2.0-flash-exp"
        gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={gemini_api_key}"

        print(f"[WebSocket] Connecting to Gemini API ({model})...")
        async with websockets.connect(gemini_ws_url, extra_headers={"User-Agent": "FastAPI-Proxy"}) as gemini_ws:
            print("[WebSocket] Connected to Gemini. Starting bidi proxy...")

            # Khởi tạo session (setup) với Gemini
            setup_msg = {
                "setup": {
                    "model": model,
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {
                            "voiceConfig": {
                                "prebuiltVoiceConfig": {
                                    "voiceName": "Puck",
                                }
                            }
                        }
                    },
                    "systemInstruction": {
                        "parts": [
                            {"text": "You are a professional HR recruiter named Sarah. Ask 3 brief interview questions to the candidate."}
                        ]
                    }
                }
            }
            await gemini_ws.send(json.dumps(setup_msg))

            # Task 1: Client -> Proxy -> Gemini
            async def client_to_gemini():
                try:
                    while True:
                        msg = await websocket.receive_text()
                        await gemini_ws.send(msg)
                except WebSocketDisconnect:
                    print("[WebSocket] Client disconnected.")
                except Exception as e:
                    print(f"[WebSocket] client_to_gemini error: {e}")

            # Task 2: Gemini -> Proxy -> Client
            async def gemini_to_client():
                try:
                    async for msg in gemini_ws:
                        await websocket.send_text(msg)
                except Exception as e:
                    print(f"[WebSocket] gemini_to_client error: {e}")

            # Chạy đồng thời 2 task
            await asyncio.gather(
                client_to_gemini(),
                gemini_to_client()
            )

    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected early.")
    except Exception as e:
        print(f"[WebSocket] Unexpected error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass


from pydantic import BaseModel

class TranscribePresignRequest(BaseModel):
    language_code: str = "vi-VN"
    sample_rate: int = 16000
    media_encoding: str = "pcm"


@router.post("/candidate/interview/{token}/transcribe-presign")
def get_transcribe_presigned_url(
    token: str,
    payload: TranscribePresignRequest = Body(...),
    service: Module1Service = Depends(service_dep),
):
    from app.services.aws import transcribe_service
    try:
        service._valid_interview_invitation(token)
    except Exception as e:
        raise AppError(403, f"Token không hợp lệ hoặc đã hết hạn: {str(e)}")

    try:
        url = transcribe_service.get_presigned_websocket_url(
            language_code=payload.language_code,
            sample_rate=payload.sample_rate,
            media_encoding=payload.media_encoding,
        )
        return {"url": url, "expires_in_seconds": 300}
    except Exception as e:
        raise AppError(500, f"Failed to generate presigned URL: {str(e)}")


# ---------------------------------------------------------------------------
# Text-to-Speech endpoint — mirrors EdgeTts.cs pattern
# Voice: vi-VN-NamMinhNeural (configurable via request body)
# Returns: audio/mpeg (MP3) stream synthesised by edge-tts
# ---------------------------------------------------------------------------

class TtsRequest(BaseModel):
    text: str
    voice: str = "vi-VN-NamMinhNeural"
    rate: str = "+0%"
    volume: str = "+0%"


@router.post("/tts")
async def text_to_speech(payload: TtsRequest):
    """
    Synthesise Vietnamese speech via Microsoft Edge TTS.
    Mirrors the EdgeTts.cs SynthesizeAsync pattern:
      - Collects all audio into a MemoryStream (io.BytesIO) BEFORE responding
      - Returns the complete MP3 bytes as audio/mpeg
      - Properly handles NoAudioReceived with retries (like the C# Stop/retry pattern)
    """
    import edge_tts
    from fastapi.responses import Response
    import io

    text = (
        payload.text
        .replace("\r", " ")
        .replace("\n", " ")
        .replace('"', "'")
        .strip()
    )

    if not text:
        raise AppError(400, "text must not be empty")

    async def synthesize(voice: str, rate: str, volume: str) -> bytes | None:
        """Mirrors EdgeTts.cs SynthesizeAsync — collect into BytesIO, return bytes or None."""
        try:
            communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, volume=volume)
            buf = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buf.write(chunk["data"])
            data = buf.getvalue()
            return data if data else None
        except (NoAudioReceived, Exception):
            return None

    # Attempt 1: requested voice + rate/volume
    audio = await synthesize(payload.voice, payload.rate, payload.volume)

    # Attempt 2: same voice, reset rate/volume to defaults (avoids format issues)
    if audio is None:
        audio = await synthesize(payload.voice, "+0%", "+0%")

    # Attempt 3: fallback to a known-stable voice
    if audio is None:
        audio = await synthesize("vi-VN-HoaiMyNeural", "+0%", "+0%")

    if not audio:
        raise AppError(500, "Edge TTS returned no audio after retries. Check network or voice parameters.")

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "no-cache",
            "Content-Length": str(len(audio)),
        },
    )
