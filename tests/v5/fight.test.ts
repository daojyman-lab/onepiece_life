// tests/v5/fight.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { askFight, riskOf, heroUnit5, gapOf } from '../../src/v5/core/fight';
import { addValues } from '../../src/v5/core/values';
import { FOES } from '../../src/v5/data/foes';
import { V } from '../../src/v5/data/balance';
import { applyFx } from '../../src/v5/core/fx';
import type { Life5 } from '../../src/v5/core/types';

const weak = Object.keys(FOES)[0];
function fighter(seed: number, stat = 40): Life5 {
  const s = newLife5(seed); s.pending = null; s.age = 22; s.hero.standing = 'pirate';
  for (const k of Object.keys(s.hero.base) as (keyof typeof s.hero.base)[]) s.hero.base[k] = stat;
  return s;
}

describe('싸움', () => {
  it('이름 있는 상대 앞에서 붙을지 물러날지를 묻고, 위험을 보여 준다', () => {
    const s = fighter(1); askFight(s, weak, true, false);
    expect(s.pending?.kind).toBe('fight');
    const p = s.pending as Extract<Life5['pending'], { kind: 'fight' }>;
    for (const v of Object.values(p.risk)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
  });
  it('물러나면 싸우지 않는다', () => {
    let s = fighter(1); askFight(s, weak, true, false);
    s = reduce5(s, { type: 'answer', index: 1 });
    expect(s.pending).toBeNull();
    expect(s.stats.fights).toBe(0);
  });
  it('물러날 수 없는 싸움은 묻지 않고 싸운다', () => {
    const s = fighter(1); askFight(s, weak, false, true);
    expect(s.pending?.kind).toBe('battle');
  });
  it('붙으면 끝까지 자동으로 싸우고, 도중에 묻지 않는다', () => {
    let s = fighter(1); askFight(s, weak, true, false);
    s = reduce5(s, { type: 'answer', index: 0 });
    const p = s.pending as Extract<Life5['pending'], { kind: 'battle' }>;
    expect(p.kind).toBe('battle');
    expect(p.battle.result).not.toBeNull();
    expect(p.battle.awaiting).toBeNull();
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.pending === null || s.pending.kind === 'door' || s.pending.kind === 'ending').toBe(true);
    expect(s.stats.fights).toBe(1);
  });
  it('상대가 강할수록 다치고, 잃고, 죽을 위험이 오른다', () => {
    const strong = fighter(1, 80), frail = fighter(1, 8);
    const a = riskOf(strong, FOES[weak], true), b = riskOf(frail, FOES[weak], true);
    expect(gapOf(frail, FOES[weak])).toBeGreaterThan(gapOf(strong, FOES[weak]));
    expect(b.injury).toBeGreaterThanOrEqual(a.injury);
    expect(b.limb).toBeGreaterThanOrEqual(a.limb);
    expect(b.death).toBeGreaterThanOrEqual(a.death);
    expect(b.limb).toBeLessThanOrEqual(V.fight.limbCap);
  });
  it('목숨을 걸지 않은 싸움에서는 죽지 않는다', () => {
    expect(riskOf(fighter(1, 5), FOES[weak], false).death).toBe(0);
    for (let i = 0; i < 60; i++) {
      let s = fighter(i, 5); askFight(s, weak, false, false);
      s = reduce5(s, { type: 'answer', index: 0 }); s = reduce5(s, { type: 'answer', index: 0 });
      expect(s.hero.alive).toBe(true);
    }
  });
  it('어떻게 싸우는지는 가치관이 정한다', () => {
    const a = fighter(1); addValues(a, { dominion: 90 });
    const b = fighter(1); addValues(b, { peace: 90 });
    expect(heroUnit5(a).tactic).toBe('offense');
    expect(heroUnit5(b).tactic).toBe('defense');
    expect(heroUnit5(b).retreatAt).toBeGreaterThan(heroUnit5(a).retreatAt);
  });
  it('반골은 물러나지 않는다', () => {
    const s = fighter(1); s.strengths.push('rebel');
    expect(heroUnit5(s).retreatAt).toBe(0);
  });
  it('싸움 물음이 떠 있는 상태를 JSON으로 되살려도 같은 결과가 나온다', () => {
    const s = fighter(3); askFight(s, weak, true, false);
    expect(reduce5(JSON.parse(JSON.stringify(s)), { type: 'answer', index: 0 })).toEqual(reduce5(s, { type: 'answer', index: 0 }));
  });

  it('사소한 싸움은 묻지 않고 돌려 기록으로 끝나며, 죽거나 몸을 잃지 않는다', () => {
    let s = fighter(7, 6); addValues(s, { dominion: 90 });
    for (let i = 0; i < 200; i++) { s = reduce5({ ...s, pending: null }, { type: 'step' }); s.hero.standing = 'pirate'; }
    expect(s.stats.fights).toBeGreaterThan(0);
    expect(s.hero.alive).toBe(true);
    expect(s.flags).not.toContain('limbPending');
  });
  it('졌던 상대를 다시 붙어 이기면 불굴의 표시가 쌓인다', () => {
    let s = fighter(1, 80); s.flags.push(`lostTo:${weak}`); askFight(s, weak, false, true);
    expect((s.pending as Extract<Life5['pending'], { kind: 'battle' }>).result).toBe('win');
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.marks.unyielding).toBe(1);
    expect(s.flags).not.toContain(`lostTo:${weak}`);
  });
  it('부상은 기록되고 시간이 지나면 낫는다', () => {
    let s = fighter(1); applyFx(s, [{ op: 'injury', severity: 'light' }]);
    expect(s.hero.injuries).toHaveLength(1);
    for (let i = 0; i < Math.ceil(V.injury.months.light / V.injury.monthsPerPart); i++) s = reduce5({ ...s, pending: null }, { type: 'step' });
    expect(s.hero.injuries).toHaveLength(0);
  });
});
