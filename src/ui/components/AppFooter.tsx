import type { ReactNode } from "react";
import { CARNET_LINKS } from "../../rules/links";
import { ExternalLink } from "./ExternalLink";

/**
 * Pied de page de tous les écrans (annexe M.3) : nom et version (lien vers les nouveautés), état d'enregistrement,
 * puis Guide · Signaler un bug · Projet. Sur mobile, les liens passent sous le nom.
 */
export function AppFooter({ status }: { status?: ReactNode }) {
  return (
    <footer className="appfoot">
      <span className="id"><span className="mini" aria-hidden="true">帳</span>Carnet de Rokugan</span>
      <a className="ver" href={CARNET_LINKS.releases} target="_blank" rel="noopener noreferrer"
        aria-label={`Version ${__APP_VERSION__} : nouveautés (nouvel onglet)`}>v{__APP_VERSION__}</a>
      {status}
      <nav aria-label="Liens du Carnet">
        <ExternalLink href={CARNET_LINKS.guide}>Guide</ExternalLink>
        <ExternalLink href={CARNET_LINKS.bug}>Signaler un bug</ExternalLink>
        <ExternalLink href={CARNET_LINKS.code}>Projet</ExternalLink>
      </nav>
    </footer>
  );
}
