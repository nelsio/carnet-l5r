// Moteur de règles L5R 4e : TypeScript pur, sans DOM (HANDOFF §4).
export * from "./schema";
export * from "./engine";
export * from "./stats";
export * from "./migrate";
export * from "./merge";
export * from "./actions";
export * from "./clan";
export * from "./character";
export * from "./io";
export * from "./modifiers";
export * from "./schools";
export * from "./combat";
export * from "./recovery";
export * from "./vocabulary";
export * from "./battle";
export { DAMAGE_MANEUVER_ID, DEFAULT_MANEUVERS, DISARM_MANEUVER_ID } from "../rules/l5r4e";
export type { ActionDef, ArmyStatus, CombatSub, Engagement, Situation, Stance } from "../rules/l5r4e";
