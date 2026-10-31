/** Lot 19, v2.16.0 (HANDOFF annexe I.3.7) : sélecteurs stylés et panneau Posture, cas D3 à D8 (structure DOM). */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { migrate, type Character } from "@carnet/core";
import { memoryStorage } from "../../src/storage";
import { App } from "../../src/ui/App";
import perso from "../../reference/perso-test-ecoles.json";
import kakita from "../fixtures/kakita-v1.json";
import { chooseStance, currentStance, stanceOption, stanceSelect } from "../helpers/stance";
import { VIEW } from "../helpers/views";

const base = () => structuredClone(kakita) as Character;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
const desc = () => screen.getByTestId("posture-desc");

async function mount(character: Character = base(), rng = () => 5) {
  const storage = memoryStorage();
  await storage.library.put({ id: "a", character: migrate(character), mode: "edit", updatedAt: "2026-10-30T10:00:00.000Z" });
  render(<App storage={storage} rng={rng} />);
  await waitFor(() => expect(screen.queryByText("Ouverture du carnet…")).toBeNull());
}

function skirmish() {
  click(VIEW.aid);
  click("Combat");
}

describe("Panneau Posture en menu déroulant (annexe I.3.4)", () => {
  it("D3 : ni bouton de posture ni « i » ; un sélecteur « Posture », description et étiquettes toujours affichées", async () => {
    await mount();
    skirmish();
    expect(screen.queryByRole("group", { name: "Posture" })).toBeNull();
    expect(screen.queryByRole("button", { name: /détail : Posture/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Assaut/ })).toBeNull();
    const select = stanceSelect();
    expect(select).toHaveClass("cs", "cs-effet");
    expect(select).toHaveAttribute("aria-describedby", "posture-desc");
    expect(select.firstElementChild?.tagName).toBe("BUTTON");
    expect(select.querySelector("button > selectedcontent")).not.toBeNull();
    // Dans la liste : nom, étiquettes, description de chaque posture, nom d'abord (repli natif, I.3.6).
    const options = [...select.querySelectorAll("option")];
    expect(options.map((o) => o.value)).toEqual(["attack", "fullAttack", "defense", "fullDefense", "center"]);
    expect(options.map((o) => o.firstElementChild?.className)).toEqual(["n", "n", "n", "n", "n"]);
    expect(within(stanceOption("Assaut")).getByText("+2g1 attaque")).toHaveClass("up");
    expect(within(stanceOption("Assaut")).getByText("ND armure −10")).not.toHaveClass("up");
    expect(within(stanceOption("Assaut")).getByText("+2g1 à l'attaque, −10 au ND d'armure.")).toHaveClass("d");
    // Sous le sélecteur : la posture choisie.
    expect(desc()).toHaveAttribute("id", "posture-desc");
    expect(desc()).toHaveTextContent("aucun modificateur");
    expect(desc()).toHaveTextContent("Posture normale.");
  });

  it("D4 : Assaut → ND d'armure −10, attaque +2g1, description mise à jour", async () => {
    await mount();
    skirmish();
    const katana = () => screen.getByRole("button", { name: /^Attaque · Katana/ });
    expect(katana()).toHaveTextContent("5g3");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("20");
    chooseStance("Assaut");
    expect(currentStance()).toBe("Assaut");
    expect(screen.getByTestId("armor-tn")).toHaveTextContent("10");
    expect(katana()).toHaveTextContent("7g4");
    expect(desc()).toHaveTextContent("+2g1 à l'attaque, −10 au ND d'armure.");
    expect(within(desc()).getByText("+2g1 attaque")).toHaveClass("up");
    expect(desc()).not.toHaveTextContent("Posture normale.");
  });

  it("D5 : une Défense totale lancée met le sélecteur sur « Défense totale »", async () => {
    await mount();
    skirmish();
    click(/^Défense totale.*moitié du résultat/);
    click("Lancer 4g3");
    expect(currentStance()).toBe("Défense totale");
    expect(desc()).toHaveTextContent("ND armure +jet");
    // « Nouveau round » : retour en Défense, comme avec les boutons.
    click("Nouveau round");
    expect(currentStance()).toBe("Défense");
  });

  it("D6 : Hiruma R3 → techniques d'école sous le sélecteur, effets d'Attaque en étiquettes", async () => {
    await mount({ ...(structuredClone(perso) as Character), schoolId: "hiruma-bushi", insightRank: 3 });
    skirmish();
    const tags = ["+1g0 · Hiruma R1", "+5 au ND d'armure par cran · Hiruma R2"];
    for (const t of tags) expect(within(desc()).getByText(t)).toHaveClass("up");
    for (const t of tags) expect(within(stanceOption("Attaque")).getByText(t)).toBeInTheDocument();
    expect(within(stanceOption("Assaut")).queryByText(tags[0]!)).toBeNull();
    const techniques = screen.getByRole("group", { name: "Techniques d'école" });
    expect(stanceSelect().compareDocumentPosition(techniques) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(techniques).getByText("Touches au corps à corps")).toBeInTheDocument();
    chooseStance("Assaut");
    expect(within(desc()).queryByText(tags[0]!)).toBeNull();
  });

  it("Assaut monté sans Équitation 3 : option désactivée, avec la raison", async () => {
    await mount();
    skirmish();
    fireEvent.click(screen.getByRole("checkbox", { name: /^Monté/ }));
    expect(stanceOption("Assaut")).toBeDisabled();
    expect(stanceOption("Assaut")).toHaveAttribute("title", "Assaut à cheval : Équitation 3 requise");
  });
});

describe("Variantes riches (annexe I.3.3)", () => {
  it("D7 : sélecteur Anneau → 5 Anneaux avec kanji, couleur de l'Anneau et Traits", async () => {
    await mount({ ...base(), schoolId: "isawa-shugenja" });
    click("Edit : Identité & réputation");
    const select = screen.getByRole("combobox", { name: "Affinité (shugenja)" });
    expect(select).toHaveClass("cs", "cs-anneau");
    expect(select.querySelector("button > selectedcontent")).not.toBeNull();
    const rings = [...select.querySelectorAll("option")].filter((o) => o.value);
    expect(rings.map((o) => o.querySelector(".k")?.textContent)).toEqual(["風", "土", "火", "水", "空"]);
    expect(rings.map((o) => o.style.getPropertyValue("--rc"))).toEqual(
      ["air", "earth", "fire", "water", "void"].map((r) => `var(--ring-${r})`),
    );
    expect(rings.map((o) => o.querySelector(".d")?.textContent)).toEqual(
      ["Réflexes · Vigilance", "Constitution · Volonté", "Agilité · Intelligence", "Force · Perception", "Points de Vide"],
    );
  });

  it("D8 : Techniques d'école → groupes par clan avec titre, option « Aucune », classe de l'école à droite", async () => {
    await mount();
    click("Edit : Identité & réputation");
    const select = screen.getByRole("combobox", { name: "Techniques d'école" });
    expect(select).toHaveClass("cs", "cs-catalogue");
    expect(select.querySelector("option")?.value).toBe("");
    expect(select.querySelector("option")).toHaveTextContent("Aucune");
    const crab = within(select).getByRole("group", { name: "Crabe" });
    expect(crab.firstElementChild?.tagName).toBe("LEGEND");
    expect(crab.firstElementChild).toHaveTextContent("Crabe");
    const hiruma = crab.querySelector<HTMLOptionElement>('option[value="hiruma-bushi"]')!;
    expect([...hiruma.children].map((e) => e.className)).toEqual(["n", "m", "d"]);
    expect(hiruma.querySelector(".m")).toHaveTextContent("Bushi");
    expect(hiruma.querySelector(".d")).toHaveTextContent("R1 : La Flamme de la torche vacille");
  });

  it("variantes simples : Champ et En ligne sans <button>, liste native en repli", async () => {
    await mount();
    click("Edit : Bonus de jet");
    click("+ Bonus");
    const source = screen.getByRole("combobox", { name: "Source" });
    expect(source).toHaveClass("in", "cs", "cs-champ");
    expect(source.querySelector("button")).toBeNull();
  });
});

describe("Lot 26 : repli liste native (Safari, Firefox, annexe I.3.6)", () => {
  afterEach(() => vi.restoreAllMocks());
  const native = () => vi.spyOn(CSS, "supports").mockReturnValue(false);

  it("Techniques d'école : libellés « Nom · classe », sans <button> ni <legend>, groupes conservés", async () => {
    native();
    await mount();
    click("Edit : Identité & réputation");
    const select = screen.getByRole("combobox", { name: "Techniques d'école" });
    expect(select.querySelector("button, legend, span")).toBeNull();
    const crab = within(select).getByRole("group", { name: "Crabe" });
    expect(crab.querySelector('option[value="hiruma-bushi"]')?.textContent).toBe("École de bushi Hiruma · Bushi");
    expect(select.querySelector("option")?.textContent).toBe("— Aucune (techniques libres)");
  });

  it("Anneau : « kanji Nom », sans description collée", async () => {
    native();
    await mount({ ...base(), schoolId: "isawa-shugenja" });
    click("Edit : Identité & réputation");
    const select = screen.getByRole("combobox", { name: "Affinité (shugenja)" });
    const rings = [...select.querySelectorAll("option")].filter((o) => o.value);
    expect(rings.map((o) => o.textContent)).toEqual(["風 Air", "土 Terre", "火 Feu", "水 Eau", "空 Vide"]);
  });

  it("Posture : nom seul dans la liste, description toujours visible sous le sélecteur", async () => {
    native();
    await mount();
    skirmish();
    expect(stanceOption("Assaut").textContent).toBe("Assaut");
    chooseStance("Assaut");
    expect(currentStance()).toBe("Assaut");
    expect(stanceSelect().querySelector("span")).toBeNull();
  });
});
