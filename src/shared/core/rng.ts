// 씨앗 기반 난수. Math.random을 쓰지 않는다.
// 상태 안의 { seed, cursor } 로 n번째 난수를 계산한다. 같은 씨앗과 같은 입력이면 같은 결과다.

export type Rng = () => number;

function mix(seed: number, cursor: number): number {
  let z = (seed ^ Math.imul(cursor + 1, 0x9e3779b9)) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
  z = (z ^ (z >>> 16)) >>> 0;
  return z / 4294967296;
}

/** 상태 안의 rng 자리를 앞으로 밀며 난수를 내는 함수를 만든다. holder는 바뀐다. */
export function rngOf(holder: { seed: number; cursor: number }): Rng {
  return () => mix(holder.seed, holder.cursor++);
}

export function int(r: Rng, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}
export function pick<T>(r: Rng, list: readonly T[]): T {
  return list[Math.floor(r() * list.length)];
}
export function chance(r: Rng, p: number): boolean {
  return r() < p;
}
export function weighted<T>(r: Rng, list: readonly T[], weight: (x: T) => number): T | null {
  let total = 0;
  for (const x of list) total += Math.max(0, weight(x));
  if (total <= 0) return null;
  let v = r() * total;
  for (const x of list) {
    v -= Math.max(0, weight(x));
    if (v < 0) return x;
  }
  return list[list.length - 1];
}
export function shuffle<T>(r: Rng, list: readonly T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function hashString(s: string): number {
  let h = 2166136261;
  for (const ch of s) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619); }
  return h >>> 0;
}
