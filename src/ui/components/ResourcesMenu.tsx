import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { clanAccent } from "@carnet/core";
import { CARNET_LINKS } from "../../rules/links";
import { clanUrl, FORGE_JSON_OK, PORTAL, PORTAL_CLAN_KANJI, PORTAL_NAME } from "../../rules/portal";
import { useT, type Messages } from "../../i18n";
import { useStore } from "../store";
import { ExtIcon } from "./ExternalLink";
import { ForgePending } from "./ForgePending";

/**
 * `pending` : pastille « JSON pas encore compatible » après le titre (lot 27).
 * `french` : contenu en français, suffixe `t.french` après le titre (« (FR) » en anglais, annexe 52.4).
 */
interface Entry { href: string; kanji: string; title: string; desc: string; pending?: boolean; french?: boolean }

const create = (t: Messages["resources"]): Entry[] => [FORGE_JSON_OK
  ? { href: PORTAL.forge, kanji: "鍛", title: t.forge, desc: t.forgeReady, french: true }
  : { href: PORTAL.forge, kanji: "鍛", title: t.forge, desc: t.forgePending, pending: true, french: true }];
const references = (t: Messages["resources"]): Entry[] => [
  { href: PORTAL.grimoire, kanji: "巻", ...t.grimoire, french: true },
  { href: PORTAL.combat, kanji: "刀", ...t.combat, french: true },
  { href: PORTAL.bushido, kanji: "義", ...t.bushido, french: true },
  { href: PORTAL.etiquette, kanji: "茶", ...t.etiquette, french: true },
];
/** Liens vers le dépôt du Carnet (annexe M.3), kanji sur fond sceau. */
const carnet = (t: Messages["resources"]): Entry[] => [
  { href: CARNET_LINKS.guide, kanji: "帳", ...t.guide, french: true },
  { href: CARNET_LINKS.releases, kanji: "新", ...t.releases },
  { href: CARNET_LINKS.bug, kanji: "報", ...t.bug },
  { href: CARNET_LINKS.code, kanji: "源", ...t.code },
];

/**
 * Bouton « Ressources » et son menu de liens vers le portail (annexes L.2 et O.2).
 * Bureau : menu déroulant sous le bouton ; mobile : panneau glissant depuis le bas, avec voile.
 */
export function ResourcesMenu() {
  const { state } = useStore();
  const t = useT().resources;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const c = state.character;
  const clan = c ? clanAccent(c.clan) : null;
  const clanHref = clanUrl(clan?.id ?? null);
  const portal: Entry[] = [{ href: PORTAL.home, kanji: "帝", title: PORTAL_NAME, desc: t.portal, french: true }];
  if (clan?.id && clan.label && clanHref) {
    portal.push({ href: clanHref, kanji: PORTAL_CLAN_KANJI[clan.id], title: clan.label, desc: t.clan, french: true });
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

  const group = (title: string, entries: Entry[], extra?: { className: string; version: string }) => (
    <div role="group" aria-label={title} className={extra?.className}>
      <div className="res-group" aria-hidden="true">{title}{extra && <span className="v">v{extra.version}</span>}</div>
      {entries.map((x) => (
        <a key={x.href} role="menuitem" href={x.href} target="_blank" rel="noopener noreferrer"
          aria-label={t.item(`${x.title}${x.french ? t.french : ""}`, !!x.pending, x.desc)} onClick={() => close()}>
          <span className="kj" aria-hidden="true">{x.kanji}</span>
          <span className="t">{x.title}{x.french && t.french}{x.pending && <> <ForgePending /></>}<span className="d">{x.desc}</span></span>
          <ExtIcon />
        </a>
      ))}
    </div>
  );

  return (
    <div className="res" ref={wrap}>
      <button
        ref={button} type="button" className="theme-btn" title={t.button}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? "res-menu" : undefined} onClick={() => setOpen(!open)}
      >
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 5.5c3 .8 15 .8 18 0M5 9.5h14M7.5 6.3V20M16.5 6.3V20M12 6.6v2.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className="txt">{t.button}</span>
      </button>
      {open && (
        <>
          <div className="res-scrim" data-testid="res-scrim" onClick={() => close()} />
          <div ref={menu} id="res-menu" className="res-menu" role="menu" aria-label={t.menu} onKeyDown={onKeyDown}>
            <span className="grip" aria-hidden="true" />
            {group(PORTAL_NAME, portal)}
            {group(t.groups.create, create(t))}
            {group(t.groups.references, references(t))}
            {group(t.groups.carnet, carnet(t), { className: "res-carnet", version: __APP_VERSION__ })}
            <p className="res-foot">{t.foot}</p>
          </div>
        </>
      )}
    </div>
  );
}
