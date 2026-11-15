// tests/v5/year.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5, invariants5 } from '../../src/v5/core/reduce';
import { checkAll, whyNot } from '../../src/v5/core/cond';
import { applyFx } from '../../src/v5/core/fx';
import { V } from '../../src/v5/data/balance';
import type { Life5 } from '../../src/v5/core/types';

const step = (s: Life5) => reduce5(s, { type: 'step' });
/** 대기 중인 일을 지우고 n토막 흘린다 (사건 과제 전의 뼈대 확인용) */
function flow(s: Life5, parts: number) { for (let i = 0; i < parts; i++) { s = step({ ...s, pending: null }); } return s; }

describe('한 해의 진행', () => {
  it('네 토막이 지나면 한 살을 먹고, 해가 바뀌는 구분 기록이 남는다', () => {
    const s0 = { ...newLife5(3), pending: null };
    const s1 = flow(s0, 4);
    expect(s1.age).toBe(s0.age + 1);
    expect(s1.part).toBe(0);
    expect(s1.log.some((l) => l.weight === 'year' && l.age === s1.age)).toBe(true);
  });
  it('해 구분선에는 나이와 섬이 자료로 실린다', () => {
    let s = newLife5(3); s.pending = null;
    const first = s.log.find((l) => l.weight === 'year');
    expect(first).toMatchObject({ age: V.birth.startAge, island: s.hero.island });   // 시작하는 해에도 구분선이 있다
    for (let i = 0; i < 4; i++) s = reduce5({ ...s, pending: null }, { type: 'step' });
    const years = s.log.filter((l) => l.weight === 'year');
    expect(years[years.length - 1]).toMatchObject({ age: V.birth.startAge + 1, island: s.hero.island });
  });
  it('기록에 달 표시가 없다', () => {
    const s = flow({ ...newLife5(3), pending: null }, 40);
    expect(s.log.every((l) => !/\d+월/.test(l.text))).toBe(true);
  });
  it('한 해에 기록이 평균 2~8줄 쌓인다', () => {
    const s0 = { ...newLife5(5), pending: null };
    const s = flow(s0, 80);
    const lines = s.log.filter((l) => l.weight !== 'year').length - s0.log.length;
    expect(lines / 20).toBeGreaterThanOrEqual(2);
    expect(lines / 20).toBeLessThanOrEqual(8);
  });
  it('대기 중인 일이 있으면 흐르지 않는다', () => {
    const s0: Life5 = { ...newLife5(3), pending: { kind: 'ending', cause: '시험' } };
    expect(step(s0)).toEqual(s0);
  });
  it('입력 상태를 바꾸지 않는다', () => {
    const s0 = { ...newLife5(3), pending: null };
    const copy = JSON.parse(JSON.stringify(s0));
    step(s0);
    expect(s0).toEqual(copy);
  });
  it('JSON으로 되살린 상태는 같은 명령에 같은 결과를 낸다', () => {
    const s0 = flow({ ...newLife5(9), pending: null }, 10);
    expect(step(JSON.parse(JSON.stringify(s0)))).toEqual(step(s0));
  });
  it('조건이 맞는 사건이 하나도 없어도 해는 넘어간다', () => {
    const s0 = { ...newLife5(3), pending: null, age: 30, hero: { ...newLife5(3).hero, standing: 'settled' as const, home: 'zou' as const } };
    expect(flow(s0, 4).age).toBe(31);
  });
  it('불변 조건을 지킨다', () => {
    expect(invariants5(flow({ ...newLife5(11), pending: null }, 60))).toEqual([]);
  });
  it('살아 있는 사람은 주인공과 함께 나이를 먹고, 죽은 사람의 나이는 멈춘다', () => {
    const s0 = { ...newLife5(3), pending: null };
    applyFx(s0, [{ op: 'person', kind: 'ally', relation: '산 벗', name: '산이' }, { op: 'person', kind: 'ally', relation: '죽은 벗', name: '죽이' }]);
    const live = s0.people.find((p) => p.relation === '산 벗')!;
    const dead = s0.people.find((p) => p.relation === '죽은 벗')!;
    dead.alive = false;
    const s = flow(s0, 4 * 3);
    expect(s.age).toBe(s0.age + 3);
    const live1 = s.people.find((p) => p.id === live.id)!;
    expect(live1.alive).toBe(true);
    expect(live1.age).toBe(live.age + 3);
    expect(s.people.find((p) => p.id === dead.id)!.age).toBe(dead.age);
  });
});

describe('조건과 효과', () => {
  it('집안 형편의 벽은 잠긴 이유를 말해 준다', () => {
    const s = newLife5(3); s.hero.wealth = 'poor'; s.hero.money = 0;
    expect(checkAll(s, [{ c: 'money', min: 50000 }])).toBe(false);
    expect(whyNot(s, [{ c: 'money', min: 50000 }])).toMatch(/돈|베리/);
    expect(whyNot(s, [{ c: 'age', min: 1 }])).toBeNull();
  });
  it('확률 효과는 씨앗에 따라 갈린다', () => {
    let a = 0;
    for (let i = 0; i < 400; i++) { const s = newLife5(i); applyFx(s, [{ op: 'chance', p: 0.5, then: [{ op: 'flag', id: 'x' }] }]); if (s.flags.includes('x')) a++; }
    expect(a).toBeGreaterThan(140); expect(a).toBeLessThan(260);
  });
});

describe('죽음과 끝', () => {
  it('죽으면 끝난 자리가 남고, 그 뒤로는 흐르지 않는다', () => {
    const s = { ...newLife5(5), pending: null };
    applyFx(s, [{ op: 'die', cause: '병' }]);
    expect(s.hero.alive).toBe(false);
    expect(s.ended).toEqual({ cause: '병', age: s.age });
    expect(s.pending).toEqual({ kind: 'ending', cause: '병' });
    const dead = { ...s, pending: null };
    const after = step(dead);
    expect(after.pending).toEqual({ kind: 'ending', cause: '병' });
    expect(after.age).toBe(dead.age);
    expect(after.part).toBe(dead.part);
    expect(invariants5(after)).toEqual([]);
  });
  it('기록은 최근 400줄만 남는다', () => {
    const s = newLife5(2);
    for (let i = 0; i < 450; i++) applyFx(s, [{ op: 'log', text: '{town}에서 하루를 보냈다.', weight: 'light' }]);
    expect(s.log).toHaveLength(400);
    expect(s.log.at(-1)!.text).toBe(`${s.hero.town}에서 하루를 보냈다.`);
  });
  it('기록 효과는 {name}을 주인공의 이름으로 채운다', () => {
    const s = newLife5(2);
    applyFx(s, [{ op: 'log', text: '{name}은(는) 주먹을 쥐었다.', weight: 'light' }]);
    expect(s.log.at(-1)!.text).not.toContain('{name}');
    expect(s.log.at(-1)!.text).toContain(s.hero.name);
  });
});
