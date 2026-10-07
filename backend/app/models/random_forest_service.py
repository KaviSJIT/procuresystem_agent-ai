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

# 18 features expected by random_forest_preprocessor_final.pkl
RF_FEATURES = [
    'tender_value_amount',
    'tender_numberOfTenderers',
    'tender_tenderPeriod_durationInDays',
    'tender_contractPeriod_durationInDays',
    'item_count',
    'participation_fee_count',
    'total_participation_fee',
    'average_participation_fee',
    'exemption_allowed_count',
    'buyer_party_count',
    'document_count',
    'tender_evaluation_itemWiseTechnicalEvaluationAllowed',
    'tender_procurementMethod',
    'tender_process',
    'tender_mainProcurementCategory',
    'tender_contractType',
    'tender_value_currency',
    'tender_classification_scheme'
]

class RandomForestService:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_names = RF_FEATURES
        self.classes = ['HIGH', 'LOW', 'MEDIUM']
        self.is_loaded = False
        self.load_error = None

    def load_models(self):
        """Load trained Random Forest model and preprocessor once at backend startup."""
        try:
            model_path = settings.RANDOM_FOREST_MODEL_PATH
            prep_path = settings.RANDOM_FOREST_PREPROCESSOR_PATH

            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Random Forest model file not found at {model_path}")
            if not os.path.exists(prep_path):
                raise FileNotFoundError(f"Random Forest preprocessor file not found at {prep_path}")

            self.model = joblib.load(model_path)
            self.preprocessor = joblib.load(prep_path)

            if hasattr(self.preprocessor, "feature_names_in_"):
                self.feature_names = list(self.preprocessor.feature_names_in_)
            if hasattr(self.model, "classes_"):
                self.classes = list(self.model.classes_)

            self.is_loaded = True
            self.load_error = None
            logger.info(
                f"Successfully loaded Random Forest model from {model_path} and preprocessor from {prep_path}. "
                f"Features: {len(self.feature_names)}, Classes: {self.classes}"
            )
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Failed to load Random Forest model/preprocessor: {e}")

    def prepare_input_dataframe(self, procurement_data: dict) -> pd.DataFrame:
        """Map incoming procurement payload to Random Forest preprocessor features."""
        tender_val = float(procurement_data.get("budget", procurement_data.get("tender_value_amount", 0.0)))
        num_tenderers = float(procurement_data.get("num_tenderers", procurement_data.get("tender_numberOfTenderers", 3.0)))
        tender_days = float(procurement_data.get("required_days", procurement_data.get("tender_tenderPeriod_durationInDays", 30.0)))
        contract_days = float(procurement_data.get("contract_duration_days", procurement_data.get("tender_contractPeriod_durationInDays", 180.0)))

        category = str(procurement_data.get("category", procurement_data.get("tender_mainProcurementCategory", "works"))).lower()
        proc_method = str(procurement_data.get("procurement_method", procurement_data.get("tender_procurementMethod", "open"))).lower()
        if "open" in proc_method:
            proc_method = "open"
        elif "limited" in proc_method:
            proc_method = "limited"

        process = str(procurement_data.get("tender_process", "Tender"))
        contract_type = str(procurement_data.get("contract_type", procurement_data.get("tender_contractType", "itemRate")))
        currency = str(procurement_data.get("currency", procurement_data.get("tender_value_currency", "INR")))
        classification = str(procurement_data.get("classification_scheme", procurement_data.get("tender_classification_scheme", "SDGTarget")))

        row_data = {
            'tender_value_amount': [tender_val],
            'tender_numberOfTenderers': [num_tenderers],
            'tender_tenderPeriod_durationInDays': [tender_days],
            'tender_contractPeriod_durationInDays': [contract_days],
            'item_count': [float(procurement_data.get("item_count", 1.0))],
            'participation_fee_count': [float(procurement_data.get("participation_fee_count", 2.0))],
            'total_participation_fee': [float(procurement_data.get("total_participation_fee", 32600.0))],
            'average_participation_fee': [float(procurement_data.get("average_participation_fee", 16300.0))],
            'exemption_allowed_count': [float(procurement_data.get("exemption_allowed_count", 0.0))],
            'buyer_party_count': [float(procurement_data.get("buyer_party_count", 1.0))],
            'document_count': [float(procurement_data.get("document_count", 1.0))],
            'tender_evaluation_itemWiseTechnicalEvaluationAllowed': [str(procurement_data.get("item_tech_eval", "No"))],
            'tender_procurementMethod': [proc_method],
            'tender_process': [process],
            'tender_mainProcurementCategory': [category],
            'tender_contractType': [contract_type],
            'tender_value_currency': [currency],
            'tender_classification_scheme': [classification]
        }
        df = pd.DataFrame(row_data)
        return df[self.feature_names]

    def predict_risk(self, procurement_data: dict) -> dict:
        """
        Predict procurement risk level and confidence using Random Forest.
        Returns LOW, MEDIUM, or HIGH and risk_confidence.
        """
        if not self.is_loaded or self.model is None or self.preprocessor is None:
            raise RuntimeError(f"Random Forest service is not loaded. Error: {self.load_error}")

        df_input = self.prepare_input_dataframe(procurement_data)
        X_trans = self.preprocessor.transform(df_input)

        raw_pred = str(self.model.predict(X_trans)[0])
        probas = self.model.predict_proba(X_trans)[0]
        max_proba = float(np.max(probas))
        risk_confidence = float(round(max_proba * 100.0, 2))

        # Risk score representation for normalized scale (0.0 to 1.0)
        class_proba_map = {cls: float(round(p * 100.0, 2)) for cls, p in zip(self.classes, probas)}
        if raw_pred == "HIGH":
            normalized_score = 0.80
        elif raw_pred == "MEDIUM":
            normalized_score = 0.50
        else:
            normalized_score = 0.20

        prediction_label = f"Random Forest Risk Assessment: {raw_pred} (Confidence: {risk_confidence:.1f}%)"

        return {
            "risk_level": raw_pred,
            "risk_confidence": risk_confidence,
            "confidence": round(max_proba, 4),
            "risk_score": normalized_score,
            "prediction": prediction_label,
            "class_probabilities": class_proba_map,
            "model": "random_forest_procurement_risk_final",
            "features_evaluated": self.feature_names,
            "is_proxy_label": True,
            "note": "Prototype proxy-label procurement risk assessment model. Evaluates procurement parameter risk."
        }

random_forest_service = RandomForestService()
