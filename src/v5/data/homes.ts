// 고향 여섯 곳 (설계 5.1). 이 단계에서는 로그타운에서만 태어난다. 나머지 다섯 곳은 4단계에서 가중치를 올린다.
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

// 다섯 곳의 형편 · 핏줄 비율은 아직 정하지 않았다. 4단계에서 고향마다 다르게 고친다.
const LATER_WEALTH: Record<Wealth, number> = { poor: 30, common: 45, comfortable: 20, noble: 5 };
const LATER_LINEAGES: [Lineage, number][] = [['commoner', 70], ['marineFamily', 12], ['pirateChild', 8]];

export const HOMES: Record<HomeId, Home> = {
  loguetown: {
    name: '로그타운', weight: 1, sea: 'east', island: '로그타운', species: ['human'],
    wealth: { poor: 30, common: 45, comfortable: 20, noble: 5 },
    lineages: [['commoner', 70], ['marineFamily', 12], ['pirateChild', 8]],
  },
  water7: { name: '워터 세븐', weight: 0, sea: 'gl_first', island: '워터 세븐', species: ['human'], wealth: LATER_WEALTH, lineages: LATER_LINEAGES },
  wano: { name: '와노쿠니', weight: 0, sea: 'nw_late', island: '와노쿠니', species: ['human'], wealth: LATER_WEALTH, lineages: LATER_LINEAGES },
  fishman: { name: '어인섬', weight: 0, sea: 'sabaody', island: '어인섬', species: ['fishman', 'merfolk'], wealth: LATER_WEALTH, lineages: LATER_LINEAGES },
  sky: { name: '하늘섬', weight: 0, sea: 'gl_first', island: '스카이피아', species: ['skypiean'], wealth: LATER_WEALTH, lineages: LATER_LINEAGES },
  zou: { name: '조우', weight: 0, sea: 'nw_first', island: '조우', species: ['mink'], wealth: LATER_WEALTH, lineages: LATER_LINEAGES },
};
