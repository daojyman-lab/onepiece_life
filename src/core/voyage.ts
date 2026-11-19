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
import { checkAll } from './cond';
import { COATING_CONTACT, DREAM_ISLANDS, ENTRY_COST, ENTRY_GATES, ROUTE, ZOU_CARD, dangerOf, entryPass, gateOf, type EntryGate } from '../data/voyage';
import { islandImmunity, isNative } from './environment';
import { locationDivider, logLine } from './log';
import { openTurning } from './turning';
import type { Cond, DreamId, Door, Fx, Life5, SeaId, Turning } from './types';
import { depart } from './passage';

export type Route = 'calm' | 'dream' | 'wild';
export type ArrivalRoute = Route | 'story' | 'home' | 'drift' | 'orders';
export const VOYAGE_PREFIX = 'voyage:';
export const ENTRY_PREFIX = 'entry:';
const ARRIVAL_ROUTES: readonly string[] = ['calm', 'dream', 'wild', 'story', 'home', 'drift', 'orders'];

/** 지금 바다에서 갈 수 있는 섬 가운데 세 갈래의 후보. 고를 섬이 둘도 안 되면 null */
export function voyageChoices(s: Life5, r: Rng): { calm?: string; dream?: string; wild?: string } | null {
  const ports = SEA_BY_ID[s.hero.sea].ports.filter((p) => p !== s.hero.island);
  if (ports.length < 2) return null;
  const fresh = (p: string) => (s.flags.includes(`at:${p}`) ? 1 : V.voyage.fresh);
  const top = Math.max(...ports.map(dangerOf));
  const wild = top >= 3 ? weighted(r, ports.filter((p) => dangerOf(p) === top), fresh) ?? undefined : undefined;
  let rest = ports.filter((p) => p !== wild);
  const low = Math.min(...rest.map(dangerOf));
  const calm = weighted(r, rest.filter((p) => dangerOf(p) === low), fresh) ?? undefined;
  rest = rest.filter((p) => p !== calm);
  const tagged = s.dream ? rest.filter((p) => DREAM_ISLANDS[s.dream!.id].includes(p)) : [];
  const dream = rest.length ? pick(r, tagged.length ? tagged : rest) : undefined;
  return [calm, dream, wild].filter(Boolean).length >= 2 ? { calm, dream, wild } : null;
}

/** 후보를 담은 전환점 id: voyage:<나이>:<꿈 id 또는 ->:<잔잔>|<꿈>|<험함> (빈칸이면 그 갈래 없음). 나이가 들어 있어 해마다 다른 장면이다 */
export function voyageId(s: Life5, c: { calm?: string; dream?: string; wild?: string }): string {
  const d = s.dream && c.dream && DREAM_ISLANDS[s.dream.id].includes(c.dream) ? s.dream.id : '-';
  return `${VOYAGE_PREFIX}${s.age}:${d}:${c.calm ?? ''}|${c.dream ?? ''}|${c.wild ?? ''}`;
}

const sail = (island: string, route: Route): Fx => ({ op: 'sail', island, route });

/** id로 항로 고르기 전환점을 짓는다. 문은 잔잔 · 꿈(또는 소문) · 험함 순서 */
export function buildVoyage(id: string): Turning | undefined {
  if (!id.startsWith(VOYAGE_PREFIX)) return undefined;
  const [, dreamId, rest = ''] = id.slice(VOYAGE_PREFIX.length).split(':');
  const [calm, dream, wild] = rest.split('|');
  const doors: Door[] = [];
  if (calm) doors.push({ label: josa(`잔잔한 뱃길로 ${calm}에 간다`), hint: '쉬어 가며 숨을 고른다', fx: [sail(calm, 'calm')] });
  if (dream) {
    const d = dreamId !== '-' ? DREAMS[dreamId as DreamId] : null;
    doors.push(d
      ? { label: josa(`${dream}(으)로 뱃머리를 돌린다`), hint: josa(`${d.name}에 한 걸음 가까워질 것 같은 소문이 있다`), fx: [sail(dream, 'dream')] }
      : { label: josa(`소문을 따라 ${dream}(으)로 간다`), hint: '떠도는 소문이 자꾸 마음에 걸린다', fx: [sail(dream, 'dream')] });
  }
  if (wild) doors.push({ label: josa(`험한 바다를 건너 ${wild}(으)로 간다`), hint: '위험하지만 이름을 떨칠 기회가 있다', danger: true, fx: [sail(wild, 'wild')] });
  for (const door of doors) {
    const destination = door.fx?.[0];
    if (destination?.op === 'sail' && gateOf(destination.island)) door.hint += '. 이 섬에는 별도의 진입 관문이 있다';
    if (destination?.op === 'sail' && destination.island === MORO) door.hint += '. 해 질 무렵이면 동전도 옆으로 떨어진다는 섬이다';
  }
  return {
    id, kind: 'door', when: [], weight: 0, repeat: { years: 0 }, speaker: 'hero',
    title: '다음 항로', body: '{island}에서의 날들이 끝나 간다. 해도를 펼치자 갈 만한 섬이 몇 보인다. 어디로 뱃머리를 돌릴까.',
    doors,
  };
}

/** 고른 섬으로 출항한다. 섬은 바다를 건너 닿을 때 바뀐다 (core/passage.ts) */
export function sailTo(s: Life5, island: string, route: Route): void {
  depart(s, island, route);
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
  s.passage = null;
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
  if (gate === 'zou') return s.flags.includes(ZOU_CARD);
  return s.flags.includes(COATING_CONTACT) || s.people.some((p) => p.alive && p.canon === 'hatchan'
    && (p.kind === 'ally' || p.kind === 'crew'));
}

function arrive(s: Life5, island: string, sea: SeaId, route: ArrivalRoute): void {
  const h = s.hero;
  const first = !s.flags.includes(`at:${island}`);
  const priorGate = gateOf(h.island);
  const gate = gateOf(island);
  const immune = islandImmunity(s, island);
  h.island = island;
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
  const approach = climateOf(island)?.approach;
  if (gate && priorGate !== gate && !immune && approach?.arrive) logLine(s, approach.arrive, 'light');
  if (gate === 'sky' && priorGate !== 'sky' && h.skyAcclimating) {
    logLine(s, '희박한 공기에 숨이 찼다. 몸이 적응할 때까지 힘과 회복이 떨어진다.', 'light', 'life');
  }
  if (route === 'story' || route === 'home') return;
  if (route === 'orders') {
    logLine(s, josa(first ? `본부의 전근 명령이 내려왔다. ${island} 지부에 처음 배속되었다.` : `전근 명령을 받아 다시 ${island} 지부로 배속되었다.`), 'light');
    return;
  }
  logLine(s, josa(first ? `${island}에 처음 닻을 내렸다.` : `다시 ${island}(으)로 뱃머리를 돌렸다.`), 'light');
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
  const seamanship = h.base.int + (navigator ? 10 : 0);
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
