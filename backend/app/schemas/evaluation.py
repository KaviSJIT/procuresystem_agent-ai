from pydantic import BaseModel
from typing import Dict, Any, Optional

class ComparisonWorkflow(BaseModel):
    conventional: Dict[str, Any]
    rule_based: Dict[str, Any]
    agentic_ai: Dict[str, Any]

class EvaluationMetricsResponse(BaseModel):
    evaluated: bool
    status_message: str
    dataset_info: Dict[str, Any]
    xgboost_metrics: Optional[Dict[str, Any]] = None
    rag_metrics: Optional[Dict[str, Any]] = None
    workflow_comparison: ComparisonWorkflow

    class Config:
        from_attributes = True
