// 꿈의 서약: 꿈을 품을 때 약속하고(promiseDream), 해마다 그 꿈으로 가는 다음 길목을 지났는지 본다(dreamVowYear).
// 길목을 지날 때마다 강해진다. 꿈을 바꾸어도 벌은 없다: 얻은 힘은 남고, 새 꿈의 길목을 처음부터 걷는다.
// 꿈을 바꾸지 않고 이어 지난 길목(연속)이 쌓일수록 보상이 커지고, 끝까지 바꾸지 않고 꿈을 이루면 그 갈래의 단계가 하나 오른다.
import { V } from '../data/balance';
import { DREAMS } from '../data/dreams';
import { DREAM_VOW_REWARD, DREAM_VOWS, type DreamCheck } from '../data/dream-vows';
import { BRANCH_NAME } from '../data/words';
import { SEA_BY_ID } from '../shared/data/seas';
import { bountyOf } from './bounty';
import { rating5 } from './power';
import { dreamMet } from './dreams';
import { addMastery } from './fx';
import { logLine } from './log';
import { livingContact, livingRelation } from './needs';
import { focusedStyle, isMartialBranch } from './styles';
import type { Branch, DreamId, DreamVowState, Life5, StatKey } from './types';

const STAT_NAME: Record<StatKey, string> = { str: '근력', spd: '속도', vit: '체력', int: '지능', wil: '의지', luk: '운' };
const MARTIAL: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun'];

export function dreamVowState(s: Life5): DreamVowState {
  return s.dreamVow ?? (s.dreamVow = { cleared: {}, streak: 0, to: null });
}

/** 약속을 들어 줄 사람: 살아 있는 형제 → 어릴 적 동무 → 부모 → 스승. 없으면 스스로에게 */
function listener(s: Life5): string | null {
  const p = livingContact(s, { who: 'sibling' }) ?? livingRelation(s, '어릴 적 동무') ?? livingContact(s, { who: 'parent' })
    ?? s.people.find((x) => x.alive && x.kind === 'master');
  return p?.name ?? null;
}

/** 꿈을 품거나 바꿀 때(core/dreams.ts의 setDream 뒤): 누군가에게 약속한다. 연속은 새 꿈에서 다시 센다 */
export function promiseDream(s: Life5, id: DreamId): void {
  const st = dreamVowState(s);
  st.streak = 0;
  st.to = listener(s);
  const words = DREAM_VOWS[id].promise;
  logLine(s, st.to
    ? `${st.to}에게 약속했다. 언젠가 ${words}.`
    : `누구에게도 말하지 않았다. 언젠가 ${words}, 스스로에게 약속했다.`, 'heavy', 'life');
}

function islandsVisited(s: Life5, among?: string[]): number {
  return s.flags.filter((f) => f.startsWith('at:') && (!among || among.includes(f.slice(3)))).length;
}

/** 길목 · 약속의 조건 하나 (core/goals.ts도 쓴다). id는 'met'(꿈을 이룸)에만 쓴다 */
export function passes(s: Life5, id: DreamId | null, c: DreamCheck): boolean {
  const h = s.hero;
  switch (c.k) {
    case 'standing': return c.is.includes(h.standing);
    case 'flag': return c.any.some((f) => s.flags.includes(f));
    case 'bounty': return bountyOf(s) >= c.min;
    case 'fame': return h.fame >= c.min;
    case 'money': return h.money >= c.min;
    case 'rank': return h.rank >= c.min;
    case 'tier': return Math.max(...c.branch.map((b) => s.growth.tier[b])) >= c.min;
    case 'sea': return (SEA_BY_ID[h.sea]?.stage ?? 1) >= c.min;
    case 'islands': return islandsVisited(s, c.among) >= c.min;
    case 'bond': return s.people.filter((p) => p.alive && p.bond >= (c.at ?? 80)).length >= c.min;
    case 'int': return h.base.int >= c.min;
    case 'age': return s.age >= c.min;
    case 'crew': return s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && !p.crew.separatedMonths).length >= c.min;
    case 'rating': return rating5(s) >= c.min;
    case 'wealthMax': return c.is === 'poor' ? h.bornWealth === 'poor' : h.bornWealth === 'poor' || h.bornWealth === 'common';
    case 'any': return c.of.some((x) => passes(s, id, x));
    case 'met': return id !== null && ((s.dream?.id === id && s.dream.done !== null) || dreamMet(s, id));
  }
}

/** 숙련이 오를 갈래: 꿈이 정한 갈래 가운데 가장 높은 것, 없으면 지금 걷는 무술 갈래(없으면 가장 많이 단련한 갈래) */
function rewardBranch(s: Life5, id: DreamId): Branch {
  const list = DREAM_VOWS[id].branch ?? (s.growth.path ? [s.growth.path] : MARTIAL);
  return list.reduce((best, b) => (s.growth.tier[b] * V.growth.tierUp + s.growth.mastery[b] + s.growth.pref[b]
    > s.growth.tier[best] * V.growth.tierUp + s.growth.mastery[best] + s.growth.pref[best] ? b : best), list[0]);
}

/** 해가 바뀔 때(core/dreams.ts의 dreamYear 뒤): 지금 꿈의 다음 길목을 지났으면 한 길목만 보상한다 */
export function dreamVowYear(s: Life5): void {
  const d = s.dream;
  if (!d || !s.hero.alive) return;
  const vow = DREAM_VOWS[d.id];
  const st = dreamVowState(s);
  const n = st.cleared[d.id] ?? 0;
  const stage = vow.stages[n];
  if (!stage || !stage.all.every((c) => passes(s, d.id, c))) return;
  st.cleared[d.id] = n + 1;
  st.streak += 1;
  const R = DREAM_VOW_REWARD;
  const branch = rewardBranch(s, d.id);
  const statAdd = R.stat + (R.streakStat.includes(st.streak) ? 1 : 0);
  const masteryAdd = R.mastery + R.streakMastery * (st.streak - 1);
  s.hero.base[vow.stat] += statAdd;
  const total = vow.stages.length;
  const streakWord = st.streak >= 2 ? ` · 꿈을 지킨 연속 ${st.streak}` : '';
  // 장면 한 줄 끝에 실제 변화를 붙인다 (기록 한 줄)
  logLine(s, `${stage.done} 꿈의 서약 ${n + 1}/${total} · ${STAT_NAME[vow.stat]} +${statAdd} · ${BRANCH_NAME[branch]} 숙련 +${masteryAdd}${streakWord}.`, 'heavy', 'growth');
  addMastery(s, branch, masteryAdd);
  s.growth.pref[branch] += masteryAdd * V.growth.pref.fromMastery;
  s.timeline.push({ age: s.age, text: `꿈의 서약 ${n + 1}/${total}: ${stage.name}` });
  // 끝까지 꿈을 바꾸지 않고 모든 길목을 지났다: 그 갈래의 단계가 하나 오른다 (스승 없는 한계도 넘는다)
  if (n + 1 === total && st.streak === total) {
    const before = s.growth.tier[branch];
    const after = Math.min(V.growth.maxTier, before + 1);
    s.growth.tier[branch] = after;
    if (before === V.growth.maxTier) s.growth.mastery[branch] = V.growth.tierUp;
    if (isMartialBranch(branch)) {
      const style = focusedStyle(s, branch);
      s.growth.styleMastery[style] = Math.max(s.growth.styleMastery[style] ?? 0, after * V.growth.tierUp);
    }
    const to = st.to ? `${st.to}에게 한 약속을` : '스스로에게 한 약속을';
    logLine(s, `${to} 한 번도 바꾸지 않고 끝까지 지켰다. ${BRANCH_NAME[branch]} ${before}→${after}단계.`, 'heavy', 'growth');
    s.timeline.push({ age: s.age, text: `${DREAMS[d.id].name}의 약속을 끝까지 지켰다` });
  }
}

/** 인물 칸: 지금 꿈의 서약이 어디까지 왔는가 */
export function dreamVowView(s: Life5): { cleared: number; total: number; next: string | null; streak: number; to: string | null } | null {
  const d = s.dream;
  if (!d) return null;
  const st = dreamVowState(s);
  const stages = DREAM_VOWS[d.id].stages;
  const cleared = st.cleared[d.id] ?? 0;
  return { cleared, total: stages.length, next: stages[cleared]?.name ?? null, streak: st.streak, to: st.to };
}
