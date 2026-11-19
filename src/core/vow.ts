// 서약의 선언, 생애에 걸친 실천, 결산과 각성을 한곳에서 판정한다.
import { opensSpecial } from './values';
import { V } from '../data/balance';
import { LIFE_VOW_ACTIVITY_NEEDS, LIFE_VOW_AGES, LIFE_VOW_CHOICE_NEEDS, LIFE_VOW_HP_COST, LIFE_VOW_STAT_GAIN, LIFE_VOW_STORIES } from '../data/vow-life';
import { VOWS } from '../data/vows';
import { BRANCH_NAME } from '../data/words';
import { rating5 } from './power';
import { focusedStyle, isMartialBranch } from './styles';
import { logLine } from './state';
import { livingContact } from './needs';
import type { Activity, Branch, Life5, ValueId, VowState } from './types';

const state = (s: Life5): VowState => s.vows ?? (s.vows = { active: null, history: [] });
const STAT_NAME = { str: '근력', spd: '속도', vit: '체력', int: '지능', wil: '의지', luk: '운' } as const;
const branchOf = (s: Life5): Branch => {
  if (s.growth.path) return s.growth.path;
  const branches: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun'];
  return branches.reduce((best, branch) => s.growth.pref[branch] > s.growth.pref[best] ? branch : best, 'fist');
};
const kept = (s: Life5) => state(s).history.filter((entry) => entry.result === 'kept');
const ended = (s: Life5) => !!state(s).declined || state(s).history.some((entry) => entry.result === 'failed');
const nextLevel = (s: Life5): 1 | 2 | 3 | null => {
  const n = kept(s).length + 1;
  return n <= 3 ? n as 1 | 2 | 3 : null;
};
const targetOf = (s: Life5, value: ValueId, level: 1 | 2 | 3): { name: string; id?: string } => {
  if (value === 'loyalty' && level === 1 || value === 'ambition' && level === 1) {
    const contact = livingContact(s, { who: 'sibling' }) ?? livingContact(s, { relation: '어릴 적 동무' });
    return contact ? { name: contact.name, id: contact.id } : { name: '자신' };
  }
  if (value === 'loyalty' && level === 3) {
    const child = s.people.find((person) => person.alive && ['자식', '아들', '딸'].includes(person.relation));
    if (child) return { name: child.name, id: child.id };
    const pupil = s.people.find(p => p.alive && s.disciples?.some(d => d.personId === p.id));
    return pupil ? { name: pupil.name, id: pupil.id } : { name: '자신' };
  }
  if (value === 'inquiry' && level === 1) {
    const name = s.growth.master?.name;
    const teacher = name && s.people.find(p => p.alive && p.kind === 'master' && p.name === name);
    return teacher ? { name: teacher.name, id: teacher.id } : { name: name ?? '자신' };
  }
  return { name: value === 'freedom' ? '자신' : '곁의 사람들' };
};

/** 한 인생에 첫 제안, 성공에 따른 다음 제안, 마지막 결산 장면을 고른다. */
export function nextLifeVowTurning(s: Life5): string | null {
  if (!s.hero.alive) return null;
  const active = state(s).active;
  if (active) return active.level && s.age >= active.since + 2
    ? `life_vow_settle_${active.level}_${active.value}` : null;
  if (ended(s)) return null;
  const level = nextLevel(s);
  if (!level || s.age < LIFE_VOW_AGES[level - 1]) return null;
  const previous = kept(s).at(-1);
  const value = previous ? VOWS[previous.id]?.value : (Object.keys(s.values) as ValueId[])
    .reduce((best, id) => s.values[id] > s.values[best] ? id : best, 'justice');
  return value ? `life_vow_offer_${level}_${value}` : null;
}

/** 화면의 잠금과 실제 효과가 같은 자격을 사용한다. */
export function canBeginVow(s: Life5, id: string): boolean {
  const d = VOWS[id];
  const vows = state(s);
  if (!d || vows.active || vows.history.some((entry) => entry.id === id)) return false;
  if (d.level) {
    if (ended(s)) return false;
    const level = nextLevel(s);
    const previous = kept(s).at(-1);
    return level === d.level && s.age >= LIFE_VOW_AGES[level - 1]
      && (!previous || VOWS[previous.id]?.value === d.value);
  }
  // 섬 서약은 첫 서약의 자리를 대신한다 (지키면 인생 서약 사다리의 첫 칸이 된다). 아직 건 서약이 없어야 하지만,
  // 10살의 인생 서약 제안을 거절한 것만으로는 막지 않는다 (그 제안과 12~17살의 하늘섬 장편이 늘 겹쳤다).
  // 앞선 선택의 표시(requires)로 잠긴 특별한 문에서 걸리므로 그 문과 같은 문턱을 쓴다 (깊음 55는 12~17살에 닿지 않았다)
  return !vows.history.length && opensSpecial(s, d.value, true)
    && d.requires.every((flag) => s.flags.includes(flag))
    && d.forbids.every((flag) => !s.flags.includes(flag));
}

export function beginVow(s: Life5, id: string): boolean {
  if (!canBeginVow(s, id)) return false;
  const d = VOWS[id];
  const guide = id === 'sky_tika_guard' ? livingContact(s, { relation: '구름 해안의 배달꾼 티카' }) : undefined;
  const target = d.level ? targetOf(s, d.value, d.level) : { name: guide?.name ?? d.target, id: guide?.id };
  const level = d.level ?? 1;
  const vows = state(s);
  const branch = vows.branch ?? branchOf(s);
  vows.branch ??= branch;
  const active: NonNullable<VowState['active']> = {
    id, value: d.value, title: d.title, target: target.name, since: s.age, island: s.hero.island, progress: [],
    branch, ...(d.level ? { level: d.level, activities: [], choices: [] } : {}),
    ...(target.id ? { targetPersonId: target.id } : {}),
  };
  vows.active = active;
  if (d.level) s.hero.hp = Math.max(0, s.hero.hp - LIFE_VOW_HP_COST[level - 1]);
  logLine(s, `서약했다. ${d.title}. ${target.name}에게 건 약속이다.`, 'heavy', 'choice');
  return true;
}

/** 제안을 거절하면 이 인생에서는 다음 단계가 열리지 않는다. */
export function declineVow(s: Life5): void {
  if (state(s).active) return;
  state(s).declined = true;
  logLine(s, '이번 인생에서 서약은 여기서 멈췄다.', 'heavy', 'life');
}

function updateProgress(s: Life5): void {
  const active = state(s).active;
  if (!active?.level) return;
  const n = active.level - 1;
  active.progress = [
    `생활 속 실천 ${active.activities?.length ?? 0}/${LIFE_VOW_ACTIVITY_NEEDS[n]}`,
    `신념에 따른 선택 ${active.choices?.length ?? 0}/${LIFE_VOW_CHOICE_NEEDS[n]}`,
  ];
}

/** 반복한 같은 활동은 하나의 증거로만 센다. */
export function recordVowActivity(s: Life5, activity: Activity): void {
  const active = state(s).active;
  if (!active?.level || !LIFE_VOW_STORIES[active.value].activities.includes(activity)) return;
  const list = active.activities ?? (active.activities = []);
  if (!list.includes(activity)) list.push(activity);
  updateProgress(s);
}

/** 같은 전환점의 선택을 반복해도 한 번만 센다. */
export function recordVowChoice(s: Life5, turningId: string, value: ValueId | null): void {
  const active = state(s).active;
  if (!active?.level || value !== active.value || turningId.startsWith('life_vow_')) return;
  const list = active.choices ?? (active.choices = []);
  if (!list.includes(turningId)) list.push(turningId);
  updateProgress(s);
}

/** 결말까지 본 뒤 한 번만 결산. 실제 실천과 대상의 생존이 맞아야 각성한다. */
export function resolveVow(s: Life5, id: string, forcedFail = false): { reward: Branch | null; amount: number } | null {
  const vows = state(s);
  const d = VOWS[id];
  const active = vows.active;
  if (!d || !active || active.id !== id) return null;
  const n = (active.level ?? 1) - 1;
  const personAlive = !active.targetPersonId || s.people.some((person) => person.id === active.targetPersonId && person.alive);
  const lifeReady = !active.level || (s.age > active.since
    && (active.activities?.length ?? 0) >= LIFE_VOW_ACTIVITY_NEEDS[n]
    && (active.choices?.length ?? 0) >= LIFE_VOW_CHOICE_NEEDS[n]);
  const keptPromise = !forcedFail && s.hero.alive && personAlive && lifeReady
    && d.steps.every((step) => s.flags.includes(step.flag))
    && d.forbids.every((flag) => !s.flags.includes(flag));
  const powerBefore = keptPromise ? Math.round(rating5(s)) : 0;
  vows.active = null;
  vows.history.push({ id, result: keptPromise ? 'kept' : 'failed' });
  if (!keptPromise) {
    logLine(s, `${active.target}에게 건 약속을 끝내 지키지 못했다.`, 'heavy', 'life');
    return { reward: null, amount: 0 };
  }
  const branch = active.branch ?? branchOf(s);
  const before = s.growth.tier[branch];
  const after = Math.min(V.growth.maxTier, before + 1);
  s.growth.tier[branch] = after;
  if (isMartialBranch(branch)) {
    const style = focusedStyle(s, branch);
    s.growth.styleMastery[style] = Math.max(s.growth.styleMastery[style] ?? 0, after * V.growth.tierUp);
  }
  if (before === V.growth.maxTier) s.growth.mastery[branch] = V.growth.tierUp;
  const stat = LIFE_VOW_STORIES[d.value].stat;
  const gain = LIFE_VOW_STAT_GAIN[n];
  s.hero.base[stat] += gain;
  s.timeline.push({ age: s.age, text: `${active.target}에게 건 ${active.level ?? 1}단계 서약을 지켰다` });
  logLine(s, `서약 각성. ${d.title}. ${BRANCH_NAME[branch]} ${before}→${after}단계 · ${STAT_NAME[stat]} +${gain} · 전투력 ${powerBefore} → ${Math.round(rating5(s))}.`, 'heavy', 'growth');
  s.queue.push(id === 'sky_tika_guard' ? 'sky_vow_awakening' : `life_vow_awakening_${active.level}_${d.value}`);
  return { reward: null, amount: 0 };
}

/** 문을 고른 뒤 기존 장편 서약의 표시를 반영하고 마지막 문에서 결산한다. */
export function advanceVow(s: Life5, turningId: string): { reward: Branch | null; amount: number } | null {
  const active = s.vows?.active;
  if (!active) return null;
  const d = VOWS[active.id];
  if (!d) return null;
  for (const step of d.steps) {
    if (s.flags.includes(step.flag) && !active.progress.includes(step.name)) active.progress.push(step.name);
  }
  if (d.forbids.some((flag) => s.flags.includes(flag)) || (!active.level && turningId === d.closingTurning)) {
    return resolveVow(s, d.id);
  }
  return null;
}

/** 떠남/시간 경과로 약속이 무기한 남지 않게 한다. 생애 서약은 여행을 허용한다. */
export function expireVow(s: Life5): void {
  const active = s.vows?.active;
  if (active && (active.level ? s.age > active.since + 3 : s.hero.island !== active.island || s.age > active.since)) {
    resolveVow(s, active.id, true);
  }
}
