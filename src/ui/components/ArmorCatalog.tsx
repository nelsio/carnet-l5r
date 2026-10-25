import { catalogArmor } from "@carnet/core";
import { ARMOR_CATALOG } from "../../rules/l5r4e";
import { useCharacter, useStore } from "../store";
import { NumberField } from "./fields";

/** Liste « Armure du livre » (annexe E.5) : remplit nom, bonus et réduction, modifiables ensuite. */
export function ArmorCatalogSelect() {
  const { dispatch } = useStore();
  const c = useCharacter();
  const choose = (id: string) => {
    const a = ARMOR_CATALOG.find((x) => x.id === id);
    const { name, bonus, reduction } = c.armor;
    dispatch({
      type: "set", path: ["armor"],
      value: a ? { name: a.name, bonus: a.bonus, reduction: a.reduction, catalogId: a.id } : { name, bonus, reduction },
    });
  };
  return (
    <label className="field"><span className="label">Armure du livre</span>
      <select className="in" value={c.armor.catalogId ?? ""} onChange={(e) => choose(e.target.value)}>
        <option value="">Personnalisée</option>
        {ARMOR_CATALOG.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} (ND +{a.bonus}{a.bonusMounted !== undefined ? `, +${a.bonusMounted} à cheval` : ""} · réd. {a.reduction})
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Liste du livre, nom, bonus au ND et Réduction : bloc Armure de la fiche et éditeur de la barre d'état (annexe E.18).
 * Modifier ensuite le bonus ou la Réduction en fait une armure personnalisée (`catalogId` retiré, E.14).
 */
export function ArmorFields() {
  const { dispatch } = useStore();
  const c = useCharacter();
  const setName = (name: string) => dispatch({ type: "set", path: ["armor", "name"], value: name });
  const setValue = (field: "bonus" | "reduction", n: number) => {
    const { name, bonus, reduction } = c.armor;
    dispatch({ type: "set", path: ["armor"], value: { name, bonus, reduction, [field]: n } });
  };
  return (
    <>
      <div className="armcat"><ArmorCatalogSelect /></div>
      <label className="field"><span className="label">Nom</span>
        <input className="in" type="text" maxLength={80} value={c.armor.name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field"><span className="label">Bonus au ND</span>
        <NumberField className="in mono" min={0} value={c.armor.bonus} onChange={(n) => setValue("bonus", n)} />
      </label>
      <label className="field"><span className="label">Réduction</span>
        <NumberField className="in mono" min={0} value={c.armor.reduction} onChange={(n) => setValue("reduction", n)} />
      </label>
    </>
  );
}

/** Effet de l'armure du livre portée, en une ligne. */
export function ArmorEffect() {
  const armor = catalogArmor(useCharacter());
  return armor?.summary ? <span data-testid="armor-effect">{armor.name} : {armor.summary}</span> : null;
}
