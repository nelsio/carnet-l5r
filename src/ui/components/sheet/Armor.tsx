import { armorSheet, type ArmorPart } from "@carnet/core";
import { useT } from "../../../i18n";
import { ArmorFields } from "../ArmorCatalog";
import { useSheet } from "./hooks";

/** Bloc « Armure » (annexe E.18) : ND détaillé en posture Attaque, Réduction, règle spéciale ; liste du livre en édition. */
export function Armor() {
  const { c, edit } = useSheet("armor");
  const s = useT().sheet.armor;
  if (edit) {
    return (
      <div className="armform">
        <ArmorFields />
        <p className="hint" style={{ gridColumn: "1/-1", margin: 0 }}>
          {s.editHint}
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
        <b>{c.armor.name || s.none}</b>{" "}
        <span className="tag">{a.catalog ? s.fromBook : s.custom}</span>
      </div>
      <div className="armstats">
        <div>
          <span className="label">{s.tn}</span>
          <b data-testid="armor-block-tn">{a.tn.total}</b>
          <span className="muted">
            {s.tnFormula(a.tn.reflexes, a.tn.armor, plus(a.tn.auto), a.tn.total)}
            {a.tn.mounted !== undefined && <>{s.mounted(a.tn.mounted)}</>}
          </span>
        </div>
        <div>
          <span className="label">{s.reduction}</span>
          <b data-testid="armor-block-reduction">{a.reduction.total}</b>
          <span className="muted">
            {s.reductionFormula(a.reduction.armor, plus(a.reduction.parts), a.reduction.parts.length ? a.reduction.total : undefined)}
          </span>
        </div>
      </div>
      {rule && (
        <p className="armrule" data-testid="armor-rule">
          <b>{s.specialRule}</b> {rule}
          {a.waiver && <> {s.waiver(a.waiver.source, a.waiver.except.join(", "))}</>}
        </p>
      )}
      {a.optional.length > 0 && <p className="hint">{s.optional(a.optional.join(" ; "))}</p>}
      <p className="hint" style={{ margin: 0 }}>{s.referenceStance}</p>
    </div>
  );
}
