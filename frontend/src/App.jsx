import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./components/login/login.jsx";
import Dashboard from "./components/dashboard/dashboard.jsx";
import Home from "./components/home/home.jsx";
import Not_found from "./components/404/404.jsx";
import Register from "./components/register/register.jsx";
import Gallery from "./components/gallery/gallery.jsx";
import ProjectEditor from "./components/project-editor/project-editor.jsx";
import TeamInvite from "./components/team-invite.jsx";
import JudgeInvite from "./components/judge-invite/judge-invite.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account/login" element={<Login />} />
        <Route path="/account/register" element={<Register />} />;
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/projects/:id/edit" element={<ProjectEditor />} />
        <Route path="/team/invite/:token" element={<TeamInvite />} />
        <Route path="/judge/invite/:token" element={<JudgeInvite />} />
        <Route path="*" element={<Not_found />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
