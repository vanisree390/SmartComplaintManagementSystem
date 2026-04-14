import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'classifier.pkl')

_pipeline = None

def load_model():
    global _pipeline
    if _pipeline is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                "Model not found. Run 'python train_model.py' first."
            )
        _pipeline = joblib.load(MODEL_PATH)
    return _pipeline

def predict_department(text: str) -> dict:
    pipeline = load_model()
    department = pipeline.predict([text])[0]
    confidence = round(float(pipeline.predict_proba([text]).max()) * 100, 2)
    return {
        "department": department,
        "confidence": confidence
    }