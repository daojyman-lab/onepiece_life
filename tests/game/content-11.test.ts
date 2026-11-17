// tests/game/content-11.test.ts — 과제 11: 서른여섯 이후와 노년, 기연 · 시련 · 큰 계기의 개수
import { describe, expect, it } from 'vitest';
import { LATE } from '../../src/data/turnings/late';
import { FORTUNES } from '../../src/data/turnings/fortunes';
import { MISFORTUNES } from '../../src/data/turnings/misfortunes';
import { MOMENTS } from '../../src/data/turnings/moments';
import { TURNINGS, TURNING_BY_ID } from '../../src/data/turnings';
import { VALUE_IDS } from '../../src/data/values';
import type { Cond, Fx, Standing, Turning } from '../../src/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);
const standingOf = (t: Turning) => t.when.find((c): c is Extract<Cond, { c: 'standing' }> => c.c === 'standing')?.is ?? [];
const minAge = (t: Turning) => (t.when.find((c) => c.c === 'age') as { min?: number } | undefined)?.min ?? 0;
const valued = (ts: Turning[]) => ts.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);
const peaceShare = (ts: Turning[]) => valued(ts).filter((d) => d.values?.peace).length / valued(ts).length;
const GROUPS: Record<string, Standing[]> = {
  바다: ['pirate', 'bountyHunter', 'warlord'], 깃발: ['marine', 'cp', 'revolution'], 뭍: ['civil', 'shipwright', 'settled'], 은퇴: ['retired'],
};

describe('과제 11: 서른여섯 이후와 노년', () => {
  it('서른여섯 이후의 전환점이 30개 이상이고 모두 묶음에 있다', () => {
    expect(LATE.length).toBeGreaterThanOrEqual(30);
    for (const t of LATE) { expect(TURNINGS, t.id).toContain(t); expect(minAge(t), t.id).toBeGreaterThanOrEqual(36); }
  });
  it('처지마다(바다 · 깃발 · 뭍 · 은퇴) 6개 이상이 그 처지에만 온다', () => {
    for (const [name, sts] of Object.entries(GROUPS)) {
      const only = LATE.filter((t) => standingOf(t).length > 0 && standingOf(t).every((x) => sts.includes(x)));
      expect(only.length, name).toBeGreaterThanOrEqual(6);
    }
  });
  it('닻을 내리다 · 칼을 내려놓다는 되풀이되되 한 인생에 두 번까지다 (거절해도 닫히지 않는다)', () => {
    for (const id of ['path_settle', 'path_retire']) {
      expect(TURNING_BY_ID[id].max, id).toBe(2);
      expect(TURNING_BY_ID[id].doors.some((d) => d.closes), id).toBe(false);
    }
  });
  it('한 파일에서 평온이 붙은 문은 가치관이 붙은 문의 18% 이하다', () => {
    expect(peaceShare(LATE)).toBeLessThanOrEqual(0.18);
  });
});

describe('과제 11: 기연 · 시련 · 큰 계기', () => {
  it('기연이 18개 이상이고 가치관마다 둘 이상이다', () => {
    expect(FORTUNES.length).toBeGreaterThanOrEqual(18);
    for (const v of VALUE_IDS) expect(FORTUNES.filter((f) => f.fortuneOf === v).length, v).toBeGreaterThanOrEqual(2);
  });
  it('숨은 성이 밝혀지는 길이 둘 이상이고, 숨은 성이 있을 때만 온다', () => {
    const reveal = TURNINGS.filter((t) => t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'reveal')) && t.when.some((c) => c.c === 'secret' && !c.known));
    expect(reveal.length).toBeGreaterThanOrEqual(2);
    for (const t of FORTUNES.filter((f) => f.doors.some((d) => allFx(d.fx).some((e) => e.op === 'reveal')))) expect(reveal, t.id).toContain(t);
  });
  it('시련이 10개 이상이다', () => {
    expect(MISFORTUNES.length).toBeGreaterThanOrEqual(10);
    for (const m of MISFORTUNES) for (const f of allFx(m.fx)) if (f.op === 'queue') expect(TURNING_BY_ID[f.turning], `${m.id} → ${f.turning}`).toBeDefined();
  });
  it('큰 계기가 8개 이상이다', () => {
    expect(MOMENTS.length).toBeGreaterThanOrEqual(8);
  });
});
