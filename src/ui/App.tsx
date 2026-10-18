import { useMemo, useReducer } from "react";
import type { Storage } from "../storage";
import { Aid } from "./components/Aid";
import { Header } from "./components/Header";
import { Library } from "./components/Library";
import { Sheet } from "./components/Sheet";
import { StatusBar } from "./components/StatusBar";
import { initialState, reducer, StoreContext, type Store } from "./store";
import { useThemeAndClan } from "./theme";
import { useLibrary, type LibraryOptions } from "./useLibrary";

const d10 = () => 1 + Math.floor(Math.random() * 10);

export interface AppProps extends LibraryOptions {
  storage: Storage;
  /** Tirage d'un d10, injectable pour les tests. */
  rng?: () => number;
}

export function App({ storage, rng = d10, ...libraryOptions }: AppProps) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const { ready, api } = useLibrary(storage, state, dispatch, libraryOptions);
  const store = useMemo<Store>(() => ({ state, dispatch, rng, library: api }), [state, rng, api]);
  const { character: c, ui } = state;
  useThemeAndClan(ui.theme, c?.clan);

  return (
    <StoreContext.Provider value={store}>
      <div className="wrap">
        {api.degraded && (
          <p className="banner" role="alert">Sauvegarde impossible dans ce navigateur : exporte ta fiche avant de fermer.</p>
        )}
        <Header />
        {c && <StatusBar />}
        <main>
          {!ready ? <div className="empty"><p className="muted">Ouverture du carnet…</p></div>
            : !c ? <Library />
              : ui.view === "sheet" ? <Sheet /> : <Aid />}
        </main>
        <p className="note">
          Règles de référence : L5R 4e édition (Roll &amp; Keep). Les jets explosent sur 10, les augmentations ajoutent +5 au ND
          (max = Anneau de Vide), la pénalité de blessure s'ajoute au ND. Les procédures de duel et de bataille de masse sont résumées :
          vérifie le détail dans ton livre de base.
        </p>
        <footer className="version">
          {c && state.mode === "edit" && api.saveStatus === "saved" && !api.degraded && <span className="saved">Enregistré dans ce navigateur · </span>}
          {api.saveStatus === "error" && <span className="save-error" role="alert">Échec de l'enregistrement dans ce navigateur · </span>}
          Carnet de Rokugan v{__APP_VERSION__}
        </footer>
      </div>
    </StoreContext.Provider>
  );
}
