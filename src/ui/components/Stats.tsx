import {
  attackTrait, computePool, DEFAULT_SAMPLES, defaultModifiers, defaultSpellElement, emphasisMatches, poolStats, schoolOf, sortSpells, woundState,
  type Character, type Pool, type PoolAction,
} from "@carnet/core";
import { useLocale, useT, type Messages } from "../../i18n";
import { ELEMENT_LABELS, shownWoundMultiplier, TRAIT_LABELS } from "../../rules/l5r4e";
import { pct } from "../format";
import { poolLabel } from "../rolls";
import { useCharacter, useStore } from "../store";

const TNS = [10, 15, 20, 25, 30, 40];

interface Row {
  label: string;
  child: boolean;
  pool: Pool;
  emphasis: boolean;
  /** Jet avec ND (compétences, attaques) ; sinon « sans ND ». */
  hasTN: boolean;
}

function buildRows(c: Character, voidPoint: boolean, emphasis: boolean, t: Messages["stats"], intl: string): Row[] {
  const row = (label: string, action: PoolAction, child = false, emph = false): Row => ({
    label, child, pool: computePool(c, action, { voidPoint, modifiers: defaultModifiers(c, action) }),
    emphasis: emphasis && emph, hasTN: action.kind === "skill" || action.kind === "trait" || action.kind === "spell",
  });
  return [
    row(t.initiative, { kind: "initiative" }),
    ...c.weapons.flatMap((w) => [
      row(t.attack(w.name), { kind: "skill", skill: w.skill, trait: attackTrait(w), attack: true, weapon: w }, false, emphasisMatches(c, w.skill, w.name)),
      row(t.damage(w.name), { kind: "damage", weapon: w }, true),
    ]),
    ...[...c.skills].sort((a, b) => a.name.localeCompare(b.name, intl)).map((s) =>
      row(t.skill(s.name, TRAIT_LABELS[s.trait]), { kind: "skill", skill: s.name, trait: s.trait }, false, s.emphases.length > 0)),
    // Une ligne par sort du Rouleaux & invocations (annexe F.5), élément de lancement par défaut.
    ...sortSpells(c.spells ?? []).flatMap((spell) => [
      row(t.spell(spell.name, ELEMENT_LABELS[defaultSpellElement(c, spell)]), { kind: "spell", spell }),
      ...(spell.damage?.trim() ? [row(t.damage(spell.name), { kind: "spellDamage", spell }, true)] : []),
    ]),
  ];
}

/** Tableau des chances de réussite de tous les jets du personnage (HANDOFF §6.2). */
export function Stats() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const { stats: ts, roller: r } = useT();
  const { intl, locale } = useLocale();
  const opts = state.ui.stats;
  const currentPenalty = woundState(c, { woundMultiplier: shownWoundMultiplier(state.ui.woundMultiplier) }).penalty ?? 0;
  const penalty = opts.penalty ? currentPenalty : 0;
  const rows = buildRows(c, opts.voidPoint, opts.emphasis, ts, intl);
  const set = (patch: Partial<typeof opts>) => dispatch({ type: "statsOption", patch });

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{ts.title}</h2>
        <span className="muted" style={{ fontSize: 13 }}>{ts.samples(DEFAULT_SAMPLES.toLocaleString(intl))}</span>
      </div>
      <div className="statopts">
        <label className="chk"><input type="checkbox" checked={opts.voidPoint} onChange={(e) => set({ voidPoint: e.target.checked })} /> {ts.voidPoint}</label>
        <label className="chk"><input type="checkbox" checked={opts.emphasis} onChange={(e) => set({ emphasis: e.target.checked })} /> {ts.emphasis}</label>
        <label className="chk"><input type="checkbox" checked={opts.penalty} onChange={(e) => set({ penalty: e.target.checked })} /> {ts.penalty(currentPenalty)}</label>
      </div>
      <div className="tbl">
        <table className="stats">
          <thead>
            <tr><th>{ts.roll}</th><th>{ts.pool}</th><th>{r.min}</th><th>{r.mean}</th><th>{r.max}</th>{TNS.map((tn) => <th key={tn}>{ts.tn(tn)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              if (row.pool.rolled < 1) return null;
              const st = poolStats(row.pool, { emphasis: row.emphasis && row.pool.canRaise });
              return (
                <tr key={row.label} className={row.child ? "child" : undefined}>
                  <td className="jl">{row.child ? "└ " : ""}{row.label}</td>
                  <td className="pool">{poolLabel(row.pool, locale)}</td>
                  <td className="mono">{st.min}</td>
                  <td className="mono"><b>{Math.round(st.mean)}</b></td>
                  <td className="mono">{st.max}{st.open ? "+" : ""}{row.pool.explodeOn === 9 && <> <span className="tag" title={r.explodesOn9}>9+</span></>}</td>
                  {row.hasTN ? TNS.map((tn) => {
                    const p = st.chance(tn + penalty);
                    return <td key={tn} className="pc" style={{ ["--p" as string]: `${Math.round(p * 60)}%` }}>{pct(p, locale)}</td>;
                  }) : <td className="muted" style={{ textAlign: "center" }} colSpan={TNS.length}>{ts.noTn}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">
        {schoolOf(c) && ts.schoolIncluded}
        {ts.hint}
      </p>
    </div>
  );
}
