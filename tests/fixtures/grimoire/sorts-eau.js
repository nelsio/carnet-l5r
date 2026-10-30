const SORTS_EAU = [
  // --- NIVEAU DE MAÎTRISE 1 ---
  {
    id: "eau-1-path-inner-peace",
    name: "La Voie vers la Paix Intérieure (Path to Inner Peace)",
    element: "Eau",
    mastery: 1,
    keywords: ["Guérison"],
    range: "Contact",
    area: "Une créature vivante ciblée",
    duration: "Instantanée",
    raises: "Cibles (+1 individu par 2 Augmentations), Spéciale (+1g0 au jet de guérison par Augmentation)",
    desc: "…"
  },
  {
    id: "eau-1-reflections-pan-ku",
    name: "Les Reflets de P'an Ku (Reflections of P'an Ku)",
    element: "Eau",
    mastery: 1,
    keywords: ["Divination"],
    range: "Contact",
    area: "Un miroir ou une surface réfléchissante",
    duration: "1 Heure",
    raises: "Durée (+1 heure par Augmentation)",
    desc: "…"
  },
  {
    id: "eau-1-reversal-fortunes",
    name: "Renversement de Fortune (Reversal of Fortunes)",
    element: "Eau",
    mastery: 1,
    keywords: [],
    range: "3 mètres",
    area: "Un individu ciblé",
    duration: "3 Rounds",
    raises: "Durée (+1 round), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "eau-1-sympathetic-energies",
    name: "Énergies Sympathiques (Sympathetic Energies)",
    element: "Eau",
    mastery: 1,
    keywords: [],
    range: "Contact",
    area: "Un individu ciblé",
    duration: "10 Minutes",
    raises: "Durée (+5 minutes), Portée (passe à 1,5 m avec 1 Augmentation)",
    desc: "…"
  },
  {
    id: "eau-1-rushing-wave",
    name: "La Vague Déferlante (The Rushing Wave)",
    element: "Eau",
    mastery: 1,
    keywords: ["Voyage"],
    range: "3 mètres",
    area: "Une créature ciblée",
    duration: "Instantanée",
    raises: "Portée (+1,5 m), Cibles (+1 individu par 2 Augmentations)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 2 ---
  {
    id: "eau-2-bo-water",
    name: "Bō d'Eau (Bō of Water)",
    element: "Eau",
    mastery: 2,
    keywords: ["Artisanat"],
    range: "Personnelle ou 6 mètres",
    area: "Une arme créée",
    duration: "5 Minutes",
    raises: "Dégâts (+1g0), Durée (+5 min), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "eau-2-fog-green-net",
    name: "La Brume du Filet Vert (Fog of the Green Net)",
    element: "Eau",
    mastery: 2,
    keywords: [],
    range: "9 mètres",
    area: "Rayon de 9 mètres autour du point ciblé",
    duration: "1 Heure",
    raises: "Zone (+3 m de rayon), Durée (+1 heure), Portée (+3 m)",
    desc: "…"
  },
  {
    id: "eau-2-rejuvenating-vapors",
    name: "Vapeurs Régénératrices (Rejuvenating Vapors)",
    element: "Eau",
    mastery: 2,
    keywords: ["Guérison"],
    range: "Personnelle",
    area: "Rayon de 3 mètres autour du lanceur",
    duration: "Concentration",
    raises: "Zone (+1,5 m de rayon)",
    desc: "…"
  },
  {
    id: "eau-2-wave-borne-speed",
    name: "Vitesse Portée par les Vagues (Wave-Borne Speed)",
    element: "Eau",
    mastery: 2,
    keywords: ["Voyage"],
    range: "Contact",
    area: "Un individu ciblé",
    duration: "10 Rounds",
    raises: "Durée (+2 rounds), Cibles (+1 individu par 2 Augmentations)",
    desc: "…"
  },
  {
    id: "eau-2-wisdom-clarity",
    name: "Sagesse et Clarté (Wisdom and Clarity)",
    element: "Eau",
    mastery: 2,
    keywords: [],
    range: "Contact",
    area: "Une créature ciblée",
    duration: "1 Heure",
    raises: "Durée (+1 heure), Cibles (+1 créature par 2 Augmentations)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 3 ---
  {
    id: "eau-3-castle-water",
    name: "Château d'Eau (Castle of Water)",
    element: "Eau",
    mastery: 3,
    keywords: ["Défense"],
    range: "3 mètres",
    area: "Dôme protecteur d'un rayon de 3 mètres",
    duration: "5 Rounds",
    raises: "Zone (+1,5 m de rayon), Durée (+1 round), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "eau-3-flowing-river",
    name: "Rivière Fluide (Flowing River)",
    element: "Eau",
    mastery: 3,
    keywords: ["Bataille"],
    range: "Contact",
    area: "Une arme de mêlée",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "eau-3-near-to-ice",
    name: "Proche de la Glace (Near to Ice)",
    element: "Eau",
    mastery: 3,
    keywords: ["Défense"],
    range: "Contact",
    area: "Un individu ciblé",
    duration: "10 Rounds",
    raises: "Durée (+2 rounds)",
    desc: "…"
  },
  {
    id: "eau-3-silent-waters",
    name: "Eaux Silencieuses (Silent Waters)",
    element: "Eau",
    mastery: 3,
    keywords: ["Défense"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "Spéciale",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "eau-3-walking-upon-waters",
    name: "Marcher sur les Eaux (Walking Upon the Waters)",
    element: "Eau",
    mastery: 3,
    keywords: ["Voyage"],
    range: "Contact",
    area: "Un individu ciblé",
    duration: "1 Heure",
    raises: "Durée (+1 heure), Cibles (+1 individu par 2 Augmentations)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 4 ---
  {
    id: "eau-4-ebb-flow-battle",
    name: "Le Flux et Reflux du Combat (Ebb & Flow of Battle)",
    element: "Eau",
    mastery: 4,
    keywords: ["Bataille"],
    range: "Personnelle",
    area: "Tous les alliés désignés dans un rayon de 15 mètres autour du lanceur",
    duration: "5 Rounds",
    raises: "Durée (+1 round par 2 Augmentations)",
    desc: "…"
  },
  {
    id: "eau-4-strike-flowing-waters",
    name: "La Frappe des Eaux Vives (Strike of the Flowing Waters)",
    element: "Eau",
    mastery: 4,
    keywords: [],
    range: "3 mètres",
    area: "Un individu ciblé (peut être le lanceur)",
    duration: "1 Round",
    raises: "Durée (+1 round), Portée (+1,5 m)",
    desc: "…"
  },
  {
    id: "eau-4-hands-tides",
    name: "Les Mains des Marées (Hands of the Tides)",
    element: "Eau",
    mastery: 4,
    keywords: [],
    range: "30 mètres",
    area: "Un volume d'eau allant jusqu'à (Anneau d'Eau × 15 m³)",
    duration: "Concentration",
    raises: "Portée (+15 m), Volume (+5 m³ par Augmentation)",
    desc: "…"
  },
  {
    id: "eau-4-symbol-water",
    name: "Symbole d'Eau (Symbol of Water)",
    element: "Eau",
    mastery: 4,
    keywords: ["Sceau"],
    range: "Contact",
    area: "Spéciale (une porte, fenêtre ou passage)",
    duration: "Permanente",
    raises: "Aucune",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 5 ---
  {
    id: "eau-5-power-ocean",
    name: "La Puissance de l'Océan (Power of the Ocean)",
    element: "Eau",
    mastery: 5,
    keywords: ["Bataille"],
    range: "Personnelle ou Contact",
    area: "Un individu ciblé",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "eau-5-incline-willow",
    name: "Courber le Saule (Incline the Willow)",
    element: "Eau",
    mastery: 5,
    keywords: ["Défense"],
    range: "Personnelle",
    area: "Le lanceur",
    duration: "5 Rounds",
    raises: "Durée (+1 round)",
    desc: "…"
  },
  {
    id: "eau-5-surge-water",
    name: "Poussée des Eaux (Surge of Water)",
    element: "Eau",
    mastery: 5,
    keywords: [],
    range: "30 mètres",
    area: "Cône de 15 mètres de long sur 6 mètres de large à son extrémité",
    duration: "Instantanée",
    raises: "Dégâts (+1g0), Portée (+3 m)",
    desc: "…"
  },

  // --- NIVEAU DE MAÎTRISE 6 ---
  {
    id: "eau-6-rise-water",
    name: "Éveil de l'Eau (Rise, Water)",
    element: "Eau",
    mastery: 6,
    keywords: [],
    range: "9 mètres",
    area: "Un esprit majeur invoqué",
    duration: "Concentration",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "eau-6-waters-sweet-clarity",
    name: "Douce Clarté de l'Eau (Water's Sweet Clarity)",
    element: "Eau",
    mastery: 6,
    keywords: ["Guérison"],
    range: "Contact",
    area: "Un individu ciblé",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  },
  {
    id: "eau-6-tsunami",
    name: "Le Tsunami (Tsunami)",
    element: "Eau",
    mastery: 6,
    keywords: ["Bataille"],
    range: "1,5 kilomètre (en présence d'une vaste étendue d'eau)",
    area: "Front de vague de 100 mètres de large",
    duration: "Instantanée",
    raises: "Aucune",
    desc: "…"
  }
];

if (typeof window !== "undefined") {
  window.SORTS_EAU = SORTS_EAU;
}
