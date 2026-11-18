// 가치관 점수: 쌓기, 높은 것 고르기, 깊은지 가르기, 가치관 쪽으로 기울여 뽑기.
import { weighted, type Rng } from '../../core/rng';
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

/**
 * 특별한 문의 문턱: 나이에 따라 V.value.special에서 찾는다.
 * earned: 앞선 선택의 표시로 이미 잠긴 문이면 한 칸 아래 나이대의 문턱을 쓴다 (그 길을 걸어온 증거가 있으니 같은 것을 두 번 묻지 않는다)
 */
export function specialNeed(age: number, earned = false): number {
  const bands = V.value.special;
  const i = bands.findIndex((b) => age <= b.to);
  const at = i < 0 ? bands.length - 1 : i;
  return bands[earned ? Math.max(0, at - 1) : at].need;
}

/** 이 가치관으로 특별한 문을 떠올릴 수 있는가 (깊음과 따로, 나이에 맞춘 문턱) */
export function opensSpecial(s: Life5, id: ValueId, earned = false): boolean {
  return s.values[id] >= specialNeed(s.age, earned);
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
