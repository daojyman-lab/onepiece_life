// 섬 장편 에피소드: loguetown (v6.6). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 시작과 끝의 마을. 세 시기로 나뉜다.
//  - 원작 전 (13~15): 처형대 아래의 가짜 보물 지도 사기단, 연기의 대령 스모커의 단속, 타시기.
//  - 원작의 날 (17): 버기가 고무 소년을 처형대에 세우고 벼락이 떨어진 날. 주인공은 처형대가 아닌 다른 전선에 있다.
//  - 원작 뒤 (19~): 스모커가 떠난 거리, 옛 얼굴들, 다음 세대에게 넘어간 해적왕의 전설.
// 원작의 순간: 루피의 처형대 · 버기 · 드래곤 · 스모커의 추격은 원작 그대로 흘러간다. 버기와는 처형대가 아닌 항구에서 붙는다.
import type { Cond, Standing, Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at, st, GROWN } from '../turnings/paths';

export const FOES_LOGUETOWN: FoeDef[] = [
  // 로그타운 주둔 시절의 스모커 (원작 스모커 b_smoker는 위대한 항로 입구의 상대라 이스트 블루용으로 따로 둔다)
  { id: 'b_smoker_lt', name: '흰 사냥꾼 스모커', title: '로그타운 해군 대령', canon: 'smoker', p: 40, sea: 'east', bias: { vit: 1.1, wil: 1 }, faction: 'marine', fruitClass: 'logia', armament: 1, skills: ['fruit:moku:0', 'fruit:moku:1', 'fruit:moku:3', 'fist_jab'], tactic: 'defense' },
  { id: 'b_mapcon', name: '먹물손 도링', title: '가짜 지도 사기단 두목', p: 22, sea: 'east', bias: { int: 1.3, vit: 0.9 }, age: 41,
    skills: ['gun_shot', 'gun_quick', 'gun_smoke', 'fist_guard'], tactic: 'counter' },
];

/** 감옥에 갇히지 않은 사람 (아이 포함) */
const FREE: Standing[] = ['child', ...GROWN];
const LT: Cond = on('로그타운');

export const EP_LOGUETOWN: Turning[] = [
  // ================================================================ 원작 전 (주인공 13~15)
  {
    id: 'ep_loguetown_1', kind: 'door', when: at(LT, age(13, 15), st(...FREE), not('ep_loguetown_pre_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '처형대 아래의 지도 장수',
    body: '광장 한가운데 해적왕이 목숨을 잃은 처형대가 그늘을 드리운다. 그 그늘 아래서 콧수염 사내가 누렇게 바랜 종이를 펼치며 속삭인다. 해적왕이 숨긴 보물의 지도라고. 갓 깃발을 올린 풋내기 해적들이 눈을 반짝이며 지갑을 연다.',
    doors: [
      { label: '지도 장수의 뒤를 밟는다', hint: '창고 골목 어딘가에 지도를 찍어 내는 곳이 있을 것이다', values: { inquiry: D },
        fx: [next('ep_loguetown_map1')] },
      { label: '풋내기 해적들에게 사기라고 귀띔한다', hint: '소란이 커지면 흰 연기가 몰려온다', values: { justice: D },
        fx: [log('풋내기들이 지도 장수의 멱살을 잡자 광장이 술렁였다. 멀리서 시가 냄새가 풍겨 왔다.', 'light'), next('ep_loguetown_smoke1')] },
      { label: '지도를 몇 장 떼어다 되팔겠다고 나선다', hint: '사내가 씩 웃으며 두목에게 데려간다', values: { greed: D },
        fx: [flag('ep_loguetown_mapseller'), next('ep_loguetown_map2')] },
    ],
  },
  {
    id: 'ep_loguetown_map1', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '먹물 냄새의 창고',
    body: '부두 뒤 창고의 판자 틈으로 먹물 냄새와 등잔 연기가 새어 나온다. 안에서는 아이 몇이 낡은 종이를 찻물에 담가 누렇게 물들이고, 먹물손이라 불리는 두목이 그 위에 가짜 해골 도장을 찍는다. 막내로 보이는 리코라는 아이가 손등의 매 자국을 감추며 {name}과(와) 눈이 마주친다.',
    doors: [
      { label: '리코를 데리고 창고를 빠져나온다', hint: '두목이 곧 사라진 아이를 찾으러 온다', values: { loyalty: D },
        fx: [flag('ep_loguetown_riko'), { op: 'person', kind: 'ally', relation: '지도 사기단의 심부름꾼 리코' }, next('ep_loguetown_map3')] },
      { label: '해군 지부로 달려가 창고 자리를 알린다', hint: '대령의 부대는 망설이지 않는다', values: { peace: D },
        fx: [next('ep_loguetown_smoke1')] },
      { label: '창고 문을 걷어차고 사기단을 통째로 손에 넣는다', hint: '아이들과 인쇄판이 모두 내 것이 된다', special: 'dominion', values: { dominion: D }, danger: true,
        fx: [flag('ep_loguetown_boss'), fight('b_mapcon', false, { win: 'ep_loguetown_mapwin', lose: 'ep_loguetown_smoke1', back: 'ep_loguetown_pre_end' })] },
    ],
  },
  {
    id: 'ep_loguetown_map2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '가짜 지도 사기단 두목' },
    title: '먹물손의 심부름',
    body: '손톱 밑까지 먹물이 밴 두목이 지도 다발을 {name}의 품에 안긴다. 오늘 들어온 배의 애송이들한테 한 장에 금화 한 닢씩 받아 오라고. 부두에 가 보니 해골 깃발을 단 배는 뗏목만 하고, 선원이라고는 눈이 퀭한 소년 둘뿐이다.',
    doors: [
      { label: '시킨 대로 지도를 팔아넘긴다', hint: '두목의 신임과 묵직한 몫이 돌아온다', values: { ambition: D },
        fx: [{ op: 'money', add: 6000 }, { op: 'hardship', add: 1 }, next('ep_loguetown_map3')] },
      { label: '가짜라고 털어놓고 진짜 항로를 일러 준다', hint: '소년들이 고개를 숙인다. 두목의 눈 밖에 난다', values: { romance: D },
        fx: [log('소년들은 가짜 지도 대신 리버스 마운틴으로 가는 진짜 항로를 받아 적고 떠났다.', 'light'), flag('ep_loguetown_riko'),
             { op: 'person', kind: 'ally', relation: '지도 사기를 함께 털어놓은 꼬마 리코' }, next('ep_loguetown_map3')] },
      { label: '두목이 금고에 넣는 장부를 훔쳐본다', hint: '누구에게 무엇을 팔았는지 다 적혀 있다', values: { inquiry: D },
        fx: [flag('ep_loguetown_ledger'), { op: 'base', key: 'int', add: 1 }, next('ep_loguetown_map3')] },
    ],
  },
  {
    id: 'ep_loguetown_map3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '가짜 지도 사기단 두목' },
    title: '창고의 결판',
    body: '먹물손 도링이 창고 문을 등지고 선다. 허리춤의 단발 권총 두 자루에서 화약 냄새가 난다. 쥐새끼 한 마리가 장사를 망치려 든다고, 처형대 아래서 썩은 지도만 팔아 온 게 아니라고 낮게 웃는다.',
    doors: [
      { label: '두목에게 덤벼든다', hint: '총알이 날아온다. 이기면 창고가 열린다', values: { dominion: D }, danger: true,
        fx: [fight('b_mapcon', false, { win: 'ep_loguetown_mapwin', lose: 'ep_loguetown_smoke1', back: 'ep_loguetown_pre_end' })] },
      { label: '훔쳐본 장부를 해군 지부 게시판에 붙인다', hint: '싸우지 않고 사기단을 무너뜨린다', when: [has('ep_loguetown_ledger')], values: { justice: D },
        fx: [{ op: 'fame', add: 3 }, log('장부가 붙은 다음 날, 흰 연기가 창고를 덮쳤다. 먹물손은 뒷문으로 달아났다.'), next('ep_loguetown_smoke2')] },
      { label: '지도 한 장만 챙겨 창문으로 빠져나간다', hint: '사기단과의 일은 여기까지다', values: { freedom: D },
        fx: [log('창틀을 넘으며 쥔 가짜 지도 한 장. 그래도 언젠가 진짜 바다로 데려가 줄 것 같았다.', 'light'), next('ep_loguetown_pre_end')] },
    ],
  },
  {
    id: 'ep_loguetown_mapwin', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '지도 사기단의 꼬마 리코' },
    title: '찢어진 지도들',
    body: '먹물손이 지도 더미 위에 대자로 뻗었다. 아이들이 하나둘 구석에서 기어 나오고, 리코가 바닥에 흩어진 가짜 지도를 밟으며 묻는다. 이제 우리는 어떻게 되느냐고.',
    doors: [
      { label: '두목을 묶어 해군 지부에 넘긴다', hint: '대령이 시가를 문 채 고개를 끄덕인다', values: { justice: D },
        fx: [flag('ep_loguetown_mapbeat'), flag('ep_loguetown_smoker'), { op: 'fame', add: 5 },
             { op: 'person', kind: 'ally', relation: '사기꾼을 넘겨받은 연기의 대령', canon: 'smoker' }, next('ep_loguetown_pre_end')] },
      { label: '금고의 돈을 아이들과 나눈다', hint: '리코가 처음으로 웃는다', values: { loyalty: D },
        fx: [flag('ep_loguetown_mapbeat'), flag('ep_loguetown_riko'), { op: 'money', add: 4000 },
             { op: 'person', kind: 'ally', relation: '금고를 함께 연 꼬마 리코' }, next('ep_loguetown_pre_end')] },
      { label: '금고째 들고 사라진다', hint: '아이들의 눈길이 등에 박힌다', values: { greed: D },
        fx: [flag('ep_loguetown_mapbeat'), { op: 'money', add: 15000 }, next('ep_loguetown_pre_end')] },
    ],
  },
  {
    id: 'ep_loguetown_smoke1', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'smoker' },
    title: '흰 연기의 단속',
    body: '골목 끝에서 하얀 연기가 뱀처럼 기어 오더니 해적 셋을 한꺼번에 휘감아 벽에 처박는다. 연기가 모여 시가 두 대를 문 사내가 된다. 등에 멘 커다란 짓테를 툭툭 치며 스모커 대령이 {name}을(를) 내려다본다. 이 거리에서 해적 냄새를 풍기는 놈은 누구든 잡는다고.',
    doors: [
      { label: '보고 들은 것을 모두 털어놓는다', hint: '대령은 대답 없이 연기만 내뿜는다. 그래도 기억은 한다', values: { justice: D },
        fx: [flag('ep_loguetown_smoker'), { op: 'person', kind: 'ally', relation: '골목에서 만난 연기의 대령', canon: 'smoker' }, next('ep_loguetown_smoke2')] },
      { label: '연기 틈으로 몸을 낮춰 빠져나간다', hint: '등 뒤에서 혀 차는 소리가 들린다', values: { freedom: D },
        fx: [{ op: 'base', key: 'spd', add: 1 }, next('ep_loguetown_pre_end')] },
      { label: '짓테 앞에 서서 한 수 겨뤄 달라고 한다', hint: '잡으려는 싸움이 아니다. 대령의 진짜 힘을 몸으로 안다', when: [ready(3)], values: { ambition: D }, danger: true,
        fx: [flag('ep_loguetown_smoker'), { op: 'person', kind: 'rival', relation: '골목에서 겨룬 연기의 대령', canon: 'smoker' },
             fight('b_smoker_lt', false, { win: 'ep_loguetown_smoke2', lose: 'ep_loguetown_smoke2', back: 'ep_loguetown_smoke2' })] },
    ],
  },
  {
    id: 'ep_loguetown_smoke2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'tashigi' },
    title: '안경 쓴 상사',
    body: '해군 지부 마당에서 안경 쓴 여검사가 칼을 닦다가 {name}을(를) 알아본다. 대령님이 놓아주라고 하셨다고, 그분은 쓸 만한 놈은 잡아 두지 않는다고 한다. 말을 마치자마자 그녀는 물통에 걸려 넘어지고, 떨어진 안경을 더듬어 찾는다.',
    doors: [
      { label: '안경을 주워 주고 칼 쥐는 법을 묻는다', hint: '마당에서 해가 질 때까지 목검을 휘두른다', values: { romance: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'person', kind: 'ally', relation: '목검을 쥐여 준 상사', canon: 'tashigi' }, next('ep_loguetown_pre_end')] },
      { label: '지부 게시판의 수배서를 몰래 베껴 정보상에게 판다', hint: '부두의 정보상들 사이에 이름이 돈다', values: { greed: D },
        fx: [{ op: 'money', add: 5000 }, flag('ep_loguetown_broker'), next('ep_loguetown_pre_end')] },
      { label: '고개를 숙이고 조용히 지부를 나온다', hint: '연기 냄새가 옷에 오래 남는다', values: { peace: D },
        fx: [next('ep_loguetown_pre_end')] },
    ],
  },
  {
    id: 'ep_loguetown_pre_end', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '처형대의 그림자',
    body: '해 질 녘, {name}은(는) 다시 처형대 앞에 선다. 해적왕이 마지막에 웃었다는 그 자리. 내 보물을 원하느냐는 그 한마디에 온 세상이 바다로 나갔다고, 늙은 구두닦이가 백 번은 들은 이야기를 또 한다.',
    doors: [
      { label: '처형대를 올려다보며 바다에 나갈 날을 손꼽는다', hint: '언젠가 저 위의 웃음을 이해할 날이 온다', values: { romance: D },
        fx: [flag('ep_loguetown_pre_done'), log('처형대 그림자가 길게 늘어졌다. {name}은(는) 그 끝이 바다를 가리킨다고 생각했다.'), time('로그타운 처형대 아래에서 바다를 꿈꾸었다')] },
      { label: '이 거리를 지키는 쪽에 서겠다고 마음먹는다', hint: '해적이 몰려드는 마을에도 지킬 사람이 있다', values: { loyalty: D },
        fx: [flag('ep_loguetown_pre_done'), log('처형대 아래에서 {name}은(는) 바다보다 거리를 먼저 보기로 했다.')] },
      { label: '구두닦이에게 그날의 이야기를 끝까지 캐묻는다', hint: '아무도 적지 않은 해적왕의 마지막 얼굴을 듣는다', values: { inquiry: D },
        fx: [flag('ep_loguetown_pre_done'), { op: 'base', key: 'int', add: 1 }, log('구두닦이는 그날 빗방울 하나 없이 맑았다고 했다. 해적왕은 정말로 웃고 있었다고.')] },
    ],
  },

  // ================================================================ 원작의 날 (주인공 17)
  {
    id: 'ep_loguetown_storm1', kind: 'door', when: at(LT, age(17, 17), st(...FREE), not('ep_loguetown_storm_done')), weight: 40, repeat: 'once', speaker: 'hero',
    title: '처형대에 선 고무 소년',
    body: '광장이 사람으로 미어터진다. 처형대 위에서 빨간 코의 광대 선장이 밀짚모자를 쓴 소년을 형틀에 묶고 칼을 치켜든다. 광장 출구마다 광대 해적단과 쇠몽둥이 해적단의 졸개들이 막아섰고, 하늘은 대낮인데도 먹빛으로 내려앉는다. 멀리서 천둥이 우르릉 울린다.',
    doors: [
      { label: '출구를 막은 졸개들을 밀어내고 사람들이 빠져나갈 길을 연다', hint: '처형대가 아닌 광장 가장자리의 싸움이다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 5 }, time('버기가 밀짚모자를 처형대에 세운 날, 광장 출구의 졸개들을 쓰러뜨렸다', 'buggy'), next('ep_loguetown_storm_plaza')] },
      { label: '비가 쏟아지기 전에 노점 상인과 아이들을 처마 밑으로 이끈다', hint: '처마 밑에는 망토를 두른 낯선 사내가 서 있다', values: { peace: D },
        fx: [time('로그타운 처형대에 벼락이 떨어진 날, 빗속에서 사람들을 피신시켰다', 'dragon'), next('ep_loguetown_storm_dragon')] },
      { label: '해군 포위망이 좁혀 오는 광장을 벗어나 골목으로 달린다', hint: '흰 제복들이 해적이든 아니든 뛰는 놈은 다 쫓는다', values: { freedom: D },
        fx: [time('밀짚모자가 처형대에 선 날, 스모커의 포위망을 피해 골목을 달렸다', 'smoker'), next('ep_loguetown_storm_alley')] },
    ],
  },
  {
    id: 'ep_loguetown_storm_plaza', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '그을린 광대',
    body: '그날 벼락이 처형대를 두 동강 냈고, 밀짚모자를 쓴 소년은 웃으며 살아남았다. 소란이 가라앉지 않은 항구에서 {name}은(는) 온몸이 새카맣게 그을린 광대 선장과 쇠몽둥이 여선장이 남의 배 밧줄을 끊는 것을 본다. 고무 녀석을 쫓아 위대한 항로로 간다며 이를 간다.',
    doors: [
      { label: '항구 끝에서 광대 선장의 앞을 막는다', hint: '몸이 토막 나는 선장이다. 이겨도 그는 바다로 달아난다', when: [ready(1)], values: { justice: D }, danger: true,
        fx: [fight('b_buggy', false, { win: 'ep_loguetown_storm_end', lose: 'ep_loguetown_storm_end', back: 'ep_loguetown_storm_end' })] },
      { label: '무너진 처형대의 나뭇조각 하나를 주워 품에 넣는다', hint: '해적왕이 섰던 자리의 마지막 조각이다', values: { romance: D },
        fx: [flag('ep_loguetown_relic'), log('번개에 그을린 나뭇조각에서 아직 탄내가 났다.', 'light'), next('ep_loguetown_storm_end')] },
      { label: '선장을 놓친 광대 해적단 졸개들을 부두에서 몰아낸다', hint: '남겨진 졸개들은 우두머리 없이 흩어진다', values: { dominion: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'str', add: 1 }, next('ep_loguetown_storm_end')] },
    ],
  },
  {
    id: 'ep_loguetown_storm_dragon', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'dragon' },
    title: '처마 밑의 망토',
    body: '그날 처마 밑에서, 얼굴에 붉은 문신이 있는 사내는 젖은 망토 자락 사이로 처형대만 바라보고 있었다. 벼락이 떨어지던 순간 그가 아주 작게 웃었던 것을 {name}은(는) 아직 잊지 못한다. 그 뒤로 거리에는 그날 바람이 처형대 쪽으로만 불었다는 소문이 돈다.',
    doors: [
      { label: '그 사내가 누구였는지 수소문한다', hint: '이름을 아는 사람은 없고, 입을 다무는 사람만 있다', values: { inquiry: D },
        fx: [flag('ep_loguetown_dragon'), log('그 사내를 아는 사람은 모두 같은 말만 했다. 그런 사람은 본 적 없다고.'), next('ep_loguetown_storm_end')] },
      { label: '그날 비를 피하게 해 준 노점 상인들에게 사례를 받으러 간다', hint: '사과 한 바구니와 동전 몇 닢이 손에 들어온다', values: { greed: D },
        fx: [{ op: 'money', add: 3000 }, next('ep_loguetown_storm_end')] },
      { label: '바람이 처형대로만 불었다는 소문을 웃어넘긴다', hint: '세상은 하늘이 하는 일에 이유를 붙이고 싶어 할 뿐이다', values: { peace: D },
        fx: [next('ep_loguetown_storm_end')] },
    ],
  },
  {
    id: 'ep_loguetown_storm_alley', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'tashigi' },
    title: '빗속의 골목',
    body: '그날 골목에서 {name}을(를) 막아선 것은 안경 쓴 여검사였다. 칼끝을 겨눈 채 해적이냐고 묻던 그녀의 머리 위로, 흰 연기 한 줄기가 항구 쪽으로 날아갔다. 대령님이 밀짚모자를 쫓고 있다고, 그녀는 칼을 거두고 연기를 따라 뛰어갔다. 며칠 뒤 그녀가 다시 골목에 나타난다.',
    doors: [
      { label: '그날의 일을 묻는 그녀에게 해적들이 달아난 길을 알려 준다', hint: '그녀가 수첩에 적으며 고맙다고 한다', values: { justice: D },
        fx: [{ op: 'person', kind: 'ally', relation: '빗속의 골목에서 만난 상사', canon: 'tashigi' }, next('ep_loguetown_storm_end')] },
      { label: '지붕을 타고 다시 달아난다', hint: '빗물에 젖은 기와가 미끄럽다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7,
               then: [{ op: 'base', key: 'spd', add: 1 }, log('지붕에서 지붕으로 건너뛰는 동안 등 뒤의 호루라기 소리가 멀어졌다.', 'light')],
               else: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -10 }, log('기와가 미끄러져 골목에 떨어졌다. 그래도 붙잡히지는 않았다.', 'light')] },
             next('ep_loguetown_storm_end')] },
      { label: '그날 거둔 칼을 다시 뽑아 보라고 맞선다', hint: '그녀가 안경을 고쳐 쓰며 목검을 던져 준다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -8 }, { op: 'mastery', branch: 'sword', add: 6 }, { op: 'person', kind: 'rival', relation: '골목에서 맞선 상사', canon: 'tashigi' }, next('ep_loguetown_storm_end')] },
    ],
  },
  {
    id: 'ep_loguetown_storm_end', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'smoker' },
    title: '연기가 떠나는 날',
    body: '해군 지부 앞 부두에 군함이 돛을 올린다. 스모커 대령이 시가를 씹으며 트랩을 오른다. 밀짚모자를 위대한 항로까지 쫓겠다고, 이 거리는 이제 다른 놈이 지키라고. 갑판 위에서 안경 쓴 상사가 허둥지둥 짐을 끌어 올린다.',
    doors: [
      { label: '부두 끝에서 군함을 배웅한다', hint: '대령이 돌아보지도 않고 손만 든다', values: { loyalty: D },
        fx: [flag('ep_loguetown_storm_done'), flag('ep_loguetown_smoker'), time('스모커가 밀짚모자를 쫓아 로그타운을 떠나는 것을 배웅했다', 'smoker')] },
      { label: '나도 언젠가 저 항로로 간다고 다짐한다', hint: '리버스 마운틴 너머의 바다가 처음으로 가깝게 느껴진다', values: { ambition: D },
        fx: [flag('ep_loguetown_storm_done'), { op: 'base', key: 'wil', add: 1 }, time('스모커가 위대한 항로로 떠난 날, 그 뒤를 따르리라 다짐했다', 'smoker')] },
      { label: '처형대가 사라진 광장에서 하루를 보낸다', hint: '목수들이 새 처형대를 세울 나무를 나른다', values: { peace: D },
        fx: [flag('ep_loguetown_storm_done'), log('처형대가 사라진 광장은 생각보다 넓었다. 아이들이 그 자리에서 해적 놀이를 했다.')] },
    ],
  },

  // ================================================================ 원작 뒤 (주인공 19~)
  {
    id: 'ep_loguetown_after1', kind: 'door', when: at(LT, age(19, 45), st(...GROWN), not('ep_loguetown_done')), weight: 25, repeat: 'once', speaker: 'hero',
    title: '새 처형대 앞에서',
    body: '광장에는 새로 세운 처형대가 서 있다. 그 앞에서 밀짚모자를 눌러쓴 꼬마들이 나뭇가지 칼을 휘두르며 해적왕 놀이를 한다. 게시판에는 웃는 얼굴의 수배서가 바람에 펄럭이고, 흰 연기의 대령이 지키던 지부에는 낯선 깃발이 걸려 있다.',
    doors: [
      { label: '꼬마들의 놀이에 끼어든다', hint: '누가 해적왕을 할지 다투는 중이다', values: { romance: D },
        fx: [next('ep_loguetown_after_kids')] },
      { label: '부두 뒤의 옛 골목으로 발길을 돌린다', hint: '그 시절의 얼굴이 아직 남아 있을지 모른다', values: { loyalty: D },
        fx: [next('ep_loguetown_after_bar')] },
      { label: '주인이 바뀐 해군 지부에 들른다', hint: '연기 냄새가 사라진 마당이 어색하다', values: { justice: D },
        fx: [next('ep_loguetown_after_base')] },
    ],
  },
  {
    id: 'ep_loguetown_after_bar', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '부두 뒤 술집의 주인' },
    title: '처형대 아래 한 잔',
    body: '옛 사기단 창고 자리에 작은 술집이 들어섰다. 간판에는 처형대 아래 한 잔이라고 적혀 있고, 벽에는 누렇게 바랜 가짜 보물 지도가 액자에 걸려 있다. 잔을 닦던 젊은 주인이 {name}의 얼굴을 한참 보더니 손을 멈춘다.',
    doors: [
      { label: '리코의 이름을 부른다', hint: '그 시절 창고의 막내가 이제 이 술집의 주인이다', when: [has('ep_loguetown_riko')], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '술집 주인이 된 리코' }, { op: 'hp', add: 10 },
             log('리코는 말없이 가장 좋은 술을 따랐다. 액자 속 가짜 지도는 그날 창고에서 마지막으로 남은 한 장이었다.'), next('ep_loguetown_after_con')] },
      { label: '액자 속 가짜 지도를 팔던 날을 털어놓는다', hint: '주인이 웃는다. 이 거리에선 다들 한 번쯤 속았다고', when: [has('ep_loguetown_mapseller')], values: { peace: D },
        fx: [log('부끄러운 옛일을 꺼내자 주인은 오히려 한 잔을 더 따랐다.', 'light'), next('ep_loguetown_after_con')] },
      { label: '요즘 부두에 도는 소문을 산다', hint: '처형대 아래서 또 지도를 파는 놈들이 있다고 한다', values: { inquiry: D },
        fx: [{ op: 'money', add: -1000 }, next('ep_loguetown_after_con')] },
      { label: '주인에게 술값 대신 가게를 통째로 사겠다고 한다', hint: '부두의 소문이 모두 이 탁자로 모인다', special: 'greed', values: { greed: D },
        fx: [{ op: 'money', add: -20000 }, flag('ep_loguetown_broker'), log('술집의 뒷방은 부두에서 가장 비싼 소문이 오가는 곳이 되었다.'), next('ep_loguetown_after_con')] },
    ],
  },
  {
    id: 'ep_loguetown_after_base', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '새로 온 지부장' },
    title: '연기가 떠난 지부',
    body: '새 지부장은 배가 나온 중령이다. 해적이 너무 많아 다 잡을 수도 없다며 하품을 한다. 스모커 대령이 있을 때는 이 거리에 해적이 하룻밤도 못 묵었다고, 늙은 수병 하나가 마당을 쓸며 중얼거린다. 요즘은 처형대 아래서 또 가짜 지도가 팔린다고.',
    doors: [
      { label: '지부장 대신 가짜 지도 장수들을 쫓는다', hint: '아무도 하지 않으니 내가 한다', values: { justice: D },
        fx: [{ op: 'fame', add: 3 }, next('ep_loguetown_after_con')] },
      { label: '늙은 수병에게 대령이 떠난 뒤의 이야기를 듣는다', hint: '위대한 항로에서 대령의 소식이 가끔 들려온다고 한다', when: [has('ep_loguetown_smoker')], values: { loyalty: D },
        fx: [log('스모커는 위대한 항로 어딘가에서 여전히 밀짚모자를 쫓고 있다고 했다. 수병은 그 이야기를 할 때만 허리를 폈다.'), next('ep_loguetown_after_con')] },
      { label: '지부장의 뒷돈 장부를 찾아 입막음 값을 받아 낸다', hint: '중령이 이를 갈며 돈주머니를 내민다', values: { greed: D }, danger: true,
        fx: [{ op: 'money', add: 12000 }, log('중령은 장부를 돌려받고도 한동안 {name}의 얼굴만 보면 식은땀을 흘렸다.'), next('ep_loguetown_after_con')] },
    ],
  },
  {
    id: 'ep_loguetown_after_kids', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '밀짚모자를 쓴 꼬마' },
    title: '해적왕 놀이',
    body: '밀짚모자를 쓴 꼬마가 나뭇가지를 {name}에게 겨눈다. 그날 여기 있었느냐고, 진짜로 하늘에서 번개가 떨어져서 고무 해적을 살려 줬느냐고. 다른 꼬마들도 놀이를 멈추고 우르르 모여든다.',
    doors: [
      { label: '그날 품에 넣은 처형대 조각을 꺼내 보인다', hint: '꼬마들의 눈이 동그래진다', when: [has('ep_loguetown_relic')], values: { romance: D },
        fx: [{ op: 'fame', add: 2 }, log('{name}은(는) 그을린 나뭇조각을 밀짚모자 꼬마의 손에 쥐여 주었다. 다음 세대가 가질 몫이었다.'), time('로그타운의 아이들에게 처형대의 마지막 조각을 물려주었다'), next('ep_loguetown_after_con')] },
      { label: '그날 본 것을 있는 그대로 들려준다', hint: '꼬마들은 번개보다 웃는 얼굴 이야기에 더 귀를 기울인다', values: { romance: D },
        fx: [log('해적왕도, 밀짚모자도 처형대 위에서 웃었다. 꼬마들은 그 대목을 몇 번이고 다시 해 달라고 졸랐다.'), next('ep_loguetown_after_con')] },
      { label: '나뭇가지 대신 주먹 쥐는 법부터 가르친다', hint: '꼬마 하나가 끝까지 따라 하며 이를 악문다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'ally', relation: '주먹을 가르쳐 준 밀짚모자 꼬마' }, next('ep_loguetown_after_con')] },
    ],
  },
  {
    id: 'ep_loguetown_after_con', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '가짜 지도 장수' },
    title: '밀짚모자의 지도',
    body: '처형대 아래서 또 지도가 팔린다. 이번에는 해적왕의 보물이 아니라 밀짚모자가 지나간 항로라고 한다. 지도 다발을 든 사내의 손톱 밑이 먹물로 새카맣다. 그가 고개를 들자 오래 묵은 흉터가 보인다.',
    doors: [
      { label: '먹물손이라 부르며 지부로 걸어가라고 턱짓한다', hint: '그 시절 창고에서 쓰러뜨린 얼굴을 그는 잊지 않았다', when: [has('ep_loguetown_mapbeat')], values: { justice: D },
        fx: [{ op: 'fame', add: 3 }, log('먹물손은 {name}의 얼굴을 보자마자 지도 다발을 떨어뜨렸다. 그리고 순순히 지부까지 걸어갔다.'), next('ep_loguetown_after_end')] },
      { label: '지도 장수에게 덤벼든다', hint: '총을 쥔 손이 아직 빠르다', values: { dominion: D }, danger: true,
        fx: [fight('b_mapcon', false, { win: 'ep_loguetown_after_end', lose: 'ep_loguetown_after_end', back: 'ep_loguetown_after_end' })] },
      { label: '지도를 사려는 풋내기들에게 진짜 바다 이야기를 해 준다', hint: '장사꾼이 혀를 차며 자리를 옮긴다', values: { freedom: D },
        fx: [log('풋내기들은 가짜 지도를 내려놓고 {name}의 이야기를 받아 적었다. 리버스 마운틴, 로그 포스, 그리고 처형대의 웃음.'), next('ep_loguetown_after_end')] },
    ],
  },
  {
    id: 'ep_loguetown_after_end', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '시작과 끝의 마을',
    body: '저녁 바람에 새 처형대의 밧줄이 삐걱인다. 이 거리에서 해적왕이 죽었고, 고무 소년이 웃었고, 연기의 대령이 떠났다. 오늘도 부두에는 해골 깃발을 단 작은 배가 들어오고, 누군가는 처형대를 올려다보며 침을 꿀꺽 삼킨다.',
    doors: [
      { label: '갓 들어온 풋내기 배에 로그 포스 하나를 던져 준다', hint: '저 배가 어디까지 갈지는 아무도 모른다', values: { freedom: D },
        fx: [flag('ep_loguetown_done'), { op: 'money', add: -2000 }, time('로그타운에서 새 세대의 풋내기에게 항로를 열어 주었다')] },
      { label: '처형대 아래 벤치에 앉아 해가 질 때까지 머문다', hint: '이 거리의 이야기는 이제 지켜보는 쪽이 된다', values: { peace: D },
        fx: [flag('ep_loguetown_done'), log('처형대 그림자가 길게 늘어졌다. 어릴 적 본 것과 같은 그림자였다.')] },
      { label: '그날 망토의 사내가 섰던 처마 밑에 서 본다', hint: '사내가 무엇을 보고 웃었는지 이제는 조금 알 것 같다', when: [has('ep_loguetown_dragon')], values: { inquiry: D },
        fx: [flag('ep_loguetown_done'), log('신문에는 혁명군이라는 이름이 점점 자주 실렸다. 그 처마 밑에서 {name}은(는) 그날의 바람을 다시 느꼈다.')] },
      { label: '처형대 위에 올라가 거리를 내려다본다', hint: '광장의 사람들이 웅성거리며 올려다본다', special: 'dominion', values: { dominion: D }, danger: true,
        fx: [flag('ep_loguetown_done'), { op: 'fame', add: 10 }, log('처형대 위에서 내려다본 광장은 작았다. 해적왕도 이 높이에서 세상을 보았을 것이다.'), time('로그타운의 처형대 위에 올라섰다')] },
    ],
  },
];
