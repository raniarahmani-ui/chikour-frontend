import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../style/SignUp.css";
import checkImg from "../assets/checkbox.png";
import stars from "../assets/stars.png";
import logo from "../assets/light logo.svg";

const API_BASE_URL = "/api";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 8;

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [Pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [username, setUsername] = useState("");
  const [skill, setSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required.";
    } else if (!USERNAME_REGEX.test(username)) {
      newErrors.username = "Username must be 3-20 characters (letters, numbers, underscores only).";
    }

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!skill) {
      newErrors.skill = "Please select your primary skill.";
    }

    if (!Pass) {
      newErrors.Pass = "Password is required.";
    } else if (Pass.length < PASSWORD_MIN_LENGTH) {
      newErrors.Pass = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
    } else if (!/[A-Z]/.test(Pass)) {
      newErrors.Pass = "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(Pass)) {
      newErrors.Pass = "Password must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(Pass)) {
      newErrors.Pass = "Password must contain at least one number.";
    }

    if (!confirmPass) {
      newErrors.confirmPass = "Please confirm your password.";
    } else if (confirmPass !== Pass) {
      newErrors.confirmPass = "Passwords do not match.";
    }

    return newErrors;
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: Pass,
          skill: skill
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        navigate("/webbis/profile");
      } else {
        
        setErrors({ submit: result.message || "Registration failed. Please try again." });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: "Network error. Please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formvalidation">
      <div className="SignUpPage">
        <div className="userInfos">
          <div className="UpperText">
            <p className="p1">Create Account</p>
            <p className="p2">Join our community of Skilled Professionals</p>
          </div>

          {errors.submit && (
            <div className="form-error-banner">{errors.submit}</div>
          )}

          <div className="inputs">
            <div className="tf">
              <div className="usrname">
                <p>Username *</p>
                <input
                  className={`inputHolder ${errors.username ? 'input-error' : ''}`}
                  type="text"
                  placeholder="Choose your username (3-20 characters)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError('username');
                  }}
                  maxLength={20}
                />
                {errors.username && <p className="error">{errors.username}</p>}
              </div>

              <div className="mail">
                <p className="setMail">Email *</p>
                <input
                  className={`inputHolder ${errors.email ? 'input-error' : ''}`}
                  type="text"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  maxLength={100}
                />
                {errors.email && <p className="error">{errors.email}</p>}
              </div>

              <div className="skill">
                <p>Your Primary Skill *</p>
                <select 
                  className={`inputHolder ${errors.skill ? 'input-error' : ''}`}
                  name="Skill"
                  value={skill}
                  onChange={(e) => {
                    setSkill(e.target.value);
                    clearFieldError('skill');
                  }}
                >
                  <option value="">Select a skill</option>
                  <option value="cooking">Cooking</option>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="design">Design</option>
                  <option value="programming">Programming</option>
                  <option value="marketing">Marketing</option>
                  <option value="writing">Writing</option>
                  <option value="photography">Photography</option>
                </select>
                {errors.skill && <p className="error">{errors.skill}</p>}
              </div>

              <div className="pass1">
                <p className="setPass">Password *</p>
                <input
                  className={`inputHolder ${errors.Pass ? 'input-error' : ''}`}
                  type="password"
                  placeholder="Create a strong password"
                  value={Pass}
                  onChange={(e) => {
                    setPass(e.target.value);
                    clearFieldError('Pass');
                  }}
                  maxLength={128}
                />
                {errors.Pass && <p className="error">{errors.Pass}</p>}
                <p className="password-hint">
                  Min 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="pass2">
                <p className="confirmPass">Confirm Your Password *</p>
                <input
                  className={`inputHolder ${errors.confirmPass ? 'input-error' : ''}`}
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPass}
                  onChange={(e) => {
                    setConfirmPass(e.target.value);
                    clearFieldError('confirmPass');
                  }}
                  maxLength={128}
                />
                {errors.confirmPass && (
                  <p className="error">{errors.confirmPass}</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: "100%" }}>
            <button type="submit" className="createAccount" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'} <b>&rarr;</b>
            </button>
            <p style={{ textAlign: "center" }}>
              Already have an account ?{" "}
              <button
                type="button"
                className="signInBtn"
                onClick={() => navigate("/swapie/signin")}
              >
                <b>Sign in</b>
              </button>
            </p>
          </div>
        </div>
        <div className="informations">
          <div className="welcome">
            <img src={logo} alt="logo" className="logo" />
            <div>
              <p className="welcomeBonusHeader">Welcome Bonus</p>
            </div>
            <p className="welcomeTitle">Start Your Journey with Swapie</p>
            <p className="welcomeSubtitle">
              Exchange your skills, learn from experts, and grow your
              professional network.
            </p>

            <table className="features">
              <tr>
                <td>
                  <img src={checkImg} alt="check" className="checkboxImg" />
                </td>
                <td>
                  <p>50 welcome coins to get started</p>
                </td>
              </tr>
              <tr>
                <td>
                  <img src={checkImg} alt="check" className="checkboxImg" />
                </td>
                <td>
                  <p>Access to thousands of skilled professionals</p>
                </td>
              </tr>
              <tr>
                <td>
                  <img src={checkImg} alt="check" className="checkboxImg" />
                </td>
                <td>
                  <p>Secure coin-based exchange system</p>
                </td>
              </tr>
              <tr>
                <td>
                  <img src={checkImg} alt="check" className="checkboxImg" />
                </td>
                <td>
                  <p>Build your profile and earn reviews</p>
                </td>
              </tr>
            </table>

            <div className="coinCard">
              <div className="coinCardTop">
                <div className="starImage">
                  <img
                    src={stars}
                    alt="stars"
                    className="starsImg"
                    style={{ display: "inline" }}
                  />
                </div>
                <div className="freeCoins">
                  <p class="coinAmount">50 Welcome Coins</p>
                  <p class="startAxploring">Start exploring immediately</p>
                </div>
              </div>
              <p className="coinDescription">
                Use your welcome coins to book your first service or start
                offering your own skills to earn more!
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
