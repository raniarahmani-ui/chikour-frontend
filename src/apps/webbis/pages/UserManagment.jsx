import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../swapie_project/components/Sidebar/Adminsidebar";
import "../style/UserManagement.css";
import people from "../assets/people.png";

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showPopup, setShowPopup] = useState(false);
  const [popupUser, setPopupUser] = useState(null);
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
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });

  const fetchUsers = async () => {
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const resStats = await fetch(`${API_BASE_URL}/users.php?endpoint=stats`, { headers });
        const dataStats = await resStats.json();
        if (dataStats.success) setStats(dataStats.data);

        let statusFilter = "";
        if (activeFilter === "active") statusFilter = "active";

        if (activeFilter === "suspended") statusFilter = "suspended";

        let url = `${API_BASE_URL}/users.php?page=1`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (searchTerm) url += `&search=${searchTerm}`;

        const res = await fetch(url, { headers });
        const data = await res.json();
        
        if (data.success) {
            setUsers(data.data.users.map(u => ({
                id: u.id,
                initials: u.initials || "U",
                name: u.full_name || u.username,
                email: u.email || "No Email",
                status: u.status === "active" ? "active" : "suspended"
            })));
        }
    } catch (error) {
        console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeFilter]);

  useEffect(() => {
     const timer = setTimeout(() => fetchUsers(), 500);
     return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTabClick = (filter) => {
    setActiveFilter(filter);
  };

  const toggleUserStatus = async (id) => {
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
        
        const res = await fetch(`${API_BASE_URL}/users.php?endpoint=suspend`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ user_id: id })
        });
        const data = await res.json();
        
        if (data.success) {
             const updatedUser = users.find(u => u.id === id);
             if(updatedUser) {
                 updatedUser.status = updatedUser.status === "active" ? "suspended" : "active";
                 setPopupUser({ ...updatedUser }); 
                 setShowPopup(true);
                 fetchUsers(); 
             }
        }
    } catch (error) {
        console.error("Failed to toggle status", error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupUser(null);
  };

  return (
    <div className="user-management-container">
      {sidebarVisible && <AdminSidebar activePage="users" />}

      <main
        className={`user-management-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
      >
        <nav className="user-management-navbar">
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
            <div>
              <h1 className="userManagementTitle">User Management</h1>
              <p className="userCount">{stats.total} users</p>
            </div>
          </div>
          
          <div className="searchContainer">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </nav>

        <div className="user-management-main">
          <div className="tabs">
            <button
              className={`tabButton ${
                activeFilter === "all" ? "active" : ""
              }`}
              onClick={() => handleTabClick("all")}
            >
              <span className="tabText">all ({stats.total})</span>
            </button>
            <button
              className={`tabButton ${
                activeFilter === "active" ? "active" : ""
              }`}
              onClick={() => handleTabClick("active")}
            >
              <span className="tabText">
                Active users ({stats.active})
              </span>
            </button>
            <button
              className={`tabButton ${
                activeFilter === "suspended" ? "active" : ""
              }`}
              onClick={() => handleTabClick("suspended")}
            >
              <span className="tabText">
                suspended users ({stats.suspended})
              </span>
            </button>
          </div>

          <div className="usersGrid">
            {users.map((user) => (
              <div key={user.id} className="userCard">
                <div className="userHeader">
                  <div className="user-info">
                    <div className="userprofile">
                        
                         {user.avatar ? <img src={user.avatar} alt="user" /> : (user.profile_image ? <img src={user.profile_image} alt="user" /> : user.initials)}
                    </div>
                    <div className="userMainInfo">
                      <h3 className="userName">{user.name}</h3>
                      <p className="userEmail">{user.email}</p>
                    </div>
                  </div>
                  <div className={`userStatus ${user.status}`}>
                    {user.status}
                  </div>
                </div>
                <div className="userActions">
                  <button
                    className="SeeProfileBtn"
                    onClick={() => navigate("/swapie-app/provider", { state: { userId: user.id } })}
                  >
                    See profile
                  </button>
                  <button
                    className={`suspendAccountBtn ${
                      user.status === "suspended" ? "activateBtn" : ""
                    }`}
                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.status === "suspended"
                      ? "Activate Account"
                      : "Suspend Account"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showPopup && popupUser && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h2>User Status Changed</h2>
              <p>
                The user {popupUser.name} has been{" "}
                {popupUser.status === "active" ? "Activated" : "Suspended"}{ " "}
                successfully.
              </p>
              <button onClick={closePopup}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;