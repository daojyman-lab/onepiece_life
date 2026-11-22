// tests/game/family.test.ts — 가족, 원작 인물의 나이, 태어난 마을
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { needOk, personIs } from '../../src/core/needs';
import { apply5 } from '../../src/core/reduce';
import { familyYear, parentFound } from '../../src/core/family';
import { check, checkAll } from '../../src/core/cond';
import { HOMES } from '../../src/data/homes';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { CANON, canonAge } from '../../src/data/canon';
import { TURNINGS } from '../../src/data/turnings';
import { V } from '../../src/data/balance';
import type { Fx, Life5 } from '../../src/core/types';

const family = (s: Life5) => s.people.filter((p) => p.kind === 'family');
const siblings = (s: Life5) => s.people.filter((p) => personIs(p, 'sibling'));
const lives = (n: number, from: number, opt: Parameters<typeof newLife5>[1]) => Array.from({ length: n }, (_, i) => newLife5(from + i, opt));

function answerFamilyScene(s: Life5, label: RegExp): void {
  if (s.pending?.kind !== 'door') throw new Error('동생을 맞는 선택이 열리지 않았다');
  const index = s.pending.doors.findIndex((d) => !d.locked && label.test(d.label));
  expect(index).toBeGreaterThanOrEqual(0);
  apply5(s, { type: 'answer', index });
}

describe('가족', () => {
  it('고아는 가족이 없다', () => {
    for (const s of lives(200, 1, { lineage: 'orphan' })) expect(family(s)).toEqual([]);
  });
  it('고아가 아니면 살아 있는 부모가 둘, 형제는 0~3명, 부모는 주인공보다 스무 살 넘게 많고, 성이 같다', () => {
    for (const s of lives(200, 1000, { lineage: 'commoner' })) {
      const parents = s.people.filter((p) => personIs(p, 'parent'));
      expect(parents.map((p) => p.relation).sort()).toEqual(['아버지', '어머니'].sort());
      for (const p of parents) {
        expect(p.alive).toBe(true);
        expect(p.age - s.age).toBeGreaterThanOrEqual(V.family.parentOlder[0]);
        expect(p.age - s.age).toBeLessThanOrEqual(V.family.parentOlder[1]);
      }
      const sib = siblings(s);
      const births = s.siblingBirths ?? [];
      expect(sib.length + births.length).toBeLessThanOrEqual(V.family.maxSiblings);
      expect(new Set(births.map((b) => b.age)).size).toBe(births.length);
      for (const b of births) {
        expect(b.age).toBeGreaterThan(s.age);
        expect(b.age).toBeLessThanOrEqual(8);
      }
      for (const p of sib) {
        const gap = Math.abs(p.age - s.age);
        expect(gap).toBeGreaterThanOrEqual(1); expect(gap).toBeLessThanOrEqual(8);
        expect(p.age).toBeGreaterThanOrEqual(0);
      }
      for (const p of family(s)) {
        expect(p.name.startsWith(`${s.hero.surname} `)).toBe(true);
        expect(p.crew).toBeUndefined();
      }
    }
  });
  it('가난한 집은 이름난 집안보다 형제가 많다', () => {
    const total = (w: 'poor' | 'noble') => lives(300, 5000, { wealth: w, lineage: 'commoner' })
      .reduce((a, s) => a + siblings(s).length + (s.siblingBirths?.length ?? 0), 0);
    expect(total('poor')).toBeGreaterThan(total('noble'));
  });
  it('형제 · 부모가 있으니 그 필요가 맞는 사람이 나온다', () => {
    const ss = lives(200, 1000, { lineage: 'commoner' });
    expect(ss.some((s) => siblings(s).length > 0)).toBe(true);
    expect(ss.some((s) => siblings(s).length === 0)).toBe(true);
  });
  it('첫 장면에 부모와 손위 형제만 이름과 관계, 나이로 소개한다', () => {
    const ss = lives(100, 1000, { lineage: 'commoner', wealth: 'poor' });
    expect(ss.some((s) => siblings(s).length > 0)).toBe(true);
    for (const s of ss) {
      const afterBirth = s.log.filter((l) => l.age === s.age && l.weight === 'heavy').map((l) => l.text).join('\n');
      for (const p of family(s)) {
        expect(p.age).toBeGreaterThan(s.age);
        expect(afterBirth).toContain(`${p.relation} ${p.name}`);
        if (personIs(p, 'sibling')) expect(afterBirth).toContain(`${p.age}살`);
      }
    }
  });
  it('조부모가 키우는 고아의 첫 장면에는 실제 보호자 이름을 남긴다', () => {
    const s = lives(100, 1, { lineage: 'orphan' }).find((life) => life.flags.includes('grandGuard'))!;
    const guardian = s.people.find((p) => p.relation === '할머니' || p.relation === '할아버지')!;
    expect(s.log.some((l) => l.age === s.age && l.text.includes(`${guardian.relation} ${guardian.name}`))).toBe(true);
  });
  it('해가 바뀌면 동생을 처음 안을 수 있고 저장을 불러와도 출생과 선택을 한 번씩만 기록한다', () => {
    const s = lives(200, 1000, { lineage: 'commoner', wealth: 'poor' }).find((life) =>
      siblings(life).length === 0 && life.siblingBirths?.some((b) => b.age === 4))!;
    expect(s).toBeDefined();
    expect(needOk(s, 'sibling')).toBe(false);
    const baby = s.siblingBirths!.find((b) => b.age === 4)!;
    expect(s.log.some((l) => l.text.includes(baby.name))).toBe(false);
    s.pending = null;
    s.part = 3;
    s.stopsThisYear = 100;
    const restored = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    apply5(restored, { type: 'rest' });
    expect(restored.age).toBe(4);
    expect(siblings(restored)).toEqual([expect.objectContaining({ name: baby.name, age: 0, alive: true })]);
    expect(needOk(restored, 'sibling')).toBe(true);
    expect(restored.log.some((l) => l.age === 4 && l.weight === 'heavy' && /동생이 태어났다/.test(l.text))).toBe(true);
    expect(restored.timeline.some((e) => e.age === 4 && /동생이 태어났다/.test(e.text))).toBe(true);
    expect(checkAll(restored, TURNING_BY_ID.sib_bread.when)).toBe(false);
    const after = normalizeLife5(JSON.parse(JSON.stringify(restored)))!;
    answerFamilyScene(after, /안아/);
    expect(after.log.some((l) => l.text.includes(baby.name) && /품/.test(l.text))).toBe(true);
    expect(after.stopsThisYear).toBe(0);
    expect(after.pending).toBeNull();
    after.part = 3;
    apply5(after, { type: 'rest' });
    expect(siblings(after).filter((p) => p.name === baby.name)).toEqual([expect.objectContaining({ age: 1 })]);
    expect(after.timeline.filter((e) => e.age === 4 && /동생이 태어났다/.test(e.text))).toHaveLength(1);
    expect(after.timeline.filter((e) => e.age === 4 && /안아/.test(e.text))).toHaveLength(1);
  });
  it('이름을 함께 지으면 갓 태어난 동생의 이름만 바뀐 채 저장된다', () => {
    const s = lives(180, 1100, { lineage: 'commoner', wealth: 'poor' }).find((life) =>
      siblings(life).length > 0 && life.siblingBirths?.some((b) => b.age === 4))!;
    const older = siblings(s).map(({ id, name, bond }) => ({ id, name, bond }));
    const reserved = s.siblingBirths!.map((b) => b.name);
    s.pending = null;
    s.part = 3;
    s.stopsThisYear = 100;
    apply5(s, { type: 'rest' });
    const baby = siblings(s).find((p) => p.age === 0)!;
    answerFamilyScene(s, /이름을 함께/);
    const saved = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(siblings(saved).filter((p) => p.age > 0).map(({ id, name, bond }) => ({ id, name, bond }))).toEqual(older);
    const named = siblings(saved).find((p) => p.id === baby.id)!;
    expect(reserved).not.toContain(named.name);
    expect(saved.people.filter((p) => p.name === named.name)).toHaveLength(1);
    expect(saved.log.some((l) => l.text.includes(named.name) && /이름/.test(l.text))).toBe(true);
  });
  it('다른 선택이 열려 있다면 방해하지 않고 고향을 떠난 뒤의 장면에 편지 선택지를 보여 준다', () => {
    const s = lives(120, 1300, { lineage: 'commoner', wealth: 'poor' }).find((life) =>
      life.siblingBirths?.some((b) => b.age === 4))!;
    const previous = s.pending;
    expect(previous?.kind).toBe('door');
    s.age = 4;
    familyYear(s);
    expect(s.pending).toBe(previous);
    s.pending = null;
    applyFx(s, [{ op: 'move', island: '드레스로자', sea: 'nw_first' }]);
    const saved = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    apply5(saved, { type: 'rest' });
    expect(saved.age).toBe(4);
    answerFamilyScene(saved, /축하 편지/);
    expect(saved.log.at(-1)?.text).toMatch(/편지/);
  });
});

describe('원작 인물의 나이', () => {
  it('주인공이 열일곱이면 원작이 시작할 때의 나이, 0 아래로는 내려가지 않는다', () => {
    expect(canonAge('luffy', 17)).toBe(17);
    expect(canonAge('smoker', 17)).toBe(34);
    expect(canonAge('luffy', 3)).toBe(3);
    expect(canonAge('coby', 0)).toBe(0);
  });
  it('person 효과의 canon은 이름 · 성별 · 나이를 원작에서 가져온다', () => {
    const s = newLife5(3); s.age = 20;
    applyFx(s, [{ op: 'person', kind: 'master', relation: '스승', canon: 'smoker' }]);
    const p = s.people.at(-1)!;
    expect(p.age).toBe(canonAge('smoker', s.age));
    expect(p.gender).toBe('m');
    expect(p.name).toBe(CANON.smoker.name);
    expect(p.canon).toBe('smoker');
  });
  it('나이를 적으면 그 나이, older면 주인공보다 그만큼 위', () => {
    const s = newLife5(4); s.age = 12;
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '노인', age: { older: 30 } }, { op: 'person', kind: 'ally', relation: '아이', age: 5 }]);
    expect(s.people.at(-2)!.age).toBe(42);
    expect(s.people.at(-1)!.age).toBe(5);
  });
  it('모든 전환점 데이터의 원작 인물은 CANON에 있다', () => {
    const fxOf = (fx: Fx[]): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...fxOf(e.then), ...fxOf(e.else ?? [])] : [e]);
    for (const t of TURNINGS) {
      if (typeof t.speaker === 'object' && 'canon' in t.speaker) expect(CANON[t.speaker.canon], `${t.id} speaker`).toBeDefined();
      for (const e of fxOf([...(t.fx ?? []), ...t.doors.flatMap((d) => d.fx)]))
        if (e.op === 'person' && e.canon) expect(CANON[e.canon], `${t.id} ${e.canon}`).toBeDefined();
    }
  });
});

describe('태어난 마을', () => {
  it('태어난 마을에서 시작하고, 첫 해 구분선에 그 마을이 나온다', () => {
    for (const s of lives(200, 1, {})) {
      expect(s.hero.island).toBe(s.hero.town);
      expect(s.log.find((l) => l.weight === 'year')!.island).toBe(s.hero.town);
    }
  });
  it('가족이 없는 옛 저장은 가족을 새로 만들지 않고 그대로 이어진다', () => {
    const s = JSON.parse(JSON.stringify(newLife5(9, { lineage: 'commoner' })));
    s.people = [];
    delete s.siblingBirths;
    const f = normalizeLife5(s)!;
    expect(f).not.toBeNull();
    expect(f.people).toEqual([]);
  });
});

describe('가족 (고친 것)', () => {
  it('부모는 맏이가 태어날 때도 parentAtBirth살 이상이다', () => {
    for (const s of lives(300, 7000, { lineage: 'commoner' })) {
      const eldest = Math.max(s.age, ...siblings(s).map((p) => p.age));
      for (const p of s.people.filter((x) => personIs(x, 'parent'))) expect(p.age, `${s.rng.seed}`).toBeGreaterThanOrEqual(eldest + V.family.parentAtBirth);
    }
  });
  it('딸에게 손위 형제는 오빠 · 언니, 아들에게는 형 · 누나다', () => {
    const girls = lives(200, 8000, { lineage: 'commoner', gender: 'f' }).flatMap(siblings).map((p) => p.relation);
    const boys = lives(200, 8000, { lineage: 'commoner', gender: 'm' }).flatMap(siblings).map((p) => p.relation);
    expect(girls).toContain('오빠'); expect(girls).toContain('언니');
    expect(girls.some((r) => r === '형' || r === '누나')).toBe(false);
    expect(boys).toContain('형'); expect(boys).toContain('누나');
    expect(boys.some((r) => r === '오빠' || r === '언니')).toBe(false);
  });
  it('같은 씨앗은 같은 가족을 낸다', () => {
    expect(newLife5(42, { lineage: 'commoner' }).people).toEqual(newLife5(42, { lineage: 'commoner' }).people);
  });
  it('younger면 주인공보다 그만큼 아래, 0 아래로는 내려가지 않는다', () => {
    const s = newLife5(4); s.age = 12;
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '꼬마', age: { younger: 5 } }, { op: 'person', kind: 'ally', relation: '아기', age: { younger: 30 } }]);
    expect(s.people.at(-2)!.age).toBe(7);
    expect(s.people.at(-1)!.age).toBe(0);
  });
});

describe('가족의 노환', () => {
  /** 부모 하나를 그 나이로 두고 years해 동안 한 해씩 나이를 먹인다 */
  const ageParent = (seed: number, startAge: number, years: number) => {
    const s = newLife5(seed, { lineage: 'commoner' });
    const p = s.people.find((x) => x.relation === '어머니')!;
    p.age = startAge;
    for (let y = 0; y < years && p.alive; y++) { p.age += 1; familyYear(s); }
    return s;
  };
  it('백 살의 부모는 스무 해 안에 거의 틀림없이 세상을 떠나고, 기록에 남는다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = ageParent(seed, 100, 20);
      expect(s.people.find((x) => x.relation === '어머니')!.alive).toBe(false);
      expect(s.log.some((l) => l.text.startsWith('어머니가 세상을 떠났다.') && l.weight === 'heavy')).toBe(true);
    }
  });
  it('고아가 뒤늦게 만난 아버지를 잃으면 그 상실감이 부고에 남는다', () => {
    const s = Array.from({ length: 100 }, (_, seed) => {
      const life = newLife5(seed, { lineage: 'orphan' });
      parentFound(life);
      return life;
    }).find((life) => life.people.some((p) => p.alive && p.relation === '아버지'))!;
    s.age = 48;
    const father = s.people.find((p) => p.relation === '아버지')!;
    father.age = 100;
    for (let i = 0; i < 20 && father.alive; i++) familyYear(s);
    expect(father.alive).toBe(false);
    const obituary = s.log.find((l) => l.text.startsWith('아버지가 세상을 떠났다.'))!;
    expect(obituary.weight).toBe('heavy');
    expect(obituary.text).toMatch(/늦게|뒤늦게/);
    expect(obituary.text).toMatch(/울|슬픔|그리움|허전|먹먹/);
  });
  it('마흔 살의 가족은 이 일로 죽지 않는다', () => {
    for (let seed = 1; seed <= 50; seed++) expect(ageParent(seed, 40, 20).people.find((x) => x.relation === '어머니')!.alive).toBe(true);
  });
  it('같은 씨앗이면 같은 해에 떠난다', () => {
    expect(ageParent(9, 80, 30)).toEqual(ageParent(9, 80, 30));
  });
  it('원작 인물과 동료는 이 일로 죽지 않는다', () => {
    const s = newLife5(5); s.age = 30;
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '아버지', canon: 'garp' }, { op: 'person', kind: 'crew', relation: '형', age: 95 }]);
    for (const p of s.people.slice(-2)) p.age = 110;
    for (let y = 0; y < 20; y++) familyYear(s);
    for (const p of s.people.slice(-2)) expect(p.alive).toBe(true);
  });
});

describe('고향으로 · 조건', () => {
  it('moveHome은 태어난 마을과 고향의 바다로 돌아간다', () => {
    const s = newLife5(3);
    applyFx(s, [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'moveHome' }]);
    expect(s.hero.island).toBe(s.hero.town);
    expect(s.hero.sea).toBe(HOMES[s.hero.home].sea);
  });
  it('island 조건은 지금 있는 섬을 본다', () => {
    const s = newLife5(3); s.hero.town = '후샤 마을'; s.hero.island = '로그타운';
    expect(check(s, { c: 'island', is: ['로그타운'] })).toBe(true);
    s.hero.island = '후샤 마을';
    expect(check(s, { c: 'island', is: ['로그타운'] })).toBe(false);
  });
  it('canonAge 조건은 그 원작 인물의 지금 나이를 본다', () => {
    const s = newLife5(3); s.age = 10;      // 스모커 27, 루피 10
    expect(check(s, { c: 'canonAge', id: 'smoker', min: 25 })).toBe(true);
    expect(check(s, { c: 'canonAge', id: 'smoker', max: 26 })).toBe(false);
    expect(check(s, { c: 'canonAge', id: 'luffy', min: 17 })).toBe(false);
    expect(check(s, { c: 'canonAge', id: 'luffy', min: 5, max: 12 })).toBe(true);
  });
  it('로그타운에서만 일어나는 장면은 로그타운에 있어야 열린다', () => {
    expect(TURNING_BY_ID.kid_scaffold.when).toContainEqual({ c: 'town', is: ['로그타운'] });
    for (const id of ['path_smoker', 'path_rev_dragon', 'path_follow_luffy']) expect(TURNING_BY_ID[id].when, id).toContainEqual({ c: 'island', is: ['로그타운'] });
  });
  it('부모를 전제하는 사건은 부모가 있어야 오고, 임종의 문은 부모를 잃게 한다', () => {
    for (const id of ['pp_parent', 'pp_debt']) {
      expect(TURNING_BY_ID[id].needs, id).toContain('parent');
      expect(TURNING_BY_ID[id].when.find((c) => c.c === 'lineage'), id).toMatchObject({ is: expect.arrayContaining(['outcast']) });
    }
    for (const d of TURNING_BY_ID.pp_parent.doors) expect(d.fx).toContainEqual({ op: 'losePerson', who: 'parent' });
  });
  it('어떤 사건도 로그타운으로 못 박아 돌려보내지 않는다', () => {
    const all = (fx: Fx[]): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...all(e.then), ...all(e.else ?? [])] : [e]);
    // 고향으로 돌아가는 일은 moveHome이다. 로그타운을 적어도 되는 것은 다른 마을에서 태어난 아이가 그 마을을 떠나 로그타운으로 가는 문뿐이다 (과제 6의 go_*)
    const leavingOtherTown = (t: (typeof TURNINGS)[number]) => {
      const town = t.when.find((c) => c.c === 'town');
      return town?.c === 'town' && !town.is.includes('로그타운');
    };
    for (const t of TURNINGS) for (const e of all([...(t.fx ?? []), ...t.doors.flatMap((d) => d.fx)]))
      if (e.op === 'move' && !leavingOtherTown(t)) expect(e.island, t.id).not.toBe('로그타운');
  });
});
