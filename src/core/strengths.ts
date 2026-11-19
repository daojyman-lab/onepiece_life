// 정신적 강점: 표시를 쌓아 얻는다.
import { initializeTraits, TRAIT_LIMIT } from './traits';
import { STRENGTHS } from '../data/strengths';
import type { Life5 } from './types';

/** 표시를 하나 쌓는다. 그 강점을 새로 얻었으면 id, 아니면 null */
export function addMark(s: Life5, id: string): string | null {
  if (s.traitSource) {
    const t = initializeTraits(s);
    const key = 'strength:' + id;
    const seen = t.evidence[key] ?? (t.evidence[key] = []);
    if (seen.includes(s.traitSource)) return null;
    seen.push(s.traitSource);
  }
  s.marks[id] = (s.marks[id] ?? 0) + 1;
  const st = STRENGTHS.find((x) => x.id === id);
  if (!st || s.marks[id] < st.marks || s.strengths.includes(id)) return null;
  const traits = initializeTraits(s);
  s.strengths.push(id);
  if (traits.active.length < TRAIT_LIMIT) traits.active.push(id);
  return id;
}
