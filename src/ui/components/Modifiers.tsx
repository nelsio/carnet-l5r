import { useState } from "react";
import { describeModifier, modifiersOf, ROLL_TRAITS, type Modifier } from "@carnet/core";
import {
  MODIFIER_SOURCE_LABELS, MODIFIER_TARGET_LABELS, MODIFIER_TEMPLATES, NAMED_MODIFIERS, TRAIT_LABELS, type ModifierTemplate,
} from "../../rules/l5r4e";
import { useCharacter, useStore } from "../store";
import { NumberField } from "./fields";

const CATALOG: readonly ModifierTemplate[] = [...NAMED_MODIFIERS, ...MODIFIER_TEMPLATES];

function targetLabel(m: Modifier): string {
  if (m.appliesTo === "skill") return m.skill ? `Compétence : ${m.skill}` : "Compétence à choisir";
  if (m.appliesTo === "trait") return m.trait ? `Trait : ${TRAIT_LABELS[m.trait]}` : "Trait à choisir";
  return MODIFIER_TARGET_LABELS[m.appliesTo];
}

/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
export function Modifiers() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const list = modifiersOf(c);
  const set = (i: number, patch: Partial<Modifier>) =>
    dispatch({ type: "set", path: ["modifiers", i], value: { ...list[i], ...patch } });

  if (!state.ui.edit) {
    return list.length ? (
      <div className="tbl">
        <table>
          <tbody>
            {list.map((m) => (
              <tr key={m.id}>
                <td>
                  <b>{m.name}</b>{" "}<span className="tag">{MODIFIER_SOURCE_LABELS[m.source]}</span>
                  <div className="muted" style={{ fontSize: 12.5 }}>{targetLabel(m)}{m.note ? ` · ${m.note}` : ""}</div>
                </td>
                <td className="pool" style={{ whiteSpace: "nowrap" }}>
                  {describeModifier(m)}
                  <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>{m.mode === "always" ? "d'office" : "au choix"}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="muted">Aucun bonus. En modification, ajoute ceux de tes techniques, avantages et désavantages : ils s'appliquent aux jets concernés.</p>
    );
  }

  return (
    <>
      <p className="hint" style={{ marginTop: 0 }}>
        « D'office » : appliqué à chaque jet concerné (décochable au moment du jet). « Au choix » : situationnel, à cocher dans le lanceur.
      </p>
      {list.map((m, i) => <ModifierEditor key={m.id} m={m} index={i} set={set} />)}
      <AddModifier />
    </>
  );
}

function ModifierEditor({ m, index: i, set }: { m: Modifier; index: number; set: (i: number, patch: Partial<Modifier>) => void }) {
  const { dispatch } = useStore();
  const c = useCharacter();
  const listId = `skills-${m.id}`;
  return (
    <fieldset className="modifier" aria-label={`Bonus ${m.name || i + 1}`}>
      <div style={{ display: "flex", gap: 6 }}>
        <input className="in" type="text" aria-label="Nom du bonus" placeholder="ex. Voie de la Grue (Rang 1)" maxLength={120} value={m.name} onChange={(e) => set(i, { name: e.target.value })} />
        <button type="button" className="x" aria-label={`Supprimer ${m.name || "le bonus"}`} onClick={() => dispatch({ type: "remove", list: "modifiers", index: i })}>×</button>
      </div>
      <div className="form-grid">
        <label className="field"><span className="label">Source</span>
          <select className="in" value={m.source} onChange={(e) => set(i, { source: e.target.value as Modifier["source"] })}>
            {Object.entries(MODIFIER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="field"><span className="label">S'applique à</span>
          <select className="in" value={m.appliesTo} onChange={(e) => set(i, { appliesTo: e.target.value as Modifier["appliesTo"] })}>
            {Object.entries(MODIFIER_TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        {m.appliesTo === "skill" && (
          <label className="field"><span className="label">Compétence</span>
            <input className="in" type="text" list={listId} value={m.skill ?? ""} maxLength={80} onChange={(e) => set(i, { skill: e.target.value })} />
            <datalist id={listId}>{c.skills.map((s) => <option key={s.name} value={s.name} />)}</datalist>
          </label>
        )}
        {m.appliesTo === "trait" && (
          <label className="field"><span className="label">Trait</span>
            <select className="in" value={m.trait ?? ""} onChange={(e) => set(i, { trait: e.target.value as Modifier["trait"] })}>
              <option value="" disabled>Choisir…</option>
              {ROLL_TRAITS.map((t) => <option key={t} value={t}>{TRAIT_LABELS[t]}</option>)}
            </select>
          </label>
        )}
        {m.appliesTo !== "armor" && (
          <>
            <label className="field"><span className="label">Dés lancés</span>
              <NumberField min={-10} max={10} value={m.rolled} onChange={(n) => set(i, { rolled: n })} />
            </label>
            <label className="field"><span className="label">Dés gardés</span>
              <NumberField min={-10} max={10} value={m.kept} onChange={(n) => set(i, { kept: n })} />
            </label>
            <label className="field"><span className="label">Augm. gratuites</span>
              <NumberField min={0} max={10} value={m.freeRaises} onChange={(n) => set(i, { freeRaises: n })} />
            </label>
          </>
        )}
        <label className="field"><span className="label">{m.appliesTo === "armor" ? "Bonus au ND d'armure" : "Bonus fixe au total"}</span>
          <NumberField min={-50} max={50} value={m.flat} onChange={(n) => set(i, { flat: n })} />
        </label>
        <label className="field"><span className="label">Application</span>
          <select className="in" value={m.mode} onChange={(e) => set(i, { mode: e.target.value as Modifier["mode"] })}>
            <option value="always">D'office</option>
            <option value="optional">Au choix (situationnel)</option>
          </select>
        </label>
      </div>
      <label className="field"><span className="label">Condition, précision</span>
        <input className="in" type="text" placeholder="ex. seulement en duel, contre un Scorpion…" value={m.note} onChange={(e) => set(i, { note: e.target.value })} />
      </label>
      <div className="muted" style={{ fontSize: 13 }}>Effet : {describeModifier(m)}</div>
    </fieldset>
  );
}

/** Ajout d'un bonus, à partir d'un modèle ou libre. */
function AddModifier() {
  const { dispatch } = useStore();
  const [choice, setChoice] = useState("");
  const add = () => {
    const t = CATALOG.find((x) => x.id === choice);
    const item: Modifier = t
      ? { id: `mod-${crypto.randomUUID()}`, name: t.label, source: t.source, appliesTo: t.appliesTo, rolled: t.rolled, kept: t.kept, flat: t.flat, freeRaises: t.freeRaises, mode: t.mode, note: "" }
      : { id: `mod-${crypto.randomUUID()}`, name: "", source: "technique", appliesTo: "skill", rolled: 0, kept: 0, flat: 0, freeRaises: 0, mode: "always", note: "" };
    dispatch({ type: "add", list: "modifiers", item });
    setChoice("");
  };
  return (
    <div className="file-actions" style={{ marginTop: 8 }}>
      <select className="in" style={{ width: "auto", flex: "1 1 220px" }} aria-label="Modèle de bonus" value={choice} onChange={(e) => setChoice(e.target.value)}>
        <option value="">Bonus libre</option>
        {NAMED_MODIFIERS.length > 0 && <optgroup label="Catalogue">{NAMED_MODIFIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>}
        <optgroup label="Modèles">{MODIFIER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>
      </select>
      <button type="button" className="btn sm" onClick={add}>+ Bonus</button>
    </div>
  );
}
