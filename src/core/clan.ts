import { CLAN_ALIASES, CLANS, UNKNOWN_CLAN } from "../rules/l5r4e";
import { normalize } from "./engine";

export interface ClanAccent { id: string | null; label: string | null; light: string; dark: string }

/** Reconnaît le clan sans accents ni casse, noms anglais compris (HANDOFF §6.4). */
export function clanAccent(clan: string): ClanAccent {
  const n = normalize(clan);
  const id = CLANS.find((c) => n.includes(c.id))?.id
    ?? Object.entries(CLAN_ALIASES).find(([alias]) => n.includes(alias))?.[1];
  const info = CLANS.find((c) => c.id === id);
  return info ? { id: info.id, label: info.label, light: info.light, dark: info.dark } : { id: null, label: null, ...UNKNOWN_CLAN };
}
