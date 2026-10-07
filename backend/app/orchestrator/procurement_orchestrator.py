import uuid
import time
import datetime
from sqlalchemy.orm import Session
from app.models.xgboost_service import xgboost_service
from app.models.random_forest_service import random_forest_service
from app.models.rag_service import rag_service
from app.agents.procurement_agent import procurement_agent
from app.services.audit_service import audit_service
from app.db.models import ProcurementRequestDB, ApprovalRequestDB
from app.core.logging_config import logger

class ProcurementOrchestrator:
    def process_procurement_request(self, db: Session, procurement_payload: dict) -> dict:
        start_time = time.time()
        request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
        logger.info(f"[Orchestrator] Starting procurement analysis pipeline for Request ID: {request_id}")

        # Step 1: Record Procurement Request in DB
        db_req = ProcurementRequestDB(
            id=request_id,
            title=procurement_payload.get("title", "Procurement Requirement"),
            category=procurement_payload.get("category", "works"),
            material_or_service=procurement_payload.get("material_or_service", ""),
            quantity=procurement_payload.get("quantity", ""),
            budget=float(procurement_payload.get("budget", procurement_payload.get("tender_value_amount", 0.0))),
            required_date=str(procurement_payload.get("required_date", "")),
            location=str(procurement_payload.get("location", "")),
            supplier_requirements=str(procurement_payload.get("supplier_requirements", "")),
            description=str(procurement_payload.get("description", "")),
            status="PENDING_APPROVAL"
        )
        db.add(db_req)
        db.commit()

        # Audit Event 1: Request Created
        audit_service.log_event(
            db=db,
            event_id=f"EVT-01-{uuid.uuid4().hex[:6]}",
            agent="Orchestrator",
            action="REQUEST_CREATED",
            input_summary=f"Procurement Title: {db_req.title}, Budget: ₹{db_req.budget:,.2f}",
            output_summary="Procurement request registered and queued for analysis pipeline.",
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 2: XGBoost Award Prediction
        logger.info(f"[Orchestrator] Running XGBoost total_award_value prediction for {request_id}...")
        xgb_prediction = xgboost_service.predict_award_value(procurement_payload)

        audit_service.log_event(
            db=db,
            event_id=f"EVT-02-{uuid.uuid4().hex[:6]}",
            agent="XGBoost Agent",
            action="AWARD_PREDICTION",
            input_summary=f"Evaluated features for {db_req.title}. Tender Value: ₹{xgb_prediction['tender_value']:,.2f}",
            output_summary=(
                f"Predicted Award: ₹{xgb_prediction['predicted_award']:,.2f} | "
                f"Difference: ₹{xgb_prediction['award_difference']:+,.2f} ({xgb_prediction['difference_percent']:+.1f}%) | "
                f"Multiplier: {xgb_prediction['award_multiplier']}x"
            ),
            confidence=0.90,
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 3: Random Forest Risk Classification
        logger.info(f"[Orchestrator] Running Random Forest risk classification for {request_id}...")
        rf_prediction = random_forest_service.predict_risk(procurement_payload)

        audit_service.log_event(
            db=db,
            event_id=f"EVT-03-{uuid.uuid4().hex[:6]}",
            agent="Random Forest Agent",
            action="RISK_PREDICTION",
            input_summary=f"Classification features evaluated for {db_req.title}",
            output_summary=(
                f"Risk Level: {rf_prediction['risk_level']} | "
                f"Confidence: {rf_prediction['risk_confidence']:.1f}% | "
                f"Class Probas: {rf_prediction['class_probabilities']}"
            ),
            confidence=rf_prediction["confidence"],
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 4: FAISS / RAG Retrieval
        search_query = f"{procurement_payload.get('title', '')} {procurement_payload.get('material_or_service', '')} {procurement_payload.get('category', '')} {procurement_payload.get('description', '')}".strip()
        logger.info(f"[Orchestrator] Searching FAISS RAG knowledge base for {request_id}...")
        rag_results = rag_service.search_procurement_knowledge(query=search_query, top_k=5)

        audit_service.log_event(
            db=db,
            event_id=f"EVT-04-{uuid.uuid4().hex[:6]}",
            agent="RAG Agent",
            action="KNOWLEDGE_RETRIEVAL",
            input_summary=f"Search Query: {search_query[:100]}...",
            output_summary=f"Retrieved {len(rag_results['results'])} historical tender references. Top Match Score: {rag_results['results'][0]['score'] if rag_results['results'] else 0.0}",
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 5: Compliance Evidence Retrieval
        logger.info(f"[Orchestrator] Retrieving statutory compliance evidence for {request_id}...")
        compliance_results = rag_service.retrieve_compliance_evidence(tender_data=procurement_payload, top_k=5)

        audit_service.log_event(
            db=db,
            event_id=f"EVT-05-{uuid.uuid4().hex[:6]}",
            agent="Compliance Agent",
            action="COMPLIANCE_EVIDENCE_RETRIEVAL",
            input_summary="Verified 4 statutory criteria: PAN, Registration Certificate, Bid Affidavit, Work Completion Certificate",
            output_summary=(
                f"Evidence Score: {compliance_results['score']}/{compliance_results['total']} ({compliance_results['percentage']}%) | "
                f"Status: {compliance_results['evidence_status']} | Checks: {compliance_results['checks']}"
            ),
            confidence=float(compliance_results['percentage'] / 100.0),
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 6: Decision Engine & Multi-Agent Synthesis
        agent_bundle = procurement_agent.execute_procurement_workflow(
            procurement_data=procurement_payload,
            rag_evidence=rag_results,
            compliance_evidence=compliance_results,
            award_prediction=xgb_prediction,
            qwen_analysis=None
        )

        recommendation_data = agent_bundle["recommendation"]
        approval_det = agent_bundle["approval_determination"]

        audit_service.log_event(
            db=db,
            event_id=f"EVT-07-{uuid.uuid4().hex[:6]}",
            agent="Decision Engine",
            action="MULTI_AGENT_SYNTHESIS",
            input_summary="Synthesized XGBoost, Random Forest, RAG, and Compliance evidence",
            output_summary=f"Recommendation: {recommendation_data['recommendation']} | Reasoning: {recommendation_data['reasoning']}",
            confidence=recommendation_data['confidence'],
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 8: Human Approval Request (AI NEVER auto-approves)
        approval_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        ai_recommendations_dict = {
            "ai_recommendation": recommendation_data["recommendation"],
            "reasoning": recommendation_data["reasoning"],
            "suggested_action": recommendation_data["suggested_action"],
            "required_approval": True,
            "predicted_award": xgb_prediction["predicted_award"],
            "award_difference": xgb_prediction["award_difference"],
            "difference_percent": xgb_prediction["difference_percent"],
            "risk_level": rf_prediction["risk_level"],
            "risk_confidence": rf_prediction["risk_confidence"],
            "compliance_score": compliance_results["score"],
            "compliance_percentage": compliance_results["percentage"]
        }

        # Combine risk assessments for backward compatibility with frontend
        combined_risk_assessment = {
            "risk_level": rf_prediction["risk_level"],
            "risk_confidence": rf_prediction["risk_confidence"],
            "risk_score": rf_prediction["risk_score"],
            "prediction": rf_prediction["prediction"],
            "tender_value": xgb_prediction["tender_value"],
            "predicted_award": xgb_prediction["predicted_award"],
            "award_difference": xgb_prediction["award_difference"],
            "difference_percent": xgb_prediction["difference_percent"],
            "award_multiplier": xgb_prediction["award_multiplier"],
            "features_evaluated": xgb_prediction["features_evaluated"],
            "class_probabilities": rf_prediction["class_probabilities"]
        }

        db_approval = ApprovalRequestDB(
            id=approval_id,
            procurement_request_id=request_id,
            status="PENDING",
            procurement_request=procurement_payload,
            ai_recommendation=ai_recommendations_dict,
            risk_assessment=combined_risk_assessment,
            rag_evidence=rag_results,
            agent_results=agent_bundle,
            confidence=recommendation_data["confidence"]
        )
        db.add(db_approval)
        db_req.status = "PENDING_APPROVAL"
        db.commit()

        # Step 9: Processing Time & Full Pipeline Audit Log
        processing_time_sec = float(time.time() - start_time)

        pipeline_audit_entry = audit_service.log_procurement_pipeline_audit(
            db=db,
            tender_id=request_id,
            tender_value=xgb_prediction["tender_value"],
            predicted_award=xgb_prediction["predicted_award"],
            award_difference=xgb_prediction["award_difference"],
            difference_percent=xgb_prediction["difference_percent"],
            risk_level=rf_prediction["risk_level"],
            risk_confidence=rf_prediction["risk_confidence"],
            compliance_result=compliance_results,
            recommendation=recommendation_data["recommendation"],
            processing_time_sec=processing_time_sec,
            reviewer="Pending Human Reviewer",
            approval_status="PENDING"
        )

        return {
            "request_id": request_id,
            "approval_id": approval_id,
            "status": db_req.status,
            "procurement_request": procurement_payload,
            "predicted_award": xgb_prediction["predicted_award"],
            "award_difference": xgb_prediction["award_difference"],
            "difference_percent": xgb_prediction["difference_percent"],
            "risk_level": rf_prediction["risk_level"],
            "risk_confidence": rf_prediction["risk_confidence"],
            "compliance_score": compliance_results["score"],
            "compliance_percentage": compliance_results["percentage"],
            "compliance_evidence": compliance_results,
            "risk_assessment": combined_risk_assessment,
            "xgboost_prediction": xgb_prediction,
            "random_forest_prediction": rf_prediction,
            "rag_evidence": rag_results,
            "agent_results": agent_bundle,
            "ai_recommendation": ai_recommendations_dict,
            "confidence": recommendation_data["confidence"],
            "processing_time_sec": processing_time_sec,
            "pipeline_audit": pipeline_audit_entry
        }

procurement_orchestrator = ProcurementOrchestrator()
