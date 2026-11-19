// 자동 전투 창 (v4 src/ui/modals/BattleModal.tsx의 hpAt · line을 옮긴다).
import { battleEventProse, battleOpening, type BattleProseLine } from '../../shared/core/combat/narrative';
import { B } from '../../shared/data/balance';
import { ITEM_BY_ID } from '../../shared/data/items';
import { DEFAULT_STYLE, MARTIAL_BRANCHES, STYLE_BRANCH_ID } from '../../data/combat-styles';
import { equippedWeapon } from '../../core/styles';
export { battleNarrative, battleOpening } from '../../shared/core/combat/narrative';
import { weaponOfSkills, weaponOfStyle, type Weapon, type Who } from '../pixel/pixelArt';
import type { Life5 } from '../../core/types';
import type { BattleEvent, BattleState, CUnit } from '../../shared/core/types';
import { heroWho5, itemSprite } from './faces';

/** 물약(item 'potion')이 되돌리는 체력의 몫 (v4와 같다) */
const POTION_HEAL = 0.3;

/** 긴 문장이 예전의 짧은 기술명과 같은 속도로 사라지지 않게 한다. */
export function battleLineDelay(text: string, speed: number): number {
  return Math.max(B.battleLineMs, Math.min(6000, 400 + text.length * 30)) / Math.max(1, speed);
}

/** 다음 사건이 아니라 지금 보이는 문장에 읽기 시간을 준다. */
export function battleReplayDelay(b: BattleState, rows: readonly BattleProseLine[], shown: number, speed: number): number {
  if (shown === 0) return battleLineDelay(battleOpening(b), speed);
  const i = Math.min(shown - 1, rows.length - 1);
  return battleLineDelay(rows[i]?.text ?? '', speed) * (b.events[i]?.k === 'round' ? 0.6 : 1);
}

/** 사건 upto개까지 진행했을 때 각 인물의 체력 */
export function hpAt(b: BattleState, upto: number): number[] {
  const hp = b.units.map((u, i) => b.initialHp?.[i] ?? u.maxHp);
  for (let i = 0; i < upto && i < b.events.length; i++) {
    const e = b.events[i];
    if (e.k === 'act') hp[e.target] = Math.max(0, hp[e.target] - e.dmg);
    else if (e.k === 'heal') hp[e.target] = Math.min(b.units[e.target].maxHp, hp[e.target] + e.amount);
    else if (e.k === 'item' && e.item === 'potion') hp[e.who] = Math.min(b.units[e.who].maxHp, hp[e.who] + Math.round(b.units[e.who].maxHp * POTION_HEAL));
    else if (e.k === 'drown') hp[e.who] = 0;
  }
  return hp;
}

/** 실제 참전자 수로 전투 창의 1대1/집단전 화면을 고른다. */
export function battleFormation(b: BattleState): { mode: 'duel' | 'group'; left: number[]; right: number[] } {
  const left: number[] = [], right: number[] = [];
  b.units.forEach((u, i) => (u.side === 'L' ? left : right).push(i));
  return { mode: left.length === 1 && right.length === 1 ? 'duel' : 'group', left, right };
}

/** 기존 진입점도 소설형 본문을 사용한다. 수치는 battleNarrative의 detail로 남긴다. */
export function battleLine(b: BattleState, e: BattleEvent): string {
  return battleEventProse(b, e).text;
}

/** 옛 전투는 물건 ID 대신 갈래와 성능만 기록했다. 현재 장비와 제원이 다르면 갈래 그림만 쓴다. */
function battleWeapon(s: Life5, weapon: CUnit['weapon']): Weapon {
  if (!weapon) return 'fist';
  const item = weapon.id ? ITEM_BY_ID[weapon.id] : equippedWeapon(s);
  if (item?.kind === 'weapon' && (item.id === weapon.id ||
    (item.branch === weapon.branch && item.mult === weapon.mult && !!item.seastone === weapon.seastone))) {
    return itemSprite(item);
  }
  const branch = MARTIAL_BRANCHES.find(b => STYLE_BRANCH_ID[b] === weapon.branch);
  return branch ? weaponOfStyle(DEFAULT_STYLE[branch]) : 'fist';
}

/** 전투 시점의 무기와 주인공의 몸 표시를 함께 그린다. */
export function unitWho(s: Life5, u: CUnit): Who {
  if (u.hero) return heroWho5(s, battleWeapon(s, u.weapon));
  return { key: u.faceKey || u.key + u.name, gender: u.gender, age: u.age, species: u.species, faction: u.faction, form: u.form, weapon: weaponOfSkills(u.skills.map((k) => k.id)) };
}

const RESULT_LINE = { win: '이겼다.', lose: '졌다.', retreat: '물러났다.' } as const;

/** 재생이 끝난 뒤의 결과 줄 */
export function resultLine(result: 'win' | 'lose' | 'retreat'): string {
  return RESULT_LINE[result];
}
