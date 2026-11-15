// 화면의 말씨: 나이, 해 구분선, 가치관을 말로, 수를 띠로 나눈 말.
import { josa } from '../../../core/josa';
import { isDeep, topValues } from '../../core/values';
import { VALUE_NAME } from '../../data/values';
import type { Life5 } from '../../core/types';

const ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

/** 0 → '갓난아기', 3 → '세 살', 20 → '스무 살', 21 → '스물한 살'. 100 이상은 숫자로 '100살' */
export function ageWord(n: number): string {
  if (n === 0) return '갓난아기';
  if (n < 1 || n >= 100) return `${n}살`;
  const t = Math.floor(n / 10), o = n % 10;
  const word = n === 20 ? '스무' : TENS[t] + ONES[o];
  return `${word} 살`;
}

/** 해 구분선: '열일곱 살 · 로그타운' (섬이 없으면 나이만) */
export function yearLabel(l: { age: number; island?: string }): string {
  return l.island ? `${ageWord(l.age)} · ${l.island}` : ageWord(l.age);
}

/** 가장 높은 가치관 두 가지를 말로: 깊으면 '의리가 깊다', 아니면 '의리를 안다' */
export function valueWords(s: Life5): string[] {
  return topValues(s, 2).map((id) => josa(isDeep(s, id) ? `${VALUE_NAME[id]}이(가) 깊다` : `${VALUE_NAME[id]}을(를) 안다`));
}

/** 수 x가 처음으로 lim 미만이 되는 띠의 말 (어느 띠에도 들지 않으면 top) */
export function bandWord(x: number, bands: readonly [number, string][], top: string): string {
  return bands.find(([lim]) => x < lim)?.[1] ?? top;
}

/** 끝난 나이와 까닭: '일흔두 살, 노환' (끝난 까닭이 없으면 나이만) */
export function endWord(age: number, cause: string): string {
  return cause ? `${ageWord(age)}, ${cause}` : ageWord(age);
}
