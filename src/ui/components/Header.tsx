import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { clanAccent, schoolRankOf } from "@carnet/core";
import { SHOW_WOUND_MULTIPLIER, WOUND_MULTIPLIERS } from "../../rules/l5r4e";
import { useStore } from "../store";
import { clanUrl } from "../../rules/portal";
import { useT } from "../../i18n";
import { NEXT_THEME } from "../theme";
import { ExternalLink } from "./ExternalLink";
import { ResourcesMenu } from "./ResourcesMenu";

export function Header() {
  const { state, dispatch, library } = useStore();
  const t = useT();
  const { character: c, ui } = state;
  const readonly = state.mode === "readonly";
  const clan = c?.clan.trim() ? clanAccent(c.clan) : null;
  const clanHref = clanUrl(clan?.id ?? null);
  // Sous le nom : école affichée et rang d'école, plus de famille (annexe E.19 S8).
  const sub = c ? [c.school.trim(), t.header.rank(schoolRankOf(c))].filter(Boolean).join(" · ") : "";

  // Titre d'onglet : nom du personnage, puis l'outil (annexe G.3) ; sans fiche, le titre référencé de index.html (annexe P).
  const name = c?.name.trim();
  useEffect(() => {
    document.title = name ? `${name} · ${APP_NAME}` : t.header.homeTitle(APP_NAME);
  }, [name, t]);

  return (
    <header className="top">
      <div className="who">
        {/* Sceau 帳 : marque de l'outil ; avec une fiche ouverte, il ouvre la Bibliothèque (annexe G.3). */}
        {c ? (
          <button type="button" className="seal" title={t.header.sealTitle(APP_NAME)}
            aria-label={t.header.sealLabel(APP_NAME)} onClick={() => void library.showLibrary()}>帳</button>
        ) : (
          <span className="seal" aria-hidden="true">帳</span>
        )}
        <div className="who-txt">
          {c ? (
            <>
              <div className="eyebrow">
                <span className="brand">{APP_NAME}</span>
                {clan && <><span className="sep" aria-hidden="true" />{clan.label && clanHref ? (
                  // Page du clan sur le portail (annexe L.7).
                  <ExternalLink href={clanHref} className="mon" label={t.header.clanPage(clan.label)}>{clan.label}</ExternalLink>
                ) : <div className="mon">{clan.label ?? t.header.clan(c.clan)}</div>}</>}
              </div>
              <FitName name={c.name}>{readonly && <> <span className="badge">{t.header.readonly}</span></>}</FitName>
              <div className="sub">{sub}</div>
            </>
          ) : (
            <>
              <h1>{APP_NAME}</h1>
              <div className="sub">{t.header.tagline}</div>
            </>
          )}
        </div>
      </div>
      <div className="top-right">
        {/* Gardé à côté du sceau : plus visible, surtout sur mobile (annexe G.6, v2.13.1). */}
        {c && <HeaderButton icon={ICONS.library} label={t.header.library} onClick={() => void library.showLibrary()} />}
        <HeaderButton
          icon={ICONS.dice} label={t.header.diceRoller(ui.showDiceRoller)} pressed={ui.showDiceRoller}
          onClick={() => dispatch({ type: "diceRoller", show: !ui.showDiceRoller })}
        />
        <HeaderButton icon={ICONS.theme} label={t.header.theme(t.header.themes[ui.theme])} onClick={() => dispatch({ type: "theme", theme: NEXT_THEME[ui.theme] })} />
        <ResourcesMenu />
        {SHOW_WOUND_MULTIPLIER && (
          <HeaderButton
            icon={ICONS.wounds} label={t.header.woundMultiplier(ui.woundMultiplier)}
            onClick={() => dispatch({ type: "woundMultiplier", value: nextWoundMultiplier(ui.woundMultiplier) })}
          />
        )}
        {c && (
          <div className="tabs" role="group" aria-label={t.nav.label}>
            <button type="button" aria-pressed={ui.view === "sheet"} onClick={() => dispatch({ type: "view", view: "sheet" })}>{t.nav.sheet}</button>
            <button type="button" aria-label={t.nav.aid} aria-pressed={ui.view === "aid"} onClick={() => dispatch({ type: "view", view: "aid" })}>
              {t.nav.aidShort}<span className="tab-suffix"> L5R</span>
            </button>
            <button type="button" aria-pressed={ui.view === "stats"} onClick={() => dispatch({ type: "view", view: "stats" })}>{t.nav.stats}</button>
          </div>
        )}
      </div>
    </header>
  );
}

/** Nom propre de l'outil : identique dans toutes les langues. */
export const APP_NAME = "Carnet de Rokugan";

const ICONS = {
  library: <path d="M4 4h4v16H4zM10 4h4v16h-4zM16.2 5.2l3.8-1 3 15.6-3.8 1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.6" fill="currentColor" />
    </>
  ),
  theme: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
    </>
  ),
  wounds: <path d="M12 3.5c3.2 4.2 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.8-6.4 6-10.6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />,
};

/** Multiplicateur de blessures suivant (× 2 → × 3 → × 4 → × 5 → × 2), réglage de préférence (annexe E.6). */
function nextWoundMultiplier(n: number): number {
  const i = WOUND_MULTIPLIERS.indexOf(n as (typeof WOUND_MULTIPLIERS)[number]);
  return WOUND_MULTIPLIERS[(i + 1) % WOUND_MULTIPLIERS.length];
}

/** Plus petite taille essayée : simple garde-fou, le nom n'a pas de minimum (annexe E.19 S7). */
const FIT_NAME_FLOOR = 8;
const FIT_NAME_LINES = 2;

/**
 * Nom du samouraï sur 2 lignes au plus : la police baisse de 1 px en 1 px jusqu'à ce qu'il tienne,
 * sans coupure « … » ; recalcul au changement de nom et de largeur de fenêtre (annexe E.19 S7).
 */
function FitName({ name, children }: { name: string; children?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      let size = parseFloat(getComputedStyle(el).fontSize);
      const lines = () => el.getBoundingClientRect().height / (parseFloat(getComputedStyle(el).lineHeight) || size * 1.2);
      while (size > FIT_NAME_FLOOR && lines() > FIT_NAME_LINES + 0.5) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    // Les polices embarquées changent la largeur du texte une fois chargées.
    void document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [name]);
  return <h1 ref={ref}>{name}{children}</h1>;
}

/** Icône + texte sur bureau, icône seule sur mobile ; le texte reste le nom accessible (HANDOFF §6.2, §7). */
function HeaderButton({ icon, label, pressed, onClick }: { icon: ReactNode; label: string; pressed?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`theme-btn${pressed ? " on" : ""}`} title={label} aria-pressed={pressed} onClick={onClick}>
      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
      <span className="txt">{label}</span>
    </button>
  );
}
