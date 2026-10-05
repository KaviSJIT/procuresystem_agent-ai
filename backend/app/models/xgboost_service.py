import os
import joblib
import pandas as pd
import numpy as np
import sklearn.compose._column_transformer
from app.core.config import settings
from app.core.logging_config import logger

# Monkey patch _RemainderColsList for scikit-learn compatibility
if not hasattr(sklearn.compose._column_transformer, "_RemainderColsList"):
    class _RemainderColsList(list):
        pass
    sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

class XGBoostService:
    def __init__(self):
        self.model = None
        self.baseline_model = None
        self.feature_names = []
        self.is_loaded = False
        self.load_error = None

    def load_models(self):
        try:
            model_path = settings.XGBOOST_MODEL_PATH
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"XGBoost model file not found at {model_path}")
            
            self.model = joblib.load(model_path)
            self.feature_names = list(getattr(self.model, "feature_names_in_", []))
            
            # Optionally load baseline model if present
            if os.path.exists(settings.XGBOOST_BASELINE_PATH):
                try:
                    self.baseline_model = joblib.load(settings.XGBOOST_BASELINE_PATH)
                except Exception as ex:
                    logger.warning(f"Could not load baseline XGBoost model: {ex}")
            
            self.is_loaded = True
            self.load_error = None
            logger.info(f"Successfully loaded XGBoost model from {model_path}. Features: {self.feature_names}")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load XGBoost model: {e}")

    def predict_procurement_risk(self, procurement_data: dict) -> dict:
        if not self.is_loaded or self.model is None:
            raise RuntimeError(f"XGBoost model is not loaded. Error: {self.load_error}")
        
        # Map input payload to expected 14 features
        budget = float(procurement_data.get("budget", procurement_data.get("tender_value_amount", 5000000.0)))
        category = str(procurement_data.get("category", procurement_data.get("tender_mainProcurementCategory", "works"))).lower()
        proc_method = str(procurement_data.get("procurement_method", procurement_data.get("tender_procurementMethod", "Open")))
        proc_entity = str(procurement_data.get("procuring_entity", procurement_data.get("location", procurement_data.get("tender_procuringEntity_name", "Executive Engineer"))))
        duration_days = float(procurement_data.get("required_days", procurement_data.get("tender_tenderPeriod_durationInDays", 30)))
        contract_days = float(procurement_data.get("contract_duration_days", procurement_data.get("tender_contractPeriod_durationInDays", 180)))
        num_tenderers = float(procurement_data.get("num_tenderers", procurement_data.get("tender_numberOfTenderers", 3)))

        row_data = {
            'tender_procurementMethod': [proc_method],
            'tender_process': [procurement_data.get("tender_process", "Single Stage")],
            'tender_mainProcurementCategory': [category],
            'tender_numberOfTenderers': [num_tenderers],
            'tender_allowPreferentialBidder': [procurement_data.get("allow_preferential", "No")],
            'tender_allowTwoStageBid': [procurement_data.get("allow_two_stage", "No")],
            'tender_value_amount': [budget],
            'tender_evaluation_generalTechnicalEvaluationAllowed': [procurement_data.get("general_tech_eval", "Yes")],
            'tender_evaluation_itemWiseTechnicalEvaluationAllowed': [procurement_data.get("item_tech_eval", "No")],
            'tender_tenderPeriod_durationInDays': [duration_days],
            'tender_contractPeriod_durationInDays': [contract_days],
            'tender_procuringEntity_name': [proc_entity],
            'tender_classification_scheme': [procurement_data.get("classification_scheme", "HP_PUBLIC_WORKS")],
            'tender_value_currency': ['INR']
        }
        
        df_input = pd.DataFrame(row_data)
        
        # Reorder to match exact feature_names_in_ if available
        if self.feature_names:
            for feat in self.feature_names:
                if feat not in df_input.columns:
                    df_input[feat] = ""
            df_input = df_input[self.feature_names]

        # Predict
        raw_pred = self.model.predict(df_input)[0]
        proba = None
        if hasattr(self.model, "predict_proba"):
            proba_arr = self.model.predict_proba(df_input)[0]
            # Assumes class 1 is high risk or class 0 is normal risk
            if len(proba_arr) > 1:
                risk_score = float(proba_arr[1])
            else:
                risk_score = float(proba_arr[0])
        else:
            risk_score = float(raw_pred)

        # Classification level
        if risk_score >= 0.70:
            risk_level = "HIGH"
        elif risk_score >= 0.40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        prediction_label = "High Procurement / Supplier Failure Risk" if raw_pred == 1 or risk_score >= 0.5 else "Low Procurement / Supplier Risk"

        return {
            "risk_score": round(risk_score, 4),
            "risk_level": risk_level,
            "prediction": prediction_label,
            "raw_prediction": int(raw_pred),
            "model": "xgboost_procurement_final",
            "features_evaluated": self.feature_names
        }

xgboost_service = XGBoostService()
