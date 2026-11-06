import { activeEffects, schoolOf, schoolRankOf, suggestSchool, techniqueCategories } from "@carnet/core";
import { useLocale, useT } from "../../../i18n";
import { useCatalog } from "../../../i18n/catalog";
import { useStore } from "../../store";
import { chooseSchool, useSheet } from "./hooks";
import { AddButton, RemoveButton } from "./shared";
import { SpellAffinity } from "./Spells";

/** Couleur du badge : classes d'avant le lot 53 (`b-cocher`, `b-rappel`). */
const BADGE_CLASS = { auto: "b-auto", optional: "b-cocher", reminder: "b-rappel", text: "b-texte" } as const;

export function Techniques() {
  const { c, edit, set } = useSheet("techniques");
  const s = useT().sheet.techniques;
  const school = <SchoolTechniques />;
  const others = schoolOf(c) && (c.techniques.length > 0 || edit)
    ? <div className="label" style={{ marginTop: 12 }}>{s.others}</div>
    : null;
  if (edit) {
    return (
      <>
        {school}
        {others}
        {c.techniques.map((tq, i) => (
          <div key={i} className="field" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="in" type="text" aria-label={s.name} placeholder={s.name} value={tq.name} maxLength={120} onChange={(e) => set(["techniques", i, "name"], e.target.value)} />
              <RemoveButton list="techniques" index={i} name={tq.name} />
            </div>
            <textarea className="in" aria-label={s.effectOf(tq.name)} placeholder={s.effect} value={tq.text} onChange={(e) => set(["techniques", i, "text"], e.target.value)} />
          </div>
        ))}
        <AddButton list="techniques" label={s.add} item={() => ({ name: "", text: "" })} />
      </>
    );
  }
  return (
    <>
      {school}
      {others}
      {c.techniques.length
        ? c.techniques.map((tq, i) => <div key={i} className="tech"><b>{tq.name}</b><div className="prose muted">{tq.text}</div></div>)
        : !schoolOf(c) && <p className="muted">{s.empty}</p>}
    </>
  );
}

/** École du catalogue : les cinq rangs, résumés et badges ; rangs non atteints grisés (annexe C.5). */
function SchoolTechniques() {
  const { c, edit, set } = useSheet("techniques");
  const s = useT().sheet.techniques;
  const categories = useT().rules.techniqueCategories;
  const cat = useCatalog();
  const { locale } = useLocale();
  const { state } = useStore();
  const school = schoolOf(c);
  const suggestion = state.mode === "edit" ? suggestSchool(c) : undefined;
  if (!school) {
    return (
      <>
        {suggestion && (
          <div className="suggest" role="group" aria-label={s.suggestion}>
            <span>{s.associateTo} <b>{cat.schoolName(suggestion)}</b> ?</span>
            <button type="button" className="btn sm" onClick={() => chooseSchool(set, suggestion.id, locale)}>{s.associate}</button>
          </div>
        )}
        {edit && <p className="hint" style={{ marginTop: 0 }}>{s.chooseSchool}</p>}
      </>
    );
  }
  const rank = schoolRankOf(c);
  // Rappels chiffrés des rangs atteints (« +10 au ND de qui te ment »), annexe D.5.
  const valued = activeEffects(c).filter((e) => e.kind === "reminder" && e.value !== undefined);
  return (
    <div data-testid="school-techniques">
      <div className="schoolhead"><b>{cat.schoolName(school)}</b> <span className="muted">{s.schoolMeta(cat.clan(school.clan), rank)}</span></div>
      {school.spellcasting && <SpellAffinity page={school.spellcasting.page} />}
      {school.ranks.map((r) => {
        const on = r.rank <= rank;
        return (
          <div key={r.rank} className={`tech${on ? "" : " locked"}`} data-testid={`school-rank-${r.rank}`}>
            <div className="techtop">
              <b>{s.rankTitle(r.rank, cat.rankName(school, r))}</b>
              <span>
                {on
                  ? techniqueCategories(r).map((cat) => <span key={cat} className={`badge ${BADGE_CLASS[cat]}`}>{categories[cat]}</span>)
                  : <span className="badge">{s.lockedRank(r.rank)}</span>}
              </span>
            </div>
            <div className="muted">{cat.rankSummary(school, r)}</div>
            {valued.filter((e) => e.rank === r.rank).map((e) => (
              <div key={e.key} className="hint" style={{ color: "var(--accent-ink)" }}>→ {cat.reminder(e, c)}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
