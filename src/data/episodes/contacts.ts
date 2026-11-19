import type { Life5 } from '../../core/types';

/** 옛 저장에서 무기 스승과 연결되는 당시의 역할을 복원한다. */
export function repairWeaponMentors(s: Life5): void {
  for (const p of s.people) {
    if (!p.canon && !p.storyName && p.relation === '다이얼 공방의 기록꾼 벨라') {
      Object.assign(p, { name: '벨라', storyName: '벨라', gender: 'f', species: 'skypiean' });
    }
  }

  const training = s.lifeStory?.events.find(e => e.id === 'trained_guard' || e.id === 'trained_duel');
  const bond = s.growth.styleBonds.oneSword;
  if (!training || !bond || bond.since !== training.age || bond.island !== training.island ||
      s.tried.includes('style_meet_oneSword#0') ||
      (s.seenCount.style_meet_oneSword && !s.tried.includes('style_meet_oneSword#1'))) return;
  const teacher = s.people.find(p => p.id === bond.teacherId);
  if (!teacher || teacher.canon || teacher.storyName || teacher.name !== '칼집을 고치는 노검객' ||
      teacher.relation !== '일도류의 인연' || s.people.some(p => p.relation === '부두 사범 엘모')) return;
  teacher.name = '엘모';
  teacher.storyName = teacher.name;
  teacher.relation = '부두 사범 엘모';
  teacher.aliases = [...new Set([...(teacher.aliases ?? []), '일도류의 인연'])];
  training.actorId = teacher.id;
}
