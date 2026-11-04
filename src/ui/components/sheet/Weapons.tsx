import { attackTrait, catalogGap, catalogWeapon, formatDR, isRanged, parseDR, parseWeaponKeywords, weaponKeywords } from "@carnet/core";
import { WEAPON_KEYWORD_LABELS } from "../../../rules/ecoles";
import { poolLabel } from "../../rolls";
import { useStore } from "../../store";
import { TextListField } from "../fields";
import { poolOf, useSheet } from "./hooks";
import { AddButton, Field, OptionalNumber, RemoveButton } from "./shared";

/** Arme saisie différente du livre (VD, mots-clés) : mise à jour proposée, jamais faite d'office (annexe E.2 C8). */
function CatalogGap({ index }: { index: number }) {
  const { c, set } = useSheet();
  const w = c.weapons[index];
  const gap = w && catalogGap(w);
  if (!w || !gap) return null;
  const [own, book] = [parseDR(w.dr), parseDR(gap.dr)];
  const sameKeywords = [...(w.keywords ?? [])].sort().join() === [...gap.keywords].sort().join();
  const parts = [
    own.rolled !== book.rolled || own.kept !== book.kept ? formatDR(gap.dr) : "",
    sameKeywords ? "" : gap.keywords.map((k) => WEAPON_KEYWORD_LABELS[k]).join(", "),
  ].filter(Boolean);
  return (
    <div className="suggest" role="group" aria-label={`Écart avec le livre : ${w.name}`}>
      <span>Le livre indique {parts.join(" · ")} : mettre à jour ?</span>
      <button
        type="button" className="btn sm"
        onClick={() => set(["weapons", index], { ...w, dr: gap.dr, keywords: gap.keywords })}
      >Mettre à jour</button>
    </div>
  );
}

export function Weapons() {
  const { c, edit, set } = useSheet("weapons");
  const { state } = useStore();
  if (edit) {
    // Une carte par arme, comme les sorts (annexe J.1) : champs lisibles en entier sur mobile.
    return (
      <>
        {c.weapons.map((w, i) => (
          <div key={i} className="weaponedit" role="group" aria-label={`Arme : ${w.name || "sans nom"}`}>
            <div className="weaponname">
              <Field label="Nom"><input className="in" type="text" value={w.name} maxLength={80} onChange={(e) => set(["weapons", i, "name"], e.target.value)} /></Field>
              <RemoveButton list="weapons" index={i} name={w.name} />
            </div>
            <div className="form-grid">
              <Field label="Compétence"><input className="in" type="text" value={w.skill} maxLength={80} onChange={(e) => set(["weapons", i, "skill"], e.target.value)} /></Field>
              <Field label="VD">
                <input className="in" type="text" placeholder="3g2" value={w.dr} enterKeyHint="next" autoCapitalize="off" onChange={(e) => set(["weapons", i, "dr"], e.target.value)} />
              </Field>
              {isRanged(w) && (
                <Field label="Force de l'arc">
                  <OptionalNumber value={w.bowStrength} onChange={(n) => set(["weapons", i, "bowStrength"], n)} />
                </Field>
              )}
              <Field label="Mots-clés" wide>
                <TextListField
                  value={w.keywords ?? []} parse={parseWeaponKeywords}
                  placeholder={catalogWeapon(w.name)?.keywords.join(", ") ?? "samourai, lourde…"}
                  onChange={(v) => set(["weapons", i, "keywords"], v)}
                />
              </Field>
            </div>
            <CatalogGap index={i} />
          </div>
        ))}
        <AddButton list="weapons" label="+ Arme" item={() => ({ name: "", skill: "Kenjutsu", dr: "3g2", keywords: [] })} />
      </>
    );
  }
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Arme</th><th>Attaque</th><th>Dégâts</th></tr></thead>
        <tbody>
          {c.weapons.length ? c.weapons.map((w, i) => {
            const atk = poolOf(c, { kind: "skill", skill: w.skill, trait: attackTrait(w), attack: true, weapon: w });
            const keywords = [...weaponKeywords(c, w)];
            const dmg = poolOf(c, { kind: "damage", weapon: w });
            return (
              <tr key={i}>
                <td>
                  <b>{w.name}</b>
                  <div className="muted" style={{ fontSize: 12.5 }}>{w.skill} · VD {formatDR(w.dr)}{isRanged(w) ? ` · arc ${w.bowStrength ?? 0}` : ""}</div>
                  {keywords.length > 0 && <div>{keywords.map((k) => <span key={k} className="tag">{WEAPON_KEYWORD_LABELS[k]}</span>)}</div>}
                  {state.mode === "edit" && <CatalogGap index={i} />}
                </td>
                <td className="pool" data-testid={`attack-pool-${w.name}`}>{poolLabel(atk)}</td>
                <td className="pool" data-testid={`damage-pool-${w.name}`}>{poolLabel(dmg)}</td>
              </tr>
            );
          }) : <tr><td colSpan={3} className="muted">Aucune arme.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
