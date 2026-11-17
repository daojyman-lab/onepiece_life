// 싸움 밖의 죽음 (설계 5.7): 병, 사고(난파), 굶주림, 노환.
// 플레이어가 고르지 않은 죽음이라 드물고, 노환을 빼면 대개 조짐이 먼저 기록에 떠오른다.
// 해가 바뀔 때 yearRisks가 걸리는지 굴리고, 토막마다 partRisks가 병의 진행과 폭풍의 결말을 낸다.
import { TALENT_BY_ID } from '../../data/talents';
import { chance, pick, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { effectiveStats5 } from './body';
import { applyFx } from './fx';
import { logLine } from './state';
import { medicSkill } from './health';
import { ILLNESS_NAME } from '../data/words';
import type { Life5, Standing } from './types';

const R = V.risk;
const SEA: readonly Standing[] = R.seaStandings;
const IDLE: readonly Standing[] = R.idleStandings;
const ORDINARY_ILLNESSES = ['cold', 'cold', 'flu', 'flu', 'pneumonia', 'dysentery'] as const;
const ILLNESS_PACE: Record<string, number> = { cold: 0, flu: 15, pneumonia: 9, dysentery: 9, infection: 9, cough: 15 };

/** 이 나이에 한 해 동안 노환으로 죽을 확률 (재능 배율 전) */
export function oldAgeP(age: number): number {
  return age < R.oldFrom ? 0 : (age - R.oldFrom + 1) ** 2 * R.oldK;
}

/** 평온하게 산 사람은 노환이 늦게 온다 (설계 7장: 가치관이 다르면 인생의 길이 다르다). 평온 점수에 비례해 V.risk.calmGuard까지 줄인다 */
function calmMult(s: Life5): number {
  return 1 - R.calmGuard * s.values.peace / V.value.max;
}

/** 해가 바뀔 때 한 번: 노환 → 병 → 사고의 조짐 → 굶주림. 죽었거나 떠 있는 일이 있으면 굴리지 않는다 */
export function yearRisks(s: Life5, r: Rng): void {
  if (!s.hero.alive || s.pending) return;
  if (chance(r, oldAgeP(s.age) * talentMult(s, 'oldAge') * calmMult(s))) { die(s, '노환'); return; }
  if (s.flags.includes('lonely') && s.age >= V.family.lonelyFrom && chance(r, V.family.lonelyP)) {   // 아무 인연 없이 자란 사람의 쓸쓸한 끝 (v6.7)
    logLine(s, '기댈 사람도, 돌아갈 곳도 없었다. 아무도 이름을 불러 주지 않는 밤이 길었다.', 'heavy', 'danger');
    die(s, '아무도 모르는 곳에서 쓸쓸히'); return;
  }
  if (!s.hero.illness && chance(r, illnessP(s))) {
    const id = pick(r, ORDINARY_ILLNESSES);
    applyFx(s, [{ op: 'illness', id }]);
    logLine(s, `${ILLNESS_NAME[id]}에 걸렸다.`, 'heavy', 'danger');
  }
  if (SEA.includes(s.hero.standing) && !s.flags.includes('storm') && chance(r, R.accidentP)) {
    s.flags.push('storm');
    logLine(s, '먹구름이 몰려온다. 폭풍이 다가온다.', 'heavy', 'danger');
  }
  starve(s);
}

/** 토막마다: 지난 토막에 다가온 폭풍의 결말, 앓는 병의 치료나 진행. 죽었거나 떠 있는 일이 있으면 아무것도 하지 않는다 */
export function partRisks(s: Life5, r: Rng): void {
  if (!s.hero.alive || s.pending) return;
  if (s.flags.includes('storm')) storm(s, r);
  if (!s.hero.alive) return;
  woundInfection(s, r);
  illness(s, r);
}

function illnessP(s: Life5): number {
  const old = s.age >= R.illnessAge ? (s.age - R.illnessAge + 1) * R.illnessPerYear : 0;
  return (R.illnessP + old) * talentMult(s, 'illness') * (1 - medicSkill(s) / 200);
}

function woundInfection(s: Life5, r: Rng): void {
  if (s.hero.illness) return;
  const skill = medicSkill(s);
  for (const wound of s.hero.injuries) {
    if (wound.treated || wound.severity !== 'heavy' || (wound.kind !== 'cut' && wound.kind !== 'burn')) continue;
    if (!chance(r, R.woundInfectionP * (1 - skill / 100))) continue;
    applyFx(s, [{ op: 'illness', id: 'infection' }]);
    logLine(s, '깊은 상처가 감염됐다.', 'heavy', 'danger');
    return;
  }
}

/** 실제 병명으로 경과를 기록한다. 선의의 치료 능력이 높을수록 비용 없이 고칠 가능성이 크다. */
function illness(s: Life5, r: Rng): void {
  const h = s.hero;
  const ill = h.illness;
  if (!ill) return;
  const skill = medicSkill(s);
  const name = ILLNESS_NAME[ill.id] ?? '병';
  if (skill > 0 && chance(r, skill / 100)) {
    h.illness = null;
    logLine(s, `선의의 치료로 ${name}이(가) 나았다.`, 'heavy', 'life');
    return;
  }
  if (h.money >= R.treatCost) {
    h.money -= R.treatCost;
    h.illness = null;
    logLine(s, `모아 둔 돈을 털어 의원을 찾았다. ${name}이(가) 나았다.`, 'light', 'life');
    return;
  }
  if (ill.id === 'cold') {
    h.illness = null;
    h.hp = Math.max(1, h.hp - R.coldHp);
    logLine(s, '감기가 가라앉았지만 기운이 빠졌다.', 'light', 'life');
    return;
  }
  h.hp = Math.max(1, h.hp - R.sickHp);
  ill.months += R.monthsPerPart;
  if (ill.months < (ILLNESS_PACE[ill.id] ?? R.worsenMonths)) return;
  ill.months = 0;
  if (ill.stage < R.maxStage) {
    ill.stage = (ill.stage + 1) as 1 | 2 | 3;
    logLine(s, `약 살 돈이 없다. ${name}이(가) 깊어진다.`, 'heavy', 'danger');
    return;
  }
  if (isKid(s)) {
    h.illness = null;
    hurtKid(s, '죽을 고비를 넘기고 병이 물러갔다. 몸은 많이 상했다.');
    return;
  }
  die(s, '병');
}

/** 폭풍의 결말: 운과 항해사 동료가 난파를 막는다 */
function storm(s: Life5, r: Rng): void {
  s.flags = s.flags.filter((f) => f !== 'storm');
  const luck = Math.max(R.lukFloor, 1 - effectiveStats5(s).luk * R.lukPer);
  const p = R.wreckDeathP * luck * (hasCrew(s, 'navigator') ? R.navigatorMult : 1);
  if (!chance(r, p)) {
    applyFx(s, [{ op: 'hp', add: -R.stormHp }]);
    logLine(s, '거센 폭풍을 뚫고 겨우 살아남았다.', 'heavy', 'danger');
    return;
  }
  if (isKid(s)) { hurtKid(s, '배가 부서졌지만 널빤지에 매달려 살아남았다.'); return; }
  die(s, '난파');
}

/** 가난한 집에서 돈 한 푼 없이 벌이도 없으면: 첫해는 야위고, 다음 해에도 그대로면 굶어 죽는다 */
function starve(s: Life5): void {
  const h = s.hero;
  const starving = h.wealth === 'poor' && h.money === 0 && IDLE.includes(h.standing);
  if (!starving) { s.flags = s.flags.filter((f) => f !== 'starving'); return; }
  if (!s.flags.includes('starving')) {
    s.flags.push('starving');
    logLine(s, '먹을 것이 떨어진 지 오래다. 눈에 띄게 야위었다.', 'heavy', 'danger');
    return;
  }
  if (isKid(s)) { hurtKid(s, '배고픔에 쓰러졌다가 이웃이 건넨 죽 한 그릇으로 겨우 일어났다.'); return; }
  die(s, '굶주림');
}

function isKid(s: Life5): boolean {
  return s.age <= R.kidAge;
}

/** 아이는 죽지 않고 체력만 잃는다 */
function hurtKid(s: Life5, text: string): void {
  applyFx(s, [{ op: 'hp', add: -R.kidHp }]);
  logLine(s, text, 'heavy', 'danger');
}

function die(s: Life5, cause: string): void {
  applyFx(s, [{ op: 'die', cause }]);
}

function hasCrew(s: Life5, role: 'medic' | 'navigator'): boolean {
  return s.people.some((p) => p.alive && p.crew?.role === role);
}

function talentMult(s: Life5, key: 'illness' | 'oldAge'): number {
  let m = 1;
  for (const t of s.hero.talents) m *= TALENT_BY_ID[t]?.[key] ?? 1;
  return m;
}
