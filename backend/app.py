from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from generate_pdf import create_pdf
import os, json, pytz, uuid, traceback
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database import collection, get_conversation, save_conversation
from google.generativeai import configure, GenerativeModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

VISITOR_DATA_FILE = "submissions.json"

# Load environment variables
load_dotenv()
configure(api_key=os.getenv("GEMINI_API_KEY"))

# Models
model = GenerativeModel("gemini-1.5-flash")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Directories
PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

app = Flask(__name__)
CORS(app)

# Load system prompt
def load_system_prompt():
    try:
        with open("system_prompt.txt", "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""

# Semantic similarity check
def is_semantically_in_scope(text, reference, threshold=0.14):
    try:
        embeddings = embedder.encode([text, reference])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        print(f"Semantic similarity: {similarity:.2f}")
        return similarity > threshold
    except Exception as e:
        print("Semantic similarity check failed:", e)
        return False

# 🧠 Chat Endpoint
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json()
        user_msg = (data.get("message") or "").strip()
        thread_id = (data.get("thread_id") or "").strip()

        if not user_msg:
            return jsonify({"error": "Message cannot be empty"}), 400

        # Check if response already cached
        if thread_id:
            cached = collection.find_one({
                "thread_id": thread_id,
                "query": user_msg,
                "timestamp": {"$gt": datetime.now(pytz.utc) - timedelta(hours=24)}
            })
            if cached:
                return jsonify({
                    "reply": cached["response"],
                    "thread_id": thread_id
                })

        # New session if no thread
        thread_id = thread_id or str(uuid.uuid4())
        system_prompt = load_system_prompt()

        # Build conversation history
        history = []
        if system_prompt:
            history.append({"role": "user", "parts": system_prompt})

        past_msgs = get_conversation(thread_id)
        for msg in past_msgs:
            history.append({"role": "user", "parts": msg["query"]})
            history.append({"role": "model", "parts": msg["response"]})

        # Add current user message
        history.append({"role": "user", "parts": user_msg})

        # Generate reply from Gemini
        try:
            chat_session = model.start_chat(history=history)
            response = chat_session.send_message(user_msg)
            bot_reply = response.text.strip() if response.text else "I can help with Codepackers products and services."

            # Final semantic scope filtering
            reference = " ".join([msg["parts"] for msg in history if msg["role"] in ("user", "model")])
            if not is_semantically_in_scope(user_msg, reference):
                bot_reply = "I'm here to assist with Codepackers-related queries. For anything else, please contact support."

        except Exception as e:
            print("Gemini API error:")
            traceback.print_exc()
            bot_reply = "Our AI service is temporarily unavailable."

        # Save to DB
        save_conversation(thread_id, user_msg, bot_reply)

        return jsonify({
            "reply": bot_reply,
            "thread_id": thread_id
        })

    except Exception as e:
        print("Unhandled /chat error:")
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error",
            "retry_suggestion": "Please try again later"
        }), 500


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
        visitors.sort(key=lambda x: x.get("timestamp") or "")
        return jsonify(visitors)
    except Exception as e:
        print("Error in /api/visitors:", e)
        return jsonify({'success': False, 'message': 'Error fetching data'}), 500

@app.route('/api/send-query-email', methods=['POST'])
def send_query_email():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        message = data.get('message', '').strip()
        if not all([name, email, phone, message]):
            return jsonify({'success': False, 'message': 'Missing fields'}), 400
        EMAIL_USER = os.getenv('EMAIL_USER')
        EMAIL_PASS = os.getenv('EMAIL_PASS')
        RECEIVER_EMAIL = os.getenv('RECEIVER_EMAIL')
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"New Visitor Query from {name}"
        body = f"""You have received a new query:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nMessage: {message}"""
        msg.attach(MIMEText(body, 'plain'))
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()
        timestamp = datetime.now(pytz.timezone("Asia/Kolkata")).isoformat()
        query_id = str(uuid.uuid4())[:8]
        data_entry = {
            "name": name,
            "email": email,
            "phone": phone,
            "message": message,
            "source": "email",
            "timestamp": timestamp,
            "queryId": query_id,
            "queryMethod": ["email"]
        }
        if not os.path.exists(VISITOR_DATA_FILE):
            with open(VISITOR_DATA_FILE, 'w') as f:
                json.dump([], f)
        with open(VISITOR_DATA_FILE, 'r+') as f:
            try:
                existing = json.load(f)
            except:
                existing = []
            existing.append(data_entry)
            f.seek(0)
            json.dump(existing, f, indent=4)
            f.truncate()
        return jsonify({'success': True})
    except Exception as e:
        print("Error sending email:", e)
        return jsonify({'success': False, 'message': 'Failed to send email'}), 500

@app.route('/api/log-whatsapp-query', methods=['POST'])
def log_whatsapp_query():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email') or ""
        phone = data.get('phone')
        message = data.get('message', '').strip()
        if not all([name, phone]):
            return jsonify({'success': False, 'message': 'Missing fields'}), 400
        timestamp = datetime.now(pytz.timezone("Asia/Kolkata")).isoformat()
        query_id = str(uuid.uuid4())[:8]
        data_entry = {
            "name": name,
            "email": email,
            "phone": phone,
            "message": message,
            "source": "whatsapp",
            "timestamp": timestamp,
            "queryId": query_id,
            "queryMethod": ["whatsapp"]
        }
        if not os.path.exists(VISITOR_DATA_FILE):
            with open(VISITOR_DATA_FILE, 'w') as f:
                json.dump([], f)
        with open(VISITOR_DATA_FILE, 'r+') as f:
            try:
                existing = json.load(f)
            except:
                existing = []
            existing.append(data_entry)
            f.seek(0)
            json.dump(existing, f, indent=4)
            f.truncate()
        return jsonify({'success': True, 'queryId': query_id})
    except Exception as e:
        print("Error in /api/log-whatsapp-query:", e)
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)