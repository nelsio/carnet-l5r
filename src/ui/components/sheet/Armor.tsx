import { armorSheet, type ArmorPart } from "@carnet/core";
import { ArmorFields } from "../ArmorCatalog";
import { useSheet } from "./hooks";

/** Bloc « Armure » (annexe E.18) : ND détaillé en posture Attaque, Réduction, règle spéciale ; liste du livre en édition. */
export function Armor() {
  const { c, edit } = useSheet("armor");
  if (edit) {
    return (
      <div className="armform">
        <ArmorFields />
        <p className="hint" style={{ gridColumn: "1/-1", margin: 0 }}>
          Choisir une armure du livre remplit nom, bonus et Réduction. Modifier ensuite le bonus ou la Réduction en fait une armure personnalisée.
        </p>
      </div>
    );
  }
  const a = armorSheet(c);
  const plus = (parts: ArmorPart[]) => parts.map((p) => ` + ${p.value} ${p.source}`).join("");
  const rule = a.catalog?.summary;
  return (
    <div className="armblock" data-testid="armor-block">
      <div className="armname">
        <b>{c.armor.name || "Sans armure"}</b>{" "}
        <span className="tag">{a.catalog ? "armure du livre" : "armure personnalisée"}</span>
      </div>
      <div className="armstats">
        <div>
          <span className="label">ND d'armure</span>
          <b data-testid="armor-block-tn">{a.tn.total}</b>
          <span className="muted">
            5 × Réflexes {a.tn.reflexes} + 5 + armure {a.tn.armor}{plus(a.tn.auto)} = {a.tn.total}
            {a.tn.mounted !== undefined && <> ; à cheval {a.tn.mounted}</>}
          </span>
        </div>
        <div>
          <span className="label">Réduction</span>
          <b data-testid="armor-block-reduction">{a.reduction.total}</b>
          <span className="muted">
            armure {a.reduction.armor}{plus(a.reduction.parts)}{a.reduction.parts.length ? ` = ${a.reduction.total}` : ""}
          </span>
        </div>
      </div>
      {rule && (
        <p className="armrule" data-testid="armor-rule">
          <b>Règle spéciale :</b> {rule}
          {a.waiver && <> {a.waiver.source} : ignorée{a.waiver.except.length ? ` sauf ${a.waiver.except.join(", ")}` : ""}.</>}
        </p>
      )}
      {a.optional.length > 0 && <p className="hint">À cocher en combat (panneau Posture) : {a.optional.join(" ; ")}.</p>}
      <p className="hint" style={{ margin: 0 }}>Posture de référence : Attaque.</p>
    </div>
  );
}
