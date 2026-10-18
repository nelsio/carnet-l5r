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
export { DAMAGE_MANEUVER_ID, DEFAULT_MANEUVERS } from "../rules/l5r4e";
export type { ActionDef, CombatSub, Situation, Stance } from "../rules/l5r4e";
