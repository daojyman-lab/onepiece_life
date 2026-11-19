import { describe, expect, it } from 'vitest';
import { askFight } from '../../src/core/fight';
import { normalizeLife5 } from '../../src/core/load';
import { apply5 } from '../../src/core/reduce';
import { emptyLife } from '../../src/core/state';
import { openTurning } from '../../src/core/turning';
import type { Life5, Person } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { profileView } from '../../src/ui/view/profile';

function start() {
  const s = emptyLife(27);
  Object.assign(s.hero, { name: '린', surname: '모라', island: '로그타운', town: '로그타운', standing: 'civil' });
  s.age = 18;
  return s;
}

function choose(s: Life5, turning: string, index: number) {
  expect(openTurning(s, TURNING_BY_ID[turning])).toBe(true);
  expect(s.pending?.kind === 'door' && s.pending.doors[index].locked).toBeNull();
  apply5(s, { type: 'answer', index });
}

function person(name: string, relation: string, kind: Person['kind'], extra: Partial<Person> = {}): Person {
  return { id: name, name, relation, kind, gender: 'm', age: 25, canon: null, bond: 40, faction: 'civil', species: 'human', alive: true, ...extra };
}

const posters = (s: Life5) => s.timeline.filter(line => line.text.includes('첫 현상금'));
const scene = (s: Life5) => s.log.filter(line => line.type === 'world').map(line => line.text).join('\n');

describe('첫 현상수배서', () => {
  it('명성만 있던 인물이 해적이 되는 선택에서 프로필과 같은 금액으로 발행한다', () => {
    const s = start();
    s.hero.fame = 2;
    expect(profileView(s).fame).toBe('이름값 2');
    choose(s, 'path_pirate_sail', 1);
    expect(profileView(s).fame).toBe('현상금 2,000,000 베리');
    expect(scene(s)).toContain('모라 린');
    expect(posters(s).map(p => p.text)).toEqual(['첫 현상금 2,000,000 베리']);
    expect(scene(s)).not.toMatch(/아버지|어머니|스승|맞수/);
  });

  it('무명 해적은 첫 명성 획득까지 기다리고, 인상ㆍ재출항ㆍ저장 재개 때 반복하지 않는다', () => {
    let s = start();
    choose(s, 'path_pirate_sail', 1);
    expect(posters(s)).toHaveLength(0);
    choose(s, 'crew_raid', 0);
    expect(posters(s)).toHaveLength(1);
    const first = posters(s)[0].text;
    s = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    s.age += 3;
    choose(s, 'crew_raid', 0);
    s.hero.standing = 'civil';
    choose(s, 'path_pirate_taken', 0);
    expect(posters(s).map(p => p.text)).toEqual([first]);
  });

  it('전투 승리도 같은 기준을 쓴다. 해적과 칠무해에게만 수배서가 생긴다', () => {
    for (const standing of ['pirate', 'warlord', 'marine', 'bountyHunter'] as const) {
      const s = start();
      s.hero.standing = standing;
      s.hero.base = { str: 200, spd: 200, vit: 200, int: 200, wil: 200, luk: 200 };
      askFight(s, 'b_alvida', false, true);
      expect(s.pending?.kind === 'battle' && s.pending.result).toBe('win');
      expect(posters(s)).toHaveLength(0);
      apply5(s, { type: 'answer', index: 0 });
      expect(s.hero.fame).toBeGreaterThan(0);
      expect(posters(s)).toHaveLength(standing === 'pirate' || standing === 'warlord' ? 1 : 0);
    }
  });

  it('살아 있는 실제 관계만 각자의 이름과 말로 비춘다', () => {
    const s = start();
    s.hero.fame = 1;
    s.people = [
      person('란', '어머니', 'family'), person('타로', '아버지', 'family'),
      person('사키', '언니', 'family'), person('코코', '남동생', 'family', { age: 12 }),
      person('오린', '스승', 'ally'), person('에다', '어릴 적 맞수', 'rival'),
      person('실종인', '형', 'family', { missing: true }), person('망자', '누나', 'family', { alive: false }),
      person('낯선이', '옆집 사범', 'enemy'), person('학생', '무예를 가르친 제자', 'ally'),
    ];
    choose(s, 'path_pirate_sail', 1);
    const lines = scene(s).split('\n');
    for (const name of ['란', '타로', '사키', '코코', '오린', '에다']) expect(lines.filter(line => line.includes(name) && line.includes('“'))).toHaveLength(1);
    expect(scene(s)).not.toMatch(/실종인|망자|낯선이|학생/);
    expect(new Set(lines.slice(1).map(line => line.split('“')[1])).size).toBe(6);
  });

  it('시모츠키에서 실제 수업을 받은 옛 제자만 사범이 알아본다', () => {
    for (const [choice, dead, expected] of [[0, false, true], [1, false, true], [2, false, false], [0, true, false]] as const) {
      const s = start();
      s.tried = [`town_shimo_dojo#${choice}`];
      s.hero.fame = 1;
      if (dead) s.people.push(person('코우시로', '도장의 사범', 'ally', { alive: false, canon: 'koshiro' }));
      choose(s, 'path_pirate_sail', 1);
      expect(scene(s).includes('코우시로')).toBe(expected);
    }
  });

  it('훈련 기간이 끝난 일반 스승과 관계 호칭이 바뀐 유파 스승도 기억한다', () => {
    const s = start();
    s.tried = ['pp_wander_master#0'];
    s.hero.fame = 1;
    choose(s, 'path_pirate_sail', 1);
    expect(scene(s)).toContain('떠돌이 무인');
    const s2 = start();
    s2.hero.fame = 1;
    s2.people.push(person('류', '약속을 지킨 동료', 'ally'));
    s2.growth.styleBonds.oneSword = { teacherId: '류', island: '로그타운', since: 14, practice: 3, adopted: true, refined: false };
    choose(s2, 'path_pirate_sail', 1);
    expect(scene(s2)).toContain('류');
  });

  it('이미 현상금이 있거나 과거 해적 생활을 마친 옛 저장에 가짜 첫 발행을 만들지 않는다', () => {
    for (const standing of ['pirate', 'civil'] as const) {
      const old = start();
      old.hero.standing = standing;
      old.hero.fame = 19;
      old.timeline.push({ age: 16, standing: 'pirate', text: '출항' });
      const { firstBountyIssued: _removed, ...legacy } = old;
      const s = normalizeLife5(legacy)!;
      expect(scene(s)).toBe('');
      s.hero.standing = 'civil';
      choose(s, 'path_pirate_sail', 1);
      expect(posters(s)).toHaveLength(0);
    }
    const { firstBountyIssued: _removed, ...childhood } = start();
    const s = normalizeLife5(childhood)!;
    s.hero.fame = 1;
    choose(s, 'path_pirate_sail', 1);
    expect(posters(s)).toHaveLength(1);
  });
});
