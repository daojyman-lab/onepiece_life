// tests/game/body.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { reduce5, invariants5 } from '../../src/core/reduce';
import { loseLimb, fitProsthetic, effectiveStats5, canUse, lostCount, LIMBS } from '../../src/core/body';
import { applyFx } from '../../src/core/fx';
import { mainBranch, power5 } from '../../src/core/year';
import { TURNINGS } from '../../src/data/turnings';
import { rngOf } from '../../src/shared/core/rng';
import { V } from '../../src/data/balance';
import type { Life5 } from '../../src/core/types';

function adult(seed = 1): Life5 {
  const s = newLife5(seed); s.pending = null; s.age = 25; s.hero.standing = 'pirate';
  for (const k of Object.keys(s.hero.base) as (keyof typeof s.hero.base)[]) s.hero.base[k] = 40;
  return s;
}

describe('신체 손실', () => {
  it('다리를 잃으면 속도가, 팔을 잃으면 힘이 준다', () => {
    const s = adult(); const b = effectiveStats5(s);
    loseLimb(s, 'legL', rngOf(s.rng));
    expect(effectiveStats5(s).spd).toBeCloseTo(b.spd * V.limb.leg.spd);
    loseLimb(s, 'armR', rngOf(s.rng));
    expect(effectiveStats5(s).str).toBeCloseTo(b.str * V.limb.arm.str);
  });
  it('팔을 잃으면 사격이 막힌다', () => {
    const s = adult(); expect(canUse(s, 'gun')).toBe(true);
    loseLimb(s, 'armL', rngOf(s.rng));
    expect(canUse(s, 'gun')).toBe(false);
    expect(canUse(s, 'fist')).toBe(true);
  });
  it('시련으로 크게 쌓이고, 큰 계기가 예약된다', () => {
    const s = adult(); const h = s.hardship;
    loseLimb(s, 'eyeL', rngOf(s.rng));
    expect(s.hardship).toBe(h + V.hardship.limb);
    expect(s.queue.length).toBe(1);
    expect(s.stats.limbsLost).toBe(1);
    expect(s.log.at(-1)!.weight).toBe('heavy');
  });
  it('같은 부위를 두 번 잃지 않는다', () => {
    const s = adult(); loseLimb(s, 'eyeL', rngOf(s.rng));
    expect(loseLimb(s, 'eyeL', rngOf(s.rng))).toBeNull();
  });
  it('돈으로 단 것은 일부만 되찾고, 기연으로 얻은 것은 원래보다 낫다', () => {
    const s = adult(); const b = effectiveStats5(s).spd;
    loseLimb(s, 'legL', rngOf(s.rng)); const lost = effectiveStats5(s).spd;
    fitProsthetic(s, 'basic'); const basic = effectiveStats5(s).spd;
    expect(basic).toBeGreaterThan(lost); expect(basic).toBeLessThan(b);
    s.hero.limbs.legL = 'lost'; fitProsthetic(s, 'superior');
    expect(effectiveStats5(s).spd).toBeGreaterThan(b);
  });
  it('여섯 부위를 모두 잃어도 능력치가 바닥 아래로 내려가지 않고, 인생이 멈추지 않고 흐른다', () => {
    let s = adult(5);
    for (const l of LIMBS) loseLimb(s, l, rngOf(s.rng));
    expect(lostCount(s)).toBe(6);
    const st = effectiveStats5(s);
    for (const v of Object.values(st)) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(40 * V.limb.floor - 1e-9); }
    const startAge = s.age;
    for (let i = 0; i < 400; i++) {
      s = s.pending ? reduce5(s, { type: 'answer', index: s.pending.kind === 'door' ? s.pending.doors.findIndex((d) => !d.locked) : 1 }) : reduce5(s, { type: 'step' });
      expect(invariants5(s)).toEqual([]);
    }
    // 멈추지 않았다는 것은 40년을 흘렀거나, 그 전에 인생이 끝에 닿았다는 뜻이다(병이나 노환은 시드에 따라 온다).
    expect(s.ended !== null || s.age >= startAge + 40).toBe(true);
  });
  it('여섯 부위를 모두 잃은 인생도 끝에 닿는다', () => {
    let s = adult(5);
    for (const l of LIMBS) loseLimb(s, l, rngOf(s.rng));
    for (let i = 0; i < 6000 && s.pending?.kind !== 'ending'; i++) {
      if (!s.pending) s = reduce5(s, { type: 'step' });
      else if (s.pending.kind === 'door') s = reduce5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
      else s = reduce5(s, { type: 'answer', index: s.pending.kind === 'fight' ? 1 : 0 });
      expect(invariants5(s)).toEqual([]);
    }
    expect(s.pending?.kind).toBe('ending');
    expect(s.ended).toBeTruthy();
  });
});

describe('신체 손실의 세부', () => {
  it('잃을 것이 없으면 null을 돌려주고 아무것도 바꾸지 않는다', () => {
    const s = adult();
    for (const l of LIMBS) loseLimb(s, l, rngOf(s.rng));
    s.queue = [];
    const copy = JSON.parse(JSON.stringify(s));
    expect(loseLimb(s, 'random', rngOf(s.rng))).toBeNull();
    expect(s).toEqual(copy);
  });
  it('아무 곳이나 잃으면 온전한 부위 하나를 잃고, 큰 계기는 한 번만 줄 선다', () => {
    const s = adult(2);
    const a = loseLimb(s, 'random', rngOf(s.rng))!;
    const b = loseLimb(s, 'random', rngOf(s.rng))!;
    expect(a).not.toBe(b);
    expect(s.hero.limbs[a]).toBe('lost');
    expect(s.queue.filter((q) => q === 'moment_limb')).toHaveLength(1);
    expect(s.timeline.length).toBe(2);
  });
  it('의수 · 의족은 다리 → 팔 순으로 달고 눈은 달지 않으며, 돈으로 단 것은 기연으로 더 나아진다', () => {
    const s = adult();
    loseLimb(s, 'eyeR', rngOf(s.rng)); loseLimb(s, 'armL', rngOf(s.rng)); loseLimb(s, 'legR', rngOf(s.rng));
    expect(fitProsthetic(s, 'basic')).toBe('legR');
    expect(fitProsthetic(s, 'basic')).toBe('armL');
    expect(fitProsthetic(s, 'basic')).toBeNull();   // 4단계: 의안은 달지 않는다
    expect(s.hero.limbs.eyeR).toBe('lost');
    expect(fitProsthetic(s, 'superior')).toBe('legR');
    expect(s.hero.limbs.legR).toBe('superior');
  });
  it('효과 loseLimb · prosthetic가 몸을 바꾼다', () => {
    const s = adult();
    applyFx(s, [{ op: 'loseLimb', limb: 'legL' }]);
    expect(s.hero.limbs.legL).toBe('lost');
    applyFx(s, [{ op: 'prosthetic', grade: 'basic' }]);
    expect(s.hero.limbs.legL).toBe('basic');
  });
  it('두 눈을 잃으면 모든 능력치가 떨어지지만, 견문색이 깊으면 그렇지 않다', () => {
    const s = adult(); const b = effectiveStats5(s);
    loseLimb(s, 'eyeL', rngOf(s.rng)); loseLimb(s, 'eyeR', rngOf(s.rng));
    expect(effectiveStats5(s).int).toBeCloseTo(b.int * V.limb.bothEyes);
    s.growth.tier.observation = 2;
    expect(effectiveStats5(s).int).toBeCloseTo(b.int);
    // 견문색 2단계는 속도를 따로 강화한다 (core/body.ts의 패기 강화)
    expect(effectiveStats5(s).spd).toBeCloseTo(b.spd * V.limb.eye.spd * V.limb.eye.spd * (1 + 2 * V.haki.observation.spdPerTier));
  });
  it('부상은 능력치를 깎고, 흉터는 한 능력치를 깎는다', () => {
    const s = adult(); const b = effectiveStats5(s);
    s.hero.injuries.push({ severity: 'heavy', monthsLeft: 9 });
    expect(effectiveStats5(s).wil).toBeCloseTo(b.wil * V.injury.statMult.heavy);
    s.hero.injuries = [{ severity: 'scar', monthsLeft: 0, stat: 'luk' }];
    expect(effectiveStats5(s).luk).toBeCloseTo(b.luk - V.injury.scarAmount);
    expect(effectiveStats5(s).str).toBeCloseTo(b.str);
  });
  it('부위가 있는 상처는 해당 부위의 능력만 떨어뜨린다', () => {
    const s = newLife5(401);
    s.hero.injuries.push({ severity: 'heavy', monthsLeft: 18, part: 'armL', kind: 'fracture' });
    const actual = effectiveStats5(s);
    expect(actual.str).toBeLessThan(s.hero.base.str);
    expect(actual.spd).toBe(s.hero.base.spd);
  });
  it('몸을 잃으면 힘이 줄고, 쓸 수 없는 갈래는 주된 갈래가 되지 않는다', () => {
    const s = adult(); const p = power5(s);
    s.growth.tier.gun = 2; s.growth.tier.fist = 1;
    expect(mainBranch(s)).toBe('gun');
    loseLimb(s, 'armL', rngOf(s.rng));
    expect(mainBranch(s)).toBe('fist');
    s.growth.tier.gun = 0; s.growth.tier.fist = 0;
    expect(power5(s)).toBeLessThan(p);
  });
});

describe('큰 계기', () => {
  const ids = ['moment_limb', 'moment_loss', 'moment_defeat', 'moment_saved', 'moment_betrayed', 'moment_ruin'];
  it('여섯 가지가 있고, 문 세 개가 저마다 다른 가치관을 움직인다', () => {
    for (const id of ids) {
      const t = TURNINGS.find((x) => x.id === id)!;
      expect(t, id).toBeDefined();
      expect(t.kind).toBe('moment');
      expect(t.doors).toHaveLength(3);
      const keys = t.doors.map((d) => Object.keys(d.values ?? {}));
      for (const k of keys) expect(k).toHaveLength(1);
      expect(new Set(keys.flat()).size).toBe(3);
      for (const d of t.doors) expect(Object.values(d.values!)[0]).toBe(V.value.door);
    }
  });
  it('신체를 잃은 큰 계기에는 바다를 떠나는 문이 있다', () => {
    const t = TURNINGS.find((x) => x.id === 'moment_limb')!;
    expect(t.doors.some((d) => d.fx.some((e) => e.op === 'standing' && e.to === 'settled'))).toBe(true);
  });
  it('큰 계기는 줄을 서야만 온다', () => {
    for (const id of ids) expect(TURNINGS.find((x) => x.id === id)!.weight).toBe(0);
  });
  it('잃은 뒤 멈출 차례에 큰 계기가 뜨고, 고르면 가치관이 크게 움직인다', () => {
    let s = adult(3);
    loseLimb(s, 'legL', rngOf(s.rng));
    for (let i = 0; i < 200 && !(s.pending?.kind === 'door' && s.pending.turning === 'moment_limb'); i++) {
      s = s.pending ? reduce5(s, { type: 'answer', index: s.pending.kind === 'door' ? s.pending.doors.findIndex((d) => !d.locked) : 1 }) : reduce5(s, { type: 'step' });
    }
    expect(s.pending?.kind).toBe('door');
    const p = s.pending as Extract<Life5['pending'], { kind: 'door' }>;
    expect(p.moment).toBe(true);
    const before = { ...s.values };
    s = reduce5(s, { type: 'answer', index: 0 });
    const t = TURNINGS.find((x) => x.id === 'moment_limb')!;
    const id = Object.keys(t.doors[0].values!)[0] as keyof Life5['values'];
    expect(s.values[id] - before[id]).toBeGreaterThan(V.value.door);
  });
});
