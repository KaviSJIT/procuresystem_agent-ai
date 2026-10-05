from typing import Dict, Any
from app.core.logging_config import logger
from app.agents.supplier_risk_agent import supplier_risk_agent
from app.agents.contract_agent import contract_agent
from app.agents.recommendation_agent import recommendation_agent
from app.agents.approval_agent import approval_agent

class ProcurementAgent:
    """
    Procurement Agent
    Responsibilities:
    - understand procurement request
    - retrieve relevant information
    - call required agents
    - produce final recommendation
    """
    def __init__(self):
        self.agent_name = "Procurement Master Agent"

    def execute_procurement_workflow(
        self,
        procurement_data: dict,
        rag_evidence: dict,
        qwen_analysis: dict
    ) -> dict:
        logger.info(f"[{self.agent_name}] Executing master procurement workflow...")

        # 1. Supplier Risk Analysis
        risk_res = supplier_risk_agent.analyze_supplier_risk(procurement_data, rag_evidence)

        # 2. Contract Clause Analysis
        contract_res = contract_agent.analyze_contract_conditions(procurement_data)

        # 3. Recommendation Synthesis
        rec_res = recommendation_agent.synthesize_recommendation(
            procurement_data, risk_res, rag_evidence, qwen_analysis, contract_res
        )

        # 4. Approval Determination
        appr_res = approval_agent.determine_approval(procurement_data, risk_res, rec_res)

        return {
            "master_agent": self.agent_name,
            "risk_analysis": risk_res,
            "contract_analysis": contract_res,
            "recommendation": rec_res,
            "approval_determination": appr_res,
            "agent_summary": f"Completed multi-agent evaluation. Risk: {risk_res['risk_level']} ({risk_res['risk_score']}), Action: {appr_res['approval_status']}"
        }

procurement_agent = ProcurementAgent()
