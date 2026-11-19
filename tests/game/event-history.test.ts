import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning } from '../../src/core/turning';
import { normalizeLife5 } from '../../src/core/load';
import { applyFx, fillText } from '../../src/core/fx';
import { check, checkAll } from '../../src/core/cond';
import { TURNINGS, TURNING_BY_ID } from '../../src/data/turnings';
import { MINORS } from '../../src/data/minors';
import type { Cond, Turning } from '../../src/core/types';

describe('사건 사이에 이어지는 선택과 인물', () => {
  it('같은 문을 다시 열어도 실제로 선택한 나이와 그 뒤 흐른 시간이 보존된다', () => {
    const s = newLife5(17);
    s.siblingBirths = [];
    const t: Turning = { id: 'history_repeat', kind: 'door', when: [], repeat: {years: 1}, weight: 1,
      speaker: 'hero', title: '부탁', body: '부탁을 받았다.', doors: [
        {label:'받는다', hint:'', fx:[]}, {label:'거절한다', hint:'', fx:[]},
      ] };
    const c: Cond = { c:'choiceAgo', turning:t.id, door:0, years:5 };
    s.pending = null; s.age = 20; openTurning(s, t); answerDoor(s, 1);
    s.age = 30; s.known.push(t.id + '#0');
    expect(check(s, c)).toBe(false);
    openTurning(s, t); answerDoor(s, 0);
    s.age = 34; openTurning(s, t); answerDoor(s, 1);
    expect(check(s, c)).toBe(false);
    s.age = 35;
    expect(check(normalizeLife5(JSON.parse(JSON.stringify(s)))!, c)).toBe(true);
    delete s.firstChoiceAge;
    expect(check(s, c)).toBe(false);
    s.age = 39; expect(check(s, c)).toBe(true);
    const legacy = normalizeLife5(structuredClone(s))!;
    openTurning(legacy, t); answerDoor(legacy, 1);
    expect(check(legacy, c)).toBe(true);
  });

  it('원작 인물을 다시 만나 배에 태워도 같은 이름·인물 ID·관계가 남는다', () => {
    const s = newLife5(9);
    applyFx(s, [{op:'person', canon:'coby', kind:'ally', relation:'만났던 소년'}]);
    const person = s.people.at(-1)!;
    applyFx(s, [{op:'person', canon:'coby', kind:'crew', relation:'다시 만난 동료'}]);
    expect(s.people.filter(p => p.canon === 'coby')).toEqual([person]);
    expect(person.crew).toBeDefined();
    expect(fillText(s, '{person:만났던 소년}')).toBe(person.name);
    applyFx(s, [{op:'personChange', relation:'만났던 소년', kind:'rival', rename:'갈라선 동료'}]);
    expect(person.crew).toBeUndefined();
    expect(check(s, {c:'person', relation:'갈라선 동료', has:true})).toBe(true);
    applyFx(s, [{op:'losePerson', relation:'만났던 소년'}, {op:'person', canon:'coby', kind:'ally', relation:'다시 본 얼굴'}]);
    expect(s.people.filter(p => p.canon === 'coby')).toEqual([person]);
    expect(person.alive).toBe(false);
  });

  it('동료가 된 선장과 세상을 떠난 선장은 적의 습격을 이끌지 않는다', () => {
    const s = newLife5(19);
    const raid = TURNING_BY_ID.mis_raid_buggy;
    const invasion = raid.when.find(c => c.c === 'opponent')!;
    expect(check(s, invasion)).toBe(true);
    applyFx(s, [{ op: 'person', canon: 'buggy', kind: 'crew', relation: '함께 항해하는 선장' }]);
    expect(check(s, invasion)).toBe(false);
    applyFx(s, [{ op: 'personChange', relation: '함께 항해하는 선장', kind: 'rival' }]);
    expect(check(s, invasion)).toBe(true);
    applyFx(s, [{ op: 'losePerson', relation: '함께 항해하는 선장' }]);
    expect(check(s, invasion)).toBe(false);
  });

  it.each([['fist', 'bestFist'], ['polearm', 'bestWeapon'], ['blunt', 'bestWeapon'], ['gun', 'bestShot']] as const)(
    '%s 수련을 한 청소년이 자기 갈래의 대회에서 꿈을 정한다', (branch, dream) => {
      const s = newLife5(12);
      s.age = 15;
      s.pending = null;
      const t = TURNING_BY_ID[`dream_contest_${branch}`];
      s.growth.path = branch;
      expect(checkAll(s, t.when)).toBe(false);
      s.growth.tier[branch] = 1;
      expect(checkAll(s, t.when)).toBe(true);
      expect(checkAll(s, TURNING_BY_ID.dream_blade.when)).toBe(false);
      expect(openTurning(s, t)).toBe(true);
      answerDoor(s, 0);
      expect(s.dream?.id).toBe(dream);
    });

  it('모든 선행 선택 조건이 실제 사건과 선택지를 가리킨다', () => {
    const verify = (conditions: Cond[], owner: string) => {
      for (const c of conditions) {
        if (c.c === 'anyOf') verify(c.conditions, owner);
        if (c.c === 'choiceAgo') {
          expect(TURNING_BY_ID[c.turning]?.doors[c.door], owner + ' ← ' + c.turning).toBeDefined();
          expect(c.years ?? 0, owner).toBeGreaterThanOrEqual(0);
        }
      }
    };
    for (const t of TURNINGS) {
      verify(t.when, t.id);
      for (const d of t.doors) verify(d.when ?? [], t.id);
    }
    for (const m of MINORS) {
      verify(m.when, m.id);
      for (const o of m.outcomes) verify(o.when ?? [], m.id);
    }
  });
});
