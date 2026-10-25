import { catalogArmor } from "@carnet/core";
import { ARMOR_CATALOG } from "../../rules/l5r4e";
import { useCharacter, useStore } from "../store";

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

/** Effet de l'armure du livre portée, en une ligne. */
export function ArmorEffect() {
  const armor = catalogArmor(useCharacter());
  return armor?.summary ? <span data-testid="armor-effect">{armor.name} : {armor.summary}</span> : null;
}
