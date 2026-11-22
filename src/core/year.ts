// 한 해를 네 토막으로 나눈 진행. 토막마다 가치관이 정한 일을 하고, 그만큼 자란다.
import { BRANCH_NAMES } from '../shared/data/skills';
import { traitMastery, traitEffects, traitFactor, recordTraitEvent, nextTraitAwakening } from './traits';
import { chance, pick, rngOf, weighted, type Rng } from '../shared/core/rng';
import { josa } from '../shared/core/josa';
import { V } from '../data/balance';
import { SEA_STANDINGS } from '../data/landlocked';
import { LINES, type DailyLine5 } from '../data/lines';
import { GENERIC_STORY_LINES, STORY_LINES } from '../data/storyLines';
import { VALUE_IDS } from '../data/values';
import { MINOR_FIGHT_STANDINGS } from '../data/foes';
import { checkAll } from './cond';
import { familyYear } from './family';
import { minorFight } from './fight';
import { needsOk } from './needs';
import { rollFortune, rollMisfortune, rollTrainingHakiFortune } from './fortune';
import { canUse } from './body';
import { addMastery, fillText, tierCap } from './fx';
import { runMinor } from './minor';
import { BRANCH_ID } from './power';
import { partRisks, yearRisks } from './risk';
import { recoverHealthPart } from './health';
import { dayLine, isRecent, logLine, yearDivider } from './log';
import { openQueued, openTurning, pickTurning, refreshEntryDoor, repeatAllows, STORY_PREFIX, storyRng, wantsStop } from './turning';
import { leanPick, topValues } from './values';
import { dreamYear } from './dreams';
import { expireVow } from './vow';
import { dreamVowYear } from './dream-vow';
import { dropOffer, goalActivity, goalYear, promiseOffer } from './goals';
import { yearGrowth } from './level';
import { advanceLifeTime, lifeStoryScene } from './life-story';
import { KUMA_MET, kumaSighting } from '../data/kuma';
import { TURNING_BY_ID } from '../data/turnings';
import { MORO, MORO_LANDING } from '../data/turnings/log-island';
import { buildVoyage, ENTRY_PREFIX, openLogIslandDay, openRouteArrival, regularDestinations, VOYAGE_PREFIX, voyageChoices, voyageId } from './voyage';
import { advanceRestingRival, openChildhoodAndRival } from './childhood-and-rival';
import { TRAINING } from '../data/turnings/training';
import { SIBLING_BIRTH_ID } from '../data/turnings/sibling-birth';
import { SIBLING_REUNION } from '../data/turnings/sibling-reunion';
import { findSiblingReunion, siblingYear } from './siblings';
import { applyEnvironmentPart, growthMultiplier, localFightChance } from './environment';
import { gateOf } from '../data/voyage';
import { depart, passagePart } from './passage';
import { climatePart } from './climate';
import { deliverEdition } from './world-news';
import { agingYear, inDebut, inPrime, potentialMult, primeYear } from './stages';
import { COMBAT_STYLE_BY_ID } from '../data/combat-styles';
import { hasLocalStyleLesson, isMartialBranch, practiceStyles, primaryStyle, styleName, styleUsable } from './styles';
import type { Activity, Branch, Life5, StatKey, ValueId } from './types';

const ACTIVITIES: readonly Activity[] = ['train', 'work', 'study', 'roam', 'family', 'rest'];
const LEAN: Record<ValueId, Partial<Record<Activity, number>>> = V.activity.lean;

export { power5 } from './power';

/** 은퇴해 조용히 살거나, 정점에 오른 뒤 전성기가 아닌 때. 전성기는 오히려 느리게 흐른다 (통합 기획 5.3) */
export function isQuiet(s: Life5): boolean {
  return s.hero.standing === 'retired' || (s.flags.includes('apex') && !inPrime(s));
}

/** 한 바퀴 더 돌 해의 첫 바퀴인가 (전성기, 첫 출항한 해): 이 바퀴가 끝나도 나이를 먹지 않는다 */
function firstLap(s: Life5): boolean {
  return (inPrime(s) && !s.prime!.lap) || (inDebut(s) && !s.debut!.lap);
}

/** 한 토막을 진행한다. 대기 중인 일이 있으면 아무것도 하지 않는다. */
export function stepPart(s: Life5, chosenActivity?: Activity): void {
  if (s.pending) return;
  expireVow(s);
  if (!s.hero.alive) { endIfDead(s); return; }
  deliverEdition(s);
  if (openLogIslandDay(s)) return;
  partCompanions(s, true);
  if (s.queue[0] === SIBLING_BIRTH_ID && openQueued(s)) return;
  if (storyInterlude(s)) return;               // 섬 장편의 장면 사이: 다음 장면 전에 섬의 며칠을 보낸다
  if (openQueued(s)) return;                   // 싸움 뒤 · 큰 계기처럼 줄 선 일은 그 일 바로 다음에 연다 (설계 5.7, 5.2a)
  const sighting = kumaSighting(s);
  if (sighting && !s.flags.includes(KUMA_MET) && !s.queue.some(id => id.startsWith('ep_')) && openTurning(s, TURNING_BY_ID[sighting.id])) return;
  if (s.hero.standing === 'prisoner' && s.age - s.standingSince >= 3 && openTurning(s, TURNING_BY_ID.prison_release)) return;
  const storyScene = lifeStoryScene(s);
  if (storyScene && openTurning(s, TURNING_BY_ID[storyScene])) return;
  if (!chosenActivity) {                       // v7 인연의 약속: 때가 되면 중요한 사람과의 장면이 온다
    const promise = promiseOffer(s);
    if (promise) { if (openTurning(s, promise)) return; dropOffer(s); }
  }
  const sibling = findSiblingReunion(s);
  if (sibling) {
    s.siblingMeeting = sibling.id;
    if (openTurning(s, SIBLING_REUNION)) return;
    delete s.siblingMeeting;
  }

  const awakening = chosenActivity ? null : nextTraitAwakening(s);
  if (awakening && openTurning(s, TURNING_BY_ID[awakening])) return;
  if (chosenActivity) advanceRestingRival(s);
  if (!chosenActivity && (openChildhoodAndRival(s) || openRouteArrival(s))) return;
  s.traitScene = [];
  delete s.traitSource;
  const r = rngOf(s.rng);
  if (s.passage) {
    passagePart(s, r);                         // 바다 위: 날씨를 만나고, 닿으면 섬을 옮긴다
    if (!s.passage && s.hero.island === MORO && s.queue[0] === MORO_LANDING) {
      advanceLifeTime(s);                      // 방금 마친 항해의 마지막 토막은 달력에 센다
      nextPart(s, r);
      openLogIslandDay(s);
      return;
    }
  } else climatePart(s);                       // 섬 위: 그 섬의 기후가 끼어든다 (펑크 해저드 · 하늘섬 · 조우 …). 따로 된 주사위를 쓴다
  partRisks(s, r);
  if (!s.hero.alive) return;
  const act = chosenActivity ?? activityOf(s, r);
  const island = s.hero.island;
  if (chosenActivity === 'rest') logLine(s, '한 철 동안 위험한 일을 멈추고 몸을 쉬게 했다.', 'heavy', 'life');
  recordTraitEvent(s, 'activity', act, String(s.age));
  dailyLine(s, act, r);
  growPart(s, act, r);
  recoverHealthPart(s, chosenActivity === 'rest' ? 'chosenRest' : act === 'rest' ? 'rest' : 'usual');
  applyEnvironmentPart(s, act, act === 'train' ? mainBranch(s) : null);
  if (chance(r, V.lines.minorP)) runMinor(s, r);
  const minorFightDue = chosenActivity !== 'rest' && s.hero.alive && MINOR_FIGHT_STANDINGS.includes(s.hero.standing) && chance(r, localFightChance(s));
  if (s.part === V.partsPerYear - 1 && !firstLap(s)) yearTurn(s, r);   // 병 · 기연은 실제 한 해에 한 번
  turningPoint(s, r);
  notePath(s);
  if (s.hero.alive) { advanceLifeTime(s); nextPart(s, r); }
  endIfDead(s);
  if (s.hero.alive && s.queue[0] === SIBLING_BIRTH_ID) openQueued(s);
  if (minorFightDue && s.hero.alive && !s.pending && gateOf(s.hero.island) === gateOf(island)) minorFight(s, r);
  if (s.hero.island === island) delete s.hero.skyAcclimating;
  // 항해 끝에 열린 입항 창도 그 철의 품삯·불행을 반영한 잠금으로 보여 준다.
  refreshEntryDoor(s);
}

/** 줄 선 것 가운데 섬 장편의 장면이 있는가 */
const storyQueued = (s: Life5) => s.queue.some((id) => id.startsWith(STORY_PREFIX));

/**
 * 섬 장편의 장면 사이에 흐르는 하루. 쉴 토막(storyRest)이 남았고 다음 장면이 줄 서 있으면
 * 그 섬의 일상 한 줄을 내고 토막을 하나 줄인다. 나이 · 성장 · 위험 · 항해는 흐르지 않는다. 보냈으면 true
 */
export function storyInterlude(s: Life5): boolean {
  if (s.storyRest <= 0) return false;
  if (!storyQueued(s)) { s.storyRest = 0; return false; }
  s.storyRest -= 1;
  if (s.storyNote) { logLine(s, `── ${s.storyNote} ──`, 'heavy', 'info'); s.storyNote = ''; }   // 막이 바뀐다
  const r = storyRng(s);
  // 한 장편(두 달) 안에서는 같은 줄을 다시 내지 않는다: 최근 기록 V.story.memory줄에 없는 섬 줄 → 공용 줄 → (다 떨어지면) 최근 몇 줄만 피한다
  const shown = new Set(s.log.slice(-V.story.memory).map((l) => l.text));
  const unseen = (l: DailyLine5) => lineFits(s, l) && !shown.has(fillText(s, l.text));
  const notRecent = (l: DailyLine5) => lineFits(s, l) && !isRecent(s, fillText(s, l.text));
  const tiers = [STORY_LINES.filter(unseen), GENERIC_STORY_LINES.filter(unseen), STORY_LINES.filter(notRecent), GENERIC_STORY_LINES.filter(notRecent)];
  const pool = tiers.find((t) => t.length) ?? [];
  const line = leanPick(s, r, pool, (l) => l.lean);
  if (line) dayLine(s, fillText(s, line.text));
  return true;
}

/**
 * 해가 바뀌는 자리(한 해의 마지막 토막)에서 한 번: 병 · 사고 · 노환 → 고를 수 없는 불행 → 기연.
 * 전환점보다 먼저 굴려서, 기연이 뜨면 그 토막의 전환점이 기연에게 자리를 내준다.
 */
function yearTurn(s: Life5, r: Rng): void {
  yearRisks(s, r);
  if (!s.hero.alive) return;
  rollMisfortune(s, r);
  rollTrainingHakiFortune(s);
  rollFortune(s, r);
}

/** 멈출 차례면 전환점 하나를 띄운다 */
function turningPoint(s: Life5, r: Rng): void {
  if (s.pending) return;
  if (!s.passage) {
    const lesson = TRAINING.find(t => repeatAllows(s, t) && checkAll(s, t.when));
    if (lesson && openTurning(s, lesson)) return;
  }
  if (!wantsStop(s, r)) return;
  s.stats.stopTries += 1;
  if (s.sail && openVoyage(s, r)) return;          // 섬을 옮길 때면 이번 멈춤은 항로 고르기
  const t = pickTurning(s, r);
  if (!(t && openTurning(s, t))) s.stats.emptyStops += 1;   // 멈추려 했는데 띄울 것이 없었다
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
  goalActivity(s, w);                          // v7: 꿈과 약속이 바라보는 쪽으로 기운다
  for (const e of traitEffects(s)) for (const a of ACTIVITIES) w[a] *= e.activity?.[a] ?? 1;
  return weighted(r, ACTIVITIES, (a) => w[a])!;
}

/**
 * 스승이 있으면 스승의 갈래, 없으면 가장 멀리 간(단계와 숙련) 갈래. 몸이 허락하지 않는 갈래는 고르지 않는다.
 * 아무것도 익히지 않았으면 null
 */
export function mainBranch(s: Life5): Branch | null {
  const specialMaster = s.growth.master;
  if (specialMaster && !isMartialBranch(specialMaster.branch) && canUse(s, specialMaster.branch)) return specialMaster.branch;
  const m = s.growth.master;
  if (m && canUse(s, m.branch)) return m.branch;
  const style = primaryStyle(s);
  if (style && styleUsable(s, style)) return COMBAT_STYLE_BY_ID[style].branch;
  // 선호도가 가장 높은 갈래 (같으면 더 멀리 간 갈래). 선호도가 하나도 없으면 가장 멀리 간 갈래
  const pref = (b: Branch) => s.growth.pref[b] ?? 0;
  const progress = (b: Branch) => s.growth.tier[b] * V.growth.tierUp + s.growth.mastery[b];
  const usable = (Object.keys(BRANCH_ID) as Branch[]).filter((b) => canUse(s, b));
  const liked = usable.filter((b) => pref(b) > 0);
  const pool = liked.length ? liked : usable.filter((b) => progress(b) > 0);
  let best: Branch | null = null;
  for (const b of pool) {
    if (!best || pref(b) > pref(best) || (pref(b) === pref(best) && progress(b) > progress(best))) best = b;
  }
  return best;
}

/**
 * 걷는 길(mainBranch)이 바뀌면 큰 일로 기록과 연표에 남긴다. 처음 길을 잡을 때도 남긴다.
 * 어린 아이(pathAge 전)는 아직 길을 알리지 않는다.
 */
export function notePath(s: Life5): void {
  if (s.age < V.growth.pref.pathAge) return;
  const now = mainBranch(s);
  const was = s.growth.path;
  if (now === was || now === null) return;
  s.growth.path = now;
  const name = (b: Branch) => styleName(s, b) ? `${b === 'fist' ? '체술' : '무기술'} · ${styleName(s, b)}` : BRANCH_NAMES[BRANCH_ID[b]];
  const m = s.growth.master;
  const by = m && m.branch === now ? `${m.name}을(를) 만나 ` : '';
  if (was === null) {
    logLine(s, fillText(s, `{name}은(는) ${name(now)}을(를) 제 길로 삼았다.`), 'heavy', 'growth');
    s.timeline.push({ age: s.age, text: fillText(s, `${name(now)}의 길을 걷기 시작했다`) });
  } else {
    logLine(s, fillText(s, `${by}${name(was)}을(를) 내려놓고 ${name(now)}의 길로 들어섰다.`), 'heavy', 'growth');
    s.timeline.push({ age: s.age, text: fillText(s, `${by}${name(was)}에서 ${name(now)}(으)로 길을 바꿨다`) });
  }
}

/** 한 토막의 활동만큼 자란다: 숙련과 능력치, 단계, 정체와 돌파 */
export function growPart(s: Life5, act: Activity, r: Rng): void {
  practiceStyles(s, act);
  const h = s.hero;
  const G = V.growth;
  const age = ageMult(s.age) * potentialMult(s, null);
  switch (act) {
    case 'train': train(s, r, ageMult(s.age)); return;
    case 'study':
      statUp(s, r, ['int'], G.statP.study * age);
      addMastery(s, 'observation', G.perPart * G.studyObs * age * talentMult(s, 'observation') * growthMultiplier(s, 'observation'));
      return;
    case 'roam': statUp(s, r, ['luk', 'spd'], G.statP.roam * age); return;
    case 'work': h.money += Math.round((s.age <= V.activity.kidAge ? G.kidWorkMoney : G.workMoney) * traitFactor(s, 'income')); return;   // 아이의 품삯은 대개 식구의 밥이 된다
    case 'family':
      for (const p of s.people) if (p.alive) p.bond = Math.min(V.person.bondMax, p.bond + G.familyBond * traitFactor(s, 'bond'));
      return;
    case 'rest': return;
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
  age *= potentialMult(s, b);
  if (!b) { statUp(s, r, G.bareStats, G.statP.train * age); return; }
  const m = s.growth.master;
  if (m && m.branch === b) recordTraitEvent(s, 'master', b, `${m.name}:${s.age}`);
  let add = G.perPart * age * talentMult(s, b) * (m && m.branch === b ? G.masterMult : 1);
  const capped = s.growth.tier[b] >= tierCap(s, b) && s.growth.mastery[b] >= G.tierUp;
  if (roll < G.stallP + G.breakP && age > 0 && !capped) {
    add += G.breakAdd;
    logLine(s, `수련 중에 무언가를 붙잡았다. ${BRANCH_NAMES[BRANCH_ID[b]]}의 벽 하나가 무너졌다.`, 'heavy', 'growth');
  }
  addMastery(s, b, add * growthMultiplier(s, b));
  s.growth.pref[b] += G.pref.train;            // 갈고닦을수록 그 길이 더 좋아진다
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
function talentMult(s: Life5, b: Branch): number { return traitMastery(s, b); }

/**
 * 일상 기록 한 줄 (가치관 쪽으로 기울고, 이 토막의 활동과 같은 쪽으로 기운 줄을 먼저 고른다).
 * 최근에 낸 글(recentLines)은 뽑지 않는다. 뽑을 것이 없으면 이 토막은 줄을 내지 않는다
 */
function dailyLine(s: Life5, act: Activity, r: Rng): void {
  if (!chance(r, isQuiet(s) ? V.lines.quietDailyP : V.lines.dailyP)) return;
  const fits = (lean: Partial<Record<ValueId, number>>) => VALUE_IDS.some((id) => (lean[id] ?? 0) > 0 && (LEAN[id][act] ?? 0) > 0);
  const pool = LINES.filter((l) => lineFits(s, l) && !isRecent(s, fillText(s, l.text)));
  const line = leanPick(s, r, pool, (l) => l.lean, (l) => (fits(l.lean) ? V.activity.lineBoost : 1));
  if (!line) return;
  dayLine(s, fillText(s, line.text));
  if (line.onceKey) s.seen[`daily:${line.onceKey}`] = s.age;
  if (line.money) s.hero.money = Math.max(0, s.hero.money + line.money);   // 글이 말하는 돈이 실제로 오간다
}

/** 이 사람에게 이 기록 줄이 맞는가: 조건(when)과 글이 전제하는 것(needs) */
export function lineFits(s: Life5, l: DailyLine5): boolean {
  // 돈을 쓰는 줄은 그만한 돈이 있을 때만
  const personaFits = Object.keys(l.lean).length === 0 || topValues(s, 2).some((id) => (l.lean[id] ?? 0) > 0);
  return personaFits && checkAll(s, l.when) && needsOk(s, l.needs)
    && (!l.onceKey || s.seen[`daily:${l.onceKey}`] === undefined)
    && (l.money === undefined || l.money >= 0 || s.hero.money >= -l.money);
}

/** 토막을 넘긴다. 네 토막이 차면 한 살을 먹는다. 전성기와 첫 출항한 해에는 네 토막을 두 바퀴 돌아야 한 살을 먹는다 */
function nextPart(s: Life5, r: Rng): void {
  const part = s.part + 1;
  if (part < V.partsPerYear) { s.part = part as Life5['part']; return; }
  s.part = 0;
  if (firstLap(s)) {
    if (inPrime(s)) {
      s.prime!.lap = true;
      logLine(s, '같은 해, 전성기의 두 번째 항해가 시작되었다.', 'heavy', 'life');
    } else {
      s.debut!.lap = true;
      logLine(s, '해가 바뀐 줄 알았는데, 바다에 나선 첫해는 아직 끝나지 않았다. 배울 것이 끝없이 밀려온다.', 'heavy', 'life');
    }
    s.stopsThisYear = 0;
    partCompanions(s);
    voyage(s);
    return;
  }
  if (s.prime) s.prime.lap = false;
  if (s.debut) s.debut.lap = false;
  yearGrowth(s);                               // v7: 지난 한 해의 성장을 결산한다 (나이를 먹기 전에)
  s.age += 1;
  for (const p of s.people) if (p.alive) p.age += 1;   // 이름난 사람도, 곁의 사람도 주인공과 함께 나이를 먹는다
  s.stopsThisYear = 0;
  s.stats.years += 1;
  yearDivider(s);
  familyYear(s);                               // 늙은 가족이 세상을 떠날 수 있다
  comeOfAge(s);
  masterYear(s);
  livingIncome(s);
  siblingYear(s);
  partCompanions(s);
  voyage(s);
  primeYear(s);
  dreamYear(s);
  dreamVowYear(s);
  goalYear(s);                                 // v7: 인연의 약속을 지켰는가
  agingYear(s, r);
}

/** 임시 동행은 약속한 햇수가 차면 제 길로 떠난다: 동료에서 빠지고 아는 사람으로 남는다 */
function partCompanions(s: Life5, siblingsOnly = false): void {
  for (const p of s.people) {
    if (!p.alive || !p.crew || p.tempUntil === undefined || s.age < p.tempUntil) continue;
    if (p.siblingLife) {
      if (s.passage || p.crew.separatedMonths) continue;
      delete p.crew; delete p.tempUntil; p.kind = 'family';
      p.siblingLife.island = s.hero.island;
      s.timeline.push({ age: s.age, text: josa(`${p.name}와(과) 동행을 마쳤다`) });
      logLine(s, `${p.name}와(과) 동행을 마쳤다. 헤어지기 전, 다시 길이 겹치면 찾아오기로 했다.`, 'heavy', 'life');
      continue;
    }
    if (siblingsOnly) continue;
    delete p.crew; delete p.tempUntil; p.kind = 'ally';
    logLine(s, josa(`${p.name}이(가) 제 길로 떠났다. 다시 만나자는 말은 짧았다.`), 'heavy');
  }
}

/** 바다를 다니는 사람은 해마다 같은 바다의 다른 섬으로 떠난다 (V.voyage). 섬마다의 이야기는 그 섬에 닿아야 열린다 (turnings/islands.ts) */
export function voyage(s: Life5): void {
  if (hasLocalStyleLesson(s)) { s.sail = false; return; }
  const h = s.hero;
  const scene = s.pending?.kind === 'door' ? s.pending.turning : '';
  if (s.queue.length || s.passage || s.lifeStory?.wait || scene.startsWith('life_course_') || scene.startsWith('ep_') || scene.startsWith(VOYAGE_PREFIX) || scene.startsWith(ENTRY_PREFIX)) return;
  if (s.ended || s.age < V.voyage.minAge || !SEA_STANDINGS.includes(h.standing)) return;
  const r = rngOf(s.rng);
  const military = h.standing === 'marine' || h.standing === 'cp';
  if (!s.sail && !chance(r, V.voyage.p)) return;
  if (!military && !s.sail) { s.sail = true; return; }   // 다음 멈춤에 항로를 고른다
  s.sail = false;                              // 해군은 명령으로, 고를 틈이 없던 사람은 바람 닿는 대로
  const ports = regularDestinations(s, military);
  const next = weighted(r, ports, (p) => (s.flags.includes(`at:${p}`) ? 1 : V.voyage.fresh));
  if (!next) return;
  depart(s, next, 'drift', military);         // 바다를 건너 닿는다 (core/passage.ts)
}

/** 항로 고르기를 띄운다. 띄웠으면 true */
function openVoyage(s: Life5, r: Rng): boolean {
  s.sail = false;
  if (hasLocalStyleLesson(s)) return false;
  if (!SEA_STANDINGS.includes(s.hero.standing) || s.hero.standing === 'marine' || s.hero.standing === 'cp') return false;
  const arrivalAge = s.part === V.partsPerYear - 1 && !firstLap(s) ? s.age + 1 : s.age;
  const c = voyageChoices(s, r, arrivalAge);
  const t = c && buildVoyage(voyageId(s, c));
  return !!t && openTurning(s, t);
}

/** 뭍에 자리 잡은 사람 · 물러난 사람은 해마다 살림 돈을 번다 (V.income) */
function livingIncome(s: Life5): void {
  const st = s.hero.standing;
  if (st === 'settled') s.hero.money += V.income.settled;
  else if (st === 'retired') s.hero.money += V.income.retired;
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
