from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/audit", tags=["Audit & Traceability"])

@router.get("", response_model=List[Dict[str, Any]])
def get_audit_trail(request_id: Optional[str] = None, db: Session = Depends(get_db)):
    return audit_service.get_audit_logs(db, request_id)

@router.get("/{request_id}")
def get_audit_trail_for_request(request_id: str, db: Session = Depends(get_db)):
    logs = audit_service.get_audit_logs(db, request_id)
    return {
        "request_id": request_id,
        "total_events": len(logs),
        "timeline": logs
    }
