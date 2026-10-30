/** Pastille « JSON pas encore compatible », affichée tant que `FORGE_JSON_OK` vaut false (lot 27). */
export function ForgePending() {
  return <span className="pend" title="L'export JSON de la Forge ne s'importe pas encore dans le Carnet">JSON pas encore compatible</span>;
}
