import { HOMETOWNS, ORPHAN_STORIES, SPECIES_NAMES } from '../shared/data/births';
import { traitName } from './traits';
import { pick, rngOf, weighted } from '../shared/core/rng';
import { V } from '../data/balance';
import { TURNINGS } from '../data/turnings';
import { VALUE_IDS } from '../data/values';
import { fullName, rollBirth, type BirthOpt } from './birth';
import { introduceFamily, rollFamily } from './family';
import { townLabel } from '../data/homes';
import { INLAND_TOWNS } from '../data/landlocked';
import { LIMBS } from './body';
import { logLine, yearDivider } from './log';
import { birthEdition } from './world-news';
import { checkAll } from './cond';
import { openTurning } from './turning';
import { COMBAT_STYLES, DEFAULT_STYLE } from '../data/combat-styles';
import type { Branch, Life5, Limb, LimbState, Stats, Values, Wealth } from './types';

export { fullName } from './birth';
export { logLine } from './log';
const BRANCHES: readonly Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun', 'observation', 'armament', 'conqueror', 'fruit'];

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
      money: 0, fame: 0, rank: 0, provisions: 0,
      standing: 'child', island: '', sea: 'east',
      alive: true,
      bornWealth: 'common',
    },
    growth: { tier: fill(BRANCHES, 0), mastery: fill(BRANCHES, 0), master: null, pref: fill(BRANCHES, 0), path: null,
      styleMastery: Object.fromEntries(COMBAT_STYLES.map((x) => [x.id, 0])), styleFocus: { ...DEFAULT_STYLE }, styleWeapons: {}, weapons: [], primaryStyle: null, styleBonds: {} },
    values, personality: { row: 1, col: 1, pullRow: 0, pullCol: 0, choices: 0, hold: 0, established: false }, strengths: [], marks: {},
    hardship: 0,
    people: [],
    flags: [], seen: {}, seenCount: {}, closed: [], standingSince: 0, queue: [], queueTries: {}, storyRest: 0, storyNote: '',
    stopsThisYear: 0,
    unchosen: [], tried: [], known: [],
    log: [], timeline: [], recentLines: [],
    pending: null,
    stats: { stops: 0, fights: 0, wins: 0, fortunes: 0, limbsLost: 0, years: 0, named: {}, stopsAt: [], stopTries: 0, emptyStops: 0, namedMet: 0 },
    firstBountyIssued: false, news: [], publishedBounty: 0,
    seq: 0,
    ended: null,
    vows: { active: null, history: [] },
  };
}

const WEALTH_HOUSE: Record<Wealth, string> = { poor: '가난한 집', common: '평범한 집', comfortable: '넉넉한 집', noble: '이름난 집안' };
const ORPHAN_INLAND_STORIES = [
  '{place}의 한 집 문턱에서 갓난아이가 발견되었다.',
  '이른 아침, {place} 길가에 놓인 바구니에서 아기 울음이 들렸다.',
  '{place}에 들른 나그네가 어린아이를 맡기고 떠났다.',
];

/**
 * 새 인생: 출생 주사위를 굴리고 가족을 두고 세 살 아이로 시작한다. 유년기의 첫 문이 떠 있다.
 * known: 지난 인생들에서 골라 본 문(도감의 Object.keys(meta.doors)). 문에 "전에 골라 본 문"으로 보인다.
 */
export function newLife5(seed: number, opt: BirthOpt & { known?: readonly string[] } = {}): Life5 {
  const s = emptyLife(seed);
  s.known = [...(opt.known ?? [])];
  rollBirth(s, opt);
  const h = s.hero;
  h.bornWealth = h.wealth;
  const r = rngOf(s.rng);
  const orphanStories = INLAND_TOWNS.includes(h.town) || h.town === '고아 왕국 그레이 터미널' ? ORPHAN_INLAND_STORIES : ORPHAN_STORIES;
  const born = h.lineage === 'orphan'
    ? `${pick(r, orphanStories).replace('{place}', h.town)} 마을 사람들은 ${h.species === 'human' ? '' : `${SPECIES_NAMES[h.species]} `}아이를 「${fullName(h)}」(이)라 불렀다.`
    : `${h.town}의 ${WEALTH_HOUSE[h.wealth]}에서 ${fullName(h)}이(가) 태어났다.`;
  const gifts = h.talents.map(traitName).join(', ');
  for (const text of [born, `타고난 것: ${gifts}`]) logLine(s, text, 'heavy', 'world');
  s.age = V.birth.startAge;
  rollFamily(s, r);
  yearDivider(s);                              // 시작하는 해에도 구분선이 있다
  const town = HOMETOWNS.find((t) => t.home === h.home && t.name === h.town);
  if (town) logLine(s, `고향은 ${townLabel(h.home, h.town)}. ${town.text}(이)다.`, 'heavy', 'world');
  introduceFamily(s);
  birthEdition(s);
  s.hero.standing = 'child';
  const first = weighted(r, TURNINGS.filter((t) => t.id.startsWith('kid_') && checkAll(s, t.when)), (t) => t.weight);
  if (first) openTurning(s, first);
  return s;
}
