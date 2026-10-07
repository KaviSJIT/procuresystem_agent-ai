from typing import Dict, Any
from app.models.xgboost_service import xgboost_service
from app.models.random_forest_service import random_forest_service
from app.models.rag_service import rag_service
from app.core.logging_config import logger

class SupplierRiskAgent:
    """
    Supplier Risk Agent
    Responsibilities:
    - Procurement risk classification using Random Forest (LOW, MEDIUM, HIGH)
    - Award prediction integration using XGBoost
    - Proxy-label risk confidence analysis
    - Identification of risk factors from RAG evidence
    """
    def __init__(self):
        self.agent_name = "Supplier Risk Agent"

    def analyze_supplier_risk(self, procurement_data: dict, rag_evidence: dict = None) -> dict:
        logger.info(f"[{self.agent_name}] Running risk assessment...")

        # 1. Random Forest Procurement Risk Classification
        rf_result = random_forest_service.predict_risk(procurement_data)
        risk_level = rf_result["risk_level"]
        risk_confidence = rf_result["risk_confidence"]
        risk_score = rf_result["risk_score"]

        # 2. XGBoost Award Value Prediction
        xgb_result = xgboost_service.predict_award_value(procurement_data)

        # 3. Identify contextual risk factors
        risk_factors = []
        budget = float(procurement_data.get("budget", procurement_data.get("tender_value_amount", 0)))
        if budget > 10000000:
            risk_factors.append("High financial budget (> ₹1 Crore) increases delivery and financial exposure risk.")

        if risk_level == "HIGH":
            risk_factors.append(f"Random Forest model flagged HIGH procurement risk ({risk_confidence:.1f}% confidence).")
        elif risk_level == "MEDIUM":
            risk_factors.append(f"Random Forest model flagged MEDIUM procurement risk ({risk_confidence:.1f}% confidence).")

        diff_pct = xgb_result.get("difference_percent", 0.0)
        if diff_pct > 30.0:
            risk_factors.append(f"Predicted award exceeds tender budget by {diff_pct:.1f}% (Potential cost overrun).")
        elif diff_pct < -25.0:
            risk_factors.append(f"Predicted award is {abs(diff_pct):.1f}% below estimate (Potential underbidding risk).")

        if rag_evidence:
            retrieved_docs = rag_evidence.get("results", [])
            if retrieved_docs:
                top_score = retrieved_docs[0].get("similarity", 0.5)
                if top_score < 0.35:
                    risk_factors.append("Limited historical tender similarity found in knowledge base.")

        reliability_score = round(max(0.1, 1.0 - (risk_score * 0.8)), 4)

        return {
            "agent": self.agent_name,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_confidence": risk_confidence,
            "reliability_score": reliability_score,
            "prediction": rf_result["prediction"],
            "risk_factors": risk_factors,
            "random_forest_details": rf_result,
            "xgboost_details": xgb_result
        }

supplier_risk_agent = SupplierRiskAgent()
