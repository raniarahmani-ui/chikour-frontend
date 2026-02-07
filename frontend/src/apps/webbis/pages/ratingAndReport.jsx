import React, { useState, useEffect } from "react";
import "../style/ratingAndReport.css";
import clickedStar from "../assets/Clickedstar.png";
import unlcickedStar from "../assets/UnclickedStar.png";
import serpic from "../assets/serpic.png";
import coinIcon from "../assets/Coin.svg";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = "/api";

export default function RatingAndReport() {
  const navigate = useNavigate("");
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isReportPage, setIsReportPage] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedReportType, setSelectedReportType] = useState("");
  const [serviceData, setServiceData] = useState(null);

  const serviceId = location.state?.serviceId;
  const demandId = location.state?.demandId;
  const reportedUserId = location.state?.reportedUserId;

  useEffect(() => {
    if (serviceId) {
      const token = localStorage.getItem("token");
      fetch(`${API_BASE}/services.php?endpoint=detail&id=${serviceId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((d) => { if (d.success) setServiceData(d.data); })
        .catch(() => {});
    }
  }, [serviceId]);

  useEffect(() => {
    if (isReportPage && reportTypes.length === 0) {
      const token = localStorage.getItem("token");
      const entityType = demandId ? "demand" : serviceId ? "service" : reportedUserId ? "user" : "";
      const url = entityType
        ? `${API_BASE}/report-types.php?entity_type=${entityType}`
        : `${API_BASE}/report-types.php`;
      fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((d) => { if (d.success) setReportTypes(d.data || []); })
        .catch(() => {});
    }
  }, [isReportPage]);

  useEffect(() => {
    if (location.state?.reportOnly) {
      setIsReportPage(true);
    }
  }, [location.state]);

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStarClick = (starIndex) => {
    setRating(starIndex + 1);
  };

  const handleStarHover = (starIndex) => {
    setHoverRating(starIndex + 1);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleReportClick = () => {
    setIsReportPage(true);
  };

  const handleBackClick = () => {
    if (location.state?.reportOnly) {
        navigate(-1);
    } else {
        setIsReportPage(false);
        setReportReason("");
        setReportDescription("");
        setSelectedReportType("");
    }
  };

  const handleReasonChange = (e) => {
    setReportReason(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setReportDescription(e.target.value);
  };

  const handleReviewChange = (e) => {
    setReviewText(e.target.value);
  };

  const canSubmitReport = () => {
    if (!selectedReportType) return false;
    if (!reportReason || reportReason.trim().length < 10) return false;
    return true;
  };

  const canSubmitRating = () => {
    return rating > 0 && serviceId;
  };

  const handleSubmitReport = async () => {
    if (!canSubmitReport() || submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        report_type_id: parseInt(selectedReportType),
        reason: reportReason,
      };
      if (reportDescription.trim()) body.description = reportDescription;
      if (serviceId) body.reported_service_id = serviceId;
      if (demandId) body.reported_demand_id = demandId;
      if (reportedUserId) body.reported_user_id = reportedUserId;

      const res = await fetch(`${API_BASE}/reports.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert("Report submitted successfully!");
        navigate(-1);
      } else {
        alert(data.message || "Failed to submit report");
      }
    } catch (err) {
      alert("Error submitting report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!canSubmitRating() || submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const body = {
        service_id: serviceId,
        rating: rating,
      };
      if (reviewText.trim()) body.review = reviewText;

      const res = await fetch(`${API_BASE}/ratings.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        alert("Rating submitted successfully!");
        navigate("/webbis/profile");
      } else {
        alert(data.message || "Failed to submit rating");
      }
    } catch (err) {
      alert("Error submitting rating");
    } finally {
      setSubmitting(false);
    }
  };

  if (isReportPage) {
    return (
      <div className="RatingAndReport">
        <div className="container">
          <div className="rating">
            <div className="upText">
              <div className="text">
                <span style={{ fontSize: "16px", color: "#ff6b6bc4" }}>
                  Report an issue
                </span>
                <span style={{ fontSize: "14px" }}>
                  If you experienced any problems with this service, let us
                  know.
                </span>
              </div>
              <div className="skipReport">
                <button className="SkipBtn" onClick={handleBackClick}>
                  <span>{location.state?.reportOnly ? "Cancel" : "Back"}</span>
                </button>
              </div>
            </div>
            <div className="reportBlock">
              <div className="reasonBlock">
                <span style={{ color: "#000000" }}>Report Type</span>
                <select value={selectedReportType} onChange={(e) => setSelectedReportType(e.target.value)}>
                  <option value="">Select a type</option>
                  {reportTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="reasonBlock">
                <span style={{ color: "#000000" }}>Reason (min 10 characters)</span>
                <textarea
                  value={reportReason}
                  onChange={handleReasonChange}
                  placeholder="Describe why you are reporting..."
                  style={{ minHeight: "60px", resize: "vertical", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
                ></textarea>
                {reportReason.length > 0 && reportReason.length < 10 && (
                  <span style={{ color: "#ff6b6b", fontSize: "12px" }}>
                    Reason must be at least 10 characters
                  </span>
                )}
              </div>
              <div className="descriptionBlock">
                <span style={{ color: "#000000" }}>Additional details (optional)</span>
                <textarea
                  value={reportDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Any additional information..."
                ></textarea>
              </div>
            </div>

            <div>
              <button
                className="submitReport"
                onClick={handleSubmitReport}
                disabled={!canSubmitReport() || submitting}
                style={{
                  opacity: canSubmitReport() && !submitting ? 1 : 0.5,
                  cursor: canSubmitReport() && !submitting ? "pointer" : "not-allowed",
                }}
              >
                <span>{submitting ? "Submitting..." : "Submit Report"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="RatingAndReport">
      <div className="container">
        <div className="rating">
          <div className="upText">
            <div className="text">
              <span style={{ fontSize: "16px" }}>Service Completed</span>
              <span style={{ fontSize: "14px" }}>How was your experience?</span>
            </div>
            <div className="skipReport">
              <div>
                <button className="reportBtn" onClick={handleReportClick}>
                  <span>Report</span>
                </button>
              </div>
              <button
                className="SkipBtn"
                onClick={() => handleNavigate("/webbis/profile")}
              >
                <span>Skip</span>
              </button>
            </div>
          </div>
          <div className="ServiceCard">
            <div className="ServiceDescription">
              <div className="ServicePicCat">
                <div className="serPic">
                  <img src={(() => {
                    const raw = serviceData?.images || serviceData?.image;
                    if (!raw) return serpic;
                    try { const p = typeof raw === 'string' ? JSON.parse(raw) : raw; if (Array.isArray(p) && p.length > 0) return p[0]; } catch (e) {  }
                    return typeof raw === 'string' && raw.length > 3 ? raw : serpic;
                  })()} alt="service picture" />
                </div>
                <div className="Categorie">{serviceData?.category_name || "Service"}</div>
              </div>
              <div className="TitleDesc">
                <div>
                  <span>{serviceData?.title || "Service"}</span>
                </div>
                <div>
                  <span>
                    {serviceData?.description || ""}
                  </span>
                </div>
                <div>
                  <span>By {serviceData?.provider_name || serviceData?.username || "Provider"}</span>
                </div>
              </div>
            </div>

            <div className="priceBtns">
              <div className="Price">
                <div className="coinIcon">
                  <img src={coinIcon} alt="coinIcon" className="coinIcon" />
                </div>
                <div className="pointText">
                  <span style={{ fontSize: "17px" }}>{serviceData?.price || 0}pts</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rateServiceBlock"
            style={{ gap: canSubmitRating() ? "15px" : "0px" }}
          >
            <span>Rate this Service</span>
            <div className="stars" onMouseLeave={handleMouseLeave}>
              {[0, 1, 2, 3, 4].map((index) => (
                <button
                  key={index}
                  onClick={() => handleStarClick(index)}
                  onMouseEnter={() => handleStarHover(index)}
                >
                  <img
                    src={
                      (hoverRating || rating) > index
                        ? clickedStar
                        : unlcickedStar
                    }
                    alt="star"
                  />
                </button>
              ))}
            </div>
            {rating === 0 && (
              <span style={{ color: "#ff6b6b", fontSize: "12px" }}>
                Please select at least one star to rate
              </span>
            )}
          </div>
          <div className="reviewBlock">
            <span>Write your review (optional)</span>
            <input
              type="text"
              value={reviewText}
              onChange={handleReviewChange}
              placeholder="Share your experience..."
            />
          </div>
          <div className="submit">
            <button
              onClick={handleSubmitRating}
              disabled={!canSubmitRating() || submitting}
              style={{
                opacity: canSubmitRating() && !submitting ? 1 : 0.5,
                cursor: canSubmitRating() && !submitting ? "pointer" : "not-allowed",
                marginTop: canSubmitRating() ? "15px" : "0px",
              }}
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
