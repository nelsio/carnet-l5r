import type { ReactNode } from "react";
import { useT } from "../../../i18n";
import { useStore, type ListKey } from "../../store";

/**
 * `wide` : le champ prend toute la ligne de la grille (sélecteur de catalogue, annexe I.3) ;
 * `hint` : indication sous la saisie, hors du libellé (annexe K).
 */
export function Field({ label, wide, hint, children }: { label: string; wide?: boolean; hint?: ReactNode; children: ReactNode }) {
  const field = <label className={wide ? "field wide" : "field"}><span className="label">{label}</span>{children}</label>;
  return hint ? <div className="field">{field}{hint}</div> : field;
}

export function AddButton({ list, label, item }: { list: ListKey; label: string; item: () => unknown }) {
  const { dispatch } = useStore();
  return <button type="button" className="btn sm" onClick={() => dispatch({ type: "add", list, item: item() })}>{label}</button>;
}

export function RemoveButton({ list, index, name }: { list: ListKey; index: number; name: string }) {
  const { dispatch } = useStore();
  const t = useT();
  return (
    <button type="button" className="x" aria-label={t.sheet.remove(name)} onClick={() => dispatch({ type: "remove", list, index })}>×</button>
  );
}

/** Nombre facultatif : vide = absent. */
export function OptionalNumber({ value, onChange, min = 0, max = 10, placeholder = "—", ...rest }: {
  value: number | undefined; onChange: (n: number | undefined) => void; "aria-label"?: string; min?: number; max?: number; placeholder?: string;
}) {
  return (
    <input
      {...rest} className="in" type="number" min={min} max={max} placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (e.target.value === "") onChange(undefined);
        else if (Number.isInteger(n) && n >= min && n <= max) onChange(n);
      }}
    />
  );
}
