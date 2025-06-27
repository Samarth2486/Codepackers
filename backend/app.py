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

# Firebase + Gemini setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
configure(api_key=GEMINI_API_KEY)
model = GenerativeModel("gemini-1.5-flash")

# PDF and data file path
PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")
VISITOR_DATA_FILE = os.getenv("VISITOR_DATA_FILE", "visitors.json")

# Create directory if doesn't exist
if not os.path.exists(PDF_DIR):
    os.makedirs(PDF_DIR)

# Flask App Init
app = Flask(__name__)
CORS(app)

# Helper: find existing visitor by email or phone
def find_existing_visitor(existing, email, phone):
    return next((v for v in existing if v['email'] == email or v['phone'] == phone), None)

# ✅ NEW strict helper: match only if both email AND phone match
def find_strict_match(existing, email, phone):
    return next((v for v in existing if v['email'] == email and v['phone'] == phone), None)
# -----------------------------------
# ROUTES
# -----------------------------------

@app.route('/')
def home():
    return "Codepackers Backend Running ✅"

# ✅ Gemini Chat Route
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

        previous = list(collection.find({"thread_id": thread_id}).sort("_id", 1))
        context = []
        for msg in previous[-10:]:
            context.append({"role": "user", "parts": msg["query"]})
            context.append({"role": "model", "parts": msg["response"]})

        gemini_input = context + [{"role": "user", "parts": user_message}]
        response = model.generate_content(gemini_input)
        bot_reply = response.text

        collection.insert_one({
            "thread_id": thread_id,
            "query": user_message,
            "response": bot_reply
        })

        return jsonify({"reply": bot_reply, "thread_id": thread_id})

    except Exception as e:
        print(f"Error in /api/chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/messages', methods=['POST'])
def receive_visitor():
    try:
        data = request.get_json()

        if not all(k in data for k in ('name', 'email', 'phone')):
            return jsonify({'success': False, 'message': 'Missing fields'}), 200

        india_timezone = pytz.timezone("Asia/Kolkata")
        timestamp = datetime.now(india_timezone).isoformat()
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

            # ✅ Only skip if both email & phone match
            # ❌ NO need to match — always log every new query
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

        # Email setup
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

            # ❌ NO need to match — always log every new query
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

        if not all([name, email, phone]):
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

            # ❌ NO need to match — always log every new query
            existing.append(data_entry)


            f.seek(0)
            json.dump(existing, f, indent=4)
            f.truncate()

        return jsonify({'success': True, 'queryId': query_id})

    except Exception as e:
        print("Error in /api/log-whatsapp-query:", e)
        return jsonify({'success': False, 'message': 'Internal server error'}), 500


# ✅ Run server
if __name__ == '__main__':
    app.run(debug=True, port=5000)