// 같은 출생 시드에서 서로 다른 선택 정책으로 일반 플레이를 비교한다.
import { newLife5 } from '../src/core/state';
import { apply5, invariants5 } from '../src/core/reduce';
import { TURNING_BY_ID } from '../src/data/turnings';
import { hasLifeEvent } from '../src/core/life-story';
import type { Fx, Life5 } from '../src/core/types';

export type CoursePolicy = 'guard' | 'duel' | 'evidence';
const flatten = (fx: Fx[]): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [...flatten(e.then), ...flatten(e.else ?? [])] : [e]);
function safeScore(fx: Fx[]): number {
  return flatten(fx).reduce((score, e) => score +
    (['die', 'loseLimb', 'move', 'moveHome', 'standing', 'fight', 'illness', 'injury'].includes(e.op) ? -100 : 0) +
    (e.op === 'master' ? (e.branch === 'sword' ? 3 : -30) : 0) +
    (e.op === 'adoptStyle' ? (e.style === 'oneSword' ? 20 : -50) : 0) +
    (e.op === 'hp' ? e.add : 0) + (e.op === 'tier' ? 2 : 0) +
    (e.op === 'money' ? Math.sign(e.add) : 0), 0);
}
export function courseChoice(s: Life5, mode: CoursePolicy): number {
  if (s.pending?.kind === 'fight') return 0;
  if (s.pending?.kind !== 'door') return 0;
  const p = s.pending, t = TURNING_BY_ID[p.turning];
  const choices: Record<string, number> = {
    life_course_promise: mode === 'duel' ? 1 : 0,
    life_course_training: mode === 'duel' ? 1 : 0,
    life_course_departure: 0,
    life_course_prepare: mode === 'guard' ? 0 : mode === 'evidence' ? 1 : 2,
    life_course_recognition: 0,
    life_course_legacy: 0,
    ep_alabasta_p1: 1, ep_alabasta_p2: 2, ep_alabasta_p3: 1,
    ep_alabasta_p4: 1, ep_alabasta_p5: 0, ep_alabasta_p6: 1,
    ep_alabasta_p7: 0, ep_alabasta_p9: 0, ep_alabasta_p10: 0, ep_alabasta_p11: 0,
  };
  const preferred = choices[p.turning];
  if (preferred !== undefined && p.doors[preferred] && !p.doors[preferred].locked) return preferred;
  const open = p.doors.map((d, i) => ({ d, i })).filter(({ d }) => !d.locked);
  return open.sort((a, b) => safeScore(t?.doors[b.i]?.fx ?? []) - safeScore(t?.doors[a.i]?.fx ?? []))[0]?.i ?? 0;
}
export function playLifeCourse(seed: number, mode: CoursePolicy, maxAge = 45): Life5 {
  const s = newLife5(seed, { home: 'loguetown' });
  for (let steps = 0; steps < 3000 && s.hero.alive && s.age <= maxAge; steps++) {
    apply5(s, s.pending ? { type: 'answer', index: courseChoice(s, mode) } : { type: 'step' });
    const bad = invariants5(s);
    if (bad.length) throw new Error(bad.join(', '));
    if (hasLifeEvent(s, 'legacy')) return s;
  }
  return s;
}

