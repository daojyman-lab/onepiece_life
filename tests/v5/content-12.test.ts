// tests/v5/content-12.test.ts — 과제 12: 자잘한 일과 기록 줄의 개수와 짜임
import { describe, expect, it } from 'vitest';
import { HOMETOWNS as ALL_TOWNS } from '../../src/data/births';
// 3단계의 마을 기준은 이스트 블루 여덟 마을이다 (4단계의 다섯 고향은 tests/v5/content-13~17이 본다)
const HOMETOWNS = ALL_TOWNS.filter((t) => t.home === 'loguetown');
import { LINES } from '../../src/v5/data/lines';
import { MINORS } from '../../src/v5/data/minors';
import type { Cond, Need, Standing } from '../../src/v5/core/types';
import { WORD_NEEDS } from './wordNeeds';

/** 처지마다 세는 처지 (아이는 열다섯 살까지만 열리는 일 · 줄로 센다) */
const STANDINGS: Standing[] = ['child', 'pirate', 'marine', 'revolution', 'bountyHunter', 'shipwright', 'civil', 'settled', 'retired', 'prisoner'];
/** 나이대: 아이, 젊은이, 장년, 노년 */
const BANDS: [string, number, number][] = [['아이', 3, 15], ['젊은이', 16, 35], ['장년', 36, 59], ['노년', 60, 120]];

const ageRange = (when: Cond[]): [number, number] => {
  let lo = 0, hi = 120;
  for (const c of when) if (c.c === 'age') { lo = Math.max(lo, c.min ?? 0); hi = Math.min(hi, c.max ?? 120); }
  return [lo, hi];
};
const standingsOf = (when: Cond[]): Standing[] | null => {
  const c = when.find((x) => x.c === 'standing');
  return c && c.c === 'standing' ? c.is : null;
};
/**
 * 이 처지에 맞춰 쓴 것인가. 처지를 셋 이하로 좁힌 것만 그 처지의 것으로 센다 (뭍의 여러 처지에 두루 열리는 일은 세지 않는다).
 * 아이: 처지가 child이거나 열다섯 살까지만 열린다
 */
const isFor = (when: Cond[], st: Standing): boolean => {
  const is = standingsOf(when);
  if (st === 'child') return (is?.includes('child') ?? false) || ageRange(when)[1] <= 15;
  return is !== null && is.length <= 3 && is.includes(st);
};
const townOf = (when: Cond[]): string[] => when.flatMap((c) => (c.c === 'town' ? c.is : []));

describe('자잘한 일 (과제 12)', () => {
  it('90개 이상이다', () => {
    expect(MINORS.length).toBeGreaterThanOrEqual(90);
  });
  it('처지마다 6개 이상', () => {
    for (const st of STANDINGS) expect(MINORS.filter((m) => isFor(m.when, st)).length, st).toBeGreaterThanOrEqual(6);
  });
  it('가치관에 따라 갈리는 결과가 둘 이상이고, 결과마다 글이 둘 이상이다', () => {
    for (const m of MINORS) {
      expect(m.outcomes.filter((o) => Object.keys(o.lean).length > 0).length, m.id).toBeGreaterThanOrEqual(2);
      for (const o of m.outcomes) expect(o.text.length, `${m.id} ${JSON.stringify(o.lean)}`).toBeGreaterThanOrEqual(2);
    }
  });
  it('누구나 고를 수 있는 결과(lean이 빈 것)에는 따로 붙은 needs · when이 없다', () => {
    for (const m of MINORS) for (const o of m.outcomes) if (Object.keys(o.lean).length === 0) {
      expect(o.needs ?? [], m.id).toEqual([]); expect(o.when ?? [], m.id).toEqual([]);
    }
  });
  it('글이 전제하는 것은 needs에 적혀 있다', () => {
    for (const m of MINORS) for (const o of m.outcomes) for (const t of o.text) for (const [re, need] of WORD_NEEDS)
      if (re.test(t)) expect([...(m.needs ?? []), ...(o.needs ?? [])] as Need[], `${m.id}: ${t} → ${need}`).toContain(need);
  });
});

describe('기록 줄 (과제 12)', () => {
  it('180줄 이상이고 글이 겹치지 않는다', () => {
    expect(LINES.length).toBeGreaterThanOrEqual(180);
    expect(new Set(LINES.map((l) => l.text)).size).toBe(LINES.length);
  });
  it('마을마다 그 마을에서 자라는 아이의 줄이 5줄 이상', () => {
    for (const t of HOMETOWNS) {
      const ls = LINES.filter((l) => townOf(l.when).includes(t.name));
      expect(ls.length, t.name).toBeGreaterThanOrEqual(5);
      for (const l of ls) expect(ageRange(l.when)[1], l.text).toBeLessThanOrEqual(15);
    }
  });
  it('처지마다 10줄 이상', () => {
    for (const st of STANDINGS) expect(LINES.filter((l) => isFor(l.when, st)).length, st).toBeGreaterThanOrEqual(10);
  });
  it('나이대마다 20줄 이상 (그 나이대에 열리는 줄)', () => {
    for (const [name, lo, hi] of BANDS) {
      const n = LINES.filter((l) => { const [a, b] = ageRange(l.when); return a <= hi && b >= lo; }).length;
      expect(n, name).toBeGreaterThanOrEqual(20);
    }
  });
  it('가치관에 따라 달리 적히는 줄(lean)이 절반 이상', () => {
    expect(LINES.filter((l) => Object.keys(l.lean).length > 0).length * 2).toBeGreaterThanOrEqual(LINES.length);
  });
  it('글이 전제하는 것은 needs에 적혀 있다', () => {
    for (const l of LINES) for (const [re, need] of WORD_NEEDS)
      if (re.test(l.text)) expect(l.needs ?? [], `${l.text} → ${need}`).toContain(need);
  });
  it('물러서는 줄과 맞서는 줄은 반대쪽 가치관이 깊으면 나오지 않는다', () => {
    const notDeep = (l: (typeof LINES)[number], id: string) => l.when.some((c) => c.c === 'value' && c.id === id && !c.deep);
    for (const l of LINES) {
      if ((l.lean.peace ?? 0) > 0 && /피해|피했|비켜|돌아섰|물러|자리를 떴|돌아왔다|우회/.test(l.text)) expect(notDeep(l, 'dominion') || notDeep(l, 'justice'), l.text).toBe(true);
      if ((l.lean.dominion ?? 0) > 0 && /주먹|노려|몰아붙|밀어붙|쫓아냈|덤볐|맞붙|윽박/.test(l.text)) expect(notDeep(l, 'peace'), l.text).toBe(true);
    }
  });
});

describe('기록 줄의 돈 (4단계)', () => {
  it('돈을 보내거나 쓰거나 줍거나 받아 내는 줄은 실제로 돈이 오간다 (money)', () => {
    const MONEY = /돈(을|의|으로)? [^ ]*(보냈|써 버렸|부쳤)|값을 [^ ]*물어|동전[^.]*주웠|받아 냈|뒤로 팔았|몇 닢을|값을 받고|숨겼다\.$/;
    for (const l of LINES.filter((x) => MONEY.test(x.text) && !/세어 보/.test(x.text))) expect(l.money, l.text).toBeDefined();
  });
});
