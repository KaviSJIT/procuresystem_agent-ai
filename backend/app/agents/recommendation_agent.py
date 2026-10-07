from typing import Dict, Any, List
from app.core.logging_config import logger

class RecommendationAgent:
    """
    Recommendation Agent / Decision Engine
    Responsibilities:
    - Synthesizes XGBoost, Random Forest, RAG, and Compliance outputs
    - Generates one of the 4 strict Kaggle pipeline recommendations:
      * RECOMMENDED FOR HUMAN APPROVAL
      * MANUAL REVIEW REQUIRED
      * HIGH RISK REVIEW
      * MANUAL COMPLIANCE REVIEW
    - The AI NEVER automatically approves a procurement.
    """
    def __init__(self):
        self.agent_name = "Recommendation Agent"

    def synthesize_recommendation(
        self,
        procurement_data: dict,
        risk_result: dict,
        rag_result: dict,
        compliance_result: dict = None,
        award_result: dict = None,
        contract_result: dict = None
    ) -> dict:
        logger.info(f"[{self.agent_name}] Synthesizing procurement recommendation...")

        risk_level = risk_result.get("risk_level", "MEDIUM")
        risk_confidence = float(risk_result.get("risk_confidence", 50.0))

        compliance_score = compliance_result.get("score", 4) if compliance_result else 4
        compliance_total = compliance_result.get("total", 4) if compliance_result else 4
        compliance_pct = compliance_result.get("percentage", 100.0) if compliance_result else 100.0

        predicted_award = award_result.get("predicted_award", 0.0) if award_result else 0.0
        diff_pct = award_result.get("difference_percent", 0.0) if award_result else 0.0

        # Decision Engine logic aligned with Kaggle pipeline
        if compliance_score < compliance_total or compliance_pct < 100.0:
            recommendation_text = "MANUAL COMPLIANCE REVIEW"
            reasoning = (
                f"Statutory compliance evidence incomplete ({compliance_score}/{compliance_total} items verified). "
                "Human procurement officer verification required for missing compliance documentation."
            )
        elif risk_level == "HIGH":
            recommendation_text = "HIGH RISK REVIEW"
            reasoning = (
                f"Random Forest model flagged HIGH procurement risk ({risk_confidence:.1f}% confidence). "
                f"XGBoost predicted award: ₹{predicted_award:,.2f} ({diff_pct:+.1f}% vs budget). Requires senior committee review."
            )
        elif risk_level == "MEDIUM":
            recommendation_text = "MANUAL REVIEW REQUIRED"
            reasoning = (
                f"Random Forest model flagged MEDIUM procurement risk ({risk_confidence:.1f}% confidence). "
                f"XGBoost predicted award: ₹{predicted_award:,.2f} ({diff_pct:+.1f}%). Detailed bid scrutiny recommended."
            )
        else:
            recommendation_text = "RECOMMENDED FOR HUMAN APPROVAL"
            reasoning = (
                f"Random Forest model evaluated LOW procurement risk ({risk_confidence:.1f}% confidence). "
                f"Complete statutory evidence found ({compliance_score}/{compliance_total}). "
                f"XGBoost estimated award: ₹{predicted_award:,.2f} ({diff_pct:+.1f}%)."
            )

        # Confidence of recommendation (normalized between 0.45 and 0.98)
        norm_conf = round(min(0.98, max(0.45, risk_confidence / 100.0)), 4)

        return {
            "agent": self.agent_name,
            "recommendation": recommendation_text,
            "reasoning": reasoning,
            "confidence": norm_conf,
            "risk_confidence": risk_confidence,
            "suggested_action": "REQUIRE_HUMAN_APPROVAL",
            "risk_summary": {
                "risk_level": risk_level,
                "risk_confidence": risk_confidence,
                "predicted_award": predicted_award
            },
            "compliance_summary": {
                "score": compliance_score,
                "total": compliance_total,
                "percentage": compliance_pct
            }
        }

recommendation_agent = RecommendationAgent()
