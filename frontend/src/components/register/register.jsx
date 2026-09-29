import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, readJson, saveAuth } from "../../api";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(""); // Add error state

  const navigate = useNavigate();

  async function RegisterUser(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const response = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed. Please try again.");
        return;
      }

      saveAuth(data);
      navigate("/dashboard");
    } catch (error) {
      console.error("Network error:", error);
      setError("Could not connect to server. Please try again.");
    }
  }
  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <h1>Create an account</h1>

          <p className="subtitle">Join us to participate in hackathons !!!</p>

          <p className="register-prompt">
            Already have an account?{" "}
            <button
              type="button"
              className="toggle-link"
              onClick={() => navigate("/account/login")}
            >
              Sign In
            </button>
          </p>
        </div>

        <div className="screen-plant" aria-hidden="true">
          <svg
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="plant-svg"
          >
            <path
              d="M400 200 C 310 200, 260 220, 200 170"
              stroke="#15803d"
              strokeWidth="10"
              strokeLinecap="round"
            />

            <path
              d="M290 195 C 300 145, 250 135, 240 185 C 265 190, 280 195, 290 195 Z"
              fill="#22c55e"
            />

            <g transform="translate(180, 160)">
              <circle cx="0" cy="-48" r="32" fill="#4ade80" />
              <circle cx="45" cy="-15" r="32" fill="#4ade80" />
              <circle cx="28" cy="38" r="32" fill="#4ade80" />
              <circle cx="-28" cy="38" r="32" fill="#4ade80" />
              <circle cx="-45" cy="-15" r="32" fill="#4ade80" />

              <circle cx="0" cy="0" r="26" fill="#15803d" />
            </g>
          </svg>
        </div>

        {/* Error message display */}
        {error && (
          <div
            style={{
              color: "#dc2626",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={RegisterUser}>
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
            />

            <button
              type="button"
              className="eye-bttn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "◉" : "○"}
            </button>
          </div>

          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
            />

            <button
              type="button"
              className="eye-bttn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? "◉" : "○"}
            </button>
          </div>

          <button type="submit" className="submit-bttn">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
