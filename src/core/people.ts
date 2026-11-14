// 사람 만들기 (가족, 라이벌, 동료).
import { COMMON_SURNAMES, FIRST_NAMES, PARENT_NAMES } from '../data/births';
import { B } from '../data/balance';
import { CREW_TRAITS, CREW_TRAIT_BY_ID, type CrewTrait } from '../data/crewTraits';
import { int, pick, rngOf, weighted, type Rng } from './rng';
import type { CrewRole, CrewSeed, LifeState, Person, PersonSeed, Species } from './types';
import { findPerson, uid } from './util';
import { NAMED_CREW_BY_ID } from '../data/namedCrew';
import { CREW_SPECIES_WEIGHTS, ROLE_EPITHETS, SPECIES_EPITHETS, TRAIT_EPITHETS } from '../data/crewEpithets';

export function randomName(s: LifeState, gender: 'm' | 'f') {
  const r = rngOf(s.rng);
  return `${pick(r, COMMON_SURNAMES)} ${pick(r, FIRST_NAMES[gender])}`;
}

export function addPerson(s: LifeState, seed: PersonSeed): Person {
  const r = rngOf(s.rng);
  const gender = seed.gender ?? (r() < 0.5 ? 'm' : 'f');
  const p: Person = {
    id: uid(s, 'p'),
    name: seed.name ?? (seed.relation === '아버지' || seed.relation === '어머니'
      ? `${s.hero.surname} ${pick(r, PARENT_NAMES[gender])}` : randomName(s, gender)),
    gender, age: seed.age ?? s.hero.age + int(r, -1, 2),
    kind: seed.kind, relation: seed.relation, canon: seed.canon ?? null,
    bond: seed.bond ?? 50, faction: seed.faction ?? 'civil', species: 'human',
    power: seed.power, alive: true,
  };
  s.people.push(p);
  return p;
}

// 병과 이름 (화면 표시). 규칙은 역할 id로 본다
const ROLE_NAMES: Record<CrewRole, string> = {
  vanguard: '돌격대', support: '저격수', medic: '선의', navigator: '항해사', cook: '요리사', shipwright: '목수',
};
export const roleName = (r: CrewRole) => ROLE_NAMES[r];

/** 역할이 하는 일 (화면 설명용). 규칙은 전투 · 몸 · 돈 · 배 모듈에 있다 */
export const ROLE_DESC: Record<CrewRole, string> = {
  vanguard: '강적전에서 적 하나를 맡아 싸운다',
  support: '적을 맡아 싸운다. 다른 싸움을 도울 때 위력 70%',
  medic: '싸우지 않는다. 편성하면 전투에서 3합마다 체력 15% 회복. 병에 덜 걸리고 치료비 절반',
  navigator: '싸우지 않는다. 정찰이 좋아지고, 편성하면 바다에 빠질 확률 절반',
  cook: '싸우지 않는다. 생활비 절반, 건강 회복 1.5배',
  shipwright: '싸우지 않는다. 배 값 20% 할인',
};
export const isFighter = (r: CrewRole) => r === 'vanguard' || r === 'support';

/** 부선장 (해군은 부분대장). 떠났거나 죽었으면 없다 */
export function firstMateOf(s: LifeState): Person | null {
  const id = s.world.firstMate;
  return (id && s.people.find((p) => p.id === id && p.alive && p.kind === 'crew')) || null;
}
export const mateTitle = (s: LifeState) => (s.hero.route === 'marine' ? '부분대장' : '부선장');

/** 회식 버프가 남은 달 수 */
export function feastLeft(s: LifeState) {
  const until = s.world.feastUntil ?? 0;
  return Math.max(0, until - (s.time.year * 12 + s.time.month - 1));
}

/** 동료의 힘. 해역 단계와 레벨에서 나온다 */
export function crewPowerFor(stage: number, level: number) {
  return Math.round(10 + stage * 10 + level * B.crew.powerPerLevel * 0.5);
}

/** 동료의 이명을 고른다: 종족 · 성격 · 병과에 어울리는 것, 지금 배에 있는 동료와 겹치지 않게 */
export function pickEpithet(s: LifeState, r: Rng, trait: string, role: CrewRole, species: Species): string {
  const taken = new Set(s.people.filter((p) => p.alive && p.epithet).map((p) => p.epithet));
  const sp = SPECIES_EPITHETS[species] ?? [];
  const tr = TRAIT_EPITHETS[trait] ?? [];
  const ro = ROLE_EPITHETS[role] ?? [];
  const roll = r();
  const order = sp.length && roll < 0.3 ? [sp, tr, ro] : roll < 0.75 ? [tr, ro, sp] : [ro, tr, sp];
  for (const list of order) {
    const free = list.filter((x) => !taken.has(x));
    if (free.length) return pick(r, free);
  }
  return pick(r, [...tr, ...ro]);
}

/** 이명. 예전 저장처럼 없으면 성격에서 고정으로 정한다 */
export function epithetOf(p: Person): string | null {
  if (p.epithet) return p.epithet;
  if (!p.crew) return null;
  const list = TRAIT_EPITHETS[traitOf(p).id] ?? [];
  let h = 0;
  for (const ch of p.id) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return list.length ? list[h % list.length] : null;
}
/** 「이명」 이름 */
export const crewLabel = (p: Person) => { const e = epithetOf(p); return e ? `「${e}」 ${p.name}` : p.name; };

export function recruit(s: LifeState, seed: CrewSeed): Person | null {
  const r = rngOf(s.rng);
  const faction = s.hero.route === 'marine' ? 'marine' : s.hero.route === 'revolution' ? 'rev' : s.hero.route === 'pirate' ? 'pirate' : 'civil';
  // 라이벌을 동료로
  if (seed.name === '{rival}') {
    const rival = findPerson(s, 'rival');
    if (!rival) return null;
    rival.kind = 'crew';
    rival.relation = '라이벌 · 동료';
    rival.faction = faction;
    rival.epithet ??= pickEpithet(s, r, 'loyal', seed.role, rival.species);
    rival.crew = { role: seed.role, level: 3, power: Math.max(rival.power ?? 0, crewPowerFor(s.world.stage, 3)), skills: [], injuredMonths: 0, trait: 'loyal', fruit: null };
    return rival;
  }
  // 원작 인물: 정해진 이름 · 종족 · 성격 · 열매, 더 높은 레벨과 잠재력
  const n = seed.named ? NAMED_CREW_BY_ID[seed.named] : undefined;
  if (n) {
    if (s.people.some((p) => p.canon === n.id && p.alive && p.kind === 'crew')) return null;
    const lv = int(r, 1, 3) + (s.world.stage - 1) * 2 + n.levelBonus;
    const p: Person = {
      id: uid(s, 'p'), name: n.name, gender: n.gender, age: n.age,
      kind: 'crew', relation: `${s.hero.route === 'marine' ? '분대원' : '동료'} · ${ROLE_NAMES[n.role]}`, canon: n.id, bond: 60, epithet: n.epithet,
      faction, species: n.species, alive: true,
      crew: { role: n.role, level: lv, power: Math.round(crewPowerFor(s.world.stage, lv) * n.powerMult), skills: [], injuredMonths: 0, trait: n.trait, fruit: n.fruit ?? null, growth: n.growth },
    };
    s.people.push(p);
    return p;
  }
  const level = int(r, 1, 3) + (s.world.stage - 1) * 2;
  const gender = seed.gender ?? (r() < 0.5 ? 'm' : 'f');
  // 다양한 종족을 만난다 (해군은 대부분 인간이지만 어인 · 밍크 병사도 있다)
  const species: Species = weighted(r, CREW_SPECIES_WEIGHTS, ([sp, w]) => (s.hero.route === 'marine' && sp !== 'human' ? w * 0.5 : w))?.[0] ?? 'human';
  const trait = pick(r, CREW_TRAITS).id;
  const p: Person = {
    id: uid(s, 'p'), name: seed.name ?? randomName(s, gender), gender, age: species === 'giant' || species === 'lunarian' ? int(r, 25, 80) : int(r, 17, 32),
    kind: 'crew', relation: `${s.hero.route === 'marine' ? '분대원' : '동료'} · ${ROLE_NAMES[seed.role]}`, canon: null, bond: 50,
    faction, species, alive: true, epithet: pickEpithet(s, r, trait, seed.role, species),
    crew: { role: seed.role, level, power: seed.power ?? crewPowerFor(s.world.stage, level), skills: [], injuredMonths: 0, trait, fruit: null },
  };
  s.people.push(p);
  return p;
}

/** 사람의 얼굴 씨앗. 화면 어디서나 이것으로 그린다 */
export const faceKeyOf = (p: Pick<Person, 'canon' | 'id' | 'name'>) => p.canon ?? p.id + p.name;

/** 동료의 성격. 예전 저장처럼 없으면 id에서 고정으로 정한다 */
export function traitOf(p: Person): CrewTrait {
  const id = p.crew?.trait;
  if (id && CREW_TRAIT_BY_ID[id]) return CREW_TRAIT_BY_ID[id];
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CREW_TRAITS[h % CREW_TRAITS.length];
}

export function crewOf(s: LifeState) {
  return s.people.filter((p) => p.alive && p.kind === 'crew');
}
