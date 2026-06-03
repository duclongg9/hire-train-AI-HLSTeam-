from __future__ import annotations

from enum import Enum
from typing import Any, TypeVar
from uuid import UUID

import psycopg2
from psycopg2.extras import Json, RealDictCursor, register_uuid

from config import settings
from app.schemas.module1 import (
    AuditLog,
    Campaign,
    Candidate,
    CandidateScore,
    CandidateStageEvent,
    EmailEvent,
    InterviewEvent,
    InterviewInvitation,
    InterviewReport,
    InterviewSession,
    RubricCriterion,
    TestAttempt,
    TestInvitation,
    TestQuestion,
    User,
    now_utc,
)

register_uuid()

ModelT = TypeVar("ModelT")


class SupabaseRepository:
    def __init__(self) -> None:
        self.database_url = settings.DATABASE_URL
        self.secure_failures: dict[str, int] = {}

    def _connect(self):
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor, connect_timeout=10)

    def _param(self, value: Any) -> Any:
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, Enum):
            return value.value
        if isinstance(value, (dict, list)):
            return Json(value)
        return value

    def _row_to_model(self, model_cls: type[ModelT], row: dict[str, Any] | None) -> ModelT | None:
        if row is None:
            return None
        return model_cls(**dict(row))

    def _fetch_one(self, sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(self._param(value) for value in params))
                return cur.fetchone()

    def _fetch_all(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(self._param(value) for value in params))
                return list(cur.fetchall())

    def _execute_returning(self, sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(self._param(value) for value in params))
                row = cur.fetchone()
                conn.commit()
                return row

    def _execute(self, sql: str, params: tuple[Any, ...] = ()) -> None:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, tuple(self._param(value) for value in params))
                conn.commit()

    def _insert_model(self, table: str, model: Any, model_cls: type[ModelT]) -> ModelT:
        data = model.model_dump(mode="python")
        columns = list(data.keys())
        placeholders = ", ".join(["%s"] * len(columns))
        column_sql = ", ".join(columns)
        sql = f"insert into public.{table} ({column_sql}) values ({placeholders}) returning *"
        row = self._execute_returning(sql, tuple(data[column] for column in columns))
        return self._row_to_model(model_cls, row)

    def _update_by_id(self, table: str, item_id: UUID, data: dict[str, Any], model_cls: type[ModelT]) -> ModelT | None:
        clean = {key: value for key, value in data.items() if value is not None}
        if "updated_at" not in clean and table not in {"audit_logs", "candidate_stage_events", "test_invitations", "interview_invitations", "email_events", "interview_events"}:
            clean["updated_at"] = now_utc()
        if not clean:
            return self._row_to_model(model_cls, self._fetch_one(f"select * from public.{table} where id = %s", (item_id,)))
        set_sql = ", ".join([f"{column} = %s" for column in clean.keys()])
        sql = f"update public.{table} set {set_sql} where id = %s returning *"
        row = self._execute_returning(sql, tuple(clean.values()) + (item_id,))
        return self._row_to_model(model_cls, row)

    def check_connection(self) -> bool:
        try:
            row = self._fetch_one("select 1 as ok")
            return bool(row and row["ok"] == 1)
        except Exception as exc:
            print(f"[DB] Supabase connection failed: {exc}")
            return False

    def list_users(self) -> list[User]:
        rows = self._fetch_all("select * from public.users order by created_at desc")
        return [self._row_to_model(User, row) for row in rows]

    def create_user(self, user: User) -> User:
        row = self._execute_returning(
            """
            insert into public.users (id, name, email, role, is_active, created_at, updated_at)
            values (%s, %s, %s, %s, %s, %s, %s)
            on conflict (email) do update set
              name = excluded.name,
              role = excluded.role,
              is_active = excluded.is_active,
              updated_at = now()
            returning *
            """,
            (user.id, user.name, user.email, user.role, user.is_active, user.created_at, user.updated_at),
        )
        return self._row_to_model(User, row)

    def list_audit_logs(self) -> list[AuditLog]:
        rows = self._fetch_all("select * from public.audit_logs order by created_at desc limit 500")
        return [self._row_to_model(AuditLog, row) for row in rows]

    def create_campaign(self, campaign: Campaign) -> Campaign:
        return self._insert_model("campaigns", campaign, Campaign)

    def list_campaigns(self) -> list[Campaign]:
        rows = self._fetch_all("select * from public.campaigns order by created_at desc")
        return [self._row_to_model(Campaign, row) for row in rows]

    def get_campaign(self, campaign_id: UUID) -> Campaign | None:
        return self._row_to_model(Campaign, self._fetch_one("select * from public.campaigns where id = %s", (campaign_id,)))

    def update_campaign(self, campaign_id: UUID, data: dict[str, Any]) -> Campaign | None:
        return self._update_by_id("campaigns", campaign_id, data, Campaign)

    def list_rubric(self, campaign_id: UUID) -> list[RubricCriterion]:
        rows = self._fetch_all("select * from public.rubric_criteria where campaign_id = %s order by created_at", (campaign_id,))
        return [self._row_to_model(RubricCriterion, row) for row in rows]

    def replace_rubric(self, campaign_id: UUID, criteria: list[RubricCriterion]) -> list[RubricCriterion]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("delete from public.rubric_criteria where campaign_id = %s", (str(campaign_id),))
                rows = []
                for item in criteria:
                    cur.execute(
                        """
                        insert into public.rubric_criteria
                          (id, campaign_id, category, name, weight, description, created_at, updated_at)
                        values (%s, %s, %s, %s, %s, %s, %s, %s)
                        returning *
                        """,
                        tuple(self._param(value) for value in (item.id, item.campaign_id, item.category, item.name, item.weight, item.description, item.created_at, item.updated_at)),
                    )
                    rows.append(cur.fetchone())
                conn.commit()
        return [self._row_to_model(RubricCriterion, row) for row in rows]

    def list_test_questions(self, campaign_id: UUID, published_only: bool = False) -> list[TestQuestion]:
        sql = "select * from public.test_questions where campaign_id = %s"
        params: tuple[Any, ...] = (campaign_id,)
        if published_only:
            sql += " and status = %s"
            params = (campaign_id, "PUBLISHED")
        sql += " order by order_index asc, created_at asc"
        rows = self._fetch_all(sql, params)
        return [self._row_to_model(TestQuestion, row) for row in rows]

    def replace_test_questions(self, campaign_id: UUID, questions: list[TestQuestion]) -> list[TestQuestion]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute("delete from public.test_questions where campaign_id = %s", (str(campaign_id),))
                rows = []
                for item in questions:
                    cur.execute(
                        """
                        insert into public.test_questions
                          (id, campaign_id, question_text, question_type, difficulty, skill_tag, options, correct_option_id, explanation, status, order_index, created_at, updated_at)
                        values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        returning *
                        """,
                        tuple(self._param(value) for value in (item.id, item.campaign_id, item.question_text, item.question_type, item.difficulty, item.skill_tag, item.options, item.correct_option_id, item.explanation, item.status, item.order_index, item.created_at, item.updated_at)),
                    )
                    rows.append(cur.fetchone())
                conn.commit()
        return [self._row_to_model(TestQuestion, row) for row in rows]

    def publish_test_questions(self, campaign_id: UUID) -> list[TestQuestion]:
        rows = self._fetch_all(
            """
            update public.test_questions
            set status = 'PUBLISHED', updated_at = now()
            where campaign_id = %s
            returning *
            """,
            (campaign_id,),
        )
        return [self._row_to_model(TestQuestion, row) for row in rows]

    def create_candidate(self, candidate: Candidate) -> Candidate:
        return self._insert_model("candidates", candidate, Candidate)

    def list_candidates(self, campaign_id: UUID | None = None) -> list[Candidate]:
        if campaign_id:
            rows = self._fetch_all("select * from public.candidates where campaign_id = %s order by created_at desc", (campaign_id,))
        else:
            rows = self._fetch_all("select * from public.candidates order by created_at desc")
        return [self._row_to_model(Candidate, row) for row in rows]

    def get_candidate(self, candidate_id: UUID) -> Candidate | None:
        return self._row_to_model(Candidate, self._fetch_one("select * from public.candidates where id = %s", (candidate_id,)))

    def get_candidate_by_email(self, campaign_id: UUID, email: str) -> Candidate | None:
        row = self._fetch_one(
            "select * from public.candidates where campaign_id = %s and lower(email) = lower(%s)",
            (campaign_id, email),
        )
        return self._row_to_model(Candidate, row)

    def update_candidate(self, candidate_id: UUID, data: dict[str, Any]) -> Candidate | None:
        return self._update_by_id("candidates", candidate_id, data, Candidate)

    def save_candidate_score(self, score: CandidateScore) -> CandidateScore:
        self._execute("delete from public.candidate_scores where candidate_id = %s", (score.candidate_id,))
        return self._insert_model("candidate_scores", score, CandidateScore)

    def get_candidate_score(self, candidate_id: UUID) -> CandidateScore | None:
        row = self._fetch_one("select * from public.candidate_scores where candidate_id = %s order by created_at desc limit 1", (candidate_id,))
        return self._row_to_model(CandidateScore, row)

    def list_candidate_scores(self, campaign_id: UUID) -> list[CandidateScore]:
        rows = self._fetch_all("select * from public.candidate_scores where campaign_id = %s order by score desc", (campaign_id,))
        return [self._row_to_model(CandidateScore, row) for row in rows]

    def create_stage_event(self, event: CandidateStageEvent) -> CandidateStageEvent:
        return self._insert_model("candidate_stage_events", event, CandidateStageEvent)

    def create_test_invitation(self, invitation: TestInvitation) -> TestInvitation:
        return self._insert_model("test_invitations", invitation, TestInvitation)

    def get_test_invitation_by_hash(self, token_hash: str) -> TestInvitation | None:
        return self._row_to_model(TestInvitation, self._fetch_one("select * from public.test_invitations where token_hash = %s", (token_hash,)))

    def update_test_invitation(self, invitation_id: UUID, data: dict[str, Any]) -> TestInvitation | None:
        return self._update_by_id("test_invitations", invitation_id, data, TestInvitation)

    def get_attempt_by_invitation(self, invitation_id: UUID) -> TestAttempt | None:
        return self._row_to_model(TestAttempt, self._fetch_one("select * from public.test_attempts where test_invitation_id = %s", (invitation_id,)))

    def get_latest_attempt(self, candidate_id: UUID) -> TestAttempt | None:
        row = self._fetch_one("select * from public.test_attempts where candidate_id = %s order by created_at desc limit 1", (candidate_id,))
        return self._row_to_model(TestAttempt, row)

    def save_test_attempt(self, attempt: TestAttempt) -> TestAttempt:
        existing = self._fetch_one("select id from public.test_attempts where id = %s", (attempt.id,))
        data = attempt.model_dump(mode="python")
        if existing:
            return self._update_by_id("test_attempts", attempt.id, data, TestAttempt)
        return self._insert_model("test_attempts", attempt, TestAttempt)

    def create_interview_invitation(self, invitation: InterviewInvitation) -> InterviewInvitation:
        return self._insert_model("interview_invitations", invitation, InterviewInvitation)

    def get_interview_invitation_by_hash(self, token_hash: str) -> InterviewInvitation | None:
        return self._row_to_model(InterviewInvitation, self._fetch_one("select * from public.interview_invitations where token_hash = %s", (token_hash,)))

    def update_interview_invitation(self, invitation_id: UUID, data: dict[str, Any]) -> InterviewInvitation | None:
        return self._update_by_id("interview_invitations", invitation_id, data, InterviewInvitation)

    def get_interview_session_by_invitation(self, invitation_id: UUID) -> InterviewSession | None:
        row = self._fetch_one("select * from public.interview_sessions where interview_invitation_id = %s", (invitation_id,))
        return self._row_to_model(InterviewSession, row)

    def get_latest_interview_session(self, candidate_id: UUID) -> InterviewSession | None:
        row = self._fetch_one("select * from public.interview_sessions where candidate_id = %s order by created_at desc limit 1", (candidate_id,))
        return self._row_to_model(InterviewSession, row)

    def save_interview_session(self, session: InterviewSession) -> InterviewSession:
        existing = self._fetch_one("select id from public.interview_sessions where id = %s", (session.id,))
        data = session.model_dump(mode="python")
        if existing:
            return self._update_by_id("interview_sessions", session.id, data, InterviewSession)
        return self._insert_model("interview_sessions", session, InterviewSession)

    def create_interview_event(self, event: InterviewEvent) -> InterviewEvent:
        return self._insert_model("interview_events", event, InterviewEvent)

    def list_interview_events(self, session_id: UUID) -> list[InterviewEvent]:
        rows = self._fetch_all("select * from public.interview_events where interview_session_id = %s order by created_at asc", (session_id,))
        return [self._row_to_model(InterviewEvent, row) for row in rows]

    def save_interview_report(self, report: InterviewReport) -> InterviewReport:
        self._execute("delete from public.interview_reports where interview_session_id = %s", (report.interview_session_id,))
        return self._insert_model("interview_reports", report, InterviewReport)

    def get_interview_report(self, candidate_id: UUID) -> InterviewReport | None:
        row = self._fetch_one("select * from public.interview_reports where candidate_id = %s order by created_at desc limit 1", (candidate_id,))
        return self._row_to_model(InterviewReport, row)

    def create_email_event(self, event: EmailEvent) -> EmailEvent:
        return self._insert_model("email_events", event, EmailEvent)

    def list_email_events(self, campaign_id: UUID | None = None) -> list[EmailEvent]:
        if campaign_id:
            rows = self._fetch_all("select * from public.email_events where campaign_id = %s order by created_at desc", (campaign_id,))
        else:
            rows = self._fetch_all("select * from public.email_events order by created_at desc limit 500")
        return [self._row_to_model(EmailEvent, row) for row in rows]

    def create_audit_log(
        self,
        action: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
        actor_id: UUID | None = None,
        actor_email: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata or {},
        )
        return self._insert_model("audit_logs", log, AuditLog)
