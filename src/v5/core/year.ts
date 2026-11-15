// 한 해를 네 토막으로 나눈 진행.
import { chance, rngOf } from '../../core/rng';
import { V } from '../data/balance';
import { LINES } from '../data/lines';
import { checkAll } from './cond';
import { fillText } from './fx';
import { logLine } from './state';
import { leanPick } from './values';
import type { Life5 } from './types';

/** 정점에 올랐거나 은퇴해 조용히 사는 때 */
export function isQuiet(s: Life5): boolean {
  return s.hero.standing === 'retired' || s.flags.includes('apex');
}

/** 한 토막을 진행한다. 대기 중인 일이 있으면 아무것도 하지 않는다. */
export function stepPart(s: Life5): void {
  if (s.pending) return;
  if (!s.hero.alive) { endIfDead(s); return; }

  dailyLine(s);
  // 뒤 과제가 여기에 차례로 끼운다: 자동 성장 → 자잘한 일 → 병과 사고 → 기연 → 전환점
  nextPart(s);
  endIfDead(s);
}

/** 일상 기록 한 줄 (가치관 쪽으로 기운다) */
function dailyLine(s: Life5): void {
  const r = rngOf(s.rng);
  if (!chance(r, isQuiet(s) ? V.lines.quietDailyP : V.lines.dailyP)) return;
  const line = leanPick(s, r, LINES.filter((l) => checkAll(s, l.when)), (l) => l.lean);
  if (line) logLine(s, fillText(s, line.text), 'light', 'day');
}

/** 토막을 넘긴다. 네 토막이 차면 한 살을 먹는다. */
function nextPart(s: Life5): void {
  const part = s.part + 1;
  if (part < V.partsPerYear) { s.part = part as Life5['part']; return; }
  s.part = 0;
  s.age += 1;
  s.stopsThisYear = 0;
  s.stats.years += 1;
  logLine(s, `── ${s.age}살 ──`, 'year', 'info');
}

function endIfDead(s: Life5): void {
  if (!s.hero.alive) s.pending = { kind: 'ending', cause: s.ended?.cause ?? '' };
}
