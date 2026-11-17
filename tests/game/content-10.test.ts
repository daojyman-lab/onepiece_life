// tests/game/content-10.test.ts — 과제 10: 원작과 겹치는 순간과 바다 이동의 개수, 원작 표시, 약한 인물에게 열리는 문
import { describe, expect, it } from 'vitest';
import { CANON_EAST } from '../../src/data/turnings/canon';
import { CANON_SEA } from '../../src/data/turnings/canon-2';
import { SEA_LEAVE, SEA_RETURN } from '../../src/data/turnings/sea';
import { SEA_GRAND_LINE, SEA_NEW_WORLD } from '../../src/data/turnings/sea-2';
import { TURNINGS } from '../../src/data/turnings';
import { MINORS } from '../../src/data/minors';
import { CANON } from '../../src/data/canon';
import { CANON_WORDS } from '../../src/data/ending';
import { FOES, FOE_SEA } from '../../src/data/foes';
import { HOMETOWNS as ALL_TOWNS } from '../../src/shared/data/births';
// 3단계의 마을 기준은 이스트 블루 여덟 마을이다 (4단계의 다섯 고향은 tests/game/content-13~17이 본다)
const HOMETOWNS = ALL_TOWNS.filter((t) => t.home === 'loguetown');
import { newLife5 } from '../../src/core/state';
import { runMinor } from '../../src/core/minor';
import { applyFx } from '../../src/core/fx';
import { rngOf } from '../../src/shared/core/rng';
import type { Cond, Door, Fx, SeaId, Turning } from '../../src/core/types';

const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);
const doorFx = (t: Turning) => t.doors.flatMap((d) => allFx(d.fx));
const seaOf = (t: Turning) => t.when.find((c): c is Extract<Cond, { c: 'sea' }> => c.c === 'sea')?.is ?? [];
const valued = (ts: Turning[]) => ts.flatMap((t) => t.doors).filter((d) => Object.keys(d.values ?? {}).length > 0);
const peaceShare = (ts: Turning[]) => valued(ts).filter((d) => d.values?.peace).length / valued(ts).length;
const canonTurnings = [...CANON_EAST, ...CANON_SEA];
const canonMinors = MINORS.filter((m) => m.outcomes.every((o) => allFx(o.fx).some((f) => f.op === 'timeline' && f.canon)));
/** 단계도 이름값도 없는 사람에게 열리는 문: 조건도 필요도 없고 가치관이 깊어야 열리는 문도 아니다 */
const openToWeak = (d: Door) => !d.when?.length && !d.needs?.length && !d.special;
const subset = (xs: readonly SeaId[], of: SeaId[]) => xs.length > 0 && xs.every((x) => of.includes(x));

describe('과제 10: 원작과 겹치는 순간', () => {
  it('원작 인물이 말하는 전환점이 20개 이상이고, 모두 묶음에 들어 있다', () => {
    expect(canonTurnings.length).toBeGreaterThanOrEqual(20);
    for (const t of canonTurnings) {
      expect(TURNINGS, t.id).toContain(t);
      expect(typeof t.speaker === 'object' && 'canon' in t.speaker, t.id).toBe(true);
    }
  });
  it('저절로 지나가는 만남이 12개 이상이고, 모든 결과가 연표에 원작 표시를 남긴다', () => {
    expect(canonMinors.length).toBeGreaterThanOrEqual(12);
    for (const m of canonMinors) expect(m.cooldownYears, m.id).toBeGreaterThanOrEqual(80);
  });
  it('여덟 마을마다 원작의 순간이 하나 이상 있다', () => {
    const hasCanon = (fx: Fx[], t?: Turning) => (t && typeof t.speaker === 'object' && 'canon' in t.speaker) || fx.some((f) => (f.op === 'person' && f.canon) || (f.op === 'timeline' && f.canon));
    for (const h of HOMETOWNS) {
      const inTown = (w: Cond[]) => w.some((c) => c.c === 'town' && c.is.includes(h.name));
      const turnings = TURNINGS.filter((t) => inTown(t.when) && hasCanon(doorFx(t), t));
      const minors = canonMinors.filter((m) => inTown(m.when));
      expect(turnings.length + minors.length, h.name).toBeGreaterThan(0);
    }
  });
  it('전환점과 사람에 나오는 모든 원작 인물이 CANON과 CANON_WORDS에 있다', () => {
    for (const t of TURNINGS) {
      const ids = [...(typeof t.speaker === 'object' && 'canon' in t.speaker ? [t.speaker.canon] : []),
        ...doorFx(t).flatMap((f) => (f.op === 'person' && f.canon ? [f.canon] : []))];
      for (const id of ids) { expect(CANON[id], `${t.id}: ${id}`).toBeDefined(); expect(CANON_WORDS[id], `${t.id}: ${id}`).toBeDefined(); }
    }
  });
  it('이스트 블루의 원작 상대(버기 · 쿠로 · 크리크 · 알비다)가 이스트 블루의 이름 있는 상대다', () => {
    for (const id of ['b_buggy', 'b_kuro', 'b_krieg', 'b_alvida']) { expect(FOES[id], id).toBeDefined(); expect(FOE_SEA[id], id).toBe('east'); }
    const foes = TURNINGS.flatMap((t) => doorFx(t)).flatMap((f) => (f.op === 'fight' ? [f.foe] : []));
    for (const f of foes) expect(FOES[f], f).toBeDefined();
    for (const id of ['b_morgan', 'b_buggy', 'b_kuro', 'b_krieg', 'b_arlong', 'b_smoker']) expect(foes, id).toContain(id);
  });
  it('저절로 지나간 만남은 연표에 원작 표시로 남는다 (엔딩의 「겹친 원작 순간」)', () => {
    let marked = 0;
    for (let i = 0; i < 20; i++) {
      const s = newLife5(i); s.pending = null; s.age = 6; s.hero.standing = 'child'; s.hero.town = '후샤 마을'; s.hero.island = '후샤 마을';
      s.seen = Object.fromEntries(MINORS.filter((m) => m.id !== 'm_cn_makino').map((m) => [m.id, s.age]));
      if (runMinor(s, rngOf(s.rng)) && s.timeline.some((t) => t.canon === 'makino')) marked++;
    }
    expect(marked).toBeGreaterThan(0);
    const s = newLife5(1); applyFx(s, [{ op: 'timeline', text: '만났다', canon: 'zoro' }]);
    expect(s.timeline.at(-1)).toMatchObject({ text: '만났다', canon: 'zoro' });
  });
  it('한 파일에서 평온이 붙은 문은 가치관이 붙은 문의 18% 이하다', () => {
    for (const [name, ts] of [['canon', CANON_EAST], ['canon-2', CANON_SEA], ['sea', [...SEA_LEAVE, ...SEA_RETURN]], ['sea-2', [...SEA_GRAND_LINE, ...SEA_NEW_WORLD]]] as const)
      expect(peaceShare(ts as Turning[]), name).toBeLessThanOrEqual(0.18);
  });
});

describe('과제 10: 바다 이동', () => {
  const movesOut = (t: Turning) => doorFx(t).some((f) => f.op === 'move' && f.sea !== 'east');
  const movesBack = (t: Turning) => doorFx(t).some((f) => (f.op === 'move' && f.sea === 'east') || f.op === 'moveHome');
  it('이스트 블루를 떠나는 길이 10개 이상, 돌아오는 길이 3개 이상이다', () => {
    const leave = TURNINGS.filter((t) => subset(seaOf(t), ['east']) && movesOut(t));
    const back = TURNINGS.filter((t) => seaOf(t).length > 0 && !seaOf(t).includes('east') && movesBack(t));
    expect(leave.length).toBeGreaterThanOrEqual(10);
    expect(back.length).toBeGreaterThanOrEqual(3);
    for (const t of SEA_LEAVE) expect(leave, t.id).toContain(t);
    for (const t of SEA_RETURN) expect(back, t.id).toContain(t);
  });
  it('위대한 항로 전반과 신세계에서 오는 전환점이 각각 8개 이상이고, 절반 이상이 약한 인물에게도 열리는 문을 가진다', () => {
    const first = SEA_GRAND_LINE.filter((t) => subset(seaOf(t), ['gl_entry', 'gl_first', 'sabaody']));
    const late = SEA_NEW_WORLD.filter((t) => subset(seaOf(t), ['nw_first', 'nw_late']));
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(late.length).toBeGreaterThanOrEqual(8);
    for (const ts of [first, late]) expect(ts.filter((t) => t.doors.some(openToWeak)).length).toBeGreaterThanOrEqual(Math.ceil(ts.length / 2));
  });
  it('다른 처지로 건너가는 전환점에는 standingYears가 있다 (감옥 · 시민 · 정착으로 내려앉는 것은 빼고)', () => {
    for (const t of [...canonTurnings, ...SEA_LEAVE, ...SEA_RETURN, ...SEA_GRAND_LINE, ...SEA_NEW_WORLD]) {
      const from = t.when.find((c): c is Extract<Cond, { c: 'standing' }> => c.c === 'standing')?.is ?? [];
      const crosses = doorFx(t).some((f) => f.op === 'standing' && !from.includes(f.to) && !['prisoner', 'civil', 'settled'].includes(f.to));
      if (crosses) expect(t.when.some((c) => c.c === 'standingYears'), t.id).toBe(true);
    }
  });
});
