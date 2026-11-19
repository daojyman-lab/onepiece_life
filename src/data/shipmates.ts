// 남의 해적선에 선원으로 오를 때 함께 생기는 사람들: 모시는 선장과 선배 선원들.
// 원작의 해적선은 선장 아래 갑판장 · 전투원 · 저격수 같은 선원 여럿이 함께 탄다 (버기 · 크로 · 아론 해적단처럼).
// 막 오른 주인공은 그 줄의 맨 끝, 말단이다. 선배 선원들은 싸움에 함께 나서지만 주인공의 부하가 아니라 선장의 선원이다.
// - 주인공이 그 배를 물려받거나 빼앗으면(모시는 선장이 더는 배에 없으면) 선배 선원들은 주인공을 따른다.
// - 주인공이 그 배를 떠나면(제 배를 따로 얻거나 해적을 그만두면) 선배 선원들은 그 배에 남는다.
import type { Fx } from '../core/types';

/** 주인공이 모시는 선장의 관계 글 */
export const SHIP_CAPTAIN = '모시는 해적 선장';
/** 선배 선원의 관계 글은 모두 이 말로 시작한다 */
export const SHIPMATE = '선배 선원';
/** 배를 물려받은 뒤 따라온 선배 선원의 관계 글 앞말 (예: '옛 배부터 함께한 갑판장') */
export const SHIPMATE_FOLLOWED = '옛 배부터 함께한';

/** 선배 선원: 자리 이름, 싸움의 병과, 주인공보다 몇 살 위인가, 처음 레벨 */
const SENIORS: { title: string; role: 'vanguard' | 'support'; older: number; level: number }[] = [
  { title: '갑판장', role: 'vanguard', older: 9, level: 3 },
  { title: '돌격대 선배', role: 'vanguard', older: 4, level: 2 },
  { title: '저격수 선배', role: 'support', older: 3, level: 2 },
];

/** 해적선에 말단 선원으로 오른다: 선장 한 사람과 선배 선원 셋이 한꺼번에 생긴다 */
export const JOIN_SHIP: Fx[] = [
  { op: 'person', kind: 'ally', relation: SHIP_CAPTAIN, faction: 'pirate', age: { older: 16 } },
  ...SENIORS.map(({ title, role, older, level }): Fx =>
    ({ op: 'person', kind: 'crew', relation: `${SHIPMATE} · ${title}`, role, level, faction: 'pirate', age: { older } })),
];
