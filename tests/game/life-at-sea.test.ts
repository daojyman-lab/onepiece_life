import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openQueued } from '../../src/core/turning';
import type { Life5, Person } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';

function choose(s: Life5, id: string, index: number) {
  s.queue.push(id);
  expect(openQueued(s), id).toBe(true);
  if (s.pending?.kind !== 'door') throw new Error(id);
  const body = s.pending.body;
  expect(s.pending.turning).toBe(id);
  expect(s.pending.doors[index].locked).toBeNull();
  answerDoor(s, index);
  return body;
}
const fits = (s: Life5, id: string) => checkAll(s, TURNING_BY_ID[id].when);
function sailor(id: string, name: string): Person {
  return { id, name, kind: 'crew', alive: true, relation: '갑판원', canon: null, gender: 'm', age: 25, bond: 45, species: 'human', faction: 'pirate',
    crew: { role: 'vanguard', level: 2, power: 12, skills: [], injuredMonths: 0 } };
}
function aboard() {
  const s = newLife5(100);
  s.age = 22;
  s.hero.standing = 'pirate';
  s.hero.island = '자야';
  s.hero.sea = 'gl_first';
  s.pending = null;
  applyFx(s, [{ op: 'flag', id: 'ship' }]);
  s.people.push(sailor('watch-a', '미로'));
  return s;
}
const first = 'aboard_last_fish', shelf = 'aboard_covered_plate', next = 'aboard_watch_remembered';
const whale = 'child_windmill_whale', letter = 'letter_windmill_whale', book = 'book_windmill_whale';

describe('배에서 당직자 몫을 남기는 까닭', () => {
  it('같은 배에서 끼니를 놓쳤던 본인과 나중에 들어온 선원에게만 후속 대사가 붙는다', () => {
    const s = aboard();
    expect(choose(s, first, 0)).toContain('미로');
    expect(fits(s, shelf)).toBe(false);
    s.age++;
    const oldHand = sailor('watch-b', '모레');
    s.people.push(oldHand);
    expect(choose(s, shelf, 0)).toContain('미로');
    s.age += 3;
    expect(fits(s, next)).toBe(false);
    const junior = sailor('watch-c', '보리');
    s.people.push(junior);
    oldHand.alive = false;
    junior.crew!.separatedMonths = 1;
    expect(fits(s, next)).toBe(false);
    delete junior.crew!.separatedMonths;
    const resumed = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    const body = choose(resumed, next, 0);
    expect(body).toContain('미로가 설거지를');
    expect(body).toContain('보리였다');
    expect(resumed.watchMeal?.stage).toBe('passed');
    expect(fits(resumed, next)).toBe(false);
  });
  it('별도로 고기를 굽거나 배를 바꾸면 지난 당직이 새 배의 관습이 되지 않는다', () => {
    const s = aboard();
    const differentMeal = structuredClone(s);
    choose(differentMeal, first, 1);
    differentMeal.age++;
    expect(fits(differentMeal, shelf)).toBe(false);
    choose(s, first, 0);
    s.age++;
    choose(s, shelf, 0);
    expect(checkAll(s, [{ c: 'watchMeal', stage: 'custom' }])).toBe(true);
    s.people.find(p => p.id === 'watch-a')!.alive = false;
    expect(checkAll(s, [{ c: 'watchMeal', stage: 'custom' }])).toBe(true);
    applyFx(s, [{ op: 'unflag', id: 'ship' }, { op: 'flag', id: 'ship' }]);
    expect(checkAll(s, [{ c: 'watchMeal', stage: 'custom' }])).toBe(false);
  });
});

describe('허풍에서 고래 도감까지', () => {
  function start() {
    const s = newLife5(77);
    s.age = 9;
    s.hero.standing = 'child';
    s.hero.island = '시럽 마을';
    s.pending = null;
    return s;
  }
  it('정직하게 답한 아이에게 허구의 헌사나 편지가 생기지 않는다', () => {
    const s = start();
    choose(s, whale, 1);
    s.age = 50;
    s.hero.standing = 'settled';
    expect(fits(s, book)).toBe(false);
    expect(fits(s, letter)).toBe(false);
  });
  it('실제로 들은 아이가 자라서 저자가 되고, 편지 답장에 맞는 문장만 돌아온다', () => {
    const s = start();
    choose(s, whale, 0);
    const writer = s.people.find(p => p.relation === '어릴 적 풍차고래 이야기를 들은 아이')!;
    expect(writer.age).toBe(9);
    s.age += 7;
    s.hero.standing = 'civil';
    for (const answer of [0, 1]) {
      const old = structuredClone(s);
      expect(choose(old, letter, answer)).toContain(writer.name);
      expect(fits(old, book)).toBe(false);
      old.age += 17;
      const resumed = normalizeLife5(JSON.parse(JSON.stringify(old)))!;
      const body = choose(resumed, book, 1);
      expect(body).toContain(writer.name);
      expect(body).toContain(answer ? '작은 흰 점' : '친구가 편지로 물은 자리');
      expect(body).not.toContain(answer ? '친구가 편지로 물은 자리' : '작은 흰 점');
      expect(fits(resumed, letter)).toBe(false);
    }
    s.age = 45;
    expect(choose(s, book, 0)).not.toContain('편지');
  });
});
