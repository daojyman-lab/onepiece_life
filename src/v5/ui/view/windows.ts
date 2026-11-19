// 싸움 앞의 물음과 선택 창.
import type { Who } from '../../../ui/pixel/pixelArt';
import { foePower, gapOf, heroFightStats } from '../../core/fight';
import { TURNING_BY_ID } from '../../data/turnings';
import type { EnemySpec, Life5, Pending5 } from '../../core/types';
import { foeWho, speakerOf } from './faces';
import { bandWord, crewGrade } from './words';
import { GRADES, GRADE_TOP } from '../../data/words';
import { rating5 } from '../../core/power';

// ── 화면의 말을 가르는 경계 (게임 규칙의 수가 아니라 말씨의 기준이다) ──
/** 위험 확률 → 말: 이 값 미만이면 그 말 */
const RISK_WORDS: readonly [number, string][] = [[0.03, '거의 없다'], [0.15, '낮다'], [0.4, '높다']];
const RISK_TOP = '매우 높다';
const RISK_NONE = '없다';
/** 상대의 힘 ÷ 내 힘 → 상대의 격: 이 값 미만이면 그 말 */
const MATCH_WORDS: readonly [number, string][] = [[0.7, '한참 아래다'], [1.15, '해볼 만하다'], [1.8, '버겁다']];
const MATCH_TOP = '상대가 안 된다';

/** 위험을 말로. 죽을 위험은 목숨을 걸지 않은 싸움이면 '없다', 목숨을 건 싸움이면 띠의 말이다(0이어도 '거의 없다') */
export function riskWords(risk: { injury: number; limb: number; death: number }, lethal: boolean): { injury: string; limb: string; death: string } {
  return {
    injury: bandWord(risk.injury, RISK_WORDS, RISK_TOP),
    limb: bandWord(risk.limb, RISK_WORDS, RISK_TOP),
    death: lethal ? bandWord(risk.death, RISK_WORDS, RISK_TOP) : RISK_NONE,
  };
}

/** 상대의 격: 상대의 힘 ÷ 내 힘으로 '한참 아래다' ~ '상대가 안 된다' */
export function matchWord(s: Life5, foe: EnemySpec): string {
  return bandWord(gapOf(s, foe), MATCH_WORDS, MATCH_TOP);
}

/** 능력치 비교에 쓰는 이름 */
const STAT_LABEL: readonly [keyof EnemySpec['base'], string][] = [['str', '힘'], ['spd', '속도'], ['vit', '체력'], ['int', '지력'], ['wil', '의지'], ['luk', '운']];

export interface FightView {
  name: string; who: Who; match: string; lethal: boolean; risk: { label: string; word: string }[];
  /** 싸우기 전 능력치 비교: 나와 상대 (상대의 수는 대충 보인다: 10 단위로 깎는다) */
  stats: { label: string; me: number; foe: number }[];
  crew: number;                        // 함께 싸울 동료 수
  /** 전투 등급 (종합 전투력: 능력치 · 무술 · 열매 · 패기): 나, 상대(간부 포함), 함께 싸울 동료들 */
  grade: { me: string; foe: string; crew: string[] };
}

/** 싸움 앞의 물음: 상대, 상대의 격, 위험 세 줄. 목숨을 걸지 않은 싸움은 죽을 위험이 '없다' */
export function fightView(s: Life5, p: Extract<Pending5, { kind: 'fight' }>): FightView {
  const w = riskWords(p.risk, p.lethal);
  return {
    name: p.foe.name, who: foeWho(p.foe), match: matchWord(s, p.foe), lethal: p.lethal,
    stats: (() => { const me = heroFightStats(s); return STAT_LABEL.map(([k, label]) => ({ label, me: Math.round(me[k]), foe: Math.round((p.foe.base[k] ?? 0) / 10) * 10 })); })(),
    crew: s.people.filter((x) => x.alive && x.crew && x.crew.injuredMonths <= 0).length,
    grade: {
      me: bandWord(rating5(s), GRADES, GRADE_TOP), foe: bandWord(foePower(p.foe), GRADES, GRADE_TOP),
      crew: s.people.filter((x) => x.alive && x.crew && x.crew.injuredMonths <= 0).map(x => crewGrade(s, x)),
    },
    risk: [
      { label: '다칠 위험', word: w.injury },
      { label: '몸을 잃을 위험', word: w.limb },
      { label: '죽을 위험', word: w.death },
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
