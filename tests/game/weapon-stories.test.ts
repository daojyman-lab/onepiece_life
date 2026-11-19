import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { applyFx } from '../../src/core/fx';
import { newLife5 } from '../../src/core/state';
import { tradeCost } from '../../src/core/traits';
import { answerDoor, openQueued, resolveDoors } from '../../src/core/turning';
import type { Life5, Standing } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { WEAPON_STORIES } from '../../src/data/turnings/weapon-stories';
import { ITEM_BY_ID } from '../../src/shared/data/items';

function life(age: number, island: string, standing: Standing): Life5 {
  const s = newLife5(51);
  s.pending = null;
  s.age = age;
  s.hero.island = island;
  s.hero.standing = standing;
  return s;
}

function choose(s: Life5, id: string, door: number) {
  s.queue.push(id);
  expect(openQueued(s), id).toBe(true);
  expect(s.pending?.kind === 'door' && s.pending.turning === id && !s.pending.doors[door].locked, id).toBe(true);
  answerDoor(s, door);
}

describe('삶에서 얻은 무기', () => {
  it.each([
    ['weapon_fair_slingshot', 8, '시럽 마을', 'child', 'fair_slingshot'],
    ['weapon_zou_gloves', 13, '고래숲', 'child', 'fi1'],
    ['weapon_sky_bell', 20, '엔젤섬', 'civil', 'bell_dial'],
    ['weapon_drum_staff', 32, '드럼 왕국', 'bountyHunter', 'snow_staff'],
  ] as const)('%s는 현지에서 직접 받는 문에서만 장비를 남긴다', (id, age, island, standing, item) => {
    const s = life(age, island, standing);
    const decline = structuredClone(s);
    choose(decline, id, 1);
    expect(checkAll(decline, [{ c: 'weapon', id: item, has: false }])).toBe(true);
    expect(decline.hero.weapon).toBeUndefined();
    const before = structuredClone(s.growth);
    s.hero.island = '자야';
    expect(checkAll(s, TURNING_BY_ID[id].when)).toBe(false);
    s.hero.island = island;
    choose(s, id, 0);
    expect(checkAll(s, [{ c: 'weapon', id: item, has: true }])).toBe(true);
    expect(s.growth.styleMastery).toEqual(before.styleMastery);
    expect(s.growth.styleFocus).toEqual(before.styleFocus);
    expect(s.growth.primaryStyle).toBe(before.primaryStyle);
    expect(s.growth.path).toBe(before.path);
    s.hero.weapon = undefined;
    expect(checkAll(s, TURNING_BY_ID[id].when)).toBe(false);
  });

  it('장날에 남겨 둔 새총은 그때의 아이가 살아 있어야 은퇴 뒤에 돌아온다', () => {
    const s = life(8, '오렌지 마을', 'child');
    const kept = structuredClone(s);
    choose(kept, 'weapon_fair_slingshot', 0);
    applyFx(kept, [{ op: 'giveAwayWeapon', id: 'fair_slingshot' }]);
    choose(s, 'weapon_fair_slingshot', 1);
    const friend = s.people.find(p => p.relation === '장날에 바구니를 잡아 준 아이')!;
    const retirement = TURNING_BY_ID.weapon_retired_fair;
    s.age = kept.age = 65;
    expect(checkAll(s, retirement.when)).toBe(false);
    s.hero.standing = kept.hero.standing = 'retired';
    expect(checkAll(kept, retirement.when)).toBe(false);
    friend.alive = false;
    expect(checkAll(s, retirement.when)).toBe(false);
    friend.alive = true;
    const decline = structuredClone(s);
    choose(decline, retirement.id, 1);
    expect(decline.growth.weapons).not.toContain('fair_slingshot');
    choose(s, retirement.id, 0);
    expect(s.growth.weapons).toContain('fair_slingshot');
    expect(s.hero.weapon).toBeUndefined();
    expect(s.log.at(-1)?.text).toContain(friend.name);
  });

  it('도크의 못을 주울 때 실제로 허락해 준 경비만 다시 만난다', () => {
    const s = life(20, '워터 세븐', 'shipwright');
    const t = TURNING_BY_ID.weapon_dock_watch;
    expect(checkAll(s, t.when)).toBe(false);
    s.tried.push('w7k_dock_nails#1');
    s.firstChoiceAge = { 'w7k_dock_nails#1': 8 };
    expect(checkAll(s, t.when)).toBe(false);
    applyFx(s, [{ op: 'person', relation: '도크의 경비', name: '리코', kind: 'ally' }]);
    choose(s, t.id, 0);
    expect(s.growth.weapons).toContain('sw1');
    expect(s.log.at(-1)?.text).toContain('리코');
  });

  it('해군의 근속과 실제 전성기, 이전에 얻은 검이 각 보상의 조건이 된다', () => {
    const s = life(26, '로그타운', 'marine');
    s.standingSince = 25;
    expect(checkAll(s, TURNING_BY_ID.weapon_marine_jitte.when)).toBe(false);
    s.standingSince = 20;
    choose(s, 'weapon_marine_jitte', 0);
    expect(s.growth.weapons).toContain('sw_ss');

    s.hero.island = '어인섬';
    const prime = TURNING_BY_ID.weapon_prime_spear;
    s.growth.tier.polearm = 2;
    s.flags.push('prime');
    s.prime = { from: 20, until: 25, lap: false };
    expect(checkAll(s, prime.when)).toBe(false);
    s.prime = { from: 25, until: 30, lap: false };
    choose(s, prime.id, 0);
    expect(s.growth.weapons).toContain('sp2');

    s.age = 47;
    s.hero.island = '쿠리';
    s.growth.tier.sword = 2;
    expect(checkAll(s, TURNING_BY_ID.weapon_wano_blades.when)).toBe(false);
    applyFx(s, [{ op: 'receiveWeapon', id: 'sw1' }]);
    choose(s, 'weapon_wano_blades', 0);
    expect(s.growth.weapons).toEqual(expect.arrayContaining(['sw1', 'sw2']));
  });

  it('모든 새 사건은 자연 추첨에 들어가며 죄수에게 열리지 않는다', () => {
    for (const t of WEAPON_STORIES) {
      expect(TURNING_BY_ID[t.id]).toBe(t);
      expect(t.weight).toBeGreaterThan(0);
      expect(t.repeat).toBe('once');
      const standing = t.when.find(c => c.c === 'standing');
      expect(standing?.is ?? ['prisoner']).not.toContain('prisoner');
    }
  });

  it.each(['wano_heirloom', 'loguetown_meito'])('소장한 명검 %s도 와노 전시에 빌려줄 수 있다', id => {
    const s = life(48, '쿠리', 'civil');
    s.growth.tier.sword = 2;
    applyFx(s, [{ op: 'receiveWeapon', id, stow: true }]);
    choose(s, 'weapon_wano_blades', 0);
    expect(s.growth.weapons).toEqual(expect.arrayContaining([id, 'sw2']));
  });

  it.each([[0, 'gu3'], [1, 'gu_ss'], [2, null]] as const)('호송 장비 선택 %i가 기존 주무기를 보존한다', (door, item) => {
    const s = life(32, '워터 세븐', 'bountyHunter');
    s.standingSince = 24;
    s.growth.tier.gun = 3;
    const t = TURNING_BY_ID.weapon_veteran_rifles;
    expect(checkAll(s, t.when)).toBe(false);
    applyFx(s, [{ op: 'receiveWeapon', id: 'style_rifle' }]);
    const equipped = s.hero.weapon;
    s.hero.standing = 'shipwright';
    expect(checkAll(s, t.when)).toBe(false);
    s.hero.standing = 'bountyHunter';
    choose(s, t.id, door);
    expect(s.hero.weapon).toBe(equipped);
    expect(s.growth.weapons.filter(id => ['gu3', 'gu_ss'].includes(id))).toEqual(item ? [item] : []);
  });

  it('카부토를 맡으려면 일반 사격 경지에 더해 새총의 재수련을 마치고 세 해가 지나야 한다', () => {
    const s = life(39, '시럽 마을', 'settled');
    s.growth.tier.gun = 5;
    applyFx(s, [{ op: 'receiveWeapon', id: 'style_slingshot' }]);
    const t = TURNING_BY_ID.weapon_kabuto_exhibit;
    expect(checkAll(s, t.when)).toBe(false);
    s.tried.push('style_refine_slingshot#0');
    s.firstChoiceAge = { 'style_refine_slingshot#0': 37 };
    expect(checkAll(s, t.when)).toBe(false);
    s.age = 40;
    const declined = structuredClone(s);
    choose(declined, t.id, 1);
    expect(declined.growth.weapons).not.toContain('gu4');
    choose(s, t.id, 0);
    expect(s.growth.weapons).toContain('gu4');
  });

  it('체술가의 해루석 주문에는 재료값이 들고 엘바프 건틀릿에는 지난 방문의 선택이 필요하다', () => {
    const s = life(38, '쿠리', 'pirate');
    s.growth.tier.fist = 4;
    const forge = TURNING_BY_ID.weapon_knuckle_forge;
    const price = tradeCost(s, ITEM_BY_ID.fi3.price);
    s.hero.money = price - 1;
    expect(resolveDoors(s, forge)[1].locked).toBeTruthy();
    const steel = structuredClone(s);
    choose(steel, forge.id, 0);
    expect(steel.growth.weapons).toContain('fi2');
    expect(steel.hero.money).toBe(s.hero.money);
    s.hero.money = price;
    choose(s, forge.id, 1);
    expect(s.hero.money).toBe(0);
    expect(s.growth.weapons).toContain('fi3');
    const elbaf = TURNING_BY_ID.weapon_elbaf_gauntlet;
    s.hero.island = '엘바프';
    expect(checkAll(s, elbaf.when)).toBe(false);
    choose(s, 'isl_elbaf_giant', 0);
    expect(checkAll(s, elbaf.when)).toBe(false);
    s.age += 1;
    choose(s, elbaf.id, 0);
    expect(s.growth.weapons).toEqual(expect.arrayContaining(['fi3', 'fi4']));
  });

  it('해군 장갑은 장기 복무와 체술 경험이 있어야 선택할 수 있다', () => {
    const s = life(28, '로그타운', 'marine');
    s.standingSince = 20;
    const t = TURNING_BY_ID.weapon_marine_jitte;
    expect(resolveDoors(s, t)[2].locked).toBeTruthy();
    s.growth.tier.fist = 2;
    choose(s, t.id, 2);
    expect(s.growth.weapons).toContain('fi_ss');
    expect(s.growth.weapons).not.toContain('sw_ss');
  });

  it.each([0, 1, 2])('맡은 대업물을 여덟 해 뒤 감정받는 선택 %i가 실제 소장품에 반영된다', door => {
    const s = life(40, '하나노미야코', 'civil');
    s.growth.tier.sword = 5;
    applyFx(s, [{ op: 'receiveWeapon', id: 'wano_heirloom' }]);
    const held = s.hero.weapon;
    const declined = structuredClone(s);
    choose(declined, 'weapon_meito_custody', 1);
    expect(declined.growth.weapons).not.toContain('sw3');
    choose(s, 'weapon_meito_custody', 0);
    const later = TURNING_BY_ID.weapon_meito_return;
    s.age = 47;
    s.growth.tier.armament = 4;
    expect(checkAll(s, later.when)).toBe(false);
    s.age = 48;
    s.growth.tier.armament = 3;
    expect(checkAll(s, later.when)).toBe(false);
    s.growth.tier.armament = 4;
    choose(s, later.id, door);
    expect(s.hero.weapon).toBe(held);
    expect(s.growth.weapons.includes('sw3')).toBe(door !== 1);
    expect(s.growth.weapons.includes('sw4')).toBe(door === 0);
    expect(s.growth.weapons.includes('sw5')).toBe(door === 1);
  });
});
