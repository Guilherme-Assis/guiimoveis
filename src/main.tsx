import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Remove o splash imediatamente após o React montar (sem delays artificiais)
requestAnimationFrame(() => {
  const splash = document.getElementById("korretora-splash");
  if (splash) {
    splash.classList.add("fade-out");
    setTimeout(() => splash.remove(), 350);
  }
});
