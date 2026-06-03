import uuid
from sqlalchemy import (
    Column,
    String,
    Numeric,
    ForeignKey,
    DateTime,
    Boolean,
    Integer,
    Index,
    UniqueConstraint,
    TypeDecorator,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB as PG_JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func


# ---------------------------------------------------------------------------
# Cross-database type helpers (PostgreSQL native <-> SQLite fallback)
# ---------------------------------------------------------------------------
class UUID(TypeDecorator):
    """UUID column: native on PostgreSQL, CHAR(32) on SQLite."""
    impl = String(32)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        return str(value).replace("-", "")

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        return value


class JSONB(TypeDecorator):
    """JSONB column: native on PostgreSQL, plain JSON on SQLite."""
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_JSONB())
        return dialect.type_descriptor(JSON())


Base = declarative_base()


class User(Base):
    """
    Bảng người dùng nội bộ (HR Manager, Admin).
    """
    __tablename__ = "users"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="HR_MANAGER")  # ADMIN | HR_MANAGER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    campaigns = relationship("Campaign", back_populates="creator")


class Campaign(Base):
    """
    Chiến dịch tuyển dụng. Mỗi Campaign chứa JD, rubric đánh giá (JSONB),
    danh sách ứng viên và bộ câu hỏi trắc nghiệm.
    """
    __tablename__ = "campaigns"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    created_by = Column(
        UUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="DRAFT")  # DRAFT | ACTIVE | CLOSED
    # Rubric JSON: {"criteria": [{"name": "Python", "weight": 40}, ...]}
    rubric_schema = Column(JSONB, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    creator = relationship("User", back_populates="campaigns")
    candidates = relationship(
        "Candidate",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    questions = relationship(
        "AssessmentQuestion",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        # B-Tree index cho filter theo trạng thái trên Kanban Dashboard
        Index("idx_campaigns_status", "status"),
    )


class Candidate(Base):
    """
    Ứng viên nộp đơn vào một Campaign. Theo dõi trạng thái qua pipeline
    tuyển dụng và lưu điểm tổng hợp từ AI.
    """
    __tablename__ = "candidates"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )

    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    # S3 object key để download/presign CV: "cvs/{campaign_id}/{uuid}.pdf"
    cv_s3_key = Column(String(500), nullable=False)

    # Pipeline status: APPLIED → SCREENED → INTERVIEW_INVITED → INTERVIEWED → PASSED | REJECTED
    status = Column(String(50), default="APPLIED")
    overall_score = Column(Numeric(5, 2), default=0.00)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    campaign = relationship("Campaign", back_populates="candidates")
    evaluations = relationship(
        "AIEvaluation",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )
    tests = relationship(
        "CandidateTest",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        # Đảm bảo một email không nộp đơn trùng lặp cho cùng một Campaign
        UniqueConstraint("campaign_id", "email", name="uix_campaign_email"),
        # Index cho JOIN campaign → candidates (dùng nhiều trên Dashboard)
        Index("idx_candidates_campaign_id", "campaign_id"),
        # Index cho Kanban filter theo cột status
        Index("idx_candidates_status", "status"),
        # B-Tree DESC index cho bảng xếp hạng (Leaderboard) ORDER BY overall_score DESC
        Index("idx_candidates_score_desc", overall_score.desc()),
    )


class AIEvaluation(Base):
    """
    Kết quả đánh giá AI cho từng ứng viên.
    Mỗi lần chạy AI (CV_SCREEN hoặc ROLE_PLAY) tạo ra một bản ghi riêng.
    Lưu dữ liệu radar chart dưới dạng JSONB để frontend render trực tiếp.
    """
    __tablename__ = "ai_evaluations"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(
        UUID(),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
    )

    eval_type = Column(String(50), nullable=False)  # CV_SCREEN | ROLE_PLAY

    # ["Kinh nghiệm Python vững", "Đã từng deploy AWS"]
    strengths = Column(JSONB, default=list)
    # ["Chưa có kinh nghiệm microservices"]
    weaknesses = Column(JSONB, default=list)
    # {"technical": 85, "communication": 70, "problem_solving": 90, ...}
    radar_dimensions = Column(JSONB, nullable=True)

    ai_reasoning = Column(String, nullable=True)
    risk_flag = Column(String(20), default="SAFE")  # SAFE | GAP | HIGH_RISK

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    candidate = relationship("Candidate", back_populates="evaluations")

    __table_args__ = (
        Index("idx_evaluations_candidate_id", "candidate_id"),
    )


class AssessmentQuestion(Base):
    """
    Câu hỏi trắc nghiệm được AI sinh ra cho từng Campaign.
    options là JSONB: ["A. ...", "B. ...", "C. ...", "D. ..."]
    """
    __tablename__ = "assessment_questions"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(
        UUID(),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
    )

    question_text = Column(String, nullable=False)
    # ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"]
    options = Column(JSONB, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    campaign = relationship("Campaign", back_populates="questions")

    __table_args__ = (
        Index("idx_questions_campaign", "campaign_id"),
    )


class CandidateTest(Base):
    """
    Kết quả bài kiểm tra trắc nghiệm của ứng viên.
    answers_log lưu chi tiết từng câu trả lời để audit:
    [{"question_id": "...", "selected": "A", "is_correct": true}, ...]
    """
    __tablename__ = "candidate_tests"

    id = Column(UUID(), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(
        UUID(),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
    )

    score = Column(Numeric(5, 2), default=0.00)
    time_taken_seconds = Column(Integer, nullable=False)
    # Chi tiết từng câu trả lời để phân tích sau
    answers_log = Column(JSONB, nullable=True)
    is_passed = Column(Boolean, default=False)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    candidate = relationship("Candidate", back_populates="tests")

    __table_args__ = (
        Index("idx_tests_candidate", "candidate_id"),
    )
