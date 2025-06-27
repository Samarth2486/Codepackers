import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";

// Define API URL here (outside component)
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const [visitorData, setVisitorData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [selectedSource, setSelectedSource] = useState("all");
  const rowsPerPage = 5;

  const dummyVisitors = [];

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn");
    if (loggedIn !== "true") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const expiryTime = localStorage.getItem("sessionExpiry");
    if (expiryTime) {
      const interval = setInterval(() => {
        if (Date.now() > Number(expiryTime)) {
          localStorage.removeItem("loggedIn");
          localStorage.removeItem("sessionExpiry");
          setSessionExpired(true);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/visitors`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        if (Array.isArray(data)) {
          data.sort(
            (a, b) =>
              new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
          );
          setVisitorData(data);
          setFilteredData(data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.warn("⚠️ Backend unreachable. Using dummy data.", err);
        setVisitorData(dummyVisitors);
        setFilteredData(dummyVisitors);
        setError("⚠️ Backend not connected. Showing dummy data.");
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("sessionExpiry");
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = visitorData.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.email.toLowerCase().includes(query)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const downloadCSV = () => {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `visitors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const chartData = filteredData.reduce((acc, curr) => {
    const date = curr.timestamp
      ? new Date(curr.timestamp).toLocaleDateString()
      : "Unknown";
    const existing = acc.find((item) => item.date === date);
    if (existing) existing.count += 1;
    else acc.push({ date, count: 1 });
    return acc;
  }, []);

  const handleModalClose = () => {
    setSessionExpired(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Visitor Submissions</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="table-wrapper">
        <div className="dashboard-tools">
          <div className="stats-box">
            👥 Total Visitors: {filteredData.length}
          </div>
          <input
            type="text"
            placeholder="Search by Name or Email"
            value={searchQuery}
            onChange={handleSearch}
          />
          <select
            value={selectedSource}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSource(val);
              const filtered = visitorData
                .filter((v) =>
                  val === "all" ? true : (v.source || "form") === val
                )
                .filter(
                  (v) =>
                    v.name.toLowerCase().includes(searchQuery) ||
                    v.email.toLowerCase().includes(searchQuery)
                );
              setFilteredData(filtered);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Sources</option>
            <option value="form">Form</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <button onClick={downloadCSV}>Export CSV</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : filteredData.length === 0 ? (
          <p>No matching visitors found.</p>
        ) : (
          <>
            <table className="visitor-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Submitted At</th>
                  <th>Query ID</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((visitor, index) => (
                  <tr
                    key={index}
                    className={visitor.source === "whatsapp" ? "whatsapp-row" : ""}
                  >
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>{visitor.name}</td>
                    <td>{visitor.email}</td>
                    <td>{visitor.phone}</td>
                    <td>
                      {visitor.timestamp
                        ? new Date(visitor.timestamp).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="query-methods-cell">
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(visitor.queryMethod) &&
                            visitor.queryMethod.includes("email")
                          }
                          readOnly
                        />
                        Email
                      </label>{" "}
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(visitor.queryMethod) &&
                            visitor.queryMethod.includes("whatsapp")
                          }
                          readOnly
                        />
                        WhatsApp
                        {Array.isArray(visitor.queryMethod) &&
                          visitor.queryMethod.includes("whatsapp") && (
                            <button
                              className="whatsapp-icon"
                              onClick={() => setSelectedVisitor(visitor)}
                              title="View WhatsApp Query"
                            >
                              🔍
                            </button>
                          )}
                      </label>{" "}
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            !Array.isArray(visitor.queryMethod) ||
                            visitor.queryMethod.length === 0
                          }
                          readOnly
                        />
                        None
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#007BFF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {sessionExpired && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Session Expired</h3>
            <p>Your session has expired. Please login again.</p>
            <button className="modal-btn" onClick={handleModalClose}>
              OK
            </button>
          </div>
        </div>
      )}

      {selectedVisitor && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Query Details</h3>
            <p>
              <strong>Name:</strong> {selectedVisitor.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedVisitor.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedVisitor.phone}
            </p>
            {selectedVisitor.message && (
              <p>
                <strong>Message:</strong> {selectedVisitor.message}
              </p>
            )}
            <p>
              <strong>Timestamp:</strong>{" "}
              {selectedVisitor.timestamp
                ? new Date(selectedVisitor.timestamp).toLocaleString()
                : "N/A"}
            </p>
            {selectedVisitor.queryId && (
              <p>
                <strong>Query ID:</strong> {selectedVisitor.queryId}
              </p>
            )}
            <p>
              <strong>Source:</strong> {selectedVisitor.source || "form"}
            </p>
            <button
              className="modal-btn"
              onClick={() => setSelectedVisitor(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
