import { ITEM_BY_ID } from '../../shared/data/items';
import { ISLAND_PROFILES } from '../voyage';
import type { Door, Standing, Turning } from '../../core/types';

const VISITORS: Standing[] = ['civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'retired'];

function stock(id: string, cost: string): Door {
  const item = ITEM_BY_ID[id];
  return {
    label: `「${item.name}」을 산다`,
    hint: `${cost} 베리를 내고 장만한 무기를 가져간다`,
    when: [{ c: 'money', min: item.price }, { c: 'weapon', id, has: false }],
    fx: [{ op: 'buyWeapon', id }],
  };
}

const ports = Object.keys(ISLAND_PROFILES).filter((island) => ISLAND_PROFILES[island]?.envEffect?.commerce);

function market(id: string, islands: string[], melee: string, cost: string): Turning {
  return {
    id, kind: 'door', repeat: { years: 3 }, speaker: 'hero', weight: 4,
    when: [{ c: 'age', min: 16 }, { c: 'island', is: islands }, { c: 'standing', is: VISITORS }],
    title: '항구의 무기 공방',
    body: `공방 문이 활짝 열렸다. 손질을 마친 ${ITEM_BY_ID[melee].name}이 벽에 걸렸고, 작업대에는 화약 냄새가 밴 총이 놓여 있다.`,
    doors: [
      stock(melee, cost), stock('gu2', '이만 육천'),
      { label: '공방에서 장비를 손질한다', hint: '장인이 손잡이를 맞춰 주는 동안 몸도 쉬어 간다', fx: [{ op: 'serviceWeapon' }, { op: 'hp', add: 8 }] },
    ],
  };
}

export const PORT_MARKETS = [
  market('port_weapon_loguetown', ['로그타운'], 'sw2', '이만 오천'),
  market('port_weapon_water7', ports.filter((island) => island !== '로그타운'), 'sp2', '이만 팔천'),
];
