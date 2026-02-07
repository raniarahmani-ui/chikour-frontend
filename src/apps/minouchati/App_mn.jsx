import NavBar from "./NavBar_mn.jsx";
import SideBar from "./SideBar.jsx";
import ErrorPage from "./ErrorPage";
import Settings from "./Settings.jsx";
import CreateService from "./CreateService.jsx";
import CreateDemand from "./CreateDemand.jsx";
import Chat from "./Chat.jsx";
import UserDetails from "./UserDetails.jsx";
import "./NavBar_mn.css";
import "./SideBar.css";
import "./Settings.css";
import "./ErrorPage.css";
import "./CreateService.css";
import "./CreateDemand.css";
import "./Chat.css";
import "./UserDetails.css";
import "./App.css";

function App_mn() {
  return (
    <div className="app-container">
      <div className="main-layout">
        <div className="main-content">
          <UserDetails />
        </div>
      </div>
    </div>
  );
}

export default App_mn;