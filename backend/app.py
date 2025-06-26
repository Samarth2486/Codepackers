from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from generate_pdf import create_pdf
import os, json, pytz, uuid
from datetime import datetime
from dotenv import load_dotenv
from database import collection
from google.generativeai import configure, GenerativeModel

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

        # Fetch past conversation for context
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
        print("RAW DATA RECEIVED:", request.data)
        data = request.get_json()
        print(data)

        if not all(k in data for k in ('name', 'email', 'phone')):
            return jsonify({'success': False, 'message': 'Missing fields'}), 200

        india_timezone = pytz.timezone("Asia/Kolkata")
        timestamp = datetime.now(india_timezone).isoformat()

        data_entry = {
            "name": data["name"],
            "email": data["email"],
            "phone": data["phone"],
            "timestamp": timestamp,
            "queryMethod": ["email"],           # ✅ explicitly mark
            "message": "",                      # ✅ if none provided
            "queryId": "",                      # ✅ not needed here
            "source": "form"                    # ✅ correct origin
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

        # Generate PDF using this cleaned data
        filename = create_pdf(data_entry)
        return jsonify({'success': True, 'pdf': filename})

    except Exception as e:
        print("Error in /api/messages:", e)
        return jsonify({'success': False, 'message': 'Internal server error'}), 500


# ✅ Download the latest PDF
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

# ✅ Fetch all submitted visitors
@app.route('/api/visitors', methods=['GET'])
def get_visitors():
    try:
        if not os.path.exists(VISITOR_DATA_FILE):
            return jsonify([])

        with open(VISITOR_DATA_FILE, 'r') as f:
            visitors = json.load(f)

        # ✅ Safe sort: fallback to "" if timestamp missing or None
        visitors.sort(key=lambda x: x.get("timestamp") or "")

        return jsonify(visitors)

    except Exception as e:
        print("Error in /api/visitors:", e)
        return jsonify({'success': False, 'message': 'Error fetching data'}), 500



import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

@app.route('/api/send-query-email', methods=['POST'])
def send_query_email():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        message = data.get('message')

        if not all([name, email, phone, message]):
            return jsonify({'success': False, 'message': 'Missing fields'}), 400

        EMAIL_USER = os.getenv('EMAIL_USER')
        EMAIL_PASS = os.getenv('EMAIL_PASS')
        RECEIVER_EMAIL = os.getenv('RECEIVER_EMAIL')

        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"New Visitor Query from {name}"

        body = f"""
        You have received a new query:

        Name: {name}
        Email: {email}
        Phone: {phone}
        Message: {message}
        """

        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASS)
        server.send_message(msg)
        server.quit()

        return jsonify({'success': True})

    except Exception as e:
        print("Error sending email:", e)
        return jsonify({'success': False, 'message': 'Failed to send email'}), 500

@app.route('/api/log-whatsapp-query', methods=['POST'])
def log_whatsapp_query():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone')
        message = data.get('message', '').strip()

        if not all([name, email, phone]):
            return jsonify({'success': False, 'message': 'Missing fields'}), 400

        india_timezone = pytz.timezone("Asia/Kolkata")
        timestamp = datetime.now(india_timezone).isoformat()
        query_id = str(uuid.uuid4())[:8]

        # Read existing data
        if not os.path.exists(VISITOR_DATA_FILE):
            with open(VISITOR_DATA_FILE, 'w') as f:
                json.dump([], f)

        with open(VISITOR_DATA_FILE, 'r+') as f:
            try:
                existing = json.load(f)
            except:
                existing = []

            # Check if visitor already exists (by email or phone)
            match = next((v for v in existing if v['email'] == email or v['phone'] == phone), None)

            if match:
                # Update existing visitor
                query_methods = match.get("queryMethod", [])
                if "whatsapp" not in query_methods:
                    query_methods.append("whatsapp")
                match["queryMethod"] = query_methods
                if message:
                    match["message"] = message
                match["queryId"] = query_id
                match["source"] = "whatsapp"
                match["timestamp"] = timestamp
            else:
                # New entry
                new_entry = {
                    "name": name,
                    "email": email,
                    "phone": phone,
                    "message": message,
                    "source": "whatsapp",
                    "timestamp": timestamp,
                    "queryId": query_id,
                    "queryMethod": ["whatsapp"]
                }
                existing.append(new_entry)

            # Save updated data
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