// 싸움: 붙을지 물러날지를 묻고, 붙으면 v4의 자동 전투로 끝까지 돌린 뒤 결과를 몸과 마음에 남긴다.
import { storyPause } from './turning';
import { B } from '../shared/data/balance';
import { battleRecap } from '../shared/core/combat/narrative';
import { faceKeyOf } from '../shared/core/people';
import { rivalCombatSkills, rivalPerson, rivalPosition, RIVAL_STAT_TOTAL } from './rival';
import { makeEnemy } from '../shared/data/bosses';
import { FRUIT_BY_ID } from '../shared/data/fruits';
import { SPECIES_PASSIVES } from '../shared/data/passives';
import { SEA_BY_ID, SEAS } from '../shared/data/seas';
import { hasTrait, traitModifiers, traitFactor, recordTraitEvent } from './traits';
import { retreatChance, rollDice, runBattle, startBattle } from '../shared/core/combat/engine';
import { fruitMods, mergeMods } from '../shared/core/combat/mods';
import { crewUnit, enemyUnit } from '../shared/core/combat/units';
import { branchSkills, getSkill } from '../shared/core/growth/skillbook';
import { STYLE_SKILLS } from '../shared/data/style-skills';
import { COMBAT_STYLE_BY_ID } from '../data/combat-styles';
import { equippedWeapon, focusedStyle, isMartialBranch, primaryStyle, styleTier, styleUsable, weaponStyleFor } from './styles';
import { chance, hashString, int, pick, rngOf, type Rng } from '../shared/core/rng';
import { fill } from '../shared/core/util';
import { V } from '../data/balance';
import { FOE_SEA, FOES, MINOR_FIGHT_CHOICE, MINOR_FIGHT_TEXT, MINOR_FOE_NAMES } from '../data/foes';
import { VALUE_TACTIC } from '../data/values';
import { fullName } from './birth';
import { canUse, effectiveStats5, limbFactor, loseLimb, WOUND_PART_NAME } from './body';
import { applyFx } from './fx';
import { environmentOf, islandImmunity } from './environment';
import { BRANCH_ID, power5, tierMult } from './power';
import { logLine } from './state';
import { leanPick, topValues } from './values';
import type { BattleState, Branch, EnemySpec, Life5, Person, Standing, Stats, FightNext, WoundPart, WoundKind } from './types';
import type { CUnit, Skill } from '../shared/core/types';

const C = B.combat;
const F = V.fight;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const sum = (st: Stats) => Object.values(st).reduce((a, b) => a + b, 0);

/** 싸움 물음의 답 */
export const ENGAGE = 0, BACK_OFF = 1;
/** 이름 있는 상대를 이긴 뒤 줄을 서는 전환점: 쓰러진 적을 어떻게 할지 */
const RIVAL_DUEL = 'childhood_rival_duel';
const AFTER_FIGHT = 'after_fight';
const WOUND_KIND_NAME: Record<WoundKind, string> = { bruise: '타박', cut: '베인', burn: '화상', fracture: '골절' };

const FACTION: Partial<Record<Standing, Person['faction']>> = {
  pirate: 'pirate', warlord: 'pirate', marine: 'marine', cp: 'marine', revolution: 'rev',
};

// ---------------------------------------------------------------- 힘과 위험

/** 간부를 빼고 한 사람의 힘. 패기 · 열매를 단계로 바꿔 주인공의 힘(power5)과 같은 잣대(단계의 배율)로 센다 */
function soloPower(e: EnemySpec): number {
  const tier = Math.max(e.armament * F.hakiTier, e.observation * F.hakiTier, e.fruitClass ? F.fruitTier : 0);
  return sum(e.base) * tierMult(tier);
}

/** 이름 있는 상대를 v5의 잣대로: 상대가 나오는 바다의 배율(V.fight.foeScale)을 우두머리와 간부의 능력치에 곱한다 */
const LOCAL_LEADER_POWER: Record<string, number> = {
  b_gramon: 540, b_gramon_worn: 440,
  b_fm_utsubo: 550, b_fm_utsubo_worn: 450,
  b_dr_remedio: 585, b_dr_remedio_worn: 475,
};

export function scaleFoe(e: EnemySpec, id: string): EnemySpec {
  const target = LOCAL_LEADER_POWER[id];
  const k = target ? target / foePower(e) : F.foeScale[FOE_SEA[id] as keyof typeof F.foeScale] ?? 1;
  const scale = (st: Stats): Stats => {
    const out = { ...st };
    for (const key of Object.keys(out) as (keyof Stats)[]) out[key] = Math.round(out[key] * k);
    return out;
  };
  return { ...e, base: scale(e.base), officers: e.officers.map((o) => ({ ...o, base: scale(o.base) })) };
}

/** 상대의 힘: 우두머리 + 간부의 몫 */
export function foePower(e: EnemySpec): number {
  return soloPower(e) + e.officers.reduce((a, o) => a + soloPower(o) * F.officerShare, 0);
}

/**
 * 지금 있는 바다의 위험: 그 바다에서 만나는 상대의 힘(v4 enemyPower 범위)의 가운데 값.
 * 아직 어려서 태어난 마을에 있으면 어느 바다에서 태어났든 가장 낮은 바다의 위험 속에 산다.
 */
export function dangerOf(s: Life5): number {
  const atHome = s.age <= F.dangerKidAge && s.hero.island === s.hero.town;
  const sea = atHome ? SEAS.reduce((a, b) => (b.stage < a.stage ? b : a)) : SEA_BY_ID[s.hero.sea];
  const [lo, hi] = sea.enemyPower;
  return lo + (hi - lo) / 2;
}

/** 상대의 힘 ÷ 내 힘. 1보다 크면 상대가 세다 */
export function gapOf(s: Life5, e: EnemySpec, atSea?: true): number {
  return foePower(e) / Math.max(F.minPower, power5(s) * pressureMultiplier(s, atSea));
}

/** 졌을 때 다치고, 몸 한 곳을 잃고, 죽을 확률. 목숨을 걸지 않은 싸움에서는 죽지 않는다 */
export function riskOf(s: Life5, e: EnemySpec, lethal: boolean, atSea?: true): { injury: number; limb: number; death: number } {
  if (e.spar) return { injury: 0, limb: 0, death: 0 };
  const gap = gapOf(s, e, atSea);
  const danger = traitFactor(s, 'danger');
  return {
    injury: Math.min(1, danger * clamp(F.injuryBase + F.injuryPerGap * (gap - F.injuryGapFrom), F.injuryFloor, F.injuryCap)),
    limb: Math.min(1, danger * clamp(F.limbPerGap * (gap - F.limbGapFrom), 0, F.limbCap)),
    death: lethal ? Math.min(1, danger * clamp(F.deathPerGap * (gap - F.deathGapFrom), 0, F.deathCap)) : 0,
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
function heroSkills(s: Life5, item: ReturnType<typeof equippedWeapon>): CUnit['skills'] {
  const got: { sk: Skill; b: Branch }[] = [];
  const first = item && weaponStyleFor(item);
  const focus = first && focusedStyle(s, COMBAT_STYLE_BY_ID[first].branch);
  const active = primaryStyle(s) ?? (focus && item?.weaponStyles?.includes(focus) ? focus : first);
  for (const b of Object.keys(BRANCH_ID) as Branch[]) {
    if (isMartialBranch(b)) {
      if (b !== 'fist' && item?.branch !== BRANCH_ID[b]) continue;
      if (active) {
        if (COMBAT_STYLE_BY_ID[active].branch !== b || !styleUsable(s, active)) continue;
        const tier = styleTier(s, active);
        for (const sk of STYLE_SKILLS) if (sk.id.startsWith(`style:${active}:`) && sk.tier <= tier) got.push({ sk, b });
        continue;
      }
    }
    const tier = s.growth.tier[b];
    if (tier <= 0 || !canUse(s, b)) continue;
    for (const sk of branchSkills(BRANCH_ID[b], s.hero.fruit?.id ?? null)) if (sk.tier <= tier) got.push({ sk, b });
  }
  return got.sort((x, y) => y.sk.tier - x.sk.tier).slice(0, F.maxSkills)
    .map(({ sk, b }) => ({ id: sk.id, mastery: skillMastery(active && sk.id.startsWith('style:') ? styleTier(s, active) : s.growth.tier[b]), cd: 0 }));
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

/**
 * 눈을 잃어 공격이 덜 닿는 만큼의 배율 (설계 5.7). 잃은 눈 하나마다 V.limb.eye.aim을 빼고,
 * 돈으로 단 눈은 그 절반만, 기연으로 얻은 눈(1보다 나은 눈)은 빼지 않는다.
 * v4 전투에서 공격하는 쪽의 명중은 속도 차이로만 정해지고(그 몫은 0~0.25로 잘린다) 속도는 이미 눈의 벌점(eye.spd)을 받으므로,
 * 빗나가는 공격의 몫을 주는 피해의 기댓값으로 걸어 둔다: 유닛의 mods.dmg에 곱한다
 */
function aimMult(s: Life5): number {
  let m = 1;
  for (const l of ['eyeL', 'eyeR'] as const) m *= 1 - V.limb.eye.aim * (1 - Math.min(1, limbFactor(s.hero.limbs[l])));
  return m;
}

/**
 * v5 상태에서 주인공의 전투 유닛을 만든다. 편성 화면이 없으므로 기술 · 전술 · 물러날 때는 저절로 정해진다.
 * 능력치는 (상처와 몸을 반영한 뒤) 가장 높은 단계의 배율을 곱한다: 경지가 곧 싸우는 힘이다
 */
/** 싸움에 나서는 주인공의 능력치: 상처와 몸을 반영한 능력치의 비율을 유지해 경지와 서약 하한을 적용한다 */
export function heroFightStats(s: Life5, atSea?: true): Stats {
  const st: Stats = effectiveStats5(s);
  const total = sum(st);
  const m = (total > 0 ? power5(s, st) / total : 1) * pressureMultiplier(s, atSea);
  for (const k of Object.keys(st) as (keyof Stats)[]) st[k] *= m;
  return st;
}

function pressureMultiplier(s: Life5, atSea?: true): number {
  return atSea && s.hero.fruit && !islandImmunity(s) ? environmentOf(s)?.pressure?.combat ?? 1 : 1;
}

export function heroUnit5(s: Life5, atSea?: true): CUnit {
  const h = s.hero;
  const st = heroFightStats(s, atSea);
  const health = C.hp.healthFloor + (1 - C.hp.healthFloor) * h.hp / V.hp.max;
  const maxHp = Math.round((C.hp.base + st.vit * C.hp.perVit) * health);
  const maxSp = Math.round(C.sp.base + st.wil * C.sp.perWil);
  const top = topValues(s, 1)[0];
  const aim = aimMult(s);
  const item = equippedWeapon(s);
  const traits = traitModifiers(s);
  const u: CUnit = {
    key: 'hero', name: fullName(h), side: 'L', hero: true, leader: true, role: 'hero',
    maxHp, hp: maxHp, maxSp, sp: maxSp,
    st, def: st.vit * C.defPerVit,
    armament: hakiLevel(s.growth.tier.armament), observation: hakiLevel(s.growth.tier.observation),
    fruitClass: h.fruit ? FRUIT_BY_ID[h.fruit.id]?.cls ?? null : null,
    skills: heroSkills(s, item),
    tactic: top ? VALUE_TACTIC[top] : 'endurance',
    retreatAt: hasTrait(s, 'rebel') ? F.retreat.never : top === 'peace' ? F.retreat.calm : F.retreat.usual,
    weapon: item?.branch && item.mult ? { id: item.id, branch: item.branch, mult: item.mult, seastone: item.seastone ?? false } : null, consumables: [],
    guard: 0, guardTurns: 0, evade: 0, evadeTurns: 0, buff: 0, buffTurns: 0, bound: 0, sealed: 0,
    pGuard: 0, pDodge: 0, pBuff: 0, lastBig: false,
    faction: FACTION[h.standing] ?? 'civil', species: h.species, gender: h.gender, age: s.age,
    faceKey: `hero:${s.rng.seed}`,
    mods: mergeMods(SPECIES_PASSIVES[h.species]?.mods, traits,
      fruitMods(h.fruit?.id, skillMastery(s.growth.tier.fruit), false), aim < 1 ? { dmg: aim } : undefined),
  };
  applyPassives(u);
  return u;
}

// ---------------------------------------------------------------- 전투

/**
 * 주인공과 동료, 상대와 간부로 전투를 꾸려 끝까지 자동으로 돌린다.
 * 짝 짓기는 v4 defaultAssign과 같다: 주인공은 우두머리, 싸우는 동료(선봉 · 지원)는 간부를 차례로 맡고 남으면 우두머리.
 */
export function combatCrew(s: Life5): Person[] {
  return s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && p.crew.injuredMonths <= 0 && !p.crew.separatedMonths);
}

function fightBattle(s: Life5, foe: EnemySpec, atSea?: true): BattleState {
  const crew = foe.spar ? [] : combatCrew(s);
  const stage = SEA_BY_ID[s.hero.sea].stage;   // v5에는 단계가 없으니 지금 있는 바다의 단계로
  const units: CUnit[] = [heroUnit5(s, atSea), ...crew.map((p) => crewUnit(p, stage, p.id === s.rival?.personId ? rivalCombatSkills(s) : undefined))];
  const enemyStart = units.length;
  const opponent = enemyUnit(foe, true, 0);
  if (foe.id === RIVAL_DUEL) {
    units[0].retreatAt = 0;
    opponent.personId = rivalPerson(s)?.id;
  }
  units.push(opponent);
  foe.officers.forEach((o, i) => units.push(enemyUnit(o, false, i + 1)));
  const assign: Record<number, number> = { 0: enemyStart };
  let next = 1;
  crew.forEach((p, i) => {
    const fights = p.crew!.role === 'vanguard' || p.crew!.role === 'support';
    assign[i + 1] = enemyStart + (fights && next <= foe.officers.length ? next++ : 0);
  });
  const seed = hashString(String(rngOf(s.rng)()));
  const battle = startBattle(units, assign, seed, !!atSea || !!s.passage || !!s.traitScene?.includes('sea'));
  if (foe.id === RIVAL_DUEL) battle.spar = true;
  return runBattle(battle, true);
}

function startFight(s: Life5, foe: EnemySpec, lethal: boolean, next?: FightNext, atSea?: true, escape?: { roll: number; need: number }): void {
  const battle = fightBattle(s, foe, atSea);
  s.pending = { kind: 'battle', foe, lethal, battle, result: battle.result ?? 'lose', ...(next ? { next } : {}), ...(atSea ? { atSea } : {}), ...(escape ? { escape } : {}) };
}

/** 맞수의 기록에는 총 전투력을, makeEnemy와 crewUnit에는 statsAround의 기준 능력치를 쓴다. */
export function rivalCombatStat(p: Person): number {
  return Math.max(1, Math.round((p.power ?? 135) / RIVAL_STAT_TOTAL));
}

export function startRivalDuel(s: Life5): void {
  const rival = rivalPerson(s);
  if (!rival?.alive || rival.kind === 'crew') return;
  const foe = makeEnemy({
    id: RIVAL_DUEL, spar: true, name: rival.name, title: rivalPosition(s), faceKey: faceKeyOf(rival),
    p: rivalCombatStat(rival), age: rival.age, species: rival.species, gender: rival.gender, faction: rival.faction,
    skills: rivalCombatSkills(s) ?? ['fist_jab', 'fist_combo', 'fist_guard'],
  });
  startFight(s, foe, false);
}

/** 싸움 앞에서 물러날 확률 (0~1): 속도의 몫으로 정하고, 목숨을 건 상대 앞이면 backOffLethal만큼 낮다 */
export function backOffChance(s: Life5, foe: EnemySpec, lethal: boolean, atSea?: true): number {
  const p = retreatChance(heroFightStats(s, atSea).spd, foe.base.spd);
  return Math.max(C.retreat.min, p - (lethal ? F.backOffLethal : 0));
}

/** 이름 있는 상대와 마주친다. 물러날 수 없는 싸움이면 바로 싸우고, 아니면 위험을 보여 주며 묻는다 */
export function askFight(s: Life5, foeId: string, lethal: boolean, forced: boolean, next?: FightNext, atSea?: true): void {
  const known = FOES[foeId];
  if (!known) return;
  if (FOE_SEA[foeId] && !known.spar) s.stats.namedMet += 1;   // 마주친 것만으로 센다 (물러나도)
  const foe = scaleFoe(structuredClone(known), foeId);
  if (forced) { startFight(s, foe, lethal, next, atSea); return; }
  s.pending = { kind: 'fight', foe, lethal, risk: riskOf(s, foe, lethal, atSea), ...(next ? { next } : {}), ...(atSea ? { atSea } : {}) };
}

/** 싸움 물음에 답한다: 0 붙는다, 1 물러난다 */
export function answerFight(s: Life5, index: number): void {
  const p = s.pending;
  if (p?.kind !== 'fight') return;
  if (index === ENGAGE) { startFight(s, p.foe, p.lethal, p.next, p.atSea); return; }
  if (index !== BACK_OFF) return;
  // 물러나기도 주사위로 판정한다. 실패하면 붙잡혀 그대로 싸운다
  const { roll, need, ok } = rollDice(rngOf(s.rng), backOffChance(s, p.foe, p.lethal, p.atSea));
  if (!ok) {
    logLine(s, `${p.foe.name}에게서 물러나려 했지만 붙잡혔다. [주사위 ${roll} / ${need} 이하 성공]`, 'heavy', 'battle');
    startFight(s, p.foe, p.lethal, p.next, p.atSea, { roll, need });
    return;
  }
  s.pending = null;
  logLine(s, `${p.foe.name}과(와) 맞서지 않고 물러났다. [주사위 ${roll} / ${need} 이하 성공]`, 'heavy', 'battle');
  if (p.next?.back) { applyFx(s, [{ op: 'queue', turning: p.next.back }]); storyPause(s); }
}

/** 끝난 전투의 결과를 적용한다: 전적과 명성, 부상, 신체 손실, 죽음, 패배의 앙금 */
export function ackBattle(s: Life5): void {
  const p = s.pending;
  if (p?.kind !== 'battle') return;
  s.pending = null;
  const foe = p.foe;
  const won = p.result === 'win';
  const recap = battleRecap(p.battle);
  const withRecap = (text: string) => recap ? `${text} ${recap}` : text;
  const style = primaryStyle(s);
  if (style) {
    const key = `styleCombat:${style}:${foe.id}`;
    const used = p.battle.events.some((e) => e.k === 'act' && p.battle.units[e.who]?.hero && e.skill.startsWith(`style:${style}:`));
    const amount = won ? 6 : p.lethal ? 0 : p.result === 'retreat' ? 1 : 2;
    if (used && amount > 0 && s.seen[key] === undefined) {
      s.seen[key] = s.age;
      applyFx(s, [{ op: 'mastery', branch: COMBAT_STYLE_BY_ID[style].branch, add: amount }]);
    }
  }
  if (foe.id === RIVAL_DUEL) {
    s.stats.fights += 1;
    if (won) s.stats.wins += 1;
    const text = fill(`어릴 적 맞수 {rival}과(와) 겨뤄 ${won ? '이겼다' : '졌다'}.`, { rival: foe.name });
    logLine(s, withRecap(text), 'heavy', 'battle');
    s.timeline.push({ age: s.age, text });
    return;
  }
  if (foe.spar) {
    logLine(s, withRecap(won ? `${foe.name}과(와) 대련을 마쳤다. 마지막 공방에서 앞섰다.` : `${foe.name}과(와) 대련을 마쳤다. 이번에는 상대의 움직임을 따라가지 못했다.`), 'heavy', 'battle');
    const next = won ? p.next?.win : p.next?.lose;
    if (next) { applyFx(s, [{ op: 'queue', turning: next }]); storyPause(s); }
    return;
  }
  const r = rngOf(s.rng);
  const switched = !p.lethal && !!p.battle.deathmatch;
  const risk = riskOf(s, foe, p.lethal || switched, p.atSea);
  const hero = p.battle.units?.find((u) => u.hero);
  const damage = hero ? clamp(1 - hero.hp / Math.max(1, hero.maxHp), 0, 1) : 0;
  if (damage > 0) s.hero.hp = Math.max(1, s.hero.hp - Math.max(1, Math.round(damage * F.healthDamage)));
  const knockedOut = !!hero && hero.hp <= 0;
  const woundRisk = risk.injury * (won ? F.wonMult : 1);
  let battleWound: Life5['hero']['injuries'][number] | undefined;
  if (knockedOut || (damage > 0 && chance(r, woundRisk))) {
    const severity = knockedOut ? 'heavy' : 'light';
    const parts: WoundPart[] = ['torso', 'armL', 'armR', 'legL', 'legR', 'head', 'eyeL', 'eyeR'];
    const part = pick(r, parts.filter((part) => part === 'head' || part === 'torso' || s.hero.limbs[part] !== 'lost'));
    const kind: WoundKind = foe.skills.some((id) => /fire|flame|magma|heat|^fruit:(mera|magu|netsu):/.test(id)) ? 'burn'
      : foe.skills.some((id) => /sword|gun|blade/.test(id)) ? 'cut'
      : knockedOut ? 'fracture' : 'bruise';
    const before = s.hero.injuries.length;
    applyFx(s, [{ op: 'injury', severity, part, kind }]);
    battleWound = s.hero.injuries.length > before ? s.hero.injuries[s.hero.injuries.length - 1] : undefined;
    // 쓰러진 몸에는 회복 특성이 있어도 적어도 한 토막 동안 남는 큰 상처가 있다.
    if (knockedOut && !battleWound) {
      battleWound = { severity: 'heavy', part, kind, monthsLeft: V.injury.monthsPerPart };
      s.hero.injuries.push(battleWound);
    }
    logLine(s, `싸움에서 ${WOUND_PART_NAME[part]}에 ${WOUND_KIND_NAME[kind]} 상처를 입었다.`, 'heavy', 'danger');
  }
  if (p.minor) {
    s.stats.fights += 1;
    if (won) { s.stats.wins += 1; s.hero.fame += F.minorFame; }
    logLine(s, withRecap(p.minor.outcomeLine), 'light', 'battle');
    if (!won && p.battle.deathmatch && chance(r, riskOf(s, foe, true, p.atSea).death * F.minorDeathMult)) dieOrSurvive(s, r, foe, battleWound);
    return;
  }
  const mult = won ? F.wonMult : 1;
  const grudge = `lostTo:${foe.id}`;

  s.stats.fights += 1;
  const sea = FOE_SEA[foe.id];
  if (sea) {
    const n = (s.stats.named[sea] ??= { fights: 0, wins: 0 });
    n.fights += 1;
    if (won) n.wins += 1;
  }
  s.traitSource = 'battle:' + foe.id;
  if (!won) recordTraitEvent(s, 'loss', '', s.traitSource);
  if (won) {
    s.stats.wins += 1;
    recordTraitEvent(s, 'win', s.hero.sea, foe.id);
    s.hero.fame += Math.round(foePower(foe) * F.famePerPower);
    logLine(s, withRecap(`${foe.name}과(와)의 싸움에서 이겼다.`), 'heavy', 'battle');
    if (s.flags.includes(grudge)) {           // 한 번 졌던 상대를 다시 붙어 이겼다
      s.flags = s.flags.filter((f) => f !== grudge);
      applyFx(s, [{ op: 'mark', id: 'unyielding' }]);
    }
  } else {
    logLine(s, withRecap(p.result === 'retreat' ? `${foe.name}에게서 간신히 몸을 빼냈다.` : `${foe.name}에게 졌다.`), 'heavy', 'battle');
  }
  if (chance(r, risk.limb * mult)) loseLimb(s, 'random', r);
  if (won) {
    if (p.next?.win) { applyFx(s, [{ op: 'queue', turning: p.next.win }]); storyPause(s); }   // 이야기가 이어지는 싸움
    else if (FOES[foe.id]) applyFx(s, [{ op: 'queue', turning: AFTER_FIGHT }]);   // queue는 이미 줄 서 있으면 다시 세우지 않는다
    return;
  }
  // 목숨을 건 싸움에서는 간신히 몸을 빼도(retreat) 그 몫(retreatDeath)만큼 죽을 수 있다
  if (chance(r, risk.death * (p.result === 'lose' ? 1 : F.retreatDeath))) {
    // 빈사로 바뀐 싸움이면 주사위를 한 번 더 굴려, 붙으면 큰 부상을 입고 살아남는다
    if (!switched) { applyFx(s, [{ op: 'die', cause: `${foe.name}에게 쓰러졌다` }]); return; }
    if (!dieOrSurvive(s, r, foe, battleWound)) return;
  }
  s.hardship += V.hardship.defeat;
  if (!s.flags.includes(grudge)) s.flags.push(grudge);
  if (p.next?.lose) { applyFx(s, [{ op: 'queue', turning: p.next.lose }]); storyPause(s); }
}

/** 빈사로 바뀐 싸움에서 죽을 판정이 났을 때: 생존 주사위에 붙으면 큰 부상을 입고 살아남는다. 살아남았으면 true */
function dieOrSurvive(s: Life5, r: Rng, foe: EnemySpec, wound?: Life5['hero']['injuries'][number]): boolean {
  const live = rollDice(r, F.deathmatchSurvive);
  if (!live.ok) { applyFx(s, [{ op: 'die', cause: `${foe.name}에게 쓰러졌다` }]); return false; }
  if (wound) {
    wound.severity = 'heavy';
    wound.monthsLeft = Math.max(wound.monthsLeft, V.injury.monthsPerPart,
      Math.round(V.injury.months.heavy * traitFactor(s, 'injury') / V.injury.monthsPerPart) * V.injury.monthsPerPart);
  } else {
    const before = s.hero.injuries.length;
    applyFx(s, [{ op: 'injury', severity: 'heavy', part: 'torso', kind: 'fracture' }]);
    if (s.hero.injuries.length === before) s.hero.injuries.push({ severity: 'heavy', part: 'torso', kind: 'fracture', monthsLeft: V.injury.monthsPerPart });
  }
  logLine(s, `죽음의 문턱까지 갔지만 숨이 붙어 있었다. 큰 부상을 입고 간신히 살아남았다. [주사위 ${live.roll} / ${live.need} 이하 생존]`, 'heavy', 'danger');
  return true;
}

// ---------------------------------------------------------------- 사소한 싸움

/** 능력치 합 기준으로 시작 바다 F, 입구 E, 전반·어인섬 D, 신세계 C. */
const STREET_STATS = [[6, 10], [13, 19], [22, 32], [32, 45], [49, 66], [68, 84]] as const;

export function minorFoe(s: Life5, r: Rng, name: string = pick(r, MINOR_FOE_NAMES)): EnemySpec {
  const atHome = s.age <= F.dangerKidAge && s.hero.island === s.hero.town;
  const stage = atHome ? 1 : SEA_BY_ID[s.hero.sea].stage;
  const [lo, hi] = STREET_STATS[stage - 1];
  return makeEnemy({ id: 'minor', name, p: int(r, lo, hi) });
}

/**
 * 이름 없는 상대와의 사소한 싸움. 붙을지는 가치관이 정하고, 붙으면 전투 창에서 보여 준다.
 * 신체는 잃지 않는다. 지면 가볍게 다칠 수 있고, 빈사로 바뀐 싸움에서 지면 낮은 확률로 죽을 수 있다.
 */
export function minorFight(s: Life5, r: Rng): void {
  const env = environmentOf(s);
  const name = pick(r, env?.localFights?.foes ?? MINOR_FOE_NAMES);
  const line = (k: keyof typeof MINOR_FIGHT_TEXT) => fill(pick(r, MINOR_FIGHT_TEXT[k]), { foe: name });
  const choice = leanPick(s, r, MINOR_FIGHT_CHOICE, (c) => c.lean)!;
  if (!choice.engage) { logLine(s, line('avoid'), 'light', 'battle'); return; }
  const foe = minorFoe(s, r, name);
  const battle = fightBattle(s, foe);
  const result = battle.result ?? 'lose';
  s.pending = { kind: 'battle', foe, lethal: false, battle, result, minor: { outcomeLine: line(result === 'win' ? 'win' : 'lose') } };
}
