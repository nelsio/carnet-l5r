import { useEffect, useRef } from "react";
import {
  applicableModifiers, armorRollTn, bowStrength, DAMAGE_MANEUVER_ID, describeEffect, focusOutcome, opposedMargin, opposedVerdict, stanceRestriction, woundEffectNote, describeModifier, effectOn, findSkill, fullDefenseBonus, maneuverCost, maneuverFreeRaises, modifierTN,
  formatDice, isRanged, isSocialSkill, poolStats, reminderText, rollDice, schoolContext, schoolReminders, verdict, voidMultiplier,
  voidPointBonus, voidSpendBonus, voidSpendOption, woundState,
  type ActionDef, type ActiveEffect, type Character, type Pool,
} from "@carnet/core";
import { CALLED_ZONES, CENTER_BONUS, COMBAT_SUBS, MELEE_TARGET_PENALTY, SITUATIONS, TN_PER_RAISE, TN_SCALE, TRAIT_LABELS, type CalledZone } from "../../rules/l5r4e";
import { pct } from "../format";
import {
  activeModifiers, calledRaises, contextOf, effectiveManeuvers, finalTN, isActive, isUnskilled, maneuverCosts, poolFor, rollWoundPenalty,
  selectedKeys, targetBaseTN, toPoolAction, uiRollStance, type RollOptions,
} from "../rolls";
import { selectedAction, useCharacter, useStore, type RollRecord } from "../store";
import { NumberField } from "./fields";

/** Point de rupture mobile (HANDOFF §7), identique à styles.css. */
const MOBILE_QUERY = "(max-width: 720px)";

export function Roller() {
  const { state, dispatch, rng } = useStore();
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

  if (!a) return <p className="muted">Choisis une action.</p>;

  const { opts } = ui;
  const ctx = schoolContext({ ...contextOf(ui), emphasis: opts.emphasisName });
  const pa = toPoolAction(a);
  const selected = selectedKeys(ui.techToggles);
  const stance = uiRollStance(ui);
  const duel = ui.situation === "combat" && ui.sub === "duel";
  // Bonus de Centre (F1) : au round qui suit le Centre, sur un seul jet.
  const centerOffered = ui.situation === "combat" && !duel && ui.centerLastRound && !ui.centerBonusUsed && a.kind !== "damage";
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
        <button type="button" className="close" aria-label="Fermer" onClick={() => dispatch({ type: "closeSheet" })}>×</button>
      </div>
      <div className="label">{context}</div>
      <h2 style={{ margin: "2px 0 8px" }}>{a.label}</h2>
      {restriction && (
        <div className="hint" data-testid="stance-restriction" style={{ color: "var(--bad)", marginTop: 0 }}>
          {restriction} Tu peux lancer quand même si le MJ l'accepte.
        </div>
      )}
      {woundNote && <div className="hint" data-testid="wound-note" style={{ color: "var(--bad)", marginTop: 0 }}>{woundNote}</div>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span className="poolbig" data-testid="pool">{formatDice(pool.rolled, pool.kept)}</span>
        <span className="muted" style={{ fontSize: 13 }}>{poolOrigin(c, a, opts)}{pool.bonus ? ` · ${pool.bonus > 0 ? "+" : ""}${pool.bonus} au total` : ""}</span>
      </div>
      {chips.length > 0 && (
        <div className="tchips" data-testid="tech-chips">
          {chips.map((e) => (
            <span key={e.key} className={`tchip${e.mastery ? " mastery" : ""}`} title={e.technique}>
              {e.mastery && <b className="tag">Maîtrise</b>}{describeEffect(e, c, ui.techInputs[e.key])} · {e.source}
            </span>
          ))}
        </div>
      )}
      <ManualLine pool={pool} emphasis={opts.emphasis && emphasisOffered} flat={opts.flat} free={bonusFree} />
      {stats && (
        <div className="statline">
          <span>Min <b>{stats.min}</b></span>
          <span>Moy. <b>{Math.round(stats.mean)}</b></span>
          <span>Max <b>{stats.max}{stats.open ? "+" : ""}</b>{pool.explodeOn === 9 && <> <span className="tag" title="Explose sur 9">9+</span></>}</span>
          {typeof tn === "number" && <span className="ch">Réussite <b data-testid="chance">{pct(stats.chance(tn))}</b></span>}
        </div>
      )}
      {mastery && <div className="hint" data-testid="mastery" style={{ color: "var(--gold)" }}>{mastery}.</div>}
      {pool.notes.filter((n) => n.startsWith("Force ") || n.includes("force de l'arc") || n.startsWith("Désarmement")).map((n) => (
        <div key={n} className="hint" data-testid="weapon-note" style={{ color: "var(--gold)" }}>{n}.</div>
      ))}
      {armorRollTn(c, pa, ui.mounted).notes.map((n) => <div key={n} className="hint" data-testid="armor-note">{n}.</div>)}
      {pool.warnings?.map((w) => <div key={w} className="hint" data-testid="weapon-warning" style={{ color: "var(--bad)" }}>{w}</div>)}
      {!pool.canRaise && a.kind === "skill" && <div className="hint" style={{ color: "var(--bad)" }}>Sans compétence : pas d'explosion, pas d'augmentation.</div>}

      <div className="opts">
        <TnField action={a} opts={opts} set={set} />
        {/* Grille sans case vide : la cellule d'alignement ne sert qu'à un ND sans augmentations (HANDOFF §6.2). */}
        {pool.canRaise ? (
          <label className="field">
            <span className="label">{a.attack ? "Augm. libres" : "Augmentations"}</span>
            <NumberField className="in mono" min={0} value={opts.raises} onChange={(n) => set({ raises: n })} />
          </label>
        ) : a.tn !== null && <div />}
        {pool.canRaise && (
          <label className="field">
            <span className="label">Augm. gratuites{bonusFree ? ` (+${bonusFree} bonus)` : ""}</span>
            <NumberField className="in mono" min={0} value={opts.free} onChange={(n) => set({ free: n })} />
          </label>
        )}
        <label className="field">
          <span className="label">Dés lancés ±</span>
          <NumberField className="in mono" value={opts.extraRolled} onChange={(n) => set({ extraRolled: n })} />
        </label>
        <label className="field">
          <span className="label">Bonus fixe</span>
          <NumberField className="in mono" value={opts.flat} onChange={(n) => set({ flat: n })} />
        </label>
      </div>

      <div className="grid" style={{ gap: 6, marginBottom: 12 }}>
        {!pool.voidBlocked && (
          <label className="chk">
            <input type="checkbox" checked={opts.voidPoint} disabled={c.voidPoints < 1 && !opts.voidPoint} onChange={(e) => set({ voidPoint: e.target.checked })} />
            {" "}{pool.katanaVoid
              ? <>Vide : +{perVoid.rolled * vm}g{perVoid.kept * vm} aux dégâts (katana)</>
              : <>Dépenser 1 point de Vide (+{perVoid.rolled * vm}g{perVoid.kept * vm})</>}
            {" "}<span className="muted">· reste {c.voidPoints}</span>
          </label>
        )}
        {spend && spendDice && (
          <label className="chk">
            <input
              type="checkbox" checked={opts.voidSpend} disabled={c.voidPoints < spend.points && !opts.voidSpend}
              onChange={(e) => set({ voidSpend: e.target.checked })}
            />
            {" "}Dépenser {spend.points} points de Vide (+{spendDice.rolled * vm}g{spendDice.kept * vm}) <span className="muted">· {spend.source}</span>
          </label>
        )}
        {unskilled && (
          <label className="chk">
            <input type="checkbox" checked={opts.voidSkill} disabled={c.voidPoints < 1 && !opts.voidSkill} onChange={(e) => set({ voidSkill: e.target.checked })} />
            {" "}Dépenser 1 point de Vide : jouer {a.skill} au rang 1
          </label>
        )}
        {emphasisOffered && emphases.length > 0 && (
          <label className="field">
            <span className="label">Spécialisation · relance les 1</span>
            <select
              className="in" value={opts.emphasisName}
              onChange={(e) => set({ emphasisName: e.target.value, emphasis: e.target.value !== "" })}
            >
              <option value="">Aucune</option>
              {emphases.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
        )}
        {emphasisOffered && !emphases.length && (
          <label className="chk">
            <input type="checkbox" checked={opts.emphasis} onChange={(e) => set({ emphasis: e.target.checked })} />
            {" "}Spécialisation : relancer les 1 {a.emphasisHint && <span className="muted">({a.emphasisHint})</span>}
          </label>
        )}
        {centerOffered && (
          <label className="chk">
            <input type="checkbox" checked={opts.centerBonus} onChange={(e) => set({ centerBonus: e.target.checked })} />
            {" "}Bonus de Centre <span className="muted">· +{CENTER_BONUS.rolled}g{CENTER_BONUS.kept} +{c.voidRing} sur ce seul jet</span>
          </label>
        )}
        {ranged && (
          <label className="chk">
            <input type="checkbox" checked={opts.meleeTarget} onChange={(e) => set({ meleeTarget: e.target.checked })} />
            {" "}Cible au corps à corps <span className="muted">· −{MELEE_TARGET_PENALTY} au total</span>
          </label>
        )}
        {tnOffered && (
          <label className="chk">
            <input type="checkbox" checked={opts.freeToTn} onChange={(e) => set({ freeToTn: e.target.checked })} />
            {" "}Utiliser les augmentations gratuites pour baisser le ND <span className="muted">· −{TN_PER_RAISE * totalFree}</span>
          </label>
        )}
        {duel && a.id === "assess" && (
          <label className="chk">
            <input type="checkbox" checked={ui.assessmentWon} onChange={(e) => dispatch({ type: "assessmentWon", on: e.target.checked })} />
            {" "}Gagnée de 10 ou plus <span className="muted">· bonus à la Concentration</span>
          </label>
        )}
        {duel && a.id === "focus" && <FocusGap />}
      </div>

      {bonuses.length > 0 && (
        <div className="grid bonuses" style={{ gap: 6, marginBottom: 12 }}>
          <div className="label">Bonus de jet <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>· techniques, avantages, désavantages</span></div>
          {bonuses.map((m) => (
            <label key={m.id} className="chk">
              <input
                type="checkbox" checked={isActive(m, ui.modifierToggles)}
                onChange={(e) => dispatch({ type: "toggleModifier", id: m.id, on: e.target.checked })}
              />
              {" "}{m.name} <span className="muted">· {describeModifier(m)}{m.mode === "optional" ? " · situationnel" : ""}</span>
            </label>
          ))}
        </div>
      )}

      {(pool.optional?.length ?? 0) > 0 && <TechniqueOptions effects={pool.optional ?? []} />}

      {a.attack && pool.canRaise && <ManeuverPicker effects={effects} />}

      {reminders.length > 0 && (
        <div data-testid="school-reminders">
          {reminders.map((e) => (
            <div key={e.key} className="hint" style={{ color: "var(--gold)" }}>{e.technique} ({e.source}) : {reminderText(e, c)}</div>
          ))}
        </div>
      )}

      {unlimited && <div className="hint" style={{ color: "var(--gold)" }}>Augmentations non limitées par ton Vide.</div>}
      {raises > 0 && (
        <div className="tnline" style={{ marginTop: 10, color: !unlimited && raises > c.voidRing ? "var(--bad)" : undefined }}>
          <span>Augmentations annoncées</span>
          <span className="mono"><b>{raises}</b>{unlimited ? "" : ` / max ${c.voidRing}`}{!unlimited && raises > c.voidRing ? " · dépasse ton Vide" : ""}</span>
        </div>
      )}
      {typeof tn === "number" && typeof base === "number" && (
        <div className="tnline">
          <span>ND final</span>
          <span className="mono">
            <b style={{ fontSize: 18 }} data-testid="final-tn">{tn}</b>{" "}
            <span className="muted">= {base}{raises ? ` + ${TN_PER_RAISE * raises} augm.` : ""}{penalty ? ` + ${penalty} blessures` : ""}{bonusTN ? ` ${bonusTN > 0 ? "+" : "−"} ${Math.abs(bonusTN)} bonus` : ""}{weaponTn ? ` + ${weaponTn} arc` : ""}{pool.armorTn ? ` + ${pool.armorTn} armure` : ""}</span>
          </span>
        </div>
      )}
      {tn === "opposed" && (
        <div className="tnline" style={{ marginTop: 10 }}>
          <span>{raises > 0 ? <>Bats l'adversaire d'au moins <b data-testid="opposed-margin">{opposedMargin(raises)}</b></> : "Bats le total adverse"}</span>
          <label className="mono" style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span className="muted" style={{ fontFamily: "var(--f-body)", fontSize: 13 }}>Total adverse</span>
            <input
              className="in mono" type="number" min={0} style={{ width: 72 }} aria-label="Total adverse"
              value={opts.opponentTotal ?? ""}
              onChange={(e) => set({ opponentTotal: e.target.value === "" ? null : Math.max(0, Math.trunc(Number(e.target.value)) || 0) })}
            />
          </label>
        </div>
      )}
      {freeToTn > 0 && typeof tn === "number" && <div className="hint">{freeToTn} augmentation(s) gratuite(s) déduites du ND (−{TN_PER_RAISE * freeToTn}).</div>}
      {ws.penalty === null && <div className="hint" style={{ color: "var(--bad)" }}>Ton personnage est hors de combat.</div>}

      {ui.showDiceRoller && (
        <>
          <button type="button" className="btn primary rollbtn" style={{ width: "100%", marginTop: 12, padding: 12 }} onClick={roll}>
            Lancer {formatDice(pool.rolled, pool.kept)}
          </button>
          <div ref={resultRef} aria-live="polite">
            {lastRoll && lastRoll.actionId === a.id && <RollOutcome roll={lastRoll} />}
          </div>
        </>
      )}
      {ui.showDiceRoller && ui.history.length > 0 && (
        <div className="hist">
          <span className="label">Derniers jets</span>
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

/** Concentration en duel (F10) : écart saisi → qui frappe en premier, augmentations gratuites pour la Frappe. */
function FocusGap() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const gap = state.ui.focusGap;
  const outcome = gap === null ? null : focusOutcome(c, gap);
  return (
    <div>
      <label className="field" style={{ maxWidth: 260 }}>
        <span className="label">Écart de Concentration (ton total − adverse)</span>
        <input
          className="in mono" type="number" min={0} aria-label="Écart de Concentration" value={gap ?? ""}
          onChange={(e) => dispatch({ type: "focusGap", gap: e.target.value === "" ? null : Math.max(0, Math.trunc(Number(e.target.value)) || 0) })}
        />
      </label>
      {outcome && (
        <div className="hint" data-testid="focus-outcome" style={{ color: outcome.first ? "var(--gold)" : undefined }}>
          {outcome.first
            ? `Tu frappes en premier, ${outcome.freeRaises} augmentation(s) gratuite(s) pré-remplie(s) sur la Frappe.`
            : `Frappe simultanée (il faut ${outcome.threshold} d'écart pour frapper en premier).`}
        </div>
      )}
    </div>
  );
}

/** Règles de relance pour jouer avec de vrais dés (HANDOFF §6.2). */
function ManualLine({ pool, emphasis, flat, free }: { pool: Pool; emphasis: boolean; flat: number; free: number }) {
  const nine = pool.explodeOn === 9;
  const add = pool.bonus + flat;
  const tenDice = pool.notes.some((n) => n.startsWith("Règle des dix dés"));
  return (
    <div className="manual" data-testid="manual">
      {pool.explodes
        ? <>Les <b>{nine ? "9 et 10" : "10"}</b> explosent : relance le dé et additionne, tant qu'il retombe sur {nine ? "9 ou 10" : "10"}.</>
        : "Aucun dé n'explose (compétence non maîtrisée)."}
      {emphasis && <> Spécialisation : relance une fois chaque <b>1</b>.</>}
      {add !== 0 && <> Ajoute <b>{add > 0 ? "+" : ""}{add}</b> au total{tenDice ? " (dont règle des dix dés)" : ""}.</>}
      {free > 0 && <> <b>{free}</b> augmentation(s) gratuite(s).</>}
    </div>
  );
}

/** Origine de la réserve, en clair. */
function poolOrigin(c: Character, a: ActionDef, opts: RollOptions): string {
  const extra = opts.extraRolled ? ` + ${opts.extraRolled} dé(s)` : "";
  switch (a.kind) {
    case "skill": {
      const trait = a.trait ?? "agility";
      const value = trait === "void" ? c.voidRing : c.traits[trait];
      return `${a.skill} ${findSkill(c, a.skill ?? "")?.rank ?? 0} + ${TRAIT_LABELS[trait]} ${value}${extra}`;
    }
    case "trait": return `${TRAIT_LABELS[a.trait ?? "stamina"]} pur${extra}`;
    case "damage": {
      // Force effective de l'arc : plafonnée par la Force, +1 avec Kyujutsu 7 (annexe E.2 C11).
      const bow = a.weapon && isRanged(a.weapon) ? `Arc ${bowStrength(c, a.weapon)}` : null;
      return `${bow ?? `Force ${c.traits.strength}`} + VD ${a.dr ?? ""}${extra}`;
    }
    default: return `Rang ${c.insightRank} + Réflexes ${c.traits.reflexes}${extra}`;
  }
}

function TnField({ action: a, opts, set }: { action: ActionDef; opts: RollOptions; set: (p: Partial<RollOptions>) => void }) {
  switch (a.tn) {
    case null: return null;
    case "target":
      return (
        <label className="field"><span className="label">ND d'armure cible</span>
          <NumberField className="in mono" min={0} value={opts.targetTN} onChange={(n) => set({ targetTN: n })} />
        </label>
      );
    case "assessment":
      return (
        <label className="field"><span className="label">Rang adverse</span>
          <NumberField className="in mono" min={1} max={10} value={opts.opponentRank} onChange={(n) => set({ opponentRank: n })} />
        </label>
      );
    case "opposed":
      return (
        <div className="field"><span className="label">ND</span><span className="muted" style={{ fontSize: 13, paddingTop: 6 }}>Opposition : compare au jet adverse</span></div>
      );
    default:
      return (
        <label className="field"><span className="label">ND de base</span>
          <select className="in mono" value={opts.tn} onChange={(e) => set({ tn: Number(e.target.value) })}>
            {TN_SCALE.map((t) => <option key={t.tn} value={t.tn}>{t.tn} · {t.label}</option>)}
          </select>
        </label>
      );
  }
}

/** Techniques d'école à cocher pour ce jet (annexe C.5), remises à zéro à chaque nouvelle action. */
function TechniqueOptions({ effects }: { effects: readonly ActiveEffect[] }) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { techToggles, techInputs } = state.ui;
  return (
    <div className="grid bonuses" style={{ gap: 6, marginBottom: 12 }} role="group" aria-label="Techniques à cocher">
      <div className="label">Techniques à cocher</div>
      {effects.map((e) => {
        const effect = describeEffect(e, c, techInputs[e.key]);
        return (
          <div key={e.key}>
            <label className="chk">
              <input type="checkbox" checked={!!techToggles[e.key]} onChange={(ev) => dispatch({ type: "toggleTechnique", key: e.key, on: ev.target.checked })} />
              {" "}{("label" in e && e.label) || e.technique}{" "}
              <span className="muted">· {effect ? `${effect} · ` : ""}{"void" in e && e.void ? `${e.void} point de Vide · ` : ""}{e.source}</span>
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
  return (
    <>
      <div className="label">Manœuvres <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>· coût en augmentations</span></div>
      <div className="mans">
        {list.map((m) => {
          const n = sel[m.id] ?? 0;
          return m.stackable ? (
            <div key={m.id} className={`man${n ? " on" : ""}`}>
              <button type="button" aria-label={`Retirer ${m.name}`} onClick={() => setCount(m.id, n - 1)}>−</button>
              <span title={m.effect}>{m.name} <b className="mono">{n}</b></span>
              <button type="button" aria-label={`Ajouter ${m.name}`} onClick={() => setCount(m.id, n + 1)}>+</button>
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
          <span className="label">Coup ciblé · zone</span>
          <select className="in" value={state.ui.opts.calledZone} onChange={(e) => setOpt({ calledZone: e.target.value as CalledZone })}>
            {CALLED_ZONES.map((z) => <option key={z.id} value={z.id}>{z.label} · {z.cost} augm.</option>)}
          </select>
        </label>
      )}
      {(sel.knockdown ?? 0) > 0 && list.some((m) => m.id === "knockdown") && (
        <label className="chk" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={state.ui.opts.quadruped} onChange={(e) => setOpt({ quadruped: e.target.checked })} />
          {" "}Renverser un quadrupède <span className="muted">· 4 augmentations</span>
        </label>
      )}
      {reserved.map((e) => (
        <div key={e.key} className="hint" style={{ marginTop: 4, color: "var(--gold)" }}>
          {describeEffect(e, c)} · {e.source} : déduites du coût de la manœuvre.
        </div>
      ))}
      {(sel[DAMAGE_MANEUVER_ID] ?? 0) > 0 && (
        <div className="hint" data-testid="damage-raises-note" style={{ marginTop: 4 }}>
          Toutes tes augmentations de dégâts du round comptent comme un seul effet pour les réductions de coût de manœuvre.
        </div>
      )}
      {list.filter((m) => sel[m.id]).map((m) => (
        <div key={m.id} className="hint" style={{ marginTop: 4 }}>• <b>{m.name}</b> : {m.effect}</div>
      ))}
    </>
  );
}

function RollOutcome({ roll: r }: { roll: RollRecord }) {
  const { total } = r.result;
  const hasTN = typeof r.tn === "number";
  const ok = hasTN && total >= (r.tn as number);
  const margin = hasTN ? total - (r.tn as number) : 0;
  return (
    <>
      <div className="dice" aria-label="Dés">
        {r.result.dice.map((d, i) => (
          <span
            key={i}
            className={["die", d.kept ? "kept" : "", d.faces.length > 1 ? "ex" : ""].filter(Boolean).join(" ")}
            title={`${d.faces.join(" + ")}${d.rerolledOne ? " (1 relancé)" : ""}`}
          >{d.total}{d.faces.length > 1 && <small>{d.faces.join("+")}</small>}</span>
        ))}
      </div>
      {hasTN ? (
        <>
          <div className={`verdict ${ok ? "ok" : "ko"}`}>
            {ok ? "Réussite" : "Échec"} <span className="mono" style={{ fontSize: 16 }}>{total} / {r.tn} ({margin >= 0 ? "+" : ""}{margin})</span>
          </div>
          {r.baseSuccess && (
            <div className="hint" data-testid="base-success" style={{ color: "var(--gold)" }}>
              Réussite sans les augmentations : le ND de base {r.baseTn} est atteint (Akodo R5), les augmentations n'ont pas d'effet.
            </div>
          )}
          {ok && (r.raises > 0 || r.free > 0) && (
            <div className="hint">{r.raises + r.free} augmentation(s) à appliquer{r.free ? ` dont ${r.free} gratuite(s)` : ""}.</div>
          )}
          {r.maneuvers.length > 0 && <div className="hint">{ok ? "Manœuvres réussies" : "Manœuvres perdues"} : {r.maneuvers.join(", ")}.</div>}
          {r.damageDice > 0 && !r.disarm && <div className="hint">+{r.damageDice}g0 pré-rempli sur le prochain jet de dégâts.</div>}
          {r.feint ? <div className="hint" data-testid="feint-note">Feinte réussie : +{r.feint} pré-rempli sur le prochain jet de dégâts.</div> : null}
          {r.disarm && <div className="hint" data-testid="disarm-note">Désarmement réussi : le prochain jet de dégâts est 2g1 sans la Force, sans augmentation de dégâts.</div>}
          {ok && !r.raises && margin >= TN_PER_RAISE && r.kind !== "damage" && (
            <div className="hint">Marge de {margin} : tu aurais pu annoncer {Math.floor(margin / TN_PER_RAISE)} augmentation(s).</div>
          )}
        </>
      ) : (
        <div className="verdict">
          {total}{" "}
          <span className="muted" style={{ fontSize: 15, fontFamily: "var(--f-body)" }}>
            {r.tn === "opposed" ? (r.opponent === undefined ? "à comparer au jet adverse" : `contre ${r.opponent}`) : r.kind === "damage" ? "blessures infligées" : r.kind === "initiative" ? "initiative" : ""}
          </span>
        </div>
      )}
      {r.tn === "opposed" && r.opponent !== undefined && (
        <div className={`verdict ${opposedVerdict(total, r.opponent, r.raises) === "win" ? "ok" : opposedVerdict(total, r.opponent, r.raises) === "lose" ? "ko" : ""}`} data-testid="opposed-verdict">
          {{ win: "Tu l'emportes", tie: "Égalité", lose: "L'adversaire l'emporte" }[opposedVerdict(total, r.opponent, r.raises)]}
          {r.raises > 0 && <span className="muted" style={{ fontSize: 14 }}> · il fallait {opposedMargin(r.raises)} d'écart</span>}
        </div>
      )}
      {r.fullDefense && <div className="hint">+{fullDefenseBonus(total)} au ND d'armure ce round (posture Défense totale activée).</div>}
    </>
  );
}

