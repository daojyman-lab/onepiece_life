// 정신적 강점: 표시를 쌓아 얻는다.
import { STRENGTHS } from '../data/strengths';
import type { Life5 } from './types';

/** 표시를 하나 쌓는다. 그 강점을 새로 얻었으면 id, 아니면 null */
export function addMark(s: Life5, id: string): string | null {
  s.marks[id] = (s.marks[id] ?? 0) + 1;
  const st = STRENGTHS.find((x) => x.id === id);
  if (!st || s.marks[id] < st.marks || s.strengths.includes(id)) return null;
  s.strengths.push(id);
  return id;
}
