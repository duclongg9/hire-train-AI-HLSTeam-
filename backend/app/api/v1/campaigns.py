from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.connection import get_db
from app.schemas.campaigns import CampaignCreate, CampaignUpdate, CampaignResponse
from app.crud import crud_campaign

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
