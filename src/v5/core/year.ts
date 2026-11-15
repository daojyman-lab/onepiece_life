// 한 해를 네 토막으로 나눈 진행. 토막마다 가치관이 정한 일을 하고, 그만큼 자란다.
import { BRANCH_NAMES } from '../../data/skills';
import { TALENT_BY_ID } from '../../data/talents';
import { chance, pick, rngOf, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { LINES } from '../data/lines';
import { VALUE_IDS } from '../data/values';
import { MINOR_FIGHT_STANDINGS } from '../data/foes';
import { checkAll } from './cond';
import { minorFight } from './fight';
import { rollFortune, rollMisfortune } from './fortune';
import { canUse } from './body';
import { addMastery, fillText, tierCap } from './fx';
import { runMinor } from './minor';
import { BRANCH_ID } from './power';
import { partRisks, yearRisks } from './risk';
import { dayLine, isRecent, logLine, yearDivider } from './log';
import { openQueued, openTurning, pickTurning, wantsStop } from './turning';
import { leanPick } from './values';
import type { Activity, Branch, Life5, StatKey, ValueId } from './types';

const ACTIVITIES: readonly Activity[] = ['train', 'work', 'study', 'roam', 'family', 'rest'];
const LEAN: Record<ValueId, Partial<Record<Activity, number>>> = V.activity.lean;

export { power5 } from './power';

/** 정점에 올랐거나 은퇴해 조용히 사는 때 */
export function isQuiet(s: Life5): boolean {
  return s.hero.standing === 'retired' || s.flags.includes('apex');
}

/** 한 토막을 진행한다. 대기 중인 일이 있으면 아무것도 하지 않는다. */
export function stepPart(s: Life5): void {
  if (s.pending) return;
  if (!s.hero.alive) { endIfDead(s); return; }
  if (openQueued(s)) return;                   // 싸움 뒤 · 큰 계기처럼 줄 선 일은 그 일 바로 다음에 연다 (설계 5.7, 5.2a)

  const r = rngOf(s.rng);
  partRisks(s, r);
  if (!s.hero.alive) return;
  const act = activityOf(s, r);
  dailyLine(s, act, r);
  growPart(s, act, r);
  healInjuries(s);
  if (chance(r, V.lines.minorP)) runMinor(s, r);
  if (s.hero.alive && MINOR_FIGHT_STANDINGS.includes(s.hero.standing) && chance(r, V.fight.minorP)) minorFight(s, r);
  if (s.part === V.partsPerYear - 1) yearTurn(s, r);
  turningPoint(s, r);
  if (s.hero.alive) nextPart(s);
  endIfDead(s);
}

/**
 * 해가 바뀌는 자리(한 해의 마지막 토막)에서 한 번: 병 · 사고 · 노환 → 고를 수 없는 불행 → 기연.
 * 전환점보다 먼저 굴려서, 기연이 뜨면 그 토막의 전환점이 기연에게 자리를 내준다.
 */
function yearTurn(s: Life5, r: Rng): void {
  yearRisks(s, r);
  if (!s.hero.alive) return;
  rollMisfortune(s, r);
  rollFortune(s, r);
}

/** 멈출 차례면 전환점 하나를 띄운다 */
function turningPoint(s: Life5, r: Rng): void {
  if (s.pending || !wantsStop(s, r)) return;
  const t = pickTurning(s, r);
  if (t) openTurning(s, t);
}

/** 이 토막에 인물이 한 일. 기본 가중치에 가치관(점수 × 계수)과 처지가 더한다. */
export function activityOf(s: Life5, r: Rng): Activity {
  const h = s.hero;
  const A = V.activity;
  if (h.standing === 'prisoner') return 'rest';
  const w: Record<Activity, number> = { train: A.base, work: A.base, study: A.base, roam: A.base, family: A.base, rest: A.base };
  for (const id of VALUE_IDS) {
    for (const a of ACTIVITIES) w[a] += (LEAN[id][a] ?? 0) * s.values[id];
  }
  if (h.wealth === 'poor') w.work += s.age <= A.kidAge ? A.poorKidWork : A.poorWork;
  if (h.standing === 'marine' || h.standing === 'cp') w.work += A.dutyWork;
  return weighted(r, ACTIVITIES, (a) => w[a])!;
}

/**
 * 스승이 있으면 스승의 갈래, 없으면 가장 멀리 간(단계와 숙련) 갈래. 몸이 허락하지 않는 갈래는 고르지 않는다.
 * 아무것도 익히지 않았으면 null
 */
export function mainBranch(s: Life5): Branch | null {
  const m = s.growth.master;
  if (m && canUse(s, m.branch)) return m.branch;
  const progress = (b: Branch) => s.growth.tier[b] * V.growth.tierUp + s.growth.mastery[b];
  let best: Branch | null = null;
  for (const b of Object.keys(BRANCH_ID) as Branch[]) {
    if (canUse(s, b) && progress(b) > (best ? progress(best) : 0)) best = b;
  }
  return best;
}

/** 한 토막만큼 상처가 아문다. 다 나은 상처는 지운다. 흉터는 낫지 않는다. */
function healInjuries(s: Life5): void {
  const h = s.hero;
  for (const inj of h.injuries) if (inj.severity !== 'scar') inj.monthsLeft -= V.injury.monthsPerPart;
  h.injuries = h.injuries.filter((inj) => inj.severity === 'scar' || inj.monthsLeft > 0);
}

/** 한 토막의 활동만큼 자란다: 숙련과 능력치, 단계, 정체와 돌파 */
export function growPart(s: Life5, act: Activity, r: Rng): void {
  const h = s.hero;
  const G = V.growth;
  const age = ageMult(s.age);
  switch (act) {
    case 'train': train(s, r, age); return;
    case 'study':
      statUp(s, r, ['int'], G.statP.study * age);
      addMastery(s, 'observation', G.perPart * G.studyObs * age * talentMult(s, 'observation'));
      return;
    case 'roam': statUp(s, r, ['luk', 'spd'], G.statP.roam * age); return;
    case 'work': h.money += s.age <= V.activity.kidAge ? G.kidWorkMoney : G.workMoney; return;   // 아이의 품삯은 대개 식구의 밥이 된다
    case 'family':
      for (const p of s.people) if (p.alive) p.bond = Math.min(V.person.bondMax, p.bond + G.familyBond);
      return;
    case 'rest': h.hp = Math.min(V.hp.max, h.hp + G.restHp); return;
  }
}

function train(s: Life5, r: Rng, age: number): void {
  const G = V.growth;
  const b = mainBranch(s);
  const roll = r();
  if (roll < G.stallP) {
    logLine(s, b ? `${BRANCH_NAMES[BRANCH_ID[b]]} 수련이 제자리걸음이었다.` : '몸이 무거워 수련이 손에 잡히지 않았다.', 'light', 'growth');
    return;
  }
  if (!b) { statUp(s, r, G.bareStats, G.statP.train * age); return; }
  const m = s.growth.master;
  let add = G.perPart * age * talentMult(s, b) * (m && m.branch === b ? G.masterMult : 1);
  const capped = s.growth.tier[b] >= tierCap(s, b) && s.growth.mastery[b] >= G.tierUp;
  if (roll < G.stallP + G.breakP && age > 0 && !capped) {
    add += G.breakAdd;
    logLine(s, `수련 중에 무언가를 붙잡았다. ${BRANCH_NAMES[BRANCH_ID[b]]}의 벽 하나가 무너졌다.`, 'heavy', 'growth');
  }
  addMastery(s, b, add);
  statUp(s, r, G.branchStats[b], G.statP.train * age);
}

/** 확률 p로 keys 가운데 하나를 1 올린다 */
function statUp(s: Life5, r: Rng, keys: readonly StatKey[], p: number): void {
  if (chance(r, p)) s.hero.base[pick(r, keys)] += 1;
}

function ageMult(age: number): number {
  return V.growth.ageMult.find((x) => age <= x.to)?.m ?? 0;
}

/** 타고난 재능의 숙련 배율. 갈래 자신, 'all', 패기 갈래면 'haki'를 모두 곱한다 */
function talentMult(s: Life5, b: Branch): number {
  const id = BRANCH_ID[b];
  const keys = id.startsWith('haki.') ? [id, 'all', 'haki'] as const : [id, 'all'] as const;
  let m = 1;
  for (const t of s.hero.talents) for (const k of keys) m *= TALENT_BY_ID[t]?.mastery?.[k] ?? 1;
  return m;
}

/**
 * 일상 기록 한 줄 (가치관 쪽으로 기울고, 이 토막의 활동과 같은 쪽으로 기운 줄을 먼저 고른다).
 * 최근에 낸 글(recentLines)은 뽑지 않는다. 뽑을 것이 없으면 이 토막은 줄을 내지 않는다
 */
function dailyLine(s: Life5, act: Activity, r: Rng): void {
  if (!chance(r, isQuiet(s) ? V.lines.quietDailyP : V.lines.dailyP)) return;
  const fits = (lean: Partial<Record<ValueId, number>>) => VALUE_IDS.some((id) => (lean[id] ?? 0) > 0 && (LEAN[id][act] ?? 0) > 0);
  const pool = LINES.filter((l) => checkAll(s, l.when) && !isRecent(s, fillText(s, l.text)));
  const line = leanPick(s, r, pool, (l) => l.lean, (l) => (fits(l.lean) ? V.activity.lineBoost : 1));
  if (line) dayLine(s, fillText(s, line.text));
}

/** 토막을 넘긴다. 네 토막이 차면 한 살을 먹는다. */
function nextPart(s: Life5): void {
  const part = s.part + 1;
  if (part < V.partsPerYear) { s.part = part as Life5['part']; return; }
  s.part = 0;
  s.age += 1;
  for (const p of s.people) if (p.alive) p.age += 1;   // 이름난 사람도, 곁의 사람도 주인공과 함께 나이를 먹는다
  s.stopsThisYear = 0;
  s.stats.years += 1;
  yearDivider(s);
  comeOfAge(s);
  masterYear(s);
}

/** 아직 아이로 남은 사람은 어른이 되는 해에 저절로 뭍의 어른(civil)이 된다. 이제 제 밥벌이는 스스로 한다 */
function comeOfAge(s: Life5): void {
  if (s.hero.standing !== 'child' || s.age < V.adultAge) return;
  s.hero.standing = 'civil';
  s.standingSince = s.age;
  logLine(s, `${s.hero.name}은(는) 어느덧 어른이 되었다. 이제 제 앞가림은 스스로 해야 한다.`, 'heavy', 'life');
}

/** 스승과 함께한 해를 하나 줄인다. 다 채우면 스승은 떠난다. */
function masterYear(s: Life5): void {
  const m = s.growth.master;
  if (!m) return;
  m.yearsLeft -= 1;
  if (m.yearsLeft > 0) return;
  s.growth.master = null;
  logLine(s, `${m.name}이(가) 가르침을 마치고 떠났다.`, 'heavy', 'life');
}

function endIfDead(s: Life5): void {
  if (!s.hero.alive) s.pending = { kind: 'ending', cause: s.ended?.cause ?? '' };
}
