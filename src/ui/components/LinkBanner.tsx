import { useStore } from "../store";

/** Bandeaux du fichier lié : reprise de la permission, conflit, erreur (HANDOFF §5.2). */
export function LinkBanner() {
  const { state, library } = useStore();
  const { file } = library;
  if (state.mode !== "edit") return null;

  switch (file.state) {
    case "permission":
      return (
        <div className="link-banner" role="status">
          <span>
            {file.message ?? <>La fiche est enregistrée dans ce navigateur. Pour continuer à écrire dans <b>{file.name}</b>, le navigateur demande ton accord.</>}
          </span>
          <button type="button" className="btn sm primary" onClick={() => void library.resumeFile()}>
            Reprendre l'enregistrement dans {file.name}
          </button>
        </div>
      );
    case "conflict":
      return (
        <div className="link-banner conflict" role="alert">
          <span><b>Le fichier a été modifié ailleurs</b> ({file.name}). Ta version reste enregistrée dans ce navigateur.</span>
          <span className="link-actions">
            <button type="button" className="btn sm" onClick={() => void library.loadFileVersion()}>Charger la version du fichier</button>
            <button type="button" className="btn sm" onClick={() => void library.overwriteFile()}>Écraser avec ma version</button>
            <button type="button" className="btn sm primary" onClick={() => void library.mergeFileVersion()}>Fusionner</button>
          </span>
        </div>
      );
    case "error":
      return (
        <div className="link-banner conflict" role="alert">
          <span><b>Écriture impossible dans {file.name}</b>{file.message ? ` : ${file.message}` : ""}. La fiche reste enregistrée dans ce navigateur.</span>
          <span className="link-actions">
            <button type="button" className="btn sm" onClick={() => void library.resumeFile()}>Réessayer</button>
            <button type="button" className="btn sm" onClick={() => void library.unlinkFile()}>Délier</button>
          </span>
        </div>
      );
    default:
      return null;
  }
}
