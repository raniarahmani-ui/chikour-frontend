import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../style/profile.css";
import sessions from "../assets/sessions.svg";
import earned from "../assets/earned.svg";
import myServices from "../assets/myServices.png";
import spent from "../assets/spent.svg";
import starIcon from "../assets/Icon.svg";
import editIcon from "../assets/EditIcon.svg";
import deleteIcon from "../assets/DelIcon.svg";
import coinIcon from "../assets/Coin.svg";
import serpic from "../assets/serpic.png";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar.jsx";

const API_BASE_URL = "/api";

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    skills: "",
    phone: "",
    bio: "",
  });
  const [tabSearch, setTabSearch] = useState("");

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoadError("Please sign in to view your profile.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid server response (not JSON)");
      }

      if (response.ok && result.success) {
        setProfile(result.data);

        const userData = result.data.user;
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            ...userData,
          }),
        );
        
        window.dispatchEvent(new Event("userUpdate"));
        setEditData({
          full_name: userData.full_name || "",
          username: userData.username || "",
          email: userData.email || "",
          password: "",
          skills: userData.skills || "",
          phone: userData.phone || "",
          bio: userData.bio || "",
        });
      } else {
        setLoadError(result.message || "Failed to load profile.");
      }
    } catch (error) {
      console.error("Profile load error:", error);
      setLoadError(
        `Connection error: ${error.message}. Check backend logging.`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    
    const userType = localStorage.getItem("userType");
    if (userType === "admin") {
      navigate("/webbis/transactions");
      return;
    }

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

  useEffect(() => {
    fetchProfile();

    const handleUpdate = () => {
      
      if (!loading) fetchProfile();
    };

    window.addEventListener("userUpdate", handleUpdate);
    return () => window.removeEventListener("userUpdate", handleUpdate);
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response received:", text);
        throw new Error("Invalid server response (not JSON)");
      }

      if (response.ok && result.success) {
        
        if (result.data?.user) {
          const u = result.data.user;
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({
            ...storedUser,
            full_name: u.full_name,
            email: u.email,
            username: u.username,
            profile_image: u.profile_image,
            coins: u.coins,
          }));
          window.dispatchEvent(new Event("userUpdate"));
        }
        setIsModalOpen(false);
        fetchProfile();
      } else {
        alert(result.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Network error: Could not connect to the server.");
    }
  };

  const handleDeleteService = async (serviceId, serviceTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${serviceTitle}"?`)) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/services/user-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ service_id: serviceId }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        fetchProfile();
      } else {
        alert(result.message || "Failed to delete service");
      }
    } catch (error) {
      console.error("Delete service error:", error);
      alert("Network error: Could not delete service.");
    }
  };

  const handleDeleteDemand = async (demandId, demandTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${demandTitle}"?`)) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/demands/user-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ demand_id: demandId }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        fetchProfile();
      } else {
        alert(result.message || "Failed to delete demand");
      }
    } catch (error) {
      console.error("Delete demand error:", error);
      alert("Network error: Could not delete demand.");
    }
  };

  const user = profile?.user;
  const stats = profile?.stats || {};
  const servicesData = profile?.services || [];
  const ordersData = profile?.orders || [];
  const demandsData = profile?.demands || [];

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    const first = parts[0]?.[0] || "";
    const second = parts[1]?.[0] || "";
    return `${first}${second}`.toUpperCase() || "U";
  };

  const formatMemberSince = (dateStr) => {
    if (!dateStr) return "Member Since -";
    const date = new Date(dateStr);
    return `Member Since ${date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    })}`;
  };

  const getServiceImage = (images) => {
    if (!images) return serpic;
    try {
      const parsed = typeof images === "string" ? JSON.parse(images) : images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch (e) {
      return serpic;
    }
    return serpic;
  };

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <UserSidebar activePage="profile" />}

      <main
        className={`manage-reports-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}
      >
        <nav className="reports-navbar">
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
            <h1>Profile</h1>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="content">
              {loading && <p>Loading profile...</p>}
              {!loading && loadError && <p className="error">{loadError}</p>}
              {!loading && !loadError && user && (
                <>
                  <div className="ProfileCard">
                    <div className="Userinformation">
                      <div className="ProfilePic">
                        <span>
                          {getInitials(user.full_name || user.username)}
                        </span>
                      </div>
                      <div className="USerDetailed">
                        <div className="Username">
                          <span>{user.full_name || user.username}</span>
                        </div>
                        <div className="SinceWhen">
                          <span>{formatMemberSince(user.created_at)}</span>
                        </div>
                        <div className="Details">
                          <div style={{ marginTop: "1px" }}>
                            <img src={starIcon} alt="star Icon"></img>
                          </div>
                          <div>
                            <span>
                              {Number(user.rating || 0).toFixed(1)} (
                              {user.total_ratings || 0} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="Details" style={{ marginTop: "8px" }}>
                          <div style={{ marginTop: "1px" }}>
                            <img src={coinIcon} alt="coin Icon" style={{ width: "16px" }}></img>
                          </div>
                          <div>
                            <span style={{ fontWeight: "600", color: "#1C3F3A" }}>
                              Balance: {user.coins || 0} Pts
                            </span>
                          </div>
                        </div>
                        {user.skills && (
                          <div className="userSkills">
                            {user.skills.split(",").map((skill, idx) => (
                              <span key={idx} className="skillBadge">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        {user.phone && (
                          <div className="Details" style={{ marginTop: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#555" }}>📞 {user.phone}</span>
                          </div>
                        )}
                        {user.bio && (
                          <div className="Details" style={{ marginTop: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#555", fontStyle: "italic" }}>{user.bio}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        className="editProfileBtn"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <div className="editProfileBtnDiv">
                          <div>
                            <img src={editIcon} alt="edit Icon"></img>
                          </div>
                          <div>
                            <span>Edit Profile</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

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
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  full_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="formGroup">
                            <label>Username (used for login)</label>
                            <input
                              type="text"
                              value={editData.username}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  username: e.target.value,
                                })
                              }
                              placeholder="Your login username"
                            />
                          </div>
                          <div className="formGroup">
                            <label>Email</label>
                            <input
                              type="text"
                              value={editData.email}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  email: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="formGroup">
                            <label>Password</label>
                            <input
                              type="text"
                              value={editData.password}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  password: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="formGroup">
                            <label>Skills</label>
                            <textarea
                              value={editData.skills}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  skills: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="formGroup">
                            <label>Phone</label>
                            <input
                              type="text"
                              value={editData.phone}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="Your phone number"
                            />
                          </div>
                          <div className="formGroup">
                            <label>Bio</label>
                            <textarea
                              value={editData.bio}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  bio: e.target.value,
                                })
                              }
                              placeholder="Tell us about yourself"
                            />
                          </div>
                          <div className="modalButtons">
                            <button
                              type="button"
                              onClick={() => setIsModalOpen(false)}
                              className="cancelBtn"
                            >
                              Cancel
                            </button>
                            <button type="submit" className="saveBtn">
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                    <div className="StatBox" style={{ border: "2px solid #1C3F3A", backgroundColor: "rgba(28, 63, 58, 0.05)" }}>
                      <div className="stat image">
                        <img src={coinIcon} alt="balance" className="earned" style={{ width: "24px" }}></img>
                      </div>
                      <div className="stat">
                        <span className="statLabel" style={{ fontWeight: "700" }}>Available Balance</span>
                        <span className="statValue" style={{ color: "#1C3F3A", fontWeight: "800" }}>
                          {stats.balance || 0} Pts
                        </span>
                      </div>
                    </div>
                    <div className="StatBox">
                      <div className="stat image">
                        <img src={earned} alt="earned" className="earned"></img>
                      </div>
                      <div className="stat">
                        <span className="statLabel">Service Income</span>
                        <span className="statValue" style={{ fontSize: "14px" }}>
                          {stats.total_earned || 0} Pts
                        </span>
                      </div>
                    </div>
                    <div className="StatBox">
                      <div className="stat image">
                        <img src={spent} alt="spent" className="spent"></img>
                      </div>
                      <div className="stat">
                        <span className="statLabel">Total Spent</span>
                        <span className="statValue" style={{ fontSize: "14px" }}>
                          {stats.total_spent || 0} Pts
                        </span>
                      </div>
                    </div>
                    <div className="StatBox">
                      <div className="stat image">
                        <img src={coinIcon} alt="purchased" style={{ width: "20px", opacity: 0.7 }}></img>
                      </div>
                      <div className="stat">
                        <span className="statLabel">Coins Purchased</span>
                        <span className="statValue" style={{ fontSize: "14px" }}>
                          {stats.total_purchased || 0} Pts
                        </span>
                      </div>
                    </div>
                  </div>
                  <hr></hr>

                  <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                    <input
                      type="text"
                      placeholder="Search services, orders, demands..."
                      value={tabSearch}
                      onChange={(e) => setTabSearch(e.target.value)}
                      style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", width: "100%", maxWidth: "400px" }}
                    />
                  </div>

                  <div
                    className="tabs"
                    style={{ marginTop: "10px", width: "500px" }}
                  >
                    <div>
                      <button
                        className={activeTab === 0 ? "tab activeTab" : "tab"}
                        onClick={() => setActiveTab(0)}
                      >
                        <span>My services</span>
                      </button>
                    </div>
                    <div>
                      <button
                        className={activeTab === 1 ? "tab activeTab" : "tab"}
                        onClick={() => setActiveTab(1)}
                      >
                        <span>My Orders</span>
                      </button>
                    </div>
                    <div>
                      <button
                        className={activeTab === 2 ? "tab activeTab" : "tab"}
                        onClick={() => setActiveTab(2)}
                      >
                        <span>My Demands</span>
                      </button>
                    </div>
                  </div>

                  {activeTab === 0 && (
                    <div className="MyServices">
                      {(() => {
                        const filtered = servicesData.filter((service) => {
                          if (!tabSearch) return true;
                          const q = tabSearch.toLowerCase();
                          return (service.title || "").toLowerCase().includes(q) || (service.description || "").toLowerCase().includes(q) || (service.category_name || "").toLowerCase().includes(q);
                        });
                        if (filtered.length === 0) return <p style={{color:"#999", padding:"20px", textAlign:"center"}}>{tabSearch ? "No services match your search." : "No services yet."}</p>;
                        return filtered.map((service) => (
                        <div
                          className="ServiceCard"
                          key={`service-${service.id}`}
                        >
                          <div className="ServiceDescription">
                            <div className="ServicePicCat">
                              <div className="serPic">
                                <img
                                  src={getServiceImage(service.images)}
                                  alt="service picture"
                                ></img>
                              </div>
                              <div className="Categorie">
                                {service.category_name || "Uncategorized"}
                              </div>
                            </div>
                            <div className="TitleDesc">
                              <span>{service.title}</span>
                              <br></br>
                              <span>{service.description}</span>
                            </div>
                          </div>
                          <div className="priceBtns">
                            <div className="Price">
                              <div className="coinIcon">
                                <img
                                  src={coinIcon}
                                  alt="coinIcon"
                                  className="coinIcon"
                                ></img>
                              </div>
                              <div className="pointText">
                                <span>{service.price || 0}pts</span>
                              </div>
                            </div>
                            <div className="Buttons">
                              <div>
                                <button className="editProfileBtn" onClick={() => navigate("/webbis/create-service", { state: { editService: service } })}>
                                  <div className="editProfileBtnDiv">
                                    <div>
                                      <img src={editIcon} alt="edit Icon"></img>
                                    </div>
                                    <div>
                                      <span>Edit</span>
                                    </div>
                                  </div>
                                </button>
                              </div>
                              <div>
                                <button className="deleteBtn" onClick={() => handleDeleteService(service.id, service.title)}>
                                  <div className="deleteBtnDiv">
                                    <div>
                                      <span>Delete Service</span>
                                    </div>
                                    <div>
                                      <img
                                        src={deleteIcon}
                                        alt="deleteIcon"
                                      ></img>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                      })()}
                      <div className="AddService" onClick={() => navigate('/webbis/create-service')} style={{ cursor: 'pointer' }}>
                        <div className="addServiceContent">
                          <div className="addServiceIcon">
                            <span>+</span>
                          </div>
                          <div className="addServiceText">
                            <span className="addServiceTitle">
                              Create New Service
                            </span>
                            <span className="addServiceSubtitle">
                              Start offering your skills
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 1 && (
                    <div className="MyServices">
                      {(() => {
                        const filtered = ordersData.filter((order) => {
                          if (!tabSearch) return true;
                          const q = tabSearch.toLowerCase();
                          return (order.service_title || order.demand_title || "").toLowerCase().includes(q) || (order.notes || "").toLowerCase().includes(q) || (order.type || "").toLowerCase().includes(q);
                        });
                        if (filtered.length === 0) return <p style={{color:"#999", padding:"20px", textAlign:"center"}}>{tabSearch ? "No orders match your search." : "No orders yet."}</p>;
                        return filtered.map((order) => (
                        <div className="ServiceCard" key={`order-${order.id}`}>
                          <div className="ServiceDescription">
                            <div className="ServicePicCat">
                              <div className="serPic">
                                <img src={getServiceImage(order.service_images || order.images)} alt="order picture"></img>
                              </div>
                              <div className="Categorie">
                                {order.type || "Order"}
                              </div>
                            </div>
                            <div className="TitleDesc">
                              <span>
                                {order.service_title ||
                                  order.demand_title ||
                                  "Order"}
                              </span>
                              <br></br>
                              <span>{order.notes || "Order placed"}</span>
                            </div>
                          </div>
                          <div className="priceBtns">
                            <div className="Price">
                              <div className="coinIcon">
                                <img
                                  src={coinIcon}
                                  alt="coinIcon"
                                  className="earned"
                                ></img>
                              </div>
                              <div className="pointText">
                                <span>{order.coins || 0}pts</span>
                              </div>
                            </div>
                            <div className="Buttons">
                              <div>
                                <button className="editProfileBtn" onClick={() => navigate("/swapie-app/my-services-detail", { state: { orderId: order.id } })}>
                                  <div className="editProfileBtnDiv">
                                    <div>
                                      <img src={editIcon} alt="edit Icon"></img>
                                    </div>
                                    <div>
                                      <span>View Details</span>
                                    </div>
                                  </div>
                                </button>
                              </div>
                              <div>
                                <button className="deleteBtn" onClick={() => {
                                  if (!window.confirm("Cancel this order?")) return;
                                  
                                  navigate("/swapie-app/my-wallet");
                                }}>
                                  <div className="deleteBtnDiv">
                                    <div>
                                      <span>Cancel Order</span>
                                    </div>
                                    <div>
                                      <img
                                        src={deleteIcon}
                                        alt="deleteIcon"
                                      ></img>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                      })()}
                    </div>
                  )}

                  {activeTab === 2 && (
                    <div className="MyServices">
                      {(() => {
                        const filtered = demandsData.filter((demand) => {
                          if (!tabSearch) return true;
                          const q = tabSearch.toLowerCase();
                          return (demand.title || "").toLowerCase().includes(q) || (demand.description || "").toLowerCase().includes(q) || (demand.category_name || "").toLowerCase().includes(q);
                        });
                        if (filtered.length === 0) return <p style={{color:"#999", padding:"20px", textAlign:"center"}}>{tabSearch ? "No demands match your search." : "No demands yet."}</p>;
                        return filtered.map((demand) => (
                        <div
                          className="ServiceCard"
                          key={`demand-${demand.id}`}
                        >
                          <div className="ServiceDescription">
                            <div className="ServicePicCat">
                              <div className="serPic">
                                <img src={getServiceImage(demand.images)} alt="demand picture"></img>
                              </div>
                              <div className="Categorie">
                                {demand.category_name || "Uncategorized"}
                              </div>
                            </div>
                            <div className="TitleDesc">
                              <span>{demand.title}</span>
                              <br></br>
                              <span>{demand.description}</span>
                            </div>
                          </div>
                          <div className="priceBtns">
                            <div className="Price">
                              <div className="coinIcon">
                                <img
                                  src={coinIcon}
                                  alt="coinIcon"
                                  className="earned"
                                ></img>
                              </div>
                              <div className="pointText">
                                <span>{demand.budget || 0}pts</span>
                              </div>
                            </div>
                            <div className="Buttons">
                              <div>
                                <button className="editProfileBtn" onClick={() => navigate("/webbis/create-demand", { state: { editDemand: demand } })}>
                                  <div className="editProfileBtnDiv">
                                    <div>
                                      <img src={editIcon} alt="edit Icon"></img>
                                    </div>
                                    <div>
                                      <span>Edit</span>
                                    </div>
                                  </div>
                                </button>
                              </div>
                              <div>
                                <button className="deleteBtn" onClick={() => handleDeleteDemand(demand.id, demand.title)}>
                                  <div className="deleteBtnDiv">
                                    <div>
                                      <span>Delete Demand</span>
                                    </div>
                                    <div>
                                      <img
                                        src={deleteIcon}
                                        alt="deleteIcon"
                                      ></img>
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ));
                      })()}
                      <div className="AddService" onClick={() => navigate('/webbis/create-demand')} style={{ cursor: 'pointer' }}>
                        <div className="addServiceContent">
                          <div className="addServiceIcon">
                            <span>+</span>
                          </div>
                          <div className="addServiceText">
                            <span className="addServiceTitle">
                              Create New Demand
                            </span>
                            <span className="addServiceSubtitle">
                              Request a service you need
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
