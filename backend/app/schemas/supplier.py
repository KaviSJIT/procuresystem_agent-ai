from pydantic import BaseModel
from typing import Optional

class SupplierSchema(BaseModel):
    id: str
    name: str
    category: Optional[str] = "Construction Works"
    risk_score: float
    reliability_score: float
    total_tenders: int
    total_procurement_value: float
    recommendation: Optional[str] = "Recommended"
    status: str = "ACTIVE"
    procuring_entity_name: Optional[str] = None

    class Config:
        from_attributes = True
