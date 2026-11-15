// 기록이 떠오르는 흐름(순수 함수). 한 줄씩 띄우고, 다 떠오르면 다음 토막으로 간다. 떠 있는 일이 있으면 기다린다.
import type { Life5, LogLine } from '../core/types';
import type { Settings } from './save';

/** 1배속의 시간(밀리초). stopSec는 선택 · 싸움 창 하나를 읽고 고르는 데 드는 평균 시간(초) */
export const CLOCK = { lineMs: 2200, heavyMs: 3000, yearMs: 900, stepMs: 500, stopSec: 12 };

/** 기록의 마지막 id. 기록이 없으면 -1 */
export function lastLogId(life: Life5 | null): number {
  const log = life?.log;
  return log && log.length ? log[log.length - 1].id : -1;
}

/** 아직 못 본 첫 줄: id가 shownId보다 큰 첫 줄 */
export function nextHidden(life: Life5 | null, shownId: number): LogLine | null {
  return life?.log.find((l) => l.id > shownId) ?? null;
}

/** 기록이 다 떠올랐는가 */
export function caughtUp(life: Life5 | null, shownId: number): boolean {
  return shownId >= lastLogId(life);
}

export type Tick = { do: 'reveal'; id: number; wait: number } | { do: 'step'; wait: number } | { do: 'wait' };
export interface FlowInput {
  life: Life5 | null; shownId: number; speed: Settings['speed'];
  screen: 'start' | 'main'; modalOpen: boolean; reading: boolean; hidden: boolean;
}

const WAIT_OF: Record<LogLine['weight'], keyof typeof CLOCK> = { light: 'lineMs', heavy: 'heavyMs', year: 'yearMs' };

/** 다음에 할 일. reveal의 wait는 그 줄을 띄운 뒤 기다릴 시간이다 */
export function nextTick(x: FlowInput): Tick {
  const { life, speed } = x;
  if (x.screen !== 'main' || !life || x.modalOpen || x.reading || x.hidden || speed === 0) return { do: 'wait' };
  const line = nextHidden(life, x.shownId);
  if (line) return { do: 'reveal', id: line.id, wait: CLOCK[WAIT_OF[line.weight]] / speed };
  if (life.pending) return { do: 'wait' };
  return { do: 'step', wait: CLOCK.stepMs / speed };
}

/** 1배속으로 한 인생을 보는 데 걸리는 시간(분). lines: 기록 줄 수, stops: 멈춰 고른 횟수 */
export function estimateMinutes(lines: number, stops: number): number {
  return (lines * CLOCK.lineMs + stops * CLOCK.stopSec * 1000) / 60000;
}
