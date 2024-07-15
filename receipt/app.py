from flask import Flask, request, render_template, jsonify
from model import process_receipt
from PIL import Image
import io
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    try:
        if 'file' not in request.files:
            logging.error("No file part in the request")
            return jsonify({"error": "No file part in the request"}), 400
        
        file = request.files['file']
        if file.filename == '':
            logging.error("No file selected for uploading")
            return jsonify({"error": "No file selected for uploading"}), 400
        
        image = Image.open(io.BytesIO(file.read()))
        logging.info("Image uploaded and opened successfully")

        result = process_receipt(image)
        logging.info(f"Processed receipt: {result}")

        return jsonify(result)
    except Exception as e:
        logging.exception("Error processing the upload")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
