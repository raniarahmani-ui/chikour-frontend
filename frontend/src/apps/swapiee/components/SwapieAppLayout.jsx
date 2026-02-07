import { useEffect, useMemo, useState } from "react";
import Navbar_swapiee from "./Navbar_swapiee";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";
import "../styles/SwapieAppLayout.css";

const getIsMobile = () =>
  typeof window !== "undefined" ? window.innerWidth <= 1024 : false;

function SwapieAppLayout({ activePage, title, children }) {
  const initialMobile = useMemo(() => getIsMobile(), []);
  const [isMobile, setIsMobile] = useState(initialMobile);
  const [sidebarVisible, setSidebarVisible] = useState(!initialMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);
      if (mobile) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const handleNavigate = () => {
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  return (
    <div className="page swapie-app-page">
      <Navbar_swapiee />
      <div
        className={`swapie-shell layout ${
          sidebarVisible ? "" : "sidebar-hidden"
        } ${isMobile ? "mobile" : ""}`}
      >
        <div
          className={`swapie-shell__sidebar sidebar ${
            sidebarVisible ? "visible" : ""
          }`}
        >
          <UserSidebar activePage={activePage} onNavigate={handleNavigate} />
        </div>
        <div className="swapie-shell__content">
          <div className="swapie-shell__toolbar">
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
            {title && <h1 className="swapie-shell__title">{title}</h1>}
          </div>
          <div className="swapie-shell__body">
            <div className="swapie-shell__body-inner">{children}</div>
          </div>
        </div>
      </div>
      {isMobile && sidebarVisible && (
        <div
          className="swapie-shell__overlay"
          onClick={toggleSidebar}
          aria-label="Hide sidebar"
        />
      )}
    </div>
  );
}

export default SwapieAppLayout;

