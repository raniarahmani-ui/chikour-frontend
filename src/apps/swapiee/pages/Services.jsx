import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";
import "../styles/Demands.css";

function AllServices() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(!(window.innerWidth <= 768));
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const API_BASE_URL = "/api";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      } else if (!mobile && !sidebarVisible) {
        setSidebarVisible(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/services/recent?limit=50`);
        const data = await res.json();
        if (data.success) {
          setServices(data.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch services", e);
      }
    };
    fetchServices();
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const getDisplayImage = (s) => {
    const raw = s.images || s.image;
    if (!raw) return null;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (e) { }
    return typeof raw === 'string' && raw.length > 3 ? raw : null;
  };

  const filtered = services.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (s.title || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q) || (s.category_name || '').toLowerCase().includes(q);
  });

  return (
    <div className="demands-container">
      {sidebarVisible && <UserSidebar activePage="browseservices" />}

      <main className={`demands-content ${!sidebarVisible ? 'sidebar-hidden' : ''} ${isMobile ? 'mobile' : ''}`}>
        <nav className="demands-navbar">
          <div className="nav-left">
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? (
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                ) : (
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                )}
              </svg>
            </button>
            <div className="demand-header">
              <h2 className="page-title">Browse Services</h2>
              <p className="page-description">
                Explore available services from the community.
              </p>
            </div>
          </div>
          <div className="searchContainer" style={{marginLeft:"auto"}}>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{padding:"8px 14px",borderRadius:"8px",border:"1px solid #ccc",outline:"none",fontSize:"14px",minWidth:"200px"}}
            />
          </div>
        </nav>

        <div className="demands-main">
          <div className="demands-list">
            {filtered.length === 0 && (
              <p style={{color:"#999", textAlign:"center", padding:"40px"}}>
                {searchTerm ? "No services match your search." : "No services available yet."}
              </p>
            )}
            {filtered.map((s) => (
              <div
                key={s.id}
                className="demand-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate("/swapie-app/my-services-detail", { state: { serviceId: s.id } })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/swapie-app/my-services-detail", { state: { serviceId: s.id } }); } }}
              >
                <div className="demand-category">{s.category_name || "Uncategorized"}</div>

                {getDisplayImage(s) && (
                  <div style={{width:"100%",height:"140px",borderRadius:"8px",overflow:"hidden",marginBottom:"8px"}}>
                    <img src={getDisplayImage(s)} alt={s.title} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  </div>
                )}

                <div className="demand-client">
                  <div className="client-avatar">{(s.username || s.user_name || "U")[0].toUpperCase()}</div>
                  <span className="client-name">{s.full_name || s.user_name || s.username || "Anonymous"}</span>
                </div>

                <h3 className="demand-title">{s.title || "Untitled Service"}</h3>
                <p className="demand-description">
                  {s.description ? s.description.substring(0, 120) + (s.description.length > 120 ? "..." : "") : "No description"}
                </p>

                <div className="demand-footer">
                  <span className="demand-points">{s.price || 0} Points</span>
                  {s.rating_avg && <span style={{fontSize:"13px",color:"#666"}}>★ {Number(s.rating_avg).toFixed(1)}</span>}
                </div>

                <div className="demand-actions">
                  <button
                    className="action-btn view-btn"
                    onClick={(e) => { e.stopPropagation(); navigate("/swapie-app/my-services-detail", { state: { serviceId: s.id } }); }}
                  >
                    View Details
                  </button>
                  <button
                    className="action-btn view-btn"
                    onClick={(e) => { e.stopPropagation(); navigate("/swapie-app/provider", { state: { userId: s.user_id } }); }}
                  >
                    Provider
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AllServices;
