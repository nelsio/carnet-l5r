/**
 * Dictionnaire de référence (annexe 50) : textes de l'interface, regroupés par composant ou vue.
 * Interpolation et pluriels : des fonctions. Données pures, sans React : le schéma (`src/core`) lit `validation`.
 */
export const fr = {
  /** Messages d'erreur du schéma de fiche, affichés dans l'aperçu d'import (HANDOFF §8). */
  validation: {
    intBetween: (min: number, max: number) => `doit être un entier entre ${min} et ${max}`,
    positiveInt: "doit être un entier positif ou nul",
    reputation: "doit être un nombre entre 0 et 10, avec au plus une décimale",
    text: "doit être un texte",
    maxChars: (max: number) => `doit faire au plus ${max} caractères`,
    notEmpty: "ne doit pas être vide",
    object: "doit être un objet",
    list: "doit être une liste",
    textList: "doit être une liste de textes",
    boolean: "doit être vrai ou faux",
    trait: "doit être un Trait valide",
    rollTrait: "doit être un Trait valide ou void",
    weaponKeyword: "doit être un mot-clé d'arme valide",
    weaponKeywords: "doit être une liste de mots-clés",
    weaponDr: "doit être au format 3g2",
    spellDamage: "doit être au format 2g2",
    spellElement: "doit être air, earth, fire, water, void ou all",
    modifierSource: "doit être technique, advantage, disadvantage ou other",
    modifierTarget: "doit être all, skill, trait, social, attack, damage, initiative, armor ou wounds",
    stance: "doit être une posture valide",
    modifierMode: "doit être always ou optional",
    ring: "doit être un Anneau",
    slotKey: "doit être air, earth, fire, water, void ou free",
    voidPointsOverRing: "ne peut pas dépasser l'Anneau de Vide",
  },
} as const;
