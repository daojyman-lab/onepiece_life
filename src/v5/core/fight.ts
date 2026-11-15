// 싸움: 붙을지 물러날지를 묻고, 붙으면 v4의 자동 전투로 끝까지 돌린 뒤 결과를 몸과 마음에 남긴다.
import { B } from '../../data/balance';
import { makeEnemy } from '../../data/bosses';
import { FRUIT_BY_ID } from '../../data/fruits';
import { HERO_TRAIT_BY_ID, SPECIES_PASSIVES } from '../../data/passives';
import { SEA_BY_ID, SEAS } from '../../data/seas';
import { TALENT_BY_ID } from '../../data/talents';
import { runBattle, startBattle } from '../../core/combat/engine';
import { fruitMods, mergeMods } from '../../core/combat/mods';
import { crewUnit, enemyUnit } from '../../core/combat/units';
import { branchSkills, getSkill } from '../../core/growth/skillbook';
import { chance, hashString, int, pick, rngOf, type Rng } from '../../core/rng';
import { fill } from '../../core/util';
import { V } from '../data/balance';
import { FOES, MINOR_FIGHT_CHOICE, MINOR_FIGHT_TEXT, MINOR_FOE_NAMES } from '../data/foes';
import { HOMES } from '../data/homes';
import { VALUE_TACTIC } from '../data/values';
import { fullName } from './birth';
import { canUse, effectiveStats5, loseLimb } from './body';
import { applyFx } from './fx';
import { BRANCH_ID, power5 } from './power';
import { logLine } from './state';
import { leanPick, topValues } from './values';
import type { BattleState, Branch, EnemySpec, Life5, Person, Standing, Stats } from './types';
import type { CUnit, Skill } from '../../core/types';

const C = B.combat;
const F = V.fight;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const sum = (st: Stats) => Object.values(st).reduce((a, b) => a + b, 0);

/** 싸움 물음의 답 */
export const ENGAGE = 0, BACK_OFF = 1;
/** 이름 있는 상대를 이긴 뒤 줄을 서는 전환점: 쓰러진 적을 어떻게 할지 */
const AFTER_FIGHT = 'after_fight';

/** 정신적 강점 → 싸움에 걸리는 v4의 특성 */
const STRENGTH_TRAIT: Record<string, string> = {
  unyielding: 'tenacity', obsession: 'vampire', composure: 'coolhead', fellowship: 'comrade', daring: 'gambler', rebel: 'fighting',
};

const FACTION: Partial<Record<Standing, Person['faction']>> = {
  pirate: 'pirate', warlord: 'pirate', marine: 'marine', cp: 'marine', revolution: 'rev',
};

// ---------------------------------------------------------------- 힘과 위험

/** 간부를 빼고 한 사람의 힘. 패기 · 열매를 단계로 바꿔 주인공의 힘(power5)과 같은 잣대로 센다 */
function soloPower(e: EnemySpec): number {
  const tier = Math.max(e.armament * F.hakiTier, e.observation * F.hakiTier, e.fruitClass ? F.fruitTier : 0);
  return sum(e.base) * (1 + tier * V.growth.tierPower);
}

/** 상대의 힘: 우두머리 + 간부의 몫 */
export function foePower(e: EnemySpec): number {
  return soloPower(e) + e.officers.reduce((a, o) => a + soloPower(o) * F.officerShare, 0);
}

/**
 * 지금 있는 바다의 위험: 그 바다에서 만나는 상대의 힘(v4 enemyPower 범위)의 가운데 값.
 * 아직 어려서 고향 섬에 있으면 어느 바다에서 태어났든 가장 낮은 바다의 위험 속에 산다.
 */
export function dangerOf(s: Life5): number {
  const atHome = s.age <= F.dangerKidAge && s.hero.island === HOMES[s.hero.home].island;
  const sea = atHome ? SEAS.reduce((a, b) => (b.stage < a.stage ? b : a)) : SEA_BY_ID[s.hero.sea];
  const [lo, hi] = sea.enemyPower;
  return lo + (hi - lo) / 2;
}

/** 상대의 힘 ÷ 내 힘. 1보다 크면 상대가 세다 */
export function gapOf(s: Life5, e: EnemySpec): number {
  return foePower(e) / Math.max(F.minPower, power5(s));
}

/** 졌을 때 다치고, 몸 한 곳을 잃고, 죽을 확률. 목숨을 걸지 않은 싸움에서는 죽지 않는다 */
export function riskOf(s: Life5, e: EnemySpec, lethal: boolean): { injury: number; limb: number; death: number } {
  const gap = gapOf(s, e);
  return {
    injury: clamp(F.injuryBase + F.injuryPerGap * (gap - F.injuryGapFrom), F.injuryFloor, F.injuryCap),
    limb: clamp(F.limbPerGap * (gap - F.limbGapFrom), 0, F.limbCap),
    death: lethal ? clamp(F.deathPerGap * (gap - F.deathGapFrom), 0, F.deathCap) : 0,
  };
}

// ---------------------------------------------------------------- 주인공의 전투 유닛

/** 갈래의 단계로 정한 기술 숙련 (v4 기술 숙련 0~100) */
function skillMastery(tier: number): number {
  const M = F.skillMastery;
  return clamp(M.base + M.span * tier / V.growth.maxTier, 0, M.max);
}

/** 패기 단계 → 전투의 패기 레벨 0~3 */
function hakiLevel(tier: number): number {
  return Math.min(F.hakiLevelMax, Math.floor(tier / F.hakiLevelPer));
}

/** 연 갈래(몸이 허락하는 것만)의 기술 가운데 그 갈래의 단계까지 닿은 것. 높은 단계부터 최대 maxSkills개 */
function heroSkills(s: Life5): CUnit['skills'] {
  const got: { sk: Skill; b: Branch }[] = [];
  for (const b of Object.keys(BRANCH_ID) as Branch[]) {
    const tier = s.growth.tier[b];
    if (tier <= 0 || !canUse(s, b)) continue;
    for (const sk of branchSkills(BRANCH_ID[b], s.hero.fruit?.id ?? null)) if (sk.tier <= tier) got.push({ sk, b });
  }
  return got.sort((x, y) => y.sk.tier - x.sk.tier).slice(0, F.maxSkills)
    .map(({ sk, b }) => ({ id: sk.id, mastery: skillMastery(s.growth.tier[b]), cd: 0 }));
}

/** 패시브 기술과 특성 · 열매 패시브를 유닛에 반영한다 (v4 units.ts와 같은 규칙) */
function applyPassives(u: CUnit): void {
  for (const k of u.skills) {
    const sk = getSkill(k.id);
    if (!sk || sk.kind !== 'passive' || !sk.effect) continue;
    const scale = F.passiveScale.base + F.passiveScale.span * k.mastery / F.skillMastery.max;
    if (sk.effect.type === 'guard') u.pGuard += sk.effect.value * scale;
    if (sk.effect.type === 'dodge') u.pDodge += sk.effect.value * scale;
    if (sk.effect.type === 'buff') u.pBuff += sk.effect.value * scale;
  }
  const m = u.mods;
  if (m.stat) for (const [k, v] of Object.entries(m.stat)) u.st[k as keyof Stats] = Math.round(u.st[k as keyof Stats] * (v as number));
  if (m.hp) { u.maxHp = Math.round(u.maxHp * m.hp); u.hp = u.maxHp; }
  if (m.sp) { u.maxSp = Math.round(u.maxSp * m.sp); u.sp = u.maxSp; }
  u.pDodge += m.dodge ?? 0;
  u.pGuard += m.guard ?? 0;
}

/** v5 상태에서 주인공의 전투 유닛을 만든다. 편성 화면이 없으므로 기술 · 전술 · 물러날 때는 저절로 정해진다 */
export function heroUnit5(s: Life5): CUnit {
  const h = s.hero;
  const st: Stats = effectiveStats5(s);
  const health = C.hp.healthFloor + (1 - C.hp.healthFloor) * h.hp / V.hp.max;
  const maxHp = Math.round((C.hp.base + st.vit * C.hp.perVit) * health);
  const maxSp = Math.round(C.sp.base + st.wil * C.sp.perWil);
  const top = topValues(s, 1)[0];
  const traits = s.strengths.filter((id) => STRENGTH_TRAIT[id]).map((id) => HERO_TRAIT_BY_ID[STRENGTH_TRAIT[id]]?.mods);
  const u: CUnit = {
    key: 'hero', name: fullName(h), side: 'L', hero: true, leader: true, role: 'hero',
    maxHp, hp: maxHp, maxSp, sp: maxSp,
    st, def: st.vit * C.defPerVit,
    armament: hakiLevel(s.growth.tier.armament), observation: hakiLevel(s.growth.tier.observation),
    fruitClass: h.fruit ? FRUIT_BY_ID[h.fruit.id]?.cls ?? null : null,
    skills: heroSkills(s),
    tactic: top ? VALUE_TACTIC[top] : 'endurance',
    retreatAt: s.strengths.includes('rebel') ? F.retreat.never : top === 'peace' ? F.retreat.calm : F.retreat.usual,
    weapon: null, consumables: [],
    guard: 0, guardTurns: 0, evade: 0, evadeTurns: 0, buff: 0, buffTurns: 0, bound: 0, sealed: 0,
    pGuard: 0, pDodge: 0, pBuff: 0, lastBig: false,
    faction: FACTION[h.standing] ?? 'civil', species: h.species, gender: h.gender, age: s.age,
    faceKey: `hero:${s.rng.seed}`,
    mods: mergeMods(SPECIES_PASSIVES[h.species]?.mods, ...h.talents.map((t) => TALENT_BY_ID[t]?.mods), ...traits,
      fruitMods(h.fruit?.id, skillMastery(s.growth.tier.fruit), false)),
  };
  applyPassives(u);
  return u;
}

// ---------------------------------------------------------------- 전투

/**
 * 주인공과 동료, 상대와 간부로 전투를 꾸려 끝까지 자동으로 돌린다.
 * 짝 짓기는 v4 defaultAssign과 같다: 주인공은 우두머리, 싸우는 동료(선봉 · 지원)는 간부를 차례로 맡고 남으면 우두머리.
 */
function fightBattle(s: Life5, foe: EnemySpec): BattleState {
  const crew = s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && p.crew.injuredMonths <= 0);
  const stage = SEA_BY_ID[s.hero.sea].stage;   // v5에는 단계가 없으니 지금 있는 바다의 단계로
  const units: CUnit[] = [heroUnit5(s), ...crew.map((p) => crewUnit(p, stage))];
  const enemyStart = units.length;
  units.push(enemyUnit(foe, true, 0));
  foe.officers.forEach((o, i) => units.push(enemyUnit(o, false, i + 1)));
  const assign: Record<number, number> = { 0: enemyStart };
  let next = 1;
  crew.forEach((p, i) => {
    const fights = p.crew!.role === 'vanguard' || p.crew!.role === 'support';
    assign[i + 1] = enemyStart + (fights && next <= foe.officers.length ? next++ : 0);
  });
  const seed = hashString(String(rngOf(s.rng)()));
  return runBattle(startBattle(units, assign, seed, false), true);
}

function startFight(s: Life5, foe: EnemySpec, lethal: boolean): void {
  const battle = fightBattle(s, foe);
  s.pending = { kind: 'battle', foe, lethal, battle, result: battle.result ?? 'lose' };
}

/** 이름 있는 상대와 마주친다. 물러날 수 없는 싸움이면 바로 싸우고, 아니면 위험을 보여 주며 묻는다 */
export function askFight(s: Life5, foeId: string, lethal: boolean, forced: boolean): void {
  const known = FOES[foeId];
  if (!known) return;
  const foe = structuredClone(known);
  if (forced) { startFight(s, foe, lethal); return; }
  s.pending = { kind: 'fight', foe, lethal, risk: riskOf(s, foe, lethal) };
}

/** 싸움 물음에 답한다: 0 붙는다, 1 물러난다 */
export function answerFight(s: Life5, index: number): void {
  const p = s.pending;
  if (p?.kind !== 'fight') return;
  if (index === ENGAGE) { startFight(s, p.foe, p.lethal); return; }
  if (index !== BACK_OFF) return;
  s.pending = null;
  logLine(s, `${p.foe.name}과(와) 맞서지 않고 물러났다.`, 'heavy', 'battle');
}

/** 끝난 전투의 결과를 적용한다: 전적과 명성, 부상, 신체 손실, 죽음, 패배의 앙금 */
export function ackBattle(s: Life5): void {
  const p = s.pending;
  if (p?.kind !== 'battle') return;
  s.pending = null;
  const r = rngOf(s.rng);
  const foe = p.foe;
  const won = p.result === 'win';
  const risk = riskOf(s, foe, p.lethal);
  const mult = won ? F.wonMult : 1;
  const grudge = `lostTo:${foe.id}`;

  s.stats.fights += 1;
  if (won) {
    s.stats.wins += 1;
    s.hero.fame += Math.round(foePower(foe) * F.famePerPower);
    logLine(s, `${foe.name}을(를) 쓰러뜨렸다.`, 'heavy', 'battle');
    if (s.flags.includes(grudge)) {           // 한 번 졌던 상대를 다시 붙어 이겼다
      s.flags = s.flags.filter((f) => f !== grudge);
      applyFx(s, [{ op: 'mark', id: 'unyielding' }]);
    }
  } else {
    logLine(s, p.result === 'retreat' ? `${foe.name}에게서 간신히 몸을 빼냈다.` : `${foe.name}에게 졌다.`, 'heavy', 'battle');
  }
  if (chance(r, risk.injury * mult)) {
    applyFx(s, [{ op: 'injury', severity: won ? 'light' : 'heavy' }]);
    logLine(s, won ? '싸움에서 가벼운 상처를 입었다.' : '싸움에서 크게 다쳤다.', 'light', 'danger');
  }
  if (chance(r, risk.limb * mult)) loseLimb(s, 'random', r);
  if (won) {
    if (FOES[foe.id]) applyFx(s, [{ op: 'queue', turning: AFTER_FIGHT }]);   // queue는 이미 줄 서 있으면 다시 세우지 않는다
    return;
  }
  if (p.result === 'lose' && chance(r, risk.death)) {
    applyFx(s, [{ op: 'die', cause: `${foe.name}에게 쓰러졌다` }]);
    return;
  }
  s.hardship += V.hardship.defeat;
  if (!s.flags.includes(grudge)) s.flags.push(grudge);
}

// ---------------------------------------------------------------- 사소한 싸움

/** 이름 없는 상대. 힘은 지금 사는 곳의 위험(dangerOf)을 가운데로 그 위아래 minorSpread만큼에서 뽑는다 */
export function minorFoe(s: Life5, r: Rng, name: string = pick(r, MINOR_FOE_NAMES)): EnemySpec {
  const mid = dangerOf(s);
  const half = mid * F.minorSpread;
  return makeEnemy({ id: 'minor', name, p: int(r, Math.round(mid - half), Math.round(mid + half)) });
}

/**
 * 이름 없는 상대와의 사소한 싸움. 묻지 않는다: 붙을지는 가치관이 정하고, 화면 없이 돌려 기록 한 줄로 끝난다.
 * 죽지 않고 신체도 잃지 않는다. 지면 가볍게 다칠 수 있다.
 */
export function minorFight(s: Life5, r: Rng): void {
  const name = pick(r, MINOR_FOE_NAMES);
  const line = (k: keyof typeof MINOR_FIGHT_TEXT) => fill(pick(r, MINOR_FIGHT_TEXT[k]), { foe: name });
  const choice = leanPick(s, r, MINOR_FIGHT_CHOICE, (c) => c.lean)!;
  if (!choice.engage) { logLine(s, line('avoid'), 'light', 'battle'); return; }
  const foe = minorFoe(s, r, name);
  const won = fightBattle(s, foe).result === 'win';
  s.stats.fights += 1;
  if (won) { s.stats.wins += 1; s.hero.fame += F.minorFame; }
  else if (chance(r, riskOf(s, foe, false).injury)) applyFx(s, [{ op: 'injury', severity: 'light' }]);
  logLine(s, line(won ? 'win' : 'lose'), 'light', 'battle');
}
