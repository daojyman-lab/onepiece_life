import { describe, expect, it } from 'vitest';
import { faceKeyOf } from '../../src/core/people';
import { askFight } from '../../src/v5/core/fight';
import { applyFx } from '../../src/v5/core/fx';
import { reduce5 } from '../../src/v5/core/reduce';
import { newLife5 } from '../../src/v5/core/state';
import { openTurning, resolveDoors } from '../../src/v5/core/turning';
import { TURNING_BY_ID } from '../../src/v5/data/turnings';
import type { Life5 } from '../../src/v5/core/types';

const reunion = TURNING_BY_ID.life_rival_reunion;

function meet(heroStat = 40) {
  const s = newLife5(42);
  s.pending = null;
  s.age = 27;
  s.hero.standing = 'pirate';
  for (const key of Object.keys(s.hero.base) as (keyof typeof s.hero.base)[]) s.hero.base[key] = heroStat;
  applyFx(s, [{ op: 'person', kind: 'rival', relation: '어릴 적 맞수', name: '단비', gender: 'f' }]);
  const rival = s.people.at(-1)!;
  Object.assign(rival, { age: 28, species: 'fishman', faction: 'pirate', bond: 73, power: 270 });
  s.rival = { personId: rival.id, career: 'captain', crewName: '물결 해적단', stage: 2, port: s.hero.island, fame: 20 };
  s.flags.push('kidRival', 'rival:free');
  return { s, rival };
}

describe('어릴 적 맞수와의 재회', () => {
  it.each([[500, 'win', '이겼다'], [1, 'lose', '졌다']] as const)('전투 능력치 %s인 주인공의 대련 결과를 기록한다', (stat, result, verb) => {
    const { s, rival } = meet(stat);
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '동료', level: 30 }]);
    expect(openTurning(s, reunion)).toBe(true);
    const started = reduce5(s, { type: 'answer', index: 0 });
    const p = started.pending;
    if (p?.kind !== 'battle') throw new Error('대련이 시작되지 않았다');
    expect(p.foe.name).toBe(rival.name);
    expect(p.battle.units).toHaveLength(2);
    expect(p.battle.units[1]).toMatchObject({ personId: rival.id, faceKey: faceKeyOf(rival), name: rival.name, species: rival.species, gender: rival.gender, age: rival.age });
    expect(p.battle.events.some(e => e.k === 'act')).toBe(true);
    expect(p.result).toBe(result);
    const resumed: Life5 = JSON.parse(JSON.stringify(started));
    const done = reduce5(resumed, { type: 'answer', index: 0 });
    expect(done.timeline.at(-1)?.text).toContain(`단비와 겨뤄 ${verb}`);
    expect(done.stats.fights).toBe(s.stats.fights + 1);
    expect(done.stats.wins).toBe(s.stats.wins + (result === 'win' ? 1 : 0));
    expect(done.stats.named).toEqual(s.stats.named);
    expect(done.hero.alive).toBe(true);
    expect(done.hero.limbs).toEqual(s.hero.limbs);
    expect(done.queue).not.toContain('after_fight');
    expect(done.flags.some(f => f.startsWith('lostTo:'))).toBe(false);
  });

  it('맞수가 성장하면 다음 대련의 능력치도 높아진다', () => {
    const { s, rival } = meet();
    const strength = () => {
      applyFx(s, [{ op: 'rivalDuel' }]);
      if (s.pending?.kind !== 'battle') throw new Error('대련이 시작되지 않았다');
      return s.pending.foe.base.str;
    };
    const before = strength();
    s.pending = null;
    rival.power = 550;
    expect(strength()).toBeGreaterThan(before);
  });

  it('독립한 맞수를 영입하면 같은 사람이 인연과 힘을 그대로 지닌다', () => {
    const { s, rival } = meet();
    const count = s.people.length;
    openTurning(s, reunion);
    const done = reduce5(s, { type: 'answer', index: 2 });
    expect(done.people).toHaveLength(count);
    expect(done.people.find(p => p.id === rival.id)).toMatchObject({
      ...rival, kind: 'crew', crew: { role: 'vanguard', power: Math.round(rival.power! / 5.1) },
    });
    expect(done.flags).not.toContain('rival:free');
    const firstTimeline = done.timeline.slice();
    applyFx(done, [{ op: 'recruitRival' }]);
    expect(done.timeline).toEqual(firstTimeline);
    expect(done.people).toHaveLength(count);
    askFight(done, 'b_morgan', false, true);
    if (done.pending?.kind !== 'battle') throw new Error('전투가 시작되지 않았다');
    expect(done.pending.battle.units.find(u => u.personId === rival.id)?.side).toBe('L');
  });

  it('성장 기록이 없는 옛 저장에서도 기존 맞수와 대련한다', () => {
    const { s, rival } = meet();
    delete s.rival;
    delete rival.power;
    openTurning(s, reunion);
    const started = reduce5(s, { type: 'answer', index: 0 });
    if (started.pending?.kind !== 'battle') throw new Error('대련이 시작되지 않았다');
    expect(started.pending.battle.units[1].personId).toBe(rival.id);
    expect(started.pending.foe.base.str).toBeGreaterThan(0);
  });

  it('떠돌이 검사와 대련하고 영입하면 같은 검술로 함께 싸운다', () => {
    const { s, rival } = meet();
    s.rival!.career = 'wanderingBlade';
    applyFx(s, [{ op: 'rivalDuel' }]);
    if (s.pending?.kind !== 'battle') throw new Error('대련');
    expect(s.pending.foe.skills).toContain('sword_parry');
    s.pending = null;
    applyFx(s, [{ op: 'recruitRival' }]);
    askFight(s, 'b_morgan', false, true);
    const battle = (s as Life5).pending;
    if (battle?.kind !== 'battle') throw new Error('동료 전투');
    const skills = battle.battle.units.find(u => u.personId === rival.id)!.skills.map(x => x.id);
    expect(skills).toContain('sword_cut');
    expect(skills).not.toContain('fist_jab');
  });

  it('소속을 떠날 수 없는 맞수와 해군 주인공에게는 영입이 잠긴다', () => {
    const { s } = meet();
    s.flags = s.flags.filter(id => id !== 'rival:free');
    expect(resolveDoors(s, reunion)[2].locked).toBeTruthy();
    s.flags.push('rival:free');
    s.hero.standing = 'marine';
    expect(resolveDoors(s, reunion)[2].locked).toBeTruthy();
  });
});
