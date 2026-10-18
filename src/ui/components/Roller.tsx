import { useEffect, useRef } from "react";
import {
  findSkill, formatDice, isRanged, poolStats, rollDice, woundState,
  type ActionDef, type Character,
} from "@carnet/core";
import { COMBAT_SUBS, SITUATIONS, TN_PER_RAISE, TN_SCALE, TRAIT_LABELS } from "../../rules/l5r4e";
import { pct } from "../format";
import { baseTN, calledRaises, effectiveManeuvers, finalTN, isUnskilled, poolFor, type RollOptions } from "../rolls";
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
  const pool = poolFor(c, a, opts, ui.stance);
  const set = (patch: Partial<RollOptions>) => dispatch({ type: "option", patch });
  const ws = woundState(c);
  const base = baseTN(a, opts);
  const tn = finalTN(c, a, opts, ui.maneuvers);
  const raises = pool.canRaise ? calledRaises(c, a, opts, ui.maneuvers) : 0;
  const unskilled = isUnskilled(c, a);
  const emphasisOffered = a.kind === "skill" && pool.canRaise;
  const stats = pool.rolled > 0 ? poolStats(pool, { emphasis: opts.emphasis && emphasisOffered, flatBonus: opts.flat }) : null;
  const context = ui.situation === "combat"
    ? COMBAT_SUBS.find((s) => s.id === ui.sub)?.label
    : SITUATIONS.find((s) => s.id === ui.situation)?.label;

  const roll = () => {
    const result = rollDice(pool, { emphasis: opts.emphasis && emphasisOffered, flatBonus: opts.flat }, rng);
    dispatch({ type: "rolled", result, tn, raises });
  };

  return (
    <>
      <div className="sheet-head">
        <span className="grip" />
        <button type="button" className="close" aria-label="Fermer" onClick={() => dispatch({ type: "closeSheet" })}>×</button>
      </div>
      <div className="label">{context}</div>
      <h2 style={{ margin: "2px 0 8px" }}>{a.label}</h2>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span className="poolbig" data-testid="pool">{formatDice(pool.rolled, pool.kept)}</span>
        <span className="muted" style={{ fontSize: 13 }}>{poolOrigin(c, a, opts)}{pool.bonus ? ` · +${pool.bonus} (règle des dix dés)` : ""}</span>
      </div>
      {stats && (
        <div className="statline">
          <span>Min <b>{stats.min}</b></span>
          <span>Moy. <b>{Math.round(stats.mean)}</b></span>
          <span>Max <b>{stats.max}{stats.open ? "+" : ""}</b></span>
          {typeof tn === "number" && <span className="ch">Réussite <b data-testid="chance">{pct(stats.chance(tn))}</b></span>}
        </div>
      )}
      {!pool.canRaise && a.kind === "skill" && <div className="hint" style={{ color: "var(--bad)" }}>Sans compétence : pas d'explosion, pas d'augmentation.</div>}

      <div className="opts">
        <TnField action={a} opts={opts} set={set} />
        {pool.canRaise ? (
          <label className="field">
            <span className="label">{a.attack ? "Augm. libres" : "Augmentations"}</span>
            <NumberField className="in mono" min={0} value={opts.raises} onChange={(n) => set({ raises: n })} />
          </label>
        ) : <div />}
        {pool.canRaise && (
          <label className="field">
            <span className="label">Augm. gratuites</span>
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
        <label className="chk">
          <input type="checkbox" checked={opts.voidPoint} disabled={c.voidPoints < 1 && !opts.voidPoint} onChange={(e) => set({ voidPoint: e.target.checked })} />
          {" "}Dépenser 1 point de Vide (+1g1) <span className="muted">· reste {c.voidPoints}</span>
        </label>
        {unskilled && (
          <label className="chk">
            <input type="checkbox" checked={opts.voidSkill} disabled={c.voidPoints < 1 && !opts.voidSkill} onChange={(e) => set({ voidSkill: e.target.checked })} />
            {" "}Dépenser 1 point de Vide : jouer {a.skill} au rang 1
          </label>
        )}
        {emphasisOffered && (
          <label className="chk">
            <input type="checkbox" checked={opts.emphasis} onChange={(e) => set({ emphasis: e.target.checked })} />
            {" "}Spécialisation : relancer les 1 {a.emphasisHint && <span className="muted">({a.emphasisHint})</span>}
          </label>
        )}
      </div>

      {a.attack && pool.canRaise && <ManeuverPicker />}

      {raises > 0 && (
        <div className="tnline" style={{ marginTop: 10, color: raises > c.voidRing ? "var(--bad)" : undefined }}>
          <span>Augmentations annoncées</span>
          <span className="mono"><b>{raises}</b> / max {c.voidRing}{raises > c.voidRing ? " · dépasse ton Vide" : ""}</span>
        </div>
      )}
      {typeof tn === "number" && typeof base === "number" && (
        <div className="tnline">
          <span>ND final</span>
          <span className="mono">
            <b style={{ fontSize: 18 }} data-testid="final-tn">{tn}</b>{" "}
            <span className="muted">= {base}{raises ? ` + ${TN_PER_RAISE * raises} augm.` : ""}{ws.penalty ? ` + ${ws.penalty} blessures` : ""}</span>
          </span>
        </div>
      )}
      {ws.penalty === null && <div className="hint" style={{ color: "var(--bad)" }}>Ton personnage est hors de combat.</div>}

      <button type="button" className="btn primary rollbtn" style={{ width: "100%", marginTop: 12, padding: 12 }} onClick={roll}>
        Lancer {formatDice(pool.rolled, pool.kept)}
      </button>
      <div ref={resultRef} aria-live="polite">
        {lastRoll && lastRoll.actionId === a.id && <RollOutcome roll={lastRoll} />}
      </div>
      {ui.history.length > 0 && (
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
      const bow = a.weapon && isRanged(a.weapon) ? `Arc ${a.weapon.bowStrength ?? 0}` : null;
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

function ManeuverPicker() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const sel = state.ui.maneuvers;
  const list = effectiveManeuvers(c);
  const setCount = (id: string, count: number) => dispatch({ type: "maneuver", id, count });
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
              {m.name} <b className="mono">{m.cost}</b>
            </button>
          );
        })}
      </div>
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
          >{d.total}</span>
        ))}
      </div>
      {hasTN ? (
        <>
          <div className={`verdict ${ok ? "ok" : "ko"}`}>
            {ok ? "Réussite" : "Échec"} <span className="mono" style={{ fontSize: 16 }}>{total} / {r.tn} ({margin >= 0 ? "+" : ""}{margin})</span>
          </div>
          {ok && (r.raises > 0 || r.free > 0) && (
            <div className="hint">{r.raises + r.free} augmentation(s) à appliquer{r.free ? ` dont ${r.free} gratuite(s)` : ""}.</div>
          )}
          {r.maneuvers.length > 0 && <div className="hint">{ok ? "Manœuvres réussies" : "Manœuvres perdues"} : {r.maneuvers.join(", ")}.</div>}
          {r.damageDice > 0 && <div className="hint">+{r.damageDice}g0 pré-rempli sur le prochain jet de dégâts.</div>}
          {ok && !r.raises && margin >= TN_PER_RAISE && r.kind !== "damage" && (
            <div className="hint">Marge de {margin} : tu aurais pu annoncer {Math.floor(margin / TN_PER_RAISE)} augmentation(s).</div>
          )}
        </>
      ) : (
        <div className="verdict">
          {total}{" "}
          <span className="muted" style={{ fontSize: 15, fontFamily: "var(--f-body)" }}>
            {r.tn === "opposed" ? "à comparer au jet adverse" : r.kind === "damage" ? "blessures infligées" : r.kind === "initiative" ? "initiative" : ""}
          </span>
        </div>
      )}
      {r.fullDefense && <div className="hint">+{Math.floor(total / 2)} au ND d'armure ce round (posture Défense totale activée).</div>}
    </>
  );
}

