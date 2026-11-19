// 출생 주사위 (설계 5.1): 고향, 집안 형편, 핏줄, 타고난 몸.
import { potentialOf } from './stages';
import { homeFirstNames } from './names';
import { HOMETOWNS, SPECIES_BONUS, SPECIES_REROLL, SURNAMES, SURNAME_WEIGHT } from '../shared/data/births';
import { TALENTS, type Talent } from '../shared/data/talents';
import { NEW_TRAITS, TRAIT_BY_ID } from '../data/traits';
import { initializeTraits } from './traits';
import { chance, pick, rngOf, weighted } from '../shared/core/rng';
import { V } from '../data/balance';
import { HOMES } from '../data/homes';
import { BRANCH_ID } from './power';
import type { Branch, Hero5, HomeId, Life5, Lineage, StatKey, Wealth } from './types';

/** 재능의 갈래 id('martial.sword') → 갈래('sword') */
const BRANCH_OF: Record<string, Branch> = Object.fromEntries(Object.entries(BRANCH_ID).map(([b, id]) => [id, b as Branch]));
const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const WEALTHS: readonly Wealth[] = ['poor', 'common', 'comfortable', 'noble'];
// v5에서는 집안 형편이 따로 있으므로 '가난한 집안' 재능은 뽑지 않는다
const NOT_BORN_TALENTS: readonly string[] = ['poor'];

/** 성과 이름. 성을 모르면 이름만 */
export function fullName(h: Hero5): string {
  return h.surname ? `${h.surname} ${h.name}` : h.name;
}

/** 출생 주사위에 미리 정해 줄 수 있는 것. wealth · lineage는 시뮬레이터가 출생을 고정할 때 쓴다 */
export interface BirthOpt { name?: string; gender?: 'm' | 'f'; wealth?: Wealth; lineage?: Lineage; home?: HomeId }

/**
 * 빈 인생의 주인공 칸을 모두 출생 주사위로 채운다. 시련도 더한다.
 * 핏줄을 정해 주면 고아인지도 그에 따른다: 고아면 성을 모르고, 희귀한 성씨는 숨은 성으로 남는다.
 * 고아가 아니라고 정하면 희귀한 성씨도 드러난 성이 된다.
 */
export function rollBirth(s: Life5, opt: BirthOpt = {}): void {
  const r = rngOf(s.rng);
  const h = s.hero;

  const homeId = opt.home ?? weighted(r, Object.keys(HOMES) as HomeId[], (id) => HOMES[id].weight)!;
  const home = HOMES[homeId];

  const gender: 'm' | 'f' = opt.gender ?? pick(r, ['m', 'f'] as const);
  // 이스트 블루의 이름난 집안은 로그타운(이스트 블루)에서만, 고향마다 흔한 성이 있으면 그 성만 쓴다
  const ownCommon = SURNAMES.some((x) => x.home === homeId);
  const sur = weighted(r, SURNAMES.filter((x) => (x.gender === 'any' || x.gender === gender)
    && (x.kind !== 'local' || homeId === 'loguetown')
    && (x.kind !== 'common' || (ownCommon ? x.home === homeId : !x.home))), (x) => SURNAME_WEIGHT[x.kind])!;

  let species = sur.kind === 'rare' ? sur.species : sur.home ? sur.species : pick(r, home.species);
  if (sur.kind === 'common' && chance(r, SPECIES_REROLL.p)) species = weighted(r, SPECIES_REROLL.weights, (x) => x[1])![0];
  // 희귀한 성씨, 이 고향에 없는 종족은 떠내려온 고아로 태어난다
  const orphan = opt.lineage ? opt.lineage === 'orphan' : sur.kind === 'rare' || !home.species.includes(species);

  // 태어난 고향의 마을에서 태어난다. 이스트 블루의 이름난 집안은 그 집안이 사는 마을에서만 태어난다
  const homeTowns = HOMETOWNS.filter((t) => t.home === homeId);
  const towns = homeTowns.filter((t) => sur.kind !== 'local' || sur.homes!.includes(t.name));
  const town = pick(r, towns.length ? towns : homeTowns);

  const wealth: Wealth = opt.wealth ?? (orphan ? 'poor' : weighted(r, WEALTHS, (w) => home.wealth[w])!);
  const lineage = opt.lineage ?? (orphan ? 'orphan' : weighted(r, home.lineages, (x) => x[1])![0]);

  const candidates: Talent[] = [...TALENTS, ...NEW_TRAITS.filter(t => t.born).map(t => ({ id: t.id, name: t.name, desc: t.desc, good: t.good, weight: t.weight, excludes: t.excludes }))];
  const talents: Talent[] = [];
  const roll = r();
  const nTalents = roll < .15 ? 2 : roll < .55 ? 3 : roll < .9 ? 4 : 5;
  for (let i = 0; i < nTalents; i++) {
    const pool = candidates.filter((t) => !NOT_BORN_TALENTS.includes(t.id)
      && !talents.some(b => TRAIT_BY_ID[t.id]?.family && TRAIT_BY_ID[t.id]?.family === TRAIT_BY_ID[b.id]?.family)
      && !talents.some((b) => b.id === t.id || b.excludes?.includes(t.id) || t.excludes?.includes(b.id)));
    const t = weighted(r, pool, (x) => x.weight);
    if (!t) break;
    talents.push(t);
  }

  const base = { str: 0, spd: 0, vit: 0, int: 0, wil: 0, luk: 0 };
  for (const k of STAT_KEYS) {
    const add = (sur.bonus[k] ?? 0) + (SPECIES_BONUS[species]?.[k] ?? 0) + talents.reduce((a, t) => a + (t.stat?.[k] ?? 0), 0);
    base[k] = Math.max(V.birth.statFloor, V.birth.stat + add);
  }

  h.name = opt.name ?? pick(r, homeFirstNames(homeId, gender));
  h.gender = gender;
  h.surname = orphan ? null : sur.name;
  h.secretSurname = orphan && sur.kind === 'rare' ? sur.name : null;
  h.species = species;
  h.home = homeId;
  h.town = town.name;
  h.wealth = wealth;
  h.lineage = lineage;
  h.talents = talents.map((t) => t.id);
  initializeTraits(s);
  // 무술 재능은 그 갈래의 선호도로 시작한다 (검술 재능이면 검술 쪽으로 기운 아이). 패기 · 열매는 계기가 있어야 길이 된다
  for (const t of talents) for (const [id, m] of Object.entries(t.mastery ?? {}))
    if ((m ?? 1) > 1 && id.startsWith('martial.')) { const b = BRANCH_OF[id]; if (b) s.growth.pref[b] += V.growth.pref.talent; }
  h.base = base;
  h.potential = potentialOf(s.rng.seed);
  h.money = V.wealthMoney[wealth];
  h.island = town.name;                        // 태어난 마을이 처음 사는 섬이다
  h.sea = home.sea;

  s.hardship += birthHardship(wealth, lineage);
}

/** 태어나며 지고 나오는 시련: 가난, 고아, 차별받는 핏줄 */
export function birthHardship(wealth: Wealth, lineage: Lineage): number {
  return (wealth === 'poor' ? V.hardship.poor : 0)
    + (lineage === 'orphan' ? V.hardship.orphan : 0)
    + (lineage === 'outcast' ? V.hardship.outcast : 0);
}
