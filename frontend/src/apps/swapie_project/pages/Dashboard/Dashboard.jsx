import React, { useState, useEffect } from "react";
import UserSidebar from "../../components/Sidebar/Usersidebar";
import "./Dashboard.css";
import logo from "../../assets/images/logo.svg";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const API_BASE_URL = "/api";
  const [stats, setStats] = useState([
    { label: "Total Return Rate", value: "0%", color: "#1C3F3A" },
    { label: "Investment Growth", value: "0%", color: "#2a5c55" },
    { label: "Monthly Profit", value: "0%", color: "#a5b4fc" },
    { label: "Annual Yield", value: "0%", color: "#818cf8" }
  ]);
  const [dataTransactions, setDataTransactions] = useState([]);
  const [userName, setUserName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}").full_name || "User"; } catch { return "User"; }
  });

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  useEffect(() => {
    const updateName = () => {
      try { setUserName(JSON.parse(localStorage.getItem("user") || "{}").full_name || "User"); } catch {  }
    };
    window.addEventListener("userUpdate", updateName);
    return () => window.removeEventListener("userUpdate", updateName);
  }, []);

  useEffect(() => {
    const handleResize = () => { 
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/amanda/dashboard.php`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
           const u = result.data;
           setStats([
            { label: "Coin Balance", value: u.coin_balance, color: "#1C3F3A" },
            { label: "Total Earned", value: u.total_earned, color: "#2a5c55" },
            { label: "Total Spent", value: u.total_spent, color: "#a5b4fc" },
            { label: "Rating", value: u.rating_avg, color: "#818cf8" }
           ]);
            
            if (u.transactions && u.transactions.length > 0) {
              setDataTransactions(u.transactions.map(t => ({
                id: t.id,
                type: t.type,
                date: new Date(t.created_at).toLocaleDateString(),
                amount: `${t.coins} Pts`,
                icon: logo
              })));
            }
        }
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { id: 1, name: "CARD HOLVES", holder: "Eddy Carama", type: "Ghatra", rate: "5,75% Collins" }
  ];

  const hardcodedTransactions = [
    { id: 1, type: "Deposit from my Card", date: "25 January 2021", amount: "$850", icon: logo },
    { id: 2, type: "PayPal Transfer", date: "24 January 2021", amount: "$800", icon: logo },
    { id: 3, type: "Coin Purchase", date: "23 January 2021", amount: "$0.5", icon: logo },
    { id: 4, type: "Service Payment", date: "22 January 2021", amount: "$0.5", icon: logo },
    { id: 5, type: "Wallet Top-up", date: "21 January 2021", amount: "$0.5", icon: logo }
  ];
  
  const allTransactions = dataTransactions.length > 0 ? dataTransactions : hardcodedTransactions;
  const transactions = allTransactions.filter(t => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (t.type || '').toLowerCase().includes(q) || (t.date || '').toLowerCase().includes(q) || (t.amount || '').toString().toLowerCase().includes(q);
  });
  const filteredTasks = tasks.filter(t => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  });

  const tasks = [
    { 
      id: 1, 
      title: "RESEARCH", 
      description: "Recommendative survey recommittee recounts/laik whole/decoacooa soloediglician eticiple that too", 
      dueDate: "12 Jan 2021", 
      status: "todo",
      icon: logo
    },
    { 
      id: 2, 
      title: "DESIGN", 
      description: "UI/UX design implementation and user testing phase", 
      dueDate: "15 Jan 2021", 
      status: "inprogress",
      icon: logo
    }
  ];

  return (
    <div className="manage-reports-container">
      {sidebarVisible && <UserSidebar activePage="dashboard" />}

      <main
        className={`manage-reports-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
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
            <h1>Dashboard</h1>
          </div>

          <div className="nav-center">
            <div className="search-container">
              <svg
                className="search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search dashboard..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="nav-right">
            <div className="user-profile">
              <img src={logo} alt="User" className="profile-icon" />
              <span>{userName}</span>
            </div>
          </div>
        </nav>

        <div className="reports-grid">
          <div className="reports-section">
            <div className="dashboard-grid">
              <div className="left-column">
                <div
                  className="section-card"
                  onClick={() => navigate("/swapie-app/my-wallet")}
                >
                  <div className="section-header">
                    <h2>My Cards</h2>
                  </div>
                  <div className="cards-list">
                    {cards.map((card) => (
                      <div key={card.id} className="card-item">
                        <div className="card-icon">
                          <img src={logo} alt="Card" />
                        </div>
                        <div className="card-info">
                          <h3>{card.name}</h3>
                          <p>{card.holder}</p>
                          <p>{card.type}</p>
                          <span className="card-rate">{card.rate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-header">
                    <h2>My Wallet</h2>
                  </div>
                  <div
                    className="wallet-transactions"
                    onClick={() => navigate("/swapie-app/my-wallet")}
                  >
                    {transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction.id} className="transaction-item">
                        <div className="transaction-icon">
                          <img src={transaction.icon} alt="Transaction" />
                        </div>
                        <div className="transaction-info">
                          <h4>{transaction.type}</h4>
                          <span className="transaction-date">
                            {transaction.date}
                          </span>
                        </div>
                        <div className="transaction-amount">
                          {transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="middle-column">
                <div className="section-card">
                  <div className="section-header">
                    <h2>Track my tasks</h2>
                  </div>
                  <div className="tasks-container">
                    <div className="task-column">
                      <h3 className="task-column-title">To Do</h3>
                      {filteredTasks
                        .filter((task) => task.status === "todo")
                        .map((task) => (
                          <div key={task.id} className="task-item">
                            <div className="task-icon">
                              <img src={task.icon} alt="Task" />
                            </div>
                            <div className="task-content">
                              <h4>{task.title}</h4>
                              <p>{task.description}</p>
                              <div className="task-footer">
                                <span className="due-date">
                                  Due Date: {task.dueDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="divider"></div>

                    <div className="task-column">
                      <h3 className="task-column-title">In progress</h3>
                      {filteredTasks
                        .filter((task) => task.status === "inprogress")
                        .map((task) => (
                          <div key={task.id} className="task-item">
                            <div className="task-icon">
                              <img src={task.icon} alt="Task" />
                            </div>
                            <div className="task-content">
                              <h4>{task.title}</h4>
                              <p>{task.description}</p>
                              <div className="task-footer">
                                <span className="due-date">
                                  Due Date: {task.dueDate}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="right-column">
                <div className="section-card">
                  <div className="section-header">
                    <h2>Recent Transaction</h2>
                    <button
                      className="see-all-btn"
                      onClick={() => navigate("/swapie-app/my-wallet")}
                    >
                      See All
                    </button>
                  </div>
                  <div className="recent-transactions">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="recent-transaction-item">
                        <div className="transaction-icon">
                          <img src={transaction.icon} alt="Transaction" />
                        </div>
                        <div className="transaction-details">
                          <h4>{transaction.type}</h4>
                          <span className="transaction-date">
                            {transaction.date}
                          </span>
                        </div>
                        <div className="transaction-amount">
                          {transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-header">
                    <h2>Expense Statistics</h2>
                  </div>
                  <div className="stats-grid">
                    {stats.map((stat, index) => (
                      <div key={index} className="stat-item">
                        <div
                          className="stat-color"
                          style={{ backgroundColor: stat.color }}
                        ></div>
                        <div className="stat-info">
                          <span className="stat-label">{stat.label}</span>
                          <span className="stat-value">{stat.value}</span>
                        </div>
                      </div>
                    ))}
                    <div className="stat-item">
                      <div className="stat-color other"></div>
                      <div className="stat-info">
                        <span className="stat-label">Other</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;