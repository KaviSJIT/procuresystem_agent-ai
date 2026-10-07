from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
import pandas as pd
from app.models.rag_service import rag_service

router = APIRouter(prefix="/api/suppliers", tags=["Supplier Management"])


@router.get("", response_model=List[Dict[str, Any]])
def get_suppliers(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """
    Return individual tender records from the enriched RAG dataset (enriched_rag_documents.pkl).
    Each row = one real HP procurement tender.
    """
    if not rag_service.is_loaded or rag_service.dataframe is None:
        return []

    df = rag_service.dataframe.copy()

    # Apply category filter
    if category:
        df = df[df["tender_mainProcurementCategory"].str.lower() == category.lower()]

    # Apply search filter on tender title
    if search:
        df = df[df["tender_title"].str.lower().str.contains(search.lower(), na=False)]

    records = []
    for i, (_, row) in enumerate(df.iterrows()):
        title = str(row.get("tender_title", "")).strip()
        if not title or title in ("nan", "None"):
            continue

        category_val = str(row.get("tender_mainProcurementCategory", "works")).upper()
        value = float(row["tender_value_amount"]) if pd.notnull(row.get("tender_value_amount")) else 0.0
        num_tenderers = float(row["tender_numberOfTenderers"]) if pd.notnull(row.get("tender_numberOfTenderers")) else 1.0
        proc_method = str(row.get("tender_procurementMethod", "")).strip()
        proc_process = str(row.get("tender_process", "")).strip()

        # Risk score: fewer tenderers = higher risk
        risk_score = round(max(0.12, min(0.88, 1.0 - (0.05 * num_tenderers))), 2)
        reliability_score = round(1.0 - risk_score, 2)
        recommendation = (
            "Highly Recommended" if reliability_score >= 0.7
            else "Recommended" if reliability_score >= 0.4
            else "Review Required"
        )

        records.append({
            "id": f"TND-{i+1:04d}",
            "name": title,
            "category": category_val,
            "procurement_method": proc_method,
            "procurement_process": proc_process,
            "num_tenderers": int(num_tenderers),
            "total_procurement_value": value,
            "risk_score": risk_score,
            "reliability_score": reliability_score,
            "recommendation": recommendation,
        })

    return records
