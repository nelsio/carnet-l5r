import { armorTN, movement, woundState } from "@carnet/core";
import { WOUND_LEVELS } from "../../rules/l5r4e";
import { useCharacter, useStore } from "../store";
import { NumberField } from "./fields";

/** Barre d'état collante : blessures, Vide et tuiles de combat (HANDOFF §6.2). */
export function StatusBar() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const ws = woundState(c);
  const move = movement(c);
  const tn = armorTN(c, { stance: ui.stance, fullDefenseBonus: ui.fullDefenseBonus, voidArmor: ui.voidArmor });
  const hurt = c.wounds > 0;
  const maxWounds = ws.thresholds[ws.thresholds.length - 1];

  return (
    <div className={`status${ui.woundsExpanded ? " exp" : ""}`}>
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
                <span>{w.label}</span>
              </div>
            );
          })}
        </div>
        <div>
          <div className="label">Blessures</div>
          <div className="stepper">
            <button type="button" aria-label="Retirer 1 blessure" onClick={() => dispatch({ type: "wounds", value: c.wounds - 1 })}>−</button>
            <NumberField
              className="in mono" style={{ width: 56, textAlign: "center" }} min={0} aria-label="Blessures subies"
              value={c.wounds} onChange={(n) => dispatch({ type: "wounds", value: n })}
            />
            <button type="button" aria-label="Ajouter 1 blessure" onClick={() => dispatch({ type: "wounds", value: c.wounds + 1 })}>+</button>
          </div>
        </div>
        <div>
          <div className="label">Points de Vide {c.voidPoints}/{c.voidRing}</div>
          <div className="voidpips">
            {Array.from({ length: c.voidRing }, (_, i) => (
              <button
                key={i} type="button" className={`pip${i < c.voidPoints ? " on" : ""}`}
                aria-label={`Point de Vide ${i + 1}`} aria-pressed={i < c.voidPoints}
                onClick={() => dispatch({ type: "pip", index: i })}
              />
            ))}
          </div>
        </div>
        <div className="cstats">
          <div><span className="label">Dépl.</span><b>{move.free}/{move.simple}<small> pi</small></b></div>
          <div><span className="label">ND armure</span><b data-testid="armor-tn">{tn}</b></div>
          <div><span className="label">Réduction</span><b>{c.armor.reduction}</b></div>
          <div className={ws.penalty ? "pen" : ""}><span className="label">Pénalité</span><b>{ws.penalty === null ? "—" : `+${ws.penalty}`}</b></div>
        </div>
      </div>
    </div>
  );
}
