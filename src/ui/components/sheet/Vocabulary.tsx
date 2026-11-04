import { useState } from "react";
import { vocabularyChanges, type Character, type VocabularyChange } from "@carnet/core";
import { useStore } from "../../store";
import { useSheet } from "./hooks";

const VOCABULARY_KIND_LABELS: Record<VocabularyChange["kind"], (c: Character, path: string) => string> = {
  skill: () => "Compétence",
  emphasis: (c, path) => `Spécialisation (${c.skills[Number(/\d+/.exec(path)?.[0])]?.name ?? "?"})`,
  modifier: (c, path) => `Bonus « ${c.modifiers?.[Number(/\d+/.exec(path)?.[0])]?.name ?? "?"} »`,
};

/**
 * Bandeau « Mettre à jour le vocabulaire » (annexe E.7) : aperçu des renommages comme l'import, puis
 * Renommer ou Annuler ; le renommage appliqué reste annulable tant que la fiche est ouverte.
 */
export function VocabularyBanner() {
  const { state } = useStore();
  const { c, dispatch } = useSheet();
  const [preview, setPreview] = useState(false);
  const { hidden, undo } = state.ui.vocabulary;
  const changes = vocabularyChanges(c);

  if (undo?.after === c) {
    return (
      <div className="vocab-head" role="group" aria-label="Vocabulaire">
        <p className="hint" style={{ margin: 0 }}>Vocabulaire mis à jour.</p>
        <span style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "undo" })}>Annuler le renommage</button>
          <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "hide" })}>OK</button>
        </span>
      </div>
    );
  }
  if (!changes.length || hidden) return null;

  const examples = [...new Map(changes.map((x) => [`${x.before}→${x.after}`, x])).values()];
  return (
    <div className="vocab-head" role="group" aria-label="Vocabulaire">
      {preview ? (
        <>
          <div className="import-preview" data-testid="vocabulary-preview">
            <h3>Renommages ({changes.length})</h3>
            <ul>{changes.map((x) => <li key={x.path}>{VOCABULARY_KIND_LABELS[x.kind](c, x.path)} : «&nbsp;{x.before}&nbsp;» →&nbsp;<b>«&nbsp;{x.after}&nbsp;»</b></li>)}</ul>
            <p className="hint">Libellés de l'édition française. Rangs, spécialisations et bonus ne changent pas.</p>
          </div>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setPreview(false)}>Annuler</button>
            <button type="button" className="btn accent" onClick={() => { setPreview(false); dispatch({ type: "vocabulary", op: "update" }); }}>Renommer</button>
          </span>
        </>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>
            Mettre à jour le vocabulaire ({examples.slice(0, 2).map((x) => `${x.before} → ${x.after}`).join(", ")}{examples.length > 2 ? ", …" : ""})
          </p>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "hide" })}>Plus tard</button>
            <button type="button" className="btn" onClick={() => setPreview(true)}>Mettre à jour…</button>
          </span>
        </>
      )}
    </div>
  );
}
