// tests/game/debut.test.ts — 첫 출항한 해는 토막을 한 바퀴 더 돈다
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { reduce5 } from '../../src/core/reduce';
import { depart } from '../../src/core/passage';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { beginDebut, enterPrime, inDebut } from '../../src/core/stages';
import { V } from '../../src/data/balance';
import { autoplay5 } from '../../src/core/autoplay';
import type { Life5 } from '../../src/core/types';

const step = (s: Life5) => reduce5(s, { type: 'step' });
/** 한 살을 먹을 때까지 흘리고, 그동안 지나간 토막 수를 센다 (사건이 열려 토막이 넘어가지 않은 걸음은 세지 않는다) */
function partsToNextYear(s: Life5): { s: Life5; parts: number } {
  const age = s.age;
  let parts = 0;
  for (let i = 0; i < 400 && s.age === age; i++) {
    const before = s.part;
    s = step({ ...s, pending: null, passage: null, queue: [] });
    if (s.part !== before || s.age !== age) parts++;
  }
  return { s, parts };
}

function sailor(age = 16): Life5 {
  const s = newLife5(7101);
  s.pending = null; s.age = age; s.part = 0; s.hero.standing = 'pirate';
  return s;
}

describe('첫 출항', () => {
  it('새 인생은 아직 출항 전이다', () => {
    expect(newLife5(7100).debut).toBeNull();
  });
  it('바다를 다니는 처지로 처음 항구를 떠나면 그 나이가 첫 출항의 해가 된다', () => {
    const s = sailor();
    depart(s, '로그타운', 'calm');
    expect(s.debut).toEqual({ age: 16, lap: false });
    expect(inDebut(s)).toBe(true);
    expect(s.timeline.some((t) => t.text === '처음 바다에 나섰다')).toBe(true);
  });
  it('이야기가 먼 섬으로 데려갈 때도 출항으로 센다', () => {
    const s = sailor();
    applyFx(s, [{ op: 'move', island: '알라바스타 왕국', sea: 'gl_first' }]);
    expect(s.debut?.age).toBe(16);
  });
  it('어린아이 · 바다와 상관없는 처지는 출항으로 세지 않는다', () => {
    const kid = sailor(V.voyage.minAge - 1);
    beginDebut(kid);
    expect(kid.debut).toBeNull();
    const civil = sailor(); civil.hero.standing = 'civil';
    beginDebut(civil);
    expect(civil.debut).toBeNull();
  });
  it('첫 출항은 한 번뿐이다', () => {
    const s = sailor();
    beginDebut(s);
    s.age = 20;
    beginDebut(s);
    expect(s.debut?.age).toBe(16);
  });
  it('첫 출항한 해는 여덟 토막이 지나야 한 살을 먹고, 그다음 해는 제 빠르기로 돌아온다', () => {
    const s = sailor();
    beginDebut(s);
    const y16 = partsToNextYear(s);
    expect(y16.parts).toBe(V.partsPerYear * 2);
    expect(y16.s.age).toBe(17);
    expect(y16.s.debut?.lap).toBe(false);
    expect(y16.s.log.some((l) => l.text.includes('바다에 나선 첫해는 아직 끝나지 않았다'))).toBe(true);
    expect(partsToNextYear(y16.s).parts).toBe(V.partsPerYear);
  });
  it('전성기와 겹치면 더 느려지지 않는다 (두 바퀴까지)', () => {
    const s = sailor(30);
    enterPrime(s);
    beginDebut(s);
    expect(inDebut(s)).toBe(false);
    expect(partsToNextYear(s).parts).toBe(V.partsPerYear * 2);
  });
  it('첫 출항을 기록하기 전의 옛 저장은 불러와도 갑자기 느려지지 않는다', () => {
    const old = sailor(24) as unknown as Record<string, unknown>;
    delete old.debut;
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(old)))!;
    beginDebut(loaded);
    expect(inDebut(loaded)).toBe(false);
    const young = sailor(12) as unknown as Record<string, unknown>;
    delete young.debut;
    expect(normalizeLife5(JSON.parse(JSON.stringify(young)))!.debut).toBeNull();
  });
  it('바다에 나선 인생은 대부분 첫 출항의 해를 겪는다', () => {
    let sailed = 0, debuted = 0;
    for (let seed = 7200; seed < 7230; seed++) {
      const { s } = autoplay5(seed, 'random');
      if (!s.flags.some((f) => f.startsWith('at:'))) continue;
      sailed++;
      if (s.debut && s.debut.age >= V.voyage.minAge) debuted++;
    }
    expect(sailed).toBeGreaterThan(0);
    expect(debuted / sailed).toBeGreaterThan(0.5);
  });
});
