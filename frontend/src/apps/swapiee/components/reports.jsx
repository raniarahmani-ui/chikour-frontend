import "../styles/componentstyle/reports.css";
import Profile from "../assets/Text.svg";
import { Star, CircleMinus } from "lucide-react";

function Report({ rating }) {
  const r = rating || {};
  const stars = r.rating || 5;
  const username = r.reviewer_name || r.username || "Anonymous";
  const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : "";

  return (
    <div className="report">
      <div className="left">
        <img src={Profile} alt="profile picture" className="profile" />
        <span className="username">{username}</span>
      </div>
      <div className="right">
        <span className="date">{date}</span>
        <div className="stars">
          <span>{stars}</span>
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="star" style={{ fill: i < stars ? "#f59e0b" : "none", color: i < stars ? "#f59e0b" : "#ccc" }} />
          ))}
        </div>
        {r.review && <p style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{r.review}</p>}
      </div>
    </div>
  );
}
export default Report;
