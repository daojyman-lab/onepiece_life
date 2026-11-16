// 생애 단계와 잠재력 (통합 기획 4장 · 5장, docs/01_기획/06_통합기획_결정.md).
// 단계는 나이로 정하고, 전성기는 장년기까지 들어설 수 있는 특별한 때다 (core/stages.ts의 stageName).
import type { PotentialId } from '../core/types';

export const STAGES: readonly { id: string; name: string; to: number }[] = [
  { id: 'child', name: '유년기', to: 9 },
  { id: 'training', name: '수련기', to: 15 },
  { id: 'youth', name: '청년기', to: 24 },
  { id: 'adult', name: '장년기', to: 40 },
  { id: 'twilight', name: '황혼기', to: Infinity },
];
export const PRIME_NAME = '전성기';

/**
 * 타고난 잠재력. 나이에 따른 수련 배율에 곱한다 (mult: 이 나이까지 m배).
 * 특화형은 지금 걷는 길(growth.path)의 수련만 special배로 오른다.
 */
export const POTENTIALS: Record<PotentialId, { name: string; text: string; weight: number; mult: readonly { to: number; m: number }[]; special?: number }> = {
  genius:   { name: '천재형', text: '어린 나이에 높은 경지에 닿는다', weight: 15,
              mult: [ { to: 24, m: 1.3 }, { to: 35, m: 1.0 }, { to: Infinity, m: 0.8 } ] },
  balanced: { name: '균형형', text: '여러 갈래가 고르게 자란다', weight: 45,
              mult: [ { to: Infinity, m: 1.0 } ] },
  late:     { name: '대기만성형', text: '오랜 실전 끝에 늦게 크게 자란다', weight: 20,
              mult: [ { to: 24, m: 0.8 }, { to: 45, m: 1.35 }, { to: Infinity, m: 1.0 } ] },
  special:  { name: '특화형', text: '한 갈래에서 남다르다', weight: 20,
              mult: [ { to: Infinity, m: 1.0 } ], special: 1.25 },
};
export const POTENTIAL_IDS = Object.keys(POTENTIALS) as PotentialId[];
