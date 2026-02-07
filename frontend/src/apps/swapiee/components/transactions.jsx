import "../styles/componentstyle/transactions.css";

export default function TransactionHistory({ transactions }) {
  const displayTransactions = transactions && transactions.length > 0 ? transactions.map(t => ({
      date: new Date(t.created_at).toLocaleDateString(),
      type: t.type,
      amount: `${t.coins} Coins`,
      status: t.status.charAt(0).toUpperCase() + t.status.slice(1), 
      direction: t.type === 'purchase' || t.type === 'bonus' ? 'in' : 'out' 
  })) : [];

  return (
    <div className="transaction-container">
      <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "10px" }}>Transaction History</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>All your recent transactions</p>

      <div className="transaction-card">
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayTransactions.map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.type}</td>
                <td className={t.direction === "in" ? "amount-in" : "amount-out"}>{t.amount}</td>
                <td>
                  <span className={t.status === "Completed" ? "status-completed" : "status-pending"}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
