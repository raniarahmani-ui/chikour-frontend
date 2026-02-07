import Coin from "../assets/coin.svg";
import wallet_icon from "../assets/wallet_icon.svg";
import "../styles/componentstyle/wallet.css";

function Wallet({ balance, pendingBalance, expectedDate }) {
  return (
    <div className="Container-wallet">
      <div className="top">
        <img src={wallet_icon} alt="wallet icon" className="" />
        <p className="Header">Wallet Balance</p>
      </div>
      <div className="Body">
        <div className="values">
          <p className="available">Available Balance</p>
          <span className="Balance">
            {balance !== undefined ? `${balance} Coins` : "0 Coins"}
          </span>
        </div>
        <img src={Coin} alt="Coin" className="Coin" />
      </div>
      
      <div className="bottom">
        <div className="left">
          <p className="title">Pending Funds</p>
          <span className="pending">{pendingBalance || 0} Pts</span>
        </div>
        <div className="right">
          <p className="title">Expected</p>
          <span className="expected">{expectedDate || "No pending payouts"}</span>
        </div>
      </div>
    </div>
  );
}
export default Wallet;
