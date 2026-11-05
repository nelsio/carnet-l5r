import { useT } from "../../i18n";

/** Pastille « JSON pas encore compatible », affichée tant que `FORGE_JSON_OK` vaut false (lot 27). */
export function ForgePending() {
  const t = useT().file;
  return <span className="pend" title={t.forgePendingTitle}>{t.forgePending}</span>;
}
