// 세부 유파의 독립 숙련도와 상위 계통 합산값.
import { COMBAT_STYLE_BY_ID, DEFAULT_STYLE, stylesForBranch, type CombatStyle } from '../data/combat-styles';
import type { Branch, Life5 } from './types';

export function styleForBranch(s: Life5, branch: Branch): CombatStyle | null {
  if (branch !== 'fist' && branch !== 'sword' && branch !== 'gun') return null;
  const focus = s.growth.styleFocus;
  return focus && COMBAT_STYLE_BY_ID[focus]?.branch === branch ? focus : DEFAULT_STYLE[branch];
}

/** 세부 유파에 숙련을 누적한다. 성장 갈래의 단계 숙련과 별도로 보존된다. */
export function addStyleMastery(s: Life5, branch: Branch, amount: number): CombatStyle | null {
  const id = styleForBranch(s, branch);
  if (!id || amount <= 0) return id;
  s.growth.styleMastery[id] = Math.max(0, (s.growth.styleMastery[id] ?? 0) + amount);
  return id;
}

/** 해당 상위 분류의 공통 숙련도. 세부 유파 숙련도의 누적 합이다. */
export function aggregateStyleMastery(s: Life5, group: 'martial' | 'weapon'): number {
  return Object.entries(s.growth.styleMastery).reduce((sum, [id, value]) =>
    sum + (COMBAT_STYLE_BY_ID[id as CombatStyle]?.group === group ? value : 0), 0);
}

export function aggregateBranchStyleMastery(s: Life5, branch: Extract<Branch, 'fist' | 'sword' | 'gun'>): number {
  return stylesForBranch(branch).reduce((sum, id) => sum + (s.growth.styleMastery[id] ?? 0), 0);
}

export function setStyleFocus(s: Life5, style: CombatStyle): void {
  s.growth.styleFocus = style;
}
