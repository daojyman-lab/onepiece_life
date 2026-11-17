// 가치관 점수: 쌓기, 높은 것 고르기, 깊은지 가르기, 가치관 쪽으로 기울여 뽑기.
import { weighted, type Rng } from '../shared/core/rng';
import { V } from '../data/balance';
import { VALUE_IDS } from '../data/values';
import type { Life5, ValueId, Values } from './types';

/** 점수를 더한다(mult배). 0~최대로 자르고, 실제로 오른 가치관의 id를 돌려준다. */
export function addValues(s: Life5, add: Partial<Values>, mult = 1): ValueId[] {
  const rose: ValueId[] = [];
  for (const id of VALUE_IDS) {
    const d = add[id];
    if (d === undefined) continue;
    const before = s.values[id];
    // 오르는 쪽만 누그러뜨린다: 높을수록 덜 오른다 (V.value.soften 0이면 그대로)
    const gain = d > 0 ? d * mult * (1 - (before / V.value.max) * V.value.soften) : d * mult;
    s.values[id] = Math.min(V.value.max, Math.max(0, before + gain));
    if (s.values[id] > before) rose.push(id);
  }
  return rose;
}

/** 높은 순으로 n개. 점수가 0인 것은 뺀다. 같으면 VALUE_IDS 순서. */
export function topValues(s: Life5, n: number = VALUE_IDS.length): ValueId[] {
  return VALUE_IDS.filter((id) => s.values[id] > 0)
    .sort((a, b) => s.values[b] - s.values[a])
    .slice(0, n);
}

export function isDeep(s: Life5, id: ValueId): boolean {
  return s.values[id] >= V.value.deep;
}

/** 가치관 쪽으로 기울여 하나를 뽑는다. 가중치 (기본값 + Σ lean × 점수) × weight */
export function leanPick<T>(s: Life5, r: Rng, list: T[], lean: (x: T) => Partial<Values>, weight: (x: T) => number = () => 1): T | null {
  return weighted(r, list, (x) => {
    const l = lean(x);
    let w = V.value.leanBase;
    for (const id of VALUE_IDS) w += (l[id] ?? 0) * s.values[id];
    return w * weight(x);
  });
}
