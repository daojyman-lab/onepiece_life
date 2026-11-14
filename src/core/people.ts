// 사람 만들기 (가족, 라이벌, 동료).
import { COMMON_SURNAMES, FIRST_NAMES, PARENT_NAMES } from '../data/births';
import { B } from '../data/balance';
import { int, pick, rngOf } from './rng';
import type { CrewRole, CrewSeed, LifeState, Person, PersonSeed } from './types';
import { findPerson, uid } from './util';

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

const ROLE_NAMES: Record<CrewRole, string> = {
  vanguard: '전위', support: '지원', medic: '치료', navigator: '항해사', cook: '요리사', shipwright: '목수',
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

/** 동료의 힘. 해역 단계와 레벨에서 나온다 */
export function crewPowerFor(stage: number, level: number) {
  return Math.round(10 + stage * 10 + level * B.crew.powerPerLevel * 0.5);
}

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
    rival.crew = { role: seed.role, level: 3, power: Math.max(rival.power ?? 0, crewPowerFor(s.world.stage, 3)), skills: [], injuredMonths: 0 };
    return rival;
  }
  const level = int(r, 1, 3) + (s.world.stage - 1) * 2;
  const gender = seed.gender ?? (r() < 0.5 ? 'm' : 'f');
  const p: Person = {
    id: uid(s, 'p'), name: seed.name ?? randomName(s, gender), gender, age: int(r, 17, 32),
    kind: 'crew', relation: `동료 · ${ROLE_NAMES[seed.role]}`, canon: null, bond: 50,
    faction, species: 'human', alive: true,
    crew: { role: seed.role, level, power: seed.power ?? crewPowerFor(s.world.stage, level), skills: [], injuredMonths: 0 },
  };
  s.people.push(p);
  return p;
}

export function crewOf(s: LifeState) {
  return s.people.filter((p) => p.alive && p.kind === 'crew');
}
