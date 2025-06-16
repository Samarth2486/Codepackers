import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

import LoginForm from "./components/LoginForm";
import Dashboard from "./components/Dashboard";

// Utility function for session validation
const isAuthenticated = () => {
  const loggedIn = localStorage.getItem("loggedIn");
  const expiry = localStorage.getItem("sessionExpiry");
  return loggedIn === "true" && expiry && Date.now() < Number(expiry);
};

const AppRoutes = () => {
  const location = useLocation();
  const [auth, setAuth] = useState(isAuthenticated());

  useEffect(() => {
    setAuth(isAuthenticated());
  }, [location]);

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={auth ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="/login"
        element={auth ? <Navigate to="/dashboard" replace /> : <LoginForm />}
      />
      <Route
        path="/dashboard"
        element={auth ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <Router>
    <AppRoutes />
  </Router>
);

export default App;
