import { ROLL_TRAITS } from "@carnet/core";
import { TRAIT_LABELS } from "../../../rules/l5r4e";
import { RichSelect } from "../RichSelect";
import { ListField, NumberField } from "../fields";
import { pool, useSheet } from "./hooks";
import { AddButton, RemoveButton } from "./shared";

export function Skills() {
  const { c, edit, set } = useSheet("skills");
  if (edit) {
    return (
      <>
        <div className="tbl">
          <table>
            <thead><tr><th>Compétence</th><th>Rang</th><th>Trait</th><th>Spécialisations</th><th /></tr></thead>
            <tbody>
              {c.skills.map((s, i) => (
                <tr key={i}>
                  <td><input className="in" type="text" aria-label="Nom de la compétence" value={s.name} maxLength={80} onChange={(e) => set(["skills", i, "name"], e.target.value)} /></td>
                  <td style={{ width: 70 }}><NumberField aria-label={`Rang de ${s.name}`} min={0} max={10} value={s.rank} onChange={(n) => set(["skills", i, "rank"], n)} /></td>
                  <td style={{ width: 140 }}>
                    <RichSelect variant="champ" aria-label={`Trait de ${s.name}`} value={s.trait} onChange={(v) => set(["skills", i, "trait"], v)}>
                      {ROLL_TRAITS.map((t) => <option key={t} value={t}>{TRAIT_LABELS[t]}</option>)}
                    </RichSelect>
                  </td>
                  <td><ListField aria-label={`Spécialisations de ${s.name}`} placeholder="ex. Fouille, Remarquer" value={s.emphases} onChange={(v) => set(["skills", i, "emphases"], v)} /></td>
                  <td><RemoveButton list="skills" index={i} name={s.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddButton list="skills" label="+ Compétence" item={() => ({ name: "", rank: 1, trait: "agility", emphases: [] })} />
      </>
    );
  }
  const sorted = [...c.skills].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Compétence</th><th>Rang</th><th>Trait</th><th>Jet</th></tr></thead>
        <tbody>
          {sorted.length ? sorted.map((s) => (
            <tr key={s.name}>
              <td>
                <b>{s.name}</b>
                {s.emphases.length > 0 && <div>{s.emphases.map((e) => <span key={e} className="tag">{e}</span>)}</div>}
              </td>
              <td className="mono">{s.rank}</td>
              <td className="muted">{TRAIT_LABELS[s.trait]}</td>
              <td className="pool" data-testid={`skill-pool-${s.name}`}>{pool(c, s.trait, s.name)}</td>
            </tr>
          )) : (
            <tr><td colSpan={4} className="muted">Aucune compétence. « Edit » pour en ajouter.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
