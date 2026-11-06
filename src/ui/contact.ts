/**
 * Formulaire de contact (lot 56, annexe 56) : message privé à l'auteur via Web3Forms, sans serveur ni adresse
 * mail dans le code. Seul envoi de données du Carnet, déclenché par le joueur (§1). Jamais de donnée de fiche.
 */

/**
 * Clé d'accès Web3Forms, publique par conception : elle ne permet que d'envoyer vers l'adresse associée.
 * Tant qu'elle vaut « A_REMPLACER », le formulaire est désactivé. Procédure : annexe 56.4.
 */
export const CONTACT_CONFIG = {
  accessKey: "A_REMPLACER",
  endpoint: "https://api.web3forms.com/submit",
} as const;

export const CONTACT_LIMITS = {
  name: 80,
  messageMin: 10,
  messageMax: 3000,
  /** Délai minimum entre l'ouverture de la fenêtre et l'envoi. */
  minDelayMs: 3_000,
  /** Délai entre deux envois réussis, horodatage en sessionStorage. */
  cooldownMs: 60_000,
} as const;

export const CONTACT_SUBJECTS = ["question", "idea", "feedback", "other"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export interface ContactDraft {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  botcheck: boolean;
}

export const emptyDraft = (): ContactDraft => ({ name: "", email: "", subject: "question", message: "", botcheck: false });

export type ContactError = "messageEmpty" | "messageShort" | "messageLong" | "emailInvalid" | "nameLong";
export type ContactErrors = Partial<Record<"name" | "email" | "message", ContactError>>;

/** Forme simple : un @, un point dans le domaine, aucune espace. Le service refait sa propre vérification. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isConfigured(key: string = CONTACT_CONFIG.accessKey): boolean {
  return key.trim() !== "" && key !== "A_REMPLACER";
}

export function validateContact(d: ContactDraft): ContactErrors {
  const errors: ContactErrors = {};
  const message = d.message.trim();
  if (!message) errors.message = "messageEmpty";
  else if (message.length < CONTACT_LIMITS.messageMin) errors.message = "messageShort";
  else if (message.length > CONTACT_LIMITS.messageMax) errors.message = "messageLong";
  const email = d.email.trim();
  if (email && !EMAIL.test(email)) errors.email = "emailInvalid";
  if (d.name.trim().length > CONTACT_LIMITS.name) errors.name = "nameLong";
  return errors;
}

/**
 * Corps envoyé à Web3Forms : uniquement les champs du formulaire, la version et l'origine.
 * `subjectLabel` : catégorie dans la langue affichée.
 */
export function contactPayload(d: ContactDraft, subjectLabel: string, accessKey: string = CONTACT_CONFIG.accessKey, version: string = __APP_VERSION__) {
  return {
    access_key: accessKey,
    from_name: "Carnet de Rokugan",
    subject: `[Carnet] ${subjectLabel}`,
    name: d.name.trim(),
    email: d.email.trim(),
    message: d.message.trim(),
    app_version: version,
  };
}

export type SendResult = "ok" | "failed";

/** Envoi : `failed` sur erreur réseau, réponse illisible ou `success: false`. */
export async function sendContact(payload: ReturnType<typeof contactPayload>, fetcher: typeof fetch = fetch): Promise<SendResult> {
  try {
    const res = await fetcher(CONTACT_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      referrerPolicy: "no-referrer",
      credentials: "omit",
    });
    const json = (await res.json()) as { success?: unknown };
    return json.success === true ? "ok" : "failed";
  } catch {
    return "failed";
  }
}

const LAST_SENT = "carnet-contact-last";

/** Horodatage du dernier envoi réussi ; sessionStorage indisponible : pas de délai mémorisé. */
export function lastSent(): number {
  try {
    return Number(sessionStorage.getItem(LAST_SENT)) || 0;
  } catch {
    return 0;
  }
}

export function markSent(now: number): void {
  try {
    sessionStorage.setItem(LAST_SENT, String(now));
  } catch {
    // Stockage refusé : le délai de 60 s ne s'applique pas, sans gêner l'envoi.
  }
}

export type Gate = "ok" | "tooSoon" | "cooldown";

/** Anti-spam côté client : 3 s depuis l'ouverture, 60 s depuis le dernier envoi réussi. */
export function sendGate(openedAt: number, now: number, last: number = lastSent()): Gate {
  if (now - openedAt < CONTACT_LIMITS.minDelayMs) return "tooSoon";
  if (last && now - last < CONTACT_LIMITS.cooldownMs) return "cooldown";
  return "ok";
}
