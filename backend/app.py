from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from generate_pdf import create_pdf
import os,json,pytz
import uuid
from datetime import datetime
from dotenv import load_dotenv
from database import collection
# Gemini import
from google.generativeai import configure, GenerativeModel
print(collection)
# Load environment variables
load_dotenv()

# Setup Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
configure(api_key=GEMINI_API_KEY)
# Load Gemini model
model = GenerativeModel("gemini-1.5-flash")


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

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        thread_id = data.get("thread_id")  # 👈 Accept thread_id from frontend

        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # If no thread_id is sent, create one using uuid
        if not thread_id:
            thread_id = str(uuid.uuid4())

        # Fetch previous conversation messages with the same thread_id
        previous = list(collection.find({"thread_id": thread_id}).sort("_id", 1))

        context = []
        for msg in previous[-10:]:  # use only the last 10 for context
            context.append({"role": "user", "parts": msg["query"]})
            context.append({"role": "model", "parts": msg["response"]})

        # Send the message + context to Gemini
        gemini_input = context + [{"role": "user", "parts": user_message}]
        response = model.generate_content(gemini_input)
        bot_reply = response.text

        # Store the new query and response along with thread_id
        collection.insert_one({
            "thread_id": thread_id,
            "query": user_message,
            "response": bot_reply
        })

        # Return bot reply + thread_id back to frontend
        return jsonify({
            "reply": bot_reply,
            "thread_id": thread_id  # 👈 include it in response
        })

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

