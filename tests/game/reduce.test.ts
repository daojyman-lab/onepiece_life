// tests/game/reduce.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { apply5, cloneLife, invariants5, reduce5 } from '../../src/core/reduce';
import type { Command5, Life5 } from '../../src/core/types';

/** 첫 번째 열린 문 · 싸움은 물러나기 · 전투는 받아들이기로 다음 명령을 정한다 */
function next(s: Life5): Command5 {
  if (!s.pending) return { type: 'step' };
  if (s.pending.kind === 'door') return { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) };
  return { type: 'answer', index: s.pending.kind === 'fight' ? 1 : 0 };
}

describe('apply5와 reduce5', () => {
  it('한 인생 내내 같은 결과를 낸다', () => {
    let a = newLife5(321);
    const b = newLife5(321);
    for (let i = 0; i < 20000 && a.pending?.kind !== 'ending'; i++) {
      const cmd = next(a);
      a = reduce5(a, cmd);
      apply5(b, cmd);
      if (i % 50 === 0) expect(b).toEqual(a);
    }
    expect(a.pending?.kind).toBe('ending');
    expect(b).toEqual(a);
    expect(invariants5(a, true)).toEqual([]);
  });
  it('reduce5는 입력을 바꾸지 않고, 새 상태의 기록에 줄을 더해도 옛 상태의 기록은 그대로다', () => {
    let s = newLife5(77);
    for (let i = 0; i < 200; i++) s = reduce5(s, next(s));
    const copy = JSON.parse(JSON.stringify(s));
    const after = reduce5(s, next(s));
    expect(s).toEqual(copy);
    const logLen = s.log.length, tlLen = s.timeline.length;
    after.log.push({ id: after.seq++, age: after.age, text: '더한 줄', weight: 'light', type: 'life' });
    after.timeline.push({ age: after.age, text: '더한 줄' });
    expect(s.log.length).toBe(logLen);
    expect(s.timeline.length).toBe(tlLen);
  });
  it('cloneLife는 기록 밖의 모든 것을 깊이 복사한다', () => {
    const s = newLife5(5);
    const c = cloneLife(s);
    expect(c).toEqual(s);
    c.hero.base.str += 10; c.values.peace += 1; c.queue.push('x'); c.growth.tier.fist = 3;
    expect(s.hero.base.str).not.toBe(c.hero.base.str);
    expect(s.values.peace).not.toBe(c.values.peace);
    expect(s.queue).not.toContain('x');
    expect(s.growth.tier.fist).toBe(0);
  });
  it('싼 불변 조건 확인도 기록의 차례가 어긋난 것을 잡는다', () => {
    const s = newLife5(5);
    s.log.push({ ...s.log[0] });
    expect(invariants5(s)).not.toEqual([]);
    expect(invariants5(s, true)).toContain('duplicate log id');
  });
});
