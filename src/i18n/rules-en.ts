/**
 * Vocabulaire de règles et textes du moteur en anglais (annexe 53.1, 53.2) : même forme que `rules-fr.ts`.
 * Termes de l'édition anglaise de la 4e (TN, Raise, Free Raise, Armor TN, Void Points), notation `XkY` ;
 * textes rédigés pour l'outil à partir des textes français, aucun texte repris du livre.
 */
import { formatDR } from "../core/dice";
import type { CoreMessages, EffectPart, ModifierEffect } from "../core/text";
import schoolsEn from "../rules/en/ecoles.json";
import type { Messages } from ".";
import type { SchoolWords } from "./catalog";

type Rules = Messages["rules"];

const traits: Rules["traits"] = {
  stamina: "Stamina", willpower: "Willpower", strength: "Strength", perception: "Perception",
  agility: "Agility", intelligence: "Intelligence", reflexes: "Reflexes", awareness: "Awareness", void: "Void",
};

const maneuvers: Rules["maneuvers"] = {
  dmg: { name: "Increased Damage", effect: "+1k0 damage per Raise (stackable)." },
  called: { name: "Called Shot", effect: "Aim at a location: limb 1, hand or foot 2, head 3, eye or finger 4 Raises (choose the location)." },
  feint: { name: "Feint", effect: "Damage + half the amount by which you beat the TN, capped at 5 × Insight Rank." },
  knockdown: { name: "Knockdown", effect: "Contested Strength roll: the target falls prone if you win. Quadruped: 4 Raises." },
  disarm: { name: "Disarm", effect: "Damage 2k1 without Strength. Contested Strength roll: the target drops its weapon if you win." },
  extra: { name: "Extra Attack", effect: "One more attack this round." },
};

const armors: Rules["armors"] = {
  none: { name: "None", summary: "" },
  ashigaru: { name: "Ashigaru Armor", summary: "" },
  light: { name: "Light Armor", summary: "+5 to the TN of Athletics and Stealth rolls." },
  heavy: { name: "Heavy Armor", summary: "+5 to the TN of Agility and Reflexes rolls." },
  riding: { name: "Riding Armor", summary: "+12 Armor TN when mounted; counts as heavy: on foot, +5 to the TN of Agility and Reflexes rolls." },
};

export const rulesEn: Rules = {
  traits,
  rings: { earth: "Earth", water: "Water", fire: "Fire", air: "Air", void: "Void" },
  elements: { air: "Air", earth: "Earth", fire: "Fire", water: "Water", void: "Void", all: "All" },
  tnScale: ["Trivial", "Easy", "Moderate", "Difficult", "Very Difficult", "Very Hard", "Heroic", "Legendary"],
  wounds: ["Healthy", "Nicked", "Grazed", "Hurt", "Injured", "Crippled", "Down", "Out"],
  woundsShort: ["Healthy", "Nicked", "Grazed", "Hurt", "Injured", "Crippled", "Down", "Out"],
  dead: "Dead",
  stances: {
    attack: { label: "Attack", description: "Normal stance.", tags: ["no modifier"] },
    fullAttack: { label: "Full Attack", description: "+2k1 to attacks, −10 Armor TN.", tags: ["+2k1 attack", "Armor TN −10"] },
    defense: { label: "Defense", description: "Adds Air + Defense to your Armor TN.", tags: ["Armor TN +Defense +Air"] },
    fullDefense: {
      label: "Full Defense", description: "Defense (Reflexes) roll, half of it (rounded up) added to your Armor TN.",
      tags: ["Armor TN +roll", "no attack"],
    },
    center: { label: "Center", description: "No action; bonus next round (see the core book).", tags: ["bonus next round", "no action"] },
  },
  terrains: { normal: "Normal", moderate: "Moderate", difficult: "Difficult" },
  calledZones: { limb: "Limb", extremity: "Hand or foot", head: "Head", precise: "Eye or finger" },
  engagements: { reserves: "Reserves", disengaged: "Disengaged", engaged: "Engaged", heavilyEngaged: "Heavily Engaged" },
  armyStatuses: {
    winning: { label: "Winning", verdict: "Your army is winning" },
    stalemate: { label: "Stalemate", verdict: "Stalemate" },
    losing: { label: "Losing", verdict: "Your army is losing" },
  },
  situations: { investigation: "Investigation", court: "Court", movement: "Movement", combat: "Combat", magic: "Magic" },
  combatSubs: { skirmish: "Skirmish", duel: "Iaijutsu duel", battle: "Battle" },
  groups: { rest: "Rest", spells: "Spells", attacks: "Attacks", interrupt: "Interruption" },
  actions: {
    notice: { label: "Notice a detail", description: "A subtle clue, a hidden object, suspicious behavior. TN 10 if obvious, 20 if well hidden." },
    search: { label: "Search a place", description: "Methodical search of a room or a body. Take your time: the GM may grant Free Raises." },
    interrogate: { label: "Question a witness", description: "Ask questions to get the facts. A reluctant witness opposes Willpower or Etiquette." },
    lie: { label: "Spot a lie", description: "Contested roll against the speaker's Sincerity (Awareness)." },
    court: { label: "Gather information at court", description: "Polite conversation, rumors, favors. Each Raise gives one more detail." },
    etiquette: { label: "Keep your composure", description: "Show nothing, avoid a faux pas that costs Honor." },
    lore: { label: "Recall (Lore)", description: "Name your exact Lore on the sheet (e.g. “Lore: Heraldry”). Otherwise, unskilled roll." },
    meditate: {
      label: "Meditate (recover Void)",
      description: "One hour of meditation, once a day. Success: you recover Void Points, up to your Void Ring.",
    },
    persuade: { label: "Convince, manipulate", description: "Courtier (Awareness) against the speaker's Etiquette (Awareness or Willpower)." },
    resist: { label: "Resist influence", description: "Etiquette (Awareness or Willpower) against the opposing Courtier, Intimidation or Temptation." },
    sincerity: {
      label: "Be believed",
      description: "Sincerity (Awareness) against Investigation (Awareness). Choose the emphasis: Honesty for the truth, Deceit for a lie.",
    },
    intimidate: { label: "Intimidate", description: "Intimidation (Willpower) against Etiquette (Willpower). May cost Honor." },
    tempt: { label: "Tempt, seduce", description: "Temptation (Awareness) against Etiquette (Willpower). Low skill: may cost Honor." },
    act: { label: "Play a role", description: "Acting (Awareness) against the Investigation (Perception) of whoever is watching." },
    trade: {
      label: "Bargain, appraise",
      description: "Appraise an item or negotiate a price. Merchant skill: may cost Honor in public.",
    },
    move: { label: "Move in combat", description: "Moderate or difficult terrain: the Water Ring counts as 1 or 2 ranks lower." },
    athletics: { label: "Run, climb, jump", description: "Climbing a wall 15, a cliff 25. Long run: Stamina instead of Strength." },
    ride: {
      label: "Ride over rough ground",
      description: "Pursuit, jumping an obstacle, mounted combat. Keeping control of a frightened mount: TN 20.",
    },
    stealth: { label: "Move stealthily", description: "Contested against the guards' Investigation (Perception)." },
    track: { label: "Track, find your way", description: "Follow a trail, find shelter or water. Fresh trail 10, in the rain 25." },
    march: { label: "Endure a forced march", description: "Pure Trait roll: Stamina keep Stamina. Failure: fatigue (+5 to the TN of later rolls)." },
    initiative: { label: "Initiative", description: "Rank + Reflexes, keep Reflexes. Order of the round." },
    unarmed: { label: "Unarmed attack", description: "Jiujutsu (Agility) against Armor TN. Damage: Strength + 0k1." },
    "unarmed-dmg": { label: "Damage · unarmed", description: "Strength + 0k1." },
    grapple: { label: "Grapple", description: "Jiujutsu attack; if it hits, contested Strength rolls to start and hold the grapple." },
    "full-defense": { label: "Full Defense", description: "Full Defense stance: half the result is added to your Armor TN this round." },
    assess: {
      label: "1 · Assessment",
      description: "TN 10 + 5 × the opponent's Rank. Success: you learn about them (Rank, Rings…), more with each Raise.",
    },
    focus: {
      label: "2 · Focus",
      description: "Contested rolls at each exchange. The winner strikes first; the margin becomes Free Raises for the Strike.",
    },
    strike: { label: "3 · Strike", description: "Iaijutsu (Reflexes) against Armor TN. Add your Free Raises from the Focus." },
    tactics: {
      label: "Command / read the field",
      description: "Commanders: contested rolls each turn. Enter the margin in the Mass battle panel: 5 to win, otherwise stalemate.",
    },
    concentrate: { label: "Stay focused (Willpower)", description: "" },
  },
  maneuvers,
  modifierSources: { technique: "Technique", advantage: "Advantage", disadvantage: "Disadvantage", other: "Other" },
  modifierTargets: {
    all: "All skill and trait rolls", skill: "One skill", trait: "One trait", social: "Social skills", attack: "Attacks",
    damage: "Damage", initiative: "Initiative", armor: "Armor TN", wounds: "Wound penalty",
  },
  modifierPlaceholders: { advantage: "Advantage name", disadvantage: "Disadvantage name", technique: "Technique name", other: "Bonus name" },
  modifierTemplates: {
    free: "Free bonus",
    "adv-skill-dice": "Extra dice on one skill",
    "adv-trait-dice": "Extra dice on one trait",
    "adv-skill-free-raise": "Free Raise on one skill",
    "adv-social-dice": "Bonus on social rolls",
    "adv-wounds": "Reduced wound penalty",
    "adv-armor": "Armor TN bonus",
    "adv-situational": "Situational bonus (tick when rolling)",
    "dis-skill-dice": "Dice penalty on one skill",
    "dis-trait-dice": "Dice penalty on one trait",
    "dis-social-tn": "Higher TN on social rolls",
    "dis-skill-tn": "Higher TN on one skill",
    "dis-wounds": "Increased wound penalty",
    "dis-situational": "Situational penalty to the total (tick)",
    "tech-attack-dice": "Extra dice on attacks",
    "tech-damage-dice": "Extra dice on damage",
    "tech-initiative-dice": "Extra dice on initiative",
    "tech-stance": "Stance bonus (choose the stance)",
  },
  armors,
  weaponKeywords: {
    samourai: "Samurai", lourde: "Heavy", paysan: "Peasant", ninja: "Ninja", arc: "Bow", hast: "Polearm", lance: "Spear",
    "deux-mains": "Two-handed", petite: "Small", moyenne: "Medium", grande: "Large", distance: "Ranged", cimeterre: "Scimitar",
  },
  newCharacter: "New samurai",
  clans: {
    crabe: "Crab Clan", grue: "Crane Clan", dragon: "Dragon Clan", licorne: "Unicorn Clan", lion: "Lion Clan",
    mante: "Mantis Clan", phenix: "Phoenix Clan", scorpion: "Scorpion Clan", araignee: "Spider Clan", imperial: "Imperial Families",
  },
  techniqueCategories: { auto: "auto", optional: "optional", reminder: "reminder", text: "text" },
  masteryTitle: (skill: string, rank: number) => `Mastery ${skill} ${rank}`,
};

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const dice = (rolled: number, kept: number) => `${rolled}k${kept}`;
const raises = (n: number) => `${n} Free Raise${n > 1 ? "s" : ""}`;
const dr = (s: string) => formatDR(s, "k");

function modifier(m: ModifierEffect): string {
  if (m.appliesTo === "armor") return `${signed(m.flat)} Armor TN`;
  if (m.appliesTo === "wounds") return `${signed(-m.flat)} wound penalty`;
  const parts: string[] = [];
  if (m.rolled || m.kept) parts.push(`${m.rolled >= 0 && m.kept >= 0 ? "+" : ""}${dice(m.rolled, m.kept)}`);
  if (m.flat) parts.push(`${signed(m.flat)} to the total`);
  if (m.freeRaises) parts.push(raises(m.freeRaises));
  if (m.tn) parts.push(`${signed(m.tn)} TN`);
  return parts.join(", ") || "no effect";
}

function effectPart(p: EffectPart): string {
  switch (p.kind) {
    case "dice": return `${p.rolled >= 0 && p.kept >= 0 ? "+" : ""}${dice(p.rolled, p.kept)}`;
    case "flat": return signed(p.n);
    case "freeRaises": return raises(p.n);
    case "tn": return `TN ${signed(p.n)}`;
    case "unlimitedRaises": return "no Raise limit";
    case "explode": return `explodes on ${p.on}`;
    case "voidBoost": return `Void: +${dice(p.rolled, p.kept)} per point`;
    case "armor": return `${signed(p.n)} Armor TN${p.perStack ? " per step" : ""}`;
    case "targetTn": return `${signed(p.n)} to the target's TN per step`;
    case "ignoreWounds": return "wound penalty ignored";
    case "maneuverRaises": return `${raises(p.n)} for ${maneuvers[p.maneuver]?.name ?? p.maneuver}`;
  }
}

const armorName = (id: string) => armors[id]?.name ?? id;
const castTime = (n: number) => `${n} complex action${n > 1 ? "s" : ""}`;

export const coreEn: CoreMessages = {
  "pool.voidSkill": () => "Void: skill rolled at rank 1",
  "pool.unskilled": () => "Unskilled: no exploding dice, no Raises",
  "pool.fullAttack": (p) => `Full Attack: +${dice(p.rolled, p.kept)}`,
  "pool.disarm": (p) => `Disarm: ${dice(p.rolled, p.kept)} without Strength or Increased Damage`,
  "pool.extraRolled": (p) => `${p.n > 0 ? "+" : ""}${p.n} rolled ${Math.abs(p.n) > 1 ? "dice" : "die"}`,
  "pool.center": (p) => `Center bonus: +${dice(p.rolled, p.kept)} +${p.flat}`,
  "pool.assessment": (p) => `Assessment won by ${p.margin} or more: +${dice(p.rolled, p.kept)}`,
  "pool.meleeTarget": (p) => `Target in melee: −${p.penalty}`,
  "pool.modifier": (p, f) => `${p.name}: ${f(p.effect)}`,
  "pool.explode": (p) => `${p.source} Mastery: dice explode on ${p.on} and 10`,
  "pool.effect": (p) => `${p.source}: ${p.parts.map(effectPart).join(" ")}`,
  "pool.voidPoint": (p) => `${p.katana ? "Void (katana)" : "Void Point"}: +${dice(p.rolled, p.kept)}`,
  "pool.voidSpend": (p) => `${p.points} Void Points (${p.source}): +${dice(p.rolled, p.kept)}`,
  "pool.tenDice": (p) => `Ten Dice Rule: +${p.bonus}`,
  "pool.bowMastery": (p) => `${p.source} Mastery: bow strength +${p.value}`,
  "pool.bowCapped": (p) => `Strength ${p.strength}: the strength ${p.bow} bow shoots at ${p.strength}`,
  "pool.weaponTn": (p) => `${p.weapon}: +${p.tn} TN to shots ${p.mounted ? "when mounted" : "on foot"}`,
  "pool.minStrength": (p) => `${p.weapon}: Strength ${p.min} minimum (you have ${p.strength}).`,
  "armor.skillTn": (p) => `${armorName(p.armor)}: +${p.tn} TN`,
  "armor.waived": (p) => `${armorName(p.armor)}: penalty ignored (${p.source})`,
  "armor.heavy": (p) => `${armorName(p.armor)}: +${p.tn} TN (${traits.agility}, ${traits.reflexes}${p.onFoot ? ", on foot" : ""})`,
  modifier,
  effect: (p) => p.parts.map(effectPart).join(" "),
  "restrict.fullAttackSpell": () => "Full Attack: attacks only, no spells.",
  "restrict.fullDefenseSpell": () => "Full Defense: free actions only, no spells.",
  "restrict.center": () => "Center stance: no action this round.",
  "restrict.defense": () => "Defense stance: no attack this round.",
  "restrict.fullAttackRanged": () => "Full Attack: no ranged attack.",
  "spell.deficiency": (p) => `Deficiency: impossible at rank ${p.rank}.`,
  "spell.mastery": (p) => `Mastery ${p.mastery} > rank ${p.rank}.`,
  "wound.crippled": () => "Crippled: each move costs one step more (free action → simple, simple → complex).",
  "wound.down": () => "Down: free actions only, spending 1 Void Point for each.",
  "spell.keyword": (p) => `${(schoolsEn.spellKeywords as Record<string, string>)[p.keyword] ?? p.keyword} keyword`,
  "spell.affinity": () => "affinity element",
  // Case d'école du lanceur de sort : texte de la surcouche anglaise (annexe 54), le français à défaut.
  "spell.option": (p) => (schoolsEn.schools as Record<string, SchoolWords>)[p.school]?.spellcasting?.options?.[p.id] ?? p.label,
  "spell.castTime": (p) => castTime(p.n),
  "action.label": (p) => rulesEn.actions[p.id]?.label ?? p.id,
  "action.description": (p) => rulesEn.actions[p.id]?.description ?? "",
  "action.attack": (p) => `${p.ranged ? "Shot" : "Attack"} · ${p.weapon}`,
  "action.attackAbout": (p) => `${p.skill} (${traits[p.trait]}) against the target's Armor TN. Choose your maneuvers in the roller.`,
  "action.damage": (p) => `Damage · ${p.name}`,
  "action.damageAbout": (p) => `Strength + DR ${dr(p.dr)}. Increased Damage adds rolled dice.`,
  "action.bowDamageAbout": (p) => `Bow strength ${p.bow} + arrow DR ${dr(p.dr)}.`,
  "action.duelDamageAbout": () => "Each Raise from the Strike adds +1k0.",
  "action.lore": (p) => `Recall · ${p.detail}`,
  "action.loreAbout": (p) => `${p.skill} (${traits.intelligence}). Raises give more details.`,
  "action.perform": (p) => `Perform · ${p.detail}`,
  "action.performAbout": (p) => `${p.skill} (${traits.awareness}). TN depends on the audience; each Raise leaves a stronger impression.`,
  "action.cast": (p) => `Cast · ${p.spell}`,
  "action.castAbout": (p) => [`TN ${p.tn}`, castTime(p.castTime), p.keywords, p.memorized ? "memorized" : "scroll"].filter(Boolean).join(" · "),
  "action.spellDamageAbout": (p) => `DR ${dr(p.dr)}, without Strength or Void Points.`,
  "action.concentrateAbout": (p) =>
    `Interrupted while casting: Willpower, TN ${p.tn}, or ${p.base} + damage taken. Failure: the spell is lost, without using the slot.`,
};
