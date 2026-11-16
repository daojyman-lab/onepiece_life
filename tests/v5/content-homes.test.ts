// tests/v5/content-homes.test.ts — 4단계 과제 4~8: 고향마다의 내용 (어린 시절, 원작 순간, 그 고향만의 문, 섬에 남은 어른의 삶, 자잘한 일)
import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/v5/data/turnings';
import { WATER7 } from '../../src/v5/data/turnings/water7';
import { WANO } from '../../src/v5/data/turnings/wano';
import { MINORS } from '../../src/v5/data/minors';
import { CANON } from '../../src/v5/data/canon';
import { CANON_WORDS } from '../../src/v5/data/ending';
import type { Cond, Fx, HomeId, Minor, Turning } from '../../src/v5/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => (e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]));
const ageOf = (w: Cond[]) => w.find((c): c is Extract<Cond, { c: 'age' }> => c.c === 'age') ?? { c: 'age' as const };
const homeOf = (w: Cond[]) => w.find((c): c is Extract<Cond, { c: 'home' }> => c.c === 'home')?.is ?? [];
const textOf = (t: Turning) => [t.title, t.body, ...t.doors.flatMap((d) => [d.label, d.hint])].join(' ');
const canonOfT = (t: Turning) => [...(typeof t.speaker === 'object' && 'canon' in t.speaker ? [t.speaker.canon] : []),
  ...t.doors.flatMap((d) => allFx(d.fx)).flatMap((f) => ((f.op === 'person' || f.op === 'timeline') && f.canon ? [f.canon] : []))];
const canonOfM = (m: Minor) => m.outcomes.flatMap((o) => o.fx).flatMap((f) => (f.op === 'timeline' && f.canon ? [f.canon] : []));
const valued = (ts: Turning[]) => ts.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);
/** 고아 · 가난한 집에도 맞는 어린 시절: 형편 · 핏줄 조건도 부모가 필요한 것도 없고, 글이 부모 · 집안을 전제하지 않는다 */
const forOrphan = (t: Turning) => !t.when.some((c) => (c.c === 'wealth' && c.min) || c.c === 'lineage') && !t.needs?.includes('parent')
  && !/부모|아버지|어머니|우리 집/.test(textOf(t));
const special = (t: Turning) => t.when.some((c) => c.c === 'lineage' || c.c === 'species')
  || t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'standing') || d.when?.some((c) => c.c === 'lineage' || c.c === 'species'));

const CASES: [HomeId, Turning[]][] = [['water7', WATER7], ['wano', WANO]];

for (const [id, ts] of CASES) describe(`고향의 내용: ${id}`, () => {
  const minors = MINORS.filter((m) => homeOf(m.when).includes(id));
  it('모두 묶음에 들어 있고, 모두 그 고향 조건을 가진다', () => {
    for (const t of ts) { expect(TURNINGS, t.id).toContain(t); expect(homeOf(t.when), t.id).toEqual([id]); }
  });
  it('어린 시절 전환점(3~15살)이 15개 이상, 그 가운데 고아 · 가난한 집에도 맞는 것이 8개 이상', () => {
    const kids = ts.filter((t) => (ageOf(t.when).max ?? 99) <= 15);
    expect(kids.length).toBeGreaterThanOrEqual(15);
    expect(kids.filter(forOrphan).length).toBeGreaterThanOrEqual(8);
  });
  it('원작 순간(전환점과 만남)이 6개 이상이고, 원작 인물은 모두 CANON과 CANON_WORDS에 있다', () => {
    const cT = ts.filter((t) => canonOfT(t).length > 0), cM = minors.filter((m) => canonOfM(m).length > 0);
    expect(cT.length + cM.length).toBeGreaterThanOrEqual(6);
    for (const c of [...cT.flatMap(canonOfT), ...cM.flatMap(canonOfM)]) { expect(CANON[c], c).toBeDefined(); expect(CANON_WORDS[c], c).toBeDefined(); }
    for (const m of cM) expect(m.cooldownYears, m.id).toBeGreaterThanOrEqual(80);
  });
  it('그 고향만의 문(처지 · 핏줄 · 종족)이 4개 이상', () => {
    expect(ts.filter(special).length).toBeGreaterThanOrEqual(4);
  });
  it('섬에 남은 어른의 삶(16살 이후)이 10개 이상, 서른여섯 이후가 4개 이상', () => {
    const grown = ts.filter((t) => (ageOf(t.when).min ?? 0) >= 16);
    expect(grown.length).toBeGreaterThanOrEqual(10);
    expect(grown.filter((t) => (ageOf(t.when).min ?? 0) >= 36).length).toBeGreaterThanOrEqual(4);
  });
  it('자잘한 일이 8개 이상', () => {
    expect(minors.length).toBeGreaterThanOrEqual(8);
  });
  it('평온이 붙은 문은 가치관이 붙은 문의 18% 이하', () => {
    expect(valued(ts).filter((d) => d.values?.peace).length / valued(ts).length).toBeLessThanOrEqual(0.18);
  });
});
