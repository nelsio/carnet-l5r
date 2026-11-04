import { activeEffects, reminderText, schoolOf, schoolRankOf, suggestSchool, techniqueCategories } from "@carnet/core";
import { useStore } from "../../store";
import { chooseSchool, useSheet } from "./hooks";
import { AddButton, RemoveButton } from "./shared";
import { SpellAffinity } from "./Spells";

export function Techniques() {
  const { c, edit, set } = useSheet("techniques");
  const school = <SchoolTechniques />;
  const others = schoolOf(c) && (c.techniques.length > 0 || edit)
    ? <div className="label" style={{ marginTop: 12 }}>Autres techniques, kata</div>
    : null;
  if (edit) {
    return (
      <>
        {school}
        {others}
        {c.techniques.map((t, i) => (
          <div key={i} className="field" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="in" type="text" aria-label="Nom de la technique" placeholder="Nom de la technique" value={t.name} maxLength={120} onChange={(e) => set(["techniques", i, "name"], e.target.value)} />
              <RemoveButton list="techniques" index={i} name={t.name} />
            </div>
            <textarea className="in" aria-label={`Effet de ${t.name}`} placeholder="Effet" value={t.text} onChange={(e) => set(["techniques", i, "text"], e.target.value)} />
          </div>
        ))}
        <AddButton list="techniques" label="+ Technique / kata" item={() => ({ name: "", text: "" })} />
      </>
    );
  }
  return (
    <>
      {school}
      {others}
      {c.techniques.length
        ? c.techniques.map((t, i) => <div key={i} className="tech"><b>{t.name}</b><div className="prose muted">{t.text}</div></div>)
        : !schoolOf(c) && <p className="muted">Aucune technique notée.</p>}
    </>
  );
}

/** École du catalogue : les cinq rangs, résumés et badges ; rangs non atteints grisés (annexe C.5). */
function SchoolTechniques() {
  const { c, edit, set } = useSheet("techniques");
  const { state } = useStore();
  const school = schoolOf(c);
  const suggestion = state.mode === "edit" ? suggestSchool(c) : undefined;
  if (!school) {
    return (
      <>
        {suggestion && (
          <div className="suggest" role="group" aria-label="Suggestion d'école">
            <span>Associer à <b>{suggestion.name}</b> ?</span>
            <button type="button" className="btn sm" onClick={() => chooseSchool(set, suggestion.id)}>Associer</button>
          </div>
        )}
        {edit && <p className="hint" style={{ marginTop: 0 }}>Choisis une école dans « Techniques d'école » (bloc Identité, bouton « Edit ») pour ajouter ses techniques automatiquement.</p>}
      </>
    );
  }
  const rank = schoolRankOf(c);
  // Rappels chiffrés des rangs atteints (« +10 au ND de qui te ment »), annexe D.5.
  const valued = activeEffects(c).filter((e) => e.kind === "reminder" && e.value !== undefined);
  return (
    <div data-testid="school-techniques">
      <div className="schoolhead"><b>{school.name}</b> <span className="muted">· {school.clan} · Rang d'école {rank}</span></div>
      {school.spellcasting && <SpellAffinity page={school.spellcasting.page} />}
      {school.ranks.map((r) => {
        const on = r.rank <= rank;
        return (
          <div key={r.rank} className={`tech${on ? "" : " locked"}`} data-testid={`school-rank-${r.rank}`}>
            <div className="techtop">
              <b>R{r.rank} · {r.name}</b>
              <span>
                {on
                  ? techniqueCategories(r).map((cat) => <span key={cat} className={`badge b-${cat.replace(/\W/g, "")}`}>{cat}</span>)
                  : <span className="badge">rang {r.rank}</span>}
              </span>
            </div>
            <div className="muted">{r.summary}</div>
            {valued.filter((e) => e.rank === r.rank).map((e) => (
              <div key={e.key} className="hint" style={{ color: "var(--accent-ink)" }}>→ {reminderText(e, c)}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
