import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.models.xgboost_service import xgboost_service
from app.models.rag_service import rag_service
from app.models.qwen_service import qwen_service

def run_tests():
    with TestClient(app) as client:
        # 1. Health check
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["models"]["xgboost"] is True
        assert data["models"]["rag"] is True
        print(" [OK] Health check passed!", data)

        # 2. System models diagnostics
        response = client.get("/api/system/models")
        assert response.status_code == 200
        diag_data = response.json()
        assert diag_data["xgboost_final"]["loaded"] is True
        assert diag_data["rag_faiss"]["loaded"] is True
        assert diag_data["rag_faiss"]["documents"] == 4790
        print(" [OK] Model diagnostics endpoint passed!", diag_data["rag_faiss"])

        # 3. Real XGBoost Risk Prediction
        payload = {
            "title": "Construction Steel Procurement",
            "category": "works",
            "budget": 5000000.0,
            "procurement_method": "Open",
            "num_tenderers": 3.0,
            "required_days": 30.0,
            "contract_duration_days": 180.0,
            "location": "Executive Engineer HP PWD"
        }
        result = xgboost_service.predict_procurement_risk(payload)
        assert "risk_score" in result
        assert "risk_level" in result
        assert result["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
        print(" [OK] XGBoost real model prediction passed!", result)

        # 4. Real RAG FAISS Search
        query = "Find suppliers for construction steel with good reliability"
        rag_res = rag_service.search_procurement_knowledge(query, top_k=3)
        assert rag_res["query"] == query
        assert len(rag_res["results"]) == 3
        assert "document" in rag_res["results"][0]
        assert "metadata" in rag_res["results"][0]
        print(" [OK] RAG FAISS retrieval passed!", rag_res["results"][0]["metadata"])

        # 5. End-to-end procurement creation
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
        assert res_create.status_code == 200
        create_data = res_create.json()
        assert "request_id" in create_data
        assert "approval_id" in create_data
        assert "risk_assessment" in create_data
        assert "rag_evidence" in create_data
        assert "confidence" in create_data
        print(" [OK] End-to-end procurement workflow creation passed! Request ID:", create_data["request_id"])

        appr_id = create_data["approval_id"]

        # 6. Approvals List
        get_appr = client.get("/api/approvals")
        assert get_appr.status_code == 200

        # 7. Approve Request
        appr_res = client.post(f"/api/approvals/{appr_id}/approve", json={
            "reviewed_by": "Senior Procurement Officer",
            "comments": "Approved after comprehensive AI multi-agent verification"
        })
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "SUCCESS"
        print(" [OK] Human-in-the-Loop approval action passed!")

        # 8. Audit Log
        audit_res = client.get("/api/audit")
        assert audit_res.status_code == 200
        logs = audit_res.json()
        assert len(logs) > 0
        print(f" [OK] Audit log endpoint passed! Total audit events: {len(logs)}")

        # 9. Evaluation Metrics
        eval_res = client.get("/api/evaluation/metrics")
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert eval_data["evaluated"] is True
        assert "workflow_comparison" in eval_data
        print(" [OK] Evaluation metrics endpoint passed!", eval_data["dataset_info"])

        print("\n==============================================================")
        print("   ALL BACKEND COMPONENT TESTS PASSED WITH REAL ARTIFACTS!  ")
        print("==============================================================")

if __name__ == "__main__":
    run_tests()
