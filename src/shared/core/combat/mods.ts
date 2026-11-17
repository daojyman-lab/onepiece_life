// 패시브(특성 · 열매)를 합치고 숙련에 맞춰 키운다. 전투 규칙은 engine.ts가 Mods를 읽어 적용한다.
import { FRUIT_PASSIVES, HERO_TRAIT_BY_ID, SPECIES_PASSIVES, type Mods } from '../../data/passives';
import type { LifeState, Stats } from '../types';
import { talentsOf } from '../util';

const MUL: (keyof Mods)[] = ['dmg', 'phys', 'take', 'hp', 'sp'];
const ADD: (keyof Mods)[] = ['dodge', 'guard', 'regen', 'drain', 'bindOnHit', 'sealOnHit', 'crit', 'lowHpPower', 'opening', 'allyDown', 'atSea', 'counter'];

/** 여러 패시브를 하나로: 배율은 곱하고, 더하는 값은 더한다 */
export function mergeMods(...list: (Mods | undefined | null)[]): Mods {
  const out: Mods = {};
  for (const m of list) {
    if (!m) continue;
    for (const k of MUL) if (m[k] !== undefined) (out as Record<string, number>)[k] = ((out as Record<string, number>)[k] ?? 1) * (m[k] as number);
    for (const k of ADD) if (m[k] !== undefined) (out as Record<string, number>)[k] = ((out as Record<string, number>)[k] ?? 0) + (m[k] as number);
    if (m.stat) { out.stat ??= {}; for (const [k, v] of Object.entries(m.stat)) out.stat[k as keyof Stats] = (out.stat[k as keyof Stats] ?? 1) * (v as number); }
    if (m.resist) { out.resist ??= {}; for (const [k, v] of Object.entries(m.resist)) out.resist[k as keyof typeof out.resist] = Math.min(out.resist[k as keyof typeof out.resist] ?? 1, v as number); }
    if (m.critMult) out.critMult = Math.max(out.critMult ?? 0, m.critMult);
    if (m.element) out.element = m.element;
    if (m.proc) out.proc = { ...m.proc };
    if (m.lastStand) out.lastStand = true;
  }
  return out;
}

/** 숙련에 맞춰 효과 크기를 줄인다: s = 0.6 + 0.4 × 숙련/100 */
export function scaleMods(m: Mods, mastery: number): Mods {
  const s = 0.6 + 0.4 * Math.max(0, Math.min(100, mastery)) / 100;
  const out: Mods = { ...m };
  for (const k of MUL) if (m[k] !== undefined) (out as Record<string, number>)[k] = 1 + ((m[k] as number) - 1) * s;
  for (const k of ADD) if (m[k] !== undefined) (out as Record<string, number>)[k] = (m[k] as number) * s;
  if (m.stat) out.stat = Object.fromEntries(Object.entries(m.stat).map(([k, v]) => [k, 1 + ((v as number) - 1) * s])) as Partial<Stats>;
  if (m.resist) out.resist = Object.fromEntries(Object.entries(m.resist).map(([k, v]) => [k, 1 - (1 - (v as number)) * s]));
  if (m.proc) out.proc = { ...m.proc, p: m.proc.p * s };
  return out;
}

/** 열매의 패시브 (각성했으면 각성 패시브) */
export function fruitMods(fruitId: string | null | undefined, mastery: number, awakened: boolean): Mods | null {
  if (!fruitId) return null;
  const fp = FRUIT_PASSIVES[fruitId];
  if (!fp) return null;
  return scaleMods(awakened && fp.awaken ? fp.awaken : fp.mods, mastery);
}

export function heroAwakened(s: LifeState) {
  return !!s.hero.fruit && s.growth.gates.includes('fruit.awaken') && !!FRUIT_PASSIVES[s.hero.fruit.id]?.awaken;
}

/** 주인공의 패시브: 특성 + 열매 */
export function heroMods(s: LifeState): Mods {
  const trait = s.hero.persona ? HERO_TRAIT_BY_ID[s.hero.persona]?.mods : undefined;
  return mergeMods(SPECIES_PASSIVES[s.hero.species]?.mods, trait, ...talentsOf(s).map((t) => t.mods), fruitMods(s.hero.fruit?.id, s.growth.fruitMastery ?? 0, heroAwakened(s)));
}

/** 적의 열매: 정해진 열매가 없으면 기술 id(fruit:열매:번호)에서 찾는다 */
export function enemyFruitId(skills: string[], fruitId?: string): string | undefined {
  if (fruitId) return fruitId;
  const f = skills.find((x) => x.startsWith('fruit:'));
  return f ? f.split(':')[1] : undefined;
}
