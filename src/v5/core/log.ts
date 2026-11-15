// 기록 한 줄. 몸(body.ts)처럼 순환을 피해야 하는 모듈도 쓸 수 있게 아무 규칙 모듈도 가져오지 않는다.
import { josa } from '../../core/josa';
import { V } from '../data/balance';
import type { LogType } from '../../core/types';
import type { Life5, LogWeight } from './types';

/** 기록 한 줄을 남긴다. 조사를 고르고, 최근 V.log.keep줄만 남긴다. extra.island는 해 구분선에만 넘긴다. */
export function logLine(s: Life5, text: string, weight: LogWeight = 'light', type: LogType = 'life', extra: { island?: string } = {}): void {
  s.log.push({ id: s.seq++, age: s.age, text: josa(text), weight, type, ...(extra.island !== undefined ? { island: extra.island } : {}) });
  if (s.log.length > V.log.keep) s.log.splice(0, s.log.length - V.log.keep);
}

/** 해 구분선. 화면은 text 대신 age와 island로 「열일곱 살 · 로그타운」을 만든다 */
export function yearDivider(s: Life5): void {
  logLine(s, `── ${s.age}살 ──`, 'year', 'info', { island: s.hero.island });
}

/** 최근 V.lines.noRepeat개 안에 낸 일상 · 자잘한 일의 글인가 (자리표시를 채운 뒤의 글로 견준다) */
export function isRecent(s: Life5, text: string): boolean {
  return s.recentLines.includes(text);
}

/** 일상 · 자잘한 일의 글 한 줄(가벼운 줄, type 'day')을 남기고, 다시 뽑지 않도록 기억한다 */
export function dayLine(s: Life5, text: string): void {
  logLine(s, text, 'light', 'day');
  s.recentLines.push(text);
  if (s.recentLines.length > V.lines.noRepeat) s.recentLines.splice(0, s.recentLines.length - V.lines.noRepeat);
}
