import React, { useState } from "react";
import "../style/forgotPass.css";
import container from "../assets/Container.svg";
import logo from "../assets/Frame 109.svg";

const API_BASE_URL = "/api";

export default function ForgotPass() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email) newErrors.email = "Please enter an email address.";
    else if (!email.includes("@"))
      newErrors.email = "Please enter a valid email address.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/amanda/forgot_password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      setStep(2);
      if (response.ok && result.success) {
        setMessage("A reset code has been sent (check your email).");
      } else {
        setMessage("Request logged. Please check your email for the code.");
      }
    } catch (error) {
      
      setStep(2);
      setMessage("Request sent. If you don't receive an email, please contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!code || !/^\d{6}$/.test(code))
      newErrors.code = "Please enter the 6-digit code.";

    if (!newPass) newErrors.newPass = "Please enter a password.";
    else if (newPass.length < 8)
      newErrors.newPass = "Password must be at least 8 characters long.";

    if (!confirmPass) newErrors.confirmPass = "Please confirm your password.";
    else if (confirmPass !== newPass)
      newErrors.confirmPass = "Passwords do not match.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/amanda/reset_password.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          code,
          password: newPass
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage("Password updated successfully. You can now log in.");
        
      } else {
        setErrors({ submit: result.message || "Invalid code or expired reset request." });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ForgotPass">
      {step === 1 && (
        <div className="Parent">
          <div className="green_sheet">
            <img src={container} alt="Container" className="container" />
          </div>
          <div className="SendEmail">
            <form onSubmit={handleEmailSubmit} className="emailvalidation">
              <button className="Logo" type="button">
                <img src={logo} alt="logo" className="logo" />
              </button>
              <p className="forgot">Forgot your password?</p>

              <p className="consigne">
                Enter your email so we can send you a reset code
              </p>
              <input
                className="InputHolder"
                type="email"
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="error">{errors.email}</p>}
              {message && <p className="success">{message}</p>}
              <button type="submit" className="submitBtn" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Email ->"}
              </button>
              <p className="back">&lt; Back to login</p>
            </form>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="Parent">
          <div className="SetNewPass">
            <form
              onSubmit={handlePasswordSubmit}
              className="passwordValidation"
            >
              <button className="Logo" type="button">
                <img src={logo} alt="logo" className="logo" />
              </button>
              <p className="forgot">Forgot your password?</p>
              <p className="consigne">Set your new password</p>
              <input
                className="InputHolder"
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
              {errors.code && <p className="error">{errors.code}</p>}
              <input
                className="InputHolder"
                type="password"
                placeholder="Enter new password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              {errors.newPass && <p className="error">{errors.newPass}</p>}
              <input
                className="InputHolder"
                type="password"
                placeholder="Re-enter password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              {errors.confirmPass && (
                <p className="error">{errors.confirmPass}</p>
              )}
              {errors.submit && <p className="error">{errors.submit}</p>}
              {message && <p className="success">{message}</p>}
              <button type="submit" className="submitBtn" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Set New Password ->"}
              </button>
            </form>
          </div>
          <div className="green_sheet">
            <img src={container} alt="Container" className="container" />
          </div>
        </div>
      )}
    </div>
  );
}
