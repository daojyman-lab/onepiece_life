// 기록 한 줄. 몸(body.ts)처럼 순환을 피해야 하는 모듈도 쓸 수 있게 아무 규칙 모듈도 가져오지 않는다.
import { josa } from '../../core/josa';
import { V } from '../data/balance';
import type { LogType } from '../../core/types';
import type { Life5, LogWeight } from './types';

/** 기록 한 줄을 남긴다. 조사를 고르고, 최근 V.log.keep줄만 남긴다. */
export function logLine(s: Life5, text: string, weight: LogWeight = 'light', type: LogType = 'life'): void {
  s.log.push({ id: s.seq++, age: s.age, text: josa(text), weight, type });
  if (s.log.length > V.log.keep) s.log.splice(0, s.log.length - V.log.keep);
}
