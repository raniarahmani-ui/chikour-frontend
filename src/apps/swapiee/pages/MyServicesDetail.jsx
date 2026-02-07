import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ServiceDetail from "../components/ServiceDetail";
import Report from "../components/reports";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";
import "../styles/MyServicesDetail.css";

const API_BASE = "/api";

export default function MyServices() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromServiceManagement = location.state?.fromServiceManagement;
  const serviceId = location.state?.serviceId;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(!(window.innerWidth <= 768));
  const [service, setService] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) setSidebarVisible(false);
      else if (!mobile && !sidebarVisible) setSidebarVisible(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarVisible]);

  useEffect(() => {
    if (!serviceId) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const resAll = await fetch(`${API_BASE}/services/recent?limit=100`);
        const dataAll = await resAll.json();
        if (dataAll.success) {
          const found = (dataAll.data || []).find(s => s.id == serviceId);
          if (found) setService(found);
        }

        const resRatings = await fetch(`${API_BASE}/ratings/service/${serviceId}`);
        const dataRatings = await resRatings.json();
        if (dataRatings.success) {
          setRatings(dataRatings.data?.ratings || dataRatings.data || []);
          if (dataRatings.data?.summary) setRatingSummary(dataRatings.data.summary);
        }
      } catch (e) {
        console.error("Failed to fetch service data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [serviceId]);

  const handleBuyService = async () => {
    if (buying || !serviceId) return;
    setBuying(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/transactions.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ service_id: serviceId, type: "service_payment", amount: service?.price || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Service purchased! The provider has been notified.");
      } else {
        alert(data.message || "Failed to purchase service.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setBuying(false);
    }
  };

  const avgRating = ratingSummary?.average_rating || (ratings.length > 0 ? (ratings.reduce((a, r) => a + (r.rating || 0), 0) / ratings.length).toFixed(1) : "0");

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <UserSidebar activePage="browseservices" />}

      <main className={`manage-reports-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}>
        <nav className="reports-navbar">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
              </svg>
            </button>
            {fromServiceManagement ? <h1>The Service</h1> : <h1>Service Detail</h1>}
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            {loading && <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>}
            {!loading && !service && <p style={{ color: "#999", textAlign: "center", padding: "40px" }}>Service not found.</p>}
            {!loading && service && (
              <>
                <ServiceDetail service={service} />

                <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                  <button
                    onClick={handleBuyService}
                    disabled={buying}
                    style={{ padding: "10px 24px", background: "#1c3f3a", color: "#fff", border: "none", borderRadius: "8px", cursor: buying ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}
                  >
                    {buying ? "Processing..." : `Buy Service (${service.price || 0} pts)`}
                  </button>
                  <button
                    onClick={() => navigate("/minouchati/chat")}
                    style={{ padding: "10px 24px", background: "#f0f0f0", color: "#1c3f3a", border: "1px solid #ccc", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                  >
                    Message Provider
                  </button>
                  <button
                    onClick={() => navigate("/webbis/rating", { state: { serviceId: service.id } })}
                    style={{ padding: "10px 24px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                  >
                    Rate Service
                  </button>
                  <button
                    onClick={() => navigate("/webbis/rating", { state: { reportOnly: true, serviceId: service.id } })}
                    style={{ padding: "10px 24px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
                  >
                    Report
                  </button>
                </div>

                <div className="ratings-header" style={{ display: "flex", gap: "20px", marginTop: "30px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "20px", fontWeight: "600", color: "#1C3F3A" }}>Ratings</span>
                  <div className="orders-info">
                    <span className="star">★</span>
                    <span>{avgRating}</span>
                    <span className="orders-count">{ratings.length} review{ratings.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="reports-list">
                  {ratings.length === 0 && <p style={{ color: "#999" }}>No ratings yet.</p>}
                  {ratings.map((r, i) => <Report key={r.id || i} rating={r} />)}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}