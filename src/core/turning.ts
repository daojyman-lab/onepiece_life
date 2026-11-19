// 전환점과 문: 고를 수 있는 문을 풀고, 띄우고, 고른 답을 적용한다.
import { buildEntryGate, buildVoyage, ENTRY_PREFIX, VOYAGE_PREFIX } from './voyage';
import { josa } from '../shared/core/josa';
import { chance, int, rngOf, weighted, type Rng } from '../shared/core/rng';
import { V } from '../data/balance';
import { CANON } from '../data/canon';
import { ITEM_BY_ID } from '../shared/data/items';
import { TURNING_BY_ID, TURNINGS } from '../data/turnings';
import { STORY_PACE } from '../data/episodes/pacing';
import { VALUE_DEEPEN, VALUE_LEAN, VALUE_NAME } from '../data/values';
import { checkAll, whyNot } from './cond';
import { applyFx, fillText } from './fx';
import { livingContact, needsOk, whyNeed } from './needs';
import { logLine } from './state';
import { addValues, isDeep, opensSpecial } from './values';
import { applyPersonalityChoice } from './personality';
import { isQuiet } from './year';
import { advanceVow, canBeginVow, recordVowChoice } from './vow';
import { afterLifeStoryChoice } from './life-story';
import { EPISODE_NATIVE_TRUST } from '../data/episodes';
import { environmentOf, isNative, tradeEffects } from './environment';
import { recordTraitEvent, tradeCost } from './traits';
import { discipleFor, discipleReady } from './disciples';
import type { Door, Life5, ResolvedDoor, Turning } from './types';

/**
 * 데이터에 없는 전환점(시험에서 바로 만든 것 등)을 띄웠을 때 답을 찾아갈 곳.
 * 상태에는 id만 남기 때문에, 데이터의 전환점은 TURNING_BY_ID에서 찾는다.
 */
const OPENED_ELSEWHERE = new Map<string, Turning>();
export const turningOf = (id: string): Turning | undefined => TURNING_BY_ID[id] ?? OPENED_ELSEWHERE.get(id) ?? buildVoyage(id) ?? buildEntryGate(id);

/** 자리표시 {name}(이름만) {town} {island} {parent}를 채우고 조사를 고른다. 성씨는 쓰지 않는다. */
function fillTurning(s: Life5, text: string, t?: Turning): string {
  const discipleId = t?.disciple ? discipleFor(s, t.disciple)?.personId : undefined;
  return fillText(s, text, discipleId);
}

function speakerOf(s: Life5, t: Turning): string {
  if (t.disciple && t.disciple !== 'meeting') {
    const pupil = discipleFor(s, t.disciple);
    return s.people.find(p => p.id === pupil?.personId)?.name ?? '제자';
  }
  const sp = t.speaker;
  if (sp === 'hero') return s.hero.name;
  if ('canon' in sp) return CANON[sp.canon]?.name ?? sp.canon;
  return livingContact(s, sp)?.name ?? ('relation' in sp ? sp.relation : s.hero.name);
}

function knownSpeakerIsDead(s: Life5, t: Turning): boolean {
  const sp = t.speaker;
  if (typeof sp !== 'object' || !('canon' in sp)) return false;
  return s.people.some(p => p.canon === sp.canon && !p.alive) && !s.people.some(p => p.canon === sp.canon && p.alive);
}

function renderDoor(s: Life5, t: Turning, doors: ResolvedDoor[]): Extract<Life5['pending'], { kind: 'door' }> {
  const disciple = t.disciple && discipleFor(s, t.disciple);
  return { kind: 'door', turning: t.id, moment: t.kind === 'moment',
    title: fillTurning(s, t.title, t), body: fillTurning(s, t.body, t), speaker: speakerOf(s, t), doors,
    ...(disciple ? { discipleId: disciple.personId } : {}) };
}

/** 저장된 창의 지난 문구·잠금을 현재 사건 정의로 복원한다. 개봉 횟수나 도입 효과는 재실행하지 않는다. */
export function restoreStoryDoor(s: Life5): void {
  const pending = s.pending;
  if (pending?.kind !== 'door') return;
  // 추첨에서 퇴역한 옛 질문의 age(999)는 새로 열리지 않게 하는 조건이다.
  // 저장 당시 이미 열린 질문은 보존해 남겨 둔 옛 선택 효과로 마무리한다.
  if (pending.turning === 'tmp_crocodile') return;
  const t = turningOf(pending.turning);
  if (!t) return;
  const doors = resolveDoors(s, t);
  const prereqs = t.when.filter(c => !(c.c === 'turningSeen' && c.id === t.id));
  if (!checkAll(s, prereqs) || !needsOk(s, t.needs) || knownSpeakerIsDead(s, t) || !doors.some(d => !d.locked)) {
    s.pending = null;
    // 고르기 전에 무효화된 한 번뿐인 만남은, 실제로 조건이 갖춰지면 다시 열 수 있다.
    if (s.seenCount[t.id] === 1 && !s.tried.some(k => k.startsWith(t.id + '#'))) {
      delete s.seenCount[t.id];
      delete s.seen[t.id];
    }
    return;
  }
  s.pending = renderDoor(s, t, doors);
}

export function refreshEntryDoor(s: Life5): void {
  if (s.pending?.kind === 'door' && s.pending.turning.startsWith(ENTRY_PREFIX)) restoreStoryDoor(s);
}

function doorAccess(s: Life5, d: Door) {
  const price = d.fx.reduce((sum, e) => {
    if (e.op === 'buyWeapon') return sum + (ITEM_BY_ID[e.id]?.price ?? 0);
    return e.op === 'money' && e.trade && e.add < 0 ? sum - e.add : sum;
  }, 0);
  const cost = price > 0 ? tradeCost(s, price) : 0;
  const conditions = price > 0 ? d.when?.map(c => c.c === 'money' && c.min === price ? { ...c, min: cost } : c) : d.when;
  let locked = whyNot(s, conditions) ?? whyNeed(s, d.needs);
  if (!locked && price > 0 && cost > s.hero.money) locked = '거래 비용이 부족하다';
  const start = d.fx.find(e => e.op === 'vowStart');
  if (!locked && start?.op === 'vowStart' && !canBeginVow(s, start.id)) locked = '지금은 이 서약을 걸 수 없다';
  const earned = d.when?.some(c => c.c === 'flag' && c.has);
  if (!locked && d.special && !opensSpecial(s, d.special, earned)) locked = josa(`${VALUE_NAME[d.special]}이(가) 더 자라야 이 문을 떠올린다`);
  return { locked, cost };
}

/** 선택지를 띄울 때에만 실제 사람의 이름을 넣어 문장을 완성한다. */
export function resolveDoors(s: Life5, t: Turning): ResolvedDoor[] {
  return t.doors.map((d, i) => {
    const { locked, cost } = doorAccess(s, d);
    const key = `${t.id}#${i}`;
    return {
      label: fillTurning(s, d.label, t), hint: fillTurning(s, d.hint, t) + (cost > 0 ? ` · 거래 ${cost.toLocaleString('ko-KR')} 베리` : ''), locked,
      special: d.special !== undefined, tried: s.known.includes(key), danger: d.danger ?? false,
    };
  });
}

/**
 * 한 인생에 이 전환점이 열릴 수 있는 횟수. 가중치 0인 전환점(싸움 뒤의 문, 큰 계기)은 저절로 뽑히지 않고
 * 일이 일어날 때만 줄로 오므로, 되풀이되는 것이면 상한이 없다: 싸움에는 언제나 그 뒤가, 잃음에는 언제나 그 계기가 있다.
 */
const capOf = (t: Turning): number =>
  t.max ?? (t.repeat === 'once' ? 1 : t.weight === 0 ? Infinity : V.turning.maxRepeat);

/** 이 인생에서 아직 열릴 수 있는가: 거절해 닫히지 않았고, 열린 횟수가 상한에 닿지 않았다 */
export function stillOpen(s: Life5, t: Turning): boolean {
  return !s.closed.includes(t.id) && (s.seenCount[t.id] ?? 0) < capOf(t);
}

function canAttend(s: Life5, t: Turning): boolean {
  return s.hero.standing !== 'prisoner' || t.kind !== 'door' || t.id.startsWith('prison_');
}

/**
 * 전환점을 띄운다. 닫혔거나 상한에 닿았거나, 글이 전제하는 것(needs)이 없거나, 열린 문이 하나도 없으면
 * false를 돌려주고 아무것도 하지 않는다.
 */
export function openTurning(s: Life5, t: Turning): boolean {
  if (!canAttend(s, t) || knownSpeakerIsDead(s, t)) return false;
  const weaponScene = t.doors.some(d => d.fx.some(e =>
    ['receiveWeapon', 'buyWeapon', 'giveAwayWeapon', 'beginStyle', 'adoptStyle', 'refineStyle'].includes(e.op)));
  if (weaponScene && !checkAll(s, t.when)) return false;
  if (t.disciple && !discipleReady(s, t.disciple)) return false;
  if (!stillOpen(s, t) || !needsOk(s, t.needs)) return false;
  const doors = resolveDoors(s, t);
  if (!doors.some((d) => !d.locked)) return false;
  if (TURNING_BY_ID[t.id] !== t && !t.id.startsWith(ENTRY_PREFIX)) OPENED_ELSEWHERE.set(t.id, t);
  storyOpening(s, t);
  for (const line of t.intro ?? []) logLine(s, fillTurning(s, line), 'light');
  const automatic = t.automatic && !checkAll(s, t.automatic.unless) ? t.automatic.fx : undefined;
  if (!automatic) s.pending = renderDoor(s, t, doors);
  s.seen[t.id] = s.age;
  s.seenCount[t.id] = (s.seenCount[t.id] ?? 0) + 1;
  const trust = EPISODE_NATIVE_TRUST[t.id];
  if (trust && isNative(s, s.hero.island) && !s.flags.includes(trust)) {
    s.flags.push(trust);
    logLine(s, '고향 사정을 아는 사람이라며 마을의 안내자가 먼저 마음을 열었다.', 'light');
  }
  if (automatic) applyFx(s, automatic);
  return true;
}

/** 올해 멈출 목표 횟수 */
function stopsGoal(s: Life5): number {
  if (isQuiet(s)) return V.stopsQuiet;
  return V.stopsPerYear.find((x) => s.age <= x.to)?.n ?? 0;
}

/** 항해·수련·고향 사건을 포함해 이미 고른 만큼 올해의 일반 사건 추첨을 줄인다. */
export function wantsStop(s: Life5, r: Rng): boolean {
  const remaining = stopsGoal(s) - s.stopsThisYear;
  return remaining > 0 && chance(r, remaining / V.partsPerYear);
}

/**
 * 한 번뿐이면 본 적이 없어야, 되풀이되면 마지막으로 본 뒤 그만큼 해가 지나야 한다.
 * 어느 쪽이든 닫히지 않았고 한 인생의 상한(max, 없으면 V.turning.maxRepeat)에 닿지 않아야 한다.
 */
export function repeatAllows(s: Life5, t: Turning): boolean {
  if (!stillOpen(s, t)) return false;
  const last = s.seen[t.id];
  if (last === undefined) return true;
  return t.repeat !== 'once' && s.age - last >= t.repeat.years;
}

/** 조건과 필요한 것이 맞고 열린 문이 하나라도 있다 (반복 · 상한은 보지 않는다) */
function fits(s: Life5, t: Turning): boolean {
  return canAttend(s, t) && checkAll(s, t.when) && !knownSpeakerIsDead(s, t) && needsOk(s, t.needs) && t.doors.some(d => !doorAccess(s, d).locked);
}

/** 섬 장편 에피소드의 전환점 id 머리 (data/episodes) */
export const STORY_PREFIX = 'ep_';

/**
 * 장편의 쉼에만 쓰는 곁 난수. 인생의 난수 줄(s.rng)을 밀지 않아서, 쉼을 넣어도 나머지 인생의 주사위가 그대로다.
 * 기록 번호(s.seq)가 줄마다 오르므로 토막마다 다른 값이 나온다
 */
export function storyRng(s: Life5): Rng {
  return rngOf({ seed: (s.rng.seed ^ 0x5eed5) >>> 0, cursor: s.seq * 4 });
}

/**
 * 섬 장편의 다음 장면이 줄 섰을 때 그 사이에 흐를 시간을 정한다 (data/episodes/pacing.ts의 막 구성).
 *  - 실시간으로 이어지는 장면: 쉬지 않는다
 *  - 같은 막 안: V.story.beat 토막 / 막이 바뀜: V.story.act 토막, 쉼이 시작될 때 막 제목을 기록에 띄운다
 * 쉬는 토막은 year.ts의 storyInterlude가 섬의 하루로 보낸다.
 * 문을 고른 뒤(answerDoor)와 이야기가 이어지는 싸움이 끝난 뒤(fight.ts) 부른다.
 */
export function storyPause(s: Life5): void {
  s.storyRest = 0; s.storyNote = '';
  const next = s.queue.find((id) => id.startsWith(STORY_PREFIX));
  if (!next) return;
  const last = [...s.tried].reverse().find((k) => k.startsWith(STORY_PREFIX))?.split('#')[0];
  const to = STORY_PACE[next];
  if (!last || to?.cont) return;
  const newAct = !to || STORY_PACE[last]?.act !== to.act;
  const [lo, hi] = newAct ? V.story.act : V.story.beat;
  s.storyRest = int(storyRng(s), lo, hi);
  if (newAct && to) s.storyNote = to.act;
}

/** 장편의 첫 장면을 띄울 때 첫 막의 제목을 기록에 남긴다 */
function storyOpening(s: Life5, t: Turning): void {
  const p = STORY_PACE[t.id];
  if (t.id.startsWith(STORY_PREFIX) && t.weight > 0 && p) logLine(s, `── ${p.act} ──`, 'heavy', 'info');
}

/**
 * 줄에서 지금 열 수 있는(조건이 맞고 열린 문이 있는) 첫 전환점을 꺼낸다. 앞의 것이 막혀 있으면 건너뛴다.
 * 닫혔거나 한 인생의 상한에 닿은 전환점은 열지 않고 바로 버린다.
 * count면 열지 못한 것의 횟수를 세고, V.queue.maxTries번 못 열면 버린다. 데이터에 없는 id는 조용히 버린다.
 * 한 토막에 한 번만 세도록 openQueued만 센다(같은 토막의 pickTurning은 세지 않는다).
 */
export function takeQueued(s: Life5, count = true): Turning | null {
  for (let i = 0; i < s.queue.length;) {
    const id = s.queue[i];
    const entry = buildEntryGate(id);
    const t = entry ?? TURNING_BY_ID[id];
    if (entry && !checkAll(s, entry.when)) { s.queue.splice(i, 1); delete s.queueTries[id]; continue; }
    if (t && !stillOpen(s, t)) { s.queue.splice(i, 1); delete s.queueTries[id]; continue; }
    if (t && fits(s, t)) {
      s.queue.splice(i, 1); delete s.queueTries[id];
      return t;
    }
    if (t && !count) { i++; continue; }
    const tries = (s.queueTries[id] ?? 0) + 1;
    if (!t || tries >= V.queue.maxTries) { s.queue.splice(i, 1); delete s.queueTries[id]; continue; }
    s.queueTries[id] = tries;
    i++;
  }
  return null;
}

/** 줄 선 전환점 가운데 열 수 있는 것을 바로 띄운다 (멈춤 주사위도 올해의 상한도 보지 않는다). 띄웠으면 true */
export function openQueued(s: Life5): boolean {
  if (s.pending) return false;
  const t = takeQueued(s);
  return t ? openTurning(s, t) : false;
}

/** 다음에 띄울 전환점. 줄 서 있는 것이 먼저, 다음으로 조건과 반복이 허락하는 문 · 큰 계기 중에서 가중치로. */
export function pickTurning(s: Life5, r: Rng): Turning | null {
  const queued = takeQueued(s, false);
  if (queued) return queued;
  const pool = TURNINGS.filter((t) => t.weight > 0 && (t.kind === 'door' || t.kind === 'moment') && repeatAllows(s, t) && fits(s, t));
  const commerce = environmentOf(s)?.commerce?.events;
  return weighted(r, pool, (t) => commerce && t.doors.some((d) => tradeEffects(d.fx)) ? t.weight * commerce : t.weight);
}

/** 떠 있는 문 가운데 index번째를 고른다. 잠긴 문이나 없는 문이면 아무것도 하지 않는다. */
export function answerDoor(s: Life5, index: number): void {
  const p = s.pending;
  if (p?.kind !== 'door') return;
  const t = turningOf(p.turning);
  const door = t?.doors[index];
  if (t && door?.fx.some(e => e.op === 'buyWeapon')) p.doors = resolveDoors(s, t);
  const chosen = p.doors[index];
  if (!chosen || chosen.locked || !t || !door) return;
  if (t.id.startsWith(ENTRY_PREFIX) && !checkAll(s, door.when)) return;

  s.traitSource = t.id;
  s.traitScene = t.tags ?? [];
  const before = { ...s.values };
  const values = { ...door.values };
  if (values.greed && door.fx.some(fx => fx.op === 'money' && fx.add > 0)) values.greed *= V.value.greedProfit;
  const rose = addValues(s, values, p.moment ? V.value.moment / V.value.door : 1);
  applyPersonalityChoice(s, door.values ?? {});
  if (door.mark) applyFx(s, [{ op: 'mark', id: door.mark }]);   // 강점을 얻으면 그 이름을 기록한다

  if (!t.id.startsWith(VOYAGE_PREFIX) && !t.id.startsWith(ENTRY_PREFIX)) p.doors.forEach((d, i) => {
    if (i !== index && !d.locked) s.unchosen.push({ age: s.age, turning: t.id, title: p.title, door: d.label });
  });
  const key = `${t.id}#${index}`;
  (s.firstChoiceAge ??= {})[key] ??= s.age;
  if (!s.tried.includes(key)) s.tried.push(key);
  if (door.closes && !s.closed.includes(t.id)) s.closed.push(t.id);
  const canon = typeof t.speaker === 'object' && 'canon' in t.speaker ? t.speaker.canon : undefined;
  s.timeline.push({ age: s.age, text: `${p.title}: ${chosen.label}`, ...(canon ? { canon } : {}) });
  // 서약의 제안·결산·각성은 강제로 끼어드는 장면이므로 보통 사건의 멈춤 예산에서 뺀다.
  if (!t.id.startsWith('life_vow_') && !t.id.startsWith('trait_awaken_') && t.id !== 'sky_vow_awakening') {
    s.stats.stops += 1;
    s.stats.stopsAt.push(s.age);
    s.stopsThisYear += 1;
  }

  s.pending = null;                            // 효과가 새 대기(죽음 등)를 만들면 그것이 남는다
  applyFx(s, door.fx, p.discipleId);
  afterLifeStoryChoice(s, t.id);
  if (door.meal) recordTraitEvent(s, 'meal', '', `${t.id}:${s.age}`);
  for (const [value, gain] of Object.entries(door.values ?? {})) if (gain && gain > 0) recordTraitEvent(s, 'value', value, t.id);
  if (t.id.startsWith(STORY_PREFIX) || t.id.startsWith('life_course_')) storyPause(s);   // 생애 코스에서 장편으로 돌아올 때도 막 사이의 쉼을 잇는다
  if (door.values?.[s.vows?.active?.value ?? 'justice']) recordVowChoice(s, t.id, s.vows?.active?.value ?? null);
  const vow = advanceVow(s, t.id);
  if (vow?.reward) applyFx(s, [{ op: 'mastery', branch: vow.reward, add: vow.amount }]);
  // 선택의 실제 결과를 먼저 보여 준 뒤 가치관의 변화를 남긴다.
  for (const id of rose) {
    const crossed = before[id] < V.value.deep && isDeep(s, id);
    logLine(s, crossed ? VALUE_DEEPEN[id] : VALUE_LEAN[id], crossed ? 'heavy' : 'light', 'choice');
  }
}
