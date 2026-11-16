// 모든 전환점. 파일 하나가 한 묶음이다. 묶음을 더하려면 아래 목록에 한 줄을 보탠다.
import type { Cond, Fx, Turning } from '../../core/types';
import { HOMETOWNS } from '../../../data/births';
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

const GROUPS: Turning[][] = [
  CHILDHOOD,
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
];

/** 바다에 닿지 않는 고향의 마을: 조우(코끼리 등), 하늘섬(구름 위), 어인섬(바닷속) */
export const INLAND_TOWNS = HOMETOWNS.filter((t) => ['zou', 'sky', 'fishman'].includes(t.home)).map((t) => t.name);
/** 세계정부와 바다의 사건이 닿지 않는 외딴 고향의 마을: 위의 셋과 쇄국한 와노쿠니 */
export const ISOLATED_TOWNS = HOMETOWNS.filter((t) => ['zou', 'sky', 'fishman', 'wano'].includes(t.home)).map((t) => t.name);
/** 항구 · 배 · 헤엄 같은 바닷가의 글 */
export const COASTAL_WORDS = /부두|항구|어부|고깃배|바닷가|해변|갯벌|선창|선착장|등대|배를|배에|배가|배 한|돛|해적선|군함|헤엄|파도|모래사장|짐꾼|뱃사람|선원|바다에 뛰어|앞바다|어촌|포구|조선소|그물|방파제|방조제|해안|바닷물|썰물|밀물/;
/** 해군 · 현상금 · 세계정부의 글 */
export const WORLD_GOV_WORDS = /해군|지부|현상금|세계정부|수배/;
/** 바다에 나가야 되는 처지 */
const SEA_STANDINGS = ['pirate', 'marine', 'revolution', 'bountyHunter', 'cp', 'warlord'];
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

export const TURNINGS: Turning[] = GROUPS.flat().map(landlocked);
export const TURNING_BY_ID: Record<string, Turning> = Object.fromEntries(TURNINGS.map((t) => [t.id, t]));
