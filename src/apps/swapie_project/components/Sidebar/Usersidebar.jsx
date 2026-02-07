import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Usersidebar.css";

import Logo from "../../assets/images/logo.svg";
import dashboard from "../../assets/user_icons/dashboard.svg";
import profileIcon from "../../assets/user_icons/person.svg";
import coin from "../../assets/user_icons/money.svg";
import list from "../../assets/user_icons/myservices.svg";
import disputes from "../../assets/user_icons/chat.svg";
import report from "../../assets/user_icons/money.svg";
import settings from "../../assets/admin_icons/Settings.svg";
import category from "../../assets/user_icons/search.svg";
import usermanagement from "../../assets/user_icons/demandlist.svg";
import SwapieText from "../../assets/images/swapie_text.svg";

function UserSidebar({ activePage = "profile", onNavigate }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(activePage);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [user, setUser] = useState({
    full_name: "User Name",
    email: "user@swapie.com",
  });

  useEffect(() => {
    const updateFromStorage = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    };

    updateFromStorage();

    window.addEventListener("userUpdate", updateFromStorage);

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/stats.php', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success && result.data.notifications !== undefined) {
          setNotificationCount(result.data.notifications);
        }
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
        setNotificationCount(0);
      }
    };

    fetchUnreadCount();

    return () => {
      window.removeEventListener("userUpdate", updateFromStorage);
    };
  }, []);

  useEffect(() => {
    setActiveMenu(activePage);
  }, [activePage]);

  const menuItems = [
    { id: "profile", icon: dashboard, label: "profile", badge: null },
    { id: "mywallet", icon: coin, label: "My Wallet", badge: null },
    { id: "getcoins", icon: coin, label: "Buy Coins", badge: null },
    { id: "demands", icon: usermanagement, label: "Demands", badge: null },
    { id: "browseservices", icon: category, label: "Browse Services", badge: null },
    {
      id: "notifications",
      icon: disputes,
      label: "Notifications",
      badge: notificationCount > 0 ? notificationCount : null,
    },
    {
      id: "chat",
      icon: disputes,
      label: "Chat",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
    },
    { id: "settings", icon: settings, label: "Settings", badge: null },
  ];

  const routeMap = {
    profile: "/webbis/profile",
    mywallet: "/swapie-app/my-wallet",
    getcoins: "/swapie-app/buy-coins",
    myservices: "/swapie-app/my-services",
    myservicesdetail: "/swapie-app/my-services-detail",
    demands: "/swapie-app/demands",
    browseservices: "/swapie-app/Services",
    notifications: "/swapie-app/notifications",
    transactions: "/swapie-app/transactions",
    chat: "/minouchati/chat",
    settings: "/minouchati/settings",
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    const target = routeMap[menuId];
    if (target) {
      navigate(target);
      onNavigate?.();
    }
  };

  const handleUserProfileClick = () => {
    handleMenuClick("profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <aside className="user-sidebar">
      <div className="sidebar-header">
        <img src={Logo} alt="swapie logo" className="sidebar-main-logo" />
        <div className="sidebar-title">
          <img src={SwapieText} alt="Swapie" className="SwapieText" />
          <span>User Panel</span>
        </div>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeMenu === item.id ? "active" : ""}`}
            onClick={() => handleMenuClick(item.id)}
          >
            <img src={item.icon} alt="" className="menu-icon" />
            <span>{item.label}</span>
            {item.badge !== null && (
              <div className={`badge ${item.badge > 9 ? "badge-large" : ""}`}>
                {item.badge}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-profile" onClick={handleUserProfileClick}>
          <div className="footer-avatar">
            {user.full_name
              ? user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .substring(0, 2)
              : "US"}
          </div>
          <div className="footer-info">
            <h4>{user.full_name || "User Name"}</h4>
            <span>{user.email || "user@swapie.com"}</span>
            <div className="sidebar-coins">
              <span>Coins: {user.coins || 0}</span>
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default UserSidebar;
