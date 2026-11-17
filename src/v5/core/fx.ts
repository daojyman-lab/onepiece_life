// 효과 적용. 효과는 값이고, 연산(op)마다 한 갈래씩 처리한다.
import { setDream } from './dreams';
import { sailTo } from './voyage';
import { npcName } from './names';
import { enterPrime } from './stages';
import { FRUIT_BY_ID, FRUITS } from '../../data/fruits';
import { SEA_BY_ID } from '../../data/seas';
import { BRANCH_NAMES } from '../../data/skills';
import { crewPowerFor } from '../../core/people';
import { chance, pick, rngOf, weighted } from '../../core/rng';
import { fill } from '../../core/util';
import { V } from '../data/balance';
import { CANON, canonAge } from '../data/canon';
import { HOMES } from '../data/homes';
import { STANDING_FROM_CHILD, STANDING_PHRASE } from '../data/standings';
import { STRENGTHS } from '../data/strengths';
import { fitProsthetic, loseLimb } from './body';
import { askFight } from './fight';
import { personIs } from './needs';
import { revealSurname } from './fortune';
import { BRANCH_ID } from './power';
import { logLine } from './state';
import { addMark } from './strengths';
import { isDeep } from './values';
import type { Branch, Fx, Life5, Person, StatKey } from './types';

const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 문장의 자리표시 {name} {town} {island}를 지금 주인공의 것으로 채우고 조사를 고른다 */
export function fillText(s: Life5, text: string): string {
  return fill(text, { name: s.hero.name, town: s.hero.town, island: s.hero.island });
}

/** 이 갈래에서 오를 수 있는 가장 높은 단계. 스승이 없으면 noMasterCap, 스승의 갈래는 스승이 정한다 (돈으로 들인 스승은 paidCap까지) */
export function tierCap(s: Life5, b: Branch): number {
  const m = s.growth.master;
  if (!m || m.branch !== b) return V.growth.noMasterCap;
  return Math.max(V.growth.noMasterCap, Math.min(m.cap, m.paid ? V.growth.paidCap : V.growth.maxTier));
}

/** 숙련을 더한다. tierUp에 닿으면 단계를 하나 올리고 숙련을 0으로 돌린다. 상한에 닿으면 숙련은 tierUp에서 멈춘다. */
export function addMastery(s: Life5, b: Branch, add: number): void {
  const g = s.growth;
  g.mastery[b] = Math.max(0, g.mastery[b] + add);
  if (g.mastery[b] < V.growth.tierUp) return;
  if (g.tier[b] >= tierCap(s, b)) { g.mastery[b] = V.growth.tierUp; return; }
  g.tier[b] += 1;
  g.mastery[b] = 0;
  logLine(s, `${BRANCH_NAMES[BRANCH_ID[b]]}이(가) ${g.tier[b]}단계에 올랐다.`, 'heavy', 'growth');
}

export function applyFx(s: Life5, fx: Fx[]): void {
  for (const e of fx) applyOne(s, e);
}

/** 제 배를 가진 해적과 칠무해는 선장이다 (선장 · 선원에 따라 다른 글이 온다: 표시 'captain') */
function captainByShip(s: Life5): void {
  const st = s.hero.standing;
  if ((st === 'warlord' || (st === 'pirate' && s.flags.includes('ship'))) && !s.flags.includes('captain')) s.flags.push('captain');
}

function applyOne(s: Life5, e: Fx): void {
  const h = s.hero;
  switch (e.op) {
    case 'base':
      for (const k of e.key === 'all' ? STAT_KEYS : [e.key]) h.base[k] = Math.max(0, h.base[k] + e.add);
      return;
    case 'hp': h.hp = clamp(h.hp + e.add, 0, V.hp.max); return;
    case 'money': { // 탐욕이 깊으면 들어오는 돈이 불어난다 (나가는 돈은 그대로)
      const add = e.add > 0 && isDeep(s, 'greed') ? Math.round(e.add * V.value.greedMoney) : e.add;
      h.money = Math.max(0, h.money + add); return;
    }
    case 'fame': h.fame = Math.max(0, h.fame + e.add); return;
    case 'rank': h.rank = Math.max(0, h.rank + e.add); return;
    // 처지가 실제로 바뀔 때만 연표에 짧게 남긴다 (한 줄 인생이 이 줄들을 잇는다)
    case 'standing':
      if (h.standing === e.to) return;
      const text = (h.standing === 'child' && STANDING_FROM_CHILD[e.to]) || STANDING_PHRASE[e.to];
      h.standing = e.to;
      s.standingSince = s.age;
      captainByShip(s);
      s.timeline.push({ age: s.age, text, standing: e.to });
      return;
    case 'move': h.island = e.island; h.sea = e.sea; return;
    case 'moveHome': h.island = h.town; h.sea = HOMES[h.home].sea; return;
    case 'flag': if (!s.flags.includes(e.id)) s.flags.push(e.id); captainByShip(s); if (e.id === 'prime') enterPrime(s); return;
    case 'dream': setDream(s, e.id); return;
    case 'sail': sailTo(s, e.island, e.route); return;
    case 'unflag': s.flags = s.flags.filter((f) => f !== e.id); return;
    case 'mark': {
      const got = addMark(s, e.id);
      const st = got ? STRENGTHS.find((x) => x.id === got) : undefined;
      if (st) logLine(s, `마음속에 「${st.name}」이(가) 자리 잡았다. ${st.text}.`, 'heavy', 'good');
      return;
    }
    case 'hardship': s.hardship = Math.max(0, s.hardship + e.add); return;
    case 'person': {
      const r = rngOf(s.rng);
      const c = e.canon ? CANON[e.canon] : undefined;
      const gender = c?.gender ?? e.gender ?? pick(r, ['m', 'f'] as const);
      const p: Person = {
        id: `p${s.seq++}`, name: c?.name ?? e.name ?? npcName(s, r, gender), gender, age: personAge(s, e),
        kind: e.kind, relation: e.relation, canon: e.canon ?? null,
        bond: V.person.bond, faction: c?.faction ?? 'civil', species: c?.species ?? 'human', alive: true,
      };
      // 동료는 싸움에 함께 나선다: v4 동료와 같은 꼴의 싸움 정보를 지금 바다에 맞춰 준다
      if (e.kind === 'crew') {
        const { role, maxLevel } = V.person.crew;
        const level = Math.min(maxLevel, e.level ?? V.person.crew.level);
        if (e.canon) s.people = s.people.filter((x) => !(x.alive && x.canon === e.canon));   // 이미 아는 사이였으면 그 사람이 배에 오른다 (둘이 되지 않는다)
        if (e.years) p.tempUntil = s.age + e.years;
        p.crew = { role: e.role ?? role, level, power: crewPowerFor(SEA_BY_ID[h.sea].stage, level), skills: [], injuredMonths: 0 };
      }
      s.people.push(p);
      return;
    }
    case 'crewTrain': {
      const stage = SEA_BY_ID[h.sea].stage;
      for (const p of s.people) {
        if (!p.alive || !p.crew) continue;
        p.crew.level = Math.min(V.person.crew.maxLevel, p.crew.level + e.add);
        p.crew.power = Math.max(p.crew.power, crewPowerFor(stage, p.crew.level));
      }
      return;
    }
    case 'partCrew':
      for (const p of s.people) if (p.alive && p.crew && p.relation.startsWith(e.prefix)) { delete p.crew; p.kind = 'ally'; }
      return;
    case 'losePerson': {
      const p = s.people.find((x) => x.alive && ('who' in e ? personIs(x, e.who) : x.relation === e.relation));
      if (!p) return;
      p.alive = false;
      s.hardship += V.hardship.loss;
      return;
    }
    case 'queue': if (!s.queue.includes(e.turning)) s.queue.push(e.turning); return;
    case 'log': logLine(s, fillText(s, e.text), e.weight); return;
    case 'timeline': s.timeline.push({ age: s.age, text: fillText(s, e.text), ...(e.canon ? { canon: e.canon } : {}) }); return;
    case 'die':
      if (!h.alive) return;
      h.alive = false;
      s.ended = { cause: e.cause, age: s.age };
      s.pending = { kind: 'ending', cause: e.cause };
      return;
    case 'chance':
      applyFx(s, chance(rngOf(s.rng), e.p) ? e.then : (e.else ?? []));
      return;
    case 'mastery':
      addMastery(s, e.branch, e.add);
      if (e.add > 0) s.growth.pref[e.branch] += e.add * V.growth.pref.fromMastery;
      return;
    case 'pref': s.growth.pref[e.branch] = Math.max(0, s.growth.pref[e.branch] + e.add); return;
    // 단계를 그 자리까지 끌어올린다. 이미 더 높으면 그대로 둔다
    case 'tier': s.growth.tier[e.branch] = Math.max(s.growth.tier[e.branch], clamp(e.to, 0, V.growth.maxTier)); return;
    case 'master':
      s.growth.master = { name: e.name, branch: e.branch, cap: e.cap, yearsLeft: e.years, paid: e.paid };
      // 스승을 들이면 그 갈래가 앞선다. 길이 바뀌면 year.ts의 notePath가 큰 일로 남긴다
      s.growth.pref[e.branch] = Math.max(...Object.values(s.growth.pref)) + V.growth.pref.masterLead;
      return;
    case 'reveal': revealSurname(s); return;
    // 흉터는 낫지 않는다 (monthsLeft를 줄이지 않는다)
    case 'injury': h.injuries.push({ severity: e.severity, monthsLeft: V.injury.months[e.severity] }); return;
    case 'fight': askFight(s, e.foe, e.lethal, e.forced, e.next); return;
    case 'loseLimb': loseLimb(s, e.limb, rngOf(s.rng)); return;
    case 'prosthetic': fitProsthetic(s, e.grade); return;
    // 이미 앓는 병이 있으면 새로 걸리지 않는다. 진행과 치료는 risk.ts의 partRisks가 맡는다
    case 'illness': if (!h.illness) h.illness = { id: e.id, stage: 1, months: 0 }; return;
    case 'wealth': h.wealth = e.to; return;
    case 'eatFruit': eatFruit(s, e.id); return;
  }
}

/** 새로 만나는 사람의 나이: 원작 인물은 원작의 나이 차, 적힌 나이, 주인공보다 n살 위/아래, 없으면 주인공과 같은 나이 */
function personAge(s: Life5, e: Extract<Fx, { op: 'person' }>): number {
  if (e.canon && CANON[e.canon]) return canonAge(e.canon, s.age);
  const a = e.age;
  if (a === undefined) return s.age;
  if (typeof a === 'number') return a;
  return 'older' in a ? s.age + a.older : Math.max(0, s.age - a.younger);
}

/** 악마의 열매를 먹는다. 'random'이면 낮은 등급 쪽으로 기울여 원작 인물의 것이 아닌 열매를 고른다. 이미 능력자면 아무 일도 없다 */
function eatFruit(s: Life5, id: string): void {
  if (s.hero.fruit) return;
  const W = V.fruit.gradeWeight;
  const f = id === 'random'
    ? weighted(rngOf(s.rng), FRUITS.filter((x) => x.canonUser === null), (x) => W[x.grade])
    : FRUIT_BY_ID[id];
  if (!f) return;
  s.hero.fruit = { id: f.id, eatenAt: s.age };
  s.growth.tier.fruit = Math.max(s.growth.tier.fruit, V.fruit.startTier);
  logLine(s, `${f.name}을(를) 삼켰다. 몸속에서 낯선 힘이 꿈틀거린다. 다시는 헤엄칠 수 없다.`, 'heavy', 'growth');
}
