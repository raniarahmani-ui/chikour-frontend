import { useState, useEffect } from "react";
import Wallet from "../components/wallet";
import Morecoins from "../components/morecoins";
import TransactionHistory from "../components/transactions";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";
import "../styles/MyWallet.css";

function MyWallet() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const getInitialBalance = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.coins || 0;
  };
  const [walletData, setWalletData] = useState({
    balance: getInitialBalance(),
    balance_pending: 0,
    expected_date: null,
    transactions: [],
  });
  const API_BASE_URL = "/api";

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarVisible]);

  useEffect(() => {
    const fetchWallet = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/amanda/wallet.php`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setWalletData({
            balance: data.balance,
            balance_pending: data.pending_balance,
            expected_date: data.expected_date,
            transactions: data.transactions,
          });

          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          if (storedUser.coins !== data.balance) {
              storedUser.coins = data.balance;
              localStorage.setItem("user", JSON.stringify(storedUser));
              window.dispatchEvent(new Event("userUpdate"));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchWallet();

    window.addEventListener("userUpdate", fetchWallet);
    return () => window.removeEventListener("userUpdate", fetchWallet);
  }, []);

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <UserSidebar activePage="mywallet" />}

      <main
        className={`manage-reports-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}
      >
        <nav className="reports-navbar">
          <div className="nav-left">
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
            <h1>My Wallet</h1>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="mywallet-main">
              <div className="container">
                <div className="container-top">
                  <div className="wallet" style={{ flex: "1" }}>
                    <Wallet
                      balance={walletData.balance}
                      pendingBalance={walletData.balance_pending}
                      expectedDate={walletData.expected_date}
                    />
                  </div>
                  <div className="more" style={{ flex: "1" }}>
                    <Morecoins />
                  </div>
                </div>
                <div className="container-bottom">
                  <TransactionHistory transactions={walletData.transactions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyWallet;
