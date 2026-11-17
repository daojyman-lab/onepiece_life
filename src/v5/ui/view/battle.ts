// 자동 전투 창 (v4 src/ui/modals/BattleModal.tsx의 hpAt · line을 옮긴다).
import { josa } from '../../../core/josa';
import { weaponOfSkills, type Who } from '../../../ui/pixel/pixelArt';
import type { Life5 } from '../../core/types';
import type { BattleEvent, BattleState, CUnit } from '../../../core/types';
import { heroWho5 } from './faces';

/** 물약(item 'potion')이 되돌리는 체력의 몫 (v4와 같다) */
const POTION_HEAL = 0.3;

/** 사건 upto개까지 진행했을 때 각 인물의 체력 */
export function hpAt(b: BattleState, upto: number): number[] {
  const hp = b.units.map((u) => u.maxHp);
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

/** 사건 한 줄의 글 */
export function battleLine(b: BattleState, e: BattleEvent): string {
  return josa(rawBattleLine(b, e));
}
function rawBattleLine(b: BattleState, e: BattleEvent): string {
  const n = (i: number) => b.units[i]?.name ?? '?';
  switch (e.k) {
    case 'round': return `── ${e.n}합 ──`;
    case 'act': {
      if (e.skill === 'bound') return `${n(e.who)}: ${e.name}`;
      const tail = e.dodge ? (e.note ?? '빗나갔다') : e.dmg > 0 ? `${e.dmg}${e.crit ? ' 치명타!' : ''}${e.note ? ` (${e.note})` : ''}` : (e.note ?? '');
      return `${n(e.who)} ▶ ${n(e.target)} 「${e.name}」 ${tail}`.trimEnd();
    }
    case 'heal': return `${n(e.who)} 「${e.name}」 ${n(e.target)} 체력 +${e.amount}`;
    case 'guard': return `${n(e.who)} 「${e.name}」`;
    case 'down': return `${n(e.who)}이(가) 쓰러졌다!`;
    case 'join': return `${n(e.who)}이(가) ${e.side === 'L' ? '우리 편 싸움에 합세했다' : '적의 싸움에 합세했다'}`;
    case 'retreat': return e.ok ? `${n(e.who)}이(가) 물러났다` : `${n(e.who)}이(가) 물러나려다 실패했다`;
    case 'item': return `${n(e.who)}이(가) ${e.name}을(를) 썼다`;
    case 'drown': return `${n(e.who)}이(가) 바다에 빠졌다! 힘이 빠진다…`;
    case 'rest': return `${n(e.who)}이(가) 숨을 고른다`;
    case 'end': return e.result === 'win' ? '★ 승리 ★' : e.result === 'retreat' ? '물러났다' : '패배…';
  }
}

/** 전투 인물의 겉모습: 주인공이면 heroWho5 (몸의 표시까지) */
export function unitWho(s: Life5, u: CUnit): Who {
  if (u.hero) return heroWho5(s);
  return { key: u.faceKey || u.key + u.name, gender: u.gender, age: u.age, species: u.species, faction: u.faction, form: u.form, weapon: weaponOfSkills(u.skills.map((k) => k.id)) };
}

const RESULT_LINE = { win: '이겼다.', lose: '졌다.', retreat: '물러났다.' } as const;

/** 재생이 끝난 뒤의 결과 줄 */
export function resultLine(result: 'win' | 'lose' | 'retreat'): string {
  return RESULT_LINE[result];
}
