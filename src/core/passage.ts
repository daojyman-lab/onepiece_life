import { recordTraitEvent, traitFactor, hasTrait, traitStats } from './traits';
// 항해 (v3의 항해를 되살린다): 섬을 옮기면 바로 닿지 않고, 몇 토막 동안 바다 위에 있다가 닿는다.
// 토막마다 그 바다의 날씨를 굴린다(data/weather.ts). 폭풍은 고른 뱃길대로 피항 · 우회 · 돌파한다.
// 바다 위에 있는 동안에는 섬에 묶인 전환점이 열리지 않는다(cond.ts island). 닿으면 그 섬의 이야기가 열린다.
import { josa } from '../shared/core/josa';
import { pick, rngOf, type Rng } from '../shared/core/rng';
import { V } from '../data/balance';
import { SEA_STANDINGS } from '../data/landlocked';
import { dangerOf } from '../data/voyage';
import { canonYear, type WorldClock } from '../data/world-history';
import { destinationAt, offshoreDays, portOf, seaOfPort } from '../data/navigation';
import { RESUPPLY_STORIES } from '../data/turnings/ports';
import { openTurning } from './turning';
import {
  ANOMALY_KINDS, CALM_BELT_ISLANDS, DRIFT_CHANCE, SEA_KING_CHANCE, WEATHER_EFFECT, WEATHER_LINES,
  WEATHER_TABLE, zoneOf, type SeaZone, type Weather, type WeatherTilt,
} from '../data/weather';
import { climateOf } from '../data/climates';
import { logLine } from './log';
import { requestArrival } from './voyage';
import { beginDebut } from './stages';
import type { Life5 } from './types';

export type Route = 'calm' | 'dream' | 'wild';
/** 고르지 않은 항해: 해군 전근, 또는 고를 틈 없이 바람 닿는 대로 옮긴 사람. 닿아도 뱃길 효과가 없다 */
export type PassageRoute = Route | 'drift';

/** 항해 중 상태 (Life5.passage). JSON으로 저장된다 */
export interface Passage {
  to: string;              // 닿을 섬 (같은 바다)
  route: PassageRoute;     // 고른 뱃길. 고르지 않았으면 'drift'
  order?: boolean;         // 해군 · 정부 요원의 전근 (닿을 때 글이 다르다)
  partsLeft: number;       // 남은 토막
  partsSpent: number;      // 바다에서 보낸 토막
  maxParts: number;        // 이만큼 바다에 있었으면 무조건 닿는다
  last?: Weather;          // 지난 토막의 날씨
  stopover?: 'planned' | 'islet_resupply' | 'islet_rainwater';
  from?: string;           // 보급섬에서 보이는 동안에도 원래 출발 항구를 보존한다
}

export const UNNAMED_ISLET = '이름 없는 섬';
export const MAX_PROVISIONS = 6;
const RECENT_STOPOVER = 'voyage:recentStopover';

/** 무풍 · 피항이 이어져도 기본 길이에서 이만큼 넘으면 닿는다 */
export const MAX_EXTRA_PARTS = 3;

/** 기본 항해 길이(토막). 한 해가 네 토막이다. 험한 섬은 물길도 험하고, 잔잔한 뱃길은 돌아가고, 미지는 질러간다 */
export function passageParts(sea: string, to: string, route: PassageRoute): number {
  const danger = dangerOf(to) === 3 ? 1 : 0;
  const far = zoneOf(sea) === 'newWorld' ? 1 : 0;
  const byRoute = route === 'calm' ? 1 : route === 'wild' ? -1 : 0;
  return Math.max(1, 1 + danger + far + byRoute);
}

/** 출항한다. 섬은 닿을 때 바뀐다 */
export function depart(s: Life5, to: string, route: PassageRoute, order = false): void {
  if (s.passage) return;
  beginDebut(s);
  to = destinationAt(to, s.age);
  const parts = passageParts(s.hero.sea, to, route);
  s.passage = { to, route, ...(order ? { order } : {}), partsLeft: parts, partsSpent: 0, maxParts: parts + MAX_EXTRA_PARTS };
  logLine(s, josa(order ? `전근 명령을 받고 ${to}(으)로 가는 군함에 올랐다.` : `${s.hero.island}의 항구를 떠나 ${to}(으)로 돛을 올렸다.`), 'light');
  if (!offshoreDays(portOf(s.hero.island), to)) return;
  const stores = s.hero.provisions ?? 0;
  if (stores > 0) {
    s.hero.provisions = stores - 1;
    s.hero.hp = Math.min(V.hp.max, s.hero.hp + 3);
    logLine(s, '외해로 나서며 비축한 식량 한 몫을 나눠 먹었다.', 'light');
  }
  if (s.flags.includes(RECENT_STOPOVER)) {
    s.flags = s.flags.filter(flag => flag !== RECENT_STOPOVER);
  } else if (stores < MAX_PROVISIONS && rngOf(s.rng)() < 0.35) s.passage.stopover = 'planned';
}

/** 고른 뱃길은 날씨 확률도 바꾼다 */
const ROUTE_TILT: Record<PassageRoute, WeatherTilt> = {
  calm: { storm: -10, clear: +10 },
  dream: {},
  wild: { storm: +10, anomaly: +5, clear: -15 },
  drift: {},
};

/** 연도만 주는 호출은 그해 첫 토막이다. 게임에서는 전성기와 사건이 일어나는 철까지 포함한 시계를 넘긴다. */
export function rollWeather(zone: SeaZone, route: PassageRoute, when: WorldClock | number | undefined, r: Rng, place?: WeatherTilt | string): Weather {
  const w = { ...WEATHER_TABLE[zone] };
  if (zone !== 'calmBelt') {
    const clock = typeof when === 'number' ? { age: when - canonYear(0), part: 0 } : when;
    const tilt = typeof place === 'string' ? climateOf(place, clock)?.approach?.tilt : place;
    for (const [k, d] of Object.entries(ROUTE_TILT[route])) w[k as Weather] += d!;
    if (tilt) for (const [k, d] of Object.entries(tilt)) w[k as Weather] += d!;
    if (zone === 'blue') w.anomaly = 0;          // 이상기후는 위대한 항로부터
  }
  const list = (Object.keys(w) as Weather[]).map((k) => [k, Math.max(0, w[k])] as const);
  let roll = r() * list.reduce((a, [, n]) => a + n, 0);
  for (const [k, n] of list) if ((roll -= n) < 0) return k;
  return 'clear';
}

/** 폭풍을 만나면 고른 뱃길대로 움직인다. 잔잔한 뱃길만 포구에 피해 늦어지고, 나머지는 다치면서 그대로 간다 */
export const STORM_BY_ROUTE: Record<PassageRoute, { progress: number; hp: number; fame: number; line: string }> = {
  calm:  { progress: 0, hp: 0,   fame: 0, line: '가까운 포구로 피해 폭풍이 지나가길 기다렸다.' },      // 피항: 늦어지지만 무사하다
  dream: { progress: 1, hp: -5,  fame: 0, line: '폭풍의 가장자리를 비켜 가느라 배가 몹시 흔들렸다.' },   // 비껴가기: 조금 다치고 그대로 간다
  wild:  { progress: 1, hp: -15, fame: 8, line: '돛을 접지 않고 폭풍 한가운데를 뚫고 나아갔다.' },   // 돌파: 다치지만 이름이 난다
  drift: { progress: 1, hp: -5,  fame: 0, line: '돛을 줄이고 폭풍 속을 버티며 나아갔다.' },
};

/** 칼름벨트의 해왕류에게 입는 피해 */
export const SEA_KING_HP = -10;

/** 한 토막의 결과 (상태를 바꾸지 않는다) */
export interface PassageStep {
  next: Passage | null;    // 닿았으면 null
  weather: Weather;
  lines: string[];
  hp: number;
  fame: number;
  seaKing: boolean;
}

/** 항해 한 토막을 굴린다. navigator: 항해 실력 0~3 */
export function rollPassage(p: Passage, sea: string, navigator: number, r: Rng, when?: WorldClock | number): PassageStep {
  const nav = Math.max(0, Math.min(3, navigator));
  const zone: SeaZone = CALM_BELT_ISLANDS.includes(p.to) && p.partsSpent === 0 ? 'calmBelt' : zoneOf(sea);
  const weather = rollWeather(zone, p.route, when, r, p.to);
  const out: PassageStep = { next: null, weather, lines: [], hp: WEATHER_EFFECT[weather].hp, fame: 0, seaKing: false };
  let progress = WEATHER_EFFECT[weather].progress;

  if (weather === 'storm') {
    const st = STORM_BY_ROUTE[p.route];
    out.lines.push(pick(r, WEATHER_LINES.storm), st.line);
    progress = st.progress;
    out.hp += st.hp;
    out.fame += st.fame;
  } else if (weather === 'anomaly') {
    out.lines.push(`${pick(r, WEATHER_LINES.anomaly)} ${pick(r, ANOMALY_KINDS)}.`);
  } else {
    out.lines.push(pick(r, WEATHER_LINES[weather]));
  }
  if (nav >= 2 && out.hp < 0) out.hp = Math.round(out.hp / 2);   // 날씨를 읽는 사람이 있으면 덜 다친다

  if ((weather === 'fog' || weather === 'anomaly') && r() < DRIFT_CHANCE[nav] && progress > 0) {
    progress -= 1;
    out.lines.push('물길을 잃어 한참을 헤맸다.');
  }
  if (zone === 'calmBelt' && r() < SEA_KING_CHANCE) {
    out.seaKing = true;
    out.hp += SEA_KING_HP;
    out.lines.push('수면에 뜬 노란 달이 눈을 깜박였다. 해왕류의 눈동자였다. 비늘 한 장이 돛보다 컸다. 놈이 고개를 돌리자 물이 비탈처럼 기울어 배 안의 물건들이 한쪽으로 쏟아졌다.');
  }

  const spent = p.partsSpent + 1;
  const left = p.partsLeft - progress;
  if (left > 0 && spent < p.maxParts) out.next = { ...p, partsLeft: left, partsSpent: spent, last: weather };
  return out;
}

/** 항해 실력: 항해사 동료가 있으면 2, 글을 잘 알면 1 더 (0~3) */
export function navigatorLevel(s: Life5): number {
  const crewNav = s.people.some((x) => x.alive && x.kind === 'crew' && x.crew?.role === 'navigator') ? 2 : 0;
  return Math.min(3, crewNav + (traitStats(s).int >= V.passage.navInt ? 1 : 0));
}

/** 바다 위의 한 토막: 날씨를 굴려 적용하고, 닿았으면 섬을 옮긴다 */
export function passagePart(s: Life5, r: Rng): void {
  const p = s.passage;
  if (!p) return;
  const h = s.hero;
  if (!SEA_STANDINGS.includes(h.standing)) { arrive(s, p); return; }   // 배에서 내리는 처지가 되었으면(은퇴 · 뭍살이) 그대로 닿은 섬에 남는다
  if (p.stopover && p.stopover !== 'planned') {
    const t = RESUPPLY_STORIES.find(t => t.id === p.stopover);
    if (t && !s.pending) openTurning(s, t);
    return;
  }
  const step = rollPassage(p, h.sea, Math.max(0, Math.min(3, navigatorLevel(s) + (hasTrait(s, 'orientation') ? 1 : hasTrait(s, 'lostWay') ? -1 : 0))), r, s);
  for (const line of step.lines) logLine(s, line, 'light');
  if (step.seaKing && !s.flags.includes('sawCalmBeltKing')) {
    s.flags.push('sawCalmBeltKing');
    s.timeline.push({ age: s.age, text: '칼름벨트에서 돛보다 비늘이 큰 해왕류와 눈이 마주쳤다' });
  }
  if (step.hp) h.hp = Math.max(1, Math.min(V.hp.max, h.hp + (step.hp < 0 ? Math.round(step.hp * traitFactor(s, 'danger')) : Math.round(step.hp * traitFactor(s, 'healing')))));   // 날씨로는 죽지 않는다
  if (step.fame) h.fame += step.fame;
  if (p.stopover === 'planned') {
    const [spring, rain] = RESUPPLY_STORIES;
    const t = (s.seenCount[spring.id] ?? 0) > (s.seenCount[rain.id] ?? 0) ? rain : spring;
    const voyage = step.next ?? { ...p, partsSpent: p.partsSpent + 1, partsLeft: 0, last: step.weather };
    s.passage = { ...voyage, from: h.island, stopover: t === spring ? 'islet_resupply' : 'islet_rainwater' };
    h.island = UNNAMED_ISLET;
    s.flags.push(RECENT_STOPOVER);
    logLine(s, '항로 곁에 해도에 이름이 없는 섬이 보였다. 작은 배를 내려 보낼 만한 물때였다.', 'light');
    openTurning(s, t);
    return;
  }
  if (step.next) { s.passage = step.next; return; }
  arrive(s, p);
}

/** 정박 중에만 보급품을 한 번 싣고, 원래 뱃길과 남은 날씨 판정을 이어 간다. */
export function resumeVoyage(s: Life5, stores: number): void {
  const p = s.passage;
  if (!p?.from || !p.stopover || p.stopover === 'planned') return;
  s.hero.island = p.from;
  delete p.from;
  delete p.stopover;
  s.hero.provisions = Math.min(MAX_PROVISIONS, (s.hero.provisions ?? 0) + stores);
  if (p.partsLeft <= 0) arrive(s, p);
}

/** 닿는다: 섬을 바꾸고, 고른 뱃길의 효과를 받는다 */
export function arrive(s: Life5, p: Passage): void {
  if (p.from) s.hero.island = p.from;
  const to = destinationAt(p.to, s.age);
  recordTraitEvent(s, 'voyage', '', to);
  s.passage = null;
  requestArrival(s, to, seaOfPort(to) ?? s.hero.sea, p.order ? 'orders' : p.route);
}

export { canonYear };
