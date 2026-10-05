from typing import Dict, Any
from app.core.logging_config import logger

class ApprovalAgent:
    """
    Approval Agent
    Responsibilities:
    - determine whether human approval is required
    - prepare approval request object
    - track decision states
    """
    def __init__(self):
        self.agent_name = "Approval Agent"

    def determine_approval(
        self,
        procurement_data: dict,
        risk_result: dict,
        recommendation_result: dict
    ) -> dict:
        logger.info(f"[{self.agent_name}] Evaluating human approval requirement...")

        budget = float(procurement_data.get("budget", 0))
        risk_score = risk_result.get("risk_score", 0.0)

        # Requirement rules: High budget or elevated risk requires human approval
        requires_human = (budget >= 1000000) or (risk_score >= 0.40)

        reasoning = []
        if budget >= 1000000:
            reasoning.append(f"Budget ₹{budget:,.2f} exceeds automatic approval threshold (₹10 Lakhs).")
        if risk_score >= 0.40:
            reasoning.append(f"XGBoost risk score ({risk_score}) indicates elevated procurement risk.")

        if not requires_human:
            reasoning.append("Budget and risk scores within safe automated execution bounds.")

        return {
            "agent": self.agent_name,
            "requires_human_approval": requires_human,
            "approval_status": "PENDING" if requires_human else "AUTO_APPROVED",
            "approval_reasons": reasoning
        }

approval_agent = ApprovalAgent()
