// 새 인생 만들기 (docs/02_설계/03_진행과_선택.md 2장).
import { B } from '../data/balance';
import { FIRST_NAMES, PROTECTED, SPECIES_BONUS, SPECIES_REROLL, SURNAMES } from '../data/births';
import { addPerson } from './people';
import { int, pick, rngOf, weighted } from './rng';
import type { LifeState, MetaState, StatKey } from './types';
import { childhoodPick, resolveChoice } from './choice/choice';
import { log, timeline } from './util';

export function emptyMeta(): MetaState {
  return { schema: 1, fruitCodex: {}, peopleCodex: {}, skillCodex: [], hall: [], lives: 0 };
}

export interface NewLifeOptions { surname?: string; gender?: 'm' | 'f'; name?: string }

export function newLife(seed: number, meta: MetaState = emptyMeta(), opt: NewLifeOptions = {}): LifeState {
  const rng = { seed: seed >>> 0, cursor: 0 };
  const r = rngOf(rng);
  const sur = SURNAMES.find((x) => x.name === opt.surname) ?? pick(r, SURNAMES);
  const gender: 'm' | 'f' = sur.gender !== 'any' ? sur.gender : opt.gender ?? (r() < 0.5 ? 'm' : 'f');
  let species = sur.species;
  if (species === 'human' && !PROTECTED.includes(sur.name) && r() < SPECIES_REROLL.p) {
    species = weighted(r, SPECIES_REROLL.weights, (x) => x[1])![0];
  }
  const where = pick(r, sur.places);
  const base = { str: 10, spd: 10, vit: 12, int: 10, wil: 8, luk: 10 };
  for (const k of Object.keys(base) as StatKey[]) {
    base[k] += int(r, 0, 4) + (sur.bonus[k] ?? 0) + (SPECIES_BONUS[species]?.[k] ?? 0);
    base[k] = Math.max(3, base[k]);
  }
  const traits = [...sur.traits.filter((t) => t !== 'conquerorSeed')];
  if (r() < (sur.traits.includes('conquerorSeed') ? 0.5 : 0.03)) traits.push('conqueror');
  const birthMonth = int(r, 1, 12);
  const startAge = B.childhood.ages[0];

  const s: LifeState = {
    schema: 1, rng,
    time: { year: B.startYear + int(r, 0, 12) + startAge, month: birthMonth },
    hero: {
      name: opt.name ?? pick(r, FIRST_NAMES[gender]), surname: sur.name, gender, species,
      birth: { seaId: where.sea, place: where.place, household: pick(r, sur.households), month: birthMonth },
      age: startAge, route: 'none', rank: 0, fame: 0, money: 1000,
      base, hp: 100, injuries: [], illness: null, traits, fruit: null, alive: true,
    },
    growth: { focus: null, secondary: null, skills: {}, gates: [], master: null, focusSince: 0 },
    loadout: { skills: [], tactic: 'offense', retreatAt: 0, weapon: null, armor: null, charm: null, consumables: [], crew: [] },
    people: [],
    world: {
      stage: 1, seaId: where.sea, missions: [], refillAt: null,
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
  const father = addPerson(s, { kind: 'family', relation: '아버지', gender: 'm', age: 28 + int(r, 0, 14), bond: 60 });
  const mother = addPerson(s, { kind: 'family', relation: '어머니', gender: 'f', age: 26 + int(r, 0, 12), bond: 70 });
  if (/해군/.test(s.hero.birth.household)) father.faction = 'marine';
  if (/해적|산적/.test(s.hero.birth.household)) father.faction = 'pirate';
  void mother;

  log(s, `${s.hero.birth.place}의 ${s.hero.birth.household}에서 ${s.hero.surname} ${s.hero.name}이(가) 태어났다.`, 'world');
  timeline(s, `${s.hero.birth.place}에서 태어났다`);
  if (traits.includes('conqueror')) log(s, '태어날 때 사나운 짐승들이 고개를 숙였다고 한다.', 'info');

  s.choice.queue = childhoodPick(s);
  s.pending = resolveChoice(s, s.choice.queue.shift()!);
  return s;
}

/** 나이를 건너뛴다 (유년기). 해와 주변 사람의 나이도 함께 */
export function jumpToAge(s: LifeState, age: number) {
  const d = age - s.hero.age;
  if (d <= 0) return;
  s.hero.age = age;
  s.time.year += d;
  s.time.month = s.hero.birth.month;
  for (const p of s.people) p.age += d;
}
