import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { ownedHullId } from '../../src/core/ship-memory';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { profileView } from '../../src/ui/view/profile';
import { rngOf } from '../../src/shared/core/rng';

const scene = (id: string) => TURNING_BY_ID[id];
function owner() {
  const s = newLife5(71);
  s.age = 20;
  s.hero.standing = 'pirate';
  s.hero.island = '시럽 마을';
  s.hero.money = 500000;
  s.pending = null;
  return s;
}
function choose(s: Life5, id: string, i: number) {
  const t = scene(id);
  expect(checkAll(s, t.when), id).toBe(true);
  expect(openTurning(s, t), id).toBe(true);
  answerDoor(s, i);
}
function caredFor() {
  const s = owner();
  applyFx(s, [{ op: 'flag', id: 'ship' }]);
  choose(s, 'ship_nameboard', 1);
  choose(s, 'ship_patchwork', 0);
  s.age = 22;
  s.hero.island = '로그타운';
  choose(s, 'ship_patchwork', 1);
  s.age = 24;
  s.hero.island = '워터 세븐';
  choose(s, 'ship_patchwork', 0);
  return s;
}

describe('각 선체에 남은 이름과 수리 자국', () => {
  it('남의 배에서는 시작하지 않고, 옛 저장의 소유 표시에 과거를 지어 붙이지 않는다', () => {
    const s = owner();
    expect(ownedHullId(s)).toBeUndefined();
    expect(checkAll(s, scene('ship_nameboard').when)).toBe(false);
    s.flags.push('ship');
    const old = normalizeLife5(s)!;
    const id = ownedHullId(old);
    expect(id).toBeDefined();
    expect(old.ships).toBeUndefined();
    expect(checkAll(old, scene('ship_farewell').when)).toBe(false);
    choose(old, 'ship_nameboard', 0);
    expect(ownedHullId(old)).toBe(id);
    expect(old.ships?.[0].acquiredAt).toBeUndefined();
    expect(old.ships?.[0].repairs).toEqual([]);
  });

  it('고른 수리만 당시 나이와 항구로 저장하고 같은 배의 이름과 자국을 불러온다', () => {
    const s = caredFor();
    const originalId = ownedHullId(s);
    expect(s.ships?.[0].repairs.map(r => [r.age, r.island])).toEqual([[20, '시럽 마을'], [22, '로그타운'], [24, '워터 세븐']]);
    const old = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    applyFx(old, [{ op: 'flag', id: 'ship' }]);
    expect(ownedHullId(old)).toBe(originalId);
    expect(openTurning(old, scene('ship_farewell'))).toBe(true);
    expect(old.pending?.kind === 'door' && old.pending.body).toContain('워터 세븐');
    answerDoor(old, 0);
    expect(ownedHullId(old)).not.toBe(originalId);
    expect(old.ships?.[1]).toMatchObject({ helmFrom: originalId, repairs: [], acquiredAt: 24 });
    expect(profileView(old).shipHistory[0].lines.join(' ')).toContain('시럽 마을');
    expect(profileView(old).shipHistory[1].lines.join(' ')).toContain('키');
    expect(checkAll(old, scene('ship_farewell').when)).toBe(false);
  });

  it('그대로 타는 선택은 선체를 지키고, 아이들에게 넘긴 배는 소유권과 함께 떠난다', () => {
    const s = caredFor(), kids = structuredClone(s);
    const id = ownedHullId(s);
    choose(s, 'ship_farewell', 2);
    expect(ownedHullId(s)).toBe(id);
    expect(s.ships?.[0].spiritAt).toBeUndefined();
    choose(kids, 'ship_farewell', 1);
    expect(ownedHullId(kids)).toBeUndefined();
    expect(kids.ships?.[0].end).toMatchObject({ kind: 'playground', island: '워터 세븐' });
    applyFx(kids, [{ op: 'flag', id: 'ship' }]);
    expect(ownedHullId(kids)).not.toBe(id);
    expect(kids.ships?.at(-1)?.repairs).toEqual([]);
  });

  it('못이 걸리던 배를 여러 해 직접 손질한 뒤 작별할 때만 갑판에서 망치가 울린다', () => {
    const base = caredFor();
    let heard = 0;
    for (let seed = 0; seed < 100; seed++) {
      const s = structuredClone(base);
      s.rng = { seed, cursor: 0 };
      const singleYear = structuredClone(s), noNail = structuredClone(s);
      singleYear.ships![0].repairs.forEach(mark => { mark.age = 20; });
      noNail.ships![0].repairs.forEach(mark => { mark.kind = 'helm'; });
      for (const other of [singleYear, noNail]) {
        choose(other, 'ship_farewell', 1);
        expect(other.ships?.[0].spiritAt).toBeUndefined();
      }
      choose(s, 'ship_farewell', 1);
      if (s.ships?.[0].spiritAt !== undefined) {
        heard++;
        expect(s.log.some(l => l.text.includes('발가락') && l.text.includes('구리못'))).toBe(true);
      }
    }
    expect(heard).toBeGreaterThan(0);
    expect(heard).toBeLessThan(35);
  });

  it('배를 빼앗기거나 주인 잃은 범선으로 옮기면 전에 타던 선체 자국을 끌고 가지 않는다', () => {
    const s = caredFor();
    applyFx(s, [{ op: 'unflag', id: 'ship' }]);
    expect(ownedHullId(s)).toBeUndefined();
    expect(s.ships![0].end?.kind).toBe('lost');
    applyFx(s, [{ op: 'flag', id: 'ship' }]);
    const second = ownedHullId(s);
    applyFx(s, TURNING_BY_ID.path_got_ship.doors[0].fx);
    expect(ownedHullId(s)).not.toBe(second);
    expect(s.ships!.at(-1)?.repairs).toEqual([]);
  });

  it('같은 배에 당직 몫을 둔 경우에만 작별할 때 그릇 자국이 보인다', () => {
    const s = caredFor();
    const fresh = structuredClone(s);
    const cupboard = (life: Life5) => {
      expect(openTurning(life, scene('ship_farewell'))).toBe(true);
      return life.pending?.kind === 'door' && life.pending.body.includes('뚜껑 덮은 접시');
    };
    expect(cupboard(fresh)).toBe(false);
    applyFx(s, [{ op: 'person', name: '카야', kind: 'crew', relation: '뱃사람' }]);
    choose(s, 'aboard_last_fish', 0);
    s.age++;
    choose(s, 'aboard_covered_plate', 0);
    expect(cupboard(s)).toBe(true);
    answerDoor(s, 0);
    expect(openTurning(s, scene('ship_patchwork'))).toBe(false);
    choose(s, 'pirate_doctor', 0);
    s.age += 4;
    expect(cupboard(s)).toBe(false);
  });

  it('하늘섬 물기둥에서 난파한 배는 저장을 다시 열어도 현재의 배가 되지 않는다', () => {
    const s = caredFor();
    s.hero.hp = 40;
    s.hero.base.int = 1;
    let wreckSeed = 0;
    while (rngOf({ seed: wreckSeed, cursor: 0 })() >= 0.03) wreckSeed++;
    s.rng = { seed: wreckSeed, cursor: 0 };
    applyFx(s, [{ op: 'move', island: '스카이피아', sea: 'gl_first' }]);
    answerDoor(s, 0);
    expect(s.ships?.at(-1)?.end?.kind).toBe('lost');
    expect(ownedHullId(normalizeLife5(s)!)).toBeUndefined();
  });

  it('선의를 맞은 선택만 약장을 낮추며 깨진 선체 기록은 불러오지 않는다', () => {
    const s = owner();
    applyFx(s, [{ op: 'flag', id: 'ship' }]);
    const other = structuredClone(s);
    choose(other, 'pirate_doctor', 1);
    expect(other.ships![0].repairs).toEqual([]);
    choose(s, 'pirate_doctor', 0);
    expect(s.ships![0].repairs[0]).toMatchObject({ kind: 'medicine', island: '시럽 마을' });
    s.ships![0].repairs[0].age = s.age + 1;
    expect(normalizeLife5(s)).toBeNull();
  });
});
