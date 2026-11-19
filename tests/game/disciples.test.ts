import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { checkAll } from '../../src/core/cond';
import { openTurning, answerDoor } from '../../src/core/turning';
import { normalizeLife5 } from '../../src/core/load';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { Life5 } from '../../src/core/types';
import { COMBAT_STYLES } from '../../src/data/combat-styles';

function life() {
  const s = newLife5(415); s.pending = null; s.age = 30;
  s.hero.standing = 'civil'; s.hero.island = '로그타운'; s.hero.town = '로그타운';
  s.growth.path = 'gun'; s.growth.primaryStyle = 'pistol';
  s.growth.tier.gun = 3; s.growth.styleMastery.pistol = 300;
  return s;
}
function choose(s: Life5, id: string, index = 0) {
  const t = TURNING_BY_ID[id];
  expect(t, id).toBeDefined(); expect(checkAll(s, t.when), id).toBe(true);
  expect(openTurning(s, t), id).toBe(true);
  const pending = structuredClone(s.pending);
  answerDoor(s, index); return pending;
}

describe('제자의 과거와 재회', () => {
  it('실제로 가르친 제자가 없으면 은퇴했다고 옛 제자가 생기지 않는다', () => {
    const s = life(); s.age = 60; s.hero.standing = 'retired';
    expect(checkAll(s, TURNING_BY_ID.late_r_student_pirate.when)).toBe(false);
    expect(checkAll(s, TURNING_BY_ID.late_disciple_sails.when)).toBe(false);
  });
  it('받지 않은 제자는 기록과 인물 목록에 생기지 않는다', () => {
    const s = life(); const before = s.people.length;
    choose(s, 'disciple_meeting', 2);
    expect(s.disciples ?? []).toHaveLength(0); expect(s.people).toHaveLength(before);
  });
  it('여러 제자에게 서로 다른 이름을 붙이고 각자의 배운 유파를 보존한다', () => {
    const s = life(); choose(s, 'disciple_meeting');
    s.age = 32; s.growth.path = 'fist'; s.growth.primaryStyle = 'boxing';
    s.growth.tier.fist = 3; s.growth.styleMastery.boxing = 300;
    choose(s, 'disciple_meeting');
    expect(s.disciples).toHaveLength(2);
    const people = s.disciples!.map(d => s.people.find(p => p.id === d.personId)!);
    expect(new Set(people.map(p => p.name)).size).toBe(2);
    expect(s.disciples!.map(d => d.style)).toEqual(['pistol', 'boxing']);
  });
  it.each(COMBAT_STYLES)('$name을 가르친 사실은 그 유파로 남고 배우지 않은 기술을 가르치지 않는다', ({id, branch, name}) => {
    const s = life(); s.growth.path = branch; s.growth.primaryStyle = id;
    s.growth.styleFocus[branch] = id; s.growth.tier[branch] = 2; s.growth.styleMastery[id] = 200;
    choose(s, 'disciple_meeting');
    expect(s.disciples![0].style).toBe(id);
    expect(s.log.at(-1)?.text).toBeDefined();
    expect(s.log.some(l => l.text.includes(name) && l.text.includes('제자로 받았다'))).toBe(true);
    const novice = life(); novice.growth.tier.gun = 1; novice.growth.styleMastery.pistol = 100;
    expect(checkAll(novice, TURNING_BY_ID.disciple_meeting.when)).toBe(false);
  });
  it('같은 장면에 올 수 있는 제자가 여럿이어도 각자의 출항과 재회 결과를 섞지 않는다', () => {
    const s = life(); choose(s, 'disciple_meeting'); s.age = 32; choose(s, 'disciple_meeting');
    s.age = 33; choose(s, 'disciple_training'); s.age = 35; choose(s, 'disciple_training');
    choose(s, 'late_disciple_sails'); s.age = 37; choose(s, 'late_disciple_sails');
    s.age = 55; s.hero.standing = 'retired';
    const names = s.disciples!.map(d => s.people.find(p => p.id === d.personId)!.name);
    const first = choose(s, 'late_r_student_pirate', 2);
    expect(first?.kind === 'door' && first.speaker).toBe(names[0]);
    expect(s.disciples![0].outcome).toBe('reported'); expect(s.disciples![1].outcome).toBeUndefined();
    s.age = 56;
    const second = choose(s, 'late_r_student_pirate', 0);
    expect(second?.kind === 'door' && second.speaker).toBe(names[1]);
    expect(s.disciples!.map(d => d.outcome)).toEqual(['reported', 'duel']);
    expect(s.people.find(p => p.name === names[0])!.kind).toBe('enemy');
    expect(s.people.find(p => p.name === names[1])!.kind).toBe('rival');
    expect(s.log.filter(l => l.text.includes('공방 끝에')).at(-1)?.text).toContain(names[1]);
  });
  it('실제 몇 해의 수련과 출항을 거쳐 같은 이름의 제자가 돌아온다', () => {
    const s = life(); choose(s, 'disciple_meeting');
    const d = s.disciples![0], p = s.people.find(p => p.id === d.personId)!;
    s.age = 32; expect(checkAll(s, TURNING_BY_ID.disciple_training.when)).toBe(false);
    s.age = 33; const training = choose(s, 'disciple_training');
    expect(training?.kind === 'door' && training.body).toContain(p.name);
    expect(checkAll(s, TURNING_BY_ID.late_disciple_sails.when)).toBe(false);
    s.age = 35; choose(s, 'late_disciple_sails');
    s.hero.standing = 'retired'; s.age = 55;
    s.growth.path = 'fist'; s.growth.primaryStyle = 'boxing';
    const count = s.people.length;
    const reunion = choose(s, 'late_r_student_pirate', 1);
    expect(reunion?.kind).toBe('door');
    if (reunion?.kind === 'door') {
      expect(reunion.speaker).toBe(p.name);
      expect(reunion.body).toContain(p.name); expect(reunion.body).toContain('권총 사격');
      expect(reunion.body).toContain('25년'); expect(reunion.body).toContain('20년');
      expect(reunion.body).toContain('권법'); expect(reunion.body).not.toContain('칼');
    }
    expect(s.people).toHaveLength(count);
    expect(s.disciples![0].outcome).toBe('reconciled');
    expect(checkAll(s, TURNING_BY_ID.late_r_student_pirate.when)).toBe(false);
    expect(s.log.some(l => l.text.includes(p.name) && l.text.includes('권총 사격'))).toBe(true);
  });
  it('떠난 지 8년이 안 됐거나 죽은 제자는 재회하지 않는다', () => {
    const s = life(); choose(s, 'disciple_meeting'); s.age = 33; choose(s, 'disciple_training');
    s.age = 55; choose(s, 'late_disciple_sails'); s.hero.standing = 'retired';
    s.age = 62; expect(checkAll(s, TURNING_BY_ID.late_r_student_pirate.when)).toBe(false);
    s.age = 63; expect(checkAll(s, TURNING_BY_ID.late_r_student_pirate.when)).toBe(true);
    s.people.find(p => p.id === s.disciples![0].personId)!.alive = false;
    expect(checkAll(s, TURNING_BY_ID.late_r_student_pirate.when)).toBe(false);
  });
  it('한 제자의 출항을 오래 미뤄도 다른 제자의 출항까지 영구히 닫지 않는다', () => {
    const s = life(); choose(s, 'disciple_meeting'); s.age = 33; choose(s, 'disciple_training');
    for (s.age = 35; s.age < 60; s.age++) {
      choose(s, 'late_disciple_sails', 1);
      expect(s.disciples![0].sailedAt).toBeUndefined();
      expect(checkAll(s, TURNING_BY_ID.late_disciple_sails.when)).toBe(false);
    }
    choose(s, 'late_disciple_sails'); expect(s.disciples![0].sailedAt).toBe(60);
  });
  it('기존 저장의 근거 없는 재회 창을 닫고, 새 사제 기록은 저장 후에도 유지한다', () => {
    const s = life(); s.age = 60; s.hero.standing = 'retired';
    s.pending = {kind:'door', turning:'late_r_student_pirate', moment:false, title:'제자의 칼끝', body:'젊은 날 칼을 가르친 아이', speaker:'옛 제자', doors:[]};
    expect(normalizeLife5(JSON.parse(JSON.stringify(s)))?.pending).toBeNull();
    const n = life(); choose(n, 'disciple_meeting');
    expect(normalizeLife5(JSON.parse(JSON.stringify(n)))?.disciples).toEqual(n.disciples);
  });
});
