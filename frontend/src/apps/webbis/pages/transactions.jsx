import React, { useState, useEffect } from "react";
import AdminSidebar from "../../swapie_project/components/Sidebar/Adminsidebar";
import "../style/transactions.css";
import cautionSign from "../assets/CautionSign.svg";
import up from "../assets/Up.svg";
import coins from "../assets/coins.svg";
import cash from "../assets/cash.svg";
import cautionemoji from "../assets/CautionEmoji.png";
import doneemoji from "../assets/DoneEmoji.png";
import statemoji from "../assets/statEmoji.png";
import XchangeEmoji from "../assets/XchangeEmoji.png";
import reports from "../assets/redFlagEmoji.png";
import moneybag from "../assets/cashEmoji.png";
import { useNavigate } from "react-router-dom";

export default function Transactions() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);

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

  const [summary, setSummary] = useState([
    {
      title: "Total Coins in Circulation",
      value: "...",
      change: "+12%", 
      icon: coins,
    },
    {
      title: "Coin Purchase Revenue",
      value: "...",
      change: "+8%",
      icon: cash,
    },
    {
      title: "Live Service Trades",
      value: "...",
      change: "+24%",
      icon: up,
    },
    {
      title: "Pending Disputes & Issues",
      value: "...",
      change: "-5%",
      icon: cautionSign,
    },
  ]);
  
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [pendingInterventions, setPendingInterventions] = useState([]);
  const [platformStatus, setPlatformStatus] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [chartData, setChartData] = useState({
    registrations: [],
    exchanges: [],
    category_stats: [],
    purchases: []
  });

  const API_BASE_URL = "/api/admin";

  useEffect(() => {
    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const resStats = await fetch(`${API_BASE_URL}/dashboard.php?endpoint=stats`, { headers });
            const dataStats = await resStats.json();
            
            if (dataStats.success) {
                const s = dataStats.data;
                setSummary([
                    {
                      title: "Total Coins in Circulation",
                      value: s.total_coins.toLocaleString(),
                      change: "+12%",
                      icon: coins,
                    },
                    {
                      title: "Coin Purchase Revenue",
                      value: `${s.revenue.toLocaleString()} Coins`,
                      change: "+8%",
                      icon: cash,
                    },
                    {
                      title: "Live Service Trades",
                      value: s.live_services.toString(),
                      change: "+24%",
                      icon: up,
                    },
                    {
                      title: "Pending Disputes & Issues",
                      value: s.pending_disputes.toString(),
                      change: "-5%",
                      icon: cautionSign,
                    },
                  ]);

                if (s.user_stats) {
                    setUserStats(s.user_stats);
                }
            }

            const resActivity = await fetch(`${API_BASE_URL}/dashboard.php?endpoint=activity`, { headers });
            const dataActivity = await resActivity.json();
            
            if (dataActivity.success) {
                const a = dataActivity.data;
                
                setRecentPurchases(a.recent_purchases.map(p => ({
                    id: p.id,
                    user: p.user_name || "Unknown",
                    amount: `${p.coins} Coins`,
                    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })));

                setPendingInterventions(a.pending_interventions.map(r => ({
                    id: r.id,
                    issue: r.reason || "Report",
                    desc: r.description || "",
                    priority: r.priority
                })));
                
                setPlatformStatus([
                    { label: "Coin system", status: a.platform_status.system_status || "Operational", color: "text-green-500", icon: doneemoji },
                    { label: "Failed completions", status: `${a.platform_status.failed_completions || 0} issues`, color: "text-yellow-500", icon: cautionemoji },
                    { label: "Coin purchases today", status: (a.platform_status.purchases_today || 0).toString(), color: "text-blue-500", icon: statemoji },
                    { label: "Exchanges completed", status: (a.platform_status.completed_exchanges || 0).toString(), color: "text-purple-500", icon: XchangeEmoji }
                ]);
            }

            const resCharts = await fetch(`${API_BASE_URL}/dashboard.php?endpoint=charts`, { headers });
            const dataCharts = await resCharts.json();
            if (dataCharts.success) {
                setChartData(dataCharts.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        }
    };
    fetchData();
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="transactions-container">
      {sidebarVisible && <AdminSidebar activePage="dashboard" />}

      <main
        className={`transactions-content ${
          !sidebarVisible ? "sidebar-hidden" : ""
        } ${isMobile ? "mobile" : ""}`}
      >
        <nav className="transactions-navbar">
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
            <div className="navTitle">
              <h1>Admin Dashboard</h1>
              <span style={{ marginLeft: "10px", marginRight: "10px" }}>
                &gt;
              </span>
              <span style={{ color: "grey" }}>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </nav>

        <div className="transactions-main">
          <div className="summary">
            {summary.map((item, index) => (
             <div
               key={index}
               className="card"
               onClick={() => {
                   if(index===2) handleNavigate("/webbis/service-management");
                   else if(index===3) handleNavigate("/swapie/manage-reports");
                   else handleNavigate("/swapie/transactions");
               }}
             >
               <div className="TitlePic">
                 <div className="cardTitle">{item.title}</div>
                 <div>
                   <img src={item.icon} alt="icon" className="coins" />
                 </div>
               </div>
               <div className="cardValue">{item.value}</div>
               <div className="cardSub">Updated Just Now</div>
             </div>
            ))}
          </div>

          {userStats && (
            <div className="user-stats-section">
              <div className="chartTitle" style={{ marginBottom: "12px" }}>User Wallet Overview</div>
              <div className="user-stats-cards">
                <div className="user-stat-card">
                  <div className="user-stat-label">Total Users</div>
                  <div className="user-stat-value">{Number(userStats.total_users || 0).toLocaleString()}</div>
                </div>
                <div className="user-stat-card">
                  <div className="user-stat-label">Total User Balances</div>
                  <div className="user-stat-value">{Number(userStats.total_balances || 0).toLocaleString()} <span className="stat-unit">Coins</span></div>
                </div>
                <div className="user-stat-card">
                  <div className="user-stat-label">Total Purchased</div>
                  <div className="user-stat-value">{Number(userStats.total_purchased || 0).toLocaleString()} <span className="stat-unit">Coins</span></div>
                </div>
                <div className="user-stat-card">
                  <div className="user-stat-label">Total Bonus Points</div>
                  <div className="user-stat-value">{Number(userStats.total_bonus_points || 0).toLocaleString()} <span className="stat-unit">Coins</span></div>
                </div>
                <div className="user-stat-card">
                  <div className="user-stat-label">Average Balance</div>
                  <div className="user-stat-value">{Number(userStats.avg_balance || 0).toFixed(1)} <span className="stat-unit">Coins</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="stats">
            <div className="chartBox">
              <div className="chartTitle">User Activity Trends (30 Days)</div>
              <div className="chart-area">
                {(() => {
                  
                  const days = [];
                  for (let i = 29; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    days.push(d.toISOString().split('T')[0]);
                  }
                  const regMap = {};
                  (chartData.registrations || []).forEach(r => { regMap[r.day] = parseInt(r.count); });
                  const purchMap = {};
                  (chartData.purchases || []).forEach(p => { purchMap[p.day] = parseInt(p.count); });
                  
                  const regValues = days.map(d => regMap[d] || 0);
                  const purchValues = days.map(d => purchMap[d] || 0);
                  const maxVal = Math.max(...regValues, ...purchValues, 1);
                  
                  return (
                    <div className="bar-chart-container">
                      <div className="bar-chart-bars">
                        {days.map((day, i) => (
                          <div key={day} className="bar-chart-group" title={`${day}\nRegistrations: ${regValues[i]}\nPurchases: ${purchValues[i]}`}>
                            <div className="bar-pair">
                              <div className="bar bar-reg" style={{ height: `${(regValues[i] / maxVal) * 100}%` }}></div>
                              <div className="bar bar-purch" style={{ height: `${(purchValues[i] / maxVal) * 100}%` }}></div>
                            </div>
                            {i % 5 === 0 && <span className="bar-label">{day.slice(5)}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot" style={{background:"#5D7872"}}></span> Registrations</span>
                <span className="legend-item"><span className="legend-dot" style={{background:"#16A34A"}}></span> Purchases</span>
              </div>
            </div>
            <div className="chartBox">
              <div className="chartTitle">Service Categories</div>
              <div className="chart-area">
                <div className="horizontal-bar-chart">
                  {(chartData.category_stats || []).map((cat, i) => {
                    const maxCount = Math.max(...(chartData.category_stats || []).map(c => parseInt(c.service_count) || 0), 1);
                    const pct = ((parseInt(cat.service_count) || 0) / maxCount) * 100;
                    const colors = ["#5D7872", "#16A34A", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6366F1"];
                    return (
                      <div key={cat.name} className="h-bar-row">
                        <span className="h-bar-label">{cat.name}</span>
                        <div className="h-bar-track">
                          <div className="h-bar-fill" style={{ width: `${Math.max(pct, 2)}%`, background: colors[i % colors.length] }}></div>
                        </div>
                        <span className="h-bar-value">{cat.service_count}</span>
                      </div>
                    );
                  })}
                  {(!chartData.category_stats || chartData.category_stats.length === 0) && (
                    <div style={{color:'#888', textAlign:'center', padding:'20px'}}>No data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="actions">
            <div className="actionCard platformStatus">
              <div className="chartTitle">Platform Status</div>
              <div className="statusList">
                {platformStatus.length > 0 ? platformStatus.map((item, i) => (
                <div key={i} className="statusItem">
                  <div>
                    <img
                      src={item.icon}
                      alt="emoji"
                      style={{ width: "20px" }}
                    ></img>
                  </div>
                  <div>
                    <span>
                      {item.status} {item.label}
                    </span>
                  </div>
                </div>
                )) : (
                     <div className="statusItem">Loading...</div>
                )}
              </div>
            </div>

            <div className="actionCard recentTransactions">
              <div className="chartTitle">Recent Coin Purchases</div>
              <div className="purchaseList">
                {recentPurchases.length > 0 ? recentPurchases.map((purchase) => (
                <div key={purchase.id} className="purchaseItem">
                  <div className="EmojiInfo">
                    <div>
                      <img
                        src={moneybag}
                        alt="moneybag"
                        style={{ width: "20px" }}
                      ></img>
                    </div>
                    <div className="purchaseInfo">
                      <span className="purchaseName">{purchase.user}</span>
                      <span className="purchaseDate">{purchase.time}</span>
                    </div>
                  </div>
                  <div>
                    <div className="coinAmount">{purchase.amount}</div>
                  </div>
                </div>
                )) : <div className="p-4 text-gray-500 text-sm">No recent purchases</div>}
              </div>
            </div>

            <div className="actionCard pending">
              <div className="chartTitle">Pending Interventions</div>
              <div className="interventionList">
                {pendingInterventions.length > 0 ? pendingInterventions.map((item, i) => (
                <div key={item.id || i} className="interventionItem">
                  <div>
                    <img
                      src={reports}
                      alt="reports"
                      style={{ width: "20px" }}
                    ></img>
                  </div>
                  <div className="interventionDescdiv">
                    <span className="interventionTitle">Report #{item.id}</span>
                    <span className="interventionDesc">
                      {item.issue} {item.desc ? `- ${item.desc.substring(0, 20)}...` : ""}
                    </span>
                  </div>
                </div>
                )) : <div className="p-4 text-gray-500 text-sm">No pending interventions</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}