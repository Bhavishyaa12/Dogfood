import { useNavigate, useParams } from "react-router-dom";
import { api, readJson } from "../../api";
import "./judgeInvite.css";

export default function JudgeInvite() {
  const { token } = useParams();
  const nav = useNavigate();

  const accept = async () => {
    try {
      const response = await api(`/api/judge/invitations/${token}/accept`, {
        method: "POST",
      });

      const data = await readJson(response);

      console.log("Invitation accepted:", data);
      nav("/dashboard");
    } catch (e) {
      console.error("Judge invitation error:", e);
      alert(e.message || "Could not accept invitation");
    }
  };

  return (
    <div className="dashboard-page">
      <main className="dashboard-content">
        <section className="dashboard-welcome judge-invite-card">
          <p className="dashboard-eyebrow">JUDGE INVITATION</p>

          <h1>Join the judging panel.</h1>

          <p>
            You've been invited to join the judging panel for this event. Accept
            the invitation to continue to your judge dashboard.
          </p>

          <button className="judge-accept-btn" onClick={accept}>
            Accept invitation
          </button>
        </section>
      </main>
    </div>
  );
}
