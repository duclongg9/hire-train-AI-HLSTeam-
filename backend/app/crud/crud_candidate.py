from sqlalchemy.orm import Session
from uuid import UUID
from app.database.models import Candidate
from app.schemas.candidates import CandidateCreate, CandidateUpdate, CandidateStatusUpdate

def get_candidate(db: Session, candidate_id: UUID):
    return db.query(Candidate).filter(Candidate.id == candidate_id).first()
from typing import Optional

def get_candidates(db: Session, campaign_id: Optional[UUID] = None, skip: int = 0, limit: int = 100):
    query = db.query(Candidate)
    if campaign_id:
        query = query.filter(Candidate.campaign_id == campaign_id)
    return query.order_by(Candidate.overall_score.desc()).offset(skip).limit(limit).all()

def create_candidate(db: Session, candidate: CandidateCreate):
    db_candidate = Candidate(**candidate.model_dump())
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

def update_candidate(db: Session, candidate_id: UUID, candidate_update: CandidateUpdate):
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        return None
        
    update_data = candidate_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_candidate, key, value)
        
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

def update_candidate_status(db: Session, candidate_id: UUID, status_update: CandidateStatusUpdate):
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        return None
        
    db_candidate.status = status_update.status
    db.commit()
    db.refresh(db_candidate)
    return db_candidate
