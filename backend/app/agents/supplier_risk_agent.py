from typing import Dict, Any
from app.models.xgboost_service import xgboost_service
from app.models.rag_service import rag_service
from app.core.logging_config import logger

class SupplierRiskAgent:
    """
    Supplier Risk Agent
    Responsibilities:
    - supplier risk assessment
    - supplier reliability analysis
    - risk classification
    - identify potential supplier issues using XGBoost + RAG evidence
    """
    def __init__(self):
        self.agent_name = "Supplier Risk Agent"

    def analyze_supplier_risk(self, procurement_data: dict, rag_evidence: dict) -> dict:
        logger.info(f"[{self.agent_name}] Running risk assessment...")
        
        # 1. XGBoost Model Risk Prediction
        xgb_result = xgboost_service.predict_procurement_risk(procurement_data)
        risk_score = xgb_result["risk_score"]
        risk_level = xgb_result["risk_level"]

        # 2. Risk factors based on XGBoost & RAG evidence
        risk_factors = []
        budget = float(procurement_data.get("budget", 0))
        if budget > 10000000:
            risk_factors.append("High financial budget (> ₹1 Crore) increases delivery and financial exposure risk.")
        
        if risk_score > 0.6:
            risk_factors.append("XGBoost risk model flagged elevated failure/delay probability.")
        
        # RAG evidence inspection
        retrieved_docs = rag_evidence.get("results", [])
        if retrieved_docs:
            top_score = retrieved_docs[0].get("score", 0.0)
            if top_score < 0.3:
                risk_factors.append("Low historical tender match score; limited prior tender data for this specific requirement.")

        reliability_score = round(max(0.1, 1.0 - risk_score), 4)

        return {
            "agent": self.agent_name,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reliability_score": reliability_score,
            "prediction": xgb_result["prediction"],
            "risk_factors": risk_factors,
            "xgboost_details": xgb_result
        }

supplier_risk_agent = SupplierRiskAgent()
