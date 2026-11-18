// tests/v5/deathmatch.test.ts — 빈사가 되면 목숨을 건 싸움으로 바뀌고 물러날 수 없다. 물러나기는 주사위로 판정한다
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { askFight, heroUnit5 } from '../../src/v5/core/fight';
import { retreatChance, rollDice, runBattle, startBattle } from '../../src/core/combat/engine';
import { enemyUnit } from '../../src/core/combat/units';
import { makeEnemy } from '../../src/data/bosses';
import { B } from '../../src/data/balance';
import { rngOf } from '../../src/core/rng';
import { FOES } from '../../src/v5/data/foes';
import type { Life5 } from '../../src/v5/core/types';

function hero(seed: number) {
  const s = newLife5(seed); s.pending = null; s.age = 22; s.hero.standing = 'pirate'; s.vows!.declined = true;
  for (const k of Object.keys(s.hero.base) as (keyof typeof s.hero.base)[]) s.hero.base[k] = 40;
  return s;
}

describe('목숨을 건 싸움으로의 전환', () => {
  it('누구라도 빈사(빨간 체력)가 되면 경고 사건이 한 번 남고, 그 뒤에는 물러나기를 시도하지 않는다', () => {
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = hero(seed);
      const u = heroUnit5(s); u.retreatAt = 0.9;   // 웬만하면 물러나려는 주인공
      const foe = enemyUnit(makeEnemy({ id: 'minor', name: '불량배', p: 300 }), true, 0);
      const b = runBattle(startBattle([u, foe], { 0: 1 }, seed, false), true);
      const i = b.events.findIndex((e) => e.k === 'deathmatch');
      expect(b.events.filter((e) => e.k === 'deathmatch').length).toBeLessThanOrEqual(1);
      if (i < 0) continue;
      seen++;
      expect(b.deathmatch).toBe(true);
      expect(b.events.slice(i).some((e) => e.k === 'retreat')).toBe(false);
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('전투 중 물러나기에는 주사위 값이 남고, 성공 여부는 주사위가 정한다', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = hero(seed);
      const u = heroUnit5(s); u.retreatAt = 0.95;
      const foe = enemyUnit(makeEnemy({ id: 'minor', name: '불량배', p: 300 }), true, 0);
      const b = runBattle(startBattle([u, foe], { 0: 1 }, seed, false), true);
      for (const e of b.events) if (e.k === 'retreat') expect(e.ok).toBe(e.roll! <= e.need!);
    }
  });
  it('연막이 있어도 물러나기가 반드시 성공하지는 않는다', () => {
    expect(retreatChance(1, 1000, true)).toBeLessThan(1);
    expect(retreatChance(1000, 1, true)).toBeLessThanOrEqual(B.combat.retreat.max);
    expect(retreatChance(1, 1000)).toBeGreaterThanOrEqual(B.combat.retreat.min);
  });
  it('주사위는 1~100을 굴려 확률 × 100 이하이면 성공이다', () => {
    const r = rngOf({ seed: 7, cursor: 0 });
    for (let i = 0; i < 200; i++) {
      const d = rollDice(r, 0.4);
      expect(d.roll).toBeGreaterThanOrEqual(1); expect(d.roll).toBeLessThanOrEqual(100);
      expect(d.need).toBe(40); expect(d.ok).toBe(d.roll <= 40);
    }
  });
  it('이름 있는 상대와의 싸움도 빈사를 거치면 전환 표시가 남는다', () => {
    const id = Object.keys(FOES)[0];
    let switched = 0;
    for (let seed = 1; seed <= 30 && !switched; seed++) {
      const s: Life5 = hero(seed);
      askFight(s, id, false, true);
      const p = s.pending as Extract<Life5['pending'], { kind: 'battle' }>;
      if (p.battle.deathmatch) switched++;
    }
    expect(switched).toBeGreaterThan(0);
  });
});
