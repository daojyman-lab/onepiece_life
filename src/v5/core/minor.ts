// 자잘한 일: 플레이어에게 묻지 않는다. 인물이 가치관대로 처리하고 기록 한 줄로 끝난다.
import { fill } from '../../core/util';
import { pick, weighted, type Rng } from '../../core/rng';
import { MINORS } from '../data/minors';
import { checkAll } from './cond';
import { applyFx } from './fx';
import { logLine } from './state';
import { leanPick } from './values';
import type { Life5, Minor } from './types';

/** 마지막으로 겪은 뒤 cooldownYears가 지났는가 (seen은 전환점과 함께 쓴다) */
function cooledDown(s: Life5, m: Minor): boolean {
  const last = s.seen[m.id];
  return last === undefined || s.age - last >= m.cooldownYears;
}

/** 조건과 쉬는 해가 허락하는 자잘한 일 하나를 겪는다. 일이 일어났으면 true */
export function runMinor(s: Life5, r: Rng): boolean {
  const m = weighted(r, MINORS.filter((x) => checkAll(s, x.when) && cooledDown(s, x)), (x) => x.weight);
  if (!m) return false;
  const out = leanPick(s, r, m.outcomes, (o) => o.lean)!;
  logLine(s, fill(pick(r, out.text), { name: s.hero.name, town: s.hero.town, island: s.hero.island }), 'light', 'life');
  applyFx(s, out.fx);
  s.seen[m.id] = s.age;
  return true;
}
