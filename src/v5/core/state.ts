import { ORPHAN_STORIES, SPECIES_NAMES } from '../../data/births';
import { TALENT_BY_ID } from '../../data/talents';
import { josa } from '../../core/josa';
import { pick, rngOf } from '../../core/rng';
import { V } from '../data/balance';
import { VALUE_IDS } from '../data/values';
import { fullName, rollBirth } from './birth';
import type { LogType } from '../../core/types';
import type { Branch, Life5, Limb, LimbState, LogWeight, Stats, Values, Wealth } from './types';

export { fullName } from './birth';
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

/** 기록 한 줄을 남긴다. 조사를 고르고, 최근 V.log.keep줄만 남긴다. */
export function logLine(s: Life5, text: string, weight: LogWeight = 'light', type: LogType = 'life'): void {
  s.log.push({ id: s.seq++, age: s.age, text: josa(text), weight, type });
  if (s.log.length > V.log.keep) s.log.splice(0, s.log.length - V.log.keep);
}

const WEALTH_HOUSE: Record<Wealth, string> = { poor: '가난한 집', common: '평범한 집', comfortable: '넉넉한 집', noble: '이름난 집안' };

/** 새 인생: 출생 주사위를 굴리고 세 살 아이로 시작한다. 유년기의 첫 문은 아직 없다. */
export function newLife5(seed: number, opt: { name?: string; gender?: 'm' | 'f' } = {}): Life5 {
  const s = emptyLife(seed);
  rollBirth(s, opt);
  const h = s.hero;
  const r = rngOf(s.rng);
  const born = h.lineage === 'orphan'
    ? `${pick(r, ORPHAN_STORIES).replace('{place}', h.town)} 마을 사람들은 ${h.species === 'human' ? '' : `${SPECIES_NAMES[h.species]} `}아이를 「${fullName(h)}」(이)라 불렀다.`
    : `${h.town}의 ${WEALTH_HOUSE[h.wealth]}에서 ${fullName(h)}이(가) 태어났다.`;
  const gifts = h.talents.map((id) => TALENT_BY_ID[id]).map((t) => `${t.name}${t.good ? '' : '(-)'}`).join(', ');
  for (const text of [born, `타고난 것: ${gifts}`]) logLine(s, text, 'heavy', 'world');
  s.age = V.birth.startAge;
  s.hero.standing = 'child';
  return s;
}
