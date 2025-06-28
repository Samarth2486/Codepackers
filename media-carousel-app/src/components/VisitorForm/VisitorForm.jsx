import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { GithubAuthProvider } from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../../firebase";
import {
  signInWithPopup,
  signInWithPhoneNumber,
  linkWithCredential,
  RecaptchaVerifier,
} from "firebase/auth";
import "./VisitorForm.css";

const VisitorForm = (props) => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [fullPhone, setFullPhone] = useState("");
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [pdfFilename, setPdfFilename] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false); // ✅ New
  const [queryMessage, setQueryMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState(""); // ✅ New
  const [showToast, setShowToast] = useState(false);
  const [sendingQuery, setSendingQuery] = useState(false);
  const { t } = useTranslation();
  const recaptchaRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const saved = localStorage.getItem("visitorFormSubmitted");
    const savedPdf = localStorage.getItem("visitorFormPdf");
    if (saved === "true") {
      setFormSubmitted(true);
      if (savedPdf) setPdfFilename(savedPdf);
    }

    if (window.location.hostname === "localhost") {
      try {
        auth.settings.appVerificationDisabledForTesting = true;
      } catch (err) {
        console.warn("Firebase test-mode setup failed:", err.message);
      }
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  useEffect(() => {
  const interval = setInterval(() => {
    const phoneInput = document.querySelector(".react-tel-input input");
    if (phoneInput && phoneInput.placeholder !== "Your 10-digit phone number") {
      phoneInput.placeholder = "Your 10-digit phone number"; // ✅ Force override
      clearInterval(interval);
    }
  }, 100); // Check every 100ms

  return () => clearInterval(interval);
}, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFormData((prev) => ({
      ...prev,
      name: user.displayName || "",
      email: user.email || "",
    }));

      setGoogleUser(user);
      setIsGoogleSignedIn(true);
      setErrorMsg("");
    } catch (error) {
      setErrorMsg("Google Sign-In failed. Try again.");
    }
  };

  const handleGitHubLogin = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const user = result.user;

    setFormData((prev) => ({
      ...prev,
      name: user.displayName || "",
      email: user.email || "",
    }));

    setGoogleUser(user);
    setIsGoogleSignedIn(true);
    setErrorMsg("");
  } catch (error) {
    console.error("GitHub Sign-in error:", error.code, error.message);

    if (error.code === "auth/account-exists-with-different-credential") {
      const pendingCred = GithubAuthProvider.credentialFromError(error);
      const email = error.customData?.email;

      setErrorMsg(`This email is already used with Google. Please sign in with Google first.`);

      // ✅ Suggest user to manually sign in with Google
      // OR trigger the Google popup in a chained function (via user event only)
    } else {
      setErrorMsg("GitHub Sign-In failed. Try again.");
    }
  }
};


  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            setErrorMsg("reCAPTCHA expired. Please try again.");
            window.recaptchaVerifier = null;
          },
        }
      );
    }
    return window.recaptchaVerifier;
  };

  const sendOTP = async () => {
    const phoneNumber = "+" + fullPhone.replace(/[^\d]/g, "");
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    setOtpLoading(true);
    setErrorMsg("");
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      const appVerifier = setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setFormData((prev) => ({ ...prev, phone: phoneNumber }));
    } catch (err) {
      if (err.code === "auth/quota-exceeded") {
        setErrorMsg("SMS quota exceeded. Try again later.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many requests. Try again later.");
      } else {
        setErrorMsg(err.message || "Failed to send OTP. Try again.");
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg("Please enter a valid 6-digit OTP.");
      return;
    }
    setOtpLoading(true);
    setErrorMsg("");
    try {
      await window.confirmationResult.confirm(otpCode);
      setIsPhoneVerified(true);
    } catch (err) {
      setErrorMsg("OTP verification failed. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg("");

  if (!isGoogleSignedIn || !isPhoneVerified) {
    setErrorMsg("Please verify Google and phone before submitting.");
    setLoading(false);
    return;
  }

  const payload = {
    name: googleUser?.displayName || formData.name,
    email: googleUser?.email || formData.email,
    phone: formData.phone,
    queryMethod: [], // ✅ no message in this context
    source: "form",
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success || !data.pdf) throw new Error("API failed");

    setFormSubmitted(true);
    setPdfFilename(data.pdf);
    localStorage.setItem("visitorFormSubmitted", "true");
    localStorage.setItem("visitorFormPdf", data.pdf);
    localStorage.setItem("visitorData", JSON.stringify(payload));

    // ✅ Callback to notify parent (e.g. ChatWidget) of successful verification
    if (props.onVerified) props.onVerified();

  } catch (err) {
    setErrorMsg(t("form.errors.fallback"));
    setFormSubmitted(true);
    setPdfFilename("");
  }

  setLoading(false);
};



  const handleReset = () => {
    setFormData({ name: "", email: "", phone: "" });
    setFullPhone("");
    setOtpCode("");
    setOtpSent(false);
    setIsGoogleSignedIn(false);
    setIsPhoneVerified(false);
    setFormSubmitted(false);
    setPdfFilename("");
    setErrorMsg("");
    localStorage.removeItem("visitorFormSubmitted");
    localStorage.removeItem("visitorFormPdf");
  };

  const sendQueryToBackend = async () => {
  setSendingQuery(true);
  const saved = JSON.parse(localStorage.getItem("visitorData") || "{}");

  try {
    const res = await fetch(`${API_BASE_URL}/api/send-query-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      name: saved.name,
      email: saved.email,
      phone: saved.phone,
      message: queryMessage,
      queryMethod: ["email"],   // ✅ Important
      source: "form"
    }),

    });
    const result = await res.json();
    if (result.success) {
      setShowEmailModal(false);
      setShowToast(true);
      setQueryMessage("");
      setTimeout(() => setShowToast(false), 3000);
    } else {
      alert("Failed to send email. Please try again.");
    }
  } catch (err) {
    alert("Something went wrong.");
  }
  setSendingQuery(false);
};

const sendWhatsAppQuery = async () => {
  const saved = JSON.parse(localStorage.getItem("visitorData") || "{}");
  const messageTrimmed = whatsappMessage.trim();

  if (!saved.name || !saved.email || !saved.phone || !messageTrimmed) {
    alert("Missing saved form data or message");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/log-whatsapp-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saved.name,
        email: saved.email,
        phone: saved.phone,
        message: messageTrimmed,
        queryMethod: ["whatsapp"],
        source: "form"
      }),
    });

    const data = await res.json();
    if (!data.success || !data.queryId) throw new Error("Logging failed");

    // ✅ ENCODE the full message
    const text = encodeURIComponent(
      `Hello Team,\n\nVisitor Details:\nName: ${saved.name}\nEmail: ${saved.email}\nPhone: ${saved.phone}\nQuery ID: ${data.queryId}\n\nMessage:\n${messageTrimmed}`
    );

    // ✅ Open WhatsApp AFTER API success
    const url = `https://wa.me/919835775694?text=${text}`;
    window.open(url, "_blank");

    setWhatsappMessage("");
    setShowWhatsappModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  } catch (err) {
    alert("Failed to send WhatsApp query.");
  }
};


  return (
    <motion.div
      className="visitor-form-container"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <h2 className="form-heading">{t("form.heading")}</h2>
<p className="form-subtext">{t("form.subtext")}</p>





      {!formSubmitted ? (
        <>
          {!isGoogleSignedIn && (
  <div className="social-auth-group">
    <button className="google-signin-btn" onClick={handleGoogleLogin}>
      <img
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="G"
        className="google-logo"
      />
      Sign in with Google
    </button>

    <button className="github-signin-btn" onClick={handleGitHubLogin}>
      <img
        src="https://img.icons8.com/ios-filled/50/000000/github.png"
        alt="GitHub"
        className="google-logo"
      />
      Sign in with GitHub
    </button>
  </div>
)}
          <form onSubmit={handleSubmit} className="visitor-form">
            <input type="text" placeholder={t("form.name")} value={formData.name} readOnly required />
            <input type="email" placeholder={t("form.email")} value={formData.email} readOnly required />
            
            <PhoneInput
  country={"in"}
  value={fullPhone}
  onChange={(phone) => setFullPhone(phone)}
  placeholder={t("form.phone_placeholder")}
  disableCountryCode={false}
  disableDropdown={false}
  inputProps={{
    name: "phone",
    required: true,
    autoFocus: false,
  }}
  isValid={() => true} // Optional: force valid
/>


            <small className="privacy-note">We'll only use this for OTP verification. No spam, ever.</small>
            {!otpSent && !isPhoneVerified && (
              <button type="button" onClick={sendOTP} className="otp-btn" disabled={!fullPhone}>
                {otpLoading ? t("form.sending") : t("form.send_otp")}
              </button>
            )}
            {otpSent && !isPhoneVerified && (
              <div className="otp-verify-group">
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={verifyOTP}
                  className="verify-btn"
                  disabled={otpLoading || otpCode.length < 6}
                >
                  {otpLoading ? t("form.verifying") : t("form.verify_otp")}
                </button>
              </div>
            )}
            <div id="recaptcha-container" ref={recaptchaRef}></div>
            <motion.button
  whileTap={{ scale: 0.97 }}
  whileHover={{ scale: 1.03 }}
  transition={{ type: "spring", stiffness: 300 }}
  className="submit-btn"
  disabled={!isPhoneVerified || loading}
>
  {loading ? t("form.submitting") : t("form.submit")}
</motion.button>


            {errorMsg && <p className="error">{errorMsg}</p>}
          </form>
        </>
      ) : (
        <div className="download-section">
          <p className="thank-you-text">{t("form.pdf_ready")}</p>

          {pdfFilename ? (
            <a
              href={`${API_BASE_URL}/static/pdfs/${pdfFilename}`}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              
              <button className="download-btn">{t("form.download_pdf")}</button>
              <p className="pdf-note">{t("form.pdf_note")}</p>
            </a>
          ) : (
            <p className="fallback">{t("form.no_pdf")}</p>
          )}
          <button className="reset-btn" onClick={handleReset}>
            {t("form.submit_another")}
          </button>

          {/* 🔽 QUERY SECTION */}
          <div className="query-section">
            <p className="query-text">{t("form.query_prompt")}</p>
            <div className="contact-options">
              <div className="contact-method">
                <button className="contact-button" onClick={() => setShowEmailModal(true)}>
                  <img src="https://img.icons8.com/ios-filled/50/1f3c88/new-post.png" alt="Mail" className="contact-icon" />
                  <span className="contact-label">{t("form.contact_mail")}</span>
                </button>
              </div>
              <div className="contact-method">
                <button className="contact-button" onClick={() => setShowWhatsappModal(true)}>
                  <img src="https://img.icons8.com/ios-filled/50/1f3c88/whatsapp.png" alt="WhatsApp" className="contact-icon" />
                  <span className="contact-label">{t("form.contact_mail")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ EMAIL MODAL */}
      {showEmailModal && (
  <div className="email-modal-overlay">
    <div className="email-modal">
      <h3>{t("form.query_modal_title")}</h3>

      <textarea
        rows={5}
        value={queryMessage}
        onChange={(e) => setQueryMessage(e.target.value)}
        placeholder={t("form.query_placeholder")}
      />

      <div className="email-modal-buttons">
        <button
          className="modern-send-btn"
          onClick={sendQueryToBackend}
          disabled={sendingQuery}
        >
          {sendingQuery ? t("form.sending") : t("form.send_email")}
        </button>

        <button
          className="modern-cancel-btn"
          onClick={() => setShowEmailModal(false)}
        >
          {t("form.cancel")}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ✅ WHATSAPP MODAL */}
      {showWhatsappModal && (
  <div className="email-modal-overlay">
    <div className="email-modal">
      <h3>{t("form.whatsapp_modal_title")}</h3>

      <textarea
        rows={5}
        value={whatsappMessage}
        onChange={(e) => setWhatsappMessage(e.target.value)}
        placeholder={t("form.whatsapp_placeholder")}
      />

      <div className="email-modal-buttons">
        <button className="modern-send-btn" onClick={sendWhatsAppQuery}>
          {t("form.send_whatsapp")}
        </button>

        <button
          className="modern-cancel-btn"
          onClick={() => setShowWhatsappModal(false)}
        >
          {t("form.cancel")}
        </button>
      </div>
    </div>
  </div>
)}


      {showToast && (
        <div className="toast-message">{t("form.toast_success")}</div>
      )}
    </motion.div>
  );
};

export default VisitorForm;
