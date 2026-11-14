import { describe, expect, it } from 'vitest';
import { newLife } from '../../src/core/state';
import { reduce, invariants } from '../../src/core/reduce';
import { applyEffects } from '../../src/core/effects';
import { check } from '../../src/core/conditions';
import { intervene, logiaMult, startBattle, runBattle } from '../../src/core/combat/engine';
import { getSkill as getSkillT } from '../../src/core/growth/skillbook';
import { enemyUnit } from '../../src/core/combat/units';
import { makeEnemy } from '../../src/data/bosses';
import { B } from '../../src/data/balance';
import { autoplay } from '../../src/core/autoplay';
import { resolveChoice } from '../../src/core/choice/choice';
import { tick } from '../../src/core/sim/tick';
import { activeBranches, learn, monthlyGrowth, openGate, setFocus } from '../../src/core/growth/growth';
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
  it('열매를 먹으면 첫 기술을 배우고 열매 칸에 든다', () => {
    const s = grown(12);
    applyEffects(s, [{ op: 'findFruit', pool: 'mera' }]);
    const u = s.inventory.unknownFruits[0];
    applyEffects(s, [{ op: 'eatFruit', uid: u.uid }]);
    expect(s.hero.fruit?.id).toBe('mera');
    expect(s.growth.skills['fruit:mera:0']).toBeDefined();
    expect(s.choice.queue).not.toContain('en_rethink');
    expect(activeBranches(s)).toContain('fruit');
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

describe('작은 사건과 멈춤 수', () => {
  it('유년기를 건너뛰는 동안 작은 사건이 기록되고, 날짜가 순서대로다', () => {
    const s = grown(31);
    const life = s.log.filter((l) => l.type === 'life');
    expect(life.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < s.log.length; i++) expect(s.log[i].t).toBeGreaterThanOrEqual(s.log[i - 1].t);
  });
  it('작은 사건의 기록에는 결과 문구가 붙는다', () => {
    const s = grown(32);
    expect(s.log.some((l) => l.type === 'life' && /상승|나빠짐|베리|깊어짐/.test(l.text))).toBe(true);
  });
  it('10세 이후 한 해에 멈추는 수는 평균 4~5번 이하다', () => {
    let pauses = 0, years = 0, events = 0;
    for (let i = 0; i < 20; i++) {
      const { s } = autoplay(900 + i, 'smart');
      pauses += s.stats.pauses ?? 0; events += s.stats.lifeEvents ?? 0; years += Math.max(1, s.hero.age - 10);
    }
    expect(pauses / years).toBeLessThanOrEqual(5);
    expect(events / years).toBeGreaterThanOrEqual(3);
  });
  it('이름을 정해 새 인생을 시작할 수 있다', () => {
    expect(newLife(1, undefined, { name: '루피아', surname: '몽키' }).hero.name).toBe('루피아');
  });
});

describe('출생', () => {
  it('고향은 원작 초반의 이스트 블루 마을 8곳 중 하나다', async () => {
    const { HOMETOWNS } = await import('../../src/data/births');
    const names = HOMETOWNS.map((h) => h.name);
    for (let i = 0; i < 200; i++) {
      const s = newLife(7000 + i);
      expect(names).toContain(s.hero.birth.place);
      expect(s.hero.birth.seaId).toBe('east');
    }
  });
  it('희귀한 성씨는 고아로 태어나 보호자가 거둔다', () => {
    const s = newLife(3, undefined, { surname: '네펠타리' });
    expect(s.hero.traits).toContain('orphan');
    expect(s.people.some((p) => p.relation === '보호자')).toBe(true);
    expect(s.people.some((p) => p.relation === '아버지')).toBe(false);
    expect(s.log.some((l) => l.text.includes('네펠타리'))).toBe(true);
  });
  it('사람이 아닌 종족은 고아다', () => {
    for (let i = 0; i < 300; i++) {
      const s = newLife(9000 + i);
      if (s.hero.species !== 'human') expect(s.hero.traits).toContain('orphan');
    }
  });
  it('이스트 블루의 이름난 집안은 자기 마을에서 태어난다', () => {
    for (let i = 0; i < 20; i++) expect(['시모츠키 마을']).toContain(newLife(i, undefined, { surname: '롤로노아' }).hero.birth.place);
  });
  it('고향을 고를 수 있다', () => {
    expect(newLife(5, undefined, { place: '로그타운' }).hero.birth.place).toBe('로그타운');
  });
});

describe('자연계 대책', () => {
  const sk = (id: string) => getSkillT(id)!;
  const foe = { fruitClass: 'logia' as const, sealed: 0, bound: 0 };
  it('무장색 · 관통 · 해루석 무기가 단계를 하나씩 올린다', () => {
    expect(logiaMult({ armament: 0, weapon: null }, foe, null).mult).toBe(0.25);
    expect(logiaMult({ armament: 1, weapon: null }, foe, null).mult).toBe(0.5);
    expect(logiaMult({ armament: 0, weapon: null }, foe, sk('gun_snipe')).mult).toBe(0.5);
    expect(logiaMult({ armament: 0, weapon: { branch: 'martial.gun', mult: 1, seastone: true } }, foe, sk('gun_snipe')).mult).toBe(0.75);
    // 해루석 무기는 같은 갈래 기술에만
    expect(logiaMult({ armament: 0, weapon: { branch: 'martial.gun', mult: 1, seastone: true } }, foe, sk('fist_jab')).mult).toBe(0.25);
  });
  it('해루석에 닿았거나 묶인 자연계는 그대로 맞는다', () => {
    expect(logiaMult({ armament: 0, weapon: null }, { ...foe, sealed: 2 }, null).mult).toBe(1);
    expect(logiaMult({ armament: 0, weapon: null }, { ...foe, bound: 1 }, null).mult).toBe(1);
  });
  it('해루석 탄환을 챙기면 자연계에게 주는 피해가 크게 는다', () => {
    const fight = (cons: string[]) => {
      let total = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const a = enemyUnit(makeEnemy({ id: 'a', name: 'A', p: 50, skills: ['fist_jab'] }), false, 0);
        a.side = 'L'; a.hero = true; a.role = 'hero'; a.consumables = [...cons];
        const d = enemyUnit(makeEnemy({ id: 'd', name: 'D', p: 50, fruitClass: 'logia', skills: [] }), true, 1);
        d.maxHp = d.hp = 1e9;
        const b = runBattle(startBattle([a, d], { 0: 1 }, seed, false), true);
        total += b.events.reduce((x, e) => x + (e.k === 'act' && e.who === 0 ? e.dmg : 0), 0);
      }
      return total;
    };
    expect(fight(['seastone', 'seastone', 'net'])).toBeGreaterThan(fight([]) * 1.3);
  });
  it('자연계 보스가 드러나면 무장색이 필요하다는 표시가 남고, 무장색을 열면 지워진다', () => {
    const s = grown(41);
    s.choice.flags.push('need_armament');
    openGate(s, 'haki.armament.awaken');
    expect(s.choice.flags).not.toContain('need_armament');
  });
});

describe('네 칸: 주력 · 보조(무술), 패기 칸, 열매 칸', () => {
  it('처음 깨우친 패기는 패기 칸에 들고, 주력 · 보조는 그대로다', () => {
    const s = grown(51);
    setFocus(s, 'martial.sword', 'focus');
    setFocus(s, 'martial.fist', 'secondary');
    openGate(s, 'haki.armament.awaken');
    expect(s.growth.haki).toBe('haki.armament');
    expect(s.growth.focus).toBe('martial.sword');
    expect(s.growth.secondary).toBe('martial.fist');
  });
  it('패기를 주력 칸에 넣으려 해도 패기 칸으로 간다', () => {
    const s = grown(52);
    setFocus(s, 'martial.gun', 'focus');
    setFocus(s, 'haki.observation', 'focus');
    expect(s.growth.focus).toBe('martial.gun');
    expect(s.growth.haki).toBe('haki.observation');
  });
  it('패기 칸과 열매 칸의 숙련이 주력과 함께 자란다', () => {
    const s = grown(53);
    setFocus(s, 'martial.fist', 'focus');
    openGate(s, 'haki.armament.awaken');
    applyEffects(s, [{ op: 'findFruit', pool: 'gomu' }]);
    applyEffects(s, [{ op: 'eatFruit', uid: s.inventory.unknownFruits[0].uid }]);
    const arm0 = s.growth.skills.arm_coat.mastery, fr0 = s.growth.skills['fruit:gomu:0'].mastery, fist0 = s.growth.skills.fist_jab.mastery;
    for (let i = 0; i < 6; i++) monthlyGrowth(s);
    expect(s.growth.skills.arm_coat.mastery).toBeGreaterThan(arm0);
    expect(s.growth.skills['fruit:gomu:0'].mastery).toBeGreaterThan(fr0);
    expect(s.growth.skills.fist_jab.mastery).toBeGreaterThan(fist0);
  });
  it('입문 · 보조 · 갈림길의 선택지는 무술뿐이다', () => {
    let s = reduce(grown(54), { type: 'tick' });
    expect(s.pending?.kind === 'choice' && s.pending.options.length).toBe(3);
    s = reduce(s, { type: 'answerChoice', index: 0 });
    openGate(s, 'haki.observation.awaken');
    s.choice.flags.push('rethink_ready');
    const p = resolveChoice(s, 'en_rethink')!;
    expect(p.options.every((o) => !/패기|견문|무장|열매/.test(o.label))).toBe(true);
  });
});

describe('이야기와 같은 상대', () => {
  it('해왕류와 싸우면 해왕류가 나온다', async () => {
    const { resolveEnemy } = await import('../../src/core/world/world');
    const s = grown(61);
    for (let i = 0; i < 20; i++) {
      const e = resolveEnemy(s, 'gen:elite:seaking');
      expect(e.form).toBe('seaking');
      expect(e.name).toMatch(/해왕류/);
      expect(e.title).toBe('바다의 괴물');
      expect(e.officers).toEqual([]);
      expect(e.fruitClass).toBeNull();
    }
  });
  it('원형을 정한 우두머리와 간부는 같은 편이다', async () => {
    const { resolveEnemy } = await import('../../src/core/world/world');
    const s = grown(62);
    for (let i = 0; i < 20; i++) {
      const e = resolveEnemy(s, 'gen:captain:pirate_captain');
      expect(e.title).toBe('해적 선장');
      expect(e.officers.every((o) => o.faction === 'pirate')).toBe(true);
    }
  });
  it('임무와 선택이 부르는 강적은 모두 원형이 있다', async () => {
    const { MISSIONS } = await import('../../src/data/missions');
    const { CHOICES } = await import('../../src/data/choices');
    const { ARCHETYPES } = await import('../../src/data/enemies');
    const refs: string[] = [];
    for (const m of MISSIONS) for (const st of m.steps) if (st.kind === 'battle') refs.push(st.enemy);
    for (const c of CHOICES) for (const o of c.options) for (const e of o.effects) if (e.op === 'battle') refs.push(e.enemy);
    for (const ref of refs) {
      if (ref === 'rival' || ref.startsWith('b_')) continue;
      const a = /^gen:(elite|captain|grunt):(\w+)$/.exec(ref);
      expect(a, ref).not.toBeNull();
      expect(ARCHETYPES[a![2]], ref).toBeDefined();
    }
  });
});
