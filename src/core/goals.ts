// v7 항해의 목표: 꿈의 서약(주목표)과 인생의 중요한 사람과 나눈 약속(부목표)이 인생을 끈다.
//  - 약속: 때가 되면 그 사람과의 장면이 와서 약속할지 묻는다(promiseOffer → data/promises.ts의 장면 → makePromise).
//  - 끌림: 목표가 바라보는 방향(GoalFocus)으로 활동이 기울고(goalActivity), 그쪽 사건이 더 자주 오며(turningGoalMult),
//          선택창은 목표에 가까워지는 문에 표시를 단다(doorGoal).
//  - 결산: 해마다 약속을 지켰는지 본다(goalYear). 지키면 강해지고, 그 사람이 떠나면 약속은 유언으로 남는다.
import { V } from '../data/balance';
import { DREAMS } from '../data/dreams';
import { DREAM_VOWS, type DreamCheck } from '../data/dream-vows';
import { PROMISE_BY_ID, PROMISES, promiseTurningId, type GoalFocus, type PromiseDef, type PromiseWho } from '../data/promises';
import { TURNING_BY_ID } from '../data/turnings';
import { BRANCH_NAME } from '../data/words';
import { SEA_BY_ID } from '../shared/data/seas';
import { chance, rngOf, shuffle } from '../shared/core/rng';
import { josa } from '../shared/core/josa';
import { bountyOf } from './bounty';
import { dreamVowView, passes } from './dream-vow';
import { addMastery } from './fx';
import { logLine } from './log';
import { livingContact, livingRelation } from './needs';
import { rating5 } from './power';
import { rivalPerson } from './rival';
import type { Activity, Branch, Door, DreamId, Fx, GoalState, Life5, Person, PromiseRecord, StatKey, Turning } from './types';

const STAT_NAME: Record<StatKey, string> = { str: '근력', spd: '속도', vit: '체력', int: '지능', wil: '의지', luk: '운' };
const MARTIAL: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun'];

/** 꿈이 바라보는 방향 */
export const DREAM_FOCUS: Record<DreamId, GoalFocus[]> = {
  pirateKing: ['sea', 'fame', 'fight'], bestSword: ['train', 'fight'], bestFist: ['train', 'fight'],
  bestWeapon: ['train', 'fight'], bestShot: ['train', 'fight'], marineTop: ['train', 'fame'],
  changeWorld: ['fame', 'fight'], worldEnd: ['sea'], truth: ['study', 'sea'], treasure: ['wealth', 'sea'], peace: ['bond'],
};
/** 방향 → 그쪽으로 기우는 활동 */
const FOCUS_ACTIVITY: Record<GoalFocus, Activity> = {
  train: 'train', fight: 'train', sea: 'roam', fame: 'roam', wealth: 'work', study: 'study', bond: 'family',
};
export const FOCUS_NAME: Record<GoalFocus, string> = {
  train: '수련', fight: '싸움', sea: '항해', fame: '이름', wealth: '재물', study: '배움', bond: '인연',
};

export function goalState(s: Life5): GoalState {
  return s.goals ?? (s.goals = { promises: [], offer: null, asked: [], nextAt: 0 });
}

/** 약속을 나눌 사람 */
function personFor(s: Life5, who: PromiseWho): Person | undefined {
  switch (who) {
    case 'sibling': return livingContact(s, { who: 'sibling' });
    case 'parent': return livingContact(s, { who: 'parent' });
    case 'spouse': return livingContact(s, { who: 'spouse' });
    case 'grandparent': return s.people.find((p) => p.alive && (p.relation === '할머니' || p.relation === '할아버지'));
    case 'master': return s.people.find((p) => p.alive && p.kind === 'master');
    case 'friend': return livingRelation(s, '어릴 적 동무') ?? livingRelation(s, '어릴 적 친구');
    case 'rival': { const p = rivalPerson(s); return p?.alive && !p.missing && p.kind !== 'crew' ? p : undefined; }
    case 'crew': return s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && !p.crew.separatedMonths)
      .sort((a, b) => b.bond - a.bond)[0];
  }
}

const activePromises = (s: Life5) => goalState(s).promises.filter((p) => p.status === 'active');
const allPass = (s: Life5, checks: DreamCheck[] | undefined) => (checks ?? []).every((c) => passes(s, null, c));

/** 약속의 장면에 쓰는 곁 난수 (인생의 주사위를 밀지 않는다) */
const goalRng = (s: Life5) => rngOf({ seed: (s.rng.seed ^ 0x9041) >>> 0, cursor: s.age * 8 + s.part * 2 });

/**
 * 지금 물어볼 약속의 장면. 섬 장편 · 항해 · 감옥 · 다른 장면 중에는 묻지 않는다.
 * 고른 장면은 offer에 사람과 함께 적어 두고 돌려준다. 여는 것은 year.ts(openTurning)가 한다
 */
export function promiseOffer(s: Life5): Turning | null {
  const G = V.goal;
  const st = goalState(s);
  if (!s.hero.alive || s.pending || s.passage || s.storyRest > 0 || s.hero.standing === 'prisoner') return null;
  if (s.queue.some((id) => id.startsWith('ep_')) || s.age < st.nextAt || activePromises(s).length >= G.maxActive) return null;
  if (st.asked.length >= G.maxAsked) return null;
  const r = goalRng(s);
  if (!chance(r, G.offerP)) return null;
  const pool = shuffle(r, PROMISES.filter((d) => !st.asked.includes(d.id) && s.age >= d.age[0] && s.age <= d.age[1]
    && !st.promises.some((p) => p.status === 'active' && PROMISE_BY_ID[p.id]?.who === d.who) && allPass(s, d.offer)));
  for (const d of pool) {
    const person = personFor(s, d.who);
    const t = TURNING_BY_ID[promiseTurningId(d.id)];
    if (!person || !t) continue;
    st.offer = { id: d.id, personId: person.id };
    st.asked.push(d.id);
    st.nextAt = s.age + G.spacing;
    return t;
  }
  return null;
}

/** 열지 못한 약속의 장면을 거둔다 */
export function dropOffer(s: Life5): void {
  goalState(s).offer = null;
}

/** 지금 떠 있는 약속의 장면에서 약속을 나눌 사람 */
export function offerPerson(s: Life5): Person | undefined {
  const o = s.goals?.offer;
  return o ? s.people.find((p) => p.id === o.personId) : undefined;
}

/** 약속의 장면의 답 (fx 'promise'): id면 약속하고, null이면 약속하지 않는다 */
export function makePromise(s: Life5, id: string | null): void {
  const st = goalState(s);
  const person = offerPerson(s);
  st.offer = null;
  if (!person) return;
  if (!id) { logLine(s, `${person.name}에게 끝내 약속하지 않았다. 지키지 못할 말은 하지 않기로 했다.`, 'light', 'choice'); return; }
  const d = PROMISE_BY_ID[id];
  if (!d || st.promises.some((p) => p.id === id)) return;
  st.promises.push({ id, personId: person.id, name: person.name, relation: person.relation, madeAt: s.age, status: 'active' });
  person.bond = Math.min(100, person.bond + V.goal.promiseBond);
  logLine(s, `${person.name}에게 약속했다. ${d.words}. 이 약속이 항해의 목표가 되었다.`, 'heavy', 'life');
  s.timeline.push({ age: s.age, text: josa(`${person.name}과(와)의 약속: ${d.words}`) });
}

/** 숙련이 오를 갈래: 지금 걷는 길, 없으면 가장 멀리 간 무술 갈래 */
function rewardBranch(s: Life5): Branch {
  if (s.growth.path) return s.growth.path;
  return MARTIAL.reduce((best, b) => (s.growth.tier[b] * V.growth.tierUp + s.growth.mastery[b] + s.growth.pref[b]
    > s.growth.tier[best] * V.growth.tierUp + s.growth.mastery[best] + s.growth.pref[best] ? b : best), MARTIAL[0]);
}

const fillName = (text: string, name: string) => text.replace(/\{promisee\}/g, name);

/** 해가 바뀔 때: 약속을 나눈 사람이 떠났는지, 약속을 지켰는지 본다 */
export function goalYear(s: Life5): void {
  if (!s.hero.alive || !s.goals) return;
  const G = V.goal;
  for (const p of activePromises(s)) {
    const d = PROMISE_BY_ID[p.id];
    if (!d) continue;
    const person = s.people.find((x) => x.id === p.personId);
    const gone = !person || (!person.alive && !person.missing);
    if (gone && !p.orphaned) {
      if (d.bound) { lose(s, p, d); continue; }
      p.orphaned = true;
      logLine(s, `${p.name}과(와) 나눈 약속은 이제 유언이 되었다. ${d.words}. 혼자서라도 지키기로 했다.`, 'heavy', 'life');
      s.timeline.push({ age: s.age, text: josa(`${p.name}의 약속을 유언으로 이어받았다`) });
    }
    if (d.bound && gone) continue;
    if (s.age - p.madeAt >= (d.years ?? 0) && allPass(s, d.goal)) { keep(s, p, d, person); continue; }
    const waited = s.age - p.madeAt;
    if (waited >= G.remindAfter && waited % G.remindEvery === 0) {
      logLine(s, `문득 ${p.name}과(와)의 약속이 떠올랐다. ${d.words}. 아직 그 약속을 지키지 못했다.`, 'light', 'life');
    }
  }
}

function keep(s: Life5, p: PromiseRecord, d: PromiseDef, person: Person | undefined): void {
  const G = V.goal;
  p.status = 'kept';
  p.doneAt = s.age;
  const statAdd = G.keptStat + (p.orphaned ? G.orphanStat : 0);
  s.hero.base[d.stat] += statAdd;
  const branch = rewardBranch(s);
  addMastery(s, branch, G.keptMastery);
  s.growth.pref[branch] += G.keptMastery * V.growth.pref.fromMastery;
  if (person?.alive) person.bond = Math.min(100, person.bond + G.keptBond);
  const text = fillName(p.orphaned ? d.keptLate : d.kept, p.name);
  logLine(s, `${text} 약속을 지켰다 · ${STAT_NAME[d.stat]} +${statAdd} · ${BRANCH_NAME[branch]} 숙련 +${G.keptMastery}.`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: josa(`${p.name}에게 한 약속을 지켰다: ${d.words}`) });
}

function lose(s: Life5, p: PromiseRecord, d: PromiseDef): void {
  p.status = 'lost';
  p.doneAt = s.age;
  logLine(s, fillName(d.lost ?? `${p.name}과(와)의 약속은 이제 지킬 수 없게 되었다.`, p.name), 'heavy', 'life');
}

/** 지금 목표들이 바라보는 방향과 그 목표의 이름 (꿈이 먼저, 다음은 약속한 차례) */
export function activeFocus(s: Life5): Map<GoalFocus, string> {
  const out = new Map<GoalFocus, string>();
  const d = s.dream;
  if (d && d.done === null) for (const f of DREAM_FOCUS[d.id]) if (!out.has(f)) out.set(f, `꿈 · ${DREAMS[d.id].name}`);
  for (const p of s.goals?.promises ?? []) {
    if (p.status !== 'active') continue;
    for (const f of PROMISE_BY_ID[p.id]?.focus ?? []) if (!out.has(f)) out.set(f, josa(`${p.name}과(와)의 약속`));
  }
  return out;
}

/** 활동의 가중치에 목표의 끌림을 더한다 (year.ts의 activityOf) */
export function goalActivity(s: Life5, w: Record<Activity, number>): void {
  if (s.age < V.goal.minAge) return;
  const d = s.dream;
  const lists: GoalFocus[][] = [];
  if (d && d.done === null) lists.push(DREAM_FOCUS[d.id]);
  for (const p of s.goals?.promises ?? []) if (p.status === 'active') lists.push(PROMISE_BY_ID[p.id]?.focus ?? []);
  for (const list of lists) {
    const acts = new Set(list.map((f) => FOCUS_ACTIVITY[f]));
    for (const a of acts) w[a] += V.goal.activity;
  }
}

/** 효과가 어느 방향의 일인가 (확률의 갈래도 본다) */
function fxFocus(fx: Fx[], out: Set<GoalFocus>): void {
  for (const e of fx) {
    switch (e.op) {
      case 'fight': case 'rivalDuel': case 'kumaFight': out.add('fight'); break;
      case 'mastery': case 'tier': case 'master': case 'learnTechnique': case 'specialTraining':
      case 'beginStyle': case 'adoptStyle': case 'refineStyle': case 'traitAwaken': out.add('train'); break;
      case 'move': case 'sail': case 'skiff': case 'entry': case 'deepWater': out.add('sea'); break;
      case 'fame': if (e.add > 0) out.add('fame'); break;
      case 'rank': if (e.add > 0) out.add('fame'); break;
      case 'money': if (e.add > 0) out.add('wealth'); break;
      case 'base': if (e.key === 'int' && e.add > 0) out.add('study'); break;
      case 'person': case 'welcomeSibling': case 'siblingReunion': out.add('bond'); break;
      case 'personChange': if ((e.bond ?? 0) > 0) out.add('bond'); break;
      case 'chance': fxFocus(e.then, out); if (e.else) fxFocus(e.else, out); break;
    }
  }
}

const DOOR_FOCUS = new WeakMap<Door, Set<GoalFocus>>();
export function doorFocus(d: Door): Set<GoalFocus> {
  let f = DOOR_FOCUS.get(d);
  if (!f) { f = new Set(); fxFocus(d.fx, f); DOOR_FOCUS.set(d, f); }
  return f;
}
const TURNING_FOCUS = new WeakMap<Turning, Set<GoalFocus>>();
function turningFocus(t: Turning): Set<GoalFocus> {
  let f = TURNING_FOCUS.get(t);
  if (!f) { f = new Set(); for (const d of t.doors) for (const x of doorFocus(d)) f.add(x); TURNING_FOCUS.set(t, f); }
  return f;
}

/** 사건의 가중치 배율: 목표와 같은 방향의 일이 들어 있으면 더 자주 온다 (turning.ts의 pickTurning) */
export function turningGoalMult(s: Life5, t: Turning, focus = activeFocus(s)): number {
  if (!focus.size || s.age < V.goal.minAge) return 1;
  for (const f of turningFocus(t)) if (focus.has(f)) return V.goal.turning;
  return 1;
}

/** 이 문이 목표에 가까워지는 문이면 그 목표의 이름. 모든 문이 같은 쪽이면 표시하지 않는다 */
export function doorGoals(s: Life5, t: Turning): (string | undefined)[] {
  const focus = activeFocus(s);
  if (!focus.size || t.id.startsWith('promise_')) return t.doors.map(() => undefined);
  const hit = t.doors.map((d) => [...doorFocus(d)].find((f) => focus.has(f)));
  if (hit.every((h) => h !== undefined)) return t.doors.map(() => undefined);
  return hit.map((f) => (f ? `${focus.get(f)} · ${FOCUS_NAME[f]}` : undefined));
}

// ── 화면 ──

/** 목표의 진행(0~1): 조건마다 지금 값 / 목표 값 가운데 가장 낮은 것 */
function checkFrac(s: Life5, c: DreamCheck): number {
  const h = s.hero;
  const r = (cur: number, min: number) => (min <= 0 ? 1 : Math.max(0, Math.min(1, cur / min)));
  switch (c.k) {
    case 'fame': return r(h.fame, c.min);
    case 'money': return r(h.money, c.min);
    case 'bounty': return r(bountyOf(s), c.min);
    case 'rank': return r(h.rank, c.min);
    case 'tier': return r(Math.max(...c.branch.map((b) => s.growth.tier[b] + s.growth.mastery[b] / V.growth.tierUp)), c.min);
    case 'sea': return r(SEA_BY_ID[h.sea]?.stage ?? 1, c.min);
    case 'rating': return r(rating5(s), c.min);
    case 'crew': return r(s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && !p.crew.separatedMonths).length, c.min);
    case 'int': return r(h.base.int, c.min);
    case 'age': return r(s.age, c.min);
    case 'any': return Math.max(...c.of.map((x) => checkFrac(s, x)));
    default: return passes(s, null, c) ? 1 : 0;
  }
}

export interface PromiseView {
  id: string; name: string; relation: string; words: string; goal: string;
  status: PromiseRecord['status']; orphaned: boolean; madeAt: number; doneAt?: number; frac: number;
}
export interface GoalsView {
  dream: { name: string; to: string | null; cleared: number; total: number; next: string | null; streak: number; done: boolean } | null;
  promises: PromiseView[];
  focus: string[];                             // 지금 목표가 끄는 방향의 이름
}

export function goalsView(s: Life5): GoalsView {
  const v = dreamVowView(s);
  const promises = (s.goals?.promises ?? []).map((p): PromiseView => {
    const d = PROMISE_BY_ID[p.id];
    const years = d?.years ? Math.min(1, (s.age - p.madeAt) / d.years) : 1;
    const frac = p.status === 'kept' ? 1 : d ? Math.min(years, ...d.goal.map((c) => checkFrac(s, c))) : 0;
    return { id: p.id, name: p.name, relation: p.relation, words: d?.words ?? '', goal: d?.goalText ?? '',
      status: p.status, orphaned: !!p.orphaned, madeAt: p.madeAt, doneAt: p.doneAt, frac };
  });
  promises.sort((a, b) => Number(a.status !== 'active') - Number(b.status !== 'active'));
  return {
    dream: v && s.dream ? { name: DREAMS[s.dream.id].name, to: v.to, cleared: v.cleared, total: v.total, next: v.next, streak: v.streak,
      done: s.dream.done !== null || v.cleared >= DREAM_VOWS[s.dream.id].stages.length } : null,
    promises,
    focus: [...new Set([...activeFocus(s).keys()].map((f) => FOCUS_NAME[f]))],
  };
}

/** 엔딩: 지킨 약속 · 지키지 못한 약속 */
export function promiseLines(s: Life5): string[] {
  return (s.goals?.promises ?? []).map((p) => josa((() => {
    const d = PROMISE_BY_ID[p.id];
    const words = d?.words ?? '';
    if (p.status === 'kept') return `✔ ${p.name}과(와)의 약속 — ${words} (${p.doneAt}살에 지킴${p.orphaned ? ' · 유언' : ''})`;
    if (p.status === 'lost') return `✕ ${p.name}과(와)의 약속 — ${words} (지킬 수 없게 됨)`;
    return `… ${p.name}과(와)의 약속 — ${words} (끝내 닿지 못함)`;
  })()));
}
