import { useNavigate } from "react-router-dom";
import Notifs from "../assets/notifs.svg";
import "../styles/componentstyle/notifcation1.css";

export default function Notification2() {
  const navigate = useNavigate();

  return (
    <div className="notif-container">
      <div className="notif-container-left">
        <div className="profile-left">
          <img src={Notifs} alt="text" />
          <div className="profile-right">
            <div className="pr-right">
              <h2>Points Received</h2>
              <p>
                You received 150 points for completing "Business Plan Writing"
              </p>
            </div>
            <div className="pr-left">
              <button onClick={() => navigate("/swapie-app/my-wallet")}>
                Go to Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
