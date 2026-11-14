// 생일. 해마다 생일이 되면 한 줄. 나이 · 가족 · 길 · 동료에 맞는 것 중 하나.
// 자리표시: {age} 몇 살, {place}, {father} {mother} (고아면 보호자), {rival}, {crew}, {spouse}, {child}
import type { Condition, Effect } from '../core/types';

export interface BirthdayLine { when: Condition[]; text: string; effects?: Effect[]; weight?: number }

const B = (when: Condition[], text: string, effects?: Effect[], weight = 1): BirthdayLine => ({ when, text, effects, weight });
const age = (min?: number, max?: number): Condition => ({ c: 'age', min, max });
const flag = (id: string, has = true): Condition => ({ c: 'flag', id, has });
const orphan: Condition = { c: 'trait', id: 'orphan', has: true };
const notOrphan: Condition = { c: 'trait', id: 'orphan', has: false };
const atSea: Condition = { c: 'route', is: ['pirate', 'revolution'] };
const navy: Condition = { c: 'route', is: ['marine'] };
const crew: Condition = { c: 'crew', min: 1 };

export const BIRTHDAY_LINES: BirthdayLine[] = [
  // 어린 시절
  B([age(1, 1), notOrphan], '첫돌. 상 위의 물건 중에 작은 나무 칼을 덥석 집었다. {father}이(가) 크게 웃었다.', [{ op: 'base', key: 'str', add: 0.3 }], 3),
  B([age(1, 1), orphan], '첫돌. {father}이(가) 처음으로 아이의 생일상을 차렸다. 서툰 미역국이었다.', [], 3),
  B([age(2, 9), notOrphan], '{age}번째 생일. {mother}이(가) 생선 케이크를 구워 주었다.', [{ op: 'hp', add: 5 }]),
  B([age(2, 9), notOrphan], '{age}번째 생일. {father}이(가) 깎아 준 나무 배를 받았다.', [{ op: 'base', key: 'luk', add: 0.3 }]),
  B([age(2, 9), orphan], '{age}번째 생일. 정확한 날짜는 아무도 모르지만, {father}이(가) 거둔 날을 생일로 쳐 주었다.', [{ op: 'base', key: 'wil', add: 0.3 }]),
  B([age(3, 9)], '{age}번째 생일. 동네 아이들이 조개 목걸이를 만들어 주었다.'),
  B([age(2, 9)], '{age}번째 생일. 이웃 할머니가 찐 감자를 한 바구니 쪄 주었다.', [{ op: 'hp', add: 3 }]),
  B([age(3, 9)], '{age}번째 생일. 바닷가에서 소라 껍데기를 주워 귀에 대고 파도 소리를 들었다.'),
  B([age(4, 9), orphan], '{age}번째 생일. {father}이(가) 시장에서 산 작은 칼을 내밀었다. "너도 이제 컸으니까."', [{ op: 'base', key: 'str', add: 0.3 }]),
  B([age(4, 9)], '{age}번째 생일. 처음으로 혼자 배를 저어 앞바다까지 나가 봤다.', [{ op: 'base', key: 'spd', add: 0.3 }]),
  // 수련기
  B([age(10, 15), { c: 'person', kind: 'rival', has: true }], '{age}번째 생일. {rival}이(가) 퉁명스럽게 무언가를 던져 주었다. 새 손목 붕대였다.', [{ op: 'bond', who: 'rival', add: 5 }]),
  B([age(10, 15), notOrphan], '{age}번째 생일. {mother}이(가) 수련복을 새로 지어 주었다.', [{ op: 'base', key: 'wil', add: 0.4 }]),
  B([age(10, 15)], '{age}번째 생일. 오늘만은 수련을 쉬고 바닷가에서 하루 종일 놀았다.', [{ op: 'hp', add: 8 }]),
  B([age(15, 15)], '열다섯 번째 생일. 내년이면 바다로 나간다. 수평선을 오래 바라봤다.', [{ op: 'base', key: 'wil', add: 0.5 }], 3),
  // 바다에 나간 뒤
  B([age(16), atSea, crew], '{age}번째 생일. {crew}이(가) 몰래 연회를 준비해 두었다. 갑판이 떠나가라 노래를 불렀다.', [{ op: 'crewBond', add: 3 }, { op: 'hp', add: 10 }], 2),
  B([age(16), navy], '{age}번째 생일. 기지 식당에서 동기들이 생일 노래를 불러 주었다. 상관이 고기 한 접시를 더 얹어 주었다.', [{ op: 'hp', add: 8 }], 2),
  B([age(16), crew], '{age}번째 생일. {crew}이(가) 서툰 솜씨로 케이크를 만들었다. 모양은 엉망이었지만 맛있었다.', [{ op: 'crewBond', add: 2 }]),
  B([age(16), { c: 'crew', max: 0 }], '{age}번째 생일. 생일인 걸 아무도 몰랐다. 혼자 바다를 보며 술 한 잔을 들었다.', [{ op: 'base', key: 'wil', add: 0.3 }]),
  B([age(17), notOrphan], '{age}번째 생일. {place}에서 {mother}의 편지가 왔다. "밥 잘 챙겨 먹어라."', [{ op: 'bond', who: '어머니', add: 3 }]),
  B([age(18), flag('has_lover')], '{age}번째 생일. 연인이 조개껍데기 목걸이를 걸어 주었다.', [{ op: 'base', key: 'luk', add: 0.5 }], 2),
  B([age(18), flag('married')], '{age}번째 생일. {spouse}의 편지와 손뜨개 목도리가 도착했다.', [{ op: 'bond', who: '배우자', add: 3 }], 2),
  B([age(20), flag('has_child')], '{age}번째 생일. {child}이(가) 그린 아빠 · 엄마 얼굴 그림이 편지에 들어 있었다.', [{ op: 'base', key: 'wil', add: 0.5 }], 2),
  B([age(20, 20)], '스무 번째 생일. 고향을 떠난 지도 꽤 되었다.', [], 2),
  B([age(30, 30)], '서른 번째 생일. 어릴 적 꿈에 얼마나 가까워졌을까.', [{ op: 'base', key: 'wil', add: 0.5 }], 3),
  B([age(40, 40)], '마흔 번째 생일. 젊은 선원들이 "선배"라고 부르기 시작했다.', [], 3),
  B([age(50, 50)], '쉰 번째 생일. 거울 속 얼굴에 바다의 세월이 새겨져 있었다.', [], 3),
  B([age(60)], '{age}번째 생일. 흰머리가 또 하나 늘었다. 그래도 아직 바다가 좋다.'),
  B([age(70)], '{age}번째 생일. 이 나이까지 바다에서 살아남은 사람은 많지 않다.', [{ op: 'base', key: 'luk', add: 0.5 }]),
];
