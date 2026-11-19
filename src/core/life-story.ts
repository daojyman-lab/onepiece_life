// 첫 약속부터 말년까지 이어지는 사실 기록. 짧은 후속 큐와 실제 시간이 필요한 재회를 구분한다.
import { canUse } from './body';
import type { Life5 } from './types';

export const LIFE_CONTACT = '부두의 기록꾼 페니';
export function storyState(s: Life5): NonNullable<Life5['lifeStory']> {
  return s.lifeStory ??= { elapsed: 0, events: [], wait: null };
}
export function hasLifeEvent(s: Life5, id: string): boolean {
  return s.lifeStory?.events.some((e) => e.id === id) ?? false;
}
export function recordLifeEvent(s: Life5, id: string, actor?: string): void {
  const story = storyState(s);
  if (hasLifeEvent(s, id)) return;
  const helper = id === 'escort' && !(hasLifeEvent(s, 'trained_guard') && swordReady(s) && s.growth.tier.sword >= 1) ? support(s) : undefined;
  const person = helper || (actor && s.people.find((p) => p.relation === actor));
  story.events.push({ id, age: s.age, part: s.part, island: s.hero.island, elapsed: story.elapsed,
    ...(person ? { actorId: person.id } : {}), ...(id === 'escort' ? { method: helper ? 'support' : 'guard' } as const : {}) });
  if (!s.flags.includes(`life:${id}`)) s.flags.push(`life:${id}`);
}
export function advanceLifeTime(s: Life5): void {
  if (s.lifeStory && s.hero.alive) s.lifeStory.elapsed += 1;
}
export function waitForLifeEvidence(s: Life5, then: string, otherwise: string): void {
  const story = storyState(s);
  story.wait = { readyAt: story.elapsed + 1, expiresAt: story.elapsed + 3, island: s.hero.island, then, otherwise };
}

const trained = (s: Life5) => hasLifeEvent(s, 'trained_guard') || hasLifeEvent(s, 'trained_duel');
const free = (s: Life5) => s.hero.standing !== 'prisoner';
const injuredArms = (s: Life5) => s.hero.injuries.some((w) => w.severity === 'heavy' && (!w.part || ['armL', 'armR', 'torso', 'head'].includes(w.part)));
const swordReady = (s: Life5) => canUse(s, 'sword') && !injuredArms(s) && s.hero.hp >= 40;
const support = (s: Life5) => s.people.find((p) => p.alive && p.kind === 'crew' && p.crew &&
  ['support', 'vanguard'].includes(p.crew.role) && p.crew.injuredMonths <= 0 && !p.crew.separatedMonths);

/** null이면 준비 완료. 잠긴 문과 인물 칸에 같은 이유를 보여 준다. */
export function lifePreparation(s: Life5, mode: 'guard' | 'duel'): string | null {
  if (mode === 'guard' && support(s)) return null;
  if (!hasLifeEvent(s, `trained_${mode}`)) return mode === 'guard' ? '호위 검술을 배우거나 함께 막아 줄 지원 인력이 필요하다' : '틈을 읽는 결투 수련이 필요하다';
  if (!swordReady(s)) return '검을 쓸 수 있는 팔과 회복된 몸이 필요하다';
  if (s.growth.tier.sword < (mode === 'duel' ? 2 : 1)) return mode === 'duel' ? '검술 두 번째 경지를 먼저 익혀야 한다' : '검술 입문이 필요하다';
  return null;
}

/** 창과 즉시 후속을 소비한 뒤에만 호출한다. 재회를 큐 재시도 횟수로 버리지 않는다. */
export function lifeStoryScene(s: Life5): string | null {
  if (!s.hero.alive || s.ended || s.pending) return null;
  const story = s.lifeStory;
  const wait = story?.wait;
  if (wait) {
    if (!free(s) || s.hero.island !== wait.island || story!.elapsed > wait.expiresAt) {
      story!.wait = null;
      return wait.otherwise;
    }
    if (story!.elapsed >= wait.readyAt) {
      story!.wait = null;
      return s.flags.includes('ep_alabasta_p_ledger') || s.flags.includes('ep_alabasta_p_inside') ? wait.then : wait.otherwise;
    }
    return null;
  }
  if (!free(s) || s.queue.length) return null;
  if (s.hero.home === 'loguetown' && s.hero.town === '로그타운' && s.hero.island === '로그타운' &&
      s.age >= 8 && s.age <= 9 && !hasLifeEvent(s, 'promise_guard') && !hasLifeEvent(s, 'promise_duel') && !hasLifeEvent(s, 'declined')) return 'life_course_promise';
  if ((hasLifeEvent(s, 'promise_guard') || hasLifeEvent(s, 'promise_duel')) && !trained(s) && !hasLifeEvent(s, 'training_declined') &&
      s.age >= 10 && s.age <= 15 && s.hero.island === '로그타운') return 'life_course_training';
  if (trained(s) && !hasLifeEvent(s, 'departed') && !hasLifeEvent(s, 'stayed') && s.age === 16 &&
      !s.seenCount.ep_alabasta_p1 && !s.flags.includes('ep_alabasta_pre_done') &&
      s.hero.island === '로그타운' && ['civil', 'child', 'marine', 'cp', 'bountyHunter'].includes(s.hero.standing)) return 'life_course_departure';
  const end = story?.events.find((e) => e.id === 'alabasta_done');
  if (end && story!.elapsed - end.elapsed >= 8 && !hasLifeEvent(s, 'reunion')) return 'life_course_reunion';
  if (hasLifeEvent(s, 'reunion') && !hasLifeEvent(s, 'recognized') && !hasLifeEvent(s, 'recognition_declined') && s.age >= 25 && s.age < 49 &&
      ['escort', 'evidence', 'duel_won'].some((id) => hasLifeEvent(s, id))) return 'life_course_recognition';
  if (trained(s) && s.age >= 41 && !hasLifeEvent(s, 'legacy')) return 'life_course_legacy';
  return null;
}

/** 기존 장편의 선택 뒤에만 연결점을 바꾼다. 코스 밖의 인생은 원래 데이터 그대로 따른다. */
export function afterLifeStoryChoice(s: Life5, turning: string): void {
  if (!trained(s)) return;
  if (turning === 'ep_alabasta_p7' && !hasLifeEvent(s, 'alabasta_prepared')) {
    recordLifeEvent(s, 'alabasta_prepared', LIFE_CONTACT);
    s.queue = s.queue.map((id) => id === 'ep_alabasta_p8' ? 'life_course_prepare' : id);
  }
  if (turning === 'ep_alabasta_p11' || turning === 'life_course_missed') recordLifeEvent(s, 'alabasta_done', LIFE_CONTACT);
}

export function lifeGuardMethod(s: Life5): string {
  const escort = s.lifeStory?.events.find((e) => e.id === 'escort');
  const p = s.people.find((person) => person.id === escort?.actorId);
  return escort?.method === 'support' ? `지원병 ${p?.name ?? '일행'}에게 앞을 맡겨` : '호위 수련에서 배운 물러서는 검으로';
}

export function lifeOutcome(s: Life5): string {
  return hasLifeEvent(s, 'escort') ? `${lifeGuardMethod(s)} 물 수레와 사람을 지킨 일`
    : hasLifeEvent(s, 'evidence_copy') ? '물 장부와 증언의 사본을 마을에 남긴 일'
    : hasLifeEvent(s, 'evidence') ? '기다려 확보한 장부와 증언으로 우물을 되찾은 일'
    : hasLifeEvent(s, 'duel_won') ? '틈을 읽는 검으로 하잠과의 결투를 이겨 낸 일'
    : hasLifeEvent(s, 'duel_lost') ? '하잠에게 패배한 뒤 물 수레를 놓친 일'
    : hasLifeEvent(s, 'withdrew') || hasLifeEvent(s, 'missed') ? '지키지 못한 물 수레와 남겨 둔 사람들' : '그 결심 때문에 처음 검을 배운 날';
}

export function lifeStoryAnswer(s: Life5): string | null {
  if (!trained(s)) return null;
  const promise = hasLifeEvent(s, 'promise_guard') ? '로그타운 부두에서 사람을 지키겠다고 한 약속' : '로그타운의 가짜 지도 앞에서 내 눈으로 길을 확인하겠다고 한 결심';
  const legacy = hasLifeEvent(s, 'legacy') ? ' 그때 배운 것을 다음 사람에게 남겼다.' : '';
  return `나에게 원피스란, ${promise}, 그리고 ${lifeOutcome(s)}이었다.${legacy}`;
}

export function lifeProgress(s: Life5): string[] {
  if (!trained(s)) return [];
  const mode = hasLifeEvent(s, 'trained_guard') ? 'guard' : 'duel';
  const reason = lifePreparation(s, mode);
  const next = s.lifeStory?.wait ? '장부 조사 중 · 한 철 뒤 증인을 만난다'
    : hasLifeEvent(s, 'alabasta_done') ? hasLifeEvent(s, 'reunion') ? '옛 선택을 기록하고 다음 세대에 전할 수 있다' : '시간이 흐르면 알라바스타에서 소식이 온다'
    : hasLifeEvent(s, 'departed') ? '나디르의 물 수레를 돕고 장부를 확보한다'
    : hasLifeEvent(s, 'stayed') ? '고향에 남기로 했다 · 배운 검술을 다음 사람에게 전할 수 있다'
    : s.age > 16 ? '첫 소개장의 시기는 지났다 · 배운 검술과 기록은 남아 있다' : '열여섯 살에 로그타운 부두의 소개장으로 첫 항로를 고른다';
  return [`${mode === 'guard' ? '호위 검술' : '틈을 읽는 결투 검술'} · 검술 ${s.growth.tier.sword}단계`, reason ?? '배운 기술을 써 볼 준비가 되었다', next];
}
