import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminSidebar from "../../swapie_project/components/Sidebar/Adminsidebar";
import "../styles/Providerpage.css";

export default function SellerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [userServices, setUserServices] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ full_name: "", username: "", email: "", phone: "", bio: "", skills: "" });
  const [saving, setSaving] = useState(false);
  const API_BASE_URL = "/api";

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

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
    if (!userId) return;
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API_BASE_URL}/admin/users.php?search=${userId}&per_page=50`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          const users = data.data.users || [];
          const found = users.find((u) => u.id == userId);
          if (found) {
            setUserData(found);
            setEditData({
              full_name: found.full_name || "",
              username: found.username || "",
              email: found.email || "",
              phone: found.phone || "",
              bio: found.bio || "",
              skills: found.skills || "",
            });
          }
        }
        const resSvc = await fetch(`${API_BASE_URL}/services/recent?limit=50`);
        const dataSvc = await resSvc.json();
        if (dataSvc.success) {
          const filtered = (dataSvc.data || []).filter((s) => s.user_id == userId);
          setUserServices(filtered);
        }
      } catch (e) {
        console.error("Failed to fetch user data", e);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSuspend = async () => {
    if (!userId) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users.php?endpoint=suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        const newStatus = data.data.new_status;
        setUserData((prev) => ({ ...prev, is_active: newStatus === "active" ? 1 : 0, status: newStatus }));
        setPopupMessage(`User has been ${newStatus === "active" ? "activated" : "suspended"} successfully.`);
        setShowPopup(true);
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (e) {
      alert("Network error");
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (data.success) {
        setUserData((prev) => ({ ...prev, ...editData }));
        setShowEditModal(false);
        setPopupMessage("Profile updated successfully.");
        setShowPopup(true);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  const closePopup = () => setShowPopup(false);

  const u = userData || {};
  const isActive = u.is_active == 1 || u.status === "active";
  const initials = u.full_name ? u.full_name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <AdminSidebar activePage="provider" />}

      <main className={`manage-reports-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}>
        <nav className="reports-navbar">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
              </svg>
            </button>
            <h1>Seller Profile</h1>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            {!userId && <p style={{color:"#999", textAlign:"center", padding:"40px"}}>No user selected. Go back and select a user.</p>}
            {userId && !userData && <p style={{textAlign:"center", padding:"40px"}}>Loading...</p>}
            {userData && (
            <div className="profile-page">
              <div className="profile-header">
                <div className="avatar">{initials}</div>
                <div className="profile-info">
                  <h2>{u.full_name || u.username || "Unknown"}</h2>
                  <div className="verified">
                    <span className="badge">{isActive ? "Active" : "Suspended"}</span>
                    <span className="rating">{Number(u.rating || 0).toFixed(1)} ({u.total_ratings || 0})</span>
                  </div>
                  <p className="bio">{u.bio || "No bio provided"}</p>
                  {u.skills && (
                    <div className="tags">
                      {u.skills.split(",").map((s, i) => <span key={i}>{s.trim()}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="services-section">
                <h3>Services</h3>
                <div className="service-list">
                  {userServices.length === 0 && <p style={{color:"#999"}}>No services found</p>}
                  {userServices.map((service) => (
                    <div className="service-card" key={service.id}>
                      <div className="service-left">
                        <div>
                          <h4>{service.title}</h4>
                          <p>{service.views || 0} views - {service.price || 0} pts</p>
                        </div>
                      </div>
                      <div className="service-right">
                        <span className="status">{service.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-box"><span className="icon">Coins</span><h3>{u.coins || 0}</h3><p>Coin Balance</p></div>
                <div className="stat-box"><span className="icon">Services</span><h3>{userServices.length}</h3><p>Services Offered</p></div>
                <div className="stat-box"><span className="icon">Rating</span><h3>{Number(u.rating || 0).toFixed(1)}</h3><p>Rating</p></div>
              </div>

              <div className="contact-card">
                <h3>Contact Information</h3>
                <div className="contact-row">
                  <div className="contact-item"><p className="label">Email</p><p>{u.email || "N/A"}</p></div>
                  <div className="contact-item"><p className="label">Phone</p><p>{u.phone || "N/A"}</p></div>
                </div>
                <div className="contact-row">
                  <div className="contact-item"><p className="label">Join Date</p><p>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "N/A"}</p></div>
                  <div className="contact-item"><p className="label">Last Login</p><p>{u.last_login ? new Date(u.last_login).toLocaleDateString() : "N/A"}</p></div>
                </div>
              </div>

              <div className="actions">
                <button className="msg-btn" onClick={() => navigate("/minouchati/chat")}>Send Message</button>
                <button className="msg-btn" onClick={() => { setEditData({ full_name: u.full_name || "", username: u.username || "", email: u.email || "", phone: u.phone || "", bio: u.bio || "", skills: u.skills || "" }); setShowEditModal(true); }}>
                  Edit Profile
                </button>
                <button className="danger-btn" onClick={handleSuspend}>
                  {isActive ? "Suspend Account" : "Activate Account"}
                </button>
              </div>

              {showPopup && (
                <div className="popupOverlay">
                  <div className="popupContent">
                    <h2>Status Updated</h2>
                    <p>{popupMessage}</p>
                    <button onClick={closePopup}>Close</button>
                  </div>
                </div>
              )}

              {showEditModal && (
                <div className="popupOverlay">
                  <div className="popupContent" style={{ maxWidth: "500px", width: "90%" }}>
                    <h2>Edit User Profile</h2>
                    <form onSubmit={handleEditSave} style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Full Name</span>
                        <input type="text" value={editData.full_name} onChange={(e) => setEditData(p => ({ ...p, full_name: e.target.value }))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Username</span>
                        <input type="text" value={editData.username} onChange={(e) => setEditData(p => ({ ...p, username: e.target.value }))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Email</span>
                        <input type="email" value={editData.email} onChange={(e) => setEditData(p => ({ ...p, email: e.target.value }))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Phone</span>
                        <input type="text" value={editData.phone} onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Skills (comma separated)</span>
                        <input type="text" value={editData.skills} onChange={(e) => setEditData(p => ({ ...p, skills: e.target.value }))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontWeight: "600", fontSize: "13px" }}>Bio</span>
                        <textarea value={editData.bio} onChange={(e) => setEditData(p => ({ ...p, bio: e.target.value }))} rows={3} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", resize: "vertical" }} />
                      </label>
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: "#1c3f3a", color: "#fff", border: "none", borderRadius: "6px", cursor: saving ? "not-allowed" : "pointer" }}>
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: "10px", background: "#eee", color: "#333", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}