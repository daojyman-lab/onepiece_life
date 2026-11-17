import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { checkAll } from '../../src/core/cond';
import { needsOk } from '../../src/core/needs';
import { answerDoor, openTurning } from '../../src/core/turning';
import { CHILDHOOD } from '../../src/data/turnings/childhood';
import type { Life5 } from '../../src/core/types';

const sickStories = CHILDHOOD.filter((t) => t.id.startsWith('kid_sick_'));
const eligible = (s: Life5) => sickStories.filter((t) => checkAll(s, t.when) && needsOk(s, t.needs));

function child(family: 'parents' | 'mother' | 'grandmother' | 'grandfather' | 'mentor' | 'neighbor' | 'alone'): Life5 {
  const s = newLife5(23, { lineage: family === 'parents' || family === 'mother' ? 'commoner' : 'orphan' });
  s.age = 8; s.pending = null; s.hero.standing = 'child';
  if (family === 'parents') return s;
  if (family === 'mother') {
    s.people.find((p) => p.relation === '아버지')!.alive = false;
    return s;
  }
  s.people = [];
  s.flags = family === 'alone' ? ['lonely'] : family === 'neighbor' ? ['parentsLost'] : [];
  if (family === 'grandmother' || family === 'grandfather') {
    s.flags.push('grandGuard');
    applyFx(s, [{ op: 'person', kind: 'ally', relation: family === 'grandmother' ? '할머니' : '할아버지', age: { older: 55 } }]);
  }
  if (family === 'mentor') applyFx(s, [{ op: 'person', kind: 'ally', relation: '스승', age: { older: 45 } }]);
  return s;
}

describe('가정환경에 따른 열병 사건', () => {
  it.each([
    ['parents', 'kid_sick_elder', '아버지'],
    ['mother', 'kid_sick_elder', '어머니'],
    ['grandmother', 'kid_sick_grandmother', '할머니'],
    ['grandfather', 'kid_sick_grandfather', '할아버지'],
    ['mentor', 'kid_sick_mentor', '스승'],
    ['neighbor', 'kid_sick_neighbor', '이웃'],
    ['alone', 'kid_sick_alone', '열병'],
  ] as const)('%s 아이에게 맞는 사건과 결과만 나온다', (family, id, word) => {
    const s = child(family);
    expect(eligible(s).map((t) => t.id)).toEqual([id]);
    expect(openTurning(s, eligible(s)[0])).toBe(true);
    expect(s.pending?.kind).toBe('door');
    if (s.pending?.kind !== 'door') return;
    expect(s.pending.body).toContain(word);
    answerDoor(s, 0);
    expect(s.log.at(-2)?.text ?? s.log.at(-1)?.text).toContain(word);
    expect(s.log.some((l) => l.text.includes('돌봐 주던 어른'))).toBe(false);
    expect(eligible(s)).toEqual([]);
  });

  it('조부모가 세상을 떠났으면 그 조부모의 열병 사건은 나오지 않는다', () => {
    const s = child('grandmother');
    s.people.find((p) => p.relation === '할머니')!.alive = false;
    expect(eligible(s).map((t) => t.id)).toEqual(['kid_sick_neighbor']);
  });
});
