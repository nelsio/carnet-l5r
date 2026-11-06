import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CARNET_LINKS } from "../../rules/links";
import { useT } from "../../i18n";
import {
  CONTACT_LIMITS, CONTACT_SUBJECTS, contactPayload, emptyDraft, isConfigured, markSent, sendContact, sendGate, validateContact,
  type ContactDraft, type ContactErrors, type ContactSubject,
} from "../contact";
import { ExternalLink } from "./ExternalLink";
import { Modal } from "./ImportReview";

/** Connexion du navigateur, suivie en direct (PWA installée hors ligne). */
function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

type Notice = "failed" | "tooSoon" | "cooldown" | null;

/**
 * Fenêtre « Contacter l'auteur » (lot 56, annexe 56) : message privé via Web3Forms. Le brouillon vit dans le pied
 * de page (`draft`) : il survit à la fermeture tant que la page n'est pas rechargée, et se vide après un envoi réussi.
 */
export function ContactDialog({ draft, onDraft, onClose, accessKey }: {
  draft: ContactDraft; onDraft: (d: ContactDraft) => void; onClose: () => void; accessKey?: string;
}) {
  const tc = useT();
  const t = tc.contact;
  const id = useId();
  const online = useOnline();
  const configured = isConfigured(accessKey);
  const [openedAt] = useState(Date.now);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const set = <K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) => {
    onDraft({ ...draft, [key]: value });
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
    setNotice(null);
  };

  const done = () => {
    onDraft(emptyDraft());
    setErrors({});
    setSent(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!configured || !online || sending) return;
    const found = validateContact(draft);
    setErrors(found);
    const first = (["name", "email", "message"] as const).find((k) => found[k]);
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    // Piège coché : un robot. Rien n'est envoyé, il voit un succès.
    if (draft.botcheck) return done();
    const now = Date.now();
    const gate = sendGate(openedAt, now);
    if (gate !== "ok") return setNotice(gate);
    setSending(true);
    setNotice(null);
    const result = await sendContact(contactPayload(draft, t.subjects[draft.subject], accessKey));
    setSending(false);
    if (result === "ok") {
      markSent(Date.now());
      done();
    } else {
      setNotice("failed");
    }
  };

  const titleId = `${id}-title`;
  const errId = (k: keyof ContactErrors) => `${id}-${k}-err`;
  const fieldErr = (k: keyof ContactErrors) => {
    const code = errors[k];
    return <p className="field-err" id={errId(k)} aria-live="polite">{code ? t.errors[code] : ""}</p>;
  };
  const described = (k: keyof ContactErrors, ...more: string[]) => [errors[k] ? errId(k) : "", ...more].filter(Boolean).join(" ") || undefined;
  const length = draft.message.trim().length;

  return (
    <Modal titleId={titleId} onClose={onClose}>
      <div className="contact-h">
        <h2 id={titleId}>{t.title}</h2>
        <button type="button" className="gp-x" aria-label={tc.common.close} onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </div>
      {sent ? (
        <div className="contact-done">
          <p role="status">{t.thanks}</p>
          <div className="modal-actions">
            <button type="button" className="btn accent" autoFocus onClick={onClose}>{tc.common.close}</button>
          </div>
        </div>
      ) : (
        <form className="contact" ref={form} noValidate onSubmit={(e) => void submit(e)}>
          {!configured && <p className="contact-note" role="status">{t.disabled}</p>}
          <fieldset disabled={!configured}>
            <label htmlFor={`${id}-name`}>{t.name} <span className="muted">({t.optional})</span></label>
            <input className="in" id={`${id}-name`} name="name" autoComplete="nickname" maxLength={CONTACT_LIMITS.name} value={draft.name}
              aria-invalid={!!errors.name} aria-describedby={described("name")} onChange={(e) => set("name", e.target.value)} />
            {fieldErr("name")}

            <label htmlFor={`${id}-email`}>{t.email} <span className="muted">({t.optional})</span></label>
            <input className="in" id={`${id}-email`} name="email" type="email" autoComplete="email" value={draft.email}
              aria-invalid={!!errors.email} aria-describedby={described("email", `${id}-email-hint`)} onChange={(e) => set("email", e.target.value)} />
            <p className="hint" id={`${id}-email-hint`}>{t.emailHint}</p>
            {fieldErr("email")}

            <label htmlFor={`${id}-subject`}>{t.subject}</label>
            <select className="in" id={`${id}-subject`} name="subject" value={draft.subject} onChange={(e) => set("subject", e.target.value as ContactSubject)}>
              {CONTACT_SUBJECTS.map((s) => <option key={s} value={s}>{t.subjects[s]}</option>)}
            </select>

            <label htmlFor={`${id}-message`}>{t.message}</label>
            <textarea className="in" id={`${id}-message`} name="message" rows={6} required value={draft.message}
              aria-invalid={!!errors.message} aria-describedby={described("message", `${id}-count`)} onChange={(e) => set("message", e.target.value)} />
            <p className={`hint count${length > CONTACT_LIMITS.messageMax ? " over" : ""}`} id={`${id}-count`}>{t.count(length, CONTACT_LIMITS.messageMax)}</p>
            {fieldErr("message")}

            {/* Piège à robots : masqué par du CSS, pas par display:none, hors tabulation (annexe 56.3). */}
            <input type="checkbox" name="botcheck" className="visually-hidden" tabIndex={-1} autoComplete="off" aria-hidden="true"
              checked={draft.botcheck} onChange={(e) => set("botcheck", e.target.checked)} />
          </fieldset>

          {configured && !online && <p className="contact-note" role="status">{t.offline}</p>}
          <p className="contact-note" role={notice === "failed" ? "alert" : "status"}>{notice ? t[notice] : ""}</p>

          <div className="contact-send">
            <button type="submit" className="btn accent" disabled={!configured || !online || sending}>{sending ? t.sending : t.send}</button>
            <p className="contact-bug">{t.bugBefore}<ExternalLink href={CARNET_LINKS.bug}>{t.bugLink}</ExternalLink></p>
          </div>
          <p className="privacy">{t.privacy}</p>
        </form>
      )}
    </Modal>
  );
}
