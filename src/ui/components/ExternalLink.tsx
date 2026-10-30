import type { ReactNode } from "react";

/** Icône « lien externe » : flèche sortant d'un carré, couleur du texte (annexe L.1). */
export function ExtIcon() {
  return (
    <svg className="ext" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3H3.5A.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10M9 3h4v4M13 3 7.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Lien vers le portail de la campagne : nouvel onglet, sans référent, icône externe après le libellé.
 * `label` remplace le nom accessible quand le texte visible ne dit pas qu'un onglet s'ouvre (icône seule, nom de clan).
 */
export function ExternalLink({ href, className, label, children, onClick }: {
  href: string; className?: string; label?: string; children?: ReactNode; onClick?: () => void;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label} onClick={onClick}>
      {children}<ExtIcon />
    </a>
  );
}
