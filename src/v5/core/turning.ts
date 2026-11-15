// 전환점과 문: 고를 수 있는 문을 풀고, 띄우고, 고른 답을 적용한다.
import { josa } from '../../core/josa';
import { fill } from '../../core/util';
import { chance, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { TURNING_BY_ID, TURNINGS } from '../data/turnings';
import { VALUE_DEEPEN, VALUE_NAME } from '../data/values';
import { checkAll, whyNot } from './cond';
import { applyFx } from './fx';
import { logLine } from './state';
import { addValues, isDeep } from './values';
import { isQuiet } from './year';
import type { Life5, ResolvedDoor, Turning } from './types';

/**
 * 데이터에 없는 전환점(시험에서 바로 만든 것 등)을 띄웠을 때 답을 찾아갈 곳.
 * 상태에는 id만 남기 때문에, 데이터의 전환점은 TURNING_BY_ID에서 찾는다.
 */
const OPENED_ELSEWHERE = new Map<string, Turning>();
const turningOf = (id: string): Turning | undefined => TURNING_BY_ID[id] ?? OPENED_ELSEWHERE.get(id);

/** 자리표시 {name}(이름만) {town} {island}를 채우고 조사를 고른다. 성씨는 쓰지 않는다. */
function fillTurning(s: Life5, text: string): string {
  return fill(text, { name: s.hero.name, town: s.hero.town, island: s.hero.island });
}

function speakerOf(s: Life5, t: Turning): string {
  const sp = t.speaker;
  if (sp === 'hero') return s.hero.name;
  if ('canon' in sp) return sp.canon;
  return s.people.find((p) => p.alive && p.relation === sp.relation)?.name ?? sp.relation;
}

/** 지금 이 사람에게 문이 어떻게 보이는지: 잠겼는지, 왜 잠겼는지, 골라 본 적이 있는지 */
export function resolveDoors(s: Life5, t: Turning): ResolvedDoor[] {
  return t.doors.map((d, i) => {
    let locked = whyNot(s, d.when);
    if (!locked && d.special && !isDeep(s, d.special)) locked = josa(`${VALUE_NAME[d.special]}이(가) 깊은 사람만 이 문을 떠올린다`);
    return {
      label: fillTurning(s, d.label), hint: fillTurning(s, d.hint), locked,
      special: d.special !== undefined, tried: s.tried.includes(`${t.id}#${i}`), danger: d.danger ?? false,
    };
  });
}

/** 전환점을 띄운다. 열린 문이 하나도 없으면 false를 돌려주고 아무것도 하지 않는다. */
export function openTurning(s: Life5, t: Turning): boolean {
  const doors = resolveDoors(s, t);
  if (!doors.some((d) => !d.locked)) return false;
  if (TURNING_BY_ID[t.id] !== t) OPENED_ELSEWHERE.set(t.id, t);
  s.pending = {
    kind: 'door', turning: t.id, moment: t.kind === 'moment',
    title: fillTurning(s, t.title), body: fillTurning(s, t.body), speaker: speakerOf(s, t), doors,
  };
  s.seen[t.id] = s.age;
  return true;
}

/** 올해 멈출 목표 횟수 */
function stopsGoal(s: Life5): number {
  if (isQuiet(s)) return V.stopsQuiet;
  return V.stopsPerYear.find((x) => s.age <= x.to)?.n ?? 0;
}

/** 이 토막에 멈출 차례인가. 올해 목표를 한 번 넘게 넘기면 더 멈추지 않는다. */
export function wantsStop(s: Life5, r: Rng): boolean {
  const n = stopsGoal(s);
  if (s.stopsThisYear >= Math.ceil(n) + 1) return false;
  return chance(r, n / V.partsPerYear);
}

/** 한 번뿐이면 본 적이 없어야, 되풀이되면 마지막으로 본 뒤 그만큼 해가 지나야 한다 */
export function repeatAllows(s: Life5, t: Turning): boolean {
  const last = s.seen[t.id];
  if (last === undefined) return true;
  return t.repeat !== 'once' && s.age - last >= t.repeat.years;
}

/**
 * 다음에 띄울 전환점. 줄 서 있는 것이 먼저, 다음으로 조건과 반복이 허락하는 문 · 큰 계기 중에서 가중치로.
 * 줄의 맨 앞은 실제로 열 수 있을 때만 줄에서 뺀다. 지금 못 열면 줄은 그대로 두고 보통대로 고른다.
 * 데이터에 없는 id(아직 만들지 않은 전환점)는 조용히 버린다.
 */
export function pickTurning(s: Life5, r: Rng): Turning | null {
  while (s.queue.length) {
    const t = TURNING_BY_ID[s.queue[0]];
    if (!t) { s.queue.shift(); continue; }
    if (resolveDoors(s, t).some((d) => !d.locked)) { s.queue.shift(); return t; }
    break;
  }
  const pool = TURNINGS.filter((t) => (t.kind === 'door' || t.kind === 'moment')
    && checkAll(s, t.when) && repeatAllows(s, t) && resolveDoors(s, t).some((d) => !d.locked));
  return weighted(r, pool, (t) => t.weight);
}

/** 떠 있는 문 가운데 index번째를 고른다. 잠긴 문이나 없는 문이면 아무것도 하지 않는다. */
export function answerDoor(s: Life5, index: number): void {
  const p = s.pending;
  if (p?.kind !== 'door') return;
  const chosen = p.doors[index];
  const t = turningOf(p.turning);
  const door = t?.doors[index];
  if (!chosen || chosen.locked || !t || !door) return;

  const rose = addValues(s, door.values ?? {}, p.moment ? V.value.moment / V.value.door : 1);
  for (const id of rose) logLine(s, VALUE_DEEPEN[id], 'heavy', 'choice');
  if (door.mark) applyFx(s, [{ op: 'mark', id: door.mark }]);   // 강점을 얻으면 그 이름을 기록한다

  p.doors.forEach((d, i) => {
    if (i !== index && !d.locked) s.unchosen.push({ age: s.age, turning: t.id, title: p.title, door: d.label });
  });
  const key = `${t.id}#${index}`;
  if (!s.tried.includes(key)) s.tried.push(key);
  s.timeline.push({ age: s.age, text: `${p.title}: ${chosen.label}` });
  s.stats.stops += 1;
  s.stopsThisYear += 1;

  s.pending = null;                            // 효과가 새 대기(죽음 등)를 만들면 그것이 남는다
  applyFx(s, door.fx);
}
