import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { livingContact } from '../../src/core/needs';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';

const can = (s: Life5, id: string) => checkAll(s, TURNING_BY_ID[id].when);
const contact = (s: Life5, relation: string) => livingContact(s, { relation });

function choose(s: Life5, id: string, door: number) {
  s.pending = null;
  const t = TURNING_BY_ID[id];
  expect(can(s, id), id).toBe(true);
  expect(openTurning(s, t), id).toBe(true);
  const p = s.pending as Life5['pending'];
  if (p?.kind !== 'door') throw Error(id);
  expect(p.doors[door].locked, t.doors[door].label).toBeFalsy();
  answerDoor(s, door);
  return p;
}

describe('결정을 기억하는 인연', () => {
  it('검객의 미룬 승부는 검술로 만난 실제 상대가 살아 있고 스무 해가 지난 뒤에 온다', () => {
    for (const firstDoor of [0, 1]) {
      const s = newLife5(11);
      s.hero.standing = 'pirate';
      s.age = 20;
      s.growth.path = 'sword';
      s.growth.tier.sword = 2;
      choose(s, 'pp_harbor_duel', firstDoor);
      s.age = 39;
      expect(can(s, 'late_old_rival_blade')).toBe(false);
      s.age = 40;
      expect(can(s, 'late_old_rival_blade')).toBe(firstDoor === 0);
      if (firstDoor !== 0) continue;
      const person = contact(s, '결판을 미룬 검객')!;
      person.alive = false;
      expect(can(s, 'late_old_rival_blade')).toBe(false);
      person.alive = true;
      const scene = choose(s, 'late_old_rival_blade', 1);
      expect(scene.speaker).toBe(person.name);
      expect(scene.body).toContain(person.name);
      expect(contact(s, '술잔을 나눈 옛 맞수')?.id).toBe(person.id);
    }
  });

  it('같은 시장 장면에서 받은 도움과 서 준 보증은 각각 다른 훗날의 사건을 연다', () => {
    for (const [door, id, other] of [
      [0, 'life_fallen_benefactor', 'life_friend_debt'],
      [2, 'life_friend_debt', 'life_fallen_benefactor'],
    ] as const) {
      const s = newLife5(11);
      s.hero.standing = 'civil';
      s.age = 20;
      choose(s, 'life_merchant_meeting', door);
      s.age = 24;
      expect(can(s, other)).toBe(false);
      const person = contact(s, door === 0 ? '창고 방을 내준 상인' : '보증을 서 준 장사꾼')!;
      const scene = choose(s, id, door === 0 ? 0 : 1);
      expect(scene.body).toContain(person.name);
      expect(contact(s, door === 0 ? '몰락한 옛 은인' : '끌려와 빚을 갚은 옛 벗')?.id).toBe(person.id);
    }
  });

  it('꽃가게에서 만난 뒤 편지를 기다린 사람이 직접 배우자가 된다', () => {
    const s = newLife5(11);
    s.age = 20;
    s.hero.standing = 'civil';
    choose(s, 'life_meet', 0);
    const first = contact(s, '꽃가게에서 만난 사람')!;
    choose(s, 'life_love_or_route', 2);
    s.age = 27;
    const scene = choose(s, 'life_waited', 0);
    expect(scene.body).toContain(first.name);
    expect(contact(s, '배우자')).toMatchObject({ id: first.id, name: first.name, kind: 'family' });
    expect(s.people.filter(p => p.id === first.id)).toHaveLength(1);
  });

  it('사관학교에 진학하지 않은 해군 장교에게는 포로 교관이 생기지 않는다', () => {
    for (const door of [0, 1]) {
      const s = newLife5(11);
      s.age = 18;
      s.hero.standing = 'civil';
      s.hero.money = 300000;
      choose(s, 'path_marine_join', door);
      s.age = 42;
      expect(can(s, 'late_captive_teacher')).toBe(door === 1);
      if (door !== 1) continue;
      const teacher = contact(s, '사관학교 교관')!;
      const scene = choose(s, 'late_captive_teacher', 0);
      expect(scene.body).toContain(teacher.name);
      expect(contact(s, '포로에서 돌아온 늙은 교관')?.id).toBe(teacher.id);
    }
  });

  it('배에서 내쫓은 선원이 살아서 다시 오고, 용서를 받으면 같은 인물의 관계가 바뀐다', () => {
    const s = newLife5(11);
    s.age = 25;
    s.hero.standing = 'pirate';
    s.hero.fame = 30;
    s.flags.push('ship');
    choose(s, 'pp_crew', 0);
    const oldCrew = contact(s, '동료')!;
    const confrontation = choose(s, 'pirate_crew_traitor', 0);
    expect(confrontation.speaker).toBe(oldCrew.name);
    expect(oldCrew.alive).toBe(true);
    expect(oldCrew.crew).toBeUndefined();
    const reunion = choose(s, 'pp_traitor', 0);
    expect(reunion.speaker).toBe(oldCrew.name);
    expect(contact(s, '용서한 옛 동료')).toMatchObject({ id: oldCrew.id, kind: 'ally' });
  });

  it('어린 날 목말을 태운 부모를 잃으면 다른 부모가 살아 있어도 그 장면은 오지 않는다', () => {
    const s = newLife5(11);
    s.age = 6;
    const parent = { id: 'test-parent-1', name: '모란', gender: 'f', age: 33, kind: 'family',
      relation: '어머니', canon: null, bond: 50, faction: 'civil', species: 'human', alive: true } as const;
    s.people = [{ ...parent }, { ...parent, id: 'test-parent-2', name: '마루', gender: 'm', relation: '아버지' }];
    choose(s, 'par_shoulders', 0);
    expect(contact(s, '목말을 태워 준 부모')?.id).toBe(parent.id);
    s.age = 38;
    s.hero.standing = 'civil';
    expect(can(s, 'par_echo_carry')).toBe(true);
    s.people[0].alive = false;
    expect(can(s, 'par_echo_carry')).toBe(false);
  });
});
