import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openQueued, openTurning, resolveDoors } from '../../src/core/turning';
import type { Life5, SeaId } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { WORLD_HISTORY, type WorldEventId } from '../../src/data/world-history';

function resident(island: string, sea: SeaId, age: number, part: Life5['part']) {
  const s = newLife5(64);
  Object.assign(s, { age, part, pending: null });
  Object.assign(s.hero, { island, sea, standing: 'civil' });
  return s;
}

describe('항구의 세계사', () => {
  it.each<[string, SeaId, WorldEventId, string, string]>([
    ['알라바스타 왕국', 'gl_first', 'alabastaRain', 'ep_alabasta_w1', 'ep_alabasta_a1'],
    ['스카이피아', 'gl_first', 'skyBell', 'ep_skypiea_c1', 'ep_skypiea_a1'],
    ['드레스로자', 'nw_first', 'dressrosaFree', 'ep_dressrosa_b1', 'ep_dressrosa_c1'],
    ['와노쿠니', 'nw_late', 'wanoFree', 'ep_wano_raid_1', 'ep_wano_after_1'],
  ])('%s에서 사건이 일어난 토막에 복구 에피소드가 열린다', (island, sea, event, earlier, later) => {
    const { age, part } = WORLD_HISTORY[event];
    const s = resident(island, sea, part === 0 ? age - 1 : age, (part === 0 ? 3 : part - 1) as Life5['part']);
    expect(checkAll(s, TURNING_BY_ID[earlier].when)).toBe(true);
    expect(checkAll(s, TURNING_BY_ID[later].when)).toBe(false);
    Object.assign(s, { age, part });
    expect(checkAll(s, TURNING_BY_ID[earlier].when)).toBe(false);
    expect(checkAll(s, TURNING_BY_ID[later].when)).toBe(true);
  });

  it('가뭄이 오기 전 우물을 차지한 상단이 나타나지 않는다', () => {
    const s = resident('알라바스타 왕국', 'gl_first', 14, 2);
    expect(checkAll(s, TURNING_BY_ID.ep_alabasta_p1.when)).toBe(false);
    s.part = 3;
    expect(checkAll(s, TURNING_BY_ID.ep_alabasta_p1.when)).toBe(true);
  });

  it('나라가 바뀌어도 옛 저장에서 이미 시작한 장편은 다음 장면으로 간다', () => {
    const s = resident('드레스로자', 'nw_first', 21, 2);
    s.queue = ['ep_dressrosa_b2'];
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(openTurning(loaded, TURNING_BY_ID.ep_dressrosa_b1)).toBe(false);
    expect(openQueued(loaded)).toBe(true);
    expect(loaded.pending).toMatchObject({ turning: 'ep_dressrosa_b2' });
  });

  it('검은수염을 쫓는 에이스와 알라바스타의 식당에서 한동안 동행할 수 있다', () => {
    const s = resident('알라바스타 왕국', 'gl_first', 17, 2);
    s.hero.standing = 'pirate';
    const encounter = TURNING_BY_ID.tmp_ace;
    expect(checkAll(s, encounter.when)).toBe(true);
    expect(openTurning(s, encounter)).toBe(true);
    answerDoor(s, 0);
    expect(s.people.find(p => p.canon === 'ace')).toMatchObject({ kind: 'crew', crew: { level: 20 }, tempUntil: 18 });
    s.part = 3;
    expect(checkAll(s, encounter.when)).toBe(false);
  });

  it('사황의 보급선을 턴 선장에게는 칠무해 제도가 존속할 때만 정부 사자가 온다', () => {
    const s = resident('드레스로자', 'nw_first', 21, 1);
    s.hero.standing = 'pirate';
    s.standingSince = 17;
    s.flags.push('captain', 'ship');
    const abolished = structuredClone(s);
    abolished.age = 22;
    for (const captain of [s, abolished]) {
      expect(openTurning(captain, TURNING_BY_ID.path_raid)).toBe(true);
      answerDoor(captain, 2);
      expect(captain.hero.fame).toBeGreaterThanOrEqual(300);
    }
    expect(openQueued(s)).toBe(true);
    expect(s.pending).toMatchObject({ turning: 'path_warlord' });
    expect(openQueued(abolished)).toBe(false);
    expect(abolished.queue).not.toContain('path_warlord');
  });

  it('해방 전 간직한 문패의 탁본으로 해방 후 꽃시장의 가족을 찾는다', () => {
    const s = resident('드레스로자', 'nw_first', 11, 1);
    const before = TURNING_BY_ID.nw_dressrosa_tiles;
    const after = TURNING_BY_ID.nw_dressrosa_tile_home;
    expect(checkAll(s, before.when)).toBe(false);
    s.part = 2;
    expect(openTurning(s, before)).toBe(true);
    const paid = structuredClone(s);
    answerDoor(paid, 1);
    answerDoor(s, 0);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    for (const state of [paid, loaded]) Object.assign(state, { age: 21, part: 2 });
    expect(resolveDoors(paid, after)[0].locked).toBeTruthy();
    expect(openTurning(loaded, before)).toBe(false);
    expect(openTurning(loaded, after)).toBe(true);
    expect(loaded.pending).toMatchObject({ body: expect.stringContaining('꽃잎 다섯 장') });
    answerDoor(loaded, 0);
    expect(loaded.people).toContainEqual(expect.objectContaining({ name: '루사', kind: 'ally' }));
    expect(loaded.timeline.some(row => row.text.includes('문패를 루사에게'))).toBe(true);
  });
});
