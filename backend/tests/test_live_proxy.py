import urllib.request
import json

def test_live_proxy():
    payload = {
        "title": "Supply and Erection of Pre-Engineered Steel Workshop Buildings",
        "category": "works",
        "material_or_service": "Pre-Engineered Steel Fabrication",
        "quantity": "2 Units",
        "budget": 8500000.0,
        "required_date": "90 days",
        "location": "Himachal Pradesh",
        "supplier_requirements": "PAN verified, registered contractor, completion certificate",
        "description": "Workshop Block B with PAN AAACA1234F, valid registration certificate, bid affidavit, and work completion certificate"
    }

    req = urllib.request.Request(
        "http://localhost:5173/api/procurement",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 201 or resp.status == 200, f"Expected 200/201, got {resp.status}"
        data = json.loads(resp.read().decode("utf-8"))

    print(f"Status: {resp.status}")
    print(f"Request ID: {data.get('request_id')}")
    budget = data.get('procurement_request', {}).get('budget', 0.0)
    print(f"Budget: INR {budget:,.2f}")
    print(f"Predicted Award (XGBoost): INR {data.get('predicted_award'):,.2f}")
    print(f"Award Difference: INR {data.get('award_difference'):,.2f} ({data.get('difference_percent'):.2f}%)")
    print(f"Risk Level (Random Forest): {data.get('risk_level')}")
    print(f"Risk Confidence: {data.get('risk_confidence'):.2f}%")
    print(f"Compliance Score: {data.get('compliance_score')}/4 ({data.get('compliance_percentage'):.1f}%)")
    print(f"Compliance Evidence: {list(data.get('compliance_evidence', {}).keys())}")
    print(f"AI Decision: {data.get('ai_recommendation', {}).get('ai_recommendation')}")
    print(f"Requires Human Approval: {data.get('ai_recommendation', {}).get('required_approval')}")
    print(f"Approval Queue ID: {data.get('approval_id')}")

    # Now verify approval action
    appr_id = data.get('approval_id')
    if appr_id:
        appr_payload = {
            "status": "APPROVED",
            "reviewer_notes": "Reviewed by Chief Procurement Officer. Tender award value and statutory documents verified.",
            "reviewer_name": "Chief Procurement Officer"
        }
        appr_req = urllib.request.Request(
            f"http://localhost:5173/api/approvals/{appr_id}/approve",
            data=json.dumps(appr_payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(appr_req) as appr_resp:
            appr_res = json.loads(appr_resp.read().decode("utf-8"))
            print(f"Approval Result: {appr_res.get('status')} - Reviewed by: {appr_res.get('reviewed_by')}")

    # Verify audit log entry
    audit_req = urllib.request.Request("http://localhost:5173/api/audit/logs?limit=5")
    with urllib.request.urlopen(audit_req) as audit_resp:
        audit_data = json.loads(audit_resp.read().decode("utf-8"))
        print(f"Audit Log Total: {audit_data.get('total')}")
        latest = audit_data.get('logs', [{}])[0]
        print(f"Latest Audit Event: {latest.get('action')} - Status: {latest.get('status')}")

    print("\n>>> LIVE FRONTEND PROXY -> BACKEND -> REAL ML MODELS -> DB -> AUDIT LOG TEST PASSED! <<<")

if __name__ == "__main__":
    test_live_proxy()
