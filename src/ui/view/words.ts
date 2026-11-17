// 화면의 말씨: 나이, 해 구분선, 가치관을 말로, 수를 띠로 나눈 말.
import { personalityOf } from '../../core/personality';
import { ageWord } from '../../core/words';
import type { Life5 } from '../../core/types';

export { ageShort, ageWord } from '../../core/words';

/** 해 구분선: '열일곱 살 · 장소: 로그타운' (섬이 없으면 나이만) */
export function yearLabel(l: { age: number; island?: string }): string {
  return l.island ? `${ageWord(l.age)} · 장소: ${l.island}` : ageWord(l.age);
}

/** 이야기의 옛 기록: 해 시작 위치와 같은 해에 이동한 위치를 구별한다. */
export function storyYearLabel(l: { age: number; island?: string; moved?: true }): string {
  if (!l.island) return ageWord(l.age);
  return `${ageWord(l.age)} · ${l.moved ? '이동한 곳' : '시작한 곳'}: ${l.island}`;
}

/** 현재 성향표의 행과 칸을 주·부성향으로 보여 준다. */
export function valueWords(s: Life5): string[] {
  const p = personalityOf(s);
  return p ? [`주성향 ${p.primary}`, `부성향 ${p.secondary}`] : [];
}

/** 수 x가 처음으로 lim 미만이 되는 띠의 말 (어느 띠에도 들지 않으면 top) */
export function bandWord(x: number, bands: readonly [number, string][], top: string): string {
  return bands.find(([lim]) => x < lim)?.[1] ?? top;
}

/** 끝난 나이와 까닭: '일흔두 살, 노환' (끝난 까닭이 없으면 나이만) */
export function endWord(age: number, cause: string): string {
  return cause ? `${ageWord(age)}, ${cause}` : ageWord(age);
}
