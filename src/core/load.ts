// 저장 읽기: 저장해 둔 JSON을 인생 · 도감으로 되살린다. 옛 저장에 빠진 칸은 기본값으로 채운다.
import { V } from '../data/balance';
import { RETIRED_FRUIT_IDS } from '../shared/data/fruits';
import { EPISODE_TURNINGS } from '../data/episodes';
import { entryPass } from '../data/voyage';
import { VALUE_IDS } from '../data/values';
import { personalityCell } from './personality';
import { topValues } from './values';
import { mainBranch } from './year';
import { emptyMeta5, type Meta5 } from './meta';
import { invariants5 } from './reduce';
import { emptyLife } from './state';
import type { Life5 } from './types';

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

const ENTRY_PASS_CHOICES = EPISODE_TURNINGS.flatMap((scene) => scene.doors.flatMap((door, i) =>
  door.fx.flatMap((effect) => effect.op === 'entryPass'
    ? [{ choice: `${scene.id}#${i}`, flag: entryPass(effect.gate), home: effect.gate }] : []),
));

/** 인생의 맨 위 칸 가운데 목록이어야 하는 것과 객체여야 하는 것 */
const LIFE_ARRAYS = ['log', 'timeline', 'people', 'flags', 'queue', 'tried', 'known', 'closed', 'recentLines'] as const;
const LIFE_OBJECTS = ['hero', 'growth', 'values', 'personality', 'stats', 'seenCount', 'vows'] as const;

/**
 * 떠 있는 일의 모양이 맞는가: null이거나, 종류(door · fight · battle · ending)에 따라 화면이 읽는 칸을 갖춘 객체.
 * door: doors 목록과 글자 title · body / fight · battle: foe 객체 / battle: battle.events · battle.units 목록 / ending: 글자 cause
 */
function pendingOk(p: unknown): boolean {
  if (p === null) return true;
  if (!isObj(p)) return false;
  switch (p.kind) {
    case 'door': return Array.isArray(p.doors) && typeof p.title === 'string' && typeof p.body === 'string';
    case 'fight': return isObj(p.foe);
    case 'battle': return isObj(p.foe) && isObj(p.battle) && Array.isArray(p.battle.events) && Array.isArray(p.battle.units);
    case 'ending': return typeof p.cause === 'string';
    default: return false;
  }
}

/** got에 빠진(undefined인) 칸을 def의 값으로 채운 새 객체 */
function withDefaults(got: Obj, def: object): Obj {
  const out: Obj = { ...got };
  for (const [k, v] of Object.entries(def)) if (out[k] === undefined) out[k] = v;
  return out;
}

/**
 * 저장된 인생을 읽는다. schema가 5가 아니거나 객체가 아니면 null.
 * 빠진 칸은 emptyLife(seed)의 값으로 채운다(맨 위 칸과 stats · hero · growth의 칸). 채운 뒤에도 불변 조건을 어기거나\n * 떠 있는 일의 모양이 틀리면 null.
 */
export function normalizeLife5(x: unknown): Life5 | null {
  if (!isObj(x) || x.schema !== 5) return null;
  const oldPersonality = x.personality === undefined;
  const seed = isObj(x.rng) && typeof x.rng.seed === 'number' ? x.rng.seed : 0;
  const def = emptyLife(seed);
  // 처지가 된 나이를 모르는 옛 저장은 지금부터 센다
  const s = withDefaults(x, { ...def, standingSince: typeof x.age === 'number' ? x.age : def.standingSince });
  // 큰 칸의 모양이 틀리면(목록이어야 할 곳에 객체가 있는 등) 고쳐 읽지 않는다
  if (LIFE_ARRAYS.some((k) => !Array.isArray(s[k])) || LIFE_OBJECTS.some((k) => !isObj(s[k]))) return null;
  if (isObj(s.vows) && (!Array.isArray(s.vows.history) || (s.vows.active !== null && !isObj(s.vows.active)))) return null;
  if (!pendingOk(s.pending)) return null;      // 손으로 고친 파일의 깨진 창이 화면을 무너뜨리지 않게
  // 태어난 형편을 모르는 옛 저장은 지금의 형편으로 (몰락을 세지 않는다)
  if (isObj(s.hero) && s.hero.bornWealth === undefined) s.hero = { ...s.hero, bornWealth: s.hero.wealth };
  for (const k of ['stats', 'hero', 'growth'] as const) s[k] = withDefaults(s[k] as Obj, def[k]);
  const life = s as unknown as Life5;
  // 증표 기능이 생기기 전에 보상 문을 고른 인생도 그 선택을 인정한다.
  for (const { choice, flag, home } of ENTRY_PASS_CHOICES) {
    if (life.hero.home !== home && life.tried.includes(choice) && !life.flags.includes(flag)) life.flags = [...life.flags, flag];
  }
  if (life.hero.fruit?.id === 'gomu') life.hero.fruit.id = 'nika';
  else if (life.hero.fruit && RETIRED_FRUIT_IDS.has(life.hero.fruit.id)) {
    life.hero.fruit = null;
    life.growth.tier.fruit = 0;
    life.growth.mastery.fruit = 0;
  }
  if (life.pending?.kind === 'door' && life.pending.turning === 'late_old_design' &&
      (!life.flags.includes('sharedFlightDesign') || !life.people.some((p) => p.alive && p.relation === '어릴 적 동무'))) {
    life.pending = null;
  }
  if (oldPersonality) {
    const top = topValues(life, 1)[0];
    if (top) life.personality = { ...personalityCell(top), pullRow: 0, pullCol: 0, choices: 3, hold: 0, established: true };
  } else if (isObj(life.personality)) {
    const p = life.personality;
    life.personality = {
      ...p,
      hold: p.hold === undefined ? 0 : p.hold,
      established: p.established === undefined ? (Number(p.choices) >= 3) : p.established,
    } as Life5['personality'];
  }
  // 초기 서약 저장의 진행 칸이 없으면 현재 자리에서 이어 간다.
  if (life.vows?.active) {
    life.vows.active.island ??= life.hero.island;
    life.vows.active.progress ??= [];
  }
  // 4단계에서 헌신(devotion)이 빠지고 탐욕(greed)이 들어왔다: 옛 점수는 버린다
  if (isObj(life.values)) delete (life.values as Record<string, unknown>).devotion;
  // 선호도가 없는 옛 저장: 지금까지 간 만큼(단계와 숙련)을 선호도로 삼고, 지금의 길은 알린 것으로 친다
  const g = life.growth;
  if (isObj(g) && isObj(g.pref) && isObj(g.tier) && isObj(g.mastery) && Object.values(g.pref).every((v) => !v)) {
    for (const b of Object.keys(g.pref) as (keyof typeof g.pref)[]) g.pref[b] = (g.tier[b] ?? 0) * V.growth.tierUp + (g.mastery[b] ?? 0);
    if (life.age >= V.growth.pref.pathAge) g.path = mainBranch(life);
  }
  try {
    return invariants5(life, true).length === 0 ? life : null;
  } catch {
    return null;                               // 칸의 모양이 깨져 확인조차 못 하면 읽지 않는다
  }
}

/** 저장된 도감을 읽는다. 못 읽으면 빈 도감, 빠지거나 모양이 틀린 칸은 빈 값으로 채운다. */
export function normalizeMeta5(x: unknown): Meta5 {
  const def = emptyMeta5();
  if (!isObj(x) || x.schema !== 5) return def;
  const m = withDefaults(x, def);
  if (!isObj(m.doors)) m.doors = def.doors;
  // 없어진 가치관(헌신)은 도감에서 지운다
  else for (const [k, v] of Object.entries(m.doors)) if (Array.isArray(v)) (m.doors as Obj)[k] = v.filter((x) => VALUE_IDS.includes(x as never));
  for (const k of ['fruits', 'people', 'hall'] as const) if (!Array.isArray(m[k])) m[k] = def[k];
  m.fruits = [...new Set((m.fruits as unknown[]).filter((id): id is string => typeof id === 'string' && !RETIRED_FRUIT_IDS.has(id)).map((id) => id === 'gomu' ? 'nika' : id))];
  if (typeof m.lives !== 'number' || !Number.isFinite(m.lives)) m.lives = def.lives;
  return m as unknown as Meta5;
}
