import "../../styles/componentstyle/buy1.css";
import Threecoins from "../../assets/threecoins.svg";
import { useNavigate } from "react-router-dom";

function buythreecoin({ onBuy, buying }) {
  return (
    <div className="coin-container">
      <div className="coin-container-top">
        <img src={Threecoins} alt="two coins" className="threecoins" />
      </div>
      <div className="coin-container-bottom">
        <h4>
          <span>100pts</span>
        </h4>
        <button disabled={buying} onClick={onBuy} style={{ cursor: buying ? 'not-allowed' : 'pointer' }}>
          <span>14.99$</span>
        </button>
      </div>
    </div>
  );
}

export default buythreecoin;
