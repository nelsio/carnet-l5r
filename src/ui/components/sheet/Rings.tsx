import { rings, type TraitKey } from "@carnet/core";
import { RINGS, TRAIT_LABELS } from "../../../rules/l5r4e";
import { useT } from "../../../i18n";
import { NumberField } from "../fields";
import { RING_ORDER } from "./constants";
import { useSheet } from "./hooks";

export function Rings() {
  const { c, edit, set } = useSheet("rings");
  const s = useT().sheet.rings;
  const r = rings(c);
  const value = (path: (string | number)[], v: number, label: string) =>
    edit
      ? <NumberField style={{ width: 56 }} min={1} max={10} value={v} aria-label={label} onChange={(n) => set(path, n)} />
      : <b className="mono">{v}</b>;

  return (
    <div className="rings">
      {RING_ORDER.map((key) => (
        <div key={key} className={`ring ${key}`} style={{ ["--rc" as string]: `var(--ring-${key})` }}>
          <div className="rn">{RINGS[key].label}</div>
          <div className="rv">{r[key]}</div>
          {key === "void" ? (
            <>
              <div className="tr"><span>{s.ring}</span>{value(["voidRing"], c.voidRing, s.voidRing)}</div>
              <div className="tr"><span>{s.maxRaises}</span><b className="mono">{c.voidRing}</b></div>
            </>
          ) : (
            RINGS[key].traits.map((t: TraitKey) => (
              <div key={t} className="tr"><span>{TRAIT_LABELS[t]}</span>{value(["traits", t], c.traits[t], TRAIT_LABELS[t])}</div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
