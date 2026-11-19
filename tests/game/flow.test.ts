// tests/game/flow.test.ts
import { describe, expect, it } from 'vitest';
import { CLOCK, READ_GRACE_MS, battleSpeedOf, caughtUp, estimateMinutes, lastLogId, nextHidden, nextTick, shouldRead, shouldSave, windowReady, type FlowInput } from '../../src/app/flow';
import { reduce5 } from '../../src/core/reduce';
import type { Life5 } from '../../src/core/types';
import { parseImport } from '../../src/app/save';
import { autoplay5 } from '../../src/core/autoplay';
import { newLife5 } from '../../src/core/state';
import { emptyMeta5 } from '../../src/core/meta';

const base = (over: Partial<FlowInput> = {}): FlowInput =>
  ({ life: newLife5(1), shownId: -1, speed: 1, screen: 'main', modalOpen: false, reading: false, hidden: false, ...over });

describe('전투 창의 배속', () => {
  it.each([[1, 8, 4], [1, 2, 2], [4, 1, 4], [2, 0, 2], [1, 4, 4], [2, 1, 2]] as const)('설정 %i, 이야기 %i → %i', (setting, story, want) => {
    expect(battleSpeedOf(setting, story)).toBe(want);
  });
});

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
  it('인생이 끝났어도 못 본 줄이 남아 있으면 줄을 띄우고, 엔딩 창은 아직 뜨지 않는다', () => {
    const life = autoplay5(21, 'random').s;
    expect(life.pending?.kind).toBe('ending');
    const shownId = life.log[life.log.length - 3].id;
    expect(nextTick(base({ life, shownId }))).toMatchObject({ do: 'reveal', id: life.log[life.log.length - 2].id });
    expect(caughtUp(life, shownId)).toBe(false);
    expect(caughtUp(life, lastLogId(life))).toBe(true);
    expect(nextTick(base({ life, shownId: lastLogId(life) }))).toEqual({ do: 'wait' });
  });
  it('1배속으로 한 인생은 25~45분이다', () => {
    // 40명만 보면 표본의 흔들림(±3분)이 25~45분의 경계를 넘나든다. 120명의 평균으로 본다
    const lives = Array.from({ length: 120 }, (_, i) => autoplay5(9000 + i, 'random').s);
    const avg = lives.reduce((a, s) => a + estimateMinutes(s.seq, s.stats.stops), 0) / lives.length;
    expect(avg).toBeGreaterThan(25); expect(avg).toBeLessThan(45);
  }, 300000);
});

describe('읽는 동안 멈춤', () => {
  const free = READ_GRACE_MS + 1;
  it('마우스가 이야기 칸 안에서 실제로 움직여야 멈춘다', () => {
    expect(shouldRead({ pointerType: 'mouse', moved: true, msSinceWindowClosed: free })).toBe(true);
    expect(shouldRead({ pointerType: 'mouse', moved: false, msSinceWindowClosed: free })).toBe(false);   // 창이 닫혀 커서가 그 자리에 놓였을 뿐
  });
  it('창이 닫힌 뒤 잠깐은 움직여도 멈추지 않는다', () => {
    expect(READ_GRACE_MS).toBe(600);
    expect(shouldRead({ pointerType: 'mouse', moved: true, msSinceWindowClosed: 0 })).toBe(false);
    expect(shouldRead({ pointerType: 'mouse', moved: true, msSinceWindowClosed: READ_GRACE_MS - 1 })).toBe(false);
    expect(shouldRead({ pointerType: 'mouse', moved: true, msSinceWindowClosed: READ_GRACE_MS })).toBe(true);
    expect(shouldRead({ pointerType: 'mouse', moved: true, msSinceWindowClosed: Infinity })).toBe(true);   // 창이 닫힌 적이 없다
  });
  it('손가락과 펜으로는 멈추지 않는다', () => {
    for (const pointerType of ['touch', 'pen', ''])
      expect(shouldRead({ pointerType, moved: true, msSinceWindowClosed: free })).toBe(false);
  });
});

describe('창이 뜨는 때', () => {
  const life = newLife5(1);                       // 첫 문이 떠 있다
  const last = lastLogId(life);
  it('마지막 줄이 떠오르고 잠깐 뒤에 창이 뜬다', () => {
    expect(CLOCK.windowDelayMs).toBe(700);
    expect(windowReady(life, last, 0, 1)).toBe(false);
    expect(windowReady(life, last, CLOCK.windowDelayMs - 1, 1)).toBe(false);
    expect(windowReady(life, last, CLOCK.windowDelayMs, 1)).toBe(true);
  });
  it('기다리는 시간은 배속만큼 준다', () => {
    expect(windowReady(life, last, CLOCK.windowDelayMs / 4, 4)).toBe(true);
    expect(windowReady(life, last, CLOCK.windowDelayMs / 4 - 1, 4)).toBe(false);
    expect(windowReady(life, last, CLOCK.windowDelayMs, 0)).toBe(true);    // 정지 중이면 1배속만큼
  });
  it('기록이 다 떠오르지 않았으면 뜨지 않는다', () => {
    expect(windowReady(life, last - 1, Infinity, 1)).toBe(false);
    expect(windowReady(null, -1, Infinity, 1)).toBe(false);
  });
  it('불러온 인생(불러온 뒤 떠오른 줄이 없다)은 곧바로 뜬다', () => {
    expect(windowReady(life, last, Infinity, 1)).toBe(true);
  });
});

describe('저장하는 때', () => {
  it('답한 뒤에는 저장한다', () => {
    const prev = newLife5(1);
    const next = reduce5(prev, { type: 'answer', index: 0 });
    expect(shouldSave(prev, next, { type: 'answer', index: 0 })).toBe(true);
  });
  it('나이가 바뀌었거나 떠 있는 일이 생긴 토막 뒤에는 저장한다', () => {
    const prev: Life5 = { ...newLife5(1), pending: null };
    expect(shouldSave(prev, { ...prev, age: prev.age + 1 }, { type: 'step' })).toBe(true);
    expect(shouldSave(prev, { ...prev, pending: { kind: 'ending', cause: '시험' } }, { type: 'step' })).toBe(true);
  });
  it('그저 흐른 토막 뒤에는 저장하지 않는다', () => {
    const prev: Life5 = { ...newLife5(1), pending: null };
    expect(shouldSave(prev, { ...prev, part: 1 }, { type: 'step' })).toBe(false);
    const waiting = newLife5(1);                  // 이미 떠 있던 일은 새로 생긴 것이 아니다
    expect(shouldSave(waiting, waiting, { type: 'step' })).toBe(false);
  });
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
  it('인생도 v5 도감도 없는 v5 파일은 이유를 알려 준다', () => {
    const r = parseImport(JSON.stringify({ app: 'grand-treasure', version: 5, life: null, meta: null }));
    expect(r.life).toBeNull(); expect(r.meta).toBeNull(); expect(r.error).toBeTruthy();
    expect(parseImport(JSON.stringify({ app: 'grand-treasure', version: 5 })).error).toBeTruthy();
    expect(parseImport(JSON.stringify({ app: 'grand-treasure', version: 5, life: null, meta: { schema: 4, lives: 3 } })).error).toBeTruthy();
  });
  it('v5가 아닌 도감은 버린다', () => {
    const r = parseImport(JSON.stringify({ app: 'grand-treasure', version: 5, life: newLife5(2), meta: { schema: 4, lives: 3 } }));
    expect(r.life?.rng.seed).toBe(2); expect(r.meta).toBeNull(); expect(r.error).toBeUndefined();
    expect(parseImport(JSON.stringify({ app: 'grand-treasure', version: 5, life: newLife5(2), meta: '글자' })).meta).toBeNull();
    expect(parseImport(JSON.stringify({ app: 'grand-treasure', version: 5, life: null, meta: emptyMeta5() })).meta?.schema).toBe(5);
  });
});
