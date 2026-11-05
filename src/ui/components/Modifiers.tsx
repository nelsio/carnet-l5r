import { useState } from "react";
import { describeModifier, modifiersOf, ROLL_TRAITS, type Modifier } from "@carnet/core";
import {
  MODIFIER_NAME_PLACEHOLDERS, MODIFIER_SOURCE_LABELS, MODIFIER_TARGET_LABELS, MODIFIER_TEMPLATES, STANCES, TRAIT_LABELS, type ModifierTemplate,
} from "../../rules/l5r4e";
import { useT, type Messages } from "../../i18n";
import { useCharacter, useStore } from "../store";
import { RichSelect } from "./RichSelect";
import { NumberField } from "./fields";

/** Groupes du menu « Modèle de bonus », « Autre » (Bonus libre) en tête (annexe J.4). */
const TEMPLATE_GROUPS = (["other", "advantage", "disadvantage", "technique"] as const).map((source) => ({
  source, templates: MODIFIER_TEMPLATES.filter((t) => t.source === source),
}));

const stanceLabel = (id: Modifier["stance"]) => STANCES.find((s) => s.id === id)?.label;

function targetLabel(m: Modifier, t: Messages["sheet"]["modifiers"]): string {
  const base = m.appliesTo === "skill" ? (m.skill ? t.skillTarget(m.skill) : t.skillToChoose)
    : m.appliesTo === "trait" ? (m.trait ? t.traitTarget(TRAIT_LABELS[m.trait]) : t.traitToChoose)
      : MODIFIER_TARGET_LABELS[m.appliesTo];
  return m.stance ? t.inStance(base, stanceLabel(m.stance)) : base;
}

/** Bonus créé depuis un modèle : nom vide, à écrire par le joueur (annexe J.4). */
function fromTemplate(t: ModifierTemplate): Modifier {
  return {
    id: `mod-${crypto.randomUUID()}`, name: "", source: t.source, appliesTo: t.appliesTo,
    ...(t.skill ? { skill: t.skill } : {}), ...(t.trait ? { trait: t.trait } : {}), ...(t.stance ? { stance: t.stance } : {}),
    rolled: t.rolled, kept: t.kept, flat: t.flat, freeRaises: t.freeRaises, tn: t.tn, mode: t.mode, note: t.note ?? "",
  };
}

/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
export function Modifiers() {
  const { state, dispatch } = useStore();
  const t = useT().sheet.modifiers;
  const c = useCharacter();
  const list = modifiersOf(c);
  const set = (i: number, patch: Partial<Modifier>) =>
    dispatch({ type: "set", path: ["modifiers", i], value: { ...list[i], ...patch } });

  if (!(state.mode === "edit" && state.ui.editing.has("modifiers"))) {
    // Bureau : nom et cible à gauche, effet à droite ; mobile : trois lignes, nom, effet, cible (annexe E.9 S1).
    return list.length ? (
      <ul className="modlist">
        {list.map((m) => (
          <li key={m.id} className="modrow" data-testid={`modifier-${m.id}`}>
            <div className="mod-name"><b>{m.name}</b>{" "}<span className="tag">{MODIFIER_SOURCE_LABELS[m.source]}</span></div>
            <div className="mod-effect">
              <span className="mono">{describeModifier(m)}</span>
              <span className="muted"> · {m.mode === "always" ? t.always : t.optional}</span>
            </div>
            <div className="mod-target muted">{targetLabel(m, t)}{m.note ? ` · ${m.note}` : ""}</div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="muted">{t.empty}</p>
    );
  }

  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>{t.modeHint}</p>
      <p className="hint">{t.jsonBefore}<code>modifiers</code>{t.jsonAfter}</p>
      {list.map((m, i) => <ModifierEditor key={m.id} m={m} index={i} set={set} />)}
      <AddModifier />
    </>
  );
}

function ModifierEditor({ m, index: i, set }: { m: Modifier; index: number; set: (i: number, patch: Partial<Modifier>) => void }) {
  const { dispatch } = useStore();
  const t = useT().sheet.modifiers;
  const c = useCharacter();
  const listId = `skills-${m.id}`;
  return (
    <fieldset className="modifier" aria-label={t.label(m.name || String(i + 1))}>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="in" type="text" aria-label={t.name} placeholder={MODIFIER_NAME_PLACEHOLDERS[m.source]} maxLength={120} value={m.name} onChange={(e) => set(i, { name: e.target.value })} />
        <button type="button" className="x" aria-label={t.remove(m.name)} onClick={() => dispatch({ type: "remove", list: "modifiers", index: i })}>×</button>
      </div>
      <div className="form-grid">
        <label className="field"><span className="label">{t.source}</span>
          <RichSelect variant="champ" value={m.source} onChange={(v) => set(i, { source: v as Modifier["source"] })}>
            {Object.entries(MODIFIER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </RichSelect>
        </label>
        <label className="field"><span className="label">{t.appliesTo}</span>
          <RichSelect variant="champ" value={m.appliesTo} onChange={(v) => set(i, { appliesTo: v as Modifier["appliesTo"] })}>
            {Object.entries(MODIFIER_TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </RichSelect>
        </label>
        {m.appliesTo === "skill" && (
          <label className="field"><span className="label">{t.skill}</span>
            <input className="in" type="text" list={listId} value={m.skill ?? ""} maxLength={80} onChange={(e) => set(i, { skill: e.target.value })} />
            <datalist id={listId}>{c.skills.map((s) => <option key={s.name} value={s.name} />)}</datalist>
          </label>
        )}
        {m.appliesTo === "trait" && (
          <label className="field"><span className="label">{t.trait}</span>
            <RichSelect variant="champ" value={m.trait ?? ""} onChange={(v) => set(i, { trait: v as Modifier["trait"] })}>
              <option value="" disabled>{t.choose}</option>
              {ROLL_TRAITS.map((t) => <option key={t} value={t}>{TRAIT_LABELS[t]}</option>)}
            </RichSelect>
          </label>
        )}
        {m.appliesTo !== "armor" && m.appliesTo !== "wounds" && (
          <>
            <label className="field"><span className="label">{t.rolled}</span>
              <NumberField min={-10} max={10} value={m.rolled} onChange={(n) => set(i, { rolled: n })} />
            </label>
            <label className="field"><span className="label">{t.kept}</span>
              <NumberField min={-10} max={10} value={m.kept} onChange={(n) => set(i, { kept: n })} />
            </label>
            <label className="field"><span className="label">{t.freeRaises}</span>
              <NumberField min={0} max={10} value={m.freeRaises} onChange={(n) => set(i, { freeRaises: n })} />
            </label>
            <label className="field"><span className="label">{t.tn}</span>
              <NumberField min={-50} max={50} value={m.tn} onChange={(n) => set(i, { tn: n })} />
            </label>
          </>
        )}
        <label className="field">
          <span className="label">
            {m.appliesTo === "armor" ? t.armor : m.appliesTo === "wounds" ? t.wounds : t.flat}
          </span>
          <NumberField min={-50} max={50} value={m.flat} onChange={(n) => set(i, { flat: n })} />
        </label>
        {m.appliesTo !== "wounds" && (
          <label className="field"><span className="label">{t.stance}</span>
            <RichSelect variant="champ" value={m.stance ?? ""} onChange={(v) => set(i, { stance: (v || undefined) as Modifier["stance"] })}>
              <option value="">{t.allStances}</option>
              {STANCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </RichSelect>
          </label>
        )}
        <label className="field"><span className="label">{t.mode}</span>
          <RichSelect variant="champ" value={m.mode} onChange={(v) => set(i, { mode: v as Modifier["mode"] })}>
            <option value="always">{t.modeAlways}</option>
            <option value="optional">{t.modeOptional}</option>
          </RichSelect>
        </label>
      </div>
      <label className="field"><span className="label">{t.note}</span>
        <input className="in" type="text" placeholder={t.notePlaceholder} value={m.note} onChange={(e) => set(i, { note: e.target.value })} />
      </label>
      <div className="muted" style={{ fontSize: 13 }}>{t.effect(describeModifier(m))}</div>
    </fieldset>
  );
}

/** Ajout d'un bonus à partir d'une forme d'effet, groupée par source ; « Bonus libre » par défaut (annexe J.4). */
function AddModifier() {
  const { dispatch } = useStore();
  const tm = useT().sheet.modifiers;
  const [choice, setChoice] = useState("free");
  const add = () => {
    const t = MODIFIER_TEMPLATES.find((x) => x.id === choice);
    if (!t) return;
    dispatch({ type: "add", list: "modifiers", item: fromTemplate(t) });
    setChoice("free");
  };
  return (
    <div className="file-actions" style={{ marginTop: 8 }}>
      <RichSelect variant="catalogue" style={{ flex: "1 1 220px" }} aria-label={tm.template} value={choice} onChange={setChoice}>
        {TEMPLATE_GROUPS.map((g) => (
          <optgroup key={g.source} label={MODIFIER_SOURCE_LABELS[g.source]}>
            <legend>{MODIFIER_SOURCE_LABELS[g.source]}</legend>
            {g.templates.map((t) => (
              <option key={t.id} value={t.id}>
                <span className="n">{t.label}</span>
                <span className="d">{describeModifier(t)}{t.mode === "optional" ? tm.optionalTag : ""}</span>
              </option>
            ))}
          </optgroup>
        ))}
      </RichSelect>
      <button type="button" className="btn sm" onClick={add}>{tm.add}</button>
    </div>
  );
}
