import React from "react";
import "./ErrorPage.css";
import searchIcon from "./search.png";
import Navbar_swapiee from "../swapiee/components/Navbar_swapiee";

export default function ErrorPage() {
  const goHome = () => {
    window.location.href = "/";
  };

  const contactSupport = () => {
    window.location.href =
      "mailto:support@example.com?subject=Help%20with%20site";
  };

  const viewTransactions = () => {
    window.location.href = "/transactions";
  };

  const browseServices = () => {
    window.location.href = "/services";
  };

  const systemSettings = () => {
    window.location.href = "/settings";
  };

  return (
    <div className="error-page-root">
      <div
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          left: "0",
        }}
      >
        <Navbar_swapiee />
      </div>
      <main className="error-content" style={{ marginTop: "30px" }}>
        <div className="middle search-wrapper">
          <img src={searchIcon} alt="Search" className="searchImage" />
        </div>

        <div className="number">
          <div className="middle">
            <p>404</p>
          </div>
        </div>

        <div className="middle">
          <p className="pageNotFound">Page Not Found</p>
        </div>

        <div className="middle">
          <div className="oops">
            <p>
              Oops! The page you're looking for doesn't exist. It might have
              been moved or deleted.
            </p>
          </div>
        </div>

        <div className="frames-container">
          <div className="frame">
            <button className="actionBtn go-home-btn" onClick={goHome}>
              <span className="home-button-text">
                🏠 Go Back Home <span className="arrow-symbol">&gt;</span>
              </span>
            </button>
          </div>

          <div className="frame">
            <button
              className="actionBtn contact-support-btn"
              onClick={contactSupport}
            >
              <div className="contact-support-content">
                <div className="contact-main-text">
                  Contact Support <span className="arrow-symbol">&gt;</span>
                </div>
                <div className="contact-sub-text">
                  Get help from our support
                </div>
                <div className="contact-sub-text">team</div>
              </div>
            </button>
          </div>
        </div>

        <div className="quick-links-container">
          <h3 className="quick-links-title">Quick Links</h3>
          <div className="quick-links-grid">
            <button className="quick-link-card" onClick={viewTransactions}>
              <div className="link-content">
                <div className="link-main-text">Transactions</div>
                <div className="link-sub-text">View all</div>
              </div>
            </button>

            <button className="quick-link-card" onClick={browseServices}>
              <div className="link-content">
                <div className="link-main-text">Services</div>
                <div className="link-sub-text">Browse</div>
              </div>
            </button>

            <button className="quick-link-card" onClick={systemSettings}>
              <div className="link-content">
                <div className="link-main-text">Settings</div>
                <div className="link-sub-text">System</div>
              </div>
            </button>
          </div>
        </div>

        <div className="assistance-bottom">
          <p className="assistance-bottom-line">
            Need immediate assistance?{" "}
            <span className="contact-link" onClick={contactSupport}>
              Contact our support team
            </span>
          </p>
        </div>

        <div className="footer">
          <div className="footer-content">
            <span className="footer-copyright">
              © 2025 Swapie. All right reserved
            </span>
            <div className="footer-links">
              <a className="footer-link">Help Center</a>
              <a className="footer-link">Privacy Policy</a>
              <a className="footer-link">Terms of Service</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
