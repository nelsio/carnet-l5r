import { useMemo, useState, type ReactNode } from "react";
import { clanAccent, schoolRankOf, serializeCharacter } from "@carnet/core";
import { useLocale, useT } from "../../i18n";
import { examplesFor, type Example } from "../../rules/example";
import { CARNET_LINKS } from "../../rules/links";
import { FORGE_JSON_OK, PORTAL, PORTAL_NAME } from "../../rules/portal";
import { downloadText } from "../download";
import type { LibraryEntry } from "../../storage";
import { useStore } from "../store";
import { ExternalLink } from "./ExternalLink";
import { ForgePending } from "./ForgePending";
import { ImportButton, PhotoImportButton } from "./FileActions";

/** Écran Bibliothèque : les fiches de ce navigateur (HANDOFF §6.1, annexe L.3 et L.4). */
export function Library() {
  const { library } = useStore();
  const t = useT().library;
  const { locale } = useLocale();
  const { entries } = library;

  if (!entries.length) {
    return (
      <div className="lib-empty">
        <section className="panel start" aria-labelledby="start-title">
          <h2 id="start-title">{t.startTitle}</h2>
          <p className="muted">{t.startLede}<ImportButton label={t.importJson} className="linkbtn" /></p>
          <div className="start-opts">
            <StartOption kanji="写" title={t.paper.title} desc={t.paper.desc} steps={t.paper.steps}>
              <PhotoImportButton />
            </StartOption>
            <StartOption
              kanji="鍛" title={t.forge.title} pending={!FORGE_JSON_OK} desc={t.forge.desc}
              note={FORGE_JSON_OK ? undefined : <><b>{t.forge.pendingNoteTitle}</b>{t.forge.pendingNote}</>}
              steps={FORGE_JSON_OK ? t.forge.steps : t.forge.pendingSteps}
            >
              <ForgeLink />
            </StartOption>
            <StartOption kanji="筆" title={t.blank.title} desc={t.blank.desc} steps={t.blank.steps}>
              <button type="button" className="btn accent" onClick={() => void library.create()}>{t.blank.create}</button>
            </StartOption>
          </div>
          <p className="guide-hint">{t.firstVisit}<ExternalLink href={CARNET_LINKS.guide}>{t.readGuide}</ExternalLink></p>
        </section>
        <section className="templates" aria-labelledby="templates-title">
          <h2 id="templates-title">{t.templatesTitle}</h2>
          <p className="muted">{t.templatesLede}</p>
          <div className="tpl-list">
            {examplesFor(locale).map((x) => <TemplateCard key={x.id} example={x} />)}
          </div>
        </section>
        <p className="discover">{t.discover}<ExternalLink href={PORTAL.home}>{t.discoverLink(PORTAL_NAME)}</ExternalLink></p>
      </div>
    );
  }
  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>{t.title}</h2>
          <div className="file-actions"><ImportButton /></div>
        </div>
        <p className="hint" style={{ marginTop: 0 }}>{t.hint}</p>
        <ul className="library" aria-label={t.entries}>
          {entries.map((e) => <EntryRow key={e.id} entry={e} />)}
        </ul>
      </div>
      <section className="panel newchar" aria-labelledby="newchar-title">
        <h2 id="newchar-title">{t.newTitle}</h2>
        <div className="start-opts">
          <StartOption compact kanji="写" title={t.paper.title} desc={t.paper.desc}>
            <PhotoImportButton />
          </StartOption>
          <StartOption
            compact kanji="鍛" title={t.forge.title} pending={!FORGE_JSON_OK}
            desc={FORGE_JSON_OK ? t.forge.compactDesc : t.forge.compactPendingDesc}
          >
            <ForgeLink />
          </StartOption>
          <StartOption compact kanji="筆" title={t.blank.title} desc={t.blank.compactDesc}>
            <button type="button" className="btn accent" onClick={() => void library.create()}>{t.blank.createCompact}</button>
          </StartOption>
        </div>
        <p className="newchar-foot">
          {t.fromTemplate}{" "}
          {examplesFor(locale).map((x, i) => (
            <span key={x.id}>
              {i > 0 && " · "}
              <button type="button" className="linkbtn" aria-label={t.fromTemplateLabel(x.type)} onClick={() => void library.importEntry(x.build(), "edit")}>{x.type}</button>
            </span>
          ))}
        </p>
      </section>
    </>
  );
}

function ForgeLink() {
  const t = useT().library.forge;
  return <ExternalLink href={PORTAL.forge} className="btn" label={t.openLabel}>{t.open}</ExternalLink>;
}

const STEP_NUMBERS = ["一", "二", "三"];

/** Étape : titre, détail, et `true` pour une étape pas encore possible (case en pointillés). */
type Step = readonly [string, string, boolean?];

/**
 * Une des trois façons de commencer : fiche vierge, Forge du portail (annexe L.3, L.4) ou fiche papier (annexe S).
 * `pending` : Forge pas encore compatible (lot 27), carte en pointillés et pastille ; `note` : encadré sous l'en-tête.
 */
function StartOption({ kanji, title, desc, steps, note, pending, compact, children }: {
  kanji: string; title: string; desc: string; steps?: readonly Step[]; note?: ReactNode; pending?: boolean; compact?: boolean; children: ReactNode;
}) {
  return (
    <article className={`start-opt${compact ? " compact" : ""}${pending ? " wait" : ""}`}>
      <div className="start-opt-h">
        <span className="opt-k" aria-hidden="true">{kanji}</span>
        <div>
          <h3>{title}{pending && <> <ForgePending /></>}</h3>
          <p className="muted">{desc}</p>
        </div>
      </div>
      {/* Ligne de l'encadré, vide sans encadré : les étapes des cartes restent alignées (subgrid) */}
      {steps && (note ? <div className="warnbox" role="note"><span className="wk" aria-hidden="true">待</span><span>{note}</span></div> : <div />)}
      {steps && (
        <ol className="steps">
          {steps.map(([s, x, off], i) => (
            <li key={s} className={off ? "off" : undefined}><span className="step-n" aria-hidden="true">{STEP_NUMBERS[i]}</span><span className="step-s">{s}</span><span className="step-x">{x}</span></li>
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
  const tc = useT();
  const t = tc.library;
  const c = x.build();
  const accent = clanAccent(c.clan);
  return (
    <article className="tplc" aria-label={t.template(x.type)}>
      <span className="opt-k" aria-hidden="true">{x.kanji}</span>
      <div className="tplt">
        <div className="ty">{x.type}</div>
        <div className="n">{c.name}</div>
        <div className="m">
          <span className="dot sm" aria-hidden="true" style={{ ["--dot-l" as string]: accent.light, ["--dot-d" as string]: accent.dark }} />
          {(accent.id && tc.rules.clans[accent.id]) || accent.label || c.clan} · {tc.header.rank(schoolRankOf(c))}
        </div>
      </div>
      <div className="file-actions">
        <button type="button" className="btn sm" aria-label={t.useLabel(x.type)} onClick={() => void library.importEntry(x.build(), "edit")}>{t.use}</button>
        <button type="button" className="btn sm" aria-label={t.jsonLabel(x.type)} onClick={() => downloadText(x.fileName, serializeCharacter(c))}>{t.json}</button>
      </div>
    </article>
  );
}

function EntryRow({ entry: e }: { entry: LibraryEntry }) {
  const { library } = useStore();
  const tc = useT();
  const t = tc.library;
  const { intl } = useLocale();
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(intl, { dateStyle: "medium", timeStyle: "short" }), [intl]);
  const [confirm, setConfirm] = useState(false);
  const c = e.character;
  const accent = clanAccent(c.clan);
  const name = c.name || t.unnamed;
  return (
    <li className="entry">
      <span className="dot" aria-hidden="true" style={{ ["--dot-l" as string]: accent.light, ["--dot-d" as string]: accent.dark }} />
      <div className="entry-main">
        <b>{name}</b>
        {e.mode === "readonly" && <span className="badge">{tc.header.readonly}</span>}
        {e.linkedFile && <span className="badge linked-badge" title={t.linkedFile}>{e.linkedFile.name}</span>}
        <div className="muted">
          {[c.clan, c.school].filter(Boolean).join(" · ") || "—"} · <time dateTime={e.updatedAt}>{dateFormat.format(new Date(e.updatedAt))}</time>
        </div>
      </div>
      <div className="entry-actions">
        {confirm ? (
          <>
            <span className="muted">{tc.sheet.identity.deleteConfirm(name)}</span>
            <button type="button" className="btn sm danger" onClick={() => void library.remove(e.id)}>{tc.sheet.identity.deleteForever}</button>
            <button type="button" className="btn sm" onClick={() => setConfirm(false)}>{tc.common.cancel}</button>
          </>
        ) : (
          <>
            <button type="button" className="btn sm" aria-label={t.openLabel(name)} onClick={() => void library.open(e.id)}>{t.open}</button>
            <button type="button" className="btn sm" aria-label={t.deleteLabel(name)} onClick={() => setConfirm(true)}>{t.delete}</button>
          </>
        )}
      </div>
    </li>
  );
}
