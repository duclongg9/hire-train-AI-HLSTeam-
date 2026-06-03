from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

class CampaignBase(BaseModel):
    title: str
    status: Optional[str] = "DRAFT"
    rubric_schema: Optional[Any] = None
    deadline: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    created_by: Optional[UUID] = None

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    rubric_schema: Optional[Any] = None
    deadline: Optional[datetime] = None

class CampaignResponse(CampaignBase):
    id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
