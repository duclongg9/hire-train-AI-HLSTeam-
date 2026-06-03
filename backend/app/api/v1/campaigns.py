from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body
from sqlalchemy.orm import Session
from typing import List, Any, Dict
from uuid import UUID

from app.database.connection import get_db
from app.database.models import Campaign
from app.schemas.campaigns import CampaignCreate, CampaignUpdate, CampaignResponse
from app.crud import crud_campaign
from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx

# TODO: AWS MIGRATION
# Thay import này bằng AWS Bedrock client khi thực hiện chuyển đổi
from app.core.gemini_client import gemini_client

router = APIRouter()

@router.get("/", response_model=List[CampaignResponse])
def read_campaigns(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of campaigns.
    """
    campaigns = crud_campaign.get_campaigns(db, skip=skip, limit=limit)
    return campaigns

@router.post("/", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    """
    Create a new campaign.
    """
    return crud_campaign.create_campaign(db, campaign)

@router.get("/{campaign_id}", response_model=CampaignResponse)
def read_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    """
    Get details of a specific campaign.
    """
    campaign = crud_campaign.get_campaign(db, campaign_id=campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(campaign_id: UUID, campaign_update: CampaignUpdate, db: Session = Depends(get_db)):
    """
    Update a campaign (e.g., status, rubric).
    """
    campaign = crud_campaign.update_campaign(db, campaign_id=campaign_id, campaign_update=campaign_update)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a campaign.
    """
    campaign = crud_campaign.delete_campaign(db, campaign_id=campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted successfully"}

@router.post("/ai-core/jd/extract-rubric")
async def extract_rubric(file: UploadFile = File(...)):
    """
    Nhận UploadFile (giới hạn 5MB), lấy text từ PDF/DOCX, 
    gọi analyze_jd_to_rubric và trả về kết quả JSON.
    """
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
    
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")
        
    if file.filename.lower().endswith(".pdf"):
        text = extract_text_from_pdf(file_bytes)
    else:
        text = extract_text_from_docx(file_bytes)
        
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from file.")
        
    # TODO: AWS MIGRATION
    # Thay thế hàm gọi gemini_client này bằng hàm gọi sang AWS Bedrock
    # Ví dụ: bedrock_client.invoke_model(...)
    rubric = gemini_client.analyze_jd_to_rubric(text)
    
    if isinstance(rubric, dict) and "error" in rubric:
        raise HTTPException(status_code=500, detail=rubric["error"])
        
    return rubric

@router.put("/{campaign_id}/rubric", response_model=CampaignResponse)
def update_campaign_rubric(
    campaign_id: UUID, 
    rubric_schema: Dict[str, Any] = Body(...), 
    db: Session = Depends(get_db)
):
    """
    HR lưu lại rubric_schema (kiểu JSONB) vào database sau khi đã chỉnh sửa % trọng số.
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.rubric_schema = rubric_schema
    db.commit()
    db.refresh(campaign)
    return campaign
