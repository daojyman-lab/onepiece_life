// v7 성장의 재미: 종합 전투력을 레벨 · 등급으로 읽고, 처음 닿은 레벨 · 등급과 한 해의 성장을 기록에 남긴다.
import { describe, expect, it } from 'vitest';
import { gradeOf, levelCheck, levelOf, levelProgress, levelView, ratingForLevel, rpgState, yearGrowth } from '../../src/core/level';
import { rating5 } from '../../src/core/power';
import { newLife5 } from '../../src/core/state';
import { autoplay5 } from '../../src/core/autoplay';
import { GRADES } from '../../src/data/words';

describe('레벨과 등급', () => {
  it('레벨은 전투력이 오를수록 오르고 1~99 사이다', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(36)).toBe(7);
    expect(levelOf(240)).toBe(20);
    expect(levelOf(5700)).toBe(98);
    expect(levelOf(1e9)).toBe(99);
    let last = 0;
    for (let r = 0; r < 6000; r += 37) { const l = levelOf(r); expect(l).toBeGreaterThanOrEqual(last); last = l; }
  });

  it('다음 레벨까지의 진행은 0~1이고 레벨이 시작되는 전투력에서 0이다', () => {
    for (const lv of [5, 20, 50]) {
      const p = levelProgress(ratingForLevel(lv) + 1e-6);
      expect(p.level).toBe(lv);
      expect(p.frac).toBeLessThan(0.01);
    }
    expect(levelProgress(1e9)).toMatchObject({ level: 99, frac: 1, next: null });
  });

  it('등급은 화면의 전투 등급과 같은 경계를 쓴다', () => {
    expect(gradeOf(0)).toBe('F');
    for (const [lim, g] of GRADES) { expect(gradeOf(lim - 0.01)).toBe(g); }
    expect(gradeOf(99999)).toBe('SSS');
  });
});

describe('성장의 기록', () => {
  it('처음 볼 때는 기록하지 않고, 처음 닿은 레벨과 등급만 기록에 남긴다', () => {
    const s = newLife5(3);
    s.pending = null;
    levelCheck(s);
    const n = s.log.length;
    expect(s.rpg).toBeDefined();
    s.hero.base.str += 40;
    s.growth.tier.sword = 2;
    levelCheck(s);
    const up = s.log.slice(n);
    expect(up.some((l) => l.text.startsWith('▲ 레벨 업'))).toBe(true);
    expect(up.some((l) => l.text.startsWith('★ 등급 상승'))).toBe(true);
    // 내려갔다 다시 오르면 남기지 않는다
    const m = s.log.length;
    s.hero.base.str -= 40; levelCheck(s);
    s.hero.base.str += 40; levelCheck(s);
    expect(s.log.length).toBe(m);
  });

  it('해마다 지난 한 해에 오른 것을 한 줄로 결산하고 전투력을 궤적에 남긴다', () => {
    const s = newLife5(4);
    s.pending = null;
    rpgState(s);
    s.hero.base.vit += 3;
    s.growth.mastery.fist += 30;
    yearGrowth(s);
    const line = s.log.at(-1)!;
    expect(line.type).toBe('growth');
    expect(line.text).toContain('체력 +3');
    expect(s.rpg!.history[s.age]).toBe(Math.round(rating5(s)));
  });

  it('한 인생을 돌리면 레벨이 오르고 궤적이 쌓인다', () => {
    const { s } = autoplay5(9123, 'lean');
    const v = levelView(s);
    expect(v.peakLevel).toBeGreaterThan(7);
    expect(v.history.length).toBeGreaterThan(5);
    expect(s.log.some((l) => l.text.startsWith('▲ 레벨 업')) || s.age < 15).toBe(true);
  });
});
