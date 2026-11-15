// 싸움 앞의 물음과 선택 창.
import type { Who } from '../../../ui/pixel/pixelArt';
import { gapOf } from '../../core/fight';
import { TURNING_BY_ID } from '../../data/turnings';
import type { EnemySpec, Life5, Pending5 } from '../../core/types';
import { foeWho, speakerOf } from './faces';
import { bandWord } from './words';

// ── 화면의 말을 가르는 경계 (게임 규칙의 수가 아니라 말씨의 기준이다) ──
/** 위험 확률 → 말: 이 값 미만이면 그 말 */
const RISK_WORDS: readonly [number, string][] = [[0.03, '거의 없다'], [0.15, '낮다'], [0.4, '높다']];
const RISK_TOP = '매우 높다';
const RISK_NONE = '없다';
/** 상대의 힘 ÷ 내 힘 → 상대의 격: 이 값 미만이면 그 말 */
const MATCH_WORDS: readonly [number, string][] = [[0.7, '한참 아래다'], [1.15, '해볼 만하다'], [1.8, '버겁다']];
const MATCH_TOP = '상대가 안 된다';

/** 위험을 말로. 목숨을 걸지 않은 싸움(death 0)은 '없다' */
export function riskWords(risk: { injury: number; limb: number; death: number }): { injury: string; limb: string; death: string } {
  return {
    injury: bandWord(risk.injury, RISK_WORDS, RISK_TOP),
    limb: bandWord(risk.limb, RISK_WORDS, RISK_TOP),
    death: risk.death === 0 ? RISK_NONE : bandWord(risk.death, RISK_WORDS, RISK_TOP),
  };
}

/** 상대의 격: 상대의 힘 ÷ 내 힘으로 '한참 아래다' ~ '상대가 안 된다' */
export function matchWord(s: Life5, foe: EnemySpec): string {
  return bandWord(gapOf(s, foe), MATCH_WORDS, MATCH_TOP);
}

export interface FightView { name: string; who: Who; match: string; lethal: boolean; risk: { label: string; word: string }[] }

/** 싸움 앞의 물음: 상대, 상대의 격, 위험 세 줄. 목숨을 걸지 않은 싸움은 죽을 위험이 '없다' */
export function fightView(s: Life5, p: Extract<Pending5, { kind: 'fight' }>): FightView {
  const w = riskWords(p.risk);
  return {
    name: p.foe.name, who: foeWho(p.foe), match: matchWord(s, p.foe), lethal: p.lethal,
    risk: [
      { label: '다칠 위험', word: w.injury },
      { label: '몸을 잃을 위험', word: w.limb },
      { label: '죽을 위험', word: p.lethal ? w.death : RISK_NONE },
    ],
  };
}

export interface DoorView {
  heading: string;                     // 큰 계기면 '큰 계기 · {제목}', 아니면 제목
  moment: boolean; speaker: { name: string; who: Who }; body: string;
  doors: { index: number; label: string; hint: string; locked: string | null; danger: boolean; tags: { text: string; red: boolean }[] }[];
}

/** 선택 창의 자료. 문 옆에는 '전에 골라 본 문' 같은 표시만 붙고, 문이 올리는 가치관은 싣지 않는다 */
export function doorView(s: Life5, p: Extract<Pending5, { kind: 'door' }>): DoorView {
  const sp = speakerOf(s, p);
  const isHero = TURNING_BY_ID[p.turning]?.speaker === 'hero';
  return {
    heading: p.moment ? `큰 계기 · ${p.title}` : p.title,
    moment: p.moment,
    speaker: { name: isHero ? `${sp.name} (나)` : sp.name, who: sp.who },
    body: p.body,
    doors: p.doors.map((d, index) => ({
      index, label: d.label, locked: d.locked, danger: d.danger,
      hint: d.locked ? `✕ ${d.locked}` : d.hint,
      tags: [
        d.special && { text: '특별한 문', red: false },
        d.tried && { text: '전에 골라 본 문', red: false },
        d.danger && { text: '위험', red: true },
      ].filter((t): t is { text: string; red: boolean } => !!t),
    })),
  };
}
