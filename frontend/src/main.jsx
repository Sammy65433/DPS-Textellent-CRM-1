import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/index.css";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/cards.css";
import "./styles/conversation.css";
import "./styles/forms.css";
import "./styles/email.css";
import "./styles/analytics.css";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
