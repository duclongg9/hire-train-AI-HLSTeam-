"""
Database package — export các thành phần chính để import gọn.

Usage:
    from app.database import Base, get_db, engine
    from app.database.models import User, Campaign, Candidate
"""

from app.database.connection import engine, SessionLocal, get_db, check_db_connection
from app.database.models import (
    Base,
    User,
    Campaign,
    Candidate,
    AIEvaluation,
    AssessmentQuestion,
    CandidateTest,
)

__all__ = [
    "engine",
    "SessionLocal",
    "get_db",
    "check_db_connection",
    "Base",
    "User",
    "Campaign",
    "Candidate",
    "AIEvaluation",
    "AssessmentQuestion",
    "CandidateTest",
]
