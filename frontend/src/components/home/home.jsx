import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      {/* Sticky Top Header */}
      <header className="top-nav">
        <div className="nav-brand">
          <svg
            className="nav-flower-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m4.5 0a4.5 4.5 0 1 1-4.5 4.5M16.5 12H12m-4.5 0a4.5 4.5 0 1 0 4.5 4.5M7.5 12H12m0 4.5V12" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          <span className="brand-name">Hackathon Raptors</span>
        </div>
        <button
          className="nav-signin-bttn"
          onClick={() => navigate("/account/login")}
        >
          Sign In
        </button>
      </header>

      {/* Main Content shifted towards the center/right */}
      <main className="main-content">
        <section className="text-column">
          <h1 className="hero-title">Get access to all the hackathons </h1>

          <p className="hero-description">
            Hackathon Raptors is a Community Interest Company running premier
            competitive sprints for working software engineers, architects, and
            designers. Join builders from teams like Google, Microsoft, Amazon,
            Meta, NVIDIA, and Tesla.
          </p>

          <p className="hero-subtext">
            Compete across tracks in machine learning, high-scale systems, and
            open-source tooling with peer review and direct founder grants.
          </p>

          <div className="hero-actions">
            <button
              className="cta-primary-btn"
              onClick={() => navigate("/account/login")}
            >
              Join Hackathon
            </button>
            <button
              className="cta-secondary-btn"
              onClick={() => navigate("/gallery")}
            >
              View Fixtures
            </button>
          </div>
        </section>
      </main>

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

      <footer className="metrics-ribbon">
        <div className="metric-box">
          <span className="metric-number">40+</span>
          <span className="metric-name">Events Run</span>
        </div>
        <div className="metric-separator" />
        <div className="metric-box">
          <span className="metric-number">2,500+</span>
          <span className="metric-name">On Discord</span>
        </div>
        <div className="metric-separator" />
        <div className="metric-box">
          <span className="metric-number">1,500+</span>
          <span className="metric-name">Builders</span>
        </div>
        <div className="metric-separator" />
        <div className="metric-box">
          <span className="metric-number">300+</span>
          <span className="metric-name">Projects Shipped</span>
        </div>
        <div className="metric-separator" />
        <div className="metric-box">
          <span className="metric-number">30+</span>
          <span className="metric-name">Countries</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
