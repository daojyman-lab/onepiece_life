// tests/v5/minor.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { runMinor } from '../../src/v5/core/minor';
import { addValues } from '../../src/v5/core/values';
import { MINORS } from '../../src/v5/data/minors';
import { rngOf } from '../../src/core/rng';

describe('자잘한 일', () => {
  it('플레이어에게 묻지 않고 기록 한 줄로 끝난다', () => {
    const s = newLife5(4); s.pending = null; s.age = 20; s.hero.standing = 'civil';
    const before = s.log.length;
    expect(runMinor(s, rngOf(s.rng))).toBe(true);
    expect(s.pending).toBeNull();
    expect(s.log.length).toBe(before + 1);
  });
  it('가치관 점수를 움직이지 않는다', () => {
    const s = newLife5(4); s.pending = null; s.age = 20; s.hero.standing = 'civil'; addValues(s, { loyalty: 40 });
    const v = { ...s.values };
    for (let i = 0; i < 30; i++) runMinor(s, rngOf(s.rng));
    expect(s.values).toEqual(v);
  });
  it('같은 일도 가치관에 따라 다른 결과로 기운다', () => {
    const m = MINORS.find((x) => x.id === 'brawl')!;
    const idx = (v: 'dominion' | 'peace') => { let fight = 0; for (let i = 0; i < 500; i++) { const s = newLife5(i); s.pending = null; s.age = 20; s.hero.standing = 'civil'; addValues(s, { [v]: 90 }); s.seen = Object.fromEntries(MINORS.filter((x) => x.id !== 'brawl').map((x) => [x.id, 20])); runMinor(s, rngOf(s.rng)); if (s.log.at(-1) && m.outcomes[0].text.some((t) => s.log.at(-1)!.text.includes(t.slice(0, 6)))) fight++; } return fight; };
    expect(idx('dominion')).toBeGreaterThan(idx('peace') * 2);
  });
  it('30개 이상이고, 모든 일에 누구나 고를 수 있는 결과가 있다', () => {
    expect(MINORS.length).toBeGreaterThanOrEqual(30);
    for (const m of MINORS) expect(m.outcomes.length, m.id).toBeGreaterThanOrEqual(2);
  });
  it('되돌릴 수 없는 효과가 없고, 쉬는 해가 있으며, lean이 빈 결과가 하나씩 있다', () => {
    const banned = new Set(['standing', 'loseLimb', 'die', 'fight', 'log', 'mark', 'mastery']);
    const ops = (fx: { op: string; then?: { op: string }[]; else?: { op: string }[] }[]): string[] =>
      fx.flatMap((e) => [e.op, ...ops(e.then ?? []), ...ops(e.else ?? [])]);
    expect(new Set(MINORS.map((m) => m.id)).size).toBe(MINORS.length);
    for (const m of MINORS) {
      expect(m.id === 'brawl' || m.id.startsWith('m_'), m.id).toBe(true);
      expect(m.cooldownYears, m.id).toBeGreaterThanOrEqual(1);
      expect(m.outcomes.some((o) => Object.keys(o.lean).length === 0), m.id).toBe(true);
      for (const o of m.outcomes) for (const op of ops(o.fx)) expect(banned.has(op), `${m.id}: ${op}`).toBe(false);
    }
  });
});
