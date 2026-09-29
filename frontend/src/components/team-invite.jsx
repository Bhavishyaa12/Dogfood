import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, readJson } from "../api";

export default function TeamInvite() {
  const { token } = useParams();
  const nav = useNavigate();

  const [team, setTeam] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await api(`/api/teams/invite/${token}`);
        const data = await readJson(response);

        setTeam(data.team);
      } catch (e) {
        console.error("Team invite error:", e);
        setMsg(e.message || "Could not load team invitation");
      }
    };

    loadTeam();
  }, [token]);

  const join = async () => {
    try {
      const response = await api(`/api/teams/invite/${token}/join`, {
        method: "POST",
      });

      const data = await readJson(response);

      console.log("Joined team:", data);
      nav("/dashboard");
    } catch (e) {
      console.error("Join team error:", e);
      setMsg(e.message || "Could not join team");
    }
  };

  return (
    <div className="dashboard-page">
      <main className="dashboard-content">
        <section className="dashboard-welcome">
          <p className="dashboard-eyebrow">TEAM INVITATION</p>

          <h1>{team?.name || "Team invite"}</h1>

          <p>{team?.event?.name || msg || "Loading team invitation..."}</p>

          {team && (
            <button className="submit-bttn" onClick={join}>
              Join team
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
