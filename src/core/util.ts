import { josa } from './josa';
import { B } from '../data/balance';
import { TALENT_BY_ID } from '../data/talents';
import type { LifeState, LogType, Person } from './types';

export const absMonth = (s: LifeState) => s.time.year * 12 + (s.time.month - 1);

export function log(s: LifeState, text: string, type: LogType = 'info') {
  s.logSeq = (s.logSeq ?? 0) + 1;
  s.log.push({ t: absMonth(s), text: josa(text), type, id: s.logSeq });
  if (s.log.length > B.log.max) s.log.splice(0, s.log.length - B.log.max);
}
export function timeline(s: LifeState, text: string) {
  s.timeline.push({ t: absMonth(s), age: s.hero.age, text: josa(text) });
}
export function notice(s: LifeState, text: string) {
  s.notices.push(text);
}
export function uid(s: LifeState, prefix: string) {
  s.seq += 1;
  return `${prefix}${s.seq}`;
}
export function clone<T>(x: T): T {
  return structuredClone(x);
}
export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
export function findPerson(s: LifeState, who: string): Person | undefined {
  // 고아는 부모 대신 보호자가 그 자리를 맡는다
  if ((who === '아버지' || who === '어머니') && !s.people.some((p) => p.alive && p.relation === who)) {
    return s.people.find((p) => p.alive && p.relation === '보호자');
  }
  return s.people.find((p) => p.alive && (p.id === who || p.relation === who || p.kind === who))
    ?? s.people.find((p) => p.alive && p.relation.includes(who));
}
/** 주인공이 가진 타고난 재능 */
export function talentsOf(s: LifeState) {
  return s.hero.traits.map((id) => TALENT_BY_ID[id]).filter((t): t is NonNullable<typeof t> => !!t);
}
/** 재능들의 배율을 곱한다 (없으면 1) */
export function talentMult(s: LifeState, key: 'illness' | 'injury' | 'oldAge') {
  return talentsOf(s).reduce((x, t) => x * (t[key] ?? 1), 1);
}

export function fmtMoney(n: number) {
  return Math.round(n).toLocaleString('ko-KR');
}
/** 자리표시 채우기 */
export function fill(text: string, vars: Record<string, string>) {
  return josa(text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)));
}
