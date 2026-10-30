const SORTS_TERRE = [
  // --- NIVEAU DE MAÎTRISE 1 ---
  {
    id: "earth-1-armor-earth",
    name: "Armure de Terre (Armor of Earth)",
    element: "Terre",
    mastery: 1,
    keywords: ["Bataille", "Défense"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "10 Rounds",
    raises: "Durée (+2 rounds par Augmentation)",
    desc: "…"
  },
  {
    id: "earth-1-courage-thunders",
    name: "Courage des Sept Tonnerres (Courage of the Seven Thunders)",
    element: "Terre",
    mastery: 1,
    keywords: ["Bataille"],
    range: "9 mètres (30')",
    area: "Nombre de cibles égal au Rang d'École du shugenja",
    duration: "10 Minutes",
    raises: "Durée (+1 minute), Cibles (+1)",
    desc: "…"
  },
  {
    id: "earth-1-stagnation",
    name: "Stagnation de la Terre (Earth's Stagnation)",
    element: "Terre",
    mastery: 1,
    keywords: [],
    range: "15 mètres (50')",
    area: "Une cible",
    duration: "6 Rounds",
    raises: "Durée (+2 rounds), Portée (+3 m / +10'), Cibles (+1, max 4 cibles au total)",
    desc: "…"
  },
  {
    id: "earth-1-earths-touch",
    name: "Le Toucher de la Terre (Earth's Touch)",
    element: "Terre",
    mastery: 1,
    keywords: ["Défense"],
    range: "Contact",
    area: "Une cible",
    duration: "1 Heure",
    raises: "Durée (+30 minutes), Cibles (+1 par 2 Augmentations, max 3 cibles au total)",
    desc: "…"
  },
  {
    id: "earth-1-elemental-ward",
    name: "Garde Élémentaire (Elemental Ward)",
    element: "Terre",
    mastery: 1,
    keywords: ["Sceau"],
    range: "Contact",
    area: "Une cible",
    duration: "1 Heure",
    raises: "Durée (+30 minutes), Cibles (+1 par 2 Augmentations)",
    desc: "…"
  },
  {
    id: "earth-1-jade-strike",
    name: "Frappe de Jade (Jade Strike)",
    element: "Terre",
    mastery: 1,
    keywords: ["Jade", "Tonnerre"],
    range: "30 mètres (100')",
    area: "Une cible",
    duration: "Instantanée",
    raises: "Dégâts (+1g0), Portée (+3 m / +10'), Cibles (+1 cible, max 5 cibles au total)",
    desc: "…"
  },
  {
    id: "earth-1-jurojins-balm",
    name: "Le Baume de Jurojin (Jurojin's Balm)",
    element: "Terre",
    mastery: 1,
    keywords: [],
    range: "Contact",
    area: "Une cible",
    duration: "1 Heure",
    raises: "Durée (+30 minutes), Cibles (+1 par 2 Augmentations, max 5 cibles au total)",
    desc: "…"
  },
  {
    id: "earth-1-tetsubo-earth",
    name: "Tetsubō de Terre (Tetsubo of Earth)",
    element: "Terre",
    mastery: 1,
    keywords: ["Artisanat", "Jade"],
    range: "Personnelle ou 6 mètres (20')",
    area: "Une arme créée",
    duration: "5 Minutes",
    raises: "Dégâts (+1g0), Durée (+5 minutes), Portée (+1,5 m / +5')",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 2 ---
  {
    id: "earth-2-be-mountain",
    name: "Être la Montagne (Be the Mountain)",
    element: "Terre",
    mastery: 2,
    keywords: ["Défense"],
    range: "9 mètres (30')",
    area: "Une créature ciblée (allié volontaire)",
    duration: "4 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "earth-2-earth-becomes-sky",
    name: "La Terre Devient Ciel (Earth Becomes Sky)",
    element: "Terre",
    mastery: 2,
    keywords: ["Jade", "Tonnerre"],
    range: "30 mètres (100')",
    area: "Une créature ciblée",
    duration: "Instantanée",
    raises: "Dégâts (+1g0), Cibles (+1 créature), Spéciale (imprégner les rochers de Jade avec 2 Augmentations)",
    desc: "…"
  },
  {
    id: "earth-2-embrace-kenro",
    name: "L'Étreinte de Kenro-Ji-Jin (Embrace of Kenro-Ji-Jin)",
    element: "Terre",
    mastery: 2,
    keywords: ["Voyage"],
    range: "Personnelle ou Contact",
    area: "Une créature ciblée",
    duration: "1 Heure",
    raises: "Durée (+30 minutes)",
    desc: "…"
  },
  {
    id: "earth-2-force-will",
    name: "Force de Volonté (Force of Will)",
    element: "Terre",
    mastery: 2,
    keywords: ["Bataille"],
    range: "15 mètres (50')",
    area: "Une cible",
    duration: "2 Rounds",
    raises: "Durée (+1 round, max 4 rounds au total)",
    desc: "…"
  },
  {
    id: "earth-2-grasp-earth",
    name: "L'Étreinte de la Terre (Grasp of Earth)",
    element: "Terre",
    mastery: 2,
    keywords: [],
    range: "15 mètres (50')",
    area: "Une cible",
    duration: "5 Rounds",
    raises: "Durée (+1 round), Portée (+1,5 m / +5'), Cibles (+1 par 2 Augmentations)",
    desc: "…"
  },
  {
    id: "earth-2-hands-clay",
    name: "Mains d'Argile (Hands of Clay)",
    element: "Terre",
    mastery: 2,
    keywords: ["Voyage"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "10 Minutes",
    raises: "Durée (+5 minutes)",
    desc: "…"
  },
  {
    id: "earth-2-minor-binding",
    name: "Lien Mineur (Minor Binding)",
    element: "Terre",
    mastery: 2,
    keywords: ["Sceau"],
    range: "9 mètres (30')",
    area: "Une créature spirituelle ciblée",
    duration: "10 Minutes",
    raises: "Durée (+5 minutes), Portée (+3 m / +10')",
    desc: "…"
  },
  {
    id: "earth-2-mountains-feet",
    name: "Les Pieds de la Montagne (The Mountain's Feet)",
    element: "Terre",
    mastery: 2,
    keywords: ["Défense"],
    range: "Personnelle ou 6 mètres (20')",
    area: "Une cible",
    duration: "1 Heure",
    raises: "Durée (+30 minutes), Cibles (+1 par 2 Augmentations)",
    desc: "…"
  },
  {
    id: "earth-2-wholeness-world",
    name: "L'Intégrité du Monde (Wholeness of the World)",
    element: "Terre",
    mastery: 2,
    keywords: ["Défense"],
    range: "Personnelle ou 6 mètres (20')",
    area: "Une créature ciblée",
    duration: "10 Minutes",
    raises: "Durée (+1 minute), Portée (+1,5 m / +5'), Cibles (+1 par 2 Augmentations)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 3 ---
  {
    id: "earth-3-bonds-ningendo",
    name: "Les Liens de Ningen-dō (Bonds of Ningen-Do)",
    element: "Terre",
    mastery: 3,
    keywords: ["Sceau"],
    range: "150 mètres (500')",
    area: "Une créature spirituelle ciblée",
    duration: "30 Jours",
    raises: "Durée (+1 jour), Portée (+3 m / +10'), Cibles (+1 par 2 Augmentations)",
    desc: "…"
  },
  {
    id: "earth-3-earth-kami-blessing",
    name: "Bénédiction du Kami de Terre (Earth Kami's Blessing)",
    element: "Terre",
    mastery: 3,
    keywords: ["Bataille"],
    range: "Personnelle ou 6 mètres (20')",
    area: "Le lanceur ou une créature ciblée",
    duration: "10 Minutes",
    raises: "Durée (+1 minute)",
    desc: "…"
  },
  {
    id: "earth-3-earths-protection",
    name: "Protection de la Terre (Earth's Protection)",
    element: "Terre",
    mastery: 3,
    keywords: ["Défense", "Sceau"],
    range: "Personnelle",
    area: "Rayon de 3 mètres (10') autour du shugenja",
    duration: "Concentration",
    raises: "Zone (+1,5 m de rayon par 2 Augmentations, max 9 m / 30'), Dégâts absorbés (+1g1 supplémentaire pour 2 Augmentations)",
    desc: "…"
  },
  {
    id: "earth-3-sharing-strength",
    name: "Partager la Force du Nombre (Sharing the Strength of Many)",
    element: "Terre",
    mastery: 3,
    keywords: [],
    range: "9 mètres (30')",
    area: "1 à 6 personnes désignées à portée (peut inclure le lanceur)",
    duration: "5 Rounds",
    raises: "Durée (+1 round), Portée (+1,5 m / +5')",
    desc: "…"
  },
  {
    id: "earth-3-strength-crow",
    name: "La Force du Corbeau (Strength of the Crow)",
    element: "Terre",
    mastery: 3,
    keywords: ["Jade"],
    range: "Contact",
    area: "Une cible (peut être le lanceur)",
    duration: "Nombre d'heures égal au Rang d'École du lanceur",
    raises: "Durée (+1 heure), Cibles (+1)",
    desc: "…"
  },
  {
    id: "earth-3-wolfs-mercy",
    name: "La Miséricorde du Loup (The Wolf's Mercy)",
    element: "Terre",
    mastery: 3,
    keywords: [],
    range: "15 mètres (50')",
    area: "Une créature ciblée",
    duration: "10 Rounds",
    raises: "Portée (+3 m / +10'), Cibles (+1)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 4 ---
  {
    id: "earth-4-armor-emperor",
    name: "L'Armure de l'Empereur (Armor of the Emperor)",
    element: "Terre",
    mastery: 4,
    keywords: ["Défense"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "5 Rounds",
    raises: "Durée (+2 rounds)",
    desc: "…"
  },
  {
    id: "earth-4-essence-earth",
    name: "Essence de Terre (Essence of Earth)",
    element: "Terre",
    mastery: 4,
    keywords: ["Bataille"],
    range: "Personnelle ou 6 mètres (20')",
    area: "Une créature ciblée (le lanceur ou autrui)",
    duration: "10 Rounds",
    raises: "Durée (+1 round), Portée (+1,5 m / +5'), Cibles (+1 par 2 Augmentations), Spéciale (+1 Rang de Terre par 2 Augmentations, max +3 Rangs)",
    desc: "…"
  },
  {
    id: "earth-4-major-binding",
    name: "Lien Majeur (Major Binding)",
    element: "Terre",
    mastery: 4,
    keywords: ["Sceau"],
    range: "15 mètres (50')",
    area: "Une créature spirituelle ciblée",
    duration: "1 Heure",
    raises: "Durée (+30 minutes), Portée (+3 m / +10')",
    desc: "…"
  },
  {
    id: "earth-4-symbol-earth",
    name: "Symbole de Terre (Symbol of Earth)",
    element: "Terre",
    mastery: 4,
    keywords: ["Sceau"],
    range: "Contact",
    area: "Spéciale (un passage, porte, fenêtre ou portail)",
    duration: "Permanente",
    raises: "Dégâts (+1g0)",
    desc: "…"
  },
  {
    id: "earth-4-tomb-jade",
    name: "Le Tombeau de Jade (Tomb of Jade)",
    element: "Terre",
    mastery: 4,
    keywords: ["Jade"],
    range: "15 mètres (50')",
    area: "Une créature ciblée",
    duration: "Concentration",
    raises: "Portée (+3 m / +10'), Spéciale (+1g1 au jet opposé par Augmentation)",
    desc: "…"
  },
  {
    id: "earth-4-wall-earth",
    name: "Mur de Terre (Wall of Earth)",
    element: "Terre",
    mastery: 4,
    keywords: ["Défense"],
    range: "30 mètres (100')",
    area: "Mur atteignant jusqu'à 3 m (10') de haut et 30 m (100') de long",
    duration: "10 Minutes",
    raises: "Dimensions (+30 cm en hauteur ou +3 m en longueur par Augmentation), Durée (+1 minute), Portée (+3 m / +10')",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 5 ---
  {
    id: "earth-5-kamis-strength",
    name: "La Force des Kami (The Kami's Strength)",
    element: "Terre",
    mastery: 5,
    keywords: ["Bataille"],
    range: "9 mètres (30')",
    area: "Une créature ciblée",
    duration: "5 Rounds",
    raises: "Durée (+1 round), Portée (+3 m / +10')",
    desc: "…"
  },
  {
    id: "earth-5-kamis-will",
    name: "La Volonté des Kami (The Kami's Will)",
    element: "Terre",
    mastery: 5,
    keywords: ["Défense"],
    range: "9 mètres (30')",
    area: "Une créature ciblée",
    duration: "10 Rounds",
    raises: "Durée (+1 round), Portée (+3 m / +10')",
    desc: "…"
  },
  {
    id: "earth-5-strike-roots",
    name: "Frapper aux Racines (Strike at the Roots)",
    element: "Terre",
    mastery: 5,
    keywords: [],
    range: "15 mètres (50')",
    area: "Une créature ciblée",
    duration: "3 Rounds",
    raises: "Durée (+1 round), Portée (+3 m / +10'), Cibles (+1 par 2 Augmentations), Spéciale (+1g1 au jet opposé par Augmentation)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 6 ---
  {
    id: "earth-6-essence-jade",
    name: "Essence de Jade (Essence of Jade)",
    element: "Terre",
    mastery: 6,
    keywords: ["Défense", "Jade"],
    range: "9 mètres (30')",
    area: "Une créature ciblée",
    duration: "10 Rounds",
    raises: "Durée (+1 round), Portée (+1,5 m / +5'), Cibles (+1 par 2 Augmentations, max 3 cibles au total)",
    desc: "…"
  },
  {
    id: "earth-6-power-earth-dragon",
    name: "Pouvoir du Dragon de la Terre (Power of the Earth Dragon)",
    element: "Terre",
    mastery: 6,
    keywords: ["Défense"],
    range: "15 mètres (50')",
    area: "Une créature ciblée",
    duration: "10 Minutes",
    raises: "Durée (+1 minute), Portée (+3 m / +10'), Cibles (+1), Spéciale (capacité d'absorption +10 Blessures par Augmentation)",
    desc: "…"
  },
  {
    id: "earth-6-prison-earth",
    name: "Prison de Terre (Prison of Earth)",
    element: "Terre",
    mastery: 6,
    keywords: ["Sceau"],
    range: "9 mètres (30')",
    area: "Une créature ciblée",
    duration: "Permanente",
    raises: "Portée (+1,5 m / +5'), Spéciale (+1g1 au jet opposé par Augmentation)",
    desc: "…"
  },
  {
    id: "earth-6-rise-earth",
    name: "Éveil de la Terre (Rise, Earth)",
    element: "Terre",
    mastery: 6,
    keywords: [],
    range: "9 mètres (30')",
    area: "Un esprit invoqué",
    duration: "Concentration",
    raises: "Aucune",
    desc: "…"
  }
];

if (typeof window !== "undefined") {
  window.SORTS_TERRE = SORTS_TERRE;
}
