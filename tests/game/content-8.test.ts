// tests/game/content-8.test.ts — 과제 8: 깃발 아래의 길 (해군과 CP, 혁명군)의 개수와 가치관의 고루 퍼짐
import { describe, expect, it } from 'vitest';
import { MARINE } from '../../src/data/turnings/marine';
import { REVOLUTION } from '../../src/data/turnings/revolution';
import { TURNINGS } from '../../src/data/turnings';
import type { Fx, Turning, ValueId } from '../../src/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);
const standingIs = (t: Turning, x: string) => t.when.some((c) => c.c === 'standing' && c.is.includes(x as never));
const leadsTo = (t: Turning, x: string) => t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'standing' && f.to === x));
/** 가치관이 붙은 문과 그 가운데 평온이 붙은 문 */
const valued = (ts: Turning[]) => ts.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);
const peaceShare = (ts: Turning[]) => valued(ts).filter((d) => d.values?.peace).length / valued(ts).length;

describe('과제 8: 해군과 CP, 혁명군', () => {
  it('해군의 전환점이 22개 이상이고, 그 가운데 CP로 가는 길과 CP의 처지에서 오는 것이 6개 이상이다', () => {
    expect(MARINE.length).toBeGreaterThanOrEqual(22);
    expect(MARINE.filter((t) => standingIs(t, 'cp') || leadsTo(t, 'cp')).length).toBeGreaterThanOrEqual(6);
  });
  it('혁명군의 전환점이 14개 이상이다', () => {
    expect(REVOLUTION.length).toBeGreaterThanOrEqual(14);
  });
  it('모두 묶음에 들어 있다', () => {
    for (const t of [...MARINE, ...REVOLUTION]) expect(TURNINGS, t.id).toContain(t);
  });
  it('아홉 가치관이 두 파일의 문에 저마다 세 번 이상 붙는다', () => {
    const count: Partial<Record<ValueId, number>> = {};
    for (const d of valued([...MARINE, ...REVOLUTION])) for (const v of Object.keys(d.values!) as ValueId[]) count[v] = (count[v] ?? 0) + 1;
    for (const v of ['justice', 'greed', 'ambition', 'romance', 'inquiry', 'loyalty', 'freedom', 'dominion', 'peace'] as ValueId[])
      expect(count[v] ?? 0, v).toBeGreaterThanOrEqual(3);
  });
  it('정의가 붙은 문이 해군에만 몰리지 않고, 해군에도 야망 · 의리 · 패도의 문이 있다', () => {
    const has = (ts: Turning[], v: ValueId) => valued(ts).filter((d) => d.values?.[v]).length;
    expect(has(REVOLUTION, 'justice')).toBeGreaterThanOrEqual(3);
    for (const v of ['ambition', 'loyalty', 'dominion'] as ValueId[]) expect(has(MARINE, v), v).toBeGreaterThanOrEqual(3);
  });
  it('한 파일에서 평온이 붙은 문은 가치관이 붙은 문의 18% 이하다', () => {
    expect(peaceShare(MARINE)).toBeLessThanOrEqual(0.18);
    expect(peaceShare(REVOLUTION)).toBeLessThanOrEqual(0.18);
  });
  it('첫 일은 차례대로 온다: 훈련소(또는 사관학교) → 첫 임무 → 그 뒤의 일, CP에 들면 이름을 버리는 날이 먼저', () => {
    const by = (id: string) => TURNINGS.find((t) => t.id === id)!;
    const sets = (fx: Fx[], id: string) => fx.some((f) => f.op === 'flag' && f.id === id);
    const needsFlag = (t: Turning, id: string, has: boolean) => t.when.some((c) => c.c === 'flag' && c.id === id && c.has === has);
    // 훈련소의 문과 사관학교에 드는 문은 모두 mnBoot를 남긴다
    for (const d of by('mn_boot_camp').doors) expect(sets(d.fx, 'mnBoot'), d.label).toBe(true);
    const academy = ['path_marine_join', 'path_marine_family'].flatMap((id) => by(id).doors).filter((d) => d.fx.some((f) => f.op === 'rank'));
    expect(academy.length).toBeGreaterThan(0);
    for (const d of academy) expect(sets(d.fx, 'mnBoot'), d.label).toBe(true);
    // 첫 임무는 훈련소 뒤에, 한 번. 모든 문이 mnFirst를 남긴다
    expect(needsFlag(by('mn_first_mission'), 'mnBoot', true)).toBe(true);
    for (const d of by('mn_first_mission').doors) expect(sets(d.fx, 'mnFirst'), d.label).toBe(true);
    // 첫 임무를 치른 뒤라야 오는 일
    for (const id of ['mn_promotion', 'mn_comrade_death', 'mn_transfer', 'mn_unjust_order', 'mn_desert', 'mn_undercover', 'mn_squad_pick'])
      expect(needsFlag(by(id), 'mnFirst', true), id).toBe(true);
    // CP로 드는 문은 모두 cpNew를 남기고, 이름을 버리는 날이 그것을 지운다. 다른 CP의 일은 cpNew가 없어야 온다
    for (const t of TURNINGS) for (const d of t.doors)
      if (allFx(d.fx).some((f) => f.op === 'standing' && f.to === 'cp')) expect(sets(allFx(d.fx), 'cpNew'), `${t.id} ${d.label}`).toBe(true);
    const nameless = by('cp_nameless');
    expect(needsFlag(nameless, 'cpNew', true)).toBe(true);
    for (const d of nameless.doors) expect(d.fx.some((f) => f.op === 'unflag' && f.id === 'cpNew'), d.label).toBe(true);
    for (const t of MARINE.filter((x) => x !== nameless && standingIs(x, 'cp'))) expect(needsFlag(t, 'cpNew', false), t.id).toBe(true);
  });
  it('해군에서 처지를 옮기는 전환점은 그 처지가 된 지 두 해가 지나야 온다', () => {
    for (const t of [...MARINE, ...REVOLUTION]) {
      const from = t.when.find((c) => c.c === 'standing');
      if (!from || from.c !== 'standing' || from.is.includes('child')) continue;
      const crosses = t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'standing' && !from.is.includes(f.to) && f.to !== 'prisoner'));
      if (crosses) expect(t.when.some((c) => c.c === 'standingYears' && c.min >= 2), t.id).toBe(true);
    }
  });
});
