import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, initialLocale } from "./i18n";
import { openStorage } from "./storage";
import { App } from "./ui/App";
import "./ui/fonts.css";
import "./ui/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

const storage = await openStorage();
createRoot(root).render(
  <StrictMode>
    {/* Langue mémorisée, sinon celle du navigateur (annexe 52.2). */}
    <I18nProvider locale={initialLocale()}>
      <App storage={storage} />
    </I18nProvider>
  </StrictMode>,
);
