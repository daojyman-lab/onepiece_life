import { describe, expect, it } from 'vitest';
import { heroUnit5 } from '../../src/core/fight';
import { applyFx, fillText } from '../../src/core/fx';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { apply5 } from '../../src/core/reduce';
import { newLife5 } from '../../src/core/state';
import { practiceStyles } from '../../src/core/styles';
import { answerDoor, openTurning, resolveDoors } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { MINORS } from '../../src/data/minors';
import { ITEM_BY_ID } from '../../src/shared/data/items';

function adult() {
  const s = newLife5(71, { home: 'loguetown' });
  s.pending = null;
  s.siblingBirths = [];
  s.age = 20;
  s.hero.standing = 'civil';
  s.hero.island = '로그타운';
  s.hero.money = 100000;
  return s;
}

function apprentice(s: ReturnType<typeof adult>, style: 'spear' | 'pistol') {
  applyFx(s, [{ op: 'beginStyle', style }]);
  for (let i = 0; i < 3; i++) practiceStyles(s, 'train');
  applyFx(s, [{ op: 'adoptStyle', style }]);
}

describe('주무기와 실물 보관', () => {
  it('창잡이가 총을 사도 창으로 싸우고 전향과 저장 뒤에도 직접 고른 창을 기억한다', () => {
    const s = adult();
    apprentice(s, 'spear');
    applyFx(s, [{ op: 'buyWeapon', id: 'sp2' }, { op: 'buyWeapon', id: 'gu2' }]);
    const paid = s.hero.money;
    applyFx(s, [{ op: 'buyWeapon', id: 'gu2' }]);
    expect(s.hero.money).toBe(paid);
    expect(s.growth.weapons).toEqual(['style_spear', 'sp2', 'gu2']);
    apply5(s, { type: 'equipWeapon', id: 'gu2' });
    expect(heroUnit5(s).weapon?.id).toBe('sp2');
    expect(heroUnit5(s).skills.every(x => !x.id.startsWith('style:pistol:'))).toBe(true);
    apply5(s, { type: 'equipWeapon', id: 'style_spear' });
    apprentice(s, 'pistol');
    expect(s.hero.weapon).toBe('gu2');
    const load = normalizeLife5(structuredClone(s))!;
    apply5(load, { type: 'style', style: 'spear' });
    expect(load.hero.weapon).toBe('style_spear');
    expect(load.growth.weapons).toEqual(s.growth.weapons);
    expect(s.timeline.some(x => x.age === 20 && x.text.includes('로그타운') && x.text.includes(ITEM_BY_ID.gu2.name))).toBe(true);
    load.hero.limbs.armL = 'lost';
    expect(heroUnit5(load).weapon).toBeNull();
    expect(heroUnit5(load).skills.some(x => x.id.startsWith('style:spear:'))).toBe(false);
  });

  it('무기 없는 검사와 소총만 받은 초보에게 검술과 권총 기술을 붙이지 않는다', () => {
    const s = adult();
    s.growth.tier.sword = 3;
    s.growth.styleMastery.oneSword = 300;
    s.growth.tier.gun = 2;
    s.growth.styleMastery.pistol = 200;
    expect(heroUnit5(s).skills.some(x => /sword|pistol|^gun_/i.test(x.id))).toBe(false);
    applyFx(s, [{ op: 'receiveWeapon', id: 'gu3' }, { op: 'serviceWeapon' }]);
    expect(heroUnit5(s).weapon?.id).toBe('gu3');
    expect(heroUnit5(s).skills.some(x => /sword|pistol|^gun_/i.test(x.id))).toBe(false);
    expect(s.growth.styleMastery.pistol).toBe(200);
  });

  it('옛 저장은 이 생에서 구매하거나 물려받은 장비만 복원하고 이미 넘긴 가보는 돌려주지 않는다', () => {
    const old = adult();
    old.growth.primaryStyle = 'spear';
    old.growth.styleWeapons.spear = 'gu2';
    old.growth.styleWeapons.oneSword = 'wano_heirloom';
    old.hero.weapon = 'gu2';
    old.tried.push('port_weapon_water7#0', 'wanok_samurai_blade#0', 'wanoa_last_blade#1', 'sw_inherit_yard#0');
    old.known.push('cn_tashigi_swords#1');
    delete (old.growth as Partial<typeof old.growth>).weapons;
    const s = normalizeLife5(structuredClone(old))!;
    expect(s.growth.weapons.sort()).toEqual(['gu2', 'sp2', 'yard_hammer']);
    expect(s.hero.weapon).toBe('sp2');
    expect(s.growth.styleBonds.spear).toBeUndefined();
    expect(normalizeLife5(structuredClone(s))?.growth).toEqual(s.growth);
  });

  it('무기점은 매매 가능한 나이와 장소에서만 열리고 화면에 나온 할인 가격대로 결제한다', () => {
    const s = adult();
    const market = TURNING_BY_ID.port_weapon_loguetown;
    s.age = 12;
    expect(openTurning(s, market)).toBe(false);
    s.age = 19; s.hero.island = '워터 세븐';
    expect(openTurning(s, market)).toBe(false);
    s.hero.island = '로그타운';
    s.traits!.earned.push('silverTongue'); s.traits!.active = ['silverTongue'];
    s.hero.money = 22500;
    expect(resolveDoors(s, market)[0]).toMatchObject({ hint: expect.stringContaining('22,500'), locked: null });
    expect(openTurning(s, market)).toBe(true);
    answerDoor(s, 0);
    expect(s.hero.money).toBe(0);
    expect(s.hero.weapon).toBe('sw2');
    expect(s.growth.styleMastery.oneSword ?? 0).toBe(0);
    s.hero.money = 90000;
    expect(resolveDoors(s, market)[0].locked).toBeTruthy();
  });

  it('가보를 신사에 바치면 장비·보관 목록·다시 읽은 저장에서 모두 떠난다', () => {
    const s = newLife5(15, { home: 'wano', lineage: 'samurai' });
    s.siblingBirths = []; s.age = 10; s.pending = null;
    expect(openTurning(s, TURNING_BY_ID.wanok_samurai_blade)).toBe(true);
    answerDoor(s, 0);
    expect(s.growth.weapons).toContain('wano_heirloom');
    apply5(s, { type: 'equipWeapon', id: 'wano_heirloom' });
    expect(s.hero.weapon).toBe('wano_heirloom');
    s.age = 60; s.hero.standing = 'retired';
    expect(openTurning(s, TURNING_BY_ID.wanoa_last_blade)).toBe(true);
    answerDoor(s, 1);
    const restored = normalizeLife5(structuredClone(s))!;
    expect(restored.growth.weapons).not.toContain('wano_heirloom');
    expect(restored.hero.weapon).toBeUndefined();
    expect(Object.values(restored.growth.styleWeapons)).not.toContain('wano_heirloom');
  });

  it('타시기의 명검은 실제로 지불한 뒤에만 현물과 인연으로 남는다', () => {
    const s = adult();
    s.age = 17; s.part = 0;
    s.growth.tier.sword = 1;
    const t = TURNING_BY_ID.cn_tashigi_swords;
    expect(openTurning(s, t)).toBe(true);
    s.hero.money = 0;
    answerDoor(s, 1);
    expect(s.tried).not.toContain(t.id + '#1');
    expect(s.growth.weapons).not.toContain('loguetown_meito');
    s.hero.money = 50000;
    answerDoor(s, 1);
    expect(s.hero.weapon).toBe('loguetown_meito');
    expect(s.people.find(p => p.canon === 'tashigi')?.alive).toBe(true);
    expect(s.timeline.some(x => x.text.includes('명검을 샀다'))).toBe(true);
  });

  it('은퇴 후 손질하는 무기는 실제 장착한 물건이다', () => {
    const s = adult();
    s.age = 65; s.hero.standing = 'retired';
    const minor = MINORS.find(x => x.id === 'm_retired_old_weapon')!;
    applyFx(s, [{ op: 'receiveWeapon', id: 'yard_hammer', stow: true }]);
    expect(checkAll(s, minor.when)).toBe(false);
    apply5(s, { type: 'equipWeapon', id: 'yard_hammer' });
    expect(checkAll(s, minor.when)).toBe(true);
    for (const o of minor.outcomes) for (const line of o.text) {
      expect(fillText(s, line)).toContain(ITEM_BY_ID.yard_hammer.name);
    }
  });
});
