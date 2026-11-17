// tests/game/paths.test.ts
import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/data/turnings';
import { newLife5, fullName } from '../../src/core/state';
import { ackBattle, dangerOf } from '../../src/core/fight';
import { applyFx } from '../../src/core/fx';
import { reduce5 } from '../../src/core/reduce';
import { pickTurning } from '../../src/core/turning';
import { checkAll } from '../../src/core/cond';
import { FOES } from '../../src/data/foes';
import { FRUIT_BY_ID } from '../../src/shared/data/fruits';
import { SEAS } from '../../src/shared/data/seas';
import { rngOf } from '../../src/shared/core/rng';
import { V } from '../../src/data/balance';
import { HOMES } from '../../src/data/homes';
import type { Fx, Life5, Standing } from '../../src/core/types';

const allFx = (fx: Fx[]): Fx[] => fx.flatMap((f) => (f.op === 'chance' ? [f, ...allFx(f.then), ...allFx(f.else ?? [])] : [f]));
const doorFx = TURNINGS.flatMap((t) => [...t.doors.flatMap((d) => allFx(d.fx)), ...allFx(t.fx ?? [])]);

describe('길과 바다', () => {
  it('처지 열두 가지 중 아이를 뺀 열한 가지 모두에 이르는 문이 있다', () => {
    const to = new Set(doorFx.filter((f) => f.op === 'standing').map((f) => (f as { to: Standing }).to));
    for (const st of ['civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'prisoner', 'retired'])
      expect(to.has(st as Standing), st).toBe(true);
  });
  it('보스를 이기지 않아도 바다를 옮기는 사건이 다섯 가지 이상이고, 거꾸로 가거나 건너뛰는 것도 있다', () => {
    const moves = TURNINGS.filter((t) => [...t.doors.flatMap((d) => allFx(d.fx)), ...allFx(t.fx ?? [])].some((f) => f.op === 'move'));
    expect(moves.length).toBeGreaterThanOrEqual(5);
    // moveHome은 고향의 바다(이 단계에서는 로그타운 = 이스트 블루)로 돌아가는 것이다
    const seas = new Set(doorFx.flatMap((f) => (f.op === 'move' ? [f.sea] : f.op === 'moveHome' ? [HOMES.loguetown.sea] : [])));
    expect(seas.has('east')).toBe(true);
    expect(seas.has('nw_first') || seas.has('nw_late')).toBe(true);
  });
  it('은퇴는 노년에 고르는 문이다', () => {
    const t = TURNINGS.find((x) => x.doors.some((d) => d.fx.some((f) => f.op === 'standing' && f.to === 'retired')))!;
    expect(t.when.some((c) => c.c === 'age' && (c.min ?? 0) >= 50)).toBe(true);
  });
  it('결혼과 자식, 정착, 배신 같은 싸움 아닌 사건이 열 가지 이상이다', () => {
    const calm = TURNINGS.filter((t) => t.kind === 'door' && !t.id.startsWith('kid_') && !t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'fight')));
    expect(calm.length).toBeGreaterThanOrEqual(10);
  });
  it('전환점이 모두 60개 이상이다', () => {
    expect(TURNINGS.length).toBeGreaterThanOrEqual(60);
  });
  it('고향 섬의 아이는 낮은 위험 속에 있다', () => {
    const kid = newLife5(1); kid.age = 8;
    const grown = newLife5(1); grown.age = 25; applyFx(grown, [{ op: 'move', island: '드레스로자', sea: 'nw_first' }]);
    expect(dangerOf(kid)).toBeLessThan(dangerOf(grown));
  });
  it('문 본문과 선택지에 성을 모르는 고아의 이름이 깨지지 않는다', () => {
    for (let i = 0; i < 400; i++) {
      const s = newLife5(i);
      if (s.hero.surname !== null) continue;
      const p = s.pending as { title: string; body: string };
      expect(p.title + p.body + fullName(s.hero)).not.toMatch(/undefined|null|\{[a-z]+\}/);
    }
  });
});

describe('길과 바다의 데이터', () => {
  const paths = TURNINGS.filter((t) => t.id.startsWith('path_') || t.id.startsWith('prison_'));
  const people = TURNINGS.filter((t) => t.id.startsWith('pp_') || t.id.startsWith('meet_') || t.id === 'after_fight');
  it('길이 스무 가지 이상, 사람과 마주침이 열여섯 가지 이상이다', () => {
    expect(paths.length).toBeGreaterThanOrEqual(20);
    expect(people.length).toBeGreaterThanOrEqual(16);
  });
  // 4단계부터 길과 사람의 사건은 어느 고향에서나 온다(외딴 고향 섬에서는 data/turnings/index.ts의 landlocked가 막는다)
  it('본문의 자리표시는 인물 이름과 장소만 사용한다', () => {
    for (const t of [...paths, ...people])
      for (const text of [t.title, t.body, ...t.doors.flatMap((d) => [d.label, d.hint])])
        for (const m of text.match(/\{\w+\}/g) ?? []) expect(['{name}', '{town}', '{island}', '{friend}'], t.id).toContain(m);
  });
  it('문의 가치관 점수는 V.value.door만큼이다', () => {
    for (const t of [...paths, ...people]) for (const d of t.doors)
      for (const v of Object.values(d.values ?? {})) expect(v, t.id).toBe(V.value.door);
  });
  it('돈으로 들이는 스승은 넉 단계까지만 가르친다', () => {
    const masters = [...paths, ...people].flatMap((t) => t.doors.flatMap((d) => d.fx)).filter((f) => f.op === 'master');
    expect(masters.some((f) => f.op === 'master' && f.paid)).toBe(true);
    for (const f of masters) if (f.op === 'master' && f.paid) expect(f.cap).toBe(V.growth.paidCap);
  });
  it('사관학교는 돈으로 잠기고, 해군 가문은 조건 없이 들어간다', () => {
    // 가문의 추천장은 문이 셋을 넘지 않도록 따로 오는 전환점(path_marine_family)에 있다
    const doors = TURNINGS.filter((x) => x.id === 'path_marine_join' || x.id === 'path_marine_family').flatMap((t) => t.doors);
    const academy = doors.filter((d) => d.fx.some((f) => f.op === 'rank'));
    expect(academy.some((d) => d.when?.some((c) => c.c === 'money'))).toBe(true);
    expect(academy.some((d) => d.when?.some((c) => c.c === 'lineage' && c.is.includes('marineFamily')) && !d.when.some((c) => c.c === 'money'))).toBe(true);
  });
  it('이름 있는 상대와의 마주침이 여섯 가지 이상이고, 저마다 그 상대의 바다에서만 일어난다', () => {
    const meets = TURNINGS.filter((t) => t.doors.some((d) => d.fx.some((f) => f.op === 'fight')));
    expect(meets.length).toBeGreaterThanOrEqual(6);
    for (const t of meets) {
      const seaCond = t.when.find((c) => c.c === 'sea');
      expect(seaCond, t.id).toBeDefined();
      for (const d of t.doors) for (const f of d.fx) if (f.op === 'fight') {
        expect(FOES[f.foe], f.foe).toBeDefined();
        for (const sea of (seaCond as { is: string[] }).is) expect((FOES[f.foe] as { sea?: string[] }).sea, t.id).toContain(sea);
      }
    }
  });
  it('바다를 옮기는 섬 이름은 v4 해역의 실제 항구다', () => {
    for (const f of doorFx) if (f.op === 'move') expect(SEAS.find((x) => x.id === f.sea)!.ports, f.island).toContain(f.island);
  });
  it('원작 인물이 말하는 전환점에는 주인공의 나이 조건이 있다', () => {
    for (const t of TURNINGS.filter((x) => typeof x.speaker === 'object' && 'canon' in x.speaker))
      expect(t.when.some((c) => c.c === 'age'), t.id).toBe(true);
  });
  it('정점은 명성으로 열리고 고른 문이 정점에 올렸다는 표시를 남긴다', () => {
    const apex = TURNINGS.filter((t) => t.doors.some((d) => d.fx.some((f) => f.op === 'flag' && f.id === 'apex')));
    expect(apex.length).toBeGreaterThanOrEqual(2);
    for (const t of apex) expect(t.when.some((c) => c.c === 'fame' && c.min * V.fame.bounty >= 3_000_000_000), t.id).toBe(true);
  });
});

describe('감옥', () => {
  function prisoner(seed: number): Life5 {
    const s = newLife5(seed); s.pending = null; s.age = 30; s.hero.home = 'loguetown'; s.hero.standing = 'prisoner';
    return s;
  }
  it('체포되면 감옥에 갇힌다', () => {
    const s = newLife5(1); s.pending = null; s.age = 25; s.hero.standing = 'pirate';
    applyFx(s, TURNINGS.find((t) => t.id === 'mis_arrest')!.fx!);
    expect(s.hero.standing).toBe('prisoner');
  });
  it('죄수에게는 감옥의 전환점만 열린다', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = prisoner(seed);
      const t = pickTurning(s, rngOf(s.rng));
      if (t) expect(t.id.startsWith('prison_') || t.kind === 'moment', t.id).toBe(true);
    }
  });
  it('풀려나는 문과 빠져나가는 문이 있고, 죄수는 몇 해 안에 감옥을 나선다', () => {
    const out = (id: string) => TURNINGS.find((t) => t.id === id)!;
    expect(out('prison_release').doors.every((d) => d.fx.some((f) => f.op === 'standing' && f.to !== 'prisoner'))).toBe(true);
    expect(out('prison_escape').doors.some((d) => d.danger)).toBe(true);
    const years: number[] = [];
    for (let seed = 0; seed < 40; seed++) {
      let s = prisoner(seed);
      const start = s.age;
      for (let i = 0; i < 4 * 10 && s.hero.standing === 'prisoner' && s.hero.alive; i++) {
        if (s.pending?.kind === 'door') s = reduce5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
        else if (s.pending) s = reduce5(s, { type: 'answer', index: 0 });
        else s = reduce5(s, { type: 'step' });
      }
      if (s.hero.alive) { expect(s.hero.standing, `seed ${seed}`).not.toBe('prisoner'); years.push(s.age - start); }
    }
    years.sort((a, b) => a - b);
    expect(years[Math.floor(years.length / 2)]).toBeLessThanOrEqual(3);
  });
});

describe('규칙', () => {
  it('아이로 남은 사람은 열여섯 살이 되는 해에 뭍의 어른이 된다', () => {
    let s = newLife5(2); s.pending = null; s.age = V.adultAge - 1; s.part = 3; s.hero.standing = 'child';
    s.stopsThisYear = 99;                                    // 전환점이 끼어들지 않게
    s = reduce5(s, { type: 'step' });
    expect(s.age).toBe(V.adultAge);
    expect(s.hero.standing).toBe('civil');
    expect(s.log.some((l) => l.weight === 'heavy' && l.text.includes('어른'))).toBe(true);
  });
  it('가난한 어른은 아이 처지로 굶어 죽지 않는다', () => {
    let s = newLife5(3); s.pending = null; s.age = V.adultAge - 1; s.part = 3; s.hero.standing = 'child'; s.stopsThisYear = 99;
    s = reduce5(s, { type: 'step' });
    expect(V.risk.idleStandings as readonly string[]).not.toContain(s.hero.standing);
  });
  it('집안 형편이 바뀌고, 집안이 몰락하면 가난해진다', () => {
    const s = newLife5(4); s.hero.wealth = 'noble';
    applyFx(s, [{ op: 'wealth', to: 'comfortable' }]);
    expect(s.hero.wealth).toBe('comfortable');
    applyFx(s, TURNINGS.find((t) => t.id === 'mis_house_ruin')!.fx!);
    expect(s.hero.wealth).toBe('poor');
  });
  it('열매를 먹으면 원작 자연산 열매를 얻고, 이미 능력자면 아무 일도 없다', () => {
    const grades: number[] = [];
    for (let seed = 0; seed < 200; seed++) {
      const s = newLife5(seed); s.age = 20;
      applyFx(s, [{ op: 'eatFruit', id: 'random' }]);
      const f = FRUIT_BY_ID[s.hero.fruit!.id];
      expect(f).toBeDefined();
      expect(f.id).not.toMatch(/^smile_/);
      expect(s.hero.fruit!.eatenAt).toBe(20);
      expect(s.growth.tier.fruit).toBe(V.fruit.startTier);
      expect(s.log.at(-1)!.weight).toBe('heavy');
      expect(s.log.at(-1)!.text).toContain(f.name);
      grades.push(f.grade);
      const before = JSON.parse(JSON.stringify(s));
      applyFx(s, [{ op: 'eatFruit', id: 'random' }]);
      expect(s).toEqual(before);
    }
    const low = grades.filter((g) => g <= 2).length, high = grades.filter((g) => g >= 4).length;
    expect(low).toBeGreaterThan(high);
  });
  it('위험은 지금 바다의 적 힘의 가운데 값이고, 고향의 아이는 가장 낮은 바다의 값이다', () => {
    const s = newLife5(5); s.age = 25; s.hero.sea = 'gl_first'; s.hero.island = '알라바스타 왕국';
    expect(dangerOf(s)).toBe((34 + 58) / 2);
    const kid = newLife5(5); kid.age = V.fight.dangerKidAge; kid.hero.sea = 'nw_late';
    expect(dangerOf(kid)).toBe((8 + 22) / 2);
  });
  it('이름 있는 상대를 이기면 쓰러진 적을 어떻게 할지 줄을 서고, 동료로 받는 문이 있다', () => {
    const s = newLife5(6); s.pending = null; s.age = 25;
    const foe = structuredClone(FOES.b_morgan);
    s.pending = { kind: 'battle', foe, lethal: false, battle: {} as never, result: 'win' };
    ackBattle(s);
    expect(s.queue.filter((q) => q === 'after_fight')).toHaveLength(1);
    s.pending = { kind: 'battle', foe, lethal: false, battle: {} as never, result: 'win' };
    ackBattle(s);
    expect(s.queue.filter((q) => q === 'after_fight')).toHaveLength(1);
    const t = TURNINGS.find((x) => x.id === 'after_fight')!;
    expect(t.doors).toHaveLength(3);
    expect(t.doors.some((d) => d.fx.some((f) => f.op === 'person' && f.kind === 'crew'))).toBe(true);
  });
  it('지면 쓰러진 적의 전환점이 줄을 서지 않는다', () => {
    const s = newLife5(7); s.pending = null; s.age = 25;
    s.pending = { kind: 'battle', foe: structuredClone(FOES.b_morgan), lethal: false, battle: {} as never, result: 'lose' };
    ackBattle(s);
    expect(s.queue).not.toContain('after_fight');
  });
  it('로그타운의 어른 앞에 길이 열린다', () => {
    let opened = 0;
    for (let seed = 0; seed < 50; seed++) {
      const s = newLife5(seed); s.pending = null; s.age = 17; s.hero.standing = 'civil';
      if (TURNINGS.some((t) => t.id.startsWith('path_') && checkAll(s, t.when))) opened++;
    }
    expect(opened).toBe(50);
  });
});

describe('정착과 은퇴는 되풀이된다', () => {
  const byId = (id: string) => TURNINGS.find((t) => t.id === id)!;
  it('닻을 내리는 문과 칼을 내려놓는 문은 한 번뿐이 아니고 긴 간격으로 다시 온다', () => {
    for (const id of ['path_settle', 'path_retire']) expect(byId(id).repeat, id).toEqual({ years: 8 });
  });
  it('뭍에 자리 잡은 사람, 뭍의 어른, 조선공도 다시 은퇴할 수 있다', () => {
    const is = byId('path_retire').when.find((c) => c.c === 'standing');
    for (const st of ['settled', 'civil', 'shipwright'] as Standing[]) expect(is && 'is' in is ? is.is : [], st).toContain(st);
  });
});
