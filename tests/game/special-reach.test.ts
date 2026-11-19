// 특별한 문은 출생부터 플레이한 삶에서 실제로 고를 수 있어야 한다.
// 문마다 그 문을 노리는 자동 플레이(specialReach.ts)로 많아야 TRIES번 살아 보고, 한 번이라도 열린 채로 뜨면 통과다.
// 섬에 매인 문은 고향·연결 항로·로그타운의 소개장을 이용해 찾아간다.
import { describe, expect, it } from 'vitest';
import { reach, tryReach, SPECIAL_DOORS, type SpecialDoor } from './specialReach';
import { newLife5 } from '../../src/core/state';

const TRIES = 600;

/** 정해진 표본 안에서 실제 소개장 경로를 플레이한다. 상태나 선택지 잠금을 바꾸지 않는다. */
function reachViaIntroduction(target: SpecialDoor): number {
  for (let seed = 1, tried = 0; seed <= TRIES * 40 && tried < TRIES; seed++) {
    if (newLife5(seed, { home: 'loguetown' }).hero.town !== '로그타운') continue;
    if (tryReach(target, seed, 'loguetown', true, true)) return seed;
    tried++;
  }
  return -1;
}

describe('특별한 문은 모두 열릴 수 있다', () => {
  for (const d of SPECIAL_DOORS) {
    const key = `${d.turning}#${d.index}`;
    // 어린 나이의 알라바스타 진입은 로그타운의 약속·수련·소개장을 실제로 거친다.
    // 난수 소비가 바뀌어도 하나의 고정 시드 대신 동일한 유한 표본에서 접근 가능성을 검증한다.
    if (['ep_alabasta_p4#3', 'ep_alabasta_p6#3', 'ep_alabasta_w4#3', 'ep_alabasta_w6#3'].includes(key)) {
      it(key, () => { expect(reachViaIntroduction(d)).toBeGreaterThanOrEqual(0); }, 120_000);
    } else {
      it(key, () => { expect(reach(d, TRIES)).toBeGreaterThanOrEqual(0); }, 120_000);
    }
  }
});
