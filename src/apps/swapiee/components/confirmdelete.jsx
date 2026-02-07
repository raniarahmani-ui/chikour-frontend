import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import "../styles/componentstyle/confirmdelete.css";

function ConfirmDelete({ open, onCancel, onConfirm }) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [open, onCancel]);

  if (!open) return null;

  const handleConfirm = () => {
    try {
      onConfirm?.();
    } finally {
      navigate("/swapie/Dashboard");
    }
  };

  return ReactDOM.createPortal(
    <div
      className="popup-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="popup-card" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Are you sure you want to delete?</h3>
        <p>This action cannot be undone.</p>
        <div className="popup-actions">
          <button
            className="btn-cancel"
            onClick={() => onCancel?.()}
            type="button"
          >
            Cancel
          </button>
          <button className="btn-delete" onClick={handleConfirm} type="button">
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDelete;
