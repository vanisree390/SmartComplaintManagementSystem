from flask import Flask, request, jsonify
from flask_cors import CORS
from complaint_model import predict_department, load_model

app = Flask(__name__)
CORS(app)

# Load model once at startup
try:
    load_model()
    print("Model loaded successfully.")
except FileNotFoundError as e:
    print(f"WARNING: {e}")

@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'ML model running', 'model': 'TF-IDF + Naive Bayes'})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({'error': 'Missing field: text'}), 400

    text = data['text'].strip()
    if not text:
        return jsonify({'error': 'Text cannot be empty'}), 400

    if len(text) < 3:
        return jsonify({'error': 'Text too short to classify'}), 400

    try:
        result = predict_department(text)
        return jsonify(result)
    except FileNotFoundError as e:
        return jsonify({'error': str(e)}), 503
    except Exception as e:
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(port=8000, debug=True)