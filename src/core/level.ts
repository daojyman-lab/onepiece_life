// v7 성장의 재미: 종합 전투력(rating5)을 레벨과 등급으로 읽어 준다. 능력치나 싸움의 계산은 바꾸지 않는다.
//  - 레벨: Lv = ⌊1.3 × √전투력⌋ (1~99). 어린아이 Lv 7 안팎, 이스트 블루의 선장급 Lv 20, B급 Lv 29, S급 Lv 50, SSS급 Lv 98.
//  - 이번 인생에서 처음 닿은 레벨 · 등급만 기록에 남긴다 (다쳐서 내려갔다 다시 오르면 남기지 않는다).
//  - 해마다 지난 한 해에 오른 능력치 · 숙련 · 전투력을 한 줄로 결산하고, 그해의 전투력을 궤적으로 남긴다.
import { V } from '../data/balance';
import { BRANCH_NAME, GRADES, GRADE_TOP } from '../data/words';
import { logLine } from './log';
import { rating5 } from './power';
import type { Branch, Life5, RpgState, StatKey, Stats } from './types';

export const MAX_LEVEL = 99;
/** 한 해의 성장을 결산하는 전투력 증가 비율 (이만큼 자란 해만 한 줄로 남긴다) */
const GROWTH_NOTE = 1.05;
const K = 1.3;
const STAT_NAME: Record<StatKey, string> = { str: '근력', spd: '속도', vit: '체력', int: '지능', wil: '의지', luk: '운' };
const STAT_KEYS: StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const BRANCHES: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun', 'observation', 'armament', 'conqueror', 'fruit'];
const GRADE_ORDER = [...GRADES.map(([, g]) => g), GRADE_TOP];

/** 등급마다 처음 닿았을 때의 한 줄 */
const GRADE_LINE: Record<string, string> = {
  E: '동네 아이들 사이에서 힘이 세다는 말이 돌기 시작했다.',
  D: '어른 한 사람쯤은 혼자 상대할 수 있게 되었다.',
  C: '이스트 블루의 해적 선장과도 겨뤄 볼 만한 힘이 붙었다.',
  B: '한 바다를 휘어잡을 만한 힘이 몸에 붙었다.',
  A: '위대한 항로에서도 이름이 통할 힘이다.',
  S: '위대한 항로에서 이름난 자들과 어깨를 나란히 한다.',
  SS: '신세계의 바다에서도 버틸 수 있는 힘에 닿았다.',
  SSS: '대장 · 사황과 겨룰 만한 경지에 닿았다.',
};

export function levelOf(rating: number): number {
  return Math.max(1, Math.min(MAX_LEVEL, Math.floor(K * Math.sqrt(Math.max(0, rating)))));
}
/** 그 레벨이 시작되는 전투력 */
export function ratingForLevel(level: number): number {
  return (level / K) ** 2;
}
export function gradeOf(rating: number): string {
  return GRADES.find(([lim]) => rating < lim)?.[1] ?? GRADE_TOP;
}
export const gradeRank = (g: string) => GRADE_ORDER.indexOf(g);

/** 지금 레벨과 다음 레벨까지의 진행 (0~1) */
export function levelProgress(rating: number): { level: number; frac: number; next: number | null } {
  const level = levelOf(rating);
  if (level >= MAX_LEVEL) return { level, frac: 1, next: null };
  const lo = ratingForLevel(level), hi = ratingForLevel(level + 1);
  return { level, frac: Math.max(0, Math.min(1, (rating - lo) / (hi - lo))), next: Math.ceil(hi) };
}

const branchProgress = (s: Life5): Record<string, number> =>
  Object.fromEntries(BRANCHES.map((b) => [b, s.growth.tier[b] * V.growth.tierUp + s.growth.mastery[b]]));

function markOf(s: Life5, rating: number): NonNullable<RpgState['mark']> {
  return { age: s.age, base: { ...s.hero.base } as Stats, branch: branchProgress(s), rating: Math.round(rating), level: levelOf(rating) };
}

/** 처음 볼 때 지금 상태로 채운다 (기록은 남기지 않는다) */
export function rpgState(s: Life5): RpgState {
  if (s.rpg) return s.rpg;
  const rating = rating5(s);
  return (s.rpg = { level: levelOf(rating), grade: gradeOf(rating), peak: Math.round(rating), history: {}, mark: markOf(s, rating) });
}

/**
 * 명령 뒤에 (core/reduce.ts): 이번 인생에서 처음 닿은 레벨 · 등급이면 기록에 남긴다.
 * 레벨이 한꺼번에 여럿 오르면 한 줄로 남긴다
 */
export function levelCheck(s: Life5): void {
  if (!s.hero.alive || s.ended) return;
  const fresh = !s.rpg;
  const st = rpgState(s);
  if (fresh) return;
  const rating = rating5(s);
  const level = levelOf(rating);
  if (rating > st.peak) st.peak = Math.round(rating);
  const grade = gradeOf(rating);
  const gradeUp = gradeRank(grade) > gradeRank(st.grade);
  if (level > st.level) {
    const from = st.level;
    st.level = level;
    // 등급이 함께 오르면 등급 상승 줄에 레벨을 함께 적는다
    if (!gradeUp) logLine(s, `▲ 레벨 업 · Lv ${from} → Lv ${level}`, level % 10 === 0 || level - from >= 3 ? 'heavy' : 'light', 'growth');
  }
  if (gradeUp) {
    const from = st.grade;
    st.grade = grade;
    logLine(s, `★ 등급 상승 · ${from}급 → ${grade}급 · Lv ${level}. ${GRADE_LINE[grade] ?? ''}`.trim(), 'heavy', 'growth');
    s.timeline.push({ age: s.age, text: `${grade}급에 올랐다 (Lv ${level})` });
  }
}

/** 해가 바뀌기 직전 (core/year.ts): 지난 한 해의 성장을 한 줄로 결산하고 전투력의 궤적에 남긴다 */
export function yearGrowth(s: Life5): void {
  if (!s.hero.alive) return;
  const st = rpgState(s);
  const rating = rating5(s);
  st.history[s.age] = Math.round(rating);
  const m = st.mark;
  st.mark = markOf(s, rating);
  if (!m) return;
  const parts: string[] = [];
  for (const k of STAT_KEYS) {
    const d = s.hero.base[k] - m.base[k];
    if (d >= 1) parts.push(`${STAT_NAME[k]} +${Math.floor(d)}`);
  }
  const now = branchProgress(s);
  const grown = BRANCHES.map((b) => [b, Math.round(now[b] - (m.branch[b] ?? 0))] as const).filter(([, d]) => d >= 5).sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [b, d] of grown) parts.push(`${BRANCH_NAME[b]} 숙련 +${d}`);
  const r0 = m.rating, r1 = Math.round(rating);
  if (r1 < r0 * GROWTH_NOTE) return;           // 눈에 띄게 자란 해만 결산한다 (늙어 가며 오르고 내린 해는 남기지 않는다)
  logLine(s, `한 해의 성장 · ${parts.length ? `${parts.join(' · ')} · ` : ''}전투력 ${r0.toLocaleString('ko-KR')} → ${r1.toLocaleString('ko-KR')}`, 'light', 'growth');
}

export interface LevelView {
  level: number; grade: string; frac: number; rating: number; next: number | null;
  peakLevel: number; peakGrade: string;
  history: { age: number; rating: number }[];
}
export function levelView(s: Life5): LevelView {
  const rating = rating5(s);
  const p = levelProgress(rating);
  const st = s.rpg;
  const peak = Math.max(st?.peak ?? 0, rating);
  const history = Object.entries(st?.history ?? {}).map(([age, r]) => ({ age: Number(age), rating: r })).sort((a, b) => a.age - b.age);
  return { level: p.level, grade: gradeOf(rating), frac: p.frac, rating: Math.round(rating), next: p.next,
    peakLevel: levelOf(peak), peakGrade: gradeOf(peak), history };
}
