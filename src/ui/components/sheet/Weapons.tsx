import { attackTrait, catalogGap, catalogWeapon, formatDR, isRanged, parseDR, parseWeaponKeywords, weaponKeywords } from "@carnet/core";
import { useLocale, useT } from "../../../i18n";
import { DICE_LETTER } from "../../format";
import { poolLabel } from "../../rolls";
import { useStore } from "../../store";
import { TextListField } from "../fields";
import { poolOf, useSheet } from "./hooks";
import { AddButton, Field, OptionalNumber, RemoveButton } from "./shared";

/** Arme saisie différente du livre (VD, mots-clés) : mise à jour proposée, jamais faite d'office (annexe E.2 C8). */
function CatalogGap({ index }: { index: number }) {
  const { c, set } = useSheet();
  const s = useT().sheet.weapons;
  const keywordLabels = useT().rules.weaponKeywords;
  const { locale } = useLocale();
  const w = c.weapons[index];
  const gap = w && catalogGap(w);
  if (!w || !gap) return null;
  const [own, book] = [parseDR(w.dr), parseDR(gap.dr)];
  const sameKeywords = [...(w.keywords ?? [])].sort().join() === [...gap.keywords].sort().join();
  const parts = [
    own.rolled !== book.rolled || own.kept !== book.kept ? formatDR(gap.dr, DICE_LETTER[locale]) : "",
    sameKeywords ? "" : gap.keywords.map((k) => keywordLabels[k]).join(", "),
  ].filter(Boolean);
  return (
    <div className="suggest" role="group" aria-label={s.gapLabel(w.name)}>
      <span>{s.gap(parts.join(" · "))}</span>
      <button
        type="button" className="btn sm"
        onClick={() => set(["weapons", index], { ...w, dr: gap.dr, keywords: gap.keywords })}
      >{s.update}</button>
    </div>
  );
}

export function Weapons() {
  const { c, edit, set } = useSheet("weapons");
  const s = useT().sheet.weapons;
  const keywordLabels = useT().rules.weaponKeywords;
  const { locale } = useLocale();
  const { state } = useStore();
  if (edit) {
    // Une carte par arme, comme les sorts (annexe J.1) : champs lisibles en entier sur mobile.
    return (
      <>
        {c.weapons.map((w, i) => (
          <div key={i} className="weaponedit" role="group" aria-label={s.weaponLabel(w.name)}>
            <div className="weaponname">
              <Field label={s.name}><input className="in" type="text" value={w.name} maxLength={80} onChange={(e) => set(["weapons", i, "name"], e.target.value)} /></Field>
              <RemoveButton list="weapons" index={i} name={w.name} />
            </div>
            <div className="form-grid">
              <Field label={s.skill}><input className="in" type="text" value={w.skill} maxLength={80} onChange={(e) => set(["weapons", i, "skill"], e.target.value)} /></Field>
              <Field label={s.dr}>
                <input className="in" type="text" placeholder="3g2" value={w.dr} enterKeyHint="next" autoCapitalize="off" onChange={(e) => set(["weapons", i, "dr"], e.target.value)} />
              </Field>
              {isRanged(w) && (
                <Field label={s.bowStrength}>
                  <OptionalNumber value={w.bowStrength} onChange={(n) => set(["weapons", i, "bowStrength"], n)} />
                </Field>
              )}
              <Field label={s.keywords} wide>
                <TextListField
                  value={w.keywords ?? []} parse={parseWeaponKeywords}
                  placeholder={catalogWeapon(w.name)?.keywords.join(", ") ?? s.keywordsPlaceholder}
                  onChange={(v) => set(["weapons", i, "keywords"], v)}
                />
              </Field>
            </div>
            <CatalogGap index={i} />
          </div>
        ))}
        <AddButton list="weapons" label={s.add} item={() => ({ name: "", skill: "Kenjutsu", dr: "3g2", keywords: [] })} />
      </>
    );
  }
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>{s.weapon}</th><th>{s.attack}</th><th>{s.damage}</th></tr></thead>
        <tbody>
          {c.weapons.length ? c.weapons.map((w, i) => {
            const atk = poolOf(c, { kind: "skill", skill: w.skill, trait: attackTrait(w), attack: true, weapon: w });
            const keywords = [...weaponKeywords(c, w)];
            const dmg = poolOf(c, { kind: "damage", weapon: w });
            return (
              <tr key={i}>
                <td>
                  <b>{w.name}</b>
                  <div className="muted" style={{ fontSize: 12.5 }}>{s.summary(w.skill, formatDR(w.dr, DICE_LETTER[locale]), isRanged(w) ? w.bowStrength ?? 0 : undefined)}</div>
                  {keywords.length > 0 && <div>{keywords.map((k) => <span key={k} className="tag">{keywordLabels[k]}</span>)}</div>}
                  {state.mode === "edit" && <CatalogGap index={i} />}
                </td>
                <td className="pool" data-testid={`attack-pool-${w.name}`}>{poolLabel(atk, locale)}</td>
                <td className="pool" data-testid={`damage-pool-${w.name}`}>{poolLabel(dmg, locale)}</td>
              </tr>
            );
          }) : <tr><td colSpan={3} className="muted">{s.empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
