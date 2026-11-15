// 효과 적용. 효과는 값이고, 연산(op)마다 한 갈래씩 처리한다.
import { FIRST_NAMES } from '../../data/births';
import { BRANCH_NAMES } from '../../data/skills';
import { chance, pick, rngOf } from '../../core/rng';
import { fill } from '../../core/util';
import { V } from '../data/balance';
import { STRENGTHS } from '../data/strengths';
import { askFight } from './fight';
import { revealSurname } from './fortune';
import { logLine } from './state';
import { addMark } from './strengths';
import type { BranchId } from '../../core/types';
import type { Branch, Fx, Life5, StatKey } from './types';

const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 문장의 자리표시 {town} {island}를 지금 주인공의 것으로 채우고 조사를 고른다 */
export function fillText(s: Life5, text: string): string {
  return fill(text, { town: s.hero.town, island: s.hero.island });
}

/** v5 갈래 → v4 갈래 id (재능의 숙련 배율과 갈래 이름이 v4 id로 적혀 있다) */
export const BRANCH_ID: Record<Branch, BranchId> = {
  fist: 'martial.fist', sword: 'martial.sword', gun: 'martial.gun',
  observation: 'haki.observation', armament: 'haki.armament', conqueror: 'haki.conqueror', fruit: 'fruit',
};

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

function applyOne(s: Life5, e: Fx): void {
  const h = s.hero;
  switch (e.op) {
    case 'base':
      for (const k of e.key === 'all' ? STAT_KEYS : [e.key]) h.base[k] = Math.max(0, h.base[k] + e.add);
      return;
    case 'hp': h.hp = clamp(h.hp + e.add, 0, V.hp.max); return;
    case 'money': h.money = Math.max(0, h.money + e.add); return;
    case 'fame': h.fame = Math.max(0, h.fame + e.add); return;
    case 'rank': h.rank = Math.max(0, h.rank + e.add); return;
    case 'standing': h.standing = e.to; return;
    case 'move': h.island = e.island; h.sea = e.sea; return;
    case 'flag': if (!s.flags.includes(e.id)) s.flags.push(e.id); return;
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
      const gender = pick(r, ['m', 'f'] as const);
      s.people.push({
        id: `p${s.seq++}`, name: e.name ?? pick(r, FIRST_NAMES[gender]), gender, age: s.age,
        kind: e.kind, relation: e.relation, canon: e.canon ?? null,
        bond: V.person.bond, faction: 'civil', species: 'human', alive: true,
      });
      return;
    }
    case 'losePerson': {
      const p = s.people.find((x) => x.alive && x.relation === e.relation);
      if (!p) return;
      p.alive = false;
      s.hardship += V.hardship.loss;
      return;
    }
    case 'queue': if (!s.queue.includes(e.turning)) s.queue.push(e.turning); return;
    case 'log': logLine(s, fillText(s, e.text), e.weight); return;
    case 'timeline': s.timeline.push({ age: s.age, text: fillText(s, e.text) }); return;
    case 'die':
      if (!h.alive) return;
      h.alive = false;
      s.ended = { cause: e.cause, age: s.age };
      s.pending = { kind: 'ending', cause: e.cause };
      return;
    case 'chance':
      applyFx(s, chance(rngOf(s.rng), e.p) ? e.then : (e.else ?? []));
      return;
    case 'mastery': addMastery(s, e.branch, e.add); return;
    // 단계를 그 자리까지 끌어올린다. 이미 더 높으면 그대로 둔다
    case 'tier': s.growth.tier[e.branch] = Math.max(s.growth.tier[e.branch], clamp(e.to, 0, V.growth.maxTier)); return;
    case 'master':
      s.growth.master = { name: e.name, branch: e.branch, cap: e.cap, yearsLeft: e.years, paid: e.paid };
      return;
    case 'reveal': revealSurname(s); return;
    // 흉터는 낫지 않는다 (monthsLeft를 줄이지 않는다)
    case 'injury': h.injuries.push({ severity: e.severity, monthsLeft: V.injury.months[e.severity] }); return;
    case 'fight': askFight(s, e.foe, e.lethal, e.forced); return;
    // 뒤 과제가 채운다 (몸과 병, 열매). 그때까지는 아무 일도 없다
    case 'loseLimb': case 'prosthetic': case 'illness': case 'eatFruit':
      return;
  }
}
