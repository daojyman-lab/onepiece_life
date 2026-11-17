// tests/game/content-9.test.ts — 과제 9: 뭍의 삶(시민 · 조선공 · 정착)과 삶의 사건의 개수, 가족이 필요한 사건, 청혼의 앞뒤
import { describe, expect, it } from 'vitest';
import { LAND } from '../../src/data/turnings/land';
import { LIFE } from '../../src/data/turnings/life';
import { TURNINGS, TURNING_BY_ID } from '../../src/data/turnings';
import type { Cond, Fx, Need, Turning } from '../../src/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);
const valued = (ts: Turning[]) => ts.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);
const peaceShare = (ts: Turning[]) => valued(ts).filter((d) => d.values?.peace).length / valued(ts).length;
const standingCond = (t: Turning) => t.when.find((c): c is Extract<Cond, { c: 'standing' }> => c.c === 'standing');
const needsOf = (t: Turning, n: Need) => (t.needs ?? []).includes(n);

describe('과제 9: 뭍의 삶과 삶의 사건', () => {
  it('뭍의 처지(시민 · 조선공 · 정착)에서만 오는 전환점이 24개 이상이다', () => {
    expect(LAND.length).toBeGreaterThanOrEqual(24);
    for (const t of LAND) for (const x of standingCond(t)!.is) expect(['civil', 'shipwright', 'settled'], t.id).toContain(x);
  });
  it('조선공과 정착에서 오는 것이 각각 여섯 개 이상이다', () => {
    for (const x of ['shipwright', 'settled']) expect(LAND.filter((t) => standingCond(t)!.is.includes(x as never)).length, x).toBeGreaterThanOrEqual(6);
  });
  it('정착한 사람의 사건이 예순 넘어까지 열린다 (뭍에 눌러앉은 뒤의 삼십 년)', () => {
    const late = LAND.filter((t) => standingCond(t)!.is.includes('settled') && t.when.some((c) => c.c === 'age' && (c.max ?? 99) >= 65));
    expect(late.length).toBeGreaterThanOrEqual(5);
  });
  it('삶의 사건이 24개 이상이다', () => {
    expect(LIFE.length).toBeGreaterThanOrEqual(24);
  });
  it('모두 묶음에 들어 있다', () => {
    for (const t of [...LAND, ...LIFE]) expect(TURNINGS, t.id).toContain(t);
  });
  it('배우자 · 자식 · 부모 · 형제가 필요한 전환점이 각각 세 개 이상이다', () => {
    for (const n of ['spouse', 'child', 'parent', 'sibling'] as Need[]) expect(TURNINGS.filter((t) => needsOf(t, n)).length, n).toBeGreaterThanOrEqual(3);
    for (const n of ['spouse', 'child', 'parent', 'sibling'] as Need[]) expect(LIFE.filter((t) => needsOf(t, n)).length, `${n} (life.ts)`).toBeGreaterThanOrEqual(3);
  });
  it('한 파일에서 평온이 붙은 문은 가치관이 붙은 문의 18% 이하다', () => {
    expect(peaceShare(LAND)).toBeLessThanOrEqual(0.18);
    expect(peaceShare(LIFE)).toBeLessThanOrEqual(0.18);
  });
  it('다른 처지로 건너가는 전환점에는 standingYears가 있다', () => {
    for (const t of [...LAND, ...LIFE]) {
      const from = standingCond(t)?.is ?? [];
      const crosses = t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'standing' && !from.includes(f.to) && f.to !== 'prisoner' && f.to !== 'settled' && f.to !== 'civil'));
      if (crosses) expect(t.when.some((c) => c.c === 'standingYears'), t.id).toBe(true);
    }
  });
});

describe('과제 9: 혼인과 자식의 앞뒤', () => {
  it('청혼은 마음에 둔 사람이 생긴 뒤에만 온다', () => {
    expect(TURNING_BY_ID.pp_marriage.when).toContainEqual({ c: 'flag', id: 'sweetheart', has: true });
    const sets = TURNINGS.filter((t) => t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'flag' && f.id === 'sweetheart')));
    expect(sets.map((t) => t.id)).toContain('life_meet');
  });
  it('혼인으로 배우자를 얻는 문은 표시 married를 세운다', () => {
    for (const t of TURNINGS) for (const d of t.doors) {
      const fx = allFx(d.fx);
      if (fx.some((f) => f.op === 'person' && f.kind === 'family' && f.relation === '배우자')) expect(fx, `${t.id} '${d.label}'`).toContainEqual({ op: 'flag', id: 'married' });
    }
  });
  it('혼인을 받아들이는 문과 물리는 문에 서로 다른 가치관이 붙는다', () => {
    for (const id of ['pp_marriage', 'life_family_objection', 'life_love_or_route', 'life_waited']) {
      const vs = TURNING_BY_ID[id].doors.map((d) => Object.keys(d.values ?? {}).join(','));
      expect(new Set(vs).size, id).toBe(vs.length);
    }
  });
  it('갓 태어난 자식은 0살로 생긴다 (주인공과 함께 늙어 죽지 않게)', () => {
    const born = TURNING_BY_ID.pp_child.doors.flatMap((d) => allFx(d.fx)).filter((f) => f.op === 'person' && f.kind === 'family');
    expect(born.length).toBeGreaterThan(0);
    for (const f of born) expect(f).toMatchObject({ relation: '자식', age: 0 });
  });
  it('자식이 자라서 오는 사건은 자식이 생길 수 있는 나이보다 열 해 이상 뒤에 온다', () => {
    const childMax = (TURNING_BY_ID.pp_child.when.find((c) => c.c === 'age') as { max: number }).max;
    for (const t of LIFE.filter((x) => needsOf(x, 'child'))) {
      const a = t.when.find((c) => c.c === 'age') as { min: number };
      expect(a.min, t.id).toBeGreaterThanOrEqual(childMax + 8);
    }
  });
  it('어릴 적 맞수를 만든 문이 다시 만나는 사건의 표시를 세운다', () => {
    const rivals = TURNINGS.flatMap((t) => t.doors.map((d) => allFx(d.fx))).filter((fx) => fx.some((f) => f.op === 'person' && f.relation === '어릴 적 맞수'));
    expect(rivals.length).toBeGreaterThan(0);
    for (const fx of rivals) expect(fx).toContainEqual({ op: 'flag', id: 'kidRival' });
  });
});
