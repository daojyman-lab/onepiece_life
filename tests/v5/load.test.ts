// tests/v5/load.test.ts
import { describe, expect, it } from 'vitest';
import { normalizeLife5, normalizeMeta5 } from '../../src/v5/core/load';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { emptyMeta5 } from '../../src/v5/core/meta';

describe('저장 읽기', () => {
  it('멀쩡한 인생은 그대로 돌려준다', () => {
    const s = JSON.parse(JSON.stringify(newLife5(1)));
    expect(normalizeLife5(s)).toEqual(s);
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
  it('인생이 아닌 것과 깨진 것은 null', () => {
    for (const x of [null, 3, 'x', {}, { schema: 1 }, { schema: 6 }]) expect(normalizeLife5(x)).toBeNull();
    const bad = JSON.parse(JSON.stringify(newLife5(1))); bad.hero.hp = -5;
    expect(normalizeLife5(bad)).toBeNull();
  });
  it('도감은 못 읽으면 빈 도감, 칸이 빠지면 채운다', () => {
    expect(normalizeMeta5(null)).toEqual(emptyMeta5());
    expect(normalizeMeta5({ schema: 5, lives: 2 })).toEqual({ ...emptyMeta5(), lives: 2 });
  });
});
