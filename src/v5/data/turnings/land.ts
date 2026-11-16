// 뭍의 삶 (과제 9): 시민 · 조선공 · 닻을 내린 사람(정착)에게 오는 전환점. 로그타운에서 태어난 사람에게 열린다.
// 일터를 얻고 가게를 열고, 조선소의 도제가 독립하고, 마을의 일에 나서고, 해적이나 해군이 마을에 온다.
// 뭍에 눌러앉은 뒤의 삼십 년이 비지 않게, 정착의 사건은 예순 넘어까지 열린다. 다시 바다로 나가는 계기도 있다.
// 다른 처지로 건너가는 전환점에는 standingYears를 둔다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
// 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { age, at, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const years = (min: number): Cond => ({ c: 'standingYears', min });
const has = (id: string): Cond => ({ c: 'flag', id, has: true });
const not = (id: string): Cond => ({ c: 'flag', id, has: false });
const SHOP_COST = 100000;
/** 뭍에 사는 사람: 시민, 조선공, 닻을 내린 사람 */
const LANDED = st('civil', 'shipwright', 'settled');
const TOWNSFOLK = st('civil', 'settled');

const CIVIL: Turning[] = [
  // ---------------------------------------------------------------- 일터와 가게
  {
    id: 'land_first_job', kind: 'door', when: at(age(16, 26), st('civil')),
    weight: 7, repeat: 'once', speaker: { relation: '부두 창고의 관리인' },
    title: '창고의 장부', body: '{island} 부두 창고에 일자리를 얻은 지 석 달. 관리인이 {name}에게 장부를 맡기더니, 밤에 들어오는 상자들은 "말린 생선"으로 적으라고 한다. 상자에서는 화약 냄새가 난다.',
    doors: [
      { label: '상자에 든 것을 그대로 장부에 적는다', hint: '창고에서 쫓겨나고 밀린 품삯도 못 받는다. 부두 사람들은 {name}을(를) 믿게 된다', values: { justice: D },
        fx: [{ op: 'money', add: -3000 }, { op: 'flag', id: 'dockTrust' }, { op: 'log', text: '장부를 고쳐 쓴 다음 날, 창고 문 앞에 {name}의 짐이 내던져져 있었다.', weight: 'heavy' }] },
      { label: '입을 다무는 대신 몫을 더 달라고 한다', hint: '품삯이 두 배가 되고, 장부에 {name}의 글씨가 남는다', values: { greed: D }, danger: true,
        fx: [{ op: 'money', add: 22000 }, { op: 'flag', id: 'smuggleLedger' },
             { op: 'chance', p: 0.2, then: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '해군이 창고를 덮쳤다. 장부의 글씨를 따라 {name}도 끌려갔다.', weight: 'heavy' },
                                            { op: 'timeline', text: '밀수 장부를 쓴 죄로 갇혔다' }] }] },
      { label: '시키는 대로 적고 모르는 척한다', hint: '일자리는 지키고, 밤마다 화약 냄새가 꿈에 나온다', fx: [{ op: 'money', add: 5000 }, { op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'land_shop_open', kind: 'door', when: at(age(18, 50), TOWNSFOLK, not('shop')),
    weight: 6, repeat: 'once', speaker: { relation: '빈 점포의 주인' },
    title: '시장 끝의 빈 점포', body: '{island} 시장 끝자락에 오래 비어 있던 점포가 나왔다. 주인은 보증금을 깎아 주는 대신 이문의 절반을 해마다 떼어 가겠다고 한다.',
    doors: [
      { label: '주인의 조건을 받아들이고 간판을 단다', hint: '가게가 생기고, 번 돈의 절반은 해마다 남의 주머니로 간다', values: { ambition: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'standing', to: 'settled' }, { op: 'flag', id: 'shop' }, { op: 'flag', id: 'shopShared' },
             { op: 'timeline', text: '{island} 시장 끝에 가게를 열었다' }] },
      { label: '모은 돈을 다 털어 점포를 통째로 산다', hint: '빈털터리가 되지만 누구에게도 매이지 않는다', when: [{ c: 'money', min: SHOP_COST }], values: { freedom: D },
        fx: [{ op: 'money', add: -SHOP_COST }, { op: 'standing', to: 'settled' }, { op: 'flag', id: 'shop' }, { op: 'timeline', text: '{island}에 제 가게를 샀다' }] },
      { label: '점포를 빌려 동네 아이들의 글방으로 쓴다', hint: '돈은 나가기만 하고, 아이들이 글을 깨친다', values: { freedom: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '글방에 다니던 아이', age: { younger: 15 } }] },
    ],
  },
  {
    id: 'land_partner_theft', kind: 'door', when: at(age(20, 60), TOWNSFOLK, has('shop')),
    weight: 5, repeat: 'once', speaker: { relation: '함께 장사하던 사람' },
    title: '빈 금고', body: '가게의 금고가 비었다. 함께 장사를 꾸려 온 사람이 노름빚에 몰려 돈을 빼 갔다고 털어놓는다. 거래처에 갚을 외상값이 다음 달이다.',
    doors: [
      { label: '해군 초소에 넘겨 죗값을 치르게 한다', hint: '돈의 일부는 돌아오고, 그 사람의 식구들이 {name}을(를) 원망한다', values: { justice: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'person', kind: 'rival', relation: '감옥에 보낸 옛 동업자' }] },
      { label: '한 번은 눈감아 주고 함께 빚을 메운다', hint: '몇 해는 허리띠를 졸라맨다. 두 번째는 없다고 못 박는다', values: { loyalty: D },
        fx: [{ op: 'money', add: -40000 }, { op: 'hardship', add: 2 }, { op: 'person', kind: 'ally', relation: '다시 믿어 준 동업자' }] },
      { label: '가게를 접고 남은 물건을 팔아 외상을 갚는다', hint: '빚은 사라지고 간판도 사라진다', values: { freedom: D },
        fx: [{ op: 'unflag', id: 'shop' }, { op: 'standing', to: 'civil' }, { op: 'money', add: -5000 },
             { op: 'log', text: '간판을 내리던 날, {name}은(는) 의외로 홀가분했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'land_big_firm', kind: 'door', when: at(age(25, 65), TOWNSFOLK, has('shop'), years(3)),
    weight: 4, repeat: 'once', speaker: { relation: '큰 상회의 지배인' },
    title: '큰 상회의 제안', body: '바다 건너까지 가게를 늘리는 큰 상회의 지배인이 찾아왔다. {name}의 가게를 통째로 사겠다고 한다. 팔지 않으면 길 건너에 더 큰 가게를 내겠다는 말도 덧붙인다.',
    doors: [
      { label: '값을 올려 받고 가게를 판다', hint: '큰돈이 들어오고, 손때 묻은 가게는 남의 이름이 된다', values: { greed: D },
        fx: [{ op: 'money', add: 225000 }, { op: 'unflag', id: 'shop' }, { op: 'standing', to: 'civil' }, { op: 'timeline', text: '가게를 큰 상회에 팔았다' }] },
      { label: '단골들을 믿고 버틴다', hint: '몇 해 동안 값싸게 파는 싸움을 견뎌야 한다', values: { loyalty: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'hardship', add: 3 },
             { op: 'chance', p: 0.5, then: [{ op: 'log', text: '길 건너의 큰 가게가 두 해 만에 문을 닫았다. 단골들은 끝내 떠나지 않았다.', weight: 'heavy' }],
               else: [{ op: 'unflag', id: 'shop' }, { op: 'standing', to: 'civil' }, { op: 'log', text: '버티다 버티다 끝내 간판을 내렸다.', weight: 'heavy' }] }] },
      { label: '판 돈으로 낡은 배 한 척을 사서 바다 장사를 시작한다', hint: '가게 대신 배가 생긴다. 바다는 가게보다 거칠다', values: { romance: D }, danger: true,
        fx: [{ op: 'money', add: 60000 }, { op: 'unflag', id: 'shop' }, { op: 'flag', id: 'ship' }, { op: 'standing', to: 'civil' },
             { op: 'timeline', text: '가게를 팔아 배를 사고 바다 장사를 시작했다' }] },
    ],
  },

  // ---------------------------------------------------------------- 마을의 일
  {
    id: 'land_village_head', kind: 'door', when: at(age(30, 68), TOWNSFOLK, years(4)),
    weight: 4, repeat: 'once', speaker: { relation: '마을의 어른들' },
    title: '항구를 넓히는 일', body: '{island}의 촌장이 상인들과 손잡고 항구를 넓히려 한다. 어민들의 갯벌이 메워진다. 갈라진 마을 사람들이 {name}에게 촌장 자리에 나서 달라고 찾아왔다.',
    doors: [
      { label: '촌장 자리에 나선다', hint: '마을의 일을 손에 쥐고, 마을의 원망도 함께 쥔다', values: { dominion: D }, 
        fx: [{ op: 'fame', add: 2 }, { op: 'flag', id: 'villageHead' }, { op: 'person', kind: 'rival', relation: '자리를 잃은 옛 촌장' },
             { op: 'timeline', text: '{island}의 촌장이 되었다' }] },
      { label: '자리는 사양하고 갯벌을 지키는 어민들 앞에 선다', hint: '상인들의 장사에 끼지 못하게 된다', values: { justice: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'person', kind: 'ally', relation: '갯벌을 지킨 어민' }, { op: 'hardship', add: 1 }] },
      { label: '두 쪽 사이에 끼지 않고 제 일만 한다', hint: '양쪽 모두 {name}을(를) 섭섭해하지만, 한 해 동안 번 돈은 고스란히 남는다', values: { peace: D }, closes: true, fx: [{ op: 'money', add: 12000 }] },
    ],
  },
  {
    id: 'land_hide_runaway', kind: 'door', when: at(age(18, 65), LANDED),
    weight: 5, repeat: 'once', speaker: { relation: '숨어든 젊은 선원' },
    title: '창고 뒤의 사내', body: '{island}의 창고 뒤에 젊은 사내가 숨어 있었다. 해적에게 끌려가 일하다 도망쳤다고 한다. 항구 게시판에는 그 얼굴이 해적 일당으로 실려 있고, 넘기는 사람에게 상금을 준다고 적혀 있다.',
    doors: [
      { label: '밤배에 태워 멀리 보내 준다', hint: '들키면 해적을 숨긴 사람이 된다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'money', add: -5000 },
             { op: 'chance', p: 0.2, then: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '밤배가 떠나는 걸 본 사람이 있었다. {name}은(는) 해적을 빼돌린 죄로 끌려갔다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '밤배의 등불이 수평선 너머로 사라졌다. 사내는 끝까지 고개를 숙였다.', weight: 'heavy' }] }] },
      { label: '해군에 넘기고 상금을 받는다', hint: '돈이 생기고, 사내의 말이 참이었는지는 끝내 모른다', values: { greed: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'hardship', add: 2 }] },
      { label: '해군 앞에 함께 서서 사내가 끌려간 사연을 증언한다', hint: '사내는 풀려날 수도 있고, 증언한 {name}도 의심을 산다', values: { justice: D },
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'fame', add: 2 }, { op: 'person', kind: 'ally', relation: '누명을 벗은 젊은 선원' }],
               else: [{ op: 'flag', id: 'marineSuspect' }, { op: 'hardship', add: 3 }, { op: 'log', text: '증언은 받아들여지지 않았다. 해군의 장부에 {name}의 이름이 올랐다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'land_famine', kind: 'door', when: at(age(18, 70), TOWNSFOLK),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '빈 곡물 창고', body: '두 해째 흉년이다. {island}의 곡물 창고가 바닥을 드러냈는데, 곡물상 하나만 창고를 걸어 잠그고 값을 열 배로 부른다. 부두에서 아이들이 쓰러진다.',
    doors: [
      { label: '제 곳간을 열어 이웃에게 나눈다', hint: '한 해 먹을 것을 내놓는다', values: { romance: D }, mark: 'fellowship',
        fx: [{ op: 'money', add: -25000 }, { op: 'hp', add: -8 }, { op: 'person', kind: 'ally', relation: '굶주린 해를 함께 넘긴 이웃' }] },
      { label: '사람들을 이끌고 곡물상의 창고 문을 부순다', hint: '모두 배를 채우고, 앞장선 사람은 붙잡힐 수 있다', values: { dominion: D }, danger: true,
        fx: [{ op: 'fame', add: 3 }, { op: 'chance', p: 0.3, then: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '창고 문을 부순 우두머리로 {name}이(가) 끌려갔다. 이웃들이 감옥 담 너머로 빵을 던져 주었다.', weight: 'heavy' }],
               else: [{ op: 'person', kind: 'rival', relation: '창고를 털린 곡물상' }] }] },
      { label: '남은 돈으로 곡식을 사들였다가 봄에 되판다', hint: '값이 오르면 이웃들이 머리를 숙이고 곡식을 산다. 봄이 일찍 오면 산 값만 날린다', values: { greed: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'chance', p: 0.65, then: [{ op: 'money', add: 60000 }, { op: 'log', text: '봄까지 곡식값이 올랐다. 이웃들이 고개를 숙이고 곡식을 사 갔다.', weight: 'light' }], else: [{ op: 'log', text: '봄비가 일찍 와 곡식값이 내렸다. 사 둔 곡식은 헐값에 넘겼다.', weight: 'light' }] }, { op: 'hardship', add: 2 }, { op: 'flag', id: 'famineProfit' }] },
    ],
  },
  {
    id: 'land_new_tax', kind: 'door', when: at(age(20, 65), TOWNSFOLK),
    weight: 4, repeat: 'once', speaker: { relation: '왕국의 세리' },
    title: '새 통행세', body: '바다 건너 왕국의 세리가 {island} 항구에 새 통행세와 가게세를 붙였다. 기한을 넘긴 집에서는 살림을 들어낸다. 상인회가 함께 버티자고 사람을 모은다.',
    doors: [
      { label: '상인회의 맨 앞에 서서 세리와 맞선다', hint: '세금이 줄어들 수도 있고, 본보기로 {name}의 살림부터 들려 나갈 수도 있다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 3 }, { op: 'log', text: '세리는 결국 가게세를 거두어들였다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -30000 }, { op: 'log', text: '세리는 {name}의 살림부터 들어냈다.', weight: 'heavy' }] }] },
      { label: '세리에게 뒷돈을 쥐여 주고 장부에서 빠진다', hint: '돈은 덜 나가고, 상인회에서는 배신자가 된다', values: { greed: D },
        fx: [{ op: 'money', add: -8000 }, { op: 'flag', id: 'bribedTaxman' }, { op: 'person', kind: 'rival', relation: '등 돌린 상인회 사람' }] },
      { label: '군말 없이 세금을 낸다', hint: '살림이 빠듯해진다', fx: [{ op: 'money', add: -15000 }] },
    ],
  },
  {
    id: 'land_militia', kind: 'door', when: at(age(18, 60), TOWNSFOLK),
    weight: 4, repeat: 'once', speaker: { relation: '마을의 어른' },
    title: '해적이 온다는 소문', body: '이웃 섬이 해적에게 털렸다는 소식이 {island}에 닿았다. 해군 지부는 사흘 뱃길이다. 마을 어른들이 모여 앉아 누구 하나 먼저 말을 꺼내지 못한다.',
    doors: [
      { label: '자경단을 꾸려 앞장선다', hint: '밤마다 망을 서고, 해적이 오면 맨 앞에서 맞는다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 2 }, { op: 'mastery', branch: 'fist', add: 6 },
             { op: 'person', kind: 'ally', relation: '자경단의 이웃' }, { op: 'flag', id: 'militia' }] },
      { label: '작은 배를 저어 해군 지부에 구원을 청하러 간다', hint: '사흘 밤낮을 노를 젓는다. 돌아오기 전에 해적이 올지도 모른다', values: { justice: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '손바닥이 다 터지도록 노를 저었다. 해군의 군함이 {island} 앞바다에 닻을 내렸다.', weight: 'heavy' }] },
      { label: '해적 두목을 찾아가 마을 대신 담판을 짓는다', hint: '해마다 바칠 몫을 정하고 마을을 지킨다. 해적과 거래한 사람이 된다', values: { dominion: D }, danger: true,
        fx: [{ op: 'money', add: -20000 }, { op: 'flag', id: 'pirateDeal' }, { op: 'fame', add: 1 }] },
    ],
  },
  {
    id: 'land_marine_question', kind: 'door', when: at(age(20, 70), TOWNSFOLK),
    weight: 4, repeat: 'once', speaker: { relation: '해군 대위' },
    title: '해군 대위의 물음', body: '해군 대위가 {island}의 집집을 돌며 해적에게 물을 대 준 사람이 누구냐고 묻는다. {name}은(는) 건넛집 노인이 밤마다 바닷가에 바구니를 내놓는 걸 안다. 노인의 식구 하나가 그 해적선에 있다.',
    doors: [
      { label: '아는 대로 말한다', hint: '대위의 눈에 들고, 건넛집의 불이 꺼진다', values: { greed: D }, 
        fx: [{ op: 'fame', add: 2 }, { op: 'hardship', add: 3 }, { op: 'flag', id: 'informedNeighbor' }] },
      { label: '아무것도 못 봤다고 잡아뗀다', hint: '이웃을 지키고, 대위의 의심을 산다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'marineSuspect' }, { op: 'person', kind: 'ally', relation: '바구니를 내놓던 건넛집 노인', age: { older: 30 } }] },
      { label: '그럴듯한 거짓 소문을 흘려 대위를 다른 섬으로 보낸다', hint: '들키면 해군을 속인 죄를 진다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'chance', p: 0.75, then: [{ op: 'log', text: '군함은 엉뚱한 섬으로 떠났다. 건넛집 노인이 말없이 생선 한 마리를 놓고 갔다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '소문의 출처가 드러났다. 해군을 속인 죄로 {name}이(가) 끌려갔다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'land_wreck_salvage', kind: 'door', when: at(age(16, 65), LANDED),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '폭풍 뒤의 바닷가', body: '밤새 폭풍이 지나간 {island}의 바닷가에 부서진 상선의 짐짝들이 밀려와 있다. 마을 사람들이 앞다투어 주워 간다. 먼바다에는 아직 돛대 하나가 기울어 떠 있다.',
    doors: [
      { label: '작은 배를 띄워 돛대에 매달린 사람을 찾으러 간다', hint: '파도가 아직 높다. 짐짝은 남들이 다 가져간다', values: { peace: D }, danger: true,
        fx: [{ op: 'hp', add: -12 }, { op: 'chance', p: 0.6, then: [{ op: 'person', kind: 'ally', relation: '폭풍에서 건진 상선의 선원' }, { op: 'fame', add: 2 }],
               else: [{ op: 'hardship', add: 2 }, { op: 'log', text: '돛대에 닿았을 때는 아무도 없었다.', weight: 'heavy' }] }] },
      { label: '값나가는 짐짝부터 집으로 나른다', hint: '살림이 펴진다', values: { greed: D }, fx: [{ op: 'money', add: 27000 }] },
      { label: '짐짝에 찍힌 상회의 표지를 적어 두었다가 주인에게 돌려준다', hint: '주운 것은 하나도 갖지 않는다. 상회가 그 이름을 기억한다', values: { justice: D },
        fx: [{ op: 'fame', add: 1 }, { op: 'flag', id: 'returnedCargo' }, { op: 'person', kind: 'ally', relation: '짐을 돌려받은 상회 주인' }] },
    ],
  },
  {
    id: 'land_back_to_sea', kind: 'door', when: at(age(22, 55), LANDED, years(3)),
    weight: 4, repeat: 'once', speaker: { relation: '어릴 적 동무' },
    title: '항구에 들어온 배', body: '{island} 항구에 낯익은 깃발을 단 배가 들어왔다. 갑판에서 손을 흔드는 건 어릴 적 함께 바닷가를 뛰던 동무다. 사람 하나가 모자란다며 {name}에게 같이 가자고 한다.',
    doors: [
      { label: '짐을 꾸려 그 배에 오른다', hint: '뭍의 삶을 접고 해적의 깃발 아래로 간다', values: { freedom: D }, danger: true,
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'unflag', id: 'shop' }, { op: 'person', kind: 'crew', relation: '다시 만난 어릴 적 동무' },
             { op: 'timeline', text: '어릴 적 동무의 배를 타고 다시 바다로 나갔다' }] },
      { label: '배를 손봐 주고 웃으며 배웅한다', hint: '뭍에 남는다. 그 배는 다시 오지 않는다', values: { peace: D }, closes: true,
        fx: [{ op: 'money', add: -3000 }, { op: 'log', text: '배가 떠나는 걸 언덕 위에서 오래 지켜보았다.', weight: 'light' }] },
      { label: '그 배가 해적질하는 걸 알고 해군에 알린다', hint: '동무를 잃고, 해군의 신임을 얻는다', values: { justice: D },
        fx: [{ op: 'fame', add: 3 }, { op: 'person', kind: 'rival', relation: '등 돌린 어릴 적 동무' }, { op: 'hardship', add: 2 }] },
    ],
  },
];

const SHIPWRIGHT: Turning[] = [
  // ---------------------------------------------------------------- 조선소
  {
    id: 'sw_apprentice_wage', kind: 'door', when: at(age(15, 30), st('shipwright')),
    weight: 7, repeat: 'once', speaker: { relation: '조선소의 목수장' },
    title: '도제의 셈', body: '조선소에 들어온 지 한 해. 목수장은 도제는 다섯 해 동안 품삯이 없다고, 대신 밥과 잠자리와 기술을 준다고 한다. 이웃 조선소는 첫해부터 품삯을 준다는 소문이 들린다.',
    doors: [
      { label: '다섯 해를 채우겠다고 손을 내민다', hint: '빈 주머니로 대패질만 한다. 손이 기술을 기억한다', values: { loyalty: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'yardBound' }] },
      { label: '품삯을 주는 이웃 조선소로 옮긴다', hint: '당장 돈이 들어오고, 목수장은 다시는 {name}을(를) 받지 않는다', values: { ambition: D },
        fx: [{ op: 'money', add: 12000 }, { op: 'person', kind: 'rival', relation: '등 돌린 옛 목수장', age: { older: 30 } }] },
      { label: '밤마다 버려진 목재로 제 손으로 작은 배를 짓는다', hint: '잠을 줄인다. 들키면 목재 도둑이 된다', values: { inquiry: D },
        fx: [{ op: 'hp', add: -8 }, { op: 'chance', p: 0.7, then: [{ op: 'flag', id: 'smallBoat' }, { op: 'log', text: '첫 배가 물에 떴다. 작고 삐뚤었지만 가라앉지 않았다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -5000 }, { op: 'log', text: '목재를 빼돌린 게 들켜 한 달 치 밥값을 물었다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'sw_secret_joint', kind: 'door', when: at(age(18, 45), st('shipwright'), years(3)),
    weight: 5, repeat: 'once', speaker: { relation: '늙은 목수장' },
    title: '한 사람에게만', body: '늙은 목수장이 평생 감춰 온 선체 이음법을 물려주겠다고 한다. 단 한 사람에게만. 함께 들어온 같은 해 도제도 그 자리를 바라고 있다. 그는 고향에 갚을 빚이 있다.',
    doors: [
      { label: '내가 받겠다고 나선다', hint: '평생의 기술을 얻고, 같은 해 도제와는 사이가 틀어진다', values: { ambition: D },
        fx: [{ op: 'flag', id: 'masterJoint' }, { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'rival', relation: '이음법을 놓친 같은 해 도제' }] },
      { label: '빚이 있는 쪽에게 양보한다', hint: '기술은 남의 것이 되고, 평생의 벗이 생긴다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '이음법을 물려받은 벗' }, { op: 'hardship', add: 1 }] },
      { label: '목수장이 잠든 밤에 이음매를 뜯어 원리를 알아낸다', hint: '누구의 허락도 없이 깨친다. 들키면 조선소에서 쫓겨난다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 2 },
             { op: 'chance', p: 0.4, then: [{ op: 'standing', to: 'civil' }, { op: 'log', text: '뜯어 놓은 이음매를 목수장이 먼저 보았다. 그날로 조선소에서 쫓겨났다.', weight: 'heavy' }]}] },
    ],
  },
  {
    id: 'sw_independence', kind: 'door', when: at(age(22, 50), st('shipwright'), years(4), not('ownYard')),
    weight: 5, repeat: 'once', speaker: { relation: '조선소 주인' },
    title: '제 망치를 들 때', body: '이제 혼자서도 배 한 척을 지을 수 있다. 조선소 주인은 독립을 허락하는 값으로 {name}이(가) 차릴 작업장의 지분 절반을 달라고 한다. 거절하면 이 바다의 목재상들이 거래를 끊을 거라고 한다.',
    doors: [
      { label: '지분을 내주고 작업장을 차린다', hint: '제 간판을 걸지만 이문의 절반은 옛 주인의 것이다', values: { ambition: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'flag', id: 'ownYard' }, { op: 'timeline', text: '{island}에 제 작업장을 차렸다' }] },
      { label: '빈손으로 나와 바닷가 헛간에서 시작한다', hint: '목재를 먼 섬에서 사 와야 한다. 아무에게도 매이지 않는다', values: { freedom: D },
        fx: [{ op: 'money', add: -40000 }, { op: 'hardship', add: 2 }, { op: 'flag', id: 'ownYard' }, { op: 'timeline', text: '바닷가 헛간에서 제 작업장을 시작했다' }] },
      { label: '조선소에 남아 젊은 도제들을 맡는다', hint: '독립은 미루고 반장이 된다', values: { justice: D },
        fx: [{ op: 'money', add: 10000 }, { op: 'person', kind: 'ally', relation: '맡아 기른 도제', age: { younger: 12 } }] },
    ],
  },
  {
    id: 'sw_pirate_order', kind: 'door', when: at(age(18, 60), st('shipwright')),
    weight: 5, repeat: 'once', speaker: { relation: '수배된 해적 선장' },
    title: '밤의 의뢰', body: '현상금이 걸린 해적선이 밤중에 조선소에 들어왔다. 선장이 금화 자루를 내려놓으며, 해군의 군함을 따돌릴 수 있게 배를 고쳐 달라고 한다.',
    doors: [
      { label: '금화를 받고 밤새 배를 고친다', hint: '큰돈이 생기고, 해적을 도운 조선공이 된다', values: { greed: D }, danger: true,
        fx: [{ op: 'money', add: 90000 },
             { op: 'chance', p: 0.25, then: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '그 해적선을 쫓던 해군이 조선소의 장부를 뒤졌다.', weight: 'heavy' }]}] },
      { label: '고치는 척 시간을 끌며 해군에 알린다', hint: '해군은 상을 내리고, 붙잡히지 않은 선원들이 앙갚음을 다짐한다', values: { justice: D },
        fx: [{ op: 'fame', add: 2 }, { op: 'money', add: 10000 }, { op: 'person', kind: 'enemy', relation: '앙갚음을 다짐한 해적' }] },
      { label: '돈은 돌려주고 바다를 달리는 배라며 고쳐 준다', hint: '금화는 받지 않는다. 배를 아는 사람끼리의 일이라고 여긴다', values: { romance: D },
        fx: [{ op: 'flag', id: 'pirateShipwright' }, { op: 'person', kind: 'ally', relation: '배를 고쳐 준 해적 선장' }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'sw_cheap_hull', kind: 'door', when: at(age(20, 60), st('shipwright'), years(2)),
    weight: 5, repeat: 'once', speaker: { relation: '상선의 주인' },
    title: '빼 달라는 보강재', body: '상선 주인이 짓던 배의 값을 깎자며, 선체 안쪽의 보강재를 빼 달라고 한다. 빠진 걸 아는 건 {name}과 주인뿐이다. 그 배에는 선원 서른 명이 탄다.',
    doors: [
      { label: '못 하겠다며 일을 물린다', hint: '계약금을 돌려주고 큰 손님을 잃는다', values: { justice: D }, closes: true,
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'rival', relation: '계약을 물린 상선 주인' }] },
      { label: '시키는 대로 빼고 값을 받는다', hint: '돈은 들어온다. 폭풍이 오면 어떻게 될지는 모른다', values: { greed: D }, 
        fx: [{ op: 'money', add: 45000 },
             { op: 'chance', p: 0.3, then: [{ op: 'hardship', add: 6 }, { op: 'log', text: '그 상선이 폭풍 속에서 갈라졌다는 소식이 들려왔다. {name}은(는) 그날 망치를 들지 못했다.', weight: 'heavy' }]}] },
      { label: '제 돈으로 몰래 보강재를 넣고 주인이 부른 값에 맞춘다', hint: '손해를 보고, 아무도 모르는 사이에 서른 명이 산다', values: { loyalty: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'sw_crushed_hand', kind: 'door', when: at(age(18, 60), st('shipwright')),
    weight: 4, repeat: 'once', speaker: { relation: '다친 목수' },
    title: '목재에 깔린 손', body: '같은 작업대에서 일하던 목수가 쓰러진 목재에 손이 깔렸다. 다시는 대패를 못 쥘 거라고 한다. 조선소 주인은 치료비 대신 그 자리에서 품삯을 끊었다.',
    doors: [
      { label: '치료비를 대신 낸다', hint: '모아 둔 돈이 사라진다', values: { peace: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'ally', relation: '손을 다친 목수' }] },
      { label: '목수들을 모아 주인에게 품삯을 돌려놓으라고 맞선다', hint: '주인이 물러설 수도 있고, 앞장선 사람이 쫓겨날 수도 있다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 1 }, { op: 'log', text: '주인은 끝내 치료비를 내놓았다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'civil' }, { op: 'log', text: '앞장섰던 {name}이(가) 조선소에서 쫓겨났다.', weight: 'heavy' }] }] },
      { label: '그가 맡던 일감까지 넘겨받는다', hint: '품삯이 늘어난다. 작업장 사람들이 수군댄다', values: { greed: D }, 
        fx: [{ op: 'money', add: 22000 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'sw_life_ship', kind: 'door', when: at(age(25, 65), st('shipwright'), years(5)),
    weight: 4, repeat: 'once', speaker: { relation: '늙은 항해가' },
    title: '마지막 항해의 배', body: '이름난 늙은 항해가가 평생의 마지막 항해에 쓸 배를 지어 달라고 찾아왔다. 그가 내민 설계도는 어느 조선소도 끝까지 지어 내지 못한 것이다.',
    doors: [
      { label: '몇 해를 걸고 그 설계에 매달린다', hint: '다른 일감은 모두 물린다. 지어 내면 이름이 바다에 퍼진다', values: { inquiry: D }, mark: 'obsession',
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 8 }, { op: 'money', add: 80000 }, { op: 'flag', id: 'legendShip' },
                                             { op: 'timeline', text: '아무도 짓지 못한 배를 지어 냈다' }],
               else: [{ op: 'money', add: -40000 }, { op: 'hardship', add: 3 }, { op: 'log', text: '세 해를 매달린 배는 진수하던 날 용골이 갈라졌다.', weight: 'heavy' }] }] },
      { label: '설계를 고쳐 튼튼한 배로 짓는다', hint: '항해가는 실망하지만 살아서 돌아온다', values: { loyalty: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'person', kind: 'ally', relation: '살아 돌아온 늙은 항해가', age: { older: 30 } }] },
      { label: '배를 지어 항해가와 함께 시험 항해에 나선다', hint: '한 철을 바다에서 보낸다. 무슨 일이 있을지 모른다', values: { romance: D }, danger: true,
        fx: [{ op: 'money', add: 30000 }, { op: 'hp', add: -10 }, { op: 'mastery', branch: 'observation', add: 8 },
             { op: 'log', text: '항해가와 한 철을 바다에서 보냈다. 노인은 배를 쓰다듬으며 오래 울었다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'sw_inherit_yard', kind: 'door', when: at(age(32, 65), st('shipwright'), years(6)),
    weight: 4, repeat: 'once', speaker: { relation: '늙은 목수장' },
    title: '남겨진 조선소', body: '늙은 목수장이 망치를 내려놓으며 조선소를 {name}에게 물려주겠다고 한다. 낡은 선대와 밀린 외상값도 함께다. 큰 조선 회사가 그 땅을 사겠다고 기다리고 있다.',
    doors: [
      { label: '빚까지 함께 물려받는다', hint: '몇 해는 빚을 갚느라 허덕인다. 망치 소리는 이어진다', values: { loyalty: D },
        fx: [{ op: 'money', add: -50000 }, { op: 'flag', id: 'ownYard' }, { op: 'hardship', add: 2 }, { op: 'timeline', text: '늙은 목수장의 조선소를 물려받았다' }] },
      { label: '조선 회사에 땅을 넘기고 그 회사의 목수로 남는다', hint: '빚 걱정 없이 망치만 든다. 옛 간판은 내려간다', values: { peace: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'fame', add: 1 }] },
      { label: '젊은 목수에게 물려주라고 사양한다', hint: '조선소는 다음 세대의 손으로 간다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '조선소를 물려받은 젊은 목수', age: { younger: 15 } }] },
    ],
  },
];

const SETTLED: Turning[] = [
  // ---------------------------------------------------------------- 닻을 내린 뒤의 날들
  {
    id: 'st_well_claim', kind: 'door', when: at(age(25, 65), st('settled')),
    weight: 5, repeat: 'once', speaker: { relation: '우물을 내놓으라는 농부' },
    title: '우물 하나', body: '{island}에서 사들인 땅의 오래된 우물을 두고, 이웃 농부가 제 할아버지가 판 것이라며 내놓으라고 한다. 가뭄이 든 해라 마을 사람들도 그 우물을 바라본다.',
    doors: [
      { label: '땅문서를 들고 촌장 앞에서 시비를 가린다', hint: '이기든 지든 몇 달이 걸리고 돈이 든다', values: { justice: D },
        fx: [{ op: 'money', add: -8000 }, { op: 'chance', p: 0.6, then: [{ op: 'log', text: '촌장은 문서를 보고 {name}의 손을 들어 주었다.', weight: 'light' }],
               else: [{ op: 'person', kind: 'rival', relation: '우물을 가져간 이웃 농부' }] }] },
      { label: '우물을 마을 모두가 쓰게 내놓는다', hint: '제 밭에 댈 물이 모자라진다', values: { inquiry: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'person', kind: 'ally', relation: '우물물을 긷던 이웃' }] },
      { label: '농부를 힘으로 쫓아낸다', hint: '우물은 지키고, 마을에 평판이 남는다', values: { dominion: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'rival', relation: '쫓겨난 이웃 농부' }, { op: 'flag', id: 'feared' }] },
    ],
  },
  {
    id: 'st_school', kind: 'door', when: at(age(35, 72), st('settled')),
    weight: 5, repeat: 'once', speaker: { relation: '마을의 늙은 훈장' },
    title: '떠나는 젊은이들', body: '{island}의 젊은이들이 일거리를 찾아 하나둘 떠난다. 아이 수가 줄어 마을 글방이 문을 닫게 생겼다. 늙은 훈장이 {name}을(를) 찾아와 한숨을 쉰다.',
    doors: [
      { label: '글방을 떠맡아 아이들을 가르친다', hint: '돈은 안 되고, 하루가 아이들 차지가 된다', values: { inquiry: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '글방의 아이', age: { younger: 30 } }] },
      { label: '남은 아이들에게 바깥 바다 이야기를 들려주며 떠날 채비를 시킨다', hint: '아이들은 언젠가 떠나고, 마을은 더 조용해진다', values: { freedom: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: 1 }] },
      { label: '섬에 일거리를 만들 장사를 벌인다', hint: '가진 돈을 건다. 잘되면 젊은이들이 남는다', values: { ambition: D }, danger: true,
        fx: [{ op: 'money', add: -40000 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 90000 }, { op: 'fame', add: 2 }, { op: 'log', text: '{island}의 소금 가마에 젊은이들이 모여들었다.', weight: 'heavy' }],
               else: [{ op: 'hardship', add: 3 }, { op: 'log', text: '벌인 장사는 한 해를 넘기지 못했다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'st_old_partner', kind: 'door', when: at(age(32, 70), st('settled'), years(3)),
    weight: 4, repeat: 'once', speaker: { relation: '옛날에 함께 일한 사람' },
    title: '돌아온 셈', body: '오래전 함께 일했던 사람이 {island}에 찾아왔다. 그때 나눈 몫이 잘못 셈해졌다며, 이제라도 돌려 달라고 한다. {name}은(는) 그 셈이 맞았는지 잘 기억나지 않는다.',
    doors: [
      { label: '따지지 않고 달라는 만큼 내준다', hint: '돈은 나가고, 옛 사이는 지킨다', values: { loyalty: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'person', kind: 'ally', relation: '셈을 받아 간 옛 동업자' }] },
      { label: '옛 장부를 꺼내 하나하나 맞춰 본다', hint: '며칠 밤을 장부와 씨름한다. 누가 맞는지 드러난다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.5, then: [{ op: 'log', text: '장부는 {name}의 셈이 맞았다고 말했다. 옛 동업자는 얼굴을 붉히고 돌아갔다.', weight: 'light' }],
               else: [{ op: 'money', add: -15000 }, { op: 'log', text: '장부는 옛 동업자의 말이 맞았다고 말했다. 모자란 몫을 내주었다.', weight: 'light' }] }] },
      { label: '옛일은 옛일이라며 문을 닫는다', hint: '돈은 지키고, 옛 사이는 원망으로 남는다', values: { freedom: D },
        fx: [{ op: 'person', kind: 'rival', relation: '원망을 품은 옛 동업자' }] },
    ],
  },
  {
    id: 'st_last_voyage_friend', kind: 'door', when: at(age(38, 70), st('settled'), years(4)),
    weight: 4, repeat: 'once', speaker: { relation: '늙은 항해사' },
    title: '한 번만 더', body: '젊을 적 함께 바다를 누빈 항해사가 낡은 배를 몰고 {island}에 왔다. 죽기 전에 한 번만 더 바다 끝까지 가 보고 싶다고, 그 배에 {name}이(가) 있어 주었으면 한다.',
    doors: [
      { label: '한 철 동안 그 배에 오른다', hint: '집을 비운다. 늙은 몸으로 바다를 버텨야 한다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'wil', add: 1 }, { op: 'person', kind: 'ally', relation: '마지막 항해를 함께한 항해사', age: { older: 3 } },
             { op: 'log', text: '한 철을 바다에서 보내고 돌아왔다. 항해사는 다음 해 봄에 세상을 떠났다.', weight: 'heavy' }] },
      { label: '항해를 말리고 {island}에 남아 함께 지내자고 한다', hint: '항해사는 서운해하지만 곁에 남는다', values: { freedom: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'person', kind: 'ally', relation: '곁에 눌러앉은 늙은 항해사', age: { older: 3 } }] },
      { label: '모은 돈으로 그 배의 돛과 식량을 채워 준다', hint: '함께 가지는 않는다. 배는 홀로 떠난다', values: { loyalty: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'log', text: '새 돛을 단 배가 수평선으로 사라졌다.', weight: 'light' }] },
    ],
  },
  {
    id: 'st_wildfire', kind: 'door', when: at(age(25, 75), st('settled')),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '산에서 내려오는 불', body: '{island}의 산에서 난 불이 마른바람을 타고 마을로 내려온다. 사람들이 짐을 싸서 바닷가로 달린다. {name}의 집과 곳간은 불길이 오는 길목에 있다.',
    doors: [
      { label: '이웃집 노인과 아이들부터 업어 나른다', hint: '제 집은 타게 둔다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'money', add: -30000 }, { op: 'fame', add: 2 },
             { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] }, { op: 'person', kind: 'ally', relation: '불길 속에서 업어 나온 이웃' }] },
      { label: '바람을 읽어 마을 앞 밭에 맞불을 놓자고 사람들을 이끈다', hint: '누군가의 밭을 태워야 한다. 바람이 바뀌면 모두 잃는다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'fame', add: 3 }, { op: 'log', text: '맞불이 불길을 막았다. 마을은 밭 몇 뙈기만 잃었다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -40000 }, { op: 'hardship', add: 3 }, { op: 'log', text: '바람이 돌아섰다. 맞불까지 마을을 덮쳤다.', weight: 'heavy' }] }] },
      { label: '곳간의 물건을 바닷가로 옮긴다', hint: '살림은 지키고, 마을 사람들의 눈길이 남는다', values: { greed: D }, fx: [{ op: 'hardship', add: 2 }, { op: 'money', add: -5000 }] },
    ],
  },
  {
    id: 'st_broken_bridge', kind: 'door', when: at(age(30, 70), st('settled')),
    weight: 4, repeat: 'once', speaker: { relation: '촌장' },
    title: '무너진 다리', body: '{island}의 두 마을을 잇던 돌다리가 무너졌다. 촌장은 다시 놓을 돈이 없다며 집집마다 세금과 일손을 내라고 한다. 그런데 지난해 거둔 다리 세금은 어디로 갔는지 아무도 모른다.',
    doors: [
      { label: '앞장서 돌을 나르고 다리를 놓는다', hint: '한 철 내내 허리가 휜다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'person', kind: 'ally', relation: '함께 다리를 놓은 이웃' }] },
      { label: '촌장의 장부를 캐어 사라진 세금을 밝힌다', hint: '촌장이 물러날 수도 있다. {name}은(는) 촌장의 원수가 된다', values: { inquiry: D }, mark: 'rebel',
        fx: [{ op: 'fame', add: 2 }, { op: 'person', kind: 'rival', relation: '세금을 빼돌린 촌장' }] },
      { label: '돈만 내고 손은 빠진다', hint: '살림이 줄고, 마음은 편하다', fx: [{ op: 'money', add: -12000 }] },
    ],
  },
  {
    id: 'st_haunted_by_sea', kind: 'door', when: at(age(40, 72), st('settled'), years(5)),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '창밖의 바다', body: '닻을 내린 지 오래다. 그런데 요즘 들어 밤마다 바다 꿈을 꾼다. 항구에 새 돛이 오를 때면 {name}은(는) 하던 일을 멈추고 한참 바라본다.',
    doors: [
      { label: '집을 정리하고 다시 바다로 나간다', hint: '뭍에서 쌓은 것을 두고 간다. 몸은 젊을 때 같지 않다', values: { romance: D }, danger: true,
        fx: [{ op: 'standing', to: 'civil' }, { op: 'unflag', id: 'shop' }, { op: 'hp', add: -5 }, { op: 'money', add: 20000 },
             { op: 'log', text: '집을 팔고 항구로 내려갔다. 먼바다로 가는 배에 일손으로 이름을 올렸다.', weight: 'heavy' },
             { op: 'timeline', text: '뭍의 삶을 접고 다시 바다로 나섰다' }] },
      { label: '바닷가에 작은 배를 사 두고 한 달에 한 번 노를 젓는다', hint: '바다는 손닿는 데 둔다. 돈이 좀 든다', values: { peace: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '젊은 뱃사람들을 불러 모아 아는 바다를 가르친다', hint: '제 꿈은 남의 돛에 실어 보낸다', values: { justice: D },
        fx: [{ op: 'person', kind: 'ally', relation: '바다를 배운 젊은 뱃사람', age: { younger: 25 } }, { op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'st_noble_guest', kind: 'door', when: at(age(30, 70), st('settled'), has('shop')),
    weight: 4, repeat: 'once', speaker: { relation: '귀족의 시종' },
    title: '귀족의 손님', body: '바다 건너 왕국의 귀족이 {island}에 들러 {name}의 가게에서 물건을 고른다. 시종이 값은 나중에 왕국에서 치르겠다며 가게의 물건을 절반쯤 싣고 가려 한다. 지난해 옆 가게도 그렇게 털렸다.',
    doors: [
      { label: '값을 먼저 치르라고 문 앞을 막아선다', hint: '귀족의 체면을 건드린다. 시종 뒤에는 칼 찬 호위가 있다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 20000 }, { op: 'log', text: '귀족은 혀를 차며 값을 치렀다.', weight: 'light' }],
               else: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'money', add: -20000 }, { op: 'log', text: '호위의 칼자루가 {name}을(를) 쓰러뜨렸다. 물건은 실려 나갔다.', weight: 'heavy' }] }] },
      { label: '웃으며 내주고, 귀족의 이름을 팔아 단골을 늘린다', hint: '물건은 잃고, 왕국 귀족이 다녀간 가게라는 소문이 남는다', values: { ambition: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'chance', p: 0.6, then: [{ op: 'money', add: 40000 }] }] },
      { label: '좋은 물건은 숨기고 팔리지 않던 것만 내놓는다', hint: '들키지 않으면 손해가 적다', values: { inquiry: D },
        fx: [{ op: 'money', add: -5000 }, { op: 'chance', p: 0.2, then: [{ op: 'hp', add: -10 }, { op: 'log', text: '숨긴 물건이 들켰다. 시종의 채찍이 {name}의 등을 갈랐다.', weight: 'heavy' }] }] },
    ],
  },
];

export const LAND: Turning[] = [...CIVIL, ...SHIPWRIGHT, ...SETTLED];
