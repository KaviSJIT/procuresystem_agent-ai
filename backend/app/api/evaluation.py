from fastapi import APIRouter
from app.services.evaluation_service import evaluation_service

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation Metrics"])

@router.get("/metrics")
def get_evaluation_metrics():
    return evaluation_service.get_metrics()
