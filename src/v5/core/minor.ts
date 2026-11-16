// 자잘한 일: 플레이어에게 묻지 않는다. 인물이 가치관대로 처리하고 기록 한 줄로 끝난다.
import { fill } from '../../core/util';
import { pick, weighted, type Rng } from '../../core/rng';
import { MINORS } from '../data/minors';
import { checkAll } from './cond';
import { applyFx } from './fx';
import { dayLine, isRecent } from './log';
import { needsOk } from './needs';
import { leanPick } from './values';
import type { Life5, Minor } from './types';

/** 마지막으로 겪은 뒤 cooldownYears가 지났는가 (seen은 전환점과 함께 쓴다) */
function cooledDown(s: Life5, m: Minor): boolean {
  const last = s.seen[m.id];
  return last === undefined || s.age - last >= m.cooldownYears;
}

/**
 * 조건과 쉬는 해가 허락하는 자잘한 일 하나를 겪는다. 일이 일어났으면 true.
 * 글은 일상 기록처럼 남기고(type 'day'), 최근에 낸 글(recentLines)은 뽑지 않는다.
 * 고른 결과의 글이 모두 최근에 낸 것이면 이 토막에는 일이 일어나지 않는다
 */
export function runMinor(s: Life5, r: Rng): boolean {
  const m = weighted(r, MINORS.filter((x) => checkAll(s, x.when) && needsOk(s, x.needs) && cooledDown(s, x)), (x) => x.weight);
  if (!m) return false;
  const out = leanPick(s, r, m.outcomes.filter((o) => checkAll(s, o.when) && needsOk(s, o.needs)), (o) => o.lean);
  if (!out) return false;
  const texts = out.text.map((t) => fill(t, { name: s.hero.name, town: s.hero.town, island: s.hero.island })).filter((t) => !isRecent(s, t));
  if (texts.length === 0) return false;
  dayLine(s, pick(r, texts));
  applyFx(s, out.fx);
  s.seen[m.id] = s.age;
  return true;
}
