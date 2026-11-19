import { describe, expect, it } from 'vitest';
import { normalizeLife5 } from '../../src/core/load';
import { apply5, reduce5 } from '../../src/core/reduce';
import { newLife5 } from '../../src/core/state';
import { openTurning } from '../../src/core/turning';
import { deliverEdition, publishIssue } from '../../src/core/world-news';
import { reportBountyChange } from '../../src/core/first-poster';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { hasWorldEvent, WORLD_HISTORY, worldTick } from '../../src/data/world-history';
import type { Life5 } from '../../src/core/types';
import { profileView } from '../../src/ui/view/profile';

function at(age: number, part: Life5['part']) {
  const s = newLife5(3);
  s.pending = null;
  s.age = age;
  s.part = part;
  s.hero.standing = 'civil';
  s.hero.island = '로그타운';
  return s;
}

describe('뉴스 쿠와 원작 연혁', () => {
  it('실제 진행 명령으로 발행하며 원격 보도를 개인의 목격이나 만남으로 적지 않는다', () => {
    const before = at(19, 1);
    const contacts = before.people.map(p => p.id);
    const prior = reduce5(before, { type: 'step' });
    expect(prior.news?.some(n => n.id === 'marineford')).toBe(false);
    expect(before.news).toHaveLength(1);
    const s = at(19, 2);
    apply5(s, { type: 'step' });
    const edition = s.news?.find(n => n.id === 'marineford');
    expect(edition).toMatchObject({ age: 19, part: 2, kind: 'big', title: expect.stringContaining('종전') });
    expect(s.log.find(l => l.id === edition?.logId)?.text).toContain('뉴스 쿠');
    expect(s.timeline.some(line => line.canon === 'whitebeard')).toBe(false);
    expect(s.people.map(p => p.id)).toEqual(contacts);
  });

  it('같은 해에도 사건이 순서대로 발행되고 전성기와 재개로 재발행되지 않는다', () => {
    const s = at(21, 0);
    for (const part of [0, 1, 2, 3] as const) {
      s.part = part;
      deliverEdition(s);
    }
    const expected = ['birth-edition', 'fishmanPact', 'dressrosaFree', 'wholeCake'];
    expect(s.news?.map(n => n.id)).toEqual(expected);
    s.prime = { from: 19, until: 23, lap: true };
    s.part = 0;
    const restored = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(hasWorldEvent(restored, 'wholeCake')).toBe(true);
    deliverEdition(restored);
    expect(restored.news?.map(n => n.id)).toEqual(expected);
    const dates = Object.values(WORLD_HISTORY).map(worldTick);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('처음 및 최고액을 갱신한 수배서만 발행하고 그때의 금액과 가족 반응을 보존한다', () => {
    const s = at(18, 1);
    s.hero.standing = 'pirate';
    s.hero.fame = 2;
    reportBountyChange(s, 0, 'pirate');
    s.hero.fame = 4;
    reportBountyChange(s, 2000000, 'pirate');
    s.hero.fame = 2;
    reportBountyChange(s, 4000000, 'pirate');
    s.hero.fame = 4;
    reportBountyChange(s, 2000000, 'pirate');
    const restored = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(restored.news?.filter(n => n.kind === 'bounty').map(n => n.amount)).toEqual([2000000, 4000000]);
    expect(restored.timeline.filter(row => row.text.startsWith('첫 현상금'))).toHaveLength(1);
  });

  it('옛 저장에서 원작의 사망과 제도 폐지를 반영하고 오래된 기사를 새 호외로 쏟지 않는다', () => {
    const s = at(28, 0);
    s.hero.standing = 'warlord';
    s.hero.fame = 40;
    s.people.push({ id: 'old-ace', canon: 'ace', name: '에이스', age: 30, gender: 'm', kind: 'ally', relation: '함께 밥을 먹었다', faction: 'pirate', bond: 45, alive: true, species: 'human' });
    delete s.news;
    delete s.pressTick;
    delete s.publishedBounty;
    const restored = normalizeLife5(s)!;
    expect(restored.hero.standing).toBe('pirate');
    expect(restored.people.find(p => p.canon === 'ace')).toMatchObject({ alive: false, relation: '함께 밥을 먹었다' });
    expect(restored.publishedBounty).toBe(40000000);
    deliverEdition(restored);
    expect(restored.news?.map(i => i.id)).toEqual(['port:28']);
    expect(restored.timeline.filter(line => line.text.includes('공인장'))).toHaveLength(1);
    expect(normalizeLife5(restored)?.timeline).toEqual(restored.timeline);
  });

  it('칠무해 임명부터 제도 폐지까지 종전 금액, 임명 기사와 수배 재개가 이어진다', () => {
    const s = at(20, 0);
    s.hero.standing = 'pirate';
    s.standingSince = 16;
    s.hero.fame = 300;
    reportBountyChange(s, 0, 'pirate');
    expect(openTurning(s, TURNING_BY_ID.path_warlord)).toBe(true);
    apply5(s, { type: 'answer', index: 0 });
    expect(s.news?.at(-1)).toMatchObject({ kind: 'world', title: expect.stringContaining('칠무해 임명') });
    expect(profileView(s).fame).toBe('수배 정지 · 종전 현상금 300,000,000 베리');
    const restored = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    restored.age = 22;
    restored.part = 0;
    apply5(restored, { type: 'step' });
    expect(restored.hero.standing).toBe('pirate');
    expect(restored.news?.some(i => i.id === 'reverie')).toBe(true);
    expect(restored.news?.at(-1)).toMatchObject({ kind: 'bounty', title: expect.stringContaining('수배 재개'), amount: 400000000 });
    expect(restored.timeline.filter(row => row.text.startsWith('첫 현상금'))).toHaveLength(1);
  });

  it('크로스 길드 호외가 나온 뒤 실제 항구에서 제보해야 지역 단신이 실린다', () => {
    const s = at(22, 3);
    const scene = TURNING_BY_ID.cross_guild_dock_poster;
    expect(openTurning(s, scene)).toBe(false);
    s.age = 23;
    s.part = 0;
    deliverEdition(s);
    expect(s.news?.at(-1)?.id).toBe('crossGuild');
    expect(openTurning(s, scene)).toBe(true);
    const money = s.hero.money;
    apply5(s, { type: 'answer', index: 2 });
    expect(s.hero.money).toBe(money + 1000);
    expect(s.news?.at(-1)).toMatchObject({ id: 'local:cross_guild_dock_poster#2', kind: 'local' });
  });

  it('분기 직전 열어 둔 현장은 복원되고, 종전 뒤에는 같은 현장을 새로 열 수 없다', () => {
    const s = at(19, 1);
    s.hero.sea = 'gl_first';
    s.hero.standing = 'pirate';
    expect(openTurning(s, TURNING_BY_ID.cn_whitebeard_war)).toBe(true);
    s.part = 2;
    const restored = normalizeLife5(s)!;
    expect(restored.pending).toMatchObject({ kind: 'door', turning: 'cn_whitebeard_war' });
    restored.pending = null;
    expect(openTurning(restored, TURNING_BY_ID.cn_whitebeard_war)).toBe(false);
  });

  it('선택한 지역 사건의 결과만 보도하고 신문철은 최근 여든 건을 보관한다', () => {
    const s = at(17, 0);
    s.hero.island = '알라바스타 왕국';
    s.flags.push('ep_alabasta_p_deal');
    expect(openTurning(s, TURNING_BY_ID.ep_alabasta_p10)).toBe(true);
    apply5(s, { type: 'answer', index: 1 });
    expect(s.news?.at(-1)).toMatchObject({ id: 'local:ep_alabasta_p10#1', kind: 'local', title: expect.stringContaining('유료') });
    expect(s.news?.some(n => n.title.includes('왕궁 조사'))).toBe(false);
    for (let i = 0; i < 81; i++) publishIssue(s, { id: 'test-' + i, kind: 'local', title: '단신', body: '항구에서 온 소식.' });
    expect(s.news).toHaveLength(80);
    expect(normalizeLife5(s)?.news?.[0].id).toBe('test-1');
  });
});
