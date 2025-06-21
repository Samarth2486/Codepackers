from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from generate_pdf import create_pdf
import os,json,pytz
from datetime import datetime
from dotenv import load_dotenv
from database import collection
# Gemini import
import google.generativeai as genai
print(collection)
# Load environment variables
load_dotenv()

# Setup Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Load Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')  # or 'gemini-1.5-pro'

# PDF directory
PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")

# Ensure PDF_DIR exists
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

# Flask app
app = Flask(__name__)
CORS(app)

# -----------------------------
# ROUTES
# -----------------------------

# Root route
@app.route('/')
def home():
    return "Codepackers Backend Running ✅"

# Chatbot route
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get("message", "")
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Send message to Gemini
        response = model.generate_content(user_message)
        bot_reply = response.text
        collection.insert_one({"query": user_message, "response": bot_reply})

        # Find the document
        result = collection.find_one({"query": user_message})
        print(result)

        return jsonify({"reply": bot_reply})

    except Exception as e:
        print(f"Error in /api/chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

VISITOR_DATA_FILE = os.getenv("VISITOR_DATA_FILE", "visitors.json")
PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")

@app.route('/api/messages', methods=['POST'])
def receive_visitor():
    try:
        print("RAW DATA RECEIVED:", request.data)
        data = request.get_json()
        print(data)
        if not all(k in data for k in ('name', 'email', 'phone')):
            return jsonify({'success': False, 'message': 'Missing fields'}), 200

        # ✅ Add IST timestamp
        india_timezone = pytz.timezone("Asia/Kolkata")
        data['timestamp'] = datetime.now(india_timezone).isoformat()

        if not os.path.exists(VISITOR_DATA_FILE):
            with open(VISITOR_DATA_FILE, 'w') as f:
                json.dump([], f)

        with open(VISITOR_DATA_FILE, 'r+') as f:
            try:
                existing = json.load(f)
            except:
                existing = []
            existing.append(data)
            f.seek(0)
            json.dump(existing, f, indent=4)
            f.truncate()

        filename = create_pdf(data)
        return jsonify({'success': True, 'pdf': filename})

    except Exception as e:
        print("Error in /api/messages:", e)
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

@app.route('/api/download-pdf', methods=['GET'])
def download_pdf():
    try:
        if not os.path.exists(PDF_DIR):
            return jsonify({'success': False, 'message': 'PDF directory not found'}), 404

        files = sorted(os.listdir(PDF_DIR))
        if not files:
            return jsonify({'success': False, 'message': 'No PDF available'}), 404

        latest_pdf = files[-1]
        return send_file(os.path.join(PDF_DIR, latest_pdf), as_attachment=True)

    except Exception as e:
        print("Error in /api/download-pdf:", e)
        return jsonify({'success': False, 'message': 'Could not download PDF'}), 500

@app.route('/api/visitors', methods=['GET'])
def get_visitors():
    try:
        if not os.path.exists(VISITOR_DATA_FILE):
            return jsonify([])

        with open(VISITOR_DATA_FILE, 'r') as f:
            visitors = json.load(f)
        return jsonify(visitors)

    except Exception as e:
        print("Error in /api/visitors:", e)
        return jsonify({'success': False, 'message': 'Error fetching data'}), 500

# -----------------------------
# Run app
# -----------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5000)

