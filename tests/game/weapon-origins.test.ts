import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { depart } from '../../src/core/passage';
import { newLife5 } from '../../src/core/state';
import { practiceStyles } from '../../src/core/styles';
import { answerDoor, openTurning, resolveDoors } from '../../src/core/turning';
import { requestArrival } from '../../src/core/voyage';
import { tradeCost } from '../../src/core/traits';
import { COMBAT_STYLES, type CombatStyle } from '../../src/data/combat-styles';
import { STYLE_TURNINGS } from '../../src/data/turnings/style-origins';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { HOMETOWNS } from '../../src/shared/data/births';
import { SEAS } from '../../src/shared/data/seas';

const scene = (stage: 'meet' | 'adopt' | 'refine', style: CombatStyle) =>
  STYLE_TURNINGS.find(t => t.id === `style_${stage}_${style}`)!;

describe('나이와 섬에 맞는 무기 인연', () => {
  it('모든 무기 첫 만남은 도달 가능한 섬에서 열리고, 소개한 사람이 실제 스승으로 남는다', () => {
    const reachable = new Set([...HOMETOWNS.map(t => t.name), ...SEAS.flatMap(sea => sea.ports)]);
    for (const style of COMBAT_STYLES.filter(style => style.weapon)) {
      const meet = scene('meet', style.id);
      const place = meet.when.find(c => c.c === 'island');
      const ages = meet.when.filter(c => c.c === 'age');
      expect(place?.is.length, style.id).toBeGreaterThan(0);
      expect(place!.is.every(island => reachable.has(island)), style.id).toBe(true);
      const s = newLife5(13);
      s.pending = null;
      s.age = Math.max(...ages.map(c => c.min ?? 0));
      s.hero.island = place!.is[0];
      s.hero.standing = s.age < 16 ? 'child' : 'civil';
      for (const c of meet.when) if (c.c === 'standing' && !c.is.includes(s.hero.standing)) s.hero.standing = c.is[0];
      expect(checkAll(s, meet.when), style.id).toBe(true);
      const headcount = s.people.length;
      openTurning(s, meet);
      answerDoor(s, 0);
      const teacher = s.people.find(p => p.id === s.growth.styleBonds[style.id]?.teacherId)!;
      expect(s.people, style.id).toHaveLength(headcount + 1);
      expect(meet.body, style.id).toContain(teacher.name);
      expect(teacher.kind).toBe('master');
      expect(s.hero.weapon).toBeUndefined();
      for (let i = 0; i < 3; i++) practiceStyles(s, 'train');
      s.age = 75;
      const adopt = scene('adopt', style.id);
      expect(checkAll(s, adopt.when), style.id).toBe(true);
      openTurning(s, adopt);
      expect(s.pending).toMatchObject({ speaker: teacher.name });
      answerDoor(s, 0);
      expect(s.hero.weapon, style.id).toBe(`style_${style.id}`);
    }
  });

  it('과수원 새총은 어린 시절에, 등대의 저격총은 성인이 된 뒤에만 만난다', () => {
    const s = newLife5(15);
    s.hero.island = '시럽 마을'; s.age = 10;
    expect(checkAll(s, scene('meet', 'slingshot').when)).toBe(true);
    s.age = 35;
    expect(checkAll(s, scene('meet', 'slingshot').when)).toBe(false);
    s.hero.island = '서쪽 등대섬';
    expect(checkAll(s, scene('meet', 'sniper').when)).toBe(true);
    s.age = 14;
    expect(checkAll(s, scene('meet', 'sniper').when)).toBe(false);
  });

  it('섬에서 맺은 약속은 항해 중에 진행되지 않고, 자라서도 그 섬에 돌아와 끝낼 수 있다', () => {
    const s = newLife5(10);
    s.pending = null; s.hero.sea = 'east'; s.hero.island = '시럽 마을'; s.age = 17;
    const meet = scene('meet', 'slingshot');
    openTurning(s, meet); answerDoor(s, 0);
    practiceStyles(s, 'roam');
    depart(s, '코노미 제도', 'calm');
    practiceStyles(s, 'work');
    expect(s.growth.styleBonds.slingshot!.practice).toBe(1);
    requestArrival(s, '코노미 제도', 'east', 'calm');
    practiceStyles(s, 'work');
    expect(s.growth.styleBonds.slingshot!.practice).toBe(1);
    s.age = 25;
    requestArrival(s, '시럽 마을', 'east', 'calm');
    practiceStyles(s, 'work'); practiceStyles(s, 'train');
    const adopt = scene('adopt', 'slingshot');
    expect(checkAll(s, adopt.when)).toBe(true);
    depart(s, '코노미 제도', 'calm');
    expect(checkAll(s, adopt.when)).toBe(false);
    requestArrival(s, '코노미 제도', 'east', 'calm');
    expect(checkAll(s, adopt.when)).toBe(false);
    requestArrival(s, '시럽 마을', 'east', 'calm');
    openTurning(s, adopt); answerDoor(s, 0);
    expect(s.hero.weapon).toBe('style_slingshot');
  });

  it('하늘섬의 다이얼 기록꾼과 먼저 인연을 맺은 사람은 그 인물에게 배운다', () => {
    const s = newLife5(9);
    s.pending = null; s.hero.island = '스카이피아'; s.age = 26;
    const meet = scene('meet', 'dial');
    expect(resolveDoors(s, meet)[2]?.locked).toBeTruthy();
    s.flags.push('ep_skypiea_bella_trust');
    openTurning(s, TURNING_BY_ID.ep_skypiea_b9);
    answerDoor(s, 1);
    const bella = s.people.at(-1)!;
    expect(bella.name).toBe('벨라');
    bella.alive = false;
    expect(resolveDoors(s, meet)[2]?.locked).toBeTruthy();
    bella.alive = true;
    bella.kind = 'rival';
    expect(resolveDoors(s, meet)[2]?.locked).toBeTruthy();
    bella.kind = 'ally';
    const headcount = s.people.length;
    openTurning(s, meet);
    answerDoor(s, 2);
    expect(s.people).toHaveLength(headcount);
    expect(s.growth.styleBonds.dial?.teacherId).toBe(bella.id);
    for (let i = 0; i < 3; i++) practiceStyles(s, 'work');
    openTurning(s, scene('adopt', 'dial'));
    expect(s.pending).toMatchObject({ speaker: '벨라' });
    answerDoor(s, 0);
    expect(s.hero.weapon).toBe('style_dial');
  });

  it('와노의 마지막 주문은 제값에 사고, 백수 해적단에서 지급할 때만 검을 받는다', () => {
    const s = newLife5(7, { home: 'wano' });
    s.pending = null; s.age = 20; s.hero.standing = 'civil';
    const smith = TURNING_BY_ID.wanoa_swordsmith;
    const price = tradeCost(s, 50000);
    s.hero.money = price - 1;
    expect(resolveDoors(s, smith)[2].locked).toBeTruthy();
    s.hero.money = price;
    openTurning(s, smith); answerDoor(s, 2);
    expect(s.hero.money).toBe(0);
    expect(s.growth.weapons).toContain('wano_last_order');
    const levy = TURNING_BY_ID.wano_beasts;
    const ration = structuredClone(s);
    openTurning(ration, levy); answerDoor(ration, 1);
    expect(ration.growth.weapons).not.toContain('sw1');
    openTurning(s, levy); answerDoor(s, 0);
    expect(s.growth.weapons).toContain('sw1');
    expect(s.hero.weapon).toBe('wano_last_order');
    s.age = 22; s.part = 1; s.hero.standing = 'civil';
    expect(checkAll(s, levy.when)).toBe(true);
    s.part = 2;
    expect(checkAll(s, levy.when)).toBe(false);
  });

  it('갈레라 창립 때 견습 자리를 받은 조선공은 아이스버그에게 해머를 맡길 수 있다', () => {
    const s = newLife5(11, { home: 'water7' });
    s.pending = null; s.age = 12; s.hero.island = '워터 세븐';
    openTurning(s, TURNING_BY_ID.w7_cn_galley_founded); answerDoor(s, 0);
    const iceburg = s.people.find(p => p.canon === 'iceburg')!;
    s.age = 20; s.hero.standing = 'shipwright';
    const meet = scene('meet', 'hammer');
    s.hero.island = '시프트 역';
    expect(checkAll(s, meet.when)).toBe(true);
    expect(resolveDoors(s, meet)[2].locked).toBeTruthy();
    s.hero.island = '워터 세븐';
    openTurning(s, meet); answerDoor(s, 2);
    expect(s.growth.styleBonds.hammer?.teacherId).toBe(iceburg.id);
    expect(s.people.filter(p => p.canon === 'iceburg')).toHaveLength(1);
  });

  it('옛 기록에서 구매와 지급만 복구하고 도장에서 빌린 목검은 남기지 않는다', () => {
    const old = JSON.parse(JSON.stringify(newLife5(17)));
    delete old.growth.weapons;
    old.tried = ['wanoa_swordsmith#2', 'wano_beasts#0', 'town_shimo_dojo#1'];
    const restored = normalizeLife5(old)!;
    expect([...restored.growth.weapons].sort()).toEqual(['sw1', 'wano_last_order']);
    expect(normalizeLife5(structuredClone(restored))?.growth.weapons).toEqual(restored.growth.weapons);
    old.tried = ['wanoa_swordsmith#0', 'wano_beasts#1', 'town_shimo_dojo#1'];
    expect(normalizeLife5(old)?.growth.weapons).toEqual([]);
    expect(TURNING_BY_ID.town_shimo_dojo.doors[1].hint).toContain('빌려');
  });
});
