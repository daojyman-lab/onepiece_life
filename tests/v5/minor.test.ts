// tests/v5/minor.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { runMinor } from '../../src/v5/core/minor';
import { addValues } from '../../src/v5/core/values';
import { MINORS } from '../../src/v5/data/minors';
import { LINES } from '../../src/v5/data/lines';
import { lineFits } from '../../src/v5/core/year';
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
  it('needs가 맞지 않는 일은 일어나지 않고, needs · when이 맞지 않는 결과는 고르지 않는다', () => {
    const only = (id: string) => (s: ReturnType<typeof newLife5>) => { s.seen = Object.fromEntries(MINORS.filter((x) => x.id !== id).map((x) => [x.id, s.age])); };
    // 형제가 있어야 하는 일: 형제가 없으면 아무 일도 없다
    const sib = MINORS.find((m) => m.needs?.includes('sibling'))!;
    expect(sib, 'sibling을 필요로 하는 일이 하나는 있다').toBeDefined();
    for (let i = 0; i < 30; i++) {
      const s = newLife5(i); s.pending = null; s.age = 30; s.hero.standing = 'civil'; s.hero.money = 99999;
      s.people = s.people.filter((p) => !['형', '누나', '오빠', '언니', '남동생', '여동생'].includes(p.relation));
      only(sib.id)(s);
      expect(runMinor(s, rngOf(s.rng)), `seed ${i}`).toBe(false);
    }
    // 결과의 needs · when: 맞지 않으면 그 결과의 글은 나오지 않는다
    const m = MINORS.find((x) => x.outcomes.some((o) => o.needs || o.when))!;
    expect(m, '결과에 needs나 when이 붙은 일이 하나는 있다').toBeDefined();
    const gated = m.outcomes.filter((o) => o.needs || o.when).flatMap((o) => o.text);
    for (let i = 0; i < 200; i++) {
      const s = newLife5(i); s.pending = null; s.hero.money = 99999;
      s.age = m.when.reduce((a, c) => (c.c === 'age' ? Math.max(a, c.min ?? 0) : a), 3);
      const st = m.when.find((c) => c.c === 'standing'); if (st && st.c === 'standing') s.hero.standing = st.is[0];
      s.people = []; s.hero.fruit = { id: 'x', eatenAt: 0 };                       // 사람도 헤엄도 없다
      for (const id of Object.keys(s.values)) s.values[id as keyof typeof s.values] = 90;   // 모든 가치관이 깊다
      only(m.id)(s);
      if (runMinor(s, rngOf(s.rng))) expect(gated.some((t) => s.log.at(-1)!.text.startsWith(t.slice(0, 8))), s.log.at(-1)!.text).toBe(false);
    }
  });
  it('기록 줄도 needs가 맞지 않으면 고르지 않는다', () => {
    const s = newLife5(3); s.age = 10; s.hero.standing = 'child';
    s.people = s.people.filter((p) => !['형', '누나', '오빠', '언니', '남동생', '여동생'].includes(p.relation));
    const sib = LINES.filter((l) => l.needs?.includes('sibling'));
    expect(sib.length).toBeGreaterThan(0);
    for (const l of sib) expect(lineFits(s, l), l.text).toBe(false);
    s.people.push({ ...s.people[0], id: 'pX', relation: '남동생', age: 5, alive: true });
    expect(sib.some((l) => lineFits(s, l))).toBe(true);
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
