// tests/v5/pixel.test.ts
import { describe as group, expect, it } from 'vitest';
import { attackArm, describe as desc } from '../../src/ui/pixel/pixelArt';
import { heroWho5 } from '../../src/v5/ui/view';
import { newLife5 } from '../../src/v5/core/state';

group('신체 손실의 겉모습', () => {
  it('멀쩡하면 body가 비어 있다', () => {
    expect(heroWho5(newLife5(1)).body ?? {}).toEqual({});
  });
  it('잃은 부위와 단 것이 겉모습 자료에 실린다', () => {
    const s = newLife5(1); s.hero.limbs.eyeL = 'lost'; s.hero.limbs.legR = 'basic'; s.hero.limbs.armR = 'superior';
    const who = heroWho5(s);
    expect(who.body).toEqual({ eyeL: 'lost', legR: 'basic', armR: 'superior' });
    expect(desc(who).body).toEqual(who.body);
  });
  it('몸이 달라져도 얼굴의 나머지(머리색, 피부)는 그대로다', () => {
    const s = newLife5(1); const before = desc(heroWho5(s));
    s.hero.limbs.eyeL = 'lost'; const after = desc(heroWho5(s));
    expect({ ...after, body: undefined }).toEqual({ ...before, body: undefined });
  });
  it('공격하는 팔: 왼팔이 있으면 왼팔, 왼팔만 잃으면 오른팔, 둘 다 잃으면 없다', () => {
    expect(attackArm({})).toBe('armL');
    expect(attackArm({ armL: 'basic' })).toBe('armL');
    expect(attackArm({ armL: 'lost' })).toBe('armR');
    expect(attackArm({ armL: 'lost', armR: 'superior' })).toBe('armR');
    expect(attackArm({ armL: 'lost', armR: 'lost' })).toBeNull();
  });
});
