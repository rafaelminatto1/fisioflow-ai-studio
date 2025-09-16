import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";
import { Notifications } from "@/react-app/components/Notifications";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Notifications />
  </StrictMode>
);
