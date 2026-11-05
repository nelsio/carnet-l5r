import { useState } from "react";
import { insightPoints, schoolsByClan, spellcastingOf, suggestedInsightRank, SPELL_RINGS, type Character } from "@carnet/core";
import { useLocale, useT } from "../../../i18n";
import { decimal } from "../../format";
import { poolLabel } from "../../rolls";
import { useCharacter, useStore } from "../../store";
import { RichSelect, RingOption } from "../RichSelect";
import { NumberField } from "../fields";
import { chooseSchool, poolOf, useSheet } from "./hooks";
import { Field, OptionalNumber } from "./shared";

/** « Rang saisi 3 · calculé 1 » quand le Rang d'Insight saisi diffère du calcul : ni blocage ni correction (annexe K). */
function InsightMismatch({ c }: { c: Character }) {
  const t = useT();
  const computed = suggestedInsightRank(insightPoints(c));
  if (c.insightRank === computed) return null;
  return <span className="tag warn" data-testid="insight-mismatch">{t.sheet.identity.insightMismatch(c.insightRank, computed)}</span>;
}

export function Identity() {
  const { c, edit, set } = useSheet("identity");
  const s = useT().sheet.identity;
  const { intl } = useLocale();
  const text = (path: string[], value: string, extra?: { list?: string; maxLength?: number }) => (
    <input className="in" type="text" value={value} maxLength={extra?.maxLength ?? 80} list={extra?.list} onChange={(e) => set(path, e.target.value)} />
  );
  const num = (path: string[], value: number, min: number, max?: number, step = 1) => (
    <NumberField min={min} max={max} step={step} value={value} onChange={(n) => set(path, n)} />
  );

  if (edit) {
    return (
      <div className="form-grid">
        <Field label={s.name}>{text(["name"], c.name)}</Field>
        <Field label={s.clan}>
          {text(["clan"], c.clan, { list: "clan-list" })}
          <datalist id="clan-list">{s.clanSuggestions.map((n) => <option key={n} value={n} />)}</datalist>
        </Field>
        <Field label={s.family}>{text(["family"], c.family)}</Field>
        <Field label={s.school}>{text(["school"], c.school, { maxLength: 120 })}</Field>
        <Field label={s.schoolTechniques} wide>
          <RichSelect variant="catalogue" value={c.schoolId ?? ""} onChange={(v) => chooseSchool(set, v)}>
            <option value=""><span className="n">{s.noSchool}</span></option>
            {schoolsByClan().map((g) => (
              <optgroup key={g.clan} label={g.clan}>
                <legend>{g.clan}</legend>
                {g.schools.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    <span className="n">{sc.name}</span><span className="m">{sc.class}</span><span className="d">{s.firstRank(sc.ranks[0]?.name)}</span>
                  </option>
                ))}
              </optgroup>
            ))}
          </RichSelect>
        </Field>
        {spellcastingOf(c)?.affinity === "choice" && (
          <Field label={s.affinity}>
            <RichSelect variant="anneau" value={c.affinity ?? ""} onChange={(v) => set(["affinity"], v || undefined)}>
              <RingOption value="" label={s.toChoose} />
              {SPELL_RINGS.map((r) => <RingOption key={r} ring={r} />)}
            </RichSelect>
          </Field>
        )}
        <Field label={s.schoolRank}>
          <OptionalNumber
            min={1} value={c.schoolRank ?? undefined} placeholder={s.schoolRankPlaceholder(c.insightRank)} aria-label={s.schoolRank}
            onChange={(n) => set(["schoolRank"], n ?? null)}
          />
        </Field>
        <Field
          label={s.insightRank}
          hint={<span className="hint" style={{ margin: 0 }} data-testid="insight-computed">
            {s.insightComputed(insightPoints(c), suggestedInsightRank(insightPoints(c)))} <InsightMismatch c={c} />
          </span>}
        >{num(["insightRank"], c.insightRank, 1, 10)}</Field>
        <Field label={s.insightBonus}>
          <OptionalNumber min={-50} max={200} value={c.insightBonus} placeholder="0" onChange={(n) => set(["insightBonus"], n)} />
        </Field>
        <Field label={s.honor}>{num(["honor"], c.honor, 0, 10, 0.1)}</Field>
        <Field label={s.glory}>{num(["glory"], c.glory, 0, 10, 0.1)}</Field>
        <Field label={s.status}>{num(["status"], c.status, 0, 10, 0.1)}</Field>
        <Field label={s.xpTotal}>{num(["xp", "total"], c.xp.total, 0)}</Field>
        <Field label={s.xpSpent}>{num(["xp", "spent"], c.xp.spent, 0)}</Field>
        <div style={{ gridColumn: "1/-1" }}><DeleteCharacter /></div>
      </div>
    );
  }
  const init = poolOf(c, { kind: "initiative" });
  return (
    <div className="kv">
      <div><span className="label">{s.honor}</span><b>{decimal(c.honor, intl)}</b></div>
      <div><span className="label">{s.glory}</span><b>{decimal(c.glory, intl)}</b></div>
      <div><span className="label">{s.status}</span><b>{decimal(c.status, intl)}</b></div>
      <div><span className="label">{s.xpFree}</span><b>{c.xp.total - c.xp.spent}</b></div>
      <div>
        <span className="label">{s.insight}</span>
        <b data-testid="sheet-insight">{s.insightSummary(insightPoints(c), suggestedInsightRank(insightPoints(c)))}</b>
        <InsightMismatch c={c} />
      </div>
      <div><span className="label">{s.initiative}</span><b className="pool" data-testid="sheet-initiative">{poolLabel(init)}</b></div>
    </div>
  );
}

/** Même motif que la Bibliothèque : question, « Supprimer définitivement » et « Annuler » (annexe H.7 X1). */
function DeleteCharacter() {
  const { state, library } = useStore();
  const t = useT();
  const s = t.sheet.identity;
  const c = useCharacter();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return <p><button type="button" className="btn" onClick={() => setConfirm(true)}>{s.delete}</button></p>;
  }
  return (
    <p className="confirm-line">
      <span className="muted">{s.deleteConfirm(c.name)}</span>
      <button type="button" className="btn sm danger" onClick={() => state.entryId && void library.remove(state.entryId)}>{s.deleteForever}</button>
      <button type="button" className="btn sm" onClick={() => setConfirm(false)}>{t.common.cancel}</button>
    </p>
  );
}
