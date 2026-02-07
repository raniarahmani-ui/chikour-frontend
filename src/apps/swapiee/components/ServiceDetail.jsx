import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/componentstyle/ServiceDetail.css";
import image from "../assets/image.png";
import { Trash, Edit } from "lucide-react";
import ConfirmDelete from "../components/ConfirmDelete";

function ServiceDetail({ service }) {
  const [openPopup, setOpenPopup] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const s = service || {};

  const getImage = () => {
    const raw = s.images || s.image;
    if (!raw) return image;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch {}
    return typeof raw === "string" && raw.length > 3 ? raw : image;
  };

  const handleDelete = async () => {
    if (!s.id) { setOpenPopup(false); return; }
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/services/user-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ service_id: s.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Service deleted!");
        navigate("/webbis/profile");
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch {
      alert("Network error");
    } finally {
      setDeleting(false);
      setOpenPopup(false);
    }
  };

  return (
    <>
      <div className="Service">
        <div className="image">
          <img src={getImage()} alt="service" />
        </div>
        <div className="desc">
          <div className="tag-duration">
            <span className="tag">{s.category_name || "Service"}</span>
            <span className="duration">{s.status || "active"}</span>
          </div>
          <h3 className="title">{s.title || "Untitled Service"}</h3>
          <p className="info">{s.description || "No description"}</p>
        </div>
        <div className="card-right">
          <div className="points">{s.price || 0} pts</div>
          <div className="actions">
            <button className="edit" onClick={() => navigate("/webbis/create-service", { state: { editService: s } })}>
              <Edit className="edit-icon" /> Edit
            </button>
            <button className="delete" onClick={() => setOpenPopup(true)}>
              <Trash className="Trash" /> Delete
            </button>
          </div>
        </div>
      </div>
      <ConfirmDelete
        open={openPopup}
        onCancel={() => setOpenPopup(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default ServiceDetail;
