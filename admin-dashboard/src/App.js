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

const isAuthenticated = () => {
  const loggedIn = localStorage.getItem("loggedIn");
  const expiry = localStorage.getItem("sessionExpiry");
  const now = new Date().getTime();
  return loggedIn === "true" && expiry && now < parseInt(expiry, 10);
};

const AppRoutes = () => {
  const [auth, setAuth] = useState(isAuthenticated());
  const location = useLocation();

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

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
