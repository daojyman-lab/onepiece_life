import { B } from '../data/balance';
import type { LifeState, LogType, Person } from './types';

export const absMonth = (s: LifeState) => s.time.year * 12 + (s.time.month - 1);

export function log(s: LifeState, text: string, type: LogType = 'info') {
  s.log.push({ t: absMonth(s), text, type });
  if (s.log.length > B.log.max) s.log.splice(0, s.log.length - B.log.max);
}
export function timeline(s: LifeState, text: string) {
  s.timeline.push({ t: absMonth(s), age: s.hero.age, text });
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
  return s.people.find((p) => p.alive && (p.id === who || p.relation === who || p.kind === who))
    ?? s.people.find((p) => p.alive && p.relation.includes(who));
}
export function fmtMoney(n: number) {
  return Math.round(n).toLocaleString('ko-KR');
}
/** 자리표시 채우기 */
export function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
