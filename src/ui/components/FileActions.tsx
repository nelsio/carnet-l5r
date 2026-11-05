import { useRef } from "react";
import { exportFileName, serializeCharacter } from "@carnet/core";
import { useT } from "../../i18n";
import { downloadText } from "../download";
import { useCharacter, useStore } from "../store";

/** Bouton « Importer un JSON » : choix d'un fichier, puis fenêtre d'import. */
export function ImportButton({ label, className = "btn" }: { label?: string; className?: string }) {
  const { startImport } = useStore();
  const t = useT().file;
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>{label ?? t.import}</button>
      <input
        ref={input} type="file" accept=".json,application/json" hidden aria-label={t.importInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) startImport(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Bouton « Depuis une photo… » : fenêtre d'import depuis une fiche papier (lot 42). */
export function PhotoImportButton({ className = "btn" }: { className?: string }) {
  const { startPhotoImport } = useStore();
  const t = useT().file;
  return <button type="button" className={className} onClick={startPhotoImport}>{t.photo}</button>;
}

/** Export et import depuis la fiche (HANDOFF §8). L'export reste possible en consultation. */
export function FileActions() {
  const { state, library } = useStore();
  const t = useT().file;
  const c = useCharacter();
  const readonly = state.mode === "readonly";
  const { file } = library;
  return (
    <div className="panel">
      <h2>{t.title}</h2>
      <div className="file-actions">
        <button type="button" className="btn" onClick={() => downloadText(exportFileName(c), serializeCharacter(c))}>{t.export}</button>
        {!readonly && <ImportButton />}
        {!readonly && <PhotoImportButton />}
        {!readonly && file.supported && file.state === "none" && (
          <button type="button" className="btn" onClick={() => void library.linkFile()}>{t.link}</button>
        )}
      </div>
      {!readonly && file.state !== "none" && (
        <p className="linked">
          <span>{t.linkedBefore}<b>{file.name}</b>{t.linkedAfter}</span>{" "}
          <button type="button" className="btn sm" onClick={() => void library.unlinkFile()}>{t.unlink}</button>
        </p>
      )}
      <p className="hint">
        {t.hint}
        {!readonly && t.hintImport}
        {!readonly && file.supported && file.state === "none" && t.hintLink}
      </p>
    </div>
  );
}
