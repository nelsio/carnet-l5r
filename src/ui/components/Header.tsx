import { clanAccent } from "@carnet/core";
import { useStore } from "../store";
import { NEXT_THEME, THEME_LABELS } from "../theme";

export function Header() {
  const { state, dispatch } = useStore();
  const { character: c, ui } = state;
  const clan = c?.clan.trim() ? clanAccent(c.clan) : null;
  const sub = c ? [c.family, c.school].filter(Boolean).join(" · ") : "";

  return (
    <header className="top">
      <div className="who">
        {c ? (
          <>
            {clan && <div className="mon">{clan.label ?? `Clan ${c.clan}`}</div>}
            <h1>{c.name}</h1>
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
        <button className="theme-btn" type="button" title="Changer de thème" onClick={() => dispatch({ type: "theme", theme: NEXT_THEME[ui.theme] })}>
          Thème : {THEME_LABELS[ui.theme]}
        </button>
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
