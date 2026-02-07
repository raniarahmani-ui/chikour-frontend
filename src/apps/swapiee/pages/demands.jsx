import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Demand from "../components/demand";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";
import "../styles/Demands.css";

function Demands() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(!(window.innerWidth <= 768));
  const [demands, setDemands] = useState([]);
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
    const fetchDemands = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/demands/recent?limit=20`);
        const data = await res.json();
        if (data.success) {
          setDemands(data.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch demands", e);
      }
    };
    fetchDemands();
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="demands-container">
      {sidebarVisible && <UserSidebar activePage="demands" />}
      
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
              <h2 className="page-title">Community Demands</h2>
              <p className="page-description">
                Browse current requests or add a new demand for the community.
              </p>
            </div>
          </div>
          <div className="searchContainer" style={{marginLeft:"auto"}}>
            <input
              type="text"
              placeholder="Search demands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{padding:"8px 14px",borderRadius:"8px",border:"1px solid #ccc",outline:"none",fontSize:"14px",minWidth:"200px"}}
            />
          </div>
        </nav>

        <div className="demands-main">
          <div className="demand-actions-container">
            <button
              className="add-demand-btn"
              onClick={() => navigate("/webbis/create-demand")}
            >
              + Add Demand
            </button>
          </div>

          <div className="demands-list">
            {(() => {
              const filtered = demands.filter(d => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return (d.title||'').toLowerCase().includes(q) || (d.description||'').toLowerCase().includes(q) || (d.category_name||'').toLowerCase().includes(q);
              });
              if (filtered.length === 0) return <p style={{color:"#999", textAlign:"center", padding:"40px"}}>{searchTerm ? "No demands match your search." : "No demands yet. Be the first to post one!"}</p>;
              return filtered.map((demand) => (
                <Demand key={demand.id} data={demand} />
              ));
            })()}
          </div>
        </div>

      </main>
    </div>
  );
}

export default Demands;