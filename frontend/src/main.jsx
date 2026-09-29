import { createRoot } from "react-dom/client";
import "./index.css";
import "./components/login/login.css";
import "./components/dashboard/dashboard.css";
import "./components/home/home.css";
import "./components/404/404.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
