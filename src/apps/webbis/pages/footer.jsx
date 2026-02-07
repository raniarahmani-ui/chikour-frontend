import React, { useState } from "react";
import "../style/footer.css";

const Footer = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupContent, setPopupContent] = useState([]);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const popupContents = {
    about: {
      title: "About Swapie",
      content: [
        "Swapie is a platform connecting service providers and seekers across Algeria.",
        "Our mission is to facilitate local service exchanges and build stronger communities.",
        "This educational project is developed by ENSIA students to showcase modern web development practices.",
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      content: [
        "Q: How do I sign up?\nA: Click on the register button and fill in your details.",
        "Q: Is this service free?\nA: Yes, this is an educational project and completely free to use.",
        "Q: Who can use Swapie?\nA: Anyone in Algeria looking to offer or find services.",
      ],
    },
    privacy: {
      title: "Privacy Policy",
      content: [
        "Your privacy is important to us. This educational project does not collect or store personal data beyond what is necessary for demonstration purposes.",
        "All information provided is treated with confidentiality and used solely for academic purposes.",
      ],
    },
    terms: {
      title: "Terms of Service",
      content: [
        'By using Swapie, you agree that this is an educational project. The service is provided "as is" without warranties.',
        "Users are expected to respect the academic nature of this platform and use it responsibly.",
      ],
    },
  };

  const handleQuickLinkClick = (link) => {
    const content = popupContents[link];
    setPopupTitle(content.title);
    setPopupContent(content.content);
    setShowPopup(true);
  };

  const handleEmailClick = () => {
    setShowEmailForm(true);
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    alert("Email sent successfully!");
    setShowEmailForm(false);
  };

  const handleAnnuler = () => {
    setShowEmailForm(false);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      <footer>
        <div className="footer">
          <div className="main">
            <div className="quickResum">
              <h2>Swapie</h2>
              <p style={{ maxWidth: "200px" }}>
                Connecting service providers and seekers across Algeria
              </p>
            </div>
            <div className="quickLinks">
              <h2>Quick Links</h2>
              <p
                style={{ cursor: "pointer" }}
                onClick={() => handleQuickLinkClick("about")}
              >
                About
              </p>
              <p
                style={{ cursor: "pointer" }}
                onClick={() => handleQuickLinkClick("faq")}
              >
                FAQ
              </p>
              <p
                style={{ cursor: "pointer" }}
                onClick={() => handleQuickLinkClick("privacy")}
              >
                Privacy Policy
              </p>
              <p
                style={{ cursor: "pointer" }}
                onClick={() => handleQuickLinkClick("terms")}
              >
                Terms Of Services
              </p>
            </div>
            <div className="contact">
              <h2>Contact</h2>
              <p>Algeria</p>
              <p style={{ cursor: "pointer" }} onClick={handleEmailClick}>
                swapieplatform@gmail.com
              </p>
            </div>
            <hr style={{ width: "100%" }} />
          </div>
          <div className="DevTeam">
            <h2>Development Team</h2>
            <div className="TwoEmails">
              <div className="TextInDiv">yousra.bedjghit@ensia.edu.dz</div>
              <div className="TextInDiv">amanda-ines.mameri@ensia.edu.dz</div>
            </div>
            <div className="TwoEmails">
              <div className="TextInDiv">rania.rahmani@ensia.edu.dz</div>
              <div className="TextInDiv">widjdane.chouali@ensia.edu.dz</div>
            </div>
          </div>
          <hr />
          <div className="copyright">
            © 2025 Swapie. Educational project by ENSIA students.
          </div>
        </div>
      </footer>

      {showPopup && (
        <div className="popupOverlay" onClick={closePopup}>
          <div className="popupContent" onClick={(e) => e.stopPropagation()}>
            <button className="popupClose" onClick={closePopup}>
              x
            </button>
            <h3>{popupTitle}</h3>
            <div className="popupText">
              {popupContent.map((paragraph, index) => (
                <p key={index}>
                  {paragraph.split("\n").map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < paragraph.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              ))}
            </div>
            <div className="popupButtons">
              <button className="backButton" onClick={closePopup}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailForm && (
        <div className="popupOverlay" onClick={handleAnnuler}>
          <div className="popupContent" onClick={(e) => e.stopPropagation()}>
            <button className="popupClose" onClick={handleAnnuler}>
              x
            </button>
            <h3>Contact the Swapie Team</h3>
            <form onSubmit={handleSendEmail}>
              <div className="formGroup">
                <label>Subject:</label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Enter email subject"
                />
              </div>
              <div className="formGroup">
                <label>Message:</label>
                <textarea
                  name="message"
                  required
                  rows="4"
                  placeholder="Type your message here..."
                />
              </div>
              <div className="popupButtons">
                <button
                  type="button"
                  className="backButton"
                  onClick={handleAnnuler}
                >
                  back
                </button>
                <button type="submit" className="sendButton">
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
