import uuid
import datetime
from sqlalchemy.orm import Session
from app.models.xgboost_service import xgboost_service
from app.models.rag_service import rag_service
from app.models.qwen_service import qwen_service, QwenModelNotLoadedException
from app.agents.procurement_agent import procurement_agent
from app.services.audit_service import audit_service
from app.db.models import ProcurementRequestDB, ApprovalRequestDB
from app.core.logging_config import logger

class ProcurementOrchestrator:
    def process_procurement_request(self, db: Session, procurement_payload: dict) -> dict:
        request_id = f"REQ-{uuid.uuid4().hex[:8].upper()}"
        logger.info(f"[Orchestrator] Starting workflow for Request ID: {request_id}")

        # Step 1: Record Procurement Request in DB
        db_req = ProcurementRequestDB(
            id=request_id,
            title=procurement_payload.get("title", "Procurement Requirement"),
            category=procurement_payload.get("category", "works"),
            material_or_service=procurement_payload.get("material_or_service", ""),
            quantity=procurement_payload.get("quantity", ""),
            budget=float(procurement_payload.get("budget", 0)),
            required_date=str(procurement_payload.get("required_date", "")),
            location=str(procurement_payload.get("location", "")),
            supplier_requirements=str(procurement_payload.get("supplier_requirements", "")),
            description=str(procurement_payload.get("description", "")),
            status="ANALYZING"
        )
        db.add(db_req)
        db.commit()

        # Audit Event 1: Request Created
        audit_service.log_event(
            db=db,
            event_id=f"EVT-01-{uuid.uuid4().hex[:6]}",
            agent="Orchestrator",
            action="REQUEST_CREATED",
            input_summary=f"Procurement Title: {db_req.title}, Budget: ₹{db_req.budget}",
            output_summary="Procurement request validated and queued for multi-agent evaluation.",
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 2: XGBoost Risk Prediction
        logger.info(f"[Orchestrator] Running XGBoost risk prediction for {request_id}...")
        xgb_prediction = xgboost_service.predict_procurement_risk(procurement_payload)

        audit_service.log_event(
            db=db,
            event_id=f"EVT-02-{uuid.uuid4().hex[:6]}",
            agent="XGBoost Agent",
            action="RISK_PREDICTION",
            input_summary=f"Evaluated 14 features for {db_req.title}",
            output_summary=f"Risk Score: {xgb_prediction['risk_score']}, Level: {xgb_prediction['risk_level']}, Label: {xgb_prediction['prediction']}",
            confidence=1.0 - xgb_prediction['risk_score'],
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 3: RAG Retrieval
        search_query = f"{procurement_payload.get('title')} {procurement_payload.get('material_or_service')} {procurement_payload.get('category')} {procurement_payload.get('description')}"
        logger.info(f"[Orchestrator] Searching RAG knowledge base for {request_id}...")
        rag_results = rag_service.search_procurement_knowledge(query=search_query, top_k=5)

        audit_service.log_event(
            db=db,
            event_id=f"EVT-03-{uuid.uuid4().hex[:6]}",
            agent="RAG Agent",
            action="KNOWLEDGE_RETRIEVAL",
            input_summary=f"Search Query: {search_query[:100]}...",
            output_summary=f"Retrieved {len(rag_results['results'])} historical tender references. Top Score: {rag_results['results'][0]['score'] if rag_results['results'] else 0.0}",
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 4: Qwen LLM Generation (if loaded)
        qwen_analysis = None
        try:
            if qwen_service.is_loaded:
                context_str = "\n---\n".join([r["document"] for r in rag_results["results"]])
                qwen_analysis = qwen_service.generate_procurement_response(
                    query=search_query,
                    context=context_str,
                    procurement_data=procurement_payload
                )
                audit_service.log_event(
                    db=db,
                    event_id=f"EVT-04-{uuid.uuid4().hex[:6]}",
                    agent="Qwen LLM Agent",
                    action="LLM_ANALYSIS_GENERATION",
                    input_summary="Prompted with RAG context and procurement details",
                    output_summary=f"Generated recommendation: {qwen_analysis.get('recommendation', '')[:100]}...",
                    request_id=request_id,
                    status="COMPLETED"
                )
            else:
                audit_service.log_event(
                    db=db,
                    event_id=f"EVT-04-{uuid.uuid4().hex[:6]}",
                    agent="Qwen LLM Agent",
                    action="LLM_STATUS_CHECK",
                    input_summary="Qwen model loading check",
                    output_summary=f"Qwen LLM offline/unconfigured ({qwen_service.load_error}). Proceeding with specialized multi-agent synthesis.",
                    request_id=request_id,
                    status="SKIPPED"
                )
        except Exception as q_err:
            logger.warning(f"[Orchestrator] Qwen generation error: {q_err}")

        # Step 5: Multi-Agent Execution
        agent_bundle = procurement_agent.execute_procurement_workflow(
            procurement_data=procurement_payload,
            rag_evidence=rag_results,
            qwen_analysis=qwen_analysis
        )

        recommendation_data = agent_bundle["recommendation"]
        approval_det = agent_bundle["approval_determination"]

        audit_service.log_event(
            db=db,
            event_id=f"EVT-05-{uuid.uuid4().hex[:6]}",
            agent="Specialized Agents",
            action="MULTI_AGENT_SYNTHESIS",
            input_summary="Combined XGBoost, RAG, Contract, and Risk agent outputs",
            output_summary=f"Recommendation: {recommendation_data['recommendation']} | Confidence: {recommendation_data['confidence']}",
            confidence=recommendation_data['confidence'],
            request_id=request_id,
            status="COMPLETED"
        )

        # Step 6: Create Human Approval Request
        approval_id = f"APP-{uuid.uuid4().hex[:8].upper()}"
        ai_recommendations_dict = {
            "ai_recommendation": recommendation_data["recommendation"],
            "reasoning": recommendation_data["reasoning"],
            "suggested_action": recommendation_data["suggested_action"],
            "required_approval": approval_det["requires_human_approval"]
        }

        db_approval = ApprovalRequestDB(
            id=approval_id,
            procurement_request_id=request_id,
            status="PENDING",
            procurement_request=procurement_payload,
            ai_recommendation=ai_recommendations_dict,
            risk_assessment=xgb_prediction,
            rag_evidence=rag_results,
            agent_results=agent_bundle,
            confidence=recommendation_data["confidence"]
        )
        db.add(db_approval)
        
        # Update request status
        db_req.status = "PENDING_APPROVAL" if approval_det["requires_human_approval"] else "APPROVED"
        db.commit()

        audit_service.log_event(
            db=db,
            event_id=f"EVT-06-{uuid.uuid4().hex[:6]}",
            agent="Approval Agent",
            action="HUMAN_APPROVAL_CREATED",
            input_summary=f"Approval ID: {approval_id}",
            output_summary=f"Status: PENDING_HUMAN_APPROVAL. Decision required by Procurement Officer.",
            confidence=recommendation_data["confidence"],
            human_decision="PENDING",
            request_id=request_id,
            status="PENDING"
        )

        return {
            "request_id": request_id,
            "approval_id": approval_id,
            "status": db_req.status,
            "procurement_request": procurement_payload,
            "risk_assessment": xgb_prediction,
            "rag_evidence": rag_results,
            "qwen_analysis": qwen_analysis,
            "agent_results": agent_bundle,
            "ai_recommendation": ai_recommendations_dict,
            "confidence": recommendation_data["confidence"]
        }

procurement_orchestrator = ProcurementOrchestrator()
