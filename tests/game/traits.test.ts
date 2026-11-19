import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { activeTraitIds, initializeTraits, recordTraitEvent, selectTraits, tradeCost, traitFactor, traitModifiers } from '../../src/core/traits';
import { normalizeLife5 } from '../../src/core/load';
import { NEW_TRAITS } from '../../src/data/traits';

describe('특성의 실제 적용', () => {
  it('독립적인 탐구 선택으로 지식을 얻고 저장 뒤 치명타가 적용된다', () => {
    const s = newLife5(88);
    initializeTraits(s);
    const def = NEW_TRAITS.find(t => t.id === 'knowledge')!;
    for (let i = 0; i < def.earn!.count; i++) recordTraitEvent(s, 'value', 'inquiry', 'event_' + i);
    expect(s.traits!.earned).toContain('knowledge');
    expect(traitModifiers(s).crit).toBeGreaterThan(0);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(loaded.traits!.earned).toContain('knowledge');
    expect(traitModifiers(loaded).crit).toBe(traitModifiers(s).crit);
  });
  it('같은 사건을 다시 읽어도 획득 진행이 늘지 않는다', () => {
    const s = newLife5(88);
    initializeTraits(s);
    for (let i = 0; i < 20; i++) recordTraitEvent(s, 'value', 'inquiry', 'same_event');
    expect(s.traits!.earned).not.toContain('knowledge');
  });
  it('거래 할인은 활성 상위 특성 하나만 적용된다', () => {
    const s = newLife5(88);
    initializeTraits(s);
    s.traits!.earned.push('negotiator', 'silverTongue');
    s.traits!.active = ['negotiator'];
    expect(tradeCost(s, 1000)).toBe(950);
    s.traits!.active = ['silverTongue'];
    expect(tradeCost(s, 1000)).toBe(900);
    expect(selectTraits(s, ['negotiator', 'silverTongue'])).toBe(false);
  });
  it('미보유 특성, 여섯 슬롯, 전투 중 교체를 거부한다', () => {
    const s = newLife5(88);
    initializeTraits(s);
    expect(selectTraits(s, ['not_owned'])).toBe(false);
    expect(selectTraits(s, Array(6).fill('weak'))).toBe(false);
    s.pending = { kind: 'fight' } as never;
    expect(selectTraits(s, [])).toBe(false);
    expect(activeTraitIds(s).length).toBeLessThanOrEqual(5);
  });
  it('상위 특성을 해금하면 같은 계열의 하위 특성을 대체한다', () => {
    const s = newLife5(88);
    initializeTraits(s);
    s.traits!.earned.push('negotiator');
    s.traits!.active = ['negotiator'];
    const def = NEW_TRAITS.find(t => t.id === 'silverTongue')!;
    for (let i = 0; i < def.earn!.count; i++) recordTraitEvent(s, def.earn!.kind, def.earn!.key ?? '', 'trade_' + i);
    expect(activeTraitIds(s)).toContain('silverTongue');
    expect(activeTraitIds(s)).not.toContain('negotiator');
    expect(traitFactor(s, 'discount')).toBe(.1);
  });
});

import { applyFx } from '../../src/core/fx';
import { openTurning, resolveDoors, answerDoor } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { heroUnit5 } from '../../src/core/fight';
import { power5 } from '../../src/core/power';
import { effectiveStats5 } from '../../src/core/body';
import { ownedTraitIds, acquireTrait } from '../../src/core/traits';

describe('특성 전수 획득과 실제 거래·전투', () => {
  it('자연 출생 2만 회에서 신규 출생 특성을 모두 발견하며 최대 다섯 개다', () => {
    const seen = new Set<string>();
    const counts = new Set<number>();
    for (let seed = 10000; seed < 30000; seed++) {
      const s = newLife5(seed);
      counts.add(s.hero.talents.length);
      expect(activeTraitIds(s).length).toBeLessThanOrEqual(5);
      for (const id of s.hero.talents) seen.add(id);
    }
    expect([...counts].sort()).toEqual([2, 3, 4, 5]);
    for (const def of NEW_TRAITS.filter(t => t.born)) expect(seen.has(def.id), def.name).toBe(true);
  });

  it('모든 후천 특성은 정해진 서로 다른 행동을 쌓아 보유하고 적용할 수 있다', () => {
    for (const def of NEW_TRAITS.filter(t => !t.born)) {
      const s = newLife5(88);
      s.traits!.active = [];
      const earn = def.earn!;
      for (let i = 0; i < earn.count; i++) recordTraitEvent(s, earn.kind, earn.key ?? '', def.id + i);
      expect(ownedTraitIds(s), def.name).toContain(def.id);
      s.pending = null; s.queue = []; s.passage = null;
      expect(selectTraits(s, [def.id]), def.name).toBe(true);
      expect(activeTraitIds(s), def.name).toEqual([def.id]);
    }
  });

  it('할인된 교습비로 실제 도장 문이 열리고 정확한 금액을 지불한다', () => {
    const s = newLife5(88);
    s.pending = null; s.queue = []; s.age = 20;
    s.traits!.earned.push('silverTongue'); s.traits!.active = ['silverTongue'];
    const dojo = TURNING_BY_ID.pp_dojo;
    s.hero.money = 225000;
    expect(resolveDoors(s, dojo)[0].locked).toBeNull();
    expect(openTurning(s, dojo)).toBe(true);
    answerDoor(s, 0);
    expect(s.hero.money).toBe(0);
    expect(s.growth.master?.branch).toBe('sword');
  });

  it('할인 특성이 있어도 세금·기부·도박 손실은 할인되지 않는다', () => {
    const s = newLife5(88);
    s.traits!.earned.push('silverTongue'); s.traits!.active = ['silverTongue'];
    s.hero.money = 10000;
    applyFx(s, [{ op: 'money', add: -1000 }]);
    expect(s.hero.money).toBe(9000);
    applyFx(s, [{ op: 'money', add: -1000, trade: true }]);
    expect(s.hero.money).toBe(8100);
    s.traits!.active = [];
    applyFx(s, [{ op: 'money', add: -1000, trade: true }]);
    expect(s.hero.money).toBe(7100);
  });

  it('협응은 건강한 동료만 개인전에 기여하며 원래 힘의 20%를 넘지 않는다', () => {
    const s = newLife5(88);
    s.traits!.active = [];
    const solo = power5(s);
    const soloStr = heroUnit5(s).st.str;
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '검증 동료', level: 30 }]);
    s.traits!.earned.push('coordination'); s.traits!.active = ['coordination'];
    expect(power5(s)).toBeGreaterThan(solo);
    expect(power5(s)).toBeLessThanOrEqual(solo * 1.2 + 1e-9);
    expect(heroUnit5(s).st.str).toBeGreaterThan(soloStr);
    const person = s.people.find(p => p.crew)!;
    person.crew!.injuredMonths = 1;
    expect(power5(s)).toBe(solo);
    person.crew!.injuredMonths = 0; person.alive = false;
    expect(power5(s)).toBe(solo);
  });

  it('비활성 출생 특성의 능력치 보너스와 패시브는 제거된다', () => {
    const s = newLife5(88);
    s.hero.talents = ['strong', 'deaf']; s.traits!.active = ['strong', 'deaf'];
    const str = effectiveStats5(s).str;
    expect(traitModifiers(s).dodge).toBe(-.05);
    s.traits!.active = [];
    expect(effectiveStats5(s).str).toBe(str - 4);
    expect(traitModifiers(s).dodge ?? 0).toBe(0);
  });

  it('강골·약한 뼈는 실제로 새 부상의 기간을 바꾼다', () => {
    const s = newLife5(88);
    s.hero.injuries = []; s.hero.talents = ['tough']; s.traits!.active = ['tough'];
    applyFx(s, [{ op: 'injury', severity: 'heavy' }]);
    const tough = s.hero.injuries[0].monthsLeft;
    s.hero.injuries = []; s.hero.talents = ['brittle']; s.traits!.active = ['brittle'];
    applyFx(s, [{ op: 'injury', severity: 'heavy' }]);
    expect(s.hero.injuries[0].monthsLeft).toBeGreaterThan(tough);
  });

  it('상위 먹보는 대식의 체력 보너스를 대체한다', () => {
    const s = newLife5(88);
    s.traits!.active = [];
    const before = heroUnit5(s).maxHp;
    acquireTrait(s, 'bigEater');
    const first = heroUnit5(s).maxHp;
    acquireTrait(s, 'gourmand');
    expect(activeTraitIds(s)).toEqual(['gourmand']);
    expect(first).toBeGreaterThan(before);
    expect(heroUnit5(s).maxHp).toBeGreaterThan(first);
  });
});


import { nextTraitAwakening, traitMastery, traitStats } from '../../src/core/traits';
import { navigatorLevel, depart } from '../../src/core/passage';
import { V } from '../../src/data/balance';

describe('특성 회귀', () => {
  it('성공 보너스가 부상 확률을 올리지 않는다', () => {
    for (let seed = 1; seed < 100; seed++) {
      const a = newLife5(seed); const b = structuredClone(a);
      a.traits!.active = []; b.hero.talents = ['boldness']; b.traits!.active = ['boldness'];
      a.hero.injuries = []; b.hero.injuries = [];
      const fx = [{ op: 'chance', p: .3, then: [{ op: 'injury', severity: 'heavy' }] }] as const;
      applyFx(a, structuredClone(fx) as never); applyFx(b, structuredClone(fx) as never);
      expect(b.hero.injuries).toEqual(a.hero.injuries);
    }
  });
  it('해양지식이 실제 해상 성공 판정에서 활성화된다', () => {
    const s = newLife5(88);
    s.traits!.earned = ['oceanWisdom']; s.traits!.active = ['oceanWisdom'];
    s.pending = null;
    expect(openTurning(s, TURNING_BY_ID.gl_log_broken)).toBe(true);
    answerDoor(s, 1);
    expect(s.traitScene).toContain('sea');
    expect(traitFactor(s, 'chance')).toBe(.05);
    const fx = TURNING_BY_ID.gl_log_broken.doors[1].fx[0];
    expect(fx.op === 'chance' && fx.skillCheck).toBe(true);
  });
  it('부상 회복 배율이 실제 회복 토막 수를 줄인다', () => {
    let base = 0, improved = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = newLife5(seed); s.hero.injuries = []; s.traits!.active = [];
      applyFx(s, [{ op: 'injury', severity: 'heavy' }]);
      base += s.hero.injuries[0].monthsLeft;
      s.hero.injuries = []; s.traits!.earned = ['endurance']; s.traits!.active = ['endurance'];
      applyFx(s, [{ op: 'injury', severity: 'heavy' }]);
      improved += s.hero.injuries[0]?.monthsLeft ?? 0;
    }
    expect(improved).toBeLessThan(base * .8);
  });
  it('활성 지식형 특성이 항해 판단에 반영되고 비활성 수재는 빠진다', () => {
    const s = newLife5(88);
    s.hero.talents = ['genius']; s.hero.base.int = V.passage.navInt + 4;
    s.traits!.active = [];
    expect(traitStats(s).int).toBe(V.passage.navInt - 1);
    expect(navigatorLevel(s)).toBe(0);
    s.traits!.earned = ['scholar']; s.traits!.active = ['scholar'];
    expect(navigatorLevel(s)).toBe(1);
  });
  it('여행 중에는 스승의 패기 수련 장면이 끼어들지 않는다', () => {
    const s = newLife5(88); s.age = 20; s.traits!.evidence['practice:study'] = ['16', '17'];
    s.hero.standing = 'pirate';
    depart(s, '시럽 마을', 'calm');
    expect(nextTraitAwakening(s)).toBeNull();
  });
  it('사건의 숙련 보상도 활성 재능 배율을 한 번 적용한다', () => {
    const s = newLife5(88); s.traits!.active = []; s.hero.talents = ['swordTalent'];
    s.traits!.active = ['swordTalent']; s.growth.mastery.sword = 0;
    applyFx(s, [{ op: 'mastery', branch: 'sword', add: 10 }]);
    expect(s.growth.mastery.sword).toBeCloseTo(10 * traitMastery(s, 'sword'));
  });
});


it('먹보는 시장의 실제 식사를 세 번 마치면 얻는다', () => {
  const s = newLife5(88);
  s.pending = null; s.queue = []; s.hero.money = 10000;
  s.traits!.active = [];
  for (const age of [10, 13, 16]) {
    s.age = age;
    expect(openTurning(s, TURNING_BY_ID.trait_market_meal)).toBe(true);
    answerDoor(s, 0);
  }
  expect(ownedTraitIds(s)).toContain('gourmand');
  expect(s.hero.money).toBe(8500);
  expect(activeTraitIds(s)).toContain('gourmand');
});
