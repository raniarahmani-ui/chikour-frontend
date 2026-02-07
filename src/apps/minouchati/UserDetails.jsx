import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserDetails.css";

const UserDetails = () => {
  const navigate = useNavigate();
  const user = {
    name: "Sarah Johnson",
    initials: "SJ",
    status: "Active",
    rating: "5 (25)",
    description:
      "Professional graphic designer with 8 years of experience specializing in brand identity.",
    tags: ["Graphic Design", "Logo Design", "Branding"],
    email: "sarah.j@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "2024-00-15",
    lastActive: "2 hours ago",
  };

  const services = [
    { name: "Photo Editing", bookings: "87", rating: "4.9", completed: "78" },
    { name: "Painting", bookings: "87", rating: "4.9", completed: "78" },
    { name: "Cooking", bookings: "87", rating: "4.9", completed: "78" },
    {
      name: "Web development course",
      bookings: "87",
      rating: "4.9",
      completed: "78",
    },
    { name: "Essay writing", bookings: "87", rating: "4.9", completed: "78" },
  ];

  const summaryCards = [
    { icon: "coin", value: "450", label: "Coin Balance", color: "#ECC94B" },
    { icon: "chart", value: "12", label: "Services Offered", color: "#48BB78" },
    { icon: "dollar", value: "8", label: "Purchased", color: "#F56565" },
    { icon: "star", value: "4.9", label: "Rating", color: "#48BB78" },
  ];

  const renderIcon = (iconName) => {
    const iconMap = {
      coin: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path
            d="M12 2a10 10 0 0 1 8 8 10 10 0 0 1-8 8 10 10 0 0 1-8-8 10 10 0 0 1 8-8z"
            strokeLinecap="round"
          ></path>
        </svg>
      ),
      chart: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3 18 9 12 13 16 21 6"></polyline>
          <polyline points="21 6 21 10 19 10"></polyline>
        </svg>
      ),
      dollar: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      star: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      email: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      calendar: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      ),
      phone: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
      ),
      lightning: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      ),
      message: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
    };
    return iconMap[iconName] || null;
  };

  return (
    <div className="user-details-container">
      <div className="user-profile-section">
        <div className="user-avatar">
          <div className="avatar-circle">{user.initials}</div>
        </div>
        <div className="user-info">
          <div className="user-name-row">
            <h2 className="user-name">{user.name}</h2>
            <span className="status-badge active">{user.status}</span>
          </div>
          <div className="user-rating">Rating: {user.rating}</div>
          <p className="user-description">{user.description}</p>
          <div className="user-tags">
            {user.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="services-section">
        <div className="section-header">
          <h3 className="section-title">Top Provided Services</h3>
          <p className="section-subtitle">Services with top ratings.</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <h4 className="service-name">{service.name}</h4>
              <div className="service-stats">
                <span className="service-stat">
                  {service.bookings} bookings
                </span>
                <span className="service-rating">★ {service.rating}</span>
                <span className="service-completed">
                  {service.completed} Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-cards">
        {summaryCards.map((card, index) => (
          <div key={index} className="summary-card">
            <div className="summary-icon" style={{ color: card.color }}>
              {renderIcon(card.icon)}
            </div>
            <div className="summary-content">
              <div className="summary-value">{card.value}</div>
              <div className="summary-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="contact-section">
        <h3 className="section-title">Contact Information</h3>
        <div className="contact-grid">
          <div className="contact-item">
            <div className="contact-icon">{renderIcon("email")}</div>
            <div className="contact-details">
              <div className="contact-label">Email</div>
              <div className="contact-value">{user.email}</div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">{renderIcon("calendar")}</div>
            <div className="contact-details">
              <div className="contact-label">Join Date</div>
              <div className="contact-value">{user.joinDate}</div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">{renderIcon("phone")}</div>
            <div className="contact-details">
              <div className="contact-label">Phone</div>
              <div className="contact-value">{user.phone}</div>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">{renderIcon("lightning")}</div>
            <div className="contact-details">
              <div className="contact-label">Last Active</div>
              <div className="contact-value">{user.lastActive}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn-send-message"
          onClick={() => navigate("/minouchati/chat")}
        >
          {renderIcon("message")}
          <span>Send Message</span>
        </button>
        <button className="btn-suspend">
          <span>Suspend Account</span>
        </button>
      </div>
    </div>
  );
};

export default UserDetails;
