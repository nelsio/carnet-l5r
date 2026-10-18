import { useMemo, useReducer } from "react";
import type { Character } from "@carnet/core";
import { Aid } from "./components/Aid";
import { Header } from "./components/Header";
import { Sheet } from "./components/Sheet";
import { StatusBar } from "./components/StatusBar";
import { initialState, reducer, StoreContext, type Store } from "./store";
import { useThemeAndClan } from "./theme";

const d10 = () => 1 + Math.floor(Math.random() * 10);

export interface AppProps {
  /** Fiche ouverte au démarrage (le stockage arrive au lot 5). */
  initialCharacter?: Character | null;
  /** Tirage d'un d10, injectable pour les tests. */
  rng?: () => number;
}

export function App({ initialCharacter = null, rng = d10 }: AppProps) {
  const [state, dispatch] = useReducer(reducer, initialCharacter, initialState);
  const store = useMemo<Store>(() => ({ state, dispatch, rng }), [state, rng]);
  const { character: c, ui } = state;
  useThemeAndClan(ui.theme, c?.clan);

  return (
    <StoreContext.Provider value={store}>
      <div className="wrap">
        <Header />
        {c && <StatusBar />}
        <main>
          {!c ? (
            <div className="empty panel">
              <h2>Aucun personnage dans ce carnet</h2>
              <p className="muted">Crée ta fiche : Traits, Compétences, armes, techniques. L'aide de jeu calculera tes réserves de dés à partir d'elle.</p>
              <p><button type="button" className="btn primary" onClick={() => dispatch({ type: "create" })}>Créer mon personnage</button></p>
            </div>
          ) : ui.view === "sheet" ? <Sheet /> : <Aid />}
        </main>
        <p className="note">
          Règles de référence : L5R 4e édition (Roll &amp; Keep). Les jets explosent sur 10, les augmentations ajoutent +5 au ND
          (max = Anneau de Vide), la pénalité de blessure s'ajoute au ND. Les procédures de duel et de bataille de masse sont résumées :
          vérifie le détail dans ton livre de base.
        </p>
        <footer className="version">Carnet de Rokugan v{__APP_VERSION__}</footer>
      </div>
    </StoreContext.Provider>
  );
}
