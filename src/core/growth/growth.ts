// 자동 성장 (docs/02_설계/03_진행과_선택.md 4장): 능력치, 숙련, 새 기술, 스승 수련.
import { B } from '../../data/balance';
import { BRANCH_NAMES, BRANCH_STARTER, GATE_NAMES } from '../../data/skills';
import { checkAll } from '../conditions';
import type { BranchId, LifeState, Skill, StatKey } from '../types';
import { log, timeline } from '../util';
import { branchSkills, getSkill, heavyInjured } from './skillbook';

const G = B.growth;

export function rateForAge(age: number) {
  return G.byAge.find((x) => age <= x.max)!.rate;
}

export function learn(s: LifeState, id: string, quiet = false): boolean {
  if (s.growth.skills[id]) return false;
  const sk = getSkill(id);
  if (!sk) return false;
  s.growth.skills[id] = { mastery: 0 };
  s.metaEvents.push({ k: 'skill', id });
  if (!quiet) log(s, `새 기술 「${sk.name}」을(를) 익혔다.`, 'growth');
  // 빈 칸이 있으면 자동 장착
  if (s.loadout.skills.length < 6) s.loadout.skills.push(id);
  else if (!quiet) s.notices.push(`「${sk.name}」을(를) 익혔지만 기술 칸이 가득 찼다. 편성에서 바꿀 수 있다.`);
  return true;
}

/** 조건(선행 기술 숙련 · 능력치 · 큰 단계)을 채웠는가. 갈래 조건은 따로 본다 */
export function requirementsMet(s: LifeState, sk: Skill, ignoreGate = false): boolean {
  const rq = sk.requires;
  if (rq.skills && !rq.skills.every((x) => (s.growth.skills[x.id]?.mastery ?? -1) >= x.mastery)) return false;
  if (rq.base && !Object.entries(rq.base).every(([k, v]) => s.hero.base[k as StatKey] >= (v as number))) return false;
  if (!ignoreGate && rq.gate && !s.growth.gates.includes(rq.gate)) return false;
  if (sk.branch === 'haki.conqueror' && !s.hero.traits.includes('conqueror')) return false;
  return true;
}

/** 큰 단계에 막혀 있는 기술 (나머지 조건은 다 채움) */
export function blockedGates(s: LifeState): { branch: BranchId; gate: string }[] {
  const out: { branch: BranchId; gate: string }[] = [];
  for (const br of activeBranches(s)) {
    for (const sk of branchSkills(br, s.hero.fruit?.id ?? null)) {
      if (s.growth.skills[sk.id] || !sk.requires.gate || s.growth.gates.includes(sk.requires.gate)) continue;
      if (requirementsMet(s, sk, true)) out.push({ branch: br, gate: sk.requires.gate });
    }
  }
  return out;
}

export function activeBranches(s: LifeState): BranchId[] {
  return [s.growth.focus, s.growth.secondary].filter((x): x is BranchId => !!x);
}

/** 주력 · 보조 갈래에서 조건을 채운 기술을 저절로 배운다 */
export function autoLearn(s: LifeState) {
  for (const br of activeBranches(s)) {
    for (const sk of branchSkills(br, s.hero.fruit?.id ?? null)) {
      if (!s.growth.skills[sk.id] && requirementsMet(s, sk)) learn(s, sk.id);
    }
  }
  // 열어 둔 큰 단계로 바로 배울 수 있는 패기 기술 (갈래와 관계없이 눈뜸 기술)
  for (const id of ['obs_sense', 'arm_coat', 'con_burst']) {
    const sk = getSkill(id)!;
    if (!s.growth.skills[id] && requirementsMet(s, sk)) learn(s, id);
  }
}

export function setFocus(s: LifeState, branch: BranchId | null, slot: 'focus' | 'secondary') {
  if (slot === 'focus') {
    if (s.growth.secondary === branch) s.growth.secondary = s.growth.focus;
    s.growth.focus = branch;
    s.growth.focusSince = s.hero.age;
    s.choice.flags = s.choice.flags.filter((f) => f !== 'rethink_ready');
  } else {
    if (s.growth.focus === branch) return;
    s.growth.secondary = branch;
    if (!s.choice.flags.includes('has_secondary')) s.choice.flags.push('has_secondary');
  }
  if (branch) {
    const starter = BRANCH_STARTER[branch];
    if (starter) learn(s, starter);
    log(s, `${slot === 'focus' ? '주력' : '보조'} 갈래를 「${BRANCH_NAMES[branch]}」(으)로 정했다.`, 'growth');
  }
  autoLearn(s);
}

export function openGate(s: LifeState, gate: string) {
  if (s.growth.gates.includes(gate)) return;
  s.growth.gates.push(gate);
  log(s, `큰 단계 「${GATE_NAMES[gate] ?? gate}」을(를) 열었다!`, 'good');
  timeline(s, `「${GATE_NAMES[gate] ?? gate}」을(를) 열었다`);
  autoLearn(s);
}

function addStats(s: LifeState, branch: BranchId | null, amount: number) {
  if (amount <= 0 || !branch) return;
  for (const [k, w] of Object.entries(G.split[branch])) s.hero.base[k as StatKey] += amount * (w as number);
}

function addMastery(s: LifeState, branch: BranchId, mult: number) {
  for (const sk of branchSkills(branch, s.hero.fruit?.id ?? null)) {
    const k = s.growth.skills[sk.id];
    if (!k || k.mastery >= 100) continue;
    k.mastery = Math.min(100, k.mastery + G.masteryPerMonth / sk.tier * mult);
  }
}

/** 한 달의 자동 성장 */
export function monthlyGrowth(s: LifeState) {
  const h = s.hero;
  if (h.illness && h.illness.stage >= 2) return;
  const mult = heavyInjured(s) ? G.heavyInjuryMult : 1;
  const rate = rateForAge(h.age) * mult;
  const m = s.growth.master;
  const focusMult = m && m.branch === s.growth.focus ? G.masterMult : 1;
  const secMult = m && m.branch === s.growth.secondary ? G.masterMult : 1;

  if (!s.growth.focus && !s.growth.secondary) {
    if (rate > 0) for (const k of Object.keys(h.base) as StatKey[]) h.base[k] += G.noFocusEach * mult;
  } else {
    addStats(s, s.growth.focus, rate * focusMult);
    addStats(s, s.growth.secondary, rate * G.secondaryMult * secMult);
  }
  if (s.growth.focus) addMastery(s, s.growth.focus, mult * focusMult);
  if (s.growth.secondary) addMastery(s, s.growth.secondary, mult * G.secondaryMult * secMult);
  // 스승이 가르치는 갈래가 주력 · 보조가 아니어도 그 갈래는 자란다
  if (m && m.branch !== s.growth.focus && m.branch !== s.growth.secondary) {
    addStats(s, m.branch, rate);
    addMastery(s, m.branch, mult * G.masterMult * 0.5);
  }
  // 스승 수련
  if (m) {
    m.monthsLeft -= 1;
    if (m.monthsLeft <= 0) {
      log(s, `${m.name}의 수련을 마쳤다.`, 'good');
      s.metaEvents.push({ k: 'met', id: m.personId, where: s.world.seaId, taught: true });
      s.growth.master = null;
      openGate(s, m.gate);
    }
  }
  autoLearn(s);
}

/** 실전에서 쓴 기술의 숙련 */
export function battleMastery(s: LifeState, usage: Record<string, { uses: number }>, elite: boolean, won: boolean) {
  const per = elite ? G.battleMastery.elite : G.battleMastery.routine;
  const mult = won ? G.battleMastery.winMult : 1;
  for (const [id, u] of Object.entries(usage)) {
    const k = s.growth.skills[id];
    if (!k) continue;
    k.mastery = Math.min(100, k.mastery + u.uses * per * mult);
  }
  autoLearn(s);
}

export { checkAll };
