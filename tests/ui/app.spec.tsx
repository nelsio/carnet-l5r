import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Character } from "@carnet/core";
import { App } from "../../src/ui/App";
import kakita from "../../reference/exemple-personnage.json";

const base = () => structuredClone(kakita) as Character;
const always = (v: number) => () => v;
const root = document.documentElement;

function renderApp(character: Character | null = base(), rng = always(5)) {
  return render(<App initialCharacter={character} rng={rng} />);
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const goToAid = () => click("Aide de jeu");
const roller = () => within(screen.getByRole("dialog", { name: "Lanceur de dés" }));
const chance = () => Number(screen.getByTestId("chance").textContent?.replace(/\D/g, ""));

beforeEach(() => {
  root.removeAttribute("data-theme");
  root.removeAttribute("style");
});

describe("Socle", () => {
  it("affiche la version en pied de page", () => {
    renderApp(null);
    expect(screen.getByText(`Carnet de Rokugan v${__APP_VERSION__}`)).toBeInTheDocument();
  });
  it("sans fiche : crée un personnage et passe en modification", () => {
    renderApp(null);
    click("Créer mon personnage");
    expect(screen.getByRole("heading", { level: 1, name: "Nouveau samouraï" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terminer" })).toBeInTheDocument();
  });
  it("le thème passe d'auto à clair, sombre, puis auto", () => {
    renderApp();
    click("Thème : auto");
    expect(root.dataset.theme).toBe("light");
    click("Thème : clair");
    expect(root.dataset.theme).toBe("dark");
    click("Thème : sombre");
    expect(root.hasAttribute("data-theme")).toBe(false);
  });
});

describe("Fiche", () => {
  it("affiche l'en-tête : clan, nom, famille, école et Rang", () => {
    renderApp();
    expect(screen.getByText("Clan de la Grue")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Kakita Haruto" })).toBeInTheDocument();
    expect(screen.getByText("Kakita · École de duellistes Kakita · Rang 1")).toBeInTheDocument();
  });

  it("U2 : modifier un trait met à jour les réserves des compétences liées", () => {
    renderApp();
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("5g3");
    click("Modifier la fiche");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Agilité" }), { target: { value: "4" } });
    click("Terminer");
    expect(screen.getByTestId("skill-pool-Kenjutsu")).toHaveTextContent("6g4");
    expect(screen.getByTestId("skill-pool-Équitation")).toHaveTextContent("5g4");
    expect(screen.getByTestId("skill-pool-Iaijutsu")).toHaveTextContent("6g3");
  });

  it("U3 : clan « Scorpion » puis « crane » : accent rouge, puis bleu ciel", () => {
    renderApp();
    click("Modifier la fiche");
    const clan = screen.getByRole("combobox", { name: "Clan" });
    fireEvent.change(clan, { target: { value: "Scorpion" } });
    expect(root.style.getPropertyValue("--acc-l")).toBe("#a82828");
    expect(root.style.getPropertyValue("--acc-d")).toBe("#f07a7a");
    fireEvent.change(clan, { target: { value: "crane" } });
    expect(root.style.getPropertyValue("--acc-l")).toBe("#2f7fb5");
    expect(screen.getByText("Clan de la Grue")).toBeInTheDocument();
    fireEvent.change(clan, { target: { value: "Ronin" } });
    expect(root.style.getPropertyValue("--acc-l")).toBe("");
  });

  it("U4 : un texte saisi n'est jamais interprété comme du HTML", () => {
    const evil = "<img src=x onerror=alert(1)>";
    const { container } = renderApp();
    click("Modifier la fiche");
    fireEvent.change(screen.getByRole("textbox", { name: "Notes de campagne" }), { target: { value: evil } });
    fireEvent.change(screen.getByRole("textbox", { name: "Nom" }), { target: { value: evil } });
    click("Terminer");
    expect(screen.getByText(evil, { selector: ".prose" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(evil);
    expect(container.querySelector("img")).toBeNull();
  });

  it("ajoute et retire une compétence ; les manœuvres par défaut deviennent modifiables", () => {
    renderApp();
    click("Modifier la fiche");
    click("+ Compétence");
    const names = screen.getAllByRole("textbox", { name: "Nom de la compétence" });
    fireEvent.change(names.at(-1)!, { target: { value: "Kyujutsu" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Spécialisations de Kyujutsu" }), { target: { value: "Yumi, Daikyu" } });
    expect(screen.getByRole("spinbutton", { name: "Coût de Feinte" })).toHaveValue(2);
    click("Terminer");
    expect(screen.getByTestId("skill-pool-Kyujutsu")).toHaveTextContent("4g3");
    expect(screen.getByText("Daikyu")).toBeInTheDocument();
    click("Modifier la fiche");
    click("Supprimer Kyujutsu");
    click("Terminer");
    expect(screen.queryByTestId("skill-pool-Kyujutsu")).toBeNull();
  });

  it("barre d'état : blessures, pénalité et points de Vide", () => {
    renderApp();
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Blessures subies" }), { target: { value: "11" } });
    expect(screen.getByRole("button", { name: /Égratigné/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("+3", { selector: ".pen b" })).toBeInTheDocument();
    click("Retirer 1 blessure");
    expect(screen.getByRole("spinbutton", { name: "Blessures subies" })).toHaveValue(10);
    expect(screen.getByText("Points de Vide 2/2")).toBeInTheDocument();
    click("Point de Vide 2");
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
  });
});

describe("Aide de jeu", () => {
  it("Déplacement : encart en tête, en pieds et en mètres", () => {
    renderApp();
    goToAid();
    click("Déplacement");
    expect(screen.getByRole("heading", { name: "Se déplacer en combat" })).toBeInTheDocument();
    expect(screen.getByText("10 pi")).toBeInTheDocument();
    expect(screen.getByText(/^3,0 m/)).toBeInTheDocument();
    expect(screen.getByText(/^12,2 m/)).toBeInTheDocument();
  });

  it("E6 : Initiative en tête ; Attaque totale passe le ND d'armure de 20 à 10 ; « Nouveau round » garde l'initiative", () => {
    renderApp(base(), always(5));
    goToAid();
    click("Combat");
    const cards = screen.getAllByRole("button").filter((b) => b.classList.contains("act"));
    expect(cards[0]).toHaveTextContent("Initiative");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    click(/^Attaque totale/);
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("10");
    fireEvent.click(cards[0]!);
    click("Lancer 4g3");
    expect(screen.getByTestId("initiative")).toHaveTextContent("15");
    click("Nouveau round");
    expect(screen.getByTestId("initiative")).toHaveTextContent("15");
  });

  it("E7 : attaque réussie avec 2 « Augmentation des dégâts » → dégâts pré-remplis à +2 dés", () => {
    renderApp(base(), always(9));
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

  it("E10 : ajouter une augmentation monte le ND final de 5 et baisse la chance de réussite", () => {
    renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("15");
    const before = chance();
    fireEvent.change(roller().getByRole("spinbutton", { name: "Augmentations" }), { target: { value: "1" } });
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
    expect(chance()).toBeLessThan(before);
  });

  it("spécialisation cochée automatiquement quand elle correspond à l'action", () => {
    renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    expect(roller().getByRole("checkbox", { name: /Spécialisation/ })).toBeChecked();
    click(/^Fouiller un lieu/);
    expect(roller().getByRole("checkbox", { name: /Spécialisation/ })).not.toBeChecked();
  });

  it("dépenser un point de Vide au jet le décompte, une seule fois", () => {
    renderApp();
    goToAid();
    click(/^Remarquer un détail/);
    fireEvent.click(roller().getByRole("checkbox", { name: /Dépenser 1 point de Vide \(\+1g1\)/ }));
    expect(screen.getByTestId("pool")).toHaveTextContent("4g3");
    click("Lancer 4g3");
    expect(screen.getByText("Points de Vide 1/2")).toBeInTheDocument();
    expect(screen.getByTestId("pool")).toHaveTextContent("3g2");
  });

  it("Défense totale lancée : posture et ND d'armure mis à jour", () => {
    renderApp(base(), always(5));
    goToAid();
    click("Combat");
    click(/^Défense totale.*moitié du résultat/);
    click("Lancer 4g3");
    // 3 dés gardés à 5 = 15 → +7 au ND d'armure (20 + 7)
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("27");
    expect(screen.getByRole("button", { name: /^Défense totale.*Jet Défense/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("Duel : pas de posture, Frappe puis dégâts rattachés", () => {
    renderApp();
    goToAid();
    click("Combat");
    click("Duel iaijutsu");
    expect(screen.queryByRole("group", { name: "Posture" })).toBeNull();
    click(/^1 · Évaluation/);
    expect(screen.getByTestId("final-tn")).toHaveTextContent("20");
  });

  it("le panneau du lanceur s'ouvre au choix d'une action et se ferme par Échap, × et le fond", () => {
    const { container } = renderApp();
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

  it("E9 : une ligne par jet ; « point de Vide » ajoute +1g1 et augmente les chances", () => {
    renderApp();
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
});
