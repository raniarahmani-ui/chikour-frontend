import "../styles/componentstyle/Navbar_swapiee.css";
import logo from "../assets/light logo.svg";
import profile from "../assets/Text.svg";
import logout from "../assets/material-symbols_logout-rounded.svg";

function Navbar_swapiee() {
  return (
    <nav className="navbar">
      <img src={logo} alt="Logo" className="logo" />
      <div className="container-nav">
        <button>
          <img src={profile} alt="profile" className="profile" />
        </button>
        <button>
          <img src={logout} alt="log out icon" className="logout" />
        </button>
      </div>
    </nav>
  );
}

export default Navbar_swapiee;
