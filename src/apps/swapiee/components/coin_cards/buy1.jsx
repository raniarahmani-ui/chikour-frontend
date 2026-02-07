import "../../styles/componentstyle/buy1.css";
import Coin from "../../assets/coin.svg";
import { useNavigate } from "react-router-dom";
function Buyonecoin({ onBuy, buying }) {
  return (
    <div className="coin-container">
      <div className="coin-container-top">
        <img src={Coin} alt="coin" className="coin" />
      </div>
      <div className="coin-container-bottom">
        <h4>
          <span>20pts</span>
        </h4>
        <button disabled={buying} onClick={onBuy} style={{ cursor: buying ? 'not-allowed' : 'pointer' }}>
          <span>4.99$</span>
        </button>
      </div>
    </div>
  );
}

export default Buyonecoin;
