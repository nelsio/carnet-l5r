import { useState } from "react";
import { dailyHealing, isShugenja } from "@carnet/core";
import { useSheet } from "./hooks";

/** « Nouvelle journée » (annexe E.6), avec confirmation intégrée : Vide plein, blessures soignées, initiative à zéro. */
export function NewDay() {
  const { c, dispatch } = useSheet();
  const [confirm, setConfirm] = useState(false);
  const healed = Math.min(c.wounds, dailyHealing(c));
  return (
    <div className="day-head" role="group" aria-label="Nouvelle journée">
      {confirm ? (
        <>
          <p className="hint" style={{ margin: 0 }} data-testid="new-day-preview">
            Vide {c.voidPoints} → {c.voidRing} ; blessures {c.wounds} → {c.wounds - healed} (−{healed} : 2 × Constitution {c.traits.stamina} + Rang {c.insightRank}) ;
            {" "}initiative et compteurs d'escarmouche remis à zéro{isShugenja(c) ? " ; emplacements de sorts rechargés" : ""}.
          </p>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setConfirm(false)}>Annuler</button>
            <button type="button" className="btn accent" onClick={() => { dispatch({ type: "newDay" }); setConfirm(false); }}>Confirmer la nouvelle journée</button>
          </span>
        </>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>Après une nuit de repos : Vide plein, blessures soignées.</p>
          <button type="button" className="btn" onClick={() => setConfirm(true)}>Nouvelle journée…</button>
        </>
      )}
    </div>
  );
}
