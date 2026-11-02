import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  importCharacter, mergeCharacter,
  type Change, type Character, type FieldError, type ParsedFile,
} from "@carnet/core";
import { show } from "../format";
import { useStore } from "../store";

type Destination = "new" | "readonly" | "merge";

const LIST_LABELS: Record<string, string> = {
  skills: "Compétence", weapons: "Arme", techniques: "Technique", maneuvers: "Manœuvre", spells: "Sort",
};

function addedLabel(c: Change): string {
  const m = /^(?<list>\w+)\[(?<name>.*)\]$/.exec(c.path)?.groups;
  return m ? `${LIST_LABELS[m.list] ?? m.list} : ${m.name}` : c.path;
}

function Errors({ errors }: { errors: FieldError[] }) {
  return (
    <div className="import-errors" role="alert">
      <b>Import refusé : rien n'a été modifié.</b>
      <ul>{errors.map((e, i) => <li key={i}>{e.path ? `${e.path} : ${e.message}` : e.message}</li>)}</ul>
    </div>
  );
}

/** Cadre des fenêtres d'import : fond cliquable et Échap pour fermer. */
export function Modal({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>{children}</div>
    </div>
  );
}

/**
 * Suite commune des imports (HANDOFF §8) : destination, validation, aperçu, puis Appliquer ou Annuler.
 * `parsed` absent : rien à importer encore, seul « Annuler » est proposé. `notice` s'affiche au-dessus de l'aperçu.
 */
export function ImportReview({ parsed, mergeOnly: mergeOnlyAsked, notice, onApplied, onClose }: {
  parsed: ParsedFile | null; mergeOnly?: boolean; notice?: ReactNode; onApplied?: () => void; onClose: () => void;
}) {
  const { state, dispatch, library } = useStore();
  const current = state.character && state.mode === "edit" ? state.character : null;
  const [destination, setDestination] = useState<Destination>(current ? "merge" : "new");
  const mergeOnly = !!mergeOnlyAsked && !!current;
  const [busy, setBusy] = useState(false);

  const full = useMemo(() => (parsed?.ok ? importCharacter(parsed.json) : null), [parsed]);
  const merge = useMemo(() => (parsed?.ok && current ? mergeCharacter(current, parsed.json) : null), [parsed, current]);

  const apply = async (character: Character) => {
    setBusy(true);
    if (destination === "merge") {
      dispatch({ type: "replaceCharacter", character });
      onApplied?.();
    } else {
      await library.importEntry(character, destination === "readonly" ? "readonly" : "edit");
    }
    onClose();
  };

  let body;
  let ready: Character | null = null;
  if (!parsed) {
    body = null;
  } else if (!parsed.ok) {
    body = <Errors errors={parsed.errors} />;
  } else if (destination === "merge" && merge) {
    if (!merge.ok) {
      body = <Errors errors={merge.errors} />;
    } else {
      ready = merge.character;
      const updates = merge.changes.filter((c) => c.kind === "update");
      const adds = merge.changes.filter((c) => c.kind === "add");
      body = (
        <div className="import-preview">
          {!merge.changes.length && <p className="muted">Aucun changement : la fiche est déjà à jour.</p>}
          {updates.length > 0 && (
            <section aria-label="Modifications">
              <h3>Modifications ({updates.length})</h3>
              <ul>{updates.map((c) => <li key={c.path}><code>{c.path}</code> : {show(c.before)} → <b>{show(c.after)}</b></li>)}</ul>
            </section>
          )}
          {adds.length > 0 && (
            <section aria-label="Ajouts">
              <h3>Ajouts ({adds.length})</h3>
              <ul>{adds.map((c) => <li key={c.path}>{addedLabel(c)}</li>)}</ul>
            </section>
          )}
          {merge.warnings.length > 0 && (
            <section aria-label="Avertissements">
              <h3>Avertissements ({merge.warnings.length})</h3>
              <ul>{merge.warnings.map((w) => <li key={w}>Clé inconnue ignorée : <code>{w}</code></li>)}</ul>
            </section>
          )}
          <p className="hint">Rien n'est supprimé : les éléments absents du fichier restent dans la fiche.</p>
        </div>
      );
    }
  } else if (full) {
    if (!full.ok) {
      body = <Errors errors={full.errors} />;
    } else {
      ready = full.character;
      const c = full.character;
      body = (
        <p>
          <b>{c.name}</b> <span className="muted">· {[c.clan, c.school].filter(Boolean).join(" · ") || "—"} · Rang {c.insightRank}</span>
          <br />
          <span className="hint">
            {destination === "readonly"
              ? "La fiche sera ajoutée à ta bibliothèque en consultation : lecture seule, rien ne pourra y être modifié."
              : "La fiche sera ajoutée à ta bibliothèque comme une nouvelle fiche modifiable."}
          </span>
        </p>
      );
    }
  }

  const choices: { id: Destination; label: string }[] = [
    { id: "new", label: "Nouvelle fiche" },
    { id: "readonly", label: "Consultation (MJ)" },
    ...(current ? [{ id: "merge" as const, label: `Fusionner dans « ${current.name} »` }] : []),
  ];

  return (
    <>
      {parsed?.ok && !mergeOnly && (
        <fieldset className="dest">
          <legend className="label">Destination</legend>
          {choices.map((ch) => (
            <label key={ch.id} className="chk">
              <input type="radio" name="destination" value={ch.id} checked={destination === ch.id} onChange={() => setDestination(ch.id)} />
              {" "}{ch.label}
            </label>
          ))}
        </fieldset>
      )}
      {parsed?.ok && notice}
      {body}
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>Annuler</button>
        {ready && (
          <button type="button" className="btn primary" disabled={busy} onClick={() => ready && void apply(ready)}>
            {destination === "merge" ? "Appliquer" : "Importer"}
          </button>
        )}
      </div>
    </>
  );
}
