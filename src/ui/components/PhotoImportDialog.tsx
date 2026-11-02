import { useId, useMemo, useRef, useState } from "react";
import { buildPhotoPrompt, extractPhotoReply, reviewLabel, valueAtPath, type ParsedFile, type PhotoReply } from "@carnet/core";
import { show } from "../format";
import { ImportReview, Modal } from "./ImportReview";

/**
 * Import depuis une fiche papier (lot 42, annexe S) : le prompt à copier, l'IA du joueur lit
 * ses photos, il colle la réponse ici. Aucune requête : le Carnet ne voit jamais les photos.
 */
export function PhotoImportDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const prompt = useMemo(() => buildPhotoPrompt(), []);
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<PhotoReply | null>(null);
  const details = useRef<HTMLDetailsElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  const result = useRef<HTMLDivElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      // Presse-papiers refusé : le prompt est déplié et sélectionné, à copier à la main.
      if (details.current) details.current.open = true;
      if (pre.current) window.getSelection()?.selectAllChildren(pre.current);
    }
  };

  const check = () => {
    setReply(extractPhotoReply(text));
    requestAnimationFrame(() => result.current?.scrollIntoView?.({ block: "nearest" }));
  };

  const parsed: ParsedFile | null = useMemo(() => (reply ? (reply.ok ? { ok: true, json: reply.json } : reply) : null), [reply]);
  const review = reply?.ok ? reply.review : [];

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <h2 id={titleId}>Importer depuis une fiche papier</h2>
      <p className="muted photo-lede">L'IA lit tes photos et renvoie ta fiche au format du Carnet. Tu vérifies avant d'importer.</p>
      <ol className="psteps">
        <li className={`pstep${copied ? " done" : ""}`}>
          <span className="pstep-n" aria-hidden="true">一</span>
          <div className="pstep-b">
            <p><b>Copie le prompt</b></p>
            <div className="row">
              <button type="button" className="btn accent" autoFocus onClick={() => void copy()}>Copier le prompt</button>
              {copied && <span className="ok-tag" role="status">Copié</span>}
            </div>
            <details className="prompt" ref={details}>
              <summary>Voir le prompt</summary>
              <pre ref={pre}>{prompt}</pre>
            </details>
          </div>
        </li>
        <li className="pstep">
          <span className="pstep-n" aria-hidden="true">二</span>
          <div className="pstep-b">
            <p><b>Envoie-le à ton IA avec tes photos</b> (Claude, ChatGPT, Gemini… celle que tu utilises déjà).</p>
            <ul className="tips">
              <li>Une photo par face de la fiche, à plat, bien éclairée.</li>
              <li>Pas de reflet sur le crayon, cadre la fiche entière.</li>
            </ul>
            <p className="privacy">Tes photos partent chez le service d'IA que tu choisis, pas dans le Carnet.</p>
          </div>
        </li>
        <li className={`pstep${reply?.ok ? " done" : ""}`}>
          <span className="pstep-n" aria-hidden="true">三</span>
          <div className="pstep-b">
            <p><b>Colle sa réponse ici</b> <span className="muted">(tout le texte, même s'il y a des phrases autour)</span></p>
            <textarea
              className="paste" aria-label="Réponse de l'IA" spellCheck={false} value={text}
              placeholder={'{ "schemaVersion": 2, "name": … }'}
              onChange={(e) => {
                setText(e.target.value);
                setReply(null);
              }}
            />
            <div className="row">
              <button type="button" className="btn" disabled={!text.trim()} onClick={check}>Vérifier</button>
            </div>
          </div>
        </li>
      </ol>
      {/* Repère du résultat ; pas d'enveloppe, pour que les boutons restent collés en bas de la fenêtre */}
      <div ref={result} />
      <ImportReview
        key={reply ? text : ""}
        parsed={parsed}
        onClose={onClose}
        notice={reply?.ok && review.length > 0 && (
          <section className="verify" aria-labelledby={`${titleId}-verify`}>
            <h3 id={`${titleId}-verify`}>À vérifier sur ta fiche ({review.length})</h3>
            <ul>
              {review.map((path) => (
                <li key={path}>
                  {reviewLabel(path, reply.json)} : <b>{show(valueAtPath(reply.json, path))}</b> <span className="muted">(<code>{path}</code>)</span>
                </li>
              ))}
            </ul>
            <p className="hint">L'IA a eu du mal à lire ces valeurs. Corrige-les dans la fiche après l'import si besoin.</p>
          </section>
        )}
      />
    </Modal>
  );
}
