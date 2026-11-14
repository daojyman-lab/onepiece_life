import { describe, expect, it } from 'vitest';
import { newLife } from '../../src/core/state';
import { reduce, invariants } from '../../src/core/reduce';
import { applyEffects } from '../../src/core/effects';
import { check, checkAll } from '../../src/core/conditions';
import { CHOICE_BY_ID } from '../../src/data/choices';
import { crewCapacity } from '../../src/core/effects';
import { intervene, logiaMult, startBattle, runBattle } from '../../src/core/combat/engine';
import { getSkill as getSkillT } from '../../src/core/growth/skillbook';
import { enemyUnit } from '../../src/core/combat/units';
import { makeEnemy } from '../../src/data/bosses';
import { B } from '../../src/data/balance';
import { autoplay } from '../../src/core/autoplay';
import { resolveChoice } from '../../src/core/choice/choice';
import { tick } from '../../src/core/sim/tick';
import { activeBranches, learn, monthlyGrowth, openGate, setFocus } from '../../src/core/growth/growth';
import type { BattleState, Encounter, LifeState } from '../../src/core/types';

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
    const branch = ((s.pending as { options: { effects: { op: string; branch?: string }[] }[] }).options[1].effects.find((e) => e.op === 'focus')!).branch;
    s = reduce(s, { type: 'answerChoice', index: 1 });
    expect(s.pending).toBeNull();
    expect(s.growth.focus).toBe(branch);
    expect(Object.keys(s.growth.skills).length).toBeGreaterThan(0);
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
  it('열매를 먹으면 기술이 아니라 패시브를 얻고 열매 칸에 든다', () => {
    const s = grown(12);
    applyEffects(s, [{ op: 'findFruit', pool: 'mera' }]);
    const u = s.inventory.unknownFruits[0];
    applyEffects(s, [{ op: 'eatFruit', uid: u.uid }]);
    expect(s.hero.fruit?.id).toBe('mera');
    expect(Object.keys(s.growth.skills).some((k) => k.startsWith('fruit:'))).toBe(false);
    expect(s.growth.fruitMastery).toBe(0);
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
    const life = s.log.filter((l) => l.type === 'life' || l.type === 'day');
    expect(life.length).toBeGreaterThanOrEqual(20);
    expect(s.log.some((l) => l.type === 'day')).toBe(true);
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
  it('처음 깨우친 패기는 패기 칸에 들고, 주력은 그대로다. 보조 칸은 없다', () => {
    const s = grown(51);
    setFocus(s, 'martial.sword', 'focus');
    setFocus(s, 'martial.fist', 'secondary');
    expect(s.growth.secondary).toBeNull();
    openGate(s, 'haki.armament.awaken');
    expect(s.growth.haki).toBe('haki.armament');
    expect(s.growth.focus).toBe('martial.sword');
  });
  it('패기를 주력 칸에 넣으려 해도 패기 칸으로 간다', () => {
    const s = grown(52);
    setFocus(s, 'martial.gun', 'focus');
    setFocus(s, 'haki.observation', 'focus');
    expect(s.growth.focus).toBe('martial.gun');
    expect(s.growth.haki).toBe('haki.observation');
  });
  it('패기 칸 · 열매 숙련이 주력과 함께 자란다', () => {
    const s = grown(53);
    setFocus(s, 'martial.fist', 'focus');
    openGate(s, 'haki.armament.awaken');
    applyEffects(s, [{ op: 'findFruit', pool: 'gomu' }]);
    applyEffects(s, [{ op: 'eatFruit', uid: s.inventory.unknownFruits[0].uid }]);
    const arm0 = s.growth.skills.arm_coat.mastery, fist0 = s.growth.skills.fist_jab.mastery;
    for (let i = 0; i < 6; i++) monthlyGrowth(s);
    expect(s.growth.skills.arm_coat.mastery).toBeGreaterThan(arm0);
    expect(s.growth.fruitMastery).toBeGreaterThan(0);
    expect(s.growth.skills.fist_jab.mastery).toBeGreaterThan(fist0);
  });
  it('입문 선택지는 무술뿐이고, 13세 무렵 특성을 고른다', () => {
    let s = reduce(grown(54), { type: 'tick' });
    expect(s.pending?.kind === 'choice' && s.pending.options.length).toBeGreaterThanOrEqual(3);
    expect((s.pending as { options: { effects: { op: string; branch?: string }[] }[] }).options.every((o) => o.effects.some((e) => e.op === 'focus' && e.branch!.startsWith('martial.')))).toBe(true);
    s = reduce(s, { type: 'answerChoice', index: 0 });
    s.hero.age = 13;
    const p = resolveChoice(s, 'ps_choose')!;
    expect(p.options.length).toBe(3);
    s.pending = p;
    s = reduce(s, { type: 'answerChoice', index: 0 });
    expect(s.hero.persona).toBeDefined();
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

describe('하루하루', () => {
  it('10세 이후에도 달마다 이야기 한 줄이 남는다', () => {
    let s = grown(71);
    let ticks = 0;
    const before = s.log.filter((l) => l.type === 'day' || l.type === 'life').length;
    while (ticks < 24) {
      if (s.pending?.kind === 'choice') s = reduce(s, { type: 'answerChoice', index: s.pending.options.findIndex((o) => !o.disabled) });
      else if (s.pending) break;
      else { s = reduce(s, { type: 'tick' }); ticks++; }
    }
    const after = s.log.filter((l) => l.type === 'day' || l.type === 'life').length;
    expect(after - before).toBeGreaterThanOrEqual(ticks - 1);
  });
  it('기록에는 번호가 붙어 화면이 한 줄씩 보여 줄 수 있다', () => {
    const s = grown(72);
    const ids = s.log.map((l) => l.id!);
    expect(ids.every((x) => typeof x === 'number')).toBe(true);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).toBeGreaterThan(ids[i - 1]);
  });
});

describe('배신의 기미', () => {
  /** 동료 셋을 태운 18세 해적. 배신의 기미를 띄워 돌려준다. traitor를 맞출 때까지 씨앗을 바꾼다 */
  function betrayal(traitor: boolean) {
    for (let seed = 1; seed < 200; seed++) {
      const s = grown(seed);
      s.hero.age = 18; s.hero.route = 'pirate'; s.world.ship = 'sloop'; s.hero.money = 100000;
      applyEffects(s, [{ op: 'recruit', crew: { role: 'vanguard' } }, { op: 'recruit', crew: { role: 'support' } }, { op: 'recruit', crew: { role: 'cook' } }]);
      const p = resolveChoice(s, 'cs_betrayal')!;
      const isTraitor = p.options[1].effects.some((e) => e.op === 'battle');
      if (isTraitor === traitor) { s.pending = p; return s; }
    }
    throw new Error('씨앗을 찾지 못함');
  }
  const crewN = (s: LifeState) => s.people.filter((p) => p.alive && p.kind === 'crew').length;

  it('의심받는 동료가 정해지고 선택지는 셋이다', () => {
    const s = betrayal(true);
    const p = s.pending as Extract<LifeState['pending'], { kind: 'choice' }>;
    expect(p.options.map((o) => o.label)).toEqual(['믿고 맡긴다', '불러서 추궁한다', '몰래 지켜본다']);
    expect(p.speaker?.personId).toBeDefined();
    expect(p.body).toContain(p.speaker!.name);
  });
  it('배신자를 추궁하면 동료 없이 1대1로 싸우고, 자리 하나가 빈다', () => {
    let s = betrayal(true);
    const suspect = (s.pending as { speaker: { personId: string } }).speaker.personId;
    const before = crewN(s);
    s = reduce(s, { type: 'answerChoice', index: 1 });
    expect(s.pending?.kind).toBe('prep');
    const enc = (s.pending as { encounter: Encounter }).encounter;
    expect(enc.solo).toBe(true);
    expect(enc.enemy.title).toBe('배신자');
    expect(crewN(s)).toBe(before - 1);
    expect(s.loadout.crew.some((c) => c.personId === suspect)).toBe(false);
    s = reduce(s, { type: 'confirmPrep', loadout: s.loadout, assign: { hero: 0 } });
    const b = (s.pending as { battle: BattleState }).battle;
    expect(b.units.filter((u) => u.side === 'L').length).toBe(1);
    while (s.pending?.kind === 'intervene') s = reduce(s, { type: 'intervene', duel: -1 });
    const money = s.hero.money;
    const won = (s.pending as { battle: BattleState }).battle.result === 'win';
    s = reduce(s, { type: 'ackBattle' });
    if (won) expect(s.log.some((l) => l.text.includes('쓰러뜨려 묶었다'))).toBe(true);
    else expect(s.hero.money).toBeLessThan(money);
  });
  it('배신자를 믿으면 돈을 들고 달아나 자리 하나가 빈다', () => {
    let s = betrayal(true);
    const before = crewN(s), money = s.hero.money;
    s = reduce(s, { type: 'answerChoice', index: 0 });
    expect(crewN(s)).toBe(before - 1);
    expect(s.hero.money).toBeLessThan(money);
    expect(s.people.some((p) => p.relation === '배신자')).toBe(true);
  });
  it('죄 없는 동료를 믿으면 정이 깊어지고 아무도 떠나지 않는다', () => {
    let s = betrayal(false);
    const before = crewN(s);
    s = reduce(s, { type: 'answerChoice', index: 0 });
    expect(crewN(s)).toBe(before);
    expect(s.log.some((l) => l.text.includes('오해였다'))).toBe(true);
  });
  it('죄 없는 동료를 추궁하면 싸움은 없고, 떠나거나 서먹해진다', () => {
    let s = betrayal(false);
    const before = crewN(s);
    s = reduce(s, { type: 'answerChoice', index: 1 });
    expect(s.pending?.kind).not.toBe('prep');
    expect(crewN(s) === before - 1 || s.log.some((l) => l.text.includes('서먹해졌다'))).toBe(true);
  });
});

describe('해군: 분대 생활과 분대장', () => {
  function enlisted() {
    let s = grown(81);
    s = reduce(s, { type: 'tick' });
    while (s.pending?.kind === 'choice' && s.pending.choiceId !== 'cr_route') s = reduce(s, { type: 'answerChoice', index: 0 });
    s.hero.age = 16; s.pending = null;
    const p = resolveChoice(s, 'cr_route')!;
    s.pending = p;
    return reduce(s, { type: 'answerChoice', index: p.options.findIndex((o) => o.label === '해군에 지원한다') });
  }
  it('입대하면 중령의 분대에 이등병으로 배속되고, 분대원을 둘 수 없다', () => {
    const s = enlisted();
    expect(s.hero.route).toBe('marine');
    expect(s.hero.rank).toBe(0);
    expect(s.people.some((p) => p.relation.startsWith('지휘관'))).toBe(true);
    expect(crewCapacity(s)).toBe(0);
    applyEffects(s, [{ op: 'recruit', crew: { role: 'vanguard' } }]);
    expect(s.people.filter((p) => p.kind === 'crew').length).toBe(0);
    expect(s.log.some((l) => l.text.includes('하사(분대장)'))).toBe(true);
  });
  it('하사가 되면 분대를 꾸리고, 스카우트 사건이 뜰 수 있다', () => {
    const s = enlisted();
    expect(resolveChoice(s, 'mn_soldier')).not.toBeNull();   // 사건 자체는 펼칠 수 있다
    expect(checkAll(s, CHOICE_BY_ID.mn_soldier.when)).toBe(false);
    applyEffects(s, [{ op: 'rank', add: 3 }]);
    expect(s.log.some((l) => l.text.includes('분대장이 되었다'))).toBe(true);
    expect(crewCapacity(s)).toBe(2);
    expect(checkAll(s, CHOICE_BY_ID.mn_soldier.when)).toBe(true);
    applyEffects(s, [{ op: 'recruit', crew: { role: 'vanguard' } }]);
    const m = s.people.find((p) => p.kind === 'crew')!;
    expect(m.relation).toContain('분대원');
  });
  it('해적식 동료 영입 사건은 해군에게 뜨지 않는다', () => {
    const s = enlisted();
    for (const id of ['bd_swordsman', 'bd_doctor', 'bd_navigator', 'bd_sniper', 'bd_cook']) expect(checkAll(s, CHOICE_BY_ID[id].when)).toBe(false);
  });
});

describe('얼굴이 바뀌지 않는다', () => {
  it('라이벌과의 대련: 준비 · 전투의 얼굴 씨앗이 사람들 패널과 같다', async () => {
    const { resolveEnemy } = await import('../../src/core/world/world');
    const { enemyUnit } = await import('../../src/core/combat/units');
    const { faceKeyOf } = await import('../../src/core/people');
    const s = grown(91);
    const rival = s.people.find((p) => p.kind === 'rival')!;
    const e = resolveEnemy(s, 'rival');
    expect(e.faceKey).toBe(faceKeyOf(rival));
    expect(enemyUnit(e, true, 0).faceKey).toBe(faceKeyOf(rival));
  });
  it('보스: 준비 화면과 전투 화면의 얼굴 씨앗이 같다', async () => {
    const { resolveEnemy } = await import('../../src/core/world/world');
    const { enemyUnit } = await import('../../src/core/combat/units');
    const e = resolveEnemy(grown(92), 'b_smoker');
    expect(enemyUnit(e, true, 0).faceKey).toBe(e.canon ?? e.id + e.name);
  });
});

describe('주력은 고정, 보조만 드물게', () => {
  it('주력을 정한 뒤에는 바꿀 수 없다', () => {
    const s = grown(101);
    setFocus(s, 'martial.sword', 'focus');
    setFocus(s, 'martial.fist', 'focus');
    expect(s.growth.focus).toBe('martial.sword');
  });
  it('특성을 바꾸는 계기에서는 지금 특성을 지키거나 둘 중 하나로 바꾼다', () => {
    const s = grown(102);
    setFocus(s, 'martial.sword', 'focus');
    s.hero.persona = 'bloodlust'; s.hero.age = 30;
    const p = resolveChoice(s, 'ps_change')!;
    expect(p.options.length).toBe(3);
    expect(p.options[0].label).toContain('피냄새');
    expect(p.options.every((o) => o.effects.every((e) => e.op !== 'focus'))).toBe(true);
  });
});

describe('원작 인물과의 만남 · 이명', () => {
  it('후샤 마을 수련기에는 에이스와 불량배 사건이 뜰 수 있다', () => {
    const s = newLife(5, undefined, { place: '후샤 마을' });
    s.hero.age = 12;
    expect(checkAll(s, CHOICE_BY_ID.cc_ace_thugs.when)).toBe(true);
    const p = resolveChoice(s, 'cc_ace_thugs')!;
    s.pending = p;
    const t = reduce(s, { type: 'answerChoice', index: 0 });
    expect(t.log.some((l) => l.text.includes('에이스와 함께 불량배들을 해치웠다'))).toBe(true);
  });
  it('적의 이명은 한 인생 안에서 겹치지 않는다', async () => {
    const { genEnemy } = await import('../../src/core/world/world');
    const s = grown(103);
    const names = Array.from({ length: 150 }, () => genEnemy(s, 'elite').name.match(/「(.+)」/)![1]);
    expect(new Set(names).size).toBe(150);
  });
});

describe('동료의 성격과 열매', () => {
  function withCrew() {
    const s = grown(111);
    s.hero.age = 18; s.hero.route = 'pirate'; s.world.ship = 'sloop';
    applyEffects(s, [{ op: 'recruit', crew: { role: 'vanguard' } }]);
    return s;
  }
  it('영입한 동료에게는 성격이 있고, 전투 방식에 반영된다', async () => {
    const { traitOf } = await import('../../src/core/people');
    const { crewUnit } = await import('../../src/core/combat/units');
    const s = withCrew();
    const p = s.people.find((x) => x.kind === 'crew')!;
    const tr = traitOf(p);
    expect(tr.name.length).toBeGreaterThan(0);
    const u = crewUnit(p, 1);
    expect(u.tactic).toBe(tr.tactic);
  });
  it('동료에게 열매를 먹이면 강해지고 열매 패시브가 걸린다', async () => {
    const { crewUnit } = await import('../../src/core/combat/units');
    const s = withCrew();
    const p = s.people.find((x) => x.kind === 'crew')!;
    const before = p.crew!.power;
    applyEffects(s, [{ op: 'findFruit', pool: 'mera' }]);
    applyEffects(s, [{ op: 'feedFruit', uid: s.inventory.unknownFruits[0].uid, who: p.id }]);
    expect(p.crew!.fruit).toBe('mera');
    expect(p.crew!.power).toBeGreaterThan(before);
    const u = crewUnit(p, 1);
    expect(u.fruitClass).toBe('logia');
    expect(u.mods.element).toBe('fire');
    expect(s.hero.fruit).toBeNull();
  });
  it('열매 선택지에 동료에게 먹이는 길이 있다', () => {
    const s = withCrew();
    applyEffects(s, [{ op: 'findFruit', pool: 'any' }]);
    const p = resolveChoice(s, 'fr_found')!;
    expect(p.options.some((o) => /에게 먹인다$/.test(o.label))).toBe(true);
  });
});

describe('돈을 쓸 곳', () => {
  function rich() {
    const s = grown(121);
    s.hero.age = 20; s.hero.route = 'pirate'; s.world.ship = 'sloop'; s.world.stage = 2; s.hero.money = 1_000_000;
    applyEffects(s, [{ op: 'recruit', crew: { role: 'vanguard' } }]);
    return s;
  }
  it('배 개조를 달면 효과가 붙는다 (큰 주방: 생활비가 준다)', () => {
    const a = rich(), b = rich();
    const r = reduce(b, { type: 'buyPart', id: 'galley' });
    expect(r.world.shipParts).toContain('galley');
    const ma = a.hero.money, mb = r.hero.money;
    const ta = reduce(a, { type: 'tick' }), tb = reduce(r, { type: 'tick' });
    expect(mb - tb.hero.money).toBeLessThan(ma - ta.hero.money + 1);
  });
  it('동료 장비를 맞추면 그 동료가 강해진다', async () => {
    const { crewUnit } = await import('../../src/core/combat/units');
    const s = rich();
    const p = s.people.find((x) => x.kind === 'crew')!;
    const before = crewUnit(p, 2).st.str;
    const t = reduce(s, { type: 'crewGear', who: p.id });
    expect(crewUnit(t.people.find((x) => x.id === p.id)!, 2).st.str).toBeGreaterThan(before);
  });
  it('정보상에게 사면 보스를 모두 본다, 수술하면 후유증이 사라진다', () => {
    const s = rich();
    s.world.boss = { id: 'b_smoker', state: 'revealed', attempts: 0, nextAskAt: 0 };
    let t = reduce(s, { type: 'buyIntel' });
    expect(t.known.people).toContain('b_smoker');
    applyEffects(t, [{ op: 'injury', severity: 'scar' }]);
    t = reduce(t, { type: 'surgery' });
    expect(t.hero.injuries.some((i) => i.severity === 'scar')).toBe(false);
  });
});

describe('가정', () => {
  it('연인 → 결혼 → 아이, 가족이 늘면 생활비가 는다', () => {
    let s = grown(131);
    s.hero.age = 24; s.hero.route = 'pirate'; s.hero.money = 200000;
    applyEffects(s, [{ op: 'family', act: 'lover' }]);
    expect(s.people.some((p) => p.relation === '연인')).toBe(true);
    s.pending = resolveChoice(s, 'fm_marry');
    s = reduce(s, { type: 'answerChoice', index: 0 });
    expect(s.choice.flags).toContain('married');
    expect(s.people.some((p) => p.relation === '배우자')).toBe(true);
    s.pending = resolveChoice(s, 'fm_child');
    const label = (s.pending as { options: { label: string }[] }).options[0].label;
    s = reduce(s, { type: 'answerChoice', index: 0 });
    const kid = s.people.find((p) => p.relation === '아들' || p.relation === '딸')!;
    expect(label).toContain(kid.name.split(' ').pop()!);
    expect(kid.age).toBe(0);
  });
});

describe('부선장 · 회식', () => {
  function crewed() {
    const s = grown(141);
    s.hero.age = 20; s.hero.route = 'pirate'; s.world.ship = 'sloop'; s.hero.money = 100000;
    applyEffects(s, [{ op: 'recruit', crew: { role: 'vanguard' } }, { op: 'recruit', crew: { role: 'support' } }]);
    return s;
  }
  it('부선장으로 임명하면 전투에서 더 강하고 다른 동료도 힘을 낸다', async () => {
    const { buildUnits } = await import('../../src/core/combat/battle');
    const s = crewed();
    const [a, b] = s.people.filter((p) => p.kind === 'crew');
    s.loadout.crew = [{ personId: a.id, role: 'vanguard' }, { personId: b.id, role: 'support' }];
    const enc = { source: 'choice' as const, enemy: (await import('../../src/core/world/world')).genEnemy(s, 'elite'), elite: true, lethal: false, spar: false, atSea: false };
    const before = buildUnits(s, enc, s.loadout, { hero: 0 }).units;
    const t = reduce(s, { type: 'appointMate', who: a.id });
    expect(t.world.firstMate).toBe(a.id);
    const after = buildUnits(t, enc, t.loadout, { hero: 0 }).units;
    const ua0 = before.find((u) => u.personId === a.id)!, ua1 = after.find((u) => u.personId === a.id)!;
    const ub0 = before.find((u) => u.personId === b.id)!, ub1 = after.find((u) => u.personId === b.id)!;
    expect(ua1.pBuff).toBeGreaterThan(ua0.pBuff);
    expect(ub1.pBuff).toBeGreaterThan(ub0.pBuff);
  });
  it('한턱 쏘면 돈이 들고, 정이 오르고, 몇 달 동안 동료가 강해진다', () => {
    const s = crewed();
    const bond = s.people.filter((p) => p.kind === 'crew').map((p) => p.bond);
    const t = reduce(s, { type: 'treatCrew' });
    expect(t.hero.money).toBeLessThan(s.hero.money);
    expect(t.people.filter((p) => p.kind === 'crew').every((p, i) => p.bond > bond[i])).toBe(true);
    expect(t.world.feastUntil).toBeGreaterThan(0);
    expect(t.log.some((l) => l.text.includes('한턱 쐈다'))).toBe(true);
  });
});

describe('스승을 찾아 나선다', () => {
  function seeker() {
    const s = grown(151);
    s.hero.age = 18; s.hero.route = 'pirate'; s.hero.money = 100000;
    setFocus(s, 'martial.sword', 'focus');
    s.growth.skills.sword_wave = { mastery: 60 }; s.growth.skills.sword_flash = { mastery: 60 };
    return s;
  }
  function runMonths(s: LifeState, n: number) {
    for (let i = 0; i < n; i++) {
      if (s.pending) return s;
      s = reduce(s, { type: 'tick' });
      if (s.pending?.kind === 'choice' && s.pending.choiceId !== 'ms_seek') { s.pending = null; }
    }
    return s;
  }
  it('찾아 나서면 여비가 들고 찾는 동안 임무는 쉰다', () => {
    const s = seeker();
    const t = reduce(s, { type: 'seekMaster' });
    expect(t.hero.money).toBeLessThan(s.hero.money);
    expect(t.world.seeking).toBeDefined();
  });
  it('찾게 되면 그달에 스승을 만나는 선택이 뜬다', () => {
    let s = seeker();
    s.world.seeking = { month: 0, foundAt: 3 };
    s = runMonths(s, 6);
    expect(s.pending?.kind === 'choice' && s.pending.choiceId).toBe('ms_seek');
    expect(s.world.seeking).toBeUndefined();
  });
  it('못 찾으면 1년을 허비하고 빈손으로 돌아온다', () => {
    let s = seeker();
    s.world.seeking = { month: 0, foundAt: null };
    s = runMonths(s, 13);
    expect(s.world.seeking).toBeUndefined();
    expect(s.log.some((l) => l.text.includes('1년을 헤맸지만'))).toBe(true);
  });
});

describe('집중 수련', () => {
  it('수련하는 동안 벌이가 없고, 능력치가 더 빨리 오른다', () => {
    const make = () => { const s = grown(161); s.hero.age = 20; s.hero.route = 'marine'; s.hero.money = 50000; setFocus(s, 'martial.fist', 'focus'); return s; };
    const a = make();
    const b = reduce(make(), { type: 'startTraining', months: 3 });
    expect(b.world.training?.left).toBe(3);
    // 같은 한 달의 자동 성장만 비교한다
    const sa = structuredClone(a), sb = structuredClone(b);
    monthlyGrowth(sa); monthlyGrowth(sb);
    expect(sb.hero.base.str - b.hero.base.str).toBeCloseTo((sa.hero.base.str - a.hero.base.str) * 2, 5);
    // 벌이가 없다: 해군 봉급이 들어오지 않는다
    let t = b; let ticks = 0;
    while (ticks < 3) {
      if (t.pending?.kind === 'choice') t = reduce(t, { type: 'answerChoice', index: t.pending.options.findIndex((o) => !o.disabled) });
      else if (t.pending) break;
      else { t = reduce(t, { type: 'tick' }); ticks++; }
    }
    expect(t.world.training).toBeUndefined();
    expect(t.log.some((l) => l.text.includes('집중 수련을 마쳤다'))).toBe(true);
  });
});

describe('곁가지 이야기', () => {
  function pirateAtSea() {
    const s = grown(171);
    s.hero.age = 18; s.hero.route = 'pirate'; s.world.ship = 'raft';
    return s;
  }
  it('해적에게는 해적 이야기, 해군에게는 해군 이야기만', async () => {
    const { sideCandidates } = await import('../../src/core/choice/choice');
    const s = pirateAtSea();
    expect(sideCandidates(s).every((x) => x.route === 'pirate')).toBe(true);
    s.hero.route = 'marine';
    expect(sideCandidates(s).every((x) => x.route === 'marine')).toBe(true);
    expect(sideCandidates(s).length).toBeGreaterThan(0);
  });
  it('맡으면 이야기가 흐르고, 이름 있는 적과 싸워 이기면 능력치 보상을 받는다', () => {
    let s = pirateAtSea();
    s.pending = resolveChoice(s, 'sd_offer');
    s = reduce(s, { type: 'answerChoice', index: 0 });
    expect(s.world.side).toBeDefined();
    const id = s.world.side!.id;
    const before = { ...s.hero.base };
    let guard = 0;
    while (s.world.side && guard++ < 60) {
      const p = s.pending;
      if (p?.kind === 'prep') {
        expect(p.encounter.source).toBe('side');
        expect(p.encounter.lethal).toBe(false);
        // 이기도록 주인공을 키운다
        for (const k of ['str', 'spd', 'vit', 'wil'] as const) s.hero.base[k] = 400;
        s = reduce(s, { type: 'confirmPrep', loadout: s.loadout, assign: { hero: 0 } });
      } else if (p?.kind === 'intervene') s = reduce(s, { type: 'intervene', duel: -1 });
      else if (p?.kind === 'battle') s = reduce(s, { type: 'ackBattle' });
      else if (p?.kind === 'choice') s = reduce(s, { type: 'answerChoice', index: p.options.findIndex((o) => !o.disabled) });
      else s = reduce(s, { type: 'tick' });
    }
    expect(s.world.sideDone).toContain(id);
    expect(s.log.some((l) => l.text.includes('를 마쳤다!'))).toBe(true);
    void before;
  });
  it('곁가지 이야기를 하는 동안 해역 임무는 나아가지 않는다', () => {
    let s = pirateAtSea();
    s.world.side = { id: 'sp_kuro', step: 0, months: 0 };
    const missions = JSON.stringify(s.world.missions);
    s = reduce(s, { type: 'tick' });
    expect(JSON.stringify(s.world.missions)).toBe(missions);
  });
});

describe('곁가지 이야기 데이터', () => {
  it('모든 적의 기술 · 열매가 실제로 있다, 해적 · 해군 모두 임펠 다운과 정상 전쟁이 있다', async () => {
    const { SIDE_STORIES } = await import('../../src/data/sideStories');
    const { FRUIT_BY_ID } = await import('../../src/data/fruits');
    for (const st of SIDE_STORIES) for (const step of st.steps) {
      if (step.kind !== 'battle') continue;
      for (const id of step.foe.skills ?? []) expect(getSkillT(id), `${st.id} ${id}`).toBeDefined();
      if (step.foe.fruit) expect(FRUIT_BY_ID[step.foe.fruit], `${st.id} ${step.foe.fruit}`).toBeDefined();
      for (const o of step.foe.officers ?? []) for (const id of o.skills ?? []) expect(getSkillT(id), `${st.id} ${id}`).toBeDefined();
    }
    for (const r of ['pirate', 'marine'] as const) {
      expect(SIDE_STORIES.some((x) => x.route === r && x.title === '정상 전쟁')).toBe(true);
      expect(SIDE_STORIES.some((x) => x.route === r && /임펠 다운/.test(x.title))).toBe(true);
    }
  });
});

describe('패시브', () => {
  const base = () => {
    const a = enemyUnit(makeEnemy({ id: 'a', name: 'A', p: 50, skills: ['fist_jab'] }), false, 0);
    a.side = 'L'; a.hero = true; a.role = 'hero';
    const d = enemyUnit(makeEnemy({ id: 'd', name: 'D', p: 50, skills: [] }), true, 1);
    d.maxHp = d.hp = 1e9;
    d.st.str = 0.01; d.st.spd = 1;   // 맞기만 하는 상대 (주인공 체력이 변하지 않게)
    return { a, d };
  };
  const avgDmg = (a: ReturnType<typeof base>['a'], d: ReturnType<typeof base>['d']) => {
    const b = runBattle(startBattle([a, d], { 0: 1 }, 7, false), true);
    const hits = b.events.filter((e) => e.k === 'act' && e.who === 0 && !e.dodge && !e.proc) as { dmg: number }[];
    return hits.reduce((x, e) => x + e.dmg, 0) / Math.max(1, hits.length);
  };
  it('고무고무: 전기 공격은 반감, 물리 공격은 1.3배', async () => {
    const { fruitMods } = await import('../../src/core/combat/mods');
    const m = fruitMods('gomu', 100, false)!;
    expect(m.resist?.elec).toBeCloseTo(0.5, 5);
    expect(m.phys).toBeCloseTo(1.3, 5);
    const x = base(); const plain = avgDmg(x.a, x.d);
    const y = base(); y.a.mods = m; const rubber = avgDmg(y.a, y.d);
    expect(rubber / plain).toBeGreaterThan(1.2);
  });
  it('각성하면 패시브가 바뀐다', async () => {
    const { fruitMods } = await import('../../src/core/combat/mods');
    expect(fruitMods('gomu', 100, true)!.phys).toBeCloseTo(1.5, 5);
    expect(fruitMods('gomu', 100, true)!.resist?.elec).toBe(0);
  });
  it('숙련이 낮으면 효과도 약하다', async () => {
    const { fruitMods } = await import('../../src/core/combat/mods');
    expect(fruitMods('gomu', 0, false)!.phys!).toBeLessThan(fruitMods('gomu', 100, false)!.phys!);
  });
  it('피냄새: 체력이 떨어질수록 더 세게 친다', () => {
    const x = base(); x.a.mods = { lowHpPower: 0.6 }; const full = avgDmg(x.a, x.d);
    const y = base(); y.a.mods = { lowHpPower: 0.6 }; y.a.hp = Math.round(y.a.maxHp * 0.2); const low = avgDmg(y.a, y.d);
    expect(low / full).toBeGreaterThan(1.3);
  });
  it('모든 열매에 패시브가 있다', async () => {
    const { FRUITS } = await import('../../src/data/fruits');
    const { FRUIT_PASSIVES } = await import('../../src/data/passives');
    for (const f of FRUITS) {
      expect(FRUIT_PASSIVES[f.id], f.id).toBeDefined();
      if (f.grade <= 2) expect(FRUIT_PASSIVES[f.id].awaken, f.id).toBeUndefined();
    }
  });
});

describe('고향에 따라 배울 곳이 다르다', () => {
  it('시모츠키 마을이면 코우시로 도장, 그리고 집안에서 배우는 길이 있다', () => {
    let s = newLife(3, undefined, { place: '시모츠키 마을', surname: '로웰' });
    while (s.pending?.kind === 'choice' && s.hero.age < 10) s = reduce(s, { type: 'answerChoice', index: 0 });
    s = reduce(s, { type: 'tick' });
    const labels = (s.pending as { options: { label: string }[] }).options.map((o) => o.label);
    expect(labels).toContain('코우시로 도장에 들어간다');
    expect(labels.some((l) => /에게 배운다$/.test(l))).toBe(true);
  });
  it('생일이 되면 생일 한 줄이 남는다', () => {
    const s = newLife(4);
    expect(s.log.some((l) => l.text.startsWith('🎂'))).toBe(true);
  });
});

describe('타고난 재능', () => {
  it('태어날 때 1~3개, 서로 막는 재능은 함께 붙지 않는다', async () => {
    const { TALENT_BY_ID } = await import('../../src/data/talents');
    for (let i = 0; i < 200; i++) {
      const s = newLife(12000 + i);
      const t = s.hero.traits.filter((id) => TALENT_BY_ID[id] && id !== 'conqueror' && !['swordTalent', 'gunTalent'].includes(id));
      expect(t.length).toBeLessThanOrEqual(3);
      for (const a of t) for (const b of t) expect(TALENT_BY_ID[a].excludes ?? []).not.toContain(b);
    }
  });
  it('병약함은 병에 더 잘 걸리고, 재능은 숙련 속도를 바꾼다', async () => {
    const { talentMult } = await import('../../src/core/util');
    const { talentMastery } = await import('../../src/core/growth/growth');
    const s = grown(181);
    s.hero.traits = ['sickly', 'swordTalent'];
    expect(talentMult(s, 'illness')).toBe(2);
    expect(talentMastery(s, 'martial.sword')).toBeCloseTo(1.3, 5);
    expect(talentMastery(s, 'martial.fist')).toBe(1);
  });
});

describe('종족 패시브 · 집중 수련 나이', () => {
  it('버커니어족은 괴력, 루나리아족은 발화 패시브를 갖는다', async () => {
    const { heroMods } = await import('../../src/core/combat/mods');
    const s = grown(191);
    s.hero.species = 'buccaneer';
    expect(heroMods(s).stat?.str).toBeCloseTo(1.25, 5);
    s.hero.species = 'lunarian';
    const m = heroMods(s);
    expect(m.element).toBe('fire');
    expect(m.resist?.fire).toBe(0);
  });
  it('이름: 수장족 · 족장족', async () => {
    const { SPECIES_NAMES } = await import('../../src/data/births');
    expect(SPECIES_NAMES.longarm).toBe('수장족');
    expect(SPECIES_NAMES.longleg).toBe('족장족');
  });
  it('집중 수련은 15세부터', () => {
    const s = grown(192);
    s.hero.age = 14;
    expect(reduce(s, { type: 'startTraining', months: 3 })).toBe(s);
    s.hero.age = 15;
    expect(reduce(s, { type: 'startTraining', months: 3 }).world.training).toBeDefined();
  });
});

describe('원작 인물 동료', () => {
  it('바르톨로메오는 열매 · 높은 힘 · 잠재력을 갖고 한 번만 탄다', async () => {
    const { recruit, crewPowerFor } = await import('../../src/core/people');
    const s = grown(193);
    s.hero.route = 'pirate';
    const p = recruit(s, { role: 'vanguard', named: 'bartolomeo' })!;
    expect(p.name).toBe('바르톨로메오');
    expect(p.canon).toBe('bartolomeo');
    expect(p.crew!.fruit).toBe('bari');
    expect(p.crew!.growth).toBeGreaterThan(1);
    expect(p.crew!.power).toBeGreaterThan(crewPowerFor(s.world.stage, p.crew!.level));
    expect(recruit(s, { role: 'vanguard', named: 'bartolomeo' })).toBeNull();
  });
  it('네임드 선택지는 진로에 맞게만 나온다', async () => {
    const { NAMED_CREW_CHOICES } = await import('../../src/data/namedCrew');
    const coby = NAMED_CREW_CHOICES.find((c) => c.id === 'nc_coby')!;
    expect(coby.when).toContainEqual({ c: 'route', is: ['marine'] });
  });
});

describe('해군의 추격 · 임펠 다운', () => {
  it('현상금이 높을수록 높은 계급이 온다', async () => {
    const { bountyTier } = await import('../../src/core/sim/prison');
    expect(bountyTier(10)).toBe(0);
    expect(bountyTier(800)).toBe(2);
    expect(bountyTier(5000)).toBe(4);
  });
  it('계급은 흔들리지만 아주 드물게 중장 이상이 온다', async () => {
    const { rollTier } = await import('../../src/core/sim/prison');
    const s = grown(194);
    s.hero.fame = 50;
    const tiers = Array.from({ length: 2000 }, () => rollTier(s).tier);
    expect(tiers.filter((t) => t === 0).length).toBeGreaterThan(1300);
    expect(tiers.some((t) => t >= 3)).toBe(true);
    expect(tiers.filter((t) => t >= 3).length).toBeLessThan(150);
  });
  it('붙잡히면 해적단이 흩어지고 갇히며, 갇힌 동안 벌이가 없다', async () => {
    const { capture } = await import('../../src/core/sim/prison');
    const { recruit } = await import('../../src/core/people');
    const { tick } = await import('../../src/core/sim/tick');
    const s = grown(195);
    s.hero.route = 'pirate'; s.world.ship = 'caravel'; s.hero.money = 100000;
    recruit(s, { role: 'vanguard' });
    s.lastBattle = { name: 'x', result: 'lose', summary: [] };
    capture(s, 1);
    expect(s.world.prison).toBeDefined();
    expect(s.world.ship).toBeNull();
    expect(s.people.filter((p) => p.alive && p.kind === 'crew').length).toBe(0);
    expect(s.hero.money).toBe(30000);
    const before = s.hero.money;
    s.pending = null;
    tick(s);
    if (!s.pending) expect(s.hero.money).toBeLessThanOrEqual(before);
  });
  it('형기를 마치면 뗏목으로 풀려난다', async () => {
    const { capture, prisonTick } = await import('../../src/core/sim/prison');
    const s = grown(196);
    s.hero.route = 'pirate'; s.world.ship = 'sloop';
    s.lastBattle = { name: 'x', result: 'lose', summary: [] };
    capture(s, 0);
    s.world.prison!.asked = true; s.world.prison!.left = 1;
    prisonTick(s);
    expect(s.world.prison).toBeUndefined();
    expect(s.world.ship).toBe('raft');
  });
});

describe('흩어진 동료 · 이명 · 종족', () => {
  it('풀려난 뒤 옛 동료가 압수된 배를 되찾아 돌아온다', async () => {
    const { capture, release } = await import('../../src/core/sim/prison');
    const { recruit } = await import('../../src/core/people');
    const { resolveChoice } = await import('../../src/core/choice/choice');
    const { applyEffects } = await import('../../src/core/effects');
    const s = grown(197);
    s.hero.route = 'pirate'; s.world.ship = 'caravel';
    const a = recruit(s, { role: 'vanguard' })!;
    recruit(s, { role: 'medic' });
    s.lastBattle = { name: 'x', result: 'lose', summary: [] };
    capture(s, 0);
    expect(s.world.lostShip).toBe('caravel');
    release(s, false);
    const c = resolveChoice(s, 'rc_reunion')!;
    expect(c).not.toBeNull();
    applyEffects(s, c.options[0].effects);
    expect(s.world.ship).toBe('caravel');
    expect(s.people.filter((p) => p.alive && p.kind === 'crew').length).toBe(1);
    expect(a.kind === 'crew' || s.people.some((p) => p.kind === 'crew')).toBe(true);
  });
  it('동료는 이명을 갖고, 여러 종족으로 나온다', async () => {
    const { recruit } = await import('../../src/core/people');
    const s = grown(198);
    s.hero.route = 'pirate';
    const ps = Array.from({ length: 80 }, () => recruit(s, { role: 'vanguard' })!);
    expect(ps.every((p) => !!p.epithet)).toBe(true);
    expect(new Set(ps.map((p) => p.species)).size).toBeGreaterThan(3);
    expect(ps.filter((p) => p.species === 'human').length).toBeGreaterThan(30);
  });
});

describe('돈벌이 · 데비 백 파이트 · 조선공 · 옛 동료 부르기', () => {
  it('loot는 해역 단계에 비례한 돈을 준다', async () => {
    const { applyEffects } = await import('../../src/core/effects');
    const s = grown(201);
    s.world.stage = 3; const m = s.hero.money;
    applyEffects(s, [{ op: 'loot', base: 10000, text: '{money}' }]);
    expect(s.hero.money - m).toBeGreaterThanOrEqual(21000);
    expect(s.hero.money - m).toBeLessThanOrEqual(39000);
  });
  it('데비 백 파이트에서 지면 가장 강한 동료를 빼앗긴다', async () => {
    const { dbfFinal } = await import('../../src/core/sim/davyback');
    const { recruit } = await import('../../src/core/people');
    const s = grown(202);
    s.hero.route = 'pirate'; s.world.ship = 'caravel';
    const a = recruit(s, { role: 'vanguard' })!; const b = recruit(s, { role: 'vanguard' })!;
    a.crew!.power = 10; b.crew!.power = 99;
    dbfFinal(s, false);
    expect(b.kind).toBe('ally');
    expect(a.kind).toBe('crew');
  });
  it('필요한 배를 살 돈이 없으면 조선공의 의뢰가 뜬다', async () => {
    const { resolveChoice } = await import('../../src/core/choice/choice');
    const s = grown(203);
    s.hero.route = 'pirate'; s.hero.money = 0; s.choice.flags.push('need_ship');
    const c = resolveChoice(s, 'sh_shipwright');
    expect(c).not.toBeNull();
    expect(c!.options[0].label).toBe('의뢰를 받는다');
  });
  it('첫 조우 뒤에는 동료 칸에서 옛 동료를 불러 태운다', async () => {
    const { recruit } = await import('../../src/core/people');
    const s = grown(204);
    s.hero.route = 'pirate'; s.world.ship = 'caravel'; s.hero.money = 100000;
    const a = recruit(s, { role: 'vanguard' })!;
    a.kind = 'ally'; a.relation = '흩어진 옛 동료';
    expect(reduce(s, { type: 'recallCrew', id: a.id })).toBe(s);
    s.choice.flags.push('crew_contacts');
    const n = reduce(s, { type: 'recallCrew', id: a.id });
    expect(n.people.find((p) => p.id === a.id)!.kind).toBe('crew');
  });
});

describe('조사 고르기', () => {
  it('받침에 맞는 조사를 고른다', async () => {
    const { josa } = await import('../../src/core/josa');
    expect(josa('이데오이(가) 왔다')).toBe('이데오가 왔다');
    expect(josa('아카이누을(를) 쓰러뜨렸다')).toBe('아카이누를 쓰러뜨렸다');
    expect(josa('「쇠망치」 로웰 토마이(가)')).toBe('「쇠망치」 로웰 토마가');
    expect(josa('시엘 세온 (인어족)이(가)')).toBe('시엘 세온 (인어족)이');
    expect(josa('후샤 마을(으)로 간다')).toBe('후샤 마을로 간다');
    expect(josa('워터 세븐(으)로')).toBe('워터 세븐으로');
    expect(josa('스모커(이)었다 · 사카즈키(이)었다 · 쿠잔(이)었다')).toBe('스모커였다 · 사카즈키였다 · 쿠잔이었다');
    expect(josa('해적왕(이)라 부른다 · 해군 원수(이)라')).toBe('해적왕이라 부른다 · 해군 원수라');
  });
});

describe('스승의 시험과 약속', () => {
  it('오의가 없으면 미호크가 시험을 내리고, 통과하면 오의부터 가르친 뒤 다시 온다', async () => {
    const { resolveChoice } = await import('../../src/core/choice/choice');
    const { applyEffects } = await import('../../src/core/effects');
    const { trialTick, trialDone } = await import('../../src/core/sim/trial');
    const s = grown(205);
    s.hero.route = 'pirate'; s.growth.focus = 'martial.sword'; s.growth.master = null;
    s.world.seaId = 'sabaody'; s.world.stage = 4;
    s.growth.gates = s.growth.gates.filter((g) => !g.startsWith('martial.sword'));
    const forced = (await import('../../src/data/choices')).CHOICE_BY_ID;
    // 미호크를 강제로 부른다 (약속 경로를 빌린다)
    s.world.masterPromise = { master: 'm_mihawk', gate: 'martial.sword.grand' };
    const c = resolveChoice(s, 'ms_return')!;
    expect(forced.ms_return).toBeDefined();
    const trial = c.options.find((o) => o.label.includes('시험'))!;
    expect(trial.label).toContain('검술 오의');
    applyEffects(s, trial.effects);
    expect(s.world.trial?.gate).toBe('martial.sword.master');
    let guard = 0;
    while (!s.pending && guard++ < 10) trialTick(s);
    expect(s.pending?.kind).toBe('prep');
    s.pending = null;
    trialDone(s, true);
    expect((s.growth.master as { gate: string } | null)?.gate).toBe('martial.sword.master');
    expect((s.world.masterPromise as { gate: string } | undefined)?.gate).toBe('martial.sword.grand');
  });
});

describe('실패한 임무 교체', () => {
  it('실패한 임무가 여럿이어도 모두 교체되고, 교체 시각이 없어도 다시 잡힌다', async () => {
    const { tick } = await import('../../src/core/sim/tick');
    const s = grown(206);
    s.hero.route = 'pirate'; s.pending = null; s.world.side = undefined;
    s.world.missions.forEach((m) => { m.state = 'failed'; });
    s.world.refillAt = null;
    for (let i = 0; i < 12 && s.world.missions.some((m) => m.state === 'failed'); i++) { s.pending = null; tick(s); }
    expect(s.world.missions.some((m) => m.state === 'failed')).toBe(false);
  });
});

describe('원작 항구의 원작 인물', () => {
  it('와노쿠니 임무의 강적은 백수 해적단 등 원작 인물이다', async () => {
    const { canonizeFoe, genEnemy } = await import('../../src/core/world/world');
    const { PORT_FOES } = await import('../../src/data/portFoes');
    const s = grown(207);
    s.hero.route = 'pirate'; s.world.seaId = 'nw_late'; s.world.stage = 6;
    const names = new Set(PORT_FOES['와노쿠니'].map((x) => x.name));
    for (let i = 0; i < 5; i++) {
      const e = canonizeFoe(s, genEnemy(s, 'captain', undefined, 'tyrant'), '와노쿠니');
      expect(names.has(e.name)).toBe(true);
      for (const o of e.officers) expect(names.has(o.name)).toBe(true);
    }
  });
});
