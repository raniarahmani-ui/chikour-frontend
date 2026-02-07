import React, { useState, useEffect } from "react";
import "../style/CategoriesPage.css";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../swapie_project/components/Sidebar/Adminsidebar.jsx";

const CategoriesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState(null);
  const [deleteCatName, setDeleteCatName] = useState("");
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
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ 
    total_categories: 0, 
    user_added: 0, 
    total_demands: 0, 
    total_services: 0 
  });
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");

  const fetchCategories = async () => {
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const resStats = await fetch(`${API_BASE_URL}/categories.php?endpoint=stats`, { headers });
        const dataStats = await resStats.json();
        if(dataStats.success) setStats(dataStats.data);

        let url = `${API_BASE_URL}/categories.php`;
        if (searchTerm) url += `?search=${searchTerm}`;

        const res = await fetch(url, { headers });
        const data = await res.json();
        
        if (data.success) {
            const cats = data.data.categories || data.data;
            if (Array.isArray(cats)) {
                setCategories(cats.map(c => ({
                    id: c.id,
                    title: c.name || c.title,
                    description: c.description || '',
                    icon: c.icon || '',
                    userAdded: c.is_user_added === 1,
                    activeDemands: c.demand_count || c.activeDemands || 0,
                    inProgress: c.inprogress_count || c.inProgress || 0,
                    totalServices: c.service_count || c.totalServices || 0,
                    status: c.status || 'active',
                    addedDate: c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) : (c.addedDate || '')
                })));
            }
        }

    } catch(e) { console.error(e); }
  };

  useEffect(() => {
      fetchCategories();
  }, []);

  useEffect(() => {
      const timer = setTimeout(() => fetchCategories(), 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddCategory = async () => {
    if(!newCatName) return;
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
        
        const res = await fetch(`${API_BASE_URL}/categories.php?endpoint=create`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ 
                name: newCatName,
                description: newCatDesc,
                icon: newCatIcon || null
            })
        });
        const data = await res.json();
        if(data.success) {
            setNewCatName("");
            setNewCatDesc("");
            setNewCatIcon("");
            setShowAddPopup(false);
            fetchCategories();
        } else {
            alert(data.message || "Failed to add category");
        }
    } catch(e) { console.error(e); }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatId) return;
    try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const res = await fetch(`${API_BASE_URL}/categories.php?id=${deleteCatId}`, {
            method: 'DELETE',
            headers: headers
        });
        const data = await res.json();
        if (data.success) {
            setShowDeletePopup(false);
            setDeleteCatId(null);
            setDeleteCatName("");
            fetchCategories();
        } else {
            alert(data.message || "Failed to delete category");
        }
    } catch(e) { console.error(e); }
  };

  const confirmDelete = (cat) => {
    setDeleteCatId(cat.id);
    setDeleteCatName(cat.title);
    setShowDeletePopup(true);
  };

  return (
    <div className="categories-container">
      {sidebarVisible && <AdminSidebar activePage="category" />}

      <main
        className={`categories-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
      >
        <nav className="categories-navbar">
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
              <h2>Category Management</h2>
              <span className="currentDate">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          
          <div className="nav-right">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="category-search"
            />
            <button
              className="add-category-btn"
              onClick={() => setShowAddPopup(true)}
            >
              + Add Category
            </button>
          </div>
        </nav>

        <div className="categories-main">
          <div className="categories-stats">
            <div className="stat-box">
              <span>Total Categories</span>
              <h3>{stats.total_categories}</h3>
            </div>
            <div className="stat-box">
              <span>User Added</span>
              <h3>{stats.user_added}</h3>
            </div>
            <div className="stat-box">
              <span>Total Demands</span>
              <h3>{stats.total_demands}</h3>
            </div>
            <div className="stat-box">
              <span>Total Services</span>
              <h3>{stats.total_services}</h3>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="category-card">
                <div className="category-card-header">
                  <h3>{cat.title}</h3>
                  <span className={`category-status ${cat.status}`}>
                    {cat.status}
                  </span>
                </div>
                {cat.icon && <span className="category-icon">{cat.icon}</span>}
                {cat.description && <p className="category-desc">{cat.description}</p>}
                {cat.userAdded && (
                  <span className="user-added-badge">User Added</span>
                )}
                <p>Active Demands: {cat.activeDemands}</p>
                <p>Active (In Progress): {cat.inProgress}</p>
                <p>Total Services: {cat.totalServices}</p>
                <p className="added-date">Added {cat.addedDate}</p>
                <div className="category-actions">
                  <button
                    className="delete-category-btn"
                    onClick={() => confirmDelete(cat)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showAddPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <h3>Add New Category</h3>
                <button className="popup-close" onClick={() => setShowAddPopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    placeholder="Enter category name"
                    className="new-category-input"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Enter category description"
                    className="new-category-input"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="form-group">
                  <label>Icon (emoji or icon name)</label>
                  <input
                    type="text"
                    placeholder="e.g. 🎨 or icon-name"
                    className="new-category-input"
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                  />
                </div>
              </div>
              <div className="popup-footer">
                <button
                  className="close-btn"
                  onClick={() => setShowAddPopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="add-category-btn-submit"
                  onClick={handleAddCategory}
                >
                  Create Category
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeletePopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <h3>Delete Category</h3>
                <button className="popup-close" onClick={() => setShowDeletePopup(false)}>×</button>
              </div>
              <div className="popup-body">
                <p>Are you sure you want to delete the category <strong>"{deleteCatName}"</strong>?</p>
                <p style={{ color: '#888', fontSize: '13px' }}>This action cannot be undone.</p>
              </div>
              <div className="popup-footer">
                <button
                  className="close-btn"
                  onClick={() => setShowDeletePopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="delete-category-btn"
                  onClick={handleDeleteCategory}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoriesPage;