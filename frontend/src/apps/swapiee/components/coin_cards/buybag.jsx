import "../../styles/componentstyle/buy1.css";
import Bag from "../../assets/bag.svg";
import { useNavigate } from "react-router-dom";

function Buybag({ onBuy, buying }) {
  return (
    <div className="coin-container">
      <div className="coin-container-top">
        <img src={Bag} alt="two coins" className="bag" />
      </div>
      <div className="coin-container-bottom">
        <h4>
          <span>200pts</span>
        </h4>
        <button disabled={buying} onClick={onBuy} style={{ cursor: buying ? 'not-allowed' : 'pointer' }}>
          <span>19.99$</span>
        </button>
      </div>
    </div>
  );
}

export default Buybag;
