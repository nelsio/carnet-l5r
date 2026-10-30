import { useState } from "react";
import { describeModifier, modifiersOf, ROLL_TRAITS, type Modifier } from "@carnet/core";
import {
  MODIFIER_SOURCE_LABELS, MODIFIER_TARGET_LABELS, MODIFIER_TEMPLATES, NAMED_MODIFIERS, STANCES, TRAIT_LABELS, type ModifierTemplate,
} from "../../rules/l5r4e";
import { useCharacter, useStore } from "../store";
import { RichSelect } from "./RichSelect";
import { NumberField } from "./fields";

const CATALOG: readonly ModifierTemplate[] = [...NAMED_MODIFIERS, ...MODIFIER_TEMPLATES];

const stanceLabel = (id: Modifier["stance"]) => STANCES.find((s) => s.id === id)?.label;

function targetLabel(m: Modifier): string {
  const base = m.appliesTo === "skill" ? (m.skill ? `Compétence : ${m.skill}` : "Compétence à choisir")
    : m.appliesTo === "trait" ? (m.trait ? `Trait : ${TRAIT_LABELS[m.trait]}` : "Trait à choisir")
      : MODIFIER_TARGET_LABELS[m.appliesTo];
  return m.stance ? `${base}, en posture ${stanceLabel(m.stance)}` : base;
}

/** Bonus créé depuis une entrée du catalogue ou un modèle. */
function fromTemplate(t: ModifierTemplate): Modifier {
  return {
    id: `mod-${crypto.randomUUID()}`, name: t.label, source: t.source, appliesTo: t.appliesTo,
    ...(t.skill ? { skill: t.skill } : {}), ...(t.trait ? { trait: t.trait } : {}), ...(t.stance ? { stance: t.stance } : {}),
    rolled: t.rolled, kept: t.kept, flat: t.flat, freeRaises: t.freeRaises, tn: t.tn, mode: t.mode, note: t.note ?? "",
  };
}

/** Bonus de jet des techniques, avantages et désavantages (HANDOFF annexe B). */
export function Modifiers() {
  const { state, dispatch } = useStore();
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
              <span className="muted"> · {m.mode === "always" ? "d'office" : "au choix"}</span>
            </div>
            <div className="mod-target muted">{targetLabel(m)}{m.note ? ` · ${m.note}` : ""}</div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="muted">Aucun bonus. Avec « Edit », ajoute ceux de tes techniques, avantages et désavantages : ils s'appliquent aux jets concernés.</p>
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
          <RichSelect variant="champ" value={m.source} onChange={(v) => set(i, { source: v as Modifier["source"] })}>
            {Object.entries(MODIFIER_SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </RichSelect>
        </label>
        <label className="field"><span className="label">S'applique à</span>
          <RichSelect variant="champ" value={m.appliesTo} onChange={(v) => set(i, { appliesTo: v as Modifier["appliesTo"] })}>
            {Object.entries(MODIFIER_TARGET_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </RichSelect>
        </label>
        {m.appliesTo === "skill" && (
          <label className="field"><span className="label">Compétence</span>
            <input className="in" type="text" list={listId} value={m.skill ?? ""} maxLength={80} onChange={(e) => set(i, { skill: e.target.value })} />
            <datalist id={listId}>{c.skills.map((s) => <option key={s.name} value={s.name} />)}</datalist>
          </label>
        )}
        {m.appliesTo === "trait" && (
          <label className="field"><span className="label">Trait</span>
            <RichSelect variant="champ" value={m.trait ?? ""} onChange={(v) => set(i, { trait: v as Modifier["trait"] })}>
              <option value="" disabled>Choisir…</option>
              {ROLL_TRAITS.map((t) => <option key={t} value={t}>{TRAIT_LABELS[t]}</option>)}
            </RichSelect>
          </label>
        )}
        {m.appliesTo !== "armor" && m.appliesTo !== "wounds" && (
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
            <label className="field"><span className="label">Modifie le ND</span>
              <NumberField min={-50} max={50} value={m.tn} onChange={(n) => set(i, { tn: n })} />
            </label>
          </>
        )}
        <label className="field">
          <span className="label">
            {m.appliesTo === "armor" ? "Bonus au ND d'armure" : m.appliesTo === "wounds" ? "Réduction de la pénalité" : "Bonus fixe au total"}
          </span>
          <NumberField min={-50} max={50} value={m.flat} onChange={(n) => set(i, { flat: n })} />
        </label>
        {m.appliesTo !== "wounds" && (
          <label className="field"><span className="label">Posture requise</span>
            <RichSelect variant="champ" value={m.stance ?? ""} onChange={(v) => set(i, { stance: (v || undefined) as Modifier["stance"] })}>
              <option value="">Toutes</option>
              {STANCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </RichSelect>
          </label>
        )}
        <label className="field"><span className="label">Application</span>
          <RichSelect variant="champ" value={m.mode} onChange={(v) => set(i, { mode: v as Modifier["mode"] })}>
            <option value="always">D'office</option>
            <option value="optional">Au choix (situationnel)</option>
          </RichSelect>
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
      ? fromTemplate(t)
      : { id: `mod-${crypto.randomUUID()}`, name: "", source: "technique", appliesTo: "skill", rolled: 0, kept: 0, flat: 0, freeRaises: 0, tn: 0, mode: "always", note: "" };
    dispatch({ type: "add", list: "modifiers", item });
    setChoice("");
  };
  return (
    <div className="file-actions" style={{ marginTop: 8 }}>
      <RichSelect variant="champ" style={{ width: "auto", flex: "1 1 220px" }} aria-label="Modèle de bonus" value={choice} onChange={setChoice}>
        <option value="">Bonus libre</option>
        {NAMED_MODIFIERS.length > 0 && <optgroup label="Catalogue (livre de base 4e, à vérifier)">{NAMED_MODIFIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>}
        <optgroup label="Modèles">{MODIFIER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</optgroup>
      </RichSelect>
      <button type="button" className="btn sm" onClick={add}>+ Bonus</button>
    </div>
  );
}
