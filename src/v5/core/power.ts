// 갈래 id와 대략의 힘. fx · fight · year가 모두 쓰므로, 그 셋을 가져오지 않는 잎 모듈로 둔다.
import { V } from '../data/balance';
import { effectiveStats5 } from './body';
import type { BranchId } from '../../core/types';
import type { Branch, Life5 } from './types';

/** v5 갈래 → v4 갈래 id (재능의 숙련 배율과 갈래 이름이 v4 id로 적혀 있다) */
export const BRANCH_ID: Record<Branch, BranchId> = {
  fist: 'martial.fist', sword: 'martial.sword', gun: 'martial.gun',
  observation: 'haki.observation', armament: 'haki.armament', conqueror: 'haki.conqueror', fruit: 'fruit',
};

/** 대략의 힘: (상처와 몸을 반영한) 능력치 합 × (1 + 가장 높은 단계 × tierPower) */
export function power5(s: Life5): number {
  const sum = Object.values(effectiveStats5(s)).reduce((a, b) => a + b, 0);
  return sum * (1 + Math.max(...Object.values(s.growth.tier)) * V.growth.tierPower);
}
