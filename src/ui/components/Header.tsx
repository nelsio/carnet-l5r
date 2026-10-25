import { useLayoutEffect, useRef, type ReactNode } from "react";
import { clanAccent, schoolRankOf } from "@carnet/core";
import { SHOW_WOUND_MULTIPLIER, WOUND_MULTIPLIERS } from "../../rules/l5r4e";
import { useStore } from "../store";
import { NEXT_THEME, THEME_LABELS } from "../theme";

export function Header() {
  const { state, dispatch, library } = useStore();
  const { character: c, ui } = state;
  const readonly = state.mode === "readonly";
  const clan = c?.clan.trim() ? clanAccent(c.clan) : null;
  // Sous le nom : école affichée et rang d'école, plus de famille (annexe E.19 S8).
  const sub = c ? [c.school.trim(), `Rang\u00a0${schoolRankOf(c)}`].filter(Boolean).join(" · ") : "";

  return (
    <header className="top">
      <div className="who">
        {c ? (
          <>
            {clan && <div className="mon">{clan.label ?? `Clan ${c.clan}`}</div>}
            <FitName name={c.name}>{readonly && <> <span className="badge">Consultation</span></>}</FitName>
            <div className="sub">{sub}</div>
          </>
        ) : (
          <>
            <h1>Carnet de Rokugan</h1>
            <div className="sub">Compagnon de campagne · L5R 4e</div>
          </>
        )}
      </div>
      <div className="top-right">
        {c && <HeaderButton icon={ICONS.library} label="Bibliothèque" onClick={() => void library.showLibrary()} />}
        <HeaderButton
          icon={ICONS.dice} label={`Lanceur de dés : ${ui.showDiceRoller ? "affiché" : "masqué"}`} pressed={ui.showDiceRoller}
          onClick={() => dispatch({ type: "diceRoller", show: !ui.showDiceRoller })}
        />
        <HeaderButton icon={ICONS.theme} label={`Thème : ${THEME_LABELS[ui.theme]}`} onClick={() => dispatch({ type: "theme", theme: NEXT_THEME[ui.theme] })} />
        {SHOW_WOUND_MULTIPLIER && (
          <HeaderButton
            icon={ICONS.wounds} label={`Blessures : Terre × ${ui.woundMultiplier}`}
            onClick={() => dispatch({ type: "woundMultiplier", value: nextWoundMultiplier(ui.woundMultiplier) })}
          />
        )}
        {c && (
          <div className="tabs" role="group" aria-label="Vue">
            <button type="button" aria-pressed={ui.view === "sheet"} onClick={() => dispatch({ type: "view", view: "sheet" })}>Fiche</button>
            <button type="button" aria-pressed={ui.view === "aid"} onClick={() => dispatch({ type: "view", view: "aid" })}>Aide de jeu</button>
            <button type="button" aria-pressed={ui.view === "stats"} onClick={() => dispatch({ type: "view", view: "stats" })}>Statistiques</button>
          </div>
        )}
      </div>
    </header>
  );
}

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
