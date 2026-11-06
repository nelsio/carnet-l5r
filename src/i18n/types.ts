/** Forme d'un dictionnaire : textes élargis en `string`, fonctions d'interpolation gardées telles quelles. */
export type Widen<T> = T extends (...a: infer A) => infer R ? (...a: A) => R
  : T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> };
