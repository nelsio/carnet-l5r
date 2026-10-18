import { useRef } from "react";
import { exportFileName, serializeCharacter } from "@carnet/core";
import { downloadText } from "../download";
import { useCharacter, useStore } from "../store";

/** Bouton « Importer un JSON » : choix d'un fichier, puis fenêtre d'import. */
export function ImportButton({ label = "Importer un JSON…" }: { label?: string }) {
  const { startImport } = useStore();
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className="btn" onClick={() => input.current?.click()}>{label}</button>
      <input
        ref={input} type="file" accept=".json,application/json" hidden aria-label="Fichier JSON à importer"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) startImport(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

/** Export et import depuis la fiche (HANDOFF §8). L'export reste possible en consultation. */
export function FileActions() {
  const { state, library } = useStore();
  const c = useCharacter();
  const readonly = state.mode === "readonly";
  const { file } = library;
  return (
    <div className="panel">
      <h2>Fichier</h2>
      <div className="file-actions">
        <button type="button" className="btn" onClick={() => downloadText(exportFileName(c), serializeCharacter(c))}>Exporter la fiche</button>
        {!readonly && <ImportButton label="Importer un JSON…" />}
        {!readonly && file.supported && file.state === "none" && (
          <button type="button" className="btn" onClick={() => void library.linkFile()}>Lier à un fichier…</button>
        )}
      </div>
      {!readonly && file.state !== "none" && (
        <p className="linked">
          <span>Lié à <b>{file.name}</b> : chaque modification y est enregistrée.</span>{" "}
          <button type="button" className="btn sm" onClick={() => void library.unlinkFile()}>Délier</button>
        </p>
      )}
      <p className="hint">
        L'export télécharge un fichier JSON à ranger où tu veux (le dossier Drive de la campagne, par exemple).
        {!readonly && " L'import peut aussi fusionner un fichier dans cette fiche, avec un aperçu avant d'appliquer. Tu peux aussi déposer un fichier sur la page."}
        {!readonly && file.supported && file.state === "none" && " Lier à un fichier enregistre chaque modification dans ce fichier : pratique avec un dossier Drive synchronisé sur ton ordinateur."}
      </p>
    </div>
  );
}
