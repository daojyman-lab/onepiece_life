import { ISLAND_PROFILES } from '../data/voyage';
import { V } from '../data/balance';
import { logLine } from './log';
import { topValues } from './values';
import type { Activity, Branch, Fx, Life5 } from './types';

export const environmentOf = (s: Life5) => ISLAND_PROFILES[s.hero.island]?.envEffect;

export function isNative(s: Life5, island: string): boolean {
  return island === s.hero.town || ISLAND_PROFILES[island]?.nativeImmunity?.home === s.hero.home;
}

export function islandImmunity(s: Life5, island = s.hero.island): boolean {
  return isNative(s, island) || !!ISLAND_PROFILES[island]?.nativeImmunity?.flags?.some((f) => s.flags.includes(f));
}

export function altitudeEffect(s: Life5) {
  return s.hero.skyAcclimating && !islandImmunity(s) ? environmentOf(s)?.arrival : undefined;
}

export function recoveryMultiplier(s: Life5): number {
  return altitudeEffect(s)?.recovery ?? environmentOf(s)?.commerce?.recovery ?? 1;
}

export function growthMultiplier(s: Life5, branch: Branch): number {
  return environmentOf(s)?.growthBonus?.[branch] ?? 1;
}

export function deepWater(s: Life5): void {
  const pressure = environmentOf(s)?.pressure;
  if (!pressure || !s.hero.fruit || islandImmunity(s)) return;
  s.hero.hp = Math.max(1, s.hero.hp - pressure.roamHp);
  logLine(s, '거품막 너머를 살피다 바닷물에 닿자 다리에 힘이 빠졌다.', 'light', 'life');
}

export function applyEnvironmentPart(s: Life5, activity: Activity, branch: Branch | null): void {
  const env = environmentOf(s);
  if (env?.climate && !islandImmunity(s)) {
    const { staminaDrain, trialGain, vitality, text } = env.climate;
    const disposition = topValues(s, 1)[0];
    if (disposition !== 'peace' && disposition !== 'inquiry') s.hero.hp = Math.max(1, s.hero.hp - staminaDrain);
    s.hardship += trialGain;
    s.hero.base.vit += vitality;
    const key = `climate:${s.hero.island}`;
    if (s.seen[key] !== s.age) {
      s.seen[key] = s.age;
      logLine(s, text, 'light', 'life');
    }
  }
  if (!env?.pressure) return;
  if (s.hero.fruit) {
    if (activity === 'roam') deepWater(s);
  } else if (activity === 'train' && (branch === 'fist' || branch === 'sword' || branch === 'gun')) {
    s.hero.base.str += env.pressure.strength;
  }
}

export function tradeEffects(fx?: Fx[]): boolean {
  return !!fx?.some((e) => e.op === 'buyWeapon' || e.op === 'serviceWeapon' || (e.op === 'money' && e.add > 0) ||
    (e.op === 'person' && e.kind === 'crew') || (e.op === 'chance' && (tradeEffects(e.then) || tradeEffects(e.else))));
}

export function localFightChance(s: Life5): number {
  return V.fight.minorP * (islandImmunity(s) ? 1 : environmentOf(s)?.localFights?.multiplier ?? 1);
}
