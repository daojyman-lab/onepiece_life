// 큰 기연 (설계 5.3). 해가 바뀔 때 rollFortune만 띄운다. 가장 높은 가치관(fortuneOf)에 맞는 기연이 온다.
// 모든 기연에는 받는 선택과 거절이 있다. 받는 문은 돈으로는 못 여는 것을 준다:
// 돈으로 산 스승보다 높이 가르치는 스승, 단번에 오르는 단계, 뛰어난 의수, 숨은 성, 귀한 열매.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import type { Door, Turning, ValueId } from '../../core/types';

const D = V.value.door;
const TOP = V.growth.maxTier;                  // 기연의 스승은 끝까지 가르친다
const LEAP = V.growth.paidCap + 1;             // 돈으로는 닿지 못하는 단계로 단번에

const decline = (label: string, hint: string, result: string): Door => ({ label, hint, fx: [{ op: 'log', text: result, weight: 'light' }] });
const fortune = (id: string, of: ValueId, x: Omit<Turning, 'id' | 'kind' | 'fortuneOf' | 'weight' | 'repeat' | 'when'> & { when?: Turning['when'] }): Turning =>
  ({ id, kind: 'fortune', fortuneOf: of, weight: 10, repeat: 'once', when: [], ...x });

export const FORTUNES: Turning[] = [
  fortune('fortune_old_hero', 'justice', {
    speaker: { relation: '늙은 해군 영웅' },
    title: '숨어 사는 영웅', body: '바닷가 오두막에 숨어 사는 늙은 해군 영웅이 {name}의 눈빛을 오래 들여다본다. 제자를 받지 않는다던 사람이다.',
    doors: [
      { label: '가르침을 받는다', hint: '세상에 이름난 주먹을 배운다. 돈으로는 들일 수 없는 스승이다', values: { justice: D },
        fx: [{ op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 1 }, { op: 'log', text: '늙은 영웅이 오두막 문을 열어 주었다. 손에 쥔 돌을 깨뜨리는 법부터 가르치겠다며 {name}의 자세를 바로잡았다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '정중히 고개를 숙이고 돌아선다', '늙은 영웅에게 고개를 숙였다. 그는 더 붙잡지 않고 오두막 문을 닫았다.'),
    ],
  }),
  fortune('fortune_black_broker', 'greed', {
    speaker: { relation: '암시장의 큰손' },
    title: '암시장의 큰손', body: '뒷골목 암시장의 큰손이 {name}의 수완을 오래 지켜봤다고 한다. 장부에 이름을 올리면, 돈으로는 살 수 없는 총잡이를 붙여 주겠다고 한다.',
    doors: [
      { label: '장부에 이름을 올리고 총잡이를 받는다', hint: '어둠의 거래에 발을 들인다. 그 총잡이는 끝까지 가르친다', values: { greed: D },
        fx: [{ op: 'learnTechnique', teacher: '암시장의 총잡이', branch: 'gun', name: '속사', add: 18 }, { op: 'money', add: 75000 }, { op: 'log', text: '장부에 이름이 올라가자 계약금이 손에 들어왔다. 큰손이 붙인 총잡이는 그날 밤부터 사격 자세를 고쳐 주었다.', weight: 'heavy' }] },
      decline('총잡이를 받지 않는다', '그 돈의 냄새가 싫다', '암시장의 장부를 덮고 돌아섰다. 큰손은 총잡이를 다른 손님에게 붙였다.'),
    ],
  }),
  fortune('fortune_auction_fruit', 'greed', {
    when: [{ c: 'fruit', has: false }],
    speaker: 'hero',
    title: '경매장 뒤뜰의 상자', body: '경매장 뒤뜰에서 경비가 조는 사이, 자물쇠가 풀린 상자 하나가 {name}의 눈에 들어왔다. 소용돌이 무늬의 열매가 들어 있다. 값을 매길 수 없는 물건이다.',
    doors: [
      { label: '상자를 받는다', hint: '아무도 모르게 열매를 손에 넣는다. 주인은 언젠가 찾으러 온다', values: { greed: D },
        fx: [{ op: 'eatFruit', id: 'random' }, { op: 'person', kind: 'enemy', relation: '열매를 잃은 경매장 주인' }, { op: 'log', text: '상자를 빼내 열매를 베어 물었다. 뒤늦게 빈 상자를 발견한 경매장 주인이 도둑을 찾으라고 사람을 풀었다.', weight: 'heavy' }] },
      decline('상자를 받지 않는다', '남의 물건에는 손대지 않는다', '열매가 든 상자를 그대로 두고 경매장 뒤뜰을 빠져나왔다.'),
    ],
  }),
  fortune('fortune_sword_saint', 'ambition', {
    speaker: { relation: '난파선의 검객' },
    title: '난파선의 검객', body: '부서진 배 위에서 홀로 칼을 닦던 검객이 {name}에게 칼끝을 겨눈다. 견뎌 내면 가르쳐 주겠다고 한다.',
    doors: [
      { label: '검객의 시험을 받는다', hint: '죽을 만큼 몰아붙여진다. 견디면 칼의 끝을 본다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'learnTechnique', teacher: '난파선의 검객', branch: 'sword', name: '흐름을 끊는 발도', add: 22 }, { op: 'log', text: '검객의 칼끝을 피하다 온몸에 상처가 났다. 끝내 검을 놓지 않자 그가 칼을 내리고 수련을 허락했다.', weight: 'heavy' }] },
      decline('시험을 받지 않는다', '칼끝을 피해 물러난다', '검객의 칼끝에서 한 걸음 물러섰다. 그는 다시 칼을 닦기 시작했다.'),
    ],
  }),
  fortune('fortune_treasure_ship', 'romance', {
    when: [{ c: 'fruit', has: false }],
    speaker: 'hero',
    title: '떠오른 보물선', body: '폭풍이 지나간 아침, 수면 위로 오래된 보물선이 떠올랐다. 선장실 상자 안에 소용돌이 무늬의 열매가 하나 놓여 있다.',
    doors: [
      { label: '바다가 내민 열매를 받는다', hint: '한 번 먹으면 다시는 헤엄칠 수 없다', needs: ['swim'], values: { romance: D },
        fx: [{ op: 'eatFruit', id: 'random' }, { op: 'fame', add: 50 }, { op: 'log', text: '가라앉는 보물선에서 열매를 베어 물고 가까스로 빠져나왔다. 다시는 헤엄칠 수 없게 된 채 돌아온 이야기가 항구마다 퍼졌다.', weight: 'heavy' }] },
      decline('열매를 받지 않는다', '상자를 닫고 보물선이 가라앉는 것을 지켜본다', '상자 뚜껑을 닫았다. 보물선은 열매를 품은 채 다시 물속으로 내려갔다.'),
    ],
  }),
  fortune('fortune_stone_text', 'inquiry', {
    speaker: { relation: '숨어 사는 학자' },
    title: '읽을 수 없는 비석', body: '아무도 읽지 못하는 문자가 새겨진 거대한 돌. 그 앞에서 숨어 사는 학자가 {name}에게 읽는 법을 가르쳐 주겠다고 한다.',
    doors: [
      { label: '학자의 가르침을 받는다', hint: '세상이 감춘 이야기를 알게 된다. 쫓기는 몸이 될 수도 있다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 3 }, { op: 'flag', id: 'readsStone' }, { op: 'log', text: '학자가 비석의 첫 줄을 짚어 주었다. 글자의 뜻이 이어지자 {name}은(는) 돌에 새겨진 비밀을 스스로 읽을 수 있게 되었다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '모르는 편이 나은 것도 있다', '비석 앞에서 고개를 저었다. 학자는 글자를 덮고 자리를 떠났다.'),
    ],
  }),
  fortune('fortune_roots', 'inquiry', {
    when: [{ c: 'secret', known: false }],
    speaker: { relation: '늙은 상인' },
    title: '품속의 물건', body: '{name}이(가) 어릴 적부터 지녀 온 물건을 본 늙은 상인이 얼굴빛을 바꾼다. 그 문양을 안다고 한다.',
    doors: [
      { label: '상인이 건네는 실마리를 받는다', hint: '잃어버린 이름을 알게 된다. 되돌릴 수 없다', values: { inquiry: D },
        fx: [{ op: 'reveal' }, { op: 'timeline', text: '잃어버린 성을 되찾았다' }, { op: 'log', text: '늙은 상인이 문양의 내력을 들려주었다. {name}은(는) 오래 감춰진 자기 성을 마침내 알게 되었다.', weight: 'heavy' }] },
      decline('실마리를 받지 않는다', '모르는 채로 지금처럼 산다', '늙은 상인이 물건을 돌려주었다. 문양의 뜻은 끝내 묻지 않았다.'),
    ],
  }),
  fortune('fortune_fist_master', 'loyalty', {
    speaker: { relation: '늙은 권법가' },
    title: '늙은 권법가', body: '곁의 사람들을 등지지 않고 끝까지 버티는 {name}을(를) 지켜보던 늙은 권법가가 다가온다. 그런 사람에게만 가르친다고 한다.',
    doors: [
      { label: '권법가의 가르침을 받는다', hint: '돈으로는 들일 수 없는 스승이다', values: { loyalty: D },
        fx: [{ op: 'learnTechnique', teacher: '늙은 권법가', branch: 'fist', name: '상대의 힘을 흘리는 받아치기', add: 20 }, { op: 'log', text: '권법가는 곁의 사람들부터 지켜 보라고 했다. {name}이(가) 그 말을 받아들이자 직접 주먹을 가르치기 시작했다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '지금 곁의 사람들과 함께 자라겠다', '권법가에게 인사하고 곁의 사람들에게 돌아갔다. 수련장은 뒤에 남았다.'),
    ],
  }),
  fortune('fortune_drifting_ship', 'freedom', {
    speaker: 'hero',
    title: '떠도는 배', body: '주인 없는 작은 배 한 척이 {island} 앞바다를 떠돈다. 돛에는 아무도 모르는 바닷길이 그려져 있다.',
    doors: [
      { label: '바다가 보낸 배를 받는다', hint: '아무도 모르는 바닷길이 열린다', values: { freedom: D },
        fx: [{ op: 'flag', id: 'secretRoute' }, { op: 'base', key: 'spd', add: 3 }, { op: 'base', key: 'luk', add: 3 },
             { op: 'log', text: '돛에 그려진 바닷길을 따라 아무도 가 보지 못한 물길을 건넜다.', weight: 'heavy' }] },
      decline('배를 받지 않는다', '배는 물결을 따라 멀어진다', '돛줄을 잡지 않았다. 주인 없는 배는 물결을 따라 멀어졌다.'),
    ],
  }),
  fortune('fortune_kings_aura', 'dominion', {
    speaker: 'hero',
    title: '사지에서 깨어난 기운', body: '포위당해 끝장이라고 생각한 순간, {name}의 안에서 무언가가 터져 나왔다. 둘러싼 자들이 하나둘 쓰러진다.',
    doors: [
      { label: '깨어난 기운을 받는다', hint: '한번 깨어난 기운은 사람을 바꾼다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'haki:conqueror' }, { op: 'tier', branch: 'conqueror', to: 2 }, { op: 'fame', add: 100 }, { op: 'log', text: '쓰러진 포위망 사이로 {name}은(는) 걸어 나왔다. 살아남은 자들은 그날 터져 나온 기운을 다른 항구에도 떠들고 다녔다.', weight: 'heavy' }] },
      decline('그 기운을 받지 않는다', '기운을 눌러 삼키고 다시는 꺼내지 않는다', '몸속에서 솟던 기운을 가라앉혔다. 손끝의 떨림도 차츰 멎었다.'),
    ],
  }),
  fortune('fortune_wind_elder', 'peace', {
    speaker: { relation: '바람의 노인' },
    title: '바람의 노인', body: '외딴 섬의 오두막에서 바람 소리만 듣고 사는 노인이 {name}을(를) 불러 앉힌다.',
    doors: [
      { label: '노인의 가르침을 받는다', hint: '보이지 않는 것을 보게 된다. 서두르지 않는 법을 배운다', values: { peace: D },
        fx: [{ op: 'flag', id: 'haki:observation' }, { op: 'tier', branch: 'observation', to: 1 }, { op: 'log', text: '노인은 눈을 감고 바람의 방향부터 맞혀 보라고 했다. {name}은(는) 며칠을 틀린 끝에 첫 답을 맞혔고, 노인은 정식으로 가르치기 시작했다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '바람 소리는 혼자서도 들을 수 있다', '스승의 제안을 돌려보내고 혼자 바람 소리를 들었다.'),
    ],
  }),

  fortune('fortune_haki_unknown', 'dominion', {
    when: [{ c: 'age', min: 10, max: 15 }],
    speaker: { relation: '신원미상의 고수' },
    title: '길 위의 고수', body: '사람 발길이 드문 길목에서 만난 노인이 {name}의 움직임을 한참 바라본다. 그가 말하는 힘은 근육이나 기술만으로 얻는 것이 아니라고 한다.',
    doors: [
      { label: '몸을 두르는 기운의 가르침을 받는다', hint: '손끝에서부터 단단한 힘을 깨운다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 1 }, { op: 'log', text: '노인은 돌덩이를 쥐여 주고 손바닥을 펴 보라고 했다. 한참 뒤 돌 표면에 금이 갔다.', weight: 'heavy' }] },
      { label: '주변의 기척을 읽는 가르침을 받는다', hint: '눈을 감고도 움직임을 알아차린다', values: { inquiry: D },
        fx: [{ op: 'flag', id: 'haki:observation' }, { op: 'tier', branch: 'observation', to: 1 }, { op: 'log', text: '노인은 눈을 감으라고 했다. 발밑의 자갈이 구르는 소리만으로 다가오는 방향을 짚을 때까지 자리를 뜨지 않았다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '아직은 제 길을 걷고 싶다', '노인은 더 붙잡지 않았다. 길모퉁이를 돌아섰을 때는 이미 발소리가 들리지 않았다.'),
    ],
  }),
  fortune('fortune_haki_hyogoro', 'justice', {
    when: [{ c: 'age', min: 10 }, { c: 'island', is: ['와노쿠니'] }],
    speaker: { relation: '꽃의 효고로' },
    title: '꽃의 효고로', body: '와노쿠니의 감옥과 뒷골목에서 이름을 숨기고 살아온 노인이 {name}의 주먹을 살핀다. 힘으로 누르는 법이 아니라, 몸 안쪽으로 기운을 흘려보내는 법을 보여 주겠다고 한다.',
    doors: [
      { label: '류오의 가르침을 받는다', hint: '무장색의 기운을 몸 안쪽으로 흘리는 법', values: { justice: D },
        fx: [{ op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 1 }, { op: 'log', text: '효고로는 손바닥을 펴고 기운을 밀어내 보라고 했다. 처음에는 아무 일도 없었지만, 며칠 뒤 바위 표면이 안쪽에서부터 갈라졌다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '지금은 다른 일을 먼저 끝내야 한다', '효고로는 고개를 끄덕였다. 다시 만날 때까지 그 가르침은 남겨 두겠다고 했다.'),
    ],
  }),
  fortune('fortune_haki_rayleigh', 'freedom', {
    when: [{ c: 'age', min: 10 }, { c: 'island', is: ['샤본디 제도'] }],
    speaker: { relation: '명왕 레일리' },
    title: '명왕의 짧은 가르침', body: '샤본디 제도의 술집에서 은발의 노인이 {name}을(를) 불러 세운다. 세상에는 눈에 보이는 힘 말고도 사람마다 지닌 기운이 있다고 한다.',
    doors: [
      { label: '몸을 두르는 힘의 가르침을 받는다', hint: '무장색의 첫 감각', values: { ambition: D },
        fx: [{ op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 1 }, { op: 'log', text: '레일리는 주먹을 내밀라고 했다. 손등에 닿은 손가락 하나를 밀어내지 못한 뒤에야, 보이지 않는 힘을 몸에 두르는 법을 알았다.', weight: 'heavy' }] },
      { label: '기척을 읽는 힘의 가르침을 받는다', hint: '견문색의 첫 감각', values: { inquiry: D },
        fx: [{ op: 'flag', id: 'haki:observation' }, { op: 'tier', branch: 'observation', to: 1 }, { op: 'log', text: '레일리는 눈을 감고 술집 안의 사람 수를 맞혀 보라고 했다. 몇 번을 틀린 끝에 발소리와 숨소리가 하나씩 구분되기 시작했다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '지금은 제 힘으로 나아가고 싶다', '레일리는 웃으며 술잔을 내려놓았다. 바다에서 다시 만나면 그때는 다른 이야기를 하자고 했다.'),
    ],
  }),
  fortune('fortune_haki_mihawk', 'ambition', {
    when: [{ c: 'age', min: 17 }, { c: 'dream', has: true, is: ['bestSword'] }],
    speaker: { canon: 'mihawk' },
    title: '검은 칼날 아래', body: '매의 눈 미호크가 {name}의 검을 바라본다. 칼끝만 좇아서는 상대의 움직임을 모두 읽을 수 없다며, 검을 거두고 마주 서라고 한다.',
    doors: [
      { label: '무장색으로 칼날을 두르는 가르침을 받는다', hint: '검을 다루는 힘을 한 단계 끌어올린다', values: { ambition: D },
        fx: [{ op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 1 }, { op: 'log', text: '미호크는 검을 뽑지 않았다. 손등으로 날아드는 목검을 막아 보라는 말뿐이었다. 몇 번을 놓친 뒤에야 칼자루를 쥔 손에 기운이 맺혔다.', weight: 'heavy' }] },
      { label: '상대의 움직임을 읽는 가르침을 받는다', hint: '견문색으로 검의 궤적을 읽는다', values: { inquiry: D },
        fx: [{ op: 'flag', id: 'haki:observation' }, { op: 'tier', branch: 'observation', to: 1 }, { op: 'log', text: '미호크는 검을 천천히 들었다. 칼끝이 움직이기 전 어깨와 발이 먼저 움직인다는 사실을 몸으로 익히게 했다.', weight: 'heavy' }] },
      decline('가르침을 받지 않는다', '제 검은 제 손으로 완성하겠다', '미호크는 더 말하지 않았다. 검은 칼날이 다시 천천히 검집으로 들어갔다.'),
    ],
  }),
  // ---------------------------------------------------------------- 과제 11: 가치관마다 둘 (서른여섯 이후에도 온다)
  fortune('fortune_wronged_officer', 'justice', {
    speaker: { relation: '누명 쓴 장교의 후손' },
    title: '가라앉은 증거', body: '오래전 누명을 쓰고 처형된 해군 장교의 후손이 {name}을(를) 찾아왔다. 바다에 가라앉은 전함에 그 일을 뒤집을 장부가 있다고, 옳은 일에서 물러선 적 없는 사람에게만 부탁한다고 한다.',
    doors: [
      { label: '장부를 건져 달라는 부탁을 받는다', hint: '세상이 묻어 둔 일을 바로잡는다. 그 장교가 남긴 검술 비망록도 함께 나온다', values: { justice: D },
        fx: [{ op: 'fame', add: 40 }, { op: 'tier', branch: 'sword', to: LEAP }, { op: 'timeline', text: '누명 쓴 장교의 장부를 건져 세상에 알렸다' }, { op: 'log', text: '가라앉은 전함에서 장부와 검술 비망록을 함께 건졌다. 장부가 공개되자 누명이 벗겨졌고, {name}은(는) 비망록의 검을 익혔다.', weight: 'heavy' }] },
      decline('부탁을 받지 않는다', '가라앉은 것은 가라앉은 대로 둔다', '가라앉은 물건을 찾으러 가지 않겠다고 말했다. 부탁한 사람은 한동안 바다를 바라보았다.'),
    ],
  }),
  fortune('fortune_legend_duel', 'ambition', {
    speaker: { relation: '전설의 검객' },
    title: '정점의 초대', body: '세상에 이름이 자자한 늙은 검객이 {name}의 승부 기록을 품에 넣고 찾아왔다. 제 검을 완성할 마지막 상대를 찾고 있다고, 이기든 지든 가진 것을 모두 보여 주겠다고 한다.',
    doors: [
      { label: '검객의 초대를 받는다', hint: '사흘 밤낮을 겨루며 정점의 검을 몸으로 익힌다. 돈으로는 들일 수 없는 스승이다', values: { ambition: D },
        fx: [{ op: 'learnTechnique', teacher: '전설의 검객', branch: 'sword', name: '간격을 지배하는 검격', add: 25 }, { op: 'hp', add: -20 }, { op: 'log', text: '사흘 밤낮의 승부 끝에 {name}은(는) 상처투성이로 검을 내렸다. 늙은 검객은 그제야 자신의 마지막 제자로 인정했다.', weight: 'heavy' }] },
      decline('초대를 받지 않는다', '제 검은 제가 완성하겠다고 답한다', '검을 거두고 혼자 수련하겠다고 답했다. 상대는 더 권하지 않았다.'),
    ],
  }),
  fortune('fortune_troupe', 'romance', {
    speaker: { relation: '유랑 악단의 단장' },
    title: '꿈의 무대', body: '오래 사라졌던 유랑 악단의 단장이 {name}을(를) 찾아왔다. 바다를 떠돌며 꿈을 좇던 사람들의 노래를 모으고 있다며, 마지막 노래의 주인공이 되어 달라고 한다.',
    doors: [
      { label: '노래의 주인공 자리를 받는다', hint: '악단과 한 철을 떠돈다. 노래가 온 바다에 퍼지고, 이상하게 운이 따른다', values: { romance: D },
        fx: [{ op: 'fame', add: 60 }, { op: 'base', key: 'luk', add: 4 }, { op: 'base', key: 'wil', add: 2 }, { op: 'timeline', text: '유랑 악단의 노래 속 주인공이 되었다' }, { op: 'log', text: '악단을 따라 여러 항구의 무대에 올랐다. {name}의 이야기를 담은 노래가 바다를 건너가자 처음 보는 이도 이름을 불렀다.', weight: 'heavy' }] },
      decline('주인공 자리를 받지 않는다', '제 이야기는 아직 끝나지 않았다', '내 이야기는 아직 끝나지 않았다고 말했다. 건네받을 뻔한 자리는 비워 두었다.'),
    ],
  }),
  fortune('fortune_oath_witness', 'loyalty', {
    speaker: { relation: '옛 전우의 후손' },
    title: '맹세의 증인', body: '오래전 함께 싸운 전우의 후손들이 {name}을(를) 섬 하나로 안내했다. 전우가 남긴 수련장이 있다고, 약속을 끝까지 지킨 사람에게만 열어 주라는 유언이 있었다고 한다.',
    doors: [
      { label: '수련장의 열쇠를 받는다', hint: '전우가 평생 다듬은 기운을 물려받는다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'haki:armament' }, { op: 'tier', branch: 'armament', to: 1 }, { op: 'base', key: 'vit', add: 2 }, { op: 'log', text: '후손이 열쇠로 수련장을 열어 주었다. 전우가 남긴 수련법을 따라 기운을 두르는 법을 익히자, 버티는 힘까지 달라졌다.', weight: 'heavy' }] },
      decline('열쇠를 받지 않는다', '그 수련장은 후손들의 것으로 둔다', '수련장의 열쇠를 돌려주었다. 그곳은 주인의 후손들이 지키게 됐다.'),
    ],
  }),
  fortune('fortune_unnamed_route', 'freedom', {
    speaker: { relation: '정체 모를 항해사' },
    title: '기록되지 않은 항로', body: '어느 깃발 아래에도 없는 항해사가 {name}이(가) 탄 배에 올라 해도 한 장을 펼친다. 해군의 눈도 사황의 손도 닿지 않는 항로라고, 누구에게도 매이지 않는 사람에게만 준다고 한다.',
    doors: [
      { label: '해도를 받는다', hint: '바다를 읽는 눈이 단번에 트인다. 쫓는 자들을 따돌릴 수 있다', values: { freedom: D },
        fx: [{ op: 'flag', id: 'secretRoute' }, { op: 'base', key: 'spd', add: 2 }, { op: 'log', text: '항해사의 해도를 따라 첫 물길을 건넜다. 눈에 보이지 않던 조류의 갈림길이 읽히자 배의 진로를 빠르게 바로잡을 수 있었다.', weight: 'heavy' }] },
      decline('해도를 받지 않는다', '길은 제 눈으로 찾겠다', '해도를 접어 돌려주었다. 다음 물길은 제 눈으로 찾기로 했다.'),
    ],
  }),
  fortune('fortune_kings_heir', 'dominion', {
    when: [{ c: 'secret', known: false }],
    speaker: { relation: '옛 왕가의 가신' },
    title: '왕의 유산', body: '늙은 가신이 {name} 앞에 무릎을 꿇었다. 바다를 다스렸던 옛 왕가의 피가 흐른다고, 그 증표를 오래 찾아왔다고 한다. 가신이 낡은 문장을 내민다.',
    doors: [
      { label: '옛 왕가의 증표를 받는다', hint: '잃어버린 성을 알게 된다. 그 피를 따르는 자들이 생긴다', values: { dominion: D },
        fx: [{ op: 'reveal' }, { op: 'fame', add: 50 }, { op: 'person', kind: 'ally', relation: '옛 왕가의 가신', age: { older: 30 } }, { op: 'timeline', text: '옛 왕가의 피를 이었음을 알았다' }, { op: 'log', text: '가신이 낡은 문장을 {name}의 손에 쥐여 주었다. 감춰진 성을 듣자 가신은 새 주인을 모시겠다며 곁에 남았다.', weight: 'heavy' }] },
      decline('내력을 받지 않는다', '피보다 제가 걸어온 길이 제 이름이다', '집안의 내력을 듣지 않겠다고 말했다. 지금까지 걸어온 길만 마음에 남겼다.'),
    ],
  }),
  fortune('fortune_quiet_island', 'peace', {
    speaker: { relation: '고요한 섬의 촌장' },
    title: '고요한 섬', body: '전쟁도 약탈도 비켜 간 작은 섬의 사람들이 {name}에게만 그 섬의 자리를 내주겠다고 한다. 그곳에서는 사람이 오래 산다고, 바다를 다툼 없이 바라본 사람에게만 허락한다고.',
    doors: [
      { label: '고요한 섬에 자리를 받는다', hint: '몸과 마음이 다시 젊어진다. 바깥의 다툼에서 멀어진다', values: { peace: D },
        fx: [{ op: 'hp', add: 50 }, { op: 'base', key: 'vit', add: 3 }, { op: 'base', key: 'wil', add: 2 }, { op: 'flag', id: 'quietIsland' }, { op: 'timeline', text: '고요한 섬에 자리를 받았다' }, { op: 'log', text: '촌장이 섬의 빈집 열쇠를 내주었다. 며칠을 쉬자 오래 쌓인 상처가 가라앉았고, {name}은(는) 오랜만에 편히 잠들었다.', weight: 'heavy' }] },
      decline('섬의 자리를 받지 않는다', '고요함은 제 안에서 찾겠다', '섬에 남으라는 제안을 거절했다. 고요함은 다른 곳에서도 찾을 수 있다고 답했다.'),
    ],
  }),
];
