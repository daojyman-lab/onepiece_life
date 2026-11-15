// tests/v5/growth.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { addValues } from '../../src/v5/core/values';
import { activityOf, power5 } from '../../src/v5/core/year';
import { applyFx } from '../../src/v5/core/fx';
import { rngOf } from '../../src/core/rng';
import { V } from '../../src/v5/data/balance';
import type { Life5, ValueId } from '../../src/v5/core/types';

function grow(seed: number, v: ValueId, wealth: 'poor' | 'common' = 'common') {
  let s: Life5 = { ...newLife5(seed), pending: null, age: 16 };
  s.hero.wealth = wealth; s.hero.standing = 'civil';
  addValues(s, { [v]: 80 });
  applyFx(s, [{ op: 'mastery', branch: 'sword', add: 1 }]);
  for (let i = 0; i < 4 * 15; i++) s = reduce5({ ...s, pending: null }, { type: 'step' });
  return s;
}
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const seeds = Array.from({ length: 30 }, (_, i) => 500 + i);

describe('가치관이 정하는 한 해', () => {
  it('야망이 깊은 사람은 평온한 사람보다 훨씬 자주 수련한다', () => {
    const count = (v: ValueId) => { let n = 0; for (let i = 0; i < 600; i++) { const s = newLife5(i); s.age = 20; s.hero.standing = 'civil'; s.hero.wealth = 'common'; addValues(s, { [v]: 80 }); if (activityOf(s, rngOf(s.rng)) === 'train') n++; } return n; };
    expect(count('ambition')).toBeGreaterThan(count('peace') * 2);
  });
  it('가난한 집 아이는 가치관이 무엇이든 일하는 토막이 많다', () => {
    const work = (w: 'poor' | 'noble') => { let n = 0; for (let i = 0; i < 600; i++) { const s = newLife5(i); s.age = 12; s.hero.wealth = w; addValues(s, { ambition: 80 }); if (activityOf(s, rngOf(s.rng)) === 'work') n++; } return n; };
    expect(work('poor')).toBeGreaterThan(work('noble') * 3);
  });
  it('야망으로 15년을 산 사람이 평온하게 산 사람보다 강하다', () => {
    expect(avg(seeds.map((x) => power5(grow(x, 'ambition'))))).toBeGreaterThan(avg(seeds.map((x) => power5(grow(x, 'peace')))) * 1.3);
  });
  it('돈으로 들인 스승은 4단계까지만 가르친다', () => {
    let s: Life5 = { ...newLife5(8), pending: null, age: 16 };
    s.hero.standing = 'civil'; addValues(s, { ambition: 100 });
    applyFx(s, [{ op: 'master', name: '도장 사범', branch: 'sword', cap: 6, years: 40, paid: true }]);
    for (let i = 0; i < 4 * 40; i++) s = reduce5({ ...s, pending: null }, { type: 'step' });
    expect(s.growth.tier.sword).toBeLessThanOrEqual(V.growth.paidCap);
  });
  it('스승이 없으면 3단계를 넘지 못한다', () => {
    const s = grow(9, 'ambition');
    expect(s.growth.tier.sword).toBeLessThanOrEqual(3);
  });
});

describe('숙련과 단계의 상한', () => {
  /** 숙련을 크게 여러 번 더해 상한까지 밀어 올린다 */
  function pushSword(master?: { cap: number; paid: boolean }) {
    const s = newLife5(1);
    if (master) applyFx(s, [{ op: 'master', name: '스승', branch: 'sword', cap: master.cap, years: 10, paid: master.paid }]);
    for (let i = 0; i < 10; i++) applyFx(s, [{ op: 'mastery', branch: 'sword', add: 1000 }]);
    return s.growth;
  }
  it('숙련이 100에 닿으면 단계가 하나 오르고 숙련은 0으로 돌아간다', () => {
    const s = newLife5(1);
    applyFx(s, [{ op: 'mastery', branch: 'sword', add: 60 }]);
    expect(s.growth.tier.sword).toBe(0);
    applyFx(s, [{ op: 'mastery', branch: 'sword', add: 40 }]);
    expect(s.growth.tier.sword).toBe(1);
    expect(s.growth.mastery.sword).toBe(0);
  });
  it('스승이 없으면 3단계에서 멈추고 숙련은 100에 머문다', () => {
    const g = pushSword();
    expect(g.tier.sword).toBe(V.growth.noMasterCap);
    expect(g.mastery.sword).toBe(V.growth.tierUp);
  });
  it('돈으로 들인 스승은 상한이 6이어도 4단계까지만', () => {
    expect(pushSword({ cap: 6, paid: true }).tier.sword).toBe(V.growth.paidCap);
  });
  it('돈으로 들이지 않은 스승은 6단계까지 가르친다', () => {
    expect(pushSword({ cap: 6, paid: false }).tier.sword).toBe(V.growth.maxTier);
  });
  it('약한 스승도 스승 없을 때의 상한 3보다 낮추지는 않는다', () => {
    expect(pushSword({ cap: 2, paid: false }).tier.sword).toBe(V.growth.noMasterCap);
  });
});
