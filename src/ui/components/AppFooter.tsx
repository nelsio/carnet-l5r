import { useState, type ReactNode } from "react";
import { carnetLinks } from "../../rules/links";
import { useLocale, useT } from "../../i18n";
import { emptyDraft } from "../contact";
import { ContactDialog } from "./ContactDialog";
import { ExternalLink } from "./ExternalLink";
import { APP_NAME } from "./Header";

/**
 * Pied de page de tous les écrans (annexe M.3, annexe 60) : nom et version (lien vers les nouveautés), état d'enregistrement,
 * puis Guide · Contact · Signaler un bug · Projet. Sur mobile, les liens passent sous le nom.
 * Contact (lot 56, annexe 56) ouvre la fenêtre « Contacter l'auteur » ; le brouillon est gardé ici, jusqu'au rechargement.
 */
export function AppFooter({ status }: { status?: ReactNode }) {
  const [contact, setContact] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const t = useT().footer;
  const links = carnetLinks(useLocale().locale);
  return (
    <footer className="appfoot">
      <span className="id"><span className="mini" aria-hidden="true">帳</span>{APP_NAME}</span>
      <a className="ver" href={links.releases} target="_blank" rel="noopener noreferrer"
        aria-label={t.version(__APP_VERSION__)}>v{__APP_VERSION__}</a>
      {status}
      <nav aria-label={t.links}>
        <ExternalLink href={links.guide}>{t.guide}</ExternalLink>
        <button type="button" className="contactbtn" aria-haspopup="dialog" onClick={() => setContact(true)}>{t.contact}</button>
        <ExternalLink href={links.bug}>{t.bug}</ExternalLink>
        <ExternalLink href={links.code}>{t.project}</ExternalLink>
      </nav>
      {contact && <ContactDialog draft={draft} onDraft={setDraft} onClose={() => setContact(false)} />}
    </footer>
  );
}
