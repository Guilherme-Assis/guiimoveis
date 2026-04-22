import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/raleway/400.css";
import "@fontsource/raleway/500.css";
import "@fontsource/raleway/600.css";
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
