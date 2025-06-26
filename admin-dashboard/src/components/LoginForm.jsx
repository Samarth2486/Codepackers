import React, { useState } from "react";
import "./LoginForm.css";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.username === "admin" && formData.password === "admin") {
      const expiryTime = Date.now() + 5 * 60 * 1000; // ⏱️ 5 minutes session
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("sessionExpiry", expiryTime);
      navigate("/dashboard");
    } else {
      setErrorMsg("Invalid username or password. Try again.");
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errorMsg && <p className="error-text">{errorMsg}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
