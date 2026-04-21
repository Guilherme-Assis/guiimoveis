import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Remove o splash screen do PWA após o React montar
requestAnimationFrame(() => {
  const splash = document.getElementById("korretora-splash");
  if (splash) {
    // Pequeno delay para garantir transição suave
    setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => splash.remove(), 500);
    }, 300);
  }
});
