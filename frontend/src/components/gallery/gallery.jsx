import { useEffect, useState } from "react";
import { api } from "../../api";
import { useNavigate } from "react-router-dom";
import "./gallery.css";

function Gallery() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState("");
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (track) params.set("track", track);
        const response = await api(`/api/gallery?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load gallery");
        }

        setProjects(data.projects || []);
        setTracks(data.tracks || []);
      } catch (err) {
        console.error(err);
        setError("Could not load the public gallery.");
      } finally {
        setLoading(false);
      }
    };

    loadGallery();
  }, [query, track]);

  return (
    <div className="gallery-page">
      <header className="gallery-nav">
        <button className="gallery-brand" onClick={() => navigate("/")}>
          <svg
            className="gallery-flower-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m4.5 0a4.5 4.5 0 1 1-4.5 4.5M16.5 12H12m-4.5 0a4.5 4.5 0 1 0 4.5 4.5M7.5 12H12m0 4.5V12" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          <span>Hackathon Raptors</span>
        </button>

        <div className="gallery-nav-actions">
          <button className="gallery-home-btn" onClick={() => navigate("/")}>
            Home
          </button>
          <button
            className="gallery-signin-btn"
            onClick={() => navigate("/account/login")}
          >
            Sign In
          </button>
        </div>
      </header>

      <main className="gallery-content">
        <section className="gallery-heading">
          <div>
            <p className="gallery-eyebrow">PUBLIC GALLERY</p>
            <h1>Explore the projects</h1>
            <p>
              Browse the projects submitted to the hackathon. This gallery is
              public and does not require an account.
            </p>
          </div>
        </section>

        <section className="gallery-filters">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, teams, summaries..."
          />
          <select value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="">All tracks</option>
            {tracks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </section>

        {loading && (
          <div className="gallery-state">
            <div className="loading-spinner" />
            <p>Loading projects...</p>
          </div>
        )}

        {!loading && error && (
          <div className="gallery-state error-state">
            <div className="state-icon">!</div>
            <h2>Gallery unavailable</h2>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="gallery-state">
            <div className="state-icon">○</div>
            <h2>No projects yet</h2>
            <p>Projects will appear here once submissions are available.</p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <section className="project-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div className="project-card-top">
                  <span className="project-id">{project.id}</span>
                  <span className="project-track">{project.track}</span>
                </div>

                <h2>{project.title}</h2>

                <p className="project-summary">
                  {project.summary || "No project summary provided."}
                </p>

                <div className="project-meta">
                  <span>
                    <small>TEAM</small>
                    {project.team}
                  </span>
                  <span>
                    <small>SUBMITTED</small>
                    {project.submitted_at
                      ? new Date(project.submitted_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>

                {project.repo_url && (
                  <a
                    className="repo-btn"
                    href={project.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Repository
                    <span>↗</span>
                  </a>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default Gallery;
