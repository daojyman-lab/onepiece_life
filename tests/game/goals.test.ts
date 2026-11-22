// v7 항해의 목표: 중요한 사람과의 약속이 목표가 되고, 목표가 인생을 끌며, 지키면 강해진다.
import { describe, expect, it } from 'vitest';
import { activeFocus, doorGoals, goalActivity, goalState, goalsView, goalYear, promiseLines, promiseOffer, turningGoalMult } from '../../src/core/goals';
import { applyFx } from '../../src/core/fx';
import { newLife5 } from '../../src/core/state';
import { autoplay5 } from '../../src/core/autoplay';
import { answerDoor, openTurning } from '../../src/core/turning';
import { V } from '../../src/data/balance';
import { PROMISE_BY_ID, PROMISE_TURNINGS, PROMISES, promiseTurningId } from '../../src/data/promises';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { SEA_BY_ID } from '../../src/shared/data/seas';
import type { Activity, Life5, Person, Turning } from '../../src/core/types';

const fresh = (seed = 7): Life5 => { const s = newLife5(seed); s.pending = null; s.age = 10; s.queue = []; s.storyRest = 0; return s; };
const addPerson = (s: Life5, p: Partial<Person> & Pick<Person, 'relation' | 'kind'>): Person => {
  const person: Person = { id: `t${s.people.length}`, name: p.name ?? '하루', gender: 'm', age: s.age, canon: null, bond: 50, faction: 'civil',
    species: 'human', alive: true, ...p };
  s.people.push(person);
  return person;
};
/** 장면을 띄우고 index번째 문을 고른다 */
const promiseVia = (s: Life5, id: string, person: Person, door = 0) => {
  goalState(s).offer = { id, personId: person.id };
  expect(openTurning(s, TURNING_BY_ID[promiseTurningId(id)])).toBe(true);
  answerDoor(s, door);
};

describe('인연의 약속', () => {
  it('약속마다 장면이 있고, 장면은 저절로 뽑히지 않는다 (가중치 0)', () => {
    expect(PROMISE_TURNINGS).toHaveLength(PROMISES.length);
    for (const t of PROMISE_TURNINGS) {
      expect(TURNING_BY_ID[t.id], t.id).toBe(t);
      expect(t.weight).toBe(0);
      expect(t.doors).toHaveLength(2);
    }
  });

  it('약속하면 목표가 되고, 장면의 말하는 사람은 약속을 나눌 그 사람이다', () => {
    const s = fresh();
    const sib = addPerson(s, { relation: '남동생', kind: 'family', name: '하루' });
    goalState(s).offer = { id: 'sib_guard', personId: sib.id };
    openTurning(s, TURNING_BY_ID[promiseTurningId('sib_guard')]);
    expect(s.pending?.kind === 'door' && s.pending.speaker).toBe('하루');
    expect(s.pending?.kind === 'door' && s.pending.body).toContain('하루');
    answerDoor(s, 0);
    const p = goalState(s).promises[0];
    expect(p).toMatchObject({ id: 'sib_guard', personId: sib.id, name: '하루', status: 'active', madeAt: 10 });
    expect(goalState(s).offer).toBeNull();
    expect(s.log.some((l) => l.text.includes('하루에게 약속했다'))).toBe(true);
    expect(goalsView(s).promises[0]).toMatchObject({ name: '하루', status: 'active' });
  });

  it('약속하지 않으면 목표가 생기지 않고, 그 장면은 다시 오지 않는다', () => {
    const s = fresh();
    const sib = addPerson(s, { relation: '형', kind: 'family' });
    promiseVia(s, 'sib_guard', sib, 1);
    expect(goalState(s).promises).toHaveLength(0);
    expect(openTurning(s, TURNING_BY_ID[promiseTurningId('sib_guard')])).toBe(false);
  });

  it('약속을 지키면 능력치 · 숙련 · 유대가 오르고 기록과 연표에 남는다', () => {
    const s = fresh();
    const sib = addPerson(s, { relation: '형', kind: 'family' });
    promiseVia(s, 'sib_guard', sib);
    const bond = sib.bond;
    s.growth.tier.sword = 2;
    s.age = 12;
    goalYear(s);                                        // 약속한 지 3년이 안 되었다
    expect(goalState(s).promises[0].status).toBe('active');
    s.age = 13;
    const str = s.hero.base.str;
    goalYear(s);
    expect(goalState(s).promises[0]).toMatchObject({ status: 'kept', doneAt: 13 });
    expect(s.hero.base.str).toBe(str + V.goal.keptStat);
    expect(sib.bond).toBe(Math.min(100, bond + V.goal.keptBond));
    expect(s.log.at(-1)?.text).toContain('약속을 지켰다');
    expect(s.timeline.at(-1)?.text).toContain('약속을 지켰다');
    expect(promiseLines(s)[0]).toMatch(/^✔/);
  });

  it('그 사람이 세상을 떠나면 약속은 유언으로 남고, 지키면 더 강해진다', () => {
    const s = fresh();
    s.hero.sea = 'east';
    const g = addPerson(s, { relation: '할머니', kind: 'ally', gender: 'f' });
    promiseVia(s, 'grand_sea', g);
    g.alive = false;
    goalYear(s);
    expect(goalState(s).promises[0]).toMatchObject({ status: 'active', orphaned: true });
    s.hero.sea = 'gl_first';
    expect(SEA_BY_ID.gl_first.stage).toBeGreaterThanOrEqual(3);
    const spd = s.hero.base.spd;
    goalYear(s);
    expect(goalState(s).promises[0].status).toBe('kept');
    expect(s.hero.base.spd).toBe(spd + V.goal.keptStat + V.goal.orphanStat);
  });

  it('그 사람이 있어야만 지킬 수 있는 약속은 그 사람이 떠나면 끝난다', () => {
    const s = fresh();
    s.age = 25;
    const sp = addPerson(s, { relation: '아내', kind: 'family', gender: 'f' });
    promiseVia(s, 'spouse_old', sp);
    sp.alive = false;
    goalYear(s);
    expect(goalState(s).promises[0].status).toBe('lost');
    expect(promiseLines(s)[0]).toMatch(/^✕/);
  });

  it('맞수를 한 번 이기면 "다음엔 반드시 이긴다" 약속을 지킨다', () => {
    const s = fresh();
    s.age = 14;
    const r = addPerson(s, { relation: '어릴 적 맞수', kind: 'rival' });
    promiseVia(s, 'rival_win', r);
    s.flags.push('rivalDuel:beaten');
    goalYear(s);
    expect(goalState(s).promises[0].status).toBe('kept');
  });

  it('약속의 장면은 나이와 사람이 맞을 때만 오고, 섬 장편 · 항해 중에는 오지 않는다', () => {
    const s = fresh();
    addPerson(s, { relation: '남동생', kind: 'family' });
    let offered = false;
    for (let part = 0; part < 4 * 6 && !offered; part++) {
      s.part = (part % 4) as Life5['part'];
      s.age = 10 + Math.floor(part / 4);
      goalState(s).nextAt = 0;
      const t = promiseOffer(s);
      if (t) { offered = true; expect(PROMISE_BY_ID[goalState(s).offer!.id].who).toBe('sibling'); }
    }
    expect(offered).toBe(true);
    const busy = fresh();
    addPerson(busy, { relation: '남동생', kind: 'family' });
    busy.queue = ['ep_loguetown_a1'];
    for (let part = 0; part < 16; part++) { busy.part = (part % 4) as Life5['part']; busy.age = 10 + Math.floor(part / 4); expect(promiseOffer(busy)).toBeNull(); }
  });
});

describe('목표가 인생을 끈다', () => {
  it('꿈과 약속이 바라보는 쪽의 활동이 무거워진다', () => {
    const s = fresh();
    s.age = 15;
    applyFx(s, [{ op: 'dream', id: 'treasure' }]);
    const w: Record<Activity, number> = { train: 10, work: 10, study: 10, roam: 10, family: 10, rest: 10 };
    goalActivity(s, w);
    expect(w.work).toBe(10 + V.goal.activity);
    expect(w.roam).toBe(10 + V.goal.activity);
    expect(w.rest).toBe(10);
  });

  it('목표와 같은 방향의 사건은 더 자주 오고, 그 쪽 문에는 목표의 이름이 붙는다', () => {
    const s = fresh();
    s.age = 15;
    applyFx(s, [{ op: 'dream', id: 'bestSword' }]);
    expect(activeFocus(s).has('train')).toBe(true);
    const t: Turning = { id: 'test_goal', kind: 'door', when: [], weight: 10, repeat: 'once', speaker: 'hero', title: '', body: '',
      doors: [{ label: '수련', hint: '', fx: [{ op: 'mastery', branch: 'sword', add: 5 }] }, { label: '쉰다', hint: '', fx: [{ op: 'hp', add: 5 }] }] };
    expect(turningGoalMult(s, t)).toBe(V.goal.turning);
    const goals = doorGoals(s, t);
    expect(goals[0]).toContain('세계 최강의 검객');
    expect(goals[1]).toBeUndefined();
  });

  it('여러 인생을 돌려도 멈추거나 불변 조건을 어기지 않고, 약속을 맺고 지킨다', () => {
    let made = 0, kept = 0;
    for (let i = 0; i < 20; i++) {
      const { s, stuck, violations } = autoplay5(31000 + i, 'lean');
      expect(stuck).toBe(false);
      expect(violations).toEqual([]);
      made += s.goals?.promises.length ?? 0;
      kept += s.goals?.promises.filter((p) => p.status === 'kept').length ?? 0;
    }
    expect(made).toBeGreaterThan(15);
    expect(kept).toBeGreaterThan(5);
  });
});
