import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Piano from "./Piano.jsx";
import "./styles.css";
import "./site.css";

for (const el of document.querySelectorAll("[data-piano]")) {
  const { labels, song, demo, base } = el.dataset;
  el.classList.add("mounted");
  createRoot(el).render(
    <StrictMode>
      <Piano labels={labels} song={song || null} demo={demo === "true"} base={base ? Number(base) : 48} />
    </StrictMode>,
  );
}
