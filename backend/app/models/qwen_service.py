import os
import json
import torch
from app.core.config import settings
from app.core.logging_config import logger

class QwenModelNotLoadedException(Exception):
    pass

class QwenService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.adapter_dir = settings.QWEN_ADAPTER_DIR
        self.base_model_name = settings.QWEN_BASE_MODEL
        self.is_loaded = False
        self.load_error = None
        self.adapter_config = {}

    def inspect_adapter(self):
        cfg_path = self.adapter_dir / "adapter_config.json"
        if cfg_path.exists():
            with open(cfg_path, "r", encoding="utf-8") as f:
                self.adapter_config = json.load(f)
            return self.adapter_config
        return {}

    def load_qwen(self):
        self.inspect_adapter()
        
        if not self.adapter_dir.exists():
            self.is_loaded = False
            self.load_error = f"LoRA adapter directory not found at {self.adapter_dir}"
            logger.warning(self.load_error)
            return

        if not self.base_model_name:
            self.is_loaded = False
            self.load_error = "Base model not configured. Set QWEN_BASE_MODEL environment variable with base HuggingFace model ID (e.g. Qwen/Qwen2.5-7B-Instruct)."
            logger.info(f"Qwen adapter found at {self.adapter_dir}. Base model configuration required.")
            return

        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM
            from peft import PeftModel

            logger.info(f"Loading Qwen base model: {self.base_model_name}...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.adapter_dir if (self.adapter_dir / "tokenizer.json").exists() else self.base_model_name,
                trust_remote_code=True
            )

            base_model = AutoModelForCausalLM.from_pretrained(
                self.base_model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True
            )

            logger.info(f"Loading Qwen LoRA adapter from {self.adapter_dir}...")
            self.model = PeftModel.from_pretrained(base_model, str(self.adapter_dir))
            self.model.eval()

            self.is_loaded = True
            self.load_error = None
            logger.info("Successfully loaded Qwen model with LoRA adapter.")
        except Exception as e:
            self.is_loaded = False
            self.load_error = f"Failed to load Qwen base model + LoRA adapter: {str(e)}"
            logger.error(self.load_error)

    def generate_procurement_response(self, query: str, context: str, procurement_data: dict) -> dict:
        if not self.is_loaded or self.model is None or self.tokenizer is None:
            raise QwenModelNotLoadedException(
                f"Qwen LLM is not loaded. {self.load_error}"
            )

        prompt = f"""<|im_start|>system
You are ProcureAI, an expert AI construction procurement intelligence assistant. Analyze the procurement request and context below to return a structured procurement recommendation in valid JSON format.
<|im_end|>
<|im_start|>user
Query: {query}
Procurement Details: {json.dumps(procurement_data)}
RAG Context Documents:
{context}

Provide output as JSON with keys: recommendation, reasoning, risks (list), required_approval (boolean).
<|im_end|>
<|im_start|>assistant
"""
        inputs = self.tokenizer(prompt, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.3,
                top_p=0.9,
                do_sample=True
            )

        response_text = self.tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        
        try:
            parsed = json.loads(response_text)
            return parsed
        except Exception:
            return {
                "recommendation": response_text,
                "reasoning": "Direct model generation",
                "risks": [],
                "required_approval": True
            }

qwen_service = QwenService()
