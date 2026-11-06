import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  importCharacter, mergeCharacter,
  type Change, type Character, type FieldError, type ParsedFile,
} from "@carnet/core";
import { useT, type Messages } from "../../i18n";
import { show } from "../format";
import { useStore } from "../store";

type Destination = "new" | "readonly" | "merge";

function addedLabel(c: Change, t: Messages["import"]): string {
  const m = /^(?<list>\w+)\[(?<name>.*)\]$/.exec(c.path)?.groups;
  const lists: Readonly<Record<string, string | undefined>> = t.lists;
  return m ? t.added(lists[m.list] ?? m.list, m.name) : c.path;
}

function Errors({ errors }: { errors: FieldError[] }) {
  const t = useT().import;
  return (
    <div className="import-errors" role="alert">
      <b>{t.refused}</b>
      <ul>{errors.map((e, i) => <li key={i}>{e.path ? t.fieldError(e.path, e.message) : e.message}</li>)}</ul>
    </div>
  );
}

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]):not([tabindex='-1']), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

/**
 * Cadre des fenêtres (imports, contact) : fond cliquable et Échap pour fermer ; focus piégé dans la fenêtre
 * et rendu à l'élément d'origine à la fermeture (annexe 56.2).
 */
export function Modal({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const box = dialog.current;
    if (box && !box.contains(document.activeElement)) (box.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus();
    return () => opener?.focus();
  }, []);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key !== "Tab" || !dialog.current) return;
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialog} onKeyDown={onKeyDown}>{children}</div>
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
  const tc = useT();
  const t = tc.import;
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
          {!merge.changes.length && <p className="muted">{t.noChange}</p>}
          {updates.length > 0 && (
            <section aria-label={t.changes}>
              <h3>{t.changesCount(updates.length)}</h3>
              <ul>{updates.map((c) => (
                <li key={c.path}><code>{c.path}</code>{tc.common.colon}{show(c.before, t.values)} → <b>{show(c.after, t.values)}</b></li>
              ))}</ul>
            </section>
          )}
          {adds.length > 0 && (
            <section aria-label={t.adds}>
              <h3>{t.addsCount(adds.length)}</h3>
              <ul>{adds.map((c) => <li key={c.path}>{addedLabel(c, t)}</li>)}</ul>
            </section>
          )}
          {merge.warnings.length > 0 && (
            <section aria-label={t.warnings}>
              <h3>{t.warningsCount(merge.warnings.length)}</h3>
              <ul>{merge.warnings.map((w) => <li key={w}>{t.unknownKey}<code>{w}</code></li>)}</ul>
            </section>
          )}
          <p className="hint">{t.nothingRemoved}</p>
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
          <b>{c.name}</b> <span className="muted">{t.summary([c.clan, c.school].filter(Boolean).join(" · ") || "—", c.insightRank)}</span>
          <br />
          <span className="hint">{destination === "readonly" ? t.readonlyHint : t.newHint}</span>
        </p>
      );
    }
  }

  const choices: { id: Destination; label: string }[] = [
    { id: "new", label: t.destinations.new },
    { id: "readonly", label: t.destinations.readonly },
    ...(current ? [{ id: "merge" as const, label: t.mergeInto(current.name) }] : []),
  ];

  return (
    <>
      {parsed?.ok && !mergeOnly && (
        <fieldset className="dest">
          <legend className="label">{t.destination}</legend>
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
        <button type="button" className="btn" onClick={onClose}>{tc.common.cancel}</button>
        {ready && (
          <button type="button" className="btn primary" disabled={busy} onClick={() => ready && void apply(ready)}>
            {destination === "merge" ? t.apply : t.import}
          </button>
        )}
      </div>
    </>
  );
}
