"""Quick test for the supplier entity extraction logic."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import joblib, pandas as pd
from pathlib import Path

DEPT_MAP = [
    ("HRTC",            "HP Road Transport Corporation"),
    ("HPSEBL",          "HP State Electricity Board"),
    ("HPRIDC",          "HP Road Infrastructure Dev Corp"),
    ("HPPWD",           "HP Public Works Department"),
    ("HIMUDA",          "HP Housing & Urban Dev Authority"),
    ("HPMC",            "HP Horticulture Produce Mktg Corp"),
    ("SJVN",            "SJVN Limited"),
    ("BBMB",            "Bhakra Beas Management Board"),
    ("NHAI",            "National Highways Authority of India"),
    ("Jal Shakti",      "Jal Shakti Vibhag"),
    ("IPH",             "Irrigation & Public Health Dept"),
    ("Police",          "HP Police Department"),
    ("Forest",          "HP Forest Department"),
    ("Animal Husbandry","Animal Husbandry Department"),
    ("Agriculture",     "Agriculture Department"),
    ("Tourism",         "HP Tourism Department"),
    ("Municipal",       "Municipal Corporation"),
    ("Panchayat",       "Panchayati Raj Department"),
    ("School",          "HP Education Department"),
    ("Hospital",        "HP Health & Medical Education"),
    ("Health",          "HP Health & Medical Education"),
    ("Education",       "HP Education Department"),
    ("Irrigation",      "Irrigation & Public Health Dept"),
    ("PWD",             "Public Works Department"),
    ("Bridge",          "Public Works Department"),
    ("Road",            "Public Works Department"),
]

def extract_entity(title):
    t = str(title).lower()
    for kw, name in DEPT_MAP:
        if kw.lower() in t:
            return name
    return "Other HP Government Departments"

docs_path = Path(__file__).resolve().parent.parent.parent / "models" / "rag" / "enriched_rag_documents.pkl"
df = joblib.load(str(docs_path))
df["_entity"] = df["tender_title"].apply(extract_entity)

grouped = df.groupby("_entity").agg(
    total_tenders=("tender_title", "count"),
    total_value=("tender_value_amount", lambda x: float(x.dropna().sum())),
    avg_tenderers=("tender_numberOfTenderers", lambda x: float(x.dropna().mean()) if x.dropna().size > 0 else 1.0),
    category=("tender_mainProcurementCategory", lambda x: str(x.mode().iloc[0]))
).reset_index().sort_values("total_tenders", ascending=False)

print(f"Total unique entities: {len(grouped)}")
print()
for _, row in grouped.iterrows():
    avg_t = round(float(row["avg_tenderers"]), 1)
    n = int(row["total_tenders"])
    risk = round(max(0.12, min(0.88, 1.0 - (0.05 * avg_t + 0.02 * n))), 2)
    print(f"  {row['_entity']:<45}  tenders={n:4d}  avg_tenderers={avg_t:4.1f}  risk={risk}  cat={row['category']}")
