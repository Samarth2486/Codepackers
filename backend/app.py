from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from generate_pdf import create_pdf
import os, json, pytz, uuid
from datetime import datetime
from dotenv import load_dotenv
from database import collection
from google.generativeai import configure, GenerativeModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load environment variables
load_dotenv()

# Gemini API Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
configure(api_key=GEMINI_API_KEY)
model = GenerativeModel("gemini-1.5-flash")

PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")
VISITOR_DATA_FILE = os.getenv("VISITOR_DATA_FILE", "visitors.json")
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

app = Flask(__name__)
CORS(app)

# Utility to load system prompt from file
def load_system_prompt():
    try:
        with open("system_prompt.txt", "r", encoding="utf-8") as f:
            return f.read().strip()
    except:
        return ""

@app.route("/")
def home():
    return "Codepackers Backend Running ✅"

# ✅ Chat endpoint: uses context for Codepacker-related queries
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        thread_id = data.get("thread_id")
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        if not thread_id:
            thread_id = str(uuid.uuid4())

        system_prompt = load_system_prompt()

        codepackers_keywords = [
            "codepacker", "codepackers", "erp", "crm", "hr", "ai tool", "enterprise",
            "real estate", "supply chain", "framework", "alaap", "pustak",
            "disaster management", "voice interface", "clinic management",
            "educational institute", "project management", "data analytics",
            "iot", "workflow", "report", "calendar", "dashboard"
        ]

        should_use_context = any(kw in user_message.lower() for kw in codepackers_keywords)

        if should_use_context:
            chat_session = model.start_chat(history=[{"role": "user", "parts": system_prompt}])
            response = chat_session.send_message(user_message)
        else:
            response = model.generate_content(user_message)

        bot_reply = response.text.strip()

        collection.insert_one({
            "thread_id": thread_id,
            "query": user_message,
            "response": bot_reply
        })

        return jsonify({"reply": bot_reply, "thread_id": thread_id})
    except Exception as e:
        print(f"Error in /api/chat: {e}")
        return jsonify({"error": str(e)}), 500

# ✅ Admin API to view/update system prompt
@app.route('/api/admin/system-prompt', methods=['GET', 'POST'])
def manage_system_prompt():
    if request.method == 'GET':
        try:
            prompt = load_system_prompt()
            return jsonify({"prompt": prompt})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    elif request.method == 'POST':
        try:
            data = request.get_json()
            new_prompt = data.get("prompt", "").strip()
            if not new_prompt:
                return jsonify({"error": "Prompt cannot be empty"}), 400
            with open("system_prompt.txt", "w", encoding="utf-8") as f:
                f.write(new_prompt)
            return jsonify({"success": True, "message": "Prompt updated successfully."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# ✅ Form submission and PDF generation
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
