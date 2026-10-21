import { useState, type InputHTMLAttributes } from "react";

/**
 * Brouillon de saisie : le texte tapé reste tel quel tant qu'il correspond à la valeur ;
 * si la valeur change ailleurs (bouton −/+, autre champ), le texte est resynchronisé.
 */
function useDraft<T>(value: T, format: (v: T) => string, matches: (text: string, v: T) => boolean) {
  const [draft, setDraft] = useState({ text: format(value), value });
  if (draft.value !== value) {
    const text = matches(draft.text, value) ? draft.text : format(value);
    setDraft({ text, value });
    return [text, (t: string) => setDraft({ text: t, value })] as const;
  }
  return [draft.text, (t: string) => setDraft({ text: t, value })] as const;
}

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max" | "step">;

interface NumberFieldProps extends Native {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  /** 1 pour un entier, 0.1 pour une décimale. */
  step?: number;
}

const parse = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(",", ".")));

/**
 * Champ numérique : la saisie reste libre, seule une valeur valide et dans les bornes
 * est transmise ; en quittant le champ, il revient à la dernière valeur valide.
 */
export function NumberField({ value, onChange, min, max, step = 1, className = "in", ...rest }: NumberFieldProps) {
  const [text, setText] = useDraft(value, String, (t, v) => parse(t) === v);
  const valid = (n: number) =>
    Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max)
    && Math.abs(n / step - Math.round(n / step)) < 1e-9;

  return (
    <input
      {...rest}
      className={className}
      type="number"
      inputMode={step < 1 ? "decimal" : "numeric"}
      min={min}
      max={max}
      step={step}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parse(e.target.value);
        if (valid(n)) onChange(n);
      }}
      onBlur={() => setText(String(value))}
    />
  );
}

interface ListFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string[];
  onChange: (items: string[]) => void;
}

const split = (s: string) => s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

interface TextListFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: readonly string[];
  /** Texte saisi → liste retenue (les entrées invalides sont ignorées). */
  parse: (text: string) => string[];
  onChange: (items: string[]) => void;
}

/**
 * Liste contrôlée (mots-clés d'arme) : le texte reste libre pendant la saisie,
 * et revient à la forme retenue en quittant le champ.
 */
export function TextListField({ value, parse: parseText, onChange, className = "in", ...rest }: TextListFieldProps) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      {...rest}
      className={className}
      type="text"
      value={text ?? value.join(", ")}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseText(e.target.value));
      }}
      onBlur={() => setText(null)}
    />
  );
}

/** Liste saisie en texte, séparée par des virgules (spécialisations). */
export function ListField({ value, onChange, className = "in", ...rest }: ListFieldProps) {
  const [text, setText] = useDraft(value, (v) => v.join(", "), (t, v) => sameList(split(t), v));
  return (
    <input
      {...rest}
      className={className}
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(split(e.target.value));
      }}
    />
  );
}
