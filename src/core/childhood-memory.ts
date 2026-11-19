import { CHILDHOOD_INCIDENTS } from '../data/childhood-incidents';
import { livingRelation, personIs } from './needs';
import { rivalPerson } from './rival';
import type { ChildhoodOutcome, Life5 } from './types';

/** 사망이나 훗날의 관계 변화에 앞서 그날 함께 있던 사람을 기록한다. */
export function rememberChildhood(s: Life5, storyId: string, outcome: ChildhoodOutcome): void {
  const p = outcome === 'rival' ? livingRelation(s, '어릴 적 맞수')
    : outcome === 'mentor' ? livingRelation(s, '스승')
    : s.people.find(p => p.alive && personIs(p, 'parent'));
  if (p) s.childhoodMemory = { storyId, outcome, town: s.hero.town, personId: p.id, personName: p.name, relation: p.relation };
}

function legacyPerson(s: Life5, title: string | undefined): string {
  if (s.flags.includes('homeCrisis:loss')) {
    const entry = title && s.timeline.find(row => row.text.includes(title) && row.text.endsWith('를 잃었다'));
    const relation = entry && /때 (아버지|어머니)를 잃었다$/.exec(entry.text)?.[1];
    if (!relation) return '부모님';
    const family = s.people.filter(p => p.relation === relation && !p.alive && !p.missing);
    return family.length === 1 ? relation + ' ' + family[0].name : relation;
  }
  if (s.flags.includes('homeCrisis:mentor')) {
    const mentors = s.people.filter(p => p.relation === '스승');
    const recorded = mentors.find(p => s.timeline.some(row =>
      title && row.text.includes(title) && row.text.includes('다친 스승 ' + p.name)));
    return recorded?.name ?? (mentors.length === 1 ? mentors[0].name : '선생님');
  }
  return rivalPerson(s)?.name ?? '어릴 적 맞수';
}

export function childhoodWords(s: Life5): Record<string, string> {
  const memory = s.childhoodMemory;
  const storyId = memory?.storyId ?? Object.keys(s.seen).find(id => id.startsWith('child_crisis_') && !id.endsWith('_help'))?.slice('child_crisis_'.length);
  const story = storyId ? CHILDHOOD_INCIDENTS[storyId] : undefined;
  const parent = memory?.outcome === 'loss' || memory?.outcome === 'parentSafe';
  return {
    crisisTitle: story?.title ?? '고향 사람들이 함께한 날',
    crisisTown: memory?.town ?? s.hero.town,
    crisisLandmark: story?.landmark ?? '마을 풍경',
    crisisPerson: memory ? (parent ? memory.relation + ' ' + memory.personName : memory.personName) : legacyPerson(s, story?.title),
    crisisCare: s.tried.includes('child_mentor_recovery#0')
      ? '약봉지를 받아 온 날과 빈 봉투를 돌려준 날이 제 글씨로 나란히 적혀 있다.'
      : s.tried.includes('child_mentor_recovery#1')
        ? '밥상을 번갈아 나른 이웃들의 이름이 제각각 다른 글씨로 남아 있다.'
        : '첫 장에 그날 도와준 이웃들의 이름이 적혀 있다.',
  };
}
