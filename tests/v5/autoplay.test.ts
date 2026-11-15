// tests/v5/autoplay.test.ts
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/core/rng';
import { autoplay5, choose, summarize } from '../../src/v5/core/autoplay';
import { newLife5 } from '../../src/v5/core/state';
import { resolveDoors } from '../../src/v5/core/turning';
import { TURNINGS } from '../../src/v5/data/turnings';
import { VALUE_IDS } from '../../src/v5/data/values';
import type { Life5, ValueId, Wealth } from '../../src/v5/core/types';

/** 손으로 만든 끝난 인생 */
function life(o: {
  end: number; stopsAt?: number[]; tries?: number; empty?: number; seen?: Record<string, number>;
  met?: number; born?: Wealth; wealth?: Wealth; top?: ValueId;
}): Life5 {
  const s = newLife5(1);
  s.pending = { kind: 'ending', cause: '노환' };
  s.age = o.end; s.ended = { cause: '노환', age: o.end };
  s.stats.stopsAt = o.stopsAt ?? [];
  s.stats.stops = s.stats.stopsAt.length;
  s.stats.stopTries = o.tries ?? 0; s.stats.emptyStops = o.empty ?? 0;
  s.stats.namedMet = o.met ?? 0;
  s.seenCount = o.seen ?? {};
  s.hero.bornWealth = o.born ?? 'common'; s.hero.wealth = o.wealth ?? o.born ?? 'common';
  for (const id of VALUE_IDS) s.values[id] = 0;
  if (o.top) s.values[o.top] = 50;
  return s;
}

describe('시뮬레이터의 새 지표', () => {
  it('나이대별 한 해의 멈춤: 3~15살, 16~35살, 36살 이후', () => {
    const r = summarize([life({ end: 68, stopsAt: [5, 5, 20, 40] })]);
    expect(r.stopsByBand.kid).toBeCloseTo(2 / 13);
    expect(r.stopsByBand.youth).toBeCloseTo(1 / 20);
    expect(r.stopsByBand.later).toBeCloseTo(1 / 33);
  });
  it('나이대의 해는 인생들을 합쳐 센다. 일찍 끝난 인생은 뒤 나이대에 해가 없다', () => {
    const r = summarize([life({ end: 10, stopsAt: [4, 6] }), life({ end: 20, stopsAt: [18] })]);
    expect(r.stopsByBand.kid).toBeCloseTo(2 / (8 + 13));
    expect(r.stopsByBand.youth).toBeCloseTo(1 / 5);
    expect(r.stopsByBand.later).toBe(0);
  });
  it('16살 이후 멈춤이 없던 해의 비율', () => {
    // 16~25살 열 해 가운데 멈춘 해는 18 · 20 두 해 (같은 해의 두 번은 한 해)
    const r = summarize([life({ end: 25, stopsAt: [5, 18, 18, 20] })]);
    expect(r.quietYears).toBeCloseTo(8 / 10);
  });
  it('같은 전환점이 가장 많이 열린 횟수와 서로 다른 전환점의 수', () => {
    const lives = [
      life({ end: 50, seen: { a: 1, b: 3 } }),
      life({ end: 50, seen: { a: 2 } }),
      life({ end: 50, seen: { a: 7, b: 1, c: 1 } }),
    ];
    const r = summarize(lives);
    expect(r.maxSeen).toEqual({ p50: 3, p95: 3, max: 7 });
    expect(r.distinct).toBeCloseTo(6 / 3);
  });
  it('멈추려 했는데 띄울 것이 없던 비율, 이름 있는 상대와 마주친 인생의 비율', () => {
    const r = summarize([life({ end: 50, tries: 10, empty: 1, met: 2 }), life({ end: 50, tries: 30, empty: 3 })]);
    expect(r.emptyPool).toBeCloseTo(4 / 40);
    expect(r.namedLives).toBeCloseTo(1 / 2);
  });
  it('가난하지 않게 태어난 인생 가운데 집안이 몰락한 비율', () => {
    const r = summarize([
      life({ end: 50, born: 'poor' }),
      life({ end: 50, born: 'noble', wealth: 'poor' }),
      life({ end: 50, born: 'common' }),
      life({ end: 50, born: 'comfortable', wealth: 'noble' }),
    ]);
    expect(r.ruined).toBeCloseTo(1 / 3);
  });
  it('1위 가치관의 비율은 모든 가치관을 담는다', () => {
    const r = summarize([life({ end: 50, top: 'justice' }), life({ end: 50, top: 'justice' }), life({ end: 50, top: 'peace' }), life({ end: 50, top: 'freedom' })]);
    expect(Object.keys(r.topShare).sort()).toEqual([...VALUE_IDS].sort());
    expect(r.topShare.justice).toBeCloseTo(0.5);
    expect(r.topShare.peace).toBeCloseTo(0.25);
    expect(r.topShare.ambition).toBe(0);
  });
  it('자동 플레이는 멈춘 나이, 멈추려던 횟수, 태어난 형편을 적어 둔다', () => {
    const { s } = autoplay5(9000, 'random');
    expect(s.stats.stopsAt.length).toBe(s.stats.stops);
    expect(s.stats.stopTries).toBeGreaterThan(0);
    expect(s.stats.emptyStops).toBeLessThanOrEqual(s.stats.stopTries);
    expect(s.hero.bornWealth).toBeDefined();
  });
});

describe('lean 정책', () => {
  it('같은 씨앗에 같은 결과', () => {
    const a = autoplay5(77, 'lean'), b = autoplay5(77, 'lean');
    expect(a.stuck).toBe(false);
    expect(JSON.stringify(a.s)).toBe(JSON.stringify(b.s));
  });
  it('한 가치관을 크게 올려 둔 인생은 그 가치관이 붙은 문을 무작위보다 자주 고른다', () => {
    const s = newLife5(1);
    let found: { id: ValueId; turning: string; with: number[] } | null = null;
    for (const t of TURNINGS) {
      if (t.kind !== 'door') continue;
      const doors = resolveDoors(s, t);
      if (doors.some((d) => d.locked)) continue;
      const id = VALUE_IDS.find((v) => t.doors.some((d) => (d.values?.[v] ?? 0) > 0) && t.doors.some((d) => !(d.values?.[v] ?? 0)));
      if (!id) continue;
      found = { id, turning: t.id, with: t.doors.map((d, i) => ((d.values?.[id] ?? 0) > 0 ? i : -1)).filter((i) => i >= 0) };
      s.pending = { kind: 'door', turning: t.id, moment: false, title: t.title, body: t.body, speaker: '', doors };
      break;
    }
    expect(found).not.toBeNull();
    for (const v of VALUE_IDS) s.values[v] = 0;
    s.values[found!.id] = 100;
    const hits = (policy: 'lean' | 'random') => {
      const r = rngOf({ seed: 5, cursor: 0 });
      let n = 0;
      for (let i = 0; i < 200; i++) if (found!.with.includes(choose(s, policy, r))) n++;
      return n;
    };
    expect(hits('lean')).toBeGreaterThan(hits('random'));
  });
});
