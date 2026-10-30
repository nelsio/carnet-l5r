const SORTS_AIR = [
  // --- NIVEAU DE MAÎTRISE 1 ---
  {
    id: "air-1-blessed-wind",
    name: "Le Vent Bienveillant (Blessed Wind)",
    element: "Air",
    mastery: 1,
    keywords: ["Défense"],
    range: "Personnelle",
    area: "Rayon de 3 m autour du lanceur",
    duration: "Concentration",
    raises: "Spéciale (cibler autrui avec 3 Augmentations)",
    desc: "…"
  },
  {
    id: "air-1-legacy-kaze",
    name: "L'Héritage de Kaze-no-Kami (Legacy of Kaze-no-Kami)",
    element: "Air",
    mastery: 1,
    keywords: ["Artisanat"],
    range: "Rang d'École × 15 km",
    area: "Un individu connu à portée",
    duration: "Spéciale",
    raises: "Zone (+1 individu), Portée (+15 km)",
    desc: "…"
  },
  {
    id: "air-1-natures-touch",
    name: "Le Toucher de la Nature (Nature's Touch)",
    element: "Air",
    mastery: 1,
    keywords: [],
    range: "3 mètres",
    area: "Une créature",
    duration: "Spéciale",
    raises: "Portée (+3 m)",
    desc: "…"
  },
  {
    id: "air-1-tempest-air",
    name: "Tempête d'Air (Tempest of Air)",
    element: "Air",
    mastery: 1,
    keywords: ["Tonnerre"],
    range: "Personnelle",
    area: "Cône de 22,5 m de long sur 4,5 m de large à son extrémité",
    duration: "Instantanée",
    raises: "Zone (+1,5 m en largeur), Dégâts (+1g0), Portée (+1,5 m en longueur), Spéciale (+5 au ND d'Air contre le Renversement par Augmentation)",
    desc: "…"
  },
  {
    id: "air-1-token-memory",
    name: "Jeton de Mémoire (Token of Memory)",
    element: "Air",
    mastery: 1,
    keywords: ["Artisanat", "Illusion"],
    range: "3 mètres",
    area: "Un petit objet illusoire (0,03 m³ ou moins)",
    duration: "1 Heure",
    raises: "Zone (+0,03 m³ au volume), Durée (+1 heure)",
    desc: "…"
  },
  {
    id: "air-1-seek-truth",
    name: "Chercher la Vérité (To Seek the Truth)",
    element: "Air",
    mastery: 1,
    keywords: [],
    range: "Personnelle / Contact",
    area: "Un individu touché (peut être le lanceur)",
    duration: "5 Minutes",
    raises: "Durée (+1 minute)",
    desc: "…"
  },
  {
    id: "air-1-way-deception",
    name: "La Voie de la Tromperie (Way of Deception)",
    element: "Air",
    mastery: 1,
    keywords: ["Illusion"],
    range: "6 mètres",
    area: "Un double illusoire du lanceur",
    duration: "Concentration + 5 minutes",
    raises: "Zone (+1 double par 2 Augmentations), Portée (+1,5 m), Spéciale (voir description)",
    desc: "…"
  },
  {
    id: "air-1-yari-air",
    name: "Lance d'Air (Yari of Air)",
    element: "Air",
    mastery: 1,
    keywords: ["Artisanat", "Tonnerre"],
    range: "Personnelle ou 6 m",
    area: "Une arme créée",
    duration: "5 Minutes",
    raises: "Dégâts (+1g0), Durée (+5 min), Portée (+1,5 m)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 2 ---
  {
    id: "air-2-bentens-touch",
    name: "Le Toucher de Benten (Benten's Touch)",
    element: "Air",
    mastery: 2,
    keywords: [],
    range: "Personnelle / Contact",
    area: "Un individu ciblé (peut être le lanceur)",
    duration: "1 Heure",
    raises: "Portée (passe à 1,5 m avec 1 Augmentation)",
    desc: "…"
  },
  {
    id: "air-2-call-upon-wind",
    name: "Appel au Vent (Call Upon the Wind)",
    element: "Air",
    mastery: 2,
    keywords: ["Voyage"],
    range: "Personnelle ou 6 m",
    area: "Un individu ciblé (peut être le lanceur)",
    duration: "1 Minute",
    raises: "Durée (+1 min), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "air-2-hidden-visage",
    name: "Visage Dissimulé (Hidden Visage)",
    element: "Air",
    mastery: 2,
    keywords: ["Illusion"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "5 Minutes",
    raises: "Zone (cibler un tiers en ligne de vue avec 3 Augmentations), Durée (+5 min)",
    desc: "…"
  },
  {
    id: "air-2-kamis-whisper",
    name: "Le Murmure des Kami (The Kami's Whisper)",
    element: "Air",
    mastery: 2,
    keywords: ["Illusion"],
    range: "15 mètres",
    area: "Rayon de 3 mètres",
    duration: "1 Round",
    raises: "Zone (+1,5 m de rayon), Durée (+1 round), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "air-2-mists-illusion",
    name: "Les Brumes de l'Illusion (Mists of Illusion)",
    element: "Air",
    mastery: 2,
    keywords: ["Artisanat", "Illusion"],
    range: "6 mètres",
    area: "Rayon de 3 mètres",
    duration: "1 Minute",
    raises: "Zone (+1,5 m), Durée (+1 min), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "air-2-secrets-wind",
    name: "Secrets sur le Vent (Secrets on the Wind)",
    element: "Air",
    mastery: 2,
    keywords: [],
    range: "15 km",
    area: "Rayon de 6 mètres",
    duration: "Concentration",
    raises: "Zone (+1,5 m de rayon), Portée (+7,5 km)",
    desc: "…"
  },
  {
    id: "air-2-whispering-wind",
    name: "Vent Murmurant (Whispering Wind)",
    element: "Air",
    mastery: 2,
    keywords: ["Divination"],
    range: "6 mètres",
    area: "Un individu ciblé",
    duration: "Instantanée",
    raises: "Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "air-2-wolfs-proposal",
    name: "La Proposition du Loup (Wolf's Proposal)",
    element: "Air",
    mastery: 2,
    keywords: ["Illusion", "Social"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "10 Minutes",
    raises: "Durée (+5 min)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 3 ---
  {
    id: "air-3-essence-air",
    name: "Essence d'Air (Essence of Air)",
    element: "Air",
    mastery: 3,
    keywords: ["Défense"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "air-3-eye-shall-not-see",
    name: "L'Œil ne Verra Pas (The Eye Shall Not See)",
    element: "Air",
    mastery: 3,
    keywords: ["Défense"],
    range: "Personnelle ou Contact",
    area: "Le lanceur ou un individu ciblé",
    duration: "Concentration",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "air-3-mask-wind",
    name: "Masque de Vent (Mask of Wind)",
    element: "Air",
    mastery: 3,
    keywords: ["Illusion"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "1 Heure",
    raises: "Zone (cibler un tiers avec 2 Augmentations), Durée (+10 min)",
    desc: "…"
  },
  {
    id: "air-3-striking-storm",
    name: "Frapper la Tempête (Striking the Storm)",
    element: "Air",
    mastery: 3,
    keywords: ["Défense"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "3 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "air-3-summon-fog",
    name: "Invoquer le Brouillard (Summon Fog)",
    element: "Air",
    mastery: 3,
    keywords: [],
    range: "30 mètres",
    area: "Rayon de 30 mètres",
    duration: "10 Minutes",
    raises: "Zone (+15 m de rayon), Durée (+5 min)",
    desc: "…"
  },
  {
    id: "air-3-summoning-gale",
    name: "Appel de la Bourrasque (Summoning the Gale)",
    element: "Air",
    mastery: 3,
    keywords: ["Défense"],
    range: "15 mètres",
    area: "Un individu ciblé (rayon de 9 m autour de lui)",
    duration: "Concentration",
    raises: "Portée (+1,5 m)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 4 ---
  {
    id: "air-4-call-spirit",
    name: "Appel de l'Esprit (Call the Spirit)",
    element: "Air",
    mastery: 4,
    keywords: [],
    range: "Spéciale",
    area: "Un esprit ciblé",
    duration: "5 Minutes",
    raises: "Durée (+1 minute)",
    desc: "…"
  },
  {
    id: "air-4-false-realm",
    name: "Royaume Illusoire (False Realm)",
    element: "Air",
    mastery: 4,
    keywords: ["Bataille", "Illusion"],
    range: "75 mètres",
    area: "Rayon de 30 mètres",
    duration: "1 Heure",
    raises: "Zone (+3 m de rayon), Durée (+10 min)",
    desc: "…"
  },
  {
    id: "air-4-gift-wind",
    name: "Le Don du Vent (Gift of Wind)",
    element: "Air",
    mastery: 4,
    keywords: ["Illusion"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "5 Minutes",
    raises: "Durée (+1 minute)",
    desc: "…"
  },
  {
    id: "air-4-know-mind",
    name: "Connaître l'Esprit (Know the Mind)",
    element: "Air",
    mastery: 4,
    keywords: [],
    range: "3 mètres",
    area: "Un individu ciblé",
    duration: "3 Rounds",
    raises: "Durée (+1 round), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "air-4-netsuke-wind",
    name: "Netsuke de Vent (Netsuke of Wind)",
    element: "Air",
    mastery: 4,
    keywords: ["Artisanat", "Illusion"],
    range: "Contact",
    area: "Un objet tenu en main",
    duration: "1 Heure",
    raises: "Durée (+10 min)",
    desc: "…"
  },
  {
    id: "air-4-symbol-air",
    name: "Symbole d'Air (Symbol of Air)",
    element: "Air",
    mastery: 4,
    keywords: ["Sceau"],
    range: "Contact",
    area: "Spéciale (un passage, porte ou fenêtre)",
    duration: "Permanente",
    raises: "Aucune",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 5 ---
  {
    id: "air-5-cloud-mind",
    name: "Troubler l'Esprit (Cloud the Mind)",
    element: "Air",
    mastery: 5,
    keywords: [],
    range: "Contact",
    area: "Un individu ciblé",
    duration: "Permanente",
    raises: "Spéciale (+1 jour de mémoire altérée par Augmentation)",
    desc: "…"
  },
  {
    id: "air-5-draw-back-shadow",
    name: "Dissiper les Ombres (Draw Back the Shadow)",
    element: "Air",
    mastery: 5,
    keywords: [],
    range: "30 mètres",
    area: "Rayon de 9 mètres",
    duration: "Instantanée",
    raises: "Zone (+1,5 m de rayon), Portée (+3 m)",
    desc: "…"
  },
  {
    id: "air-5-echoes-breeze",
    name: "Échos sur la Brise (Echoes on the Breeze)",
    element: "Air",
    mastery: 5,
    keywords: [],
    range: "Personnelle",
    area: "Un individu ciblé",
    duration: "Concentration",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "air-5-slayers-knives",
    name: "Les Lames du Tueur (Slayer's Knives)",
    element: "Air",
    mastery: 5,
    keywords: ["Tonnerre"],
    range: "9 mètres",
    area: "Couloir d'air de 3 m de large",
    duration: "Instantanée",
    raises: "Zone (+1 m de largeur), Dégâts (+1g0 pour 3 Augmentations)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 6 ---
  {
    id: "air-6-rise-air",
    name: "Éveil de l'Air (Rise, Air)",
    element: "Air",
    mastery: 6,
    keywords: [],
    range: "9 mètres",
    area: "Un esprit invoqué",
    duration: "Concentration",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "air-6-false-legion",
    name: "La Fausse Légion (The False Legion)",
    element: "Air",
    mastery: 6,
    keywords: ["Bataille", "Illusion"],
    range: "Personnelle",
    area: "À moins de 30 m du lanceur",
    duration: "Concentration",
    raises: "Zone (+3 m), Spéciale (+5 silhouettes par Augmentation)",
    desc: "…"
  },
  {
    id: "air-6-wrath-kaze",
    name: "La Colère de Kaze-no-Kami (Wrath of Kaze-no-Kami / Hurricane)",
    element: "Air",
    mastery: 6,
    keywords: ["Tonnerre"],
    range: "Personnelle",
    area: "Rayon de 1,5 km centré sur le lanceur",
    duration: "Concentration (max 1 heure)",
    raises: "Aucune",
    desc: "…"
  }
];

if (typeof window !== "undefined") {
  window.SORTS_AIR = SORTS_AIR;
}
