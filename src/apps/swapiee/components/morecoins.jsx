import { useNavigate } from "react-router-dom";
import Coin from "../assets/coin.svg";
import "../styles/componentstyle/morecoins.css";

function morecoins() {
  const navigate = useNavigate();
  return (
    <div className="more-container" style={{ width: "100%", height: "100%" }}>
      <div className="more-top">
        <img src={Coin} alt="Coin" className="Coin-img" />
      </div>
      <div className="Body-more"></div>
      <h3 className="more-h3">Need More Coins?</h3>
      <p className="paragraph">Get as much as you want with one click!</p>
      <button className="btn" onClick={() => navigate("/swapie-app/buy-coins")}>
        Get More
      </button>
    </div>
  );
}
export default morecoins;
