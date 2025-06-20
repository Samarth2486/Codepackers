from fpdf import FPDF
from datetime import datetime, timezone
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# PDF directory
PDF_DIR = os.getenv("PDF_DIR", "static/pdfs")

def create_pdf(data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Title
    pdf.cell(200, 10, txt="Visitor Details", ln=True, align='C')
    pdf.ln(10)

    # Visitor Data
    for key, value in data.items():
        pdf.cell(200, 10, txt=f"{key.title()}: {value}", ln=True)

    # Ensure directory exists
    if not os.path.exists(PDF_DIR):
        os.makedirs(PDF_DIR)

    # Create timezone-aware timestamped filename
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
    filename = f"visitor_{timestamp}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    # Save PDF
    pdf.output(filepath)

    # Return only filename (NOT full path)
    return filename

