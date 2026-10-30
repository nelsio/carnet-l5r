import type { CSSProperties, ReactNode, SelectHTMLAttributes } from "react";
import { RINGS, TRAIT_LABELS, type RingKey, type StanceTag } from "../../rules/l5r4e";

// <selectedcontent> (sélecteur `appearance: base-select`) : absent des types de React 18.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      selectedcontent: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

/** Variantes des sélecteurs du Carnet (annexe I.3.2). */
export type SelectVariant = "champ" | "ligne" | "anneau" | "catalogue" | "effet";
/** Variantes riches : l'option choisie est recopiée dans le champ par <selectedcontent>. */
const RICH: ReadonlySet<SelectVariant> = new Set(["anneau", "catalogue", "effet"]);

interface RichSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
  variant: SelectVariant;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}

/**
 * Sélecteur stylé (annexe I.3) : `<select>` contrôlé, stylé sous `@supports (appearance: base-select)`.
 * Ailleurs (Firefox, Safari), liste native : le texte des options, nom d'abord (I.3.6).
 */
export function RichSelect({ variant, className, onChange, children, ...rest }: RichSelectProps) {
  return (
    <select {...rest} className={["in", "cs", `cs-${variant}`, className].filter(Boolean).join(" ")} onChange={(e) => onChange(e.target.value)}>
      {RICH.has(variant) && <button type="button"><selectedcontent /></button>}
      {children}
    </select>
  );
}

const RING_KANJI: Record<RingKey, string> = { earth: "土", water: "水", fire: "火", air: "風", void: "空" };

/** Option du sélecteur Anneau : kanji dans l'ensō, nom, Traits de l'Anneau (I.3.3). Sans `ring` : option sans Anneau (« Tous »). */
export function RingOption(props: { ring: RingKey } | { value: string; label: string }) {
  if (!("ring" in props)) {
    return <option value={props.value}><span className="k" /><span className="n">{props.label}</span></option>;
  }
  const { ring } = props;
  const r = RINGS[ring];
  return (
    <option value={ring} style={{ "--rc": `var(--ring-${ring})` } as CSSProperties}>
      <span className="k">{RING_KANJI[ring]}</span>
      <span className="n">{r.label}</span>
      <span className="d">{"traits" in r ? r.traits.map((t) => TRAIT_LABELS[t]).join(" · ") : "Points de Vide"}</span>
    </option>
  );
}

/** Étiquettes d'effet (variante Avec effets, description de posture) : `.up` pour un bonus. */
export function EffectTags({ tags }: { tags: readonly StanceTag[] }) {
  return <span className="fx">{tags.map((t) => <span key={t.label} className={t.up ? "up" : undefined}>{t.label}</span>)}</span>;
}
