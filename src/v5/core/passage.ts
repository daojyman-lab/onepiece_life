// 항해 (v3의 항해를 되살린다): 섬을 옮기면 바로 닿지 않고, 몇 토막 동안 바다 위에 있다가 닿는다.
// 토막마다 그 바다의 날씨를 굴린다(data/weather.ts). 폭풍은 고른 뱃길대로 피항 · 우회 · 돌파한다.
// 바다 위에 있는 동안에는 섬에 묶인 전환점이 열리지 않는다(cond.ts island). 닿으면 그 섬의 이야기가 열린다.
import { josa } from '../../core/josa';
import { pick, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { SEA_STANDINGS } from '../data/landlocked';
import { ROUTE, dangerOf } from '../data/voyage';
import {
  ANOMALY_KINDS, CALM_BELT_ISLANDS, DRIFT_CHANCE, SEA_KING_CHANCE, WEATHER_EFFECT, WEATHER_LINES,
  WEATHER_TABLE, YEAR_WEATHER, zoneOf, type SeaZone, type Weather,
} from '../data/weather';
import { climateOf } from '../data/climates';
import { logLine } from './log';
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
}

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
  const parts = passageParts(s.hero.sea, to, route);
  s.passage = { to, route, ...(order ? { order } : {}), partsLeft: parts, partsSpent: 0, maxParts: parts + MAX_EXTRA_PARTS };
  logLine(s, josa(order ? `전근 명령을 받고 ${to}(으)로 가는 군함에 올랐다.` : `${s.hero.island}의 항구를 떠나 ${to}(으)로 돛을 올렸다.`), 'light');
}

/** 고른 뱃길은 날씨 확률도 바꾼다 */
const ROUTE_TILT: Record<PassageRoute, Partial<Record<Weather, number>>> = {
  calm: { storm: -10, clear: +10 },
  dream: {},
  wild: { storm: +10, anomaly: +5, clear: -15 },
  drift: {},
};

export function rollWeather(zone: SeaZone, route: PassageRoute, year: number | undefined, r: Rng, place?: Partial<Record<Weather, number>>): Weather {
  const w = { ...WEATHER_TABLE[zone] };
  if (zone !== 'calmBelt') {
    for (const [k, d] of Object.entries(ROUTE_TILT[route])) w[k as Weather] += d!;
    if (place) for (const [k, d] of Object.entries(place)) w[k as Weather] += d!;   // 가는 섬의 바다 (스릴러 바크의 안개, 펑크 해저드의 불타는 바다)
    if (zone === 'blue') w.anomaly = 0;          // 이상기후는 위대한 항로부터
  }
  const tilt = year != null ? YEAR_WEATHER[year]?.[zone] : undefined;
  if (tilt) for (const [k, d] of Object.entries(tilt)) w[k as Weather] += d!;
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
export function rollPassage(p: Passage, sea: string, navigator: number, r: Rng, year?: number): PassageStep {
  const nav = Math.max(0, Math.min(3, navigator));
  const zone: SeaZone = CALM_BELT_ISLANDS.includes(p.to) && p.partsSpent === 0 ? 'calmBelt' : zoneOf(sea);
  const weather = rollWeather(zone, p.route, year, r, climateOf(p.to)?.approach?.tilt);
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
    out.lines.push('바람 없는 바다 밑에서 거대한 해왕류가 떠올라 배를 뒤흔들었다.');
  }

  const spent = p.partsSpent + 1;
  const left = p.partsLeft - progress;
  if (left > 0 && spent < p.maxParts) out.next = { ...p, partsLeft: left, partsSpent: spent, last: weather };
  return out;
}

/** 항해 실력: 항해사 동료가 있으면 2, 글을 잘 알면 1 더 (0~3) */
export function navigatorLevel(s: Life5): number {
  const crewNav = s.people.some((x) => x.alive && x.kind === 'crew' && x.crew?.role === 'navigator') ? 2 : 0;
  return Math.min(3, crewNav + (s.hero.base.int >= V.passage.navInt ? 1 : 0));
}

/** 바다 위의 한 토막: 날씨를 굴려 적용하고, 닿았으면 섬을 옮긴다 */
export function passagePart(s: Life5, r: Rng): void {
  const p = s.passage;
  if (!p) return;
  const h = s.hero;
  if (!SEA_STANDINGS.includes(h.standing)) { arrive(s, p); return; }   // 배에서 내리는 처지가 되었으면(은퇴 · 뭍살이) 그대로 닿은 섬에 남는다
  const step = rollPassage(p, h.sea, navigatorLevel(s), r, canonYear(s.age));
  for (const line of step.lines) logLine(s, line, 'light');
  if (step.hp) h.hp = Math.max(1, Math.min(V.hp.max, h.hp + step.hp));   // 날씨로는 죽지 않는다
  if (step.fame) h.fame += step.fame;
  if (step.next) { s.passage = step.next; return; }
  arrive(s, p);
}

/** 닿는다: 섬을 바꾸고, 고른 뱃길의 효과를 받는다 */
export function arrive(s: Life5, p: Passage): void {
  const h = s.hero;
  const first = !s.flags.includes(`at:${p.to}`);
  s.passage = null;
  h.island = p.to;
  if (first) s.flags.push(`at:${p.to}`);
  const way = climateOf(p.to)?.approach;       // 하늘섬의 노크업 스트림, 조우의 코끼리 다리처럼 닿는 길이 특별한 섬
  if (way?.arrive) {
    logLine(s, way.arrive, 'light');
    if (way.hp && !(h.town === p.to)) h.hp = Math.max(1, Math.min(V.hp.max, h.hp + way.hp));
  }
  if (p.order) {
    logLine(s, josa(first ? `${p.to} 지부에 처음 배속되었다.` : `다시 ${p.to} 지부로 배속되었다.`), 'light');
    return;
  }
  logLine(s, josa(first ? `${p.to}에 처음 닻을 내렸다.` : `다시 ${p.to}에 닻을 내렸다.`), 'light');
  if (p.route === 'drift') return;
  if (p.route === 'calm') h.hp = Math.min(V.hp.max, h.hp + ROUTE.calm.hp);
  else if (p.route === 'dream') h.base.wil += ROUTE.dream.wil;
  else {
    h.hp = Math.max(1, h.hp + ROUTE.wild.hp);
    h.fame += ROUTE.wild.fame;
    s.hardship += ROUTE.wild.hardship;
    logLine(s, '거친 파도와 낯선 적을 헤치고 겨우 닿았다. 그 뱃길을 건넜다는 소문이 먼저 퍼졌다.', 'light');
  }
}

/** 주인공의 나이를 해원력으로: 열일곱 살이 원작이 시작하는 해(V.canon) */
export function canonYear(age: number): number {
  return V.canon.startYear + (age - V.canon.heroAge);
}
