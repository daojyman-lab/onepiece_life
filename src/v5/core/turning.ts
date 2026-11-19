// 전환점과 문: 고를 수 있는 문을 풀고, 띄우고, 고른 답을 적용한다.
import { buildVoyage, VOYAGE_PREFIX } from './voyage';
import { josa } from '../../core/josa';
import { fill } from '../../core/util';
import { chance, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { CANON } from '../data/canon';
import { TURNING_BY_ID, TURNINGS } from '../data/turnings';
import { VALUE_DEEPEN, VALUE_LEAN, VALUE_NAME } from '../data/values';
import { checkAll, whyNot } from './cond';
import { applyFx } from './fx';
import { needsOk, whyNeed } from './needs';
import { logLine } from './state';
import { addValues, isDeep } from './values';
import { applyPersonalityChoice } from './personality';
import { isQuiet } from './year';
import { personIs } from './needs';
import { advanceVow } from './vow';
import type { Life5, ResolvedDoor, Turning } from './types';

/**
 * 데이터에 없는 전환점(시험에서 바로 만든 것 등)을 띄웠을 때 답을 찾아갈 곳.
 * 상태에는 id만 남기 때문에, 데이터의 전환점은 TURNING_BY_ID에서 찾는다.
 */
const OPENED_ELSEWHERE = new Map<string, Turning>();
const turningOf = (id: string): Turning | undefined => TURNING_BY_ID[id] ?? OPENED_ELSEWHERE.get(id) ?? buildVoyage(id);

/** 자리표시 {name}(이름만) {town} {island} {parent}를 채우고 조사를 고른다. 성씨는 쓰지 않는다. */
function fillTurning(s: Life5, text: string): string {
  const friend = s.people.find((p) => p.alive && p.relation === '어릴 적 동무')?.name ?? '동무';
  const childFriend = s.people.find((p) => p.alive && p.relation === '어릴 적 친구')?.name ?? '친구';
  const parentPerson = s.people.find((p) => p.alive && personIs(p, 'parent'));
  const parent = parentPerson?.relation ?? '';
  const parentName = parentPerson?.name ?? parent;
  const sibling = s.people.find((p) => p.alive && personIs(p, 'sibling'))?.name ?? '형제';
  const rival = s.people.find((p) => p.alive && p.relation === '어릴 적 맞수')?.name ?? '맞수';
  const mentor = s.people.find((p) => p.relation === '스승')?.name ?? '스승';
  const swordElder = s.people.find((p) => p.alive && p.relation === '목검을 가르친 형')?.name ?? '형';
  const rivalMemory = s.flags.includes('rivalFarewellSword') ? '어릴 때 나눠 든 목검의 손잡이에 같은 흠집이 남아 있다.'
    : s.flags.includes('rivalFarewellDuel') ? '마지막 겨룸에서 서로 걸어온 길까지 다시 겨루자고 약속했었다.'
    : s.flags.includes('rivalFarewellTalk') ? '헤어지던 날 서로 다른 길로 가기로 했던 말을 기억한다.'
    : s.flags.includes('rivalChoseRescue') ? '축제 결승을 포기하고 아이를 찾던 날 이후 처음이다.'
    : '어릴 적 길목에서 겨루던 날 이후 오랜만이다.';
  const rivalPrepareMemory = s.flags.includes('rivalSearched') ? '잃어버린 깃발을 함께 찾던 때 서로의 달리는 버릇까지 알아챘다.'
    : s.flags.includes('rivalMadeFlag') ? '둘이 주민과 함께 꿰맨 깃발이 경기장에 걸려 있다.'
    : s.flags.includes('rivalMapClue') ? '깃대에서 찾은 낡은 지도의 끝이 아직 품에 있다.'
    : '';
  const rivalFestivalMemory = s.flags.includes('rivalChoseMatch') ? '축제 날 끝낸 승부를 다시 겨뤄 볼지 묻는다.'
    : s.flags.includes('rivalChoseRescue') ? '축제 날 아이를 찾느라 미룬 승부를 지금 끝낼지 묻는다.'
    : '축제 날 주민을 도우느라 미룬 승부를 지금 끝낼지 묻는다.';
  const parentWorkMemory = s.flags.includes('parHelped') ? `${parentName}의 일을 거든 뒤 손에 잡힌 물집이 아직도 기억난다.`
    : s.flags.includes('parDefy') ? `${parentName}처럼 살지 않겠다고 혼자 다짐했던 날을 기억한다.`
    : s.flags.includes('parAsked') ? `${parentName}에게 도구의 쓰임을 하나씩 물었던 날을 기억한다.`
    : `${parentName}의 굳은살 박인 손을 지켜보던 날을 기억한다.`;
  const mentorTrainingMemory = s.flags.includes('menGuarded') ? '지난번에는 다친 아이를 등 뒤에 세우고 길을 지켰다.'
    : s.flags.includes('menOutwitted') ? '지난번에는 어른들의 시선을 읽고 싸움 없이 아이를 데려왔다.'
    : s.flags.includes('menTogether') ? '지난번에는 스승과 어깨를 맞대고 아이를 데려왔다.'
    : '스승이 물었던 힘의 쓰임이 다시 떠오른다.';
  return fill(text, { name: s.hero.name, town: s.hero.town, island: s.hero.island, friend, childFriend, parent, parentName, sibling, rival, mentor, swordElder, rivalMemory, rivalPrepareMemory, rivalFestivalMemory, parentWorkMemory, mentorTrainingMemory });
}

function speakerOf(s: Life5, t: Turning): string {
  const sp = t.speaker;
  if (sp === 'hero') return s.hero.name;
  if ('canon' in sp) return CANON[sp.canon]?.name ?? sp.canon;
  return s.people.find((p) => p.alive && p.relation === sp.relation)?.name ?? sp.relation;
}

/** 지금 이 사람에게 문이 어떻게 보이는지: 잠겼는지, 왜 잠겼는지, 지난 인생들에서 골라 본 적이 있는지 */
export function resolveDoors(s: Life5, t: Turning): ResolvedDoor[] {
  return t.doors.map((d, i) => {
    let locked = whyNot(s, d.when) ?? whyNeed(s, d.needs);
    if (!locked && d.special && !isDeep(s, d.special)) locked = josa(`${VALUE_NAME[d.special]}이(가) 깊은 사람만 이 문을 떠올린다`);
    const key = `${t.id}#${i}`;
    return {
      label: fillTurning(s, d.label), hint: fillTurning(s, d.hint), locked,
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

/**
 * 전환점을 띄운다. 닫혔거나 상한에 닿았거나, 글이 전제하는 것(needs)이 없거나, 열린 문이 하나도 없으면
 * false를 돌려주고 아무것도 하지 않는다.
 */
export function openTurning(s: Life5, t: Turning): boolean {
  if (!stillOpen(s, t) || !needsOk(s, t.needs)) return false;
  const doors = resolveDoors(s, t);
  if (!doors.some((d) => !d.locked)) return false;
  if (TURNING_BY_ID[t.id] !== t) OPENED_ELSEWHERE.set(t.id, t);
  s.pending = {
    kind: 'door', turning: t.id, moment: t.kind === 'moment',
    title: fillTurning(s, t.title), body: fillTurning(s, t.body), speaker: speakerOf(s, t), doors,
  };
  s.seen[t.id] = s.age;
  s.seenCount[t.id] = (s.seenCount[t.id] ?? 0) + 1;
  return true;
}

/** 올해 멈출 목표 횟수 */
function stopsGoal(s: Life5): number {
  if (isQuiet(s)) return V.stopsQuiet;
  return V.stopsPerYear.find((x) => s.age <= x.to)?.n ?? 0;
}

/** 이 토막에 멈출 차례인가. 올해 목표를 한 번 넘게 넘기면 더 멈추지 않는다. */
export function wantsStop(s: Life5, r: Rng): boolean {
  const n = stopsGoal(s);
  if (s.stopsThisYear >= Math.ceil(n) + 1) return false;
  return chance(r, n / V.partsPerYear);
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
  return checkAll(s, t.when) && needsOk(s, t.needs) && resolveDoors(s, t).some((d) => !d.locked);
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
    const t = TURNING_BY_ID[id];
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
  const pool = TURNINGS.filter((t) => (t.kind === 'door' || t.kind === 'moment') && repeatAllows(s, t) && fits(s, t));
  return weighted(r, pool, (t) => t.weight);
}

/** 떠 있는 문 가운데 index번째를 고른다. 잠긴 문이나 없는 문이면 아무것도 하지 않는다. */
export function answerDoor(s: Life5, index: number): void {
  const p = s.pending;
  if (p?.kind !== 'door') return;
  const chosen = p.doors[index];
  const t = turningOf(p.turning);
  const door = t?.doors[index];
  if (!chosen || chosen.locked || !t || !door) return;

  const before = { ...s.values };
  const rose = addValues(s, door.values ?? {}, p.moment ? V.value.moment / V.value.door : 1);
  applyPersonalityChoice(s, door.values ?? {});
  if (door.mark) applyFx(s, [{ op: 'mark', id: door.mark }]);   // 강점을 얻으면 그 이름을 기록한다

  if (!t.id.startsWith(VOYAGE_PREFIX)) p.doors.forEach((d, i) => {   // 항로 고르기의 안 간 섬은 '가지 않은 길'에 넣지 않는다
    if (i !== index && !d.locked) s.unchosen.push({ age: s.age, turning: t.id, title: p.title, door: d.label });
  });
  const key = `${t.id}#${index}`;
  if (!s.tried.includes(key)) s.tried.push(key);
  if (door.closes && !s.closed.includes(t.id)) s.closed.push(t.id);
  const canon = typeof t.speaker === 'object' && 'canon' in t.speaker ? t.speaker.canon : undefined;
  s.timeline.push({ age: s.age, text: `${p.title}: ${chosen.label}`, ...(canon ? { canon } : {}) });
  s.stats.stops += 1;
  s.stats.stopsAt.push(s.age);
  s.stopsThisYear += 1;

  s.pending = null;                            // 효과가 새 대기(죽음 등)를 만들면 그것이 남는다
  applyFx(s, door.fx);
  const vow = advanceVow(s, t.id);
  if (vow?.reward) applyFx(s, [{ op: 'mastery', branch: vow.reward, add: vow.amount }]);
  // 선택의 실제 결과를 먼저 보여 준 뒤 가치관의 변화를 남긴다.
  for (const id of rose) {
    const crossed = before[id] < V.value.deep && isDeep(s, id);
    logLine(s, crossed ? VALUE_DEEPEN[id] : VALUE_LEAN[id], crossed ? 'heavy' : 'light', 'choice');
  }
}
