// tests/v5/specialReach.ts — 특별한 문 하나를 노리는 자동 플레이. special-reach.test.ts와 tools/special-reach.ts가 함께 쓴다.
// 노리는 문의 가치관을 올리는 문을 고르되, 그 문이 요구하는 표시를 주는 문은 먼저, 막는 표시를 주는 문은 피한다.
// 노리는 전환점이 처지를 요구하면 그 처지로 가는 문을 먼저 고르고, 그 처지에 들어선 뒤에는 처지를 바꾸는 문을 피한다.
import { chance, pick, rngOf } from '../../src/core/rng';
import { BACK_OFF, ENGAGE } from '../../src/v5/core/fight';
import { buildVoyage } from '../../src/v5/core/voyage';
import { apply5 } from '../../src/v5/core/reduce';
import { newLife5 } from '../../src/v5/core/state';
import { TURNING_BY_ID, TURNINGS } from '../../src/v5/data/turnings';
import { HOMES } from '../../src/v5/data/homes';
import { SEA_BY_ID } from '../../src/data/seas';
import type { Fx, HomeId, Life5, Standing } from '../../src/v5/core/types';
import { SEA_STANDINGS } from '../../src/v5/data/landlocked';

/** 사이트(.env.production)의 고향 가중치 25:15:15:15:15:15 */
export const SITE_HOMES: HomeId[] = [...Array(5).fill('loguetown'),
  ...(['water7', 'wano', 'fishman', 'sky', 'zou'] as HomeId[]).flatMap((h) => Array(3).fill(h))];

export interface SpecialDoor { turning: string; index: number }
export const SPECIAL_DOORS: SpecialDoor[] = TURNINGS.flatMap((t) => t.doors.flatMap((d, index) => (d.special ? [{ turning: t.id, index }] : [])));

const flat = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => (e.op === 'chance' ? [e, ...flat(e.then), ...flat(e.else)] : [e]));
const sets = (fx: Fx[] | undefined, id: string) => flat(fx).some((e) => e.op === 'flag' && e.id === id);
const moves = (fx: Fx[] | undefined) => flat(fx).find((e) => e.op === 'standing') as Extract<Fx, { op: 'standing' }> | undefined;

const nextsOf = (fx: Fx[] | undefined): string[] => flat(fx).flatMap((e) =>
  e.op === 'queue' ? [e.turning] : e.op === 'fight' && e.next ? [e.next.win, e.next.lose, e.next.back].filter((x): x is string => !!x) : []);
/** 이 전환점에서 노리는 전환점까지 문을 따라 닿을 수 있는가 (장편 안의 갈래) */
const LEADS = new Map<string, boolean>();
function leadsTo(from: string, target: string): boolean {
  const key = `${from}>${target}`;
  if (LEADS.has(key)) return LEADS.get(key)!;
  const seen = new Set<string>([from]); const stack = [from]; let ok = false;
  while (stack.length && !ok) {
    const id = stack.pop()!;
    for (const d of TURNING_BY_ID[id]?.doors ?? []) for (const n of nextsOf(d.fx)) {
      if (n === target) ok = true;
      if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  LEADS.set(key, ok); return ok;
}

/** 이 인생에서 노리는 문이 열린 채로 떴는가. 뜨면 그 문을 고르고 멈춘다 */
export function tryReach(target: SpecialDoor, seed: number, home: HomeId, chasePath = true): boolean {
  const t = TURNING_BY_ID[target.turning], door = t.doors[target.index];
  const v = door.special!;
  // 노리는 문의 표시 + 노리는 장면으로 곧장 이어지는 문이 요구하는 표시 (그 갈래로 들어가려면 필요하다)
  const into = TURNINGS.flatMap((x) => x.doors.filter((d) => nextsOf(d.fx).includes(target.turning)));
  const need = [...new Set([...(door.when ?? []), ...(chasePath ? into.flatMap((d) => d.when ?? []) : [])].flatMap((c) => (c.c === 'flag' && c.has ? [c.id] : [])))];
  const avoid = (door.when ?? []).flatMap((c) => (c.c === 'flag' && !c.has ? [c.id] : []));
  const stand = t.when.flatMap((c) => (c.c === 'standing' ? c.is : [])) as Standing[];
  const isles = t.when.flatMap((c) => (c.c === 'island' && !c.not ? c.is : []));
  const s: Life5 = newLife5(seed, { home });
  const r = rngOf({ seed: seed ^ 0x7a6e, cursor: 0 });
  for (let i = 0; i < 20000; i++) {
    const p = s.pending;
    if (p?.kind === 'ending') return false;
    if (!p) { apply5(s, { type: 'step' }); continue; }
    // 싸움은 반반 (늘 맞서면 일찍 죽어 장편까지 가지 못한다)
    if (p.kind !== 'door') { apply5(s, { type: 'answer', index: chance(r, 0.5) ? ENGAGE : BACK_OFF }); continue; }
    if (p.turning === target.turning) return !p.doors[target.index].locked;
    const doors = (TURNING_BY_ID[p.turning] ?? buildVoyage(p.turning))?.doors ?? [];
    let open = p.doors.map((d, j) => (d.locked ? -1 : j)).filter((j) => j >= 0);
    const safe = open.filter((j) => !avoid.some((f) => sets(doors[j]?.fx, f)));
    if (safe.length) open = safe;
    // 노리는 장면으로 이어지는 갈래가 있으면 그 갈래만 (장편을 일찍 끝내거나 다른 결말로 빠지는 문을 피한다)
    const lead = open.filter((j) => nextsOf(doors[j]?.fx).some((n) => n === target.turning || leadsTo(n, target.turning)));
    if (lead.length) open = lead;
    const inStand = stand.length > 0 && stand.includes(s.hero.standing);
    const by = (f: (j: number) => boolean) => open.filter(f);
    // 항로: 노리는 섬으로 가는 뱃길을 먼저
    const sailing = by((j) => flat(doors[j]?.fx).some((e) => e.op === 'sail' && isles.includes(e.island)));
    const flagged = by((j) => need.some((f) => !s.flags.includes(f) && sets(doors[j]?.fx, f)));
    const toStand = stand.length && !inStand ? by((j) => { const m = moves(doors[j]?.fx); return !!m && stand.includes(m.to); }) : [];
    const keep = inStand ? by((j) => { const m = moves(doors[j]?.fx); return !m || stand.includes(m.to); }) : open;
    const pool = keep.length ? keep : open;
    const raise = pool.filter((j) => (doors[j]?.values?.[v] ?? 0) > 0);
    // 노리는 섬이 바다 건너에 있으면 먼저 바다로 나가는 처지를 고른다
    const away = isles.length > 0 && !isles.includes(s.hero.island) && !SEA_STANDINGS.includes(s.hero.standing) && !stand.length;
    const toSea = away ? by((j) => { const m = moves(doors[j]?.fx); return !!m && SEA_STANDINGS.includes(m.to); }) : [];
    if (!sailing.length && !flagged.length && toSea.length) { apply5(s, { type: 'answer', index: pick(r, toSea) }); continue; }
    const choice = sailing.length ? pick(r, sailing) : flagged.length ? pick(r, flagged) : toStand.length ? pick(r, toStand) : raise.length ? pick(r, raise) : pick(r, pool);
    apply5(s, { type: 'answer', index: choice });
  }
  return false;
}

/** 노리는 문의 섬 (전환점의 섬 조건). 없으면 빈 배열 */
const islesOf = (d: SpecialDoor) => TURNING_BY_ID[d.turning].when.flatMap((c) => (c.c === 'island' && !c.not ? c.is : []));

/**
 * 그 문이 섬에 매인 문이면 그 섬에서 태어난 인생(태어난 마을이 그 섬), 없으면 그 섬이 있는 바다의 고향에서 태어난 인생만 쓴다.
 * 섬에 매이지 않은 문은 사이트 비율의 고향을 돌려 쓴다. 열린 인생의 번호를 돌려준다 (없으면 -1)
 */
export function reach(target: SpecialDoor, tries: number, seed0 = 50000): number {
  const isles = islesOf(target);
  const homes = (Object.keys(HOMES) as HomeId[]).filter((h) => SEA_BY_ID[HOMES[h].sea].ports.some((p) => isles.includes(p)) || isles.includes(HOMES[h].island));
  let k = 0;
  for (let seed = seed0; k < tries && seed < seed0 + tries * 40; seed++) {
    let home = SITE_HOMES[seed % SITE_HOMES.length];
    if (isles.length && homes.length) {
      home = homes[seed % homes.length];
      const born = newLife5(seed, { home }).hero.island;
      if (bornThereOnly(home, isles) && !isles.includes(born)) continue;
    }
    // 갈래로 이어지는 표시는 서로 다른 길일 수 있어서, 인생마다 번갈아 쫓는다
    if (tryReach(target, seed, home, k % 2 === 1)) return k;
    k++;
  }
  return -1;
}

/** 그 고향의 마을 가운데 노리는 섬이 있으면, 그 마을에서 태어난 인생만 쓴다 (로그타운 장편: 이스트 블루 여덟 마을 가운데 로그타운) */
const TOWN_CACHE = new Map<HomeId, Set<string>>();
function bornThereOnly(home: HomeId, isles: string[]): boolean {
  if (!TOWN_CACHE.has(home)) {
    const towns = new Set<string>();
    for (let i = 0; i < 200; i++) towns.add(newLife5(90000 + i, { home }).hero.island);
    TOWN_CACHE.set(home, towns);
  }
  return isles.some((x) => TOWN_CACHE.get(home)!.has(x));
}
