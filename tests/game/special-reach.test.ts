// 특별한 문은 출생부터 플레이한 삶에서 실제로 고를 수 있어야 한다.
// 문마다 그 문을 노리는 자동 플레이(specialReach.ts)로 많아야 TRIES번 살아 보고, 한 번이라도 열린 채로 뜨면 통과다.
// 섬에 매인 문은 고향·연결 항로·로그타운의 소개장을 이용해 찾아간다.
import { describe, expect, it } from 'vitest';
import { reach, SPECIAL_DOORS } from './specialReach';

const TRIES = 600;

describe('특별한 문은 모두 열릴 수 있다', () => {
  for (const d of SPECIAL_DOORS) {
    const key = `${d.turning}#${d.index}`;
    it(key, () => { expect(reach(d, TRIES)).toBeGreaterThanOrEqual(0); }, 120_000);
  }
});
