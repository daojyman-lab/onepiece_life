// 기록이 떠오르는 흐름(순수 함수). 한 줄씩 띄우고, 다 떠오르면 다음 토막으로 간다. 떠 있는 일이 있으면 기다린다.
import type { Command5, Life5, LogLine } from '../core/types';
import type { Settings } from './save';

/**
 * 1배속의 시간(밀리초). stopSec는 선택 · 싸움 창 하나를 읽고 고르는 데 드는 평균 시간(초).
 * windowDelayMs는 마지막 줄이 떠오른 뒤 창이 뜨기까지 기다리는 시간(그 줄을 읽을 틈)
 */
export const CLOCK = { lineMs: 2200, heavyMs: 3000, yearMs: 900, stepMs: 500, stopSec: 12, windowDelayMs: 700 };

/** 선택 · 싸움 창이나 관리 창이 닫힌 뒤, 이야기 칸 위의 마우스를 읽는 것으로 치지 않는 시간(밀리초) */
export const READ_GRACE_MS = 600;

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

/**
 * 이야기 칸 위의 마우스 움직임이 '읽는 중'(멈춤)인가. 마우스만 멈추고(손가락 · 펜은 아니다),
 * 칸 안에서 실제로 움직였을 때만이다. 창이 닫힌 뒤 READ_GRACE_MS 동안은 무시한다:
 * 문 단추를 누른 자리가 마침 이야기 칸 위라서 창이 닫히자마자 멈추는 일이 없게.
 * msSinceWindowClosed: 창이 마지막으로 닫힌 뒤 지난 시간(닫힌 적이 없으면 Infinity)
 */
export function shouldRead(x: { pointerType: string; moved: boolean; msSinceWindowClosed: number }): boolean {
  return x.pointerType === 'mouse' && x.moved && x.msSinceWindowClosed >= READ_GRACE_MS;
}

/**
 * 떠 있는 일의 창을 띄울 때인가: 기록이 다 떠올랐고, 마지막 줄이 떠오른 뒤 windowDelayMs ÷ 배속이 지났다.
 * 정지 중(배속 0)이면 1배속만큼 기다린다. 불러온 뒤 떠오른 줄이 없으면 msSinceLastReveal은 Infinity라 곧바로 뜬다
 */
export function windowReady(life: Life5 | null, shownId: number, msSinceLastReveal: number, speed: Settings['speed']): boolean {
  return !!life && caughtUp(life, shownId) && msSinceLastReveal >= windowDelay(speed);
}

/**
 * 전투 창의 재생 배속: 전투 배속 설정과, 이야기 배속을 전투 배속(1 · 2 · 4)의 범위로 줄인 값 가운데 큰 것.
 * 이야기가 8배속이면 전투는 4배속, 정지(0)면 설정 그대로
 */
export function battleSpeedOf(setting: Settings['battleSpeed'], story: Settings['speed']): Settings['battleSpeed'] {
  const fromStory = story >= 4 ? 4 : story >= 2 ? 2 : 1;
  return Math.max(setting, fromStory) as Settings['battleSpeed'];
}

/** 마지막 줄이 떠오른 뒤 창이 뜨기까지 기다리는 시간(밀리초) */
export function windowDelay(speed: Settings['speed']): number {
  return CLOCK.windowDelayMs / (speed || 1);
}

/** 명령 뒤에 저장할 때인가: 답한 뒤, 또는 토막 뒤에 나이가 바뀌었거나 떠 있는 일이 새로 생겼을 때 */
export function shouldSave(prev: Life5, next: Life5, cmd: Command5): boolean {
  return cmd.type === 'answer' || cmd.type === 'rest' || cmd.type === 'style' || cmd.type === 'equipWeapon' || cmd.type === 'traits' || next.age !== prev.age || (!prev.pending && !!next.pending);
}
