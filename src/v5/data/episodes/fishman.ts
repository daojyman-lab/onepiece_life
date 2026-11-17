// 섬 장편 에피소드: fishman (v6.6). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 원작 전(주인공 9~20): 오토히메 왕비의 서명 운동과 암살, 어인가 뒷골목에서 자라는 호디 존스, 단단한 껍질 탑의 공주.
// 원작 그 무렵(21~22): 기온코르드 광장의 반란. 결판은 밀짚모자가 낸다. 주인공은 다른 거리 · 다른 간부를 맡는다.
// 원작 뒤(22~): 공주와 햇빛, 지상으로 옮겨 가자는 약속, 예전에 만난 사람과의 재회.
import type { Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at } from '../turnings/paths';

const HERE = on('어인섬', '어인가', '류구 왕국', '바다의 숲');

export const FOES_FISHMAN: FoeDef[] = [
  { id: 'b_daruma', name: '다루마', title: '신어인 해적단 간부', p: 60, sea: 'sabaody', species: 'fishman', bias: { str: 1.2, vit: 1.1 }, skills: ['fist_jab', 'fist_combo', 'fist_iron'], tactic: 'offense' },
  { id: 'b_dosun', name: '도슨', title: '신어인 해적단 간부', p: 62, sea: 'sabaody', species: 'fishman', bias: { str: 1.3, vit: 1.3, spd: 0.7 }, skills: ['fist_guard', 'fist_iron', 'fist_quake'], tactic: 'defense' },
  { id: 'b_ikaros', name: '이카로스 머치', title: '신어인 해적단 간부', p: 64, sea: 'sabaody', species: 'fishman', bias: { spd: 1.2 }, skills: ['sword_cut', 'sword_flash', 'sword_wave'], tactic: 'offense' },
  { id: 'b_zeo', name: '제오', title: '신어인 해적단 간부', p: 66, sea: 'sabaody', species: 'fishman', bias: { spd: 1.3, int: 1.1 }, skills: ['fist_jab', 'fist_counter', 'gun_smoke', 'obs_sense'], tactic: 'counter', observation: 1 },
  { id: 'b_hyozo', name: '효조', title: '어인가의 칼잡이', canon: 'hyouzou', p: 66, sea: 'sabaody', species: 'fishman', bias: { spd: 1.3, wil: 0.8 }, skills: ['sword_draw', 'sword_flash', 'sword_parry', 'sword_secret'], tactic: 'counter' },
  { id: 'b_decken', name: '반더 데켄 9세', title: '플라잉 해적단 선장', p: 68, sea: 'sabaody', species: 'fishman', bias: { int: 1.2, str: 0.9 }, skills: ['gun_shot', 'gun_quick', 'gun_snipe', 'gun_volley'], tactic: 'offense' },
];

export const EP_FISHMAN: Turning[] = [
  // ================================================================ 원작 전 (1): 오토히메 왕비의 서명 운동
  {
    id: 'ep_fishman_1', kind: 'door', when: at(HERE, age(9, 11), not('ep_fishman_done')), weight: 30, repeat: 'once', speaker: { relation: '서명지를 든 왕비' },
    title: '왕비의 서명지', body: '류구 왕국의 광장 한복판에 왕비가 직접 나무 상자를 놓고 섰다. 지상으로 옮겨 가 해를 보며 살자는 서명을 모은다고 한다. 지나가던 어인들이 혀를 차는데도 왕비는 {name}에게 허리를 굽히고 웃으며 펜을 내민다.',
    doors: [
      { label: '서명지 뭉치를 받아 들고 왕비를 따라나선다', hint: '어인가의 문마다 두드리게 된다', values: { justice: D },
        fx: [flag('ep_fishman_sign'), next('ep_fishman_2')] },
      { label: '광장 구석에서 비웃던 어인 청년들을 따라간다', hint: '어인가 깊숙한 곳으로 이어진다', values: { freedom: D },
        fx: [next('ep_fishman_3')] },
      { label: '이름 한 줄만 쓰고 집으로 돌아간다', hint: '섬의 앞날은 어른들의 일이다', values: { peace: D },
        fx: [log('삐뚤빼뚤한 글씨로 이름 하나를 상자에 넣었다. 왕비가 고맙다며 머리를 쓰다듬었다.', 'light')] },
    ],
  },
  {
    id: 'ep_fishman_2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '서명지를 든 왕비' },
    title: '어인가의 문', body: '어인가의 골목은 소금기와 녹슨 쇠 냄새로 가득하다. 문을 열자마자 서명지를 찢어 버리는 노인도, 노예의 낙인이 남은 등을 보여 주는 사내도 있다. 왕비는 침을 맞아도 닦지 않고 다음 문을 두드린다.',
    doors: [
      { label: '왕비의 연설 날, 광장 앞줄에서 경비를 돕는다', hint: '모든 서명이 모이는 날이다', values: { loyalty: D },
        fx: [next('ep_fishman_4')] },
      { label: '서명지를 찢은 노인의 이야기를 끝까지 듣는다', hint: '왜 지상을 미워하는지 알게 된다', values: { romance: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, log('노인은 지상에서 보낸 세월을 이야기하다 울었다. 그리고 다음 날 서명지에 이름을 썼다.'), next('ep_fishman_4')] },
      { label: '문 앞에서 쫓겨나는 일에 지쳐 손을 뗀다', hint: '왕비는 그래도 웃으며 보내 준다', values: { freedom: D },
        fx: [log('서명지 뭉치를 돌려주었다. 왕비는 오늘까지 고마웠다고 했다.', 'light')] },
    ],
  },
  {
    id: 'ep_fishman_3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'hody' },
    title: '어인가의 붉은 눈', body: '버려진 술통이 쌓인 공터에서 상어 이빨의 청년이 아이들을 모아 놓고 지상 사람들이 저지른 일을 하나하나 읊는다. 피셔 타이거의 이름을 부를 때마다 아이들이 주먹을 쥔다. 청년이 {name}을(를) 보고 이빨을 드러낸다. 너도 인간이 밉지?',
    doors: [
      { label: '그 무리에 섞여 앉는다', hint: '어인가에서 함부로 건드리지 못하는 얼굴이 된다', values: { dominion: D },
        fx: [flag('ep_fishman_hodycrew'), next('ep_fishman_4')] },
      { label: '고개를 젓고 공터를 떠난다', hint: '등 뒤로 웃음소리가 따라온다', values: { peace: D },
        fx: [next('ep_fishman_4')] },
      { label: '술통 뒤에 숨어 그들의 밤 이야기를 엿듣는다', hint: '광장, 지붕, 총이라는 말이 들린다', values: { inquiry: D },
        fx: [flag('ep_fishman_clue'), next('ep_fishman_4')] },
    ],
  },
  {
    id: 'ep_fishman_4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '광장의 총성', body: '서명이 마침내 다 모인 날, 왕비가 단상에 서서 손을 흔든다. 그때 마른 총성 한 발이 광장을 가른다. 왕비가 쓰러지고, 사람들이 비명을 지르며 흩어진다. 붙잡힌 것은 총을 든 인간 하나다.',
    doors: [
      { label: '쓰러진 왕비 곁으로 달려간다', hint: '마지막 말을 듣게 된다', values: { romance: D },
        fx: [{ op: 'hardship', add: 2 }, log('왕비는 피를 흘리면서도 누구도 미워하지 말라고 했다. 그 말이 오래 귀에 남았다.'),
             time('류구 왕국 광장에서 오토히메 왕비가 총에 맞던 날, 그 곁에 있었다'), next('ep_fishman_5')] },
      { label: '총성이 울린 지붕 쪽으로 내달린다', hint: '붙잡힌 인간과는 다른 그림자를 볼지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6,
               then: [flag('ep_fishman_clue'), log('지붕 끝에서 상어 지느러미 같은 그림자가 사라지는 것을 보았다.')],
               else: [{ op: 'hp', add: -12 }, log('기왓장을 밟고 미끄러져 떨어졌다. 그림자는 놓쳤다.')] },
             time('류구 왕국 광장에서 오토히메 왕비가 총에 맞던 날, 지붕 위의 그림자를 쫓았다'), next('ep_fishman_5')] },
      { label: '그날 밤, 공터에서 들리는 웃음소리를 따라간다', hint: '함께 앉던 무리가 무엇을 축하하는지 안다', when: [has('ep_fishman_hodycrew')], values: { inquiry: D },
        fx: [flag('ep_fishman_clue'), { op: 'hardship', add: 2 }, time('오토히메 왕비가 쓰러진 밤, 어인가 공터의 웃음소리를 들었다', 'hody'), next('ep_fishman_5')] },
    ],
  },
  {
    id: 'ep_fishman_5', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '불탄 서명 상자', body: '장례 다음 날, 서명이 든 상자가 불타 재가 되어 있었다. 세 왕자가 재 앞에 무릎을 꿇고 어머니의 일을 끝내 잇겠다고 울며 다짐한다. 섬에는 인간이 왕비를 죽였다는 말만 돈다.',
    doors: [
      { label: '왕자들 옆에 서서 다시 모으자고 한다', hint: '언젠가 이어질 약속이 된다', values: { loyalty: D },
        fx: [flag('ep_fishman_sign'), log('재가 된 서명 상자 앞에서 왕자들과 함께 다시 모으자고 약속했다.'), time('불탄 서명 상자 앞에서 류구의 왕자들과 약속했다')] },
      { label: '지붕 위의 그림자가 누구였는지 혼자 캐 본다', hint: '누구에게도 쉽게 말할 수 없는 답에 닿는다', when: [has('ep_fishman_clue')], values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, log('총을 쏜 것은 인간이 아니었다. 그 이름을 입 밖에 내면 섬이 뒤집힌다는 것도 알았다.')] },
      { label: '미움이 섬을 삼키는 것을 보고 바깥바다로 눈을 돌린다', hint: '이 섬의 바다는 너무 좁게 느껴진다', values: { ambition: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, log('왕비가 보고 싶어 했던 해를 언젠가 직접 보겠다고 마음먹었다.')] },
    ],
  },
  // ================================================================ 원작 전 (2): 어인가 뒷골목 (주인공 16~20)
  {
    id: 'ep_fishman_alley', kind: 'door', when: at(HERE, age(16, 20), not('ep_fishman_done')), weight: 25, repeat: 'once', speaker: 'hero',
    title: '어인가 뒷골목의 알약', body: '어인가 뒷골목에서 이마에 신어인 해적단이라는 문신을 새긴 패거리가 사람 상인 하나를 벽에 몰아붙였다. 패거리의 손에는 붉은 알약이 든 병이 있고, 눈이 벌겋게 충혈되어 있다. 맨 뒤에서 상어 이빨의 사내가 낄낄 웃는다.',
    doors: [
      { label: '상인을 감싸고 골목 밖으로 빼낸다', hint: '패거리의 눈에 얼굴이 박힌다', values: { justice: D },
        fx: [flag('ep_fishman_merchant'), { op: 'hp', add: -8 }, next('ep_fishman_hide')] },
      { label: '패거리가 건네는 병을 받아 든다', hint: '그 무리의 한 사람이 된다', values: { greed: D },
        fx: [flag('ep_fishman_hodycrew'), next('ep_fishman_pill')] },
      { label: '상어 이빨의 사내에게 곧장 덤빈다', hint: '목숨을 건 싸움이다. 이 골목에 지켜보는 눈은 없다', when: [ready(4)], danger: true, values: { dominion: D },
        fx: [fight('b_hody', true, { win: 'ep_fishman_hwin', lose: 'ep_fishman_hlose', back: 'ep_fishman_hide' })] },
    ],
  },
  {
    id: 'ep_fishman_hide', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'jinbe' },
    title: '바다의 숲의 무덤', body: '빛나는 산호와 가라앉은 배들 사이, 바다의 숲에 왕비의 무덤이 있다. 몸집이 큰 고래상어 어인이 꽃을 놓고 오래 앉아 있다. 태양 해적단을 이끌던 징베다. 그는 어인가의 아이들이 이상한 약을 먹는다는 말을 듣고 왔다고 한다.',
    doors: [
      { label: '피셔 타이거와 태양 깃발의 이야기를 청해 듣는다', hint: '노예의 낙인을 덮은 해의 의미를 안다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '바다의 숲에서 만난 고래상어 어인', canon: 'jinbe' },
             log('징베는 태양 깃발이 낙인을 덮으려고 그린 것이라고 했다. 미움이 아니라 해를 그렸다는 것이다.'), time('바다의 숲, 오토히메 왕비의 무덤 앞에서 징베와 이야기했다', 'jinbe')] },
      { label: '광장의 지붕 위에서 본 것을 털어놓는다', hint: '징베의 얼굴이 굳는다', when: [has('ep_fishman_clue')], values: { justice: D },
        fx: [next('ep_fishman_duel')] },
      { label: '물의 흐름으로 치는 주먹을 한 수 청한다', hint: '손이 부르튼다. 바닷물의 무게를 배운다', values: { ambition: D },
        fx: [{ op: 'mastery', branch: 'fist', add: 18 }, { op: 'hp', add: -8 }, log('징베의 손바닥이 물을 밀자 산호가 통째로 흔들렸다.', 'light')] },
    ],
  },
  {
    id: 'ep_fishman_duel', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'hody' },
    title: '증언과 웃음', body: '어인가 가장 깊은 골목에서 상어 이빨의 사내가 {name}을(를) 기다리고 있다. 증거? 누가 믿지? 섬 사람들은 인간이 왕비를 죽였다고 믿는 편이 편하다며 웃는다. 그의 손가락 사이에서 붉은 알약이 굴러다닌다.',
    doors: [
      { label: '이 자리에서 결판을 낸다', hint: '목숨을 건 싸움이다. 지면 골목 바닥에 남는다', when: [ready(4)], danger: true, values: { dominion: D },
        fx: [fight('b_hody', true, { win: 'ep_fishman_hwin', lose: 'ep_fishman_hlose' })] },
      { label: '본 것을 류구 왕궁의 병사들에게 그대로 전한다', hint: '믿어 줄지는 모른다', values: { loyalty: D },
        fx: [flag('ep_fishman_hodyfoe'), { op: 'chance', p: 0.4,
               then: [{ op: 'fame', add: 4 }, log('큰 왕자 하나가 끝까지 들어 주었다. 증거는 모자랐지만, 그날부터 왕궁이 어인가를 지켜보기 시작했다.')],
               else: [{ op: 'hardship', add: 2 }, log('병사들은 고개를 저었다. 그 밤부터 골목마다 붉은 눈이 {name}을(를) 따라다녔다.')] }] },
      { label: '지금은 물러나 때를 기다린다', hint: '사내의 웃음이 등 뒤에 붙는다', values: { peace: D },
        fx: [flag('ep_fishman_hodyfoe'), log('입을 다물었다. 언젠가 이 섬이 그 이름을 알게 될 날이 올 것이다.', 'light')] },
    ],
  },
  {
    id: 'ep_fishman_hwin', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '물러간 상어 이빨', body: '골목 벽이 무너지고, 상어 이빨의 사내가 피를 뱉으며 무릎을 꿇었다. 그는 병째로 알약을 털어 넣고는 눈이 새빨개진 채 어둠 속으로 달아난다. 다음에는 섬째로 뒤집어 주마, 하는 고함만 남는다.',
    doors: [
      { label: '쫓지 않고 다친 상인과 아이들부터 돌본다', hint: '골목 사람들이 얼굴을 기억한다', values: { peace: D },
        fx: [flag('ep_fishman_hodyfoe'), { op: 'fame', add: 6 }, time('어인가 뒷골목에서 호디 존스를 물리쳤다', 'hody')] },
      { label: '바닥에 떨어진 알약을 주워 왕궁의 약사에게 가져간다', hint: '그 약이 무엇을 대가로 받는지 알게 된다', values: { inquiry: D },
        fx: [flag('ep_fishman_hodyfoe'), { op: 'base', key: 'int', add: 1 }, log('약사가 말했다. 힘을 몇 배로 주는 대신, 먹은 자의 세월을 갉아먹는 약이라고.'),
             time('어인가 뒷골목에서 호디 존스를 물리쳤다', 'hody'), next('ep_fishman_tower')] },
      { label: '그 이름을 어인가에 퍼뜨리게 둔다', hint: '골목의 건달들이 머리를 숙이기 시작한다', values: { greed: D },
        fx: [flag('ep_fishman_hodyfoe'), { op: 'fame', add: 15 }, { op: 'money', add: 20000 }, time('어인가 뒷골목에서 호디 존스를 물리쳤다', 'hody')] },
    ],
  },
  {
    id: 'ep_fishman_hlose', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '인어 카페의 아가씨' },
    title: '인어 카페의 뒷방', body: '눈을 뜨니 조개껍데기 등불 아래다. 인어 카페의 아가씨가 해초 붕대를 갈아 주며, 골목 바닥에 쓰러져 있던 것을 끌고 왔다고 한다. 그 패거리는 요즘 왕궁 근처까지 어슬렁댄다고 속삭인다.',
    doors: [
      { label: '붕대를 갈아 주는 손에 고맙다고 하고 한 철을 쉰다', hint: '몸이 낫는 동안 섬의 소문을 듣는다', values: { romance: D },
        fx: [{ op: 'hp', add: 15 }, flag('ep_fishman_hodyfoe'), { op: 'person', kind: 'ally', relation: '목숨을 건져 준 인어 카페의 아가씨' }] },
      { label: '왕궁 근처라는 말에 몸을 일으킨다', hint: '단단한 껍질 탑 쪽에서 쿵쿵 소리가 난다고 한다', values: { loyalty: D },
        fx: [flag('ep_fishman_hodyfoe'), { op: 'hp', add: -5 }, next('ep_fishman_tower')] },
      { label: '상처를 핥으며 다시 붙을 날을 벼른다', hint: '이빨 자국이 흉터로 남는다', values: { ambition: D },
        fx: [flag('ep_fishman_hodyfoe'), { op: 'base', key: 'wil', add: 1 }, { op: 'injury', severity: 'light' }] },
    ],
  },
  {
    id: 'ep_fishman_pill', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'hody' },
    title: '에너지 스테로이드', body: '패거리의 아지트는 가라앉은 배의 화물칸이다. 상어 이빨의 사내가 붉은 알약 한 알을 {name}의 손바닥에 올려놓는다. 이걸 먹으면 인간 열 놈쯤은 맨손으로 찢는다. 둘러선 패거리의 눈이 하나같이 핏빛이다.',
    doors: [
      { label: '알약을 삼킨다', hint: '온몸에 힘이 넘친다. 무언가가 깎여 나가는 느낌도 든다', values: { greed: D },
        fx: [{ op: 'base', key: 'str', add: 2 }, { op: 'base', key: 'vit', add: -1 }, { op: 'hardship', add: 2 }, log('심장이 터질 듯 뛰었다. 거울 속의 눈이 붉었다.')] },
      { label: '삼키는 척 혀 밑에 감추고 화물칸을 빠져나온다', hint: '그 무리와는 여기까지다', values: { freedom: D },
        fx: [log('알약을 바다의 숲 모래에 묻었다. 그 뒤로 화물칸에는 다시 가지 않았다.')] },
      { label: '패거리에 남아 그들이 무엇을 꾸미는지 지켜본다', hint: '언젠가 섬을 뒤집을 계획의 냄새가 난다', values: { ambition: D },
        fx: [{ op: 'hardship', add: 1 }, flag('ep_fishman_clue'), log('화물칸 벽에는 류구 궁의 지도와 광장의 이름이 붙어 있었다.')] },
    ],
  },
  {
    id: 'ep_fishman_tower', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '단단한 껍질 탑의 공주' },
    title: '단단한 껍질 탑', body: '왕궁 뒤 단단한 껍질 탑에 도끼가 꽂히는 소리가 밤마다 울린다. 공주를 신부로 맞겠다는 플라잉 해적단의 선장이 사랑 편지와 함께 도끼를 던진다고 한다. 탑의 작은 창으로 커다란 인어 공주가 눈물 고인 눈으로 내려다본다.',
    doors: [
      { label: '탑 문 앞에 서서 밤새 날아드는 도끼를 막는다', hint: '공주가 창가에서 몰래 고맙다고 한다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, flag('ep_fishman_shira'), log('새벽까지 도끼를 막아 냈다. 창 너머에서 작은 목소리가 고맙다고 했다.')] },
      { label: '창가에 앉아 공주에게 바깥 이야기를 들려준다', hint: '탑 밖을 모르는 공주가 해에 대해 묻는다', values: { romance: D },
        fx: [flag('ep_fishman_shira'), { op: 'base', key: 'wil', add: 1 }, log('공주는 해가 정말 뜨거운지, 꽃이 정말 땅에서 자라는지 묻고 또 물었다.', 'light')] },
      { label: '도끼가 날아오는 쪽으로 거슬러 올라가 선장과 맞선다', hint: '쓰러뜨려도 그는 다시 돌아올 것이다', when: [ready(4)], danger: true, values: { dominion: D },
        fx: [flag('ep_fishman_shira'), fight('b_decken', false)] },
    ],
  },
  // ================================================================ 원작 그 무렵: 기온코르드 광장의 반란 (주인공 21)
  {
    id: 'ep_fishman_war', kind: 'door', when: at(HERE, age(21, 22), not('ep_fishman_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '기온코르드 광장', body: '신어인 해적단이 류구 궁을 점령하고, 넵튠 왕을 기온코르드 광장의 처형대에 매달았다. 섬 전체를 비추는 방송 화면에 붉은 눈의 선장이 나와 인간과 손잡으려는 자는 모두 죽인다고 외친다. 광장 너머 거리에서는 시민들이 갈 곳을 몰라 우왕좌왕한다. 광장 한가운데에는 밀짚모자를 쓴 해적이 내려선다.',
    doors: [
      { label: '광장 바깥 거리에서 시민들을 이끌고 빠진다', hint: '광장의 결판은 거기 선 사람들의 몫이다', values: { peace: D },
        fx: [next('ep_fishman_evac')] },
      { label: '광장으로 몰려드는 신어인 해적단 간부를 막아선다', hint: '골목 하나를 혼자 맡는다', values: { justice: D },
        fx: [next('ep_fishman_officer')] },
      { label: '해적단의 줄에서 걸어 나와 그 깃발을 내던진다', hint: '예전에 함께 앉던 얼굴들이 등을 노린다', when: [has('ep_fishman_hodycrew')], values: { freedom: D },
        fx: [{ op: 'hp', add: -10 }, log('신어인 해적단의 깃발을 광장 바닥에 내던졌다. 붉은 눈들이 일제히 돌아보았다.'), next('ep_fishman_officer')] },
    ],
  },
  {
    id: 'ep_fishman_evac', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '피난 길', body: '머리 위 높이, 거대한 방주 노아가 쇠사슬을 끊고 섬으로 떨어지고 있다. 거리마다 비명과 깨진 산호 조각이 흩날리고, 신어인 해적단의 졸개들이 달아나는 시민들을 막아선다. 아이 둘이 {name}의 옷자락을 붙잡는다.',
    doors: [
      { label: '아이들 손을 잡고 바다의 숲까지 길을 연다', hint: '숲의 산호 그늘은 아직 안전하다', values: { romance: D },
        fx: [{ op: 'fame', add: 5 }, log('아이들을 바다의 숲까지 데려갔다. 뒤돌아보니 하늘 같은 바다에 노아가 걸려 있었다.'), next('ep_fishman_noah')] },
      { label: '골목 입구를 막은 졸개들의 우두머리와 붙는다', hint: '몸집 큰 간부 하나가 길을 틀어막고 있다', values: { ambition: D },
        fx: [fight('b_daruma', false, { win: 'ep_fishman_noah', lose: 'ep_fishman_noah' })] },
      { label: '시민들을 베려는 술 취한 칼잡이 앞을 막는다', hint: '취한 척하는 칼끝이 빠르다', when: [ready(3)], danger: true, values: { freedom: D },
        fx: [fight('b_hyozo', false, { win: 'ep_fishman_noah', lose: 'ep_fishman_noah' })] },
    ],
  },
  {
    id: 'ep_fishman_officer', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '광장으로 가는 골목', body: '광장에서 밀짚모자 일당이 수만의 신어인 해적단을 상대로 싸움을 벌이고 있다. 광장으로 들어가는 골목 하나에 간부들이 증원을 끌고 몰려든다. 여기를 막으면 광장의 싸움에 끼어들 수 있는 졸개가 그만큼 준다.',
    doors: [
      { label: '바위 같은 거한 도슨을 정면으로 받아 낸다', hint: '물러서지 않는 덩치다. 골목이 무너질지도 모른다', values: { dominion: D },
        fx: [fight('b_dosun', false, { win: 'ep_fishman_noah', lose: 'ep_fishman_noah' })] },
      { label: '그림자처럼 사라지는 제오를 쫓는다', hint: '보이지 않는 상대다. 기척을 읽어야 한다', when: [ready(3)], danger: true, values: { inquiry: D },
        fx: [fight('b_zeo', false, { win: 'ep_fishman_noah', lose: 'ep_fishman_noah' })] },
      { label: '쓰러진 류구 병사를 들쳐 업고 골목을 빠진다', hint: '간부들은 놓친다. 한 사람은 산다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -6 }, log('다리를 다친 류구 병사를 업고 무너지는 골목을 빠져나왔다.'), next('ep_fishman_noah')] },
      { label: '지붕 위에서 작살을 겨누는 긴 팔의 간부에게 뛰어오른다', hint: '골목 전체가 그 작살의 사정거리다', special: 'dominion', values: { dominion: D },
        fx: [fight('b_ikaros', false, { win: 'ep_fishman_noah', lose: 'ep_fishman_noah' })] },
    ],
  },
  {
    id: 'ep_fishman_noah', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '멈춰 선 노아', body: '섬을 덮을 듯 떨어지던 방주 노아가 머리 위에서 멈췄다. 밀짚모자를 쓴 해적이 붉은 눈의 선장을 뱃머리째 날려 버렸다는 외침이 거리에서 거리로 번진다. 거리에 쓰러진 신어인 해적단원들의 얼굴이 하룻밤 사이에 노인처럼 쪼그라들어 있다.',
    doors: [
      { label: '쪼그라든 해적단원들을 끌어다 병사들에게 넘긴다', hint: '그 약이 무엇을 앗아 갔는지 눈으로 본다', values: { justice: D },
        fx: [time('기온코르드 광장 위로 떨어지던 노아가 멈추는 것을 보았다', 'luffy'), log('붉은 알약이 앗아 간 세월이 그들의 얼굴에 그대로 새겨져 있었다.')] },
      { label: '부서진 거리에서 다친 사람들에게 피를 나눈다', hint: '인간의 피가 어인의 몸에 들어간다', values: { peace: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 4 }, time('어인섬의 반란이 끝난 날, 다친 사람들에게 피를 나눴다', 'jinbe')] },
      { label: '밀짚모자 일당이 섬을 떠나는 길을 멀리서 지켜본다', hint: '그들의 배가 신세계로 내려간다', values: { freedom: D },
        fx: [time('어인섬을 구한 밀짚모자 일당이 신세계로 떠나는 것을 배웅했다', 'luffy')] },
    ],
  },
  // ================================================================ 원작 뒤: 공주와 해 (주인공 22~)
  {
    id: 'ep_fishman_sun', kind: 'door', when: at(HERE, age(22, 40), not('ep_fishman_done')), weight: 25, repeat: 'once', speaker: { relation: '거대한 인어 공주' },
    title: '바다의 숲의 햇빛', body: '반란이 지나간 지 얼마 뒤, 바다의 숲에 거목의 뿌리를 타고 내려온 햇빛이 비친다. 탑에서 나온 거대한 인어 공주가 그 빛줄기에 손을 대 보며 어머니가 이걸 보여 주고 싶었던 거라고 속삭인다. 왕궁에서는 오토히메 왕비의 서명을 다시 모아 세계 회의에 가져간다고 한다.',
    doors: [
      { label: '다시 펼쳐진 서명지에 이름을 쓴다', hint: '왕비의 상자가 다시 채워진다', values: { loyalty: D },
        fx: [{ op: 'fame', add: 3 }, next('ep_fishman_reverie')] },
      { label: '공주 곁에서 빛줄기를 한참 함께 올려다본다', hint: '탑 시절의 이야기가 나온다', when: [has('ep_fishman_shira')], values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '탑 창가에서 해 이야기를 듣던 인어 공주' }, log('공주는 탑 문 앞의 그 밤을 기억하고 있었다. 이제는 바깥의 해를 같이 보자고 했다.'), next('ep_fishman_reverie')] },
      { label: '빛이 내려오는 위쪽, 지상의 바다로 떠날 채비를 한다', hint: '이 섬의 약속은 섬 사람들이 잇는다', values: { ambition: D },
        fx: [flag('ep_fishman_done'), log('바다의 숲의 빛줄기를 뒤로하고 위쪽 바다로 향했다.')] },
    ],
  },
  {
    id: 'ep_fishman_reverie', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '지상으로 가는 약속', body: '넵튠 왕과 왕자들이 백만 명이 넘는 서명을 싣고 세계 회의로 떠나는 날, 류구 왕국의 항구가 사람으로 가득하다. 왕비가 처음 광장에 상자를 놓은 지 십 년 남짓이 흘렀다. 인파 속에서 낯익은 얼굴 하나가 {name}을(를) 알아본다.',
    doors: [
      { label: '항구에 서서 왕의 배를 끝까지 배웅한다', hint: '해가 보이는 곳에서 사는 날이 가까워진다', values: { peace: D },
        fx: [flag('ep_fishman_done'), log('서명을 실은 배가 거품을 두르고 떠올랐다. 이번에는 상자가 불타지 않았다.'), time('어인섬의 서명을 싣고 세계 회의로 떠나는 왕의 배를 배웅했다')] },
      { label: '예전에 뒷골목에서 빼낸 상인과 손을 맞잡는다', hint: '지상에서 장사하며 어인섬 이야기를 하고 다녔다고 한다', when: [has('ep_fishman_merchant')], values: { greed: D },
        fx: [flag('ep_fishman_done'), { op: 'money', add: 30000 }, { op: 'person', kind: 'ally', relation: '어인가 뒷골목에서 구해 준 사람 상인' },
             log('상인은 그날 골목에서 끌려 나오던 이야기를 지상의 항구마다 하고 다녔다고 했다. 이번에는 서명지를 한 묶음 들고 왔다.')] },
      { label: '감옥에 갇힌 채 늙어 버린 상어 이빨의 사내를 찾아간다', hint: '쇠창살 너머로 마지막 말을 나눈다', when: [has('ep_fishman_hodyfoe')], values: { inquiry: D },
        fx: [flag('ep_fishman_done'), { op: 'base', key: 'wil', add: 1 }, time('늙어 버린 호디 존스를 감옥으로 찾아갔다', 'hody'),
             log('주름투성이가 된 사내는 여전히 인간이 밉다고 했다. 그 미움이 어디서 왔는지는 끝내 말하지 못했다.')] },
    ],
  },
];
