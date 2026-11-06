import { useState, type ReactNode } from "react";
import { CARNET_LINKS } from "../../rules/links";
import { useT } from "../../i18n";
import { emptyDraft } from "../contact";
import { ContactDialog } from "./ContactDialog";
import { ExternalLink } from "./ExternalLink";
import { APP_NAME } from "./Header";

function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Pied de page de tous les écrans (annexe M.3) : nom et version (lien vers les nouveautés), pastille Règles L5R 4e
 * (repliable, lot 41), état d'enregistrement, puis Guide · Contact · Signaler un bug · Projet. Sur mobile, les liens passent sous le nom.
 * Contact (lot 56, annexe 56) ouvre la fenêtre « Contacter l'auteur » ; le brouillon est gardé ici, jusqu'au rechargement.
 */
export function AppFooter({ status }: { status?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const t = useT().footer;
  const [cautionTerm, cautionText] = t.caution;
  return (
    <footer className="appfoot">
      <span className="id"><span className="mini" aria-hidden="true">帳</span>{APP_NAME}</span>
      <a className="ver" href={CARNET_LINKS.releases} target="_blank" rel="noopener noreferrer"
        aria-label={t.version(__APP_VERSION__)}>v{__APP_VERSION__}</a>
      <button type="button" className="rulesbtn" aria-expanded={open} aria-controls="rules-memo"
        onClick={() => setOpen((o) => !o)}>
        <span className="kj" aria-hidden="true">規</span>{t.rules}<Chevron />
      </button>
      {status}
      <nav aria-label={t.links}>
        <ExternalLink href={CARNET_LINKS.guide}>{t.guide}</ExternalLink>
        <button type="button" className="contactbtn" aria-haspopup="dialog" onClick={() => setContact(true)}>{t.contact}</button>
        <ExternalLink href={CARNET_LINKS.bug}>{t.bug}</ExternalLink>
        <ExternalLink href={CARNET_LINKS.code}>{t.project}</ExternalLink>
      </nav>
      {open && (
        <div className="rulespanel" id="rules-memo">
          <ul className="memo">
            {t.memo.map(([term, text]) => <li key={term}><b>{term}</b><span>{text}</span></li>)}
            <li><b>{cautionTerm}</b><span className="warn">{cautionText}</span></li>
          </ul>
        </div>
      )}
      {contact && <ContactDialog draft={draft} onDraft={setDraft} onClose={() => setContact(false)} />}
    </footer>
  );
}
