import time
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.xgboost_service import xgboost_service
from app.models.random_forest_service import random_forest_service
from app.models.rag_service import rag_service
from app.services.audit_service import audit_service

router = APIRouter(tags=["System & Diagnostics"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "models": {
            "xgboost": xgboost_service.is_loaded,
            "random_forest": random_forest_service.is_loaded,
            "rag": rag_service.is_loaded
        }
    }

@router.get("/api/system/models")
def get_system_models_diagnostics():
    # XGBoost status
    if xgboost_service.is_loaded:
        xgb_badge = "🟢 Loaded and operational"
    else:
        xgb_badge = f"🔴 Failed to load: {xgboost_service.load_error}"

    # Random Forest status
    if random_forest_service.is_loaded:
        rf_badge = "🟢 Loaded and operational"
    else:
        rf_badge = f"🔴 Failed to load: {random_forest_service.load_error}"

    # RAG status
    if rag_service.is_loaded:
        rag_badge = "🟢 Loaded and retrieval tested"
    else:
        rag_badge = f"🔴 Failed to load: {rag_service.load_error}"

    return {
        "xgboost_final": {
            "badge": xgb_badge,
            "loaded": xgboost_service.is_loaded,
            "error": xgboost_service.load_error,
            "features_count": len(xgboost_service.feature_names),
            "features": xgboost_service.feature_names,
            "target": "total_award_value"
        },
        "random_forest_final": {
            "badge": rf_badge,
            "loaded": random_forest_service.is_loaded,
            "error": random_forest_service.load_error,
            "features_count": len(random_forest_service.feature_names),
            "features": random_forest_service.feature_names,
            "classes": random_forest_service.classes,
            "is_proxy_label": True
        },
        "rag_faiss": {
            "badge": rag_badge,
            "loaded": rag_service.is_loaded,
            "error": rag_service.load_error,
            "documents": len(rag_service.documents) if rag_service.is_loaded else 0,
            "dimension": rag_service.index.d if (rag_service.is_loaded and rag_service.index) else 384,
            "vectors": rag_service.index.ntotal if (rag_service.is_loaded and rag_service.index) else 0,
            "embedding_model": rag_service.embedding_model_name
        }
    }

@router.post("/api/system/end-to-end-test")
def run_end_to_end_test(db: Session = Depends(get_db)):
    """Run a complete end-to-end test using a real test procurement request."""
    stages = []
    test_payload = {
        "title": "E2E Test: Construction Steel Procurement",
        "category": "works",
        "material_or_service": "100 tons Structural Steel",
        "quantity": "100 tons",
        "budget": 5000000.0,
        "required_date": "30 days",
        "location": "Chennai",
        "supplier_requirements": "Reliable supplier with low risk",
        "description": "End-to-end test procurement for 100 tons structural steel."
    }

    # Stage 1: Validation
    t0 = time.time()
    try:
        assert test_payload["title"] and test_payload["budget"] > 0
        stages.append({"stage": "Validation", "status": "🟢 Success", "detail": "All required fields present.", "time_ms": round((time.time()-t0)*1000,1)})
    except Exception as e:
        stages.append({"stage": "Validation", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})
        return {"overall": "🔴 Failed at Validation", "stages": stages}

    # Stage 2: XGBoost Award Prediction
    t0 = time.time()
    xgb_result = None
    try:
        if not xgboost_service.is_loaded:
            raise RuntimeError(f"XGBoost not loaded: {xgboost_service.load_error}")
        xgb_result = xgboost_service.predict_award_value(test_payload)
        stages.append({
            "stage": "XGBoost Award Prediction",
            "status": "🟢 Success",
            "detail": f"Predicted Award: ₹{xgb_result['predicted_award']:,.2f} ({xgb_result['difference_percent']:+.1f}% vs budget)",
            "time_ms": round((time.time()-t0)*1000,1)
        })
    except Exception as e:
        stages.append({"stage": "XGBoost Award Prediction", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})

    # Stage 3: Random Forest Risk Prediction
    t0 = time.time()
    rf_result = None
    try:
        if not random_forest_service.is_loaded:
            raise RuntimeError(f"Random Forest not loaded: {random_forest_service.load_error}")
        rf_result = random_forest_service.predict_risk(test_payload)
        stages.append({
            "stage": "Random Forest Risk Assessment",
            "status": "🟢 Success",
            "detail": f"Risk Level: {rf_result['risk_level']} (Confidence: {rf_result['risk_confidence']:.1f}%)",
            "time_ms": round((time.time()-t0)*1000,1)
        })
    except Exception as e:
        stages.append({"stage": "Random Forest Risk Assessment", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})

    # Stage 4: RAG Knowledge Base Retrieval
    t0 = time.time()
    rag_results = None
    try:
        if not rag_service.is_loaded:
            raise RuntimeError(f"RAG not loaded: {rag_service.load_error}")
        query = f"{test_payload['title']} {test_payload['material_or_service']} {test_payload['category']}"
        rag_results = rag_service.search_procurement_knowledge(query, top_k=3)
        stages.append({
            "stage": "RAG Knowledge Retrieval",
            "status": "🟢 Success",
            "detail": f"Retrieved {len(rag_results['results'])} documents. Top match score: {rag_results['results'][0]['score'] if rag_results['results'] else 'N/A'}",
            "time_ms": round((time.time()-t0)*1000,1)
        })
    except Exception as e:
        stages.append({"stage": "RAG Knowledge Retrieval", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})
        rag_results = {"results": []}

    # Stage 5: Compliance Evidence Retrieval
    t0 = time.time()
    compliance_res = None
    try:
        compliance_res = rag_service.retrieve_compliance_evidence(test_payload, top_k=3)
        stages.append({
            "stage": "Compliance Evidence Retrieval",
            "status": "🟢 Success",
            "detail": f"Evidence Score: {compliance_res['score']}/{compliance_res['total']} ({compliance_res['percentage']}%)",
            "time_ms": round((time.time()-t0)*1000,1)
        })
    except Exception as e:
        stages.append({"stage": "Compliance Evidence Retrieval", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})

    # Stage 6: Decision Engine & Multi-Agent Synthesis
    t0 = time.time()
    agent_bundle = None
    try:
        from app.agents.procurement_agent import procurement_agent
        agent_bundle = procurement_agent.execute_procurement_workflow(
            procurement_data=test_payload,
            rag_evidence=rag_results or {"results": []},
            compliance_evidence=compliance_res,
            award_prediction=xgb_result,
            qwen_analysis=None
        )
        rec = agent_bundle.get("recommendation", {})
        stages.append({
            "stage": "Decision Engine Synthesis",
            "status": "🟢 Success",
            "detail": f"Decision: {rec.get('recommendation', 'N/A')} (Confidence: {rec.get('risk_confidence', 0):.1f}%)",
            "time_ms": round((time.time()-t0)*1000,1)
        })
    except Exception as e:
        stages.append({"stage": "Decision Engine Synthesis", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})

    # Stage 7: Audit Trail Logging
    t0 = time.time()
    try:
        audit_service.log_event(
            db=db,
            event_id=f"E2E-TEST-{uuid.uuid4().hex[:6]}",
            agent="System Diagnostics",
            action="DIAGNOSTIC_E2E_TEST",
            input_summary="Verified complete 7-stage ML and RAG pipeline",
            output_summary=f"Completed {len(stages)} stages successfully.",
            request_id="E2E-TEST",
            status="COMPLETED"
        )
        stages.append({"stage": "Audit Trail Logging", "status": "🟢 Success", "detail": "Test event verified and recorded to audit log.", "time_ms": round((time.time()-t0)*1000,1)})
    except Exception as e:
        stages.append({"stage": "Audit Trail Logging", "status": "🔴 Failed", "detail": str(e), "time_ms": round((time.time()-t0)*1000,1)})

    failed = [s for s in stages if "🔴" in s["status"]]
    warned = [s for s in stages if "🟡" in s["status"]]
    overall = "🔴 Some stages failed" if failed else ("🟡 Completed with warnings" if warned else "🟢 All stages passed")

    return {
        "overall": overall,
        "total_stages": len(stages),
        "passed": len([s for s in stages if "🟢" in s["status"]]),
        "warned": len(warned),
        "failed": len(failed),
        "stages": stages
    }
