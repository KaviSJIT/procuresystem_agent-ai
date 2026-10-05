from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import datetime

class ProcurementCreate(BaseModel):
    title: str = Field(..., example="Construction Steel Procurement")
    category: str = Field(default="works", example="works")
    material_or_service: Optional[str] = Field(default="Structural Steel", example="Structural Steel")
    quantity: Optional[str] = Field(default="100 tons", example="100 tons")
    budget: float = Field(..., example=5000000.0)
    required_date: Optional[str] = Field(default="30 days", example="30 days")
    location: Optional[str] = Field(default="Chennai", example="Chennai")
    supplier_requirements: Optional[str] = Field(default="High reliability, fast delivery", example="High reliability")
    description: Optional[str] = Field(default="Procurement of 100 tons of high-grade construction steel", example="Procurement request")

class RiskPrediction(BaseModel):
    risk_score: float
    risk_level: str
    prediction: str
    raw_prediction: Optional[int] = 0
    model: str = "xgboost_procurement_final"
    features_evaluated: Optional[List[str]] = []

class RAGSearchResult(BaseModel):
    query: str
    top_k: int
    results: List[Dict[str, Any]]

class ProcurementResponse(BaseModel):
    id: str
    title: str
    category: str
    budget: float
    status: str
    created_at: datetime.datetime
    risk_assessment: Optional[Dict[str, Any]] = None
    rag_evidence: Optional[Dict[str, Any]] = None
    qwen_analysis: Optional[Dict[str, Any]] = None
    agent_results: Optional[Dict[str, Any]] = None
    ai_recommendation: Optional[Dict[str, Any]] = None
    approval_id: Optional[str] = None

    class Config:
        from_attributes = True
