// 저장 읽기: 저장해 둔 JSON을 인생 · 도감으로 되살린다. 옛 저장에 빠진 칸은 기본값으로 채운다.
import { emptyMeta5, type Meta5 } from './meta';
import { invariants5 } from './reduce';
import { emptyLife } from './state';
import type { Life5 } from './types';

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

/** 인생의 맨 위 칸 가운데 목록이어야 하는 것과 객체여야 하는 것 */
const LIFE_ARRAYS = ['log', 'timeline', 'people', 'flags', 'queue', 'tried', 'known', 'closed'] as const;
const LIFE_OBJECTS = ['hero', 'growth', 'values', 'stats', 'seenCount'] as const;

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
  const seed = isObj(x.rng) && typeof x.rng.seed === 'number' ? x.rng.seed : 0;
  const def = emptyLife(seed);
  // 처지가 된 나이를 모르는 옛 저장은 지금부터 센다
  const s = withDefaults(x, { ...def, standingSince: typeof x.age === 'number' ? x.age : def.standingSince });
  // 큰 칸의 모양이 틀리면(목록이어야 할 곳에 객체가 있는 등) 고쳐 읽지 않는다
  if (LIFE_ARRAYS.some((k) => !Array.isArray(s[k])) || LIFE_OBJECTS.some((k) => !isObj(s[k]))) return null;
  if (!pendingOk(s.pending)) return null;      // 손으로 고친 파일의 깨진 창이 화면을 무너뜨리지 않게
  for (const k of ['stats', 'hero', 'growth'] as const) s[k] = withDefaults(s[k] as Obj, def[k]);
  const life = s as unknown as Life5;
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
  for (const k of ['fruits', 'people', 'hall'] as const) if (!Array.isArray(m[k])) m[k] = def[k];
  if (typeof m.lives !== 'number' || !Number.isFinite(m.lives)) m.lives = def.lives;
  return m as unknown as Meta5;
}
