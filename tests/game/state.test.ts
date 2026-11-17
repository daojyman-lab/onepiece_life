// tests/game/state.test.ts
import { describe, expect, it } from 'vitest';
import { emptyLife } from '../../src/core/state';

describe('v5 새 인생의 뼈대', () => {
  it('값만 담고, JSON으로 되살려도 같다', () => {
    const s = emptyLife(7);
    expect(s.schema).toBe(5);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
  it('가치관 아홉 가지가 0에서 시작하고 신체는 온전하다', () => {
    const s = emptyLife(7);
    expect(Object.keys(s.values)).toHaveLength(9);
    expect(Object.values(s.values).every((v) => v === 0)).toBe(true);
    expect(Object.values(s.hero.limbs).every((v) => v === 'ok')).toBe(true);
  });
});
