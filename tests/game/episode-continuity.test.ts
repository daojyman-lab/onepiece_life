import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { applyFx, fillText } from '../../src/core/fx';
import { recordLifeEvent } from '../../src/core/life-story';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning } from '../../src/core/turning';
import { repairEpisodeContacts } from '../../src/data/episodes/contacts';
import { LINES } from '../../src/data/lines';
import { MINORS } from '../../src/data/minors';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { Life5 } from '../../src/core/types';

function choose(s: Life5, turning: string, door: number) {
  expect(openTurning(s, TURNING_BY_ID[turning]), turning).toBe(true);
  expect(s.pending?.kind === 'door' && !s.pending.doors[door].locked, turning).toBe(true);
  answerDoor(s, door);
}

describe('장편의 실제 인물과 선택', () => {
  it('축제 편지는 이 생에서 장학 시험 대신 북을 친 동무에게만 온다', () => {
    const s = newLife5(11, { home: 'loguetown' });
    s.siblingBirths = [];
    const line = LINES.find(l => l.text.includes('{person:축제를 함께한 동무}'))!;
    s.pending = null;
    s.age = 12;
    choose(s, 'kid_scholarship', 1);
    const friend = s.people.find(p => p.relation === '축제를 함께한 동무')!;
    s.age = 49;
    expect(checkAll(s, line.when)).toBe(true);
    expect(fillText(s, line.text)).toContain(friend.name);
    const save = normalizeLife5(structuredClone(s))!;
    save.tried = [];
    save.known.push('kid_scholarship#1');
    expect(checkAll(save, line.when)).toBe(false);
    friend.alive = false;
    expect(checkAll(s, line.when)).toBe(false);
  });

  it('은퇴한 사람이 만나는 이는 실제로 배를 만들던 동무다', () => {
    const s = newLife5(12, { home: 'loguetown' });
    const visit = MINORS.find(m => m.id === 'm_retired_old_friend')!;
    s.hero.standing = 'retired'; s.age = 50;
    expect(checkAll(s, visit.when)).toBe(false);
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '어릴 적 동무', name: '미루' }]);
    expect(checkAll(s, visit.when)).toBe(false);
    s.seenCount.kid_ship_friend = 1;
    expect(checkAll(s, visit.when)).toBe(false);
    s.tried.push('kid_ship_friend#2');
    expect(checkAll(s, visit.when)).toBe(true);
    for (const outcome of visit.outcomes) for (const text of outcome.text) {
      expect(fillText(s, text)).toContain('미루');
    }
    s.people.at(-1)!.kind = 'rival';
    expect(checkAll(s, visit.when)).toBe(false);
  });

  it('나디르와 수레를 따른 뒤 같은 인물이 배에 오르고, 옛 어인 짐꾼의 이름도 복구한다', () => {
    const s = newLife5(11);
    s.pending = null; s.age = 16; s.hero.island = '알라바스타 왕국';
    choose(s, 'ep_alabasta_p3', 0);
    const nadir = s.people.find(p => p.name === '나디르')!;
    s.flags.push('ep_alabasta_safiya_trust');
    choose(s, 'ep_alabasta_p11', 1);
    expect(s.people.filter(p => p.name === '나디르')).toEqual([nadir]);
    expect(nadir.crew).toBeDefined();
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '어인섬에서 함께 떠난 문어 어인 짐꾼', name: '옛 무작위 이름', years: 2 }]);
    const peron = s.people.at(-1)!;
    const before = structuredClone(peron);
    peron.alive = false;
    repairEpisodeContacts(s);
    expect(peron).toMatchObject({ name: '페론', species: 'fishman', alive: false, id: before.id, age: before.age, crew: before.crew, tempUntil: before.tempUntil });
  });

  it('엘모의 수련에 붙었던 기본 교사만 바로잡고, 별개로 택한 노검객은 남긴다', () => {
    const s = newLife5(11, { home: 'loguetown' });
    s.age = 11;
    applyFx(s, [{ op: 'beginStyle', style: 'oneSword' }]);
    recordLifeEvent(s, 'trained_guard');
    const separate = structuredClone(s);
    separate.tried.push('style_meet_oneSword#0');
    const teacherId = s.growth.styleBonds.oneSword!.teacherId;
    repairEpisodeContacts(s);
    repairEpisodeContacts(s);
    expect(s.people.find(p => p.id === teacherId)).toMatchObject({ name: '엘모', aliases: ['일도류의 인연'] });
    expect(s.lifeStory!.events[0].actorId).toBe(teacherId);
    repairEpisodeContacts(separate);
    expect(separate.people.find(p => p.id === teacherId)?.name).toBe('칼집을 고치는 노검객');
  });
});
