import { useState } from "react";
import { clanAccent, serializeCharacter } from "@carnet/core";
import { EXAMPLES } from "../../rules/example";
import { downloadText } from "../download";
import type { LibraryEntry } from "../../storage";
import { useStore } from "../store";
import { ImportButton } from "./FileActions";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Écran Bibliothèque : les fiches de ce navigateur (HANDOFF §6.1). */
export function Library() {
  const { library } = useStore();
  const { entries } = library;

  if (!entries.length) {
    return (
      <div className="empty panel">
        <h2>Aucun personnage dans ce carnet</h2>
        <p className="muted">Crée ta fiche : Traits, Compétences, armes, techniques. L'aide de jeu calculera tes réserves de dés à partir d'elle.</p>
        <p className="file-actions" style={{ justifyContent: "center" }}>
          <button type="button" className="btn primary" onClick={() => void library.create()}>Créer mon personnage</button>
          <ImportButton />
        </p>
        <p className="hint">Tu as déjà une fiche en JSON ? Importe-la, ou dépose le fichier sur la page.</p>
        <p><ExampleButton /></p>
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Bibliothèque</h2>
        <div className="file-actions">
          <ImportButton />
          <button type="button" className="btn primary" onClick={() => void library.create()}>Nouvelle fiche</button>
        </div>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        Les fiches restent dans ce navigateur. Rien n'est envoyé. Pour importer, tu peux aussi déposer un fichier JSON sur la page.
      </p>
      <p className="hint"><ExampleButton /></p>
      <ul className="library" aria-label="Fiches">
        {entries.map((e) => <EntryRow key={e.id} entry={e} />)}
      </ul>
    </div>
  );
}

function EntryRow({ entry: e }: { entry: LibraryEntry }) {
  const { library } = useStore();
  const [confirm, setConfirm] = useState(false);
  const c = e.character;
  const accent = clanAccent(c.clan);
  const name = c.name || "Sans nom";
  return (
    <li className="entry">
      <span className="dot" aria-hidden="true" style={{ ["--dot-l" as string]: accent.light, ["--dot-d" as string]: accent.dark }} />
      <div className="entry-main">
        <b>{name}</b>
        {e.mode === "readonly" && <span className="badge">Consultation</span>}
        {e.linkedFile && <span className="badge linked-badge" title="Fichier lié">{e.linkedFile.name}</span>}
        <div className="muted">
          {[c.clan, c.school].filter(Boolean).join(" · ") || "—"} · <time dateTime={e.updatedAt}>{dateFormat.format(new Date(e.updatedAt))}</time>
        </div>
      </div>
      <div className="entry-actions">
        {confirm ? (
          <>
            <span className="muted">Supprimer « {name} » ?</span>
            <button type="button" className="btn sm danger" onClick={() => void library.remove(e.id)}>Supprimer définitivement</button>
            <button type="button" className="btn sm" onClick={() => setConfirm(false)}>Annuler</button>
          </>
        ) : (
          <>
            <button type="button" className="btn sm" aria-label={`Ouvrir ${name}`} onClick={() => void library.open(e.id)}>Ouvrir</button>
            <button type="button" className="btn sm" aria-label={`Supprimer ${name}`} onClick={() => setConfirm(true)}>Supprimer</button>
          </>
        )}
      </div>
    </li>
  );
}

/** Modèles de fiche déjà remplis, à modifier puis importer (annexe J.5). */
function ExampleButton() {
  return (
    <span className="file-actions" role="group" aria-label="Modèles de fiche (JSON)">
      <span className="muted">Modèles de fiche (JSON) :</span>
      {EXAMPLES.map((x) => (
        <button key={x.id} type="button" className="btn sm" onClick={() => downloadText(x.fileName, serializeCharacter(x.build()))}>{x.label}</button>
      ))}
    </span>
  );
}
