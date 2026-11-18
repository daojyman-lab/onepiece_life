// tests/v5/passage.test.ts — 항해(바다 위의 토막)와 날씨
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/core/rng';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5, invariants5 } from '../../src/v5/core/reduce';
import { applyFx } from '../../src/v5/core/fx';
import { check } from '../../src/v5/core/cond';
import { autoplay5 } from '../../src/v5/core/autoplay';
import { depart, passageParts, rollPassage, rollWeather, type Passage } from '../../src/v5/core/passage';
import { WEATHER_TABLE } from '../../src/v5/data/weather';
import type { Life5 } from '../../src/v5/core/types';

/** 바다에 나선 해적 하나 */
function pirate(seed = 3): Life5 {
  const s = newLife5(seed);
  s.pending = null;
  s.vows!.declined = true;
  s.age = 20;
  s.hero.standing = 'pirate';
  s.hero.sea = 'east';
  s.hero.island = '로그타운';
  return s;
}
const step = (s: Life5) => reduce5({ ...s, pending: null }, { type: 'step' });

describe('항해 길이', () => {
  it('험한 섬 · 신세계는 길고, 잔잔한 뱃길은 돌아가고, 미지는 질러간다', () => {
    expect(passageParts('east', '시럽 마을', 'dream')).toBe(1);
    expect(passageParts('east', '시럽 마을', 'calm')).toBe(2);
    expect(passageParts('east', '시럽 마을', 'wild')).toBe(1);
    expect(passageParts('gl_entry', '리틀 가든', 'dream')).toBe(2);
    expect(passageParts('nw_late', '와노쿠니', 'calm')).toBe(4);
  });
});

describe('날씨', () => {
  it('날씨 표의 합은 100이다', () => {
    for (const t of Object.values(WEATHER_TABLE)) expect(Object.values(t).reduce((a, b) => a + b, 0)).toBe(100);
  });
  it('4개의 바다에는 이상기후가 없고, 칼름벨트는 늘 무풍이다', () => {
    const r = rngOf({ seed: 5, cursor: 0 });
    for (let i = 0; i < 500; i++) expect(rollWeather('blue', 'wild', undefined, r)).not.toBe('anomaly');
    for (let i = 0; i < 50; i++) expect(rollWeather('calmBelt', 'wild', undefined, r)).toBe('calm');
  });
  it('신세계는 4개의 바다보다 험하다', () => {
    const r = rngOf({ seed: 9, cursor: 0 });
    const rough = (z: 'blue' | 'newWorld') => Array.from({ length: 2000 }, () => rollWeather(z, 'dream', undefined, r)).filter((w) => w === 'storm' || w === 'anomaly').length;
    expect(rough('newWorld')).toBeGreaterThan(rough('blue') * 2);
  });
  it('항해 한 토막은 입력을 바꾸지 않고, 같은 씨앗이면 같은 결과다', () => {
    const p: Passage = { to: '와노쿠니', route: 'wild', partsLeft: 2, partsSpent: 0, maxParts: 5 };
    const copy = JSON.parse(JSON.stringify(p));
    const a = rollPassage(p, 'nw_late', 0, rngOf({ seed: 1, cursor: 0 }));
    const b = rollPassage(p, 'nw_late', 0, rngOf({ seed: 1, cursor: 0 }));
    expect(p).toEqual(copy);
    expect(a).toEqual(b);
  });
  it('항해사가 있으면 신세계 미지의 뱃길에서 덜 다친다', () => {
    let alone = 0, nav = 0;
    for (let seed = 0; seed < 400; seed++) {
      const p: Passage = { to: '와노쿠니', route: 'wild', partsLeft: 9, partsSpent: 0, maxParts: 12 };
      alone += rollPassage(p, 'nw_late', 0, rngOf({ seed, cursor: 0 })).hp;
      nav += rollPassage(p, 'nw_late', 3, rngOf({ seed, cursor: 0 })).hp;
    }
    expect(nav).toBeGreaterThan(alone);
  });
});

describe('바다 위의 토막', () => {
  it('뱃길을 고르면 바로 닿지 않고, 몇 토막 뒤에 닿는다', () => {
    let s = pirate();
    applyFx(s, [{ op: 'sail', island: '코노미 제도', route: 'calm' }]);
    expect(s.hero.island).toBe('로그타운');
    expect(s.passage?.to).toBe('코노미 제도');
    let parts = 0;
    while (s.passage && parts < 10) { s = step(s); parts++; }
    expect(s.passage).toBeNull();
    expect(s.hero.island).toBe('코노미 제도');
    expect(s.flags).toContain('at:코노미 제도');
    expect(parts).toBeGreaterThanOrEqual(1);
    expect(parts).toBeLessThanOrEqual(2 + 3);                   // 기본 2토막 + 넘칠 수 있는 3토막
    expect(s.log.some((l) => l.text.includes('코노미 제도에 처음 닻을 내렸다'))).toBe(true);
  });
  it('항해는 반드시 끝나고, 날씨로는 죽지 않는다', () => {
    for (let seed = 0; seed < 60; seed++) {
      let s = pirate(seed);
      s.hero.sea = 'nw_late'; s.hero.island = '엘바프'; s.hero.hp = 5;
      depart(s, '와노쿠니', 'wild');
      const max = s.passage!.maxParts;
      let parts = 0;
      while (s.passage) { s = step(s); parts++; if (!s.hero.alive) break; }
      expect(parts, `seed ${seed}`).toBeLessThanOrEqual(max);
    }
  });
  it('바다 위에서는 섬에 묶인 일이 열리지 않고, 섬이 아닌 곳의 조건은 맞는다', () => {
    const s = pirate();
    expect(check(s, { c: 'island', is: ['로그타운'] })).toBe(true);
    depart(s, '코노미 제도', 'dream');
    expect(check(s, { c: 'island', is: ['로그타운'] })).toBe(false);
    expect(check(s, { c: 'island', is: ['코노미 제도'] })).toBe(false);
    expect(check(s, { c: 'island', is: ['후샤 마을'], not: true })).toBe(true);
  });
  it('바다 위에 있는 동안은 다음 항해를 정하지 않는다', () => {
    let s = pirate();
    depart(s, '코노미 제도', 'calm');
    s.part = 3;                                                // 해가 바뀌는 토막
    s = step(s);
    expect(s.sail).toBeFalsy();
  });
  it('다른 곳으로 옮겨지면 하던 항해는 끝난다', () => {
    const s = pirate();
    depart(s, '코노미 제도', 'calm');
    applyFx(s, [{ op: 'move', island: '시럽 마을', sea: 'east' }]);
    expect(s.passage).toBeNull();
    expect(s.hero.island).toBe('시럽 마을');
  });
  it('해군은 전근 명령으로 바다를 건너 배속된다', () => {
    let s = pirate(11);
    s.hero.standing = 'marine';
    depart(s, '시럽 마을', 'drift', true);
    while (s.passage) s = step(s);
    expect(s.log.some((l) => l.text.includes('시럽 마을 지부'))).toBe(true);
  });
  it('JSON으로 되살린 항해는 같은 명령에 같은 결과를 낸다', () => {
    const s = pirate(4);
    depart(s, '코노미 제도', 'wild');
    expect(step(JSON.parse(JSON.stringify(s)))).toEqual(step(s));
  });
});

describe('한 인생 전체', () => {
  it('바다를 다니는 인생은 항해를 하고, 불변 조건을 지킨다', () => {
    let sailed = 0;
    for (const seed of [301, 302, 303, 304, 305, 306, 307, 308]) {
      const { s, violations, stuck } = autoplay5(seed, 'random');
      expect(violations, `seed ${seed}`).toEqual([]);
      expect(stuck, `seed ${seed}`).toBe(false);
      expect(invariants5(s)).toEqual([]);
      if (s.log.some((l) => l.text.includes('돛을 올렸다') || l.text.includes('군함에 올랐다'))) sailed++;
    }
    expect(sailed).toBeGreaterThan(0);
  });
});
