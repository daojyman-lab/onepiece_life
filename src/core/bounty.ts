import { V } from '../data/balance';
import type { Life5 } from './types';

/** 이름의 퍼진 정도와 이미 쌓은 실력·정부가 경계하는 행적으로 현상금을 산정한다. */
export function bountyOf(s: Life5): number {
  // 이미 익힌 경지를 쓴다. 부상·팔다리 손실·주무기 교체로 수배서 금액이 급락하지 않는다.
  const tier = Math.min(V.bounty.byTier.length - 1, Math.max(0, Math.floor(Math.max(...Object.values(s.growth.tier)))));
  let perFame: number = V.bounty.byTier[tier].perFame;
  let cap: number = V.bounty.byTier[tier].cap;
  for (const political of V.bounty.political) if (s.flags.includes(political.flag)) {
    perFame = Math.max(perFame, political.perFame);
    cap = Math.max(cap, political.cap);
  }
  const amount = Math.min(Math.max(0, s.hero.fame) * perFame, cap);
  return Math.floor(amount / V.bounty.roundTo) * V.bounty.roundTo;
}

const ESCAPE_NOTICE = 'bounty:escape';
const RIOT_NOTICE = 'bounty:prisonRiot';

/** 같은 감옥 탈출로 악명을 재생산하지 않는다. 더 큰 사건은 차액만 기록한다. */
export function notePrisonEscape(s: Life5, riot: boolean): void {
  const credited = s.flags.includes(RIOT_NOTICE) ? V.bounty.riotFame
    : s.flags.includes(ESCAPE_NOTICE) || s.flags.includes('escapee') ? V.bounty.escapeFame : 0;
  const award = riot ? V.bounty.riotFame : V.bounty.escapeFame;
  if (award <= credited) return;
  s.hero.fame += award - credited;
  s.flags.push(riot ? RIOT_NOTICE : ESCAPE_NOTICE);
}

/** 옛 저장의 성공한 탈옥 기록도 이미 보도된 사건으로 이어 받는다. 명성 자체는 보존한다. */
export function restoreEscapeNotoriety(s: Life5): void {
  if (s.flags.includes('escapee') && !s.flags.includes(ESCAPE_NOTICE)) s.flags.push(ESCAPE_NOTICE);
  // 폭동에도 실패 갈래가 있으므로 선택 기록만으로 성공을 추정하지 않는다.
  if (s.timeline.some((entry) => entry.text === '죄수들을 이끌고 탈옥했다') && !s.flags.includes(RIOT_NOTICE)) s.flags.push(RIOT_NOTICE);
}
