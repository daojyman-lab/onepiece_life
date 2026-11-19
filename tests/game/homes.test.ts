// tests/game/homes.test.ts — 4단계: 고향의 마을에서 태어난다 (과제 1)
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { check } from '../../src/core/cond';
import { HOMES } from '../../src/data/homes';
import { HOMETOWNS, SURNAMES } from '../../src/shared/data/births';
import { TURNINGS, COASTAL_WORDS, WORLD_GOV_WORDS } from '../../src/data/turnings';
import { HOMES_LEAVE, HOMES_RETURN } from '../../src/data/turnings/homes-sea';
import { autoplay5 } from '../../src/core/autoplay';
import type { Cond, Fx, HomeId, Turning } from '../../src/core/types';

const IDS = Object.keys(HOMES) as HomeId[];
const born = (home: HomeId, n = 200) => Array.from({ length: n }, (_, i) => newLife5(300 + i, { home }));

describe('고향의 마을 (과제 1)', () => {
  it('고향마다 마을이 둘 이상 있다', () => {
    for (const id of IDS) expect(HOMETOWNS.filter((t) => t.home === id).length, id).toBeGreaterThanOrEqual(2);
  });
  it('첫해 이야기에서 태어난 마을의 모습을 소개한다', () => {
    const opening = IDS.flatMap((id) => born(id, 40)).flatMap((s) =>
      s.log.filter((l) => l.age === s.age && l.weight === 'heavy').map((l) => l.text));
    expect(opening.some((line) => line.includes('후샤 마을') && line.includes('풍차'))).toBe(true);
    expect(opening.some((line) => line.includes('시프트 역') && line.includes('바다 열차'))).toBe(true);
    expect(opening.some((line) => line.includes('쿠라우 도시') && line.includes('코끼리'))).toBe(true);
  });
  it('고향을 정하면 늘 그 고향의 마을에서 태어나고, 그 마을이 첫 섬이며, 고향의 바다에 있다', () => {
    for (const id of IDS) {
      const towns = HOMETOWNS.filter((t) => t.home === id).map((t) => t.name);
      for (const s of born(id)) {
        expect(towns, `${id}: ${s.hero.town}`).toContain(s.hero.town);
        expect(s.hero.island).toBe(s.hero.town);
        expect(s.hero.sea).toBe(HOMES[id].sea);
      }
    }
  });
  it('와노쿠니에서는 무사 가문이, 어인섬에서는 차별받는 핏줄이 나온다. 로그타운에서는 둘 다 나오지 않는다', () => {
    expect(born('wano').some((s) => s.hero.lineage === 'samurai')).toBe(true);
    expect(born('fishman').some((s) => s.hero.lineage === 'outcast')).toBe(true);
    expect(born('loguetown').some((s) => ['samurai', 'outcast'].includes(s.hero.lineage))).toBe(false);
  });
  it('어인섬 · 조우 · 하늘섬에서 나고 자란 아이는 그 고향의 종족이고, 다른 종족은 떠내려온 고아다', () => {
    for (const id of ['fishman', 'zou', 'sky'] as HomeId[])
      for (const s of born(id)) {
        if (!HOMES[id].species.includes(s.hero.species)) expect(s.hero.lineage, `${id} ${s.hero.species}`).toBe('orphan');
      }
    expect(born('fishman').filter((s) => s.hero.lineage !== 'orphan').every((s) => ['fishman', 'merfolk'].includes(s.hero.species))).toBe(true);
  });
  it('이스트 블루의 이름난 집안은 로그타운(이스트 블루)에서만 나온다', () => {
    const local = SURNAMES.filter((x) => x.kind === 'local').map((x) => x.name);
    for (const id of IDS.filter((x) => x !== 'loguetown'))
      for (const s of born(id)) expect(local, `${id} ${s.hero.surname}`).not.toContain(s.hero.surname);
  });
  it('종족 조건이 있다', () => {
    const s = newLife5(1, { home: 'zou' });
    expect(check(s, { c: 'species', is: [s.hero.species] })).toBe(true);
    expect(check(s, { c: 'species', is: ['giant'] })).toBe(s.hero.species === 'giant');
  });
});

describe('로그타운에 묶인 사건을 푼다 (과제 2)', () => {
  const EAST_TOWNS = HOMETOWNS.filter((t) => t.home === 'loguetown').map((t) => t.name.replace(' 마을', '').replace('고아 왕국 ', ''));
  const EAST = new RegExp(['이스트 블루', '로그타운', '고아 왕국', '그레이 터미널', '코르보', '바라티에', '발라티에', '코노미', '아론', '버기', '크리크',
    '알비다', '모건', '마키노', '다단', '카야', '제프', '노지코', '겐조', '코우시로', '쿠이나', '잇폰마츠', '리버스 마운틴', ...EAST_TOWNS].join('|'));
  // 조건이 붙은 문(예: 로그타운 처형대에서 본 사람만 여는 문)은 그 조건이 막으므로 보지 않는다
  const textOf = (t: Turning) => [t.title, t.body, ...t.doors.filter((d) => !d.when?.length).flatMap((d) => [d.label, d.hint])].join(' ');
  const eastCond = (t: Turning) => t.when.some((c) => (c.c === 'sea' && c.is.every((x) => ['east', 'gl_entry'].includes(x)))
    || (c.c === 'home' && c.is.length === 1 && c.is[0] === 'loguetown') || (c.c === 'town' && c.is.every((x) => HOMETOWNS.find((h) => h.name === x)?.home === 'loguetown'))
    || (c.c === 'island' && !c.not));
  it('이스트 블루의 땅과 사람이 나오는 전환점은 이스트 블루(또는 그 섬)에서만 온다', () => {
    const bad = TURNINGS.filter((t) => EAST.test(textOf(t)) && !eastCond(t)).map((t) => `${t.id}: ${textOf(t).match(EAST)![0]}`);
    expect(bad).toEqual([]);
  });
  it('바다에 닿지 않는 고향(조우 · 하늘섬 · 어인섬)의 섬에 있는 동안에는 바닷가의 사건이 오지 않는다', () => {
    for (const home of ['zou', 'sky', 'fishman'] as HomeId[]) {
      const s = newLife5(7, { home });
      for (const t of TURNINGS) {
        if (t.when.some((c) => c.c === 'home' || c.c === 'town' || c.c === 'island' && !c.not)) continue;
        if (COASTAL_WORDS.test(textOf(t)) || WORLD_GOV_WORDS.test(textOf(t)) || t.when.some((c) => c.c === 'sea'))
          expect(t.when.some((c) => !check(s, c)), `${home} ${t.id}`).toBe(true);
      }
    }
  });
  it('와노쿠니에 있는 동안에는 해군 · 현상금 · 바다(sea 조건)의 사건이 오지 않는다', () => {
    const s = newLife5(7, { home: 'wano' });
    for (const t of TURNINGS.filter((t) => !t.when.some((c) => c.c === 'home' || c.c === 'town' || (c.c === 'island' && !c.not))))
      if (WORLD_GOV_WORDS.test(textOf(t)) || t.when.some((c) => c.c === 'sea')) expect(t.when.some((c) => !check(s, c)), t.id).toBe(true);
  });
});

describe('고향마다 바다로 나가는 길 (과제 3)', () => {
  const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => (e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]));
  const homeOf = (t: Turning) => t.when.find((c): c is Extract<Cond, { c: 'home' }> => c.c === 'home')?.is ?? [];
  const leaves = (t: Turning) => t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'move'));
  const returns = (t: Turning) => t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'moveHome'));
  it('다섯 고향마다 떠나는 길이 셋 이상, 돌아오는 길이 하나 이상이다', () => {
    for (const id of IDS.filter((x) => x !== 'loguetown')) {
      expect(HOMES_LEAVE.filter((t) => homeOf(t).includes(id) && leaves(t)).length, id).toBeGreaterThanOrEqual(3);
      expect(HOMES_RETURN.filter((t) => homeOf(t).includes(id) && returns(t)).length, id).toBeGreaterThanOrEqual(1);
    }
    for (const t of [...HOMES_LEAVE, ...HOMES_RETURN]) expect(TURNINGS, t.id).toContain(t);
  });
  it('와노쿠니를 떠나는 길은 열여덟 살이 넘어야 열린다', () => {
    for (const t of HOMES_LEAVE.filter((t) => homeOf(t).includes('wano')))
      expect((t.when.find((c) => c.c === 'age') as { min?: number }).min, t.id).toBeGreaterThanOrEqual(18);
  });
  it('이스트 블루가 고향이 아닌 사람은 이스트 블루로 「돌아가는」 문을 받지 않는다', () => {
    for (const t of TURNINGS) {
      const toEast = t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'move' && f.sea === 'east'));
      const fromAway = !t.when.some((c) => (c.c === 'sea' && c.is.every((x) => x === 'east')) || c.c === 'town' || (c.c === 'island' && !c.not));
      if (toEast && fromAway && /돌아/.test([t.title, t.body, ...t.doors.flatMap((d) => [d.label, d.hint])].join(' ')))
        expect(t.when, t.id).toContainEqual({ c: 'home', is: ['loguetown'] });
    }
  });
  it('외딴 고향에서 태어난 사람도 떠나는 길로 섬을 떠나 바다의 사건을 만난다 (자동 플레이 60명)', () => {
    for (const home of ['wano', 'fishman', 'sky', 'zou'] as HomeId[]) {
      const left = Array.from({ length: 60 }, (_, i) => autoplay5(700 + i, 'random', { home }).s).filter((s) => s.hero.island !== s.hero.town || s.timeline.some((x) => /떠났|내려갔|나갔|끌려갔|뛰어내렸|올랐/.test(x.text)));
      expect(left.length, home).toBeGreaterThan(5);
    }
  });
});
