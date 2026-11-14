// 주인공 · 동료 · 적을 같은 형태(CUnit)로 바꾼다 (docs/02_설계/04_전투.md 1장).
import { B } from '../../data/balance';
import { ITEM_BY_ID } from '../../data/items';
import { SKILLS } from '../../data/skills';
import { statsAround } from '../../data/bosses';
import { armamentLevel, effectiveStats, getSkill, observationLevel } from '../growth/skillbook';
import { FRUIT_BY_ID } from '../../data/fruits';
import { traitOf } from '../people';
import { CREW_GEAR } from '../../data/upgrades';
import { enemyFruitId, fruitMods, heroMods, mergeMods } from './mods';
import { SPECIES_PASSIVES } from '../../data/passives';
import type { CUnit, EnemySpec, LifeState, Loadout, Person, Stats } from '../types';

const C = B.combat;

function blank(): Omit<CUnit, 'key' | 'name' | 'side' | 'hero' | 'leader' | 'role' | 'maxHp' | 'hp' | 'maxSp' | 'sp' | 'st' | 'def' | 'armament' | 'observation' | 'fruitClass' | 'skills' | 'tactic' | 'retreatAt' | 'weapon' | 'consumables' | 'faction' | 'species' | 'gender' | 'age' | 'faceKey' | 'mods'> {
  return { guard: 0, guardTurns: 0, evade: 0, evadeTurns: 0, buff: 0, buffTurns: 0, bound: 0, sealed: 0, pGuard: 0, pDodge: 0, pBuff: 0, lastBig: false };
}

function applyPassives(u: CUnit) {
  for (const k of u.skills) {
    const sk = getSkill(k.id);
    if (!sk || sk.kind !== 'passive' || !sk.effect) continue;
    const scale = 0.7 + 0.6 * k.mastery / 100;
    if (sk.effect.type === 'guard') u.pGuard += sk.effect.value * scale;
    if (sk.effect.type === 'dodge') u.pDodge += sk.effect.value * scale;
    if (sk.effect.type === 'buff') u.pBuff += sk.effect.value * scale;
  }
}

/** 패시브의 능력치 · 체력 · 기력 배율과 회피 · 방어를 유닛에 반영한다 */
function applyMods(u: CUnit) {
  const m = u.mods;
  if (m.stat) for (const [k, v] of Object.entries(m.stat)) u.st[k as keyof Stats] = Math.round(u.st[k as keyof Stats] * (v as number));
  if (m.hp) { u.maxHp = Math.round(u.maxHp * m.hp); u.hp = u.maxHp; }
  if (m.sp) { u.maxSp = Math.round(u.maxSp * m.sp); u.sp = u.maxSp; }
  u.pDodge += m.dodge ?? 0;
  u.pGuard += m.guard ?? 0;
}

function hpOf(st: Stats) { return C.hp.base + st.vit * C.hp.perVit; }
function spOf(st: Stats) { return C.sp.base + st.wil * C.sp.perWil; }

export function heroUnit(s: LifeState, lo: Loadout): CUnit {
  const st = effectiveStats(s);
  const health = C.hp.healthFloor + (1 - C.hp.healthFloor) * s.hero.hp / 100;
  const armor = lo.armor ? ITEM_BY_ID[lo.armor]?.armor ?? 0 : 0;
  const w = lo.weapon ? ITEM_BY_ID[lo.weapon] : null;
  const maxHp = Math.round(hpOf(st) * health);
  const u: CUnit = {
    ...blank(),
    key: 'hero', name: `${s.hero.surname} ${s.hero.name}`, side: 'L', hero: true, leader: true, role: 'hero',
    maxHp, hp: maxHp, maxSp: Math.round(spOf(st)), sp: Math.round(spOf(st)),
    st, def: st.vit * C.defPerVit + armor,
    armament: armamentLevel(s), observation: observationLevel(s),
    fruitClass: s.hero.fruit ? FRUIT_BY_ID[s.hero.fruit.id]?.cls ?? null : null,
    skills: lo.skills.filter((id) => s.growth.skills[id]).map((id) => ({ id, mastery: s.growth.skills[id].mastery, cd: 0 })),
    tactic: lo.tactic, retreatAt: lo.retreatAt,
    weapon: w && w.branch ? { branch: w.branch, mult: w.mult ?? 1, seastone: !!w.seastone } : null,
    consumables: [...lo.consumables],
    faction: s.hero.route === 'marine' ? 'marine' : s.hero.route === 'pirate' ? 'pirate' : s.hero.route === 'revolution' ? 'rev' : 'civil',
    species: s.hero.species, gender: s.hero.gender, age: s.hero.age,
    faceKey: `hero:${s.rng.seed}`,
    mods: heroMods(s),
  };
  applyPassives(u);
  applyMods(u);
  return u;
}

const ROLE_BIAS: Record<string, Partial<Stats>> = {
  vanguard: { str: 1.15, vit: 1.15, spd: 0.9, int: 0.6, wil: 0.8 },
  support: { spd: 1.15, int: 1.1, str: 0.9, vit: 0.85, wil: 0.8 },
  medic: { wil: 1.2, int: 1.1, str: 0.6, vit: 0.9 },
};
const ROLE_BRANCH: Record<string, string[]> = {
  vanguard: ['fist_jab', 'fist_combo', 'fist_guard', 'sword_cut', 'sword_flash', 'fist_quake'],
  support: ['gun_shot', 'gun_quick', 'gun_snipe', 'gun_smoke', 'gun_volley'],
  medic: [],
};

export function crewUnit(p: Person, stage: number): CUnit {
  const c = p.crew!;
  const tr = traitOf(p);
  const st = statsAround(c.power * CREW_GEAR[c.gear ?? 0].mult, ROLE_BIAS[c.role] ?? {});
  for (const [k, m] of Object.entries(tr.bias)) st[k as keyof Stats] = Math.round(st[k as keyof Stats] * (m as number));
  const tierMax = c.power < 25 ? 1 : c.power < 45 ? 2 : c.power < 80 ? 3 : 4;
  const skills = (ROLE_BRANCH[c.role] ?? []).filter((id) => (SKILLS.find((k) => k.id === id)?.tier ?? 9) <= tierMax).slice(0, 4);
  // 열매를 먹은 동료: 열매 패시브 (레벨이 오를수록 세진다)
  const fruit = c.fruit ? FRUIT_BY_ID[c.fruit] : null;
  const maxHp = Math.round(hpOf(st));
  const u: CUnit = {
    ...blank(),
    key: p.id, name: p.name, side: 'L', hero: false, leader: false, role: c.role,
    maxHp, hp: maxHp, maxSp: Math.round(spOf(st)), sp: Math.round(spOf(st)),
    st, def: st.vit * C.defPerVit, armament: stage >= 4 ? 1 : 0, observation: 0, fruitClass: fruit?.cls ?? null,
    skills: skills.map((id) => ({ id, mastery: Math.min(90, 30 + c.level * 3), cd: 0 })),
    tactic: tr.tactic, retreatAt: 0, weapon: null, consumables: [],
    personId: p.id, faction: p.faction, species: p.species, gender: p.gender, age: p.age,
    faceKey: p.canon ?? p.id + p.name,
    mods: mergeMods(SPECIES_PASSIVES[p.species]?.mods, fruitMods(fruit?.id, Math.min(100, c.level * 5), false)),
  };
  applyPassives(u);
  applyMods(u);
  u.pGuard += tr.passive.guard ?? 0; u.pDodge += tr.passive.dodge ?? 0; u.pBuff += tr.passive.buff ?? 0;
  return u;
}

export function enemyUnit(e: EnemySpec, leader: boolean, idx: number): CUnit {
  const st = { ...e.base };
  const maxHp = Math.round(hpOf(st) * (leader ? 1.1 : 1));
  const mastery = e.canon ? 75 : leader ? 55 : 40;
  const u: CUnit = {
    ...blank(),
    key: `e${idx}`, name: e.name, side: 'R', hero: false, leader, role: 'enemy',
    maxHp, hp: maxHp, maxSp: Math.round(spOf(st)), sp: Math.round(spOf(st)),
    st, def: st.vit * C.defPerVit, armament: e.armament, observation: e.observation, fruitClass: e.fruitClass,
    skills: e.skills.filter((id) => getSkill(id)).map((id) => ({ id, mastery, cd: 0 })),
    tactic: e.tactic, retreatAt: 0, weapon: null, consumables: [],
    faction: e.faction, species: e.species, gender: e.gender, age: e.age, form: e.form,
    faceKey: e.faceKey ?? e.canon ?? e.id + e.name,
    mods: mergeMods(SPECIES_PASSIVES[e.species]?.mods, fruitMods(enemyFruitId(e.skills, e.fruitId), e.canon ? 100 : 70, false)),
  };
  applyPassives(u);
  applyMods(u);
  return u;
}
