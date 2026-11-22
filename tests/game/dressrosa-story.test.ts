import { describe, expect, it } from 'vitest';
import { nextTick, windowReady } from '../../src/app/flow';
import { ackBattle } from '../../src/core/fight';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openQueued, openTurning } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';

function atScene(part: string, fame = 0) {
  const s = newLife5(64);
  s.age = 21;
  s.pending = null;
  s.queue = [];
  Object.assign(s.hero, { island: '드레스로자', sea: 'nw_first', standing: 'pirate', fame });
  s.flags.push('ep_dressrosa_b_tropo_trust');
  expect(openTurning(s, TURNING_BY_ID['ep_dressrosa_' + part])).toBe(true);
  return s;
}

describe('드레스로자 〈자루 속 사람〉', () => {
  it('장면을 선택하기 전에 다음 로그 한 줄부터 띄운다', () => {
    const s = atScene('b1');
    const lines = s.log.filter((line) => line.text.includes('콜로세움') || line.text.includes('꽃바구니'));
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(nextTick({
      life: s, shownId: lines[0].id - 1, screen: 'main', speed: 1,
      modalOpen: false, reading: false, hidden: false,
    })).toMatchObject({ do: 'reveal', id: lines[0].id });
    expect(windowReady(s, lines[0].id, 1000, 1)).toBe(false);
    expect(windowReady(s, s.log.at(-1)!.id, 1000, 1)).toBe(true);
  });

  it('거래를 거절한 뒤 광장에서 시간을 보내고 대회 전날 준비로 돌아간다', () => {
    const s = atScene('b6', 150);
    expect(s.pending).toMatchObject({ kind: 'door', body: expect.stringContaining('거래하지') });
    const { age, part } = s;
    answerDoor(s, 0);
    expect(openQueued(s)).toBe(true);
    expect(s.pending).toMatchObject({ turning: 'ep_dressrosa_b_afternoon' });
    answerDoor(s, 1);
    expect(openQueued(s)).toBe(true);
    expect(s.pending).toMatchObject({ turning: 'ep_dressrosa_b7' });
    expect(s).toMatchObject({ age, part });
  });

  it.each([0, 1])('첫 골목에서 구조를 시도하는 문 %s는 운반책 전투로 이어진다', (door) => {
    const s = atScene('b1');
    answerDoor(s, door);
    expect(s.pending).toMatchObject({ kind: 'battle', foe: { name: '토포' } });
    ackBattle(s);
    expect(openQueued(s)).toBe(true);
    expect(s.pending).toMatchObject({ kind: 'door', turning: 'ep_dressrosa_b2' });
    expect(s.log.some((line) => line.text.includes('선장 그리지오'))).toBe(true);
  });

  it.each(['win', 'lose'] as const)('이름이 알려지지 않으면 그리지오가 기습하고 %s 뒤에도 수색이 이어진다', (result) => {
    const s = atScene('b6', 149);
    if (s.pending?.kind !== 'battle') throw new Error('그리지오가 먼저 싸움을 걸지 않았다');
    expect(s.pending.foe.name).toBe('그리지오');
    expect(s.log.some((line) => line.text.includes('이름도 못 들어 본'))).toBe(true);
    s.pending.result = result;
    ackBattle(s);
    expect(openQueued(s)).toBe(true);
    expect(s.pending).toMatchObject({ kind: 'door', turning: 'ep_dressrosa_b_afternoon' });
    expect(s.seenCount.ep_dressrosa_b6).toBe(1);
  });

  it.each(['win', 'lose'] as const)('레오와의 대련을 저장한 뒤 %s 결과로도 구조를 이어 간다', (result) => {
    const s = atScene('b4k');
    answerDoor(s, 1);
    expect(s.pending).toMatchObject({ kind: 'battle', foe: { name: '레오', spar: true } });
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)));
    if (loaded?.pending?.kind !== 'battle') throw new Error('대련을 복원하지 못했다');
    loaded.pending.result = result;
    const { hp, injuries, limbs, fame } = structuredClone(loaded.hero);
    const stats = structuredClone(loaded.stats);
    ackBattle(loaded);
    expect(loaded.hero).toMatchObject({ hp, injuries, limbs, fame });
    expect(loaded.stats).toEqual(stats);
    expect(loaded.log.some((line) => line.text.includes('대련에서'))).toBe(true);
    expect(openQueued(loaded)).toBe(true);
    expect(loaded.pending).toMatchObject({ turning: 'ep_dressrosa_b5' });
  });
});
