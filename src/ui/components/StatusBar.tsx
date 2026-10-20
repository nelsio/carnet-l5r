import { armorTN, movement, woundState, type Character } from "@carnet/core";
import { ARMOR_TN, WOUND_LEVELS } from "../../rules/l5r4e";
import { armorBonus } from "../rolls";
import { useCharacter, useStore } from "../store";
import { NumberField } from "./fields";
import { LinkBanner } from "./LinkBanner";

/** Barre d'état collante : blessures, Vide et tuiles de combat (HANDOFF §6.2). */
export function StatusBar() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const ws = woundState(c);
  const move = movement(c);
  const tn = armorTN(c, { stance: ui.stance, fullDefenseBonus: ui.fullDefenseBonus, voidArmor: ui.voidArmor, bonus: armorBonus(c, ui.armorToggles, ui.stance) });
  const hurt = c.wounds > 0;
  // Fiche en consultation : blessures et Vide affichés, mais ni modifiables ni cliquables (HANDOFF §6.1).
  const readonly = state.mode === "readonly";
  const maxWounds = ws.thresholds[ws.thresholds.length - 1];

  return (
    <div className={`status${ui.woundsExpanded ? " exp" : ""}`}>
      {/* Dans la barre collante : un conflit reste visible où que l'on soit dans la fiche. */}
      <LinkBanner />
      <div className="status-in">
        <button type="button" className={`wsum${hurt ? " hurt" : ""}`} aria-expanded={ui.woundsExpanded} onClick={() => dispatch({ type: "toggleWounds" })}>
          <span>
            <b>{ws.label}</b> <span className="muted">{ws.penalty === null ? "" : `· pénalité +${ws.penalty}`}</span>
          </span>
          <span className="muted mono">{c.wounds} / {maxWounds} {ui.woundsExpanded ? "▴" : "▾"}</span>
        </button>
        <div className="wtrack" aria-label="Niveaux de blessure">
          {WOUND_LEVELS.map((w, i) => {
            const cls = ["wl", i < ws.level ? "past" : "", i === ws.level && hurt ? "cur" : ""].filter(Boolean).join(" ");
            return (
              <div key={w.label} className={cls} title={`${w.label} jusqu'à ${ws.thresholds[i]} blessures`} aria-current={i === ws.level && hurt ? "step" : undefined}>
                <b>{w.penalty === null ? "✕" : `+${w.penalty}`}</b>
                <span>{w.short ?? w.label}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div className="label">Blessures</div>
          <div className="stepper">
            {readonly ? (
              <b className="stat-big" aria-label="Blessures subies">{c.wounds}</b>
            ) : (
              <>
                <button type="button" aria-label="Retirer 1 blessure" onClick={() => dispatch({ type: "wounds", value: c.wounds - 1 })}>−</button>
                <NumberField
                  className="in mono" style={{ width: 56, textAlign: "center" }} min={0} aria-label="Blessures subies"
                  value={c.wounds} onChange={(n) => dispatch({ type: "wounds", value: n })}
                />
                <button type="button" aria-label="Ajouter 1 blessure" onClick={() => dispatch({ type: "wounds", value: c.wounds + 1 })}>+</button>
              </>
            )}
          </div>
        </div>
        <div>
          <div className="label">Points de Vide {c.voidPoints}/{c.voidRing}</div>
          <div className="voidpips">
            {Array.from({ length: c.voidRing }, (_, i) => (
              <button
                key={i} type="button" className={`pip${i < c.voidPoints ? " on" : ""}`}
                aria-label={`Point de Vide ${i + 1}`} aria-pressed={i < c.voidPoints} disabled={readonly}
                onClick={() => dispatch({ type: "pip", index: i })}
              />
            ))}
          </div>
        </div>
        <div className="cstats">
          <div><span className="label">Dépl.</span><b>{move.free}/{move.simple}<small> pi</small></b></div>
          <ArmorTile label="ND armure" value={tn} testId="armor-tn" readonly={readonly} />
          <ArmorTile label="Réduction" value={c.armor.reduction} testId="armor-reduction" readonly={readonly} />
          <div className={ws.penalty ? "pen" : ""}><span className="label">Pénalité</span><b>{ws.penalty === null ? "—" : `+${ws.penalty}`}</b></div>
        </div>
        {ui.armorEdit && !readonly && <ArmorEditor tn={tn} />}
      </div>
    </div>
  );
}

/** Tuile de combat qui ouvre l'éditeur d'armure ; simple affichage en consultation. */
function ArmorTile({ label, value, testId, readonly }: { label: string; value: number; testId: string; readonly: boolean }) {
  const { state, dispatch } = useStore();
  if (readonly) return <div><span className="label">{label}</span><b data-testid={testId}>{value}</b></div>;
  const open = state.ui.armorEdit;
  return (
    <button type="button" className={`ct${open ? " on" : ""}`} aria-expanded={open} title="Modifier l'armure" onClick={() => dispatch({ type: "toggleArmorEdit" })}>
      <span className="label">{label}</span><b data-testid={testId}>{value}</b>
    </button>
  );
}

/** Armure, bonus au ND et réduction ; le ND d'armure reste calculé (HANDOFF §6.2). */
function ArmorEditor({ tn }: { tn: number }) {
  const { dispatch } = useStore();
  const c = useCharacter();
  const set = (field: "name" | "bonus" | "reduction", value: unknown) => dispatch({ type: "set", path: ["armor", field], value });
  return (
    <div className="armedit" role="group" aria-label="Armure">
      <label className="field"><span className="label">Armure</span>
        <input className="in" type="text" maxLength={80} value={c.armor.name} onChange={(e) => set("name", e.target.value)} />
      </label>
      <label className="field"><span className="label">Bonus au ND</span>
        <NumberField className="in mono" min={0} value={c.armor.bonus} onChange={(n) => set("bonus", n)} />
      </label>
      <label className="field"><span className="label">Réduction</span>
        <NumberField className="in mono" min={0} value={c.armor.reduction} onChange={(n) => set("reduction", n)} />
      </label>
      <p className="hint" style={{ gridColumn: "1/-1", margin: 0 }}>
        ND d'armure = 5 × Réflexes {c.traits.reflexes} + 5 + bonus {c.armor.bonus}{tn !== armorBase(c) ? " ± posture, Vide et bonus" : ""} = <b className="mono">{tn}</b>.
        {" "}La réduction se retire de chaque jet de dégâts reçu.
      </p>
      <button type="button" className="btn sm" style={{ justifySelf: "end", gridColumn: "1/-1" }} onClick={() => dispatch({ type: "toggleArmorEdit" })}>Fermer</button>
    </div>
  );
}

const armorBase = (c: Character) => ARMOR_TN.perReflexes * c.traits.reflexes + ARMOR_TN.base + c.armor.bonus;
