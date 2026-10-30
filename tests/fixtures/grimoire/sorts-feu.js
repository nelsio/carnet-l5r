const SORTS_FEU = [
  // --- NIVEAU DE MAÎTRISE 1 ---
  {
    id: "feu-1-biting-steel",
    name: "Morsure de l'Acier (Biting Steel)",
    element: "Feu",
    mastery: 1,
    keywords: ["Artisanat"],
    range: "Contact",
    area: "1 arme à lame en acier",
    duration: "1 Minute",
    raises: "Durée (+1 minute)",
    desc: "…"
  },
  {
    id: "feu-1-burning-kiss-steel",
    name: "Baiser Brûlant de l'Acier (Burning Kiss of Steel)",
    element: "Feu",
    mastery: 1,
    keywords: ["Bataille"],
    range: "Contact",
    area: "Une arme de mêlée tenue en main par le lanceur",
    duration: "5 Minutes",
    raises: "Durée (+2 minutes)",
    desc: "…"
  },
  {
    id: "feu-1-envious-flames",
    name: "Flammes Envieuses (Envious Flames)",
    element: "Feu",
    mastery: 1,
    keywords: [],
    range: "9 mètres (30')",
    area: "Une cible",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-1-extinguish",
    name: "Éteindre (Extinguish)",
    element: "Feu",
    mastery: 1,
    keywords: [],
    range: "Personnelle",
    area: "Rayon de 30 mètres (100')",
    duration: "Instantanée",
    raises: "Zone (+6 m / +20' de rayon)",
    desc: "…"
  },
  {
    id: "feu-1-fires-purity",
    name: "Flammes de Pureté (Fires of Purity)",
    element: "Feu",
    mastery: 1,
    keywords: ["Défense"],
    range: "7,5 mètres (25')",
    area: "Une cible",
    duration: "1 Minute",
    raises: "Dégâts (+1g0 par tranche de 2 Augmentations)",
    desc: "…"
  },
  {
    id: "feu-1-fires-cleanse",
    name: "Les Feux Purificateurs (The Fires That Cleanse)",
    element: "Feu",
    mastery: 1,
    keywords: [],
    range: "Personnelle",
    area: "Rayon de 9 mètres (30')",
    duration: "Instantanée",
    raises: "Zone (+1,5 m / +5' de rayon par tranche de 2 Augmentations)",
    desc: "…"
  },
  {
    id: "feu-1-fury-osano-wo",
    name: "La Fureur d'Osano-Wo (Fury of Osano-Wo)",
    element: "Feu",
    mastery: 1,
    keywords: ["Tonnerre"],
    range: "90 mètres (300')",
    area: "Une cible",
    duration: "Instantanée",
    raises: "Dégâts (+1g0 par tranche de 2 Augmentations)",
    desc: "…"
  },
  {
    id: "feu-1-katana-fire",
    name: "Katana de Feu (Katana of Fire)",
    element: "Feu",
    mastery: 1,
    keywords: ["Bataille", "Artisanat"],
    range: "Personnelle ou 6 mètres (20')",
    area: "Une arme créée",
    duration: "5 Minutes",
    raises: "Dégâts (+1g0), Durée (+5 min), Portée (+1,5 m / +5')",
    desc: "…"
  },
  {
    id: "feu-1-never-alone",
    name: "Jamais Seul (Never Alone)",
    element: "Feu",
    mastery: 1,
    keywords: [],
    range: "Contact",
    area: "Une cible",
    duration: "5 Rounds (Spéciale)",
    raises: "Cibles (+1 cible)",
    desc: "…"
  },
  {
    id: "feu-1-raging-forge",
    name: "La Forge Furieuse (The Raging Forge)",
    element: "Feu",
    mastery: 1,
    keywords: ["Artisanat"],
    range: "Contact",
    area: "Une arme ou une armure",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 2 ---
  {
    id: "feu-2-disrupt-aura",
    name: "Perturber l'Aura (Disrupt the Aura)",
    element: "Feu",
    mastery: 2,
    keywords: [],
    range: "15 mètres (50')",
    area: "Une créature ou individu ciblé",
    duration: "24 Heures",
    raises: "Durée (+12 heures par Augmentation)",
    desc: "…"
  },
  {
    id: "feu-2-enticing-dance-flame",
    name: "Danse Séduisante de la Flamme (Enticing Dance of the Flame)",
    element: "Feu",
    mastery: 2,
    keywords: [],
    range: "15 mètres (50')",
    area: "Rayon de 6 mètres (20')",
    duration: "2 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "feu-2-fires-from-within",
    name: "Les Feux Intérieurs (The Fires From Within)",
    element: "Feu",
    mastery: 2,
    keywords: [],
    range: "30 mètres (100')",
    area: "Une cible",
    duration: "Instantanée",
    raises: "Cibles (+1 cible par tranche de 2 Augmentations)",
    desc: "…"
  },
  {
    id: "feu-2-hurried-steps",
    name: "Pas Pressés (Hurried Steps)",
    element: "Feu",
    mastery: 2,
    keywords: [],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "2 Rounds (Spéciale)",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-2-mental-quickness",
    name: "Vivacité d'Esprit (Mental Quickness)",
    element: "Feu",
    mastery: 2,
    keywords: [],
    range: "Contact",
    area: "Un objet",
    duration: "10 Minutes",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-2-relentless-heat",
    name: "Chaleur Implacable (Relentless Heat)",
    element: "Feu",
    mastery: 2,
    keywords: ["Défense"],
    range: "Contact",
    area: "Une armure",
    duration: "10 Rounds",
    raises: "Durée (+2 rounds)",
    desc: "…"
  },
  {
    id: "feu-2-tail-fire-dragon",
    name: "Queue du Dragon de Feu (Tail of the Fire Dragon)",
    element: "Feu",
    mastery: 2,
    keywords: [],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "4 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 3 ---
  {
    id: "feu-3-breath-fire-dragon",
    name: "Souffle du Dragon de Feu (Breath of the Fire Dragon)",
    element: "Feu",
    mastery: 3,
    keywords: [],
    range: "Personnelle",
    area: "Souffle de 4,5 m de long sur 1,5 m de large (15' × 5')",
    duration: "4 Rounds",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-3-fiery-wrath",
    name: "Colère Enflammée (Fiery Wrath)",
    element: "Feu",
    mastery: 3,
    keywords: [],
    range: "30 mètres (100')",
    area: "Une structure isolée ou une zone de 15 m × 15 m (50' × 50')",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-3-fist-osano-wo",
    name: "Le Poing d'Osano-Wo (The Fist of Osano-Wo)",
    element: "Feu",
    mastery: 3,
    keywords: ["Tonnerre"],
    range: "15 mètres (50')",
    area: "Rayon de 6 mètres (20')",
    duration: "1 Round",
    raises: "Zone (+3 m / +10' de rayon)",
    desc: "…"
  },
  {
    id: "feu-3-haze-battle",
    name: "Brumes de Bataille (Haze of Battle)",
    element: "Feu",
    mastery: 3,
    keywords: ["Bataille"],
    range: "3 mètres (10')",
    area: "Une cible",
    duration: "5 Rounds (ou 1 heure hors combat)",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "feu-3-hungry-blade",
    name: "Lame Affamée (Hungry Blade)",
    element: "Feu",
    mastery: 3,
    keywords: ["Artisanat"],
    range: "15 mètres (50')",
    area: "Une arme",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "feu-3-ravenous-swarms",
    name: "Essaims Dévorants (Ravenous Swarms)",
    element: "Feu",
    mastery: 3,
    keywords: [],
    range: "9 mètres (30')",
    area: "Une cible",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "feu-3-shining-light",
    name: "Lumière Éclatante (Shining Light)",
    element: "Feu",
    mastery: 3,
    keywords: ["Défense"],
    range: "9 mètres (30')",
    area: "Une armure",
    duration: "10 Rounds",
    raises: "Dégâts (+1g0 par tranche de 2 Augmentations), Durée (+2 rounds)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 4 ---
  {
    id: "feu-4-death-flame",
    name: "Mort de la Flamme (Death of Flame)",
    element: "Feu",
    mastery: 4,
    keywords: [],
    range: "30 mètres (100')",
    area: "Une cible",
    duration: "5 Rounds",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-4-defense-firestorm",
    name: "Défense de la Tempête de Feu (Defense of the Firestorm)",
    element: "Feu",
    mastery: 4,
    keywords: ["Défense"],
    range: "Contact",
    area: "Une armure",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "feu-4-mending-forge",
    name: "La Forge Réparatrice (The Mending Forge)",
    element: "Feu",
    mastery: 4,
    keywords: ["Artisanat"],
    range: "Contact",
    area: "Un objet ciblé",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-4-symbol-fire",
    name: "Symbole de Feu (Symbol of Fire)",
    element: "Feu",
    mastery: 4,
    keywords: ["Sceau"],
    range: "30 mètres (100')",
    area: "Rayon de 3 mètres (10')",
    duration: "Permanente",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-4-wall-fire",
    name: "Mur de Feu (Wall of Fire)",
    element: "Feu",
    mastery: 4,
    keywords: [],
    range: "30 mètres (100')",
    area: "Mur de 3 m de haut, 30 cm d'épaisseur et 7,5 m de long (10' × 1' × 25')",
    duration: "1 Heure",
    raises: "Zone (+1 segment de mêmes dimensions par Augmentation)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 5 ---
  {
    id: "feu-5-destructive-wave",
    name: "Vague Destructrice (Destructive Wave)",
    element: "Feu",
    mastery: 5,
    keywords: [],
    range: "Personnelle",
    area: "Rayon de 7,5 mètres (25')",
    duration: "Instantanée",
    raises: "Dégâts (+1k1 par tranche de 2 Augmentations)",
    desc: "…"
  },
  {
    id: "feu-5-everburning-rage",
    name: "Rage Inextinguible (Everburning Rage)",
    element: "Feu",
    mastery: 5,
    keywords: [],
    range: "7,5 mètres (25')",
    area: "Une cible",
    duration: "1 Round",
    raises: "Durée (+1 round), Cibles (+1 cible)",
    desc: "…"
  },
  {
    id: "feu-5-follow-flame",
    name: "Poursuite de la Flamme (Follow the Flame)",
    element: "Feu",
    mastery: 5,
    keywords: [],
    range: "Personnelle",
    area: "Spéciale",
    duration: "5 Rounds",
    raises: "Dégâts (+1k0 par Augmentation)",
    desc: "…"
  },
  {
    id: "feu-5-wings-phoenix",
    name: "Les Ailes du Phénix (Wings of the Phoenix)",
    element: "Feu",
    mastery: 5,
    keywords: ["Voyage"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "10 Rounds",
    raises: "Aucune",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 6 ---
  {
    id: "feu-6-beam-inferno",
    name: "Rayon du Brasier (Beam of the Inferno)",
    element: "Feu",
    mastery: 6,
    keywords: [],
    range: "60 mètres (200')",
    area: "Une cible",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-6-globe-everlasting-sun",
    name: "Globe du Soleil Éternel (Globe of the Everlasting Sun)",
    element: "Feu",
    mastery: 6,
    keywords: ["Défense"],
    range: "150 mètres (500')",
    area: "Rayon de 1,5 kilomètre (1 mile)",
    duration: "1 Jour",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "feu-6-souls-blade",
    name: "La Lame de l'Âme (The Soul's Blade)",
    element: "Feu",
    mastery: 6,
    keywords: ["Artisanat"],
    range: "Contact",
    area: "Une arme",
    duration: "5 Rounds",
    raises: "Durée (+1 round par tranche de 3 Augmentations)",
    desc: "…"
  }
];

if (typeof window !== "undefined") {
  window.SORTS_FEU = SORTS_FEU;
}
