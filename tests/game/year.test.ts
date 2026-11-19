// tests/game/year.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { apply5, reduce5, invariants5 } from '../../src/core/reduce';
import { lineFits, stepPart } from '../../src/core/year';
import { checkAll, whyNot } from '../../src/core/cond';
import { applyFx } from '../../src/core/fx';
import { yearDivider } from '../../src/core/log';
import { sailTo } from '../../src/core/voyage';
import { arrive } from '../../src/core/passage';
import { V } from '../../src/data/balance';
import { LINES } from '../../src/data/lines';
import { rngOf } from '../../src/shared/core/rng';
import { choose } from '../../src/core/autoplay';
import type { Life5 } from '../../src/core/types';

const step = (s: Life5) => reduce5(s, { type: 'step' });
/** 대기 중인 일을 지우고 n토막 흘린다 (사건 과제 전의 뼈대 확인용) */
function flow(s: Life5, parts: number) { for (let i = 0; i < parts; i++) { s = step({ ...s, pending: null }); } return s; }

describe('한 해의 진행', () => {
  it('직접 한 철 쉬면 시간과 체력이 함께 회복되고 선의가 회복을 돕는다', () => {
    const base = newLife5(501); base.pending = null; base.age = 25; base.hero.standing = 'pirate'; base.hero.hp = 30;
    const without = reduce5(base, { type: 'rest' });
    expect(without.part).not.toBe(base.part);
    expect(without.hero.hp).toBeGreaterThan(base.hero.hp + 10);
    const withMedic = structuredClone(base);
    applyFx(withMedic, [{ op: 'person', kind: 'crew', relation: '선의', role: 'medic' }]);
    withMedic.people.find((p) => p.crew?.role === 'medic')!.crew!.medicalSkill = 100;
    const healed = reduce5(withMedic, { type: 'rest' });
    expect(healed.hero.hp).toBeGreaterThan(without.hero.hp);
  });
  it('떠 있는 선택이 있으면 직접 쉬어서 건너뛸 수 없다', () => {
    const s = newLife5(502);
    expect(reduce5(s, { type: 'rest' })).toEqual(s);
  });
  it('직접 쉬는 동안 우발적인 잡전투가 발생하지 않는다', () => {
    const oldChance = V.fight.minorP;
    (V.fight as { minorP: number }).minorP = 1;
    try {
      const s = newLife5(503);
      s.pending = null;
      s.age = 25;
      s.hero.standing = 'pirate';
      s.stopsThisYear = 999;
      const before = s.log.filter((line) => line.type === 'battle').length;
      const after = reduce5(s, { type: 'rest' });
      expect(after.pending?.kind).not.toBe('battle');
      expect(after.log.filter((line) => line.type === 'battle')).toHaveLength(before);
    } finally {
      (V.fight as { minorP: number }).minorP = oldChance;
    }
  });
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
  it('탐구와 자유가 두드러진 인물에게 정의 일상 기록은 뜨지 않는다', () => {
    const s = newLife5(3);
    s.age = 48;
    for (const id of Object.keys(s.values) as (keyof typeof s.values)[]) s.values[id] = 0;
    s.values.inquiry = 70;
    s.values.freedom = 40;
    const justice = LINES.find((l) => l.text.includes('일꾼의 품삯을 떼먹'))!;
    const neutral = LINES.find((l) => l.text === '무릎이 쑤시는 걸 보니 비가 올 모양이었다.')!;
    expect(lineFits(s, justice)).toBe(false);
    expect(lineFits(s, neutral)).toBe(true);
    s.values.justice = 80;
    expect(lineFits(s, justice)).toBe(true);
  });
  it('강자 소문은 성취욕이 깊고 평온을 우선하지 않는 젊은 인물에게만 맞는다', () => {
    const line = LINES.find((l) => /센 사람이|강하다는 싸움꾼/.test(l.text))!;
    const s = newLife5(3); s.age = 24;
    for (const id of Object.keys(s.values) as (keyof typeof s.values)[]) s.values[id] = 0;
    s.values.ambition = 40;
    expect(lineFits(s, line)).toBe(false);
    s.values.ambition = 80;
    expect(lineFits(s, line)).toBe(true);
    s.values.peace = 70;
    expect(lineFits(s, line)).toBe(false);
    s.values.peace = 0; s.age = 40;
    expect(lineFits(s, line)).toBe(false);
  });
  it('강자 소문은 한 인생에 한 번만 기록된다', () => {
    const line = LINES.find((l) => /센 사람이|강하다는 싸움꾼/.test(l.text))!;
    const originalLines = [...LINES];
    const lineRates = V.lines as { dailyP: number; minorP: number };
    const dailyP = lineRates.dailyP, minorP = lineRates.minorP;
    try {
      LINES.splice(0, LINES.length, line);
      lineRates.dailyP = 1; lineRates.minorP = 0;
      const s = newLife5(11);
      s.pending = null; s.age = 24; s.hero.standing = 'civil';
      for (const id of Object.keys(s.values) as (keyof typeof s.values)[]) s.values[id] = 0;
      s.values.ambition = 80;
      for (let i = 0; i < 16; i++) { s.pending = null; s.recentLines = []; stepPart(s); }
      expect(s.log.filter((l) => l.text === line.text)).toHaveLength(1);
    } finally {
      LINES.splice(0, LINES.length, ...originalLines);
      lineRates.dailyP = dailyP; lineRates.minorP = minorP;
    }
  });
  it('같은 나이에 섬을 옮기면 뒤따르는 기록 앞에 새 장소가 표시된다', () => {
    const s = newLife5(3);
    s.age = 48;
    s.hero.island = '조';
    yearDivider(s);
    applyFx(s, [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'log', text: '새 섬에서 일했다.', weight: 'light' }]);
    expect(s.log.slice(-3)).toMatchObject([
      { weight: 'year', age: 48, island: '드레스로자', moved: true },
      { text: expect.stringContaining('꽃다발을 든 가족') },
      { text: '새 섬에서 일했다.' },
    ]);
  });
  it('항로 이동과 귀향에도 새 장소가 표시되고 같은 섬으로 이동할 때는 중복되지 않는다', () => {
    const s = newLife5(3, { home: 'loguetown' });
    s.age = 48;
    s.hero.island = '조';
    const before = s.log.filter((l) => l.weight === 'year').length;
    sailTo(s, '드레스로자', 'calm');
    expect(s.hero.island).toBe('조');
    arrive(s, s.passage!);
    expect(s.log.filter((l) => l.weight === 'year')).toHaveLength(before + 1);
    expect(s.log.at(-3)).toMatchObject({ weight: 'year', island: '드레스로자', moved: true });
    expect(s.log.at(-2)?.text).toContain('꽃다발을 든 가족');
    applyFx(s, [{ op: 'move', island: '드레스로자', sea: 'nw_first' }]);
    expect(s.log.filter((l) => l.weight === 'year')).toHaveLength(before + 1);
    applyFx(s, [{ op: 'moveHome' }]);
    expect(s.log.at(-1)).toMatchObject({ weight: 'year', island: s.hero.town });
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
  it('일상 기록과 자잘한 일의 글은 12줄 안에 다시 나오지 않는다', () => {
    expect(V.lines.noRepeat).toBe(12);
    let inspected = 0;
    for (const seed of [9000, 9001, 9002]) {
      const s = newLife5(seed);
      const rng = rngOf({ seed: seed ^ 0x5eed, cursor: 0 });
      const day: string[] = [];
      // 신문과 가족 소식도 같은 로그를 쓰므로 오래된 줄이 잘리기 전에 읽는다.
      for (let step = 0; step < 20000 && s.pending?.kind !== 'ending'; step++) {
        const from = s.seq;
        apply5(s, s.pending ? { type: 'answer', index: choose(s, 'random', rng) } : { type: 'step' });
        for (const line of s.log.filter(l => l.id >= from && l.type === 'day' && l.weight === 'light')) {
          expect(day.slice(-V.lines.noRepeat), `seed ${seed} #${day.length}`).not.toContain(line.text);
          day.push(line.text);
        }
      }
      inspected += day.length;
      expect(s.recentLines.length).toBeLessThanOrEqual(V.lines.noRepeat);
    }
    expect(inspected).toBeGreaterThan(150);
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
    s0.vows!.declined = true; // 생애 서약 제안도 없는 조건에서 시간 진행만 본다
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
