import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { Life5 } from '../../src/core/types';

function choose(s: Life5, id: string, index: number): void {
  s.pending = null;
  expect(openTurning(s, TURNING_BY_ID[id]), id).toBe(true);
  answerDoor(s, index);
}

function promisedFriend(): { s: Life5; id: string; name: string } {
  const s = newLife5(11);
  s.age = 7;
  choose(s, 'kid_ship_friend', 0);
  const first = s.people.find((p) => p.relation === '어릴 적 동무');
  expect(first).toBeDefined();
  s.age = 12;
  choose(s, 'kid_promise', 0);
  const friend = s.people.find((p) => p.relation === '어릴 적 동무');
  expect(friend).toBeDefined();
  expect(friend?.id).toBe(first?.id);
  return { s, id: friend!.id, name: friend!.name };
}

describe('돌아온 도면의 인연', () => {
  it('첫 만남에서 붙은 친구의 이름을 약속까지 유지하고 기록한다', () => {
    const { s, name } = promisedFriend();
    expect(s.people.filter((p) => p.relation === '어릴 적 동무')).toHaveLength(1);
    expect(s.log.some((line) => line.text.includes(name))).toBe(true);
  });

  it('먼저 만난 친구가 없으면 떠나는 친구를 아는 척하지 않는다', () => {
    const s = newLife5(11);
    s.age = 12;
    expect(checkAll(s, TURNING_BY_ID.kid_promise.when)).toBe(false);
  });

  it('재회 후 동행하거나 맞수가 되어도 같은 인물과 이름이 남는다', () => {
    for (const [index, kind] of [[0, 'crew'], [2, 'rival']] as const) {
      const { s, id, name } = promisedFriend();
      s.age = 22;
      s.hero.standing = 'civil';
      choose(s, 'pp_promise', index);
      expect(s.people.filter((p) => p.relation === '어릴 적 동무')).toHaveLength(1);
      expect(s.people.find((p) => p.id === id)).toMatchObject({ name, kind });
      expect(s.log.some((line) => line.age === 22 && line.text.includes(name))).toBe(true);
    }
  });

  it('함께 배와 도면을 만든 이력만 황혼기 재회를 열고 같은 이름을 보여 준다', () => {
    const { s, id, name } = promisedFriend();
    s.age = 23;
    s.hero.standing = 'shipwright';
    choose(s, 'pp_promise', 1);
    expect(checkAll(s, TURNING_BY_ID.late_old_design.when)).toBe(false);
    choose(s, 'sw_old_design', 0);
    expect(s.people.find((p) => p.id === id)?.name).toBe(name);
    expect(s.timeline.some((entry) => entry.text.includes(name))).toBe(true);
    s.age = 61;
    s.hero.standing = 'settled';
    expect(checkAll(s, TURNING_BY_ID.late_old_design.when)).toBe(true);
    s.pending = null;
    expect(openTurning(s, TURNING_BY_ID.late_old_design)).toBe(true);
    const scene = s.pending as unknown as Extract<Life5['pending'], { kind: 'door' }>;
    expect(scene.speaker).toBe(name);
    expect(scene.body).toContain(name);
    expect(normalizeLife5(JSON.parse(JSON.stringify(s)))?.pending).toMatchObject({ speaker: name });
    answerDoor(s, 1);
    expect(s.people.filter((p) => p.id === id)).toHaveLength(1);
    expect(s.people.filter((p) => p.relation === '어릴 적 동무')).toHaveLength(1);
  });

  it('도면을 함께 만들지 않았거나 친구가 죽었으면 추억을 꾸며 내지 않는다', () => {
    const { s } = promisedFriend();
    s.age = 28;
    s.hero.standing = 'shipwright';
    choose(s, 'sw_old_design', 1);
    s.age = 60;
    expect(checkAll(s, TURNING_BY_ID.late_old_design.when)).toBe(false);
    const friend = s.people.find((p) => p.relation === '어릴 적 동무')!;
    friend.alive = false;
    expect(checkAll(s, TURNING_BY_ID.sw_old_design.when)).toBe(false);
  });

  it('옛 저장에 이미 떠 있던 근거 없는 황혼기 창을 닫는다', () => {
    const s = newLife5(11);
    s.age = 60;
    s.pending = null;
    expect(openTurning(s, TURNING_BY_ID.late_old_design)).toBe(true);
    const restored = normalizeLife5(JSON.parse(JSON.stringify(s)));
    expect(restored).not.toBeNull();
    expect(restored?.pending).toBeNull();
  });
});
