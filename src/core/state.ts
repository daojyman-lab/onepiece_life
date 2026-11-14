// 새 인생 만들기 (docs/02_설계/03_진행과_선택.md 2장).
import { B } from '../data/balance';
import { FIRST_NAMES, HOMETOWNS, PARENT_NAMES, ORPHAN_STORIES, SPECIES_BONUS, SPECIES_NAMES, SPECIES_REROLL, SURNAMES, SURNAME_WEIGHT } from '../data/births';
import { addPerson } from './people';
import { int, pick, rngOf, weighted } from './rng';
import type { LifeState, MetaState, StatKey } from './types';
import { TALENTS, TALENT_BY_ID, type Talent } from '../data/talents';
import { childhoodPick, resolveChoice } from './choice/choice';
import { fill, log, timeline } from './util';
import { randomName } from './people';
import { fireBirthday, fireNarrative } from './sim/lifeEvents';

export function emptyMeta(): MetaState {
  return { schema: 1, fruitCodex: {}, peopleCodex: {}, skillCodex: [], hall: [], lives: 0 };
}

export interface NewLifeOptions { surname?: string; gender?: 'm' | 'f'; name?: string; place?: string }

export function newLife(seed: number, meta: MetaState = emptyMeta(), opt: NewLifeOptions = {}): LifeState {
  const rng = { seed: seed >>> 0, cursor: 0 };
  const r = rngOf(rng);
  const sur = SURNAMES.find((x) => x.name === opt.surname) ?? weighted(r, SURNAMES, (x) => SURNAME_WEIGHT[x.kind])!;
  const gender: 'm' | 'f' = sur.gender !== 'any' ? sur.gender : opt.gender ?? (r() < 0.5 ? 'm' : 'f');
  let species = sur.species;
  if (sur.kind === 'common' && r() < SPECIES_REROLL.p) species = weighted(r, SPECIES_REROLL.weights, (x) => x[1])![0];
  // 이스트 블루와 연이 없는 성씨 · 종족이면 고아로 태어난다
  const orphan = sur.kind === 'rare' || species !== 'human';
  const homes = HOMETOWNS.filter((h) => (opt.place ? h.name === opt.place : sur.kind !== 'local' || sur.homes!.includes(h.name)));
  const town = homes.length ? pick(r, homes) : pick(r, HOMETOWNS);
  const house = pick(r, town.households);
  const base = { str: 10, spd: 10, vit: 12, int: 10, wil: 8, luk: 10 };
  for (const k of Object.keys(base) as StatKey[]) {
    base[k] += int(r, 0, 4) + (sur.bonus[k] ?? 0) + (SPECIES_BONUS[species]?.[k] ?? 0);
    base[k] = Math.max(3, base[k]);
  }
  const traits = [...sur.traits.filter((t) => t !== 'conquerorSeed')];
  if (sur.traits.includes('conquerorSeed') && r() < B.haki.conquerorSeed) traits.push('conqueror');
  // 타고난 재능 1~3개 (좋은 것 · 나쁜 것이 섞인다. 균형은 맞추지 않는다)
  const nTalents = r() < 0.4 ? 1 : r() < 0.67 ? 2 : 3;
  const born: Talent[] = [];
  for (let i = 0; i < nTalents; i++) {
    const pool = TALENTS.filter((t) => !traits.includes(t.id) && !born.some((b) => b.id === t.id || b.excludes?.includes(t.id) || t.excludes?.includes(b.id)));
    const t = weighted(r, pool, (x) => x.weight);
    if (!t) break;
    born.push(t);
    traits.push(t.id);
  }
  for (const t of born) for (const [k, v] of Object.entries(t.stat ?? {})) base[k as StatKey] = Math.max(1, base[k as StatKey] + (v as number));
  const birthMonth = int(r, 1, 12);
  const startAge = B.childhood.ages[0];

  const s: LifeState = {
    schema: 1, rng,
    time: { year: B.startYear + int(r, 0, 12) + startAge, month: birthMonth },
    hero: {
      name: opt.name ?? pick(r, FIRST_NAMES[gender]), surname: sur.name, gender, species,
      birth: { seaId: town.sea, place: town.name, household: orphan ? '고아' : house.text, month: birthMonth },
      age: startAge, route: 'none', rank: 0, fame: 0, money: born.find((t) => t.money !== undefined)?.money ?? 1000,
      base, hp: 100, injuries: [], illness: null, traits, fruit: null, alive: true,
    },
    growth: { focus: null, secondary: null, skills: {}, gates: [], master: null, focusSince: 0 },
    loadout: { skills: [], tactic: 'offense', retreatAt: 0, weapon: null, armor: null, charm: null, consumables: [], crew: [] },
    people: [],
    world: {
      stage: 1, seaId: town.sea, missions: [], refillAt: null,
      boss: { id: '', state: 'hidden', attempts: 0, nextAskAt: 0 },
      ship: null, defeated: [], news: [], apex: false,
    },
    inventory: { items: [], unknownFruits: [] },
    choice: { nextAt: 0, thisYear: 0, seen: {}, flags: [], queue: [] },
    log: [], timeline: [], pending: null,
    stats: { routineWins: 0, routineLosses: 0, eliteWins: 0, eliteLosses: 0, choices: 0, maxStage: 1, nearDeaths: 0 },
    lastBattle: null, seq: 0, notices: [], metaEvents: [], ended: null,
    known: {
      fruits: Object.keys(meta.fruitCodex),
      people: Object.entries(meta.peopleCodex).filter(([, v]) => v.defeated || v.met > 0).map(([k]) => k),
    },
  };
  // 0세부터 시작해 3세까지의 날들을 그린다 (첫 선택은 3세)
  s.hero.age = 0;
  s.time.year -= startAge;
  for (const p of s.people) p.age -= startAge;
  if (orphan) {
    // 마을 사람이 아이를 거둔다
    const gGender: 'm' | 'f' = r() < 0.5 ? 'm' : 'f';
    // 평범한 집안이 사람이 아닌 아이를 거뒀으면 그 집 성을 물려준다
    const gName = sur.kind === 'common' ? `${sur.name} ${pick(r, PARENT_NAMES[gGender])}` : randomName(s, gGender);
    const guardian = addPerson(s, { kind: 'family', relation: '보호자', gender: gGender, age: 40 + int(r, 0, 20), bond: 65, name: gName });
    s.hero.traits.push('orphan');
    log(s, fill(pick(r, ORPHAN_STORIES), { place: town.name }), 'world');
    const clue = species !== 'human'
      ? `${SPECIES_NAMES[species]} 아이였다. 어디서 왔는지 아는 사람은 없다.`
      : `포대기 속에는 「${sur.name}」(이)라고 적힌 쪽지와 ${sur.token ?? '낡은 물건 하나'}이(가) 들어 있었다.`;
    log(s, clue, 'world');
    log(s, `${house.text}의 ${guardian.name}이(가) 아이를 거둬 「${s.hero.surname} ${s.hero.name}」(이)라 불렀다.`, 'world');
    timeline(s, `${town.name}에서 고아로 거둬졌다`);
  } else {
    const father = addPerson(s, { kind: 'family', relation: '아버지', gender: 'm', age: 28 + int(r, 0, 14), bond: 60 });
    addPerson(s, { kind: 'family', relation: '어머니', gender: 'f', age: 26 + int(r, 0, 12), bond: 70 });
    if (house.father) father.faction = house.father;
    log(s, `${town.name}의 ${house.text}에서 ${s.hero.surname} ${s.hero.name}이(가) 태어났다.`, 'world');
    timeline(s, `${town.name}에서 태어났다`);
  }
  if (traits.includes('conqueror')) log(s, '태어날 때 사나운 짐승들이 고개를 숙였다고 한다.', 'info');
  const talents = traits.map((id) => TALENT_BY_ID[id]).filter((t) => t);
  if (talents.length) log(s, `타고난 것: ${talents.map((t) => `${t.name}${t.good ? '' : '(-)'}`).join(', ')}`, 'world');
  if (traits.includes('poor') && !s.choice.flags.includes('family_poor')) s.choice.flags.push('family_poor');
  jumpToAge(s, startAge);

  s.choice.queue = childhoodPick(s);
  s.pending = resolveChoice(s, s.choice.queue.shift()!);
  return s;
}

/** 나이를 건너뛴다 (유년기). 해와 주변 사람의 나이도 함께 */
export function jumpToAge(s: LifeState, age: number) {
  // 건너뛰는 해마다 작은 사건이 몇 개씩 지나간다
  while (s.hero.age < age) {
    const base = s.time.year * 12 + (s.hero.birth.month - 1);
    for (let i = 0; i < B.lifeEvents.childPerYear; i++) {
      const t = base + Math.floor((i + 1) * 12 / (B.lifeEvents.childPerYear + 1));
      s.time.year = Math.floor(t / 12);
      s.time.month = (t % 12) + 1;
      fireNarrative(s);
    }
    s.hero.age += 1;
    s.time.year = Math.floor(base / 12) + 1;
    s.time.month = s.hero.birth.month;
    for (const p of s.people) p.age += 1;
    fireBirthday(s);
  }
}
