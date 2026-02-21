import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, csrfAPI, getCSRFToken, userAPI } from "../services/api";
import logoImage from "../images/Group.png";
import sparquerLogo from "../images/logo.svg"
import "../styles/login.css";
import { Modal, Form, Input, Radio, Button, message } from "antd";

const Login = () => {
  const [formData, setFormData] = useState({ login_id: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // if (!agreedToTerms) {
    //   setError("Please agree to the Terms of use and Privacy Policy");
    //   return;
    // }

    setError("");
    setIsLoading(true);

    try {
      // 1) Ensure CSRF cookie exists
      await csrfAPI.fetchToken();
      // (optional) debug
      // console.log("CSRF Token from cookie:", getCSRFToken());

      // 2) Attempt login
      const response = await authAPI.login({
        login_id: formData.login_id,
        password: formData.password,
      });

      // 3) Redirect based on role
      if (response.status === 200) {
        const role = response?.data?.role;
        if (role === "Admin") {
          navigate("/admin_dashboard", { replace: true });
        } else {
          navigate("/user_dashboard", { replace: true });
        }
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="login-container">
      {/* <img src={sparquerLogo} alt="Sparquer" className="sparquer-logo" /> */}

      <div className="login-left-panel">
        <div className="logo-container">
          <img
            src={logoImage}
            alt="Visitor Management System"
            className="main-logo"
          />
        </div>
      </div>

      <div className="login-right-panel">
        <div className="login-form-container">
          <h2 className="login-title">Login</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group-login">
              <label htmlFor="login_id">Login ID</label>
              <input
                type="text"
                id="login_id"
                name="login_id"
                value={formData.login_id}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your login ID"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group-login">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            {/* <div className="terms-container">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="terms-checkbox"
                />
                <label htmlFor="terms" className="terms-label">
                  By creating an account, I agree to our{" "}
                  <button type="button" className="terms-link">
                    Terms of use
                  </button>{" "}
                  and{" "}
                  <button type="button" className="terms-link">
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div> */}

            <button
              type="submit"
              className="submit-btn"
              disabled={
                isLoading || !formData.login_id || !formData.password
              }
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
