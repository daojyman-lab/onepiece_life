// tests/v5/specialReach.ts — 특별한 문 하나를 노리는 자동 플레이. special-reach.test.ts와 tools/special-reach.ts가 함께 쓴다.
// 노리는 문의 가치관을 올리는 문을 고르되, 그 문이 요구하는 표시를 주는 문은 먼저, 막는 표시를 주는 문은 피한다.
// 노리는 전환점이 처지를 요구하면 그 처지로 가는 문을 먼저 고르고, 그 처지에 들어선 뒤에는 처지를 바꾸는 문을 피한다.
import { chance, pick, rngOf } from '../../src/shared/core/rng';
import { BACK_OFF, ENGAGE } from '../../src/core/fight';
import { buildVoyage } from '../../src/core/voyage';
import { apply5 } from '../../src/core/reduce';
import { newLife5 } from '../../src/core/state';
import { TURNING_BY_ID, TURNINGS } from '../../src/data/turnings';
import { HOMES } from '../../src/data/homes';
import { SEA_BY_ID } from '../../src/shared/data/seas';
import type { Fx, HomeId, Life5, Standing } from '../../src/core/types';
import { SEA_STANDINGS } from '../../src/data/landlocked';

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

type FlagSource = { scene: string; requires: string[]; forbids: string[] };
const FLAG_SOURCES = new Map<string, FlagSource[]>();
for (const scene of TURNINGS) for (const door of scene.doors) {
  const conditions = [...scene.when, ...(door.when ?? [])];
  const source: FlagSource = { scene: scene.id,
    requires: conditions.flatMap((c) => c.c === 'flag' && c.has ? [c.id] : []),
    forbids: conditions.flatMap((c) => c.c === 'flag' && !c.has ? [c.id] : []),
  };
  for (const flag of flat(door.fx).flatMap((fx) => fx.op === 'flag' ? [fx.id] : [])) {
    FLAG_SOURCES.set(flag, [...(FLAG_SOURCES.get(flag) ?? []), source]);
  }
}
/** 다른 이야기에서 얻는 표시도 실제 생산 장면과 그 선행 조건까지 거슬러 준비한다. */
function flagPlan(required: string[], avoided: string[]) {
  const need = new Set(required), avoid = new Set(avoided), visited = new Set<string>();
  for (const flag of need) {
    if (visited.has(flag)) continue;
    visited.add(flag);
    const source = FLAG_SOURCES.get(flag)?.slice().sort((a, b) => a.requires.length - b.requires.length)[0];
    source?.requires.forEach((id) => { if (id !== flag) need.add(id); });
    source?.forbids.forEach((id) => avoid.add(id));
  }
  return { need: [...need], avoid: [...avoid].filter((flag) => !need.has(flag)) };
}
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
export function tryReach(target: SpecialDoor, seed: number, home: HomeId, chasePath = true, takeLifeCourse: boolean | ((s: Readonly<Life5>) => void) = false): boolean {
  const inspect = typeof takeLifeCourse === 'function' ? takeLifeCourse : undefined;
  const t = TURNING_BY_ID[target.turning], door = t.doors[target.index];
  const v = door.special!;
  const fameGoal = Math.max(0, ...(t.automatic?.unless ?? []).flatMap((c) => c.c === 'fame' ? [c.min] : []));
  // 노리는 문의 표시 + 노리는 장면으로 곧장 이어지는 문이 요구하는 표시 (그 갈래로 들어가려면 필요하다)
  const into = TURNINGS.flatMap((x) => x.doors.filter((d) => nextsOf(d.fx).includes(target.turning)));
  const { need, avoid } = flagPlan(
    [...(door.when ?? []), ...(chasePath ? into.flatMap((d) => d.when ?? []) : [])].flatMap((c) => c.c === 'flag' && c.has ? [c.id] : []),
    (door.when ?? []).flatMap((c) => c.c === 'flag' && !c.has ? [c.id] : []),
  );
  const stand = t.when.flatMap((c) => (c.c === 'standing' ? c.is : [])) as Standing[];
  const isles = islesOf(target);
  const s: Life5 = newLife5(seed, { home });
  const r = rngOf({ seed: seed ^ 0x7a6e, cursor: 0 });
  for (let i = 0; i < 20000; i++) {
    const p = s.pending;
    if (p?.kind === 'ending') { inspect?.(s); return false; }
    if (!p) { apply5(s, { type: 'step' }); continue; }
    const prerequisites = need.filter((flag) => !s.flags.includes(flag)).flatMap((flag) => FLAG_SOURCES.get(flag) ?? [])
      .filter((source) => source.requires.every((flag) => s.flags.includes(flag)) && source.forbids.every((flag) => !s.flags.includes(flag)))
      .map((source) => source.scene);
    const goals = prerequisites.length ? prerequisites : [target.turning];
    // 필요한 표시를 얻는 승리와 명성을 준비하는 안전한 싸움은 실제로 맞선다.
    if (p.kind !== 'door') {
      const reachesGoal = (id: string | undefined) => !!id && goals.some((goal) => id === goal || leadsTo(id, goal));
      const mustWin = p.kind === 'fight' && reachesGoal(p.next?.win) && !reachesGoal(p.next?.lose) && !reachesGoal(p.next?.back);
      const earnFame = p.kind === 'fight' && s.hero.fame < fameGoal && s.hero.hp >= 55 && p.risk.death <= 0.2;
      apply5(s, { type: 'answer', index: mustWin || earnFame ? ENGAGE : v === 'peace' ? BACK_OFF : chance(r, 0.5) ? ENGAGE : BACK_OFF });
      continue;
    }
    if (p.turning === target.turning) {
      inspect?.(s);
      const introduction = takeLifeCourse !== true || !target.turning.startsWith('ep_alabasta_')
        || s.lifeStory?.events.some((event) => event.id === 'departed');
      return !!introduction && !p.doors[target.index].locked;
    }
    // Opt-in replay route: take the real age-sixteen Alabasta introduction.
    if (takeLifeCourse === true && target.turning.startsWith('ep_alabasta_') &&
        ['life_course_promise', 'life_course_training', 'life_course_departure'].includes(p.turning) && !p.doors[0]?.locked) {
      apply5(s, { type: 'answer', index: 0 }); continue;
    }
    const doors = (TURNING_BY_ID[p.turning] ?? buildVoyage(p.turning))?.doors ?? [];
    let open = p.doors.map((d, j) => (d.locked ? -1 : j)).filter((j) => j >= 0);
    const safe = open.filter((j) => !avoid.some((f) => sets(doors[j]?.fx, f)));
    if (safe.length) open = safe;
    // 노리는 장면으로 이어지는 갈래가 있으면 그 갈래만 (장편을 일찍 끝내거나 다른 결말로 빠지는 문을 피한다)
    const lead = open.filter((j) => nextsOf(doors[j]?.fx).some((n) => goals.some((goal) => n === goal || leadsTo(n, goal))));
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
    // 알려진 이름을 요구하는 장면은 그 전에 실제 명성 보상을 쌓는다.
    const fame = s.hero.fame < fameGoal ? pool.filter((j) => flat(doors[j]?.fx).some((e) => e.op === 'fame' && e.add > 0)) : [];
    // 노리는 섬이 바다 건너에 있으면 먼저 바다로 나가는 처지를 고른다
    const away = isles.length > 0 && !isles.includes(s.hero.island) && !SEA_STANDINGS.includes(s.hero.standing) && !stand.length;
    const toSea = away ? by((j) => { const m = moves(doors[j]?.fx); return !!m && SEA_STANDINGS.includes(m.to); }) : [];
    if (!sailing.length && !flagged.length && toSea.length) { apply5(s, { type: 'answer', index: pick(r, toSea) }); continue; }
    const choice = sailing.length ? pick(r, sailing) : flagged.length ? pick(r, flagged) : toStand.length ? pick(r, toStand) : fame.length ? pick(r, fame) : raise.length ? pick(r, raise) : pick(r, pool);
    apply5(s, { type: 'answer', index: choice });
  }
  inspect?.(s);
  return false;
}

/** 후속 장면은 when이 비어 있으므로, 실제로 이어지는 첫 장면의 목적지도 찾는다. */
const islesOf = (d: SpecialDoor): string[] => {
  const t = TURNING_BY_ID[d.turning];
  const direct = t.when.flatMap((c) => c.c === 'island' && !c.not ? c.is : []);
  if (direct.length || !t.id.startsWith('ep_')) return direct;
  return [...new Set(TURNINGS.filter((root) => root.weight > 0 && root.id.startsWith('ep_') && leadsTo(root.id, t.id))
    .flatMap((root) => root.when.flatMap((c) => c.c === 'island' && !c.not ? c.is : [])))];
};

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
