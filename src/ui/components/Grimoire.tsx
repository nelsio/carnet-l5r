import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { normalize, sameSpell, searchGrimoire, spellTn, type GrimoireDiff, type GrimoireFillField, type GrimoireSpell, type Spell, type SpellElement } from "@carnet/core";
import { useLocale, useT, type Messages } from "../../i18n";
import { ELEMENT_LABELS } from "../../rules/l5r4e";
import { GRIMOIRE_FILES, PORTAL_NAME_OF } from "../../rules/portal";
import { useStore } from "../store";

/** Filtres d'élément du panneau : tous, universels, puis les cinq Anneaux. */
const elementChips = (t: Messages["grimoire"]): readonly [SpellElement | "all-elements", string][] => [
  ["all-elements", t.allElements], ["all", t.universals],
  ...(["air", "earth", "fire", "water", "void"] as const).map((e): [SpellElement, string] => [e, ELEMENT_LABELS[e]]),
];

const elementLabel = (e: SpellElement, t: Messages["grimoire"]) => (e === "all" ? t.universal : ELEMENT_LABELS[e]);
const ringColor = (e: SpellElement) => ({ ["--rc" as string]: `var(--ring-${e})` });

/** Icône de rouleau du bouton « Ajouter depuis le grimoire ». */
export function ScrollIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h11a2 2 0 0 1 0 4H7M7 4a2 2 0 0 0 0 4v10a2 2 0 0 0 2 2h9V8M11 12h4M11 15.5h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ligne d'un sort du grimoire : barre de couleur, nom français et anglais, élément · maîtrise · ND · mots-clés. */
export function GrimoireRow({ g }: { g: GrimoireSpell }) {
  const t = useT().grimoire;
  const meta = [elementLabel(g.element, t), t.mastery(g.mastery), t.tn(spellTn(g.mastery)), ...(g.keywords.length ? [g.keywords.join(", ")] : [])];
  return (
    <>
      <span className="bar" aria-hidden="true" />
      <span className="gr-txt">
        <span className="n">{g.name}{g.nameAlt && <> <small>{g.nameAlt}</small></>}</span>
        <span className="m">{meta.join(" · ")}</span>
      </span>
    </>
  );
}

/** État du grimoire, à droite de la barre d'outils du bloc (annexe N.5). */
export function GrimoireStatus() {
  const { grimoire } = useStore();
  const { status, cache, refreshFailed, load } = grimoire;
  const t = useT().grimoire;
  const { intl } = useLocale();
  const action = (label: string) => <button type="button" className="linkbtn" onClick={() => void load()}>{label}</button>;
  let tone = "";
  let body;
  if (status === "loading") {
    body = <><span className="spin" aria-hidden="true" />{t.loading}</>;
  } else if (status === "error") {
    tone = "err";
    body = <>{t.unreachable}{action(t.retry)}</>;
  } else if (status === "ready" && cache) {
    const date = new Date(cache.fetchedAt).toLocaleDateString(intl);
    if (refreshFailed) {
      tone = "warn";
      body = <>{t.refreshFailed(date)}{action(t.retry)}</>;
    } else if (cache.files < GRIMOIRE_FILES.length) {
      tone = "warn";
      body = <>{t.incomplete(cache.files, GRIMOIRE_FILES.length)}{action(t.refresh)}</>;
    } else {
      tone = "ok";
      body = <>{t.ready(date, t.spells(cache.spells.length))}{action(t.refresh)}</>;
    }
  } else {
    body = <>{t.notLoaded}</>;
  }
  return (
    <span className={`gstate ${tone}`} role="status" data-testid="grimoire-status">
      {status !== "loading" && <span className="dot" aria-hidden="true" />}
      <span>{body}</span>
    </span>
  );
}

/** Loupe décorative du champ Nom quand l'autocomplétion est active. */
function SearchIcon() {
  return (
    <svg className="ac-ico" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const SUGGESTIONS = 8;

interface NameFieldProps {
  /** Identifiant du sort : ids du champ et de la liste. */
  spellId: string;
  value: string;
  onChange(name: string): void;
  /** Suggestion choisie (Entrée ou clic). */
  onPick(g: GrimoireSpell): void;
}

/**
 * Champ Nom d'un sort en édition (annexe N.8) : combobox d'autocomplétion quand le grimoire est prêt,
 * sinon champ libre et ligne « charger le grimoire ». La saisie libre reste toujours possible.
 */
export function SpellNameField({ spellId, value, onChange, onPick }: NameFieldProps) {
  const { grimoire } = useStore();
  const { status, cache } = grimoire;
  const t = useT().grimoire;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ready = status === "ready" && cache ? cache : undefined;
  const results = useMemo(
    () => (ready && normalize(value).length >= 2 ? searchGrimoire(ready.spells, value, "all-elements", SUGGESTIONS) : []),
    [ready, value],
  );
  const expanded = open && results.length > 0;
  const current = Math.min(active, Math.max(0, results.length - 1));
  const listId = `sugg-${spellId}`;
  const optId = (i: number) => `${listId}-opt-${i}`;

  const pick = (g: GrimoireSpell | undefined) => {
    if (!g) return;
    setOpen(false);
    onPick(g);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!ready) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!results.length) return;
      e.preventDefault();
      if (!expanded) {
        setOpen(true);
        return;
      }
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive(Math.min(Math.max(0, current + step), results.length - 1));
    } else if (e.key === "Enter" && expanded) {
      e.preventDefault();
      pick(results[current]);
    } else if (e.key === "Escape" && expanded) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="field ac">
      <label className="field" htmlFor={`spell-name-${spellId}`}>
        <span className="label">{t.name}</span>
        <span className={ready ? "combo" : undefined}>
          <input
            id={`spell-name-${spellId}`} className="in" type="text" value={value} maxLength={120} autoComplete="off"
            {...(ready ? {
              role: "combobox", "aria-autocomplete": "list" as const, "aria-expanded": expanded, "aria-controls": listId,
              "aria-activedescendant": expanded ? optId(current) : undefined, placeholder: t.namePlaceholder,
            } : {})}
            onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
            onKeyDown={onKeyDown} onBlur={() => setOpen(false)}
          />
          {ready && <SearchIcon />}
        </span>
      </label>
      {ready && (
        <div className="sugg" hidden={!expanded}>
          <ul id={listId} role="listbox" aria-label={t.list}>
            {results.map((g, i) => (
              <li
                key={g.gid} id={optId(i)} role="option" className="gres" style={ringColor(g.element)} aria-selected={i === current}
                onMouseDown={(e) => e.preventDefault()} onClick={() => pick(g)}
              ><GrimoireRow g={g} /></li>
            ))}
          </ul>
          <p className="foot">{t.suggestionsFoot}</p>
        </div>
      )}
    </div>
  );
}

/** Sous la ligne Nom / Élément / Maîtrise tant que le grimoire n'est pas prêt : le charger sans ouvrir le panneau (annexe N.8). */
export function GrimoireNameHint() {
  const { grimoire } = useStore();
  const { status, cache, load } = grimoire;
  const t = useT().grimoire;
  if (status === "ready" && cache) return null;
  return (
    <p className="ac-hint" data-testid="grimoire-name-hint">
      {status === "loading"
        ? t.hintLoading
        : <>{t.hint}<button type="button" className="linkbtn" onClick={() => void load()}>{status === "error" ? t.hintRetry : t.hintLoad}</button></>}
    </p>
  );
}

interface ConfirmProps {
  g: GrimoireSpell;
  diffs: readonly GrimoireDiff[];
  onChoose(choice: "all" | "empty" | "cancel"): void;
}

/** Confirmation intégrée en haut du sort quand le grimoire remplacerait des valeurs saisies (annexe N.8). */
export function GrimoireConfirm({ g, diffs, onChoose }: ConfirmProps) {
  const tc = useT();
  const t = tc.grimoire;
  const fields: Readonly<Record<GrimoireFillField, string>> = t.fields;
  const replace = useRef<HTMLButtonElement>(null);
  useEffect(() => replace.current?.focus(), []);
  return (
    <div
      className="gconfirm" role="alertdialog" aria-label={t.confirm} aria-describedby={`gconfirm-${g.gid}`}
      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onChoose("cancel"); } }}
    >
      <p id={`gconfirm-${g.gid}`}><b>{t.confirmName(g.name)}</b>{t.confirmText}</p>
      <ul className="diff">
        {diffs.map((d) => <li key={d.field}>{t.diff(fields[d.field], d.from, d.to)}</li>)}
      </ul>
      <div className="row">
        <button ref={replace} type="button" className="btn sm accent" onClick={() => onChoose("all")}>{t.replace}</button>
        <button type="button" className="btn sm" onClick={() => onChoose("empty")}>{t.fillEmpty}</button>
        <button type="button" className="btn sm" onClick={() => onChoose("cancel")}>{tc.common.cancel}</button>
      </div>
    </div>
  );
}

interface PanelProps {
  spells: readonly Spell[];
  /** Ajoute le sort en fin de liste. */
  onAdd(g: GrimoireSpell): void;
  /** Ferme le panneau ; `restoreFocus` rend le focus au bouton. */
  onClose(restoreFocus: boolean): void;
}

/**
 * Panneau « Ajouter depuis le grimoire » (annexe N.5) : sous la barre d'outils sur bureau,
 * panneau glissant depuis le bas sur mobile (voile, poignée, × et Échap).
 */
export function GrimoirePanel({ spells, onAdd, onClose }: PanelProps) {
  const { grimoire } = useStore();
  const { status, cache, load } = grimoire;
  const tc = useT();
  const t = tc.grimoire;
  const [query, setQuery] = useState("");
  const [element, setElement] = useState<SpellElement | "all-elements">("all-elements");
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const loadButton = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => searchGrimoire(cache?.spells ?? [], query, element), [cache, query, element]);
  const current = Math.min(active, Math.max(0, results.length - 1));
  const noted = (g: GrimoireSpell) => spells.some((s) => sameSpell(s, g));

  // Focus : champ de recherche à l'ouverture et après le chargement ; sinon le bouton « Charger ».
  useEffect(() => {
    if (status === "ready") input.current?.focus();
    else if (status === "none") loadButton.current?.focus();
  }, [status]);

  useEffect(() => {
    document.body.classList.add("menu-open");
    return () => document.body.classList.remove("menu-open");
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(`#grimoire-opt-${current}`)?.scrollIntoView?.({ block: "nearest" });
  }, [current]);

  const add = (g: GrimoireSpell | undefined) => {
    if (!g || noted(g)) return;
    onAdd(g);
    setAdded(g.name);
    input.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(true);
    } else if (e.target === input.current && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive(Math.min(Math.max(0, current + step), Math.max(0, results.length - 1)));
    } else if (e.target === input.current && e.key === "Enter") {
      e.preventDefault();
      add(results[current]);
    }
  };

  let content;
  if (status === "ready" && cache) {
    content = (
      <div className="gsearch">
        <label htmlFor="grimoire-q">{t.search}</label>
        <input
          ref={input} id="grimoire-q" className="in" type="search" autoComplete="off" placeholder={t.searchPlaceholder}
          role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="grimoire-list"
          aria-activedescendant={results.length ? `grimoire-opt-${current}` : undefined}
          value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        />
        <div className="gchips" role="group" aria-label={t.element}>
          {elementChips(t).map(([key, label]) => (
            <button
              key={key} type="button" className="gchip" aria-pressed={element === key}
              style={key === "all-elements" ? undefined : ringColor(key)}
              onClick={() => { setElement(key); setActive(0); }}
            >{key !== "all-elements" && <i aria-hidden="true" />}{label}</button>
          ))}
        </div>
        <div className="gcount" aria-live="polite">
          {t.spells(results.length)}{added && <>{t.added}<b>{added}</b></>}
        </div>
        <ul ref={listRef} id="grimoire-list" className="gresults" role="listbox" aria-label={t.list}>
          {results.map((g, i) => {
            const have = noted(g);
            return (
              <li
                key={g.gid} id={`grimoire-opt-${i}`} role="option" className="gres" style={ringColor(g.element)}
                aria-selected={i === current} aria-disabled={have || undefined}
                onMouseDown={(e) => e.preventDefault()} onClick={() => add(g)}
              >
                <GrimoireRow g={g} />
                {have ? <span className="have">{t.noted}</span> : <span className="add">{t.add}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else if (status === "loading") {
    content = <p className="gload"><span className="spin" aria-hidden="true" />{t.loading}</p>;
  } else if (status === "error") {
    content = (
      <div className="gnote" role="alert">
        <span className="k" aria-hidden="true">待</span>
        <div>
          <b>{t.errorTitle}</b>{t.errorText}
          <div><button type="button" className="btn sm" onClick={() => void load()}>{t.retry}</button></div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="ggate">
        <p>{t.gateBefore}<b>{t.gateName(PORTAL_NAME_OF)}</b>{t.gateAfter}</p>
        <button ref={loadButton} type="button" className="btn accent" onClick={() => void load()}>{t.load}</button>
        <span className="fine">{t.gateFine}</span>
      </div>
    );
  }

  return (
    <>
      <div className="g-scrim" data-testid="grimoire-scrim" onClick={() => onClose(false)} />
      <section id="grimoire-panel" className="gpanel" aria-label={tc.sheet.spells.addFromGrimoire} onKeyDown={onKeyDown}>
        <span className="grip" aria-hidden="true" />
        <div className="gp-h">
          <h3><span className="kj" aria-hidden="true">巻</span>{tc.sheet.spells.addFromGrimoire}</h3>
          <button type="button" className="gp-x" aria-label={tc.common.close} onClick={() => onClose(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        {content}
      </section>
    </>
  );
}
