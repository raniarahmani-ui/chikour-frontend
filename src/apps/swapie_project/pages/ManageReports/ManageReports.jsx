import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Sidebar/Adminsidebar";
import "./ManageReports.css";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";

function ManageReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showResolvePopup, setShowResolvePopup] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    resolution_rate: "0%"
  });
  const [dailyChartData, setDailyChartData] = useState([]);
  const [chartWeek, setChartWeek] = useState("this");
  const API_BASE_URL = "/api/admin";

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_BASE_URL}/reports.php`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        
        const mappedReports = data.data.reports.map(r => ({
          id: r.id,
          user: r.reporter_username || "Unknown", 
          type: r.report_type_name || "General",
          status: r.status,
          date: new Date(r.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }),
          description: r.reason + (r.description ? " - " + r.description : "")
        }));
        setReports(mappedReports);
      }

      const resStats = await fetch(`${API_BASE_URL}/reports.php?endpoint=stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const dataStats = await resStats.json();
      if (dataStats.success) {
        const s = dataStats.data;
        const byStatus = s.by_status || {};
        const pending = s.pending_count || byStatus.pending || 0;
        const reviewed = (byStatus.reviewed || 0) + (byStatus.resolved || 0);
        
        const resolvedCount = (byStatus.resolved || 0) + (byStatus.dismissed || 0);
        const totalCount = Object.values(byStatus).reduce((a, b) => a + Number(b), 0);
        const rate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

        setStats({
            total: totalCount,
            pending: pending,
            reviewed: reviewed,
            resolution_rate: `${rate}%`
        });

        if (s.recent_daily && s.recent_daily.length > 0) {
            setDailyChartData(s.recent_daily);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []); 

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarVisible]);

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowViewPopup(true);
  };

  const handleResolveReport = (report) => {
    setSelectedReport(report);
    setShowResolvePopup(true);
  };

  const handleConfirmResolve = async () => {
    if (selectedReport) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/reports.php?id=${selectedReport.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: 'resolved', report_id: selectedReport.id })
        });
        const data = await res.json();
        if (data.success) {
          setShowResolvePopup(false);
          setSelectedReport(null);
          fetchReports();
        } else {
          alert(data.message || "Failed to resolve report");
        }
      } catch (e) {
        console.error("Error resolving report:", e);
        alert("Failed to resolve report");
      }
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/reports.php?id=${reportId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        fetchReports();
      } else {
        alert(data.message || "Failed to delete report");
      }
    } catch (e) {
      console.error("Error deleting report:", e);
      alert("Failed to delete report");
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      (filter === "All" || r.status.toLowerCase() === filter.toLowerCase()) &&
      (r.user.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <AdminSidebar activePage="disputes" />}

      <main
        className={`manage-reports-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
      >
        <nav className="reports-navbar">
          <div className="nav-left">
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {sidebarVisible ? (
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                ) : (
                  <path d="M5 12h14M12 5l7 7-7 7" />
                )}
              </svg>
            </button>
            <h1>Reports</h1>
          </div>

          <div className="nav-center">
            <div className="search-container">
              <svg
                className="search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="nav-right">
            <div className="filter-selector">
              <button
                className={`filter-btn ${filter === "All" ? "active" : ""}`}
                onClick={() => setFilter("All")}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === "pending" ? "active" : ""}`}
                onClick={() => setFilter("pending")}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${
                  filter === "reviewed" ? "active" : ""
                }`}
                onClick={() => setFilter("reviewed")}
              >
                Reviewed
              </button>
            </div>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="section-header">
              <h2>Manage Reports</h2>
              <p className="subtitle">
                View and handle all user reports on Swapie
              </p>
            </div>

            <div className="reports-table">
              <div className="table-header">
                <span>User</span>
                <span>Type</span>
                <span>Status</span>
                <span>Date</span>
                <span>Actions</span>
              </div>

              {filteredReports.map((report) => (
                <div
                  className="table-row"
                  key={report.id}
                >
                  <span className="user-name">{report.user}</span>
                  <span className="report-type">{report.type}</span>
                  <span className={`status ${report.status}`}>
                    {report.status.charAt(0).toUpperCase() +
                      report.status.slice(1)}
                  </span>
                  <span className="date">{report.date}</span>
                  <div className="actions">
                    <button
                      className="view-btn"
                      onClick={(e) => { e.stopPropagation(); handleViewReport(report); }}
                    >
                      View
                    </button>
                    <button
                      className="resolve-btn"
                      onClick={(e) => { e.stopPropagation(); handleResolveReport(report); }}
                    >
                      Resolve
                    </button>
                    <button
                      className="delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="statistics-section">
            <div className="section-header">
              <h2>Report Statistics</h2>
              <div className="stats-tabs">
                <button className="stats-tab active">Weekly Overview</button>
                <div className="period-selector">
                  <button className={`period-tab ${chartWeek === "this" ? "active" : ""}`} onClick={() => setChartWeek("this")}>This week</button>
                  <button className={`period-tab ${chartWeek === "last" ? "active" : ""}`} onClick={() => setChartWeek("last")}>Last week</button>
                </div>
              </div>
            </div>

            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Total Reports</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {stats.pending}
                </div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {stats.reviewed}
                </div>
                <div className="stat-label">Reviewed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.resolution_rate}</div>
                <div className="stat-label">Resolution Rate</div>
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-placeholder">
                {(() => {
                  
                  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                  const offset = chartWeek === "last" ? 7 : 0;
                  const days = [];
                  for (let i = 6 + offset; i >= 0 + offset; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    days.push({
                      key: d.toISOString().split('T')[0],
                      label: dayNames[d.getDay()]
                    });
                  }
                  const dataMap = {};
                  dailyChartData.forEach(r => { dataMap[r.date] = parseInt(r.count); });
                  const values = days.map(d => dataMap[d.key] || 0);
                  const maxVal = Math.max(...values, 1);
                  
                  return (
                    <>
                      <div className="chart-bars">
                        {values.map((val, index) => (
                          <div
                            key={index}
                            className="chart-bar"
                            style={{ height: `${Math.max((val / maxVal) * 100, 3)}%` }}
                            title={`${days[index].key}: ${val} reports`}
                          />
                        ))}
                      </div>
                      <div className="chart-labels">
                        {days.map((day) => (
                          <span key={day.key} className="chart-label">
                            {day.label}
                          </span>
                        ))}
                      </div>
                      {values.every(v => v === 0) && (
                        <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'#999', fontSize:'13px'}}>
                          No reports in the last 7 days
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="divider"></div>
          </div>
        </div>

        {showViewPopup && selectedReport && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <h3>Report Details</h3>
                <button
                  className="popup-close"
                  onClick={() => setShowViewPopup(false)}
                >
                  ×
                </button>
              </div>
              <div className="popup-body">
                <div className="report-detail">
                  <label>User:</label>
                  <span>{selectedReport.user}</span>
                </div>
                <div className="report-detail">
                  <label>Report Type:</label>
                  <span>{selectedReport.type}</span>
                </div>
                <div className="report-detail">
                  <label>Status:</label>
                  <span className={`status ${selectedReport.status}`}>
                    {selectedReport.status.charAt(0).toUpperCase() +
                      selectedReport.status.slice(1)}
                  </span>
                </div>
                <div className="report-detail">
                  <label>Date:</label>
                  <span>{selectedReport.date}</span>
                </div>
                <div className="report-detail full-width">
                  <label>Description:</label>
                  <p>{selectedReport.description}</p>
                </div>
              </div>
              <div className="popup-footer">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowViewPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showResolvePopup && selectedReport && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <h3>Resolve Report</h3>
                <button
                  className="popup-close"
                  onClick={() => setShowResolvePopup(false)}
                >
                  ×
                </button>
              </div>
              <div className="popup-body">
                <p>Are you sure you want to mark this report as resolved?</p>
                <div className="report-detail">
                  <label>User:</label>
                  <span>{selectedReport.user}</span>
                </div>
                <div className="report-detail">
                  <label>Report Type:</label>
                  <span>{selectedReport.type}</span>
                </div>
              </div>
              <div className="popup-footer">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowResolvePopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="action-btn primary"
                  onClick={handleConfirmResolve}
                >
                  Confirm Resolve
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .popup-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 1px solid #f0f0f0;
        }

        .popup-header h3 {
          margin: 0;
          color: #1c3f3a;
          font-size: 18px;
          font-weight: 600;
        }

        .popup-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .popup-close:hover {
          background: #f0f0f0;
          color: #333;
        }

        .popup-body {
          padding: 25px;
        }

        .report-detail {
          display: flex;
          margin-bottom: 15px;
          align-items: flex-start;
        }

        .report-detail.full-width {
          flex-direction: column;
        }

        .report-detail label {
          font-weight: 600;
          color: #1c3f3a;
          width: 100px;
          flex-shrink: 0;
        }

        .report-detail span,
        .report-detail p {
          color: #333;
          flex: 1;
        }

        .report-detail p {
          margin: 5px 0 0 0;
          line-height: 1.5;
          background: #f8f9fa;
          padding: 10px;
          border-radius: 6px;
          border-left: 3px solid #1c3f3a;
        }

        .popup-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px 25px;
          border-top: 1px solid #f0f0f0;
        }
      `}</style>
    </div>
  );
}

export default ManageReports;
