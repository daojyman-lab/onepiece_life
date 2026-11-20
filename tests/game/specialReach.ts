// 특별한 문 하나를 노리는 자동 플레이. special-reach.test.ts와 tools/special-reach.ts가 함께 쓴다.
// 노리는 문의 가치관을 올리는 문을 고르되, 그 문이 요구하는 표시를 주는 문은 먼저, 막는 표시를 주는 문은 피한다.
// 노리는 전환점이 처지를 요구하면 그 처지로 가는 문을 먼저 고르고, 그 처지에 들어선 뒤에는 처지를 바꾸는 문을 피한다.
import { chance, pick, rngOf } from '../../src/shared/core/rng';
import { BACK_OFF, ENGAGE } from '../../src/core/fight';
import { buildEntryGate, buildVoyage, VOYAGE_PREFIX } from '../../src/core/voyage';
import { apply5 } from '../../src/core/reduce';
import { newLife5 } from '../../src/core/state';
import { TURNING_BY_ID, TURNINGS } from '../../src/data/turnings';
import { HOMES } from '../../src/data/homes';
import { SEA_BY_ID } from '../../src/shared/data/seas';
import type { Fx, HomeId, Life5, Standing } from '../../src/core/types';
import { SEA_STANDINGS } from '../../src/data/landlocked';
import { hasWorldEvent, WORLD_HISTORY } from '../../src/data/world-history';
import { V } from '../../src/data/balance';
import { specialNeed } from '../../src/core/values';
import { portOf, ROUTE_TREE } from '../../src/data/navigation';
import { HOMETOWNS } from '../../src/shared/data/births';

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

/** 후속 장면은 보통 장소 조건이 없으므로 그 장면으로 이어지는 장편의 시작 항구를 찾는다. */
const ENTRIES = new Map<string, string[]>();
function entriesOf(id: string): string[] {
  const cached = ENTRIES.get(id);
  if (cached) return cached;
  const episode = id.split('_').slice(0, 2).join('_') + '_';
  const roots = id.startsWith('ep_') && !TURNING_BY_ID[id].weight
    ? TURNINGS.filter(t => t.weight > 0 && t.id.startsWith(episode) && leadsTo(t.id, id)).map(t => t.id)
    : [id];
  ENTRIES.set(id, roots);
  return roots;
}

const ISLES = new Map<string, string[]>();
function islesOf(d: SpecialDoor): string[] {
  const cached = ISLES.get(d.turning);
  if (cached) return cached;
  const places = (id: string) => TURNING_BY_ID[id].when.flatMap(c => c.c === 'island' && !c.not ? c.is : []);
  let islands = places(d.turning);
  if (!islands.length && d.turning.startsWith('ep_')) {
    islands = [...new Set(entriesOf(d.turning).flatMap(places))];
  }
  ISLES.set(d.turning, islands);
  return islands;
}

/** 항로는 일방통행일 수 있다. 목적지에서 역으로 세어 각 항구의 남은 기항 수를 구한다. */
const DISTANCES = new Map<string, Map<string, number>>();
function distancesTo(islands: string[]): Map<string, number> {
  const key = islands.join('|');
  const cached = DISTANCES.get(key);
  if (cached) return cached;
  const distance = new Map(islands.map(island => [portOf(island), 0]));
  for (const [to, hops] of distance) {
    for (const [from, exits] of Object.entries(ROUTE_TREE)) {
      if (!distance.has(from) && exits.includes(to)) distance.set(from, hops + 1);
    }
  }
  DISTANCES.set(key, distance);
  return distance;
}

// 짧은 모집 기한 안에 큰 명성이 필요한 문은 실제 명성 보상과 초대가 함께 있는 앞 장면을 노린다.
function invitationTo(id: string) {
  const fame = TURNING_BY_ID[id].when.find(c => c.c === 'fame');
  if (!fame || !TURNING_BY_ID[id].when.some(c => c.c === 'history' && !c.has)) return;
  for (const scene of TURNINGS) for (const door of scene.doors) {
    if (nextsOf(door.fx).includes(id) && door.fx.some(e => e.op === 'fame' && e.add >= fame.min)) {
      return { conditions: [...scene.when, ...(door.when ?? [])] };
    }
  }
}

/** 이 인생에서 노리는 문이 열리고, 실제로 그 선택을 기록할 수 있는지 확인한다. */
export function tryReach(target: SpecialDoor, seed: number, home: HomeId, chasePath = true, takeLifeCourse: boolean | ((s: Readonly<Life5>) => void) = false): boolean {
  const inspect = typeof takeLifeCourse === 'function' ? takeLifeCourse : undefined;
  const t = TURNING_BY_ID[target.turning], door = t.doors[target.index];
  const v = door.special!;
  const fameGoal = Math.max(0, ...[...t.when, ...(t.automatic?.unless ?? [])].flatMap((c) => c.c === 'fame' ? [c.min] : []));
  const eligibility = t.weight ? t : TURNINGS.find(scene => scene.weight > 0 && scene.id.startsWith('ep_') && leadsTo(scene.id, t.id));
  const deadline = eligibility?.when.find(c => c.c === 'history' && !c.has);
  const lastRecruitingAge = deadline?.c === 'history' && t.when.some(c => c.c === 'fame')
    ? WORLD_HISTORY[deadline.id].age - (WORLD_HISTORY[deadline.id].part === 0 ? 1 : 0) : undefined;
  const unavailableIslands = t.when.flatMap(c => c.c === 'island' && c.not ? c.is : []);
  // 노리는 문의 표시 + 노리는 장면으로 곧장 이어지는 문이 요구하는 표시 (그 갈래로 들어가려면 필요하다)
  const into = TURNINGS.flatMap((x) => x.doors.filter((d) => nextsOf(d.fx).includes(target.turning)));
  const invitation = invitationTo(t.id);
  const { need, avoid } = flagPlan(
    [...(door.when ?? []), ...(invitation?.conditions ?? []), ...(chasePath ? into.flatMap((d) => d.when ?? []) : [])].flatMap((c) => c.c === 'flag' && c.has ? [c.id] : []),
    (door.when ?? []).flatMap((c) => c.c === 'flag' && !c.has ? [c.id] : []),
  );
  const stand = t.when.flatMap((c) => (c.c === 'standing' ? c.is : [])) as Standing[];
  const isles = islesOf(target);
  const distance = distancesTo(isles);
  const tierGoal = Math.max(0, ...(door.when ?? []).flatMap(c => c.c === 'tier' && c.branch === 'any' ? [c.min] : []));
  const entries = entriesOf(t.id).map(id => ({
    id, until: Math.min(...TURNING_BY_ID[id].when.flatMap(c => c.c === 'age' && c.max !== undefined ? [c.max] : [])),
  }));
  const s: Life5 = newLife5(seed, { home });
  const r = rngOf({ seed: seed ^ 0x7a6e, cursor: 0 });
  for (let i = 0; i < 20000; i++) {
    const p = s.pending;
    if (!p && deadline?.c === 'history' && hasWorldEvent(s, deadline.id) && !s.queue.length) { inspect?.(s); return false; }
    if (p?.kind === 'ending') { inspect?.(s); return false; }
    if (entries.length && entries.every(e => s.age > e.until && !s.seenCount[e.id])) { inspect?.(s); return false; }
    if (t.repeat === 'once' && s.seenCount[t.id] && !(p?.kind === 'door' && p.turning === t.id)) { inspect?.(s); return false; }
    if (!p) { apply5(s, { type: 'step' }); continue; }
    const prerequisites = need.filter((flag) => !s.flags.includes(flag)).flatMap((flag) => FLAG_SOURCES.get(flag) ?? [])
      .filter((source) => source.requires.every((flag) => s.flags.includes(flag)) && source.forbids.every((flag) => !s.flags.includes(flag)))
      .map((source) => source.scene);
    const goals = prerequisites.length ? prerequisites : [target.turning];
    // 필요한 표시를 얻는 승리와 명성을 준비하는 안전한 싸움은 실제로 맞선다.
    if (p.kind !== 'door') {
      const reachesGoal = (id: string | undefined) => !!id && goals.some((goal) => id === goal || leadsTo(id, goal));
      const mustWin = p.kind === 'fight' && reachesGoal(p.next?.win) && !reachesGoal(p.next?.lose) && !reachesGoal(p.next?.back);
      const earnFame = p.kind === 'fight' && s.hero.fame < fameGoal && (!p.lethal || (s.hero.hp >= 55 && p.risk.death <= 0.2));
      apply5(s, { type: 'answer', index: mustWin || earnFame ? ENGAGE : v === 'peace' ? BACK_OFF : chance(r, 0.5) ? ENGAGE : BACK_OFF });
      continue;
    }
    if (p.turning === target.turning) {
      inspect?.(s);
      const introduction = takeLifeCourse !== true || !target.turning.startsWith('ep_alabasta_')
        || s.lifeStory?.events.some((event) => event.id === 'departed');
      if (!introduction || p.doors[target.index].locked) return false;
      apply5(s, { type: 'answer', index: target.index });
      return s.tried.includes(`${target.turning}#${target.index}`);
    }
    // 페니의 약속·수련·호송 소개를 직접 선택한다.
    if (takeLifeCourse === true && ['life_course_promise', 'life_course_training', 'life_course_departure'].includes(p.turning)) {
      const index = [0, 1].find(i => !p.doors[i].locked);
      if (index !== undefined) { apply5(s, { type: 'answer', index }); continue; }
    }
    const doors = (TURNING_BY_ID[p.turning] ?? buildVoyage(p.turning) ?? buildEntryGate(p.turning))?.doors ?? [];
    let open = p.doors.map((d, j) => (d.locked ? -1 : j)).filter((j) => j >= 0);
    if (takeLifeCourse === true && s.age <= 16 && s.hero.island === '로그타운') {
      const stay = open.filter(j => !flat(doors[j]?.fx).some(e =>
        (e.op === 'move' && e.island !== '로그타운') || e.op === 'sail' ||
        (e.op === 'standing' && !['civil', 'child', 'marine', 'cp', 'bountyHunter'].includes(e.to))));
      if (stay.length) open = stay;
    }
    const safe = open.filter((j) => !avoid.some((f) => sets(doors[j]?.fx, f)));
    if (safe.length) open = safe;
    // 노리는 장면으로 이어지는 갈래가 있으면 그 갈래만 (장편을 일찍 끝내거나 다른 결말로 빠지는 문을 피한다)
    const lead = open.filter((j) => nextsOf(doors[j]?.fx).some((n) => goals.some((goal) => n === goal || leadsTo(n, goal))));
    if (lead.length) open = lead;
    const inStand = stand.length > 0 && stand.includes(s.hero.standing);
    const by = (f: (j: number) => boolean) => open.filter(f);
    let sailing: number[] = [];
    if (isles.length && !isles.includes(s.hero.island)) {
      sailing = by(j => flat(doors[j]?.fx).some(e => e.op === 'move' && isles.includes(e.island)));
    }
    if (isles.length && p.turning.startsWith(VOYAGE_PREFIX)) {
      const hops = open.map(j => {
        const sail = doors[j]?.fx.find(e => e.op === 'sail');
        return distance.get(portOf(sail?.island ?? s.hero.island)) ?? Infinity;
      });
      const nearest = Math.min(...hops);
      if (Number.isFinite(nearest)) sailing = open.filter((_, i) => hops[i] === nearest);
    }
    if (!sailing.length && fameGoal > 0 && unavailableIslands.includes(s.hero.island)) {
      sailing = by(j => flat(doors[j]?.fx).some(e => (e.op === 'sail' || e.op === 'move') && !unavailableIslands.includes(e.island)));
    }
    const flagged = by((j) => need.some((f) => !s.flags.includes(f) && sets(doors[j]?.fx, f)));
    const toStand = stand.length && !inStand ? by((j) => { const m = moves(doors[j]?.fx); return !!m && stand.includes(m.to); }) : [];
    const keep = inStand ? by((j) => { const m = moves(doors[j]?.fx); return !m || stand.includes(m.to); }) : open;
    const local = fameGoal > 0 && isles.includes(s.hero.island) ? keep.filter(j => !flat(doors[j]?.fx).some(e =>
      (e.op === 'move' || e.op === 'sail') && !isles.includes(e.island))) : [];
    const pool = local.length ? local : keep.length ? keep : open;
    const raise = pool.filter((j) => (doors[j]?.values?.[v] ?? 0) > 0);
    const training = Math.max(...Object.values(s.growth.tier)) < tierGoal ? pool.filter(j =>
      flat(doors[j]?.fx).some(e => e.op === 'master' || (e.op === 'tier' && e.to > s.growth.tier[e.branch]))) : [];
    // 알려진 이름을 요구하는 장면은 그 전에 실제 명성 보상을 쌓는다.
    let fame: number[] = [];
    if (s.hero.fame < fameGoal) {
      const reward = pool.map(j => flat(doors[j]?.fx).reduce((n, e) => n + (e.op === 'fame' ? e.add : 0), 0));
      const most = Math.max(...reward);
      if (most > 0) fame = pool.filter((_, i) => reward[i] === most);
      else fame = pool.filter(j => flat(doors[j]?.fx).some(e => e.op === 'fight' && !e.lethal));
    }
    const childhood = lastRecruitingAge !== undefined && s.age < V.adultAge && s.values[v] < specialNeed(lastRecruitingAge) ? raise : [];
    // 노리는 섬이 바다 건너에 있으면 먼저 바다로 나가는 처지를 고른다
    const away = isles.length > 0 && !isles.includes(s.hero.island) && !SEA_STANDINGS.includes(s.hero.standing) && !stand.length;
    const toSea = away ? by((j) => { const m = moves(doors[j]?.fx); return !!m && SEA_STANDINGS.includes(m.to); }) : [];
    if (!sailing.length && !flagged.length && toSea.length) { apply5(s, { type: 'answer', index: pick(r, toSea) }); continue; }
    const preferred = [sailing, flagged, toStand, childhood, fame, training, raise].find(choices => choices.length) ?? pool;
    apply5(s, { type: 'answer', index: pick(r, preferred) });
  }
  inspect?.(s);
  return false;
}

/**
 * 섬 장편은 그 장소 출생을 우선하고, 태어날 수 없는 섬이면 소개장이나 연결된 가까운 고향에서 시작한다.
 * 섬에 매이지 않은 문은 사이트 비율의 고향을 돌려 쓴다. 열린 인생의 번호를 돌려준다 (없으면 -1)
 */
export function reach(target: SpecialDoor, tries: number, seed0?: number): number {
  let k = 0;
  // 시간 제한이 있는 초대는 이전에 끝까지 플레이한 출생을 먼저 재현한다.
  // [시드, 고향, 갈래 표시를 쫓는가(기본 true)] — tools/find-special-replays.ts 또는 같은 방식으로 찾는다
  const routes: Record<string, [number, HomeId, boolean?][]> = {
    'path_warlord#2': [[962, 'zou', false]],
    'ep_skypiea_c3#3': [[680, 'sky', false]],
    'ep_fishman_c_3#3': [[1728, 'fishman', false]],
  };
  for (const [seed, home, chase] of seed0 === undefined ? routes[`${target.turning}#${target.index}`] ?? [] : []) {
    if (k >= tries) return -1;
    if (tryReach(target, seed, home, chase ?? true)) return k;
    k++;
  }
  const first = seed0 ?? 50000;
  // 알라바스타로 가는 소개장은 로그타운에서 태어나 페니와 약속한 뒤 열여섯 살에 받을 수 있다.
  const takeLifeCourse = target.turning.startsWith('ep_alabasta_');
  const isles = takeLifeCourse ? ['로그타운'] : islesOf(target);
  const seas = invitationTo(target.turning)?.conditions.flatMap(c => c.c === 'sea' ? c.is : []) ?? [];
  const invitationHomes = (Object.keys(HOMES) as HomeId[]).filter(h => seas.includes(HOMES[h].sea));
  const native = HOMETOWNS.filter(town => isles.includes(town.name));
  const distances = distancesTo(isles);
  const nearest = Math.min(...Object.values(HOMES).map(home => distances.get(home.island) ?? Infinity));
  const storyDepartures = TURNINGS.filter(t => t.weight > 0 && t.doors.some(d =>
    flat(d.fx).some(e => e.op === 'move' && isles.includes(e.island)))).flatMap(t => t.when.flatMap(c => c.c === 'home' ? c.is : []));
  const homes = native.length ? [...new Set(native.map(town => town.home))] : (Object.keys(HOMES) as HomeId[]).filter(h =>
    storyDepartures.includes(h) || (Number.isFinite(nearest) ? distances.get(HOMES[h].island) === nearest : SEA_BY_ID[HOMES[h].sea].ports.some(p => isles.includes(p))));
  for (let seed = first; k < tries && seed < first + tries * 40; seed++) {
    let home = SITE_HOMES[seed % SITE_HOMES.length];
    if (invitationHomes.length) home = invitationHomes[seed % invitationHomes.length];
    if (isles.length && homes.length) {
      home = homes[seed % homes.length];
      const born = newLife5(seed, { home }).hero.island;
      if (native.length && !isles.includes(born)) continue;
    }
    // 갈래로 이어지는 표시는 서로 다른 길일 수 있어서, 인생마다 번갈아 쫓는다
    if (tryReach(target, seed, home, k % 2 === 1, takeLifeCourse)) return k;
    k++;
  }
  return -1;
}
