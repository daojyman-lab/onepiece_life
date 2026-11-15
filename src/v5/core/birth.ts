// 출생 주사위 (설계 5.1): 고향, 집안 형편, 핏줄, 타고난 몸.
import { HOMETOWNS, SPECIES_BONUS, SPECIES_REROLL, SURNAMES, SURNAME_WEIGHT, FIRST_NAMES } from '../../data/births';
import { TALENTS, type Talent } from '../../data/talents';
import { chance, int, pick, rngOf, weighted } from '../../core/rng';
import { V } from '../data/balance';
import { HOMES } from '../data/homes';
import type { Hero5, HomeId, Life5, Lineage, StatKey, Wealth } from './types';

const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const WEALTHS: readonly Wealth[] = ['poor', 'common', 'comfortable', 'noble'];
// v5에서는 집안 형편이 따로 있으므로 '가난한 집안' 재능은 뽑지 않는다
const NOT_BORN_TALENTS: readonly string[] = ['poor'];

/** 성과 이름. 성을 모르면 이름만 */
export function fullName(h: Hero5): string {
  return h.surname ? `${h.surname} ${h.name}` : h.name;
}

/** 출생 주사위에 미리 정해 줄 수 있는 것. wealth · lineage는 시뮬레이터가 출생을 고정할 때 쓴다 */
export interface BirthOpt { name?: string; gender?: 'm' | 'f'; wealth?: Wealth; lineage?: Lineage }

/**
 * 빈 인생의 주인공 칸을 모두 출생 주사위로 채운다. 시련도 더한다.
 * 핏줄을 정해 주면 고아인지도 그에 따른다: 고아면 성을 모르고, 희귀한 성씨는 숨은 성으로 남는다.
 * 고아가 아니라고 정하면 희귀한 성씨도 드러난 성이 된다.
 */
export function rollBirth(s: Life5, opt: BirthOpt = {}): void {
  const r = rngOf(s.rng);
  const h = s.hero;

  const homeId = weighted(r, Object.keys(HOMES) as HomeId[], (id) => HOMES[id].weight)!;
  const home = HOMES[homeId];

  const gender: 'm' | 'f' = opt.gender ?? pick(r, ['m', 'f'] as const);
  const sur = weighted(r, SURNAMES.filter((x) => x.gender === 'any' || x.gender === gender), (x) => SURNAME_WEIGHT[x.kind])!;

  let species = sur.kind === 'rare' ? sur.species : pick(r, home.species);
  if (sur.kind === 'common' && chance(r, SPECIES_REROLL.p)) species = weighted(r, SPECIES_REROLL.weights, (x) => x[1])![0];
  // 희귀한 성씨, 이 고향에 없는 종족은 떠내려온 고아로 태어난다
  const orphan = opt.lineage ? opt.lineage === 'orphan' : sur.kind === 'rare' || !home.species.includes(species);

  // 이스트 블루의 이름난 집안은 그 집안이 사는 마을에서만 태어난다
  const towns = HOMETOWNS.filter((t) => sur.kind !== 'local' || sur.homes!.includes(t.name));
  const town = pick(r, towns.length ? towns : HOMETOWNS);

  const wealth: Wealth = opt.wealth ?? (orphan ? 'poor' : weighted(r, WEALTHS, (w) => home.wealth[w])!);
  const lineage = opt.lineage ?? (orphan ? 'orphan' : weighted(r, home.lineages, (x) => x[1])![0]);

  const talents: Talent[] = [];
  const nTalents = int(r, V.birth.talents.min, V.birth.talents.max);
  for (let i = 0; i < nTalents; i++) {
    const pool = TALENTS.filter((t) => !NOT_BORN_TALENTS.includes(t.id)
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

  h.name = opt.name ?? pick(r, FIRST_NAMES[gender]);
  h.gender = gender;
  h.surname = orphan ? null : sur.name;
  h.secretSurname = orphan && sur.kind === 'rare' ? sur.name : null;
  h.species = species;
  h.home = homeId;
  h.town = town.name;
  h.wealth = wealth;
  h.lineage = lineage;
  h.talents = talents.map((t) => t.id);
  h.base = base;
  h.money = V.wealthMoney[wealth];
  h.island = home.island;
  h.sea = home.sea;

  s.hardship += birthHardship(wealth, lineage);
}

/** 태어나며 지고 나오는 시련: 가난, 고아, 차별받는 핏줄 */
export function birthHardship(wealth: Wealth, lineage: Lineage): number {
  return (wealth === 'poor' ? V.hardship.poor : 0)
    + (lineage === 'orphan' ? V.hardship.orphan : 0)
    + (lineage === 'outcast' ? V.hardship.outcast : 0);
}
