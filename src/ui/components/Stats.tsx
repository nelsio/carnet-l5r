import {
  attackTrait, computePool, DEFAULT_SAMPLES, defaultModifiers, emphasisMatches, poolStats, schoolOf, woundState,
  type Character, type Pool, type PoolAction,
} from "@carnet/core";
import { TRAIT_LABELS } from "../../rules/l5r4e";
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

function buildRows(c: Character, voidPoint: boolean, emphasis: boolean): Row[] {
  const row = (label: string, action: PoolAction, child = false, emph = false): Row => ({
    label, child, pool: computePool(c, action, { voidPoint, modifiers: defaultModifiers(c, action) }),
    emphasis: emphasis && emph, hasTN: action.kind === "skill" || action.kind === "trait",
  });
  return [
    row("Initiative", { kind: "initiative" }),
    ...c.weapons.flatMap((w) => [
      row(`Attaque · ${w.name}`, { kind: "skill", skill: w.skill, trait: attackTrait(w), attack: true, weapon: w }, false, emphasisMatches(c, w.skill, w.name)),
      row(`Dégâts · ${w.name}`, { kind: "damage", weapon: w }, true),
    ]),
    ...[...c.skills].sort((a, b) => a.name.localeCompare(b.name, "fr")).map((s) =>
      row(`${s.name} (${TRAIT_LABELS[s.trait]})`, { kind: "skill", skill: s.name, trait: s.trait }, false, s.emphases.length > 0)),
  ];
}

/** Tableau des chances de réussite de tous les jets du personnage (HANDOFF §6.2). */
export function Stats() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const opts = state.ui.stats;
  const currentPenalty = woundState(c).penalty ?? 0;
  const penalty = opts.penalty ? currentPenalty : 0;
  const rows = buildRows(c, opts.voidPoint, opts.emphasis);
  const set = (patch: Partial<typeof opts>) => dispatch({ type: "statsOption", patch });

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Statistiques de tes jets</h2>
        <span className="muted" style={{ fontSize: 13 }}>{DEFAULT_SAMPLES.toLocaleString("fr-FR")} lancers simulés par réserve</span>
      </div>
      <div className="statopts">
        <label className="chk"><input type="checkbox" checked={opts.voidPoint} onChange={(e) => set({ voidPoint: e.target.checked })} /> Avec un point de Vide (+1g1)</label>
        <label className="chk"><input type="checkbox" checked={opts.emphasis} onChange={(e) => set({ emphasis: e.target.checked })} /> Spécialisations appliquées</label>
        <label className="chk"><input type="checkbox" checked={opts.penalty} onChange={(e) => set({ penalty: e.target.checked })} /> Pénalité de blessure actuelle (+{currentPenalty})</label>
      </div>
      <div className="tbl">
        <table className="stats">
          <thead>
            <tr><th>Jet</th><th>Réserve</th><th>Min</th><th>Moy.</th><th>Max</th>{TNS.map((t) => <th key={t}>ND {t}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              if (r.pool.rolled < 1) return null;
              const st = poolStats(r.pool, { emphasis: r.emphasis && r.pool.canRaise });
              return (
                <tr key={r.label} className={r.child ? "child" : undefined}>
                  <td className="jl">{r.child ? "└ " : ""}{r.label}</td>
                  <td className="pool">{poolLabel(r.pool)}</td>
                  <td className="mono">{st.min}</td>
                  <td className="mono"><b>{Math.round(st.mean)}</b></td>
                  <td className="mono">{st.max}{st.open ? "+" : ""}{r.pool.explodeOn === 9 && <> <span className="tag" title="Explose sur 9">9+</span></>}</td>
                  {r.hasTN ? TNS.map((t) => {
                    const p = st.chance(t + penalty);
                    return <td key={t} className="pc" style={{ ["--p" as string]: `${Math.round(p * 60)}%` }}>{pct(p)}</td>;
                  }) : <td className="muted" style={{ textAlign: "center" }} colSpan={TNS.length}>sans ND</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hint">
        {schoolOf(c) && "Techniques automatiques de ton école incluses (posture de référence : Attaque). "}
        Chances de réussite sans augmentation. Chaque augmentation annoncée ajoute +5 au ND : décale-toi d'une colonne vers la droite.
        Un maximum suivi de « + » peut être dépassé grâce aux explosions.
      </p>
    </div>
  );
}
