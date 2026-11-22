// 항로 고르기 (통합 기획 7.4 · 7.5)
// 해적 · 혁명군 · 현상금 사냥꾼 · 칠무해는 섬을 옮길 때가 되면(year.ts voyage) 다음 멈춤에 세 갈래 항로 중 하나를 고른다.
// 고르는 장면은 그때그때 만들어지는 전환점이다: id에 후보 섬이 담겨 있어 저장 · 불러오기 뒤에도 다시 지을 수 있다.
import { josa } from '../shared/core/josa';
import { loseShip } from './ship-memory';
import { chance, pick, rngOf, weighted, type Rng } from '../shared/core/rng';
import { SEA_BY_ID } from '../shared/data/seas';
import { V } from '../data/balance';
import { DREAMS } from '../data/dreams';
import { climateOf } from '../data/climates';
import { LOG_ISLAND_TURNINGS, MORO, MORO_LANDING, moroReturnLine } from '../data/turnings/log-island';
import { COATING_CONTACT, DREAM_ISLANDS, ENTRY_COST, ENTRY_GATES, ROUTE, ZOU_CARD, dangerOf, entryPass, gateOf, type EntryGate } from '../data/voyage';
import { islandImmunity, isNative } from './environment';
import { locationDivider, logLine } from './log';
import { openTurning, repeatAllows } from './turning';
import { checkAll } from './cond';
import { TURNING_BY_ID } from '../data/turnings';
import { DEFERRED_ROUTE, ROUTE_ARRIVALS } from '../data/turnings/route-stories';
import { connectedPorts, contentClass, destinationAt, offshoreDays, portOf } from '../data/navigation';
import type { Cond, DreamId, Door, Fx, Life5, SeaId, Turning } from './types';
import { depart } from './passage';
import { SEA_STANDINGS } from '../data/landlocked';
import { hasLocalStyleLesson } from './styles';

import { AMAZON_ROADS, trainingLanding } from '../data/training-routes';

export type Route = 'calm' | 'dream' | 'wild';
export type ArrivalRoute = Route | 'story' | 'home' | 'drift' | 'orders';
export const VOYAGE_PREFIX = 'voyage:';
export const ENTRY_PREFIX = 'entry:';
const ARRIVAL_ROUTES: readonly string[] = ['calm', 'dream', 'wild', 'story', 'home', 'drift', 'orders'];

export function regularDestinations(s: Life5, military = false, age = s.age): string[] {
  return connectedPorts(s.hero.island, s.hero.sea, s.flags, age)
    .filter(port => !military || gateOf(port) !== 'wano');
}

export function openRouteArrival(s: Life5): boolean {
  if (s.pending || s.passage || s.hero.standing === 'prisoner' || s.age < V.voyage.minAge) return false;
  if (s.hero.island === '스릴러 바크' && s.age > 18) {
    s.hero.island = '플로리안 트라이앵글';
    logLine(s, '마지막 목격 지점으로 돌아갔을 때 거대한 선체는 안개 밖으로 사라져 있었다.', 'light');
  }
  const port = portOf(s.hero.island);
  if (s.hero.island === s.hero.town && !s.flags.includes(`at:${port}`)) return false;
  const scene = port === '리틀 가든' && s.age <= 18 && !s.seenCount.garden_giants && !s.seenCount.garden_1
    ? 'garden_giants' : trainingLanding(port, s.flags) ?? ROUTE_ARRIVALS[port];
  if (!scene) return false;
  if ((scene === 'route_coating' && (hasEntryContact(s, 'fishman') || islandImmunity(s, '어인섬'))) ||
      (scene === 'route_zou' && (hasEntryContact(s, 'zou') || islandImmunity(s, '조우'))) ||
      (scene === 'route_sky' && islandImmunity(s, '스카이피아'))) return false;
  const t = TURNING_BY_ID[scene];
  return !!t && checkAll(s, t.when) && repeatAllows(s, t) && openTurning(s, t);
}

type Choices = { calm?: string; dream?: string; wild?: string; coastal?: string };

/** 지금 바다에서 갈 수 있는 섬 가운데 세 갈래의 후보. 갈 수 있는 섬이 없으면 null */
export function voyageChoices(s: Life5, r: Rng, departureAge = s.age): Choices | null {
  if (s.passage) return null;
  const ports = regularDestinations(s, false, departureAge);
  if (!ports.length) return null;
  const fresh = (p: string) => (s.flags.includes(`at:${p}`) ? 1 : V.voyage.fresh);
  const top = Math.max(...ports.map(dangerOf));
  const wild = top >= 3 ? weighted(r, ports.filter((p) => dangerOf(p) === top), fresh) ?? undefined : undefined;
  let rest = ports.filter((p) => p !== wild);
  const low = Math.min(...rest.map(dangerOf));
  const calm = weighted(r, rest.filter((p) => dangerOf(p) === low), fresh) ?? undefined;
  rest = rest.filter((p) => p !== calm);
  const tagged = s.dream ? rest.filter((p) => DREAM_ISLANDS[s.dream!.id].includes(p)) : [];
  const dream = rest.length ? pick(r, tagged.length ? tagged : rest) : undefined;
  const coastal = wild ? undefined : rest.find(port => port !== dream);
  return { calm, dream, wild, coastal };
}

/** 후보를 담은 전환점 id: voyage:<나이>:<꿈 id 또는 ->:<잔잔>|<꿈>|<험함> (빈칸이면 그 갈래 없음). 나이가 들어 있어 해마다 다른 장면이다 */
export function voyageId(s: Life5, c: Choices, boat?: SkiffFare): string {
  const d = s.dream && c.dream && DREAM_ISLANDS[s.dream.id].includes(c.dream) ? s.dream.id : '-';
  const tail = boat ? `:${SKIFF}.${boat.buy}.${boat.gate ?? ''}` : '';
  return `${VOYAGE_PREFIX}${s.age}:${d}:${c.calm ?? ''}|${c.dream ?? ''}|${c.wild ?? ''}|${c.coastal ?? ''}:${portOf(s.hero.island)}${tail}`;
}

const sail = (island: string, route: Route): Fx => ({ op: 'sail', island, route });

/** id로 항로 고르기 전환점을 짓는다. 문은 잔잔 · 꿈(또는 소문) · 험함 순서 */
export function buildVoyage(id: string): Turning | undefined {
  if (!id.startsWith(VOYAGE_PREFIX)) return undefined;
  const [, dreamId, rest = '', from = '', boatTag = ''] = id.slice(VOYAGE_PREFIX.length).split(':');
  const boat = parseFare(boatTag);
  const [calm, dream, wild, coastal] = rest.split('|');
  const doors: Door[] = [];
  if (calm) doors.push({ label: josa(`잔잔한 뱃길로 ${calm}에 간다`), hint: '쉬어 가며 숨을 고른다', fx: [sail(calm, 'calm')] });
  if (dream) {
    const d = dreamId !== '-' ? DREAMS[dreamId as DreamId] : null;
    doors.push(d
      ? { label: josa(`${dream}(으)로 뱃머리를 돌린다`), hint: josa(`${d.name}에 한 걸음 가까워질 것 같은 소문이 있다`), values: { romance: V.value.door }, fx: [sail(dream, 'dream')] }
      : { label: josa(`소문을 따라 ${dream}(으)로 간다`), hint: '술집에서 들은 이야기가 자꾸 마음에 걸린다', values: { romance: V.value.door / 2 }, fx: [sail(dream, 'dream')] });
  }
  if (wild) doors.push({ label: josa(`험한 바다를 건너 ${wild}(으)로 간다`), hint: '위험하지만 이름을 떨칠 기회가 있다', danger: true, fx: [sail(wild, 'wild')] });
  if (coastal) doors.push({ label: josa(`뱃길을 따라 ${coastal}(으)로 간다`), hint: '갑판에서 숨을 고른다', fx: [sail(coastal, 'calm')] });
  const contentLabel = { major: '주요 이야기', regular: '지역 이야기', encounter: '인연·탐험', exploration: '탐험 거점' };
  for (const door of doors) {
    const destination = door.fx.find((fx) => fx.op === 'sail');
    if (destination?.op !== 'sail') continue;
    if (gateOf(destination.island)) door.hint += ' · 별도의 진입 관문이 있다';
    door.hint += ` · ${contentLabel[contentClass(destination.island)]}`;
    if (destination.island === MORO) door.hint += ' · 해 질 무렵이면 동전도 옆으로 떨어진다는 섬이다';
    const days = offshoreDays(from, destination.island);
    if (days) door.hint += ` · 예상 ${days}일, 도중 보급 가능`;
  }
  if (boat) {
    const total = fareTotal(boat);
    const words = [boat.buy ? `나룻배 ${won(boat.buy)}` : '', boat.gate ? SKIFF_EXIT[boat.gate].hint : ''].filter(Boolean).join(' · ');
    for (const door of doors) {
      door.fx = [{ op: 'skiff', buy: boat.buy, ...(boat.gate ? { gate: boat.gate } : {}) }, ...door.fx];
      if (total) door.when = [...(door.when ?? []), { c: 'money', min: total }];
      if (words) door.hint += ` · ${words}`;
    }
  }
  doors.push(boat
    ? { label: '아직은 이곳에 머문다', hint: '떠날 날은 다시 정한다', fx: [{ op: 'log', text: '포구에서 발길을 돌렸다. 떠날 날은 아직 아니었다.', weight: 'light' }] }
    : { label: '이곳에 더 머문다', hint: '준비와 탐색을 이어 간다', fx: [{ op: 'log', text: '해도를 접고 계류 밧줄을 다시 묶었다.', weight: 'light' }] });
  return {
    id, kind: 'door', when: [], weight: 0, repeat: { years: 0 }, speaker: 'hero',
    title: boat ? '떠날 채비' : '다음 항로',
    body: !boat ? '{island}에서의 날들이 끝나 간다. 해도를 펼치자 갈 만한 섬이 몇 보인다. 어디로 뱃머리를 돌릴까.'
      : boat.buy ? `{island}에서의 볼일은 끝났다. 포구의 늙은 어부가 노 두 자루와 작은 돛이 딸린 낡은 나룻배를 ${won(boat.buy)}에 내놓았다. 다음 섬까지는 노를 저어 갈 수 있다. 어디로 갈까.`
      : '{island}에서의 볼일은 끝났다. 포구에 매어 둔 나룻배가 물결에 흔들린다. 어디로 노를 저어 갈까.',
    doors,
  };
}

/** 고른 섬으로 출항한다. 섬은 바다를 건너 닿을 때 바뀐다 (core/passage.ts) */
export function sailTo(s: Life5, island: string, route: Route): void {
  depart(s, island, route, false, rowsSkiff(s) && s.flags.includes(SKIFF));
}

// ---------------------------------------------------------------- 섬을 떠나기 (나룻배)
// 볼일을 마쳤으면 누구든 스스로 섬을 떠날 수 있다(명령 'leave'). 바다를 다니는 처지(해적 · 혁명군 …)이거나 배가 있으면 그 배로,
// 그렇지 않으면 어느 포구에서나 나룻배 한 척(V.skiff.price)을 사서 노를 저어 간다. 고르는 장면은 항로 고르기와 같다.

/** 나룻배를 가진 표시. 한 번 사면 계속 쓴다 */
export const SKIFF = 'skiff';

/** 바다를 다니는 처지도 아니고 배도 없다: 떠나려면 나룻배를 탄다 */
export function rowsSkiff(s: Life5): boolean {
  return !SEA_STANDINGS.includes(s.hero.standing) && !s.flags.includes('ship');
}

type SkiffGate = 'sky' | 'fishman' | 'wano';
/** 나룻배만으로는 빠져나올 수 없는 외딴 섬과, 원작대로 그 섬을 나오는 길의 값 (조우는 코끼리 다리를 따라 내려오면 된다) */
export const SKIFF_EXIT: Record<SkiffGate, { cost: number; hint: string; line: string }> = {
  sky: { cost: ENTRY_COST.highWest, hint: `구름 끝 길잡이 ${won(ENTRY_COST.highWest)}`,
    line: '하늘섬 길잡이에게 값을 치렀다. 구름 끝에서 나룻배에 커다란 문어 풍선을 매달고 청해로 천천히 내려갔다.' },
  fishman: { cost: ENTRY_COST.coating, hint: `나룻배 코팅 ${won(ENTRY_COST.coating)}`,
    line: '코팅 장인에게 나룻배 코팅을 맡겼다. 거품에 싸인 배가 만 미터 바다를 천천히 거슬러 올랐다.' },
  wano: { cost: ENTRY_COST.smuggler, hint: `밀수선 ${won(ENTRY_COST.smuggler)}`,
    line: '밤배를 띄우는 밀수꾼에게 값을 치르고, 나룻배를 밀수선 꽁무니에 매단 채 쇄국의 바다를 빠져나갔다.' },
};

/** 떠날 때 치를 값: 나룻배 값(이미 있으면 0)과 외딴 섬을 나오는 값 */
export interface SkiffFare { buy: number; gate?: SkiffGate }
function won(n: number): string { return `${n.toLocaleString('ko-KR')}베리`; }
const fareTotal = (f: SkiffFare) => f.buy + (f.gate ? SKIFF_EXIT[f.gate].cost : 0);
function parseFare(tag: string): SkiffFare | undefined {
  const [kind, buy, gate] = tag.split('.');
  if (kind !== SKIFF) return undefined;
  const n = Number(buy);
  return { buy: Number.isFinite(n) && n > 0 ? n : 0, ...(gate && gate in SKIFF_EXIT ? { gate: gate as SkiffGate } : {}) };
}

/** 지금 떠나려면 치를 값. 나룻배를 타지 않는 사람은 undefined */
export function skiffFare(s: Life5): SkiffFare | undefined {
  if (!rowsSkiff(s)) return undefined;
  const g = gateOf(s.hero.island);
  const gate = g && g !== 'zou' ? g : undefined;
  return { buy: s.flags.includes(SKIFF) ? 0 : V.skiff.price, ...(gate ? { gate } : {}) };
}

/** 지금 섬을 떠날 수 없는 까닭. 떠날 수 있으면 null */
export function leaveBlock(s: Life5): string | null {
  const h = s.hero;
  if (!h.alive || s.ended) return '이번 생은 끝났다.';
  if (s.passage) return '이미 바다 위에 있다.';
  if (s.pending) return '먼저 눈앞의 일을 정해야 한다.';
  if (s.age < V.voyage.minAge) return `${V.voyage.minAge}살이 되기 전에는 혼자 섬을 떠날 수 없다.`;
  if (h.standing === 'prisoner') return '갇힌 몸이라 떠날 수 없다.';
  if (h.standing === 'marine' || h.standing === 'cp') return '전근 명령 없이는 자리를 비울 수 없다.';
  if (s.queue.length || s.lifeStory?.wait) return '이 섬에서 아직 끝나지 않은 일이 있다.';
  if (hasLocalStyleLesson(s)) return '이 섬에서 배우던 것을 마저 익혀야 한다.';
  if (!regularDestinations(s).length) return '이곳에서는 떠날 뱃길이 없다.';
  const fare = skiffFare(s);
  if (fare && h.money < fareTotal(fare)) {
    const need = [fare.buy ? `나룻배 ${won(fare.buy)}` : '', fare.gate ? SKIFF_EXIT[fare.gate].hint : ''].filter(Boolean).join(' + ');
    return `떠날 돈이 모자라다 (${need}).`;
  }
  return null;
}

/** 떠나기 단추에 보일 말 */
export function leaveView(s: Life5): { show: boolean; can: boolean; label: string; note: string } {
  const block = leaveBlock(s);
  const fare = skiffFare(s);
  const total = fare ? fareTotal(fare) : 0;
  return {
    show: s.hero.alive && !s.ended && s.age >= V.voyage.minAge,
    can: block === null,
    label: s.passage ? '⛵ 항해 중' : '⛵ 떠나기',
    note: block ?? (fare ? (total ? `나룻배로 떠난다 · ${won(total)}` : '나룻배로 떠난다') : '배를 띄워 다음 섬으로 떠난다'),
  };
}

/** 스스로 섬을 떠난다: 다음 항로 고르기를 띄운다. 띄웠으면 true */
export function openLeave(s: Life5): boolean {
  if (leaveBlock(s) !== null) return false;
  const r = rngOf(s.rng);
  const c = voyageChoices(s, r);
  if (!c) return false;
  s.sail = false;                                // 해마다 굴리는 항로 고르기를 이것으로 갈음한다
  const t = buildVoyage(voyageId(s, c, skiffFare(s)));
  return !!t && openTurning(s, t);
}

/** 나룻배를 사고, 외딴 섬이면 나오는 값을 치른다 (문의 효과 'skiff') */
export function boardSkiff(s: Life5, e: Extract<Fx, { op: 'skiff' }>): void {
  const h = s.hero;
  const total = e.buy + (e.gate ? SKIFF_EXIT[e.gate].cost : 0);
  if (h.money < total) return;
  h.money -= total;
  if (e.buy && !s.flags.includes(SKIFF)) {
    s.flags.push(SKIFF);
    logLine(s, josa(`${h.island}의 포구에서 낡은 나룻배 한 척을 ${won(e.buy)}에 샀다. 노 두 자루와 손바닥만 한 돛이 딸려 왔다.`), 'light');
    s.timeline.push({ age: s.age, text: josa(`${h.island}에서 나룻배를 샀다`) });
  }
  if (e.gate) logLine(s, SKIFF_EXIT[e.gate].line, 'light');
}

export function buildEntryGate(id: string): Turning | undefined {
  if (!id.startsWith(ENTRY_PREFIX)) return undefined;
  const [gate, sea, route, island, fromSea, fromIsland] = id.slice(ENTRY_PREFIX.length).split(':') as [EntryGate, SeaId, ArrivalRoute, string, SeaId?, string?];
  if (!island || gateOf(island) !== gate || !SEA_BY_ID[sea] || !ARRIVAL_ROUTES.includes(route)) return undefined;
  const when: Cond[] = fromSea && fromIsland ? [{ c: 'sea', is: [fromSea] }, { c: 'island', is: [fromIsland] }] : [];
  const { title, body, options } = ENTRY_GATES[gate];
  return {
    id, title, body, kind: 'door', speaker: 'hero', when, weight: 0, repeat: { years: 0 },
    doors: options.map((door, option) => ({ ...door, fx: [{ op: 'entry', gate, sea, route, island, option }] })),
  };
}

export function requestArrival(s: Life5, island: string, sea: SeaId, route: ArrivalRoute): void {
  if (s.passage?.from) s.hero.island = s.passage.from;
  s.passage = null;
  if (island === '스릴러 바크') island = destinationAt(island, s.age);
  const gate = gateOf(island);
  if (gate && gate !== gateOf(s.hero.island) && !islandImmunity(s, island)) {
    const id = `${ENTRY_PREFIX}${gate}:${sea}:${route}:${island}:${s.hero.sea}:${s.hero.island}`;
    if (s.pending) {
      if (!s.queue.includes(id)) s.queue.push(id);
    } else {
      const turning = buildEntryGate(id);
      if (turning) openTurning(s, turning);
    }
    return;
  }
  arrive(s, island, sea, route);
  if (island === MORO && sea === 'gl_entry' && route !== 'story' && route !== 'home') {
    const memory = moroReturnLine(s.tried);
    if (memory) logLine(s, memory, 'heavy');
    else if (!s.seenCount[MORO_LANDING] && !s.queue.includes(MORO_LANDING)) s.queue.push(MORO_LANDING);
  }
}

/** 입항 전에 밀린 일은 먼저 열되, 일단 시작한 사흘 사이에는 다른 일이나 계절이 끼지 않는다. */
export function openLogIslandDay(s: Life5): boolean {
  if (s.pending || s.passage || s.hero.island !== MORO) return false;
  for (const scene of LOG_ISLAND_TURNINGS) {
    const index = s.queue.indexOf(scene.id);
    if (index < 0 || !checkAll(s, scene.when)) continue;
    if (scene.id === MORO_LANDING && (index > 0 || s.storyRest > 0)) return false;
    if (!openTurning(s, scene)) return false;
    s.queue.splice(index, 1);
    delete s.queueTries[scene.id];
    return true;
  }
  return false;
}

export function hasEntryContact(s: Life5, gate: 'fishman' | 'zou'): boolean {
  if (gate === 'zou') return s.flags.includes(ZOU_CARD) || s.flags.includes('route:zou');
  return s.flags.includes('route:coating') || s.flags.includes(COATING_CONTACT) || s.people.some((p) => p.alive && p.canon === 'hatchan'
    && (p.kind === 'ally' || p.kind === 'crew'));
}

function arrive(s: Life5, island: string, sea: SeaId, route: ArrivalRoute): void {
  const h = s.hero;
  const moved = island !== h.island || sea !== h.sea;
  const first = !s.flags.includes(`at:${island}`);
  const priorGate = gateOf(h.island);
  const gate = gateOf(island);
  const immune = islandImmunity(s, island);
  if (portOf(h.island) !== portOf(island)) s.flags = s.flags.filter(f => f !== DEFERRED_ROUTE);
  h.island = island === '아마존 릴리' && h.gender === 'm' ? AMAZON_ROADS : island;
  const field = trainingLanding(island, s.flags);
  if (field && !s.queue.includes(field)) s.queue.unshift(field);
  h.sea = sea;
  if (gate !== 'sky') delete h.skyAcclimating;
  else if (priorGate !== 'sky') {
    if (immune) delete h.skyAcclimating;
    else h.skyAcclimating = true;
  }
  locationDivider(s);
  if (first && (gate || (route !== 'story' && route !== 'home'))) s.flags.push(`at:${island}`);
  if (gate && priorGate !== gate && immune) {
    logLine(s, isNative(s, island) ? '고향 사람만 아는 길을 따라 조용히 돌아왔다.' : '지난 항해에서 받은 증표를 내밀자 익숙한 길이 열렸다.', 'light');
  }
  const approach = climateOf(island, s)?.approach;
  if (moved && (!gate || (priorGate !== gate && !immune)) && approach?.arrive) {
    logLine(s, approach.arrive, 'light');
    if (!gate && route !== 'story' && route !== 'home' && approach.hp && h.town !== island) {
      h.hp = Math.max(1, Math.min(V.hp.max, h.hp + approach.hp));
    }
  }
  if (gate === 'sky' && priorGate !== 'sky' && h.skyAcclimating) {
    logLine(s, '희박한 공기에 숨이 찼다. 몸이 적응할 때까지 힘과 회복이 떨어진다.', 'light', 'life');
  }
  if (h.island === AMAZON_ROADS) logLine(s, '쿠자 경비선이 여인섬의 상륙 금지선을 가리켰다. 배는 섬 밖의 정박지에 머문다.', 'light');
  if (route === 'story' || route === 'home') return;
  if (route === 'orders') {
    if (h.island === AMAZON_ROADS) {
      logLine(s, '본부의 지시에 따라 여인섬 바깥 순찰 구역에 배속되었다.', 'light');
      return;
    }
    logLine(s, josa(first ? `본부의 전근 명령이 내려왔다. ${island} 지부에 처음 배속되었다.` : `전근 명령을 받아 다시 ${island} 지부로 배속되었다.`), 'light');
    return;
  }
  logLine(s, josa(first ? `${h.island}에 처음 닻을 내렸다.` : `다시 ${h.island}(으)로 뱃머리를 돌렸다.`), 'light');
  if (route === 'calm') h.hp = Math.min(V.hp.max, h.hp + ROUTE.calm.hp);
  else if (route === 'dream') h.base.wil += ROUTE.dream.wil;
  else if (route === 'wild') {
    h.fame += ROUTE.wild.fame;
    if (immune) return;
    h.hp = Math.max(1, h.hp + ROUTE.wild.hp);
    s.hardship += ROUTE.wild.hardship;
    logLine(s, '거친 파도와 낯선 적을 헤치고 겨우 닿았다. 그 뱃길을 건넜다는 소문이 먼저 퍼졌다.', 'light');
  }
}

export function awardEntryPass(s: Life5, gate: EntryGate): void {
  const pass = entryPass(gate);
  // 옛 저장에서 이미 섬에 도착해 장편을 이어가는 방문객도 보상을 받는다.
  if (gateOf(s.hero.island) !== gate || islandImmunity(s)) return;
  s.flags.push(pass);
  logLine(s, '섬 사람들이 다시 길을 열어 줄 항해 증표를 건넸다.', 'heavy');
}

export function resolveEntry(s: Life5, e: Extract<Fx, { op: 'entry' }>): void {
  const h = s.hero;
  const r = rngOf(s.rng);
  const crew = s.people.flatMap((p) => p.alive && p.kind === 'crew' && p.crew ? [p.crew] : []);
  const navigator = crew.some((p) => p.role === 'navigator' && p.injuredMonths <= 0 && !p.separatedMonths);
  const reinforced = e.gate === 'sky' && s.flags.includes('route:sky');
  const seamanship = h.base.int + (navigator ? 10 : 0) + (reinforced ? 10 : 0);
  const hurt = (hp: number, heavy = false) => {
    h.hp = Math.max(1, h.hp - hp);
    const severity = heavy ? 'heavy' : 'light';
    h.injuries.push({ severity, monthsLeft: V.injury.months[severity] });
    s.hardship += heavy ? 4 : 2;
  };
  const say = (line: string) => logLine(s, line, 'heavy', 'life');

  switch (e.gate) {
    case 'sky':
      if (e.option === 1) {
        h.money -= ENTRY_COST.highWest;
        if (chance(r, 0.2)) h.hp = Math.max(1, h.hp - 8);
        say('길잡이의 등불을 따라 하이 웨스트에서 구름 바다에 닿았다.');
        break;
      }
      if (chance(r, h.hp < 55 && seamanship < 18 ? 0.03 : 0.005)) {
        hurt(40, true);
        for (const sailor of crew) sailor.injuredMonths = Math.max(3, sailor.injuredMonths);
        loseShip(s);
        s.flags = s.flags.filter(flag => flag !== 'captain');
        say('물기둥에서 배가 부서졌다. 표류 끝에 구조되어 출발지로 돌아왔다.');
        return;
      }
      if (seamanship < 18 || h.hp < 55) {
        hurt(28);
        const sailor = crew.find((p) => p.injuredMonths <= 0);
        if (sailor) sailor.injuredMonths = 3;
        say('물기둥이 배를 세차게 흔들었다. 상처를 입고 간신히 구름 위로 솟구쳤다.');
      } else {
        h.fame += 35;
        h.base.wil += 3;
        say('물기둥 꼭대기에서 돛이 다시 펴졌다. 청해에서 오를 수 없다는 길을 돌파했다.');
      }
      break;
    case 'fishman':
      if (e.option === 0) {
        h.money -= ENTRY_COST.coating;
        say('두껍게 입힌 코팅이 해류의 수압을 받아냈다.');
      } else if (e.option === 1) {
        say('인연 덕에 받은 코팅이 깊은 바다에서도 단단히 버텼다.');
      } else if (chance(r, navigator ? 0.35 : 0.7)) {
        hurt(32, true);
        say('해왕류를 피하던 배의 코팅이 찢어졌다. 예비 거품막으로 겨우 어인섬에 닿았다.');
      } else {
        h.hp = Math.max(1, h.hp - 12);
        say('얇은 코팅 너머에서 심해 해류가 요동쳤다. 거품막이 꺼지기 전에 어인섬으로 들어갔다.');
      }
      break;
    case 'wano':
      if (e.option === 1) {
        h.money -= ENTRY_COST.smuggler;
        say('밀수선 짐칸에서 검문이 끝날 때까지 기다렸다. 밤에 와노의 해안에 발을 디뎠다.');
      } else if (chance(r, seamanship >= 18 && h.hp >= 55 ? 0.25 : 0.65)) {
        hurt(25);
        for (const sailor of crew) sailor.separatedMonths = 3;
        say('폭포 끝에서 배가 뒤집혔다. 홀로 해안에 밀려왔고 동료들은 뿔뿔이 흩어졌다.');
      } else {
        say('잉어에 건 줄이 팽팽해졌다. 배가 소용돌이를 벗어나 폭포 위로 올랐다.');
      }
      break;
    case 'zou':
      if (e.option === 1) {
        h.hp = Math.max(1, h.hp - 10);
        s.hardship += 2;
        if (!chance(r, navigator ? 0.5 : 0.25)) {
          say('안개 속에서 즈니샤의 발자국마저 놓쳐 출발지로 돌아왔다.');
          return;
        }
      }
      say(e.option === 0 ? '비블카드가 당기는 방향에서 거대한 다리가 모습을 드러냈다.' : '안개 사이로 즈니샤의 다리를 발견해 밧줄을 걸었다.');
      say('거대한 다리를 올라 모코모 공국의 숲에 닿았다.');
      break;
  }
  arrive(s, e.island, e.sea, e.route);
}
