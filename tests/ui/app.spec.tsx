import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Character } from "@carnet/core";
import { memoryStorage, type LibraryEntry } from "../../src/storage";
import { App } from "../../src/ui/App";
import kakita from "../fixtures/kakita-v1.json";
import { chooseStance, currentStance, stanceSelect } from "../helpers/stance";
import { clickWounds, woundsField } from "../helpers/wounds";
import { VIEW } from "../helpers/views";

const base = () => structuredClone(kakita) as Character;
const always = (v: number) => () => v;
const root = document.documentElement;

/** Rend l'application sur un stockage en mémoire, avec la fiche ouverte s'il y en a une. */
async function renderApp(character: Character | null = base(), rng = always(5), mode: LibraryEntry["mode"] = "edit") {
  const storage = memoryStorage();
  if (character) {
    await storage.library.put({ id: "kakita", character, mode, updatedAt: "2026-10-18T10:00:00.000Z" });
  }
  const view = render(<App storage={storage} rng={rng} />);
  await screen.findByRole("contentinfo");
  await (character ? screen.findByRole("heading", { level: 1, name: new RegExp(character.name.slice(0, 5)) }) : screen.findByRole("button", { name: "Nouvelle fiche vierge" }));
  return { ...view, storage };
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
/** Le lanceur de dés est affiché par défaut (annexe J.7) : bouton « Lancer » présent. */
const goToAid = () => click(VIEW.aid);
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const chance = () => Number(screen.getByTestId("chance").textContent?.replace(/\D/g, ""));

beforeEach(() => {
  root.removeAttribute("data-theme");
  root.removeAttribute("style");
});

describe("Socle", () => {
  it("affiche la version en pied de page", async () => {
    await renderApp(null);
    expect(within(screen.getByRole("contentinfo")).getByRole("link", { name: /^Version / })).toHaveTextContent(`v${__APP_VERSION__}`);
  });
  it("sans fiche : crée un personnage et passe en modification", async () => {
    await renderApp(null);
    click("Nouvelle fiche vierge");
    expect(await screen.findByRole("heading", { level: 1, name: "Nouveau samouraï" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terminer : Identité & réputation" })).toBeInTheDocument();
  });
  it("le thème passe d'auto à clair, sombre, puis auto", async () => {
    await renderApp();
    click("Thème : auto");
    expect(root.dataset.theme).toBe("light");
    click("Thème : clair");
    expect(root.dataset.theme).toBe("dark");
    click("Thème : sombre");
    expect(root.hasAttribute("data-theme")).toBe(false);
  });
});

describe("Fiche", () => {
  it("affiche l'en-tête : clan, nom, école affichée et rang d'école (E.19 S8)", async () => {
    await renderApp();
    expect(screen.getByText("Clan de la Grue")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeInTheDocument();
    expect(screen.getByText("École de duellistes Kakita · Rang 1")).toBeInTheDocument();
  });

  it("U2 : modifier un trait met à jour les réserves des compétences liées", async () => {
    await renderApp();
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("5g3");
    click("Edit : Anneaux & Traits");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Agilité" }), { target: { value: "4" } });
    click("Terminer : Anneaux & Traits");
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("6g4");
    expect(screen.getByTestId("skill-pool-Équitation")).toHaveTextContent("5g4");
    expect(screen.getByTestId("skill-pool-Iaijutsu")).toHaveTextContent("6g3");
  });

  it("U3 : clan « Scorpion » puis « crane » : accent rouge, puis bleu ciel", async () => {
    await renderApp();
    click("Edit : Identité & réputation");
    const clan = screen.getByRole("combobox", { name: "Clan" });
    fireEvent.change(clan, { target: { value: "Scorpion" } });
    expect(root.style.getPropertyValue("--clan-l")).toBe("#a82828");
    expect(root.style.getPropertyValue("--clan-ink-l")).toBe("#7b2d26");
    expect(root.style.getPropertyValue("--clan-d")).toBe("#f07a7a");
    expect(root.style.getPropertyValue("--clan-ink-d")).toBe("#f1918e");
    fireEvent.change(clan, { target: { value: "crane" } });
    expect(root.style.getPropertyValue("--clan-l")).toBe("#2f7fb5");
    expect(screen.getByText("Clan de la Grue")).toBeInTheDocument();
    fireEvent.change(clan, { target: { value: "Ronin" } });
    for (const v of ["--clan-l", "--clan-ink-l", "--clan-d", "--clan-ink-d"]) expect(root.style.getPropertyValue(v)).toBe("");
  });

  it("U4 : un texte saisi n'est jamais interprété comme du HTML", async () => {
    const evil = "<img src=x onerror=alert(1)>";
    const { container } = await renderApp();
    click("Edit : Identité & réputation");
    click("Edit : Avantages, désavantages, notes");
    fireEvent.change(screen.getByRole("textbox", { name: "Notes de campagne" }), { target: { value: evil } });
    fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: evil } });
    click("Terminer : Identité & réputation");
    click("Terminer : Avantages, désavantages, notes");
    expect(screen.getByText(evil, { selector: ".prose" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(evil);
    expect(container.querySelector("img")).toBeNull();
  });

  it("ajoute et retire une compétence ; plus d'encadré Manœuvres sur la fiche", async () => {
    await renderApp();
    click("Edit : Compétences");
    click("+ Compétence");
    const names = screen.getAllByRole("textbox", { name: "Nom de la compétence" });
    fireEvent.change(names.at(-1)!, { target: { value: "Kyujutsu" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Spécialisations de Kyujutsu" }), { target: { value: "Yumi, Daikyu" } });
    expect(screen.queryByRole("heading", { name: "Manœuvres" })).toBeNull();
    expect(screen.queryByRole("spinbutton", { name: "Coût de Feinte" })).toBeNull();
    click("Terminer : Compétences");
    expect(screen.getByTestId("skill-pool-Kyujutsu")).toHaveTextContent("4g3");
    expect(screen.getByText("Daikyu")).toBeInTheDocument();
    click("Edit : Compétences");
    click("Supprimer Kyujutsu");
    click("Terminer : Compétences");
    expect(screen.queryByTestId("skill-pool-Kyujutsu")).toBeNull();
  });

  it("barre d'état : blessures, pénalité et points de Vide", async () => {
    await renderApp();
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    fireEvent.change(woundsField(), { target: { value: "11" } });
    expect(screen.getByRole("button", { name: /Égratigné/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("+3", { selector: ".pen b" })).toBeInTheDocument();
    clickWounds("Retirer 1 blessure");
    expect(woundsField()).toHaveValue(10);
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
    click("Point de Vide 2");
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
  });
});

describe("Assistant L5R", () => {
  it("Déplacement : encart en tête, en pieds et en mètres", async () => {
    await renderApp();
    goToAid();
    click("Déplacement");
    expect(screen.getByRole("heading", { name: "Se déplacer en combat" })).toBeInTheDocument();
    expect(screen.getByText("10 pi")).toBeInTheDocument();
    expect(screen.queryByText(/^3,0 m/)).toBeNull();
    click("Afficher le détail : Se déplacer en combat");
    expect(screen.getByText(/^3,0 m/)).toBeInTheDocument();
    expect(screen.getByText(/^12,2 m/)).toBeInTheDocument();
  });

  it("E6 : Initiative en tête ; Assaut fait passer le ND d'armure de 20 à 10 ; « Nouveau round » garde l'initiative", async () => {
    await renderApp(base(), always(5));
    goToAid();
    click("Combat");
    const cards = screen.getAllByRole("button").filter((b) => b.classList.contains("act"));
    expect(cards[0]).toHaveTextContent("Initiative");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    chooseStance("Assaut");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("10");
    fireEvent.click(cards[0]!);
    click("Lancer 4g3");
    expect(screen.getByTestId("initiative")).toHaveTextContent("15");
    click("Nouveau round");
    expect(screen.getByTestId("initiative")).toHaveTextContent("15");
  });

  it("« Nouveau round » entre l'initiative et la posture, avec sa description ; aussi en Duel", async () => {
    await renderApp();
    goToAid();
    click("Combat");
    const round = screen.getByRole("button", { name: "Nouveau round" });
    const initiative = screen.getByTestId("initiative");
    const stance = stanceSelect();
    const follows = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(initiative, round)).toBe(true);
    expect(follows(round, stance)).toBe(true);
    expect(screen.getByTestId("round-desc")).toHaveTextContent("garde l'initiative et les compteurs");
    // Plus dans le panneau Vide.
    const voidPanel = screen.getByRole("group", { name: "Dépenser du Vide" });
    expect(within(voidPanel as HTMLElement).queryByRole("button", { name: "Nouveau round" })).toBeNull();
    click("Duel iaijutsu");
    expect(screen.getByRole("button", { name: "Nouveau round" })).toBeInTheDocument();
  });

  it("E7 : attaque réussie avec 2 « Augmentation des dégâts » → dégâts pré-remplis à +2 dés", async () => {
    await renderApp(base(), always(9));
    goToAid();
    click("Combat");
    click(/^Attaque · Katana/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "10" } });
    click("Ajouter Augmentation des dégâts");
    click("Ajouter Augmentation des dégâts");
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
    click("Lancer 5g3");
    expect(roller().getByText(/Réussite/, { selector: ".verdict" })).toHaveTextContent("27 / 20");
    expect(screen.getByText("+2g0 en attente")).toBeInTheDocument();
    click(/^Dégâts · Katana/);
    expect(screen.getByTestId("pool")).toHaveTextContent("7g2");
    expect(screen.queryByText("+2g0 en attente")).toBeNull();
  });

  it("E11 : Kenjutsu 7 → note de maîtrise, 6g2 (Kenjutsu 3 : +1g0) ; un 9 en dégâts est relancé (9 + 4 = 13)", async () => {
    const c = base();
    c.skills.find((s) => s.name === "Kenjutsu")!.rank = 7;
    c.weapons[0]!.skill = "  kenjutsu ";
    const faces = [9, 4];
    await renderApp(c, () => faces.shift() ?? 5);
    goToAid();
    click("Combat");
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("mastery")).toHaveTextContent("Maîtrise Kenjutsu 7 : les dés explosent sur 9 et 10");
    expect(roller().getByTitle("Explose sur 9")).toHaveTextContent("9+");
    click("Lancer 6g2");
    const die = roller().getByTitle("9 + 4");
    expect(die).toHaveTextContent(/^13/);
    expect(within(die).getByText("9+4")).toBeInTheDocument();
  });

  it("E12 : le « i » de Déplacement déplie ses descriptions, sans rien sélectionner (le panneau Vide n'a plus de « i », J.6)", async () => {
    await renderApp();
    goToAid();
    click("Combat");
    expect(screen.queryByRole("button", { name: /le détail : Dépenser du Vide/ })).toBeNull();
    click("Déplacement");
    expect(screen.queryByText(/^3,0 m/)).toBeNull();
    click("Afficher le détail : Se déplacer en combat");
    expect(screen.getByText(/^3,0 m/)).toBeInTheDocument();
    click("Masquer le détail : Se déplacer en combat");
    expect(screen.queryByText(/^3,0 m/)).toBeNull();
  });

  it("Q10 : panneau Vide en menu déroulant ; choisir ne dépense rien ; « Dépenser » puis « Annuler » (J.6)", async () => {
    await renderApp();
    goToAid();
    click("Combat");
    const panel = within(screen.getByRole("group", { name: "Dépenser du Vide" }));
    const menu = panel.getByRole("combobox", { name: "Dépense de Vide" });
    expect(menu).toHaveValue("roll");
    expect(panel.getByTestId("void-desc")).toHaveTextContent("+1g1Dépensé au prochain jet lancé.");
    fireEvent.change(menu, { target: { value: "armor" } });
    expect(panel.getByTestId("void-desc")).toHaveTextContent("Jusqu'au prochain round.");
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    fireEvent.change(menu, { target: { value: "roll" } });
    fireEvent.click(panel.getByRole("button", { name: "Dépenser 1 point de Vide" }));
    expect(panel.getByTestId("void-active")).toHaveTextContent("+1g1 au jet");
    click(/^Attaque · Katana/);
    expect(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ })).toBeChecked();
    fireEvent.click(panel.getByRole("button", { name: "Annuler" }));
    expect(panel.queryByTestId("void-active")).toBeNull();
    expect(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide/ })).not.toBeChecked();
  });

  it("Q11 : hors escarmouche (duel), pas d'Initiative ni d'Échanger ; le choix revient à « Au jet »", async () => {
    await renderApp();
    goToAid();
    click("Combat");
    const menu = () => screen.getByRole("combobox", { name: "Dépense de Vide" });
    const values = () => [...menu().querySelectorAll("option")].map((o) => o.getAttribute("value"));
    expect(values()).toEqual(["roll", "armor", "skill", "ability", "initiative", "swap"]);
    fireEvent.change(menu(), { target: { value: "swap" } });
    click("Duel iaijutsu");
    expect(values()).toEqual(["roll", "armor", "skill", "ability"]);
    expect(menu()).toHaveValue("roll");
  });

  it("E13 : dégâts au katana : options sur une ligne, règle d'explosion, puis maîtrise", async () => {
    const c = base();
    await renderApp(c);
    goToAid();
    click("Combat");
    click(/^Dégâts · Katana/);
    // Q16 : plus de champ « Dés lancés ± » ; « Bonus fixe » seul sur sa ligne (J.9).
    const fields = [...roller().getByText("Bonus fixe").closest(".opts")!.children];
    expect(fields.map((f) => f.textContent)).toEqual(["Bonus fixe"]);
    expect(roller().queryByText("Dés lancés ±")).toBeNull();
    expect(roller().getByTestId("manual")).toHaveTextContent("Les 10 explosent : relance le dé et additionne, tant qu'il retombe sur 10.");
    expect(roller().queryByText(/^Lance /)).toBeNull();
    fireEvent.change(roller().getByRole("spinbutton", { name: "Bonus fixe" }), { target: { value: "2" } });
    expect(roller().getByTestId("manual")).toHaveTextContent("Ajoute +2 au total.");
  });

  it("E13 : avec Kenjutsu 7, « Les 9 et 10 explosent » ; sans compétence, aucun dé n'explose", async () => {
    const c = base();
    c.skills.find((s) => s.name === "Kenjutsu")!.rank = 7;
    await renderApp(c);
    goToAid();
    click("Combat");
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("manual")).toHaveTextContent("Les 9 et 10 explosent : relance le dé et additionne, tant qu'il retombe sur 9 ou 10.");
    click("Escarmouche");
    click(/^Lutte/);
    expect(roller().getByTestId("manual")).toHaveTextContent("Aucun dé n'explose (compétence non maîtrisée).");
    // ND sans augmentations : ND et Bonus fixe côte à côte, sans case vide (J.9).
    const cells = [...roller().getByText("Bonus fixe").closest(".opts")!.children];
    expect(cells.map((f) => f.textContent)).toEqual(["ND d'armure cible", "Bonus fixe"]);
  });

  it("E14 : la tuile ND armure ouvre l'éditeur d'armure ; bonus et réduction mis à jour", async () => {
    const c = base();
    c.traits.reflexes = 2;
    c.armor = { name: "", bonus: 0, reduction: 0 };
    const { storage } = await renderApp(c);
    expect(screen.queryByRole("group", { name: "Armure" })).toBeNull();
    fireEvent.click(screen.getByTestId("armor-tn").closest("button")!);
    const editor = within(screen.getByRole("group", { name: "Armure" }));
    expect(screen.getByTestId("armor-tn").closest("button")).toHaveAttribute("aria-expanded", "true");
    fireEvent.change(editor.getByRole("textbox", { name: "Nom" }), { target: { value: "Armure légère" } });
    fireEvent.change(editor.getByRole("spinbutton", { name: "Bonus au ND" }), { target: { value: "5" } });
    fireEvent.change(editor.getByRole("spinbutton", { name: "Réduction" }), { target: { value: "3" } });
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    expect(screen.getByTestId("armor-reduction")).toHaveTextContent("3");
    expect(editor.getByText(/ND d'armure = 5 × Réflexes 2 \+ 5 \+ bonus 5/)).toHaveTextContent("= 20");
    fireEvent.click(editor.getByRole("button", { name: "Fermer" }));
    expect(screen.queryByRole("group", { name: "Armure" })).toBeNull();
    await vi.waitFor(async () => expect((await storage.library.get("kakita"))?.character.armor).toEqual({ name: "Armure légère", bonus: 5, reduction: 3 }));
  });

  it("E15 / Q12 : lanceur de dés affiché par défaut, masqué partout sur demande, mémorisé (J.7)", async () => {
    const { storage } = await renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    const toggle = screen.getByRole("button", { name: "Lanceur de dés : affiché" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    click("Lancer 3g2");
    expect(roller().getByText("Derniers jets")).toBeInTheDocument();
    click("Combat");
    click(/^Attaque · Katana/);
    expect(roller().getByRole("button", { name: "Lancer 5g3" })).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Lanceur de dés : masqué" })).toHaveAttribute("aria-pressed", "false");
    expect(roller().queryByRole("button", { name: /^Lancer/ })).toBeNull();
    expect(roller().queryByText("Derniers jets")).toBeNull();
    expect(screen.getByTestId("final-tn")).toBeInTheDocument();
    await vi.waitFor(async () => expect(await storage.prefs.get()).toMatchObject({ diceRoller: false }));
    expect("showDiceRoller" in (await storage.prefs.get())).toBe(false);
  });

  it("Q13 : préférences v2.16.0 avec showDiceRoller: false → lanceur affiché ; masqué puis rechargé, reste masqué", async () => {
    const storage = memoryStorage();
    await storage.library.put({ id: "kakita", character: base(), mode: "edit", updatedAt: "2026-10-18T10:00:00.000Z" });
    await storage.prefs.set({ showDiceRoller: false });
    const first = render(<App storage={storage} rng={always(5)} />);
    fireEvent.click(await screen.findByRole("button", { name: "Lanceur de dés : affiché" }));
    await vi.waitFor(async () => expect(await storage.prefs.get()).toMatchObject({ diceRoller: false }));
    expect("showDiceRoller" in (await storage.prefs.get())).toBe(false);
    first.unmount();
    render(<App storage={storage} rng={always(5)} />);
    expect(await screen.findByRole("button", { name: "Lanceur de dés : masqué" })).toHaveAttribute("aria-pressed", "false");
  });

  it("Q17 : attaque réussie avec 2 augmentations de dégâts → étiquette « +2g0 · augmentations de l'attaque », « Retirer » (J.9)", async () => {
    await renderApp(base(), always(9));
    goToAid();
    click("Combat");
    click(/^Attaque · Katana/);
    fireEvent.change(roller().getByRole("spinbutton", { name: "ND d'armure cible" }), { target: { value: "10" } });
    click("Ajouter Augmentation des dégâts");
    click("Ajouter Augmentation des dégâts");
    click("Lancer 5g3");
    click(/^Dégâts · Katana/);
    expect(roller().getByTestId("pool")).toHaveTextContent("7g2");
    expect(roller().getByTestId("attack-raises")).toHaveTextContent("+2g0 · augmentations de l'attaque");
    fireEvent.click(roller().getByRole("button", { name: "Retirer" }));
    expect(roller().queryByTestId("attack-raises")).toBeNull();
    expect(roller().getByTestId("pool")).toHaveTextContent("5g2");
  });

  it("E10 : ajouter une augmentation monte le ND final de 5 et baisse la chance de réussite", async () => {
    await renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("15");
    const before = chance();
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augmentations" }), { target: { value: "1" } });
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
    expect(chance()).toBeLessThan(before);
  });

  it("spécialisation choisie automatiquement quand elle correspond à l'action", async () => {
    await renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    expect(roller().getByRole("combobox", { name: /Spécialisation/ })).toHaveValue("Remarquer");
    expect(screen.getByTestId("manual")).toHaveTextContent("relance une fois chaque 1");
    click(/^Fouiller un lieu/);
    expect(roller().getByRole("combobox", { name: /Spécialisation/ })).toHaveValue("");
    expect(screen.getByTestId("manual")).not.toHaveTextContent("relance une fois chaque 1");
  });

  it("compétence sans spécialisation : la case « Spécialisation » reste proposée", async () => {
    await renderApp();
    goToAid();
    click(/^Obtenir des informations en cour/);
    expect(roller().getByRole("checkbox", { name: /Spécialisation/ })).not.toBeChecked();
  });

  it("dépenser un point de Vide au jet le décompte, une seule fois", async () => {
    await renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide \(\+1g1\)/ }));
    expect(screen.getByTestId("pool")).toHaveTextContent("4g3");
    click("Lancer 4g3");
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
    expect(screen.getByTestId("pool")).toHaveTextContent("3g2");
  });

  it("Défense totale lancée : posture et ND d'armure mis à jour", async () => {
    await renderApp(base(), always(5));
    goToAid();
    click("Combat");
    click(/^Défense totale.*moitié du résultat/);
    click("Lancer 4g3");
    // 3 dés gardés à 5 = 15 → +8 au ND d'armure, moitié arrondie au supérieur (20 + 8)
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("28");
    expect(currentStance()).toBe("Défense totale");
  });

  it("Duel : pas de posture, Frappe puis dégâts rattachés", async () => {
    await renderApp();
    goToAid();
    click("Combat");
    click("Duel iaijutsu");
    expect(screen.queryByRole("combobox", { name: "Posture" })).toBeNull();
    click(/^1 · Évaluation/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
  });

  it("le panneau du lanceur s'ouvre au choix d'une action et se ferme par Échap, × et le fond", async () => {
    const { container } = await renderApp();
    goToAid();
    const dialog = screen.getByRole("dialog", { name: "Lanceur de dés" });
    expect(dialog).not.toHaveClass("open");
    click(/^Remarquer un détail/);
    expect(dialog).toHaveClass("open");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialog).not.toHaveClass("open");
    click(/^Remarquer un détail/);
    click("Fermer");
    expect(dialog).not.toHaveClass("open");
    click(/^Remarquer un détail/);
    fireEvent.click(container.querySelector(".backdrop")!);
    expect(dialog).not.toHaveClass("open");
  });

  it("E9 : une ligne par jet ; « point de Vide » ajoute +1g1 et augmente les chances", async () => {
    await renderApp();
    goToAid();
    click("Statistiques");
    const rows = () => screen.getAllByRole("row").slice(1);
    expect(rows()).toHaveLength(1 + 2 * 2 + 10);
    expect(rows()[0]).toHaveTextContent("sans ND");
    expect(rows()[2]).toHaveTextContent("└ Dégâts · Katana");
    const kenjutsu = () => rows().find((r) => r.textContent?.startsWith("Kenjutsu"))!;
    const pctAt20 = () => Number(within(kenjutsu()).getAllByRole("cell")[7]!.textContent?.replace(/\D/g, ""));
    expect(kenjutsu()).toHaveTextContent("5g3");
    const before = pctAt20();
    fireEvent.click(screen.getByRole("checkbox", { name: /Avec un point de Vide/ }));
    expect(kenjutsu()).toHaveTextContent("6g4");
    expect(pctAt20()).toBeGreaterThan(before);
  });

  it("Statistiques : page à part dans la navigation (Fiche, Assistant L5R, Statistiques), plus une situation", async () => {
    await renderApp();
    const nav = within(screen.getByRole("group", { name: "Vue" }));
    expect(nav.getAllByRole("button").map((b) => b.textContent)).toEqual(["Fiche", VIEW.aid, "Statistiques"]);
    fireEvent.click(nav.getByRole("button", { name: "Statistiques" }));
    expect(nav.getByRole("button", { name: "Statistiques" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Statistiques de tes jets" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Situation" })).toBeNull();
    goToAid();
    const situations = within(screen.getByRole("group", { name: "Situation" })).getAllByRole("button").map((b) => b.textContent);
    expect(situations).toEqual(["Enquête", "Cour", "Déplacement", "Combat"]);
  });

  it("étiquette « 9+ » sur les dégâts d'une compétence martiale au rang 7", async () => {
    const c = base();
    c.skills.find((s) => s.name === "Kenjutsu")!.rank = 7;
    await renderApp(c);
    goToAid();
    click("Statistiques");
    const row = screen.getAllByRole("row").find((r) => r.textContent?.includes("Dégâts · Katana"))!;
    expect(within(row).getByTitle("Explose sur 9")).toHaveTextContent("9+");
    const attack = screen.getAllByRole("row").find((r) => r.textContent?.includes("Attaque · Katana"))!;
    expect(within(attack).queryByTitle("Explose sur 9")).toBeNull();
  });
});
