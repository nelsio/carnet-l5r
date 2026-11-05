import { useT } from "../../i18n";
import { useStore } from "../store";

/** Bandeaux du fichier lié : reprise de la permission, conflit, erreur (HANDOFF §5.2). */
export function LinkBanner() {
  const { state, library } = useStore();
  const t = useT().file;
  const { file } = library;
  if (state.mode !== "edit") return null;

  switch (file.state) {
    case "permission":
      return (
        <div className="link-banner" role="status">
          <span>
            {file.message ?? <>{t.permissionBefore}<b>{file.name}</b>{t.permissionAfter}</>}
          </span>
          <button type="button" className="btn sm primary" onClick={() => void library.resumeFile()}>
            {t.resume(file.name)}
          </button>
        </div>
      );
    case "conflict":
      return (
        <div className="link-banner conflict" role="alert">
          <span><b>{t.conflict}</b>{t.conflictDetail(file.name)}</span>
          <span className="link-actions">
            <button type="button" className="btn sm" onClick={() => void library.loadFileVersion()}>{t.loadVersion}</button>
            <button type="button" className="btn sm" onClick={() => void library.overwriteFile()}>{t.overwrite}</button>
            <button type="button" className="btn sm primary" onClick={() => void library.mergeFileVersion()}>{t.merge}</button>
          </span>
        </div>
      );
    case "error":
      return (
        <div className="link-banner conflict" role="alert">
          <span><b>{t.error(file.name)}</b>{t.errorDetail(file.message)}</span>
          <span className="link-actions">
            <button type="button" className="btn sm" onClick={() => void library.resumeFile()}>{t.retry}</button>
            <button type="button" className="btn sm" onClick={() => void library.unlinkFile()}>{t.unlink}</button>
          </span>
        </div>
      );
    default:
      return null;
  }
}
