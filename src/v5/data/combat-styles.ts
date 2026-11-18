// 체술·무기술 세부 유파. 상위 계통의 공통 숙련도는 하위 유파 숙련도의 합으로 계산한다.
import type { Branch } from '../core/types';

export type CombatStyle =
  | 'boxing' | 'kicking' | 'karate' | 'fishmanKarate' | 'rokushiki' | 'sumo'
  | 'singleSword' | 'dualWield' | 'threeSword' | 'iai'
  | 'spear' | 'naginata' | 'staff' | 'hammer' | 'club' | 'pipe'
  | 'pistol' | 'rifle' | 'sniping' | 'slingshot' | 'dial';

export type CombatStyleGroup = 'martial' | 'weapon';
export interface CombatStyleDef {
  id: CombatStyle;
  name: string;
  group: CombatStyleGroup;
  branch: Extract<Branch, 'fist' | 'sword' | 'gun'>;
  family: string;
  description: string;
}

export const COMBAT_STYLES: readonly CombatStyleDef[] = [
  { id: 'boxing', name: '권법', group: 'martial', branch: 'fist', family: 'unarmed', description: '주먹과 상체 움직임을 중심으로 싸운다.' },
  { id: 'kicking', name: '각법', group: 'martial', branch: 'fist', family: 'unarmed', description: '발차기와 하체의 거리 조절을 중심으로 싸운다.' },
  { id: 'karate', name: '공수도', group: 'martial', branch: 'fist', family: 'unarmed', description: '타격과 자세, 단단한 중심을 중시한다.' },
  { id: 'fishmanKarate', name: '어인공수도', group: 'martial', branch: 'fist', family: 'fishman', description: '물의 흐름과 상대의 체내 수분까지 이용하는 어인의 무술.' },
  { id: 'rokushiki', name: '육식', group: 'martial', branch: 'fist', family: 'government', description: '체력과 신체 제어를 극한까지 끌어올린 체술.' },
  { id: 'sumo', name: '씨름·유술', group: 'martial', branch: 'fist', family: 'grappling', description: '붙잡기와 중심 무너뜨리기, 던지기를 활용한다.' },
  { id: 'singleSword', name: '일도류', group: 'weapon', branch: 'sword', family: 'sword', description: '한 자루의 검을 다루는 기본 검술.' },
  { id: 'dualWield', name: '이도류', group: 'weapon', branch: 'sword', family: 'sword', description: '양손에 검을 들고 연계 공격과 방어를 펼친다.' },
  { id: 'threeSword', name: '삼도류', group: 'weapon', branch: 'sword', family: 'sword', description: '세 자루의 검을 사용하는 특수 검술.' },
  { id: 'iai', name: '발도술', group: 'weapon', branch: 'sword', family: 'sword', description: '발도와 첫 일격의 속도·정확도에 집중한다.' },
  { id: 'spear', name: '창술', group: 'weapon', branch: 'sword', family: 'polearm', description: '찌르기와 긴 사거리 유지에 특화된다.' },
  { id: 'naginata', name: '언월도술', group: 'weapon', branch: 'sword', family: 'polearm', description: '베기와 휘두르기를 결합한 장병기술.' },
  { id: 'staff', name: '봉술', group: 'weapon', branch: 'sword', family: 'polearm', description: '봉의 길이와 회전, 타격 범위를 활용한다.' },
  { id: 'hammer', name: '해머술', group: 'weapon', branch: 'sword', family: 'blunt', description: '중량 무기의 타격과 충격으로 방어를 무너뜨린다.' },
  { id: 'club', name: '둔기술', group: 'weapon', branch: 'sword', family: 'blunt', description: '곤봉·철퇴 등 타격형 둔기를 다룬다.' },
  { id: 'pipe', name: '파이프·봉형 둔기술', group: 'weapon', branch: 'sword', family: 'blunt', description: '파이프와 즉석 봉형 무기를 이용한다.' },
  { id: 'pistol', name: '권총 사격', group: 'weapon', branch: 'gun', family: 'ranged', description: '근·중거리에서 권총으로 빠르게 사격한다.' },
  { id: 'rifle', name: '소총 사격', group: 'weapon', branch: 'gun', family: 'ranged', description: '중거리 사격과 안정적인 조준을 중시한다.' },
  { id: 'sniping', name: '저격술', group: 'weapon', branch: 'gun', family: 'ranged', description: '장거리 관측과 한 발의 명중률에 집중한다.' },
  { id: 'slingshot', name: '새총 사격', group: 'weapon', branch: 'gun', family: 'ranged', description: '탄환과 특수 탄을 활용하는 기교형 사격.' },
  { id: 'dial', name: '다이얼 사격·응용', group: 'weapon', branch: 'gun', family: 'ranged', description: '다이얼을 이용한 발사·반동·기습 전술.' },
];

export const COMBAT_STYLE_BY_ID = Object.fromEntries(COMBAT_STYLES.map((x) => [x.id, x])) as Record<CombatStyle, CombatStyleDef>;
export const COMBAT_STYLE_IDS = COMBAT_STYLES.map((x) => x.id) as CombatStyle[];
export const DEFAULT_STYLE: Record<Extract<Branch, 'fist' | 'sword' | 'gun'>, CombatStyle> = {
  fist: 'boxing', sword: 'singleSword', gun: 'pistol',
};

export function stylesForBranch(branch: Branch): CombatStyle[] {
  return COMBAT_STYLES.filter((x) => x.branch === branch).map((x) => x.id);
}
