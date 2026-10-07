import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.db.database import get_db
from app.db.models import ApprovalRequestDB, ProcurementRequestDB
from app.schemas.approval import ApprovalAction, ApprovalResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/approvals", tags=["Human-in-the-Loop Approvals"])

@router.get("", response_model=List[Dict[str, Any]])
def get_approvals(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ApprovalRequestDB)
    if status:
        query = query.filter(ApprovalRequestDB.status == status.upper())
    approvals = query.order_by(ApprovalRequestDB.created_at.desc()).all()
    
    return [
        {
            "id": a.id,
            "procurement_request_id": a.procurement_request_id,
            "status": a.status,
            "procurement_request": a.procurement_request,
            "ai_recommendation": a.ai_recommendation,
            "risk_assessment": a.risk_assessment,
            "rag_evidence": a.rag_evidence,
            "agent_results": a.agent_results,
            "confidence": a.confidence,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "reviewed_by": a.reviewed_by,
            "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
            "comments": a.comments
        }
        for a in approvals
    ]

@router.get("/{appr_id}")
def get_approval_by_id(appr_id: str, db: Session = Depends(get_db)):
    appr = db.query(ApprovalRequestDB).filter(ApprovalRequestDB.id == appr_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail=f"Approval request {appr_id} not found")
    return {
        "id": appr.id,
        "procurement_request_id": appr.procurement_request_id,
        "status": appr.status,
        "procurement_request": appr.procurement_request,
        "ai_recommendation": appr.ai_recommendation,
        "risk_assessment": appr.risk_assessment,
        "rag_evidence": appr.rag_evidence,
        "agent_results": appr.agent_results,
        "confidence": appr.confidence,
        "created_at": appr.created_at.isoformat() if appr.created_at else None,
        "reviewed_by": appr.reviewed_by,
        "reviewed_at": appr.reviewed_at.isoformat() if appr.reviewed_at else None,
        "comments": appr.comments
    }

@router.post("/{appr_id}/approve")
def approve_request(appr_id: str, action: ApprovalAction = Body(...), db: Session = Depends(get_db)):
    appr = db.query(ApprovalRequestDB).filter(ApprovalRequestDB.id == appr_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail=f"Approval request {appr_id} not found")

    appr.status = "APPROVED"
    appr.reviewed_by = action.reviewed_by
    appr.reviewed_at = datetime.datetime.utcnow()
    appr.comments = action.comments or "Approved by Procurement Officer"

    # Update associated procurement request status
    req = db.query(ProcurementRequestDB).filter(ProcurementRequestDB.id == appr.procurement_request_id).first()
    if req:
        req.status = "APPROVED"

    db.commit()

    # Log audit event
    audit_service.log_event(
        db=db,
        event_id=f"EVT-DECISION-{appr_id}",
        agent="Human Procurement Officer",
        action="HUMAN_APPROVAL_DECISION",
        input_summary=f"Reviewed Request: {appr.procurement_request_id} by {action.reviewed_by}",
        output_summary=f"DECISION: APPROVED. Comments: {appr.comments}",
        human_decision="APPROVED",
        request_id=appr.procurement_request_id,
        status="APPROVED"
    )
    audit_service.update_human_decision_in_json(appr.procurement_request_id, action.reviewed_by, "APPROVED")

    return {"status": "SUCCESS", "message": f"Approval request {appr_id} approved.", "approval": appr_id}

@router.post("/{appr_id}/review")
def send_for_review(appr_id: str, action: ApprovalAction = Body(...), db: Session = Depends(get_db)):
    appr = db.query(ApprovalRequestDB).filter(ApprovalRequestDB.id == appr_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail=f"Approval request {appr_id} not found")

    appr.status = "SENT_FOR_REVIEW"
    appr.reviewed_by = action.reviewed_by
    appr.reviewed_at = datetime.datetime.utcnow()
    appr.comments = action.comments or "Sent for further review"

    req = db.query(ProcurementRequestDB).filter(ProcurementRequestDB.id == appr.procurement_request_id).first()
    if req:
        req.status = "UNDER_REVIEW"

    db.commit()

    audit_service.log_event(
        db=db,
        event_id=f"EVT-REVIEW-{appr_id}",
        agent="Human Procurement Officer",
        action="HUMAN_SENT_FOR_REVIEW",
        input_summary=f"Reviewed Request: {appr.procurement_request_id} by {action.reviewed_by}",
        output_summary=f"DECISION: SENT FOR REVIEW. Comments: {appr.comments}",
        human_decision="SENT_FOR_REVIEW",
        request_id=appr.procurement_request_id,
        status="SENT_FOR_REVIEW"
    )
    audit_service.update_human_decision_in_json(appr.procurement_request_id, action.reviewed_by, "SENT_FOR_REVIEW")

    return {"status": "SUCCESS", "message": f"Approval request {appr_id} sent for review.", "approval": appr_id}

@router.post("/{appr_id}/reject")
def reject_request(appr_id: str, action: ApprovalAction = Body(...), db: Session = Depends(get_db)):
    appr = db.query(ApprovalRequestDB).filter(ApprovalRequestDB.id == appr_id).first()
    if not appr:
        raise HTTPException(status_code=404, detail=f"Approval request {appr_id} not found")

    appr.status = "REJECTED"
    appr.reviewed_by = action.reviewed_by
    appr.reviewed_at = datetime.datetime.utcnow()
    appr.comments = action.comments or "Rejected and returned for review"

    req = db.query(ProcurementRequestDB).filter(ProcurementRequestDB.id == appr.procurement_request_id).first()
    if req:
        req.status = "REJECTED_RETURNED_FOR_REVIEW"

    db.commit()

    audit_service.log_event(
        db=db,
        event_id=f"EVT-DECISION-{appr_id}",
        agent="Human Procurement Officer",
        action="HUMAN_REJECTION_DECISION",
        input_summary=f"Reviewed Request: {appr.procurement_request_id} by {action.reviewed_by}",
        output_summary=f"DECISION: REJECTED. Comments: {appr.comments}",
        human_decision="REJECTED",
        request_id=appr.procurement_request_id,
        status="REJECTED"
    )
    audit_service.update_human_decision_in_json(appr.procurement_request_id, action.reviewed_by, "REJECTED")

    return {"status": "SUCCESS", "message": f"Approval request {appr_id} rejected.", "approval": appr_id}
