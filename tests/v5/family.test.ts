// tests/v5/family.test.ts — 가족, 원작 인물의 나이, 태어난 마을
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { applyFx } from '../../src/v5/core/fx';
import { normalizeLife5 } from '../../src/v5/core/load';
import { personIs } from '../../src/v5/core/needs';
import { CANON, canonAge } from '../../src/v5/data/canon';
import { TURNINGS } from '../../src/v5/data/turnings';
import { V } from '../../src/v5/data/balance';
import type { Fx, Life5 } from '../../src/v5/core/types';

const family = (s: Life5) => s.people.filter((p) => p.kind === 'family');
const siblings = (s: Life5) => s.people.filter((p) => personIs(p, 'sibling'));
const lives = (n: number, from: number, opt: Parameters<typeof newLife5>[1]) => Array.from({ length: n }, (_, i) => newLife5(from + i, opt));

describe('가족', () => {
  it('고아는 가족이 없다', () => {
    for (const s of lives(200, 1, { lineage: 'orphan' })) expect(family(s)).toEqual([]);
  });
  it('고아가 아니면 살아 있는 부모가 둘, 형제는 0~3명, 부모는 주인공보다 스무 살 넘게 많고, 성이 같다', () => {
    for (const s of lives(200, 1000, { lineage: 'commoner' })) {
      const parents = s.people.filter((p) => personIs(p, 'parent'));
      expect(parents.map((p) => p.relation).sort()).toEqual(['아버지', '어머니'].sort());
      for (const p of parents) {
        expect(p.alive).toBe(true);
        expect(p.age - s.age).toBeGreaterThanOrEqual(V.family.parentOlder[0]);
        expect(p.age - s.age).toBeLessThanOrEqual(V.family.parentOlder[1]);
      }
      const sib = siblings(s);
      expect(sib.length).toBeLessThanOrEqual(V.family.maxSiblings);
      for (const p of sib) {
        const gap = Math.abs(p.age - s.age);
        expect(gap).toBeGreaterThanOrEqual(1); expect(gap).toBeLessThanOrEqual(8);
        expect(p.age).toBeGreaterThanOrEqual(0);
      }
      for (const p of family(s)) {
        expect(p.name.startsWith(`${s.hero.surname} `)).toBe(true);
        expect(p.crew).toBeUndefined();
      }
    }
  });
  it('가난한 집은 이름난 집안보다 형제가 많다', () => {
    const avg = (w: 'poor' | 'noble') => lives(300, 5000, { wealth: w, lineage: 'commoner' }).reduce((a, s) => a + siblings(s).length, 0) / 300;
    expect(avg('poor')).toBeGreaterThan(avg('noble'));
  });
  it('형제 · 부모가 있으니 그 필요가 맞는 사람이 나온다', () => {
    const ss = lives(200, 1000, { lineage: 'commoner' });
    expect(ss.some((s) => siblings(s).length > 0)).toBe(true);
    expect(ss.some((s) => siblings(s).length === 0)).toBe(true);
  });
});

describe('원작 인물의 나이', () => {
  it('주인공이 열일곱이면 원작이 시작할 때의 나이, 0 아래로는 내려가지 않는다', () => {
    expect(canonAge('luffy', 17)).toBe(17);
    expect(canonAge('smoker', 17)).toBe(34);
    expect(canonAge('luffy', 3)).toBe(3);
    expect(canonAge('coby', 0)).toBe(0);
  });
  it('person 효과의 canon은 이름 · 성별 · 나이를 원작에서 가져온다', () => {
    const s = newLife5(3); s.age = 20;
    applyFx(s, [{ op: 'person', kind: 'master', relation: '스승', canon: 'smoker' }]);
    const p = s.people.at(-1)!;
    expect(p.age).toBe(canonAge('smoker', s.age));
    expect(p.gender).toBe('m');
    expect(p.name).toBe(CANON.smoker.name);
    expect(p.canon).toBe('smoker');
  });
  it('나이를 적으면 그 나이, older면 주인공보다 그만큼 위', () => {
    const s = newLife5(4); s.age = 12;
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '노인', age: { older: 30 } }, { op: 'person', kind: 'ally', relation: '아이', age: 5 }]);
    expect(s.people.at(-2)!.age).toBe(42);
    expect(s.people.at(-1)!.age).toBe(5);
  });
  it('모든 전환점 데이터의 원작 인물은 CANON에 있다', () => {
    const fxOf = (fx: Fx[]): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...fxOf(e.then), ...fxOf(e.else ?? [])] : [e]);
    for (const t of TURNINGS) {
      if (typeof t.speaker === 'object' && 'canon' in t.speaker) expect(CANON[t.speaker.canon], `${t.id} speaker`).toBeDefined();
      for (const e of fxOf([...(t.fx ?? []), ...t.doors.flatMap((d) => d.fx)]))
        if (e.op === 'person' && e.canon) expect(CANON[e.canon], `${t.id} ${e.canon}`).toBeDefined();
    }
  });
});

describe('태어난 마을', () => {
  it('태어난 마을에서 시작하고, 첫 해 구분선에 그 마을이 나온다', () => {
    for (const s of lives(200, 1, {})) {
      expect(s.hero.island).toBe(s.hero.town);
      expect(s.log.find((l) => l.weight === 'year')!.island).toBe(s.hero.town);
    }
  });
  it('가족이 없는 옛 저장은 가족을 새로 만들지 않고 그대로 이어진다', () => {
    const s = JSON.parse(JSON.stringify(newLife5(9, { lineage: 'commoner' })));
    s.people = [];
    const f = normalizeLife5(s)!;
    expect(f).not.toBeNull();
    expect(f.people).toEqual([]);
  });
});
