// 선택의 방향을 3×3 표에 누적한다. 기존 가치관 점수는 이야기 조건을 위해 별도로 남긴다.
import type { Life5, ValueId, Values } from './types';
import { topValues } from './values';

export const PERSONALITY_GRID: readonly (readonly ValueId[])[] = [
  ['justice', 'loyalty', 'peace'],
  ['inquiry', 'romance', 'freedom'],
  ['ambition', 'dominion', 'greed'],
];
const PRIMARY = ['마음', '진취', '야망'] as const;
export const SECONDARY_NAME: Record<ValueId, string> = {
  justice: '정의', loyalty: '의리', peace: '평온',
  inquiry: '탐구', romance: '낭만', freedom: '자유',
  ambition: '성취', greed: '탐욕', dominion: '패도',
};
const STEP = 3;

export function personalityCell(id: ValueId): { row: number; col: number } {
  for (let row = 0; row < 3; row++) {
    const col = PERSONALITY_GRID[row].indexOf(id);
    if (col >= 0) return { row, col };
  }
  throw new Error(`알 수 없는 가치관: ${id}`);
}

/** 한 문이 가리키는 가치관들을 합쳐 축마다 최대 한 표만 쌓는다. */
export function applyPersonalityChoice(s: Life5, values: Partial<Values>): void {
  const p = s.personality;
  let rowPull = 0, colPull = 0, hasChoice = false, allCurrent = true;
  for (const [id, weight] of Object.entries(values) as [ValueId, number][]) {
    if (!(weight > 0)) continue;
    hasChoice = true;
    const target = personalityCell(id);
    if (target.row !== p.row || target.col !== p.col) allCurrent = false;
    rowPull += Math.sign(target.row - p.row) * weight;
    colPull += Math.sign(target.col - p.col) * weight;
  }
  if (!hasChoice) return;
  p.choices += 1;
  const alreadySettled = p.pullRow === 0 && p.pullCol === 0;
  // 현재 축의 칸을 고르는 선택은 다른 방향으로 쌓이던 마음을 한 표 가라앉힌다.
  p.pullRow += rowPull === 0 ? -Math.sign(p.pullRow) : Math.sign(rowPull);
  p.pullCol += colPull === 0 ? -Math.sign(p.pullCol) : Math.sign(colPull);
  p.hold = allCurrent && alreadySettled ? Math.min(STEP, p.hold + 1) : 0;
  if (Math.abs(p.pullRow) >= STEP) {
    p.row += Math.sign(p.pullRow);
    p.pullRow = 0;
    p.established = true;
    p.hold = 0;
  }
  if (Math.abs(p.pullCol) >= STEP) {
    p.col += Math.sign(p.pullCol);
    p.pullCol = 0;
    p.established = true;
    p.hold = 0;
  }
  if (p.hold >= STEP) p.established = true;
}

/** 주성향은 행, 부성향은 현재 칸. 첫 이동이나 현재 칸을 세 번 고르면 확정한다. */
export function personalityOf(s: Life5): { primary: string; secondary: string; value: ValueId } | null {
  const p = s.personality;
  if (!p.established) return null;
  const value = PERSONALITY_GRID[p.row]?.[p.col];
  return value ? { primary: PRIMARY[p.row], secondary: SECONDARY_NAME[value], value } : null;
}

/** 실제 진행 중에는 확정된 칸만 쓴다. 값만 있는 옛 상태는 기존 최고 가치관을 읽는다. */
export function activeValue(s: Life5): ValueId | undefined {
  return personalityOf(s)?.value ?? (s.personality.choices === 0 ? topValues(s, 1)[0] : undefined);
}
