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

/** 단계의 힘 배율. 단계는 0~maxTier로 자르고, 소수 단계(상대의 패기를 단계로 바꾼 것)는 사이를 잇는다 */
export function tierMult(tier: number): number {
  const c = V.growth.tierCurve;
  const t = Math.min(c.length - 1, Math.max(0, tier));
  const lo = Math.floor(t);
  return lo >= c.length - 1 ? c[c.length - 1] : c[lo] + (c[lo + 1] - c[lo]) * (t - lo);
}

/** 가장 높은 단계 */
export function topTier(s: Life5): number {
  return Math.max(...Object.values(s.growth.tier));
}

/** 대략의 힘: (상처와 몸을 반영한) 능력치 합 × 가장 높은 단계의 배율 */
export function power5(s: Life5): number {
  const sum = Object.values(effectiveStats5(s)).reduce((a, b) => a + b, 0);
  return sum * tierMult(topTier(s));
}
