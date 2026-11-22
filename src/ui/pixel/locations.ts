const LANDSCAPES = {
  windmill: ['후샤 마을'],
  square: ['로그타운', '마피아 항구', '북쪽 상업 도시', '자야', '드레스로자'],
  hills: ['시럽 마을', '바테리라', '소르베 왕국', '루브니르 왕국'],
  orchard: ['코코야시 마을', '코노미 제도'],
  dojo: ['시모츠키 마을', '쿠리', '에비스 마을'],
  market: ['오렌지 마을', '위스키 피크', '홀케이크 아일랜드'],
  fortress: ['셸스 타운', '에니에스 로비', '일리시아 왕국'],
  ruins: ['고아 왕국 그레이 터미널', '오하라 옛터', '플레반스 옛터', '스파이더 마일즈'],
  canal: ['워터 세븐', '워터 세븐 뒷골목', '시프트 역'],
  desert: ['알라바스타 왕국'],
  winter: ['드럼 왕국'],
  sky: ['스카이피아', '엔젤섬', '샨디아 마을'],
  underwater: ['어인섬', '어인가', '류구 왕국', '바다의 숲'],
  castle: ['와노쿠니', '하나노미야코'],
  forest: ['리틀 가든', '샤본디 제도', '아마존 릴리', '조', '조우', '모코모 공국', '쿠라우 도시', '고래숲', '엘바프', '거인 정착지'],
  mist: ['스릴러 바크', '라프텔 근해'],
  rift: ['펑크 해저드'],
  lab: ['에그헤드'],
  coast: ['해상 레스토랑 발라티에', '서쪽 등대섬', '남쪽 산호초 항구', '리버스 마운틴'],
} as const;

export type Landscape = keyof typeof LANDSCAPES | 'harbor';
export interface SceneLocation { name: string; landscape: Landscape }

const byName = new Map<string, Landscape>();
for (const landscape of Object.keys(LANDSCAPES) as (keyof typeof LANDSCAPES)[]) {
  for (const island of LANDSCAPES[landscape]) byName.set(island, landscape);
}

export function sceneLocation(name: string): SceneLocation {
  return { name: typeof name === 'string' ? name : '', landscape: byName.get(name) ?? 'harbor' };
}
