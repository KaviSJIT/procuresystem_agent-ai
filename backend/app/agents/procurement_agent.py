from typing import Dict, Any
from app.core.logging_config import logger
from app.agents.supplier_risk_agent import supplier_risk_agent
from app.agents.contract_agent import contract_agent
from app.agents.recommendation_agent import recommendation_agent
from app.agents.approval_agent import approval_agent

class ProcurementAgent:
    """
    Procurement Master Agent
    Coordinates multi-agent synthesis using XGBoost award prediction,
    Random Forest risk classification, RAG retrieval, and compliance analysis.
    """
    def __init__(self):
        self.agent_name = "Procurement Master Agent"

    def execute_procurement_workflow(
        self,
        procurement_data: dict,
        rag_evidence: dict,
        compliance_evidence: dict = None,
        award_prediction: dict = None,
        qwen_analysis: dict = None
    ) -> dict:
        logger.info(f"[{self.agent_name}] Executing master procurement workflow...")

        # 1. Supplier Risk Analysis (Random Forest + XGBoost)
        risk_res = supplier_risk_agent.analyze_supplier_risk(procurement_data, rag_evidence)

        # 2. Contract Clause Analysis
        contract_res = contract_agent.analyze_contract_conditions(procurement_data)

        # 3. Recommendation Synthesis (Decision Engine)
        rec_res = recommendation_agent.synthesize_recommendation(
            procurement_data=procurement_data,
            risk_result=risk_res,
            rag_result=rag_evidence,
            compliance_result=compliance_evidence,
            award_result=award_prediction,
            contract_result=contract_res
        )

        # 4. Approval Determination (Enforces human governance)
        appr_res = approval_agent.determine_approval(
            procurement_data=procurement_data,
            risk_result=risk_res,
            recommendation_result=rec_res,
            compliance_result=compliance_evidence
        )

        return {
            "master_agent": self.agent_name,
            "risk_analysis": risk_res,
            "contract_analysis": contract_res,
            "compliance_analysis": compliance_evidence,
            "recommendation": rec_res,
            "approval_determination": appr_res,
            "agent_summary": (
                f"Multi-agent evaluation completed. Risk: {risk_res['risk_level']} "
                f"({risk_res['risk_confidence']:.1f}% conf), Decision: {rec_res['recommendation']}, "
                f"Action: {appr_res['approval_status']}"
            )
        }

procurement_agent = ProcurementAgent()
