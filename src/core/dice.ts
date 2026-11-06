/** Notation des dés, sans dépendance : lue par le moteur et par les dictionnaires (annexe 53.2). */
export interface DiceCode { rolled: number; kept: number }

const DICE = /^\s*(\d+)\s*[kg]\s*(\d+)\s*$/i;

export function parseDR(s: string): DiceCode {
  const m = DICE.exec(s);
  return m ? { rolled: Number(m[1]), kept: Number(m[2]) } : { rolled: 0, kept: 0 };
}

/** VD pour l'affichage : « 3k3 », « 3 K 3 », « 3g3 » → « 3g3 » ; texte invalide rendu tel quel, rogné (annexe H.5). */
export function formatDR(s: string, letter = "g"): string {
  const m = DICE.exec(s);
  return m ? `${Number(m[1])}${letter}${Number(m[2])}` : s.trim();
}
