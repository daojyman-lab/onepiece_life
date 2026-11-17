import { describe, expect, it } from 'vitest';
import { FRUITS, FRUIT_BY_ID, SMILE_FRUITS } from '../../src/data/fruits';
import { FRUIT_PASSIVES } from '../../src/data/passives';
import { applyFx } from '../../src/v5/core/fx';
import { emptyLife } from '../../src/v5/core/state';
import { normalizeLife5, normalizeMeta5 } from '../../src/v5/core/load';

const removed = ['hanshu', 'setsu', 'zaza', 'musu', 'kan', 'hyo', 'zan', 'fuhyo'];

describe('원작 열매 도감', () => {
  it('오리지널을 없애고 원작 열매를 100종 이상 제공하며 모두 전투 효과가 있다', () => {
    expect(FRUITS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(FRUITS.map((f) => f.id)).size).toBe(FRUITS.length);
    for (const id of removed) {
      expect(FRUIT_BY_ID[id]).toBeUndefined();
      expect(FRUIT_PASSIVES[id]).toBeUndefined();
    }
    for (const fruit of FRUITS) expect(FRUIT_PASSIVES[fruit.id]).toBeDefined();
    expect(FRUIT_BY_ID.gomu).toBeUndefined();
    expect(FRUIT_BY_ID.nika).toBeDefined();
  });

  it('일반 지역에서는 스마일이 절대 나오지 않고 관련 섬에서는 드물게 나온다', () => {
    let smileCount = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const ordinary = emptyLife(seed);
      ordinary.hero.island = '로그타운';
      applyFx(ordinary, [{ op: 'eatFruit', id: 'random' }]);
      expect(SMILE_FRUITS.some((f) => f.id === ordinary.hero.fruit?.id)).toBe(false);

      const related = emptyLife(seed);
      related.hero.island = '와노쿠니';
      applyFx(related, [{ op: 'eatFruit', id: 'random' }]);
      if (SMILE_FRUITS.some((f) => f.id === related.hero.fruit?.id)) smileCount++;
    }
    expect(smileCount).toBeGreaterThan(0);
    expect(smileCount).toBeLessThan(100);
  });

  it('옛 저장의 삭제 열매를 현재 인생과 도감에서 걷어낸다', () => {
    const old = emptyLife(7);
    old.hero.fruit = { id: 'fuhyo', eatenAt: 20 };
    old.growth.tier.fruit = 1;
    const life = normalizeLife5(old);
    expect(life?.hero.fruit).toBeNull();
    expect(life?.growth.tier.fruit).toBe(0);
    const meta = normalizeMeta5({ schema: 5, doors: {}, fruits: ['fuhyo', 'gomu', 'mera'], people: [], hall: [], lives: 1 });
    expect(meta.fruits).toEqual(['nika', 'mera']);
  });

  it('실패한 스마일은 수영을 잃지만 열매 숙련 단계는 얻지 못한다', () => {
    const life = emptyLife(18);
    applyFx(life, [{ op: 'eatFruit', id: 'smile_failed' }]);
    expect(life.hero.fruit?.id).toBe('smile_failed');
    expect(life.growth.tier.fruit).toBe(0);
    expect(life.log.at(-1)?.text).toContain('웃음');
  });
});
