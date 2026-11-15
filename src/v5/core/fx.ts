// 효과 적용. 효과는 값이고, 연산(op)마다 한 갈래씩 처리한다.
import { FIRST_NAMES } from '../../data/births';
import { chance, pick, rngOf } from '../../core/rng';
import { fill } from '../../core/util';
import { V } from '../data/balance';
import { STRENGTHS } from '../data/strengths';
import { logLine } from './state';
import { addMark } from './strengths';
import type { Fx, Life5, StatKey } from './types';

const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 문장의 자리표시 {town} {island}를 지금 주인공의 것으로 채우고 조사를 고른다 */
export function fillText(s: Life5, text: string): string {
  return fill(text, { town: s.hero.town, island: s.hero.island });
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
    // 뒤 과제가 채운다 (성장, 몸과 병, 열매, 성씨, 싸움). 그때까지는 아무 일도 없다
    case 'mastery': case 'tier': case 'master':
    case 'injury': case 'loseLimb': case 'prosthetic': case 'illness':
    case 'eatFruit': case 'reveal': case 'fight':
      return;
  }
}
