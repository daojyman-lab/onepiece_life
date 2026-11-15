// v5 도감과 명예의 전당. 인생이 끝날 때마다 쌓인다. v4의 기록과는 따로 간다 (v4 기록은 옮기지 않고 지우지도 않는다).
// 골라 본 문이 무엇을 올렸는지는 도감에서만 보인다 (선택 화면에는 "전에 골라 본 문" 표시만).
import { TURNING_BY_ID } from '../data/turnings';
import { VALUE_IDS } from '../data/values';
import { fullName } from './birth';
import { oneLineOf, personaOf } from './ending';
import type { Life5, ValueId } from './types';

export interface Meta5 {
  schema: 5;
  doors: Record<string, ValueId[]>;            // "전환점id#문번호" → 그 문이 올린 가치관
  fruits: string[];                            // 먹어 본 열매 id
  people: string[];                            // 만나 본 원작 인물 id
  hall: { name: string; persona: string; oneLine: string; age: number; cause: string }[];
  lives: number;
}

export function emptyMeta5(): Meta5 {
  return { schema: 5, doors: {}, fruits: [], people: [], hall: [], lives: 0 };
}

/** 지난 인생들에서 골라 본 문. newLife5의 known으로 넘긴다 */
export function knownDoors(meta: Meta5): string[] {
  return Object.keys(meta.doors);
}

/** 그 문이 올리는 가치관. 데이터에 없는 전환점 · 문이거나 가치관이 없는 문이면 빈 목록 */
function doorValues(key: string): ValueId[] {
  const [id, i] = key.split('#');
  const d = TURNING_BY_ID[id]?.doors[Number(i)];
  return VALUE_IDS.filter((v) => (d?.values?.[v] ?? 0) > 0);
}

/** 끝난 인생을 도감에 더한 새 도감. 넘겨받은 meta는 바꾸지 않는다 */
export function recordLife(meta: Meta5, s: Life5): Meta5 {
  const doors = { ...meta.doors };
  for (const key of s.tried) doors[key] = doorValues(key);
  const fruits = s.hero.fruit && !meta.fruits.includes(s.hero.fruit.id) ? [...meta.fruits, s.hero.fruit.id] : [...meta.fruits];
  const people = [...meta.people];
  for (const p of s.people) if (p.canon && !people.includes(p.canon)) people.push(p.canon);
  const end = s.ended ?? { age: s.age, cause: '' };
  return {
    schema: 5, doors, fruits, people,
    hall: [...meta.hall, { name: fullName(s.hero), persona: personaOf(s), oneLine: oneLineOf(s), age: end.age, cause: end.cause }],
    lives: meta.lives + 1,
  };
}
