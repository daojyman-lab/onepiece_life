// tests/v5/homes.test.ts — 4단계: 고향의 마을에서 태어난다 (과제 1)
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { check } from '../../src/v5/core/cond';
import { HOMES } from '../../src/v5/data/homes';
import { HOMETOWNS, SURNAMES } from '../../src/data/births';
import type { HomeId } from '../../src/v5/core/types';

const IDS = Object.keys(HOMES) as HomeId[];
const born = (home: HomeId, n = 200) => Array.from({ length: n }, (_, i) => newLife5(300 + i, { home }));

describe('고향의 마을 (과제 1)', () => {
  it('고향마다 마을이 둘 이상 있다', () => {
    for (const id of IDS) expect(HOMETOWNS.filter((t) => t.home === id).length, id).toBeGreaterThanOrEqual(2);
  });
  it('고향을 정하면 늘 그 고향의 마을에서 태어나고, 그 마을이 첫 섬이며, 고향의 바다에 있다', () => {
    for (const id of IDS) {
      const towns = HOMETOWNS.filter((t) => t.home === id).map((t) => t.name);
      for (const s of born(id)) {
        expect(towns, `${id}: ${s.hero.town}`).toContain(s.hero.town);
        expect(s.hero.island).toBe(s.hero.town);
        expect(s.hero.sea).toBe(HOMES[id].sea);
      }
    }
  });
  it('와노쿠니에서는 무사 가문이, 어인섬에서는 차별받는 핏줄이 나온다. 로그타운에서는 둘 다 나오지 않는다', () => {
    expect(born('wano').some((s) => s.hero.lineage === 'samurai')).toBe(true);
    expect(born('fishman').some((s) => s.hero.lineage === 'outcast')).toBe(true);
    expect(born('loguetown').some((s) => ['samurai', 'outcast'].includes(s.hero.lineage))).toBe(false);
  });
  it('어인섬 · 조우 · 하늘섬에서 나고 자란 아이는 그 고향의 종족이고, 다른 종족은 떠내려온 고아다', () => {
    for (const id of ['fishman', 'zou', 'sky'] as HomeId[])
      for (const s of born(id)) {
        if (!HOMES[id].species.includes(s.hero.species)) expect(s.hero.lineage, `${id} ${s.hero.species}`).toBe('orphan');
      }
    expect(born('fishman').filter((s) => s.hero.lineage !== 'orphan').every((s) => ['fishman', 'merfolk'].includes(s.hero.species))).toBe(true);
  });
  it('이스트 블루의 이름난 집안은 로그타운(이스트 블루)에서만 나온다', () => {
    const local = SURNAMES.filter((x) => x.kind === 'local').map((x) => x.name);
    for (const id of IDS.filter((x) => x !== 'loguetown'))
      for (const s of born(id)) expect(local, `${id} ${s.hero.surname}`).not.toContain(s.hero.surname);
  });
  it('종족 조건이 있다', () => {
    const s = newLife5(1, { home: 'zou' });
    expect(check(s, { c: 'species', is: [s.hero.species] })).toBe(true);
    expect(check(s, { c: 'species', is: ['giant'] })).toBe(s.hero.species === 'giant');
  });
});
