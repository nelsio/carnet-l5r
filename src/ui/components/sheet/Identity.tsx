import { useState } from "react";
import { insightPoints, schoolsByClan, spellcastingOf, suggestedInsightRank, SPELL_RINGS, type Character } from "@carnet/core";
import { decimal } from "../../format";
import { poolLabel } from "../../rolls";
import { useCharacter, useStore } from "../../store";
import { RichSelect, RingOption } from "../RichSelect";
import { NumberField } from "../fields";
import { CLAN_SUGGESTIONS } from "./constants";
import { chooseSchool, poolOf, useSheet } from "./hooks";
import { Field, OptionalNumber } from "./shared";

/** « Rang saisi 3 · calculé 1 » quand le Rang d'Insight saisi diffère du calcul : ni blocage ni correction (annexe K). */
function InsightMismatch({ c }: { c: Character }) {
  const computed = suggestedInsightRank(insightPoints(c));
  if (c.insightRank === computed) return null;
  return <span className="tag warn" data-testid="insight-mismatch">Rang saisi {c.insightRank} · calculé {computed}</span>;
}

export function Identity() {
  const { c, edit, set } = useSheet("identity");
  const text = (path: string[], value: string, extra?: { list?: string; maxLength?: number }) => (
    <input className="in" type="text" value={value} maxLength={extra?.maxLength ?? 80} list={extra?.list} onChange={(e) => set(path, e.target.value)} />
  );
  const num = (path: string[], value: number, min: number, max?: number, step = 1) => (
    <NumberField min={min} max={max} step={step} value={value} onChange={(n) => set(path, n)} />
  );

  if (edit) {
    return (
      <div className="form-grid">
        <Field label="Nom">{text(["name"], c.name)}</Field>
        <Field label="Clan">
          {text(["clan"], c.clan, { list: "clan-list" })}
          <datalist id="clan-list">{CLAN_SUGGESTIONS.map((n) => <option key={n} value={n} />)}</datalist>
        </Field>
        <Field label="Famille">{text(["family"], c.family)}</Field>
        <Field label="École (nom affiché)">{text(["school"], c.school, { maxLength: 120 })}</Field>
        <Field label="Techniques d'école" wide>
          <RichSelect variant="catalogue" value={c.schoolId ?? ""} onChange={(v) => chooseSchool(set, v)}>
            <option value=""><span className="n">— Aucune (techniques libres)</span></option>
            {schoolsByClan().map((g) => (
              <optgroup key={g.clan} label={g.clan}>
                <legend>{g.clan}</legend>
                {g.schools.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    <span className="n">{sc.name}</span><span className="m">{sc.class}</span><span className="d">R1 : {sc.ranks[0]?.name}</span>
                  </option>
                ))}
              </optgroup>
            ))}
          </RichSelect>
        </Field>
        {spellcastingOf(c)?.affinity === "choice" && (
          <Field label="Affinité (shugenja)">
            <RichSelect variant="anneau" value={c.affinity ?? ""} onChange={(v) => set(["affinity"], v || undefined)}>
              <RingOption value="" label="— à choisir" />
              {SPELL_RINGS.map((r) => <RingOption key={r} ring={r} />)}
            </RichSelect>
          </Field>
        )}
        <Field label="Rang d'école">
          <OptionalNumber
            min={1} value={c.schoolRank ?? undefined} placeholder={`${c.insightRank} (Rang d'Insight)`} aria-label="Rang d'école"
            onChange={(n) => set(["schoolRank"], n ?? null)}
          />
        </Field>
        <Field
          label="Rang d'Insight"
          hint={<span className="hint" style={{ margin: 0 }} data-testid="insight-computed">
            Calculé : {insightPoints(c)} pts → Rang {suggestedInsightRank(insightPoints(c))} <InsightMismatch c={c} />
          </span>}
        >{num(["insightRank"], c.insightRank, 1, 10)}</Field>
        <Field label="Bonus d'Insight (MJ)">
          <OptionalNumber min={-50} max={200} value={c.insightBonus} placeholder="0" onChange={(n) => set(["insightBonus"], n)} />
        </Field>
        <Field label="Honneur">{num(["honor"], c.honor, 0, 10, 0.1)}</Field>
        <Field label="Gloire">{num(["glory"], c.glory, 0, 10, 0.1)}</Field>
        <Field label="Statut">{num(["status"], c.status, 0, 10, 0.1)}</Field>
        <Field label="XP total">{num(["xp", "total"], c.xp.total, 0)}</Field>
        <Field label="XP dépensée">{num(["xp", "spent"], c.xp.spent, 0)}</Field>
        <div style={{ gridColumn: "1/-1" }}><DeleteCharacter /></div>
      </div>
    );
  }
  const init = poolOf(c, { kind: "initiative" });
  return (
    <div className="kv">
      <div><span className="label">Honneur</span><b>{decimal(c.honor)}</b></div>
      <div><span className="label">Gloire</span><b>{decimal(c.glory)}</b></div>
      <div><span className="label">Statut</span><b>{decimal(c.status)}</b></div>
      <div><span className="label">XP libre</span><b>{c.xp.total - c.xp.spent}</b></div>
      <div>
        <span className="label">Insight</span>
        <b data-testid="sheet-insight">{insightPoints(c)} · Rang {suggestedInsightRank(insightPoints(c))}</b>
        <InsightMismatch c={c} />
      </div>
      <div><span className="label">Initiative</span><b className="pool" data-testid="sheet-initiative">{poolLabel(init)}</b></div>
    </div>
  );
}

/** Même motif que la Bibliothèque : question, « Supprimer définitivement » et « Annuler » (annexe H.7 X1). */
function DeleteCharacter() {
  const { state, library } = useStore();
  const c = useCharacter();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return <p><button type="button" className="btn" onClick={() => setConfirm(true)}>Supprimer ce personnage…</button></p>;
  }
  return (
    <p className="confirm-line">
      <span className="muted">Supprimer « {c.name || "Sans nom"} » ?</span>
      <button type="button" className="btn sm danger" onClick={() => state.entryId && void library.remove(state.entryId)}>Supprimer définitivement</button>
      <button type="button" className="btn sm" onClick={() => setConfirm(false)}>Annuler</button>
    </p>
  );
}
