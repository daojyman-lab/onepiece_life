import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { newLife5 } from '../../src/core/state';
import { resolveDoors } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { Standing, ValueId } from '../../src/core/types';

describe('가치관을 고를 기회', () => {
  it.each([
    ['kid_bully', 7, 'child', 'dominion'],
    ['kid_market_stalls', 12, 'child', 'greed'],
    ['kid_market_stalls', 12, 'child', 'dominion'],
    ['land_workshare', 19, 'civil', 'greed'],
    ['land_workshare', 19, 'civil', 'dominion'],
    ['late_seawall', 49, 'civil', 'dominion'],
    ['late_r_house', 67, 'retired', 'greed'],
    ['late_r_lighthouse', 67, 'retired', 'dominion'],
    ['prison_days', 30, 'prisoner', 'ambition'],
    ['prison_escape', 30, 'prisoner', 'dominion'],
  ] as const)('%s에서 %i세 %s가 %s를 선택할 수 있다', (id, age, standing: Standing, value: ValueId) => {
    const s = newLife5(14, { wealth: 'poor' });
    s.age = age;
    s.hero.standing = standing;
    s.hero.island = '로그타운';
    s.hero.money = 0;
    s.values[value] = 0;
    const scene = TURNING_BY_ID[id];
    expect(scene).toBeDefined();
    expect(checkAll(s, scene.when)).toBe(true);
    expect(resolveDoors(s, scene).some((door, i) => !door.locked && (scene.doors[i].values?.[value] ?? 0) > 0)).toBe(true);
  });
});
