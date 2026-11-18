// tests/v5/risk.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { oldAgeP, partRisks, yearRisks } from '../../src/v5/core/risk';
import { applyFx } from '../../src/v5/core/fx';
import { rngOf } from '../../src/core/rng';
import { V } from '../../src/v5/data/balance';
import type { Life5 } from '../../src/v5/core/types';

function live(seed: number): Life5 {
  let s = newLife5(seed);
  for (let i = 0; i < 6000; i++) {
    if (s.pending?.kind === 'ending') break;
    if (!s.pending) s = reduce5(s, { type: 'step' });
    else if (s.pending.kind === 'door') s = reduce5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
    else s = reduce5(s, { type: 'answer', index: s.pending.kind === 'fight' ? 1 : 0 });
  }
  return s;
}
const lives = Array.from({ length: 200 }, (_, i) => live(3000 + i));

function adult(seed: number, age = 30): Life5 {
  const s = newLife5(seed); s.pending = null; s.age = age; s.hero.standing = 'settled'; s.hero.talents = [];
  return s;
}

describe('병, 사고, 굶주림의 규칙', () => {
  it('돈이 없으면 병이 깊어지다가 죽고, 돈이 있으면 스스로 고친다', () => {
    const s = adult(1); s.hero.money = 0;
    applyFx(s, [{ op: 'illness', id: 'cough' }]);
    for (let i = 0; i < 20 && s.hero.alive; i++) partRisks(s, rngOf(s.rng));
    expect(s.ended?.cause).toBe('병');
    expect(s.log.filter((l) => l.text.includes('깊어')).length).toBe(V.risk.maxStage - 1);
    const t = adult(2); t.hero.money = V.risk.treatCost + 1;
    applyFx(t, [{ op: 'illness', id: 'cough' }]);
    partRisks(t, rngOf(t.rng));
    expect(t.hero.illness).toBeNull();
    expect(t.hero.money).toBe(1);
  });
  it('아이는 병으로 죽지 않고 체력만 잃는다', () => {
    const s = adult(3, V.risk.kidAge); s.hero.money = 0;
    applyFx(s, [{ op: 'illness', id: 'cough' }]);
    for (let i = 0; i < 20; i++) partRisks(s, rngOf(s.rng));
    expect(s.hero.alive).toBe(true);
    expect(s.hero.hp).toBeLessThan(V.hp.max);
  });
  it('폭풍은 다음 토막에 결말이 나고, 넘기거나 난파해 죽는다', () => {
    const causes = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const s = adult(seed); s.hero.standing = 'pirate'; s.flags.push('storm');
      partRisks(s, rngOf(s.rng));
      expect(s.flags).not.toContain('storm');
      causes.add(s.ended?.cause ?? 'survived');
    }
    expect([...causes].sort()).toEqual(['survived', '난파']);
  });
  it('가난한 데다 돈도 벌이도 없으면 야윈 다음 해에 굶어 죽는다. 아이는 체력만 잃는다', () => {
    const s = adult(4); s.hero.standing = 'retired'; s.hero.wealth = 'poor'; s.hero.money = 0;
    yearRisks(s, rngOf(s.rng));
    expect(s.hero.alive).toBe(true);
    expect(s.log.some((l) => l.text.includes('야위'))).toBe(true);
    yearRisks(s, rngOf(s.rng));
    expect(s.ended?.cause).toBe('굶주림');
    const k = adult(5, 10); k.hero.standing = 'child'; k.hero.wealth = 'poor'; k.hero.money = 0;
    for (let i = 0; i < 3; i++) yearRisks(k, rngOf(k.rng));
    expect(k.hero.alive).toBe(true);
    expect(k.hero.hp).toBeLessThan(V.hp.max);
  });
  it('노환은 재능 배율을 받고, 노환으로 죽으면 원인이 노환이다', () => {
    let died = 0;
    for (let seed = 0; seed < 40; seed++) {
      const s = adult(seed, 95); s.hero.money = V.risk.treatCost * 10;
      yearRisks(s, rngOf(s.rng));
      if (s.ended) { expect(s.ended.cause).toBe('노환'); died++; }
    }
    expect(died).toBeGreaterThan(30);
  });
});

describe('병, 사고, 노환', () => {
  it('노환은 60세 전에는 없고 나이가 들수록 오른다', () => {
    expect(oldAgeP(V.risk.oldFrom - 1)).toBe(0);
    expect(oldAgeP(80)).toBeGreaterThan(oldAgeP(70));
  });
  it('모든 인생이 끝난다', () => {
    expect(lives.every((s) => s.pending?.kind === 'ending' && s.ended)).toBe(true);
  });
  it('싸움을 모두 피해도 병이나 사고로 죽는 인생이 있다', () => {
    expect(lives.some((s) => /병|사고|난파|굶주림/.test(s.ended!.cause))).toBe(true);
  });
  it('병이나 사고로 40세 전에 죽는 인생은 20명 중 1명 이하다', () => {
    const young = lives.filter((s) => s.ended!.age < 40 && /병|사고|난파|굶주림/.test(s.ended!.cause)).length;
    expect(young / lives.length).toBeLessThanOrEqual(0.05);
  });
  it('병이나 사고로 죽기 전에 조짐이 기록에 떠오른다', () => {
    // 싸움에서 쓰러진 죽음('해군 졸병에게 쓰러졌다' 등)은 이름에 '병'이 들어가도 병이 아니다
    for (const s of lives.filter((x) => /병|사고|난파|굶주림/.test(x.ended!.cause) && !/쓰러졌다$/.test(x.ended!.cause)))
      expect(s.log.some((l) => /깊어|기침|폭풍|먹구름|야위/.test(l.text)), s.ended!.cause).toBe(true);
  });
});
