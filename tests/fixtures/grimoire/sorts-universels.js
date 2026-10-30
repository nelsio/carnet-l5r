const SORTS_UNIVERSELS = [
  {
    id: "univ-sense",
    name: "Sentir les Kami (Sense)",
    element: "Universel",
    mastery: "Universel",
    keywords: ["Divination"],
    range: "Personnelle",
    area: "Rayon de 15 m autour du lanceur",
    duration: "Instantanée",
    raises: "Portée (+15 m par Raise), Détection d'un type précis",
    desc: "…"
  },
  {
    id: "univ-commune",
    name: "Communier avec les Kami (Commune)",
    element: "Universel",
    mastery: "Universel",
    keywords: ["Divination", "Communication"],
    range: "6 mètres",
    area: "Un esprit élémentaire local",
    duration: "Concentration",
    raises: "Question additionnelle (+1 par Raise), Clarté accrue",
    desc: "…"
  },
  {
    id: "univ-summon",
    name: "Invoquer les Kami (Summon)",
    element: "Universel",
    mastery: "Universel",
    keywords: ["Matérialisation"],
    range: "6 mètres",
    area: "Une poignée de matière élémentaire",
    duration: "Permanente",
    raises: "Volume doublé par Raise, Matière spécifique (bois, fer, thé...)",
    desc: "…"
  }
];

if (typeof window !== "undefined") {
  window.SORTS_UNIVERSELS = SORTS_UNIVERSELS;
}
