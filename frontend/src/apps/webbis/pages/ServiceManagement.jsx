import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/ServiceManagement.css";
import up from "../assets/upArrow.png";
import box from "../assets/box.png";
import people from "../assets/people.png";
import guitare from "../assets/guitare.webp";
import yoga from "../assets/yoga.jpg";
import pasta from "../assets/pasta.jpg";
import computer from "../assets/computer.png";
import AdminSidebar from "../../swapie_project/components/Sidebar/Adminsidebar.jsx";
import { MoveLeft } from "lucide-react";

const ServiceManagement = () => {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);

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

  const API_BASE_URL = "/api/admin";
  const [servicesData, setServicesData] = useState([]);
  const [stats, setStats] = useState({ total: 0, waiting: 0, inprogress: 0, suspended: 0, completed: 0 });

  const fetchServices = async () => {
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const resStats = await fetch(`${API_BASE_URL}/services.php?endpoint=stats`, { headers });
        const dataStats = await resStats.json();
        if (dataStats.success) {
            setStats(dataStats.data);
        }

        let statusFilter = "";
        if (activeStatus === "waiting") statusFilter = "waiting";
        if (activeStatus === "Inprogress") statusFilter = "active";
        if (activeStatus === "suspended") statusFilter = "suspended";

        let url = `${API_BASE_URL}/services.php?page=1`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (searchTerm) url += `&search=${searchTerm}`;

        const res = await fetch(url, { headers });
        const data = await res.json();
        
        if (data.success) {

            const imagePool = [pasta, computer, yoga, guitare];
            
            setServicesData(data.data.services.map((s, index) => {

                let displayImage = null;
                if (s.images) {
                    try {
                        const parsed = typeof s.images === 'string' ? JSON.parse(s.images) : s.images;
                        if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
                    } catch (e) {
                        displayImage = s.images; 
                    }
                }
                if (!displayImage || displayImage.length < 5) { 
                    displayImage = imagePool[index % imagePool.length];
                }

                return {
                    id: s.id,
                    title: s.title,
                    description: s.description,
                    category: s.category_name || "General",
                    rating: s.rating_avg || 0,
                    reviews: s.views || 0,
                    price: s.price,
                    image: displayImage, 
                    status: s.status === 'active' ? 'Inprogress' : s.status,
                    startDate: new Date(s.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })
                };
            }));
        }
    } catch (error) {
        console.error("Error fetching services:", error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [activeStatus]);

  useEffect(() => {
     const timer = setTimeout(() => fetchServices(), 500);
     return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTabClick = (status) => {
    setActiveStatus(status);
  };

  const handleSuspend = async (id) => {
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
        
        const res = await fetch(`${API_BASE_URL}/services.php?endpoint=suspend`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ service_id: id })
        });
        const data = await res.json();
        
        if (data.success) {
            setShowPopup(true);
            fetchServices(); 
        }
    } catch (error) {
        console.error("Error updating service:", error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="service-management-container">
      {sidebarVisible && <AdminSidebar activePage="disputes" />}

      <main
        className={`service-management-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
      >
        <nav className="service-management-navbar">
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
            <div className="page-title">
              <span>Service management</span>
              <div className="current-date">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </nav>

        <div className="service-management-main">
          <div className="statistics-grid">
            <div className="stat-card">
              <div>
                <div className="stat-main-content">
                  <div className="stat-description">Total services</div>
                </div>
                <div className="stat-number">{stats.total}</div>
              </div>
              <div>
                <img src={box} alt="box"></img>
              </div>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-main-content">
                  <div className="stat-description">
                    <span>Completed</span>
                  </div>
                </div>
                <div className="stat-number">{stats.completed}</div>
              </div>
              <img src={people} alt="people"></img>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-main-content">
                  <div className="stat-description">
                    <span>In progress</span>
                  </div>
                </div>
                <div className="stat-number">{stats.inprogress}</div>
              </div>
              <img src={up} alt="upArrow"></img>
            </div>
            <div className="stat-card">
              <div>
                <div className="stat-main-content">
                  <div className="stat-description">
                    <span>waiting</span>
                  </div>
                </div>
                <div className="stat-number">{stats.waiting}</div>
              </div>
              <div></div>
            </div>
          </div>

          <div className="status-tabs">
            <button
              className={`status-tab ${
                activeStatus === "all" ? "active-status-tab" : ""
              }`}
              onClick={() => handleTabClick("all")}
            >
              <span className="tab-text">all</span>
              <span className="counter">({stats.total})</span>
            </button>
            <button
              className={`status-tab ${
                activeStatus === "waiting" ? "active-status-tab" : ""
              }`}
              onClick={() => handleTabClick("waiting")}
            >
              <span className="tab-text">waiting</span>
              <span className="counter">({stats.waiting})</span>
            </button>
            <button
              className={`status-tab ${
                activeStatus === "Inprogress" ? "active-status-tab" : ""
              }`}
              onClick={() => handleTabClick("Inprogress")}
            >
              <span className="tab-text">Active</span>
              <span className="counter">({stats.inprogress})</span>
            </button>
            <button
              className={`status-tab ${
                activeStatus === "suspended" ? "active-status-tab" : ""
              }`}
              onClick={() => handleTabClick("suspended")}
            >
              <span className="tab-text">suspended</span>
              <span className="counter">({stats.suspended})</span>
            </button>
          </div>

          <div className="services-grid">
            {servicesData.map((service) => (
              <div key={service.id} className="service-card">
                <div className="pic-info">
                  <div className="service-image-container">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="service-image"
                    />
                  </div>
                  <div className="service-content">
                    <div className="service-header">
                      <h3 className="service-title-text">{service.title}</h3>
                      <span className={`service-status-badge ${service.status === "suspended" ? "status-suspended" : service.status === "Inprogress" ? "status-active" : "status-waiting"}`}>
                        {service.status === "suspended" ? "Suspended" : service.status === "Inprogress" ? "Active" : "Waiting"}
                      </span>
                    </div>
                    <p className="service-description-text">
                      <span>{service.description}</span>
                    </p>
                    <div className="service-meta-info">
                      <div className="service-category">
                        <strong>{service.category}</strong>
                      </div>
                      <div className="service-rating">
                        {service.rating} ({service.reviews})
                      </div>
                      <div className="service-price">
                        Price <span className="price-amount">{service.price}</span>
                      </div>
                    </div>
                    {service.status === "Inprogress" && (
                      <div className="service-start-date">
                        <strong>Start date:</strong> {service.startDate}
                      </div>
                    )}
                  </div>
                </div>

                <div className="service-action-buttons">
                  <button
                    className="action-button secondary-button"
                    onClick={() =>
                      navigate("/swapie-app/my-services-detail", {
                        state: { fromServiceManagement: true },
                      })
                    }
                  >
                    Service Details
                  </button>
                  <button
                    className="action-button secondary-button"
                    onClick={() => navigate("/swapie-app/provider", { state: { userId: service.user_id } })}
                  >
                    See user profile
                  </button>
                  <button
                    className="action-button danger-button"
                    onClick={() => handleSuspend(service.id)}
                  >
                    {service.status === "suspended" ? "Activate" : "Suspend"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showPopup && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h2>Status Changed</h2>
                <p>The service status has been updated successfully.</p>
                <button onClick={closePopup}>Close</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ServiceManagement;