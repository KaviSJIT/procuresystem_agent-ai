from pydantic import BaseModel
from typing import Optional, Dict, Any
import datetime

class ApprovalAction(BaseModel):
    reviewed_by: str = "Procurement Officer"
    comments: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    status: str
    procurement_request: Dict[str, Any]
    ai_recommendation: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    rag_evidence: Optional[Dict[str, Any]] = None
    agent_results: Optional[Dict[str, Any]] = None
    confidence: float
    created_at: datetime.datetime
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime.datetime] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True
