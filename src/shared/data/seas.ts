// 해역 6단계, 배.
import type { Sea, SeaId, Ship } from '../core/types';

export const SEAS: Sea[] = [
  { id: 'east', stage: 1, name: '이스트 블루', ports: ['후샤 마을', '시럽 마을', '로그타운', '해상 레스토랑 발라티에', '코노미 제도', '셸스 타운', '오렌지 마을', '시모츠키 마을', '진귀한 동물의 섬'], enemyPower: [8, 22], shipRequired: 0, armament: 0 },
  { id: 'west', stage: 1, name: '웨스트 블루', ports: ['오하라 옛터', '마피아 항구', '일리시아 왕국', '서쪽 등대섬'], enemyPower: [8, 22], shipRequired: 0, armament: 0 },
  { id: 'north', stage: 1, name: '노스 블루', ports: ['루브니르 왕국', '플레반스 옛터', '스파이더 마일즈', '북쪽 상업 도시'], enemyPower: [8, 22], shipRequired: 0, armament: 0 },
  { id: 'south', stage: 1, name: '사우스 블루', ports: ['바테리라', '거인 정착지', '남쪽 산호초 항구', '소르베 왕국'], enemyPower: [8, 22], shipRequired: 0, armament: 0 },
  { id: 'gl_entry', stage: 2, name: '위대한 항로 입구', ports: ['리버스 마운틴', '쌍둥이 곶', '위스키 피크', '리틀 가든', '드럼 왕국', '모로섬'], enemyPower: [20, 38], shipRequired: 1, armament: 0 },
  { id: 'gl_first', stage: 3, name: '위대한 항로 전반', ports: ['알라바스타 왕국', '자야', '스카이피아', '워터 세븐', '에니에스 로비', '롱 링 롱 랜드'], enemyPower: [34, 58], shipRequired: 2, armament: 1 },
  { id: 'sabaody', stage: 4, name: '샤본디 제도 · 어인섬', ports: ['샤본디 제도', '스릴러 바크', '어인섬', '아마존 릴리', '플로리안 트라이앵글'], enemyPower: [52, 84], shipRequired: 2, armament: 1 },
  { id: 'nw_first', stage: 5, name: '신세계 전반', ports: ['펑크 해저드', '드레스로자', '조우', '홀케이크 아일랜드'], enemyPower: [78, 118], shipRequired: 3, armament: 2 },
  { id: 'nw_late', stage: 6, name: '신세계 후반', ports: ['와노쿠니', '엘바프', '에그헤드', '라프텔 근해'], enemyPower: [112, 165], shipRequired: 4, armament: 3 },
];

export const SEA_BY_ID = Object.fromEntries(SEAS.map((s) => [s.id, s])) as Record<SeaId, Sea>;

/** 다음 단계의 해역. 1단계 바다 네 곳은 모두 위대한 항로 입구로 이어진다. */
export function nextSea(id: SeaId): SeaId | null {
  const stage = SEA_BY_ID[id].stage;
  const next = SEAS.find((s) => s.stage === stage + 1);
  return next ? next.id : null;
}

export const SHIPS: Ship[] = [
  { id: 'raft', name: '뗏목', tier: 0, crew: 1, price: 0 },
  { id: 'sloop', name: '소형 범선', tier: 1, crew: 3, price: 30000 },
  { id: 'caravel', name: '캐러벨', tier: 2, crew: 5, price: 120000 },
  { id: 'galleon', name: '대형 범선', tier: 3, crew: 7, price: 400000 },
  { id: 'flagship', name: '거함', tier: 4, crew: 10, price: 1200000 },
];
export const SHIP_BY_ID = Object.fromEntries(SHIPS.map((s) => [s.id, s])) as Record<string, Ship>;
