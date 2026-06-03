import uuid
import zipfile
import io
import logging
from typing import Optional, List
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, BackgroundTasks, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, ConfigDict

from app.database.connection import get_db, SessionLocal
from app.database.models import Campaign, Candidate, AIEvaluation
from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx

# TODO: AWS MIGRATION - Update to use AWS AI Service instead of Gemini
from app.core.gemini_client import gemini_client
from app.services.aws_s3 import s3_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Pydantic schemas for response
class AIEvaluationResponse(BaseModel):
    eval_type: str
    strengths: list = []
    weaknesses: list = []
    radar_dimensions: Optional[dict] = None
    risk_flag: str
    
    model_config = ConfigDict(from_attributes=True)

class CandidateLeaderboardResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: Optional[str] = None
    cv_s3_key: str
    status: str
    overall_score: Decimal
    evaluations: List[AIEvaluationResponse] = []
    
    model_config = ConfigDict(from_attributes=True)


def process_batch_cvs(campaign_id: uuid.UUID, zip_bytes: bytes, rubric_schema: dict):
    """
    Background task:
    1. Giải nén file ZIP
    2. Lặp qua từng CV, đẩy lên S3
    3. Lấy text từ PDF/DOCX
    4. Gọi Gemini API chấm điểm
    5. Lưu kết quả vào DB
    """
    db = SessionLocal()
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            for file_info in z.infolist():
                if file_info.is_dir() or file_info.filename.startswith('__MACOSX'):
                    continue
                
                filename = file_info.filename.lower()
                if not (filename.endswith('.pdf') or filename.endswith('.docx')):
                    continue
                
                try:
                    file_bytes = z.read(file_info.name)
                    candidate_id = uuid.uuid4()
                    ext = filename.split('.')[-1]
                    s3_key = f"cvs/{campaign_id}/{candidate_id}.{ext}"
                    
                    # Đẩy file gốc lên S3
                    s3_service.upload_file(io.BytesIO(file_bytes), s3_key)
                    
                    # Bóc tách văn bản
                    text = ""
                    if filename.endswith('.pdf'):
                        text = extract_text_from_pdf(file_bytes)
                    else:
                        text = extract_text_from_docx(file_bytes)
                        
                    if not text:
                        continue
                        
                    # TODO: AWS MIGRATION
                    # Tương lai sẽ thay thế dòng này để gọi AWS Bedrock (hoặc dịch vụ AWS AI khác) 
                    # để lấy điểm số ứng viên dựa trên rubric.
                    eval_result = gemini_client.score_cv_against_rubric(text, rubric_schema)
                    
                    if "error" in eval_result:
                        logger.error(f"Error evaluating CV {file_info.filename}: {eval_result['error']}")
                        continue
                        
                    overall_score = eval_result.get("overall_score", 0.0)
                    
                    # Parse filename to use as fake full_name
                    base_name = file_info.filename.split('/')[-1]
                    
                    # Lưu candidate
                    candidate = Candidate(
                        id=candidate_id,
                        campaign_id=campaign_id,
                        full_name=base_name,
                        email=f"{candidate_id}@hiretrain.local",
                        phone="",
                        cv_s3_key=s3_key,
                        status="SCREENED",
                        overall_score=overall_score
                    )
                    db.add(candidate)
                    
                    # Lưu đánh giá AI
                    ai_eval = AIEvaluation(
                        candidate_id=candidate_id,
                        eval_type="CV_SCREEN",
                        strengths=eval_result.get("strengths", []),
                        weaknesses=eval_result.get("weaknesses", []),
                        radar_dimensions=eval_result.get("radar_dimensions", {}),
                        ai_reasoning="Auto-evaluated via Batch Polling",
                        risk_flag="SAFE" if float(overall_score) >= 50 else "HIGH_RISK"
                    )
                    db.add(ai_eval)
                    db.commit()
                    
                except Exception as e:
                    db.rollback()
                    logger.error(f"Failed to process file {file_info.filename}: {e}")
    finally:
        db.close()


@router.post("/campaigns/{id}/batch-evaluate", status_code=status.HTTP_202_ACCEPTED)
async def batch_evaluate_cvs(
    id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Nhận 1 file .zip chứa nhiều CV. Trả về 202 Accepted ngay lập tức.
    Đồng thời ném tác vụ giải nén, chấm điểm vào BackgroundTasks.
    """
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")
        
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if not campaign.rubric_schema:
        raise HTTPException(status_code=400, detail="Campaign has no rubric schema defined.")
        
    zip_bytes = await file.read()
    batch_job_id = str(uuid.uuid4())
    
    # Ném vào background
    background_tasks.add_task(process_batch_cvs, campaign.id, zip_bytes, campaign.rubric_schema)
    
    return {"message": "Batch evaluation started", "batch_job_id": batch_job_id}


@router.get("/campaigns/{id}/leaderboard", response_model=List[CandidateLeaderboardResponse])
def get_campaign_leaderboard(
    id: uuid.UUID,
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Dùng SQLAlchemy query bảng candidates JOIN ai_evaluations để xuất Bảng xếp hạng.
    Hỗ trợ Query Params: status, min_score. Đảm bảo sắp xếp overall_score giảm dần.
    """
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    query = db.query(Candidate).filter(Candidate.campaign_id == id)
    
    # Lọc theo status
    if status:
        query = query.filter(Candidate.status == status)
        
    # Lọc theo min_score
    if min_score is not None:
        query = query.filter(Candidate.overall_score >= min_score)
        
    # JOIN evaluations để load data và sắp xếp điểm giảm dần
    query = query.options(joinedload(Candidate.evaluations)).order_by(Candidate.overall_score.desc())
    
    candidates = query.all()
    return candidates
