import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { clanAccent } from "@carnet/core";
import { clanUrl, PORTAL, PORTAL_CLAN_KANJI } from "../../rules/portal";
import { useStore } from "../store";
import { ExtIcon } from "./ExternalLink";

interface Entry { href: string; kanji: string; title: string; desc: string }

const CREATE: Entry[] = [{ href: PORTAL.forge, kanji: "鍛", title: "Forge de personnage", desc: "Exporte un JSON compatible avec le Carnet" }];
const REFERENCES: Entry[] = [
  { href: PORTAL.grimoire, kanji: "巻", title: "Grimoire", desc: "Sorts, Kihō, recherche par effet" },
  { href: PORTAL.combat, kanji: "刀", title: "Mémento de combat", desc: "Postures, duel Iaijutsu" },
  { href: PORTAL.bushido, kanji: "義", title: "Bushido & honneur", desc: "Vertus et barème d'honneur" },
  { href: PORTAL.etiquette, kanji: "茶", title: "Étiquette & coutumes", desc: "Castes, cadeaux, thé" },
];

/**
 * Bouton « Ressources » et son menu de liens vers le portail de la campagne (annexe L.2).
 * Bureau : menu déroulant sous le bouton ; mobile : panneau glissant depuis le bas, avec voile.
 */
export function ResourcesMenu() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const c = state.character;
  const clan = c ? clanAccent(c.clan) : null;
  const clanHref = clanUrl(clan?.id ?? null);
  const campaign: Entry[] = [{ href: PORTAL.home, kanji: "帝", title: "Portail de la campagne", desc: "Clans, règles, aides de jeu" }];
  if (clan?.id && clan.label && clanHref) {
    campaign.push({ href: clanHref, kanji: PORTAL_CLAN_KANJI[clan.id], title: clan.label, desc: "Histoire, familles et serments" });
  }

  const close = (focusButton = false) => {
    setOpen(false);
    if (focusButton) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const outside = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    // Panneau bas sur mobile : la page ne défile pas dessous (même règle que le lanceur, §7).
    document.body.classList.add("menu-open");
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  const onKeyDown = (e: KeyboardEvent) => {
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(i + step + items.length) % items.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const group = (title: string, entries: Entry[]) => (
    <div role="group" aria-label={title}>
      <div className="res-group" aria-hidden="true">{title}</div>
      {entries.map((x) => (
        <a key={x.href} role="menuitem" href={x.href} target="_blank" rel="noopener noreferrer"
          aria-label={`${x.title} : ${x.desc} (nouvel onglet)`} onClick={() => close()}>
          <span className="kj" aria-hidden="true">{x.kanji}</span>
          <span className="t">{x.title}<span className="d">{x.desc}</span></span>
          <ExtIcon />
        </a>
      ))}
    </div>
  );

  return (
    <div className="res" ref={wrap}>
      <button
        ref={button} type="button" className="theme-btn" title="Ressources"
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? "res-menu" : undefined} onClick={() => setOpen(!open)}
      >
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 5.5c3 .8 15 .8 18 0M5 9.5h14M7.5 6.3V20M16.5 6.3V20M12 6.6v2.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="txt">Ressources</span>
      </button>
      {open && (
        <>
          <div className="res-scrim" data-testid="res-scrim" onClick={() => close()} />
          <div ref={menu} id="res-menu" className="res-menu" role="menu" aria-label="Ressources de la campagne" onKeyDown={onKeyDown}>
            <span className="grip" aria-hidden="true" />
            {group("Campagne", campaign)}
            {group("Créer", CREATE)}
            {group("Références", REFERENCES)}
            <p className="res-foot">Site de la campagne. S'ouvre dans un nouvel onglet.</p>
          </div>
        </>
      )}
    </div>
  );
}
