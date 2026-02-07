import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Adminsidebar.css";

import Logo from "../../assets/images/logo.svg";
import dashboard from "../../assets/admin_icons/dashboard.svg";
import usermanagement from "../../assets/admin_icons/Users.svg";
import disputes from "../../assets/admin_icons/AlertTriangle.svg";
import coin from "../../assets/admin_icons/Coins.svg";
import list from "../../assets/admin_icons/list.svg";
import report from "../../assets/admin_icons/BarChart3.svg";
import SwapieText from "../../assets/images/swapie_text.svg";
import category from "../../assets/user_icons/search.svg";

function AdminSidebar({ activePage = "dashboard" }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(activePage);
  const [disputeCount, setDisputeCount] = useState(0);

  useEffect(() => {
    const fetchDisputeCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/stats.php', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success && result.data.reports !== undefined) {
          setDisputeCount(result.data.reports);
        } else {
          setDisputeCount(0);
        }
      } catch (error) {
        console.error("Failed to fetch dispute count:", error);
        setDisputeCount(0);
      }
    };

    fetchDisputeCount();
  }, []);

  const menuItems = [
    { id: "dashboard", icon: dashboard, label: "Dashboard", badge: null },
    {
      id: "usermanagement",
      icon: usermanagement,
      label: "User Management",
      badge: null,
    },
    {
      id: "disputes",
      icon: disputes,
      label: "Reports",
      badge: disputeCount > 0 ? disputeCount : null,
    },
    { id: "coin", icon: coin, label: "Coin Transactions", badge: null },
    { id: "list", icon: list, label: "Service Listing", badge: null },
    { id: "browse", icon: report, label: "Browse Services", badge: null },
    { id: "category", icon: category, label: "Categories", badge: null },
  ];

  const adminRouteMap = {
    dashboard: "/webbis/transactions",
    usermanagement: "/webbis/user-management",
    disputes: "/swapie/manage-reports",
    coin: "/swapie/transactions",
    list: "/webbis/service-management",
    browse: "/swapie-app/Services",
    report: "/swapie/manage-reports",
    category: "/webbis/CategoriesPage",
  };

  const handleMenuClick = (menuId) => {
    const target = adminRouteMap[menuId];
    if (target) {
      setActiveMenu(menuId);
      navigate(target);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/");
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <img
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/")}
          src={Logo}
          alt="Swapie Logo"
          className="sidebar-main-logo"
        />
        <div className="sidebar-title">
          <img
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
            src={SwapieText}
            alt="Swapie"
            className="SwapieText"
          />
          <span>Admin Panel</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeMenu === item.id ? "active" : ""}`}
            onClick={() => handleMenuClick(item.id)}
          >
            <img src={item.icon} alt={item.label} className="menu-icon" />
            <span className="menu-label">{item.label}</span>
            {item.badge && <span className="badge">{item.badge}</span>}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-profile">
          <div className="footer-avatar">AD</div>
          <div className="footer-info">
            <h4>Administrator</h4>
            <span>admin@swapie.com</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="16 17 21 12 16 7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="21"
              y1="12"
              x2="9"
              y2="12"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
