// 고향 여섯 곳 (설계 5.1). 다섯 곳의 가중치는 4단계 과제 9에서 올린다.
// 고향 '로그타운'은 이스트 블루 전체를 뜻한다: 주인공은 HOMETOWNS 여덟 마을(로그타운도 그 하나) 가운데 한 곳(hero.town)에서 태어나
// 그 마을을 첫 섬(hero.island)으로 삼는다.
import type { HomeId, Lineage, SeaId, Species, Wealth } from '../core/types';

export interface Home {
  name: string;
  weight: number;                              // 출생 주사위에서 뽑힐 가중치
  sea: SeaId; island: string;                  // 고향의 대표 섬. 주인공의 첫 섬은 태어난 마을이다
  species: Species[];                          // 여기서 나고 자라는 종족. 이 밖의 종족은 떠내려온 고아다
  wealth: Record<Wealth, number>;              // 집안 형편 비율 (고아는 늘 가난)
  lineages: [Lineage, number][];               // 핏줄 비율 (고아는 성씨와 종족 주사위가 정한다)
}

export const HOMES: Record<HomeId, Home> = {
  loguetown: {
    name: '로그타운', weight: 1, sea: 'east', island: '로그타운', species: ['human'],
    wealth: { poor: 30, common: 45, comfortable: 20, noble: 5 },
    lineages: [['commoner', 70], ['marineFamily', 12], ['pirateChild', 8]],
  },
  // 워터 세븐: 빈부 차가 가장 뚜렷하다 (갈레라 컴퍼니의 넉넉한 집 ↔ 뒷골목 해체업자)
  water7: {
    name: '워터 세븐', weight: 0, sea: 'gl_first', island: '워터 세븐', species: ['human'],
    wealth: { poor: 40, common: 25, comfortable: 28, noble: 7 },
    lineages: [['commoner', 80], ['marineFamily', 6], ['pirateChild', 8]],
  },
  // 와노쿠니: 쇄국. 해군 가문은 없고 무사 가문이 있다. 오로치 시대라 가난한 집이 많다
  wano: {
    name: '와노쿠니', weight: 0, sea: 'nw_late', island: '와노쿠니', species: ['human'],
    wealth: { poor: 45, common: 35, comfortable: 15, noble: 5 },
    lineages: [['commoner', 70], ['samurai', 22], ['pirateChild', 2]],
  },
  // 어인섬: 어인가에서 태어나면 섬 안에서도 밀려난 핏줄(outcast)이다. 지상의 차별은 바다에 나가서 시련으로 쌓인다
  fishman: {
    name: '어인섬', weight: 0, sea: 'sabaody', island: '어인섬', species: ['fishman', 'merfolk'],
    wealth: { poor: 38, common: 42, comfortable: 16, noble: 4 },
    lineages: [['commoner', 62], ['outcast', 28], ['pirateChild', 10]],
  },
  // 하늘섬: 명문이 드물다. 샨디아의 아이는 땅을 빼앗긴 핏줄(outcast)이다
  sky: {
    name: '하늘섬', weight: 0, sea: 'gl_first', island: '스카이피아', species: ['skypiean'],
    wealth: { poor: 30, common: 55, comfortable: 13, noble: 2 },
    lineages: [['commoner', 80], ['outcast', 20]],
  },
  // 조우: 고립된 섬. 돈보다 전사의 이름이 앞선다
  zou: {
    name: '조우', weight: 0, sea: 'nw_first', island: '조우', species: ['mink'],
    wealth: { poor: 25, common: 60, comfortable: 13, noble: 2 },
    lineages: [['commoner', 92], ['pirateChild', 8]],
  },
};

/**
 * 빌드할 때 고향 가중치를 바꿀 수 있다: 환경 변수 VITE_HOMES="loguetown:40,water7:20,wano:14" (.env.production).
 * 사이트에는 사건을 다 쓴 고향만 연다. 테스트와 시뮬레이터(Vite 밖)에서는 위의 값 그대로다.
 */
const HOME_WEIGHTS = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_HOMES;
if (HOME_WEIGHTS) {
  for (const part of HOME_WEIGHTS.split(',')) {
    const [id, w] = part.split(':').map((x) => x.trim());
    if (id in HOMES && Number.isFinite(Number(w))) HOMES[id as HomeId].weight = Number(w);
  }
}

/** 태어난 마을 앞에 붙는 큰 지명: 로그타운 고향은 바다 이름, 다른 고향은 그 섬 이름 (마을 이름이 섬 이름과 같으면 그 섬이 있는 바다) */
const REGION: Record<HomeId, string> = { loguetown: '이스트 블루', water7: '워터 세븐', wano: '와노쿠니', fishman: '어인섬', sky: '하늘섬', zou: '조우' };
const REGION_WIDE: Record<HomeId, string> = { loguetown: '이스트 블루', water7: '위대한 항로', wano: '신세계', fishman: '위대한 항로', sky: '위대한 항로', zou: '신세계' };
export function townLabel(home: HomeId, town: string): string {
  const region = REGION[home] === town ? REGION_WIDE[home] : REGION[home];
  return `${region} ${town}`;
}
