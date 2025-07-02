from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from generate_pdf import create_pdf
import os, json, pytz, uuid, traceback
from datetime import datetime, timedelta
from dotenv import load_dotenv
from database import collection
from google.generativeai import configure, GenerativeModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()

# AI Configuration
configure(api_key=os.getenv("GEMINI_API_KEY"))
model = GenerativeModel("gemini-1.5-flash")
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# Semantic Scope
COMPANY_KNOWLEDGE = [
    "Codepacker Software Solutions - software design and development company",
    "Alaap - enterprise conversational AI platform for chatbots and voice assistants",
    "Pustak - customizable ERP framework for HR, CRM, and project management",
    "Technical support for Codepacker products",
    "AI-powered workflow automation solutions",
    "Enterprise software integration services",
    "Real-time multilingual communication tools",
    "Company leadership: Vikas Tyagi and Sujagya Das Sharma",
    "Why should I use Codepackers services?",
    "What makes Codepackers unique?",
    "How does Codepackers help businesses?",
    "Industries served: e-commerce, healthcare, education, government",
    "Why should I use Codepackers services?",
    "What makes Codepackers unique?",
    "How does Codepackers help businesses?",
    "What are the benefits of using Alaap or Pustak?",
    "How can Codepackers improve my business process?",
    "Why choose Codepackers for software development?",
    "What kind of problems does Codepackers solve?",
    "Tell me about your solutions and value.",
    "What is Alaap?",
    "Explain Pustak framework",
    "Codepacker technical support",
    "AI solutions from Codepacker"
]
COMPANY_EMBEDDINGS = embedder.encode(COMPANY_KNOWLEDGE)

# File paths
PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")
VISITOR_DATA_FILE = os.getenv("VISITOR_DATA_FILE", "visitors.json")
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

app = Flask(__name__)
CORS(app)

def load_system_prompt():
    try:
        with open("system_prompt.txt", "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""

def is_company_related(query):
    try:
        query_embed = embedder.encode([query])
        similarities = cosine_similarity(query_embed, COMPANY_EMBEDDINGS)
        max_sim = np.max(similarities)
        print(f"Semantic match for '{query}': {max_sim:.2f}")
        return bool(max_sim > 0.35)
    except Exception as e:
        print(f"Embedding error: {e}")
        return False

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Invalid or missing JSON body"}), 400

        user_message = (data.get("message") or "").strip()
        thread_id = (data.get("thread_id") or "").strip()

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        thread_id = thread_id or str(uuid.uuid4())

        # Check if similar message exists in this thread
        cached = collection.find_one({
            "thread_id": thread_id,
            "query": user_message,
            "timestamp": {"$gt": datetime.now(pytz.utc) - timedelta(hours=24)}
        })

        if cached:
            return jsonify({"reply": cached["response"], "thread_id": thread_id})

        system_prompt = load_system_prompt()
        chat_history = []

        if system_prompt:
            chat_history.append({"role": "user", "parts": system_prompt})

        past = collection.find({"thread_id": thread_id}).sort("timestamp", -1).limit(5)
        for m in reversed(list(past)):
            chat_history.append({"role": "user", "parts": m["query"]})
            chat_history.append({"role": "model", "parts": m["response"]})

        chat_history.append({"role": "user", "parts": user_message})

        if not is_company_related(user_message):
            bot_reply = "I specialize in Codepacker Software Solutions. Ask about our AI platforms or ERP solutions."
        else:
            try:
                prompt = ""
                if system_prompt:
                    prompt += f"{system_prompt}\n\n"
                for entry in chat_history:
                    role = entry["role"]
                    part = entry["parts"]
                    prompt += f"{'User' if role == 'user' else 'AI'}: {part}\n"
                prompt += "AI:"
                response = model.generate_content(prompt)
                bot_reply = response.text.strip() or "I can help with Codepacker products and services."
                if len(bot_reply.split()) > 80:
                    bot_reply = bot_reply[:500].rsplit(".", 1)[0] + "."
            except Exception as e:
                traceback.print_exc()
                bot_reply = "Our AI service is temporarily unavailable."

        collection.insert_one({
            "thread_id": thread_id,
            "query": user_message,
            "response": bot_reply,
            "timestamp": datetime.now(pytz.utc)
        })

        return jsonify({"reply": bot_reply, "thread_id": thread_id})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": "Service unavailable", "retry_suggestion": "Please try again later"}), 500

@app.route('/api/messages', methods=['POST'])
def receive_visitor():
    try:
        data = request.get_json()
        if not all(k in data for k in ('name', 'email', 'phone')):
            return jsonify({'success': False, 'message': 'Missing fields'}), 200
        timestamp = datetime.now(pytz.timezone("Asia/Kolkata")).isoformat()
        message = data.get("message", "").strip()
        query_id = str(uuid.uuid4())[:8]
        data_entry = {
            "name": data["name"],
            "email": data["email"],
            "phone": data["phone"],
            "timestamp": timestamp,
            "message": message,
            "queryId": query_id,
            "source": "form",
            "queryMethod": []
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
        filename = create_pdf(data_entry)
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