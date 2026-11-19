// 서약 규칙. 장편은 서약의 시작과 결산 시점만 지정하고, 성공 조건은 이곳에서 판정한다.
import { V } from '../data/balance';
import { VOWS } from '../data/vows';
import { logLine } from './state';
import type { Branch, Life5, VowState } from './types';

const state = (s: Life5): VowState => s.vows ?? (s.vows = { active: null, history: [] });

/** 서약할 자격. 장편의 잠금 조건과 별도로 실제 효과에서도 검증한다. */
export function canBeginVow(s: Life5, id: string): boolean {
  const d = VOWS[id];
  const vows = state(s);
  return !!d && !vows.active && !vows.history.some((h) => h.id === id)
    && s.values[d.value] >= V.value.deep
    && d.requires.every((flag) => s.flags.includes(flag))
    && d.forbids.every((flag) => !s.flags.includes(flag));
}

export function beginVow(s: Life5, id: string): boolean {
  if (!canBeginVow(s, id)) return false;
  const d = VOWS[id];
  state(s).active = { id, value: d.value, title: d.title, target: d.target, since: s.age, island: s.hero.island, progress: [] };
  logLine(s, `서약했다. ${d.title}.`, 'heavy', 'choice');
  return true;
}

/** 결말까지 본 뒤 한 번만 결산. 결과는 장편에서 실제로 남긴 표시로 판단한다. */
export function resolveVow(s: Life5, id: string, forcedFail = false): { reward: Branch | null; amount: number } | null {
  const vows = state(s);
  const d = VOWS[id];
  if (!d || vows.active?.id !== id) return null;
  const kept = !forcedFail && s.hero.alive && d.steps.every((step) => s.flags.includes(step.flag))
    && d.forbids.every((flag) => !s.flags.includes(flag));
  vows.active = null;
  vows.history.push({ id, result: kept ? 'kept' : 'failed' });
  if (!kept) {
    logLine(s, `${d.target}에게 건 약속을 끝내 지키지 못했다.`, 'heavy', 'life');
    return { reward: null, amount: 0 };
  }
  s.timeline.push({ age: s.age, text: `${d.target}에게 건 서약을 지켰다` });
  logLine(s, `${d.target}에게 건 약속을 지켰다. 그날의 결심이 몸에 남았다.`, 'heavy', 'growth');
  const branches: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun', 'observation', 'armament', 'conqueror', 'fruit'];
  const reward = s.growth.path ?? branches.reduce((best, b) => s.growth.pref[b] > s.growth.pref[best] ? b : best, 'fist');
  return { reward, amount: d.rewardMastery };
}

/** 문을 고른 뒤 표시를 반영하고, 약속한 장편의 마지막 문에서 자동 결산한다. */
export function advanceVow(s: Life5, turningId: string): { reward: Branch | null; amount: number } | null {
  const active = s.vows?.active;
  if (!active) return null;
  const d = VOWS[active.id];
  if (!d) return null;
  for (const step of d.steps) {
    if (s.flags.includes(step.flag) && !active.progress.includes(step.name)) active.progress.push(step.name);
  }
  if (d.forbids.some((flag) => s.flags.includes(flag)) || turningId === d.closingTurning) {
    return resolveVow(s, d.id);
  }
  return null;
}

/** 장편을 떠나거나 한 해가 지나면 서약이 무기한 남지 않도록 실패 처리한다. */
export function expireVow(s: Life5): void {
  const active = s.vows?.active;
  if (active && (s.hero.island !== active.island || s.age > active.since)) resolveVow(s, active.id, true);
}
