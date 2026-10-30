import { useState, type ReactNode } from "react";
import { clanAccent, schoolRankOf, serializeCharacter } from "@carnet/core";
import { EXAMPLES, type Example } from "../../rules/example";
import { PORTAL } from "../../rules/portal";
import { downloadText } from "../download";
import type { LibraryEntry } from "../../storage";
import { useStore } from "../store";
import { ExternalLink } from "./ExternalLink";
import { ImportButton } from "./FileActions";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

/** Écran Bibliothèque : les fiches de ce navigateur (HANDOFF §6.1, annexe L.3 et L.4). */
export function Library() {
  const { library } = useStore();
  const { entries } = library;

  if (!entries.length) {
    return (
      <div className="lib-empty">
        <section className="panel start" aria-labelledby="start-title">
          <h2 id="start-title">Pas encore de personnage ?</h2>
          <p className="muted">Deux façons de commencer. Tu as déjà un fichier ? <ImportButton label="Importer un JSON" className="linkbtn" /></p>
          <div className="start-opts">
            <StartOption
              kanji="鍛" title="Forger sur le portail"
              desc="Création guidée : le portail calcule l'XP, les traits et les bonus d'école."
              steps={[["Forger", "Clan, école, anneaux, compétences"], ["Exporter", "Bouton « JSON » de la Forge"], ["Importer", "Ici, avec « Importer un JSON »"]]}
            >
              <ForgeLink />
            </StartOption>
            <StartOption
              kanji="筆" title="Fiche vierge"
              desc="Saisie directe dans le Carnet, pour recopier une fiche papier existante."
              steps={[["Créer", "Nom, clan, école et Rang"], ["Remplir", "Anneaux, compétences, techniques"], ["Jouer", "Enregistrée dans ce navigateur"]]}
            >
              <button type="button" className="btn accent" onClick={() => void library.create()}>Nouvelle fiche vierge</button>
            </StartOption>
          </div>
        </section>
        <section className="templates" aria-labelledby="templates-title">
          <h2 id="templates-title">Modèles de personnage</h2>
          <p className="muted">Une fiche d'exemple complète, à ouvrir ou à copier pour partir d'une base.</p>
          <div className="tpl-list">
            {EXAMPLES.map((x) => <TemplateCard key={x.id} example={x} />)}
          </div>
        </section>
        <p className="discover">Nouveau à Rokugan ? <ExternalLink href={PORTAL.home}>Découvrir la campagne</ExternalLink></p>
      </div>
    );
  }
  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>Bibliothèque</h2>
          <div className="file-actions"><ImportButton /></div>
        </div>
        <p className="hint" style={{ marginTop: 0 }}>
          Les fiches restent dans ce navigateur. Rien n'est envoyé. Pour importer, tu peux aussi déposer un fichier JSON sur la page.
        </p>
        <ul className="library" aria-label="Fiches">
          {entries.map((e) => <EntryRow key={e.id} entry={e} />)}
        </ul>
      </div>
      <section className="panel newchar" aria-labelledby="newchar-title">
        <h2 id="newchar-title">Un nouveau personnage ?</h2>
        <div className="start-opts">
          <StartOption compact kanji="鍛" title="Forger sur le portail" desc="Création guidée, puis export JSON à importer ici.">
            <ForgeLink />
          </StartOption>
          <StartOption compact kanji="筆" title="Fiche vierge" desc="Saisie directe dans le Carnet, depuis une fiche papier.">
            <button type="button" className="btn accent" onClick={() => void library.create()}>Nouvelle fiche</button>
          </StartOption>
        </div>
        <p className="newchar-foot">
          Ou partir d'un modèle :{" "}
          {EXAMPLES.map((x, i) => (
            <span key={x.id}>
              {i > 0 && " · "}
              <button type="button" className="linkbtn" aria-label={`Partir du modèle ${x.type}`} onClick={() => void library.importEntry(x.build(), "edit")}>{x.type}</button>
            </span>
          ))}
        </p>
      </section>
    </>
  );
}

function ForgeLink() {
  return <ExternalLink href={PORTAL.forge} className="btn accent" label="Ouvrir la Forge (nouvel onglet)">Ouvrir la Forge</ExternalLink>;
}

const STEP_NUMBERS = ["一", "二", "三"];

/** Une des deux façons de commencer : Forge du portail ou fiche vierge (annexe L.3, L.4). */
function StartOption({ kanji, title, desc, steps, compact, children }: {
  kanji: string; title: string; desc: string; steps?: [string, string][]; compact?: boolean; children: ReactNode;
}) {
  return (
    <article className={`start-opt${compact ? " compact" : ""}`}>
      <div className="start-opt-h">
        <span className="opt-k" aria-hidden="true">{kanji}</span>
        <div>
          <h3>{title}</h3>
          <p className="muted">{desc}</p>
        </div>
      </div>
      {steps && (
        <ol className="steps">
          {steps.map(([s, x], i) => (
            <li key={s}><span className="step-n" aria-hidden="true">{STEP_NUMBERS[i]}</span><span className="step-s">{s}</span><span className="step-x">{x}</span></li>
          ))}
        </ol>
      )}
      <div className="start-opt-act">{children}</div>
    </article>
  );
}

/** Carte d'un modèle : type, nom, clan et Rang lus dans la fiche (annexe L.3). */
function TemplateCard({ example: x }: { example: Example }) {
  const { library } = useStore();
  const c = x.build();
  const accent = clanAccent(c.clan);
  return (
    <article className="tplc" aria-label={`Modèle ${x.type}`}>
      <span className="opt-k" aria-hidden="true">{x.kanji}</span>
      <div className="tplt">
        <div className="ty">{x.type}</div>
        <div className="n">{c.name}</div>
        <div className="m">
          <span className="dot sm" aria-hidden="true" style={{ ["--dot-l" as string]: accent.light, ["--dot-d" as string]: accent.dark }} />
          {accent.label ?? c.clan} · Rang&nbsp;{schoolRankOf(c)}
        </div>
      </div>
      <div className="file-actions">
        <button type="button" className="btn sm" aria-label={`Utiliser le modèle ${x.type}`} onClick={() => void library.importEntry(x.build(), "edit")}>Utiliser</button>
        <button type="button" className="btn sm" aria-label={`JSON du modèle ${x.type}`} onClick={() => downloadText(x.fileName, serializeCharacter(c))}>JSON</button>
      </div>
    </article>
  );
}

function EntryRow({ entry: e }: { entry: LibraryEntry }) {
  const { library } = useStore();
  const [confirm, setConfirm] = useState(false);
  const c = e.character;
  const accent = clanAccent(c.clan);
  const name = c.name || "Sans nom";
  return (
    <li className="entry">
      <span className="dot" aria-hidden="true" style={{ ["--dot-l" as string]: accent.light, ["--dot-d" as string]: accent.dark }} />
      <div className="entry-main">
        <b>{name}</b>
        {e.mode === "readonly" && <span className="badge">Consultation</span>}
        {e.linkedFile && <span className="badge linked-badge" title="Fichier lié">{e.linkedFile.name}</span>}
        <div className="muted">
          {[c.clan, c.school].filter(Boolean).join(" · ") || "—"} · <time dateTime={e.updatedAt}>{dateFormat.format(new Date(e.updatedAt))}</time>
        </div>
      </div>
      <div className="entry-actions">
        {confirm ? (
          <>
            <span className="muted">Supprimer « {name} » ?</span>
            <button type="button" className="btn sm danger" onClick={() => void library.remove(e.id)}>Supprimer définitivement</button>
            <button type="button" className="btn sm" onClick={() => setConfirm(false)}>Annuler</button>
          </>
        ) : (
          <>
            <button type="button" className="btn sm" aria-label={`Ouvrir ${name}`} onClick={() => void library.open(e.id)}>Ouvrir</button>
            <button type="button" className="btn sm" aria-label={`Supprimer ${name}`} onClick={() => setConfirm(true)}>Supprimer</button>
          </>
        )}
      </div>
    </li>
  );
}
