/**
 * Lot 56, v2.32.0 (HANDOFF annexe 56) : formulaire « Contacter l'auteur », cas C1 à C11.
 * `fetch` est toujours simulé : aucun appel réseau réel. C12 (vrai navigateur, mobile) : tests/e2e/contact.spec.ts.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { CARNET_LINKS } from "../../src/rules/links";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import {
  CONTACT_CONFIG, contactPayload, emptyDraft, isConfigured, lastSent, markSent, sendContact, sendGate, validateContact,
} from "../../src/ui/contact";
import pkg from "../../package.json";
import kakita from "../fixtures/kakita-v1.json";

const config = CONTACT_CONFIG as { accessKey: string };
const SHIPPED = CONTACT_CONFIG.accessKey;
const KEY = "cle-de-test";
const MESSAGE = "Bonjour, une question sur les écoles.";

let clock = 1_000_000;
let fetchMock: ReturnType<typeof vi.fn>;

const answer = (success: boolean) => vi.fn(async () => ({ json: async () => ({ success, message: "" }) }));

beforeEach(() => {
  config.accessKey = KEY;
  clock = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => clock);
  fetchMock = answer(true);
  vi.stubGlobal("fetch", fetchMock);
  sessionStorage.clear();
});

afterEach(() => {
  config.accessKey = SHIPPED;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (navigator as { onLine?: boolean }).onLine;
});

async function renderApp(character: Character | null = structuredClone(kakita) as Character) {
  const storage = memoryStorage();
  if (character) await storage.library.put({ id: "a", character, mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={() => 5} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
}

const contactBtn = () => within(screen.getByRole("contentinfo")).getByRole("button", { name: "Contact" });
const dialog = () => screen.getByRole("dialog", { name: "Contacter l'auteur" });
const sendBtn = () => within(dialog()).getByRole("button", { name: "Envoyer" });
const message = () => within(dialog()).getByLabelText("Message");

function open() {
  fireEvent.click(contactBtn());
  return dialog();
}

function type(label: string | RegExp, value: string) {
  fireEvent.change(within(dialog()).getByLabelText(label), { target: { value } });
}

/** Ouvre, saisit, attend 3 s et envoie. */
async function openAndSend(text = MESSAGE) {
  open();
  type("Message", text);
  clock += 3_000;
  fireEvent.click(sendBtn());
}

describe("C1 : point d'entrée et clé non renseignée", () => {
  it("bouton Contact dans le pied de page, entre Guide et Signaler un bug", async () => {
    await renderApp(null);
    const nav = within(screen.getByRole("navigation", { name: "Liens du Carnet" }));
    expect(nav.getAllByRole("link").map((a) => a.textContent)).toEqual(["Guide", "Signaler un bug", "Projet"]);
    expect(contactBtn().previousElementSibling).toHaveTextContent("Guide");
    expect(contactBtn().nextElementSibling).toHaveTextContent("Signaler un bug");
    expect(contactBtn()).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("clé « A_REMPLACER » : formulaire désactivé, message neutre, aucun envoi", async () => {
    config.accessKey = "A_REMPLACER";
    await renderApp();
    open();
    expect(within(dialog()).getByText("Le formulaire de contact n'est pas encore disponible.")).toHaveAttribute("role", "status");
    expect(message()).toBeDisabled();
    expect(sendBtn()).toBeDisabled();
    fireEvent.submit(dialog().querySelector("form")!);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("isConfigured : vide ou valeur par défaut refusés", () => {
    expect(isConfigured("A_REMPLACER")).toBe(false);
    expect(isConfigured("  ")).toBe(false);
    expect(isConfigured(KEY)).toBe(true);
  });

  it("v2.32.1 : clé livrée renseignée (annexe 56.7)", () => {
    expect(SHIPPED).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(isConfigured(SHIPPED)).toBe(true);
  });
});

describe("C2 : validation avant l'envoi", () => {
  it("règles de validateContact", () => {
    const d = (over: Partial<ReturnType<typeof emptyDraft>>) => ({ ...emptyDraft(), ...over });
    expect(validateContact(d({}))).toEqual({ message: "messageEmpty" });
    expect(validateContact(d({ message: "   " }))).toEqual({ message: "messageEmpty" });
    expect(validateContact(d({ message: "court" }))).toEqual({ message: "messageShort" });
    expect(validateContact(d({ message: "x".repeat(10) }))).toEqual({});
    expect(validateContact(d({ message: "x".repeat(3000) }))).toEqual({});
    expect(validateContact(d({ message: "x".repeat(3001) }))).toEqual({ message: "messageLong" });
    expect(validateContact(d({ message: MESSAGE, email: "pas-une-adresse" }))).toEqual({ email: "emailInvalid" });
    expect(validateContact(d({ message: MESSAGE, email: "a@b.fr" }))).toEqual({});
    expect(validateContact(d({ message: MESSAGE, name: "n".repeat(81) }))).toEqual({ name: "nameLong" });
  });

  it.each([
    ["", "Écris ton message."],
    ["court", "Message trop court : 10 caractères au moins."],
    ["x".repeat(3001), "Message trop long : 3000 caractères au plus."],
  ])("message %#", async (text, error) => {
    await renderApp();
    await openAndSend(text);
    expect(within(dialog()).getByText(error)).toHaveAttribute("aria-live", "polite");
    expect(message()).toHaveAttribute("aria-invalid", "true");
    expect(message()).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("email invalide : erreur sous le champ, annoncée", async () => {
    await renderApp();
    open();
    type(/^Email pour te répondre/, "nelson@");
    type("Message", MESSAGE);
    clock += 3_000;
    fireEvent.click(sendBtn());
    const email = within(dialog()).getByLabelText(/^Email pour te répondre/);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(/Adresse email invalide\..*Sans email, je ne pourrai pas te répondre\./);
    expect(fetchMock).not.toHaveBeenCalled();
    // Corriger le champ efface son erreur.
    type(/^Email pour te répondre/, "nelson@exemple.fr");
    expect(within(dialog()).queryByText("Adresse email invalide.")).toBeNull();
  });

  it("compteur de caractères", async () => {
    await renderApp();
    open();
    expect(within(dialog()).getByText("0 / 3000")).toBeInTheDocument();
    type("Message", MESSAGE);
    expect(within(dialog()).getByText(`${MESSAGE.length} / 3000`)).toBeInTheDocument();
    expect(message()).toHaveAccessibleDescription(`${MESSAGE.length} / 3000`);
  });
});

describe("C3 : piège à robots", () => {
  it("case botcheck masquée par du CSS, hors tabulation", async () => {
    await renderApp();
    open();
    const trap = dialog().querySelector<HTMLInputElement>('input[name="botcheck"]')!;
    expect(trap).toHaveAttribute("type", "checkbox");
    expect(trap).toHaveClass("visually-hidden");
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap).toHaveAttribute("autocomplete", "off");
    expect(trap.style.display).toBe("");
  });

  it("cochée : aucun fetch, succès affiché", async () => {
    await renderApp();
    open();
    type("Message", MESSAGE);
    fireEvent.click(dialog().querySelector('input[name="botcheck"]')!);
    fireEvent.click(sendBtn());
    expect(await within(dialog()).findByText("Merci ! Message envoyé.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("C4 : délais anti-spam", () => {
  it("sendGate : 3 s depuis l'ouverture, 60 s depuis le dernier envoi", () => {
    expect(sendGate(0, 2_999, 0)).toBe("tooSoon");
    expect(sendGate(0, 3_000, 0)).toBe("ok");
    expect(sendGate(0, 70_000, 20_000)).toBe("cooldown");
    expect(sendGate(0, 80_000, 20_000)).toBe("ok");
  });

  it("envoi avant 3 s : refusé avec un message, puis accepté", async () => {
    await renderApp();
    open();
    type("Message", MESSAGE);
    clock += 2_000;
    fireEvent.click(sendBtn());
    expect(within(dialog()).getByText("Un instant : réessaie dans quelques secondes.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    clock += 1_000;
    fireEvent.click(sendBtn());
    expect(await within(dialog()).findByText("Merci ! Message envoyé.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deuxième envoi avant 60 s : refusé ; après 60 s : accepté", async () => {
    await renderApp();
    await openAndSend();
    await within(dialog()).findByText("Merci ! Message envoyé.");
    expect(lastSent()).toBe(clock);
    fireEvent.click(within(dialog()).getAllByRole("button", { name: "Fermer" }).at(-1)!);
    clock += 10_000;
    await openAndSend();
    expect(within(dialog()).getByText("Message déjà envoyé : attends une minute avant le suivant.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    clock += 50_000;
    fireEvent.click(sendBtn());
    expect(await within(dialog()).findByText("Merci ! Message envoyé.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sessionStorage indisponible : pas de délai mémorisé, sans erreur", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("refusé"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("refusé"); });
    expect(() => markSent(5)).not.toThrow();
    expect(lastSent()).toBe(0);
  });
});

describe("C5 : succès", () => {
  it("bouton « Envoi… » pendant l'envoi, puis remerciement et formulaire réinitialisé", async () => {
    let resolve!: (v: unknown) => void;
    fetchMock.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    await renderApp();
    await openAndSend();
    const busy = within(dialog()).getByRole("button", { name: "Envoi…" });
    expect(busy).toBeDisabled();
    await act(async () => resolve({ json: async () => ({ success: true }) }));
    expect(within(dialog()).getByRole("status")).toHaveTextContent("Merci ! Message envoyé.");
    // Deux « Fermer » : la croix du titre, puis le bouton sous le remerciement, qui prend le focus.
    const close = within(dialog()).getAllByRole("button", { name: "Fermer" }).at(-1)!;
    expect(close).toHaveClass("btn");
    expect(close).toHaveFocus();
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
    open();
    expect(message()).toHaveValue("");
  });
});

describe("C6 : échec", () => {
  it.each([
    ["success: false", () => answer(false)],
    ["erreur réseau", () => vi.fn(async () => { throw new TypeError("Failed to fetch"); })],
    ["réponse illisible", () => vi.fn(async () => ({ json: async () => { throw new SyntaxError("JSON"); } }))],
  ])("%s : texte conservé, message d'erreur", async (_, make) => {
    vi.stubGlobal("fetch", make());
    await renderApp();
    await openAndSend();
    expect(await within(dialog()).findByRole("alert")).toHaveTextContent("Échec de l'envoi, réessaie plus tard.");
    expect(message()).toHaveValue(MESSAGE);
    expect(sendBtn()).toBeEnabled();
    expect(lastSent()).toBe(0);
  });
});

describe("C7 : hors ligne", () => {
  it("bouton désactivé et message ; retour en ligne : bouton réactivé", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false });
    await renderApp();
    open();
    type("Message", MESSAGE);
    expect(within(dialog()).getByText("Hors ligne : l'envoi sera possible une fois reconnecté.")).toBeInTheDocument();
    expect(sendBtn()).toBeDisabled();
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true });
    act(() => { window.dispatchEvent(new Event("online")); });
    expect(sendBtn()).toBeEnabled();
    expect(within(dialog()).queryByText(/Hors ligne/)).toBeNull();
  });
});

describe("C8 : contenu envoyé", () => {
  it("champs du formulaire, version et origine seulement : aucune donnée de fiche", async () => {
    await renderApp();
    await screen.findByRole("heading", { level: 1, name: /Kakita/ });
    open();
    type(/^Nom ou pseudo/, "  Nelson ");
    type(/^Email pour te répondre/, "nelson@exemple.fr");
    fireEvent.change(within(dialog()).getByLabelText("Sujet"), { target: { value: "idea" } });
    type("Message", MESSAGE);
    clock += 3_000;
    fireEvent.click(sendBtn());
    await within(dialog()).findByText("Merci ! Message envoyé.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.web3forms.com/submit");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(init.referrerPolicy).toBe("no-referrer");
    expect(JSON.parse(init.body as string)).toEqual({
      access_key: KEY,
      from_name: "Carnet de Rokugan",
      subject: "[Carnet] Idée/suggestion",
      name: "Nelson",
      email: "nelson@exemple.fr",
      message: MESSAGE,
      app_version: pkg.version,
    });
    expect(init.body).not.toMatch(/Kakita|Haruto|Grue|schemaVersion|botcheck/);
  });

  it("contactPayload : catégorie dans la langue affichée", () => {
    const p = contactPayload({ ...emptyDraft(), message: MESSAGE }, "Feedback", "k", "9.9.9");
    expect(p.subject).toBe("[Carnet] Feedback");
    expect(p.app_version).toBe("9.9.9");
  });

  it("sendContact : success true seulement", async () => {
    const payload = contactPayload({ ...emptyDraft(), message: MESSAGE }, "Autre", "k");
    expect(await sendContact(payload, answer(true) as unknown as typeof fetch)).toBe("ok");
    expect(await sendContact(payload, vi.fn(async () => ({ json: async () => ({ success: "true" }) })) as unknown as typeof fetch)).toBe("failed");
  });
});

describe("C9 : accessibilité", () => {
  it("libellés associés aux champs", async () => {
    await renderApp();
    open();
    const d = within(dialog());
    expect(d.getByRole("textbox", { name: "Nom ou pseudo (facultatif)" })).toHaveAttribute("maxlength", "80");
    expect(d.getByRole("textbox", { name: "Email pour te répondre (facultatif)" })).toHaveAttribute("type", "email");
    expect(d.getByRole("combobox", { name: "Sujet" }).querySelectorAll("option")).toHaveLength(4);
    expect(d.getAllByRole("option").map((o) => o.textContent)).toEqual(["Question", "Idée/suggestion", "Retour d'expérience", "Autre"]);
    expect(d.getByRole("textbox", { name: "Message" })).toBeRequired();
  });

  it("focus dans la fenêtre à l'ouverture, piégé au clavier, rendu au bouton Contact", async () => {
    await renderApp();
    contactBtn().focus();
    open();
    const close = within(dialog()).getByRole("button", { name: "Fermer" });
    expect(close).toHaveFocus();
    // Shift+Tab sur le premier élément : retour au dernier (lien GitHub), puis Tab : retour au premier.
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    const bug = within(dialog()).getByRole("link", { name: "Signaler sur GitHub" });
    expect(bug).toHaveFocus();
    fireEvent.keyDown(bug, { key: "Tab" });
    expect(close).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(contactBtn()).toHaveFocus();
  });

  it("fermeture par ×, par clic sur le fond", async () => {
    await renderApp();
    open();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    open();
    fireEvent.click(dialog().parentElement!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("C10 : brouillon", () => {
  it("fermer puis rouvrir sans envoyer : texte conservé", async () => {
    await renderApp();
    open();
    type("Message", MESSAGE);
    fireEvent.keyDown(document, { key: "Escape" });
    open();
    expect(message()).toHaveValue(MESSAGE);
  });
});

describe("C11 : liens et mentions", () => {
  it("« Un bug ? → Signaler sur GitHub » vers les Issues, mention Web3Forms", async () => {
    await renderApp();
    open();
    const bug = within(dialog()).getByRole("link", { name: "Signaler sur GitHub" });
    expect(bug).toHaveAttribute("href", CARNET_LINKS.bug);
    expect(bug).toHaveAttribute("target", "_blank");
    expect(bug.closest("p")).toHaveTextContent("Un bug ? → Signaler sur GitHub");
    expect(dialog()).toHaveTextContent("Ton message est transmis par mail via le service Web3Forms. Rien n'est stocké dans le Carnet.");
    expect(dialog()).toHaveTextContent("Sans email, je ne pourrai pas te répondre.");
  });

  it("aucune adresse mail dans le code du Carnet", () => {
    expect(JSON.stringify(CONTACT_CONFIG)).not.toMatch(/@/);
  });
});
