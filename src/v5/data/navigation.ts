// 원작 여정의 연결을 바탕으로 구성한 게임 항로. 실제 거리·방위를 뜻하지 않는다.
import { SEAS } from '../../data/seas';
import type { SeaId } from '../core/types';

export const ISLAND_ALIASES: Record<string, string> = {
  '조': '조우', '쿠라우 도시': '조우', '고래숲': '조우',
  '고아 왕국 그레이 터미널': '후샤 마을', '코코야시 마을': '코노미 제도',
  '워터 세븐 뒷골목': '워터 세븐', '시프트 역': '워터 세븐',
  '하나노미야코': '와노쿠니', '쿠리': '와노쿠니', '에비스 마을': '와노쿠니',
  '어인가': '어인섬', '류구 왕국': '어인섬', '바다의 숲': '어인섬',
  '엔젤섬': '스카이피아', '샨디아 마을': '스카이피아',
};
export const portOf = (place: string): string => ISLAND_ALIASES[place] ?? place;

export const CONTENT_CLASS = {
  major: ['로그타운', '알라바스타 왕국', '스카이피아', '어인섬', '드레스로자', '와노쿠니'],
  regular: ['위스키 피크', '리틀 가든', '드럼 왕국', '워터 세븐', '에니에스 로비', '스릴러 바크', '펑크 해저드', '홀케이크 아일랜드', '에그헤드'],
  encounter: ['쌍둥이 곶', '해상 레스토랑 발라티에', '자야', '샤본디 제도', '아마존 릴리', '조우'],
} as const;

// 측정·답사 보조 장소는 위의 21개 이야기 거점과 별도로 분류한다.
export function contentClass(place: string): 'major' | 'regular' | 'encounter' | 'exploration' {
  const port = portOf(place);
  for (const key of ['major', 'regular', 'encounter'] as const) {
    if ((CONTENT_CLASS[key] as readonly string[]).includes(port)) return key;
  }
  return 'exploration';
}

export const ROUTE_TREE: Record<string, string[]> = {
  '후샤 마을': ['셸스 타운', '시럽 마을', '해상 레스토랑 발라티에'],
  '셸스 타운': ['오렌지 마을', '시모츠키 마을'],
  '시모츠키 마을': ['오렌지 마을', '시럽 마을'],
  '오렌지 마을': ['진귀한 동물의 섬', '시럽 마을'],
  '진귀한 동물의 섬': ['시럽 마을', '오렌지 마을'],
  '시럽 마을': ['해상 레스토랑 발라티에', '로그타운'],
  '해상 레스토랑 발라티에': ['코노미 제도', '로그타운'],
  '코노미 제도': ['로그타운', '해상 레스토랑 발라티에'],
  '로그타운': ['리버스 마운틴', '코노미 제도'],
  '오하라 옛터': ['마피아 항구', '서쪽 등대섬'],
  '마피아 항구': ['일리시아 왕국', '서쪽 등대섬'],
  '일리시아 왕국': ['서쪽 등대섬', '오하라 옛터'],
  '서쪽 등대섬': ['리버스 마운틴', '일리시아 왕국'],
  '루브니르 왕국': ['플레반스 옛터', '북쪽 상업 도시'],
  '플레반스 옛터': ['스파이더 마일즈', '북쪽 상업 도시'],
  '스파이더 마일즈': ['북쪽 상업 도시', '루브니르 왕국'],
  '북쪽 상업 도시': ['리버스 마운틴', '루브니르 왕국'],
  '바테리라': ['거인 정착지', '남쪽 산호초 항구'],
  '거인 정착지': ['소르베 왕국', '남쪽 산호초 항구'],
  '소르베 왕국': ['남쪽 산호초 항구', '바테리라'],
  '남쪽 산호초 항구': ['리버스 마운틴', '소르베 왕국'],
  '리버스 마운틴': ['쌍둥이 곶'],
  '쌍둥이 곶': ['위스키 피크', '리틀 가든'],
  '위스키 피크': ['리틀 가든', '드럼 왕국'],
  '리틀 가든': ['드럼 왕국', '알라바스타 왕국'],
  '드럼 왕국': ['알라바스타 왕국'],
  '알라바스타 왕국': ['자야', '워터 세븐'],
  '자야': ['스카이피아', '롱 링 롱 랜드', '워터 세븐'],
  '스카이피아': ['자야', '롱 링 롱 랜드', '워터 세븐'],
  '롱 링 롱 랜드': ['워터 세븐'],
  '워터 세븐': ['에니에스 로비', '스릴러 바크'],
  '에니에스 로비': ['워터 세븐'],
  '스릴러 바크': ['샤본디 제도'],
  '플로리안 트라이앵글': ['샤본디 제도'],
  '샤본디 제도': ['어인섬'],
  '어인섬': ['펑크 해저드', '드레스로자'],
  '아마존 릴리': ['샤본디 제도'],
  '펑크 해저드': ['드레스로자'],
  '드레스로자': ['조우'],
  '조우': ['홀케이크 아일랜드', '와노쿠니'],
  '홀케이크 아일랜드': ['와노쿠니', '조우'],
  '와노쿠니': ['에그헤드', '엘바프'],
  '에그헤드': ['엘바프'],
  '엘바프': ['라프텔 근해', '에그헤드'],
  '라프텔 근해': ['엘바프'],
};

export const seaOfPort = (place: string): SeaId | undefined =>
  SEAS.find((sea) => sea.ports.includes(portOf(place)))?.id;

// 에니에스 로비 사건을 18세에 놓는 게임 연표 기준. 이후에는 거대선의 현 위치를 특정하지 않는다.
export function destinationAt(place: string, age: number): string {
  return place === '스릴러 바크' && age > 18 ? '플로리안 트라이앵글' : portOf(place);
}

export function connectedPorts(place: string, sea: SeaId, flags: string[], age: number): string[] {
  const port = portOf(place);
  const exits = ROUTE_TREE[port] ?? SEAS.find((s) => s.id === sea)!.ports.filter((p) => p !== port);
  return [...new Set(exits.map(to => destinationAt(to, age)))].filter((to) => {
    if (to === '리버스 마운틴') return flags.includes('ship');
    if (to === '어인섬') return flags.includes('route:coating');
    if (to === '스카이피아') return flags.includes('route:sky');
    if (to === '조우') return flags.includes('route:zou');
    return true;
  });
}
