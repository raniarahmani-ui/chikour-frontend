import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Service from "../components/serviceCard";
import SwapieAppLayout from "../components/SwapieAppLayout";
import "../styles/MyServices.css";

function MyServices() {
  const [services, setServices] = useState([]);
  const [activeTab, setActiveTab] = useState("services");
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const API_BASE_URL = "/api";

  const fetchMyServices = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/amanda/profile.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (e) {
      console.error("Failed to fetch services", e);
    }
  };

  useEffect(() => { fetchMyServices(); }, []);

  const handleDelete = async (serviceId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/services/user-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ service_id: serviceId }),
      });
      const data = await res.json();
      if (data.success) fetchMyServices();
      else alert(data.message || "Failed to delete");
    } catch (e) {
      alert("Network error");
    }
  };

  return (
    <SwapieAppLayout activePage="myservices" title="My Services">
      <main className="main-content">
        <h2 className="page-title">My Services</h2>

        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "14px", width: "100%", maxWidth: "350px" }}
          />
        </div>

        <div className="tabs">
          <button className={activeTab === "services" ? "active" : ""} onClick={() => setActiveTab("services")}>My Services</button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>Orders</button>
        </div>
        <div className="Container">
          <div className="Services-list">
            {activeTab === "services" && (() => {
              const filtered = services.filter((s) => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return (s.title || "").toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q) || (s.category_name || "").toLowerCase().includes(q);
              });
              if (filtered.length === 0) return <p style={{color:"#999", padding:"20px"}}>{searchTerm ? "No services match your search." : "No services yet. Create your first service!"}</p>;
              return filtered.map((s) => (
                <Service key={s.id} data={s} onDelete={handleDelete} />
              ));
            })()}
            {activeTab === "orders" && <p style={{color:"#999", padding:"20px"}}>No orders yet.</p>}
          </div>
          <button className="button" onClick={() => navigate("/webbis/create-service")} title="Create new service">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1C3F3A" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </main>
    </SwapieAppLayout>
  );
}

export default MyServices;
