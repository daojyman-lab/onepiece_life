// tests/game/mentor-growth.test.ts — 스승의 기술 전수 · 특훈 기록, 패기의 능력치 강화, 수련기 패기 기연
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { effectiveStats5 } from '../../src/core/body';
import { rollTrainingHakiFortune } from '../../src/core/fortune';
import { focusedStyle } from '../../src/core/styles';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { V } from '../../src/data/balance';

const fresh = () => { const s = newLife5(7); s.pending = null; return s; };

describe('스승에게 배우는 두 길', () => {
  it('기술 전수는 지금 유파에 숙련을 쌓고 이력에 남긴다', () => {
    const s = fresh();
    const style = focusedStyle(s, 'sword');
    const before = s.growth.styleMastery[style] ?? 0;
    applyFx(s, [{ op: 'learnTechnique', teacher: '난파선의 검객', branch: 'sword', name: '흐름을 끊는 발도', add: 22 }]);
    expect(s.growth.styleMastery[style]).toBe(before + 22);
    expect(s.growth.mentorHistory.at(-1)).toMatchObject({ kind: 'technique', teacher: '난파선의 검객', style, mastery: 22 });
  });

  it('특훈은 기본 능력치를 올리고 이력에 남긴다', () => {
    const s = fresh();
    const str = s.hero.base.str, vit = s.hero.base.vit;
    applyFx(s, [{ op: 'specialTraining', teacher: '늙은 권법가', training: '기초 체력·타격 내성 특훈', stats: { str: 2, vit: 2 } }]);
    expect(s.hero.base.str).toBe(str + 2);
    expect(s.hero.base.vit).toBe(vit + 2);
    expect(s.growth.mentorHistory.at(-1)).toMatchObject({ kind: 'training', stats: { str: 2, vit: 2 } });
  });

  it('기연의 스승은 전수와 특훈 가운데 고를 수 있다', () => {
    for (const id of ['fortune_black_market', 'fortune_old_fist', 'fortune_shipwreck_sword', 'fortune_peak_invite']) {
      const t = Object.values(TURNING_BY_ID).find((x) => x.id === id || x.doors.some((d) => d.fx?.some((f) => f.op === 'learnTechnique' && x.id === id)));
      if (!t) continue;
      expect(t.doors.some((d) => d.fx?.some((f) => f.op === 'learnTechnique'))).toBe(true);
      expect(t.doors.some((d) => d.fx?.some((f) => f.op === 'specialTraining'))).toBe(true);
    }
    const mentors = Object.values(TURNING_BY_ID).filter((t) => t.kind === 'fortune' && t.doors.some((d) => d.fx?.some((f) => f.op === 'learnTechnique')));
    expect(mentors.length).toBeGreaterThanOrEqual(4);
    for (const t of mentors) expect(t.doors.some((d) => d.fx?.some((f) => f.op === 'specialTraining'))).toBe(true);
  });
});

describe('패기의 능력치 강화', () => {
  it('무장색은 힘 · 체력을, 견문색은 속도를 단계만큼 곱해 올린다', () => {
    const s = fresh();
    const base = effectiveStats5(s);
    s.growth.tier.armament = 2;
    s.growth.tier.observation = 2;
    const st = effectiveStats5(s);
    expect(st.str).toBeCloseTo(base.str * (1 + 2 * V.haki.armament.strPerTier));
    expect(st.vit).toBeCloseTo(base.vit * (1 + 2 * V.haki.armament.vitPerTier));
    expect(st.spd).toBeCloseTo(base.spd * (1 + 2 * V.haki.observation.spdPerTier));
    expect(st.int).toBeCloseTo(base.int);
  });
});

describe('수련기의 패기 기연', () => {
  it('10~15세에만 열리고, 길 위의 고수가 패기의 첫 단계를 일깨운다', () => {
    const s = fresh();
    s.age = 9;
    expect(rollTrainingHakiFortune(s, () => 0)).toBe(false);
    s.age = 12;
    expect(rollTrainingHakiFortune(s, () => 0)).toBe(true);
    expect(s.pending).toMatchObject({ kind: 'door', turning: 'fortune_haki_unknown' });
    applyFx(s, TURNING_BY_ID.fortune_haki_unknown.doors[0].fx ?? []);
    expect(s.growth.tier.armament).toBeGreaterThanOrEqual(1);
  });
});
