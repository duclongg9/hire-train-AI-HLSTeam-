from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.database.connection import get_db
from app.schemas.candidates import CandidateCreate, CandidateUpdate, CandidateStatusUpdate, CandidateResponse
from app.crud import crud_candidate
from app.services.aws_s3 import upload_file_to_s3

router = APIRouter()

@router.get("/", response_model=List[CandidateResponse])
def read_candidates(campaign_id: Optional[UUID] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve candidates. Filter by campaign_id if provided.
    Ordered by overall score (descending).
    """
    candidates = crud_candidate.get_candidates(db, campaign_id=campaign_id, skip=skip, limit=limit)
    return candidates

@router.post("/", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    """
    Register a new candidate applying to a campaign.
    """
    return crud_candidate.create_candidate(db, candidate)

@router.post("/upload-cv")
async def upload_candidate_cv(file: UploadFile = File(...)):
    """
    Upload a CV to S3 bucket.
    Returns the s3 key string.
    """
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed")
    
    # In a real environment, read the bytes and upload to S3.
    # For now, we mock the S3 key generation.
    mock_s3_key = f"cvs/{file.filename}"
    return {"filename": file.filename, "cv_s3_key": mock_s3_key}

@router.get("/{candidate_id}", response_model=CandidateResponse)
def read_candidate(candidate_id: UUID, db: Session = Depends(get_db)):
    """
    Get details of a specific candidate.
    """
    candidate = crud_candidate.get_candidate(db, candidate_id=candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.patch("/{candidate_id}/status", response_model=CandidateResponse)
def update_candidate_status(candidate_id: UUID, status_update: CandidateStatusUpdate, db: Session = Depends(get_db)):
    """
    Update candidate's pipeline status.
    """
    candidate = crud_candidate.update_candidate_status(db, candidate_id=candidate_id, status_update=status_update)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
