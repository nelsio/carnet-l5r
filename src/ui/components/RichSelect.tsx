import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode, type SelectHTMLAttributes } from "react";
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
 * `appearance: base-select` géré ? Sinon (Safari, Firefox), le `<select>` reste une liste native
 * qui n'affiche que le texte brut des options : on y met alors un libellé simple (annexe I.3.6, lot 26).
 * Évalué à chaque rendu (pas de cache) pour que les tests puissent simuler les deux cas.
 */
function supportsBaseSelect(): boolean {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("appearance", "base-select");
}

/** Texte brut d'un nœud React (chaînes et nombres, récursivement). */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** Enfant `<span className="…">` d'une option riche, par classe. */
function part(children: ReactNode, cls: string): string | undefined {
  let found: string | undefined;
  Children.forEach(children, (c) => {
    if (found === undefined && isValidElement<{ className?: string; children?: ReactNode }>(c) && c.props.className === cls) found = textOf(c.props.children).trim();
  });
  return found;
}

/** Repli liste native : option riche → libellé « Nom · méta » ; `<legend>` retirés (le label de l'optgroup suffit). */
function plain(children: ReactNode): ReactNode {
  return Children.map(children, (c) => {
    if (!isValidElement<{ children?: ReactNode }>(c)) return c;
    if (c.type === "legend") return null;
    if (c.type === "optgroup") return cloneElement(c as ReactElement<{ children?: ReactNode }>, undefined, plain(c.props.children));
    if (c.type === "option") {
      const n = part(c.props.children, "n");
      if (n === undefined) return c; // option déjà en texte simple
      const m = part(c.props.children, "m");
      return cloneElement(c as ReactElement<{ children?: ReactNode }>, undefined, m ? `${n} · ${m}` : n);
    }
    return c;
  });
}

/**
 * Sélecteur stylé (annexe I.3) : `<select>` contrôlé, stylé sous `@supports (appearance: base-select)`.
 * Ailleurs (Safari, Firefox), liste native avec des libellés simples (nom, puis méta éventuelle).
 */
export function RichSelect({ variant, className, onChange, children, ...rest }: RichSelectProps) {
  const rich = supportsBaseSelect();
  return (
    <select {...rest} className={["in", "cs", `cs-${variant}`, className].filter(Boolean).join(" ")} onChange={(e) => onChange(e.target.value)}>
      {rich && RICH.has(variant) && <button type="button"><selectedcontent /></button>}
      {rich ? children : plain(children)}
    </select>
  );
}

const RING_KANJI: Record<RingKey, string> = { earth: "土", water: "水", fire: "火", air: "風", void: "空" };

/** Option du sélecteur Anneau : kanji dans l'ensō, nom, Traits de l'Anneau (I.3.3). Sans `ring` : option sans Anneau (« Tous »). */
export function RingOption(props: { ring: RingKey } | { value: string; label: string }) {
  if (!("ring" in props)) {
    if (!supportsBaseSelect()) return <option value={props.value}>{props.label}</option>;
    return <option value={props.value}><span className="k" /><span className="n">{props.label}</span></option>;
  }
  const { ring } = props;
  const r = RINGS[ring];
  if (!supportsBaseSelect()) return <option value={ring}>{`${RING_KANJI[ring]} ${r.label}`}</option>;
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
