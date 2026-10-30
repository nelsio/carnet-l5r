/** Lot 22, v2.19.0 (HANDOFF annexe L.1) : adresses du portail de la campagne, cas O1 et O2. */
import { describe, expect, it } from "vitest";
import { clanAccent } from "@carnet/core";
import { CLANS } from "../src/rules/l5r4e";
import { clanUrl, FORGE_JSON_OK, PORTAL, PORTAL_BASE, PORTAL_CLAN_KANJI, spellUrl } from "../src/rules/portal";

describe("O1 : page de clan", () => {
  const withPage = ["crabe", "grue", "dragon", "lion", "mante", "phenix", "scorpion", "licorne"];

  it.each(withPage)("%s → clans/%s.html", (id) => {
    expect(clanUrl(id)).toBe(`${PORTAL_BASE}clans/${id}.html`);
    expect(PORTAL_CLAN_KANJI[id]).toBeTruthy();
  });

  it("Araignée, Familles impériales et clan non reconnu : null", () => {
    expect(clanUrl("araignee")).toBeNull();
    expect(clanUrl("imperial")).toBeNull();
    expect(clanUrl(clanAccent("Clan de la Tortue").id)).toBeNull();
  });

  it("11 cas : 8 adresses, 3 null", () => {
    const ids = [...CLANS.map((c) => c.id), clanAccent("").id];
    expect(ids).toHaveLength(11);
    expect(ids.map(clanUrl).filter(Boolean)).toHaveLength(8);
  });

  it("depuis le nom saisi sur la fiche (alias anglais compris)", () => {
    expect(clanUrl(clanAccent("Crab").id)).toBe(`${PORTAL_BASE}clans/crabe.html`);
    expect(clanUrl(clanAccent("Clan du Phénix").id)).toBe(`${PORTAL_BASE}clans/phenix.html`);
  });
});

describe("O2 : sort dans le grimoire", () => {
  it("nom encodé en recherche", () => {
    expect(spellUrl("Frappe de jade")).toBe("https://vincenzorpg.github.io/L5R/grimoire.html?q=Frappe%20de%20jade");
    expect(spellUrl("  Sentir ")).toBe(`${PORTAL.grimoire}?q=Sentir`);
  });

  it("nom vide : le grimoire seul", () => {
    expect(spellUrl("  ")).toBe("https://vincenzorpg.github.io/L5R/grimoire.html");
    expect(spellUrl("")).toBe(PORTAL.grimoire);
  });
});

describe("Forge en attente (lot 27)", () => {
  it("FORGE_JSON_OK existe et vaut false tant que l'export de la Forge ne s'importe pas", () => {
    expect(FORGE_JSON_OK).toBe(false);
  });
});

describe("Adresses", () => {
  it("toutes sous le portail, en https", () => {
    for (const url of Object.values(PORTAL)) expect(url.startsWith(PORTAL_BASE)).toBe(true);
    expect(PORTAL_BASE).toBe("https://vincenzorpg.github.io/L5R/");
  });
});
