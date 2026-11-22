import { chance, rngOf } from '../shared/core/rng';
import { logLine } from './log';
import type { Cond, Life5, ShipHull, ShipRepair } from './types';

export const SHIP_MARK: Record<ShipRepair, string> = {
  plank: '키 앞에 덧댄 색 다른 널판',
  helm: '키 손잡이에 감은 삼줄',
  seam: '다시 박은 선체 이음새',
  plating: '프랑키가 덧댄 철판',
  keel: '갈라진 용골에 두른 쇠띠',
  medicine: '선의의 손에 맞춰 낮춘 약장',
};
const nextId = (s: Life5) => (s.ships?.at(-1)?.id ?? 0) + 1;
const shipPlace = (s: Life5) => s.passage ? `${s.passage.to}행 뱃길` : s.hero.island;
export function ownedHull(s: Life5): ShipHull | undefined {
  const last = s.ships?.at(-1);
  return s.flags.includes('ship') && !last?.end ? last : undefined;
}
/** 소유 표시만 남은 옛 저장도 첫 기록 전후로 같은 번호를 쓴다. 읽기만 할 때는 지난 일을 만들어 넣지 않는다. */
export function ownedHullId(s: Life5): number | undefined {
  return s.flags.includes('ship') ? ownedHull(s)?.id ?? nextId(s) : undefined;
}
function addHull(s: Life5, acquiredAt?: number): ShipHull {
  const hull: ShipHull = { id: nextId(s), repairs: [], acquiredAt };
  (s.ships ??= []).push(hull);
  return hull;
}
function hullForRecord(s: Life5): ShipHull | undefined {
  return ownedHull(s) ?? (s.flags.includes('ship') ? addHull(s) : undefined);
}
export function loseShip(s: Life5, kind: NonNullable<ShipHull['end']>['kind'] = 'lost'): void {
  const hull = hullForRecord(s);
  if (!hull) return;
  hull.end = { kind, age: s.age, island: shipPlace(s) };
  s.flags = s.flags.filter(flag => flag !== 'ship');
}
export function takeShip(s: Life5, newHull = false): void {
  if (s.flags.includes('ship')) {
    if (!newHull) return;
    loseShip(s, 'switched');
  }
  addHull(s, s.age);
  s.flags.push('ship');
}
export function nameShip(s: Life5, name: string): void {
  const hull = hullForRecord(s);
  if (hull && !hull.name) hull.name = name;
}
export function repairShip(s: Life5, kind: ShipRepair): void {
  const hull = hullForRecord(s);
  const island = shipPlace(s);
  if (!hull || hull.repairs.some(r => r.kind === kind && r.age === s.age && r.island === island)) return;
  hull.repairs.push({ kind, age: s.age, island });
}
export function shipReady(s: Life5, stage: Extract<Cond, { c: 'shipMemory' }>['stage']): boolean {
  if (!s.flags.includes('ship')) return false;
  const hull = ownedHull(s);
  if (stage === 'unnamed') return !hull?.name;
  if (stage === 'named') return !!hull?.name;
  return !!hull?.name && !!hull.repairs.length && s.age - (hull.acquiredAt ?? hull.repairs[0].age) >= 3;
}
export function repairWords(hull?: ShipHull): string {
  const mark = hull?.repairs.at(-1);
  return mark ? `${mark.age}살, ${mark.island}. ${SHIP_MARK[mark.kind]}` : '';
}

function farewellNight(s: Life5, hull: ShipHull): void {
  const years = new Set(hull.repairs.filter(r => r.kind !== 'plating').map(r => r.age));
  if (years.size < 3 || Math.max(...years) - Math.min(...years) < 3 ||
    !hull.repairs.some(r => r.kind === 'plank' && r.age < s.age) || !chance(rngOf(s.rng), 0.12)) return;
  hull.spiritAt = s.age;
  logLine(s, '작별 전날 밤, 갑판에서 망치 소리가 세 번 났다. 등불을 들고 올라갔을 때는 아무도 없었다. 이튿날 맨발로 키 앞을 지나서야 걸음을 멈췄다. 늘 엄지발가락이 걸리던 구리못 하나가 널판과 반듯하게 높이를 맞추고 있었다.', 'heavy');
  s.timeline.push({ age: s.age, text: `${hull.name ?? '배'}에서 맞은 마지막 아침, 키 앞의 구리못이 곧게 박혀 있었다` });
}
export function partShip(s: Life5, how: 'helm' | 'playground' | 'house'): void {
  const hull = hullForRecord(s);
  if (!hull) return;
  farewellNight(s, hull);
  loseShip(s, how);
  if (how === 'helm') {
    takeShip(s);
    const next = ownedHull(s)!;
    next.name = hull.name;
    next.helmFrom = hull.id;
  } else if (how === 'playground' && s.hero.standing !== 'warlord') {
    s.flags = s.flags.filter(f => f !== 'captain');
  }
}
