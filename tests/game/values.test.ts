// tests/game/values.test.ts
import { describe, expect, it } from 'vitest';
import { emptyLife } from '../../src/core/state';
import { addValues, isDeep, leanPick, topValues } from '../../src/core/values';
import { addMark } from '../../src/core/strengths';
import { rngOf } from '../../src/shared/core/rng';
import { V } from '../../src/data/balance';

describe('가치관', () => {
  it('쌓이고, 0~100을 벗어나지 않는다', () => {
    const s = emptyLife(1);
    expect(addValues(s, { loyalty: 6 })).toEqual(['loyalty']);
    addValues(s, { loyalty: 500 });
    expect(s.values.loyalty).toBe(100);
    addValues(s, { loyalty: -500 });
    expect(s.values.loyalty).toBe(0);
  });
  it('높을수록 덜 오른다 (V.value.soften, 과제 13)', () => {
    const s = emptyLife(1);
    addValues(s, { loyalty: 50 });
    const before = s.values.loyalty;
    addValues(s, { loyalty: 10, peace: 10 });
    const softened = 10 * (1 - (before / V.value.max) * V.value.soften);
    expect(s.values.loyalty - before).toBeCloseTo(softened, 5);
    expect(s.values.peace).toBeCloseTo(10, 5);   // 0에서는 그대로 오른다
    expect(V.value.soften).toBeGreaterThanOrEqual(0); expect(V.value.soften).toBeLessThanOrEqual(1);
  });
  it('내리는 쪽은 누그러뜨리지 않는다', () => {
    const s = emptyLife(1);
    addValues(s, { loyalty: 80 });
    const before = s.values.loyalty;
    addValues(s, { loyalty: -10 });
    expect(before - s.values.loyalty).toBeCloseTo(10, 5);
  });
  it('큰 계기는 보통 선택의 세 배를 움직인다', () => {
    expect(V.value.moment).toBe(V.value.door * 3);
  });
  it('가장 높은 것을 순서대로 내고, 0인 것은 뺀다', () => {
    const s = emptyLife(1);
    addValues(s, { freedom: 30, loyalty: 50 });
    expect(topValues(s, 2)).toEqual(['loyalty', 'freedom']);
    expect(topValues(emptyLife(1))).toEqual([]);
  });
  it('깊은지는 기준선으로 가른다', () => {
    const s = emptyLife(1);
    // 과제 13부터 addValues는 높을수록 덜 오르므로(soften), 기준선만 보려고 점수를 바로 놓는다
    s.values.dominion = V.value.deep - 1;
    expect(isDeep(s, 'dominion')).toBe(false);
    s.values.dominion = V.value.deep;
    expect(isDeep(s, 'dominion')).toBe(true);
  });
  it('기울여 뽑기는 높은 가치관 쪽으로 기울지만 정해지지는 않는다', () => {
    const list = [{ id: 'stay', lean: { loyalty: 1 } }, { id: 'run', lean: { peace: 1 } }];
    let stay = 0;
    for (let i = 0; i < 1000; i++) {
      const s = emptyLife(i); addValues(s, { loyalty: 90 });
      if (leanPick(s, rngOf(s.rng), list, (x) => x.lean)!.id === 'stay') stay++;
    }
    expect(stay).toBeGreaterThan(700);
    expect(stay).toBeLessThan(1000);
  });
});

describe('정신적 강점', () => {
  it('표시가 정해진 수만큼 쌓이면 얻고, 두 번 얻지 않는다', () => {
    const s = emptyLife(1);
    expect(addMark(s, 'unyielding')).toBeNull();
    expect(addMark(s, 'unyielding')).toBeNull();
    expect(addMark(s, 'unyielding')).toBe('unyielding');
    expect(s.strengths).toEqual(['unyielding']);
    expect(addMark(s, 'unyielding')).toBeNull();
  });
});
