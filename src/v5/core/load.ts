// 저장 읽기: 저장해 둔 JSON을 인생 · 도감으로 되살린다. 옛 저장에 빠진 칸은 기본값으로 채운다.
import { emptyMeta5, type Meta5 } from './meta';
import { invariants5 } from './reduce';
import { emptyLife } from './state';
import type { Life5 } from './types';

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

/** got에 빠진(undefined인) 칸을 def의 값으로 채운 새 객체 */
function withDefaults(got: Obj, def: object): Obj {
  const out: Obj = { ...got };
  for (const [k, v] of Object.entries(def)) if (out[k] === undefined) out[k] = v;
  return out;
}

/**
 * 저장된 인생을 읽는다. schema가 5가 아니거나 객체가 아니면 null.
 * 빠진 칸은 emptyLife(seed)의 값으로 채운다(맨 위 칸과 stats · hero · growth의 칸). 채운 뒤에도 불변 조건을 어기면 null.
 */
export function normalizeLife5(x: unknown): Life5 | null {
  if (!isObj(x) || x.schema !== 5) return null;
  const seed = isObj(x.rng) && typeof x.rng.seed === 'number' ? x.rng.seed : 0;
  const def = emptyLife(seed);
  const s = withDefaults(x, def);
  for (const k of ['stats', 'hero', 'growth'] as const) s[k] = isObj(s[k]) ? withDefaults(s[k] as Obj, def[k]) : def[k];
  const life = s as unknown as Life5;
  try {
    return invariants5(life, true).length === 0 ? life : null;
  } catch {
    return null;                               // 칸의 모양이 깨져 확인조차 못 하면 읽지 않는다
  }
}

/** 저장된 도감을 읽는다. 못 읽으면 빈 도감, 빠진 칸은 빈 값으로 채운다. */
export function normalizeMeta5(x: unknown): Meta5 {
  if (!isObj(x) || x.schema !== 5) return emptyMeta5();
  return withDefaults(x, emptyMeta5()) as unknown as Meta5;
}
