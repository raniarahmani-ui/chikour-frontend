import "../../styles/componentstyle/buy1.css";
import Twocoins from "../../assets/twocoins.svg";
import { useNavigate } from "react-router-dom";

function buytwocoin({ onBuy, buying }) {
  return (
    <div className="coin-container">
      <div className="coin-container-top">
        <img src={Twocoins} alt="two coins" className="twocoins" />
      </div>
      <div className="coin-container-bottom">
        <h4>
          <span>50pts</span>
        </h4>
        <button disabled={buying} onClick={onBuy} style={{ cursor: buying ? 'not-allowed' : 'pointer' }}>
          <span>9.99$</span>
        </button>
      </div>
    </div>
  );
}

export default buytwocoin;
