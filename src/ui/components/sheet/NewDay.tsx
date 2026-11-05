import { useState } from "react";
import { dailyHealing, isShugenja } from "@carnet/core";
import { useT } from "../../../i18n";
import { useSheet } from "./hooks";

/** « Nouvelle journée » (annexe E.6), avec confirmation intégrée : Vide plein, blessures soignées, initiative à zéro. */
export function NewDay() {
  const { c, dispatch } = useSheet();
  const t = useT();
  const s = t.sheet.newDay;
  const [confirm, setConfirm] = useState(false);
  const healed = Math.min(c.wounds, dailyHealing(c));
  return (
    <div className="day-head" role="group" aria-label={s.label}>
      {confirm ? (
        <>
          <p className="hint" style={{ margin: 0 }} data-testid="new-day-preview">
            {s.preview({
              void: c.voidPoints, voidRing: c.voidRing, wounds: c.wounds, healed,
              stamina: c.traits.stamina, insightRank: c.insightRank, shugenja: isShugenja(c),
            })}
          </p>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setConfirm(false)}>{t.common.cancel}</button>
            <button type="button" className="btn accent" onClick={() => { dispatch({ type: "newDay" }); setConfirm(false); }}>{s.confirm}</button>
          </span>
        </>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>{s.hint}</p>
          <button type="button" className="btn" onClick={() => setConfirm(true)}>{s.start}</button>
        </>
      )}
    </div>
  );
}
