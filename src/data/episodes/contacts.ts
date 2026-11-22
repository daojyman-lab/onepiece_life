import type { Life5, Person } from '../../core/types';

// 옛 장편은 명시한 인물을 무작위 이름으로 저장하기도 했다. 이름만 같은 행인은 고치지 않는다.
type Identity = Pick<Person, 'name' | 'gender' | 'species'>;
const roles = new Map<string, Identity>();
function authored(name: string, gender: Person['gender'], species: Person['species'], ...relations: string[]) {
  for (const relation of relations) roles.set(relation, { name, gender, species });
}
authored('페니', 'f', 'human', '부두의 기록꾼 페니', '처형대 장부를 쓰는 페니', '장부를 함께 맞춰 본 페니',
  '날씨 기록을 함께 뒤진 페니', '항만 장부를 함께 맞춰 본 페니', '옛 장부를 알아본 페니', '옛 지부의 장부를 맞춰 준 기록계 페니');
authored('리코', 'm', 'human', '먹물회의 막내 심부름꾼 리코', '부두 심부름꾼 리코', '그 시절 지도를 그려 준 리코',
  '술집 주인이 된 리코', '등불을 알아본 술집 주인 리코', '로그타운에서 따라나선 꼬마 리코',
  '로그타운 부두에서 따라나선 리코', '처형대 아래 한 잔의 주인 리코');
authored('나디르', 'm', 'human', '낙타몰이 나디르', '알라바스타에서 따라나선 낙타몰이 나디르');
authored('카심', 'm', 'human', '비 내린 알라바스타에서 따라나선 짐꾼 카심');
authored('하리스', 'm', 'human', '알라바스타에서 따라나선 우물 일꾼 하리스');
authored('파코', 'm', 'human', '드레스로자에서 따라온 꽃장수 소년');
authored('루시아', 'f', 'human', '드레스로자의 이름 되찾기 서기');
authored('마렐', 'm', 'human', '드레스로자 상선의 조타수');
authored('페론', 'm', 'fishman', '어인섬에서 함께 떠난 문어 어인 짐꾼');
authored('토르', 'm', 'fishman', '어인섬에서 함께 떠난 거북 어인 우편배달부');
authored('바스', 'm', 'fishman', '어인섬에서 함께 떠난 가오리 어인 도선사');
authored('티카', 'f', 'skypiean', '구름 해안의 배달꾼 티카', '웨이버를 모는 티카');
authored('벨라', 'f', 'skypiean', '다이얼 공방의 기록꾼 벨라');
authored('파로', 'm', 'skypiean', '웨이버 배달꾼 파로', '구름 아래를 보러 따라나선 파로');
authored('미나', 'f', 'skypiean', '엔젤섬 진료소의 미나');
authored('카르마', 'm', 'skypiean', '샨디아의 젊은 전사 카르마', '청해를 보러 따라나선 샨디아 전사 카르마');
authored('루미', 'f', 'skypiean', '스카이피아의 기록 조사자 루미');
authored('타케조', 'm', 'human', '쿠리에서 함께 폭포를 내려온 숯장이 타케조');
authored('소스케', 'm', 'human', '와노에서 함께 폭포를 내려온 대장장이 소스케');
authored('키스케', 'm', 'human', '쿠리에서 함께 폭포를 내려온 농부 키스케');

export function repairEpisodeContacts(s: Life5): void {
  for (const p of s.people) {
    if (p.canon || p.storyName) continue;
    const identity = roles.get(p.relation);
    if (identity) Object.assign(p, identity, { storyName: identity.name });
  }

  // 린에게 검술을 가르친 옛 선택이 훗날 다른 꿈까지 넘긴 것으로 기록된 저장만 복구한다.
  if (s.tried.includes('life_course_legacy#0') && !s.tried.includes('dream_last#1') &&
      s.dream?.id !== 'bestSword' && s.flags.includes('dreamPassed')) {
    s.flags = s.flags.filter(id => id !== 'dreamPassed');
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
