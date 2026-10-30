import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { sameSpell, searchGrimoire, spellTn, type GrimoireSpell, type Spell, type SpellElement } from "@carnet/core";
import { ELEMENT_LABELS } from "../../rules/l5r4e";
import { GRIMOIRE_FILES } from "../../rules/portal";
import { useStore } from "../store";

const ELEMENT_CHIPS: readonly [SpellElement | "all-elements", string][] = [
  ["all-elements", "Tous"], ["all", "Universels"], ["air", "Air"], ["earth", "Terre"], ["fire", "Feu"], ["water", "Eau"], ["void", "Vide"],
];

const elementLabel = (e: SpellElement) => (e === "all" ? "Universel" : ELEMENT_LABELS[e]);
const ringColor = (e: SpellElement) => ({ ["--rc" as string]: `var(--ring-${e})` });
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;

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
  const meta = [elementLabel(g.element), `Maîtrise ${g.mastery}`, `ND ${spellTn(g.mastery)}`, ...(g.keywords.length ? [g.keywords.join(", ")] : [])];
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
  const action = (label: string) => <button type="button" className="linkbtn" onClick={() => void load()}>{label}</button>;
  let tone = "";
  let body;
  if (status === "loading") {
    body = <><span className="spin" aria-hidden="true" />Chargement du grimoire…</>;
  } else if (status === "error") {
    tone = "err";
    body = <>Grimoire injoignable · {action("Réessayer")}</>;
  } else if (status === "ready" && cache) {
    const date = new Date(cache.fetchedAt).toLocaleDateString("fr-FR");
    if (refreshFailed) {
      tone = "warn";
      body = <>Actualisation impossible, grimoire du {date} gardé · {action("Réessayer")}</>;
    } else if (cache.files < GRIMOIRE_FILES.length) {
      tone = "warn";
      body = <>Grimoire incomplet ({cache.files} fichiers sur {GRIMOIRE_FILES.length}) · {action("Actualiser")}</>;
    } else {
      tone = "ok";
      body = <>Grimoire du {date} · {plural(cache.spells.length, "sort")} · {action("Actualiser")}</>;
    }
  } else {
    body = <>Grimoire non chargé</>;
  }
  return (
    <span className={`gstate ${tone}`} role="status" data-testid="grimoire-status">
      {status !== "loading" && <span className="dot" aria-hidden="true" />}
      <span>{body}</span>
    </span>
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
        <label htmlFor="grimoire-q">Nom du sort</label>
        <input
          ref={input} id="grimoire-q" className="in" type="search" autoComplete="off" placeholder="ex. armure, éteindre, jade"
          role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="grimoire-list"
          aria-activedescendant={results.length ? `grimoire-opt-${current}` : undefined}
          value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }}
        />
        <div className="gchips" role="group" aria-label="Élément">
          {ELEMENT_CHIPS.map(([key, label]) => (
            <button
              key={key} type="button" className="gchip" aria-pressed={element === key}
              style={key === "all-elements" ? undefined : ringColor(key)}
              onClick={() => { setElement(key); setActive(0); }}
            >{key !== "all-elements" && <i aria-hidden="true" />}{label}</button>
          ))}
        </div>
        <div className="gcount" aria-live="polite">
          {plural(results.length, "sort")}{added && <> · Ajouté : <b>{added}</b></>}
        </div>
        <ul ref={listRef} id="grimoire-list" className="gresults" role="listbox" aria-label="Sorts du grimoire">
          {results.map((g, i) => {
            const have = noted(g);
            return (
              <li
                key={g.gid} id={`grimoire-opt-${i}`} role="option" className="gres" style={ringColor(g.element)}
                aria-selected={i === current} aria-disabled={have || undefined}
                onMouseDown={(e) => e.preventDefault()} onClick={() => add(g)}
              >
                <GrimoireRow g={g} />
                {have ? <span className="have">déjà noté</span> : <span className="add">+ Ajouter</span>}
              </li>
            );
          })}
        </ul>
      </div>
    );
  } else if (status === "loading") {
    content = <p className="gload"><span className="spin" aria-hidden="true" />Chargement du grimoire…</p>;
  } else if (status === "error") {
    content = (
      <div className="gnote" role="alert">
        <span className="k" aria-hidden="true">待</span>
        <div>
          <b>Le grimoire ne répond pas.</b> Vérifie ta connexion, puis réessaie. Tu peux toujours saisir le sort à la main avec « + Sort ».
          <div><button type="button" className="btn sm" onClick={() => void load()}>Réessayer</button></div>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="ggate">
        <p>Pour proposer les sorts, le Carnet télécharge la liste du <b>grimoire de la campagne</b> (environ 110 Ko). Rien n'est envoyé, ta fiche reste dans ce navigateur.</p>
        <button ref={loadButton} type="button" className="btn accent" onClick={() => void load()}>Charger le grimoire</button>
        <span className="fine">La liste est gardée dans ce navigateur : elle reste disponible hors ligne. « Actualiser » la recharge.</span>
      </div>
    );
  }

  return (
    <>
      <div className="g-scrim" data-testid="grimoire-scrim" onClick={() => onClose(false)} />
      <section id="grimoire-panel" className="gpanel" aria-label="Ajouter depuis le grimoire" onKeyDown={onKeyDown}>
        <span className="grip" aria-hidden="true" />
        <div className="gp-h">
          <h3><span className="kj" aria-hidden="true">巻</span>Ajouter depuis le grimoire</h3>
          <button type="button" className="gp-x" aria-label="Fermer" onClick={() => onClose(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        {content}
      </section>
    </>
  );
}
