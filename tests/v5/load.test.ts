// tests/v5/load.test.ts
import { describe, expect, it } from 'vitest';
import { normalizeLife5, normalizeMeta5 } from '../../src/v5/core/load';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { emptyMeta5 } from '../../src/v5/core/meta';
import { askFight } from '../../src/v5/core/fight';
import { FOES } from '../../src/v5/data/foes';
import type { Pending5 } from '../../src/v5/core/types';

describe('저장 읽기', () => {
  it('멀쩡한 인생은 그대로 돌려준다', () => {
    const s = JSON.parse(JSON.stringify(newLife5(1)));
    expect(normalizeLife5(s)).toEqual(s);
  });
  it('되풀이 막기의 칸이 없는 옛 저장: 열린 횟수 · 닫힌 전환점은 비우고, 처지가 된 나이는 지금 나이로', () => {
    const s = JSON.parse(JSON.stringify(newLife5(1)));
    s.age = 30;
    delete s.seenCount; delete s.closed; delete s.standingSince;
    const f = normalizeLife5(s)!;
    expect(f.seenCount).toEqual({}); expect(f.closed).toEqual([]); expect(f.standingSince).toBe(30);
  });
  it('칸이 빠진 옛 저장은 기본값으로 채워 살린다', () => {
    const s = JSON.parse(JSON.stringify(newLife5(1)));
    delete s.queueTries; delete s.known; delete s.stats.named;
    const fixed = normalizeLife5(s)!;
    expect(fixed.queueTries).toEqual({});
    expect(fixed.known).toEqual([]);
    expect(fixed.stats.named).toEqual({});
    expect(() => reduce5(fixed, { type: 'answer', index: 0 })).not.toThrow();
  });
  it('시뮬레이터의 칸이 없는 옛 저장: 멈춘 나이 · 횟수는 비우고, 태어난 형편은 지금의 형편으로', () => {
    const s = JSON.parse(JSON.stringify(newLife5(1)));
    s.hero.wealth = 'noble';
    delete s.stats.stopsAt; delete s.stats.stopTries; delete s.stats.emptyStops; delete s.stats.namedMet; delete s.hero.bornWealth;
    const f = normalizeLife5(s)!;
    expect(f.stats.stopsAt).toEqual([]);
    expect(f.stats.stopTries).toBe(0); expect(f.stats.emptyStops).toBe(0); expect(f.stats.namedMet).toBe(0);
    expect(f.hero.bornWealth).toBe('noble');
    expect(() => reduce5(f, { type: 'answer', index: 0 })).not.toThrow();
  });
  it('인생이 아닌 것과 깨진 것은 null', () => {
    for (const x of [null, 3, 'x', {}, { schema: 1 }, { schema: 6 }]) expect(normalizeLife5(x)).toBeNull();
    const bad = JSON.parse(JSON.stringify(newLife5(1))); bad.hero.hp = -5;
    expect(normalizeLife5(bad)).toBeNull();
  });
  it('도감은 못 읽으면 빈 도감, 칸이 빠지면 채운다', () => {
    expect(normalizeMeta5(null)).toEqual(emptyMeta5());
    expect(normalizeMeta5({ schema: 5, lives: 2 })).toEqual({ ...emptyMeta5(), lives: 2 });
  });
  it('도감의 칸이 엉뚱한 모양이면 그 칸만 빈 값으로 돌린다', () => {
    const m = normalizeMeta5({ schema: 5, doors: ['a'], fruits: 'x', people: { a: 1 }, hall: 3, lives: '2' });
    expect(m).toEqual(emptyMeta5());
    expect(normalizeMeta5({ schema: 5, doors: 'x', fruits: ['f'], lives: 3 })).toEqual({ ...emptyMeta5(), fruits: ['f'], lives: 3 });
    expect(normalizeMeta5({ schema: 5, doors: null, hall: null })).toEqual(emptyMeta5());
  });
  it('떠 있는 일(pending)은 없거나, 그 종류에 맞는 칸을 갖춰야 한다', () => {
    const life = () => JSON.parse(JSON.stringify(newLife5(1)));
    const ok = life(); expect(ok.pending.kind).toBe('door');
    expect(normalizeLife5(ok)).not.toBeNull();
    expect(normalizeLife5({ ...life(), pending: null })).not.toBeNull();
    expect(normalizeLife5({ ...life(), pending: { kind: 'ending', cause: '병' } })).not.toBeNull();
    // 싸움 · 전투는 실제로 만든 것을 되읽어 본다
    const f = newLife5(1); f.pending = null as Pending5; f.age = 22;
    askFight(f, Object.keys(FOES)[0], true, false);
    expect(f.pending?.kind).toBe('fight');
    expect(normalizeLife5(JSON.parse(JSON.stringify(f)))).not.toBeNull();
    const b = newLife5(1); b.pending = null as Pending5; b.age = 22;
    askFight(b, Object.keys(FOES)[0], false, true);
    expect(b.pending?.kind).toBe('battle');
    const bj = JSON.parse(JSON.stringify(b));
    expect(normalizeLife5(bj)).not.toBeNull();
    const door = life().pending;
    const bad: unknown[] = [
      3, 'x', [], {}, { kind: 'shop' },
      { ...door, doors: 'x' }, { ...door, doors: undefined }, { ...door, title: 3 }, { ...door, body: undefined },
      { kind: 'fight', lethal: true, risk: { injury: 0, limb: 0, death: 0 } }, { kind: 'fight', foe: 'x' }, { kind: 'fight', foe: [] },
      { ...bj.pending, foe: null }, { ...bj.pending, battle: null }, { ...bj.pending, battle: { ...bj.pending.battle, events: {} } },
      { ...bj.pending, battle: { ...bj.pending.battle, units: undefined } },
      { kind: 'ending', cause: 3 },
    ];
    for (const p of bad) expect(normalizeLife5({ ...life(), pending: p }), JSON.stringify(p)?.slice(0, 80)).toBeNull();
  });
  it('인생의 큰 칸이 엉뚱한 모양이면 null', () => {
    const arrays = ['log', 'timeline', 'people', 'flags', 'queue', 'tried', 'known', 'closed'];
    const objects = ['hero', 'growth', 'values', 'stats', 'seenCount'];
    for (const k of arrays) for (const v of [{}, 'x', 3, null]) {
      const s = JSON.parse(JSON.stringify(newLife5(1))); s[k] = v;
      expect(normalizeLife5(s), `${k}=${JSON.stringify(v)}`).toBeNull();
    }
    for (const k of objects) for (const v of [[], 'x', 3, null]) {
      const s = JSON.parse(JSON.stringify(newLife5(1))); s[k] = v;
      expect(normalizeLife5(s), `${k}=${JSON.stringify(v)}`).toBeNull();
    }
  });
});
