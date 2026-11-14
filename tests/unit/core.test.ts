import { describe, expect, it } from 'vitest';
import { newLife } from '../../src/core/state';
import { reduce, invariants } from '../../src/core/reduce';
import { applyEffects } from '../../src/core/effects';
import { check } from '../../src/core/conditions';
import { intervene, startBattle, runBattle } from '../../src/core/combat/engine';
import { enemyUnit } from '../../src/core/combat/units';
import { makeEnemy } from '../../src/data/bosses';
import { B } from '../../src/data/balance';
import { autoplay } from '../../src/core/autoplay';
import { tick } from '../../src/core/sim/tick';
import { learn, monthlyGrowth, setFocus } from '../../src/core/growth/growth';
import type { LifeState } from '../../src/core/types';

/** 유년기를 건너뛰고 10세에서 시작한 인생 */
function grown(seed = 7): LifeState {
  let s = newLife(seed);
  while (s.pending?.kind === 'choice' && s.hero.age < 10) s = reduce(s, { type: 'answerChoice', index: 0 });
  return s;
}

describe('새 인생', () => {
  it('3세에 유년기 선택이 떠 있고, 답하면 10세가 된다', () => {
    const s0 = newLife(1);
    expect(s0.hero.age).toBe(3);
    expect(s0.pending?.kind).toBe('choice');
    const s = grown(1);
    expect(s.hero.age).toBe(10);
    expect(s.pending).toBeNull();
    expect(s.people.some((p) => p.kind === 'rival')).toBe(true);
  });
  it('같은 씨앗이면 같은 인생', () => {
    const a = autoplay(42, 'random', 3000).s;
    const b = autoplay(42, 'random', 3000).s;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('상태는 JSON으로 저장했다 되살려도 같다', () => {
    const s = grown(3);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('멈춤은 pending 하나로만', () => {
  it('pending이 있으면 tick이 무시된다', () => {
    const s = newLife(5);
    expect(s.pending).not.toBeNull();
    expect(reduce(s, { type: 'tick' })).toBe(s);
  });
  it('10세 첫 tick에서 입문 선택이 뜬다', () => {
    const s = reduce(grown(9), { type: 'tick' });
    expect(s.pending?.kind).toBe('choice');
    expect(s.pending && s.pending.kind === 'choice' && s.pending.choiceId).toBe('en_dojo');
  });
  it('답하면 pending이 반드시 끝난다', () => {
    let s = reduce(grown(9), { type: 'tick' });
    s = reduce(s, { type: 'answerChoice', index: 1 });
    expect(s.pending).toBeNull();
    expect(s.growth.focus).toBe('martial.sword');
    expect(s.growth.skills.sword_cut).toBeDefined();
  });
});

describe('조건과 효과', () => {
  it('효과 적용기', () => {
    const s = grown(11);
    const money = s.hero.money;
    applyEffects(s, [{ op: 'money', add: 500 }, { op: 'flag', id: 'x' }, { op: 'base', key: 'str', add: 3 }]);
    expect(s.hero.money).toBe(money + 500);
    expect(check(s, { c: 'flag', id: 'x', has: true })).toBe(true);
    expect(check(s, { c: 'money', min: money + 500 })).toBe(true);
    expect(check(s, { c: 'money', min: money + 501 })).toBe(false);
  });
  it('열매를 먹으면 첫 기술을 배우고 주력 변경을 묻는다', () => {
    const s = grown(12);
    applyEffects(s, [{ op: 'findFruit', pool: 'mera' }]);
    const u = s.inventory.unknownFruits[0];
    applyEffects(s, [{ op: 'eatFruit', uid: u.uid }]);
    expect(s.hero.fruit?.id).toBe('mera');
    expect(s.growth.skills['fruit:mera:0']).toBeDefined();
    expect(s.choice.queue[0]).toBe('en_rethink');
    expect(s.metaEvents.some((e) => e.k === 'fruit')).toBe(true);
  });
  it('감정은 힌트를 하나씩 준다', () => {
    const s = grown(13);
    s.hero.money = 100000;
    applyEffects(s, [{ op: 'findFruit', pool: 'any' }]);
    const u = s.inventory.unknownFruits[0];
    applyEffects(s, [{ op: 'appraise', uid: u.uid, fee: 1000 }]);
    expect(u.hints.length).toBe(1);
  });
});

describe('성장', () => {
  it('주력 갈래의 숙련이 달마다 오른다 (1.6 ÷ 단계)', () => {
    const s = grown(14);
    setFocus(s, 'martial.fist', 'focus');
    const before = s.growth.skills.fist_jab.mastery;
    monthlyGrowth(s);
    expect(s.growth.skills.fist_jab.mastery).toBeCloseTo(before + B.growth.masteryPerMonth / 1, 5);
  });
  it('큰 단계가 없으면 그 기술을 배우지 못한다', () => {
    const s = grown(15);
    setFocus(s, 'martial.fist', 'focus');
    s.growth.skills.fist_quake = { mastery: 100 };
    s.hero.base.str = 99;
    monthlyGrowth(s);
    expect(s.growth.skills.fist_secret).toBeUndefined();
    s.growth.gates.push('martial.fist.master');
    monthlyGrowth(s);
    expect(s.growth.skills.fist_secret).toBeDefined();
  });
  it('기술 칸이 차면 장착하지 않는다', () => {
    const s = grown(16);
    s.loadout.skills = ['a', 'b', 'c', 'd', 'e', 'f'];
    learn(s, 'gun_shot');
    expect(s.loadout.skills).not.toContain('gun_shot');
  });
});

describe('전투', () => {
  const stats = { str: 50, spd: 50, vit: 50, int: 40, wil: 40, luk: 10 };
  function duel(armament: 0 | 1 | 2 | 3, logia: boolean) {
    const a = enemyUnit(makeEnemy({ id: 'a', name: 'A', p: 50, armament, skills: ['fist_jab'] }), false, 0);
    a.side = 'L'; a.hero = true; a.leader = true; a.role = 'hero'; a.st = { ...stats };
    const d = enemyUnit(makeEnemy({ id: 'd', name: 'D', p: 50, fruitClass: logia ? 'logia' : null, skills: [] }), true, 1);
    d.st = { ...stats }; d.maxHp = d.hp = 1e9;
    const b = startBattle([a, d], { 0: 1 }, 99, false);
    runBattle(b, true);
    const hits = b.events.filter((e) => e.k === 'act' && e.who === 0 && !e.dodge) as { dmg: number }[];
    return hits.reduce((x, e) => x + e.dmg, 0) / Math.max(1, hits.length);
  }
  it('자연계는 무장색이 없으면 피해가 크게 준다 (0이 되지는 않는다)', () => {
    const plain = duel(0, false), logia0 = duel(0, true), logia3 = duel(3, true);
    expect(logia0).toBeGreaterThan(0);
    expect(logia0 / plain).toBeLessThan(0.35);
    expect(logia3 / plain).toBeGreaterThan(0.85);
  });
  it('전투는 20합 안에 끝난다', () => {
    const a = enemyUnit(makeEnemy({ id: 'a', name: 'A', p: 30, skills: ['fist_jab'] }), false, 0);
    a.side = 'L'; a.hero = true; a.role = 'hero';
    const d = enemyUnit(makeEnemy({ id: 'd', name: 'D', p: 30, skills: ['fist_jab'] }), true, 1);
    const b = runBattle(startBattle([a, d], { 0: 1 }, 1, false), true);
    expect(b.result).not.toBeNull();
    expect(b.round).toBeLessThanOrEqual(B.combat.maxRounds);
  });
});

describe('생애', () => {
  it('tick은 죽은 인생에서 아무것도 하지 않는다', () => {
    const s = grown(20);
    s.hero.alive = false;
    expect(tick(s)).toBe(false);
  });
  it('무작위로 답하는 인생 40번이 멈추지 않고 끝난다', () => {
    for (let i = 0; i < 40; i++) {
      const res = autoplay(500 + i, i % 2 ? 'smart' : 'random');
      expect(res.stuck, `seed ${500 + i}`).toBe(false);
      expect(res.violations, `seed ${500 + i}`).toEqual([]);
      expect(invariants(res.s)).toEqual([]);
    }
  });
});

describe('집단전과 개입', () => {
  it('주인공이 간부를 먼저 쓰러뜨리면 개입을 기다리고, 고르면 이어서 계산한다', () => {
    const hero = enemyUnit(makeEnemy({ id: 'h', name: '나', p: 80, skills: ['fist_jab', 'fist_combo'] }), false, 0);
    hero.side = 'L'; hero.hero = true; hero.leader = true; hero.role = 'hero';
    const ally = enemyUnit(makeEnemy({ id: 'c', name: '동료', p: 30, skills: ['fist_jab'] }), false, 1);
    ally.side = 'L'; ally.role = 'vanguard'; ally.key = 'c';
    const boss = enemyUnit(makeEnemy({ id: 'b', name: '두목', p: 40, skills: ['fist_jab'] }), true, 2);
    const officer = enemyUnit(makeEnemy({ id: 'o', name: '간부', p: 10, skills: [] }), false, 3);
    // 주인공은 간부(3), 동료는 두목(2)을 맡는다
    const b = startBattle([hero, ally, boss, officer], { 0: 3, 1: 2 }, 5, false);
    runBattle(b, false);
    expect(b.awaiting).toBe('intervene');
    expect(b.result).toBeNull();
    const open = b.duels.filter((d) => !d.over);
    expect(open.length).toBe(1);
    intervene(b, open[0].id);
    runBattle(b, false);
    expect(b.result).not.toBeNull();
    expect(b.events.some((e) => e.k === 'join' && e.who === 0)).toBe(true);
  });
});
