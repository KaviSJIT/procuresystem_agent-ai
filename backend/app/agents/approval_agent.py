from typing import Dict, Any
from app.core.logging_config import logger

class ApprovalAgent:
    """
    Approval Agent
    Responsibilities:
    - Enforces human-in-the-loop governance
    - Prepares approval request object
    - Ensures AI NEVER automatically approves a procurement
    """
    def __init__(self):
        self.agent_name = "Approval Agent"

    def determine_approval(
        self,
        procurement_data: dict,
        risk_result: dict,
        recommendation_result: dict,
        compliance_result: dict = None
    ) -> dict:
        logger.info(f"[{self.agent_name}] Evaluating approval governance...")

        budget = float(procurement_data.get("budget", procurement_data.get("tender_value_amount", 0)))
        rec_title = recommendation_result.get("recommendation", "MANUAL REVIEW REQUIRED")

        # In accordance with governance rules, AI NEVER automatically approves.
        # Human approval is always required.
        requires_human = True

        reasoning = [
            f"AI recommendation: {rec_title}.",
            "Procurement governance mandates human reviewer decision before tender award or publication.",
            f"Procurement value: ₹{budget:,.2f}."
        ]

        return {
            "agent": self.agent_name,
            "requires_human_approval": True,
            "approval_status": "PENDING",
            "recommendation": rec_title,
            "approval_reasons": reasoning
        }

approval_agent = ApprovalAgent()
