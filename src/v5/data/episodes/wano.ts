// 섬 장편 에피소드: wano (v6.6). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 와노쿠니. 원작의 때(주인공 나이): 두 살 무렵 광월 오뎅이 끓는 가마솥에서 처형되고, 쿠로즈미 오로치가 쇼군이 되어 카이도와 나라를 쥔다.
// 원작 전(열하나~스물): 공장 · 숨은 도장 · 백수 해적단 · 밀수 · 에비스 마을 · 우동의 감옥 · 밀항, 그리고 경지에 오르면 카이도와의 목숨을 건 싸움.
//   카이도는 걸맞은 죽음을 찾는 자다. 이겨도 카이도는 피를 흘리며 웃고 떠난다(원작은 그대로).
// 원작 그 무렵(스물하나~스물둘): 불의 축제 밤의 오니가시마 습격. 카이도를 쓰러뜨리는 것은 루피다. 주인공은 다른 전선(성 안의 간부 · 지하 공장 · 꽃의 도시)에 선다.
// 원작 뒤(스물셋~): 나라가 열리고 모모노스케가 쇼군이 되고 쿠리가 살아난다. 앞에서 만난 사람이 다시 나온다.
import type { Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at } from '../turnings/paths';

const WANO = on('와노쿠니', '하나노미야코', '쿠리', '에비스 마을');

export const FOES_WANO: FoeDef[] = [
  { id: 'b_orochi', name: '쿠로즈미 오로치', title: '와노쿠니의 쇼군', p: 45, sea: 'nw_late', bias: { int: 1.4, str: 0.7 },
    skills: ['sword_cut', 'sword_parry', 'fist_guard'], tactic: 'defense', fruitClass: 'zoan', age: 50 },
  { id: 'b_gifter', name: '이름 없는 기프터 대장', title: '백수 해적단 기프터', p: 90, sea: 'nw_late', bias: { str: 1.3 },
    skills: ['fist_combo', 'fist_iron', 'sword_cut', 'arm_hard'], tactic: 'offense', armament: 1, age: 34 },
  { id: 'b_holdem', name: '홀뎀', title: '백수 해적단 진격대장', p: 95, sea: 'nw_late', bias: { str: 1.3, vit: 1.2 },
    skills: ['sword_cut', 'sword_wave', 'fist_iron', 'arm_hard'], tactic: 'offense', fruitClass: 'zoan', armament: 1, age: 38 },
  { id: 'b_babanuki', name: '바바누키', title: '백수 해적단 진격대장', p: 100, sea: 'nw_late', bias: { vit: 1.4, str: 1.2 },
    skills: ['fist_combo', 'fist_quake', 'fist_guard', 'arm_hard'], tactic: 'endurance', fruitClass: 'zoan', armament: 1, age: 40 },
  { id: 'b_jack', name: '가뭄의 잭', title: '백수 해적단 대간부', p: 130, sea: 'nw_late', bias: { str: 1.4, vit: 1.3 },
    skills: ['sword_cut', 'sword_wave', 'fist_quake', 'arm_hard', 'arm_coat'], tactic: 'offense', fruitClass: 'zoan', armament: 2, observation: 1, age: 28 },
  { id: 'b_queen', name: '역병의 퀸', title: '백수 해적단 대간부', p: 150, sea: 'nw_late', bias: { vit: 1.4, int: 1.2 },
    skills: ['gun_volley', 'gun_smoke', 'fist_quake', 'arm_hard', 'arm_coat'], tactic: 'endurance', fruitClass: 'zoan', armament: 2, observation: 1, age: 56 },
  { id: 'b_king', name: '화재의 킹', title: '백수 해적단 대간부', p: 160, sea: 'nw_late', bias: { spd: 1.3, vit: 1.3 },
    skills: ['sword_flash', 'sword_wave', 'sword_secret', 'arm_coat', 'obs_read'], tactic: 'counter', fruitClass: 'zoan', armament: 2, observation: 2, age: 47 },
];

export const EP_WANO: Turning[] = [
  // ================================================================ 원작 전 (열하나~스물)
  {
    id: 'ep_wano_1', kind: 'door', when: at(WANO, age(11, 19), not('ep_wano_pre_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '검은 강의 아이들', body: '산 너머 공장 굴뚝에서 쇠 냄새 섞인 연기가 밤낮없이 오른다. 강물은 검고, 쿠리의 논은 갈라진 채 잡초만 무성하다. 어른들은 스무 해 전 가마솥에서 죽은 영주의 이름을 낮게 삼킨다. {name}은(는) 이 나라에서 어떻게 살아남을지 정해야 한다.',
    doors: [
      { label: '산 너머 무기 공장에 들어간다', hint: '하루 쌀 한 되. 연기를 마시며 일한다', values: { peace: D }, fx: [{ op: 'money', add: 3000 }, next('ep_wano_factory')] },
      { label: '쿠리 성터에 숨은 도장이 있다는 소문을 따라간다', hint: '들키면 끌려간다. 칼을 배울 수 있다', values: { loyalty: D }, fx: [next('ep_wano_dojo')] },
      { label: '백수 해적단의 모집 행렬에 줄을 선다', hint: '짐승의 힘을 준다는 열매가 있다', when: [age(15)], values: { ambition: D }, fx: [next('ep_wano_beasts')] },
    ],
  },
  {
    id: 'ep_wano_factory', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '공장의 감독관' },
    title: '굴뚝 아래의 하루', body: '쇠를 녹이는 화로 앞은 숨이 막히게 뜨겁고, 감독관의 채찍 소리가 쉬지 않는다. 만든 칼과 대포는 모두 해골 섬으로 실려 간다. 공장 뒤로 흘려보낸 검은 물이 에비스 마을 쪽으로 흐른다. 감독관이 쌀자루를 던지며 내일은 더 일찍 나오라고 소리친다.',
    doors: [
      { label: '밤에 몰래 화로의 송풍구에 모래를 붓는다', hint: '공장이 멈춘다. 누가 했는지 찾기 시작한다', values: { justice: D }, danger: true,
        fx: [{ op: 'hardship', add: 2 }, log('화로 하나가 사흘 동안 멎었다. 감독관들이 일꾼들을 줄 세워 하나씩 때렸다.'), next('ep_wano_ebisu')] },
      { label: '무기 몇 자루를 빼돌려 꽃의 도시 뒷골목에 판다', hint: '돈이 된다. 걸리면 광산행이다', values: { greed: D },
        fx: [{ op: 'money', add: 20000 }, log('짚단 속에 칼 세 자루를 묻어 꽃의 도시로 나갔다.', 'light'), next('ep_wano_smuggle')] },
      { label: '받은 쌀을 모아 에비스 마을에 나른다', hint: '내 몫은 줄어든다. 웃는 사람들이 기다린다', values: { romance: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, next('ep_wano_ebisu')] },
    ],
  },
  {
    id: 'ep_wano_dojo', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '쿠리 성터의 늙은 낭인' },
    title: '무너진 성터의 도장', body: '쿠리의 무너진 성터 지하, 썩은 다다미 위에서 외팔 낭인이 목검을 휘두른다. 옛 영주는 칼 두 자루로 산을 가르고 무법자들을 품었다고, 낭인은 쉰 목소리로 웃는다. 바닥에는 달 문양을 새긴 칼집이 하나 놓여 있다. 「배우겠느냐. 배운 걸 들키면 목이 날아간다.」',
    doors: [
      { label: '밤마다 성터로 내려가 칼을 배운다', hint: '손바닥이 터지고 칼이 몸에 붙는다', values: { dominion: D },
        fx: [flag('ep_wano_dojo'), { op: 'mastery', branch: 'sword', add: 8 }, { op: 'person', kind: 'master', relation: '쿠리 성터의 외팔 낭인' }, next('ep_wano_holdem')] },
      { label: '낭인이 기억하는 옛 영주의 항해 이야기를 받아 적는다', hint: '바깥 바다와 이 나라의 비밀을 듣는다', values: { inquiry: D },
        fx: [flag('ep_wano_dojo'), { op: 'base', key: 'int', add: 1 }, log('폭포 밖의 바다, 흰 수염의 해적, 끝의 섬. 낭인의 이야기는 밤새 이어졌다.'), next('ep_wano_holdem')] },
      { label: '목숨보다 쌀이라며 공장 일을 구하러 간다', hint: '칼 대신 품삯을 쥔다', values: { greed: D }, fx: [next('ep_wano_factory')] },
    ],
  },
  {
    id: 'ep_wano_holdem', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '쿠리 성터의 늙은 낭인' },
    title: '사자 꼬리의 세리', body: '쿠리 마을에 홀뎀이 왔다. 허리에서 사자 머리가 으르렁대고, 그는 공물이 모자라다며 노인의 집을 걷어찬다. 누군가 성터로 내려가는 발자국을 보았다고 일러바쳤다. 낭인이 목검을 쥐고 일어선다.',
    doors: [
      { label: '홀뎀 앞을 막아선다', hint: '진격대장이다. 지면 감옥 광산으로 끌려간다', when: [ready(4)], values: { justice: D }, danger: true,
        fx: [fight('b_holdem', false, { win: 'ep_wano_ebisu', lose: 'ep_wano_udon', back: 'ep_wano_ebisu' })] },
      { label: '낭인을 업고 산길로 달아난다', hint: '도장은 불탄다. 사람은 산다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, log('뒤에서 성터가 불타는 소리가 났다. 낭인은 등에 업힌 채 울지 않았다.'), next('ep_wano_ebisu')] },
      { label: '무릎 꿇고 숨겨 둔 쌀을 내놓는다', hint: '도장은 들키지 않는다. 마을의 겨울이 길어진다', values: { peace: D },
        fx: [{ op: 'money', add: -5000 }, { op: 'hardship', add: 1 }, next('ep_wano_ebisu')] },
    ],
  },
  {
    id: 'ep_wano_beasts', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '백수 해적단의 모집관' },
    title: '웃는 열매', body: '모집관이 상자를 연다. 울퉁불퉁한 열매들에서 단내와 쇠 냄새가 같이 난다. 「먹으면 짐승이 되거나, 평생 웃거나. 어느 쪽이든 쌀은 준다.」 줄 앞의 사내가 열매를 깨물더니 무릎을 꿇고 미친 듯이 웃기 시작한다.',
    doors: [
      { label: '열매를 받아 깨문다', hint: '운이 좋으면 기프터, 나쁘면 웃음뿐이다', values: { dominion: D }, danger: true,
        fx: [{ op: 'standing', to: 'pirate' },
             { op: 'chance', p: 0.15,
               then: [{ op: 'base', key: 'str', add: 2 }, { op: 'fame', add: 5 }, log('뿔과 송곳니가 돋았다. 모집관이 기프터가 하나 났다며 박수를 쳤다.')],
               else: [{ op: 'hardship', add: 3 }, log('웃음이 멈추지 않았다. 그날부터 슬퍼도 눈물 대신 웃음이 나왔다.')] },
             next('ep_wano_oni')] },
      { label: '열매는 사양하고 졸병으로 들어간다', hint: '열매 없는 플레저스. 해골 섬에 오른다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'pirate' }, next('ep_wano_oni')] },
      { label: '줄을 빠져나와 웃는 사내를 업고 나간다', hint: '모집관이 이름을 적어 둔다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '웃음을 멈추지 못하는 사내' }, next('ep_wano_ebisu')] },
    ],
  },
  {
    id: 'ep_wano_oni', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'yamato' },
    title: '해골 섬의 수갑', body: '해골 섬 뒤편 숲에서, 손목에 커다란 수갑을 찬 젊은이가 쇠몽둥이를 메고 앉아 있다. 「나는 코즈키 오뎅이다.」 해적들은 카이도의 핏줄이니 건드리지 말라고 수군댄다. 그 젊은이가 낡은 일지 한 권을 소중히 끌어안고 {name}에게 바깥 바다를 아느냐고 묻는다.',
    doors: [
      { label: '앉아서 그 일지 이야기를 끝까지 듣는다', hint: '해골 섬에서 처음으로 친구 같은 것이 생긴다', values: { freedom: D },
        fx: [flag('ep_wano_yamato'), { op: 'person', kind: 'ally', relation: '오뎅이라 자칭하는 해골 섬의 젊은이', canon: 'yamato' }, time('해골 섬에서 오뎅을 자칭하는 야마토와 이야기를 나누었다', 'yamato'), next('ep_wano_ebisu')] },
      { label: '그 말을 간부에게 일러 공을 세운다', hint: '윗자리가 가까워진다. 수갑이 하나 더 채워질지도 모른다', values: { greed: D },
        fx: [{ op: 'money', add: 15000 }, { op: 'fame', add: 3 }, next('ep_wano_ebisu')] },
      { label: '보급선 짐칸과 폭포를 오가는 뱃길을 몰래 익힌다', hint: '닫힌 나라를 나가는 길이 보인다', values: { inquiry: D }, fx: [next('ep_wano_escape')] },
    ],
  },
  {
    id: 'ep_wano_smuggle', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'denjiro' },
    title: '꽃의 도시의 뒷골목', body: '꽃의 도시 노름판 뒷방, 긴 머리에 우스꽝스러운 얼굴로 웃는 야쿠자 두목 쿄시로가 칼을 하나하나 뽑아 본다. 「좋은 쇠로구나. 어디서 났는지는 묻지 않으마.」 그때 바깥이 소란해지며 쇼군의 가마가 거리를 지난다. 오로치가 가마 안에서 백성의 절이 낮다고 칼을 뽑으라 외친다.',
    doors: [
      { label: '쿄시로에게 칼을 넘기고 값을 받는다', hint: '두둑한 돈. 두목의 눈이 무언가를 재고 있다', values: { greed: D },
        fx: [{ op: 'money', add: 40000 }, next('ep_wano_escape')] },
      { label: '가마를 막아서 쇼군을 끌어내린다', hint: '쇼군은 약하다. 그를 지키는 것은 카이도다', values: { dominion: D }, danger: true,
        fx: [fight('b_orochi', false, { win: 'ep_wano_escape', lose: 'ep_wano_udon', back: 'ep_wano_escape' })] },
      { label: '절하는 사람들 틈에 끼어 고개를 숙인다', hint: '오늘을 넘긴다. 쇼군의 얼굴은 잊지 않는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, log('가마 안의 쇼군은 겁 많은 눈으로 백성을 내려다보고 있었다. 그 뒤에 선 해적들이 진짜 주인이었다.'), next('ep_wano_ebisu')] },
    ],
  },
  {
    id: 'ep_wano_ebisu', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '에비스 마을의 웃는 아이' },
    title: '웃음밖에 남지 않은 마을', body: '에비스 마을 사람들은 쓰레기 더미에서 먹을 것을 찾으면서도 웃는다. 기프터 대장이 공물을 걷다가, 늙은 아비가 맞는 걸 보고도 웃는 아이의 멱살을 잡는다. 「뭐가 우스워.」 아이는 눈물을 흘리며 더 크게 웃는다.',
    doors: [
      { label: '기프터 대장의 팔을 붙든다', hint: '뿔 달린 해적이다. 지면 광산으로 끌려간다', values: { justice: D }, danger: true,
        fx: [flag('ep_wano_ebisu_kid'), fight('b_gifter', false, { win: 'ep_wano_escape', lose: 'ep_wano_udon', back: 'ep_wano_escape' })] },
      { label: '아이를 안고 쓰레기 더미 뒤로 숨긴다', hint: '아이는 산다. 대장의 눈길이 이쪽을 훑는다', values: { loyalty: D },
        fx: [flag('ep_wano_ebisu_kid'), { op: 'person', kind: 'ally', relation: '에비스 마을에서 숨겨 준 아이', age: { younger: 7 } }, next('ep_wano_escape')] },
      { label: '공물 대신 가진 돈을 대장 앞에 쏟는다', hint: '오늘의 매질은 멈춘다. 빈손이 된다', values: { romance: D },
        fx: [{ op: 'money', add: -10000 }, log('대장은 돈을 쓸어 담고 웃는 마을을 떠났다. 아이는 끝까지 웃으며 손을 흔들었다.'), next('ep_wano_udon')] },
    ],
  },
  {
    id: 'ep_wano_udon', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'hyogoro' },
    title: '우동의 감옥 광산', body: '세금을 못 낸 사람, 해적에게 대든 사람이 끌려오는 우동의 감옥 광산이다. 곡괭이 소리와 기침 소리 사이로, 뼈만 남은 노인이 웃는다. 「이 늙은이가 한때는 꽃의 효고로라 불렸지.」 높은 망루에서 퀸의 노랫소리가 울리고, 죄수들은 하루 한 그릇 먹을 것을 놓고 스모를 한다.',
    doors: [
      { label: '죄수들을 모아 망루의 퀸에게 덤빈다', hint: '대간부다. 이기면 광산이 열린다', when: [ready(5)], values: { freedom: D }, danger: true,
        fx: [fight('b_queen', true, { win: 'ep_wano_kaido', lose: 'ep_wano_escape', back: 'ep_wano_escape' })] },
      { label: '효고로에게 손대지 않고 치는 법을 배운다', hint: '보이지 않는 힘이 손끝에 모인다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'armament', add: 8 }, { op: 'person', kind: 'master', relation: '감옥 광산의 늙은 두목', canon: 'hyogoro' }, time('우동의 감옥에서 꽃의 효고로에게 패기를 배웠다', 'hyogoro'), next('ep_wano_escape')] },
      { label: '고개를 숙이고 형기를 채운다', hint: '살아서 나간다. 몸은 많이 상한다', values: { peace: D },
        fx: [{ op: 'hp', add: -20 }, { op: 'base', key: 'vit', add: 1 }, { op: 'hardship', add: 2 }, next('ep_wano_escape')] },
    ],
  },
  {
    id: 'ep_wano_escape', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '폭포 아래 밀항선의 뱃사공' },
    title: '폭포를 내려가는 길', body: '와노는 닫힌 나라다. 폭포 위로 올라오는 것은 카이도의 배뿐이고, 내려가는 것도 그 배뿐이다. 늙은 뱃사공이 해골 섬으로 가는 보급선 짐 상자에 사람 하나쯤은 숨길 수 있다고 속삭인다. 다른 이들은 스무 해 전 처형된 영주의 부인 토키 님이 남긴 예언을 믿고 기다린다.',
    doors: [
      { label: '보급선 짐 상자에 숨어 폭포를 내려간다', hint: '잭의 함대에 섞여 바깥으로 나간다. 들키면 끝이다', values: { freedom: D }, danger: true,
        fx: [flag('ep_wano_pre_done'),
             { op: 'chance', p: 0.6,
               then: [log('짐 상자 틈으로 폭포의 물보라가 쏟아졌다. 사흘 뒤, 상자가 낯선 항구에 내려졌다.'), time('보급선에 숨어 닫힌 나라 와노를 빠져나갔다'), { op: 'move', island: '드레스로자', sea: 'nw_first' }],
               else: [fight('b_jack', false), log('가뭄의 잭이 짐 상자를 뜯었다. 간신히 배에서 떨어져 와노의 바위틈으로 기어올랐다.')] }] },
      { label: '예언의 밤을 믿고 이 나라에 남는다', hint: '스무 해 뒤 달이 차는 밤을 기다린다', values: { loyalty: D },
        fx: [flag('ep_wano_waiting'), flag('ep_wano_pre_done'), log('「스무 해 뒤에.」 처형대 앞에서 남겼다는 그 말을, 사람들은 아직 귀신처럼 믿는다.')] },
      { label: '해골 섬으로 건너가 카이도를 찾는다', hint: '세상에서 가장 강한 생물이 술에 취해 있다', when: [ready(6)], values: { ambition: D }, danger: true,
        fx: [next('ep_wano_kaido')] },
    ],
  },
  {
    id: 'ep_wano_kaido', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'kaido' },
    title: '죽을 곳을 찾는 용', body: '해골 섬 꼭대기, 술독을 끌어안은 카이도가 울다가 웃다가 쇠몽둥이를 바닥에 내리찍는다. 「이 세상은 시시해. 날 죽여 줄 놈이 없어.」 그 붉은 눈이 {name}을(를) 내려다보더니 천천히 일어선다. 「너냐? 네가 내 죽음이냐?」',
    doors: [
      { label: '목숨을 걸고 용과 맞선다', hint: '지면 죽는다. 이겨도 이 나라는 아직 바뀌지 않는다', when: [ready(6)], values: { dominion: D }, danger: true,
        fx: [fight('b_kaido', true, { win: 'ep_wano_kaido_win', lose: 'ep_wano_kaido_lose' })] },
      { label: '술독 하나를 받아 마주 앉는다', hint: '용의 넋두리를 듣는다. 살아서 내려간다', values: { romance: D },
        fx: [flag('ep_wano_pre_done'), { op: 'base', key: 'wil', add: 1 }, log('카이도는 밤새 마시며 옛날 이야기를 했다. 단 한 사람, 자기를 쓰러뜨릴 뻔했던 사무라이 이야기였다.'), time('해골 섬에서 카이도와 마주 앉아 술을 마셨다', 'kaido')] },
      { label: '등을 돌려 해골 섬을 내려간다', hint: '때가 아니다. 용은 쫓아오지 않는다', values: { peace: D },
        fx: [flag('ep_wano_pre_done'), log('등 뒤에서 카이도가 시시하다며 크게 웃었다.')] },
    ],
  },
  {
    id: 'ep_wano_kaido_win', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'kaido' },
    title: '피 흘리며 웃는 용', body: '카이도가 무릎을 꿇었다. 이마에서 피가 흐르는데, 그는 하늘이 울리도록 웃는다. 「우오로로로! 아직이다. 이건 아직 내 죽음이 아니야.」 푸른 용의 몸으로 변한 카이도는 구름을 가르며 날아가고, 해골 섬의 해적들은 아무도 그 자리를 보지 못한 척한다.',
    doors: [
      { label: '날아가는 용을 끝까지 올려다본다', hint: '그 상처가 언젠가 누군가에게 길을 열지도 모른다', values: { inquiry: D },
        fx: [flag('ep_wano_pre_done'), { op: 'fame', add: 30 }, time('해골 섬에서 카이도를 무릎 꿇렸다. 카이도는 피를 흘리며 웃고 날아갔다', 'kaido')] },
      { label: '이 일을 아무에게도 말하지 않는다', hint: '해적들도 입을 다문다. 나라는 그대로다', values: { peace: D },
        fx: [flag('ep_wano_pre_done'), { op: 'base', key: 'wil', add: 2 }, time('아무도 모르는 밤, 카이도와 싸워 이겼다', 'kaido')] },
      { label: '쿠리로 내려가 용이 피를 흘렸다고 외친다', hint: '사람들의 눈빛이 달라진다. 쇼군이 이름을 적는다', values: { dominion: D },
        fx: [flag('ep_wano_pre_done'), { op: 'fame', add: 60 }, time('카이도를 무릎 꿇린 이야기가 쿠리에 퍼졌다', 'kaido')] },
    ],
  },
  {
    id: 'ep_wano_kaido_lose', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'kaido' },
    title: '내 밑으로 와라', body: '눈을 뜨니 쇠사슬이 몸을 감고 있다. 카이도가 술 냄새를 풍기며 내려다본다. 「제법이었다. 죽이긴 아깝군. 내 밑으로 와라. 싫으면 광산에서 썩어라.」',
    doors: [
      { label: '고개를 숙이고 백수 해적단에 들어간다', hint: '목숨은 산다. 용의 그늘 아래서', values: { ambition: D },
        fx: [flag('ep_wano_pre_done'), { op: 'standing', to: 'pirate' }, { op: 'fame', add: 10 }, time('카이도에게 지고 백수 해적단에 들어갔다', 'kaido')] },
      { label: '침을 뱉고 사슬을 끊으려 버둥댄다', hint: '광산으로 끌려간다. 꺾이지는 않는다', values: { freedom: D },
        fx: [flag('ep_wano_pre_done'), { op: 'injury', severity: 'heavy' }, { op: 'hardship', add: 3 }, log('카이도는 웃으며 사슬을 풀어 주지 않았다. 몇 달 뒤에야 쿠리의 바위틈으로 기어 나왔다.')] },
    ],
  },

  // ================================================================ 원작 그 무렵 (스물하나~스물둘): 불의 축제 밤
  {
    id: 'ep_wano_raid', kind: 'door', when: at(WANO, age(21, 22), not('ep_wano_raid_done')), weight: 30, repeat: 'once', speaker: { canon: 'kikunojo' },
    title: '달이 차는 밤', body: '불의 축제 밤, 토코 항구에 모인 배는 몇 척뿐이다. 스무 해 전 사라졌던 무사들이 그때 모습 그대로 돌아왔다고, 사람들은 귀신을 본 얼굴이다. 여인처럼 고운 무사가 칼집을 쥐고 고개를 숙인다. 「오늘 밤 해골 섬에서 이 나라의 새벽을 되찾습니다. 용은 그분들이 맡습니다. 그 밖의 싸움터가 너무 많아요.」',
    doors: [
      { label: '배에 올라 해골 섬 성 안의 간부들에게 간다', hint: '연회장 아래, 기프터와 진격대장들이 기다린다', values: { loyalty: D }, danger: true,
        fx: [time('불의 축제 밤, 붉은 칼집의 무사들과 함께 해골 섬으로 건너갔다', 'kikunojo'), next('ep_wano_raid_hall')] },
      { label: '해골 섬 지하 공장에 갇힌 쿠리 사람들을 구하러 간다', hint: '싸움보다 문을 여는 일이다', values: { justice: D },
        fx: [time('불의 축제 밤, 해골 섬 지하 공장으로 숨어들었다', 'kikunojo'), next('ep_wano_raid_factory')] },
      { label: '꽃의 도시에 남아 불길에서 사람들을 지킨다', hint: '해골 섬은 멀다. 이 도시도 위태롭다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', relation: '불의 축제 밤에 구한 꽃의 도시 사람' }, next('ep_wano_raid_dawn')] },
    ],
  },
  {
    id: 'ep_wano_raid_hall', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'yamato' },
    title: '해골 섬의 계단', body: '북소리와 비명이 뒤섞인 성 안, 위층 지붕에서는 땅이 흔들릴 때마다 천둥 같은 소리가 난다. 계단 아래를 바바누키와 기프터 무리가 막아섰다. 수갑을 벗어 던진 젊은이가 쇠몽둥이를 휘두르며 외친다. 「나는 오뎅이다! 길을 열어라!」',
    doors: [
      { label: '계단을 막은 바바누키에게 달려든다', hint: '코끼리처럼 단단한 진격대장이다', values: { dominion: D }, danger: true,
        fx: [fight('b_babanuki', false, { win: 'ep_wano_raid_dawn', lose: 'ep_wano_raid_dawn', back: 'ep_wano_raid_dawn' })] },
      { label: '오뎅을 자칭하는 젊은이의 등을 지킨다', hint: '둘이면 계단 하나는 연다', values: { romance: D },
        fx: [{ op: 'hp', add: -20 }, { op: 'person', kind: 'ally', relation: '해골 섬에서 등을 맡긴 오뎅의 후계자', canon: 'yamato' }, time('불의 축제 밤, 야마토와 등을 맞대고 해골 섬 계단을 뚫었다', 'yamato'), next('ep_wano_raid_dawn')] },
      { label: '해골 섬에서 만난 그 젊은이를 부른다', hint: '오래전 일지 이야기를 들려준 사람이다', when: [has('ep_wano_yamato')], values: { freedom: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, log('「그때 그 일지를 끝까지 들어 준 녀석이구나!」 젊은이가 웃으며 쇠몽둥이로 기프터들을 쓸어냈다.'), next('ep_wano_raid_dawn')] },
    ],
  },
  {
    id: 'ep_wano_raid_factory', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '지하 공장에 갇힌 쿠리 사람' },
    title: '해골 섬 지하의 화로', body: '해골 섬 지하, 무기를 벼리는 화로 사이로 쇠사슬에 묶인 일꾼들이 줄지어 있다. 위층의 싸움이 번져 천장에서 불붙은 들보가 떨어진다. 쿠리 말투의 늙은 일꾼이 사슬을 흔든다. 「배가 나간다는 소문은 들었소. 우리도 나가게 해 주시오.」',
    doors: [
      { label: '열쇠를 빼앗아 사슬을 하나씩 푼다', hint: '시간이 걸린다. 불길이 가까워진다', values: { justice: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 10 }, log('마지막 사슬이 풀릴 때 천장이 무너졌다. 일꾼들은 모두 바깥 바람을 맞았다.'), next('ep_wano_raid_dawn')] },
      { label: '화로를 터뜨려 지하 공장을 통째로 멈춘다', hint: '해적들의 무기가 끊긴다. 위험한 짓이다', values: { ambition: D }, danger: true,
        fx: [{ op: 'injury', severity: 'light' }, log('화로가 터지는 소리가 해골 섬 전체를 흔들었다. 위층의 해적들이 멈칫했다.'), next('ep_wano_raid_dawn')] },
      { label: '창고의 무기와 금을 챙겨 먼저 빠져나간다', hint: '이 밤이 지나면 누가 주인일지 모른다', values: { greed: D },
        fx: [{ op: 'money', add: 60000 }, next('ep_wano_raid_dawn')] },
    ],
  },
  {
    id: 'ep_wano_raid_dawn', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '와노의 해가 뜬다', body: '해골 섬 꼭대기에서 하얗게 웃는 거인이 용을 땅 밑으로 내리꽂는다. 꽃의 도시 바로 위까지 떠밀려 온 해골 섬이 멈추고, 스무 해 동안 걷히지 않던 하늘이 갈라진다. 누군가 「카이도가 졌다」고 외치고, 웃음밖에 모르던 사람들이 처음으로 소리 내어 운다. 와노의 산 너머로 해가 뜬다.',
    doors: [
      { label: '떠오르는 해를 바라보며 주저앉는다', hint: '이긴 것은 밀짚모자다. 그래도 이 새벽은 모두의 것이다', values: { romance: D },
        fx: [flag('ep_wano_raid_done'), time('불의 축제 밤이 지나고, 밀짚모자의 루피가 카이도를 쓰러뜨린 새벽을 보았다', 'luffy')] },
      { label: '불탄 거리로 내려가 다친 사람을 찾는다', hint: '잔치는 나중이다', values: { loyalty: D },
        fx: [flag('ep_wano_raid_done'), { op: 'base', key: 'vit', add: 1 }, time('카이도가 쓰러진 새벽, 불탄 거리에서 사람들을 날랐다', 'luffy')] },
      { label: '스무 해 기다린 새벽이라고 크게 외친다', hint: '예언을 믿고 남은 날들이 보답받는다', when: [has('ep_wano_waiting')], values: { freedom: D },
        fx: [flag('ep_wano_raid_done'), { op: 'base', key: 'wil', add: 2 }, time('스무 해 기다린 예언의 새벽을 맞았다', 'luffy')] },
    ],
  },

  // ================================================================ 원작 뒤 (스물셋~): 열린 나라
  {
    id: 'ep_wano_after', kind: 'door', when: at(WANO, age(23, 45), not('ep_wano_done')), weight: 25, repeat: 'once', speaker: { canon: 'hiyori' },
    title: '새 쇼군의 나라', body: '어린 쇼군 모모노스케가 나라를 연다고 선포했다. 공장의 굴뚝이 하나씩 꺼지고, 검은 강 가장자리에 처음으로 맑은 물줄기가 보인다. 옛 영주의 핏줄인 히요리 아씨가 거리에 나와 쿠리를 다시 일으키자고 사람들을 부른다.',
    doors: [
      { label: '지하 도장의 외팔 낭인을 찾아가 새 도장을 함께 연다', hint: '숨어서 배우던 칼을 이제 볕 아래서 가르친다', when: [has('ep_wano_dojo')], values: { loyalty: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 5 }, log('외팔 낭인은 새 칼집을 쓰다듬으며, 이제야 칼을 볕에 말릴 수 있다고 웃었다.'), next('ep_wano_kuri')] },
      { label: '열린 항구에서 바깥 상인들과 첫 거래를 튼다', hint: '닫혀 있던 나라에 돈이 흐르기 시작한다', values: { greed: D },
        fx: [{ op: 'money', add: 50000 }, next('ep_wano_kuri')] },
      { label: '멈춘 공장들의 기계를 뜯어 무엇에 쓸지 살핀다', hint: '해적의 무기를 만들던 쇠가 다른 것이 될 수 있다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, next('ep_wano_kuri')] },
    ],
  },
  {
    id: 'ep_wano_kuri', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'tama' },
    title: '다시 푸른 쿠리', body: '쿠리의 논에 물이 들고, 아미가사 마을 꼬마 쿠노이치가 수수경단 바구니를 들고 뛰어다닌다. 「다들 와 봐! 쌀이 났어! 진짜 쌀이야!」 무너진 성터에는 새 기둥이 서고, 사람들은 이제 옛 영주의 이름을 큰 소리로 부른다.',
    doors: [
      { label: '논두렁에 앉아 첫 햅쌀로 주먹밥을 쥔다', hint: '오래 굶은 땅이 내준 쌀이다', values: { peace: D },
        fx: [{ op: 'hp', add: 20 }, next('ep_wano_after_end')] },
      { label: '우동의 광산에서 돌아오지 못한 이들의 이름을 비석에 새긴다', hint: '잊지 않는 것도 이 땅을 일으키는 일이다', values: { justice: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'person', kind: 'ally', relation: '쿠리 비석 앞에서 만난 늙은 광부' }, next('ep_wano_after_end')] },
      { label: '에비스 마을의 그 아이를 찾아간다', hint: '숨겨 주었던 아이가 이제 어른이 되었다', when: [has('ep_wano_ebisu_kid')], values: { romance: D },
        fx: [log('그 아이는 여전히 웃음밖에 나오지 않는다고 했다. 그래도 이제는 웃을 일이 있어서 웃는다고 했다.'), { op: 'person', kind: 'ally', relation: '에비스 마을에서 함께 자란 웃는 사람' }, next('ep_wano_after_end')] },
    ],
  },
  {
    id: 'ep_wano_after_end', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '열린 폭포', body: '폭포 아래로 내려가는 배가 이제 떳떳하게 깃발을 단다. 축제 등불이 꽃의 도시와 쿠리를 잇고, 에비스 마을에서는 웃음소리가 예전과 다르게 들린다. {name}은(는) 스무 해 넘게 닫혀 있던 이 나라에서 무엇을 남길지 생각한다.',
    doors: [
      { label: '처음 열린 배를 타고 바깥 바다를 보러 간다', hint: '폭포 밖의 세상은 넓다', values: { freedom: D },
        fx: [flag('ep_wano_done'), time('나라가 열린 뒤 폭포를 내려가 바깥 바다로 나갔다'), { op: 'move', island: '드레스로자', sea: 'nw_first' }] },
      { label: '이 나라에 뿌리를 내리고 산다', hint: '등불 아래서 늙어 간다', values: { peace: D },
        fx: [flag('ep_wano_done'), { op: 'standing', to: 'settled' }, time('열린 와노에 뿌리를 내렸다')] },
      { label: '오니가시마의 남은 쇠와 땅을 사들인다', hint: '빈 섬에 새 주인이 필요하다', values: { ambition: D },
        fx: [flag('ep_wano_done'), { op: 'money', add: -30000 }, { op: 'fame', add: 15 }, time('주인 없는 해골 섬의 땅을 사들였다')] },
    ],
  },
];
