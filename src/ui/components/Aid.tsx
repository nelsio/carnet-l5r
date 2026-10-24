import { useEffect } from "react";
import {
  armorEffects, describeModifier, hasMountedEffects, isSimpleAttack, modifiersOf, movement, movementBonus, resolveValue,
  reminderText, rings, schoolOf, schoolReminders, stackCount, stackEffects, stackMax, voidMultiplier,
  type ActionDef, type ActiveEffect,
} from "@carnet/core";
import { COMBAT_SUBS, SITUATIONS, STANCES } from "../../rules/l5r4e";
import type { ReminderContext } from "../../rules/ecoles";
import { toMeters } from "../format";
import { contextOf, currentArmorTN, DEFAULT_ROLL_OPTIONS, isActive, isRollable, poolFor, poolLabel, toPoolAction } from "../rolls";
import { currentActions, useCharacter, useStore, type AidSituation, type InfoPanel } from "../store";
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
          {(combat || ui.situation === "court") && <RemindersPanel />}
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
  const dice = poolLabel(p);
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
  const tn = currentArmorTN(c, ui);
  const armorMods = modifiersOf(c).filter((m) => m.appliesTo === "armor");
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <span className="panel-title"><span className="label">Posture</span><InfoButton panel="stance" label="Posture" /></span>
        <span className="muted" style={{ fontSize: 13 }}>
          ND d'armure <b className="mono" style={{ color: "var(--ink)", fontSize: 16 }}>{tn}</b>
          {ui.voidArmor && <> <span className="tag">+{10 * voidMultiplier(c)} Vide</span></>}
        </span>
      </div>
      <div className="stance" role="group" aria-label="Posture">
        {STANCES.map((s) => (
          <button key={s.id} type="button" aria-pressed={ui.stance === s.id} onClick={() => dispatch({ type: "stance", stance: s.id })}>
            <b>{s.label}</b>{ui.info.stance && <span className="muted">{s.description}</span>}
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
      <SchoolCombat />
    </div>
  );
}

/** Techniques d'école du panneau Posture : monture, Centre du round précédent, compteurs et cases de ND d'armure. */
function SchoolCombat() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  if (!schoolOf(c)) return null;
  const armor = armorEffects(c, contextOf(ui));
  // Compteurs : ND d'armure valables dans la posture, et ND de la cible (toujours).
  const stacked = [...armor.filter((e) => "stack" in e && e.stack), ...stackEffects(c).filter((e) => e.kind === "targetTn")];
  const boxes = armor.filter((e) => e.kind === "armor" && !e.stack && e.mode === "optional");
  const mounted = hasMountedEffects(c);
  if (!mounted && !ui.centerLastRound && !stacked.length && !boxes.length) return null;
  return (
    <div className="techbox" role="group" aria-label="Techniques d'école">
      <div className="label">Techniques d'école</div>
      {mounted && (
        <label className="chk"><input type="checkbox" checked={ui.mounted} onChange={(e) => dispatch({ type: "mounted", on: e.target.checked })} /> Monté</label>
      )}
      {ui.centerLastRound && <span className="tag" style={{ justifySelf: "start" }}>Bonus de Centre du round précédent actif</span>}
      {stacked.map((e) => <StackRow key={e.key} effect={e} />)}
      {boxes.map((e) => e.kind === "armor" && (
        <label key={e.key} className="chk">
          <input type="checkbox" checked={!!ui.schoolArmor[e.key]} onChange={(ev) => dispatch({ type: "toggleSchoolArmor", key: e.key, on: ev.target.checked })} />
          {" "}<b>{e.label ?? e.technique}</b> <span className="muted">· +{resolveValue(e.value, c)} ND d'armure · {e.source}</span>
        </label>
      ))}
      {stacked.some((e) => (ui.stacks[e.key] ?? 0) > 0) && (
        <button type="button" className="btn sm" style={{ justifySelf: "start" }} onClick={() => dispatch({ type: "resetStacks" })}>Fin de l'escarmouche : compteurs à zéro</button>
      )}
    </div>
  );
}

/** Compteur −/+ d'une technique cumulable, plafonné (Hiruma R2, Yoritomo R2). */
function StackRow({ effect: e }: { effect: ActiveEffect }) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  if (!("stack" in e) || !e.stack || (e.kind !== "armor" && e.kind !== "targetTn")) return null;
  const n = stackCount(c, e, state.ui.stacks);
  const max = stackMax(c, e);
  const value = resolveValue(e.value, c);
  const each = e.kind === "armor" ? `+${value} ND d'armure` : `${value} au ND de la cible`;
  return (
    <div className="stackrow">
      <span><b>{e.stack.label}</b> <span className="muted">· {each} chacune, max {max} · {e.source}</span></span>
      <span className="stepper">
        <button type="button" aria-label={`Retirer : ${e.stack.label}`} onClick={() => dispatch({ type: "stack", key: e.key, count: n - 1 })}>−</button>
        <b className="mono" data-testid={`stack-${e.key}`}>{n}</b>
        <button type="button" aria-label={`Ajouter : ${e.stack.label}`} disabled={n >= max} onClick={() => dispatch({ type: "stack", key: e.key, count: Math.min(max, n + 1) })}>+</button>
      </span>
    </div>
  );
}

/** Techniques de contexte (combat, duel en Duel iaijutsu, social à la Cour) : noms, détail par le « i ». */
function RemindersPanel() {
  const { state } = useStore();
  const c = useCharacter();
  const { situation, sub } = state.ui;
  const contexts: ReminderContext[] = situation === "court" ? ["social"] : sub === "duel" ? ["combat", "duel"] : ["combat"];
  const reminders = schoolReminders(c, contexts);
  if (!reminders.length) return null;
  const details = !!state.ui.info.reminders;
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ marginBottom: 6 }}>
        <span className="panel-title"><span className="label">Rappels d'école</span><InfoButton panel="reminders" label="Rappels d'école" /></span>
        <span className="muted" style={{ fontSize: 12 }}>{reminders.length}</span>
      </div>
      <div className="rems">
        {reminders.map((e) => (
          <div key={e.key}>
            <b>{e.technique}</b> <span className="muted">· {e.source}</span>
            {details && <div className="muted">{reminderText(e, c)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function VoidPanel() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { ui } = state;
  const none = c.voidPoints < 1;
  const details = !!ui.info.void;
  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <span className="panel-title"><span className="label">Dépenser du Vide</span><InfoButton panel="void" label="Dépenser du Vide" /></span>
        <button type="button" className="btn sm" onClick={() => dispatch({ type: "newRound" })}>Nouveau round</button>
      </div>
      {ui.voidSpentThisRound && (
        <p className="hint" style={{ color: "var(--bad)", margin: "0 0 8px" }}>Déjà un point de Vide dépensé ce round (limite normale : 1 par round).</p>
      )}
      <div className="stance">
        <button type="button" aria-pressed={ui.opts.voidPoint} disabled={none && !ui.opts.voidPoint} onClick={() => dispatch({ type: "option", patch: { voidPoint: !ui.opts.voidPoint } })}>
          <b>+{voidMultiplier(c)}g{voidMultiplier(c)} au jet</b>{details && <span className="muted">Dépensé au prochain jet lancé.</span>}
        </button>
        <button type="button" aria-pressed={ui.voidArmor} disabled={none && !ui.voidArmor} onClick={() => dispatch({ type: "voidArmor" })}>
          <b>+{10 * voidMultiplier(c)} ND d'armure</b>{details && <span className="muted">Jusqu'au prochain round.</span>}
        </button>
        <button type="button" aria-pressed={ui.opts.voidSkill} disabled={none && !ui.opts.voidSkill} onClick={() => dispatch({ type: "option", patch: { voidSkill: !ui.opts.voidSkill } })}>
          <b>Compétence au rang 1</b>{details && <span className="muted">Jouer une compétence que tu n'as pas.</span>}
        </button>
        <button type="button" disabled={none} onClick={() => dispatch({ type: "voidTechnique" })}>
          <b>Activer une capacité</b>{details && <span className="muted">Technique, kata ou avantage payé en Vide.</span>}
        </button>
      </div>
    </div>
  );
}

function MovePanel() {
  const { state } = useStore();
  const details = !!state.ui.info.move;
  const c = useCharacter();
  const m = movement(c);
  const bonus = movementBonus(c, contextOf(state.ui));
  const tiles = [
    { label: "Action libre", ft: m.free, note: "1 fois par round" },
    { label: "Action simple", ft: m.simple, note: "Eau × 10" },
    { label: "Maximum / round", ft: m.max, note: "Eau × 20" },
  ];
  return (
    <div className="panel movebox">
      <div className="panel-head" style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 17 }}>Se déplacer en combat</h2>
        <span className="panel-title">
          <span className="muted" style={{ fontSize: 13 }}>Anneau d'Eau {rings(c).water}</span>
          <InfoButton panel="move" label="Se déplacer en combat" />
        </span>
      </div>
      <div className="moves">
        {tiles.map((t) => (
          <div key={t.label}>
            <span className="label">{t.label}</span>
            <b className="mono">{t.ft} pi</b>
            {details && <span className="muted">{toMeters(t.ft)} · {t.note}</span>}
          </div>
        ))}
      </div>
      {bonus > 0 && <p className="hint" style={{ margin: "6px 0 0", color: "var(--gold)" }}>+{bonus} pieds par tour (technique d'école), sans dépasser le maximum.</p>}
      {details && <p className="hint" style={{ marginBottom: 0 }}>Terrain difficile (eau, foule, escaliers) : distances divisées par deux. Valeurs 4e à vérifier dans ton livre.</p>}
    </div>
  );
}

/** Un seul « i » par panneau : déplie ou replie toutes ses descriptions (HANDOFF §6.2). */
function InfoButton({ panel, label }: { panel: InfoPanel; label: string }) {
  const { state, dispatch } = useStore();
  const open = !!state.ui.info[panel];
  return (
    <button
      type="button" className={`ib${open ? " on" : ""}`} aria-expanded={open}
      aria-label={`${open ? "Masquer" : "Afficher"} le détail : ${label}`}
      onClick={() => dispatch({ type: "toggleInfo", panel })}
    >i</button>
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
  const p = isRollable(a)
    ? poolFor(c, a, DEFAULT_ROLL_OPTIONS, ui.stance, undefined, { mounted: ui.mounted, centerLastRound: ui.centerLastRound })
    : null;
  const simple = a.attack && isSimpleAttack(c, toPoolAction(a), contextOf(ui));
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
      <span className="p">{p ? poolLabel(p) : ""}</span>
      <span className="d">{simple && <><span className="tag sa">Attaque : Action simple</span>{" "}</>}{a.description}</span>
    </button>
  );
}
