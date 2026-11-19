import { ownedHullId } from './ship-memory';
import type { Cond, Fx, Life5, Person } from './types';

type Stage = Extract<Cond, { c: 'watchMeal' }>['stage'];
type Action = Extract<Fx, { op: 'watchMeal' }>['action'];

function onDuty(p: Person): boolean {
  return p.alive && !p.missing && p.kind === 'crew' && !!p.crew &&
    !p.crew.separatedMonths && !p.crew.injuredMonths;
}

function firstWatch(s: Life5) {
  const meal = s.watchMeal;
  if (meal && meal.hullId === ownedHullId(s)) {
    return s.people.find(p => p.id === meal.sailorId);
  }
  return s.people.find(p => onDuty(p) && p.tempUntil === undefined);
}

function laterWatch(s: Life5) {
  const oldCrew = s.watchMeal?.originalCrew;
  return oldCrew && s.people.find(p => onDuty(p) && !oldCrew.includes(p.id));
}

export function watchMealReady(s: Life5, stage: Stage): boolean {
  const hullId = ownedHullId(s);
  if (hullId === undefined) return false;
  const memory = s.watchMeal?.hullId === hullId ? s.watchMeal : undefined;
  // 첫 당직자가 떠나더라도 실제로 접시를 두던 찬장은 그 배에 남는다.
  if (stage === 'custom') return memory?.stage === 'reserved' || memory?.stage === 'passed';
  const lookout = firstWatch(s);
  if (!lookout || !onDuty(lookout)) return false;
  if (stage === 'first') return !memory;
  if (stage === 'shelf') return memory?.stage === 'shared' && s.age > memory.sharedAt;
  return memory?.stage === 'reserved' && memory.shelfSince !== undefined && s.age >= memory.shelfSince + 3 && !!laterWatch(s);
}

export function watchMealWords(s: Life5) {
  return { firstWatch: firstWatch(s)?.name ?? '', nextWatch: laterWatch(s)?.name ?? '' };
}

export function recordWatchMeal(s: Life5, action: Action): void {
  if ((action === 'share' || action === 'close') && watchMealReady(s, 'first')) {
    s.watchMeal = { hullId: ownedHullId(s)!, sailorId: firstWatch(s)!.id, sharedAt: s.age, stage: action === 'share' ? 'shared' : 'closed' };
    return;
  }
  const memory = s.watchMeal;
  if (!memory) return;
  if (action === 'close' && watchMealReady(s, 'shelf')) memory.stage = 'closed';
  if (action === 'reserve' && watchMealReady(s, 'shelf')) {
    memory.stage = 'reserved';
    memory.shelfSince = s.age;
    memory.originalCrew = s.people.filter(p => p.crew).map(p => p.id);
  }
  if (action === 'passOn' && watchMealReady(s, 'nextWatch')) memory.stage = 'passed';
}
