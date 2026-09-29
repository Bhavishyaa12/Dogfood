import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, readJson, currentUser, logout } from "../../api";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const user = currentUser();
  const role = user?.role || "participant";
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [scores, setScores] = useState([]);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");
  const [project, setProject] = useState({
    event_id: "",
    team_id: "",
    track: "",
    title: "",
    summary: "",
    repo_url: "",
  });
  const [judgeForm, setJudgeForm] = useState({ event_id: "", email: "" });
  const [assignForm, setAssignForm] = useState({
    event_id: "",
    judge_id: "",
    project_id: "",
  });
  const [eventForm, setEventForm] = useState({
    name: "",
    starts_at: "",
    submissions_close: "",
    judging_close: "",
  });

  const load = async () => {
    try {
      const ev = await readJson(await api("/api/events"));
      setEvents(ev.events || []);
      if (["participant", "organizer"].includes(role)) {
        const t = await readJson(await api("/api/teams"));
        setTeams(t.teams || []);
        const p = await readJson(await api("/api/projects/mine"));
        setProjects(p.projects || []);
      }
      if (role === "judge") {
        const a = await readJson(await api("/api/judge/assignments"));
        setProjects(a.assignments || []);
        const s = await readJson(await api("/api/judge/scores"));
        setScores(s.scores || []);
      }
      if (role === "organizer" || role === "admin") {
        const event = (ev.events || [])[0];
        if (event) {
          const d = await readJson(
            await api(`/api/judge/dashboard/${event.id}`),
          );
          setProgress(d);
        }
      }
    } catch (e) {
      setMessage(e.message);
    }
  };
  useEffect(() => {
    load();
  }, [role]);

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      const d = await readJson(
        await api("/api/teams", {
          method: "POST",
          body: JSON.stringify({ event_id: events[0]?.id, name: teamName }),
        }),
      );
      setMessage(`Team created. Invite link: ${d.inviteUrl}`);
      setTeamName("");
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  const createProject = async (e) => {
    e.preventDefault();
    try {
      await readJson(
        await api("/api/projects", {
          method: "POST",
          body: JSON.stringify(project),
        }),
      );
      setMessage("Draft project created.");
      setProject({ ...project, title: "", summary: "", repo_url: "" });
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  const submit = async (id) => {
    try {
      await readJson(
        await api(`/api/projects/${id}/submit`, { method: "POST" }),
      );
      setMessage("Project submitted.");
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        tracks: [{ id: "trk_01", name: "General" }],
        prizes: [{ place: "1st", amount: 800 }],
        rubric: [
          { key: "functionality", name: "Functionality", weight: 40 },
          { key: "quality", name: "Quality", weight: 25 },
          { key: "impact", name: "Impact", weight: 20 },
          { key: "innovation", name: "Innovation", weight: 15 },
        ],
      };
      await readJson(
        await api("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      );
      setMessage("Event created.");
      setEventForm({
        name: "",
        starts_at: "",
        submissions_close: "",
        judging_close: "",
      });
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  const inviteJudge = async (e) => {
    e.preventDefault();
    try {
      const d = await readJson(
        await api("/api/judge/invitations", {
          method: "POST",
          body: JSON.stringify(judgeForm),
        }),
      );
      setMessage(`Invitation created: ${d.inviteUrl}`);
      setJudgeForm({ ...judgeForm, email: "" });
    } catch (e) {
      setMessage(e.message);
    }
  };
  const assignJudge = async (e) => {
    e.preventDefault();
    try {
      await readJson(
        await api("/api/judge/assignments", {
          method: "POST",
          body: JSON.stringify(assignForm),
        }),
      );
      setMessage("Judge assigned.");
    } catch (e) {
      setMessage(e.message);
    }
  };
  const doLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-nav">
        <button className="dashboard-brand" onClick={() => navigate("/")}>
          <svg
            className="dashboard-flower-icon"
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
        <div className="dashboard-actions">
          <button
            className="dashboard-gallery-btn"
            onClick={() => navigate("/gallery")}
          >
            Public Gallery
          </button>
          <button className="dashboard-logout" onClick={doLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-welcome">
          <p className="dashboard-eyebrow">{role.toUpperCase()} DASHBOARD</p>
          <h1>Welcome back.</h1>
          <p>
            Manage your hackathon activity, submissions, and judging work from
            one place.
          </p>
        </section>

        {message && <div className="dashboard-message">{message}</div>}

        {(role === "participant" || role === "organizer") && (
          <>
            <section className="dashboard-grid">
              <article className="dashboard-card dashboard-card-primary">
                <div className="card-icon">◇</div>
                <h2>Build your team</h2>
                <p>
                  Create a team for the active event and share its invite link
                  with collaborators.
                </p>
                <form className="mini-form" onSubmit={createTeam}>
                  <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Team name"
                    required
                  />
                  <button>
                    Create team <span>→</span>
                  </button>
                </form>
              </article>
              <article className="dashboard-card">
                <div className="card-icon">⌁</div>
                <h2>Submit a project</h2>
                <p>
                  Projects stay editable as drafts until the event submission
                  deadline.
                </p>
                <form className="mini-form" onSubmit={createProject}>
                  <select
                    value={project.event_id}
                    onChange={(e) =>
                      setProject({ ...project, event_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Event</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={project.team_id}
                    onChange={(e) =>
                      setProject({ ...project, team_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={project.track}
                    onChange={(e) =>
                      setProject({ ...project, track: e.target.value })
                    }
                    required
                  >
                    <option value="">Track</option>
                    {(
                      events.find((e) => e.id === project.event_id)?.tracks ||
                      []
                    ).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={project.title}
                    onChange={(e) =>
                      setProject({ ...project, title: e.target.value })
                    }
                    placeholder="Project title"
                  />
                  <input
                    value={project.repo_url}
                    onChange={(e) =>
                      setProject({ ...project, repo_url: e.target.value })
                    }
                    placeholder="Repository URL"
                  />
                  <textarea
                    value={project.summary}
                    onChange={(e) =>
                      setProject({ ...project, summary: e.target.value })
                    }
                    placeholder="Short summary"
                  />
                  <button>
                    Create draft <span>→</span>
                  </button>
                </form>
              </article>
              <article className="dashboard-card">
                <div className="card-icon">✓</div>
                <h2>Account</h2>
                <p>
                  <strong>{user?.name}</strong>
                  <br />
                  {user?.email}
                </p>
                <button onClick={() => navigate("/gallery")}>
                  Explore gallery <span>→</span>
                </button>
              </article>
            </section>
            <section className="dashboard-panel">
              <h2>Your projects</h2>
              {projects.length === 0 ? (
                <p className="muted">No projects yet.</p>
              ) : (
                projects.map((p) => (
                  <div className="dashboard-row" key={p.id}>
                    <div>
                      <strong>{p.title || "Untitled draft"}</strong>
                      <span>
                        {p.id} · {p.status}
                      </span>
                    </div>
                    <div className="row-actions">
                      <button
                        onClick={() => navigate(`/projects/${p.id}/edit`)}
                      >
                        Edit
                      </button>
                      {p.status === "draft" && (
                        <button onClick={() => submit(p.id)}>Submit</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
            <section className="dashboard-panel">
              <h2>Your teams</h2>
              {teams.map((t) => (
                <div className="dashboard-row" key={t.id}>
                  <div>
                    <strong>{t.name}</strong>
                    <span>
                      {t.event?.name || "Event"} · {t.members?.length || 0}{" "}
                      members
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {(role === "organizer" || role === "admin") && (
          <>
            <section className="dashboard-grid">
              <article className="dashboard-card dashboard-card-primary">
                <div className="card-icon">＋</div>
                <h2>Create event</h2>
                <p>
                  Configure the event dates and start with a weighted judging
                  rubric.
                </p>
                <form className="mini-form" onSubmit={createEvent}>
                  <input
                    value={eventForm.name}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, name: e.target.value })
                    }
                    placeholder="Event name"
                    required
                  />
                  <input
                    type="datetime-local"
                    value={eventForm.starts_at}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, starts_at: e.target.value })
                    }
                    required
                  />
                  <input
                    type="datetime-local"
                    value={eventForm.submissions_close}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        submissions_close: e.target.value,
                      })
                    }
                    required
                  />
                  <input
                    type="datetime-local"
                    value={eventForm.judging_close}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        judging_close: e.target.value,
                      })
                    }
                    required
                  />
                  <button>
                    Create event <span>→</span>
                  </button>
                </form>
              </article>
              <article className="dashboard-card dashboard-card-primary">
                <div className="card-icon">◎</div>
                <h2>Judge invitations</h2>
                <p>
                  Invite judges by email; invitations are accepted through a
                  backend-issued token.
                </p>
                <form className="mini-form" onSubmit={inviteJudge}>
                  <select
                    value={judgeForm.event_id}
                    onChange={(e) =>
                      setJudgeForm({ ...judgeForm, event_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Event</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={judgeForm.email}
                    onChange={(e) =>
                      setJudgeForm({ ...judgeForm, email: e.target.value })
                    }
                    placeholder="judge@example.org"
                    type="email"
                    required
                  />
                  <button>
                    Invite judge <span>→</span>
                  </button>
                </form>
              </article>
              <article className="dashboard-card">
                <div className="card-icon">≋</div>
                <h2>Assignment</h2>
                <p>
                  Assign a judge to a submitted project. Duplicate assignments
                  are rejected by the database.
                </p>
                <form className="mini-form" onSubmit={assignJudge}>
                  <select
                    value={assignForm.event_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, event_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Event</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={assignForm.judge_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, judge_id: e.target.value })
                    }
                    placeholder="Judge user ID"
                    required
                  />
                  <input
                    value={assignForm.project_id}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        project_id: e.target.value,
                      })
                    }
                    placeholder="Project ID"
                    required
                  />
                  <button>
                    Assign <span>→</span>
                  </button>
                </form>
              </article>
              <article className="dashboard-card">
                <div className="card-icon">▤</div>
                <h2>Export results</h2>
                <p>
                  Download organizer-only CSV results including raw and
                  normalized scores.
                </p>
                <button
                  onClick={async () => {
                    const r = await api("/api/export.csv");
                    const blob = await r.blob();
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = "dogfood-results.csv";
                    a.click();
                  }}
                >
                  Export CSV <span>↓</span>
                </button>
              </article>
            </section>
            {progress && (
              <section className="dashboard-panel">
                <h2>Live judging progress</h2>
                <div className="dashboard-info">
                  <div>
                    <span className="info-label">ASSIGNMENTS</span>
                    <strong>{progress.summary.assignments}</strong>
                  </div>
                  <div>
                    <span className="info-label">COMPLETED</span>
                    <strong>{progress.summary.scores}</strong>
                  </div>
                  <div>
                    <span className="info-label">PROGRESS</span>
                    <strong>{progress.summary.completionRate}%</strong>
                  </div>
                </div>
                {progress.projects.map((p) => (
                  <div className="dashboard-row" key={p.id}>
                    <div>
                      <strong>{p.title}</strong>
                      <span>
                        {p.track} · {p.completed}/{p.assigned} reviews ·{" "}
                        {p.average == null
                          ? "Awaiting scores"
                          : p.average.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {role === "judge" && (
          <section className="dashboard-panel">
            <h2>Assigned projects</h2>
            {projects.length === 0 ? (
              <p className="muted">No projects assigned.</p>
            ) : (
              projects.map((a) => (
                <JudgeCard
                  key={a.project.id}
                  assignment={a}
                  existing={scores.find((s) => s.project?.id === a.project.id)}
                />
              ))
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function JudgeCard({ assignment, existing }) {
  const [values, setValues] = useState(existing?.criteria || {});
  const [comment, setComment] = useState(existing?.comment || "");
  const [message, setMessage] = useState("");
  const score = async () => {
    try {
      const r = await api("/api/judge/scores", {
        method: "POST",
        body: JSON.stringify({
          project_id: assignment.project.id,
          criteria: values,
          comment,
        }),
      });
      await readJson(r);
      setMessage("Score saved.");
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <div className="judge-card">
      <div>
        <strong>{assignment.project.title}</strong>
        <span>
          {assignment.project.team} · {assignment.project.track}
        </span>
      </div>
      {(assignment.event?.rubric || []).map((c) => (
        <label key={c.key} className="score-field">
          {c.name} <small>{c.weight}%</small>
          <input
            type="number"
            min="0"
            max="5"
            step="0.5"
            value={values[c.key] ?? ""}
            onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
          />
        </label>
      ))}
      <textarea
        placeholder="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button onClick={score}>Save score</button>
      {message && <span className="muted">{message}</span>}
    </div>
  );
}
export default Dashboard;
