import type { ReactNode } from "react";
import { clanAccent } from "@carnet/core";
import { useStore } from "../store";
import { NEXT_THEME, THEME_LABELS } from "../theme";

export function Header() {
  const { state, dispatch, library } = useStore();
  const { character: c, ui } = state;
  const readonly = state.mode === "readonly";
  const clan = c?.clan.trim() ? clanAccent(c.clan) : null;
  const sub = c ? [c.family, c.school].filter(Boolean).join(" · ") : "";

  return (
    <header className="top">
      <div className="who">
        {c ? (
          <>
            {clan && <div className="mon">{clan.label ?? `Clan ${c.clan}`}</div>}
            <h1>{c.name}{readonly && <> <span className="badge">Consultation</span></>}</h1>
            <div className="sub">{sub}{sub ? " · " : ""}Rang {c.insightRank}</div>
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
        {c && (
          <div className="tabs" role="group" aria-label="Vue">
            <button type="button" aria-pressed={ui.view === "sheet"} onClick={() => dispatch({ type: "view", view: "sheet" })}>Fiche</button>
            <button type="button" aria-pressed={ui.view === "aid"} onClick={() => dispatch({ type: "view", view: "aid" })}>Aide de jeu</button>
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
};

/** Icône + texte sur bureau, icône seule sur mobile ; le texte reste le nom accessible (HANDOFF §6.2, §7). */
function HeaderButton({ icon, label, pressed, onClick }: { icon: ReactNode; label: string; pressed?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`theme-btn${pressed ? " on" : ""}`} title={label} aria-pressed={pressed} onClick={onClick}>
      <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
      <span className="txt">{label}</span>
    </button>
  );
}
