/** Données livrées dans `src/rules` : format des valeurs de dégâts (HANDOFF annexe H.5). */
import { describe, expect, it } from "vitest";
import bushi from "../src/rules/ecoles-bushi.json";
import { DISARM_DAMAGE } from "../src/rules/l5r4e";

describe("Données livrées (H.5)", () => {
  it("K3 : aucune VD du catalogue d'armes ni constante de règles en « k »", () => {
    const drs = bushi.weaponCatalog.map((w) => w.dr);
    expect(drs).toHaveLength(16);
    for (const dr of drs) expect(dr).toMatch(/^\d+g\d+$/);
    expect(DISARM_DAMAGE).toBe("2g1");
  });
});
