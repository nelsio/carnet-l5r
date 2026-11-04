import { useId, useMemo } from "react";
import { parseCharacterFile } from "@carnet/core";
import { useStore, type PendingImport } from "../store";
import { ImportReview, Modal } from "./ImportReview";

/** Fenêtre d'import (HANDOFF §8) : destination, validation, aperçu, puis Appliquer ou Annuler. */
export function ImportDialog({ pending, onClose }: { pending: PendingImport; onClose: () => void }) {
  const titleId = useId();
  const parsed = useMemo(() => parseCharacterFile(pending.text), [pending.text]);
  const { state } = useStore();
  const mergeOnly = !!pending.mergeOnly && !!state.character && state.mode === "edit";

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <h2 id={titleId}>{mergeOnly ? `Fusionner « ${pending.fileName} »` : `Importer « ${pending.fileName} »`}</h2>
      {mergeOnly && <p className="hint">Version du fichier lié, modifiée ailleurs : vérifie les changements avant de les appliquer à ta fiche.</p>}
      <ImportReview parsed={parsed} mergeOnly={mergeOnly} onApplied={pending.onApplied} onClose={onClose} />
    </Modal>
  );
}
