import { useState, type ReactNode } from "react";
import { CARNET_LINKS } from "../../rules/links";
import { ExternalLink } from "./ExternalLink";

function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Pied de page de tous les écrans (annexe M.3) : nom et version (lien vers les nouveautés), pastille Règles L5R 4e
 * (repliable, lot 41), état d'enregistrement, puis Guide · Signaler un bug · Projet. Sur mobile, les liens passent sous le nom.
 */
export function AppFooter({ status }: { status?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <footer className="appfoot">
      <span className="id"><span className="mini" aria-hidden="true">帳</span>Carnet de Rokugan</span>
      <a className="ver" href={CARNET_LINKS.releases} target="_blank" rel="noopener noreferrer"
        aria-label={`Version ${__APP_VERSION__} : nouveautés (nouvel onglet)`}>v{__APP_VERSION__}</a>
      <button type="button" className="rulesbtn" aria-expanded={open} aria-controls="rules-memo"
        onClick={() => setOpen((o) => !o)}>
        <span className="kj" aria-hidden="true">規</span>Règles L5R 4e<Chevron />
      </button>
      {status}
      <nav aria-label="Liens du Carnet">
        <ExternalLink href={CARNET_LINKS.guide}>Guide</ExternalLink>
        <ExternalLink href={CARNET_LINKS.bug}>Signaler un bug</ExternalLink>
        <ExternalLink href={CARNET_LINKS.code}>Projet</ExternalLink>
      </nav>
      {open && (
        <div className="rulespanel" id="rules-memo">
          <ul className="memo">
            <li><b>Système</b><span>Roll &amp; Keep, L5R 4e édition</span></li>
            <li><b>Explosion</b><span>sur 10 ; dégâts sur 9 et 10 avec Kenjutsu ou Armes lourdes au rang 7</span></li>
            <li><b>Augmentations</b><span>+5 au ND chacune, maximum = Anneau de Vide</span></li>
            <li><b>Blessures</b><span>la pénalité s'ajoute au ND</span></li>
            <li><b>Duel, bataille</b><span className="warn">procédures résumées : vérifie le détail dans ton livre de base</span></li>
          </ul>
        </div>
      )}
    </footer>
  );
}
