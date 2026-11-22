// 섬 서약(하늘섬 티카의 피난길): 장편 안에서 걸고, 장편의 표시로 지켰는지 판정한다.
// 꿈의 서약(core/dream-vow.ts)과는 따로 간다. 보상은 섬 이야기의 몫(숙련 rewardMastery)뿐이다.
import { VOWS } from '../data/vows';
import { logLine } from './log';
import { livingContact } from './needs';
import { opensSpecial } from './values';
import type { Branch, Life5, VowState } from './types';

const state = (s: Life5): VowState => s.vows ?? (s.vows = { active: null, history: [] });
const branchOf = (s: Life5): Branch => {
  if (s.growth.path) return s.growth.path;
  const branches: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun'];
  return branches.reduce((best, branch) => s.growth.pref[branch] > s.growth.pref[best] ? branch : best, 'fist');
};

/** 화면의 잠금과 실제 효과가 같은 자격을 쓴다. 진행 중인 섬 서약이 없고, 같은 서약을 건 적이 없어야 한다.
 *  앞선 선택의 표시(requires)로 잠긴 특별한 문에서 걸리므로 그 문과 같은 문턱을 쓴다 */
export function canBeginVow(s: Life5, id: string): boolean {
  const d = VOWS[id];
  const vows = state(s);
  if (!d || vows.active || vows.history.some((entry) => entry.id === id)) return false;
  return opensSpecial(s, d.value, true)
    && d.requires.every((flag) => s.flags.includes(flag))
    && d.forbids.every((flag) => !s.flags.includes(flag));
}

export function beginVow(s: Life5, id: string): boolean {
  if (!canBeginVow(s, id)) return false;
  const d = VOWS[id];
  const guide = id === 'sky_tika_guard' ? livingContact(s, { relation: '구름 해안의 배달꾼 티카' }) : undefined;
  state(s).active = {
    id, value: d.value, title: d.title, target: guide?.name ?? d.target, since: s.age, island: s.hero.island, progress: [],
    ...(guide ? { targetPersonId: guide.id } : {}),
  };
  logLine(s, `${guide?.name ?? d.target}에게 약속했다. ${d.title}.`, 'heavy', 'choice');
  return true;
}

/** 장편의 마지막 장면에서 한 번만 결산한다. 지켰으면 섬 이야기의 몫(숙련)을 돌려준다 */
export function resolveVow(s: Life5, id: string, forcedFail = false): { reward: Branch | null; amount: number } | null {
  const vows = state(s);
  const d = VOWS[id];
  const active = vows.active;
  if (!d || !active || active.id !== id) return null;
  const personAlive = !active.targetPersonId || s.people.some((person) => person.id === active.targetPersonId && person.alive);
  const kept = !forcedFail && s.hero.alive && personAlive
    && d.steps.every((step) => s.flags.includes(step.flag))
    && d.forbids.every((flag) => !s.flags.includes(flag));
  vows.active = null;
  vows.history.push({ id, result: kept ? 'kept' : 'failed' });
  if (!kept) {
    logLine(s, `${active.target}에게 한 약속을 끝내 지키지 못했다.`, 'heavy', 'life');
    return { reward: null, amount: 0 };
  }
  s.timeline.push({ age: s.age, text: `${active.target}에게 한 약속을 지켰다` });
  if (d.awakening) s.queue.push(d.awakening);
  return { reward: branchOf(s), amount: d.rewardMastery };
}

/** 문을 고른 뒤 장편의 표시를 반영하고, 마지막 장면에서 결산한다 */
export function advanceVow(s: Life5, turningId: string): { reward: Branch | null; amount: number } | null {
  const active = s.vows?.active;
  if (!active) return null;
  const d = VOWS[active.id];
  if (!d) return null;
  for (const step of d.steps) {
    if (s.flags.includes(step.flag) && !active.progress.includes(step.name)) active.progress.push(step.name);
  }
  if (d.forbids.some((flag) => s.flags.includes(flag)) || turningId === d.closingTurning) return resolveVow(s, d.id);
  return null;
}

/** 섬을 떠나거나 해가 바뀌면 섬 서약은 지키지 못한 것으로 끝난다 */
export function expireVow(s: Life5): void {
  const active = s.vows?.active;
  if (!active) return;
  if (!VOWS[active.id]) { state(s).active = null; return; }       // 옛 저장의 생애 서약(없어진 서약)은 조용히 내려놓는다
  if (s.hero.island !== active.island || s.age > active.since) resolveVow(s, active.id, true);
}
