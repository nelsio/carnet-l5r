import { useState } from "react";
import { vocabularyChanges, type Character, type VocabularyChange } from "@carnet/core";
import { useT, type Messages } from "../../../i18n";
import { useStore } from "../../store";
import { useSheet } from "./hooks";

/** Ce que touche un renommage : compétence, spécialisation (de quelle compétence), bonus. */
function kindLabel(v: Messages["sheet"]["vocabulary"], c: Character, x: VocabularyChange): string {
  const index = Number(/\d+/.exec(x.path)?.[0]);
  if (x.kind === "skill") return v.skill;
  if (x.kind === "emphasis") return v.emphasis(c.skills[index]?.name ?? "?");
  return v.modifier(c.modifiers?.[index]?.name ?? "?");
}

/**
 * Bandeau « Mettre à jour le vocabulaire » (annexe E.7) : aperçu des renommages comme l'import, puis
 * Renommer ou Annuler ; le renommage appliqué reste annulable tant que la fiche est ouverte.
 */
export function VocabularyBanner() {
  const { state } = useStore();
  const t = useT();
  const v = t.sheet.vocabulary;
  const { c, dispatch } = useSheet();
  const [preview, setPreview] = useState(false);
  const { hidden, undo } = state.ui.vocabulary;
  const changes = vocabularyChanges(c);

  if (undo?.after === c) {
    return (
      <div className="vocab-head" role="group" aria-label={v.label}>
        <p className="hint" style={{ margin: 0 }}>{v.updated}</p>
        <span style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "undo" })}>{v.undo}</button>
          <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "hide" })}>{t.common.ok}</button>
        </span>
      </div>
    );
  }
  if (!changes.length || hidden) return null;

  const examples = [...new Map(changes.map((x) => [`${x.before}→${x.after}`, x])).values()];
  return (
    <div className="vocab-head" role="group" aria-label={v.label}>
      {preview ? (
        <>
          <div className="import-preview" data-testid="vocabulary-preview">
            <h3>{v.renames(changes.length)}</h3>
            <ul>{changes.map((x) => <li key={x.path}>{v.renameFrom(kindLabel(v, c, x), x.before)}<b>{v.quote(x.after)}</b></li>)}</ul>
            <p className="hint">{v.previewHint}</p>
          </div>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setPreview(false)}>{t.common.cancel}</button>
            <button type="button" className="btn accent" onClick={() => { setPreview(false); dispatch({ type: "vocabulary", op: "update" }); }}>{v.rename}</button>
          </span>
        </>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>
            {v.banner(examples.slice(0, 2).map((x) => `${x.before} → ${x.after}`).join(", "), examples.length > 2)}
          </p>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "hide" })}>{v.later}</button>
            <button type="button" className="btn" onClick={() => setPreview(true)}>{v.update}</button>
          </span>
        </>
      )}
    </div>
  );
}
