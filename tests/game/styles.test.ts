import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { heroUnit5, askFight, ackBattle } from '../../src/core/fight';
import { FOES } from '../../src/data/foes';
import { growPart, mainBranch, voyage } from '../../src/core/year';
import { apply5 } from '../../src/core/reduce';
import { profileView } from '../../src/ui/view/profile';
import type { Fx, Life5 } from '../../src/core/types';
import { COMBAT_STYLES } from '../../src/data/combat-styles';
import { STYLE_TURNINGS } from '../../src/data/turnings/style-origins';
import { checkAll } from '../../src/core/cond';
import { openTurning, answerDoor, repeatAllows } from '../../src/core/turning';
import { aggregateStyleMastery, hasLocalStyleLesson, styleTier } from '../../src/core/styles';
import { heroWho5 } from '../../src/ui/view/faces';
import { dreamMet, setDream, dreamLine } from '../../src/core/dreams';
import { shouldSave } from '../../src/app/flow';
import { power5 } from '../../src/core/power';
import { needOk } from '../../src/core/needs';

const effects = (s: ReturnType<typeof newLife5>, fx: unknown[]) => applyFx(s, fx as Fx[]);
const learn = (s: ReturnType<typeof newLife5>, style: string) => {
  effects(s, [{ op: 'beginStyle', style }]);
  for (let i = 0; i < 3; i++) growPart(s, 'work', () => 0.9);
  effects(s, [{ op: 'adoptStyle', style }]);
};

describe('인연에서 시작하는 무기술', () => {
  it('입문 선택만으로 무기를 얻지 않고 실제 연습 세 토막 뒤 창을 주력으로 삼는다', () => {
    const s = newLife5(71); s.pending = null; s.age = 16;
    effects(s, [{ op: 'beginStyle', style: 'spear' }, { op: 'adoptStyle', style: 'spear' }]);
    expect(s.hero.weapon).toBeUndefined();
    for (let i = 0; i < 3; i++) growPart(s, 'train', () => 0.9);
    effects(s, [{ op: 'adoptStyle', style: 'spear' }]);
    expect(s.hero.weapon).toBe('style_spear');
    expect(mainBranch(s)).toBe('polearm');
    expect(profileView(s).path).toContain('창술');
    const u = heroUnit5(s);
    expect(u.weapon?.branch).toBe('weapon.polearm');
    expect(u.skills.some((k) => k.id.startsWith('style:spear:'))).toBe(true);
    expect(u.skills.some((k) => k.id.startsWith('sword_'))).toBe(false);
  });

  it('검술 숙련을 새 창에 복제하지 않고 전향과 보상 재실행에서도 숙련을 보존한다', () => {
    const s = newLife5(7); s.age = 20;
    s.growth.tier.sword = 6; s.growth.mastery.sword = 90;
    learn(s, 'spear');
    const before = structuredClone(s.growth);
    effects(s, [{ op: 'beginStyle', style: 'spear' }, { op: 'adoptStyle', style: 'spear' }]);
    expect(s.growth).toEqual(before);
    expect(s.growth.tier.polearm).toBe(1);
    expect(s.growth.tier.sword).toBe(6);
    expect(heroUnit5(s).skills.some((k) => /sword_|style:spear:[2-6]/.test(k.id))).toBe(false);
  });

  it('해머를 익히면 둔기 기술을 쓰고 배운 다른 유파로만 전향한다', () => {
    const s = newLife5(9); s.age = 20; s.pending = null;
    learn(s, 'hammer');
    expect(mainBranch(s)).toBe('blunt');
    expect(heroUnit5(s).skills.some((k) => k.id.startsWith('style:hammer:'))).toBe(true);
    const old = s.hero.weapon;
    apply5(s, { type: 'style', style: 'spear' });
    expect(s.hero.weapon).toBe(old);
    learn(s, 'spear');
    apply5(s, { type: 'style', style: 'hammer' });
    expect(s.hero.weapon).toBe('style_hammer');
    expect(mainBranch(s)).toBe('blunt');
  });

  it('旧 저장의 강철창은 검술과 분리하며 저장을 다시 읽어도 성장치를 복제하지 않는다', () => {
    const old = newLife5(6); old.hero.weapon = 'sp2'; old.growth.tier.sword = 4;
    delete (old.growth as Partial<typeof old.growth>).styleMastery;
    const once = normalizeLife5(JSON.parse(JSON.stringify(old)))!;
    expect(once).not.toBeNull();
    expect(once.growth.tier.polearm).toBe(1);
    expect(once.growth.tier.sword).toBe(4);
    expect(mainBranch(once)).toBe('polearm');
    const twice = normalizeLife5(JSON.parse(JSON.stringify(once)))!;
    expect(twice.growth).toEqual(once.growth);
  });

  it('같은 무기술의 새 유파도 숙련을 빌리지 않고 실제 수련만 해당 유파에 더한다', () => {
    const s = newLife5(5); s.age = 22;
    learn(s, 'spear');
    applyFx(s, [{ op: 'mastery', branch: 'polearm', add: 180 }]);
    const spear = s.growth.styleMastery.spear;
    learn(s, 'staff');
    expect(styleTier(s, 'staff')).toBe(1);
    expect(heroUnit5(s).skills.every((k) => !k.id.startsWith('style:spear:'))).toBe(true);
    applyFx(s, [{ op: 'mastery', branch: 'polearm', add: 10 }]);
    expect(s.growth.styleMastery.spear).toBe(spear);
    expect(s.growth.styleMastery.staff).toBe(110);
    expect(aggregateStyleMastery(s, 'weapon')).toBe((spear ?? 0) + 110);
  });

  it('다른 섬에서 스승을 만난 것처럼 진행하지 않고 큰 부상과 휴식에는 연습이 늘지 않는다', () => {
    const s = newLife5(4); s.age = 20;
    effects(s, [{ op: 'beginStyle', style: 'spear' }]);
    const home = s.hero.island;
    s.hero.island = '워터 세븐';
    for (let i = 0; i < 3; i++) growPart(s, 'train', () => 0.9);
    expect(s.growth.styleBonds.spear?.practice).toBe(0);
    s.hero.island = home;
    s.hero.injuries.push({ severity: 'heavy', monthsLeft: 4 });
    growPart(s, 'train', () => 0.9);
    expect(s.growth.styleBonds.spear?.practice).toBe(0);
    s.hero.injuries = [];
    growPart(s, 'rest', () => 0.9);
    expect(s.growth.styleBonds.spear?.practice).toBe(0);
    for (let i = 0; i < 3; i++) growPart(s, 'work', () => 0.9);
    s.hero.island = '워터 세븐';
    effects(s, [{ op: 'adoptStyle', style: 'spear' }]);
    expect(s.hero.weapon).toBeUndefined();
  });

  it('조선공만 해머의 직업 인연을 시작하고 거절하면 무기나 스승을 얻지 않는다', () => {
    const s = newLife5(8); s.age = 20; s.pending = null;
    const t = STYLE_TURNINGS.find((t) => t.id === 'style_meet_hammer')!;
    s.hero.island = '워터 세븐';
    s.hero.standing = 'civil'; expect(checkAll(s, t.when)).toBe(false);
    s.hero.standing = 'shipwright'; expect(checkAll(s, t.when)).toBe(true);
    const people = s.people.length;
    openTurning(s, t); answerDoor(s, 1);
    expect(s.people.length).toBe(people);
    expect(s.growth.styleBonds.hammer).toBeUndefined();
    expect(s.closed).toContain(t.id);
  });

  it('21개 유파 모두 만남→실제 연습→주력 선택→숙련 후 재회를 플레이할 수 있다', () => {
    for (const def of COMBAT_STYLES) {
      const s = newLife5(2); s.age = 20; s.pending = null;
      const meet = STYLE_TURNINGS.find((t) => t.id === `style_meet_${def.id}`)!;
      for (const c of meet.when) {
        if (c.c === 'age') s.age = Math.min(c.max ?? Infinity, Math.max(c.min ?? 0, s.age));
        if (c.c === 'island' && !c.not) s.hero.island = c.is[0];
        if (c.c === 'standing') s.hero.standing = c.is[0];
        if (c.c === 'sea') s.hero.sea = c.is[0];
      }
      expect(checkAll(s, meet.when), def.id).toBe(true);
      openTurning(s, meet); answerDoor(s, 0);
      for (let i = 0; i < 3; i++) growPart(s, 'work', () => 0.9);
      const adopt = STYLE_TURNINGS.find((t) => t.id === `style_adopt_${def.id}`)!;
      expect(checkAll(s, adopt.when), def.id).toBe(true);
      openTurning(s, adopt); answerDoor(s, 0);
      expect(s.growth.primaryStyle, def.id).toBe(def.id);
      expect(heroUnit5(s).skills.some((k) => k.id === `style:${def.id}:1`), def.id).toBe(true);
      // 타고난 특성의 숙련 배율을 유지한 채 실제로 3단계에 이를 때까지 수련한다.
      for (let i = 0; i < 10 && styleTier(s, def.id) < 3; i++) applyFx(s, [{ op: 'mastery', branch: def.branch, add: 100 }]);
      s.hardship = 50;
      const refine = STYLE_TURNINGS.find((t) => t.id === `style_refine_${def.id}`)!;
      expect(checkAll(s, refine.when), def.id).toBe(true);
      openTurning(s, refine); answerDoor(s, 0);
      expect(s.growth.styleBonds[def.id]?.refined, def.id).toBe(true);
      expect(normalizeLife5(JSON.parse(JSON.stringify(s)))?.growth).toEqual(s.growth);
    }
  });

  it('창과 해머는 그림에서도 칼로 표시되지 않고 전향은 즉시 저장한다', () => {
    const s = newLife5(31); s.age = 20; s.pending = null;
    learn(s, 'spear'); expect(heroWho5(s).weapon).toBe('spear');
    learn(s, 'hammer'); expect(heroWho5(s).weapon).toBe('hammer');
    expect(shouldSave(s, s, { type: 'style', style: 'spear' })).toBe(true);
  });

  it('최강의 꿈은 주력 유형을 따르며 창으로 검객의 꿈을 완료하지 않는다', () => {
    const s = newLife5(30); s.age = 20;
    learn(s, 'spear'); setDream(s, 'bestWeapon');
    expect(dreamLine(s)).toContain('병기가');
    for (let i = 0; i < 2; i++) applyFx(s, [{ op: 'mastery', branch: 'polearm', add: 100 }]);
    s.stats.wins = 5;
    const reunion = STYLE_TURNINGS.find((t) => t.id === 'style_refine_spear')!;
    expect(checkAll(s, reunion.when)).toBe(true);
    openTurning(s, reunion); answerDoor(s, 0);
    for (let i = 0; i < 3; i++) applyFx(s, [{ op: 'mastery', branch: 'polearm', add: 100 }]);
    expect(dreamMet(s, 'bestWeapon')).toBe(true);
    expect(dreamMet(s, 'bestSword')).toBe(false);
  });

  it('전향했다 돌아와도 장만한 좋은 창을 입문용 창으로 바꾸지 않는다', () => {
    const s = newLife5(16); s.age = 20; s.pending = null;
    learn(s, 'spear'); s.hero.money = 100_000;
    applyFx(s, [{ op: 'buyWeapon', id: 'sp2' }]);
    learn(s, 'hammer');
    apply5(s, { type: 'style', style: 'spear' });
    expect(s.hero.weapon).toBe('sp2');
  });

  it('스승 없는 성장 상한을 유파 선택으로 우회하지 않는다', () => {
    const s = newLife5(2); s.age = 20; s.pending = null;
    for (let i = 0; i < 30; i++) applyFx(s, [{ op: 'mastery', branch: 'sword', add: 100 }]);
    const before = power5(s);
    apply5(s, { type: 'style', style: 'oneSword' });
    expect(styleTier(s, 'oneSword')).toBe(3);
    expect(power5(s)).toBe(before);
  });

  it('기초 유파를 채택해도 고급 스승 없이 극의까지 성장하지 않는다', () => {
    const s = newLife5(2); s.age = 20; s.pending = null;
    learn(s, 'oneSword');
    for (let i = 0; i < 30; i++) applyFx(s, [{ op: 'mastery', branch: 'sword', add: 100 }]);
    expect(s.growth.tier.sword).toBe(3);
    expect(styleTier(s, 'oneSword')).toBe(3);
    applyFx(s, [{ op: 'master', name: '기연으로 만난 검객', branch: 'sword', cap: 6, years: 10, paid: false }]);
    for (let i = 0; i < 3; i++) applyFx(s, [{ op: 'mastery', branch: 'sword', add: 100 }]);
    expect(styleTier(s, 'oneSword')).toBe(6);
  });

  it('유파 입문은 돈으로 들인 스승의 4단계 상한도 우회하지 않는다', () => {
    const s = newLife5(2); s.age = 20; s.pending = null;
    learn(s, 'spear');
    applyFx(s, [{ op: 'master', name: '유료 창술 사범', branch: 'polearm', cap: 6, years: 10, paid: true }]);
    for (let i = 0; i < 30; i++) applyFx(s, [{ op: 'mastery', branch: 'polearm', add: 100 }]);
    expect(s.growth.tier.polearm).toBe(4);
    expect(styleTier(s, 'spear')).toBe(4);
  });

  it('주력 채택을 미뤄도 같은 제안이 한 인생에 무제한 반복되지 않는다', () => {
    const s = newLife5(2); s.age = 20; s.pending = null;
    applyFx(s, [{ op: 'beginStyle', style: 'oneSword' }]);
    for (let i = 0; i < 3; i++) growPart(s, 'work', () => 0.9);
    const proposal = STYLE_TURNINGS.find((t) => t.id === 'style_adopt_oneSword')!;
    for (let i = 0; i < 3; i++) {
      expect(repeatAllows(s, proposal)).toBe(true);
      expect(openTurning(s, proposal)).toBe(true);
      answerDoor(s, 2);
      s.age += 1;
    }
    expect(repeatAllows(s, proposal)).toBe(false);
    expect(s.growth.styleBonds.oneSword?.adopted).toBe(false);
  });

  it('기초 연습과 주력 채택만으로 특정 신념을 강요하지 않는다', () => {
    const s = newLife5(2); s.age = 20; s.pending = null;
    s.hero.island = '시모츠키 마을';
    s.stats.wins = 5;
    const values = { ...s.values };
    const meet = STYLE_TURNINGS.find((t) => t.id === 'style_meet_oneSword')!;
    expect(openTurning(s, meet)).toBe(true); answerDoor(s, 0);
    expect(s.values).toEqual(values);
    for (let i = 0; i < 3; i++) growPart(s, 'work', () => 0.9);
    const adopt = STYLE_TURNINGS.find((t) => t.id === 'style_adopt_oneSword')!;
    expect(openTurning(s, adopt)).toBe(true); answerDoor(s, 0);
    expect(s.values).toEqual(values);
    for (let i = 0; i < 3; i++) applyFx(s, [{ op: 'mastery', branch: 'sword', add: 100 }]);
    const refine = STYLE_TURNINGS.find((t) => t.id === 'style_refine_oneSword')!;
    expect(openTurning(s, refine)).toBe(true); answerDoor(s, 0);
    expect(s.values).toEqual(values);
  });

  it('같은 갈래의 새 유파 기술은 그 유파의 입문 숙련으로 전투한다', () => {
    const s = newLife5(8); s.age = 20;
    learn(s, 'spear');
    for (let i = 0; i < 5; i++) applyFx(s, [{ op: 'mastery', branch: 'polearm', add: 100 }]);
    learn(s, 'staff');
    const newSkill = heroUnit5(s).skills.find((k) => k.id === 'style:staff:1');
    const novice = newLife5(8); novice.age = 20; learn(novice, 'staff');
    expect(newSkill?.mastery).toBe(heroUnit5(novice).skills.find((k) => k.id === 'style:staff:1')?.mastery);
  });

  it('손상된 인연 저장은 이후 생활을 중단시키지 않는다', () => {
    const old = JSON.parse(JSON.stringify(newLife5(1)));
    old.growth.styleBonds = { spear: null, unknown: { practice: 3 }, staff: [] };
    const s = normalizeLife5(old)!;
    expect(s).not.toBeNull();
    expect(() => growPart(s, 'work', () => 0.9)).not.toThrow();
  });

  it('실제 자동 전투의 창 기술 사용이 한 번만 성장으로 이어진다', () => {
    const s = newLife5(9); s.age = 20; s.pending = null;
    s.hero.base = { str: 90, spd: 90, vit: 90, int: 90, wil: 90, luk: 90 };
    learn(s, 'spear');
    const before = s.growth.styleMastery.spear ?? 0;
    askFight(s, Object.keys(FOES)[0], false, true);
    const pending = s.pending as Life5['pending'];
    expect(pending?.kind).toBe('battle');
    if (pending?.kind !== 'battle') throw new Error('자동 전투가 시작되지 않았다');
    expect(pending.battle.events.some((e) => e.k === 'act' && e.who === 0 && e.skill.startsWith('style:spear:'))).toBe(true);
    expect(pending.battle.events.some((e) => e.k === 'act' && e.who === 0 && e.skill.startsWith('sword_'))).toBe(false);
    ackBattle(s);
    expect(s.growth.styleMastery.spear).toBe(before + 6);
    const earned = s.growth.styleMastery.spear;
    askFight(s, Object.keys(FOES)[0], false, true); ackBattle(s);
    expect(s.growth.styleMastery.spear).toBe(earned);
  });

  it('기존 단계 획득 사건도 기본 유파에 연결되고 창을 쓰는 동안 칼 전용 사건을 섞지 않는다', () => {
    const s = newLife5(5); s.age = 20;
    applyFx(s, [{ op: 'tier', branch: 'sword', to: 2 }]);
    expect(styleTier(s, 'oneSword')).toBe(2);
    learn(s, 'spear');
    expect(needOk(s, 'sword')).toBe(false);
  });

  it('주력이 아닌 유파에 보상을 받아도 이미 쌓은 극의 숙련이 깎이지 않는다', () => {
    const s = newLife5(1); s.age = 20;
    learn(s, 'oneSword');
    applyFx(s, [{ op: 'master', name: '고급 검술 사범', branch: 'sword', cap: 6, years: 10, paid: false }]);
    for (let i = 0; i < 5; i++) applyFx(s, [{ op: 'mastery', branch: 'sword', add: 100 }]);
    learn(s, 'spear');
    applyFx(s, [{ op: 'mastery', branch: 'sword', add: 4 }]);
    expect(s.growth.styleMastery.oneSword).toBe(600);
    expect(dreamMet(s, 'bestSword')).toBe(false);
    learn(s, 'iai');
    expect(dreamMet(s, 'bestSword')).toBe(false);
  });

  it('다른 갈래 무기를 잇따라 사도 구입한 창을 보존한다', () => {
    const s = newLife5(1); s.age = 20; s.pending = null;
    learn(s, 'spear'); s.hero.money = 100_000;
    applyFx(s, [{ op: 'buyWeapon', id: 'sp2' }, { op: 'buyWeapon', id: 'gu2' }]);
    learn(s, 'hammer');
    apply5(s, { type: 'style', style: 'spear' });
    expect(s.hero.weapon).toBe('sp2');
  });
  it('약속한 지역 수련을 세 토막 마칠 때까지 자동 출항을 미룬다', () => {
    const s = newLife5(3); s.age = 20; s.pending = null; s.hero.standing = 'marine'; s.sail = true;
    effects(s, [{ op: 'beginStyle', style: 'spear' }]);
    const place = s.hero.island;
    voyage(s);
    expect(s.hero.island).toBe(place);
    expect(s.pending).toBeNull();
  });

  it('몸이 더는 창을 다룰 수 없으면 미완성 수련이 자동 출항을 계속 붙잡지 않는다', () => {
    const s = newLife5(3); s.age = 20; s.pending = null;
    effects(s, [{ op: 'beginStyle', style: 'spear' }]);
    expect(hasLocalStyleLesson(s)).toBe(true);
    s.hero.limbs.armL = 'lost';
    expect(hasLocalStyleLesson(s)).toBe(false);
  });

});
