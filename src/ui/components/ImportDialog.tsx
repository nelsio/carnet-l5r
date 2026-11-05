import { useId, useMemo } from "react";
import { parseCharacterFile } from "@carnet/core";
import { useT } from "../../i18n";
import { useStore, type PendingImport } from "../store";
import { ImportReview, Modal } from "./ImportReview";

/** Fenêtre d'import (HANDOFF §8) : destination, validation, aperçu, puis Appliquer ou Annuler. */
export function ImportDialog({ pending, onClose }: { pending: PendingImport; onClose: () => void }) {
  const titleId = useId();
  const parsed = useMemo(() => parseCharacterFile(pending.text), [pending.text]);
  const { state } = useStore();
  const t = useT().import;
  const mergeOnly = !!pending.mergeOnly && !!state.character && state.mode === "edit";

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <h2 id={titleId}>{mergeOnly ? t.mergeTitle(pending.fileName) : t.title(pending.fileName)}</h2>
      {mergeOnly && <p className="hint">{t.mergeHint}</p>}
      <ImportReview parsed={parsed} mergeOnly={mergeOnly} onApplied={pending.onApplied} onClose={onClose} />
    </Modal>
  );
}
