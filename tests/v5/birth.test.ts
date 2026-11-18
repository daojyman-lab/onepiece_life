// tests/v5/birth.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5, fullName } from '../../src/v5/core/state';
import { V } from '../../src/v5/data/balance';

const many = Array.from({ length: 2000 }, (_, i) => newLife5(100 + i));

describe('출생 주사위', () => {
  it('같은 씨앗은 같은 출생을 낸다', () => {
    expect(newLife5(42).hero).toEqual(newLife5(42).hero);
  });
  it('이 단계에서는 모두 로그타운에서 태어난다', () => {
    expect(many.every((s) => s.hero.home === 'loguetown')).toBe(true);
  });
  it('집안 형편 네 가지가 모두 나오고, 가난이 명문보다 흔하다', () => {
    const n = (w: string) => many.filter((s) => s.hero.wealth === w).length;
    for (const w of ['poor', 'common', 'comfortable', 'noble']) expect(n(w)).toBeGreaterThan(0);
    expect(n('poor')).toBeGreaterThan(n('noble'));
  });
  it('시작 돈은 집안 형편을 따른다', () => {
    for (const s of many) expect(s.hero.money).toBe(V.wealthMoney[s.hero.wealth]);
  });
  it('고아는 성을 모르고, 희귀 성씨와 인간이 아닌 종족은 고아다', () => {
    for (const s of many) {
      if (s.hero.lineage === 'orphan') expect(s.hero.surname).toBeNull();
      if (s.hero.secretSurname) expect(s.hero.lineage).toBe('orphan');
      if (s.hero.species !== 'human') expect(s.hero.lineage).toBe('orphan');
    }
    expect(many.some((s) => s.hero.secretSurname)).toBe(true);
  });
  it('재능은 둘에서 다섯이고, 고아와 가난은 시련을 안고 시작한다', () => {
    for (const s of many) {
      expect(s.hero.talents.length).toBeGreaterThanOrEqual(2);
      expect(s.hero.talents.length).toBeLessThanOrEqual(5);
      if (s.hero.lineage === 'orphan') expect(s.hardship).toBeGreaterThanOrEqual(V.hardship.orphan);
    }
  });
  it('집안 형편 · 핏줄을 정해 주면 돈 · 시련 · 성씨가 그에 맞는다', () => {
    for (let i = 0; i < 300; i++) {
      const o = newLife5(100 + i, { wealth: 'poor', lineage: 'orphan' });
      expect(o.hero.surname).toBeNull();
      expect(o.hero.money).toBe(V.wealthMoney.poor);
      expect(o.hardship).toBe(V.hardship.poor + V.hardship.orphan);
      expect(o.log[0].text).toContain('불렀다');                 // 고아의 출생 이야기
      const n = newLife5(100 + i, { wealth: 'noble', lineage: 'commoner' });
      expect(n.hero.surname).not.toBeNull();
      expect(n.hero.secretSurname).toBeNull();
      expect(n.hero.money).toBe(V.wealthMoney.noble);
      expect(n.hardship).toBe(0);
    }
    const rareOrphans = Array.from({ length: 600 }, (_, i) => newLife5(100 + i, { lineage: 'orphan' }));
    expect(rareOrphans.some((s) => s.hero.secretSurname)).toBe(true);
  });
  it('성을 모르는 고아의 이름에 undefined나 null이 찍히지 않는다', () => {
    for (const s of many) {
      expect(fullName(s.hero)).not.toMatch(/undefined|null/);
      expect(fullName(s.hero).trim().length).toBeGreaterThan(0);
    }
  });
});
