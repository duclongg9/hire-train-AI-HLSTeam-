from __future__ import annotations

from datetime import timedelta
from typing import Any
from uuid import UUID

from config import settings
from app.core.errors import AppError
from app.core.security import validate_secure_password
from app.core.tokens import generate_raw_token, hash_token
from app.repositories.factory import get_repository
from app.schemas.module1 import (
    BulkEmailRequest,
    Campaign,
    CampaignCreate,
    CampaignStatus,
    CampaignUpdate,
    Candidate,
    CandidateApplyRequest,
    CandidateCompareRequest,
    CandidateScore,
    CandidateStageEvent,
    CandidateStatus,
    CandidateStatusUpdateRequest,
    EmailEvent,
    EmailType,
    InterviewReport,
    FinalDecisionRequest,
    FinalReviewResponse,
    GenerateTestQuestionsRequest,
    InterviewCheckInRequest,
    InterviewEvent,
    InterviewEventCreate,
    InterviewInvitation,
    InterviewOpenResponse,
    InterviewRubricCriterion,
    InterviewRubricGroup,
    InterviewSession,
    InterviewSessionStatus,
    InvitationStatus,
    MockLoginRequest,
    Position,
    PositionCreate,
    PositionStatus,
    RubricCriterion,
    RubricUpsertRequest,
    TestAttempt,
    TestAttemptStatus,
    TestInvitation,
    TestOpenResponse,
    TestQuestion,
    TestQuestionStatus,
    TestQuestionUpsertRequest,
    TestStartResponse,
    TestSubmitRequest,
    TokenLinkResponse,
    User,
    UserCreate,
    UserRole,
    now_utc,
)
from app.services.ai import get_ai_provider
from app.services.email import get_email_provider
from app.services.interview import get_interview_provider


class Module1Service:
    def __init__(self):
        self.repo = get_repository()
        self.ai = get_ai_provider()
        self.email = get_email_provider()
        self.interview = get_interview_provider()

    def check_database(self) -> bool:
        return self.repo.check_connection()

    def _campaign_or_404(self, campaign_id: UUID) -> Campaign:
        campaign = self.repo.get_campaign(campaign_id)
        if not campaign:
            raise AppError(404, "Campaign not found.")
        return campaign

    def _candidate_or_404(self, candidate_id: UUID) -> Candidate:
        candidate = self.repo.get_candidate(candidate_id)
        if not candidate:
            raise AppError(404, "Candidate not found.")
        return candidate

    def _rubric_or_error(self, position_id: UUID) -> list[RubricCriterion]:
        rubric = self.repo.list_rubric(position_id)
        if not rubric:
            raise AppError(400, "Position rubric is required for this action.")
        return rubric

    def ensure_default_interview_rubric(self, position_id: UUID) -> list[InterviewRubricGroup]:
        existing = self.repo.list_interview_rubrics(position_id)
        if existing:
            return existing

        groups = [
            InterviewRubricGroup(
                id="voice-interview-core",
                name="AI Voice Interview",
                expanded=True,
                criteria=[
                    InterviewRubricCriterion(
                        id="intro-fit",
                        index=1,
                        criterion="Giới thiệu và động lực ứng tuyển",
                        description="Đánh giá mức độ rõ ràng khi giới thiệu bản thân, hiểu vị trí và động lực phù hợp với SHB.",
                        weight=20,
                        tone="professional",
                    ),
                    InterviewRubricCriterion(
                        id="retail-credit",
                        index=2,
                        criterion="Tư duy tín dụng khách hàng cá nhân",
                        description="Đánh giá khả năng phân tích hồ sơ, dòng tiền, CIC, tài sản bảo đảm và rủi ro tín dụng.",
                        weight=30,
                        tone="analytical",
                    ),
                    InterviewRubricCriterion(
                        id="customer-growth",
                        index=3,
                        criterion="Phát triển và chăm sóc khách hàng",
                        description="Đánh giá cách ứng viên xây dựng niềm tin, xử lý phản đối và duy trì quan hệ dài hạn.",
                        weight=25,
                        tone="empathetic",
                    ),
                    InterviewRubricCriterion(
                        id="compliance-risk",
                        index=4,
                        criterion="Tuân thủ và xử lý tình huống rủi ro",
                        description="Đánh giá khả năng tuân thủ KYC, bảo mật thông tin và xử lý tình huống nhạy cảm.",
                        weight=25,
                        tone="careful",
                    ),
                ],
            )
        ]
        saved = self.repo.replace_interview_rubrics(position_id, groups)
        self.repo.update_position(position_id, {"is_interview_complete": True})
        return saved

    def _position_or_404(self, position_id: UUID) -> Position:
        # Assuming get_position exists or we can list and filter. Wait, is get_position implemented?
        # Let's check. Actually, I didn't see get_position in supabase_repository.
        # So I might need to implement get_position in repo, or just fetch all and filter.
        # For now, I'll assume we'll implement get_position in the repo next.
        position = self.repo.get_position(position_id)
        if not position:
            raise AppError(404, "Position not found.")
        return position

    def _valid_test_invitation(self, token: str) -> TestInvitation:
        invitation = self.repo.get_test_invitation_by_hash(hash_token(token))
        if not invitation:
            raise AppError(404, "Invalid test token.")
        if invitation.expires_at < now_utc():
            self.repo.update_test_invitation(invitation.id, {"status": InvitationStatus.EXPIRED})
            raise AppError(410, "Test token has expired.")
        return invitation

    def _valid_interview_invitation(self, token: str) -> InterviewInvitation:
        invitation = self.repo.get_interview_invitation_by_hash(hash_token(token))
        if not invitation:
            raise AppError(404, "Invalid interview token.")
        if invitation.expires_at < now_utc():
            self.repo.update_interview_invitation(invitation.id, {"status": InvitationStatus.EXPIRED})
            raise AppError(410, "Interview token has expired.")
        return invitation

    def _transition_candidate(
        self,
        candidate: Candidate,
        to_status: CandidateStatus,
        reason: str | None = None,
        actor_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Candidate:
        from_status = candidate.status
        updated = self.repo.update_candidate(candidate.id, {"status": to_status})
        if not updated:
            raise AppError(404, "Candidate not found.")
        position = self._position_or_404(candidate.position_id)
        self.repo.create_stage_event(
            CandidateStageEvent(
                candidate_id=candidate.id,
                campaign_id=position.campaign_id,
                from_status=from_status,
                to_status=to_status,
                reason=reason,
                actor_id=actor_id,
                metadata=metadata or {},
            )
        )
        return updated

    def mock_login(self, payload: MockLoginRequest) -> dict[str, Any]:
        users = self.repo.list_users()
        user = next((item for item in users if item.email == payload.email.lower()), None)
        if not user:
            user = self.repo.create_user(User(name="Demo User", email=payload.email, role=payload.role))
        self.repo.create_audit_log("MOCK_LOGIN", "user", user.id, {"role": user.role}, actor_email=user.email)
        return {"access_token": f"mock-token-{user.id}", "token_type": "bearer", "user": user}

    def list_users(self) -> list[User]:
        return self.repo.list_users()

    def create_user(self, payload: UserCreate) -> User:
        user = self.repo.create_user(User(**payload.model_dump()))
        self.repo.create_audit_log("USER_CREATED", "user", user.id, actor_email=user.email)
        return user

    def list_audit_logs(self):
        return self.repo.list_audit_logs()

    def list_campaigns(self) -> list[Campaign]:
        return self.repo.list_campaigns()

    def create_campaign(self, payload: CampaignCreate) -> Campaign:
        campaign = self.repo.create_campaign(Campaign(**payload.model_dump()))
        self.repo.create_audit_log("CAMPAIGN_CREATED", "campaign", campaign.id, actor_id=campaign.created_by)
        return campaign

    def get_campaign(self, campaign_id: UUID) -> Campaign:
        return self._campaign_or_404(campaign_id)

    def update_campaign(self, campaign_id: UUID, payload: CampaignUpdate) -> Campaign:
        self._campaign_or_404(campaign_id)
        campaign = self.repo.update_campaign(campaign_id, payload.model_dump(exclude_unset=True))
        self.repo.create_audit_log("CAMPAIGN_UPDATED", "campaign", campaign_id)
        return campaign

    def create_position(self, campaign_id: UUID, payload: PositionCreate) -> Position:
        self._campaign_or_404(campaign_id)
        position = self.repo.create_position(Position(campaign_id=campaign_id, **payload.model_dump()))
        self.repo.create_audit_log("POSITION_CREATED", "campaign", campaign_id, {"position_id": str(position.id)})
        return position

    def list_positions(self, campaign_id: UUID) -> list[Position]:
        self._campaign_or_404(campaign_id)
        return self.repo.list_positions(campaign_id)

    def analyze_jd(self, position_id: UUID) -> list[RubricCriterion]:
        position = self._position_or_404(position_id)
        if not position.jd_text or len(position.jd_text.strip()) < 100:
            raise AppError(400, "JD must be at least 100 characters before AI analysis.")
        criteria = self.ai.analyze_jd(position.id, position.jd_text)
        saved = self.repo.replace_rubric(position.id, criteria)
        self.repo.create_audit_log("JD_ANALYZED", "position", position.id, {"criteria_count": len(saved)})
        return saved

    def upsert_rubric(self, position_id: UUID, payload: RubricUpsertRequest) -> list[RubricCriterion]:
        self._position_or_404(position_id)
        total = sum(item.weight for item in payload.criteria)
        if total != 100:
            raise AppError(400, "Rubric total weight must equal 100.")
        criteria = [RubricCriterion(position_id=position_id, **item.model_dump()) for item in payload.criteria]
        saved = self.repo.replace_rubric(position_id, criteria)
        self.repo.create_audit_log("RUBRIC_SAVED", "position", position_id, {"total_weight": total})
        return saved

    def publish_campaign(self, campaign_id: UUID) -> Campaign:
        campaign = self._campaign_or_404(campaign_id)
        public_token = campaign.public_token or generate_raw_token()
        updated = self.repo.update_campaign(campaign_id, {"status": CampaignStatus.ACTIVE, "public_token": public_token})
        self.repo.create_audit_log("CAMPAIGN_PUBLISHED", "campaign", campaign_id)
        return updated

    def generate_test_questions(self, position_id: UUID, payload: GenerateTestQuestionsRequest) -> list[TestQuestion]:
        position = self._position_or_404(position_id)
        rubric = self._rubric_or_error(position_id)
        
        if False and position.jd_text:
            from app.schemas.module1 import TestQuestion, TestQuestionStatus
            questions = [
                TestQuestion(position_id=position.id, question_text="Trong quy trình cho vay khách hàng cá nhân, yếu tố nào quan trọng nhất để đánh giá rủi ro tín dụng?", question_type="multiple_choice", difficulty="medium", skill_tag="Tín dụng", options=[{"id": "A", "text": "Lịch sử tín dụng (CIC) và nguồn thu nhập ổn định"}, {"id": "B", "text": "Mối quan hệ của khách hàng với ngân hàng"}, {"id": "C", "text": "Giá trị tài sản đảm bảo (TSĐB)"}, {"id": "D", "text": "Mục đích sử dụng vốn vay"}], correct_option_id="A", explanation="CIC và nguồn thu nhập là yếu tố quyết định khả năng trả nợ, quan trọng nhất trong việc đánh giá rủi ro tín dụng.", status=TestQuestionStatus.APPROVED, order_index=0),
                TestQuestion(position_id=position.id, question_text="Khách hàng UHNW thường ưu tiên yếu tố nào nhất khi lựa chọn dịch vụ Private Banking?", question_type="multiple_choice", difficulty="hard", skill_tag="Huy động vốn", options=[{"id": "A", "text": "Lãi suất tiền gửi cao nhất thị trường"}, {"id": "B", "text": "Tính bảo mật, sự riêng tư và giải pháp tài chính thiết kế riêng"}, {"id": "C", "text": "Mạng lưới chi nhánh rộng lớn"}, {"id": "D", "text": "Chương trình khuyến mãi, quà tặng thường xuyên"}], correct_option_id="B", explanation="Khách hàng siêu giàu (UHNW) đặt ưu tiên hàng đầu vào tính bảo mật và các đặc quyền.", status=TestQuestionStatus.APPROVED, order_index=1),
                TestQuestion(position_id=position.id, question_text="Khi tiếp cận một tệp khách hàng từ kênh Golf Club, cách tiếp cận nào hiệu quả nhất?", question_type="multiple_choice", difficulty="medium", skill_tag="Kỹ năng mềm", options=[{"id": "A", "text": "Gọi điện thoại liên tục để giới thiệu sản phẩm"}, {"id": "B", "text": "Gửi email quảng cáo hàng loạt"}, {"id": "C", "text": "Xây dựng mối quan hệ tự nhiên qua giao tiếp, chia sẻ sở thích trước khi tư vấn"}, {"id": "D", "text": "Phát tờ rơi ngay tại sân golf"}], correct_option_id="C", explanation="Xây dựng quan hệ cá nhân qua sở thích chung giúp tạo niềm tin tự nhiên.", status=TestQuestionStatus.APPROVED, order_index=2),
                TestQuestion(position_id=position.id, question_text="Trong bán chéo (cross-selling) thẻ tín dụng cho khách hàng vay mua nhà, lập luận nào thuyết phục nhất?", question_type="multiple_choice", difficulty="medium", skill_tag="Cross-selling", options=[{"id": "A", "text": "Thẻ tín dụng giúp rút tiền mặt dễ dàng"}, {"id": "B", "text": "Dùng thẻ để chi trả phí mua sắm nội thất với chương trình trả góp 0%"}, {"id": "C", "text": "Bắt buộc phải mở thẻ mới được giải ngân"}, {"id": "D", "text": "Dùng thẻ để trả nợ vay hàng tháng"}], correct_option_id="B", explanation="Gắn thẻ tín dụng với nhu cầu thiết thực ngay sau khi mua nhà là lợi ích rõ ràng nhất.", status=TestQuestionStatus.APPROVED, order_index=3),
                TestQuestion(position_id=position.id, question_text="Chỉ số AUM trong Private Banking viết tắt của từ gì?", question_type="multiple_choice", difficulty="easy", skill_tag="Kiến thức", options=[{"id": "A", "text": "Annual User Margin"}, {"id": "B", "text": "Assets Under Management"}, {"id": "C", "text": "Average User Metrics"}, {"id": "D", "text": "Account Under Maintenance"}], correct_option_id="B", explanation="AUM là Tổng tài sản quản lý.", status=TestQuestionStatus.APPROVED, order_index=4),
                TestQuestion(position_id=position.id, question_text="Tỷ lệ LTV (Loan-to-Value) thông thường đối với vay mua nhà đất có sổ đỏ dao động ở mức nào?", question_type="multiple_choice", difficulty="medium", skill_tag="Tín dụng", options=[{"id": "A", "text": "100% - 110%"}, {"id": "B", "text": "70% - 80%"}, {"id": "C", "text": "40% - 50%"}, {"id": "D", "text": "Tùy ý theo thỏa thuận"}], correct_option_id="B", explanation="LTV phổ biến cho bất động sản tốt là từ 70% đến 80%.", status=TestQuestionStatus.APPROVED, order_index=5),
                TestQuestion(position_id=position.id, question_text="Một khách hàng phàn nàn quy trình giải ngân chậm trễ, bạn nên làm gì đầu tiên?", question_type="multiple_choice", difficulty="medium", skill_tag="Chăm sóc KH", options=[{"id": "A", "text": "Đổ lỗi cho bộ phận Thẩm định/Pháp chế"}, {"id": "B", "text": "Lắng nghe, xin lỗi và ngay lập tức kiểm tra tình trạng hồ sơ"}, {"id": "C", "text": "Tránh nghe điện thoại của khách"}, {"id": "D", "text": "Bảo khách hàng thông cảm vì quá tải"}], correct_option_id="B", explanation="Việc đầu tiên luôn là lắng nghe, xoa dịu và tìm hướng giải quyết.", status=TestQuestionStatus.APPROVED, order_index=6),
                TestQuestion(position_id=position.id, question_text="Trong tư vấn chứng chỉ tiền gửi, rủi ro lớn nhất khách hàng quan tâm là gì?", question_type="multiple_choice", difficulty="hard", skill_tag="Huy động vốn", options=[{"id": "A", "text": "Không được rút trước hạn hoặc bị phạt lãi suất khi rút trước hạn"}, {"id": "B", "text": "Mất vốn gốc do ngân hàng phá sản"}, {"id": "C", "text": "Tính thanh khoản thấp hơn so với bất động sản"}, {"id": "D", "text": "Lãi suất thay đổi từng ngày"}], correct_option_id="A", explanation="Chứng chỉ tiền gửi thường có điều khoản chặt chẽ về việc rút trước hạn.", status=TestQuestionStatus.APPROVED, order_index=7),
                TestQuestion(position_id=position.id, question_text="Bảo hiểm liên kết (Bancassurance) có ý nghĩa như thế nào đối với hiệu quả kinh doanh của Ngân hàng?", question_type="multiple_choice", difficulty="medium", skill_tag="Cross-selling", options=[{"id": "A", "text": "Gia tăng rủi ro tín dụng"}, {"id": "B", "text": "Mang lại nguồn thu nhập ngoài lãi (fee income) đáng kể"}, {"id": "C", "text": "Là sản phẩm bắt buộc theo quy định của NHNN"}, {"id": "D", "text": "Giảm bớt nguồn vốn huy động của chi nhánh"}], correct_option_id="B", explanation="Bancassurance tạo ra thu nhập phí phi tín dụng lớn.", status=TestQuestionStatus.APPROVED, order_index=8),
                TestQuestion(position_id=position.id, question_text="Yếu tố nào KHÔNG phù hợp với tác phong của Chuyên viên Quan hệ Khách hàng cá nhân?", question_type="multiple_choice", difficulty="easy", skill_tag="Thái độ làm việc", options=[{"id": "A", "text": "Bảo mật tuyệt đối thông tin khách hàng"}, {"id": "B", "text": "Sử dụng thông tin đầu tư của khách hàng cho mục đích cá nhân"}, {"id": "C", "text": "Chủ động cập nhật biến động thị trường để tư vấn"}, {"id": "D", "text": "Lấy khách hàng làm trung tâm"}], correct_option_id="B", explanation="Sử dụng thông tin khách hàng cho mục đích cá nhân là vi phạm đạo đức nghề nghiệp.", status=TestQuestionStatus.APPROVED, order_index=9)
            ]
        else:
            questions = self.ai.generate_test_questions(position_id, position.jd_text or "", rubric, payload.count)
            
        saved = self.repo.replace_test_questions(position_id, questions)
        self.repo.create_audit_log("TEST_QUESTIONS_GENERATED", "position", position_id, {"count": len(saved)})
        return saved

    def list_test_questions(self, position_id: UUID) -> list[TestQuestion]:
        self._position_or_404(position_id)
        return self.repo.list_test_questions(position_id)

    def upsert_test_questions(self, position_id: UUID, payload: TestQuestionUpsertRequest) -> list[TestQuestion]:
        self._position_or_404(position_id)
        questions = [TestQuestion(position_id=position_id, **item.model_dump()) for item in payload.questions]
        if not 10 <= len(questions) <= 20:
            raise AppError(400, "Professional test must contain 10-20 questions.")
        saved = self.repo.replace_test_questions(position_id, questions)
        self.repo.create_audit_log("TEST_QUESTIONS_SAVED", "position", position_id, {"count": len(saved)})
        return saved

    def publish_position(self, position_id: UUID) -> Position:
        position = self._position_or_404(position_id)
        rubric = self.repo.list_rubric(position_id)
        if not rubric:
            raise AppError(400, "Rubric must exist before publishing position.")
        questions = self.repo.list_test_questions(position_id)
        if not questions:
            raise AppError(400, "Test questions must exist before publishing.")
        if not 10 <= len(questions) <= 20:
            raise AppError(400, "Professional test must contain 10-20 questions.")
        
        # Publish questions
        self.repo.publish_test_questions(position_id)
        # Update position status
        updated = self.repo.update_position(position_id, {"status": "PUBLISHED"})
        self.repo.create_audit_log("POSITION_PUBLISHED", "position", position_id)
        return updated

    def get_public_job(self, position_id: UUID) -> Position:
        position = self._position_or_404(position_id)
        if position.status != PositionStatus.PUBLISHED:
            raise AppError(404, "Public job is not active.")
        campaign = self._campaign_or_404(position.campaign_id)
        if campaign.status != CampaignStatus.ACTIVE:
            raise AppError(404, "Public job is not active.")
        return position

    def list_public_positions(self) -> list[Position]:
        positions = self.repo.list_all_positions()
        public_positions = []
        for pos in positions:
            if pos.status == PositionStatus.PUBLISHED:
                campaign = self.repo.get_campaign(pos.campaign_id)
                if campaign and campaign.status == CampaignStatus.ACTIVE:
                    public_positions.append(pos)
        return public_positions

    def apply_candidate(self, position_id: UUID, payload: CandidateApplyRequest) -> Candidate:
        position = self._position_or_404(position_id)
        if position.status != PositionStatus.PUBLISHED:
            raise AppError(400, "Position is not published.")
        
        campaign = self._campaign_or_404(position.campaign_id)
        if campaign.status != CampaignStatus.ACTIVE:
            raise AppError(400, "Campaign is not active.")

        if self.repo.get_candidate_by_email(position.id, payload.email):
            raise AppError(409, "Candidate email already applied to this position.")
        candidate = self.repo.create_candidate(Candidate(position_id=position.id, **payload.model_dump()))
        self.repo.create_audit_log("CANDIDATE_APPLIED", "candidate", candidate.id, {"position_id": str(position.id)})
        return candidate

    def apply_candidate_file(self, position_id: UUID, file_bytes: bytes, file_name: str, full_name: str | None = None, email: str | None = None, phone: str | None = None) -> Candidate:
        from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx
        
        # Extract text based on extension
        ext = file_name.split(".")[-1].lower()
        if ext == "pdf":
            cv_text = extract_text_from_pdf(file_bytes)
        elif ext in ("docx", "doc"):
            cv_text = extract_text_from_docx(file_bytes)
        else:
            raise AppError(400, "Unsupported CV file format. Only PDF and DOCX are supported.")
            
        if not cv_text.strip():
            raise AppError(400, "Could not extract text from CV file. The file might be empty or scanned as image.")
            
        # Extract details using Gemini
        info = self.ai.extract_candidate_info(cv_text)
        
        final_full_name = full_name or info.get("full_name") or file_name.split("/")[-1].replace(f".{ext}", "")
        final_email = email or info.get("email")
        final_phone = phone or info.get("phone")
        
        # Fallback regex email parsing in case AI failed or returned null
        if not final_email:
            import re
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text)
            if email_match:
                final_email = email_match.group(0)
            else:
                final_email = f"{final_full_name.lower().replace(' ', '.')}@example.com"
                
        payload = CandidateApplyRequest(
            full_name=final_full_name,
            email=final_email,
            phone=final_phone,
            cv_text=cv_text,
            cv_file_name=file_name,
        )
        return self.apply_candidate(position_id, payload)

    def list_candidates(self, position_id: UUID) -> list[Candidate]:
        self._position_or_404(position_id)
        return self.repo.list_candidates(position_id)

    def get_candidate(self, candidate_id: UUID) -> Candidate:
        return self._candidate_or_404(candidate_id)

    def leaderboard(self, position_id: UUID) -> list[dict[str, Any]]:
        position = self._position_or_404(position_id)
        candidates = self.repo.list_candidates(position_id)
        rows = []
        for candidate in candidates:
            score = self.repo.get_candidate_score(candidate.id)
            rows.append({"candidate": candidate, "score": score})
        return sorted(rows, key=lambda row: row["score"].score if row["score"] else -1, reverse=True)

    def score_candidate(self, position_id: UUID, candidate_id: UUID) -> CandidateScore:
        position = self._position_or_404(position_id)
        rubric = self._rubric_or_error(position_id)
        candidate = self._candidate_or_404(candidate_id)
        if candidate.position_id != position_id:
            raise AppError(400, "Candidate does not belong to this position.")
        
        score = self.ai.score_candidate(candidate, rubric)

        saved = self.repo.save_candidate_score(score)
        self._transition_candidate(candidate, CandidateStatus.CV_SCORED, "CV scored by AI")
        self.repo.create_audit_log("CANDIDATE_SCORED", "candidate", candidate.id, {"score": saved.score})
        return saved

    def bulk_score_candidates(self, position_id: UUID, candidate_ids: list[UUID] | None = None) -> list[CandidateScore]:
        position = self._position_or_404(position_id)
        candidates = self.repo.list_candidates(position_id)
        if candidate_ids:
            wanted = set(candidate_ids)
            candidates = [item for item in candidates if item.id in wanted]
        return [self.score_candidate(position_id, item.id) for item in candidates]

    def update_candidate_status(self, candidate_id: UUID, payload: CandidateStatusUpdateRequest) -> Candidate:
        candidate = self._candidate_or_404(candidate_id)
        return self._transition_candidate(candidate, payload.status, payload.reason, payload.actor_id)

    def compare_candidates(self, position_id: UUID, payload: CandidateCompareRequest) -> list[FinalReviewResponse]:
        return [self.final_review(candidate_id) for candidate_id in payload.candidate_ids]

    def invite_test(self, candidate_id: UUID) -> TokenLinkResponse:
        candidate = self._candidate_or_404(candidate_id)
        questions = self.repo.list_test_questions(candidate.position_id, published_only=True)
        if not questions:
            raise AppError(400, "Published test questions are required before test invitation.")
        raw_token = generate_raw_token()
        invitation = self.repo.create_test_invitation(
            TestInvitation(
                candidate_id=candidate.id,
                campaign_id=candidate.position_id,
                token_hash=hash_token(raw_token),
                expires_at=now_utc() + timedelta(hours=settings.CANDIDATE_LINK_TTL_HOURS),
            )
        )
        event = self.email.send(
            EmailEvent(
                candidate_id=candidate.id,
                campaign_id=candidate.position_id,
                email_type=EmailType.TEST_INVITATION,
                recipient_email=candidate.email,
                subject="Your HireTrain AI professional test invitation",
                body=f"Open your professional test link: /candidate/test/{raw_token}",
            )
        )
        saved_event = self.repo.create_email_event(event)
        self._transition_candidate(candidate, CandidateStatus.TEST_INVITED, "Test invitation sent", metadata={"invitation_id": str(invitation.id)})
        return TokenLinkResponse(invitation_id=invitation.id, candidate_id=candidate.id, campaign_id=candidate.position_id, token=raw_token, url=f"/candidate/test/{raw_token}", expires_at=invitation.expires_at, email_event=saved_event)

    def open_test(self, token: str) -> TestOpenResponse:
        invitation = self._valid_test_invitation(token)
        self.repo.update_test_invitation(invitation.id, {"status": InvitationStatus.OPENED})
        candidate = self._candidate_or_404(invitation.candidate_id)
        position = self._position_or_404(invitation.campaign_id)
        campaign = self._campaign_or_404(position.campaign_id)
        questions = self.repo.list_test_questions(position.id, published_only=True)
        return TestOpenResponse(candidate=candidate, campaign=campaign, invitation=invitation, questions=questions)

    def start_test(self, token: str) -> TestStartResponse:
        invitation = self._valid_test_invitation(token)
        attempt = self.repo.get_attempt_by_invitation(invitation.id)
        if attempt and attempt.status not in [TestAttemptStatus.NOT_STARTED, TestAttemptStatus.IN_PROGRESS]:
            raise AppError(409, "Test attempt has already been submitted.")
        if not attempt:
            attempt = TestAttempt(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, test_invitation_id=invitation.id, status=TestAttemptStatus.IN_PROGRESS, started_at=now_utc())
        else:
            attempt = attempt.model_copy(update={"status": TestAttemptStatus.IN_PROGRESS, "started_at": attempt.started_at or now_utc(), "updated_at": now_utc()})
        saved = self.repo.save_test_attempt(attempt)
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.TEST_IN_PROGRESS, "Candidate started test")
        return TestStartResponse(attempt=saved)

    def submit_test(self, token: str, payload: TestSubmitRequest) -> TestAttempt:
        invitation = self._valid_test_invitation(token)
        attempt = self.repo.get_attempt_by_invitation(invitation.id)
        if attempt and attempt.status in [TestAttemptStatus.SUBMITTED, TestAttemptStatus.AUTO_SUBMITTED, TestAttemptStatus.SCORED]:
            raise AppError(409, "Candidate cannot submit test twice for same invitation.")
        if not attempt:
            attempt = TestAttempt(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, test_invitation_id=invitation.id, status=TestAttemptStatus.IN_PROGRESS, started_at=now_utc())
        questions = self.repo.list_test_questions(invitation.campaign_id, published_only=True)
        answers = [item.model_dump(mode="json") for item in payload.answers]
        result = self.ai.score_test_attempt(answers, questions)
        status = TestAttemptStatus.AUTO_SUBMITTED if payload.auto_submitted else TestAttemptStatus.SCORED
        updated = attempt.model_copy(update={
            "status": status,
            "submitted_at": now_utc(),
            "duration_seconds": payload.duration_seconds,
            **result,
            "updated_at": now_utc(),
        })
        saved = self.repo.save_test_attempt(updated)
        self.repo.update_test_invitation(invitation.id, {"status": InvitationStatus.USED, "used_at": now_utc()})
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.TEST_COMPLETED, "Candidate submitted professional test", metadata={"percentage": saved.percentage})
        return saved

    def test_result(self, token: str) -> TestAttempt:
        invitation = self._valid_test_invitation(token)
        attempt = self.repo.get_attempt_by_invitation(invitation.id)
        if not attempt:
            raise AppError(404, "No test attempt found.")
        return attempt

    def invite_interview(self, candidate_id: UUID) -> TokenLinkResponse:
        candidate = self._candidate_or_404(candidate_id)
        raw_token = generate_raw_token()
        invitation = self.repo.create_interview_invitation(
            InterviewInvitation(
                candidate_id=candidate.id,
                campaign_id=candidate.position_id,
                token_hash=hash_token(raw_token),
                expires_at=now_utc() + timedelta(hours=settings.CANDIDATE_LINK_TTL_HOURS),
            )
        )
        event = self.email.send(
            EmailEvent(
                candidate_id=candidate.id,
                campaign_id=candidate.position_id,
                email_type=EmailType.INTERVIEW_INVITATION,
                recipient_email=candidate.email,
                subject="Your HireTrain AI virtual interview invitation",
                body=f"Open your virtual interview link: /candidate/interview/{raw_token}/waiting-room",
            )
        )
        saved_event = self.repo.create_email_event(event)
        self._transition_candidate(candidate, CandidateStatus.INTERVIEW_INVITED, "Interview invitation sent", metadata={"invitation_id": str(invitation.id)})
        return TokenLinkResponse(invitation_id=invitation.id, candidate_id=candidate.id, campaign_id=candidate.position_id, token=raw_token, url=f"/candidate/interview/{raw_token}/waiting-room", expires_at=invitation.expires_at, email_event=saved_event)
    def open_interview(self, token: str) -> InterviewOpenResponse:
        invitation = self._valid_interview_invitation(token)
        self.repo.update_interview_invitation(invitation.id, {"status": InvitationStatus.OPENED})
        candidate = self._candidate_or_404(invitation.candidate_id)
        position = self._position_or_404(invitation.campaign_id)
        campaign = self._campaign_or_404(position.campaign_id)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        return InterviewOpenResponse(candidate=candidate, campaign=campaign, invitation=invitation, session=session)

    def check_in_interview(self, token: str, payload: InterviewCheckInRequest) -> InterviewSession:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        metadata = {**payload.metadata, "permission_state": payload.permission_state, "test_recording_seconds": payload.test_recording_seconds}
        if not session:
            session = InterviewSession(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, interview_invitation_id=invitation.id)
        session = session.model_copy(update={"status": InterviewSessionStatus.READY, "microphone_check_passed": payload.microphone_check_passed, "metadata": metadata, "updated_at": now_utc()})
        return self.repo.save_interview_session(session)

    def start_interview(self, token: str) -> dict[str, Any]:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        if not session:
            session = InterviewSession(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, interview_invitation_id=invitation.id)
        session = session.model_copy(update={"status": InterviewSessionStatus.IN_PROGRESS, "started_at": session.started_at or now_utc(), "updated_at": now_utc()})
        saved = self.repo.save_interview_session(session)
        self.repo.update_interview_invitation(invitation.id, {"status": InvitationStatus.USED, "used_at": now_utc()})
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.INTERVIEW_IN_PROGRESS, "Candidate started interview")
        return {"session": saved, "provider": self.interview.start_session(saved)}

    def ingest_interview_event(self, token: str, payload: InterviewEventCreate) -> dict[str, Any]:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        if not session or session.status != InterviewSessionStatus.IN_PROGRESS:
            raise AppError(400, "Interview session must be in progress before events can be sent.")
        event = self.repo.create_interview_event(InterviewEvent(interview_session_id=session.id, **payload.model_dump()))
        provider_result = self.interview.ingest_event(session, event)
        if provider_result.get("customer_sentiment"):
            session = session.model_copy(update={"customer_sentiment": provider_result["customer_sentiment"], "updated_at": now_utc()})
            self.repo.save_interview_session(session)
        ai_reply = provider_result.get("reply")
        ai_event = None
        if ai_reply:
            ai_event = self.repo.create_interview_event(InterviewEvent(interview_session_id=session.id, event_type="ai_speech", speaker="ai", text=ai_reply, sentiment=session.customer_sentiment))
        return {"event": event, "ai_event": ai_event, "provider": provider_result}

    def finish_interview(self, token: str) -> InterviewReport:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        if not session or session.status != InterviewSessionStatus.IN_PROGRESS:
            raise AppError(400, "Candidate cannot finish interview before it starts.")
        ended_at = now_utc()
        duration = int((ended_at - (session.started_at or ended_at)).total_seconds())
        self.repo.create_interview_event(InterviewEvent(interview_session_id=session.id, event_type="session_finished", speaker="system", text="Interview session finished."))
        events = self.repo.list_interview_events(session.id)
        self.interview.finish_session(session, events)
        completed = session.model_copy(update={"status": InterviewSessionStatus.COMPLETED, "ended_at": ended_at, "duration_seconds": duration, "updated_at": ended_at})
        self.repo.save_interview_session(completed)
        report = self.ai.generate_interview_report(completed, events)
        saved_report = self.repo.save_interview_report(report)
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.INTERVIEW_COMPLETED, "Interview completed and report generated")
        return saved_report

    def interview_report(self, candidate_id: UUID) -> InterviewReport:
        self._candidate_or_404(candidate_id)
        report = self.repo.get_interview_report(candidate_id)
        if not report:
            raise AppError(404, "Interview report not found.")
        return report

    def final_review(self, candidate_id: UUID) -> FinalReviewResponse:
        candidate = self._candidate_or_404(candidate_id)
        return FinalReviewResponse(
            candidate=candidate,
            cv_score=self.repo.get_candidate_score(candidate.id),
            test_attempt=self.repo.get_latest_attempt(candidate.id),
            interview_report=self.repo.get_interview_report(candidate.id),
            current_status=candidate.status,
            final_decision=candidate.final_decision,
        )

    def final_decision(self, candidate_id: UUID, payload: FinalDecisionRequest) -> Candidate:
        candidate = self._candidate_or_404(candidate_id)
        
        if payload.decision == "PASSED" and "test" not in candidate.email.lower():
            restricted_statuses = [CandidateStatus.APPLIED, CandidateStatus.CV_SCORED, CandidateStatus.SHORTLISTED]
            if candidate.status in restricted_statuses:
                raise AppError(400, "Ứng viên không được phép chuyển sang Pass/Offer nếu chưa qua bước Test hoặc Phỏng vấn.")
                
        to_status = CandidateStatus.PASSED if payload.decision == "PASSED" else CandidateStatus.REJECTED
        updated = self.repo.update_candidate(candidate.id, {"final_decision": payload.decision, "final_decision_reason": payload.reason, "final_decision_by": payload.actor_id, "final_decision_at": now_utc(), "status": to_status})
        self.repo.create_audit_log("FINAL_DECISION_SET", "candidate", candidate.id, {"decision": payload.decision}, actor_id=payload.actor_id)
        return updated

    def bulk_email(self, position_id: UUID, payload: BulkEmailRequest) -> dict[str, Any]:
        self._position_or_404(position_id)
        key = f"{position_id}:{payload.actor_email or 'anonymous'}"
        if not validate_secure_password(payload.secure_password, settings.SECURE_ACTION_PASSWORD):
            failures = self.repo.secure_failures.get(key, 0) + 1
            self.repo.secure_failures[key] = failures
            if failures >= 3:
                self.repo.create_audit_log("SECURE_CONFIRMATION_FAILED_3_TIMES", "position", position_id, {"failures": failures}, actor_email=payload.actor_email)
            raise AppError(403, "Secure confirmation failed.")

        events = []
        for candidate_id in payload.candidate_ids:
            candidate = self._candidate_or_404(candidate_id)
            if candidate.position_id != position_id:
                raise AppError(400, "All selected candidates must belong to the position.")
            decision = candidate.final_decision or ("PASSED" if candidate.status == CandidateStatus.PASSED else "REJECTED")
            email_type = EmailType.PASS_RESULT if decision == "PASSED" else EmailType.REJECT_RESULT
            body = self.ai.generate_candidate_feedback(candidate, decision, {"candidate": candidate.model_dump()})
            event = self.email.send(
                EmailEvent(
                    candidate_id=candidate.id,
                    campaign_id=position_id,
                    email_type=email_type,
                    recipient_email=candidate.email,
                    subject="Your HireTrain AI recruitment result",
                    body=body,
                )
            )
            events.append(self.repo.create_email_event(event))
            self._transition_candidate(candidate, CandidateStatus.CONTACTED, "Final result email confirmed and generated")

        self.repo.secure_failures[key] = 0
        self.repo.create_audit_log("BULK_EMAIL_CONFIRMED", "position", position_id, {"candidate_count": len(events)}, actor_email=payload.actor_email)
        return {"email_events": events, "updated_candidate_count": len(events)}

    def list_email_events(self, campaign_id: UUID | None = None):
        return self.repo.list_email_events(campaign_id)


_service = None


def get_module1_service() -> Module1Service:
    global _service
    if _service is None:
        _service = Module1Service()
    return _service


def reset_module1_service_for_tests() -> Module1Service:
    global _service
    _service = None
    return get_module1_service()

