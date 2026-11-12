/** Chevron vers le bas, couleur du texte ; tourné de 180° par le CSS quand la zone qu'il commande est ouverte (lot 61). */
export function Chevron() {
  return (
    <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
