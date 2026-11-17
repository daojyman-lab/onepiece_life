// 모든 전환점. 파일 하나가 한 묶음이다. 묶음을 더하려면 아래 목록에 한 줄을 보탠다.
import type { Cond, Fx, Turning } from '../../core/types';
import { COASTAL_WORDS, INLAND_TOWNS, ISOLATED_TOWNS, SEA_STANDINGS, WORLD_GOV_WORDS } from '../landlocked';
export { COASTAL_WORDS, INLAND_TOWNS, ISOLATED_TOWNS, WORLD_GOV_WORDS } from '../landlocked';
import { CHILDHOOD } from './childhood';
import { FORTUNES } from './fortunes';
import { MISFORTUNES } from './misfortunes';
import { MOMENTS } from './moments';
import { PATHS } from './paths';
import { PEOPLE } from './people';
import { TOWNS } from './towns';
import { PIRATE } from './pirate';
import { HUNTER } from './hunter';
import { MARINE } from './marine';
import { REVOLUTION } from './revolution';
import { LAND } from './land';
import { LIFE } from './life';
import { CANON_EAST } from './canon';
import { CANON_SEA } from './canon-2';
import { SEA_LEAVE, SEA_RETURN } from './sea';
import { SEA_GRAND_LINE, SEA_NEW_WORLD } from './sea-2';
import { LATE } from './late';
import { HOMES_LEAVE, HOMES_RETURN } from './homes-sea';
import { WATER7 } from './water7';
import { WANO } from './wano';
import { BONDS } from './bonds';
import { ISLANDS, ISLAND_OF } from './islands';
import { RECRUIT_TURNINGS } from './recruits';
import { PRIME } from './prime';
import { DREAM_TURNINGS } from './dreams';
import { KIN_TURNINGS } from './kin';
import { EPISODE_TURNINGS } from '../episodes';

const GROUPS: Turning[][] = [
  CHILDHOOD,
  BONDS,
  FORTUNES,
  MISFORTUNES,
  MOMENTS,
  PATHS,
  PEOPLE,
  TOWNS,
  PIRATE,
  HUNTER,
  MARINE,
  REVOLUTION,
  LAND,
  LIFE,
  CANON_EAST,
  CANON_SEA,
  SEA_LEAVE,
  SEA_RETURN,
  SEA_GRAND_LINE,
  SEA_NEW_WORLD,
  LATE,
  HOMES_LEAVE,
  HOMES_RETURN,
  WATER7,
  WANO,
  ISLANDS,
  RECRUIT_TURNINGS,
  PRIME,
  DREAM_TURNINGS,
  KIN_TURNINGS,
  EPISODE_TURNINGS,
];

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => (e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]));
/** 문 하나라도 바다의 처지로 건너가게 한다 (외딴 고향에서는 과제 3의 떠나는 길로만 건너간다) */
const toSea = (t: Turning) => t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'standing' && SEA_STANDINGS.includes(f.to)));
const textOf = (t: Turning) => [t.title, t.body, ...t.doors.flatMap((d) => [d.label, d.hint])].join(' ');
/**
 * 고향 · 마을 · 섬 조건이 없는 전환점(어느 고향에서나 오는 것)이 외딴 고향 섬에서 맞지 않게 뜨지 않도록 막는다.
 * 바다(sea) 조건이 있거나 해군 · 현상금을 말하거나 바다의 처지(해적 · 해군 …)로 건너가게 하면 외딴 고향 섬에서, 바닷가를 말하면 바다에 닿지 않는 고향 섬에서 뜨지 않는다.
 * 섬을 떠나 바다에 나가면(hero.island가 바뀌면) 다시 열린다.
 */
export function landlocked(t: Turning): Turning {
  if (t.when.some((c) => c.c === 'home' || c.c === 'town' || c.c === 'island')) return t;
  const x = textOf(t);
  const add: Cond[] = [];
  if (t.when.some((c) => c.c === 'sea') || WORLD_GOV_WORDS.test(x) || toSea(t)) add.push({ c: 'island', is: ISOLATED_TOWNS, not: true });
  else if (COASTAL_WORDS.test(x)) add.push({ c: 'island', is: INLAND_TOWNS, not: true });
  t.when.push(...add);                         // 묶음 파일의 전환점을 그대로 쓴다 (같은 객체를 가리키는 테스트와 TURNING_BY_ID를 위해)
  return t;
}

/** 그 섬에서 일어나는 바다의 전환점은 그 섬에 닿아야 열린다 (항해: core/year.ts의 voyage) */
function anchored(t: Turning): Turning {
  const island = ISLAND_OF[t.id];
  if (island && !t.when.some((c) => c.c === 'island')) t.when.push({ c: 'island', is: [island] });
  return t;
}

export const TURNINGS: Turning[] = GROUPS.flat().map(anchored).map(landlocked);
export const TURNING_BY_ID: Record<string, Turning> = Object.fromEntries(TURNINGS.map((t) => [t.id, t]));
