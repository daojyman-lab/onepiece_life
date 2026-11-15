// tests/v5/flow.test.ts
import { describe, expect, it } from 'vitest';
import { CLOCK, caughtUp, estimateMinutes, lastLogId, nextHidden, nextTick, type FlowInput } from '../../src/v5/app/flow';
import { parseImport } from '../../src/v5/app/save';
import { autoplay5 } from '../../src/v5/core/autoplay';
import { newLife5 } from '../../src/v5/core/state';
import { emptyMeta5 } from '../../src/v5/core/meta';

const base = (over: Partial<FlowInput> = {}): FlowInput =>
  ({ life: newLife5(1), shownId: -1, speed: 1, screen: 'main', modalOpen: false, reading: false, hidden: false, ...over });

describe('흐름', () => {
  it('못 본 줄이 있으면 한 줄씩 띄운다', () => {
    const x = base(); const t = nextTick(x);
    expect(t).toMatchObject({ do: 'reveal', id: x.life!.log[0].id });
  });
  it('다 보고 선택이 떠 있으면 기다린다', () => {
    const x = base(); x.shownId = lastLogId(x.life);
    expect(x.life!.pending).not.toBeNull();
    expect(nextTick(x)).toEqual({ do: 'wait' });
  });
  it('다 보고 떠 있는 일이 없으면 다음 토막으로 간다', () => {
    const x = base(); x.life!.pending = null; x.shownId = lastLogId(x.life);
    expect(nextTick(x)).toEqual({ do: 'step', wait: CLOCK.stepMs });
  });
  it('정지, 열린 창, 읽는 중, 가려진 탭, 시작 화면에서는 흐르지 않는다', () => {
    for (const over of [{ speed: 0 as const }, { modalOpen: true }, { reading: true }, { hidden: true }, { screen: 'start' as const }, { life: null }])
      expect(nextTick(base(over))).toEqual({ do: 'wait' });
  });
  it('배속이면 기다리는 시간이 그만큼 준다', () => {
    const a = nextTick(base({ speed: 1 })), b = nextTick(base({ speed: 4 }));
    if (a.do !== 'reveal' || b.do !== 'reveal') throw new Error('reveal이어야 한다');
    expect(b.wait).toBeCloseTo(a.wait / 4);
  });
  it('무거운 줄은 더 오래, 해 구분선은 더 짧게 머문다', () => {
    expect(CLOCK.heavyMs).toBeGreaterThan(CLOCK.lineMs);
    expect(CLOCK.yearMs).toBeLessThan(CLOCK.lineMs);
  });
  it('못 본 줄이 잘려 나갔어도 남아 있는 첫 줄부터 이어진다', () => {
    const life = newLife5(1); life.log = life.log.slice(1);          // 맨 앞 줄이 잘렸다
    expect(nextHidden(life, -1)?.id).toBe(life.log[0].id);
    expect(caughtUp(life, life.log[life.log.length - 1].id)).toBe(true);
  });
  it('1배속으로 한 인생은 25~45분이다', () => {
    const lives = Array.from({ length: 40 }, (_, i) => autoplay5(9000 + i, 'random').s);
    const avg = lives.reduce((a, s) => a + estimateMinutes(s.seq, s.stats.stops), 0) / lives.length;
    expect(avg).toBeGreaterThan(25); expect(avg).toBeLessThan(45);
  }, 120000);
});

describe('가져오기', () => {
  it('v5 파일만 받는다', () => {
    const ok = JSON.stringify({ app: 'grand-treasure', version: 5, life: newLife5(2), meta: emptyMeta5() });
    expect(parseImport(ok).life?.rng.seed).toBe(2);
    expect(parseImport(JSON.stringify({ app: 'grand-treasure', version: 4, life: {}, meta: {} })).error).toBeTruthy();
    expect(parseImport('글자').error).toBeTruthy();
  });
  it('깨진 인생이 든 파일은 이유를 알려 주고 받지 않는다', () => {
    const bad = JSON.parse(JSON.stringify(newLife5(2))); bad.hero.hp = -1;
    const r = parseImport(JSON.stringify({ app: 'grand-treasure', version: 5, life: bad, meta: emptyMeta5() }));
    expect(r.life).toBeNull(); expect(r.error).toBeTruthy();
  });
});
