from typing import Dict, Any, List
from app.core.logging_config import logger

class ContractAgent:
    """
    Contract Analysis Agent
    Responsibilities:
    - identify important contract clauses
    - detect risk indicators
    - identify unusual conditions
    - identify expiry information
    - identify compliance requirements
    """
    def __init__(self):
        self.agent_name = "Contract Analysis Agent"

    def analyze_contract_conditions(self, procurement_data: dict, document_text: str = "") -> dict:
        logger.info(f"[{self.agent_name}] Analyzing contract terms...")
        
        required_days = int(procurement_data.get("required_days", 30))
        budget = float(procurement_data.get("budget", 0))

        risk_indicators = []
        unusual_conditions = []

        if required_days < 15:
            risk_indicators.append("Extremely tight completion schedule (< 15 days). High risk of delay penalties.")
            unusual_conditions.append("Accelerated procurement timeline requested.")

        if budget > 5000000 and "security deposit" not in document_text.lower():
            risk_indicators.append("High value contract (> ₹50 Lakhs) missing explicit Performance Security Deposit clause.")

        return {
            "agent": self.agent_name,
            "contract_period_days": required_days,
            "budget_val": budget,
            "risk_indicators": risk_indicators,
            "unusual_conditions": unusual_conditions,
            "compliance_requirements": [
                "10% Performance Guarantee",
                "Pan Card & GST Registration",
                "EPF Registration Certificate"
            ]
        }

contract_agent = ContractAgent()
