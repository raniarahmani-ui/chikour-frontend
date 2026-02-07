import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";
import "../styles/DemandDetail.css";

const API_BASE = "/api";

export default function DemandDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const demandId = location.state?.demandId;
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(!(window.innerWidth <= 768));

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
    if (!demandId) { setLoading(false); return; }
    const fetchDemand = async () => {
      try {
        const res = await fetch(`${API_BASE}/demands/recent?limit=100`);
        const data = await res.json();
        if (data.success) {
          const found = (data.data || []).find(d => d.id == demandId);
          if (found) setDemand(found);
        }
      } catch (e) {
        console.error("Failed to fetch demand", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDemand();
  }, [demandId]);

  const handlePropose = async () => {
    if (proposing || !demandId) return;
    setProposing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/demands/propose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ demand_id: demandId }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Proposal sent! The client has been notified.");
      } else {
        alert(data.message || "Failed to send proposal.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error while sending proposal.");
    } finally {
      setProposing(false);
    }
  };

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const d = demand || {};
  const tags = (() => {
    if (!d.tags) return [];
    try {
      const parsed = typeof d.tags === "string" ? JSON.parse(d.tags) : d.tags;
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();
  const initials = d.full_name ? d.full_name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) : (d.username || "U")[0].toUpperCase();

  return (
    <div className="demands-container">
      {sidebarVisible && <UserSidebar activePage="demands" />}
      <main className={`demands-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}>
        <nav className="demands-navbar">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
              </svg>
            </button>
            <h2 className="page-title">Demand Detail</h2>
          </div>
        </nav>

        <div className="demands-main" style={{ padding: "20px" }}>
          <button className="back-arrow-btn" onClick={() => navigate(-1)}>← Back</button>

          {loading && <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>}
          {!loading && !demand && <p style={{ color: "#999", textAlign: "center", padding: "40px" }}>Demand not found.</p>}
          {!loading && demand && (
            <div className="content-box">
              <span className="category-pill">{d.category_name || "General"}</span>
              <h1 className="demand-title">{d.title || "Untitled Demand"}</h1>

              {tags.length > 0 && (
                <div className="tags-list">
                  {tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
                </div>
              )}

              <h3 className="section-head">What the Client Needs</h3>
              <p className="description">{d.description || "No description provided."}</p>

              <div className="info-grid">
                <div className="info-card teal">
                  <h4>Desired Timeline</h4>
                  <p>{d.deadline || d.timeline || "Flexible"}</p>
                </div>
                <div className="info-card yellow">
                  <h4>Budget</h4>
                  <p>{d.budget || 0} points</p>
                  {d.urgency && <span className="small-text">Urgency: {d.urgency}</span>}
                </div>
                <div className="info-card grey">
                  <h4>Status</h4>
                  <p>{d.status || "open"}</p>
                </div>
              </div>

              <div className="client-card">
                <div className="client-left">
                  <div className="avatar">{initials}</div>
                  <div>
                    <h4>{d.full_name || d.username || "Anonymous"}</h4>
                    <span className="rating">Posted {d.created_at ? new Date(d.created_at).toLocaleDateString() : ""}</span>
                  </div>
                </div>
                <button className="see-profile" onClick={() => navigate("/swapie-app/provider", { state: { userId: d.user_id } })}>See profile</button>
              </div>

              <div className="bottom-actions">
                <button className="msg-btn" onClick={() => navigate("/minouchati/chat")}>Message Client</button>
                <button className="propose-btn" onClick={handlePropose} disabled={proposing}>
                  {proposing ? "Sending..." : "Propose Yourself"}
                </button>
              </div>
              <p className="notify-text">The client will be notified of your proposal</p>

              <div style={{ marginTop: "20px" }}>
                <button
                  className="msg-btn"
                  style={{ background: "#e74c3c", marginRight: "10px" }}
                  onClick={() => navigate("/webbis/rating", { state: { reportOnly: true, demandId: d.id } })}
                >
                  Report
                </button>
                <button
                  className="msg-btn"
                  onClick={() => navigate("/webbis/create-demand", { state: { editDemand: d } })}
                >
                  Edit Demand
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
