// tests/v5/fight.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { askFight, riskOf, heroUnit5, gapOf, foePower, minorFoe } from '../../src/v5/core/fight';
import { openTurning } from '../../src/v5/core/turning';
import { TURNING_BY_ID } from '../../src/v5/data/turnings';
import { crewPowerFor } from '../../src/core/people';
import { rngOf } from '../../src/core/rng';
import { addValues } from '../../src/v5/core/values';
import { FOES } from '../../src/v5/data/foes';
import { V } from '../../src/v5/data/balance';
import { applyFx } from '../../src/v5/core/fx';
import { tierMult } from '../../src/v5/core/power';
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
    // 50년을 돌리므로 노환이나 병으로 끝날 수는 있다. 싸움으로 끝나서는 안 된다.
    if (s.ended) expect(s.ended.cause).not.toMatch(/에게 쓰러졌다/);
    expect(s.stats.limbsLost).toBe(0);
    expect(Object.values(s.hero.limbs).every((l) => l === 'ok')).toBe(true);
  });
  it('강한 상대에게 지면 몸을 잃을 수 있고, 잃으면 큰 계기가 줄을 선다', () => {
    let lost: Life5 | null = null;
    for (let i = 0; i < 200 && !lost; i++) {
      let s = fighter(i, 5); askFight(s, weak, false, true);
      s = reduce5(s, { type: 'answer', index: 0 });
      if (s.stats.limbsLost > 0) lost = s;
    }
    expect(lost).not.toBeNull();
    expect(Object.values(lost!.hero.limbs)).toContain('lost');
    expect(lost!.queue).toContain('moment_limb');
  });
  it('졌던 상대를 다시 붙어 이기면 불굴의 표시가 쌓인다', () => {
    let s = fighter(1, 80); s.flags.push(`lostTo:${weak}`); askFight(s, weak, false, true);
    expect((s.pending as Extract<Life5['pending'], { kind: 'battle' }>).result).toBe('win');
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.marks.unyielding).toBe(1);
    expect(s.flags).not.toContain(`lostTo:${weak}`);
  });
  it('사소한 싸움의 상대는 지금 사는 곳의 위험을 가운데로 뽑힌다: 고향 섬의 아이는 약한 상대를 만난다', () => {
    const kid = fighter(1); kid.age = V.fight.dangerKidAge; kid.hero.sea = 'nw_late';   // 고향 섬에 있다
    const away = fighter(1); away.hero.sea = 'nw_late'; away.hero.island = '와노쿠니';
    const mean = (s: Life5) => { let t = 0; for (let i = 0; i < 50; i++) t += foePower(minorFoe(s, rngOf(s.rng))); return t / 50; };
    expect(mean(kid) * 3).toBeLessThan(mean(away));
  });
  it('쓰러진 적을 동료로 받으면 그 동료는 다음 싸움에 함께 나선다', () => {
    let s = fighter(2); s.hero.sea = 'gl_first';
    openTurning(s, TURNING_BY_ID.after_fight);
    s = reduce5(s, { type: 'answer', index: 2 });
    const mate = s.people.find((p) => p.kind === 'crew')!;
    expect(mate.crew).toEqual({ role: V.person.crew.role, level: V.person.crew.level, power: crewPowerFor(3, V.person.crew.level), skills: [], injuredMonths: 0 });
    askFight(s, weak, false, true);
    const b = s.pending as Extract<Life5['pending'], { kind: 'battle' }>;
    expect(b.battle.units.some((u) => u.personId === mate.id && u.side === 'L')).toBe(true);
  });
  it('부상은 기록되고 시간이 지나면 낫는다', () => {
    let s = fighter(1); applyFx(s, [{ op: 'injury', severity: 'light' }]);
    expect(s.hero.injuries).toHaveLength(1);
    for (let i = 0; i < Math.ceil(V.injury.months.light / V.injury.monthsPerPart); i++) s = reduce5({ ...s, pending: null }, { type: 'step' });
    expect(s.hero.injuries).toHaveLength(0);
  });
});

describe('경지와 상대의 세기', () => {
  it('단계의 배율은 단계마다 커지고, 주인공의 전투 능력치에 곱해진다', () => {
    const c = V.growth.tierCurve;
    for (let i = 1; i < c.length; i++) expect(c[i]).toBeGreaterThan(c[i - 1]);
    const s = fighter(1, 400); const u0 = heroUnit5(s);
    s.growth.tier.sword = 4;
    expect(heroUnit5(s).st.str / u0.st.str).toBeCloseTo(tierMult(4), 1);
  });
  it('이름 있는 상대는 제 바다의 배율만큼 능력치가 줄어 나온다', () => {
    const s = fighter(1); askFight(s, 'b_kaido', true, false);
    const p = s.pending as Extract<Life5['pending'], { kind: 'fight' }>;
    expect(p.foe.base.str).toBe(Math.round(FOES.b_kaido.base.str * V.fight.foeScale.nw_late));
    expect(p.foe.officers[0].base.vit).toBe(Math.round(FOES.b_kaido.officers[0].base.vit * V.fight.foeScale.nw_late));
    expect(FOES.b_kaido.base.str).toBeGreaterThan(p.foe.base.str);   // 원본(v4 보스)은 그대로다
  });
  it('맞서는 문의 경지 문턱은 바다가 깊을수록 높고, 가장 센 상대는 6단계에서야 열린다', () => {
    const gate = (turning: string) => {
      const d = TURNING_BY_ID[turning].doors.find((x) => x.danger && x.fx.some((f) => f.op === 'fight'))!;
      const c = d.when?.find((x) => x.c === 'tier');
      return c && c.c === 'tier' ? c.min : 0;
    };
    expect(gate('meet_morgan')).toBeLessThan(gate('meet_smoker'));
    expect(gate('meet_smoker')).toBeLessThan(gate('meet_kizaru'));
    expect(gate('meet_kizaru')).toBeLessThan(gate('meet_fujitora'));
    expect(gate('meet_akainu')).toBe(V.growth.maxTier);
    expect(gate('meet_kaido')).toBe(V.growth.maxTier);
  });
});
