// 큰 기연 (설계 5.3). 해가 바뀔 때 rollFortune만 띄운다. 가장 높은 가치관(fortuneOf)에 맞는 기연이 온다.
// 문은 언제나 "받는다"와 "받지 않는다" 둘. 받는 문은 돈으로는 못 여는 것을 준다:
// 돈으로 산 스승보다 높이 가르치는 스승, 단번에 오르는 단계, 뛰어난 의수, 숨은 성, 귀한 열매.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import type { Door, Turning, ValueId } from '../../core/types';

const D = V.value.door;
const TOP = V.growth.maxTier;                  // 기연의 스승은 끝까지 가르친다
const LEAP = V.growth.paidCap + 1;             // 돈으로는 닿지 못하는 단계로 단번에

const decline = (label: string, hint: string): Door => ({ label, hint, fx: [] });
const fortune = (id: string, of: ValueId, x: Omit<Turning, 'id' | 'kind' | 'fortuneOf' | 'weight' | 'repeat' | 'when'> & { when?: Turning['when'] }): Turning =>
  ({ id, kind: 'fortune', fortuneOf: of, weight: 10, repeat: 'once', when: [], ...x });

export const FORTUNES: Turning[] = [
  fortune('fortune_old_hero', 'justice', {
    speaker: { relation: '늙은 해군 영웅' },
    title: '숨어 사는 영웅', body: '바닷가 오두막에 숨어 사는 늙은 해군 영웅이 {name}의 눈빛을 오래 들여다본다. 제자를 받지 않는다던 사람이다.',
    doors: [
      { label: '가르침을 받는다', hint: '세상에 이름난 주먹을 배운다. 돈으로는 들일 수 없는 스승이다', values: { justice: D },
        fx: [{ op: 'master', name: '늙은 해군 영웅', branch: 'armament', cap: TOP, years: 15, paid: false }] },
      decline('가르침을 받지 않는다', '정중히 고개를 숙이고 돌아선다'),
    ],
  }),
  fortune('fortune_repaid', 'devotion', {
    speaker: { relation: '돌아온 떠돌이' },
    title: '돌아온 은혜', body: '오래전 {name}이(가) 아무 대가 없이 돌봐 준 떠돌이가 다시 찾아왔다. 그는 이름을 숨긴 무인이었다.',
    doors: [
      { label: '평생의 수련을 받는다', hint: '그가 쌓은 것을 한꺼번에 물려받는다', values: { devotion: D },
        fx: [{ op: 'tier', branch: 'fist', to: LEAP }, { op: 'base', key: 'vit', add: 2 },
             { op: 'log', text: '떠돌이의 주먹이 고스란히 몸에 새겨졌다.', weight: 'heavy' }] },
      decline('보답을 받지 않는다', '은혜는 갚으라고 베푼 것이 아니다'),
    ],
  }),
  fortune('fortune_limb_maker', 'devotion', {
    when: [{ c: 'limbLost', min: 1 }],
    speaker: { relation: '이름 없는 장인' },
    title: '이름 없는 장인', body: '{name}이(가) 잃은 곳을 본 떠돌이 장인이 말없이 치수를 잰다. 살아 있는 것처럼 움직이는 것을 만들어 주겠다고 한다.',
    doors: [
      { label: '장인의 선물을 받는다', hint: '잃기 전보다 나은 몸이 된다', values: { devotion: D },
        fx: [{ op: 'prosthetic', grade: 'superior' }, { op: 'log', text: '장인의 손끝에서 새 몸이 태어났다.', weight: 'heavy' }] },
      decline('선물을 받지 않는다', '잃은 채로 사는 법을 이미 익혔다'),
    ],
  }),
  fortune('fortune_sword_saint', 'ambition', {
    speaker: { relation: '난파선의 검객' },
    title: '난파선의 검객', body: '부서진 배 위에서 홀로 칼을 닦던 검객이 {name}에게 칼끝을 겨눈다. 견뎌 내면 가르쳐 주겠다고 한다.',
    doors: [
      { label: '검객의 시험을 받는다', hint: '죽을 만큼 몰아붙여진다. 견디면 칼의 끝을 본다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'master', name: '난파선의 검객', branch: 'sword', cap: TOP, years: 15, paid: false }] },
      decline('시험을 받지 않는다', '칼끝을 피해 물러난다'),
    ],
  }),
  fortune('fortune_treasure_ship', 'romance', {
    when: [{ c: 'fruit', has: false }],
    speaker: 'hero',
    title: '떠오른 보물선', body: '폭풍이 지나간 아침, 수면 위로 오래된 보물선이 떠올랐다. 선장실 상자 안에 소용돌이 무늬의 열매가 하나 놓여 있다.',
    doors: [
      { label: '바다가 내민 열매를 받는다', hint: '한 번 먹으면 다시는 헤엄칠 수 없다', needs: ['swim'], values: { romance: D },
        fx: [{ op: 'eatFruit', id: 'random' }, { op: 'fame', add: 50 }] },
      decline('열매를 받지 않는다', '상자를 닫고 보물선이 가라앉는 것을 지켜본다'),
    ],
  }),
  fortune('fortune_stone_text', 'inquiry', {
    speaker: { relation: '숨어 사는 학자' },
    title: '읽을 수 없는 비석', body: '아무도 읽지 못하는 문자가 새겨진 거대한 돌. 그 앞에서 숨어 사는 학자가 {name}에게 읽는 법을 가르쳐 주겠다고 한다.',
    doors: [
      { label: '학자의 가르침을 받는다', hint: '세상이 감춘 이야기를 알게 된다. 쫓기는 몸이 될 수도 있다', values: { inquiry: D },
        fx: [{ op: 'tier', branch: 'observation', to: LEAP }, { op: 'base', key: 'int', add: 3 }, { op: 'flag', id: 'readsStone' }] },
      decline('가르침을 받지 않는다', '모르는 편이 나은 것도 있다'),
    ],
  }),
  fortune('fortune_roots', 'inquiry', {
    when: [{ c: 'secret', known: false }],
    speaker: { relation: '늙은 상인' },
    title: '품속의 물건', body: '{name}이(가) 어릴 적부터 지녀 온 물건을 본 늙은 상인이 얼굴빛을 바꾼다. 그 문양을 안다고 한다.',
    doors: [
      { label: '상인이 건네는 실마리를 받는다', hint: '잃어버린 이름을 알게 된다. 되돌릴 수 없다', values: { inquiry: D },
        fx: [{ op: 'reveal' }, { op: 'timeline', text: '잃어버린 성을 되찾았다' }] },
      decline('실마리를 받지 않는다', '모르는 채로 지금처럼 산다'),
    ],
  }),
  fortune('fortune_fist_master', 'loyalty', {
    speaker: { relation: '늙은 권법가' },
    title: '늙은 권법가', body: '곁의 사람들을 등지지 않고 끝까지 버티는 {name}을(를) 지켜보던 늙은 권법가가 다가온다. 그런 사람에게만 가르친다고 한다.',
    doors: [
      { label: '권법가의 가르침을 받는다', hint: '돈으로는 들일 수 없는 스승이다', values: { loyalty: D },
        fx: [{ op: 'master', name: '늙은 권법가', branch: 'fist', cap: TOP, years: 15, paid: false }] },
      decline('가르침을 받지 않는다', '지금 곁의 사람들과 함께 자라겠다'),
    ],
  }),
  fortune('fortune_drifting_ship', 'freedom', {
    speaker: 'hero',
    title: '떠도는 배', body: '주인 없는 작은 배 한 척이 {island} 앞바다를 떠돈다. 돛에는 아무도 모르는 바닷길이 그려져 있다.',
    doors: [
      { label: '바다가 보낸 배를 받는다', hint: '아무도 모르는 바닷길이 열린다', values: { freedom: D },
        fx: [{ op: 'flag', id: 'secretRoute' }, { op: 'base', key: 'spd', add: 3 }, { op: 'base', key: 'luk', add: 3 },
             { op: 'log', text: '돛에 그려진 바닷길을 따라 아무도 가 보지 못한 물길을 건넜다.', weight: 'heavy' }] },
      decline('배를 받지 않는다', '배는 물결을 따라 멀어진다'),
    ],
  }),
  fortune('fortune_kings_aura', 'dominion', {
    speaker: 'hero',
    title: '사지에서 깨어난 기운', body: '포위당해 끝장이라고 생각한 순간, {name}의 안에서 무언가가 터져 나왔다. 둘러싼 자들이 하나둘 쓰러진다.',
    doors: [
      { label: '깨어난 기운을 받는다', hint: '한번 깨어난 기운은 사람을 바꾼다', values: { dominion: D },
        fx: [{ op: 'tier', branch: 'conqueror', to: 2 }, { op: 'fame', add: 100 }] },
      decline('그 기운을 받지 않는다', '기운을 눌러 삼키고 다시는 꺼내지 않는다'),
    ],
  }),
  fortune('fortune_wind_elder', 'peace', {
    speaker: { relation: '바람의 노인' },
    title: '바람의 노인', body: '외딴 섬의 오두막에서 바람 소리만 듣고 사는 노인이 {name}을(를) 불러 앉힌다.',
    doors: [
      { label: '노인의 가르침을 받는다', hint: '보이지 않는 것을 보게 된다. 서두르지 않는 법을 배운다', values: { peace: D },
        fx: [{ op: 'master', name: '바람의 노인', branch: 'observation', cap: TOP, years: 15, paid: false }] },
      decline('가르침을 받지 않는다', '바람 소리는 혼자서도 들을 수 있다'),
    ],
  }),
];
