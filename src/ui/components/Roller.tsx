import { useEffect, useRef } from "react";
import {
  applicableModifiers, armorRollTn, bowStrength, DAMAGE_MANEUVER_ID, describeEffect, focusOutcome, opposedMargin, opposedVerdict, stanceRestriction, woundEffectNote, describeModifier, effectOn, findSkill, fullDefenseBonus, maneuverCost, maneuverFreeRaises, modifierTN,
  formatDR, isRanged, isSocialSkill, meditationVoidPoints, poolStats, reminderText, rollDice, schoolContext, schoolReminders, verdict, voidMultiplier,
  castTime, castTimeLabel, concentrationTn, schoolRankOf, slotFor, spellCast, spellcastingOf, spellOptions, spellRaises, spellRestriction, SPELL_RINGS, spellSlotNeed, spellSlots,
  voidPointBonus, voidSpendBonus, voidSpendOption, woundState, type Spell, type SpellAction, type SpellRing, type SpellSlotKey,
  type ActionDef, type ActiveEffect, type Character, type Pool,
} from "@carnet/core";
import type { SpellOption } from "../../rules/ecoles";
import { CALLED_ZONES, CENTER_BONUS, COMBAT_SUBS, CONCENTRATE_ACTION_ID, ELEMENT_LABELS, MEDITATE_ACTION_ID, MELEE_TARGET_PENALTY, SITUATIONS, SPELL_CONCENTRATION, TN_PER_RAISE, TN_SCALE, TRAIT_LABELS, type CalledZone } from "../../rules/l5r4e";
import { useLocale, useT, type Locale, type Messages } from "../../i18n";
import { DICE_LETTER, formatPool, pct } from "../format";
import {
  activeModifiers, calledRaises, contextOf, effectiveManeuvers, finalTN, isActive, isUnskilled, maneuverCosts, poolFor, rollWoundPenalty,
  selectedKeys, targetBaseTN, toPoolAction, uiRollStance, type RollOptions,
} from "../rolls";
import { selectedAction, useCharacter, useStore, type RollRecord } from "../store";
import { RichSelect, RingOption } from "./RichSelect";
import { NumberField } from "./fields";

/** Point de rupture mobile (HANDOFF §7), identique à styles.css. */
const MOBILE_QUERY = "(max-width: 720px)";

export function Roller() {
  const { state, dispatch, rng } = useStore();
  const t = useT();
  const r = t.roller;
  const { locale } = useLocale();
  const c = useCharacter();
  const { ui } = state;
  const a = selectedAction(c, ui);
  const resultRef = useRef<HTMLDivElement>(null);
  const lastRoll = ui.lastRoll;

  // Après un lancer, le résultat est amené à l'écran dans le panneau mobile (HANDOFF §7).
  useEffect(() => {
    if (lastRoll && ui.sheetOpen && window.matchMedia?.(MOBILE_QUERY).matches) {
      resultRef.current?.scrollIntoView({ block: "center" });
    }
  }, [lastRoll, ui.sheetOpen]);

  if (!a) return <p className="muted">{r.chooseAction}</p>;

  const { opts } = ui;
  const ctx = schoolContext({ ...contextOf(ui), emphasis: opts.emphasisName });
  const pa = toPoolAction(a, opts);
  const selected = selectedKeys(ui.techToggles);
  const stance = uiRollStance(ui);
  const duel = ui.situation === "combat" && ui.sub === "duel";
  // Bonus de Centre (F1) : au round qui suit le Centre, sur un seul jet.
  const centerOffered = ui.situation === "combat" && !duel && ui.centerLastRound && !ui.centerBonusUsed && a.kind !== "damage" && a.kind !== "spellDamage";
  const active = activeModifiers(c, a, ui.modifierToggles, stance);
  const pool = poolFor(c, a, { ...opts, centerBonus: centerOffered && opts.centerBonus }, stance, active, {
    mounted: ui.mounted, centerLastRound: ui.centerLastRound, selected, inputs: ui.techInputs, assessmentWon: duel && ui.assessmentWon,
  });
  const effects = [...(pool.applied ?? []), ...(pool.optional ?? [])];
  const bonusFree = pool.canRaise ? (pool.freeRaises ?? 0) : 0;
  const totalFree = opts.free + bonusFree;
  // Augmentations gratuites converties en baisse du ND (F8).
  const tnOffered = pool.canRaise && totalFree > 0 && (a.tn === "target" || a.tn === "assessment" || typeof a.tn === "number");
  const freeToTn = opts.freeToTn && tnOffered ? totalFree : 0;
  const tnContext = { effects, selected, stacks: ui.stacks, ctx, techTn: pool.techTn, weaponTn: pool.weaponTn, armorTn: pool.armorTn, freeToTn };
  const bonuses = applicableModifiers(c, toPoolAction(a), stance);
  const bonusTN = modifierTN(active) + (pool.techTn ?? 0);
  const restriction = ui.situation === "combat" ? stanceRestriction(pa, { stance: ui.stance, mounted: ui.mounted, sub: ui.sub }) : null;
  const ranged = pa.kind === "skill" && !!pa.attack && !!pa.weapon && isRanged(pa.weapon);
  const woundNote = woundEffectNote(woundState(c, ctx).label);
  const set = (patch: Partial<RollOptions>) => dispatch({ type: "option", patch });
  const ws = woundState(c, ctx);
  const penalty = rollWoundPenalty(c, tnContext);
  const base = targetBaseTN(c, a, opts, ui.stacks);
  const tn = finalTN(c, a, opts, ui.maneuvers, active, tnContext);
  const raises = pool.canRaise ? calledRaises(c, a, opts, ui.maneuvers, effects, selected) : 0;
  const vm = voidMultiplier(c);
  const perVoid = voidPointBonus(c, pa, ctx);
  // Dégâts : un seul point de Vide, au katana seulement (C2).
  const spend = pa.kind === "damage" ? undefined : voidSpendOption(c, pa);
  const weaponTn = pool.weaponTn ?? 0;
  const spendDice = spend && voidSpendBonus(c, spend, pa, ctx);
  const chips = (pool.applied ?? []).filter((e) => e.kind === "roll" || e.kind === "maneuver");
  const social = pa.kind === "skill" && !pa.attack && (ui.situation === "court" || isSocialSkill(pa.skill));
  const reminders = a.kind === "damage" ? schoolReminders(c, ["damage"]) : social ? schoolReminders(c, ["social"]) : [];
  const unskilled = isUnskilled(c, a);
  const emphasisOffered = a.kind === "skill" && pool.canRaise;
  const emphases = (findSkill(c, a.skill ?? "")?.emphases ?? []).filter((e) => e.trim() !== "");
  const unlimited = !!pool.unlimitedRaises;
  const mastery = pool.explodeOn === 9 ? pool.notes.find((n) => n.startsWith("Maîtrise")) : undefined;
  const stats = pool.rolled > 0 ? poolStats(pool, { emphasis: opts.emphasis && emphasisOffered, flatBonus: opts.flat }) : null;
  const context = ui.situation === "combat"
    ? COMBAT_SUBS.find((s) => s.id === ui.sub)?.label
    : SITUATIONS.find((s) => s.id === ui.situation)?.label;

  const roll = () => {
    const result = rollDice(pool, { emphasis: opts.emphasis && emphasisOffered, flatBonus: opts.flat }, rng);
    const baseTn = typeof tn === "number" ? tn - TN_PER_RAISE * raises : undefined;
    const baseSuccess = baseTn !== undefined && typeof tn === "number"
      && verdict(c, toPoolAction(a), ctx, result.total, tn, baseTn) === "baseSuccess";
    dispatch({ type: "rolled", result, tn, raises, free: freeToTn ? 0 : totalFree, baseTn, baseSuccess });
  };

  return (
    <>
      <div className="sheet-head">
        <span className="grip" />
        <button type="button" className="close" aria-label={t.common.close} onClick={() => dispatch({ type: "closeSheet" })}>×</button>
      </div>
      <div className="label">{context}</div>
      <h2 style={{ margin: "2px 0 8px" }}>{a.label}</h2>
      {restriction && (
        <div className="hint" data-testid="stance-restriction" style={{ color: "var(--danger)", marginTop: 0 }}>
          {restriction} {r.gmMayAllow}
        </div>
      )}
      {woundNote && <div className="hint" data-testid="wound-note" style={{ color: "var(--danger)", marginTop: 0 }}>{woundNote}</div>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span className="poolbig" data-testid="pool">{formatPool(pool.rolled, pool.kept, locale)}</span>
        <span className="muted" style={{ fontSize: 13 }}>{poolOrigin(c, a, opts, r, locale)}{pool.bonus ? r.poolBonus(pool.bonus) : ""}</span>
      </div>
      {/* Augmentations de dégâts de l'attaque, seule source de dés lancés en plus (annexe J.9). */}
      {opts.extraRolled > 0 && (
        <div className="tchips" data-testid="attack-raises">
          <span className="tchip">{r.attackRaisesChip(formatPool(opts.extraRolled, 0, locale))}</span>
          <button type="button" className="btn sm" onClick={() => set({ extraRolled: 0 })}>{r.remove}</button>
        </div>
      )}
      {chips.length > 0 && (
        <div className="tchips" data-testid="tech-chips">
          {chips.map((e) => (
            <span key={e.key} className={`tchip${e.mastery ? " mastery" : ""}`} title={e.technique}>
              {e.mastery && <b className="tag">{r.mastery}</b>}{describeEffect(e, c, ui.techInputs[e.key])} · {e.source}
            </span>
          ))}
        </div>
      )}
      <ManualLine pool={pool} emphasis={opts.emphasis && emphasisOffered} flat={opts.flat} free={bonusFree} />
      {stats && (
        <div className="statline">
          <span>{r.min} <b>{stats.min}</b></span>
          <span>{r.mean} <b>{Math.round(stats.mean)}</b></span>
          <span>{r.max} <b>{stats.max}{stats.open ? "+" : ""}</b>{pool.explodeOn === 9 && <> <span className="tag" title={r.explodesOn9}>9+</span></>}</span>
          {typeof tn === "number" && <span className="ch">{r.success} <b data-testid="chance">{pct(stats.chance(tn), locale)}</b></span>}
        </div>
      )}
      {mastery && <div className="hint" data-testid="mastery" style={{ color: "var(--accent-ink)" }}>{mastery}.</div>}
      {pool.notes.filter((n) => n.startsWith("Force ") || n.includes("force de l'arc") || n.startsWith("Désarmement")).map((n) => (
        <div key={n} className="hint" data-testid="weapon-note" style={{ color: "var(--accent-ink)" }}>{n}.</div>
      ))}
      {armorRollTn(c, pa, ui.mounted).notes.map((n) => <div key={n} className="hint" data-testid="armor-note">{n}.</div>)}
      {pool.warnings?.map((w) => <div key={w} className="hint" data-testid="weapon-warning" style={{ color: "var(--danger)" }}>{w}</div>)}
      {!pool.canRaise && a.kind === "skill" && <div className="hint" style={{ color: "var(--danger)" }}>{r.unskilled}</div>}

      <div className="opts">
        <TnField action={a} opts={opts} set={set} />
        {/* Grille sans case vide (annexe J.9) : ND et Bonus fixe côte à côte quand il n'y a pas d'augmentations. */}
        {pool.canRaise && (
          <label className="field">
            <span className="label">{a.attack ? r.raisesFree : r.raises}</span>
            <NumberField className="in mono" min={0} value={opts.raises} onChange={(n) => set({ raises: n })} />
          </label>
        )}
        {pool.canRaise && (
          <label className="field">
            <span className="label">{r.freeRaises(bonusFree)}</span>
            <NumberField className="in mono" min={0} value={opts.free} onChange={(n) => set({ free: n })} />
          </label>
        )}
        <label className="field">
          <span className="label">{r.flat}</span>
          <NumberField className="in mono" value={opts.flat} onChange={(n) => set({ flat: n })} />
        </label>
      </div>

      {/* Sort : après le ND et les augmentations (annexe F.5). */}
      {(a.kind === "spell" || a.kind === "spellDamage") && a.spell && <SpellPanel action={a} spell={a.spell} />}

      <div className="grid" style={{ gap: 6, marginBottom: 12 }}>
        {!pool.voidBlocked && (
          <label className="chk">
            <input type="checkbox" checked={opts.voidPoint} disabled={c.voidPoints < 1 && !opts.voidPoint} onChange={(e) => set({ voidPoint: e.target.checked })} />
            {" "}{pool.katanaVoid
              ? r.voidKatana(formatPool(perVoid.rolled * vm, perVoid.kept * vm, locale))
              : r.voidSpendOne(formatPool(perVoid.rolled * vm, perVoid.kept * vm, locale))}
            {" "}<span className="muted">{r.left(c.voidPoints)}</span>
          </label>
        )}
        {spend && spendDice && (
          <label className="chk">
            <input
              type="checkbox" checked={opts.voidSpend} disabled={c.voidPoints < spend.points && !opts.voidSpend}
              onChange={(e) => set({ voidSpend: e.target.checked })}
            />
            {" "}{r.voidSpend(spend.points, formatPool(spendDice.rolled * vm, spendDice.kept * vm, locale))} <span className="muted">· {spend.source}</span>
          </label>
        )}
        {unskilled && (
          <label className="chk">
            <input type="checkbox" checked={opts.voidSkill} disabled={c.voidPoints < 1 && !opts.voidSkill} onChange={(e) => set({ voidSkill: e.target.checked })} />
            {" "}{r.voidSkill(a.skill ?? "")}
          </label>
        )}
        {emphasisOffered && emphases.length > 0 && (
          <label className="field">
            <span className="label">{r.emphasisSelect}</span>
            <RichSelect variant="ligne" value={opts.emphasisName} onChange={(v) => set({ emphasisName: v, emphasis: v !== "" })}>
              <option value="">{r.none}</option>
              {emphases.map((e) => <option key={e} value={e}>{e}</option>)}
            </RichSelect>
          </label>
        )}
        {emphasisOffered && !emphases.length && (
          <label className="chk">
            <input type="checkbox" checked={opts.emphasis} onChange={(e) => set({ emphasis: e.target.checked })} />
            {" "}{r.emphasisCheck} {a.emphasisHint && <span className="muted">({a.emphasisHint})</span>}
          </label>
        )}
        {centerOffered && (
          <label className="chk">
            <input type="checkbox" checked={opts.centerBonus} onChange={(e) => set({ centerBonus: e.target.checked })} />
            {" "}{r.centerBonus} <span className="muted">{r.centerBonusDetail(formatPool(CENTER_BONUS.rolled, CENTER_BONUS.kept, locale), c.voidRing)}</span>
          </label>
        )}
        {ranged && (
          <label className="chk">
            <input type="checkbox" checked={opts.meleeTarget} onChange={(e) => set({ meleeTarget: e.target.checked })} />
            {" "}{r.meleeTarget} <span className="muted">{r.meleePenalty(MELEE_TARGET_PENALTY)}</span>
          </label>
        )}
        {tnOffered && (
          <label className="chk">
            <input type="checkbox" checked={opts.freeToTn} onChange={(e) => set({ freeToTn: e.target.checked })} />
            {" "}{r.freeToTn} <span className="muted">{r.freeToTnDetail(TN_PER_RAISE * totalFree)}</span>
          </label>
        )}
        {duel && a.id === "assess" && (
          <label className="chk">
            <input type="checkbox" checked={ui.assessmentWon} onChange={(e) => dispatch({ type: "assessmentWon", on: e.target.checked })} />
            {" "}{r.assessmentWon} <span className="muted">{r.assessmentWonDetail}</span>
          </label>
        )}
        {duel && a.id === "focus" && <FocusGap />}
      </div>

      {bonuses.length > 0 && (
        <div className="grid bonuses" style={{ gap: 6, marginBottom: 12 }}>
          <div className="label">{r.bonuses} <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>{r.bonusesDetail}</span></div>
          {bonuses.map((m) => (
            <label key={m.id} className="chk">
              <input
                type="checkbox" checked={isActive(m, ui.modifierToggles)}
                onChange={(e) => dispatch({ type: "toggleModifier", id: m.id, on: e.target.checked })}
              />
              {" "}{m.name} <span className="muted">· {describeModifier(m)}{m.mode === "optional" ? r.situational : ""}</span>
            </label>
          ))}
        </div>
      )}

      {(pool.optional?.length ?? 0) > 0 && <TechniqueOptions effects={pool.optional ?? []} />}

      {a.attack && pool.canRaise && <ManeuverPicker effects={effects} />}

      {reminders.length > 0 && (
        <div data-testid="school-reminders">
          {reminders.map((e) => (
            <div key={e.key} className="hint" style={{ color: "var(--accent-ink)" }}>{r.reminder(e.technique, e.source, reminderText(e, c))}</div>
          ))}
        </div>
      )}

      {unlimited && <div className="hint" style={{ color: "var(--accent-ink)" }}>{r.unlimited}</div>}
      {raises > 0 && (
        <div className="tnline" style={{ marginTop: 10, color: !unlimited && raises > c.voidRing ? "var(--warn)" : undefined }}>
          <span>{r.calledRaises}</span>
          <span className="mono"><b>{raises}</b>{unlimited ? "" : r.raisesMax(c.voidRing)}{!unlimited && raises > c.voidRing ? r.overVoid : ""}</span>
        </div>
      )}
      {typeof tn === "number" && typeof base === "number" && (
        <div className="tnline">
          <span>{r.finalTn}</span>
          <span className="mono">
            <b style={{ fontSize: 18 }} data-testid="final-tn">{tn}</b>{" "}
            <span className="muted">{r.tnBreakdown({ base, raises: TN_PER_RAISE * raises, penalty, bonus: bonusTN, bow: weaponTn, armor: pool.armorTn ?? 0 })}</span>
          </span>
        </div>
      )}
      {tn === "opposed" && (
        <div className="tnline" style={{ marginTop: 10 }}>
          <span>{raises > 0 ? <>{r.beatBy} <b data-testid="opposed-margin">{opposedMargin(raises)}</b></> : r.beatTotal}</span>
          <label className="mono" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="muted" style={{ fontFamily: "var(--f-body)", fontSize: 13 }}>{r.opponentTotal}</span>
            <input
              className="in mono" type="number" min={0} style={{ width: 72 }} aria-label={r.opponentTotal}
              value={opts.opponentTotal ?? ""}
              onChange={(e) => set({ opponentTotal: e.target.value === "" ? null : Math.max(0, Math.trunc(Number(e.target.value)) || 0) })}
            />
          </label>
        </div>
      )}
      {freeToTn > 0 && typeof tn === "number" && <div className="hint">{r.freeDeducted(freeToTn, TN_PER_RAISE * freeToTn)}</div>}
      {ws.penalty === null && <div className="hint" style={{ color: "var(--danger)" }}>{r.outOfCombat}</div>}
      {a.id === MEDITATE_ACTION_ID && <MeditationSuccess />}
      {a.kind === "spell" && !ui.showDiceRoller && <SpellCastLine action={a} manual />}

      {ui.showDiceRoller && (
        <>
          <button type="button" className="btn primary rollbtn" style={{ width: "100%", marginTop: 12, padding: 12 }} onClick={roll}>
            {r.roll(formatPool(pool.rolled, pool.kept, locale))}
          </button>
          <div ref={resultRef} aria-live="polite">
            {lastRoll && lastRoll.actionId === a.id && <RollOutcome roll={lastRoll} />}
            {lastRoll && lastRoll.actionId === a.id && a.kind === "spell" && <SpellCastLine action={a} />}
          </div>
        </>
      )}
      {ui.showDiceRoller && ui.history.length > 0 && (
        <div className="hist">
          <span className="label">{r.history}</span>
          {ui.history.map((h, i) => (
            <div key={i}>
              <span>{h.label}</span>
              <span className="mono">{h.total}{typeof h.tn === "number" ? (h.total >= h.tn ? " ✓" : " ✗") : ""}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Méditation réussie (annexe E.6) : points de Vide rendus, plafonnés à l'Anneau de Vide ; rien en consultation. */
function MeditationSuccess() {
  const { state, dispatch } = useStore();
  const r = useT().roller;
  const c = useCharacter();
  const points = meditationVoidPoints(c);
  const full = c.voidPoints >= c.voidRing;
  return (
    <div className="tnline" style={{ marginTop: 10 }}>
      <span className="muted">{r.meditationVoid(c.voidPoints, c.voidRing, full)}</span>
      {state.mode !== "readonly" && (
        <button type="button" className="btn sm accent" disabled={full} onClick={() => dispatch({ type: "meditate" })}>
          {r.meditationSuccess(points)}
        </button>
      )}
    </div>
  );
}

/** Concentration en duel (F10) : écart saisi → qui frappe en premier, augmentations gratuites pour la Frappe. */
function FocusGap() {
  const { state, dispatch } = useStore();
  const r = useT().roller;
  const c = useCharacter();
  const gap = state.ui.focusGap;
  const outcome = gap === null ? null : focusOutcome(c, gap);
  return (
    <div>
      <label className="field" style={{ maxWidth: 260 }}>
        <span className="label">{r.focusGap}</span>
        <input
          className="in mono" type="number" min={0} aria-label={r.focusGapShort} value={gap ?? ""}
          onChange={(e) => dispatch({ type: "focusGap", gap: e.target.value === "" ? null : Math.max(0, Math.trunc(Number(e.target.value)) || 0) })}
        />
      </label>
      {outcome && (
        <div className="hint" data-testid="focus-outcome" style={{ color: outcome.first ? "var(--accent-ink)" : undefined }}>
          {outcome.first
            ? r.focusFirst(outcome.freeRaises)
            : r.focusSimultaneous(outcome.threshold)}
        </div>
      )}
    </div>
  );
}

/** Règles de relance pour jouer avec de vrais dés (HANDOFF §6.2). */
function ManualLine({ pool, emphasis, flat, free }: { pool: Pool; emphasis: boolean; flat: number; free: number }) {
  const r = useT().roller;
  const nine = pool.explodeOn === 9;
  const add = pool.bonus + flat;
  const tenDice = pool.notes.some((n) => n.startsWith("Règle des dix dés"));
  return (
    <div className="manual" data-testid="manual">
      {pool.explodes
        ? <>{r.explodeBefore}<b>{r.explodeOn(nine)}</b>{r.explodeAfter(nine)}</>
        : r.noExplode}
      {emphasis && <> {r.emphasisReroll}<b>1</b>.</>}
      {add !== 0 && <> {r.addBefore}<b>{add > 0 ? "+" : ""}{add}</b>{r.addAfter(tenDice)}</>}
      {free > 0 && <> <b>{free}</b>{r.freeAfter}</>}
    </div>
  );
}

/** Origine de la réserve, en clair. */
function poolOrigin(c: Character, a: ActionDef, opts: RollOptions, r: Messages["roller"], locale: Locale): string {
  const o = r.origin;
  const extra = opts.extraRolled ? o.extraDice(opts.extraRolled) : "";
  switch (a.kind) {
    case "skill": {
      const trait = a.trait ?? "agility";
      const value = trait === "void" ? c.voidRing : c.traits[trait];
      return `${a.skill} ${findSkill(c, a.skill ?? "")?.rank ?? 0} + ${TRAIT_LABELS[trait]} ${value}${extra}`;
    }
    case "trait": return `${o.pureTrait(TRAIT_LABELS[a.trait ?? "stamina"])}${extra}`;
    case "damage": {
      // Force effective de l'arc : plafonnée par la Force, +1 avec Kyujutsu 7 (annexe E.2 C11).
      const bow = a.weapon && isRanged(a.weapon) ? o.bow(bowStrength(c, a.weapon)) : null;
      return `${bow ?? o.strength(c.traits.strength)} + ${o.dr(formatDR(a.dr ?? "", DICE_LETTER[locale]))}${extra}`;
    }
    case "spell": {
      // « Feu 3 + rang 1 + affinité 1 » (annexe F.5).
      const cast = spellCast(c, toPoolAction(a, opts) as SpellAction);
      const parts = [`${ELEMENT_LABELS[cast.ring]} ${cast.ringValue}`, o.schoolRank(schoolRankOf(c))];
      if (cast.affinity) parts.push(o.affinity);
      const minus = cast.deficiency ? o.deficiency : "";
      return `${parts.join(" + ")}${minus}${cast.rolled ? o.schoolDice(cast.rolled) : ""}${extra}`;
    }
    case "spellDamage": return `${o.dr(formatDR(a.spell?.damage ?? "", DICE_LETTER[locale]))}${extra}`;
    default: return `${o.initiative(c.insightRank, c.traits.reflexes)}${extra}`;
  }
}

const slotName = (k: SpellSlotKey, r: Messages["roller"]) => (k === "free" ? r.freeSlot : ELEMENT_LABELS[k]);

/** Ligne « Emplacement : Feu 2/3 » (« libre 1/2 » si l'élément est épuisé, « aucun emplacement » en rouge), F.5. */
function SlotLine({ action: a }: { action: ActionDef }) {
  const { state } = useStore();
  const r = useT().roller;
  const c = useCharacter();
  const need = spellSlotNeed(c, toPoolAction(a, state.ui.opts) as SpellAction);
  const key = slotFor(c, need.ring);
  const slot = key && spellSlots(c)[key];
  return (
    <div className="tnline" data-testid="spell-slot" style={{ margin: 0, color: slot ? undefined : "var(--danger)" }}>
      <span>{r.slot}</span>
      <span>
        {slot && key
          ? <><b>{slotName(key, r)}</b> <span className="mono">{slot.left}/{slot.max}</span>{need.count > 1 ? r.slotCount(need.count) : ""}</>
          : r.noSlot}
      </span>
    </div>
  );
}

/**
 * Lancer d'un sort et ses emplacements (F.5) : avec le lanceur de dés, dépensés au lancer ; aux vrais dés,
 * boutons Réussi et Raté. Un sort réussi puis interrompu rend ses emplacements (« Annuler (interrompu) »).
 */
function SpellCastLine({ action: a, manual = false }: { action: ActionDef; manual?: boolean }) {
  const { state, dispatch } = useStore();
  const r = useT().roller;
  const cast = state.ui.spellCast?.actionId === a.id ? state.ui.spellCast : null;
  const readonly = state.mode === "readonly";
  const spent = cast && cast.slots.length > 0
    ? r.slotsSpent(manual, cast.success, cast.slots.map((k) => slotName(k, r)).join(", "))
    : cast ? r.noSlotSpent : null;
  if (manual && readonly && !spent) return null;
  return (
    <div className="spellmanual" data-testid="spell-cast">
      {manual && <span className="muted">{r.realDice}</span>}
      {manual && !readonly && (
        <>
          <button type="button" className="btn sm accent" onClick={() => dispatch({ type: "castSpell", success: true })}>{r.succeeded}</button>
          <button type="button" className="btn sm" onClick={() => dispatch({ type: "castSpell", success: false })}>{r.failed}</button>
        </>
      )}
      {spent && <span className="spelldone" data-testid="spell-spent">{spent}</span>}
      {cast?.success && cast.slots.length > 0 && (
        <button type="button" className="btn sm" onClick={() => dispatch({ type: "cancelCast" })}>{r.cancelInterrupted}</button>
      )}
    </div>
  );
}

/** Cases de l'école utiles à ce jet : jet de sort (dés, augmentations, affinité) ou dégâts du sort. */
const forSpellRoll = (o: SpellOption) =>
  o.rolled !== undefined || o.freeRaises !== undefined || o.extraAffinity !== undefined || o.extraSlot !== undefined;
const forSpellDamage = (o: SpellOption) => o.damageRolled !== undefined || o.damageKept !== undefined || o.damageFlat !== undefined;

function optionEffect(o: SpellOption, c: Character, r: Messages["roller"], locale: Locale): string {
  if (o.extraAffinity) return r.option.affinity(ELEMENT_LABELS[o.extraAffinity]);
  if (o.extraSlot) return r.option.extraSlot(o.extraSlot);
  if (o.freeRaises) return r.option.freeRaises(o.freeRaises);
  if (o.rolled) return `+${formatPool(o.rolled, 0, locale)}`;
  if (o.damageFlat === "schoolRank") return r.option.damage(`+${schoolRankOf(c)}`);
  return r.option.damage(`+${formatPool(o.damageRolled ?? 0, o.damageKept ?? 0, locale)}`);
}

/** Lanceur d'un sort (annexe F.5) : élément, autre Anneau, cases de l'école, temps d'incantation, rappels. */
function SpellPanel({ action: a, spell }: { action: ActionDef; spell: Spell }) {
  const { state, dispatch } = useStore();
  const { locale } = useLocale();
  const r = useT().roller;
  const c = useCharacter();
  const { opts } = state.ui;
  const sc = spellcastingOf(c);
  const set = (patch: Partial<RollOptions>) => dispatch({ type: "option", patch });
  const damage = a.kind === "spellDamage";
  const options = spellOptions(c).filter(damage ? forSpellDamage : forSpellRoll);
  const checkboxes = options.length > 0 && (
    <div className="grid" style={{ gap: 6 }} role="group" aria-label={r.schoolOptions}>
      {options.map((o) => (
        <label key={o.id} className="chk">
          <input type="checkbox" checked={!!opts.spellOptions[o.id]} onChange={(e) => set({ spellOptions: { ...opts.spellOptions, [o.id]: e.target.checked } })} />
          {" "}{o.label} <span className="muted">· {optionEffect(o, c, r, locale)}</span>
        </label>
      ))}
    </div>
  );
  if (damage) return <div className="spellbox" data-testid="spell-panel">{checkboxes}</div>;

  const pa = toPoolAction(a, opts) as SpellAction;
  const cast = spellCast(c, pa);
  const restriction = spellRestriction(c, spell, cast.element, pa.options);
  const raises = spellRaises(spell);
  const time = castTime(spell.mastery, opts.castRaises);
  const otherRings = SPELL_RINGS.filter((ring) => ring !== cast.element);
  return (
    <div className="spellbox" data-testid="spell-panel">
      {restriction && (
        <div className="hint" data-testid="spell-restriction" style={{ color: "var(--danger)", marginTop: 0 }}>
          {restriction} {r.gmMayAllow}
        </div>
      )}
      {spell.element === "all" && (
        <label className="field" style={{ maxWidth: 260 }}>
          <span className="label">{r.universalElement}</span>
          <RichSelect variant="anneau" value={cast.element} onChange={(v) => set({ spellElement: v as SpellRing, spellRing: null })}>
            {SPELL_RINGS.map((ring) => <RingOption key={ring} ring={ring} />)}
          </RichSelect>
        </label>
      )}
      {sc?.ringSwap && (
        <div className="grid" style={{ gap: 6 }}>
          <label className="chk">
            <input
              type="checkbox" checked={!!opts.spellRing} disabled={c.voidPoints < 1 && !opts.spellRing}
              onChange={(e) => set({ spellRing: e.target.checked ? (otherRings[0] ?? null) : null })}
            />
            {" "}{r.ringSwap} <span className="muted">{r.left(c.voidPoints)}</span>
          </label>
          {opts.spellRing && (
            <label className="field" style={{ maxWidth: 260, marginLeft: 24 }}>
              <span className="label">{r.rollRing}</span>
              <RichSelect variant="anneau" value={opts.spellRing} onChange={(v) => set({ spellRing: v as SpellRing })}>
                {otherRings.map((ring) => <RingOption key={ring} ring={ring} />)}
              </RichSelect>
            </label>
          )}
        </div>
      )}
      {checkboxes}
      {cast.freeRaises.length > 0 && (
        <div className="hint" data-testid="spell-free-raises" style={{ color: "var(--accent-ink)" }}>
          {r.spellFreeRaises(cast.freeRaises.length, cast.freeRaises.join(", "))}
        </div>
      )}
      <div className="castrow">
        <label className="field">
          <span className="label">{r.castRaises}</span>
          <NumberField className="in mono" min={0} max={10} value={opts.castRaises} onChange={(n) => set({ castRaises: n })} />
        </label>
        <div className="tnline" style={{ margin: 0 }}>
          <span>{r.castTime}</span>
          <b data-testid="cast-time">{castTimeLabel(time)}</b>
        </div>
      </div>
      {raises.length > 0 && (
        <div className="spellraises" data-testid="spell-raises">
          <span className="label">{r.spellRaises}</span>
          <ul>{raises.map((raise) => <li key={raise}>{raise}</li>)}</ul>
        </div>
      )}
      {!spell.memorized && (
        <div className="hint" data-testid="spell-scroll">{r.scroll(spell.mastery)}</div>
      )}
      <SlotLine action={a} />
      <div className="hint">
        {r.interrupted(SPELL_CONCENTRATION.tn, SPELL_CONCENTRATION.base)}
      </div>
      {sc?.reminders?.map((note) => <div key={note} className="hint" style={{ color: "var(--accent-ink)" }}>{note}</div>)}
      {spell.effect && <div className="spelleffect prose" data-testid="spell-effect">{spell.effect}</div>}
    </div>
  );
}

function TnField({ action: a, opts, set }: { action: ActionDef; opts: RollOptions; set: (p: Partial<RollOptions>) => void }) {
  const r = useT().roller;
  switch (a.tn) {
    case null: return null;
    case "target":
      return (
        <label className="field"><span className="label">{r.targetTn}</span>
          <NumberField className="in mono" min={0} value={opts.targetTN} onChange={(n) => set({ targetTN: n })} />
        </label>
      );
    case "assessment":
      return (
        <label className="field"><span className="label">{r.opponentRank}</span>
          <NumberField className="in mono" min={1} max={10} value={opts.opponentRank} onChange={(n) => set({ opponentRank: n })} />
        </label>
      );
    case "opposed":
      return (
        <div className="field"><span className="label">{r.tn}</span><span className="muted" style={{ fontSize: 13, paddingTop: 6 }}>{r.opposed}</span></div>
      );
    default:
      // Rester concentré : ND 10, ou 5 + dégâts subis (F.2).
      if (a.id === CONCENTRATE_ACTION_ID) {
        return (
          <label className="field"><span className="label">{r.damageTakenTn(concentrationTn(opts.damageTaken))}</span>
            <NumberField className="in mono" min={0} value={opts.damageTaken ?? 0} onChange={(n) => set({ damageTaken: n || null })} />
          </label>
        );
      }
      // Sort : ND fixé par la maîtrise (F.2).
      if (a.kind === "spell") {
        return (
          <div className="field">
            <span className="label">{r.baseTn}</span>
            <span className="mono" data-testid="spell-tn" style={{ paddingTop: 6 }}>{a.tn} <span className="muted">{r.masteryOf(a.spell?.mastery ?? 0)}</span></span>
          </div>
        );
      }
      return (
        <label className="field"><span className="label">{r.baseTn}</span>
          <RichSelect variant="ligne" className="mono" value={opts.tn} onChange={(v) => set({ tn: Number(v) })}>
            {TN_SCALE.map((t) => <option key={t.tn} value={t.tn}>{t.tn} · {t.label}</option>)}
          </RichSelect>
        </label>
      );
  }
}

/** Techniques d'école à cocher pour ce jet (annexe C.5), remises à zéro à chaque nouvelle action. */
function TechniqueOptions({ effects }: { effects: readonly ActiveEffect[] }) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { techToggles, techInputs } = state.ui;
  const r = useT().roller;
  return (
    <div className="grid bonuses" style={{ gap: 6, marginBottom: 12 }} role="group" aria-label={r.techniques}>
      <div className="label">{r.techniques}</div>
      {effects.map((e) => {
        const effect = describeEffect(e, c, techInputs[e.key]);
        return (
          <div key={e.key}>
            <label className="chk">
              <input type="checkbox" checked={!!techToggles[e.key]} onChange={(ev) => dispatch({ type: "toggleTechnique", key: e.key, on: ev.target.checked })} />
              {" "}{("label" in e && e.label) || e.technique}{" "}
              <span className="muted">· {effect ? `${effect} · ` : ""}{"void" in e && e.void ? r.voidCost(e.void) : ""}{e.source}</span>
            </label>
            {"input" in e && e.input && (
              <label className="field" style={{ marginLeft: 24, maxWidth: 260 }}>
                <span className="label">{e.input}</span>
                <NumberField className="in mono" min={0} value={techInputs[e.key] ?? 0} onChange={(n) => dispatch({ type: "techniqueInput", key: e.key, value: n })} />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ManeuverPicker({ effects }: { effects: readonly ActiveEffect[] }) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const sel = state.ui.maneuvers;
  const list = effectiveManeuvers(c);
  const selected = selectedKeys(state.ui.techToggles);
  const reserved = effects.filter((e) => e.kind === "maneuver" && e.freeRaisesFor && effectOn(e, selected));
  const free = maneuverFreeRaises(effects, selected);
  const costs = maneuverCosts(state.ui.opts);
  const setCount = (id: string, count: number) => dispatch({ type: "maneuver", id, count });
  const setOpt = (patch: { calledZone?: CalledZone; quadruped?: boolean }) => dispatch({ type: "option", patch });
  const r = useT().roller;
  return (
    <>
      <div className="label">{r.maneuvers} <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>{r.maneuversDetail}</span></div>
      <div className="mans">
        {list.map((m) => {
          const n = sel[m.id] ?? 0;
          return m.stackable ? (
            <div key={m.id} className={`man${n ? " on" : ""}`}>
              <button type="button" aria-label={r.removeOne(m.name)} onClick={() => setCount(m.id, n - 1)}>−</button>
              <span title={m.effect}>{m.name} <b className="mono">{n}</b></span>
              <button type="button" aria-label={r.addOne(m.name)} onClick={() => setCount(m.id, n + 1)}>+</button>
            </div>
          ) : (
            <button key={m.id} type="button" className={`man${n ? " on" : ""}`} aria-pressed={n > 0} title={m.effect} onClick={() => setCount(m.id, n ? 0 : 1)}>
              {m.name} <b className="mono">{Math.max(0, (costs[m.id] ?? maneuverCost(c, m)) - (free[m.id] ?? 0))}</b>
            </button>
          );
        })}
      </div>
      {(sel.called ?? 0) > 0 && list.some((m) => m.id === "called") && (
        <label className="field" style={{ marginTop: 6, maxWidth: 260 }}>
          <span className="label">{r.calledZone}</span>
          <RichSelect variant="ligne" value={state.ui.opts.calledZone} onChange={(v) => setOpt({ calledZone: v as CalledZone })}>
            {CALLED_ZONES.map((z) => <option key={z.id} value={z.id}>{r.zoneCost(z.label, z.cost)}</option>)}
          </RichSelect>
        </label>
      )}
      {(sel.knockdown ?? 0) > 0 && list.some((m) => m.id === "knockdown") && (
        <label className="chk" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={state.ui.opts.quadruped} onChange={(e) => setOpt({ quadruped: e.target.checked })} />
          {" "}{r.quadruped} <span className="muted">{r.quadrupedCost}</span>
        </label>
      )}
      {reserved.map((e) => (
        <div key={e.key} className="hint" style={{ marginTop: 4, color: "var(--accent-ink)" }}>
          {r.reserved(describeEffect(e, c), e.source)}
        </div>
      ))}
      {(sel[DAMAGE_MANEUVER_ID] ?? 0) > 0 && (
        <div className="hint" data-testid="damage-raises-note" style={{ marginTop: 4 }}>
          {r.damageRaisesNote}
        </div>
      )}
      {list.filter((m) => sel[m.id]).map((m) => (
        <div key={m.id} className="hint" style={{ marginTop: 4 }}>• <b>{m.name}</b> : {m.effect}</div>
      ))}
    </>
  );
}

function RollOutcome({ roll: r }: { roll: RollRecord }) {
  const { locale } = useLocale();
  const t = useT().roller;
  const { total } = r.result;
  const hasTN = typeof r.tn === "number";
  const ok = hasTN && total >= (r.tn as number);
  const margin = hasTN ? total - (r.tn as number) : 0;
  return (
    <>
      <div className="dice" aria-label={t.dice}>
        {r.result.dice.map((d, i) => (
          <span
            key={i}
            className={["die", d.kept ? "kept" : "", d.faces.length > 1 ? "ex" : ""].filter(Boolean).join(" ")}
            title={t.dieTitle(d.faces.join(" + "), !!d.rerolledOne)}
          >{d.total}{d.faces.length > 1 && <small>{d.faces.join("+")}</small>}</span>
        ))}
      </div>
      {hasTN ? (
        <>
          <div className={`verdict ${ok ? "ok" : "ko"}`}>
            {ok ? t.success : t.failure} <span className="mono" style={{ fontSize: 16 }}>{total} / {r.tn} ({margin >= 0 ? "+" : ""}{margin})</span>
          </div>
          {r.baseSuccess && (
            <div className="hint" data-testid="base-success" style={{ color: "var(--accent-ink)" }}>
              {t.baseSuccess(r.baseTn ?? 0)}
            </div>
          )}
          {ok && (r.raises > 0 || r.free > 0) && (
            <div className="hint">{t.raisesToApply(r.raises + r.free, r.free)}</div>
          )}
          {r.maneuvers.length > 0 && <div className="hint">{t.maneuversResult(ok, r.maneuvers.join(", "))}</div>}
          {r.damageDice > 0 && !r.disarm && <div className="hint">{t.prefilled(`+${formatPool(r.damageDice, 0, locale)}`)}</div>}
          {r.feint ? <div className="hint" data-testid="feint-note">{t.feint(r.feint)}</div> : null}
          {r.disarm && <div className="hint" data-testid="disarm-note">{t.disarm}</div>}
          {ok && !r.raises && margin >= TN_PER_RAISE && r.kind !== "damage" && (
            <div className="hint">{t.margin(margin, Math.floor(margin / TN_PER_RAISE))}</div>
          )}
        </>
      ) : (
        <div className="verdict">
          {total}{" "}
          <span className="muted" style={{ fontSize: 15, fontFamily: "var(--f-body)" }}>
            {r.tn === "opposed" ? (r.opponent === undefined ? t.toCompare : t.against(r.opponent)) : r.kind === "damage" ? t.woundsDealt : r.kind === "initiative" ? t.initiative : ""}
          </span>
        </div>
      )}
      {r.tn === "opposed" && r.opponent !== undefined && (
        <div className={`verdict ${opposedVerdict(total, r.opponent, r.raises) === "win" ? "ok" : opposedVerdict(total, r.opponent, r.raises) === "lose" ? "ko" : ""}`} data-testid="opposed-verdict">
          {t.opposedVerdict[opposedVerdict(total, r.opponent, r.raises)]}
          {r.raises > 0 && <span className="muted" style={{ fontSize: 14 }}> {t.neededMargin(opposedMargin(r.raises))}</span>}
        </div>
      )}
      {r.fullDefense && <div className="hint">{t.fullDefense(fullDefenseBonus(total))}</div>}
    </>
  );
}

