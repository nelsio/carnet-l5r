import { useState } from "react";
import {
  armorEffects, catalogArmor, movement, totalReduction, voidMultiplier, woundsFromDamage, resolveValue, schoolArmorBonus, schoolReduction, woundPenaltyAt, woundState,
  type Character,
} from "@carnet/core";
import { ARMOR_TN, VOID_COMBAT, WOUND_LEVELS } from "../../rules/l5r4e";
import { contextOf, currentArmorTN, selectedKeys } from "../rolls";
import { useCharacter, useStore } from "../store";
import { ArmorCatalogSelect, ArmorEffect } from "./ArmorCatalog";
import { NumberField } from "./fields";
import { LinkBanner } from "./LinkBanner";

/** Barre d'état collante : blessures, Vide et tuiles de combat (HANDOFF §6.2). */
export function StatusBar() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const ws = woundState(c, contextOf(ui));
  const move = movement(c);
  const tn = currentArmorTN(c, ui);
  const reduction = c.armor.reduction + schoolReduction(c);
  const hurt = c.wounds > 0;
  // Fiche en consultation : blessures et Vide affichés, mais ni modifiables ni cliquables (HANDOFF §6.1).
  const readonly = state.mode === "readonly";
  const maxWounds = ws.thresholds[ws.thresholds.length - 1];
  const [damageOpen, setDamageOpen] = useState(false);
  // Pénalités effectives de chaque niveau, même calcul que la tuile Pénalité (annexe E.9 S5).
  const levels = WOUND_LEVELS.map((w, i) => {
    const penalty = woundPenaltyAt(c, i, contextOf(ui));
    const current = i === ws.level && hurt;
    return {
      label: w.label, short: w.short ?? w.label, current,
      min: i === 0 ? 0 : ws.thresholds[i - 1] + 1, max: ws.thresholds[i],
      penaltyText: penalty === null ? "✕" : `+${penalty}`,
      cls: (base: string) => [base, i < ws.level ? "past" : "", current ? "cur" : ""].filter(Boolean).join(" "),
    };
  });

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
          {levels.map((l) => (
            <div key={l.label} className={l.cls("wl")} title={`${l.label} jusqu'à ${l.max} blessures`} aria-current={l.current ? "step" : undefined}>
              <b>{l.penaltyText}</b>
              <span>{l.short}</span>
            </div>
          ))}
        </div>
        {/* Mobile : une ligne par niveau sous la barre, à l'appui sur le résumé (annexe E.9 S3). */}
        {ui.woundsExpanded && (
          <ol className="wdetail" aria-label="Détail des blessures" data-testid="wound-detail">
            {levels.map((l) => (
              <li key={l.label} className={l.cls("wdl")} aria-current={l.current ? "step" : undefined}>
                <span className="wn">{l.label}</span>
                <span className="wr">{l.min}–{l.max}</span>
                <span className="wp">{l.penaltyText}</span>
              </li>
            ))}
          </ol>
        )}
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
                <button
                  type="button" className={`dmgbtn${damageOpen ? " on" : ""}`} aria-expanded={damageOpen} aria-label="Encaisser des dégâts"
                  title="Encaisser des dégâts" onClick={() => setDamageOpen(!damageOpen)}
                >Dégâts…</button>
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
          <ArmorTile label="Réduction" value={reduction} testId="armor-reduction" readonly={readonly} />
          <div className={ws.penalty ? "pen" : ""}><span className="label">Pénalité</span><b>{ws.penalty === null ? "—" : `+${ws.penalty}`}</b></div>
        </div>
        {damageOpen && !readonly && <TakeDamage onDone={() => setDamageOpen(false)} />}
        {ui.armorEdit && !readonly && <ArmorEditor tn={tn} />}
      </div>
    </div>
  );
}

/**
 * Encaisser des dégâts (annexe E.3 F6) : dégâts − Réduction (− 10 avec un point de Vide) en blessures.
 * Repris par la bataille de masse pour ses dés de blessures (E.8), pré-remplis par `initial`.
 */
export function TakeDamage({ onDone, initial = 0, label = "Dégâts reçus" }: { onDone: () => void; initial?: number; label?: string }) {
  const { dispatch } = useStore();
  const c = useCharacter();
  const [damage, setDamage] = useState(initial);
  const [voidSpent, setVoidSpent] = useState(false);
  const added = woundsFromDamage(c, damage, voidSpent && c.voidPoints >= 1);
  return (
    <div className="dmgedit" role="group" aria-label="Encaisser des dégâts">
      <label className="field"><span className="label">{label}</span>
        <NumberField className="in mono" min={0} value={damage} onChange={setDamage} />
      </label>
      <label className="chk">
        <input type="checkbox" checked={voidSpent} disabled={c.voidPoints < 1} onChange={(e) => setVoidSpent(e.target.checked)} />
        {" "}Vide : −{VOID_COMBAT.wounds * voidMultiplier(c)} blessures
      </label>
      <span className="muted" data-testid="damage-preview">
        Réduction {totalReduction(c)} → <b className="mono" style={{ color: "var(--ink)" }}>+{added}</b> blessure(s)
      </span>
      <button
        type="button" className="btn sm gold" disabled={damage <= 0}
        onClick={() => { dispatch({ type: "takeDamage", damage, voidSpent }); onDone(); }}
      >Encaisser</button>
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
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const techReduction = schoolReduction(c);
  const techArmor = schoolArmorBonus(c, contextOf(ui), selectedKeys(ui.schoolArmor), ui.stacks);
  const techAuto = armorEffects(c, contextOf(ui)).filter((e) => e.kind === "armor" && e.mode === "auto" && !e.stack);
  const set = (field: "name" | "bonus" | "reduction", value: unknown) => dispatch({ type: "set", path: ["armor", field], value });
  return (
    <div className="armedit" role="group" aria-label="Armure">
      <div style={{ gridColumn: "1/-1" }}><ArmorCatalogSelect /></div>
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
        {catalogArmor(c)?.summary && <> <ArmorEffect /></>}
        {techArmor !== 0 && <> Techniques et maîtrises : +{techArmor} au ND d'armure{techAuto.length ? ` (dont ${techAuto.map((e) => e.kind === "armor" ? `+${resolveValue(e.value, c)} · ${e.source}` : "").join(", ")})` : ""}.</>}
        {techReduction !== 0 && <> Techniques d'école : +{techReduction} de Réduction (total {c.armor.reduction + techReduction}).</>}
      </p>
      <button type="button" className="btn sm" style={{ justifySelf: "end", gridColumn: "1/-1" }} onClick={() => dispatch({ type: "toggleArmorEdit" })}>Fermer</button>
    </div>
  );
}

const armorBase = (c: Character) => ARMOR_TN.perReflexes * c.traits.reflexes + ARMOR_TN.base + c.armor.bonus;
