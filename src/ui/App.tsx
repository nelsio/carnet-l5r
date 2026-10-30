import { useCallback, useMemo, useReducer, useState, type DragEvent } from "react";
import type { Storage } from "../storage";
import { Aid } from "./components/Aid";
import { AppFooter } from "./components/AppFooter";
import { Header } from "./components/Header";
import { ImportDialog } from "./components/ImportDialog";
import { Library } from "./components/Library";
import { Sheet } from "./components/Sheet";
import { Stats } from "./components/Stats";
import { StatusBar } from "./components/StatusBar";
import { initialState, reducer, StoreContext, type PendingImport, type Store } from "./store";
import { cachedTheme, useThemeAndClan } from "./theme";
import { useGrimoire } from "./useGrimoire";
import { useLibrary, type LibraryOptions } from "./useLibrary";

const d10 = () => 1 + Math.floor(Math.random() * 10);

export interface AppProps extends LibraryOptions {
  storage: Storage;
  /** Tirage d'un d10, injectable pour les tests. */
  rng?: () => number;
}

export function App({ storage, rng = d10, ...libraryOptions }: AppProps) {
  const [state, dispatch] = useReducer(reducer, cachedTheme(), initialState);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const { ready, api } = useLibrary(storage, state, dispatch, setPending, libraryOptions);
  const grimoire = useGrimoire(storage);
  const startImport = useCallback((file: File) => {
    void file.text().then((text) => setPending({ fileName: file.name, text }));
  }, []);
  const store = useMemo<Store>(() => ({ state, dispatch, rng, library: api, grimoire, startImport }), [state, rng, api, grimoire, startImport]);
  const { character: c, ui } = state;
  useThemeAndClan(ui.theme, c?.clan);

  // Glisser-déposer d'un fichier JSON n'importe où sur la page (HANDOFF §8).
  const onDragOver = (e: DragEvent) => {
    if (ready && e.dataTransfer.types.includes("Files")) e.preventDefault();
  };
  const onDrop = (e: DragEvent) => {
    const file = e.dataTransfer.files[0];
    if (!ready || !file) return;
    e.preventDefault();
    startImport(file);
  };

  return (
    <StoreContext.Provider value={store}>
      <div className="wrap" onDragOver={onDragOver} onDrop={onDrop}>
        {api.degraded && (
          <p className="banner" role="alert">Sauvegarde impossible dans ce navigateur : exporte ta fiche avant de fermer.</p>
        )}
        <Header />
        {c && <StatusBar />}
        <main>
          {!ready ? <div className="empty"><p className="muted">Ouverture du carnet…</p></div>
            : !c ? <Library />
              : ui.view === "sheet" ? <Sheet /> : ui.view === "stats" ? <Stats /> : <Aid />}
        </main>
        <p className="note">
          Règles de référence : L5R 4e édition (Roll &amp; Keep). Les jets explosent sur 10 (dégâts : sur 9 et 10 avec Kenjutsu ou Armes lourdes au rang 7), les augmentations ajoutent +5 au ND
          (max = Anneau de Vide), la pénalité de blessure s'ajoute au ND. Les procédures de duel et de bataille de masse sont résumées :
          vérifie le détail dans ton livre de base.
        </p>
        <AppFooter status={<>
          {c && state.mode === "edit" && api.saveStatus === "saved" && !api.degraded && <span className="saved">Enregistré dans ce navigateur</span>}
          {api.saveStatus === "error" && <span className="save-error" role="alert">Échec de l'enregistrement dans ce navigateur</span>}
        </>} />
        {pending && <ImportDialog pending={pending} onClose={() => setPending(null)} />}
      </div>
    </StoreContext.Provider>
  );
}
