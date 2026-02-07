import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignInPage.css";

import Logo from "../../assets/images/logo.svg";
import SwapieHapie from "../../assets/images/swapiehapie.svg";
import SwapieText from "../../assets/images/swapie_text.svg";

const API_BASE_URL = "/api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmailOrUsername = (value) => {
    if (!value.trim()) {
      return "Email or username is required.";
    }
    
    if (value.includes('@')) {
      if (!EMAIL_REGEX.test(value)) {
        return "Please enter a valid email address.";
      }
    } else {
      
      if (!USERNAME_REGEX.test(value)) {
        return "Username must be 3-20 characters (letters, numbers, underscores only).";
      }
    }
    return "";
  };

  const validatePassword = (value) => {
    if (!value.trim()) {
      return "Password is required.";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailValidationError = validateEmailOrUsername(email);
    const passwordValidationError = validatePassword(password);
    
    setEmailError(emailValidationError);
    setPasswordError(passwordValidationError);
    
    if (emailValidationError || passwordValidationError) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/user-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: email,
          password: password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        localStorage.setItem('userType', result.data.type || 'user');

        if (result.data.type === 'admin') {
          navigate("/webbis/transactions");
        } else {
          navigate("/webbis/profile");
        }
      } else {
        
        setPasswordError(result.message || "Incorrect email/username or password.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setPasswordError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (passwordError) {
      setPasswordError("");
    }
  };
  return (
    <div className="signin-container">
      <div className="left-side">
        <div className="logoname">
          <img src={Logo} alt="Logo" className="Logo" />
          <img src={SwapieText} alt="Swapie" className="SwapieText" />
        </div>
        <img src={SwapieHapie} alt="SwapieHapie" className="SwapieHapie" />
        <p className="exch">Exchange skills, share happiness </p>
      </div>

      <div className="right-side">
        <form className="signin-form" onSubmit={handleSubmit}>
          <h2>Welcome Back!</h2>
          <p className="subtitle">Sign in to your account</p>

          <label>Email or Username</label>
          <input
            type="text"
            className={`Email-User ${emailError ? 'input-error' : ''}`}
            placeholder="Enter your email or username"
            value={email}
            onChange={handleEmailChange}
            maxLength={100}
          />
          {emailError && <p className="error">{emailError}</p>}

          <label>Password</label>
          <div className="password-wrapper">
            <input
              className={`Password ${passwordError ? 'input-error' : ''}`}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              maxLength={128}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
          {passwordError && <p className="error">{passwordError}</p>}

          <p className="forgot-password-link" style={{textAlign:"right",margin:"4px 0 12px"}}>
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/webbis/forgotpass")}
              style={{fontSize:"13px"}}
            >
              Forgot your password?
            </button>
          </p>

          <button className="submit" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
          <p className="noaccount">
            Don't have an account?
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/webbis/signup")}
            >
              Register Now
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
export default SignInPage;
