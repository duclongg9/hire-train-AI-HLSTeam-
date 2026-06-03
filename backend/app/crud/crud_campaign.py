from sqlalchemy.orm import Session
from uuid import UUID
from app.database.models import Campaign
from app.schemas.campaigns import CampaignCreate, CampaignUpdate

def get_campaign(db: Session, campaign_id: UUID):
    return db.query(Campaign).filter(Campaign.id == campaign_id).first()

def get_campaigns(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Campaign).offset(skip).limit(limit).all()

def create_campaign(db: Session, campaign: CampaignCreate):
    db_campaign = Campaign(**campaign.model_dump())
    db.add(db_campaign)
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def update_campaign(db: Session, campaign_id: UUID, campaign_update: CampaignUpdate):
    db_campaign = get_campaign(db, campaign_id)
    if not db_campaign:
        return None
    
    update_data = campaign_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_campaign, key, value)
        
    db.commit()
    db.refresh(db_campaign)
    return db_campaign

def delete_campaign(db: Session, campaign_id: UUID):
    db_campaign = get_campaign(db, campaign_id)
    if db_campaign:
        db.delete(db_campaign)
        db.commit()
    return db_campaign
