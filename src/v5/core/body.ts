// 몸: 잃은 부위와 의수 · 의족, 상처가 깎는 능력치, 몸이 막는 갈래.
// effectiveStats5는 힘(power.ts)과 전투 유닛이 쓰므로 fx · fight · year를 가져오지 않는다.
import { josa } from '../../core/josa';
import { pick, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { logLine } from './log';
import type { Branch, Life5, Limb, LimbState, StatKey, Stats } from './types';

export const LIMBS: readonly Limb[] = ['eyeL', 'eyeR', 'armL', 'armR', 'legL', 'legR'];
export const LIMB_NAME: Record<Limb, string> = {
  eyeL: '왼쪽 눈', eyeR: '오른쪽 눈', armL: '왼팔', armR: '오른팔', legL: '왼쪽 다리', legR: '오른쪽 다리',
};
/** 의수 · 의족을 다는 차례: 다리 → 팔 → 눈 */
const FIT_ORDER: readonly Limb[] = ['legL', 'legR', 'armL', 'armR', 'eyeL', 'eyeR'];
const EYES: readonly Limb[] = ['eyeL', 'eyeR'];
const ARMS: readonly Limb[] = ['armL', 'armR'];
const LEGS: readonly Limb[] = ['legL', 'legR'];
const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];

/** 부위가 해내는 몫: 온전하면 1, 잃으면 0, 돈으로 단 것은 일부, 기연으로 얻은 것은 원래보다 낫다 */
export function limbFactor(st: LimbState): number {
  switch (st) {
    case 'ok': return 1;
    case 'lost': return 0;
    case 'basic': return V.limb.basic;
    case 'superior': return V.limb.superior;
  }
}

const factorOf = (s: Life5, l: Limb) => limbFactor(s.hero.limbs[l]);

/** 아직 의수 · 의족을 달지 않은, 잃은 채로 남은 부위의 수 */
export function lostCount(s: Life5): number {
  return LIMBS.filter((l) => s.hero.limbs[l] === 'lost').length;
}

/** 한 부위의 벌점 배율: 온전하면 1, 잃으면 벌점 그대로, superior면 1보다 크다 */
function limbMult(s: Life5, l: Limb, penalty: number): number {
  return 1 - (1 - penalty) * (1 - factorOf(s, l));
}

/** 상처와 잃은 부위를 반영한 능력치. 어떤 능력치도 base × floor 아래로 내려가지 않는다 */
export function effectiveStats5(s: Life5): Stats {
  const h = s.hero;
  const st: Stats = { ...h.base };
  for (const inj of h.injuries) {
    if (inj.severity === 'scar') {
      if (inj.stat) st[inj.stat] = Math.max(0, st[inj.stat] - V.injury.scarAmount);
      continue;
    }
    for (const k of STAT_KEYS) st[k] *= V.injury.statMult[inj.severity];
  }
  for (const l of EYES) st.spd *= limbMult(s, l, V.limb.eye.spd);
  for (const l of ARMS) st.str *= limbMult(s, l, V.limb.arm.str);
  for (const l of LEGS) st.spd *= limbMult(s, l, V.limb.leg.spd);
  const blind = EYES.every((l) => factorOf(s, l) === 0);
  if (blind && s.growth.tier.observation < V.limb.blindSight) for (const k of STAT_KEYS) st[k] *= V.limb.bothEyes;
  for (const k of STAT_KEYS) st[k] = Math.max(st[k], h.base[k] * V.limb.floor);
  return st;
}

/** 몸이 이 갈래를 허락하는가: 사격은 두 팔, 검과 주먹은 한 팔이면 된다 */
export function canUse(s: Life5, branch: Branch): boolean {
  const arms = ARMS.map((l) => factorOf(s, l) > 0);
  switch (branch) {
    case 'gun': return arms.every(Boolean);
    case 'sword': case 'fist': return arms.some(Boolean);
    default: return true;
  }
}

/**
 * 몸 한 곳을 잃는다. 'random'이면 온전한 부위 가운데 하나. 온전하지 않은 부위는 다시 잃지 않는다.
 * 잃을 것이 없으면 아무것도 바꾸지 않고 null.
 */
export function loseLimb(s: Life5, limb: Limb | 'random', r: Rng): Limb | null {
  const ok = LIMBS.filter((l) => s.hero.limbs[l] === 'ok');
  const l = limb === 'random' ? (ok.length ? pick(r, ok) : null) : (ok.includes(limb) ? limb : null);
  if (!l) return null;
  s.hero.limbs[l] = 'lost';
  s.hardship += V.hardship.limb;
  s.stats.limbsLost += 1;
  const text = `${LIMB_NAME[l]}을(를) 잃었다.`;
  s.timeline.push({ age: s.age, text: josa(text) });
  if (!s.queue.includes('moment_limb')) s.queue.push('moment_limb');
  logLine(s, text, 'heavy', 'danger');
  return l;
}

/** 잃은 부위 하나(다리 → 팔 → 눈)에 그 등급을 단다. 'superior'는 돈으로 단 것('basic')도 낫게 바꾼다 */
export function fitProsthetic(s: Life5, grade: 'basic' | 'superior'): Limb | null {
  const from: LimbState[] = grade === 'superior' ? ['lost', 'basic'] : ['lost'];
  for (const st of from) {
    const l = FIT_ORDER.find((x) => s.hero.limbs[x] === st);
    if (l) { s.hero.limbs[l] = grade; return l; }
  }
  return null;
}
