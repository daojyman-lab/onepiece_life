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

function vowPowerFloor(s: Life5): number {
  const successes = s.vows?.history.filter((entry) => entry.result === 'kept').length ?? 0;
  const floors = V.vow.powerFloors;
  return floors[Math.min(successes, floors.length - 1)];
}

/** 종합 전투력(화면의 등급용): 능력치에 무술(검 · 주먹 · 총) 숙련을 곱하고, 열매 숙련과 패기 숙련을 더 얹는다 (V.grade) */
export function rating5(s: Life5): number {
  const sum = Object.values(effectiveStats5(s)).reduce((a, b) => a + b, 0);
  const t = s.growth.tier;
  const martial = tierMult(Math.max(t.fist, t.sword, t.gun));
  const fruit = s.hero.fruit ? tierMult(t.fruit) - 1 : 0;
  const haki = (tierMult(t.observation) - 1) + (tierMult(t.armament) - 1) + (tierMult(t.conqueror) - 1);
  return Math.max(sum * (martial + V.grade.fruit * fruit + V.grade.haki * haki), vowPowerFloor(s));
}

/** 대략의 힘: 상처와 몸을 반영한 능력치 합에 단계 배율을 곱하고 서약 하한을 적용한다. */
export function power5(s: Life5, stats = effectiveStats5(s)): number {
  const sum = Object.values(stats).reduce((a, b) => a + b, 0);
  return Math.max(sum * tierMult(topTier(s)), vowPowerFloor(s));
}
