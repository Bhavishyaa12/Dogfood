import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, saveAuth } from "../../api";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setemail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Add error state

  const navigate = useNavigate();

  async function Auth(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
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
          <h1>Sign in</h1>

          <p className="subtitle">Get access to our hackathons !!!</p>

          <p className="register-prompt">
            Don't have an account?{" "}
            <button
              type="button"
              className="toggle-link"
              onClick={() => navigate("/account/register")}
            >
              Register
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
              color: "red",
              marginBottom: "16px",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={Auth}>
          <input
            type="text"
            placeholder="email"
            value={email}
            onChange={(e) => {
              setemail(e.target.value);
              setError(""); // Clear error when user starts typing
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
                setError(""); // Clear error when user starts typing
              }}
              required
            />

            <button
              type="button"
              className="eye-bttn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7 10-7 10-7-3-7-10-7a9.74 9.74 0 0 0-5.39 1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button type="button" className="forgot-password-bttn">
            Forgot your password?
          </button>

          <button type="submit" className="submit-bttn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

