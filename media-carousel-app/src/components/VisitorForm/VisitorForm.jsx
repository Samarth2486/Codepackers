import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "./VisitorForm.css";

const VisitorForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const saved = localStorage.getItem("visitorFormSubmitted");
    const savedPdf = localStorage.getItem("visitorFormPdf");
    if (saved === "true" && savedPdf) {
      setFormSubmitted(true);
      setPdfUrl(savedPdf);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const nameRegex = /^[^\d]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!nameRegex.test(formData.name)) {
      setErrorMsg("Name must not contain numbers.");
      setLoading(false);
      return;
    }
    if (!emailRegex.test(formData.email)) {
      setErrorMsg("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (!phoneRegex.test(formData.phone)) {
      setErrorMsg("Phone number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending:", JSON.stringify(formData));

      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const filename = res.headers
        .get("Content-Disposition")
        ?.split("filename=")[1]
        ?.replace(/"/g, "");

      if (!filename) throw new Error("Filename missing");

      const blobUrl = window.URL.createObjectURL(blob);

      setFormSubmitted(true);
      setPdfUrl(blobUrl);
      localStorage.setItem("visitorFormSubmitted", "true");
      localStorage.setItem("visitorFormPdf", blobUrl);
    } catch (err) {
      console.warn("Backend not reachable or failed:", err);
      setErrorMsg(
        "⚠️ Not able to connect to backend. Showing dummy form success."
      );
      setFormSubmitted(true);
      setPdfUrl(""); // no PDF fallback
      localStorage.setItem("visitorFormSubmitted", "true");
      localStorage.removeItem("visitorFormPdf");
    }

    setLoading(false);
  };

  const handleReset = () => {
    setFormSubmitted(false);
    localStorage.removeItem("visitorFormSubmitted");
    localStorage.removeItem("visitorFormPdf");
    setFormData({ name: "", email: "", phone: "" });
    setErrorMsg("");
    setPdfUrl("");
  };

  return (
    <motion.div
      className="visitor-form-container"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <h2>Get Access to Our PDF</h2>

      {!formSubmitted ? (
        <form onSubmit={handleSubmit} className="visitor-form">
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Your Phone Number"
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </form>
      ) : (
        <div className="download-section">
          <p>Thank you! You can now download the PDF:</p>
          {pdfUrl ? (
            <a href={pdfUrl} download target="_blank" rel="noopener noreferrer">
              <button type="button">Download PDF</button>
            </a>
          ) : (
            <p style={{ color: "orange" }}>
              (No PDF available - backend might not be reachable.)
            </p>
          )}
          <button onClick={handleReset}>Submit Another Response</button>
        </div>
      )}
    </motion.div>
  );
};

export default VisitorForm;
