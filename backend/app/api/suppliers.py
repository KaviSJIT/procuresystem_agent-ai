from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import pandas as pd
from app.db.database import get_db
from app.models.rag_service import rag_service
from app.models.xgboost_service import xgboost_service

router = APIRouter(prefix="/api/suppliers", tags=["Supplier Management"])

@router.get("", response_model=List[Dict[str, Any]])
def get_suppliers(
    category: Optional[str] = None,
    min_tenders: Optional[int] = 0,
    search: Optional[str] = None
):
    """
    Derive supplier/procuring-entity performance metrics directly from real trained dataset (rag_dataframe.pkl).
    """
    if not rag_service.is_loaded or rag_service.dataframe is None:
        return []

    df = rag_service.dataframe
    if "tender_procuringEntity_name" not in df.columns:
        return []

    # Group by procuring entity name to extract actual performance metrics
    grouped = df.groupby("tender_procuringEntity_name").agg(
        total_tenders=("tender_title", "count"),
        total_procurement_value=("tender_value_amount", lambda x: float(x.sum()) if pd.notnull(x).any() else 0.0),
        avg_tenderers=("tender_numberOfTenderers", lambda x: float(x.mean()) if pd.notnull(x).any() else 0.0),
        main_category=("tender_mainProcurementCategory", lambda x: str(x.iloc[0]) if len(x) > 0 else "works")
    ).reset_index()

    # Filter out empty or generic placeholders
    suppliers_list = []
    for idx, row in grouped.iterrows():
        entity_name = str(row["tender_procuringEntity_name"]).strip()
        if not entity_name or entity_name in ["nan", "None", ""]:
            continue

        if min_tenders and row["total_tenders"] < min_tenders:
            continue

        if category and category.lower() not in str(row["main_category"]).lower():
            continue

        if search and search.lower() not in entity_name.lower():
            continue

        # Empirical risk calculation derived from average competition & tender count
        avg_tenderers = float(row["avg_tenderers"])
        num_tenders = int(row["total_tenders"])
        
        # High competition / high tender count -> lower risk score
        risk_score = round(max(0.12, min(0.88, 1.0 - (0.05 * avg_tenderers + 0.02 * num_tenders))), 2)
        reliability_score = round(1.0 - risk_score, 2)
        recommendation = "Highly Recommended" if reliability_score >= 0.7 else ("Recommended" if reliability_score >= 0.4 else "Review Required")

        suppliers_list.append({
            "id": f"SUP-{idx+1:04d}",
            "name": entity_name,
            "category": str(row["main_category"]).upper(),
            "risk_score": risk_score,
            "reliability_score": reliability_score,
            "total_tenders": num_tenders,
            "total_procurement_value": float(row["total_procurement_value"]),
            "avg_tenderers_per_contract": round(avg_tenderers, 1),
            "recommendation": recommendation,
            "status": "ACTIVE"
        })

    # Sort by total tenders handled descending
    suppliers_list.sort(key=lambda x: x["total_tenders"], reverse=True)
    return suppliers_list[:100]

@router.post("/analyze")
def analyze_supplier_risk(payload: Dict[str, Any] = Body(...)):
    supplier_name = payload.get("supplier_name", "")
    budget = float(payload.get("budget", 5000000.0))
    category = payload.get("category", "works")

    xgb_result = xgboost_service.predict_procurement_risk({
        "procuring_entity": supplier_name,
        "budget": budget,
        "category": category
    })

    return {
        "supplier_name": supplier_name,
        "risk_assessment": xgb_result,
        "recommendation": "Acceptable Risk Profile" if xgb_result["risk_score"] < 0.5 else "High Supplier Exposure - Escalation Required"
    }
