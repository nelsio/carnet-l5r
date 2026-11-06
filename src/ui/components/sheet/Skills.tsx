import { ROLL_TRAITS } from "@carnet/core";
import { useLocale, useT } from "../../../i18n";
import { RichSelect } from "../RichSelect";
import { ListField, NumberField } from "../fields";
import { pool, useSheet } from "./hooks";
import { AddButton, RemoveButton } from "./shared";

export function Skills() {
  const { c, edit, set } = useSheet("skills");
  const s = useT().sheet.skills;
  const traits = useT().rules.traits;
  const { intl, locale } = useLocale();
  if (edit) {
    return (
      <>
        <div className="tbl">
          <table>
            <thead><tr><th>{s.skill}</th><th>{s.rank}</th><th>{s.trait}</th><th>{s.emphases}</th><th /></tr></thead>
            <tbody>
              {c.skills.map((sk, i) => (
                <tr key={i}>
                  <td><input className="in" type="text" aria-label={s.name} value={sk.name} maxLength={80} onChange={(e) => set(["skills", i, "name"], e.target.value)} /></td>
                  <td style={{ width: 70 }}><NumberField aria-label={s.rankOf(sk.name)} min={0} max={10} value={sk.rank} onChange={(n) => set(["skills", i, "rank"], n)} /></td>
                  <td style={{ width: 140 }}>
                    <RichSelect variant="champ" aria-label={s.traitOf(sk.name)} value={sk.trait} onChange={(v) => set(["skills", i, "trait"], v)}>
                      {ROLL_TRAITS.map((t) => <option key={t} value={t}>{traits[t]}</option>)}
                    </RichSelect>
                  </td>
                  <td><ListField aria-label={s.emphasesOf(sk.name)} placeholder={s.emphasesPlaceholder} value={sk.emphases} onChange={(v) => set(["skills", i, "emphases"], v)} /></td>
                  <td><RemoveButton list="skills" index={i} name={sk.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddButton list="skills" label={s.add} item={() => ({ name: "", rank: 1, trait: "agility", emphases: [] })} />
      </>
    );
  }
  const sorted = [...c.skills].sort((a, b) => a.name.localeCompare(b.name, intl));
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>{s.skill}</th><th>{s.rank}</th><th>{s.trait}</th><th>{s.roll}</th></tr></thead>
        <tbody>
          {sorted.length ? sorted.map((sk) => (
            <tr key={sk.name}>
              <td>
                <b>{sk.name}</b>
                {sk.emphases.length > 0 && <div>{sk.emphases.map((e) => <span key={e} className="tag">{e}</span>)}</div>}
              </td>
              <td className="mono">{sk.rank}</td>
              <td className="muted">{traits[sk.trait]}</td>
              <td className="pool" data-testid={`skill-pool-${sk.name}`}>{pool(c, sk.trait, sk.name, locale)}</td>
            </tr>
          )) : (
            <tr><td colSpan={4} className="muted">{s.empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
