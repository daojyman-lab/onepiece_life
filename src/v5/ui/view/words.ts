// 화면의 말씨: 나이, 해 구분선, 가치관을 말로, 수를 띠로 나눈 말.
import { josa } from '../../../core/josa';
import { isDeep, topValues } from '../../core/values';
import { VALUE_NAME } from '../../data/values';
import { ageWord } from '../../core/words';
import type { Life5, Person } from '../../core/types';
import { GRADES, GRADE_TOP } from '../../data/words';
import { RIVAL_STAT_TOTAL } from '../../core/rival';

export { ageShort, ageWord } from '../../core/words';

/** 맞수는 대련에서 쓰던 총 전투력으로 영입 후에도 같은 등급을 표시한다. */
export function crewGrade(s: Life5, p: Person): string {
  const power = p.crew?.power ?? 0;
  const total = p.id === s.rival?.personId && p.power !== undefined ? Math.max(p.power, Math.round(power * RIVAL_STAT_TOTAL)) : power;
  return bandWord(total, GRADES, GRADE_TOP);
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
