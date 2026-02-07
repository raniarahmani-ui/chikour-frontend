import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../../components/Sidebar/Adminsidebar";
import "./Transactions.css";

function Transactions() {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [activeTab, setActiveTab] = useState("all");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE_URL = "/api/admin";
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [stats, setStats] = useState({
    total_transactions: 0,
    total_coins: 0,
    completed_count: 0,
    pending_count: 0,
    purchases: 0,
    service_payments: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile && sidebarVisible) setSidebarVisible(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarVisible]);

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let url = `${API_BASE_URL}/transactions.php?per_page=50`;
      if (activeTab === "income") url += "&type=purchase";
      else if (activeTab === "expenses") url += "&type=refund";
      
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        const typeLabels = {
          purchase: "Purchase",
          service_payment: "Service Payment",
          demand_payment: "Demand Payment",
          bonus: "Bonus",
          refund: "Refund",
        };
        const list = (data.data.transactions || []).map((t) => ({
          type: typeLabels[t.type] || t.type,
          rawType: t.type,
          amount: `${parseInt(t.coins || 0)} Coins`,
          coins: parseInt(t.coins || 0),
          date: new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
          status: t.status,
          from_user: t.from_username || t.from_user_id,
          to_user: t.to_username || t.to_user_id,
        }));
        setTransactions(list);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    }
  }, [activeTab]);

  const fetchChartData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const days = selectedPeriod === "daily" ? 1 : selectedPeriod === "weekly" ? 7 : 30;
      
      const res = await fetch(`${API_BASE_URL}/transactions.php?endpoint=daily_summary&days=${days}`, { headers });
      const data = await res.json();
      if (data.success) {
        const summary = data.data.daily_summary || [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        if (summary.length === 0) {
          setChartData([0]);
          setChartLabels(["No data"]);
        } else {
          setChartData(summary.map((d) => parseInt(d.total_coins || 0)));
          setChartLabels(
            summary.map((d) => {
              const date = new Date(d.date);
              if (selectedPeriod === "daily") return `${date.getHours?.() || 0}h`;
              if (selectedPeriod === "monthly") return `${monthNames[date.getMonth()]} ${date.getDate()}`;
              return dayNames[date.getDay()];
            })
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch chart data", error);
    }
  }, [selectedPeriod]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/transactions.php?endpoint=stats`, { headers });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchChartData(); }, [fetchChartData]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.type.toLowerCase().includes(q) ||
      t.amount.toLowerCase().includes(q) ||
      t.date.toLowerCase().includes(q) ||
      (t.status && t.status.toLowerCase().includes(q))
    );
  });

  const maxChartValue = Math.max(...chartData, 1);

  const statsItems = [
    { label: "Total Transactions", value: stats.total_transactions || 0 },
    { label: "Total Coins Moved", value: `${parseInt(stats.total_amount || 0).toLocaleString()} Coins` },
    { label: "Completed", value: stats.completed_count || 0 },
    { label: "Purchases", value: stats.purchases || 0 },
  ];

  return (
    <div className="transactions-container">
      {sidebarVisible && <AdminSidebar activePage="coin" />}

      <main className={`transactions-content ${!sidebarVisible ? "sidebar-hidden" : ""} ${isMobile ? "mobile" : ""}`}>
        <nav className="transactions-navbar">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={toggleSidebar} aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {sidebarVisible ? <path d="M19 12H5M12 19l-7-7 7-7" /> : <path d="M5 12h14M12 5l7 7-7 7" />}
              </svg>
            </button>
            <h1>Transactions</h1>
          </div>

          <div className="nav-center">
            <div className="search-container">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input type="text" placeholder="Search transactions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
            </div>
          </div>

          <div className="nav-right">
            <div className="period-selector">
              {["daily", "weekly", "monthly"].map((p) => (
                <button key={p} className={`period-btn ${selectedPeriod === p ? "active" : ""}`} onClick={() => setSelectedPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="transactions-grid">
          <div className="transactions-section">
            <div className="section-header">
              <h2>Recent Transactions</h2>
              <div className="transaction-tabs">
                <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>All</button>
                <button className={`tab ${activeTab === "income" ? "active" : ""}`} onClick={() => setActiveTab("income")}>Purchases</button>
                <button className={`tab ${activeTab === "expenses" ? "active" : ""}`} onClick={() => setActiveTab("expenses")}>Refunds</button>
              </div>
            </div>

            <div className="transactions-table">
              <div className="table-header">
                <span>Type</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Status</span>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="table-row" style={{ justifyContent: "center", color: "#999" }}>
                  <span>No transactions found</span>
                </div>
              )}

              {filteredTransactions.map((transaction, index) => (
                <div key={index} className="table-row">
                  <span className="service-type">{transaction.type}</span>
                  <span className="amount">{transaction.amount}</span>
                  <span className="date">{transaction.date}</span>
                  <span className={`status-badge status-${transaction.status}`}>{transaction.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="statistics-section">
            <div className="section-header">
              <h2>Statistics</h2>
              <div className="stats-tabs">
                <button className="stats-tab active">
                  {selectedPeriod === "daily" ? "Today" : selectedPeriod === "weekly" ? "This Week" : "This Month"}
                </button>
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-placeholder">
                <div className="chart-bars">
                  {chartData.map((value, index) => (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar" style={{ height: `${Math.max((value / maxChartValue) * 100, 5)}%` }} title={`${value} coins`} />
                    </div>
                  ))}
                </div>
                <div className="chart-labels">
                  {chartLabels.map((label, i) => (
                    <span key={i} className="chart-label">{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="system-overview">
              <h3>System Overview</h3>
              <div className="stats-grid">
                {statsItems.map((item, index) => (
                  <div key={index} className="stat-card">
                    <div className="stat-value">{item.value}</div>
                    <div className="stat-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Transactions;