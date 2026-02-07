import { useNavigate } from "react-router-dom";
import "../styles/componentstyle/Demand.css";
import { Eye, Edit } from "lucide-react";

function Demand({ data }) {
  const navigate = useNavigate();
  const d = data || {};

  const goToDetail = () => navigate("/swapie-app/demand-detail", { state: { demandId: d.id } });

  return (
    <div
      className="demand-card"
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToDetail();
        }
      }}
    >
      <div className="demand-category">{d.category_name || "General"}</div>

      <div className="demand-client">
        <div className="client-avatar">{(d.username || "U")[0].toUpperCase()}</div>
        <span className="client-name">{d.full_name || d.username || "Anonymous"}</span>
      </div>

      <h3 className="demand-title">
        {d.title || "Untitled Demand"}
      </h3>
      <p className="demand-description">
        {d.description ? d.description.substring(0, 100) + (d.description.length > 100 ? "..." : "") : "No description"}
      </p>

      <div className="demand-footer">
        <span className="demand-points">{d.budget || 0} Points</span>
      </div>

      <div className="demand-actions">
        <button
          className="action-btn view-btn"
          onClick={(event) => {
            event.stopPropagation();
            goToDetail();
          }}
        >
          <Eye className="action-icon" />
          View Detail
        </button>
        <button
          className="action-btn delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            navigate("/webbis/rating", { state: { reportOnly: true, demandId: d.id } });
          }}
        >
          Report
        </button>
      </div>
    </div>
  );
}

export default Demand;
