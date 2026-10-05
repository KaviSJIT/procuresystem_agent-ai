from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.db.models import ProcurementRequestDB
from app.schemas.procurement import ProcurementCreate, ProcurementResponse
from app.orchestrator.procurement_orchestrator import procurement_orchestrator
from app.models.rag_service import rag_service

router = APIRouter(prefix="/api/procurement", tags=["Procurement Requests"])

@router.post("", response_model=Dict[str, Any])
def create_procurement(payload: ProcurementCreate, db: Session = Depends(get_db)):
    req_dict = payload.model_dump()
    result = procurement_orchestrator.process_procurement_request(db, req_dict)
    return result

@router.get("", response_model=List[Dict[str, Any]])
def get_all_procurements(db: Session = Depends(get_db)):
    requests = db.query(ProcurementRequestDB).order_by(ProcurementRequestDB.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "budget": r.budget,
            "location": r.location,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        }
        for r in requests
    ]

@router.get("/{req_id}")
def get_procurement_by_id(req_id: str, db: Session = Depends(get_db)):
    req = db.query(ProcurementRequestDB).filter(ProcurementRequestDB.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    return {
        "id": req.id,
        "title": req.title,
        "category": req.category,
        "material_or_service": req.material_or_service,
        "quantity": req.quantity,
        "budget": req.budget,
        "required_date": req.required_date,
        "location": req.location,
        "supplier_requirements": req.supplier_requirements,
        "description": req.description,
        "status": req.status,
        "created_at": req.created_at.isoformat()
    }

@router.post("/search")
def search_procurement_rag(payload: Dict[str, Any] = Body(...)):
    query = payload.get("query", "")
    top_k = int(payload.get("top_k", 5))
    if not query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    return rag_service.search_procurement_knowledge(query, top_k)
