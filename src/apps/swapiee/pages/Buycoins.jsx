import { useState, useEffect } from "react";
import "../styles/Buycoins.css";
import Buyoneecoin from "../components/coin_cards/buy1";
import Buythreecoin from "../components/coin_cards/buy3";
import Buytwocoin from "../components/coin_cards/buy2";
import Buybag from "../components/coin_cards/buybag";
import Wallet from "../components/wallet";
import UserSidebar from "../../swapie_project/components/Sidebar/Usersidebar";

function Buycoinsfunc() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(!(window.innerWidth <= 768));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      } else if (!mobile && !sidebarVisible) {
        setSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const API_BASE_URL = "/api";
  const getInitialBalance = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    return storedUser.coins || 0;
  };
  const [walletInfo, setWalletInfo] = useState({ 
    balance: getInitialBalance(), 
    pending: 0, 
    expected: null 
  });
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    fetchWalletBalance();

    const handleUpdate = () => {
        fetchWalletBalance();
    };
    window.addEventListener("userUpdate", handleUpdate);
    return () => window.removeEventListener("userUpdate", handleUpdate);
  }, []);

  const fetchWalletBalance = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/amanda/wallet.php`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            setWalletInfo({
                balance: data.balance,
                pending: data.pending_balance,
                expected: data.expected_date
            });

            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (storedUser.coins !== data.balance) {
                storedUser.coins = data.balance;
                localStorage.setItem("user", JSON.stringify(storedUser));
                window.dispatchEvent(new Event("userUpdate"));
            }
        }
      } catch (e) { console.error(e); }
  };

  const handleBuy = async (amount) => {
      if (isBuying) return;
      setIsBuying(true);
      const token = localStorage.getItem("token");
      if (!token) {
          alert("Please login to buy coins");
          setIsBuying(false);
          return;
      }

      try {
          const res = await fetch(`${API_BASE_URL}/amanda/buy_coins.php`, {
              method: 'POST',
              headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ amount })
          });
          const data = await res.json();
          if (data.success) {
            
            setWalletInfo(prev => ({
                ...prev,
                balance: data.new_balance
            }));

            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            storedUser.coins = data.new_balance;
            localStorage.setItem("user", JSON.stringify(storedUser));

            window.dispatchEvent(new Event("userUpdate"));

            alert(`Successfully bought ${amount} coins!`);
            
            fetchWalletBalance();
        } else {
              alert("Purchase failed: " + data.message);
          }
      } catch (e) {
          alert("Network error");
      } finally {
          setIsBuying(false);
      }
  };

  return (
    <div className="buycoins-container">
      {sidebarVisible && <UserSidebar activePage="getcoins" />}
      
      <main className={`buycoins-content ${!sidebarVisible ? 'sidebar-hidden' : ''} ${isMobile ? 'mobile' : ''}`}>
        <nav className="buycoins-navbar">
          <div className="nav-left">
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? (
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                ) : (
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                )}
              </svg>
            </button>
            <h1 className="page-title">Buy Coins</h1>
          </div>
        </nav>

        <div className="buycoins-main">
          <div className="wallet-container">
            <Wallet 
              balance={walletInfo.balance} 
              pendingBalance={walletInfo.pending} 
              expectedDate={walletInfo.expected} 
            />
          </div>
          <h2 className="offers-title">Our Offers</h2>
          <div className="coins-container">
            <Buyoneecoin onBuy={() => handleBuy(20)} buying={isBuying} />
            <Buytwocoin onBuy={() => handleBuy(50)} buying={isBuying} />
            <Buythreecoin onBuy={() => handleBuy(100)} buying={isBuying} />
            <Buybag onBuy={() => handleBuy(200)} buying={isBuying} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Buycoinsfunc;