from fpdf import FPDF
import os
from datetime import datetime

def create_pdf(data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    pdf.cell(200, 10, txt="Visitor Details", ln=True, align='C')
    pdf.ln(10)

    for key, value in data.items():
        pdf.cell(200, 10, txt=f"{key.title()}: {value}", ln=True)

    if not os.path.exists('static/pdfs'):
        os.makedirs('static/pdfs')

    filename = f"visitor_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    filepath = os.path.join('static/pdfs', filename)
    pdf.output(filepath)

    return filename