import { AMAZON_ROADS } from '../data/training-routes';
// 저장 읽기: 저장해 둔 JSON을 인생 · 도감으로 되살린다. 옛 저장에 빠진 칸은 기본값으로 채운다.
import { normalizeRouteSave } from './route-save';
import { restoreRecruitedRival, updateRival } from './rival';
import { normalizeTraits } from './traits';
import { V } from '../data/balance';
import { RETIRED_FRUIT_IDS } from '../shared/data/fruits';
import { EPISODE_TURNINGS } from '../data/episodes';
import { entryPass } from '../data/voyage';
import { VALUE_IDS } from '../data/values';
import { personalityCell } from './personality';
import { topValues } from './values';
import { mainBranch } from './year';
import { emptyMeta5, type Meta5 } from './meta';
import { invariants5 } from './reduce';
import { bountyAmount, hadBountyBeforeUpgrade } from './first-poster';
import { worldTick } from '../data/world-history';
import { PRESS_LIMIT, reconcileWorld } from './world-news';
import { emptyLife } from './state';
import { normalizeStyles } from './styles';
import { SHIP_MARK } from './ship-memory';
import { isCombatStyle } from '../data/combat-styles';
import { discipleFor } from './disciples';
import { restoreStoryDoor } from './turning';
import { restoreEscapeNotoriety } from './bounty';
import { isSiblingCareer } from './siblings';
import { SIBLING_REUNION_ID } from '../data/turnings/sibling-reunion';
import { repairEpisodeContacts } from '../data/episodes/contacts';
import type { Life5 } from './types';

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

const ENTRY_PASS_CHOICES = EPISODE_TURNINGS.flatMap((scene) => scene.doors.flatMap((door, i) =>
  door.fx.flatMap((effect) => effect.op === 'entryPass'
    ? [{ choice: `${scene.id}#${i}`, flag: entryPass(effect.gate), home: effect.gate }] : []),
));

/** 인생의 맨 위 칸 가운데 목록이어야 하는 것과 객체여야 하는 것 */
const LIFE_ARRAYS = ['log', 'timeline', 'people', 'flags', 'queue', 'tried', 'known', 'closed', 'recentLines'] as const;
const LIFE_OBJECTS = ['hero', 'growth', 'values', 'personality', 'stats', 'seenCount', 'vows'] as const;

/**
 * 떠 있는 일의 모양이 맞는가: null이거나, 종류(door · fight · battle · ending)에 따라 화면이 읽는 칸을 갖춘 객체.
 * door: doors 목록과 글자 title · body / fight · battle: foe 객체 / battle: battle.events · battle.units 목록 / ending: 글자 cause
 */
function pendingOk(p: unknown): boolean {
  if (p === null) return true;
  if (!isObj(p)) return false;
  switch (p.kind) {
    case 'door': return Array.isArray(p.doors) && typeof p.title === 'string' && typeof p.body === 'string';
    case 'fight': return isObj(p.foe);
    case 'battle': return isObj(p.foe) && isObj(p.battle) && Array.isArray(p.battle.events) && Array.isArray(p.battle.units);
    case 'ending': return typeof p.cause === 'string';
    default: return false;
  }
}

/** got에 빠진(undefined인) 칸을 def의 값으로 채운 새 객체 */
function withDefaults(got: Obj, def: object): Obj {
  const out: Obj = { ...got };
  for (const [k, v] of Object.entries(def)) if (out[k] === undefined) out[k] = v;
  return out;
}

/**
 * 저장된 인생을 읽는다. schema가 5가 아니거나 객체가 아니면 null.
 * 빠진 칸은 emptyLife(seed)의 값으로 채운다(맨 위 칸과 stats · hero · growth의 칸). 채운 뒤에도 불변 조건을 어기거나\n * 떠 있는 일의 모양이 틀리면 null.
 */
export function normalizeLife5(x: unknown): Life5 | null {
  if (!isObj(x) || x.schema !== 5) return null;
  const oldPersonality = x.personality === undefined;
  const legacyStyles = !isObj(x.growth) || x.growth.styleMastery === undefined;
  const seed = isObj(x.rng) && typeof x.rng.seed === 'number' ? x.rng.seed : 0;
  const def = emptyLife(seed);
  // 처지가 된 나이를 모르는 옛 저장은 지금부터 센다
  const s = withDefaults(x, { ...def, standingSince: typeof x.age === 'number' ? x.age : def.standingSince });
  // 큰 칸의 모양이 틀리면(목록이어야 할 곳에 객체가 있는 등) 고쳐 읽지 않는다
  if (LIFE_ARRAYS.some((k) => !Array.isArray(s[k])) || LIFE_OBJECTS.some((k) => !isObj(s[k]))) return null;
  if (isObj(s.vows) && (!Array.isArray(s.vows.history) || (s.vows.active !== null && !isObj(s.vows.active)))) return null;
  if (!pendingOk(s.pending)) return null;      // 손으로 고친 파일의 깨진 창이 화면을 무너뜨리지 않게
  // 태어난 형편을 모르는 옛 저장은 지금의 형편으로 (몰락을 세지 않는다)
  if (isObj(s.hero) && s.hero.bornWealth === undefined) s.hero = { ...s.hero, bornWealth: s.hero.wealth };
  for (const k of ['stats', 'hero', 'growth'] as const) s[k] = withDefaults(s[k] as Obj, def[k]);
  const life = s as unknown as Life5;
  const tick = worldTick(life);
  const validTick = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n <= tick;
  if (life.pending?.kind === 'door' && life.pending.openedTick !== undefined && !validTick(life.pending.openedTick)) return null;
  if (!Array.isArray(life.news) || life.news.length > PRESS_LIMIT || life.news.some(article => !isObj(article) ||
      typeof article.id !== 'string' || typeof article.title !== 'string' || typeof article.body !== 'string' ||
      !['big', 'world', 'local', 'bounty'].includes(article.kind) || !Number.isSafeInteger(article.age) || article.age < 0 ||
      !Number.isInteger(article.part) || article.part < 0 || article.part >= V.partsPerYear || !validTick(worldTick(article)) ||
      (article.logId !== undefined && (!Number.isSafeInteger(article.logId) || article.logId < 0 || article.logId >= life.seq)) ||
      (article.amount !== undefined && (!Number.isSafeInteger(article.amount) || article.amount <= 0)))) return null;
  if (new Set(life.news.map(issue => issue.id)).size !== life.news.length) return null;
  if (life.pressTick !== undefined && !validTick(life.pressTick)) return null;
  if (life.ships !== undefined) {
    const ageOk = (age: number, min = 0) => Number.isInteger(age) && age >= min && age <= life.age;
    if (!Array.isArray(life.ships) || life.ships.some((h, i, hulls) =>
      !isObj(h) || h.id !== i + 1 || (h.name !== undefined && typeof h.name !== 'string') ||
      (h.acquiredAt !== undefined && !ageOk(h.acquiredAt, hulls[i - 1]?.end?.age)) ||
      !Array.isArray(h.repairs) || h.repairs.some(r => !isObj(r) || !Object.hasOwn(SHIP_MARK, r.kind) ||
        !ageOk(r.age, h.acquiredAt) || typeof r.island !== 'string' || (h.end && r.age > h.end.age)) ||
      (h.helmFrom !== undefined && (!i || h.helmFrom !== i || hulls[i - 1].end?.kind !== 'helm')) ||
      (h.spiritAt !== undefined && h.spiritAt !== h.end?.age) ||
      (h.end === undefined ? i !== hulls.length - 1 || !life.flags.includes('ship') :
        !isObj(h.end) || !['helm', 'playground', 'house', 'lost', 'switched'].includes(h.end.kind) ||
        !ageOk(h.end.age, h.acquiredAt) || typeof h.end.island !== 'string'))) return null;
  }
  const meal = life.watchMeal;
  if (meal !== undefined && (!isObj(meal) || !Number.isSafeInteger(meal.hullId) || meal.hullId < 1 ||
    typeof meal.sailorId !== 'string' || !Number.isInteger(meal.sharedAt) || meal.sharedAt < 0 || meal.sharedAt > life.age ||
    !['shared', 'reserved', 'passed', 'closed'].includes(meal.stage) ||
    ((meal.stage === 'reserved' || meal.stage === 'passed') && (meal.shelfSince === undefined ||
      !Number.isInteger(meal.shelfSince) || meal.shelfSince <= meal.sharedAt || meal.shelfSince > life.age ||
      !Array.isArray(meal.originalCrew) || !meal.originalCrew.includes(meal.sailorId) || !meal.originalCrew.every(id => typeof id === 'string'))))) return null;
  if (life.hero.gender === 'm' && life.hero.island === '아마존 릴리' && !life.pending && !life.passage) life.hero.island = AMAZON_ROADS;
  if (!normalizeRouteSave(life)) return null;
  if (life.siblingBirths !== undefined && (!Array.isArray(life.siblingBirths) ||
    life.siblingBirths.some(b => !isObj(b) || !Number.isInteger(b.age) || b.age <= V.birth.startAge || b.age > V.family.siblingGap[1] ||
      typeof b.name !== 'string' || !b.name.trim() || (b.gender !== 'm' && b.gender !== 'f')) ||
    new Set(life.siblingBirths.map(b => b.age)).size !== life.siblingBirths.length)) return null;
  // 지나간 출생 예정일은 지운다. 뒤늦게 동생이나 출생 장면을 만들지 않는다.
  if (life.siblingBirths?.some(b => b.age <= life.age)) {
    life.siblingBirths = life.siblingBirths.filter(b => b.age > life.age);
    if (!life.siblingBirths.length) delete life.siblingBirths;
  }
  if (life.people.some((p) => {
    const story = p?.siblingLife;
    return story !== undefined && (!isObj(story) || !isSiblingCareer(story.career) ||
      typeof story.island !== 'string' || !story.island.trim() || typeof story.latestNews !== 'string' ||
      !Number.isInteger(story.nextNewsAt) || story.nextNewsAt < 0 ||
      (story.metAt !== undefined && (!Number.isInteger(story.metAt) || story.metAt < 0 || story.metAt > life.age)) ||
      (story.vivreCard !== undefined && story.vivreCard !== true));
  })) return null;
  try { normalizeStyles(life, legacyStyles, !isObj(x.growth) || x.growth.weapons === undefined); } catch { return null; }
  if (life.disciples !== undefined) {
    if (!Array.isArray(life.disciples) || life.disciples.some(d => !isObj(d) ||
      typeof d.personId !== 'string' || !life.people.some(p => p.id === d.personId) || !isCombatStyle(d.style) ||
      typeof d.island !== 'string' || !Number.isFinite(d.since) || d.since < 0 || d.since > life.age ||
      (d.trainedAt !== undefined && (!Number.isFinite(d.trainedAt) || d.trainedAt < d.since + 3 || d.trainedAt > life.age)) ||
      (d.sailedAt !== undefined && (d.trainedAt === undefined || !Number.isFinite(d.sailedAt) || d.sailedAt < d.trainedAt + 2 || d.sailedAt > life.age)) ||
      (d.readyAt !== undefined && !Number.isFinite(d.readyAt)) ||
      (d.outcome !== undefined && (d.sailedAt === undefined || !['duel', 'reconciled', 'reported'].includes(d.outcome)))) ||
      new Set(life.disciples.map(d => d.personId)).size !== life.disciples.length) return null;
  }
  // 옛 사건에는 앞선 사제 관계가 없다. 과거를 만들어 넣지 않고 근거 없는 대기 창만 닫는다.
  if (life.pending?.kind === 'door') {
    const stage = life.pending.turning === 'late_r_student_pirate' ? 'reunion'
      : life.pending.turning === 'late_disciple_sails' ? 'sailing'
      : life.pending.turning === 'disciple_training' ? 'training' : null;
    if (stage && (!life.pending.discipleId || discipleFor(life, stage)?.personId !== life.pending.discipleId)) life.pending = null;
  }
  if (life.lifeStory !== undefined) {
    const story = life.lifeStory;
    if (!isObj(story) || !Number.isInteger(story.elapsed) || story.elapsed < 0 || !Array.isArray(story.events) ||
      story.events.some((e) => !isObj(e) || typeof e.id !== 'string' || !Number.isFinite(e.age) ||
        !Number.isInteger(e.part) || e.part < 0 || e.part > 3 || typeof e.island !== 'string' ||
        !Number.isInteger(e.elapsed) || e.elapsed < 0 || e.elapsed > story.elapsed || (e.actorId !== undefined && typeof e.actorId !== 'string') ||
        (e.method !== undefined && e.method !== 'guard' && e.method !== 'support')) ||
      new Set(story.events.map((e) => e.id)).size !== story.events.length ||
      (story.wait !== null && (!isObj(story.wait) || !Number.isInteger(story.wait.readyAt) || !Number.isInteger(story.wait.expiresAt) ||
        story.wait.readyAt > story.wait.expiresAt || typeof story.wait.island !== 'string' ||
        typeof story.wait.then !== 'string' || typeof story.wait.otherwise !== 'string'))) return null;
  }
  // 증표 기능이 생기기 전에 보상 문을 고른 인생도 그 선택을 인정한다.
  for (const { choice, flag, home } of ENTRY_PASS_CHOICES) {
    if (life.hero.home !== home && life.tried.includes(choice) && !life.flags.includes(flag)) life.flags = [...life.flags, flag];
  }
  if (life.hero.fruit?.id === 'gomu') life.hero.fruit.id = 'nika';
  else if (life.hero.fruit && RETIRED_FRUIT_IDS.has(life.hero.fruit.id)) {
    life.hero.fruit = null;
    life.growth.tier.fruit = 0;
    life.growth.mastery.fruit = 0;
  }
  if (oldPersonality) {
    const top = topValues(life, 1)[0];
    if (top) life.personality = { ...personalityCell(top), pullRow: 0, pullCol: 0, choices: 3, hold: 0, established: true };
  } else if (isObj(life.personality)) {
    const p = life.personality;
    life.personality = {
      ...p,
      hold: p.hold === undefined ? 0 : p.hold,
      established: p.established === undefined ? (Number(p.choices) >= 3) : p.established,
    } as Life5['personality'];
  }
  if (life.traits !== undefined && !isObj(life.traits)) return null;
  if (!Array.isArray(life.hero.talents) || !Array.isArray(life.strengths)) return null;
  normalizeTraits(life);
  // 초기 서약 저장의 진행 칸이 없으면 현재 자리에서 이어 간다.
  if (life.vows?.active) {
    life.vows.active.island ??= life.hero.island;
    life.vows.active.progress ??= [];
    if (life.vows.active.level) {
      life.vows.active.activities ??= [];
      life.vows.active.choices ??= [];
    }
  }
  // 4단계에서 헌신(devotion)이 빠지고 탐욕(greed)이 들어왔다: 옛 점수는 버린다
  if (isObj(life.values)) delete (life.values as Record<string, unknown>).devotion;
  // 선호도가 없는 옛 저장: 지금까지 간 만큼(단계와 숙련)을 선호도로 삼고, 지금의 길은 알린 것으로 친다
  const g = life.growth;
  if (isObj(g) && isObj(g.pref) && isObj(g.tier) && isObj(g.mastery) && Object.values(g.pref).every((v) => !v)) {
    for (const b of Object.keys(g.pref) as (keyof typeof g.pref)[]) g.pref[b] = (g.tier[b] ?? 0) * V.growth.tierUp + (g.mastery[b] ?? 0);
    if (life.age >= V.growth.pref.pathAge) g.path = mainBranch(life);
  }
  try {
    restoreEscapeNotoriety(life);
    if (x.publishedBounty === undefined) {
      const first = life.timeline.find(entry => typeof entry?.text === 'string' && /^첫 현상금 [\d,]+ 베리$/.test(entry.text));
      life.publishedBounty = Math.max(bountyAmount(life), Number(first?.text.replace(/[^\d]/g, '') || 0), ...life.news.map(issue => issue.amount ?? 0));
    }
    if (!Number.isSafeInteger(life.publishedBounty) || life.publishedBounty! < 0) return null;
    if (x.firstBountyIssued === undefined) life.firstBountyIssued = hadBountyBeforeUpgrade(life);
    if (typeof life.firstBountyIssued !== 'boolean') return null;
    if (x.news === undefined && !life.ended) reconcileWorld(life, false);
    if (invariants5(life, true).length) return null;
    if (life.firstChoiceAge !== undefined && (!isObj(life.firstChoiceAge) ||
        !Object.values(life.firstChoiceAge).every(age => Number.isInteger(age) && age >= 0 && age <= life.age))) return null;
    // 첫 선택 나이가 없던 저장도 재개한 뒤 같은 창을 다시 열기 전에 과거 기록을 보존한다.
    // 당시 마지막 개봉 때까지는, 이번 생에서 고른 것으로 남은 문을 적어도 한 번 골랐다.
    for (const key of life.tried) {
      if (life.firstChoiceAge?.[key] !== undefined) continue;
      const lastVisit = life.seen[key.slice(0, key.lastIndexOf('#'))];
      if (Number.isInteger(lastVisit) && lastVisit >= 0 && lastVisit <= life.age) {
        (life.firstChoiceAge ??= {})[key] = lastVisit;
      }
    }
    restoreRecruitedRival(life);
    for (const p of life.people) {
      if (p.canon === 'bellamy' && p.crew) p.crew.power = Math.max(p.crew.power, V.person.crew.bellamyPower);
    }
    const obsoleteRivalChoices = ['life_rival_invitation', 'life_rival_date', 'life_rival_promise'];
    if (life.pending?.kind === 'door' && obsoleteRivalChoices.includes(life.pending.turning)) life.pending = null;
    life.queue = life.queue.filter(id => !obsoleteRivalChoices.includes(id));
    if (life.pending?.kind === 'door' && life.pending.turning === 'life_rival_reunion' && !life.rival) updateRival(life);
    repairEpisodeContacts(life);
    restoreStoryDoor(life);
    if (life.pending?.kind !== 'door' || life.pending.turning !== SIBLING_REUNION_ID) delete life.siblingMeeting;
    return life;
  } catch {
    return null;                               // 칸의 모양이 깨져 확인조차 못 하면 읽지 않는다
  }
}

/** 저장된 도감을 읽는다. 못 읽으면 빈 도감, 빠지거나 모양이 틀린 칸은 빈 값으로 채운다. */
export function normalizeMeta5(x: unknown): Meta5 {
  const def = emptyMeta5();
  if (!isObj(x) || x.schema !== 5) return def;
  const m = withDefaults(x, def);
  if (!isObj(m.doors)) m.doors = def.doors;
  // 없어진 가치관(헌신)은 도감에서 지운다
  else for (const [k, v] of Object.entries(m.doors)) if (Array.isArray(v)) (m.doors as Obj)[k] = v.filter((x) => VALUE_IDS.includes(x as never));
  for (const k of ['fruits', 'people', 'hall'] as const) if (!Array.isArray(m[k])) m[k] = def[k];
  m.fruits = [...new Set((m.fruits as unknown[]).filter((id): id is string => typeof id === 'string' && !RETIRED_FRUIT_IDS.has(id)).map((id) => id === 'gomu' ? 'nika' : id))];
  if (typeof m.lives !== 'number' || !Number.isFinite(m.lives)) m.lives = def.lives;
  return m as unknown as Meta5;
}
