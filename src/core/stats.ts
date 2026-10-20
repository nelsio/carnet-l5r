import { rollDice, type Pool, type Rng } from "./engine";

export const DEFAULT_SAMPLES = 4000;
export const DEFAULT_SEED = 0x15ed;

export interface PoolStats {
  min: number;
  max: number;
  /** La réserve explose : le maximum peut être dépassé. */
  open: boolean;
  mean: number;
  /** Probabilité que le total atteigne `tn`. */
  chance(tn: number): number;
}

export interface PoolStatsOptions {
  emphasis: boolean;
  flatBonus?: number;
  samples?: number;
  seed?: number;
}

/** PRNG mulberry32 : renvoie un flottant dans [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** d10 à graine fixe : entiers 1..10. */
export function seededD10(seed: number): Rng {
  const next = mulberry32(seed);
  return () => Math.floor(next() * 10) + 1;
}

interface Simulation { totals: Int32Array; mean: number }

const cache = new Map<string, Simulation>();

/** Totaux simulés (sans bonus), triés par ordre croissant. Mis en cache par réserve. */
function simulate(pool: Pool, emphasis: boolean, samples: number, seed: number): Simulation {
  const key = [pool.rolled, pool.kept, pool.explodes, pool.explodeOn ?? 10, pool.canRaise, emphasis, samples, seed].join("|");
  const hit = cache.get(key);
  if (hit) return hit;
  const rng = seededD10(seed);
  const bare: Pool = { ...pool, bonus: 0 };
  const totals = new Int32Array(samples);
  let sum = 0;
  for (let n = 0; n < samples; n++) {
    const t = rollDice(bare, { emphasis }, rng).total;
    totals[n] = t;
    sum += t;
  }
  totals.sort();
  const sim = { totals, mean: sum / samples };
  cache.set(key, sim);
  return sim;
}

/** Nombre de totaux >= need, par recherche dichotomique. */
function countAtLeast(sorted: Int32Array, need: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] >= need) hi = mid;
    else lo = mid + 1;
  }
  return sorted.length - lo;
}

export function poolStats(pool: Pool, opts: PoolStatsOptions): PoolStats {
  const samples = opts.samples ?? DEFAULT_SAMPLES;
  const sim = simulate(pool, opts.emphasis, samples, opts.seed ?? DEFAULT_SEED);
  const add = pool.bonus + (opts.flatBonus ?? 0);
  return {
    min: pool.kept + add,
    max: 10 * pool.kept + add,
    open: pool.explodes,
    mean: sim.mean + add,
    chance: (tn) => countAtLeast(sim.totals, tn - add) / samples,
  };
}
