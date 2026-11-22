// tests/game/shipmates.test.ts
// 남의 해적선에 말단 선원으로 오르면 선장과 선배 선원 여럿이 한꺼번에 생기고, 장면에는 주인공이 줄 끝에 선다.
import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/data/turnings';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { sceneOf } from '../../src/ui/view/profile';
import { SHIP_CAPTAIN, SHIPMATE, SHIPMATE_FOLLOWED } from '../../src/data/shipmates';
import type { Fx, Life5 } from '../../src/core/types';

const door = (id: string, i: number): Fx[] => TURNINGS.find((t) => t.id === id)!.doors[i].fx;
const shipmates = (s: Life5) => s.people.filter((p) => p.alive && p.kind === 'crew' && p.relation.startsWith(SHIPMATE));
const captain = (s: Life5) => s.people.find((p) => p.alive && p.kind === 'ally' && p.relation === SHIP_CAPTAIN);

function deckhand(): Life5 {
  const s = newLife5(7);
  s.age = 17;
  applyFx(s, door('path_pirate_taken', 0));
  return s;
}

describe('말단 선원', () => {
  it('해적선에 끌려가면 선장과 선배 선원 셋이 함께 생긴다', () => {
    const s = deckhand();
    expect(s.hero.standing).toBe('pirate');
    expect(s.flags.includes('captain')).toBe(false);
    expect(captain(s)?.faction).toBe('pirate');
    expect(shipmates(s)).toHaveLength(3);
    for (const p of shipmates(s)) expect(p.age).toBeGreaterThan(s.age);
  });
  it('견습으로 오를 때와 짐칸에 숨어 탈 때도 같다', () => {
    for (const [id, i] of [['path_pirate_sail', 1], ['pirate_stowaway', 0]] as const) {
      const s = newLife5(3); s.age = 20;
      applyFx(s, door(id, i));
      expect(captain(s), id).toBeTruthy();
      expect(shipmates(s).length, id).toBe(3);
    }
  });
  it('장면에는 선장이 앞에 서고 선배 선원들이 함께 그려진다', () => {
    const sc = sceneOf(deckhand(), true);
    expect(sc.captain).toBeTruthy();
    expect(sc.crew.length).toBe(3);
  });
  it('선장의 배를 물려받으면 선배 선원들이 새 선장을 따른다', () => {
    const s = deckhand();
    applyFx(s, door('pirate_captain_will', 0));
    expect(s.flags.includes('captain')).toBe(true);
    expect(shipmates(s)).toHaveLength(0);
    expect(s.people.filter((p) => p.alive && p.kind === 'crew' && p.relation.startsWith(SHIPMATE_FOLLOWED))).toHaveLength(3);
    expect(sceneOf(s, true).captain).toBeNull();
  });
  it('반란으로 배를 빼앗아도 선원들이 따르고, 옛 선장은 적이 된다', () => {
    const s = deckhand();
    const mutiny = door('pirate_mutiny', 0)[0] as Extract<Fx, { op: 'chance' }>;
    applyFx(s, mutiny.then);
    expect(captain(s)).toBeUndefined();
    expect(s.people.some((p) => p.kind === 'enemy' && p.relation === '반란으로 쫓아낸 옛 선장')).toBe(true);
    expect(s.people.filter((p) => p.alive && p.kind === 'crew' && p.relation.startsWith(SHIPMATE_FOLLOWED))).toHaveLength(3);
  });
  it('제 배를 따로 얻거나 해적을 그만두면 선배 선원들은 그 배에 남는다', () => {
    const own = deckhand();
    applyFx(own, door('pirate_steal_ship', 1));
    expect(own.flags.includes('captain')).toBe(true);
    expect(own.people.filter((p) => p.alive && p.kind === 'crew')).toHaveLength(0);
    expect(own.people.filter((p) => p.relation.startsWith('옛 배의 '))).toHaveLength(3);

    const quit = deckhand();
    applyFx(quit, [{ op: 'standing', to: 'civil' }]);
    expect(quit.people.filter((p) => p.alive && p.kind === 'crew')).toHaveLength(0);
  });
  it('선원 투표에서 지면 갑판장이 새 선장이 되고 나머지는 남는다', () => {
    const s = deckhand();
    const vote = door('pirate_captain_will', 1)[1] as Extract<Fx, { op: 'chance' }>;
    applyFx(s, [door('pirate_captain_will', 1)[0], ...vote.else!]);
    expect(captain(s)).toBeTruthy();
    expect(shipmates(s)).toHaveLength(2);
    expect(sceneOf(s, true).captain).toBeTruthy();
  });
});
