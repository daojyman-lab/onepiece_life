import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { checkAll } from '../../src/core/cond';
import { answerDoor, openTurning } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { Life5 } from '../../src/core/types';

const child = (age = 9): Life5 => {
  const s = newLife5(101);
  s.age = age;
  s.pending = null;
  s.hero.standing = 'child';
  s.people = [];
  return s;
};
const seen = (s: Life5, id: string) => checkAll(s, TURNING_BY_ID[id].when);

describe('유년기의 이어지는 인연', () => {
  it('목검 대련은 이미 아는 맞수, 형제, 스승을 상대역으로 쓴다', () => {
    for (const [relation, id] of [
      ['어릴 적 맞수', 'kid_wooden_sword_rival'],
      ['형', 'kid_wooden_sword_sibling'],
      ['스승', 'kid_wooden_sword_mentor'],
    ] as const) {
      const s = child();
      applyFx(s, [{ op: 'person', kind: relation === '형' ? 'family' : relation === '어릴 적 맞수' ? 'rival' : 'ally', relation, name: '하루' }]);
      expect(seen(s, id), id).toBe(true);
      expect(seen(s, 'kid_wooden_sword')).toBe(false);
      expect(openTurning(s, TURNING_BY_ID[id])).toBe(true);
      expect(s.pending?.kind === 'door' ? s.pending.body : '').toContain('하루');
    }
  });

  it('맞수의 첫 선택이 축제 준비, 당일, 마지막 겨룸으로 이어진다', () => {
    const s = child(8);
    expect(openTurning(s, TURNING_BY_ID.kid_rival)).toBe(true);
    answerDoor(s, 1);
    const rival = s.people.find((p) => p.relation === '어릴 적 맞수')!;
    expect(rival).toBeDefined();
    s.age = 10;
    expect(seen(s, 'kid_rival_festival_prepare')).toBe(true);
    expect(openTurning(s, TURNING_BY_ID.kid_rival_festival_prepare)).toBe(true);
    expect(s.pending?.kind === 'door' ? s.pending.body : '').toContain(rival.name);
    answerDoor(s, 0);
    expect(seen(s, 'kid_rival_festival_day')).toBe(true);
    expect(openTurning(s, TURNING_BY_ID.kid_rival_festival_day)).toBe(true);
    answerDoor(s, 1);
    s.age = 13;
    expect(seen(s, 'kid_rival_farewell')).toBe(true);
    expect(openTurning(s, TURNING_BY_ID.kid_rival_farewell)).toBe(true);
    expect(s.pending?.kind === 'door' ? s.pending.body : '').toContain(rival.name);
    expect(s.people.filter((p) => p.relation === '어릴 적 맞수')).toHaveLength(1);
  });

  it('부모와 스승 후속 사건은 선행 선택과 살아 있는 인물을 요구한다', () => {
    const parent = child(13);
    applyFx(parent, [{ op: 'person', kind: 'family', relation: '어머니', name: '미나' }]);
    expect(seen(parent, 'par_after_table')).toBe(false);
    parent.flags.push('parSlam');
    expect(seen(parent, 'par_after_table')).toBe(true);
    expect(openTurning(parent, TURNING_BY_ID.par_after_table)).toBe(true);
    expect(parent.pending?.kind === 'door' ? parent.pending.body : '').toContain('미나');

    const mentor = child(11);
    applyFx(mentor, [{ op: 'person', kind: 'ally', relation: '스승', name: '겐조' }]);
    expect(seen(mentor, 'men_training')).toBe(false);
    mentor.flags.push('menLesson');
    expect(seen(mentor, 'men_training')).toBe(true);
    expect(openTurning(mentor, TURNING_BY_ID.men_training)).toBe(true);
    expect(mentor.pending?.kind === 'door' ? mentor.pending.body : '').toContain('겐조');
  });

  it('아는 상대가 없는 목검 대련도 이름 있는 인연을 남긴다', () => {
    const s = child(7);
    expect(seen(s, 'kid_wooden_sword')).toBe(true);
    expect(openTurning(s, TURNING_BY_ID.kid_wooden_sword)).toBe(true);
    answerDoor(s, 0);
    const elder = s.people.find((p) => p.relation === '목검을 가르친 형')!;
    expect(elder).toBeDefined();
    s.age = 11;
    expect(seen(s, 'kid_wooden_sword_older_revisit')).toBe(true);
    expect(openTurning(s, TURNING_BY_ID.kid_wooden_sword_older_revisit)).toBe(true);
    expect(s.pending?.kind === 'door' ? s.pending.body : '').toContain(elder.name);
  });

  it('친구를 택한 첫 만남은 맞수로 바꾸지 않고 같은 친구와 축제에 간다', () => {
    const s = child(8);
    expect(openTurning(s, TURNING_BY_ID.kid_rival)).toBe(true);
    answerDoor(s, 2);
    const friend = s.people.find((p) => p.relation === '어릴 적 친구')!;
    expect(friend.kind).toBe('ally');
    expect(seen(s, 'kid_wooden_sword_new_friend')).toBe(true);
    expect(seen(s, 'kid_wooden_sword')).toBe(false);
    s.age = 10;
    expect(seen(s, 'kid_rival_festival_prepare')).toBe(false);
    expect(seen(s, 'kid_rival_friend_festival')).toBe(true);
    expect(openTurning(s, TURNING_BY_ID.kid_rival_friend_festival)).toBe(true);
    expect(s.pending?.kind === 'door' ? s.pending.body : '').toContain(friend.name);
  });

  it('부모의 일과 스승의 훈련 선택이 다음 장면에 반영된다', () => {
    const parent = child(10);
    applyFx(parent, [{ op: 'person', kind: 'family', relation: '어머니', name: '미나' }]);
    expect(openTurning(parent, TURNING_BY_ID.par_hands)).toBe(true);
    answerDoor(parent, 0);
    expect(seen(parent, 'par_work')).toBe(true);
    expect(openTurning(parent, TURNING_BY_ID.par_work)).toBe(true);
    expect(parent.pending?.kind === 'door' ? parent.pending.body : '').toContain('미나의 일을 거든');

    const mentor = child(11);
    applyFx(mentor, [{ op: 'person', kind: 'ally', relation: '스승', name: '겐조' }]);
    mentor.flags.push('menLesson');
    expect(openTurning(mentor, TURNING_BY_ID.men_training)).toBe(true);
    answerDoor(mentor, 0);
    mentor.age = 13;
    expect(openTurning(mentor, TURNING_BY_ID.men_back)).toBe(true);
    expect(mentor.pending?.kind === 'door' ? mentor.pending.body : '').toContain('다친 아이를 등 뒤에');
  });
});
