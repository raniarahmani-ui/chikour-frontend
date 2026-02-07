import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MyWallet.css";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";

function Notifications() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const API_BASE_URL = "/api";

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) setSidebarVisible(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarVisible]);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data.notifications || []);
        }
      } catch (e) {
        console.error("Failed to fetch notifications", e);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error(e);
    }
  };

  const getActionForType = (notif) => {
    const type = notif.type || "";
    if (type.includes("message")) return { label: "Reply", path: "/minouchati/chat" };
    if (type.includes("payment") || type.includes("coin") || type.includes("purchase")) return { label: "Go to Wallet", path: "/swapie-app/my-wallet" };
    if (type.includes("service")) return { label: "View Service", path: "/swapie-app/my-services" };
    if (type.includes("report")) return { label: "View Reports", path: "/swapie-app/my-wallet" };
    return { label: "View", path: "/swapie-app/my-wallet" };
  };

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <UserSidebar activePage="notifications" />}

      <main className={`manage-reports-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}>
        <nav className="reports-navbar">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
              </svg>
            </button>
            <h1>Notifications</h1>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "13px", width: "200px" }}
            />
            {notifications.some((n) => !n.is_read) && (
            <button onClick={markAllRead} style={{ background: "#1C3F3A", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
              Mark All Read
            </button>
          )}
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="mywallet-main">
              {(() => {
                const filtered = notifications.filter((n) => {
                  if (!searchTerm) return true;
                  const q = searchTerm.toLowerCase();
                  return (n.title || "").toLowerCase().includes(q) || (n.message || n.content || "").toLowerCase().includes(q) || (n.type || "").toLowerCase().includes(q);
                });
                if (filtered.length === 0) return <p style={{ color: "#999", textAlign: "center", padding: "40px" }}>{searchTerm ? "No notifications match your search." : "No notifications yet."}</p>;
                return filtered.map((notif) => {
                const action = getActionForType(notif);
                return (
                  <div key={notif.id} className="notif-container" style={{ background: notif.is_read ? "#fff" : "#f0f7f5", borderRadius: "12px", padding: "16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px", border: "1px solid #e0e0e0" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1C3F3A", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", flexShrink: 0 }}>
                      {(notif.type || "N")[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: "15px", color: "#1C3F3A" }}>{notif.title || notif.type || "Notification"}</h3>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>{notif.message || notif.content || ""}</p>
                      <span style={{ fontSize: "11px", color: "#999" }}>{notif.created_at ? new Date(notif.created_at).toLocaleString() : ""}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      {!notif.is_read && (
                        <button onClick={() => markAsRead(notif.id)} style={{ background: "transparent", border: "1px solid #1C3F3A", color: "#1C3F3A", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                          Read
                        </button>
                      )}
                      <button onClick={() => navigate(action.path)} style={{ background: "#1C3F3A", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                        {action.label}
                      </button>
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Notifications;