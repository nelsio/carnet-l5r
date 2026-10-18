import { useEffect } from "react";
import { armorTN, describeModifier, formatDice, modifiersOf, movement, rings, type ActionDef } from "@carnet/core";
import { COMBAT_SUBS, SITUATIONS, STANCES } from "../../rules/l5r4e";
import { toMeters } from "../format";
import { armorBonus, DEFAULT_ROLL_OPTIONS, isActive, isRollable, poolFor } from "../rolls";
import { currentActions, useCharacter, useStore, type AidSituation } from "../store";
import { Roller } from "./Roller";
import { Stats } from "./Stats";

const AID_SITUATIONS: { id: AidSituation; label: string }[] = [...SITUATIONS, { id: "stats", label: "Statistiques" }];

export function Aid() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;

  // Mobile : Échap ferme le panneau, la page ne défile pas derrière (HANDOFF §6.3, §7).
  useEffect(() => {
    if (!ui.sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dispatch({ type: "closeSheet" });
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("sheet-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("sheet-open");
    };
  }, [ui.sheetOpen, dispatch]);

  const situations = (
    <div className="sit" role="group" aria-label="Situation">
      {AID_SITUATIONS.map((s) => (
        <button key={s.id} type="button" aria-pressed={ui.situation === s.id} onClick={() => dispatch({ type: "situation", situation: s.id })}>{s.label}</button>
      ))}
    </div>
  );
  if (ui.situation === "stats") return <>{situations}<Stats /></>;

  const actions = currentActions(c, ui);
  const initiative = actions.find((a) => a.kind === "initiative");
  const combat = ui.situation === "combat";

  return (
    <>
      {situations}
      {combat && (
        <div className="sit sub" role="group" aria-label="Type de combat">
          {COMBAT_SUBS.map((s) => (
            <button key={s.id} type="button" aria-pressed={ui.sub === s.id} onClick={() => dispatch({ type: "sub", sub: s.id })}>{s.label}</button>
          ))}
        </div>
      )}
      <div className="aid">
        <div className="grid" style={{ gap: 12 }}>
          {initiative && <InitiativeCard action={initiative} />}
          {combat && ui.sub !== "duel" && <StancePanel />}
          {combat && <VoidPanel />}
          <div className="actions">
            {actions.filter((a) => a.kind !== "initiative").map((a) => <ActionCard key={a.id} action={a} />)}
            {combat && !c.weapons.length && <p className="muted">Ajoute des armes dans la fiche pour voir les attaques.</p>}
          </div>
        </div>
        <div className={`backdrop${ui.sheetOpen ? " open" : ""}`} onClick={() => dispatch({ type: "closeSheet" })} />
        <div className={`panel roller${ui.sheetOpen ? " open" : ""}`} role="dialog" aria-label="Lanceur de dés">
          <Roller />
        </div>
      </div>
    </>
  );
}

function InitiativeCard({ action }: { action: ActionDef }) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const p = poolFor(c, action, DEFAULT_ROLL_OPTIONS, "attack");
  const dice = formatDice(p.rolled, p.kept);
  const value = state.ui.initiative;
  return (
    <button type="button" className="act" aria-pressed={state.ui.selectedId === action.id} onClick={() => dispatch({ type: "select", id: action.id })}>
      <span className="t">Initiative <span className="muted" style={{ fontWeight: 500 }}>· une fois par combat</span></span>
      <span className="p" data-testid="initiative">{value !== null ? <span style={{ color: "var(--ink)", fontSize: 20 }}>{value}</span> : dice}</span>
      <span className="d">
        {value !== null
          ? `Ton rang dans l'ordre du combat. Clique pour relancer si un nouveau combat commence (${dice}).`
          : `Rang ${c.insightRank} + Réflexes ${c.traits.reflexes}, gardé Réflexes. À lancer au début du combat.`}
      </span>
    </button>
  );
}

function StancePanel() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const tn = armorTN(c, { stance: ui.stance, fullDefenseBonus: ui.fullDefenseBonus, voidArmor: ui.voidArmor, bonus: armorBonus(c, ui.armorToggles, ui.stance) });
  const armorMods = modifiersOf(c).filter((m) => m.appliesTo === "armor");
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <span className="label">Posture</span>
        <span className="muted" style={{ fontSize: 13 }}>
          ND d'armure <b className="mono" style={{ color: "var(--ink)", fontSize: 16 }}>{tn}</b>
          {ui.voidArmor && <> <span className="tag">+10 Vide</span></>}
        </span>
      </div>
      <div className="stance" role="group" aria-label="Posture">
        {STANCES.map((s) => (
          <button key={s.id} type="button" aria-pressed={ui.stance === s.id} onClick={() => dispatch({ type: "stance", stance: s.id })}>
            <b>{s.label}</b><span className="muted">{s.description}</span>
          </button>
        ))}
      </div>
      {armorMods.length > 0 && (
        <div className="grid" style={{ gap: 4, marginTop: 8 }}>
          {armorMods.map((m) => (
            <label key={m.id} className="chk">
              <input type="checkbox" checked={isActive(m, ui.armorToggles)} onChange={(e) => dispatch({ type: "toggleArmorModifier", id: m.id, on: e.target.checked })} />
              {" "}{m.name} <span className="muted">· {describeModifier(m)}{m.stance ? ` · ${STANCES.find((s) => s.id === m.stance)?.label}` : ""}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function VoidPanel() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const none = c.voidPoints < 1;
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <span className="label">Dépenser du Vide · reste {c.voidPoints}</span>
        <button type="button" className="btn sm" onClick={() => dispatch({ type: "newRound" })}>Nouveau round</button>
      </div>
      {ui.voidSpentThisRound && (
        <p className="hint" style={{ color: "var(--bad)", margin: "0 0 8px" }}>Déjà un point de Vide dépensé ce round (limite normale : 1 par round).</p>
      )}
      <div className="stance">
        <button type="button" aria-pressed={ui.opts.voidPoint} disabled={none && !ui.opts.voidPoint} onClick={() => dispatch({ type: "option", patch: { voidPoint: !ui.opts.voidPoint } })}>
          <b>+1g1 au jet</b><span className="muted">Dépensé au prochain jet lancé.</span>
        </button>
        <button type="button" aria-pressed={ui.voidArmor} disabled={none && !ui.voidArmor} onClick={() => dispatch({ type: "voidArmor" })}>
          <b>+10 ND d'armure</b><span className="muted">Jusqu'au prochain round.</span>
        </button>
        <button type="button" aria-pressed={ui.opts.voidSkill} disabled={none && !ui.opts.voidSkill} onClick={() => dispatch({ type: "option", patch: { voidSkill: !ui.opts.voidSkill } })}>
          <b>Compétence au rang 1</b><span className="muted">Jouer une compétence que tu n'as pas.</span>
        </button>
        <button type="button" disabled={none} onClick={() => dispatch({ type: "voidTechnique" })}>
          <b>Activer une capacité</b><span className="muted">Technique, kata ou avantage payé en Vide.</span>
        </button>
      </div>
    </div>
  );
}

function MovePanel() {
  const c = useCharacter();
  const m = movement(c);
  const tiles = [
    { label: "Action libre", ft: m.free, note: "1 fois par round" },
    { label: "Action simple", ft: m.simple, note: "Eau × 10" },
    { label: "Maximum / round", ft: m.max, note: "Eau × 20" },
  ];
  return (
    <div className="panel movebox">
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 17 }}>Se déplacer en combat</h2>
        <span className="muted" style={{ fontSize: 13 }}>Anneau d'Eau {rings(c).water}</span>
      </div>
      <div className="moves">
        {tiles.map((t) => (
          <div key={t.label}>
            <span className="label">{t.label}</span>
            <b className="mono">{t.ft} pi</b>
            <span className="muted">{toMeters(t.ft)} · {t.note}</span>
          </div>
        ))}
      </div>
      <p className="hint" style={{ marginBottom: 0 }}>Terrain difficile (eau, foule, escaliers) : distances divisées par deux. Valeurs 4e à vérifier dans ton livre.</p>
    </div>
  );
}

function ActionCard({ action: a }: { action: ActionDef }) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  if (a.kind === "move") return <MovePanel />;
  if (a.kind === "info") {
    return (
      <div className="act info"><span className="t">{a.label}</span><span /><span className="d">{a.description}</span></div>
    );
  }
  const p = isRollable(a) ? poolFor(c, a, DEFAULT_ROLL_OPTIONS, ui.stance) : null;
  const child = a.kind === "damage";
  const pending = child && ui.pendingDamage && ui.pendingDamage.parent === a.parent ? ui.pendingDamage.dice : 0;
  return (
    <button
      type="button"
      className={["act", child ? "child" : "", pending ? "linked" : ""].filter(Boolean).join(" ")}
      aria-pressed={ui.selectedId === a.id}
      onClick={() => dispatch({ type: "select", id: a.id })}
    >
      <span className="t">{a.label}{pending > 0 && <> <span className="pend">+{pending}g0 en attente</span></>}</span>
      <span className="p">{p ? formatDice(p.rolled, p.kept) : ""}</span>
      <span className="d">{a.description}</span>
    </button>
  );
}
