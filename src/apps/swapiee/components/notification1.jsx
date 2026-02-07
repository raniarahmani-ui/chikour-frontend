import { useNavigate } from "react-router-dom";
import Profile from "../assets/Text.svg";
import "../styles/componentstyle/notifcation1.css";

export default function Notification1() {
  const navigate = useNavigate();
    return (
      <div className="notif-container">
        <div className="notif-container-left">
          <div className="profile-left">
            <img src={Profile} alt="text" />
            <div className="profile-right">
              <div className="pr-right">
                <h2>New Message</h2>
                <p>
                  Sarah Johnson sent you a message about the Logo Design project
                </p>
              </div>
              <div className="pr-left">
                <button onClick={()=>navigate("/minouchati/chat")}>Reply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}