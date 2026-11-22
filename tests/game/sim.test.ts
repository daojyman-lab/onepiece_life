// tests/game/sim.test.ts
import { beforeAll, describe, expect, it } from 'vitest';
import { autoplay5, summarize } from '../../src/core/autoplay';
import { topValues } from '../../src/core/values';
import { VALUE_IDS } from '../../src/data/values';
import type { Life5 } from '../../src/core/types';

const N = 600;
let runs: ReturnType<typeof autoplay5>[] = [];
let lives: Life5[] = [];
let ambitious: Life5[] = [];
let leanLives: Life5[] = [];
let leanReport: ReturnType<typeof summarize>;
let randomReport: ReturnType<typeof summarize>;
beforeAll(() => {
  runs = Array.from({ length: N }, (_, i) => autoplay5(9000 + i, 'random'));
  lives = runs.map((r) => r.s);
  ambitious = Array.from({ length: 300 }, (_, i) => autoplay5(9000 + i, { value: 'ambition' }).s);
  randomReport = summarize(lives);
  leanLives = Array.from({ length: N }, (_, i) => autoplay5(9000 + i, 'lean').s);
  leanReport = summarize(leanLives);
}, 600_000);
const avg = (f: (s: Life5) => number, xs = lives) => xs.reduce((a, s) => a + f(s), 0) / xs.length;
const topTier = (s: Life5) => Math.max(...Object.values(s.growth.tier));
const rate = (xs: Life5[], f: (s: Life5) => boolean) => xs.filter(f).length / Math.max(1, xs.length);

describe('시뮬레이터 (설계 7장)', () => {
  it('멈추는 인생도, 불변 조건을 어기는 인생도 없다', () => {
    expect(runs.filter((r) => r.stuck).length).toBe(0);
    expect(runs.filter((r) => r.violations.length).length).toBe(0);
  });
  it('멈춤은 한 인생에 50~110번이다', () => {
    const a = avg((s) => s.stats.stops);
    expect(a).toBeGreaterThanOrEqual(50); expect(a).toBeLessThanOrEqual(110);
  });
  it('큰 기연은 평균 0.3~2번이고, 한 번도 없는 인생이 20% 이상이다', () => {
    const a = avg((s) => s.stats.fortunes);
    expect(a).toBeGreaterThanOrEqual(0.3); expect(a).toBeLessThanOrEqual(2);
    expect(rate(lives, (s) => s.stats.fortunes === 0)).toBeGreaterThanOrEqual(0.2);
  });
  it('아홉 가지 가치관 모두 가장 높은 가치관이 되는 인생이 나온다', () => {
    const tops = new Set(lives.map((s) => topValues(s, 1)[0]));
    for (const v of VALUE_IDS) expect(tops.has(v), v).toBe(true);
  });
  it('처지가 한두 가지로 몰리지 않는다', () => {
    const by: Record<string, number> = {};
    for (const s of lives) by[s.hero.standing] = (by[s.hero.standing] ?? 0) + 1;
    expect(Object.keys(by).length).toBeGreaterThanOrEqual(6);
    expect(Math.max(...Object.values(by)) / N).toBeLessThanOrEqual(0.5);
  });
  it('가치관이 다르면 같은 출생이라도 도달한 힘이 달라진다', () => {
    const a = Array.from({ length: 150 }, (_, i) => autoplay5(9000 + i, { value: 'ambition' }).s);
    const p = Array.from({ length: 150 }, (_, i) => autoplay5(9000 + i, { value: 'peace' }).s);
    expect(avg(topTier, a)).toBeGreaterThan(avg(topTier, p) + 0.7);
    expect(avg((s) => s.ended!.age, p)).toBeGreaterThan(avg((s) => s.ended!.age, a));
  });
  it('중간 단계(4단계)는 넉넉한 집이, 최상위(6단계)는 가난한 집과 고아가 더 자주 닿는다', () => {
    const rich = Array.from({ length: 400 }, (_, i) => autoplay5(20000 + i, { value: 'ambition' }, { wealth: 'noble', lineage: 'commoner' }).s);
    const poor = Array.from({ length: 400 }, (_, i) => autoplay5(20000 + i, { value: 'ambition' }, { wealth: 'poor', lineage: 'orphan' }).s);
    expect(rate(rich, (s) => topTier(s) >= 4)).toBeGreaterThan(rate(poor, (s) => topTier(s) >= 4));
    expect(rate(poor, (s) => topTier(s) >= 6)).toBeGreaterThan(rate(rich, (s) => topTier(s) >= 6));
  // 800개의 생애를 끝까지 비교하므로 공용 2분 제한 대신 초기 표본 생성과 같은 여유를 준다.
  }, 600_000);
  it('야망을 좇는 인생은 이름 있는 상대와 싸워 20~70%를 이긴다', () => {
    const named = summarize(ambitious).named;
    expect(named.fights).toBeGreaterThanOrEqual(30);
    expect(named.winRate).toBeGreaterThanOrEqual(0.2);
    expect(named.winRate).toBeLessThanOrEqual(0.7);
  });
  it('신체를 잃는 인생은 절반 이하이고, 잃은 뒤에도 열 해 넘게 사는 인생이 그중 절반 이상이다', () => {
    const lost = lives.filter((s) => s.stats.limbsLost > 0);
    expect(lost.length / N).toBeLessThanOrEqual(0.5);
    // 신체를 잃는 인생은 표본의 열에 하나 남짓이라 600명으로는 70명 안팎뿐이다(표준오차 ±0.06).
    // 이미 돌린 세 표본(무작위 · lean · 야망)을 모두 모아 그 뒤의 삶을 잰다.
    const lostAll = [...lives, ...leanLives, ...ambitious].filter((s) => s.stats.limbsLost > 0);
    const after = lostAll.filter((s) => s.ended!.age - (s.timeline.find((t) => /잃었다/.test(t.text))?.age ?? 0) > 10);
    expect(after.length / Math.max(1, lostAll.length)).toBeGreaterThanOrEqual(0.5);
  });
});

describe('시뮬레이터 (3단계 균형, 과제 13)', () => {
  it('멈춤이 나이대마다 고르다 (lean)', () => {
    expect(leanReport.perLife.stops).toBeGreaterThanOrEqual(70); expect(leanReport.perLife.stops).toBeLessThanOrEqual(95);
    expect(leanReport.stopsByBand.kid).toBeGreaterThanOrEqual(1.2); expect(leanReport.stopsByBand.kid).toBeLessThanOrEqual(1.9);
    expect(leanReport.stopsByBand.youth).toBeGreaterThanOrEqual(2.0); expect(leanReport.stopsByBand.youth).toBeLessThanOrEqual(3.0);
    expect(leanReport.stopsByBand.later).toBeGreaterThanOrEqual(0.6); expect(leanReport.stopsByBand.later).toBeLessThanOrEqual(1.3);
  });
  it('같은 사건이 되풀이되지 않는다', () => {
    expect(leanReport.maxSeen.p95).toBeLessThanOrEqual(3);
    expect(leanReport.emptyPool).toBeLessThanOrEqual(0.1);
    expect(leanReport.quietYears).toBeLessThanOrEqual(0.5);
  });
  it('가치관이 한쪽으로 쏠리지 않는다 (무작위)', () => {
    for (const v of VALUE_IDS) { expect(randomReport.topShare[v], v).toBeLessThanOrEqual(0.35); expect(randomReport.topShare[v], v).toBeGreaterThanOrEqual(0.04); }
  });
  it('이름 있는 상대를 만나는 인생이 흔하다', () => { expect(leanReport.namedLives).toBeGreaterThanOrEqual(0.4); });
  it('집안의 몰락은 드물다', () => { expect(randomReport.ruined).toBeLessThanOrEqual(0.2); });
});
