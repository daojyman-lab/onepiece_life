// 섬 장편 에피소드: dressrosa (v6.6). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 시기 셋: 원작 전(주인공 12~20, 도플라밍고가 왕좌를 빼앗은 뒤의 지배 시기) / 원작 그 무렵(21, 투기장과 새장) / 원작 뒤(22~, 리쿠 왕의 나라).
// 원작 전 줄기는 ep_dressrosa_early로 닫고, 원작 무렵 · 원작 뒤 줄기는 ep_dressrosa_done으로 닫는다. 원작 전의 약속은 원작 뒤에 되돌아온다.
// 도플라밍고와의 직접 대결은 원작 전, 그린 비트 앞바다의 거래선에서만. 이겨도 실 분신을 베었을 뿐 본체는 물러난다.
// 원작 무렵에는 루피의 싸움을 대신하지 않는다: 주인공은 지하의 작전 · 새장의 벽 · 거리의 사람들 곁에 있다.
import type { Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at } from '../turnings/paths';

export const FOES_DRESSROSA: FoeDef[] = [
  { id: 'b_diamante', name: '디아만테', title: '돈키호테 패밀리 간부 · 투기장의 영웅', p: 105, sea: 'nw_first', age: 45, bias: { str: 1.2, vit: 1.1 },
    skills: ['sword_cut', 'sword_flash', 'sword_wave', 'sword_finish', 'arm_hard'], tactic: 'offense', armament: 2, observation: 1, fruitClass: 'paramecia' },
  { id: 'b_trebol', name: '트레볼', title: '돈키호테 패밀리 최고 간부', p: 100, sea: 'nw_first', age: 50, bias: { int: 1.2, vit: 1.2 },
    skills: ['fruit:beta:0', 'fruit:beta:1', 'fist_guard', 'gun_bind'], tactic: 'defense', armament: 1, observation: 1, fruitClass: 'paramecia' },
  { id: 'b_pica', name: '피카', title: '돈키호테 패밀리 최고 간부', p: 110, sea: 'nw_first', age: 46, bias: { str: 1.2, vit: 1.3, spd: 0.8 },
    skills: ['fist_iron', 'fist_quake', 'arm_hard', 'arm_guard', 'arm_strike'], tactic: 'endurance', armament: 2, observation: 1, fruitClass: 'paramecia' },
  { id: 'b_senorpink', name: '세뇨르 핑크', title: '돈키호테 패밀리 간부', canon: 'senorpink', p: 85, sea: 'nw_first', age: 40, bias: { vit: 1.2, wil: 1.1 },
    skills: ['fist_combo', 'fist_iron', 'fist_counter', 'arm_hard'], tactic: 'counter', armament: 1, fruitClass: 'paramecia' },
  { id: 'b_dellinger', name: '델린저', title: '돈키호테 패밀리 간부', p: 80, sea: 'nw_first', age: 16, bias: { spd: 1.3, vit: 0.9 },
    skills: ['fist_jab', 'fist_combo', 'sword_cut', 'fist_secret'], tactic: 'offense', species: 'fishman' },
  { id: 'b_machvise', name: '마하바이스', title: '돈키호테 패밀리 간부', canon: 'machvise', p: 82, sea: 'nw_first', age: 42, bias: { vit: 1.3, spd: 0.8 },
    skills: ['fist_iron', 'fist_quake', 'fist_guard', 'arm_hard'], tactic: 'endurance', armament: 1, fruitClass: 'paramecia' },
];

const HERE = on('드레스로자');

/** 원작 전: 도플라밍고가 왕좌를 빼앗은 뒤의 드레스로자 (주인공 12~20) */
const EARLY: Turning[] = [
  {
    id: 'ep_dressrosa_1', kind: 'door', when: at(HERE, age(12, 20), not('ep_dressrosa_early'), not('ep_dressrosa_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '장난감과 사람이 사는 나라', body: '드레스로자의 밤거리에서 해바라기 냄새와 투기장의 함성이 섞인다. 골목 끝에서 한 사내가 꼬마 아이의 손끝에 스치자마자 낡은 태엽 인형이 되어 쓰러진다. 지나가던 사람들은 아무 일도 없었다는 듯 걷고, 외다리 장난감 병정 하나만이 그 인형을 안아 들고 어둠 속으로 사라진다.',
    doors: [
      { label: '외다리 병정을 뒤따라간다', hint: '이 나라의 밑바닥에 숨은 무언가를 보게 된다', values: { inquiry: D }, fx: [next('ep_dressrosa_2')] },
      { label: '투기장 모집관의 천막으로 간다', hint: '목숨을 건 싸움판이지만 이름과 돈이 걸려 있다', values: { ambition: D }, fx: [next('ep_dressrosa_3')] },
      { label: '본 것을 사겠다는 뒷골목 중개인을 따라간다', hint: '이 나라의 왕이 하는 다른 장사가 보인다', values: { greed: D }, fx: [flag('ep_dressrosa_joker'), next('ep_dressrosa_4')] },
    ],
  },
  {
    id: 'ep_dressrosa_2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'leo' },
    title: '꽃밭 밑의 작은 사람들', body: '병정을 따라 들어간 하수도에서 손바닥만 한 사람들이 {name}을(를) 둘러싼다. 꼬리를 단 작은 전사가 바늘 칼을 겨누며 말한다. 우리 톤타타 족은 이 나라 왕에게 속아 지하 공장에서 일하고 있다고, 오늘 밤 그 공장에서 일족 몇을 빼낼 거라고. 작은 전사가 고개를 갸웃한다. 큰 사람, 손을 빌려주겠어요?',
    doors: [
      { label: '작은 전사들과 함께 공장으로 숨어든다', hint: '들키면 이 나라의 간부들과 마주친다', values: { loyalty: D }, fx: [flag('ep_dressrosa_tonta'), next('ep_dressrosa_5')] },
      { label: '그들 몫의 빵과 붕대를 몰래 날라 준다', hint: '싸우지 않고 곁에 남는다. 그들이 그 손을 기억한다', values: { peace: D }, fx: [flag('ep_dressrosa_tonta'), { op: 'money', add: -8000 }, next('ep_dressrosa_6')] },
      { label: '작은 사람들의 은신처를 중개인에게 판다', hint: '돈은 크다. 하수도의 바늘 칼들이 등을 돌린다', values: { greed: D }, fx: [{ op: 'money', add: 60000 }, flag('ep_dressrosa_joker'), next('ep_dressrosa_4')] },
    ],
  },
  {
    id: 'ep_dressrosa_3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '코리다 콜로세움', body: '돌계단 위의 관중이 피 냄새에 발을 구른다. 대기실 구석에서 갑옷을 입은 소녀 검투사 레베카가 상대를 베지 않고 쓰러뜨리기만 하는 것을 {name}은(는) 본다. 관중석에서는 야유가 쏟아지고, 귀빈석에서는 투기장의 영웅 디아만테가 망토를 펄럭이며 웃는다.',
    doors: [
      { label: '투기장의 영웅에게 대결을 청한다', hint: '이 투기장에서 그를 이긴 자는 없다', values: { dominion: D }, danger: true, when: [ready(4)],
        fx: [fight('b_diamante', false, { win: 'ep_dressrosa_6', lose: 'ep_dressrosa_6', back: 'ep_dressrosa_6' }), time('투기장의 영웅 디아만테와 맞붙었다')] },
      { label: '예선을 하나씩 이겨 올라간다', hint: '살아남을수록 몸이 단단해진다. 상처도 쌓인다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 25 }, { op: 'mastery', branch: 'fist', add: 25 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] }, next('ep_dressrosa_6')] },
      { label: '야유 속에서 소녀 검투사 편을 든다', hint: '관중은 등을 돌리지만 한 사람이 그 이름을 기억한다', values: { romance: D },
        fx: [flag('ep_dressrosa_rebecca'), { op: 'person', kind: 'ally', relation: '베지 않고 싸우는 투기장의 소녀 검투사' }, next('ep_dressrosa_6')] },
    ],
  },
  {
    id: 'ep_dressrosa_4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'senorpink' },
    title: '조커의 장사', body: '항구 창고의 등불 아래, 아기 모자를 쓴 사내가 담배를 문 채 {name}에게 서류를 내민다. 조커라는 이름으로 오가는 무기와 사람과 수상한 열매의 장부다. 사내는 진지한 얼굴로 말한다. 사내는 묻지 않고 나르기만 하면 된다고. 창고 안쪽에서 무언가가 꿈틀거리는 소리가 들린다.',
    doors: [
      { label: '짐꾼으로 일하며 장부의 끝을 쫓는다', hint: '돈이 들어온다. 이 나라 왕의 거래선이 보인다', values: { greed: D }, fx: [{ op: 'money', add: 40000 }, next('ep_dressrosa_7')] },
      { label: '서류를 내던지고 창고를 빠져나간다', hint: '아기 모자의 사내가 순순히 보내 줄 리 없다', values: { justice: D }, danger: true, when: [ready(3)],
        fx: [fight('b_senorpink', false, { win: 'ep_dressrosa_6', lose: 'ep_dressrosa_6', back: 'ep_dressrosa_6' })] },
      { label: '대답을 미루고 밤사이 도시로 숨어든다', hint: '패밀리의 눈을 피해 다닌다. 도시의 다른 얼굴이 보인다', values: { freedom: D }, fx: [{ op: 'hardship', add: 3 }, next('ep_dressrosa_6')] },
    ],
  },
  {
    id: 'ep_dressrosa_5', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'leo' },
    title: '스마일 공장', body: '지하 공장은 끓는 약품 냄새로 숨이 막힌다. 줄지어 선 톤타타 족이 열매 비슷한 것을 상자에 담고, 그 위로 콧물을 늘어뜨린 간부 트레볼이 끈적한 지팡이를 짚고 걷는다. 작은 전사가 {name}의 귀에 대고 속삭인다. 저 상자는 바다 건너 사황에게 간다고.',
    doors: [
      { label: '간부 앞을 막아서고 작은 사람들을 달아나게 한다', hint: '끈적이는 실에 걸리면 빠져나오기 어렵다', values: { justice: D }, danger: true, when: [ready(4)],
        fx: [fight('b_trebol', false, { win: 'ep_dressrosa_6', lose: 'ep_dressrosa_6', back: 'ep_dressrosa_6' })] },
      { label: '불을 질러 소란을 피우고 몇 명이라도 빼낸다', hint: '다 구하지는 못한다. 구한 몇은 {name}을(를) 잊지 않는다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 15 }, log('연기 속에서 작은 손들이 {name}의 옷자락을 붙잡고 따라 나왔다. 셋을 구했고, 나머지는 공장에 남았다.'), next('ep_dressrosa_6')] },
      { label: '상자 하나를 훔쳐 그 정체를 캐 본다', hint: '사람을 짐승으로 바꾸는 인조 열매의 비밀이 손에 들어온다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, log('인조 열매를 먹은 짐승 한 마리가 웃기 시작했다. 멈추지 않는 웃음이었다.'), next('ep_dressrosa_6')] },
    ],
  },
  {
    id: 'ep_dressrosa_6', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '아무도 기억하지 못하는 사람', body: '{name}이(가) 묵던 빵집 문을 열자 낯선 부부가 반죽을 치대고 있다. 이 집은 원래 우리 집이라고 한다. 계산대 밑에서 양철 빵장수 인형이 기어 나와 {name}의 이름을 부른다. 기억나지 않는 목소리다. 그런데 주머니 속 쪽지에는 {name}의 글씨로 적혀 있다. 엔리코 아저씨, 빵값 외상 석 달.',
    doors: [
      { label: '쪽지를 믿고 인형에게 반드시 기억하겠다고 말한다', hint: '이름 없는 약속이 오래 남는다', values: { loyalty: D },
        fx: [flag('ep_dressrosa_promise'), { op: 'person', kind: 'ally', relation: '모두에게 잊힌 양철 빵장수' }, next('ep_dressrosa_8')] },
      { label: '거리의 장난감들이 원래 누구였는지 묻고 다닌다', hint: '이 나라의 웃음 밑에 무엇이 묻혀 있는지 알게 된다', values: { inquiry: D },
        fx: [flag('ep_dressrosa_promise'), { op: 'base', key: 'wil', add: 1 }, next('ep_dressrosa_8')] },
      { label: '모르는 일이라며 쪽지를 구겨 버린다', hint: '마음은 가볍다. 그 빵 냄새만은 오래 남는다', values: { peace: D }, fx: [next('ep_dressrosa_8')] },
    ],
  },
  {
    id: 'ep_dressrosa_7', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'doflamingo' },
    title: '그린 비트 앞바다의 거래선', body: '안개 낀 그린 비트 앞바다, 스마일 상자를 실은 배 갑판에 분홍 깃털 외투가 내려선다. 칠무해이자 드레스로자의 왕이 손가락을 까딱이자 하늘의 구름에 실이 걸린다. 왕이 선글라스 너머로 {name}을(를) 내려다보며 웃는다. 후후후, 짐꾼 주제에 장부를 너무 많이 읽었군.',
    doors: [
      { label: '실을 끊고 왕에게 달려든다', hint: '칠무해의 실은 사람의 몸을 꼭두각시로 만든다', values: { dominion: D }, danger: true, when: [ready(5)],
        fx: [time('그린 비트 앞바다에서 돈키호테 도플라밍고와 맞섰다', 'doflamingo'), fight('b_doflamingo', true, { win: 'ep_dressrosa_7w', lose: 'ep_dressrosa_8', back: 'ep_dressrosa_8' })] },
      { label: '호위로 따라온 거구의 간부를 막아선다', hint: '돌처럼 단단한 사내다. 그 사이에 배를 뺄 수 있다', values: { ambition: D }, danger: true, when: [ready(4)],
        fx: [fight('b_pica', false, { win: 'ep_dressrosa_8', lose: 'ep_dressrosa_8', back: 'ep_dressrosa_8' })] },
      { label: '장부를 바다에 던지고 작은 배로 달아난다', hint: '목숨은 건진다. 왕의 웃음소리가 오래 따라온다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'money', add: -20000 }, next('ep_dressrosa_8')] },
    ],
  },
  {
    id: 'ep_dressrosa_7w', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '실로 엮은 왕', body: '칼끝이 왕의 가슴을 꿰뚫는 순간, 분홍 외투가 하얀 실타래로 풀려 바람에 흩어진다. 실 분신이었다. 안개 너머 다른 배에서 웃음소리가 멀어진다. 갑판에는 끊긴 실과 열리지 않은 스마일 상자들만 남아 있다.',
    doors: [
      { label: '상자를 모두 바다에 가라앉힌다', hint: '한 번의 거래가 끊긴다. 왕은 이 얼굴을 잊지 않는다', values: { justice: D },
        fx: [{ op: 'fame', add: 60 }, log('그 해 드레스로자에서 바다 건너로 가는 거래선 하나가 끝내 닿지 않았다.'), next('ep_dressrosa_8')] },
      { label: '상자 하나를 챙겨 비싸게 넘긴다', hint: '큰돈이 된다. 그 열매가 누구 입에 들어갈지는 모른다', values: { greed: D },
        fx: [{ op: 'money', add: 150000 }, next('ep_dressrosa_8')] },
      { label: '남은 실을 살펴 그 힘의 결을 익힌다', hint: '다음에 만날 때를 위해서다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'observation', add: 30 }, next('ep_dressrosa_8')] },
    ],
  },
  {
    id: 'ep_dressrosa_8', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '해바라기 언덕의 작별', body: '왕궁 쪽에서 축제의 불꽃이 오르고, 사람들은 열 해 전 나라를 버린 옛 왕을 욕하며 지금의 왕을 칭송한다. 언덕 위 해바라기 사이에서 외다리 장난감 병정이 왕궁을 오래 올려다본다. {name}은(는) 이 나라를 떠날 짐을 꾸린다.',
    doors: [
      { label: '병정에게 언젠가 이 나라가 뒤집힐 거라고 말해 준다', hint: '근거 없는 말이지만 낡은 태엽이 조금 힘차게 돈다', values: { romance: D },
        fx: [flag('ep_dressrosa_early'), log('외다리 병정은 대답 대신 경례를 했다. 그 나라를 떠나는 배에서 {name}은(는) 그 경례를 몇 번이고 떠올렸다.')] },
      { label: '이 나라에서 얻은 것을 셈하고 미련 없이 떠난다', hint: '남은 것은 몸에 밴 싸움과 손에 쥔 돈이다', values: { freedom: D },
        fx: [flag('ep_dressrosa_early'), { op: 'base', key: 'wil', add: 1 }, log('드레스로자를 떠났다. 등 뒤의 웃음소리가 진짜인지 끝내 알 수 없었다.', 'light')] },
      { label: '언젠가 이 왕좌를 꺾을 힘을 갖겠다고 다짐한다', hint: '분홍 깃털이 꿈에 나온다', values: { dominion: D },
        fx: [flag('ep_dressrosa_early'), { op: 'mastery', branch: 'conqueror', add: 10 }, time('도플라밍고가 다스리는 드레스로자를 떠났다')] },
    ],
  },
];

/** 원작 무렵: 메라메라 열매를 건 투기장 대회와 새장 (주인공 21) */
const ARC: Turning[] = [
  {
    id: 'ep_dressrosa_b1', kind: 'door', when: at(HERE, age(21, 21), not('ep_dressrosa_done')), weight: 40, repeat: 'once', speaker: 'hero',
    title: '불꽃 열매가 걸린 날', body: '온 신세계의 싸움꾼이 투기장으로 몰려든다. 우승 상품은 죽은 화주 에이스의 열매라는 소문이다. 그 소란 밑, 꽃밭 아래 하수도에서는 작은 사람들이 코 긴 영웅을 앞세워 무언가를 꾸민다. 거리의 장난감들은 오늘따라 유난히 바쁘게 움직인다.',
    doors: [
      { label: '하수도의 작은 사람들을 찾아간다', hint: '이 나라를 뒤집을 작전에 끼게 된다', values: { justice: D }, fx: [next('ep_dressrosa_b2')] },
      { label: '옛날 작은 전사들에게 받은 바늘 칼 표식을 내민다', hint: '알아보는 얼굴이 있다. 작전의 한가운데로 들어간다', values: { loyalty: D }, when: [has('ep_dressrosa_tonta')],
        fx: [{ op: 'person', kind: 'ally', relation: '톤타타 족의 작은 전사', canon: 'leo' }, next('ep_dressrosa_b2')] },
      { label: '광장에 남아 사람들 곁을 지킨다', hint: '무슨 일이 터지면 가장 먼저 다치는 것은 거리의 사람들이다', values: { peace: D }, fx: [next('ep_dressrosa_b3')] },
    ],
  },
  {
    id: 'ep_dressrosa_b2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'leo' },
    title: '장난감의 집이 무너진 오후', body: '거품을 문 코 긴 사내의 얼굴을 본 소녀 간부가 기절하는 순간, 거리의 장난감들이 일제히 사람으로 돌아온다. 잊혔던 이름들이 한꺼번에 머릿속으로 쏟아진다. 작은 전사가 울먹이며 외친다. 이제 반격이다! 그때 왕궁 쪽에서 물고기 뿔을 단 소년 간부가 하이힐 소리를 내며 거리로 뛰어든다.',
    doors: [
      { label: '사람으로 돌아온 이들 앞에서 소년 간부를 막는다', hint: '발길질이 칼처럼 날카롭다. 물리치면 이 거리는 숨을 돌린다', values: { justice: D }, danger: true, when: [ready(3)],
        fx: [time('슈가가 쓰러지고 장난감들이 사람으로 돌아온 날, 거리에서 싸웠다', 'usopp'), fight('b_dellinger', false, { win: 'ep_dressrosa_b3', lose: 'ep_dressrosa_b3', back: 'ep_dressrosa_b3' })] },
      { label: '돌아온 사람들을 이끌고 지하 항구를 빠져나간다', hint: '어리둥절한 사람들은 길을 모른다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 20 }, time('장난감들이 사람으로 돌아온 날, 지하에서 그들을 이끌어 냈다', 'usopp'), next('ep_dressrosa_b3')] },
      { label: '머릿속으로 돌아온 기억을 하나하나 붙잡는다', hint: '이 나라가 열 해 동안 잊고 산 것이 보인다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, time('장난감들의 저주가 풀리고 잊혔던 이름들이 돌아왔다', 'usopp'), next('ep_dressrosa_b3')] },
    ],
  },
  {
    id: 'ep_dressrosa_b3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'bartolomeo' },
    title: '새장', body: '하늘에서 실이 내려와 나라 전체를 새장처럼 덮는다. 실의 벽은 조금씩 안으로 좁혀 들며 집도 사람도 가리지 않고 썰어 낸다. 초록 머리의 사내가 배리어를 세우고 이를 드러내며 소리친다. 밀짚모자 선배가 왕을 쓰러뜨릴 때까지 아무도 죽게 두지 마라!',
    doors: [
      { label: '사람들과 어깨를 겯고 실의 벽을 밀어낸다', hint: '손이 찢어진다. 한 뼘이라도 늦추면 누군가 산다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'base', key: 'str', add: 1 }, time('새장의 벽을 맨손으로 밀어냈다', 'bartolomeo'), next('ep_dressrosa_b4')] },
      { label: '거리를 부수며 다가오는 거구의 간부를 막는다', hint: '몸이 무거워지는 주먹이다. 막으면 이 블록의 피난이 끝난다', values: { dominion: D }, danger: true, when: [ready(3)],
        fx: [fight('b_machvise', false, { win: 'ep_dressrosa_b4', lose: 'ep_dressrosa_b4', back: 'ep_dressrosa_b4' })] },
      { label: '배리어 뒤로 아이들과 노인을 옮긴다', hint: '싸움의 한가운데는 아니지만 살린 얼굴이 남는다', values: { peace: D },
        fx: [{ op: 'fame', add: 15 }, time('바르톨로메오의 배리어 뒤로 사람들을 옮겼다', 'bartolomeo'), next('ep_dressrosa_b4')] },
    ],
  },
  {
    id: 'ep_dressrosa_b4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '새장이 걷힌 아침', body: '왕궁 위에서 거인처럼 부푼 주먹이 내리꽂히고, 실의 새장이 한꺼번에 풀려 하늘로 흩어진다. 밀짚모자를 쓴 사내가 왕을 쓰러뜨렸다는 함성이 무너진 거리마다 번진다. 지친 사람들 틈에서 {name}은(는) 제 손바닥의 실 자국을 내려다본다.',
    doors: [
      { label: '무너진 거리에서 잔해를 치운다', hint: '이 나라의 다음 날이 조금 빨리 온다', values: { peace: D },
        fx: [flag('ep_dressrosa_done'), time('밀짚모자의 루피가 도플라밍고를 쓰러뜨린 날, 새장 아래에 있었다', 'luffy'), log('새장이 걷힌 아침, {name}은(는) 처음 보는 사람들과 무너진 담을 함께 치웠다.')] },
      { label: '해군이 들이닥치기 전에 섬을 빠져나간다', hint: '이름은 남기지 않는다. 바다가 기다린다', values: { freedom: D },
        fx: [flag('ep_dressrosa_done'), time('밀짚모자가 도플라밍고를 꺾은 드레스로자를 빠져나왔다', 'luffy'), log('항구는 해군의 군함으로 막히고 있었다. {name}은(는) 그보다 한 발 먼저 바다로 나섰다.', 'light')] },
      { label: '밀짚모자의 이름을 기억해 두고 제 길을 다진다', hint: '저런 사내가 바다에 있다는 것이 마음을 끓게 한다', values: { ambition: D },
        fx: [flag('ep_dressrosa_done'), { op: 'fame', add: 30 }, time('드레스로자에서 밀짚모자의 루피가 칠무해를 꺾는 것을 보았다', 'luffy')] },
    ],
  },
];

/** 원작 뒤: 리쿠 왕이 돌아온 드레스로자 (주인공 22~) */
const AFTER: Turning[] = [
  {
    id: 'ep_dressrosa_c1', kind: 'door', when: at(HERE, age(22), not('ep_dressrosa_done')), weight: 25, repeat: 'once', speaker: 'hero',
    title: '리쿠 왕의 나라', body: '왕궁 앞 광장에 늙은 왕 리쿠가 다시 섰다. 열 해 동안 장난감이었던 사람들이 제 이름으로 불리고, 해바라기 언덕의 집들이 하나둘 다시 세워진다. 광장 한쪽에서 눈먼 해군 대장이 왕 앞에 엎드려 사죄했다는 이야기가 아직도 사람들 입에 오르내린다.',
    doors: [
      { label: '집을 다시 짓는 사람들 틈에 끼어 망치를 든다', hint: '고된 일이지만 이 나라의 웃음이 진짜가 되어 간다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, time('리쿠 왕이 돌아온 드레스로자에서 무너진 집을 다시 지었다', 'fujitora'), next('ep_dressrosa_c2')] },
      { label: '그린 비트의 작은 사람들 마을을 찾아간다', hint: '지하 공장에서 풀려난 이들이 어떻게 사는지 본다', values: { inquiry: D }, fx: [next('ep_dressrosa_c3')] },
      { label: '왕녀가 된 옛 검투사를 만나러 왕궁에 간다', hint: '야유 속에서 편을 들어 준 얼굴을 그녀가 알아본다', values: { romance: D }, when: [has('ep_dressrosa_rebecca')],
        fx: [{ op: 'person', kind: 'ally', relation: '왕녀가 된 옛 투기장 검투사' }, log('레베카는 그 날의 관중석을 기억하고 있었다. 이번에는 그녀가 {name}에게 차를 따랐다.'), next('ep_dressrosa_c2')] },
    ],
  },
  {
    id: 'ep_dressrosa_c2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '돌아온 기억', body: '다시 문을 연 빵집 앞에서 콧수염의 사내가 {name}을(를) 보고 반죽 묻은 손을 흔든다. 열 해 동안 아무도 기억하지 못했던 얼굴이다. 사내는 계산대 밑에서 낡은 장부를 꺼낸다. 외상이 아직 남았다고, 장난감이었을 때도 그것만은 잊지 않았다고.',
    doors: [
      { label: '그때의 약속을 꺼내며 외상을 갚는다', hint: '오래 미뤄 둔 것이 갚아진다', values: { loyalty: D }, when: [has('ep_dressrosa_promise')],
        fx: [flag('ep_dressrosa_done'), { op: 'money', add: -3000 }, { op: 'person', kind: 'ally', relation: '열 해 만에 기억을 되찾은 빵장수' }, log('엔리코는 갚은 돈으로 빵을 한 아름 싸 주었다. 잊지 않겠다던 약속이 이렇게 돌아왔다.')] },
      { label: '빵 한 덩이를 사서 광장의 해바라기 밑에서 먹는다', hint: '이 나라의 아침이 그런 맛이다', values: { romance: D },
        fx: [flag('ep_dressrosa_done'), { op: 'hp', add: 15 }, log('드레스로자의 빵은 따뜻했다. 거리의 웃음소리에 이제는 태엽 소리가 섞이지 않았다.', 'light')] },
      { label: '무너진 왕궁 지하의 남은 물건을 노리는 자들을 쫓는다', hint: '패밀리가 남긴 것은 아직 다 치워지지 않았다', values: { justice: D }, fx: [next('ep_dressrosa_c4')] },
    ],
  },
  {
    id: 'ep_dressrosa_c3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'leo' },
    title: '그린 비트의 잔치', body: '거대한 나무뿌리 사이의 작은 마을에서 톤타타 족이 설탕과자를 쌓아 놓고 잔치를 연다. 작은 전사가 {name}의 신발 위에 올라와 거꾸로 경례한다. 이제 아무도 우리를 속이지 못한다고, 그런데 공장에서 나온 인조 열매 몇 상자가 사라졌다고.',
    doors: [
      { label: '사라진 상자의 행방을 함께 쫓는다', hint: '패밀리의 잔당이 그것을 팔아넘기려 한다', values: { romance: D }, fx: [next('ep_dressrosa_c4')] },
      { label: '잔치에 끼어 작은 사람들의 노래를 배운다', hint: '하룻밤이 길고 다정하다', values: { peace: D },
        fx: [flag('ep_dressrosa_done'), { op: 'hp', add: 20 }, log('톤타타 족은 {name}의 이름을 넣은 노래를 지어 불렀다. 가사의 절반은 먹을 것 이야기였다.')] },
      { label: '작은 사람들의 손재주로 무기를 손본다', hint: '바늘처럼 섬세한 손이 칼과 총을 고친다', values: { ambition: D },
        fx: [flag('ep_dressrosa_done'), { op: 'mastery', branch: 'sword', add: 15 }, { op: 'mastery', branch: 'gun', add: 15 }] },
    ],
  },
  {
    id: 'ep_dressrosa_c4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '조커가 남긴 것', body: '밤의 항구 뒤편, 왕이 없는 틈을 타 조커의 장부를 이어받겠다는 밀수꾼들이 인조 열매 상자를 배에 싣는다. 그 중 하나가 상자에서 열매를 꺼내 베어 물고, 웃음을 멈추지 못한 채 짐승의 몸으로 부풀어 오른다.',
    doors: [
      { label: '배에 뛰어올라 상자를 모두 부순다', hint: '부푼 짐승이 날뛴다. 상처를 각오한다', values: { dominion: D }, danger: true,
        fx: [flag('ep_dressrosa_done'), { op: 'hp', add: -25 }, { op: 'fame', add: 25 }, log('부서진 상자에서 굴러 나온 인조 열매들이 바다로 가라앉았다. 그 웃음소리는 이 나라에 다시 오지 않았다.')] },
      { label: '옛 장부의 연줄로 밀수꾼들의 거래처를 통째로 넘겨받는다', hint: '조커의 장사를 아는 얼굴이라 그들이 먼저 고개를 숙인다. 큰돈이 남는다', values: { greed: D }, when: [has('ep_dressrosa_joker')],
        fx: [flag('ep_dressrosa_done'), { op: 'money', add: 120000 }, log('밀수꾼들은 옛 장부의 이름을 듣자 상자를 내려놓았다. {name}은(는) 그 상자들을 어디로 보낼지 오래 고민했다.')] },
      { label: '배가 떠나는 것을 지켜보고 행선지만 기록한다', hint: '그 상자가 어디로 가는지 알면 더 큰 줄기가 보인다', values: { freedom: D },
        fx: [flag('ep_dressrosa_done'), { op: 'base', key: 'int', add: 1 }, log('배는 와노쿠니 쪽 안개로 사라졌다. 인조 열매의 길은 거기서 끝나지 않았다.', 'light')] },
    ],
  },
];

export const EP_DRESSROSA: Turning[] = [...EARLY, ...ARC, ...AFTER];
