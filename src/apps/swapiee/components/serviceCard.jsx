import { useNavigate } from "react-router-dom";
import "../styles/componentstyle/ServiceCard.css";
import { Star, Eye, Edit } from "lucide-react";
import image from "../assets/image.png";

function ServiceCard({ data, onDelete }) {
  const navigate = useNavigate();
  const s = data || {};

  const getDisplayImage = () => {
    const raw = s.images || s.image;
    if (!raw) return image;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (e) {  }
    return typeof raw === 'string' && raw.length > 3 ? raw : image;
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${s.title || 'this service'}"?`)) return;
    if (onDelete) onDelete(s.id);
  };

  return (
    <div className="card">
      <img src={getDisplayImage()} alt="Service" className="card-image" />
      <div className="card-top">
        <span className="tag">{s.category_name || "Uncategorized"}</span>
        <span className="duration">{s.status || "active"}</span>
      </div>

      <h3 className="title">{s.title || "Untitled Service"}</h3>
      <p className="info">
        {s.description ? s.description.substring(0, 100) + (s.description.length > 100 ? "..." : "") : "No description"}
      </p>

      <div className="card-bottom">
        <div className="left">
          <Star className="star" />
          <span>{Number(s.rating_avg || 0).toFixed(1)}</span>
          <span className="orders">{s.views || 0} views</span>
        </div>
        <span className="points">{s.price || 0} pts</span>
      </div>
      <div className="actions">
        <button
          className="view"
          onClick={() => navigate("/swapie-app/my-services-detail", { state: { serviceId: s.id } })}
        >
          <Eye className="eye" />
          View
        </button>
        <button className="edit" onClick={() => navigate("/webbis/create-service", { state: { editService: s } })}>
          <Edit className="edit-icon"></Edit>Edit
        </button>
        <button className="delete" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
}
export default ServiceCard;
