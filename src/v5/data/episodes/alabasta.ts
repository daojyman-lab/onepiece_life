// 섬 장편 에피소드: alabasta (v6.6). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 세 시기: 원작 전(주인공 13~16, 바로크 워크스의 그늘) · 원작 그 무렵(17~18, 아르바나의 결전의 다른 전선) · 원작 뒤(19~, 재건과 탈옥한 크로커다일).
// 크로커다일을 쓰러뜨리는 것은 밀짚모자의 몫이다. 주인공이 그를 이기는 곳은 레인 디너스의 지하(원작 전)와 임펠 다운 뒤의 사막뿐이고, 이겨도 모래가 되어 달아난다.
import type { Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at } from '../turnings/paths';

const ISL = '알라바스타 왕국';

export const FOES_ALABASTA: FoeDef[] = [
  // 알라바스타의 미스터 1 (원작 b_mr1은 위대한 항로 입구의 상대라 알라바스타용으로 따로 둔다)
  { id: 'b_mr1_ab', name: '미스터 1', title: '바로크 워크스 최고 간부', canon: 'daz', p: 44, sea: 'gl_first', bias: { str: 1.2, vit: 1.1 }, fruitClass: 'paramecia', skills: ['fruit:supa:0', 'fruit:supa:1', 'fruit:supa:2', 'sword_cut'], tactic: 'offense' },
  { id: 'b_mr2', name: '봉쿠레', title: '바로크 워크스 미스터 2', canon: 'bonclay', p: 40, sea: 'gl_first', bias: { spd: 1.2, str: 1.1 },
    skills: ['fist_combo', 'fist_counter', 'fist_guard', 'fist_secret'], tactic: 'counter', age: 30 },
];

export const EP_ALABASTA: Turning[] = [
  // ================================================================ 원작 전 (주인공 13~16): 영웅의 얼굴을 한 사내
  {
    id: 'ep_alabasta_rainbase', kind: 'door', when: at(on(ISL), age(13, 16), not('ep_alabasta_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '비가 오지 않는 나라',
    body: '레인베이스의 카지노 레인 디너스 앞에 사람들이 몰려 있다. 해적을 쫓아낸 칠무해 크로커다일을 한 번이라도 보려는 것이다. 그 사이 수도에서는 석 달째 비가 오지 않고, 왕궁에 비를 훔치는 가루가 실려 갔다는 소문이 모래바람처럼 돈다. 카지노 뒷문의 낯선 사내가 {name}에게 쪽지를 쥐여 준다. 돈이 필요하면 여기 적힌 곳으로 오라고.',
    doors: [
      { label: '쪽지에 적힌 곳으로 찾아간다', hint: '이름 대신 암호로 불리는 일자리다. 보수가 후하다', values: { greed: D },
        fx: [flag('ep_alabasta_bw'), { op: 'money', add: 20000 }, next('ep_alabasta_bw1')] },
      { label: '마른 땅을 따라 유바 오아시스로 간다', hint: '모래에 묻힌 마을에서 아직도 우물을 파는 노인이 있다고 한다', values: { peace: D },
        fx: [next('ep_alabasta_yuba')] },
      { label: '수도 아르바나의 호위대에 소문을 전하러 간다', hint: '어린 말을 끝까지 들어 줄 어른이 있을지는 모른다', values: { justice: D },
        fx: [next('ep_alabasta_guard')] },
    ],
  },
  {
    id: 'ep_alabasta_bw1', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '바로크 워크스의 연락책' },
    title: '암호로 불리는 사람들',
    body: '레인베이스 뒷골목의 지하실에서 {name}은(는) 밀리언즈라는 이름을 받는다. 서로의 진짜 이름도, 우두머리 미스터 제로의 얼굴도 묻지 않는 것이 이 회사의 규칙이다. 함께 지령을 받는 푸른 머리의 미스 웬즈데이는 걸음걸이며 말씨가 어딘가 왕궁 사람 같다.',
    doors: [
      { label: '지령대로 나노하나 항구 창고에 가루 자루를 옮긴다', hint: '일을 잘하면 암호가 높아진다. 비가 오지 않는 까닭을 제 손으로 나른다', values: { ambition: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'fame', add: 5 }, flag('ep_alabasta_inside'), next('ep_alabasta_vault')] },
      { label: '미스 웬즈데이의 정체를 눈치채고도 입을 다물어 준다', hint: '그녀가 고개를 숙인다. 이 나라를 구하려고 숨어든 사람이다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '바로크 워크스에서 정체를 지켜 준 공주', canon: 'vivi' }, flag('ep_alabasta_vivi'), flag('ep_alabasta_inside'), next('ep_alabasta_vault')] },
      { label: '지령서와 장부를 밤마다 몰래 베낀다', hint: '들키면 바나나 악어의 먹이가 된다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('ep_alabasta_proof'), flag('ep_alabasta_inside'),
             { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -15 }, log('장부를 베끼다 들킬 뻔했다. 등 뒤에서 악어의 이빨이 철컥 닫혔다.')] }, next('ep_alabasta_vault')] },
    ],
  },
  {
    id: 'ep_alabasta_vault', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'crocodile' },
    title: '레인 디너스의 지하',
    body: '부름을 받은 요원들이 카지노 지하의 비밀 방에 모인다. 유리벽 너머로 바나나 악어가 어슬렁거리고, 어둠 속 의자에서 시가 연기와 함께 낮은 목소리가 흘러나온다. 이 나라의 영웅 크로커다일이 곧 미스터 제로였다. 나라를 통째로 삼키는 작전, 유토피아의 이야기가 시작된다.',
    doors: [
      { label: '갈고리 손의 사내에게 덤벼든다', hint: '사막의 왕이다. 지면 모래 속에 묻힌다', when: [ready(5)], values: { dominion: D }, danger: true,
        fx: [time('레인 디너스의 지하에서 미스터 제로의 정체를 보았다', 'crocodile'),
             fight('b_crocodile', true, { win: 'ep_alabasta_sand', lose: 'ep_alabasta_sand_lose', back: 'ep_alabasta_end_pre' })] },
      { label: '고개를 숙이고 그의 수하로 남는다', hint: '보수는 오르고, 나라는 말라 간다', values: { greed: D },
        fx: [{ op: 'money', add: 50000 }, time('레인 디너스의 지하에서 미스터 제로의 정체를 보았다', 'crocodile'), next('ep_alabasta_end_pre')] },
      { label: '환기구를 기어 지하를 빠져나간다', hint: '들은 것을 누군가에게 알려야 한다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, flag('ep_alabasta_proof'), time('레인 디너스의 지하에서 미스터 제로의 정체를 엿들었다', 'crocodile'), next('ep_alabasta_guard')] },
    ],
  },
  {
    id: 'ep_alabasta_yuba', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '우물 파는 노인' },
    title: '모래 속의 우물',
    body: '모래바람에 반쯤 묻힌 유바에서 노인 하나가 삽질을 멈추지 않는다. 토토라는 노인은 갈라진 손으로 모래를 퍼내며, 이 땅은 아직 말라 죽지 않았다고 웃는다. 밤이 되면 마을 밖 천막에서 젊은이들이 칼을 갈며 국왕을 저주하는 소리가 들린다.',
    doors: [
      { label: '노인 곁에서 함께 모래를 퍼낸다', hint: '손바닥이 다 터진다. 우물 바닥이 아주 조금 젖어 온다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, { op: 'hardship', add: 1 }, log('토토 노인과 한 철 내내 모래를 팠다. 마지막 날, 삽 끝에 젖은 모래가 묻어 나왔다.'), next('ep_alabasta_end_pre')] },
      { label: '천막의 젊은이들을 찾아간다', hint: '반란군의 우두머리는 우물 파는 노인과 닮은 눈을 가졌다', values: { loyalty: D },
        fx: [flag('ep_alabasta_rebel'), next('ep_alabasta_rebel')] },
      { label: '물이 마른 까닭을 캐러 다닌다', hint: '비는 사라진 게 아니라 한 도시에만 내리고 있다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('ep_alabasta_proof'), next('ep_alabasta_guard')] },
    ],
  },
  {
    id: 'ep_alabasta_rebel', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'koza' },
    title: '반란군의 천막',
    body: '코자는 햇볕에 그은 얼굴로 지도를 펼친다. 비를 훔친 왕을 끌어내리겠다고, 이 나라 사람이 더는 목말라 죽지 않게 하겠다고. 천막 밖에는 칼보다 삽이 어울리는 손들이 줄지어 있다.',
    doors: [
      { label: '코자 곁에서 진군 준비를 돕는다', hint: '그는 처음 본 사람에게도 물통을 먼저 내민다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '유바의 천막에서 만난 반란군 우두머리', canon: 'koza' }, { op: 'base', key: 'str', add: 1 }, next('ep_alabasta_end_pre')] },
      { label: '왕이 범인이 아닐 수도 있다고 말한다', hint: '천막 안이 얼어붙는다. 코자만은 끝까지 듣는다', values: { justice: D },
        fx: [{ op: 'person', kind: 'ally', relation: '끝까지 말을 들어 준 반란군 우두머리', canon: 'koza' }, { op: 'base', key: 'wil', add: 1 }, next('ep_alabasta_end_pre')] },
      { label: '어느 편의 깃발도 들지 않고 사막으로 나간다', hint: '모래 언덕 너머에는 왕도 반란군도 없다', values: { freedom: D },
        fx: [{ op: 'base', key: 'spd', add: 1 }, next('ep_alabasta_end_pre')] },
    ],
  },
  {
    id: 'ep_alabasta_guard', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'pell' },
    title: '궁전의 매',
    body: '아르바나 궁의 호위대장 펠이 {name}의 말을 끝까지 들어 준다. 그는 팔을 커다란 날개로 바꾸어 보이며, 하늘에서 보면 모래 위의 거짓말이 잘 보인다고 말한다. 곁의 차카는 칼자루를 쥔 채 말이 없다.',
    doors: [
      { label: '펠의 등에 올라 사막 위를 난다', hint: '모래바다 위로 날아오른다. 저 아래 수상한 행렬이 보인다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '함께 사막 위를 난 호위대장', canon: 'pell' }, { op: 'mastery', branch: 'observation', add: 1 }, next('ep_alabasta_end_pre')] },
      { label: '모은 증거를 국왕 앞에 내놓는다', hint: '왕은 믿는다. 다만 크로커다일을 의심할 힘이 이 나라에는 없다', when: [has('ep_alabasta_proof')], values: { justice: D },
        fx: [{ op: 'fame', add: 10 }, log('코브라 왕은 증거를 오래 들여다보았다. 그리고 칠무해를 건드리려면 증거보다 더 큰 것이 필요하다고 중얼거렸다.'), next('ep_alabasta_end_pre')] },
      { label: '궁 아래 수로가 어디서 말랐는지 거슬러 올라가 본다', hint: '물길은 한 도시 쪽으로만 굽어 있다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'money', add: 5000 }, next('ep_alabasta_end_pre')] },
    ],
  },
  {
    id: 'ep_alabasta_sand', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '모래로 흩어진 왕',
    body: '마지막 일격이 갈고리 손의 사내를 꿰뚫는 순간, 그의 몸이 모래가 되어 바닥으로 흘러내린다. 지하의 등불이 흔들리고, 비웃음 섞인 목소리만 벽 틈으로 빠져나간다. 꼬마, 이 나라는 이미 내 손바닥 위다. 의자 위에는 모래 한 줌만 남았다.',
    doors: [
      { label: '모래가 빠져나간 벽 틈을 끝까지 쫓는다', hint: '사막에서 모래를 쫓는 일이다. 그래도 그가 나를 기억하게 된다', values: { dominion: D },
        fx: [{ op: 'person', kind: 'rival', relation: '레인 디너스 지하에서 모래로 흩어진 칠무해', canon: 'crocodile' }, { op: 'fame', add: 30 }, flag('ep_alabasta_pre'),
             time('레인 디너스의 지하에서 크로커다일을 물리쳤으나, 그는 모래가 되어 달아났다', 'crocodile')] },
      { label: '왕궁으로 달려가 본 것을 모두 알린다', hint: '아무도 믿지 않는다. 영웅의 이름은 아직 무너지지 않았다', values: { justice: D },
        fx: [{ op: 'fame', add: 15 }, flag('ep_alabasta_pre'), log('궁의 대신들은 크로커다일 님께서 그럴 리 없다고 고개를 저었다. 모래는 아무 증거도 남기지 않았다.')] },
      { label: '지하 금고에 남은 금화를 쓸어 담는다', hint: '바로크 워크스의 돈이다. 쫓기는 몸이 된다', values: { greed: D },
        fx: [{ op: 'money', add: 120000 }, flag('ep_alabasta_pre'), log('금화 자루를 메고 레인베이스를 빠져나왔다. 그날 밤부터 모래 위에 낯선 발자국이 따라붙었다.')] },
    ],
  },
  {
    id: 'ep_alabasta_sand_lose', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '말라붙은 몸',
    body: '갈고리 손이 목을 움켜쥐자 몸에서 물기가 빠져나간다. 정신을 차렸을 때 {name}은(는) 사막 한가운데에 버려져 있다. 멀리서 낙타 방울 소리가 다가온다. 물을 실은 상단이다.',
    doors: [
      { label: '상단의 물을 얻어 마시고 다시 일어선다', hint: '살아남은 것만으로 충분하다. 몸은 그날을 잊지 않는다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, flag('ep_alabasta_pre'), log('상단의 늙은 낙타몰이가 물주머니를 입에 대 주었다. 한 모금마다 목이 타들어 갔다.')] },
      { label: '그 손아귀를 다시 넘어서겠다고 다짐한다', hint: '모래 위에 다짐을 새긴다. 언젠가는 다시 맞선다', values: { ambition: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'person', kind: 'rival', relation: '사막에 나를 버린 칠무해', canon: 'crocodile' }, flag('ep_alabasta_pre')] },
    ],
  },
  {
    id: 'ep_alabasta_end_pre', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '모래바람이 지난 뒤',
    body: '한 해가 지나도 수도에는 비가 오지 않는다. 레인 디너스의 불빛은 여전히 밝고, 신문은 크로커다일이 또 해적을 쫓아냈다고 쓴다. {name}은(는) 모래 언덕 위에서 아르바나 쪽을 돌아본다. 이 나라의 끝은 아직 오지 않았다.',
    doors: [
      { label: '언젠가 이 나라에 비가 오는 날을 보러 오겠다고 한다', hint: '사막의 바람에 약속을 실어 보낸다', values: { romance: D },
        fx: [flag('ep_alabasta_pre'), log('모래 위에 손가락으로 약속을 적었다. 바람이 금세 지워 버렸지만, 그 말은 남았다.')] },
      { label: '짐을 꾸려 다른 섬으로 떠난다', hint: '모래도, 영웅도, 반란도 뒤에 남긴다', values: { freedom: D },
        fx: [flag('ep_alabasta_pre'), { op: 'base', key: 'spd', add: 1 }] },
      { label: '이 나라에서 본 것을 밑천 삼아 몸을 단련한다', hint: '칠무해가 어떤 자인지 안다. 그만큼 강해져야 한다', values: { ambition: D },
        fx: [flag('ep_alabasta_pre'), { op: 'base', key: 'str', add: 1 }, { op: 'hardship', add: 1 }] },
    ],
  },

  // ================================================================ 원작 그 무렵 (주인공 17~18): 아르바나의 다른 전선
  {
    id: 'ep_alabasta_war', kind: 'door', when: at(on(ISL), age(17, 18), not('ep_alabasta_war'), not('ep_alabasta_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '나노하나의 가짜 왕',
    body: '항구 도시 나노하나의 밤, 국왕 코브라가 병사들을 이끌고 나타나 창고에 불을 지른다. 불길 속에서 왕은 이상하게도 발끝으로 빙글빙글 돈다. 다음 날 아침, 반란군에 들겠다는 사람들이 모래 위에 길게 줄을 선다.',
    doors: [
      { label: '불을 지르는 왕의 앞을 막아선다', hint: '왕의 주먹이 발레처럼 날아든다. 왕이 아니다', values: { dominion: D }, danger: true,
        fx: [time('나노하나에 나타난 가짜 국왕과 맞섰다', 'bonclay'), fight('b_mr2', false, { win: 'ep_alabasta_fake', lose: 'ep_alabasta_march', back: 'ep_alabasta_march' })] },
      { label: '불을 끄는 사람들 틈에서 물을 나른다', hint: '모래도 끼얹는다. 밤새 창고 하나를 살린다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, time('나노하나가 가짜 국왕의 불에 탔다', 'bonclay'), next('ep_alabasta_march')] },
      { label: '발끝으로 도는 왕의 뒤를 밟는다', hint: '골목 끝에서 왕의 얼굴이 바뀌는 것을 보게 된다', values: { inquiry: D },
        fx: [time('나노하나에 나타난 가짜 국왕의 뒤를 밟았다', 'bonclay'), next('ep_alabasta_fake')] },
    ],
  },
  {
    id: 'ep_alabasta_fake', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'bonclay' },
    title: '얼굴을 바꾸는 사내',
    body: '골목 끝에서 왕이 제 뺨을 툭 건드리자, 짙은 화장에 백조를 등에 멘 사내의 얼굴이 된다. 미스터 2 봉쿠레는 휘파람을 불며 가짜 병사들에게 수고했다고 외친다. 이 나라를 둘로 쪼갠 불은 가짜가 지른 것이었다.',
    doors: [
      { label: '본 것을 들고 반란군 진영으로 달린다', hint: '믿어 줄 사람이 한 명이라도 있으면 된다', values: { loyalty: D },
        fx: [flag('ep_alabasta_fakeproof'), next('ep_alabasta_march')] },
      { label: '왕궁 병사들에게 먼저 알린다', hint: '성문이 닫히기 전에 닿아야 한다', values: { justice: D },
        fx: [flag('ep_alabasta_fakeproof'), { op: 'fame', add: 5 }, next('ep_alabasta_gate')] },
      { label: '사내의 뒤를 더 밟아 조직의 다음 수를 엿본다', hint: '수도 한복판에 무언가가 숨겨져 있다는 말을 듣는다', values: { ambition: D },
        fx: [{ op: 'mastery', branch: 'observation', add: 1 }, next('ep_alabasta_evac')] },
    ],
  },
  {
    id: 'ep_alabasta_march', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'koza' },
    title: '수도로 가는 행렬',
    body: '반란군 수십만이 모래먼지를 일으키며 수도 아르바나로 향한다. 맨 앞의 코자가 이것이 마지막 싸움이라고 외친다. 성벽 위에서는 왕궁 병사들이 활시위를 당긴다. 아무도 멈출 수 없는 행렬 속에 {name}도 휩쓸려 있다.',
    doors: [
      { label: '옛 천막의 인연으로 코자 곁에 선다', hint: '그는 알아본다. 그리고 등을 맡긴다', when: [has('ep_alabasta_rebel')], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '아르바나까지 함께 걸은 반란군 우두머리', canon: 'koza' }, time('반란군과 함께 수도 아르바나로 진군했다', 'koza'), next('ep_alabasta_gate')] },
      { label: '행렬의 맨 앞에서 성문으로 달린다', hint: '흙먼지 속에서 칼과 칼이 처음 부딪치는 자리다', values: { dominion: D },
        fx: [time('반란군이 수도 아르바나로 진군했다', 'koza'), next('ep_alabasta_gate')] },
      { label: '행렬을 빠져나와 성 안 골목으로 숨어든다', hint: '싸움이 시작되면 가장 먼저 다치는 사람들이 그곳에 있다', values: { peace: D },
        fx: [time('반란군이 수도 아르바나로 진군했다', 'koza'), next('ep_alabasta_evac')] },
    ],
  },
  {
    id: 'ep_alabasta_gate', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '광장의 흙먼지',
    body: '아르바나의 광장에서 반란군과 왕궁 병사가 뒤엉킨다. 지붕 위에서는 바로크 워크스의 요원들이 양쪽에 번갈아 총을 쏘며 불을 지핀다. 쓰러진 사람 가운데 누가 어느 편이었는지 이제는 아무도 모른다.',
    doors: [
      { label: '지붕 위의 저격수들을 덮친다', hint: '총구를 하나씩 꺾는다. 등에 총알 자국이 남는다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 20 }, { op: 'mastery', branch: 'fist', add: 1 }, next('ep_alabasta_speech')] },
      { label: '가짜 왕의 이야기를 양쪽에 외친다', hint: '몇몇은 칼을 멈춘다. 몇몇에게는 들리지 않는다', when: [has('ep_alabasta_fakeproof')], values: { justice: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'base', key: 'luk', add: 1 }, next('ep_alabasta_speech')] },
      { label: '쓰러진 사람을 편 가리지 않고 끌어낸다', hint: '반란군의 붕대와 왕궁의 붕대는 같은 천이다', values: { justice: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'wil', add: 1 }, next('ep_alabasta_speech')] },
    ],
  },
  {
    id: 'ep_alabasta_evac', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '시계탑 아래의 골목',
    body: '광장 옆 골목마다 아이와 노인이 숨어 떨고 있다. 시계탑 쪽으로 몇 사람이 내달리고, 밀짚모자 해적단의 누군가가 폭탄이 있다고 외친다. 그쪽은 그들에게 맡기고, {name}은(는) 등 뒤의 문을 하나씩 두드린다.',
    doors: [
      { label: '주민들을 이끌고 성 밖 우물터로 빠진다', hint: '줄의 맨 끝을 지킨다. 아무도 뒤처지지 않게', values: { loyalty: D },
        fx: [{ op: 'fame', add: 10 }, { op: 'base', key: 'luk', add: 1 }, next('ep_alabasta_speech')] },
      { label: '폭탄을 찾는 사람들에게 시계탑 지름길을 알려 준다', hint: '그 뒤의 일은 그들의 몫이다. 달려가는 뒷모습이 오래 남는다', values: { romance: D },
        fx: [time('시계탑으로 달려가는 밀짚모자 해적단에게 길을 알려 주었다', 'vivi'), next('ep_alabasta_speech')] },
      { label: '무너진 집의 돌더미를 혼자 들어 올린다', hint: '이 팔로 얼마나 버틸 수 있는지 알게 된다. 그 아래 사람이 있다', values: { ambition: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'str', add: 1 }, next('ep_alabasta_speech')] },
    ],
  },
  {
    id: 'ep_alabasta_speech', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'vivi' },
    title: '아르바나에 내리는 비',
    body: '하늘 높이에서 굉음이 울리고, 한참 뒤 광장 위로 모래 먼지 대신 빗방울이 떨어진다. 피투성이 병사들이 칼을 든 채 고개를 든다. 무너진 광장 한가운데서 공주가 목이 쉬도록 외친다. 싸움을 멈춰 주세요.',
    doors: [
      { label: '빗속에서 칼을 내려놓는 사람들을 지켜본다', hint: '석 해 만의 비다. 누군가 울고, 누군가 웃는다', values: { romance: D },
        fx: [flag('ep_alabasta_war'), time('밀짚모자의 소년이 크로커다일을 쓰러뜨리고, 아르바나에 비가 내렸다', 'crocodile'),
             time('비비 공주의 외침이 광장의 싸움을 멈춰 세웠다', 'vivi')] },
      { label: '아무에게도 말하지 않고 광장을 떠난다', hint: '이 나라의 내일은 이 나라 사람들의 것이다', values: { freedom: D },
        fx: [flag('ep_alabasta_war'), time('아르바나에 비가 내리는 것을 보고 떠났다', 'crocodile')] },
      { label: '미스 웬즈데이였던 공주와 빗속에서 눈을 맞춘다', hint: '그녀가 알아보고, 아주 작게 고개를 숙인다', when: [has('ep_alabasta_vivi')], values: { loyalty: D },
        fx: [flag('ep_alabasta_war'), { op: 'person', kind: 'ally', relation: '빗속의 아르바나에서 다시 만난 공주', canon: 'vivi' },
             time('비비 공주의 외침이 광장의 싸움을 멈춰 세웠다', 'vivi')] },
    ],
  },

  // ================================================================ 원작 뒤 (주인공 19~): 다시 흐르는 강, 탈옥한 모래의 사내
  {
    id: 'ep_alabasta_after', kind: 'door', when: at(on(ISL), age(19, 60), not('ep_alabasta_done')), weight: 25, repeat: 'once', speaker: 'hero',
    title: '다시 흐르는 강',
    body: '비가 돌아오고 마른 강바닥에 물이 차오른다. 유바의 오아시스에도 풀이 돋고, 토토 노인은 이제 삽 대신 물통을 들고 다닌다. 아르바나의 광장에는 그날의 흔적을 덮은 새 돌이 깔리고 있다.',
    doors: [
      { label: '유바에 남아 오아시스를 넓히는 일을 거든다', hint: '노인이 웃으며 삽을 하나 더 내민다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, next('ep_alabasta_rebuild')] },
      { label: '광장의 새 돌에 새길 이름들을 모으러 다닌다', hint: '그날 쓰러진 사람들은 양쪽 모두 이 나라 사람이었다', values: { loyalty: D },
        fx: [{ op: 'base', key: 'luk', add: 1 }, next('ep_alabasta_rebuild')] },
      { label: '옛 레인 디너스의 폐허를 찾아간다', hint: '모래에 덮인 지하에 아직 남은 것이 있다', when: [has('ep_alabasta_pre')], values: { inquiry: D },
        fx: [{ op: 'money', add: 40000 }, log('무너진 지하 금고에서 바로크 워크스의 낡은 지령서 몇 장을 찾았다. 그 시절의 암호가 아직 눈에 익었다.'), next('ep_alabasta_rebuild')] },
    ],
  },
  {
    id: 'ep_alabasta_rebuild', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'koza' },
    title: '모래 위의 집짓기',
    body: '코자는 이제 칼 대신 측량줄을 들고 다닌다. 반란군이었던 사내들과 왕궁 병사였던 사내들이 한 지붕의 들보를 함께 올린다. 이따금 공주가 들러 흙투성이 손으로 벽돌을 나른다.',
    doors: [
      { label: '들보 하나를 어깨에 메고 함께 올린다', hint: '지붕 아래에서 누군가 고맙다고 한다', values: { justice: D },
        fx: [{ op: 'base', key: 'str', add: 1 }, { op: 'person', kind: 'ally', relation: '모래 위에 함께 집을 지은 옛 반란군 우두머리', canon: 'koza' }, next('ep_alabasta_epilogue')] },
      { label: '이 나라가 겪은 일을 글로 남긴다', hint: '가짜 왕, 가루, 비. 잊히기 전에 적어 둔다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, next('ep_alabasta_epilogue')] },
      { label: '다 지어지기 전에 다음 섬으로 떠난다', hint: '지붕이 올라가는 것은 뒤돌아보며 본다', values: { freedom: D },
        fx: [flag('ep_alabasta_done'), log('지붕이 반쯤 올라간 마을을 뒤로하고 모래 언덕을 넘었다.')] },
    ],
  },
  {
    id: 'ep_alabasta_croc', kind: 'door', when: at(on(ISL), age(20, 60), not('ep_alabasta_duel')), weight: 15, repeat: 'once', speaker: { canon: 'crocodile' },
    title: '사막을 건너는 모래의 사내',
    body: '임펠 다운이 뚫렸다는 소식이 들리고 얼마 뒤, 사막 깊은 곳의 폐허에서 시가 연기가 오른다. 칠무해의 자리를 잃은 크로커다일이 미스터 1을 데리고 옛 나라를 스쳐 지나는 중이다. 그가 {name}을(를) 힐끗 보고는, 이 나라엔 이제 볼일이 없다고 말한다.',
    doors: [
      { label: '물러서지 않고 모래의 사내에게 덤벼든다', hint: '감옥을 나온 사막의 왕이다. 지면 모래 속에 묻힌다', when: [ready(5)], values: { dominion: D }, danger: true,
        fx: [flag('ep_alabasta_duel'), time('임펠 다운을 나온 크로커다일과 사막에서 맞붙었다', 'crocodile'),
             fight('b_crocodile', true, { win: 'ep_alabasta_dune_win', lose: 'ep_alabasta_epilogue', back: 'ep_alabasta_epilogue' })] },
      { label: '시가 연기가 모래 언덕 너머로 사라질 때까지 지켜본다', hint: '그는 이 나라를 돌아보지 않는다', values: { peace: D },
        fx: [flag('ep_alabasta_duel'), time('사막을 지나는 크로커다일을 멀리서 보았다', 'crocodile')] },
      { label: '곁의 칼날 사내에게 먼저 칼끝을 겨눈다', hint: '온몸이 칼인 상대다. 모래의 사내는 구경만 한다', when: [ready(3)], values: { ambition: D }, danger: true,
        fx: [flag('ep_alabasta_duel'), fight('b_mr1_ab', false, { win: 'ep_alabasta_epilogue', lose: 'ep_alabasta_epilogue', back: 'ep_alabasta_epilogue' })] },
    ],
  },
  {
    id: 'ep_alabasta_dune_win', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'crocodile' },
    title: '모래로 흩어진 웃음',
    body: '마지막 일격에 크로커다일의 몸이 다시 모래가 되어 바람에 흩어진다. 언덕 너머에서 그의 목소리가 낮게 웃는다. 꽤 하는군. 다음은 신세계에서 보자. 모래 위에는 꺼지지 않은 시가 하나만 남는다.',
    doors: [
      { label: '꺼지지 않은 시가를 짓밟아 끄고 언덕 너머로 외친다', hint: '다음에도 이긴다고. 바람이 그 말을 실어 간다', values: { dominion: D },
        fx: [{ op: 'fame', add: 60 }, { op: 'person', kind: 'rival', relation: '사막에서 두 번 모래로 흩어진 옛 칠무해', canon: 'crocodile' },
             time('사막에서 크로커다일을 물리쳤으나, 그는 모래가 되어 신세계로 떠났다', 'crocodile'), next('ep_alabasta_epilogue')] },
      { label: '신세계에서 보자는 말을 가슴에 새긴다', hint: '그 바다에서 다시 만날 날을 기다린다', values: { romance: D },
        fx: [{ op: 'fame', add: 60 }, { op: 'base', key: 'wil', add: 1 },
             time('사막에서 크로커다일을 물리쳤으나, 그는 모래가 되어 신세계로 떠났다', 'crocodile'), next('ep_alabasta_epilogue')] },
      { label: '모래의 사내를 이겼다는 소문을 사막에 퍼뜨린다', hint: '현상금 사냥꾼도 해적도 그 이름을 듣게 된다', values: { greed: D },
        fx: [{ op: 'fame', add: 90 }, time('사막에서 크로커다일을 물리쳤다는 소문이 퍼졌다', 'crocodile'), next('ep_alabasta_epilogue')] },
    ],
  },
  {
    id: 'ep_alabasta_epilogue', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '모래 위의 발자국',
    body: '해 질 녘 사막에 비 냄새가 섞인 바람이 분다. 이 나라는 가뭄과 거짓말과 싸움을 지나 다시 걷기 시작했다. {name}은(는) 모래 위에 찍힌 제 발자국을 돌아본다.',
    doors: [
      { label: '모래 언덕을 넘어 다음 섬으로 간다', hint: '발자국은 바람이 지운다', values: { freedom: D },
        fx: [flag('ep_alabasta_done'), log('알라바스타를 떠났다. 등 뒤에서 오아시스의 물소리가 오래 들렸다.')] },
      { label: '언젠가 돌아올 수 있게 우물가에 이름을 새긴다', hint: '노인이 그 옆에 물을 한 바가지 부어 준다', values: { romance: D },
        fx: [flag('ep_alabasta_done'), log('유바의 우물가 돌에 이름을 새겼다. 토토 노인이 그 옆에 물을 한 바가지 부었다.')] },
      { label: '비에 실려 온 장사꾼들과 거래를 트고 떠난다', hint: '되살아난 나라에는 사고팔 것이 넘친다', values: { greed: D },
        fx: [flag('ep_alabasta_done'), { op: 'money', add: 60000 }] },
    ],
  },
];
