import { useState, useEffect } from "react";
import "./Settings.css";
import UserSidebar from "../swapie_project/components/Sidebar/Usersidebar";
import AdminSidebar from "../swapie_project/components/Sidebar/Adminsidebar";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [isAdmin, setIsAdmin] = useState(false);

  const [colorMode, setColorMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(!(window.innerWidth <= 768));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    email: "",
    password: "",
    skills: "",
    phone: "",
    bio: ""
  });
  
  const navigate = useNavigate();
  const API_BASE_URL = "/api";

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", colorMode);
    localStorage.setItem("darkMode", colorMode);
  }, [colorMode]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const userData = result.data.user;
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({
          ...storedUser,
          full_name: userData.full_name,
          email: userData.email,
          username: userData.username,
          profile_image: userData.profile_image,
          coins: userData.coins
        }));
        
        window.dispatchEvent(new Event("userUpdate"));
        setEditData({
          full_name: userData.full_name || "",
          email: userData.email || "",
          password: "",
          skills: userData.skills || "",
          phone: userData.phone || "",
          bio: userData.bio || ""
        });
      }
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    
    const userType = localStorage.getItem('userType');
    setIsAdmin(userType === 'admin');
    
    fetchProfile();

    const handleUserUpdate = () => fetchProfile();
    window.addEventListener('userUpdate', handleUserUpdate);

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
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('userUpdate', handleUserUpdate);
    };
  }, [sidebarVisible]);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });
      const result = await response.json();
      if (result.success) {
        
        if (result.data?.user) {
          const u = result.data.user;
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({
            ...storedUser,
            full_name: u.full_name,
            email: u.email,
            username: u.username,
            profile_image: u.profile_image,
            coins: u.coins
          }));
          window.dispatchEvent(new Event("userUpdate"));
        }
        setIsModalOpen(false);
        fetchProfile();
        alert("Profile updated successfully!");
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      alert("Network error occurred.");
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const WalletIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="4"
        width="18"
        height="12"
        rx="2"
        stroke="#95938e"
        strokeWidth="2"
      />
      <path d="M1 8h18" stroke="#95938e" strokeWidth="2" />
      <circle cx="15" cy="13" r="1.5" fill="#95938e" />
    </svg>
  );

  const HistoryIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="10" cy="10" r="8" stroke="#95938e" strokeWidth="2" />
      <polyline
        points="10 6 10 10 14 12"
        stroke="#95938e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const UserIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke="#95938e"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7" r="4" stroke="#95938e" strokeWidth="2" />
    </svg>
  );

  const LockIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="11"
        width="14"
        height="6"
        rx="2"
        stroke="#95938e"
        strokeWidth="2"
      />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="#95938e"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const BellIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 2a6 6 0 0 0-6 6v3l-1 2h16l-1-2v-3a6 6 0 0 0-6-6z"
        stroke="#95938e"
        strokeWidth="2"
      />
      <path d="M10 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#95938e" />
    </svg>
  );

  const MailIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2"
        y="4"
        width="16"
        height="12"
        rx="2"
        stroke="#95938e"
        strokeWidth="2"
      />
      <path
        d="M2 6l8 5 8-5"
        stroke="#95938e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const MoonIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="#95938e"
        strokeWidth="2"
      />
    </svg>
  );

  const EyeIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="#95938e"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="#95938e" strokeWidth="2" />
    </svg>
  );

  const LogOutIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="#1C3F3A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polyline
        points="16 8 20 12 16 16"
        stroke="#1C3F3A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="9"
        y1="12"
        x2="20"
        y2="12"
        stroke="#1C3F3A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const EditIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke="#2d3436"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="settings-container">
      {sidebarVisible && (
        isAdmin ? 
          <AdminSidebar activePage="settings" /> : 
          <UserSidebar activePage="settings" />
      )}

      <main
        className={`settings-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
      >
        
        <nav className="settings-navbar">
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
            <div className="settings-header">
              <h1 className="settings-title">Settings</h1>
              <p className="settings-subtitle">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </nav>

        <div className="settings-main">
          <section className="settings-section">
            <h2 className="section-title">Points & Balance</h2>

            <div className="settings-item">
              <div className="item-left">
                <WalletIcon />
                <div>
                  <p className="item-label">See Points</p>
                  <p className="item-description">
                    View your current points balance
                  </p>
                </div>
              </div>
              <button
                className="action-btn"
                onClick={() => navigate("/swapie-app/my-wallet")}
              >
                View
              </button>
            </div>

            <div className="settings-item">
              <div className="item-left">
                <HistoryIcon />
                <div>
                  <p className="item-label">See Transactions</p>
                  <p className="item-description">
                    View your transaction history
                  </p>
                </div>
              </div>
              <button
                className="history-btn"
                onClick={() => navigate("/swapie-app/my-wallet")}
              >
                History
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h2 className="section-title">Account</h2>

            <div className="settings-item">
              <div className="item-left">
                <UserIcon />
                <div>
                  <p className="item-label">Profile Information</p>
                  <p className="item-description">
                    Update your personal details
                  </p>
                </div>
              </div>
              <button className="edit-btn" onClick={() => setIsModalOpen(true)}>
                <EditIcon />
                Edit
              </button>
            </div>

            <div className="settings-item">
              <div className="item-left">
                <LockIcon />
                <div>
                  <p className="item-label">Password</p>
                  <p className="item-description">Change your password</p>
                </div>
              </div>
              <button className="change-btn">Change</button>
            </div>
          </section>



          <section className="settings-section">
            <h2 className="section-title">Preferences</h2>

            <div className="settings-item">
              <div className="item-left">
                <MoonIcon />
                <div>
                  <p className="item-label">Color mode</p>
                  <p className="item-description">Dark mode</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={colorMode}
                  onChange={() => setColorMode(!colorMode)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-item">
              <div className="item-left">
                <EyeIcon />
                <div>
                  <p className="item-label">Privacy Mode</p>
                  <p className="item-description">Hide your online status</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacyMode}
                  onChange={() => setPrivacyMode(!privacyMode)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </section>

          <div className="logout-section">
            <button className="logout-link" onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userType");
              localStorage.removeItem("user");
              navigate("/");
            }}>
              <LogOutIcon />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="ModalOverlay">
          <div className="EditProfileModal">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSave}>
              <div className="formGroup">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={editData.full_name} 
                  onChange={(e) => setEditData({...editData, full_name: e.target.value})} 
                  required
                />
              </div>
              <div className="formGroup">
                <label>Email</label>
                <input 
                  type="email" 
                  value={editData.email} 
                  onChange={(e) => setEditData({...editData, email: e.target.value})} 
                  required
                />
              </div>
              <div className="formGroup">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={editData.password} 
                  onChange={(e) => setEditData({...editData, password: e.target.value})} 
                  placeholder="Leave empty to keep same"
                />
              </div>
              <div className="formGroup">
                <label>Skills</label>
                <textarea 
                  value={editData.skills} 
                  onChange={(e) => setEditData({...editData, skills: e.target.value})} 
                />
              </div>
              <div className="formGroup">
                <label>Phone</label>
                <input 
                  type="text" 
                  value={editData.phone} 
                  onChange={(e) => setEditData({...editData, phone: e.target.value})} 
                  placeholder="Your phone number"
                />
              </div>
              <div className="formGroup">
                <label>Bio</label>
                <textarea 
                  value={editData.bio} 
                  onChange={(e) => setEditData({...editData, bio: e.target.value})} 
                  placeholder="Tell us about yourself"
                />
              </div>
              <div className="modalButtons">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cancelBtn">Cancel</button>
                <button type="submit" className="saveBtn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}