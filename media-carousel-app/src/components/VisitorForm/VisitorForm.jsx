import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { auth, googleProvider } from "../../firebase";
import {
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import "./VisitorForm.css";

const VisitorForm = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [fullPhone, setFullPhone] = useState(""); // ✅ correct full phone number
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [pdfFilename, setPdfFilename] = useState("");
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

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
      }));
      setIsGoogleSignedIn(true);
      setErrorMsg("");
    } catch (error) {
      console.error("Google login failed:", error.message);
      setErrorMsg("Google Sign-In failed. Try again.");
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: (response) => console.log("reCAPTCHA solved"),
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

      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
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
      setErrorMsg("");
    } catch (err) {
      if (err.code === "auth/invalid-verification-code") {
        setErrorMsg("Invalid OTP.");
      } else if (err.code === "auth/code-expired") {
        setErrorMsg("OTP expired.");
      } else {
        setErrorMsg(err.message || "Verification failed.");
      }
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

    try {
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success || !data.pdf) throw new Error("API failed");

      setFormSubmitted(true);
      setPdfFilename(data.pdf);
      localStorage.setItem("visitorFormSubmitted", "true");
      localStorage.setItem("visitorFormPdf", data.pdf);
    } catch (err) {
      setErrorMsg(t("form.errors.fallback"));
      setFormSubmitted(true);
      setPdfFilename("");
      localStorage.setItem("visitorFormSubmitted", "true");
      localStorage.removeItem("visitorFormPdf");
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

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
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
      <h2>{t("form.heading")}</h2>

      {!formSubmitted ? (
        <>
          {!isGoogleSignedIn && (
            <button className="google-signin-btn" onClick={handleGoogleLogin}>
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="G"
                className="google-logo"
              />
              Sign in with Google
            </button>
          )}

          <form onSubmit={handleSubmit} className="visitor-form">
            <input
              type="text"
              name="name"
              placeholder={t("form.name")}
              value={formData.name}
              readOnly
              required
            />
            <input
              type="email"
              name="email"
              placeholder={t("form.email")}
              value={formData.email}
              readOnly
              required
            />

            <PhoneInput
              country={"in"}
              value={fullPhone}
              onChange={(phone) => setFullPhone(phone)}
              inputClass="phone-custom-input"
              disabled={isPhoneVerified}
            />

            {!otpSent && !isPhoneVerified && (
              <button
                type="button"
                onClick={sendOTP}
                className="otp-btn"
                disabled={!fullPhone}
              >
                {otpLoading ? "Sending..." : "Send OTP"}
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
                  {otpLoading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}

            <div id="recaptcha-container" ref={recaptchaRef}></div>

            <button
              type="submit"
              className={`submit-btn ${
                !isPhoneVerified || loading ? "disabled" : ""
              }`}
              disabled={!isPhoneVerified || loading}
            >
              {loading ? t("form.submitting") : t("form.submit")}
            </button>
            {errorMsg && <p className="error">{errorMsg}</p>}
          </form>
        </>
      ) : (
        <div className="download-section">
          <p>{t("form.success_message")}</p>
          {pdfFilename ? (
            <a
              href={`${API_BASE_URL}/static/pdfs/${pdfFilename}`}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="download-btn">{t("form.download_pdf")}</button>
            </a>
          ) : (
            <p className="fallback">{t("form.no_pdf")}</p>
          )}
          <button className="reset-btn" onClick={handleReset}>
            {t("form.submit_another")}
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default VisitorForm;
