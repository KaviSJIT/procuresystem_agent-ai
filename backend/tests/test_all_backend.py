import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.models.xgboost_service import xgboost_service
from app.models.random_forest_service import random_forest_service
from app.models.rag_service import rag_service

def run_tests():
    with TestClient(app) as client:
        # 1. Health check
        response = client.get("/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data["status"] == "healthy"
        assert data["models"]["xgboost"] is True
        assert data["models"]["random_forest"] is True
        assert data["models"]["rag"] is True
        print(" [OK] Health check passed!", data)

        # 2. System models diagnostics
        response = client.get("/api/system/models")
        assert response.status_code == 200, f"Diagnostics failed: {response.text}"
        diag_data = response.json()
        assert diag_data["xgboost_final"]["loaded"] is True
        assert diag_data["random_forest_final"]["loaded"] is True
        assert diag_data["rag_faiss"]["loaded"] is True
        print(" [OK] Model diagnostics endpoint passed!", {
            "xgboost": diag_data["xgboost_final"]["badge"],
            "random_forest": diag_data["random_forest_final"]["badge"],
            "rag": diag_data["rag_faiss"]["badge"],
            "vectors": diag_data["rag_faiss"]["vectors"]
        })

        # 3. Real XGBoost Award Value Prediction
        payload = {
            "title": "Construction Steel Procurement",
            "category": "works",
            "budget": 5000000.0,
            "procurement_method": "open",
            "num_tenderers": 3.0,
            "required_days": 30.0,
            "contract_duration_days": 180.0
        }
        xgb_res = xgboost_service.predict_award_value(payload)
        assert "predicted_award" in xgb_res
        assert xgb_res["predicted_award"] > 0
        assert "award_difference" in xgb_res
        assert "difference_percent" in xgb_res
        print(" [OK] XGBoost real model prediction passed!", xgb_res)

        # 4. Real Random Forest Risk Prediction
        rf_res = random_forest_service.predict_risk(payload)
        assert "risk_level" in rf_res
        assert rf_res["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
        assert "risk_confidence" in rf_res
        assert rf_res["risk_confidence"] > 0
        print(" [OK] Random Forest real model prediction passed!", rf_res)

        # 5. Real RAG FAISS Search
        query = "Find suppliers for construction steel with good reliability"
        rag_res = rag_service.search_procurement_knowledge(query, top_k=3)
        assert rag_res["query"] == query
        assert len(rag_res["results"]) == 3
        assert "document" in rag_res["results"][0]
        assert "metadata" in rag_res["results"][0]
        print(" [OK] RAG FAISS retrieval passed!", rag_res["results"][0]["metadata"])

        # 6. Real Statutory Compliance Retrieval
        comp_res = rag_service.retrieve_compliance_evidence(payload, top_k=3)
        assert "checks" in comp_res
        assert "PAN" in comp_res["checks"]
        assert "Registration Certificate" in comp_res["checks"]
        assert "Bid Affidavit" in comp_res["checks"]
        assert "Work Completion Certificate" in comp_res["checks"]
        assert comp_res["score"] >= 1
        print(" [OK] Statutory compliance evidence retrieval passed!", comp_res["checks"])

        # 7. End-to-end procurement creation
        payload_create = {
            "title": "Construction Steel Procurement Demo",
            "category": "works",
            "material_or_service": "100 tons Structural Steel",
            "quantity": "100 tons",
            "budget": 5000000.0,
            "required_date": "30 days",
            "location": "Chennai",
            "supplier_requirements": "High reliability, fast delivery",
            "description": "Procurement of 100 tons of construction steel"
        }
        res_create = client.post("/api/procurement", json=payload_create)
        assert res_create.status_code == 200, f"Create procurement failed: {res_create.text}"
        create_data = res_create.json()
        assert "request_id" in create_data
        assert "approval_id" in create_data
        assert "predicted_award" in create_data
        assert "risk_level" in create_data
        assert "risk_confidence" in create_data
        assert "compliance_score" in create_data
        assert "compliance_percentage" in create_data
        assert "pipeline_audit" in create_data
        print(" [OK] End-to-end procurement workflow creation passed! Request ID:", create_data["request_id"])
        print("      Predicted Award: ₹{:,.2f} | Risk: {} ({:.1f}%) | Decision: {}".format(
            create_data["predicted_award"],
            create_data["risk_level"],
            create_data["risk_confidence"],
            create_data["ai_recommendation"]["ai_recommendation"]
        ))

        appr_id = create_data["approval_id"]

        # 8. Approvals List
        get_appr = client.get("/api/approvals")
        assert get_appr.status_code == 200
        apprs = get_appr.json()
        assert len(apprs) > 0
        print(f" [OK] Approvals queue endpoint passed! Total approvals: {len(apprs)}")

        # 9. Human-in-the-Loop Approval Action
        appr_res = client.post(f"/api/approvals/{appr_id}/approve", json={
            "reviewed_by": "Senior Procurement Officer",
            "comments": "Approved after comprehensive AI multi-agent verification and compliance check"
        })
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "SUCCESS"
        print(" [OK] Human-in-the-Loop approval action passed!")

        # 10. Audit Log
        audit_res = client.get("/api/audit")
        assert audit_res.status_code == 200
        logs = audit_res.json()
        assert len(logs) > 0
        print(f" [OK] Audit log endpoint passed! Total audit records: {len(logs)}")

        # 11. Evaluation Metrics
        eval_res = client.get("/api/evaluation/metrics")
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert eval_data["evaluated"] is True
        assert eval_data["xgboost_metrics"]["model_loaded"] is True
        assert eval_data["random_forest_metrics"]["model_loaded"] is True
        assert eval_data["rag_metrics"]["total_vectors"] == 3778
        print(" [OK] Evaluation metrics endpoint passed!", {
            "RAG Vectors": eval_data["rag_metrics"]["total_vectors"],
            "RF Classes": eval_data["random_forest_metrics"]["risk_classes"],
            "XGB Target": eval_data["xgboost_metrics"]["target"]
        })

        # 12. System E2E diagnostic test
        e2e_diag = client.post("/api/system/end-to-end-test")
        assert e2e_diag.status_code == 200
        diag_res = e2e_diag.json()
        print(" [OK] System E2E diagnostic passed!", diag_res["overall"])

        print("\n==============================================================")
        print("   ALL BACKEND COMPONENT TESTS PASSED WITH NEW TRAINED MODELS!")
        print("==============================================================")

if __name__ == "__main__":
    run_tests()
