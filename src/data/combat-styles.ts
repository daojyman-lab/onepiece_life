// 상위 계통 → 성장 갈래 → 독립 숙련 유파. sword/gun은 저장 호환용 키다.
import type { BranchId, Skill } from '../shared/core/types';

export type MartialBranch = 'fist' | 'sword' | 'polearm' | 'blunt' | 'gun';
export const MARTIAL_BRANCHES: readonly MartialBranch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun'];
export const WEAPON_BRANCHES: readonly MartialBranch[] = ['sword', 'polearm', 'blunt', 'gun'];
export const STYLE_BRANCH_ID: Record<MartialBranch, BranchId> = {
  fist: 'martial.fist', sword: 'martial.sword', polearm: 'weapon.polearm', blunt: 'weapon.blunt', gun: 'martial.gun',
};
export const DEFAULT_STYLE: Record<MartialBranch, CombatStyle> = {
  fist: 'boxing', sword: 'oneSword', polearm: 'spear', blunt: 'club', gun: 'pistol',
};
export type CombatStyle = 'boxing' | 'kicking' | 'karate' | 'fishmanKarate' | 'rokushiki' | 'grappling'
  | 'oneSword' | 'twoSword' | 'threeSword' | 'iai' | 'spear' | 'naginata' | 'staff'
  | 'hammer' | 'club' | 'pipe' | 'pistol' | 'rifle' | 'sniper' | 'slingshot' | 'dial';
export interface CombatStyleDef {
  id: CombatStyle; name: string; group: 'martial' | 'weapon'; branch: MartialBranch;
  weapon: string | null; stat: Skill['stat']; hands: 1 | 2; tags: Skill['tags'];
  moves: readonly [string, string, string, string, string, string];
}
const style = (id: CombatStyle, name: string, branch: MartialBranch, weapon: string | null, stat: Skill['stat'], hands: 1 | 2,
  tags: Skill['tags'], moves: CombatStyleDef['moves']): CombatStyleDef =>
  ({ id, name, group: branch === 'fist' ? 'martial' : 'weapon', branch, weapon, stat, hands, tags, moves });

export const COMBAT_STYLES: readonly CombatStyleDef[] = [
  style('boxing', '권법', 'fist', null, 'str', 1, [], ['곧은 주먹', '연속 지르기', '틈새 반격', '충격권', '철벽 깨기', '극의 · 한 점의 권']),
  style('kicking', '각법', 'fist', null, 'spd', 1, [], ['앞차기', '돌려차기', '공중 뒤차기', '연속 회전차기', '발끝의 돌풍', '극의 · 하늘을 가르는 발']),
  style('karate', '공수도', 'fist', null, 'str', 1, [], ['정권 지르기', '손날 치기', '중단 돌파', '일격 정권', '호흡 관통권', '극의 · 고요한 일격']),
  style('fishmanKarate', '어인공수도', 'fist', null, 'str', 1, ['pierce'], ['수면 장타', '물결 정권', '수압 밀어내기', '충격 파도', '오천장 기와 깨기', '극의 · 해류의 권']),
  style('rokushiki', '육식', 'fist', null, 'spd', 1, [], ['지건', '체', '람각', '월보 급습', '철괴 반격', '극의 · 육왕권']),
  style('grappling', '씨름·유술', 'fist', null, 'str', 2, [], ['허리 잡아 넘기기', '발 걸기', '어깨 메치기', '중심 무너뜨리기', '큰 허리 던지기', '극의 · 산을 뒤집는 메치기']),
  style('oneSword', '일도류', 'sword', '수련용 외날검', 'str', 1, [], ['곧은 베기', '칼끝 흘리기', '날아가는 참격', '강철 가르기', '일섬', '극의 · 한 자루의 끝']),
  style('twoSword', '이도류', 'sword', '한 쌍의 실전검', 'spd', 2, [], ['교차 베기', '양날 연격', '쌍검 받아치기', '십자 참격', '교차 회오리', '극의 · 두 길의 합일']),
  style('threeSword', '삼도류', 'sword', '맞춤 손잡이 삼검', 'str', 2, [], ['세 갈래 베기', '삼검 연격', '회전 참격', '세 칼의 압박', '삼중 회오리', '극의 · 세 자루의 맹세']),
  style('iai', '발도술', 'sword', '손에 맞춘 발도검', 'spd', 1, [], ['짧은 발도', '일자 섬광', '칼집 반격', '발도 연섬', '찰나의 참격', '극의 · 소리 없는 발도']),
  style('spear', '창술', 'polearm', '스승이 다듬은 장창', 'spd', 2, ['pierce'], ['중단 찌르기', '창끝 견제', '회수 찌르기', '긴 거리 연격', '갑주 관통 찌르기', '극의 · 물길을 여는 창']),
  style('naginata', '언월도술', 'polearm', '수비대의 언월도', 'str', 2, ['area'], ['낮게 휘두르기', '반달 베기', '자루 받아치기', '넓은 쓸어베기', '큰 반월 참격', '극의 · 진형을 여는 날']),
  style('staff', '봉술', 'polearm', '길잡이의 철심봉', 'spd', 2, [], ['봉 끝 찌르기', '회전 타격', '다리 걸어치기', '연환 봉격', '회전 방벽 돌파', '극의 · 흐르는 원']),
  style('hammer', '해머술', 'blunt', '조선공의 전투 해머', 'str', 2, ['pierce'], ['못 박듯 내려치기', '자루 받아치기', '골조 부수기', '들어올려 찍기', '철판 파쇄', '극의 · 용골을 울리는 망치']),
  style('club', '둔기술', 'blunt', '직접 만든 철심 몽둥이', 'str', 2, [], ['무게 실어 후리기', '어깨 회전 타격', '내려찍기', '회전 강타', '철문 깨기', '극의 · 자기 이름의 뇌성']),
  style('pipe', '파이프·봉형 둔기술', 'blunt', '손잡이를 감은 쇠파이프', 'spd', 1, [], ['짧게 후려치기', '손목 찍기', '자루 걸어당기기', '좁은 길 연격', '회전 파이프 강타', '극의 · 골목의 돌풍']),
  style('pistol', '권총 사격', 'gun', '사수에게 받은 권총', 'spd', 1, [], ['가늠 사격', '빠른 장전 사격', '견제탄', '연속 속사', '사각 사격', '극의 · 마지막 한 발']),
  style('rifle', '소총 사격', 'gun', '경비대의 장총', 'spd', 2, [], ['견착 사격', '호흡 사격', '엄폐 사격', '이동 표적 사격', '연속 정밀탄', '극의 · 흔들리지 않는 조준']),
  style('sniper', '저격술', 'gun', '관측수와 맞춘 저격총', 'int', 2, ['pierce'], ['거리 가늠 사격', '바람 읽기 사격', '원거리 급소탄', '시야 틈 사격', '장거리 관통탄', '극의 · 수평선의 한 점']),
  style('slingshot', '새총 사격', 'gun', '장인이 깎은 전투 새총', 'spd', 2, [], ['돌멩이 조준탄', '튕겨 맞히기', '강화 탄환', '곡사 타격', '연속 회전탄', '극의 · 작은 탄환의 큰 길']),
  style('dial', '다이얼 사격·응용', 'gun', '안전장치를 단 충격 다이얼', 'int', 1, [], ['저출력 충격 방출', '풍압 견제', '반동 조절타', '축적 충격 방출', '압축 충격파', '극의 · 되돌아오는 울림']),
];
export const COMBAT_STYLE_BY_ID = Object.fromEntries(COMBAT_STYLES.map((s) => [s.id, s])) as Record<CombatStyle, CombatStyleDef>;
export function isCombatStyle(id: unknown): id is CombatStyle { return typeof id === 'string' && Object.hasOwn(COMBAT_STYLE_BY_ID, id); }
