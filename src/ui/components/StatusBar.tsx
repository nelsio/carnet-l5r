import { useState } from "react";
import {
  armorEffects, catalogArmor, isShugenja, movement, totalReduction, voidMultiplier, woundsFromDamage, resolveValue, schoolArmorBonus, schoolReduction,
  setSpellSlotsUsed, SPELL_SLOT_KEYS, spellSlots, woundPenaltyAt, woundState, type SpellSlotKey,
  type Character,
} from "@carnet/core";
import { ARMOR_TN, VOID_COMBAT, WOUND_LEVELS } from "../../rules/l5r4e";
import { useT, type Messages } from "../../i18n";
import { contextOf, currentArmorTN, selectedKeys } from "../rolls";
import { useCharacter, useStore } from "../store";
import { ArmorEffect, ArmorFields } from "./ArmorCatalog";
import { NumberField } from "./fields";
import { LinkBanner } from "./LinkBanner";

/** Barre d'état collante : blessures, Vide et tuiles de combat (HANDOFF §6.2). */
export function StatusBar() {
  const { state, dispatch } = useStore();
  const t = useT();
  const s = t.statusBar;
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
  const levels = WOUND_LEVELS.map((_, i) => {
    const penalty = woundPenaltyAt(c, i, contextOf(ui));
    const current = i === ws.level && hurt;
    return {
      label: t.rules.wounds[i] ?? "", short: t.rules.woundsShort[i] ?? "", current,
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
            <b>{ws.status === "dead" ? t.rules.dead : t.rules.wounds[ws.level]}</b> <span className="muted">{ws.penalty === null ? "" : s.penaltySummary(ws.penalty)}</span>
          </span>
          <span className="muted mono">{c.wounds} / {maxWounds} {ui.woundsExpanded ? "▴" : "▾"}</span>
        </button>
        <div className="wtrack" aria-label={s.woundLevels}>
          {levels.map((l) => (
            <div key={l.label} className={l.cls("wl")} title={s.levelTitle(l.label, l.max)} aria-current={l.current ? "step" : undefined}>
              <b>{l.penaltyText}</b>
              {/* Abréviation à l'écran, libellé complet pour les lecteurs d'écran (annexe 45.2). */}
              <span aria-hidden="true">{l.short}</span>
              <span className="sr-only">{l.label}</span>
            </div>
          ))}
        </div>
        {/* Mobile : une ligne par niveau sous la barre, à l'appui sur le résumé (annexe E.9 S3). */}
        {ui.woundsExpanded && (
          <ol className="wdetail" aria-label={s.woundDetail} data-testid="wound-detail">
            {levels.map((l) => (
              <li key={l.label} className={l.cls("wdl")} aria-current={l.current ? "step" : undefined}>
                <span className="wn">{l.label}</span>
                <span className="wr">{l.min}–{l.max}</span>
                <span className="wp">{l.penaltyText}</span>
              </li>
            ))}
          </ol>
        )}
        {readonly ? (
          <div><span className="label">{s.wounds}</span> <b className="stat-big" aria-label={s.woundsTaken}>{c.wounds}</b></div>
        ) : (
          // Tuile « Blessures » : ouvre Ajuster / Encaisser sous la barre (annexe E.19 S14).
          <button
            type="button" className={`wtile${damageOpen ? " on" : ""}`} aria-expanded={damageOpen}
            aria-label={s.woundsTile} onClick={() => setDamageOpen(!damageOpen)}
          >
            <span className="wt1"><span className="label">{s.wounds}</span><b className="mono">{c.wounds}/{maxWounds}</b></span>
            <span className="wt2">{s.adjustOrTake} {damageOpen ? "▴" : "▾"}</span>
          </button>
        )}
        <div className="vblock">
          <div className="label"><span className="vlong">{s.voidPoints(c.voidPoints, c.voidRing)}</span><span className="vshort">{s.voidShort(c.voidPoints, c.voidRing)}</span></div>
          <div className="voidpips" style={{ ["--n" as string]: c.voidRing }}>
            {Array.from({ length: c.voidRing }, (_, i) => (
              <button
                key={i} type="button" className={`pip${i < c.voidPoints ? " on" : ""}`}
                aria-label={s.voidPip(i + 1)} aria-pressed={i < c.voidPoints} disabled={readonly}
                onClick={() => dispatch({ type: "pip", index: i })}
              />
            ))}
          </div>
        </div>
        <div className="cstats">
          <div><span className="label">{s.move}</span><b>{move.free}/{move.simple}<small> {s.feet}</small></b></div>
          <ArmorTile label={s.armorTn} value={tn} testId="armor-tn" readonly={readonly} />
          <ArmorTile label={s.reduction} value={reduction} testId="armor-reduction" readonly={readonly} />
          <div className={ws.penalty ? "pen" : ""}><span className="label">{s.penalty}</span><b>{ws.penalty === null ? "—" : `+${ws.penalty}`}</b></div>
        </div>
        {isShugenja(c) && <SpellSlots readonly={readonly} />}
        {damageOpen && !readonly && <TakeDamage counter label={s.attackDamage} onDone={() => setDamageOpen(false)} />}
        {ui.armorEdit && !readonly && <ArmorEditor tn={tn} />}
      </div>
    </div>
  );
}

const slotLabel = (k: SpellSlotKey, t: Messages) => (k === "free" ? t.statusBar.freeSlots : t.rules.elements[k]);

/**
 * Ligne « Sorts » (annexe F.5) : six mini-tuiles restants/max, à la couleur de l'Anneau ;
 * un appui ouvre l'éditeur pleine largeur (− / + par ligne). En consultation : affichage seul.
 */
function SpellSlots({ readonly }: { readonly: boolean }) {
  const { dispatch } = useStore();
  const t = useT();
  const s = t.statusBar;
  const c = useCharacter();
  const [open, setOpen] = useState(false);
  const slots = spellSlots(c);
  const setUsed = (k: SpellSlotKey, used: number) => dispatch({ type: "set", path: ["spellSlotsUsed"], value: setSpellSlotsUsed(c, k, used).spellSlotsUsed });
  return (
    <>
      <button
        type="button" className={`slots${open ? " on" : ""}`} aria-expanded={open} disabled={readonly}
        aria-label={s.slotsLeft} onClick={() => setOpen(!open)}
      >
        <span className="label slotlabel">{s.spells}</span>
        {SPELL_SLOT_KEYS.map((k) => (
          <span key={k} className={`slot s-${k}${slots[k].left === 0 ? " empty" : ""}`} data-testid={`slot-${k}`}>
            <span className="label">{slotLabel(k, t)}</span>
            <b className="mono">{slots[k].left}/{slots[k].max}</b>
          </span>
        ))}
      </button>
      {open && !readonly && (
        <div className="slotedit" role="group" aria-label={s.slots}>
          {SPELL_SLOT_KEYS.map((k) => (
            <div key={k} className="slotrow">
              <span>{slotLabel(k, t)} <span className="muted">{s.slotsRemaining(slots[k].left, slots[k].max)}</span></span>
              <span className="stepper">
                <button type="button" aria-label={s.spendSlot(slotLabel(k, t))} onClick={() => setUsed(k, slots[k].used + 1)}>−</button>
                <button type="button" aria-label={s.refundSlot(slotLabel(k, t))} onClick={() => setUsed(k, slots[k].used - 1)}>+</button>
              </span>
            </div>
          ))}
          <p className="hint" style={{ margin: 0 }}>
            {s.slotsHint}
          </p>
        </div>
      )}
    </>
  );
}

/**
 * Encaisser des dégâts (annexe E.3 F6) : dégâts − Réduction (− 10 avec un point de Vide) en blessures.
 * Repris par la bataille de masse pour ses dés de blessures (E.8), pré-remplis par `initial`.
 * `counter` : ligne « Ajuster » en tête (−, champ, +), pour la tuile Blessures de la barre d'état (annexe E.19 S14).
 */
export function TakeDamage({ onDone, initial = 0, label, counter = false }: {
  onDone: () => void; initial?: number; label?: string; counter?: boolean;
}) {
  const { dispatch } = useStore();
  const s = useT().statusBar;
  const c = useCharacter();
  const [damage, setDamage] = useState(initial);
  const [voidSpent, setVoidSpent] = useState(false);
  const added = woundsFromDamage(c, damage, voidSpent && c.voidPoints >= 1);
  return (
    <div className={`dmgedit${counter ? " withcounter" : ""}`} role="group" aria-label={s.takeDamage}>
      {counter && (
        <div className="adjust">
          <span className="label">{s.adjust}</span>
          <div className="stepper">
            <button type="button" aria-label={s.removeWound} onClick={() => dispatch({ type: "wounds", value: c.wounds - 1 })}>−</button>
            <NumberField
              className="in mono" style={{ width: 56, textAlign: "center" }} min={0} aria-label={s.woundsTaken}
              value={c.wounds} onChange={(n) => dispatch({ type: "wounds", value: n })}
            />
            <button type="button" aria-label={s.addWound} onClick={() => dispatch({ type: "wounds", value: c.wounds + 1 })}>+</button>
          </div>
        </div>
      )}
      <label className="field"><span className="label">{label ?? s.damageTaken}</span>
        <NumberField className="in mono" min={0} value={damage} onChange={setDamage} />
      </label>
      <label className="chk">
        <input type="checkbox" checked={voidSpent} disabled={c.voidPoints < 1} onChange={(e) => setVoidSpent(e.target.checked)} />
        {" "}{s.voidWounds(VOID_COMBAT.wounds * voidMultiplier(c))}
      </label>
      <span className="muted" data-testid="damage-preview">
        {s.reductionArrow(totalReduction(c))} <b className="mono" style={{ color: "var(--ink)" }}>+{added}</b> {s.woundsSuffix}
      </span>
      <button
        type="button" className="btn sm accent" disabled={damage <= 0}
        onClick={() => { dispatch({ type: "takeDamage", damage, voidSpent }); onDone(); }}
      >{s.take}</button>
    </div>
  );
}

/** Tuile de combat qui ouvre l'éditeur d'armure ; simple affichage en consultation. */
function ArmorTile({ label, value, testId, readonly }: { label: string; value: number; testId: string; readonly: boolean }) {
  const { state, dispatch } = useStore();
  const t = useT();
  if (readonly) return <div><span className="label">{label}</span><b data-testid={testId}>{value}</b></div>;
  const open = state.ui.armorEdit;
  return (
    <button type="button" className={`ct${open ? " on" : ""}`} aria-expanded={open} title={t.statusBar.editArmor} onClick={() => dispatch({ type: "toggleArmorEdit" })}>
      <span className="label">{label}</span><b data-testid={testId}>{value}</b>
    </button>
  );
}

/** Armure, bonus au ND et réduction ; le ND d'armure reste calculé (HANDOFF §6.2). */
function ArmorEditor({ tn }: { tn: number }) {
  const { state, dispatch } = useStore();
  const t = useT();
  const s = t.statusBar;
  const c = useCharacter();
  const { ui } = state;
  const techReduction = schoolReduction(c);
  const techArmor = schoolArmorBonus(c, contextOf(ui), selectedKeys(ui.schoolArmor), ui.stacks);
  const techAuto = armorEffects(c, contextOf(ui)).filter((e) => e.kind === "armor" && e.mode === "auto" && !e.stack);
  return (
    <div className="armedit" role="group" aria-label={s.armor}>
      <ArmorFields variant="ligne" />
      <p className="hint" style={{ gridColumn: "1/-1", margin: 0 }}>
        {s.armorFormula(c.traits.reflexes, c.armor.bonus, tn !== armorBase(c))} <b className="mono">{tn}</b>.
        {" "}{s.reductionHint}
        {catalogArmor(c)?.summary && <> <ArmorEffect /></>}
        {techArmor !== 0 && <> {s.techArmor(techArmor, techAuto.map((e) => e.kind === "armor" ? `+${resolveValue(e.value, c)} · ${e.source}` : "").join(", "))}</>}
        {techReduction !== 0 && <> {s.techReduction(techReduction, c.armor.reduction + techReduction)}</>}
      </p>
      <button type="button" className="btn sm" style={{ justifySelf: "end", gridColumn: "1/-1" }} onClick={() => dispatch({ type: "toggleArmorEdit" })}>{t.common.close}</button>
    </div>
  );
}

const armorBase = (c: Character) => ARMOR_TN.perReflexes * c.traits.reflexes + ARMOR_TN.base + c.armor.bonus;
