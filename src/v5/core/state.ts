import type { Branch, Life5, Limb, LimbState, Stats, ValueId, Values } from './types';

const VALUE_IDS: readonly ValueId[] = ['justice', 'devotion', 'ambition', 'romance', 'inquiry', 'loyalty', 'freedom', 'dominion', 'peace'];
const LIMBS: readonly Limb[] = ['eyeL', 'eyeR', 'armL', 'armR', 'legL', 'legR'];
const BRANCHES: readonly Branch[] = ['fist', 'sword', 'gun', 'observation', 'armament', 'conqueror', 'fruit'];

function fill<K extends string, T>(keys: readonly K[], v: T): Record<K, T> {
  const out = {} as Record<K, T>;
  for (const k of keys) out[k] = v;
  return out;
}

function zeroStats(): Stats {
  return { str: 0, spd: 0, vit: 0, int: 0, wil: 0, luk: 0 };
}

/** 출생 전의 빈 인생. 출생 주사위가 주인공의 칸을 채운다. */
export function emptyLife(seed: number): Life5 {
  const values: Values = fill(VALUE_IDS, 0);
  const limbs: Record<Limb, LimbState> = fill(LIMBS, 'ok' as LimbState);
  return {
    schema: 5,
    rng: { seed, cursor: 0 },
    age: 0, part: 0,
    hero: {
      name: '', surname: null, secretSurname: null,
      gender: 'm', species: 'human',
      home: 'loguetown', town: '', wealth: 'common', lineage: 'commoner',
      talents: [],
      base: zeroStats(), hp: 100,
      injuries: [], illness: null,
      limbs,
      fruit: null,
      money: 0, fame: 0, rank: 0,
      standing: 'child', island: '', sea: 'east',
      alive: true,
    },
    growth: { tier: fill(BRANCHES, 0), mastery: fill(BRANCHES, 0), master: null },
    values, strengths: [], marks: {},
    hardship: 0,
    people: [],
    flags: [], seen: {}, queue: [],
    stopsThisYear: 0,
    unchosen: [], tried: [],
    log: [], timeline: [],
    pending: null,
    stats: { stops: 0, fights: 0, wins: 0, fortunes: 0, limbsLost: 0, years: 0 },
    seq: 0,
    ended: null,
  };
}
