import { TALENT_BY_ID } from '../shared/data/talents';
import { HERO_TRAIT_BY_ID, type Mods } from '../shared/data/passives';
import { mergeMods } from '../shared/core/combat/mods';
import { NEW_TRAITS, TRAIT_BY_ID, type TraitEffects, type TraitTrigger } from '../data/traits';
import { STRENGTHS } from '../data/strengths';
import { logLine } from './log';
import type { Branch, Life5, Stats, TraitState } from './types';

export const TRAIT_LIMIT = 5;
const LEGACY_STRENGTH: Record<string, string> = {
  unyielding: 'tenacity', obsession: 'vampire', composure: 'coolhead', fellowship: 'comrade', daring: 'gambler', rebel: 'fighting',
};
const BRANCH_KEYS: Record<Branch, string> = {
  fist: 'martial.fist', sword: 'martial.sword', gun: 'martial.gun',
  polearm: 'weapon.polearm', blunt: 'weapon.blunt',
  observation: 'haki.observation', armament: 'haki.armament', conqueror: 'haki.conqueror', fruit: 'fruit',
};

export function ownedTraitIds(s: Life5): string[] {
  return [...new Set([...s.hero.talents, ...s.strengths, ...(Array.isArray(s.traits?.earned) ? s.traits.earned : [])])];
}

function compatible(ids: string[]): boolean {
  return ids.every((id, index) => ids.slice(index + 1).every(other => {
    const a = TRAIT_BY_ID[id];
    const b = TRAIT_BY_ID[other];
    const excludes = [...(a?.excludes ?? TALENT_BY_ID[id]?.excludes ?? [])];
    const reverse = b?.excludes ?? TALENT_BY_ID[other]?.excludes ?? [];
    return !excludes.includes(other) && !reverse.includes(id) && !(a?.family && a.family === b?.family);
  }));
}

export function activeTraitIds(s: Life5): string[] {
  // A pre-expansion save remains readable before normalization.
  const chosen = s.traits?.active ?? ownedTraitIds(s);
  return [...new Set(chosen)].filter(id => ownedTraitIds(s).includes(id)).slice(0, TRAIT_LIMIT);
}

export function hasTrait(s: Life5, id: string): boolean {
  return activeTraitIds(s).includes(id);
}

export function initializeTraits(s: Life5): TraitState {
  if (!s.traits) s.traits = { earned: [], active: ownedTraitIds(s).slice(0, TRAIT_LIMIT), evidence: {}, changedAt: null, crewSeen: [] };
  return s.traits;
}

/** Called once on load, never rerolls birth gifts or reapplies rewards. */
export function normalizeTraits(s: Life5): void {
  const t = initializeTraits(s);
  if (!Array.isArray(t.earned)) t.earned = [];
  t.earned = [...new Set(t.earned.filter(id => typeof id === 'string' && !!TRAIT_BY_ID[id]))];
  if (!t.evidence || typeof t.evidence !== 'object' || Array.isArray(t.evidence)) t.evidence = {};
  for (const key of Object.keys(t.evidence)) {
    const list = t.evidence[key];
    t.evidence[key] = Array.isArray(list) ? [...new Set(list.filter(x => typeof x === 'string'))].slice(0, 100) : [];
  }
  if (!Array.isArray(t.active)) t.active = ownedTraitIds(s).slice(0, TRAIT_LIMIT);
  const active: string[] = [];
  for (const id of t.active) if (ownedTraitIds(s).includes(id) && compatible([...active, id]) && !active.includes(id) && active.length < TRAIT_LIMIT) active.push(id);
  t.active = active;
  if (!Array.isArray(t.crewSeen)) t.crewSeen = [];
  t.changedAt = typeof t.changedAt === 'number' && Number.isFinite(t.changedAt) ? t.changedAt : null;
}

export function canSelectTraits(s: Life5): boolean {
  return s.hero.alive && !s.pending && !s.passage && !s.queue.length
    && (initializeTraits(s).changedAt === null || s.age > s.traits!.changedAt!);
}

export function traitSelectionError(s: Life5, ids: string[]): string | null {
  if (!canSelectTraits(s)) return '사건과 항해를 마친 뒤 연 1회 정리할 수 있다.';
  if (ids.length > TRAIT_LIMIT) return '동시에 적용할 특성은 최대 5개다.';
  if (new Set(ids).size !== ids.length || ids.some(id => !ownedTraitIds(s).includes(id))) return '보유한 특성을 골라야 한다.';
  if (!compatible(ids)) return '충돌하는 특성이나 같은 계열의 상·하위 특성은 함께 적용할 수 없다.';
  return null;
}
export function selectTraits(s: Life5, ids: string[]): boolean {
  if (traitSelectionError(s, ids)) return false;
  const t = initializeTraits(s);
  t.active = [...ids];
  t.changedAt = s.age;
  logLine(s, '특성을 정리했다. ' + (ids.map(traitName).join(' · ') || '이번에는 적용하지 않는다.'), 'light');
  return true;
}

export function traitName(id: string): string {
  return TRAIT_BY_ID[id]?.name ?? TALENT_BY_ID[id]?.name ?? STRENGTHS.find(t => t.id === id)?.name ?? id;
}

export function traitDescription(id: string): string {
  return TRAIT_BY_ID[id]?.desc ?? TALENT_BY_ID[id]?.desc ?? HERO_TRAIT_BY_ID[LEGACY_STRENGTH[id]]?.desc ?? '';
}

export function acquireTrait(s: Life5, id: string): void {
  const t = initializeTraits(s);
  if (ownedTraitIds(s).includes(id)) return;
  t.earned.push(id);
  const def = TRAIT_BY_ID[id];
  const lower = t.active.find(old => def?.family && TRAIT_BY_ID[old]?.family === def.family && (TRAIT_BY_ID[old]?.rank ?? 0) < (def.rank ?? 0));
  if (lower) t.active = t.active.map(old => old === lower ? id : old);
  else if (t.active.length < TRAIT_LIMIT && compatible([...t.active, id])) t.active.push(id);
  logLine(s, `특성 「${traitName(id)}」을 얻었다. ${traitDescription(id)}${t.active.includes(id) ? '' : ' 인물창에서 적용할 수 있다.'}`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: `특성 「${traitName(id)}」을 얻었다` });
}

/** Distinct choices, opponents, people, or years, not reloading the same scene. */
export function recordTraitEvent(s: Life5, kind: TraitTrigger, key: string, source: string): void {
  const t = initializeTraits(s);
  if (kind === 'activity' && key === 'study' || kind === 'master' || kind === 'loss') {
    const name = kind === 'activity' ? 'practice:study' : 'practice:' + kind;
    const list = t.evidence[name] ?? (t.evidence[name] = []);
    if (!list.includes(source) && list.length < 20) list.push(source);
  }
  const owned = new Set(ownedTraitIds(s));
  for (const def of NEW_TRAITS) {
    const earn = def.earn;
    if (!earn || earn.kind !== kind || (earn.key && earn.key !== key) || owned.has(def.id)) continue;
    const seen = t.evidence[def.id] ?? (t.evidence[def.id] = []);
    if (!seen.includes(source)) seen.push(source);
    if (seen.length >= earn.count) acquireTrait(s, def.id);
  }
}

function conditionMet(s: Life5, condition: TraitEffects['condition']): boolean {
  switch (condition) {
    case undefined: return true;
    case 'sea': return !!s.passage || !!s.traitScene?.includes('sea');
    case 'home': return !s.passage && s.hero.island === s.hero.town;
    case 'crew': return s.people.some(p => p.alive && p.crew && p.crew.injuredMonths <= 0);
    case 'injured': return s.hero.injuries.length > 0;
    case 'lowHp': return s.hero.hp <= 40;
    case 'sword': case 'gun': case 'fist': return s.growth.path === condition;
    case 'prosthetic': return Object.values(s.hero.limbs).some(l => l === 'basic' || l === 'superior');
    case 'height': return !s.passage && ['엔젤섬', '샨디아 마을', '스카이피아', '어퍼 야드'].includes(s.hero.island);
    case 'day': return !s.traitScene?.includes('night') && !s.traitScene?.includes('underground');
    case 'night': case 'underground': return !!s.traitScene?.includes(condition);
  }
}

export function traitEffects(s: Life5): TraitEffects[] {
  return activeTraitIds(s).flatMap(id => {
    const effects = TRAIT_BY_ID[id]?.effects;
    return effects && conditionMet(s, effects.condition) ? [effects] : [];
  });
}

type Factor = 'discount' | 'income' | 'healing' | 'injury' | 'illness' | 'oldAge' | 'coordination' | 'danger' | 'chance' | 'bond';
export function traitFactor(s: Life5, key: Factor): number {
  const additive = key === 'discount' || key === 'coordination' || key === 'chance';
  let result = additive ? 0 : 1;
  let surcharge = 0;
  for (const effect of traitEffects(s)) {
    if (key === 'discount' && (effect.discount ?? 0) < 0) { surcharge += effect.discount!; continue; }
    if (effect[key] !== undefined) result = additive ? Math.max(result, effect[key]!) : result * effect[key]!;
  }
  for (const id of activeTraitIds(s)) {
    const legacy = TALENT_BY_ID[id];
    if (legacy && (key === 'injury' || key === 'illness' || key === 'oldAge')) result *= legacy[key] ?? 1;
  }
  if (key === 'discount') return Math.min(.25, Math.max(-.25, result + surcharge));
  if (key === 'coordination') return Math.min(.2, Math.max(0, result));
  if (key === 'chance') return Math.min(.15, Math.max(-.15, result));
  return Math.min(2, Math.max(.5, result));
}

export function tradeCost(s: Life5, amount: number): number {
  return Math.ceil(Math.max(0, amount) * (1 - traitFactor(s, 'discount')));
}

export function traitModifiers(s: Life5): Mods {
  const mods = mergeMods(...activeTraitIds(s).map(id => TALENT_BY_ID[id]?.mods ?? HERO_TRAIT_BY_ID[LEGACY_STRENGTH[id]]?.mods), ...traitEffects(s).map(e => e.mods));
  for (const key of ['crit', 'dodge'] as const) if (mods[key] !== undefined) mods[key] = Math.max(-.15, Math.min(.15, mods[key]!));
  return mods;
}

export function traitStats(s: Life5): Stats {
  const st = { ...s.hero.base };
  // Existing birth stats were added to base. Remove only the gifts switched off.
  for (const id of s.hero.talents) if (!hasTrait(s, id)) {
    for (const [key, value] of Object.entries(TALENT_BY_ID[id]?.stat ?? {})) st[key as keyof Stats] -= value!;
  }
  for (const effects of traitEffects(s)) for (const [key, value] of Object.entries(effects.stats ?? {})) st[key as keyof Stats] += value!;
  for (const key of Object.keys(st) as (keyof Stats)[]) st[key] = Math.max(0, st[key]);
  return st;
}

export function traitMastery(s: Life5, branch: Branch): number {
  const legacyKey = BRANCH_KEYS[branch];
  const keys = branch === 'observation' || branch === 'armament' || branch === 'conqueror' ? [branch, 'all', 'haki'] : [branch, 'all'];
  let mult = 1;
  for (const id of activeTraitIds(s)) {
    const mastery = TALENT_BY_ID[id]?.mastery;
    mult *= mastery?.[legacyKey as keyof typeof mastery] ?? 1;
    mult *= mastery?.all ?? 1;
    if (keys.includes('haki')) mult *= mastery?.haki ?? 1;
  }
  for (const effects of traitEffects(s)) for (const key of keys) mult *= effects.mastery?.[key as keyof NonNullable<TraitEffects['mastery']>] ?? 1;
  return Math.max(.5, Math.min(1.8, mult));
}

export function coordinationPower(s: Life5, ownPower: number): number {
  const share = traitFactor(s, 'coordination');
  const crew = s.people.filter(p => p.alive && p.crew && p.crew.injuredMonths <= 0);
  return Math.min(ownPower * .2, crew.reduce((sum, p) => sum + p.crew!.power, 0) * share);
}



/** Two prepared attempts at most, with one real year between attempts. */
export function nextTraitAwakening(s: Life5): string | null {
  if (s.age < 16 || s.passage || s.hero.standing === 'prisoner') return null;
  const t = initializeTraits(s);
  for (const branch of ['observation', 'armament', 'conqueror'] as const) {
    const id = 'trait_awaken_' + branch;
    if (s.growth.tier[branch] || s.flags.includes('trait_awaken_declined_' + branch) || (s.seenCount[id] ?? 0) >= 2 || (s.seen[id] !== undefined && s.age <= s.seen[id])) continue;
    const practices = t.evidence['practice:master']?.length ?? 0;
    if (branch === 'conqueror') {
      if (hasTrait(s, 'conqueror') && (t.evidence['practice:loss']?.length ?? 0) > 0) return id;
    } else if (practices >= 2 || branch === 'observation' && (t.evidence['practice:study']?.length ?? 0) >= 2) return id;
  }
  return null;
}
