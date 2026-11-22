// tests/game/content-7.test.ts — 과제 7: 해적과 현상금 사냥꾼의 전환점 (pirate.ts, hunter.ts)
import { describe, expect, it } from 'vitest';
import { PIRATE } from '../../src/data/turnings/pirate';
import { HUNTER } from '../../src/data/turnings/hunter';
import { TURNINGS } from '../../src/data/turnings';
import { V } from '../../src/data/balance';
import type { Fx, Standing, Turning, ValueId } from '../../src/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);
const doorFx = (t: Turning): Fx[] => t.doors.flatMap((d) => allFx(d.fx));
const standingsOf = (t: Turning): Standing[] | null => {
  const c = t.when.find((x) => x.c === 'standing');
  return c && c.c === 'standing' ? c.is : null;
};
/** 처지 조건이 이 처지들 안에만 있다 */
const only = (t: Turning, is: Standing[]) => { const s = standingsOf(t); return s !== null && s.every((x) => is.includes(x)); };
const VALUES: ValueId[] = ['justice', 'greed', 'ambition', 'romance', 'inquiry', 'loyalty', 'freedom', 'dominion', 'peace'];
const valued = (ts: Turning[]) => ts.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);

describe('과제 7: 해적과 현상금 사냥꾼', () => {
  it('모두 사건 목록에 들어 있다', () => {
    for (const t of [...PIRATE, ...HUNTER]) expect(TURNINGS, t.id).toContain(t);
  });
  it('해적(칠무해 포함)의 처지에서만 오는 전환점이 24개 이상, 현상금 사냥꾼만의 것이 14개 이상이다', () => {
    expect(PIRATE.filter((t) => only(t, ['pirate', 'warlord'])).length).toBeGreaterThanOrEqual(24);
    expect(HUNTER.filter((t) => only(t, ['bountyHunter'])).length).toBeGreaterThanOrEqual(14);
  });
  it('두 파일의 문에 아홉 가치관이 모두 3번 이상 나온다', () => {
    const doors = valued([...PIRATE, ...HUNTER]);
    for (const v of VALUES) expect(doors.filter((d) => d.values![v]).length, v).toBeGreaterThanOrEqual(3);
  });
  it('파일마다 평온이 붙은 문은 가치관이 붙은 문의 18% 이하다', () => {
    for (const ts of [PIRATE, HUNTER]) {
      const doors = valued(ts);
      expect(doors.filter((d) => d.values!.peace).length / doors.length).toBeLessThanOrEqual(0.18);
    }
  });
  it('다른 처지로 건너가게 하는 전환점에는 처지가 된 지 두 해 이상이라는 조건이 있다 (감옥에 갇히는 것은 건너가는 제안이 아니다)', () => {
    for (const t of [...PIRATE, ...HUNTER]) {
      const from = standingsOf(t) ?? [];
      const crosses = doorFx(t).some((f) => f.op === 'standing' && f.to !== 'prisoner' && !from.includes(f.to));
      if (!crosses) continue;
      const sy = t.when.find((c) => c.c === 'standingYears');
      expect(sy && sy.c === 'standingYears' ? sy.min : 0, t.id).toBeGreaterThanOrEqual(2);
    }
  });
  // 4단계부터 해적 · 사냥꾼의 사건은 어느 고향에서나 온다(외딴 고향 섬에서는 data/turnings/index.ts의 landlocked가 막는다)
  it('문의 가치관 점수는 V.value.door만큼이다', () => {
    for (const t of [...PIRATE, ...HUNTER]) {
      for (const d of t.doors) for (const v of Object.values(d.values ?? {})) expect(v, t.id).toBe(V.value.door);
    }
  });
  it('들어서는 길이 셋(끌려가서 · 스스로 깃발을 올려서 · 남의 배에 타서) 모두 있다', () => {
    const ids = TURNINGS.map((t) => t.id);
    for (const id of ['path_pirate_taken', 'path_pirate_sail', 'pirate_stowaway']) expect(ids, id).toContain(id);
  });
  it('배를 얻는 전환점은 배를 전제하지 않고, 배를 전제하는 전환점도 있다', () => {
    const givers = TURNINGS.filter((t) => doorFx(t).some((f) => f.op === 'flag' && f.id === 'ship'));
    expect(givers.length).toBeGreaterThanOrEqual(5);
    for (const t of givers) expect(t.needs ?? [], t.id).not.toContain('ship');
    expect(PIRATE.filter((t) => t.needs?.includes('ship')).length).toBeGreaterThanOrEqual(4);
  });
  it('동료를 들이는 전환점, 동료를 잃는 전환점, 동료가 전제인 전환점이 있다', () => {
    const mine = [...PIRATE, ...HUNTER];
    const firstCrew = mine.filter((t) => !t.needs?.includes('crew') && doorFx(t).some((f) => f.op === 'person' && f.kind === 'crew'));
    expect(firstCrew.length).toBeGreaterThanOrEqual(5);
    const partsWithCrew = (t: Turning) => doorFx(t).some((f) =>
      (f.op === 'losePerson' && 'who' in f && f.who === 'crew') ||
      (f.op === 'personChange' && f.kind !== undefined && f.kind !== 'crew' && (
        ('who' in f && f.who === 'crew') ||
        ('relation' in f && t.when.some(c => c.c === 'person' && c.relation === f.relation && c.kinds?.includes('crew')))
      )));
    expect(mine.filter(partsWithCrew).length).toBeGreaterThanOrEqual(4);
    expect(mine.filter((t) => t.needs?.includes('crew')).length).toBeGreaterThanOrEqual(5);
  });
  it('감옥으로 가는 문과 칠무해의 전환점이 있다', () => {
    expect(PIRATE.filter((t) => doorFx(t).some((f) => f.op === 'standing' && f.to === 'prisoner')).length).toBeGreaterThanOrEqual(2);
    expect(PIRATE.filter((t) => only(t, ['warlord'])).length).toBeGreaterThanOrEqual(2);
  });
  it('사냥꾼에서 해적과 해군으로, 해적에서 사냥꾼으로 건너가는 길이 있다', () => {
    const to = (ts: Turning[], s: Standing) => ts.some((t) => doorFx(t).some((f) => f.op === 'standing' && f.to === s));
    expect(to(HUNTER, 'pirate')).toBe(true);
    expect(to(HUNTER, 'marine')).toBe(true);
    expect(to(PIRATE, 'bountyHunter')).toBe(true);
  });
});
