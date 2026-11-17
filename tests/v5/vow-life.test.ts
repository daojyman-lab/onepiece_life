import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { VALUE_IDS } from '../../src/v5/data/values';
import { normalizeLife5 } from '../../src/v5/core/load';
import { recordVowActivity, recordVowChoice } from '../../src/v5/core/vow';
import type { HomeId } from '../../src/v5/core/types';
import { loadEnv } from 'vite';
import { LIFE_VOW_STORIES } from '../../src/v5/data/vow-life';
import { openTurning } from '../../src/v5/core/turning';
import type { Turning } from '../../src/v5/core/types';

const HOMES: HomeId[] = ['loguetown', 'water7', 'wano', 'fishman', 'sky', 'zou'];

describe('생애 서약', () => {
  it('여섯 고향과 아홉 신념 모두 첫 서약 제안이 열린다', () => {
    for (const home of HOMES) for (const value of VALUE_IDS) {
      const s = newLife5(88, { home });
      s.pending = null;
      s.age = 10;
      for (const id of VALUE_IDS) s.values[id] = id === value ? 40 : 0;
      const next = reduce5(s, { type: 'step' });
      expect(next.pending?.kind, `${home} / ${value}`).toBe('door');
      if (next.pending?.kind === 'door') expect(next.pending.turning, `${home} / ${value}`).toBe(`life_vow_offer_1_${value}`);
    }
  });

  function begin(value: (typeof VALUE_IDS)[number] = 'loyalty') {
    const s = newLife5(88, { home: 'zou' });
    s.pending = null;
    s.age = 10;
    for (const id of VALUE_IDS) s.values[id] = id === value ? 60 : 0;
    const offered = reduce5(s, { type: 'step' });
    expect(offered.pending?.kind).toBe('door');
    return reduce5(offered, { type: 'answer', index: 0 });
  }

  it('거절하거나 첫 서약에 실패하면 다음 단계가 오지 않는다', () => {
    const declined = begin();
    declined.pending = null;
    declined.age = 22;
    const failed = reduce5(declined, { type: 'step' });
    expect(failed.pending?.kind === 'door' && failed.pending.turning.startsWith('life_vow_offer_2')).toBe(false);

    const s = newLife5(88, { home: 'water7' });
    s.pending = null;
    s.age = 10;
    s.values.loyalty = 60;
    const offer = reduce5(s, { type: 'step' });
    const refused = reduce5(offer, { type: 'answer', index: 1 });
    refused.pending = null;
    refused.age = 30;
    const later = reduce5(refused, { type: 'step' });
    expect(later.pending?.kind === 'door' && later.pending.turning.startsWith('life_vow_offer_')).toBe(false);
  });

  it('서로 다른 실제 실천과 선택을 한 해 넘게 쌓아야 각성한다', () => {
    let s = begin();
    expect(s.vows?.active?.id).toBe('life_1_loyalty');
    expect(s.hero.hp).toBeLessThan(100);
    recordVowActivity(s, 'family');
    recordVowActivity(s, 'family');
    recordVowChoice(s, 'choice_a', 'loyalty');
    recordVowChoice(s, 'choice_a', 'loyalty');
    expect(s.vows?.active?.activities).toEqual(['family']);
    expect(s.vows?.active?.choices).toEqual(['choice_a']);
    const beforeTier = s.growth.tier.fist;
    const beforeVit = s.hero.base.vit;
    s.age = 12;
    s.pending = null;
    s = reduce5(s, { type: 'step' });
    expect(s.pending?.kind === 'door' && s.pending.turning).toBe('life_vow_settle_1_loyalty');
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.vows?.history).toEqual([{ id: 'life_1_loyalty', result: 'kept' }]);
    expect(s.growth.tier.fist).toBe(beforeTier + 1);
    expect(s.hero.base.vit).toBe(beforeVit + 2);
    expect(s.queue).toContain('life_vow_awakening_1_loyalty');
    s = reduce5(s, { type: 'step' });
    expect(s.pending?.kind === 'door' && s.pending.turning).toBe('life_vow_awakening_1_loyalty');
  });

  it('선택 증거가 없으면 결산을 고르기만 해도 실패한다', () => {
    let s = begin();
    s.age = 12;
    s.pending = null;
    s = reduce5(s, { type: 'step' });
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.vows?.history).toEqual([{ id: 'life_1_loyalty', result: 'failed' }]);
    expect(s.queue).not.toContain('life_vow_awakening_1_loyalty');
  });

  it('첫 성공만 두 번째를, 두 번째 성공만 세 번째를 연다', () => {
    let s = begin('freedom');
    recordVowActivity(s, 'roam');
    recordVowChoice(s, 'road_a', 'freedom');
    s.age = 12; s.pending = null;
    s = reduce5(reduce5(s, { type: 'step' }), { type: 'answer', index: 0 });
    s.queue = []; s.pending = null; s.age = 22;
    for (const id of VALUE_IDS) s.values[id] = id === 'justice' ? 90 : 0;
    s = reduce5(s, { type: 'step' });
    expect(s.pending?.kind === 'door' && s.pending.turning).toBe('life_vow_offer_2_freedom');
    s = reduce5(s, { type: 'answer', index: 0 });
    recordVowActivity(s, 'roam');
    recordVowChoice(s, 'road_b', 'freedom');
    recordVowChoice(s, 'road_c', 'freedom');
    s.age = 24; s.pending = null;
    s = reduce5(reduce5(s, { type: 'step' }), { type: 'answer', index: 0 });
    s.queue = []; s.pending = null; s.age = 36;
    s = reduce5(s, { type: 'step' });
    expect(s.pending?.kind === 'door' && s.pending.turning).toBe('life_vow_offer_3_freedom');
  });

  it('저장 복원 뒤에도 진행 증거와 대상이 유지된다', () => {
    const s = begin('loyalty');
    recordVowActivity(s, 'family');
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)));
    expect(loaded?.vows?.active?.activities).toEqual(['family']);
    expect(loaded?.vows?.active?.target).toBe(s.vows?.active?.target);
  });

  it('이미 6단계면 단계를 넘지 않고 숙련만 채운다', () => {
    let s = begin('inquiry');
    s.growth.tier.fist = 6;
    recordVowActivity(s, 'study');
    recordVowChoice(s, 'study_a', 'inquiry');
    s.age = 12; s.pending = null;
    s = reduce5(reduce5(s, { type: 'step' }), { type: 'answer', index: 0 });
    expect(s.growth.tier.fist).toBe(6);
    expect(s.growth.mastery.fist).toBe(100);
  });

  it('공개 빌드에서 여섯 고향 모두 출생 가중치가 있다', () => {
    const weights = Object.fromEntries(loadEnv('production', '.', 'VITE_').VITE_HOMES
      .split(',').map((part) => part.split(':').map((word) => word.trim())));
    for (const home of HOMES) expect(Number(weights[home]), home).toBeGreaterThan(0);
  });

  it('아홉 신념 모두 세 번의 성공으로 더 큰 각성에 닿는다', () => {
    for (const value of VALUE_IDS) {
      let s = begin(value);
      const stat = LIFE_VOW_STORIES[value].stat;
      const beforeStat = s.hero.base[stat];
      const beforeTier = s.growth.tier.fist;
      for (const level of [1, 2, 3] as const) {
        if (level > 1) {
          s.pending = null; s.queue = []; s.age = level === 2 ? 22 : 36;
          s = reduce5(s, { type: 'step' });
          expect(s.pending?.kind === 'door' && s.pending.turning).toBe(`life_vow_offer_${level}_${value}`);
          s = reduce5(s, { type: 'answer', index: 0 });
        }
        recordVowActivity(s, LIFE_VOW_STORIES[value].activities[0]);
        if (level === 3) recordVowActivity(s, LIFE_VOW_STORIES[value].activities[1]);
        recordVowChoice(s, `decision_${level}_a`, value);
        if (level > 1) recordVowChoice(s, `decision_${level}_b`, value);
        s.age += 2; s.pending = null;
        s = reduce5(s, { type: 'step' });
        expect(s.pending?.kind === 'door' && s.pending.turning).toBe(`life_vow_settle_${level}_${value}`);
        s = reduce5(s, { type: 'answer', index: 0 });
        expect(s.vows?.history.at(-1)).toEqual({ id: `life_${level}_${value}`, result: 'kept' });
      }
      expect(s.growth.tier.fist, value).toBe(beforeTier + 3);
      expect(s.hero.base[stat], value).toBe(beforeStat + 9);
    }
  });

  it('형제와 자녀가 있을 때만 실제 인물을 서약 대상으로 삼는다', () => {
    const s = newLife5(88, { home: 'loguetown' });
    for (const person of s.people) if (/^(형|오빠|누나|언니|남동생|여동생)$/.test(person.relation)) person.alive = false;
    s.people.push({ ...s.people[0], id: 'sibling', name: '형제 아오', relation: '남동생', alive: true });
    s.pending = null; s.age = 10; s.values.loyalty = 70;
    const first = reduce5(reduce5(s, { type: 'step' }), { type: 'answer', index: 0 });
    expect(first.vows?.active?.target).toBe('형제 아오');
    expect(first.vows?.active?.targetPersonId).toBe('sibling');
  });

  it('일반 전환점의 신념 선택이 서약의 증거로 남는다', () => {
    const s = begin();
    const turning: Turning = {
      id: 'test_loyalty_decision', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
      title: '친구의 선택', body: '친구가 손을 내민다.',
      doors: [{ label: '함께 남는다', hint: '곁을 지킨다', values: { loyalty: 6 }, fx: [] }],
    };
    expect(openTurning(s, turning)).toBe(true);
    const after = reduce5(s, { type: 'answer', index: 0 });
    expect(after.vows?.active?.choices).toContain('test_loyalty_decision');
  });

  it('예전 티카 서약 성공 저장은 중복 보상 없이 두 번째 서약으로 이어진다', () => {
    const s = newLife5(88, { home: 'sky' });
    s.pending = null; s.age = 22;
    s.vows = { active: null, history: [{ id: 'sky_tika_guard', result: 'kept' }] };
    const tier = s.growth.tier.fist;
    const next = reduce5(s, { type: 'step' });
    expect(next.pending?.kind === 'door' && next.pending.turning).toBe('life_vow_offer_2_loyalty');
    expect(next.growth.tier.fist).toBe(tier);
  });

  it('심화 서약은 첫 각성 때의 갈래를 이어 간다', () => {
    let s = begin('freedom');
    recordVowActivity(s, 'roam');
    recordVowChoice(s, 'walk_choice', 'freedom');
    s.age = 12; s.pending = null;
    s = reduce5(reduce5(s, { type: 'step' }), { type: 'answer', index: 0 });
    s.queue = []; s.pending = null; s.age = 22;
    s.growth.path = 'sword';
    s = reduce5(reduce5(s, { type: 'step' }), { type: 'answer', index: 0 });
    expect(s.vows?.active?.branch).toBe('fist');
  });

  it('서약 장면은 일반 멈춤 횟수를 소모하지 않는다', () => {
    const s = newLife5(88, { home: 'zou' });
    s.pending = null; s.age = 10; s.values.loyalty = 70;
    const before = s.stats.stops;
    const offer = reduce5(s, { type: 'step' });
    const accepted = reduce5(offer, { type: 'answer', index: 0 });
    expect(accepted.stats.stops).toBe(before);
  });
});
