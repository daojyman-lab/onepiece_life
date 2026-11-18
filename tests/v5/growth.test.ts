// tests/v5/growth.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { apply5, reduce5 } from '../../src/v5/core/reduce';
import { addValues } from '../../src/v5/core/values';
import { activityOf, growPart, mainBranch, notePath, power5 } from '../../src/v5/core/year';
import { LINES } from '../../src/v5/data/lines';
import { MINORS } from '../../src/v5/data/minors';
import { applyFx } from '../../src/v5/core/fx';
import { effectiveStats5 } from '../../src/v5/core/body';
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

describe('패기 획득 전 숙련 제한', () => {
  it('획득 전에는 자습·효과·자동 수련으로 패기 숙련이 오르지 않는다', () => {
    const s = newLife5(1701);
    s.pending = null;
    s.growth.pref.observation = 80;
    applyFx(s, [{ op: 'mastery', branch: 'observation', add: 60 }, { op: 'tier', branch: 'observation', to: 2 }]);
    expect(s.growth.mastery.observation).toBe(0);
    expect(s.growth.tier.observation).toBe(0);
    expect(mainBranch(s)).not.toBe('observation');
    growPart(s, 'study', rngOf(s.rng));
    expect(s.growth.mastery.observation).toBe(0);
  });
  it('획득 플래그가 생긴 뒤에만 패기 숙련이 오른다', () => {
    const s = newLife5(1702);
    applyFx(s, [{ op: 'flag', id: 'haki:observation' }, { op: 'mastery', branch: 'observation', add: 40 }]);
    expect(s.growth.mastery.observation).toBe(40);
    expect(mainBranch(s)).toBe('observation');
  });
});

describe('패기별 능력치 버프', () => {
  it('무장색·견문색·패왕색의 서로 다른 버프가 곱연산으로 중첩된다', () => {
    const s = newLife5(1710);
    s.hero.base = { str: 100, spd: 100, vit: 100, int: 100, wil: 100, luk: 100 };
    applyFx(s, [
      { op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 2 },
      { op: 'flag', id: 'haki:observation' }, { op: 'tier', branch: 'observation', to: 3 },
      { op: 'flag', id: 'haki:conqueror' }, { op: 'tier', branch: 'conqueror', to: 1 },
    ]);
    const st = effectiveStats5(s);
    expect(st.str).toBeCloseTo(100 * 1.10 * 1.03);
    expect(st.vit).toBeCloseTo(100 * 1.14 * 1.03);
    expect(st.spd).toBeCloseTo(100 * 1.18 * 1.03);
    expect(st.int).toBeCloseTo(100 * 1.03);
  });
  it('패왕색 단계가 전체 전투 능력치의 공통 최고 단계 배율을 대신하지 않는다', () => {
    const s = newLife5(1711);
    s.hero.base = { str: 10, spd: 10, vit: 10, int: 10, wil: 10, luk: 10 };
    applyFx(s, [{ op: 'flag', id: 'haki:conqueror' }, { op: 'tier', branch: 'conqueror', to: 6 }]);
    expect(power5(s)).toBeLessThan(60 * V.growth.tierCurve[6]);
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

describe('아이의 일', () => {
  /** 열여섯 살이 될 때까지 첫 번째 열린 문으로 키운다 */
  function to16(seed: number, wealth: 'poor' | 'common'): Life5 {
    const s = newLife5(seed, { wealth, lineage: 'commoner' });
    for (let i = 0; i < 5000 && s.age < 16 && s.pending?.kind !== 'ending'; i++) {
      if (s.pending?.kind === 'door') apply5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
      else apply5(s, s.pending ? { type: 'answer', index: 1 } : { type: 'step' });
    }
    return s;
  }
  const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)];
  it('가난한 집 아이는 살려고 일하지만, 열여섯에 평범한 집 아이보다 돈이 많지 않다', () => {
    const poor = Array.from({ length: 120 }, (_, i) => to16(500 + i, 'poor').hero.money);
    const common = Array.from({ length: 120 }, (_, i) => to16(500 + i, 'common').hero.money);
    expect(median(poor)).toBeLessThan(median(common));
  });
  it('아이의 품삯은 어른의 품삯보다 훨씬 적다', () => {
    expect(V.growth.kidWorkMoney).toBeLessThan(V.growth.workMoney / 2);
  });
});

describe('선호도와 걷는 길', () => {
  it('검술 재능을 타고나면 검술 쪽으로 기운 아이로 시작한다', () => {
    const s = Array.from({ length: 300 }, (_, i) => newLife5(500 + i)).find((x) => x.hero.talents.includes('swordTalent') && !x.hero.talents.includes('fistTalent'))!;
    expect(s.growth.pref.sword).toBeGreaterThanOrEqual(V.growth.pref.talent);
    expect(mainBranch(s)).toBe('sword');
  });
  it('수련할수록 그 길의 선호도가 쌓이고, 고른 일의 숙련이 조금 끌어당긴다', () => {
    const s = newLife5(3); s.growth.pref = { ...s.growth.pref, sword: 30, fist: 0 };
    applyFx(s, [{ op: 'mastery', branch: 'fist', add: 10 }]);
    expect(s.growth.pref.fist).toBe(10 * V.growth.pref.fromMastery);
    expect(mainBranch(s)).toBe('sword');           // 한 번 고른 일로 길이 뒤집히지 않는다
  });
  it('스승을 들이면 그 갈래로 길이 바뀌고, 큰 일로 기록과 연표에 남는다', () => {
    const s = newLife5(4); s.age = 14; s.growth.pref = { ...s.growth.pref, sword: 40 };
    notePath(s);
    expect(s.growth.path).toBe('sword');
    applyFx(s, [{ op: 'master', name: '떠돌이 무인', branch: 'fist', cap: 4, years: 3, paid: false }]);
    notePath(s);
    expect(s.growth.path).toBe('fist');
    expect(s.timeline.at(-1)?.text).toContain('떠돌이 무인');
    expect(s.timeline.at(-1)?.text).toContain('체술');
    expect(s.log.some((l) => l.weight === 'heavy' && l.text.includes('내려놓고'))).toBe(true);
    s.growth.master = null;                         // 스승이 떠나도 길은 그대로다
    notePath(s);
    expect(s.growth.path).toBe('fist');
  });
  it('목검 · 칼을 쥐는 기록 줄과 자잘한 일은 검술의 길(또는 아직 길이 없는 아이)에게만 온다', () => {
    for (const l of LINES.filter((x) => /목검을|칼 쓰는/.test(x.text))) expect(l.when.some((c) => c.c === 'path' && !c.is.includes('fist') && !c.is.includes('gun')), l.text).toBe(true);
    const m = MINORS.find((x) => x.id === 'm_kid_wooden_sword')!;
    expect(m.when).toContainEqual({ c: 'path', is: ['sword', 'none'] });
  });
});
