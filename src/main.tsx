import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider } from "./i18n";
import { openStorage } from "./storage";
import { App } from "./ui/App";
import "./ui/fonts.css";
import "./ui/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Élément #root introuvable");

const storage = await openStorage();
createRoot(root).render(
  <StrictMode>
    {/* Français jusqu'au lot 52 : la langue détectée et le sélecteur arrivent avec l'anglais (annexe 50.1). */}
    <I18nProvider locale="fr">
      <App storage={storage} />
    </I18nProvider>
  </StrictMode>,
);
