import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { openStorage } from "./storage";
import { App } from "./ui/App";
import "./ui/fonts.css";
import "./ui/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

const storage = await openStorage();
createRoot(root).render(
  <StrictMode>
    <App storage={storage} />
  </StrictMode>,
);
