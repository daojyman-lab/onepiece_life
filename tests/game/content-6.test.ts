// tests/game/content-6.test.ts — 과제 6: 유년기 (3~15살). 마을마다의 전환점, 어느 마을에서나 오는 전환점, 형편, 강점, 열다섯 살의 길.
import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/data/turnings';
import { CHILDHOOD } from '../../src/data/turnings/childhood';
import { TOWNS } from '../../src/data/turnings/towns';
import { HOMETOWNS as ALL_TOWNS } from '../../src/shared/data/births';
// 3단계의 마을 기준은 이스트 블루 여덟 마을이다 (4단계의 다섯 고향은 tests/game/content-13~17이 본다)
const HOMETOWNS = ALL_TOWNS.filter((t) => t.home === 'loguetown');
import { SEAS } from '../../src/shared/data/seas';
import { STRENGTHS } from '../../src/data/strengths';
import type { Cond, Fx, Turning } from '../../src/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);
const cond = <K extends Cond['c']>(t: Turning, c: K) => t.when.find((x) => x.c === c) as Extract<Cond, { c: K }> | undefined;

/** 유년기의 전환점: 아직 아이인 사람에게, 열다섯 살까지만 온다 */
const isChildhood = (t: Turning) => {
  const st = cond(t, 'standing'), age = cond(t, 'age');
  return !!st && st.is.length === 1 && st.is[0] === 'child' && age?.max !== undefined && age.max <= 15;
};
const kids = TURNINGS.filter(isChildhood);
const townOf = (t: Turning) => cond(t, 'town')?.is ?? null;
const generic = kids.filter((t) => townOf(t) === null);
const family = (t: Turning) => (t.needs ?? []).some((n) => n === 'parent' || n === 'sibling');
const poorOnly = (t: Turning) => { const w = cond(t, 'wealth'); return w?.max === 'poor' && !w.min; };
const richOnly = (t: Turning) => { const w = cond(t, 'wealth'); return (w?.min === 'comfortable' || w?.min === 'noble') && !w.max; };
const LEFT = 'left_home_young';
const leaves = (fx: Fx[]) => allFx(fx).some((e) => e.op === 'flag' && e.id === LEFT);

describe('과제 6: 유년기의 개수', () => {
  it('여덟 마을마다 그 마을에서만 오는 유년기 전환점이 넷 이상이다', () => {
    expect(HOMETOWNS.length).toBe(8);
    for (const town of HOMETOWNS.map((h) => h.name))
      expect(kids.filter((t) => townOf(t)?.includes(town)).length, town).toBeGreaterThanOrEqual(4);
  });
  it('어느 마을에서나 오는 유년기 전환점이 서른 개 이상이고, 그중 가족이 필요 없는 것이 스무 개 이상이다', () => {
    expect(generic.length).toBeGreaterThanOrEqual(30);
    expect(generic.filter((t) => !family(t)).length).toBeGreaterThanOrEqual(20);
    expect(generic.some(family)).toBe(true);
  });
  it('가난한 집 아이만 겪는 일과 넉넉한 집 아이만 겪는 일이 각각 여섯 개 이상이다', () => {
    expect(kids.filter(poorOnly).length).toBeGreaterThanOrEqual(6);
    expect(kids.filter(richOnly).length).toBeGreaterThanOrEqual(6);
  });
  it('여섯 가지 강점마다 그리로 가는 표시가 붙은 문이 유년기에 셋 이상이다', () => {
    const doors = kids.flatMap((t) => t.doors);
    for (const s of STRENGTHS) expect(doors.filter((d) => d.mark === s.id).length, s.name).toBeGreaterThanOrEqual(3);
  });
  it('유년기 두 파일 모두 평온이 붙은 문이 가치관이 붙은 문의 18% 이하다', () => {
    for (const [name, list] of [['childhood.ts', CHILDHOOD], ['towns.ts', TOWNS]] as const) {
      const valued = list.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);
      const peace = valued.filter((d) => (d.values?.peace ?? 0) > 0);
      expect(peace.length / valued.length, name).toBeLessThanOrEqual(0.18);
    }
  });
});

describe('과제 6: 열다섯 살의 길', () => {
  const fifteen = kids.filter((t) => (cond(t, 'age')?.min ?? 0) >= 14);
  it('여덟 마을마다 열다섯 살 무렵 어디로 갈지를 묻는 그 마을의 전환점이 있다', () => {
    for (const town of HOMETOWNS.map((h) => h.name))
      expect(fifteen.some((t) => townOf(t)?.includes(town)), town).toBe(true);
  });
  it('형편에 따라 다른 열다섯 살의 길이 있다', () => {
    expect(fifteen.some(poorOnly)).toBe(true);
    expect(fifteen.some(richOnly)).toBe(true);
  });
  it('로그타운이 아닌 마을의 아이도 로그타운으로 가는 문을 만날 수 있다', () => {
    const toLogue = kids.filter((t) => t.doors.some((d) => allFx(d.fx).some((e) => e.op === 'move' && e.island === '로그타운')));
    const towns = new Set(toLogue.flatMap((t) => townOf(t) ?? []));
    expect(towns.size).toBeGreaterThanOrEqual(4);
  });
});

describe('과제 6: 집을 떠나는 아이', () => {
  const leaving = kids.filter((t) => t.doors.some((d) => leaves(d.fx)));
  it('아주 떠나는 문은 마을마다 많아야 하나이고, 열두 살 이상에게만 열리며, 이스트 블루의 실제 항구로 옮긴다', () => {
    const east = SEAS.find((x) => x.id === 'east')!.ports;
    for (const town of HOMETOWNS.map((h) => h.name)) {
      const n = leaving.filter((t) => townOf(t)?.includes(town)).flatMap((t) => t.doors).filter((d) => leaves(d.fx)).length;
      expect(n, town).toBeLessThanOrEqual(1);
    }
    for (const t of leaving) {
      expect(townOf(t), `${t.id}: 떠나는 문은 마을의 전환점에만`).not.toBeNull();
      expect(cond(t, 'age')!.min, t.id).toBeGreaterThanOrEqual(12);
      for (const d of t.doors) if (leaves(d.fx)) {
        const move = allFx(d.fx).find((e) => e.op === 'move') as Extract<Fx, { op: 'move' }> | undefined;
        expect(move, `${t.id} '${d.label}'`).toBeDefined();
        expect(move!.sea).toBe('east');
        expect(east, t.id).toContain(move!.island);
      }
    }
  });
  it('집을 떠난 아이에게는 고향의 유년기가 더 오지 않고, 떠난 아이의 전환점이 따로 있다', () => {
    const blocked = (t: Turning) => t.when.some((c) => c.c === 'flag' && c.id === LEFT && !c.has);
    const away = kids.filter((t) => t.when.some((c) => c.c === 'flag' && c.id === LEFT && c.has));
    for (const t of kids.filter((x) => !away.includes(x))) expect(blocked(t), t.id).toBe(true);
    expect(away.length).toBeGreaterThanOrEqual(2);
  });
  it('마을의 전환점은 지금 그 마을에 있어야 온다', () => {
    for (const t of kids.filter((x) => townOf(x))) expect(cond(t, 'island')?.is, t.id).toEqual(townOf(t));
  });
});
