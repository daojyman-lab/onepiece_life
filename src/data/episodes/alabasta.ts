// 섬 장편 에피소드: alabasta (v6.8, 2~3달짜리 시나리오 셋). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 세 시나리오:
//   원작 전(주인공 14~16) 「마른 우물의 값」: 가뭄을 틈타 우물을 잠그는 모래시계 상단(하잠). 안내 나디르 · 기록 사피야 · 판단 코자.
//   원작 그 무렵(17~18) 「아르바나의 다른 전선」: 양쪽에 화약을 파는 붉은 낙타단(오르한). 안내 카심 · 기록 레일라 · 판단 코자.
//     결전 날 밀짚모자는 시계탑의 폭탄과 크로커다일을 맡고, 주인공은 서쪽 저수고를 지킨다.
//   원작 뒤(20~) 「물길의 주인」: 재건의 물 증서를 사들이는 새물 조합(무스타파). 안내 하리스 · 기록 마이사 · 판단 펠.
//     원작 뒤의 크로커다일·미스터 1 재방문을 가정하지 않는다. 위조 증서와 물길의 소유권만 다룬다.
import type { Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at } from '../turnings/paths';

const ISL = '알라바스타 왕국';

export const FOES_ALABASTA: FoeDef[] = [
  // 원작 간부 (알라바스타용)
  { id: 'b_mr1_ab', name: '미스터 1', title: '바로크 워크스 최고 간부', canon: 'daz', p: 44, sea: 'gl_first', bias: { str: 1.2, vit: 1.1 }, fruitClass: 'paramecia', skills: ['fruit:supa:0', 'fruit:supa:1', 'fruit:supa:2', 'sword_cut'], tactic: 'offense' },
  { id: 'b_mr2', name: '봉쿠레', title: '바로크 워크스 미스터 2', canon: 'bonclay', p: 40, sea: 'gl_first', bias: { spd: 1.2, str: 1.1 },
    skills: ['fist_combo', 'fist_counter', 'fist_guard', 'fist_secret'], tactic: 'counter', age: 30 },
  // 원작 전: 모래시계 상단
  { id: 'b_hz_scout', name: '물지기', title: '모래시계 상단 정찰병', p: 35, sea: 'gl_first', faction: 'civil', skills: ['fist_jab', 'fist_combo', 'gun_shot'], tactic: 'offense', age: 26 },
  { id: 'b_sarb', name: '사르브', title: '모래시계 상단 채찍잡이', p: 46, sea: 'gl_first', faction: 'civil', bias: { spd: 1.2 }, skills: ['sword_cut', 'sword_flash', 'sword_parry'], tactic: 'counter', age: 34 },
  { id: 'b_hazam', name: '하잠', title: '모래시계 상단 우두머리', p: 56, sea: 'gl_first', faction: 'civil', bias: { str: 1.2, vit: 1.2 }, skills: ['fist_iron', 'fist_quake', 'gun_volley', 'gun_smoke'], tactic: 'endurance', age: 48 },
  { id: 'b_hazam_worn', name: '하잠', title: '호위를 잃은 상단 우두머리', p: 48, sea: 'gl_first', faction: 'civil', bias: { str: 1.2, vit: 1.1 }, skills: ['fist_iron', 'fist_quake', 'gun_shot'], tactic: 'endurance', age: 48 },
  // 원작 그 무렵: 붉은 낙타단
  { id: 'b_rc_scout', name: '짐꾼 감독', title: '붉은 낙타단 정찰병', p: 38, sea: 'gl_first', faction: 'civil', skills: ['fist_jab', 'gun_shot', 'gun_quick'], tactic: 'offense', age: 28 },
  { id: 'b_talib', name: '탈리브', title: '붉은 낙타단 화약장이', p: 48, sea: 'gl_first', faction: 'civil', bias: { int: 1.1 }, skills: ['gun_shot', 'gun_volley', 'gun_smoke', 'gun_bind'], tactic: 'defense', age: 40 },
  { id: 'b_orhan', name: '오르한', title: '붉은 낙타단 우두머리', p: 58, sea: 'gl_first', faction: 'civil', bias: { spd: 1.1, str: 1.1 }, skills: ['sword_cut', 'sword_draw', 'sword_wave', 'gun_quick'], tactic: 'offense', age: 44 },
  { id: 'b_orhan_worn', name: '오르한', title: '화약이 젖은 붉은 낙타단 우두머리', p: 50, sea: 'gl_first', faction: 'civil', bias: { spd: 1.1 }, skills: ['sword_cut', 'sword_draw', 'gun_quick'], tactic: 'offense', age: 44 },
  // 원작 뒤: 새물 조합
  { id: 'b_nw_scout', name: '조합 경비', title: '새물 조합 정찰병', p: 40, sea: 'gl_first', faction: 'civil', skills: ['fist_jab', 'fist_combo', 'gun_shot'], tactic: 'offense', age: 30 },
  { id: 'b_rashid', name: '라시드', title: '바로크 워크스 밀리언즈 출신 칼잡이', p: 52, sea: 'gl_first', faction: 'civil', bias: { spd: 1.2, str: 1.1 }, skills: ['sword_cut', 'sword_draw', 'sword_flash', 'sword_parry'], tactic: 'counter', age: 36 },
  { id: 'b_mustafa', name: '무스타파', title: '새물 조합 조합장', p: 62, sea: 'gl_first', faction: 'civil', bias: { vit: 1.2, int: 1.1 }, skills: ['gun_shot', 'gun_volley', 'gun_snipe', 'fist_guard', 'gun_secret'], tactic: 'defense', age: 52 },
  { id: 'b_mustafa_worn', name: '무스타파', title: '물길을 잃은 새물 조합 조합장', p: 54, sea: 'gl_first', faction: 'civil', bias: { vit: 1.1, int: 1.1 }, skills: ['gun_shot', 'gun_volley', 'fist_guard'], tactic: 'defense', age: 52 },
];

function sluiceShowdown(prepared: boolean): Turning {
  return {
    id: prepared ? 'ep_alabasta_a9_worn' : 'ep_alabasta_a9',
    kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '갈대숲 수문의 결전',
    intro: [
      '물길이 가늘어진다. 수문 위에서 무스타파가 장총을 들고 있다.',
      '“오늘 밤은 한 방울도 흘려보내지 마. 돈 들고 올 때까지 기다려.” 조합장이 부하들에게 외친다.',
    ],
    body: prepared
      ? '경비가 줄었다. 조합장이 자리를 옮기기 전에 수문으로 접근할 수 있다.'
      : '무스타파의 경비들이 수문 쪽으로 붙는다. 물러나면 아래쪽 밭에 물이 가지 않는다.',
    doors: [
      { label: '마이사의 원본 장부를 수문 앞 사람들에게 펼친다', hint: '위조 증서를 보여 경비가 총을 내려놓게 한다', when: [has('ep_alabasta_a_ledger')], values: { inquiry: D }, danger: true,
        fx: [flag('ep_alabasta_a_win'), next('ep_alabasta_a10'), log('마이사가 장부를 펴자 한 주민이 자기가 쓰지 않은 서명을 가리킨다. 그것을 본 경비들이 총을 내린다.', 'light')] },
      { label: '수문 위로 올라가 무스타파와 싸운다',
        hint: prepared ? '경비가 빠진 틈에 조합장과 맞붙는다' : '수문 위에서 무스타파와 맞붙는다. 경비도 그 곁에 있다', values: { dominion: D }, danger: true,
        fx: [log(prepared ? '전투 · 갈대숲 수문 위 / 경비가 줄어든 새물 조합장 무스타파' : '전투 · 갈대숲 수문 위 / 새물 조합장 무스타파'),
             fight(prepared ? 'b_mustafa_worn' : 'b_mustafa', false, { win: 'ep_alabasta_a10', lose: 'ep_alabasta_a11', back: 'ep_alabasta_a11' })] },
      { label: '갈대숲 뒤로 물러난다', hint: '싸움을 피한다. 아래쪽 밭에는 물이 끊긴다', values: { freedom: D },
        fx: [next('ep_alabasta_a11'), log('수문이 잠기는 소리를 들으며 갈대숲에서 물러났다. 아래쪽 밭은 아침에도 말라 있었다.', 'light')] },
    ],
  };
}


export const EP_ALABASTA: Turning[] = [
  // ================================================================ 원작 전 (주인공 14~16): 마른 우물의 값
  {
    id: 'ep_alabasta_p1', kind: 'door', when: at(on(ISL), age(14, 16), not('ep_alabasta_pre_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '우물의 자물쇠',
    intro: [
      '나노하나 시장에 내리니 스카프 틈으로 모래가 씹힌다. 목부터 축이려고 물통을 든 사람들을 따라간다.',
      '공동 우물은 잠겨 있다. 자물쇠를 지키는 남자는 물 한 바가지에 빵 열 덩이 값을 부른다.',
      '빈 통을 내밀던 낙타몰이 소년이 값을 듣고 돌아선다. 남자가 등 뒤에서 빈정거린다. “돈 없으면 집에 가서 모래나 삼켜.”',
      '소년이 자물쇠에 손을 대자 경비가 목덜미부터 잡는다. 값을 적던 왕궁 서기가 펜을 놓고 말한다. “나디르는 물도 안 건드렸어요.”',
    ],
    body: '나디르가 끌려가고 있다. 물값을 적던 서기도 내 곁에 있다.',
    doors: [
      { label: '나디르를 잡은 경비를 떼어 내고 맞선다', hint: '우물가에서 경비와 싸우는 동안 나디르가 빠져나간다', values: { dominion: D }, danger: true,
        fx: [flag('ep_alabasta_nadir_trust'), flag('ep_alabasta_p_force'), log('나디르가 붙잡힌 팔을 빼내 달아난다. 경비가 내 쪽으로 주먹을 내지른다.', 'light'),
             log('전투 · 나노하나 시장의 공동 우물 / 모래시계 상단 물지기'), fight('b_hz_scout', false, { win: 'ep_alabasta_p2', lose: 'ep_alabasta_p2', back: 'ep_alabasta_p2' }, true)] },
      { label: '왕궁 서기 사피야와 물값이 오른 날을 확인한다', hint: '이상하다. 값은 비가 끊기기 전부터 오르고 있었다', values: { inquiry: D },
        fx: [flag('ep_alabasta_safiya_trust'), next('ep_alabasta_p2'), log('사피야가 비가 오던 때의 숫자에도 붉은 줄을 그었다. 두 사람은 장부 첫 장을 다시 폈다.', 'light')] },
      { label: '물을 한 바가지 사서 마시고 가던 길을 간다', hint: '돈을 내고 물을 마신다. 경비가 나디르를 끌고 간다', values: { peace: D },
        fx: [{ op: 'money', add: -2000, trade: true }, next('ep_alabasta_p2'), log('돈을 낸 뒤 물 한 바가지를 마셨다. 나디르가 끌려가는 소리는 시장 끝까지 들렸다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '왕궁 수리국의 서기 사피야' },
    title: '창고로 모이는 물',
    body: '왕궁 서기 사피야가 값이 오른 날과 우물이 잠긴 날을 지도에 적는다. 비가 끊기기 전부터 우물을 사들인 쪽은 모두 같은 모래시계 상단이다. 그들이 어디에 물을 모으는지부터 확인해야 한다.',
    doors: [
      { label: '물 창고지기를 몰아붙여 누가 시켰는지 묻는다', hint: '상단의 우두머리를 알아내지만 얼굴이 알려진다', values: { ambition: D },
        fx: [flag('ep_alabasta_p_force'), { op: 'base', key: 'str', add: 1 }, next('ep_alabasta_p3'), log('창고지기가 하잠의 이름을 뱉었다. 문밖의 물지기가 두 사람의 얼굴을 살폈다.', 'light')] },
      { label: '물장수들에게 술을 사며 웃는 얼굴로 묻는다', hint: '술값을 쓰면 장수들이 우두머리 이야기를 한다', values: { greed: D },
        fx: [{ op: 'money', add: -3000 }, { op: 'base', key: 'luk', add: 1 }, next('ep_alabasta_p3'), log('술잔이 비자 물장수는 하잠이 레인베이스 카지노에서 묵는 밤을 털어놨다.', 'light')] },
      { label: '사피야와 자물쇠가 걸린 순서를 지도에 짚어 본다', hint: '잠긴 우물들을 이으면 물이 어디로 갔는지 보인다', values: { inquiry: D },
        fx: [flag('ep_alabasta_p_ledger'), flag('ep_alabasta_safiya_trust'), next('ep_alabasta_p3'), log('사피야가 잠긴 우물들을 선으로 이었다. 그 끝은 레인베이스로 향했다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '낙타몰이 나디르' },
    title: '밤에 도는 물 수레',
    body: '나디르가 잠긴 우물에서 나오는 수레를 가리킨다. “낮엔 물이 없다더니, 저녁엔 통마다 가득 채워요.” 바람에 바퀴 자국이 지워지기 전에 따라붙을 수 있다.',
    doors: [
      { label: '나디르와 바퀴 자국을 따라 밤새 모래 언덕을 넘는다', hint: '수레가 사라지는 붉은 협곡 하나를 찾아낸다', values: { loyalty: D },
        fx: [flag('ep_alabasta_p_cistern'), flag('ep_alabasta_nadir_trust'), next('ep_alabasta_p4'), log('나디르가 바퀴 자국이 끊긴 협곡 바위틈을 찾아냈다. 안쪽에서 물통 부딪는 소리가 났다.', 'light')] },
      { label: '빈 물통 사이에 숨어 수레에 실려 간다', hint: '숨이 막힌다. 상단의 사람 수와 무기를 하나하나 헤아린다', values: { freedom: D },
        fx: [flag('ep_alabasta_p_cistern'), { op: 'base', key: 'int', add: 1 }, next('ep_alabasta_p4'), log('수레 밑에서 호위병의 얼굴과 창을 셌다. 협곡에 닿을 때쯤 숨길 자리를 알게 됐다.', 'light')] },
      { label: '수레를 세우고 빼앗은 물을 유바로 나른다', hint: '목마른 마을 하나가 하룻밤 숨을 돌린다. 상단이 칼을 간다', values: { justice: D },
        fx: [flag('ep_alabasta_p_people'), { op: 'hp', add: -10 }, next('ep_alabasta_p4'), log('빼앗은 물통이 유바 천막마다 돌아갔다. 뒤쫓던 상단의 횃불은 마을 어귀에서 멈췄다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'koza' },
    title: '코자가 막아선 계약',
    intro: [
      '유바로 오자 상단 사람이 마지막 우물 옆에 탁자를 펴고 값을 부른다. 우물을 내주면 오늘 먹을 곡식부터 받을 수 있다는 말에 주민 몇이 앞으로 나온다.',
      '삽을 든 토토가 우물가에 남아 있다. 그의 곁에 선 코자가 상단 사람이 펼친 계약서 위에 빈 물통을 내려놓는다.',
      '“유바 사람한테 내일도 여기서 물을 줄 거요? 뭐라고 써 두신 건지 같이 봅시다.” 상단 사람은 종이를 거둬 품에 넣는다.',
      '코자가 시장에서 온 내게 묻는다. “상단이 그쪽 우물을 가져간 뒤에 무슨 일이 있었소?”',
    ],
    body: '유바 주민들은 우물을 넘길지 정하기 전에 시장 쪽 이야기를 듣고 싶어 한다.',
    doors: [
      { label: '수레에서 되찾은 물을 내보이며 우물을 지키자고 말한다', hint: '코자가 고개를 끄덕인다. 천막의 젊은이들도 칼을 거둔다', when: [has('ep_alabasta_p_people')], values: { loyalty: D },
        fx: [flag('ep_alabasta_p_koza'), { op: 'person', kind: 'ally', relation: '유바의 우물 회의에서 손을 맞잡은 반란군 우두머리', canon: 'koza' }, next('ep_alabasta_p5'), log('나디르가 빈 물통을 들어 보이자 코자가 젊은이들의 칼을 내리게 했다.', 'light')] },
      { label: '우물 지도를 보여 주며 상단이 가뭄 전에 움직였다고 말한다', hint: '코자가 지도를 오래 들여다본다. 왕만 탓하던 눈빛이 흔들린다', when: [has('ep_alabasta_p_ledger')], values: { justice: D },
        fx: [flag('ep_alabasta_p_koza'), { op: 'base', key: 'wil', add: 1 }, next('ep_alabasta_p5'), log('사피야의 지도를 본 코자는 왕궁을 가리키던 손을 상단의 우물로 옮겼다.', 'light')] },
      { label: '회의의 결정은 마을 사람들에게 맡긴다', hint: '토토 노인이 우물만은 팔지 말자고 혼자 중얼거린다. 코자는 외지인을 더는 보지 않는다', values: { peace: D },
        fx: [next('ep_alabasta_p5'), log('외지인의 말이 없자 천막에서 다시 우물을 팔자는 소리가 커졌다. 토토는 삽을 더 세게 쥐었다.', 'light')] },
      { label: '상단을 통째로 모래에 묻어 버리자고 젊은이들을 부추긴다', hint: '천막이 들끓는다. 코자만은 웃지 않는다', special: 'dominion', when: [has('ep_alabasta_p_force')],
        fx: [log('코자가 조용히 말했다. 빼앗아서 이기는 싸움이면 우리도 상단과 다를 게 없다고.'), next('ep_alabasta_p5')] },
    ],
  },
  {
    id: 'ep_alabasta_p5', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '협곡에 숨긴 물',
    body: '바위 너머 저수조에서 물이 넘쳐 모래로 샌다. 아침에 값을 못 내 빈 통을 들고 가던 사람이 떠오른다. 협곡 경비 사르브가 지키는 천막 안에 물을 보낼 곳이 적힌 편지가 있다.',
    doors: [
      { label: '협곡 입구의 사르브에게 정면으로 맞선다', hint: '협곡 입구에서 사르브와 싸운다. 물통이 쌓인 자리가 보인다', values: { ambition: D }, danger: true,
        fx: [flag('ep_alabasta_p_found'), log('전투 · 붉은 협곡의 저수조 입구 / 상단 경비 사르브'), fight('b_sarb', false, { win: 'ep_alabasta_p6', lose: 'ep_alabasta_p6', back: 'ep_alabasta_p6' })] },
      { label: '나디르가 아는 옛 물길로 저수조 뒤편에 숨어든다', hint: '바위틈으로 기어든다. 편지 꾸러미를 손에 넣는다', when: [has('ep_alabasta_nadir_trust')], values: { freedom: D },
        fx: [flag('ep_alabasta_p_found'), next('ep_alabasta_p6'), log('나디르가 가리킨 틈으로 기어가 천막의 암호 편지를 빼냈다. 하잠의 인장이 찍혀 있었다.', 'light')] },
      { label: '사피야와 저수조의 물 높이를 재어 장부에 적는다', hint: '얼마나 훔쳤는지는 남는다. 다만 채찍 끝이 등을 스친다', values: { inquiry: D },
        fx: [flag('ep_alabasta_p_ledger'), flag('ep_alabasta_safiya_trust'), { op: 'hp', add: -10 }, next('ep_alabasta_p6'), log('사피야가 물 높이를 장부에 옮겼다. 사르브의 채찍이 등을 스쳤지만 숫자는 지워지지 않았다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p6', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '모래시계 상단의 우두머리 하잠' },
    title: '하잠의 찻잔',
    intro: [
      '천막 안에서 우물을 잠근 상단의 주인 하잠이 얼음 띄운 차를 마신다.',
      '“마실 게 없으면 값을 올려도 사더군. 이 더위가 끝나기 전에 바싹 벌어야지.” 그가 탁자 위에 우물 열쇠를 쏟아 놓는다.',
      '“시장에서 내 장사에 눈독 들였다며? 여기 열쇠 하나 맡아 봐. 아침마다 줄을 세우고, 먼저 낸 놈부터 물을 주면 돼.”',
    ],
    body: '하잠은 우물 열쇠를 맡으면 물값의 일부를 떼어 주겠다고 한다.',
    doors: [
      { label: '찻잔을 엎고 일어선다', hint: '하잠이 웃는다. 그날 밤부터 상단의 경계가 두 배로 는다', values: { justice: D },
        fx: [flag('ep_alabasta_p_people'), next('ep_alabasta_p7'), log('엎어진 찻잔 아래 카지노 칩이 굴렀다. 하잠은 경비병 둘을 천막 밖에 더 세웠다.', 'light')] },
      { label: '거래하는 척하며 수레의 호위 순서를 묻는다', hint: '돈과 함께 호위병이 교대하는 때를 알아낸다', values: { ambition: D },
        fx: [flag('ep_alabasta_p_inside'), { op: 'money', add: 10000 }, next('ep_alabasta_p7'), log('하잠이 순번표를 펼치는 동안 금화 자루가 넘어왔다. 그가 자리를 뜨자 순번을 외워 적었다.', 'light')] },
      { label: '돈을 받고 잠긴 우물의 열쇠를 맡는다', hint: '주머니가 무거워진다. 나디르가 등을 돌린다', values: { greed: D },
        fx: [flag('ep_alabasta_p_deal'), { op: 'money', add: 60000 }, log('하잠의 열쇠 꾸러미를 허리에 찼다. 쩔렁이는 소리가 이상하게 무거웠다.'), next('ep_alabasta_p7')] },
      { label: '유바의 우물만은 풀어 달라는 조건을 건다', hint: '하잠이 셈을 한다. 작은 우물 하나쯤은 내줄 수 있다고', special: 'peace',
        fx: [log('하잠이 유바의 자물쇠 하나를 풀어 주었다. 다른 자물쇠는 그대로였다.'), next('ep_alabasta_p7')] },
    ],
  },
  {
    id: 'ep_alabasta_p7', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '낙타몰이 나디르' },
    title: '마을을 나서는 마지막 수레',
    body: '하잠은 그믐밤에 협곡의 물을 전부 레인베이스로 보낸다. 나디르가 협곡에서 마을로 이어지는 길을 짚는다. “여기서 수레를 막으면 싸움이 마을까지 번질 수 있어요.”',
    doors: [
      { label: '유바 사람들과 협곡 아래로 피난길을 낸다', hint: '싸움이 번져도 마을은 빠져나갈 수 있다', values: { peace: D },
        fx: [flag('ep_alabasta_p_evac'), next('ep_alabasta_p8'), log('나디르가 밤새 피난길에 돌을 놓았다. 아이들은 물 수레가 올 때 갈 길을 연습했다.', 'light')] },
      { label: '협곡 위에 매어 둔 수레의 바퀴와 마구를 끊어 둔다', hint: '하잠의 호송대가 반은 움직이지 못한다', when: [has('ep_alabasta_p_cistern')], values: { freedom: D },
        fx: [flag('ep_alabasta_p_sabotage'), next('ep_alabasta_p8'), log('새벽에 수레 바퀴가 모래에 주저앉았다. 호위병들이 물통 대신 마구를 고쳤다.', 'light')] },
      { label: '알아 둔 교대 시간에 호위병을 딴 곳으로 보낸다', hint: '하잠의 곁이 비는 때를 안다', when: [has('ep_alabasta_p_inside')], values: { inquiry: D },
        fx: [flag('ep_alabasta_p_sabotage'), next('ep_alabasta_p8'), log('거짓 전갈을 받은 호위병들이 협곡 반대편으로 달려갔다. 하잠 곁의 횃불이 드문드문 남았다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p8', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '협곡 입구의 결전',
    intro: [
      '그믐밤, 마른 물길 옆에 몸을 낮춘다. 고개 너머에서 물통끼리 부딪히는 소리가 들린다.',
      '첫 수레가 협곡을 나서자 낙타 위의 하잠이 곤봉을 들어 올린다. 조금만 더 가면 수레는 갈림길을 지나 레인베이스 방면으로 접어든다.',
    ],
    body: '하잠을 막으면 수레가 마을 가까이서 멈춘다. 등 뒤 모래 언덕으로 물러날 수 있다.',
    doors: [
      { label: '호위가 줄어든 틈에 하잠을 가로막는다', hint: '하잠의 곁이 반쯤 비었다. 그래도 그는 직접 곤봉을 든다', when: [has('ep_alabasta_p_sabotage')], values: { dominion: D }, danger: true,
        fx: [log('전투 · 붉은 협곡의 갈림길 / 호위가 줄어든 상단 우두머리 하잠'), fight('b_hazam_worn', false, { win: 'ep_alabasta_p9', lose: 'ep_alabasta_p10', back: 'ep_alabasta_p10' })] },
      { label: '하잠의 낙타를 가로막고 정면으로 붙는다', hint: '상단의 정예가 모두 붙어 있다. 다치고 끝날 수도 있다', when: [not('ep_alabasta_p_sabotage')], values: { dominion: D }, danger: true,
        fx: [log('전투 · 붉은 협곡의 갈림길 / 모래시계 상단 우두머리 하잠'), fight('b_hazam', false, { win: 'ep_alabasta_p9', lose: 'ep_alabasta_p10', back: 'ep_alabasta_p10' })] },
      { label: '호송대가 지나가도록 모래 언덕 뒤에 엎드린다', hint: '오늘 밤은 싸우지 않는다. 물은 레인베이스로 간다', values: { peace: D },
        fx: [next('ep_alabasta_p10'), log('수레가 모래 언덕 너머로 사라질 때까지 엎드려 있었다. 나디르가 고삐를 쥔 손을 놓지 못했다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p9', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '남은 물통과 열쇠',
    body: '하잠이 곤봉을 놓고 달아난다. 뒤집힌 수레의 터진 통에서 물이 모래로 샌다. 하잠이 떨어뜨린 열쇠와 아직 닫힌 통이 수레 옆에 남아 있다.',
    doors: [
      { label: '열쇠를 우물마다 돌려주고 자물쇠를 부순다', hint: '우물은 다시 마을의 것이 된다. 나디르가 첫 바가지를 떠 온다', when: [has('ep_alabasta_nadir_trust'), has('ep_alabasta_p_found'), not('ep_alabasta_p_deal')], values: { loyalty: D },
        fx: [flag('ep_alabasta_p_win'), { op: 'fame', add: 15 }, time('가뭄의 알라바스타에서 모래시계 상단이 잠근 우물의 자물쇠를 부쉈다'), next('ep_alabasta_p11'), log('나디르가 첫 바가지를 뜨자 사람들이 하나씩 자물쇠를 들고 나왔다. 금속 깨지는 소리가 우물마다 이어졌다.', 'light')] },
      { label: '우물을 마을과 왕궁이 함께 관리하게 한다', hint: '자물쇠 대신 장부가 걸린다. 누구도 혼자 물을 쥐지 못한다', when: [has('ep_alabasta_nadir_trust'), has('ep_alabasta_safiya_trust'), has('ep_alabasta_p_ledger'), not('ep_alabasta_p_deal')], values: { justice: D },
        fx: [flag('ep_alabasta_p_win'), flag('ep_alabasta_p_map'), { op: 'fame', add: 20 }, time('가뭄의 알라바스타에서 우물을 마을과 왕궁이 함께 지키게 했다'), next('ep_alabasta_p11'), log('사피야와 마을 어른이 같은 장부에 서명했다. 우물 옆에는 두 사람이 번갈아 지킬 차례가 붙었다.', 'light')] },
      { label: '남은 물을 나눠 주고 우물 관리는 마을에 맡긴다', hint: '당장 마실 물을 나눈다. 우물을 누가 맡을지 나중에 정한다', values: { freedom: D },
        fx: [flag('ep_alabasta_p_win'), next('ep_alabasta_p10'), log('성한 물통을 유바 우물가에 내렸다. 사람들은 물을 받아 갔지만 우물 열쇠를 누가 쥘지는 아직 정해지지 않았다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p10', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '다시 줄이 선 우물',
    body: '그믐밤이 지나도 비는 오지 않는다. 신문은 크로커다일이 해적을 쫓아냈다고 전한다. 우물 앞에는 빈 통을 든 주민이 다시 줄을 섰다.',
    doors: [
      { label: '사피야의 장부를 왕궁에 보내 조사를 요청한다', hint: '상단의 이름이 처음으로 왕궁의 문서에 오른다', when: [has('ep_alabasta_safiya_trust'), has('ep_alabasta_p_ledger'), not('ep_alabasta_p_deal')], values: { inquiry: D },
        fx: [flag('ep_alabasta_p_map'), { op: 'base', key: 'int', add: 1 }, time('가뭄의 알라바스타에서 우물을 잠근 상단의 장부를 왕궁에 올렸다'), next('ep_alabasta_p11'), log('사피야의 장부가 궁의 봉인을 받았다. 상단의 물값을 묻는 관리가 나노하나로 내려왔다.', 'light')] },
      { label: '하잠이 남긴 열쇠 꾸러미로 물을 판다', hint: '돈은 쌓인다. 우물가의 눈길이 등에 꽂힌다', when: [has('ep_alabasta_p_deal')], values: { greed: D },
        fx: [{ op: 'money', add: 50000 }, time('가뭄의 알라바스타에서 잠긴 우물의 물을 팔아 돈을 벌었다'), next('ep_alabasta_p11'), log('열쇠를 돌리자 물을 기다리던 이웃이 값을 묻고 주머니를 열었다. 나디르는 눈을 마주치지 않았다.', 'light')] },
      { label: '우물 일은 이 나라 사람들에게 남기고 짐을 꾸린다', hint: '물값은 아직 비싸다. 이 땅에 남긴 자국은 많지 않다', values: { freedom: D },
        fx: [time('가뭄의 알라바스타를 지나왔다. 잠긴 우물은 잠긴 채였다'), next('ep_alabasta_p11'), log('짐을 싣는 동안 우물 앞에서는 여전히 값을 두고 다퉜다. 사피야가 그 소리를 장부에 적었다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_p11', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '낙타몰이 나디르' },
    title: '나노하나에서 마지막 인사',
    body: '배가 나노하나 부두에 닿는다. 나디르의 낙타 방울이 바람에 울린다. 사피야는 물값을 적던 장부를 닫는다.',
    doors: [
      { label: '나디르가 내미는 낙타 방울을 받아 든다', hint: '모래바람 속에서도 길을 찾는 소리라고 한다', when: [has('ep_alabasta_nadir_trust'), not('ep_alabasta_p_deal')], values: { romance: D },
        fx: [flag('ep_alabasta_p_bell'), flag('ep_alabasta_pre_done'), log('나디르의 낙타 방울을 받았다. 흔들면 마른 사막의 바람 소리가 났다.')] },
      { label: '바다를 보고 싶다는 나디르를 배에 태운다', hint: '한동안 같은 길을 간다. 사피야가 부두에서 손을 흔든다', when: [has('ep_alabasta_nadir_trust'), has('ep_alabasta_safiya_trust'), not('ep_alabasta_p_deal')], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'crew', relation: '알라바스타에서 따라나선 낙타몰이 나디르', years: 1 }, flag('ep_alabasta_p_bell'), flag('ep_alabasta_pre_done'),
             log('나디르가 낙타를 사피야에게 맡기고 배에 올랐다. 처음 보는 바다 앞에서 그는 한참 말이 없었다.')] },
      { label: '아무에게도 인사하지 않고 배에 오른다', hint: '모래 냄새가 옷에 오래 남는다', values: { freedom: D },
        fx: [flag('ep_alabasta_pre_done'), log('알라바스타를 떠났다. 수도에 비가 오는 날을 보지 못한 채였다.')] },
    ],
  },

  // ================================================================ 원작 그 무렵 (주인공 17~18): 아르바나의 다른 전선
  {
    id: 'ep_alabasta_w1', kind: 'door', when: at(on(ISL), age(17, 18), not('ep_alabasta_war_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '소금 상자에서 쏟아진 화약',
    intro: [
      '반란군이 모인 카트레아에 들어서니 물을 사려는 줄 옆으로 낙타 수레가 빠르게 지나간다.',
      '수레에서 짐을 내리던 카심이 「소금」이라 쓰인 상자를 놓친다. 상자 안의 검은 화약이 내 발밑까지 쏟아진다.',
      '감독은 카심이 일어나기도 전에 걷어찬다. “네가 뭘 봤는지 말해 봐. 어디서 한 번만 떠들어 봐.”',
    ],
    body: '감독들이 카심을 둘러싼다. 구호 천막의 의사가 붕대를 들고 달려온다.',
    doors: [
      { label: '카심을 걷어차는 감독 앞을 막아선다', hint: '시장 수레 앞에서 감독과 싸우는 동안 의사가 카심을 부축한다', values: { dominion: D }, danger: true,
        fx: [flag('ep_alabasta_kasim_trust'), flag('ep_alabasta_w_force'), log('레일라가 카심을 천막 쪽으로 부축한다. 감독은 나에게 달려든다.', 'light'),
             log('전투 · 카트레아 시장의 수레 앞 / 붉은 낙타단 짐꾼 감독'), fight('b_rc_scout', false, { win: 'ep_alabasta_w2', lose: 'ep_alabasta_w2', back: 'ep_alabasta_w2' }, true)] },
      { label: '의사 레일라를 도와 다친 짐꾼들을 천막으로 옮긴다', hint: '그녀는 다친 사람마다 어디서 왔는지 적어 둔다', values: { peace: D },
        fx: [flag('ep_alabasta_leila_trust'), next('ep_alabasta_w2'), log('레일라가 카심의 상처를 감싸고 출신 마을을 적었다. 다른 편 마을 이름도 같은 장부에 있었다.', 'light')] },
      { label: '나디르의 낙타 방울을 흔들어 짐꾼들을 불러 모은다', hint: '방울 소리를 아는 낙타몰이들이 하나둘 모여든다', when: [has('ep_alabasta_p_bell')], values: { romance: D },
        fx: [flag('ep_alabasta_kasim_trust'), log('낙타 방울이 울리자 짐꾼들이 고개를 들었다. 에르말의 나디르를 아는 사람이 이 도시에도 있었다.'), next('ep_alabasta_w2')] },
    ],
  },
  {
    id: 'ep_alabasta_w2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '카트레아의 짐꾼 카심' },
    title: '같은 표식의 화약',
    body: '카심은 소금 상자가 반란군에게 갔다고 한다. 의사 레일라의 진료 장부에도 같은 화약에 다친 짐꾼들이 있다. 그 사람들이 짐을 나른 곳은 왕궁 편 마을이다.',
    doors: [
      { label: '화약 상자를 지키는 창고지기를 몰아세운다', hint: '배달 시각을 알아내지만 장수들이 내 뒤를 캔다', values: { ambition: D },
        fx: [flag('ep_alabasta_w_force'), { op: 'base', key: 'str', add: 1 }, next('ep_alabasta_w3'), log('붙잡힌 단원이 나노하나 항구의 상자 배달 시간을 뱉었다. 붉은 낙타 문양을 본 자들이 뒤를 밟았다.', 'light')] },
      { label: '카심과 짐꾼들의 술자리에 끼어 말을 섞는다', hint: '짐꾼들은 다 안다. 같은 상자가 성 안 무기고로도 들어간다', values: { loyalty: D },
        fx: [flag('ep_alabasta_kasim_trust'), next('ep_alabasta_w3'), log('카심이 상자에 찍힌 인장을 가리켰다. 같은 인장의 화약이 왕궁 쪽으로도 갔다.', 'light')] },
      { label: '레일라의 진료 기록과 상자의 인장을 맞춰 본다', hint: '같은 날 같은 인장이 양쪽 진영에 닿았다', values: { inquiry: D },
        fx: [flag('ep_alabasta_w_ledger'), flag('ep_alabasta_leila_trust'), next('ep_alabasta_w3'), log('레일라의 진료 날짜와 화약 운송 날짜가 겹쳤다. 장부 두 권에 같은 인장이 남았다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '카트레아의 짐꾼 카심' },
    title: '빈 수레가 돌아가는 곳',
    body: '화약 장수들의 수레가 빈 상자를 싣고 항구로 돌아간다. 카심이 바퀴 자국을 가리킨다. “저 뒤로 붙으면 다음 화약을 싣기 전에 창고를 찾을 수 있어요.”',
    doors: [
      { label: '카심과 수레바퀴 자국을 따라 사막을 건넌다', hint: '항구 뒤편의 낡은 염전 창고가 그들의 둥지다', values: { freedom: D },
        fx: [flag('ep_alabasta_w_depot'), flag('ep_alabasta_kasim_trust'), next('ep_alabasta_w4'), log('카심이 수레의 노래가 끝나는 골목을 짚었다. 낡은 염전 창고에 붉은 낙타 깃발이 걸려 있었다.', 'light')] },
      { label: '짐꾼 옷을 입고 수레를 함께 끈다', hint: '단원들의 수와 우두머리 오르한의 이름을 알게 된다', values: { ambition: D },
        fx: [flag('ep_alabasta_w_depot'), { op: 'base', key: 'int', add: 1 }, next('ep_alabasta_w4'), log('수레 바닥에 숨어 단원들의 이름을 외웠다. 오르한의 명령이 염전 창고에서 내려졌다.', 'light')] },
      { label: '수레를 가로막고 상자를 모래에 쏟아 버린다', hint: '화약 한 수레가 사라진다. 붉은 낙타단이 칼을 갈기 시작한다', values: { justice: D },
        fx: [flag('ep_alabasta_w_force'), { op: 'hp', add: -10 }, next('ep_alabasta_w4'), log('화약 수레를 빼앗자 단원들이 불씨를 껐다. 남은 이들은 카심을 찾아 골목을 뒤졌다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'koza' },
    title: '코자의 두 번째 주문서',
    intro: [
      '반란군 천막에서 코자가 판자를 뜯어 화약 상자를 확인한다. 옆에는 아직 서명하지 않은 두 번째 주문서가 있다.',
      '“이걸 안 사면 왕궁 군대에게 밀려. 하지만 같은 장수가 왕궁 쪽에도 팔았다면 이야기가 달라.”',
      '코자가 무기를 사 온 간부들을 물리고 내게 앉을 자리를 준다. “짐꾼한테도 물어봤다고 들었어. 그 사람이 본 것부터 알려 줘.”',
    ],
    body: '반란군을 이끄는 코자는 다음 주문을 넣기 전에 그 상자가 어디로 갔는지 확인하려 한다.',
    doors: [
      { label: '같은 장수가 왕궁에도 화약을 팔았다는 기록을 보여 준다', hint: '코자는 자기가 누구에게 무기를 샀는지 깨닫는다', when: [has('ep_alabasta_w_ledger')], values: { justice: D },
        fx: [flag('ep_alabasta_w_koza'), { op: 'person', kind: 'ally', relation: '카트레아의 천막에서 기록을 믿어 준 반란군 우두머리', canon: 'koza' }, next('ep_alabasta_w5'), log('두 진영의 상자 인장을 본 코자가 무기를 내려놓았다. 회의장은 한동안 조용했다.', 'light')] },
      { label: '짐꾼들이 본 것을 카심의 입으로 직접 듣게 한다', hint: '코자는 짐꾼의 말을 끊지 않는다. 그 상자들은 더 사지 않기로 한다', when: [has('ep_alabasta_kasim_trust')], values: { loyalty: D },
        fx: [flag('ep_alabasta_w_koza'), next('ep_alabasta_w5'), log('카심이 진료 기록을 끝까지 읽었다. 코자는 다음 화약 주문서를 찢었다.', 'light')] },
      { label: '반란군의 일은 반란군에게 맡기고 천막을 나선다', hint: '코자는 고개만 끄덕인다. 외지인에게 기대는 사람이 아니다', values: { freedom: D },
        fx: [next('ep_alabasta_w5'), log('천막의 결정이 이어지는 동안 코자는 외지인에게 더 묻지 않았다. 장교들이 다시 무기 값을 셌다.', 'light')] },
      { label: '무기 따위 빼앗으면 그만이라고 큰소리친다', hint: '간부들이 웃는다. 코자만은 웃지 않는다', special: 'dominion', when: [has('ep_alabasta_w_force')],
        fx: [log('코자가 조용히 말했다. 빼앗아 이기는 싸움이면 우리가 왕과 다를 게 뭐냐고.'), next('ep_alabasta_w5')] },
    ],
  },
  {
    id: 'ep_alabasta_w5', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '코브라 왕의 얼굴을 한 남자',
    intro: [
      '나노하나 항구에 닿자 염전 창고 쪽에서 불길이 치솟는다. 연기를 뚫고 나온 사람들이 코브라 왕이 직접 불을 질렀다고 외친다.',
      '불빛 속에서 국왕의 얼굴을 한 남자가 지나간다. 그의 군화가 돌바닥에서 무대 위 춤꾼처럼 빙글 돈다. 따라가려는 순간, 옆길에서 사람이 탄 수레에 불이 옮겨붙는다.',
      '불길 반대쪽으로는 붉은 낙타단이 화약 상자를 빼고 있다. 창고 앞에서 화약장이 탈리브가 맨 마지막 상자를 내려놓는다.',
    ],
    body: '창고에 들어가 거래 기록을 노리거나, 눈앞의 불과 수레를 돌볼 수 있다.',
    doors: [
      { label: '화약 창고에 들어가려고 탈리브와 맞선다', hint: '염전 창고 문 앞에서 탈리브와 싸운다. 안에 화약 거래 장부가 있다', values: { ambition: D }, danger: true,
        fx: [flag('ep_alabasta_w_found'), log('전투 · 나노하나 염전 창고 입구 / 붉은 낙타단 화약장이 탈리브'), fight('b_talib', false, { win: 'ep_alabasta_w6', lose: 'ep_alabasta_w6', back: 'ep_alabasta_w6' })] },
      { label: '불붙은 수레를 세우고 사람들을 내리게 한다', hint: '짐꾼들이 사람들을 빈 수레에 태워 대피시킨다', values: { romance: D }, danger: true,
        fx: [flag('ep_alabasta_w_found'), time('봉쿠레가 국왕의 모습으로 나타난 날, 염전에서 주민을 대피시켰다', 'bonclay'), next('ep_alabasta_w6'), log('염전의 짐꾼들이 사람들을 빈 수레에 태웠다. 불길이 창고를 덮기 전에 문이 비었다.', 'light')] },
      { label: '불을 끄는 사람들 틈에서 밤새 물을 나른다', hint: '창고 하나를 살린다. 붉은 낙타단의 수레는 그사이 떠난다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, time('봉쿠레가 국왕의 모습으로 나타난 날, 나노하나 창고의 불을 껐다', 'bonclay'), next('ep_alabasta_w6'), log('창고 지붕에 물을 퍼부어 불씨를 껐다. 그사이 붉은 낙타단의 마지막 수레가 항구를 벗어났다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w6', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '붉은 낙타단의 우두머리 오르한' },
    title: '오르한이 노리는 문',
    intro: [
      '화약 장수들을 이끄는 오르한이 사람 없는 길목에서 내 앞을 막는다.',
      '“같은 화약을 두 쪽에 팔면 같은 날 두 번 벌지. 이제 그놈들이 광장에서 서로 쏠 차례야.” 오르한이 도시의 서쪽을 손가락으로 짚는다.',
      '“그동안 우린 물 저장고를 가져간다. 전쟁이 끝나면 이 도시에서 물 한 모금 마실 때마다 나한테 돈을 내게 할 거야.”',
    ],
    body: '오르한이 돈 자루를 민다. 반란군이 수도에 닿는 날 저장고 문을 열어 달라고 한다.',
    doors: [
      { label: '오르한의 손을 쳐내고 등을 돌린다', hint: '그가 어깨를 으쓱한다. 그날 저수고에서 다시 보자고', values: { justice: D },
        fx: [flag('ep_alabasta_kasim_trust'), next('ep_alabasta_w7'), log('카심의 이름을 꺼내자 오르한이 웃음을 거뒀다. 다음 만남은 서쪽 저수고로 정해졌다.', 'light')] },
      { label: '거래하는 척하며 저장고에 들어갈 길을 묻는다', hint: '오르한이 돈과 함께 들이닥칠 문을 알려 준다', values: { inquiry: D },
        fx: [flag('ep_alabasta_w_inside'), { op: 'money', add: 15000 }, next('ep_alabasta_w7'), log('오르한이 저수고의 뒷문을 손가락으로 짚었다. 돈 자루를 받은 뒤 그 길을 기억했다.', 'light')] },
      { label: '돈을 받고 오르한에게 저장고 문을 열어 주기로 한다', hint: '주머니가 무거워진다. 카심이 더는 눈을 마주치지 않는다', values: { greed: D },
        fx: [flag('ep_alabasta_w_deal'), { op: 'money', add: 80000 }, log('오르한의 금화를 받았다. 그 금화에도 화약 냄새가 배어 있었다.'), next('ep_alabasta_w7')] },
      { label: '싸움 뒤에 물값을 올리지 않겠다는 다짐을 받아 낸다', hint: '오르한이 웃으며 약속한다. 지킬 사람의 얼굴은 아니다', special: 'ambition',
        fx: [{ op: 'money', add: 5000 }, log('오르한의 약속을 받았다. 종이 한 장 남지 않는 약속이었다.'), next('ep_alabasta_w7')] },
    ],
  },
  {
    id: 'ep_alabasta_w7', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '견습 의사 레일라' },
    title: '저장고 뒤의 피난민',
    body: '서쪽 물 저장고 뒤 골목마다 피난민이 앉아 있다. 레일라가 붕대 상자를 내려놓는다. “앞문에서 총을 쏘기 시작하면 이 길로는 들것 하나 못 빼요.”',
    doors: [
      { label: '저수고 둘레 골목의 주민들을 성 밖 우물터로 빼낸다', hint: '싸움이 번져도 이 골목에서는 아무도 깔리지 않는다', values: { loyalty: D },
        fx: [flag('ep_alabasta_w_evac'), { op: 'fame', add: 5 }, next('ep_alabasta_w8'), log('레일라가 부상자를 옮길 빈 마당을 마련했다. 총성이 시작되기 전에 골목의 가족들이 나갔다.', 'light')] },
      { label: '염전 창고에 남은 화약 통을 밤사이 물에 적셔 둔다', hint: '오르한이 가져갈 폭약을 못 쓰게 한다', when: [has('ep_alabasta_w_depot')], values: { freedom: D },
        fx: [flag('ep_alabasta_w_sabotage'), next('ep_alabasta_w8'), log('화약의 심지가 젖어 들었다. 오르한의 사내들은 마른 심지를 찾느라 수문 앞에 묶였다.', 'light')] },
      { label: '레일라와 함께 오르한이 들어올 길을 막는다', hint: '오르한이 수문에 폭약을 대기 어렵게 만든다', when: [has('ep_alabasta_w_inside')], values: { inquiry: D },
        fx: [flag('ep_alabasta_w_sabotage'), flag('ep_alabasta_leila_trust'), next('ep_alabasta_w8'), log('레일라가 치료하던 단원이 오르한의 진입로를 털어놓았다. 골목 반대쪽에 사람을 세웠다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w8', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '서쪽 물 저장고의 결전',
    intro: [
      '시계탑에 폭탄이 있다는 외침에 밀짚모자 해적단이 광장 쪽으로 내달린다. 좁은 골목을 돌자 광장의 총성이 벽 너머로 멀어진다.',
      '저장고 입구에는 오르한과 부하들이 먼저 와 있다. 오르한이 수문을 가리키며 부하에게 외친다. “저 문을 열어. 물 뜨러 온 놈도 지나가지 못하게 하고.”',
    ],
    body: '오르한을 막을 수 있다. 싸움을 피하면 피난민 곁에 남을 수 있지만 저장고는 내준다.',
    doors: [
      { label: '폭약을 못 쓰게 된 오르한에게 달려든다', hint: '폭약이 터지지 않는다. 그의 칼만 남았다', when: [has('ep_alabasta_w_sabotage')], values: { dominion: D }, danger: true,
        fx: [time('아르바나의 결전 날 서쪽 물 저장고에서 오르한과 맞섰다', 'vivi'), log('전투 · 아르바나 서쪽 물 저장고 입구 / 폭약을 못 쓰게 된 오르한'), fight('b_orhan_worn', false, { win: 'ep_alabasta_w9', lose: 'ep_alabasta_w10', back: 'ep_alabasta_w10' })] },
      { label: '저수고 문 앞에서 오르한과 정면으로 맞선다', hint: '화약과 칼이 함께 날아든다. 다치고 끝날 수도 있다', when: [not('ep_alabasta_w_sabotage')], values: { dominion: D }, danger: true,
        fx: [time('아르바나의 결전 날 서쪽 물 저장고에서 오르한과 맞섰다', 'vivi'), log('전투 · 아르바나 서쪽 물 저장고 입구 / 붉은 낙타단 우두머리 오르한'), fight('b_orhan', false, { win: 'ep_alabasta_w9', lose: 'ep_alabasta_w10', back: 'ep_alabasta_w10' })] },
      { label: '저장고를 내주고 골목의 피난민 곁에 남는다', hint: '싸우지 않는다. 등 뒤의 사람들은 지킨다', values: { peace: D },
        fx: [time('아르바나의 결전 날, 저수고 골목의 주민들 곁에 남았다', 'vivi'), next('ep_alabasta_w10'), log('저장고 앞에서 물러나 골목으로 갔다. 레일라가 가까운 집의 문을 열고 피난민을 안으로 들였다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w9', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '두 손에 떨어지는 빗방울',
    body: '오르한이 칼을 끌고 달아난다. 왕궁 호위대장 펠이 매로 변해 폭탄을 안고 올라가고, 굉음은 하늘에서 들린다. 저녁 무렵 손등에 빗방울이 떨어진다. 열린 골목 끝에서 비비 공주의 목소리가 들린다.',
    doors: [
      { label: '저장고 입구를 반란군과 왕궁 병사에게 함께 맡긴다', hint: '어제까지 칼을 겨누던 손들이 같은 빗장을 건다', when: [has('ep_alabasta_kasim_trust'), has('ep_alabasta_w_found'), not('ep_alabasta_w_deal')], values: { loyalty: D },
        fx: [flag('ep_alabasta_w_win'), { op: 'fame', add: 20 }, time('밀짚모자의 소년이 크로커다일을 쓰러뜨리고 아르바나에 비가 내리던 날, 서쪽 저수고를 지켜 냈다', 'crocodile'), next('ep_alabasta_w11'), log('반란군과 왕궁 병사가 함께 수문 빗장을 걸었다. 빗물에 젖은 손들이 같은 쇠를 붙잡았다.', 'light')] },
      { label: '양쪽에 화약을 판 장부를 코자와 왕궁에 함께 내민다', hint: '빗속에서 두 진영이 같은 종이를 읽는다', when: [has('ep_alabasta_kasim_trust'), has('ep_alabasta_leila_trust'), has('ep_alabasta_w_ledger'), not('ep_alabasta_w_deal')], values: { justice: D },
        fx: [flag('ep_alabasta_w_win'), { op: 'fame', add: 25 }, time('비가 내린 아르바나에서, 두 진영에 화약을 판 자들의 장부를 내밀었다', 'koza'), next('ep_alabasta_w11'), log('카심이 두 진영 앞에 같은 인장의 장부를 펼쳤다. 서로 겨누던 총구가 종이 쪽으로 내려갔다.', 'light')] },
      { label: '저장고는 주민에게 맡기고 광장으로 간다', hint: '문을 잠그고 나면 병사들을 말리는 비비의 목소리가 들린다', values: { romance: D },
        fx: [flag('ep_alabasta_w_win'), time('밀짚모자의 소년이 크로커다일을 쓰러뜨리고, 아르바나에 비가 내렸다', 'crocodile'), next('ep_alabasta_w10'), log('주민들과 저장고 문을 잠갔다. 그들이 입구를 지키기로 한 뒤 광장으로 갔다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w10', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '총을 내려놓은 사람들',
    intro: [
      '광장으로 나가니 가뭄 뒤 처음 내린 비가 깨진 돌바닥에 고여 있다. 비비 공주가 들것에 실린 사람들 사이를 다닌다.',
      '왕궁 병사 하나가 들것의 앞을 들자 반란군 병사가 말없이 뒤를 들어 올린다. 레일라가 젖지 않은 종이 한 장을 꺼낸다.',
    ],
    body: '레일라에게는 아직 받아 적을 부상자 이름이 남아 있다.',
    doors: [
      { label: '레일라와 그날 다친 사람들의 이름을 끝까지 적는다', hint: '편을 가르지 않은 기록이 남는다. 왕궁이 그것을 받아 든다', when: [has('ep_alabasta_leila_trust'), has('ep_alabasta_w_ledger'), not('ep_alabasta_w_deal')], values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, time('아르바나의 결전 뒤, 양쪽의 부상자를 편 가르지 않고 기록했다', 'vivi'), next('ep_alabasta_w11'), log('레일라의 기록이 왕궁 관리에게 넘어갔다. 부상자 이름 옆에 어느 편인지는 적히지 않았다.', 'light')] },
      { label: '오르한이 남긴 몫을 챙겨 비 그친 사막을 건넌다', hint: '주머니는 무겁다. 카심은 다시는 이름을 부르지 않는다', when: [has('ep_alabasta_w_deal')], values: { greed: D },
        fx: [{ op: 'money', add: 40000 }, time('아르바나의 결전 날, 화약 장수와 손잡고 저수고 문을 열었다', 'crocodile'), next('ep_alabasta_w11'), log('받은 돈을 세는 사이 카심이 저수고 반대편으로 짐을 옮겼다. 그는 인사하지 않았다.', 'light')] },
      { label: '공주의 외침을 멀리서 들으며 조용히 성을 떠난다', hint: '이 나라의 내일은 이 나라 사람들의 것이다', values: { peace: D },
        fx: [time('비비 공주의 외침이 광장의 싸움을 멈춰 세운 것을 멀리서 들었다', 'vivi'), next('ep_alabasta_w11'), log('광장의 외침이 빗소리에 묻혔다. {name}은(는) 골목을 지나며 두 진영의 들것이 나란히 가는 걸 봤다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_w11', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '카트레아의 짐꾼 카심' },
    title: '빗물 고인 길',
    body: '빗물이 고인 카트레아 길가에서 카심이 짐을 내려놓는다. 레일라도 접던 붕대를 내려놓고 떠나는 발소리를 살핀다.',
    doors: [
      { label: '레일라가 건네는 약초 주머니를 받는다', hint: '모래바람에 갈라진 상처에 바르는 것이라고 한다', when: [has('ep_alabasta_leila_trust'), not('ep_alabasta_w_deal')], values: { romance: D },
        fx: [flag('ep_alabasta_w_herb'), flag('ep_alabasta_war_done'), log('레일라의 약초 주머니를 받았다. 쓴 풀 냄새 속에 빗물 냄새가 섞여 있었다.')] },
      { label: '바다를 보겠다는 카심을 배에 태운다', hint: '한동안 같은 길을 간다. 레일라가 웃으며 등을 떠민다', when: [has('ep_alabasta_kasim_trust'), has('ep_alabasta_leila_trust'), not('ep_alabasta_w_deal')], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'crew', relation: '비 내린 알라바스타에서 따라나선 짐꾼 카심', years: 1 }, flag('ep_alabasta_w_herb'), flag('ep_alabasta_war_done'),
             log('카심이 짐꾼의 멜빵을 벗어 레일라에게 맡기고 배에 올랐다.')] },
      { label: '빗물 고인 길을 밟으며 혼자 떠난다', hint: '발자국이 물에 번진다', values: { freedom: D },
        fx: [flag('ep_alabasta_war_done'), log('비 내린 알라바스타를 떠났다. 발밑에서 젖은 모래가 소리를 냈다.')] },
    ],
  },

  // ================================================================ 원작 뒤 (주인공 20~): 물길의 주인
  {
    id: 'ep_alabasta_a1', kind: 'door', when: at(on(ISL), age(20, 60), not('ep_alabasta_post_done')), weight: 25, repeat: 'once', speaker: 'hero',
    title: '농부를 끌어낸 물길',
    intro: [
      '가뭄이 끝난 알라바스타에서 새 물길을 따라 걷는다. 말랐던 밭 사이로 물이 거품을 내며 지난다.',
      '물길을 팠다는 하리스가 삽으로 밭의 작은 입구를 연다. 물을 기다리던 농부가 고랑에 들어서는데, 경비가 농부의 팔을 비틀어 끌어낸다.',
      '“새물 조합 증서부터 사 와. 종이 한 장 없으면 네 밭에 물 한 방울도 못 대.” 하리스가 고랑에 떨어진 농부의 모자를 주워 든다.',
    ],
    body: '경비가 농부를 끌고 간다. 증서를 관리하는 왕궁 서기가 물길의 말뚝을 살피고 있다.',
    doors: [
      { label: '농부를 잡아끈 경비한테 맞선다', hint: '물길 옆에서 경비와 싸우는 동안 하리스가 농부를 데리고 나간다', values: { dominion: D }, danger: true,
        fx: [flag('ep_alabasta_haris_trust'), flag('ep_alabasta_a_force'), log('경비가 내 쪽으로 다가오는 동안 하리스가 농부를 물길 밖으로 데리고 나간다.', 'light'),
             log('전투 · 유바의 새 물길 / 새물 조합 경비'), fight('b_nw_scout', false, { win: 'ep_alabasta_a2', lose: 'ep_alabasta_a2', back: 'ep_alabasta_a2' }, true)] },
      { label: '왕궁 서기 마이사와 말뚝에 찍힌 도장을 적는다', hint: '같은 도장이 너무 많은 말뚝에 찍혀 있다', values: { inquiry: D },
        fx: [flag('ep_alabasta_maisa_trust'), next('ep_alabasta_a2'), log('마이사가 말뚝의 도장을 종이에 떴다. 멀리 떨어진 밭의 증서와도 정확히 같았다.', 'light')] },
      { label: '예전에 받은 우물 지도와 새 물길을 겹쳐 본다', hint: '말뚝은 옛 상단이 잠갔던 우물 자리에만 박혀 있다', when: [has('ep_alabasta_p_map')], values: { romance: D },
        fx: [flag('ep_alabasta_a_ledger'), flag('ep_alabasta_maisa_trust'), log('사피야의 지도 위에 새 물길을 겹쳤다. 모래시계 상단의 자물쇠 자리마다 푸른 말뚝이 박혀 있었다.'), next('ep_alabasta_a2')] },
    ],
  },
  {
    id: 'ep_alabasta_a2', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '왕궁의 물 증서 담당관 마이사' },
    title: '팔지 않은 물의 증서',
    body: '왕궁 서기 마이사가 두 집의 증서를 펼친다. 가뭄 때 먹을 것을 사려고 물 쓸 권리를 판 집도 있다. “이 집은 판 적이 없다고 해요. 그런데 조합이 내놓은 종이에는 팔았다고 적혀 있어요.”',
    doors: [
      { label: '조합의 증서 거간꾼을 골목에 몰아넣는다', hint: '거간꾼이 떨며 이름을 댄다. 조합장 무스타파가 이 일을 듣게 된다', values: { ambition: D },
        fx: [flag('ep_alabasta_a_force'), { op: 'base', key: 'str', add: 1 }, next('ep_alabasta_a3'), log('거간꾼이 무스타파의 이름을 말하자 조합원이 골목 끝으로 달려갔다.', 'light')] },
      { label: '가뭄 때 물 쓸 권리를 판 주민들의 사정을 듣는다', hint: '오늘 먹을 빵을 사려고 내년의 물을 판 사람들이다', values: { peace: D },
        fx: [flag('ep_alabasta_a_people'), flag('ep_alabasta_haris_trust'), next('ep_alabasta_a3'), log('하리스가 돌아온 집들의 이름을 읽었다. 빵 몇 덩이에 넘긴 증서를 쥔 사람들이 하나둘 모였다.', 'light')] },
      { label: '마이사의 등기부와 조합 증서의 도장을 대조한다', hint: '이름은 다르지만 서명의 글씨가 같다', values: { inquiry: D },
        fx: [flag('ep_alabasta_a_ledger'), flag('ep_alabasta_maisa_trust'), next('ep_alabasta_a3'), log('마이사는 서명 세 장을 겹쳐 봤다. 획이 똑같은 손에서 나왔다는 걸 회의용 장부에 표시했다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_a3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '토토 노인의 제자 하리스' },
    title: '돌을 싣고 상류로',
    body: '새물 조합 사무소에서 돌과 목재를 실은 마차가 나온다. 하리스가 묻는다. “마을 공사는 끝났는데, 저 위에 뭘 더 짓는 걸까요?”',
    doors: [
      { label: '하리스와 조합 마차를 따라 강 상류로 간다', hint: '상류의 갈대숲 뒤에 무언가를 쌓고 있다', values: { loyalty: D },
        fx: [flag('ep_alabasta_a_gate'), flag('ep_alabasta_haris_trust'), next('ep_alabasta_a4'), log('하리스가 밤 수레를 따라 갈대숲을 가리켰다. 새 수문의 돌기둥이 물길을 막고 있었다.', 'light')] },
      { label: '일꾼으로 가장해 조합 사무소의 금고 방을 엿본다', hint: '수문 설계도와 경비 명단이 한 상자에 들어 있다', values: { freedom: D },
        fx: [flag('ep_alabasta_a_gate'), { op: 'base', key: 'int', add: 1 }, next('ep_alabasta_a4'), log('상자 속 도면에 물길을 조합 저수지로 꺾는 선이 그어져 있었다. 경비 교대 시각도 적혀 있었다.', 'light')] },
      { label: '조합 사무소의 문을 걷어차고 들어간다', hint: '증서 몇 장을 빼앗는다. 조합이 사람을 더 사들인다', values: { justice: D },
        fx: [flag('ep_alabasta_a_force'), { op: 'hp', add: -10 }, next('ep_alabasta_a4'), log('빼앗은 증서를 마이사에게 넘겼다. 라시드는 갈대숲 경비를 두 배로 늘렸다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_a4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'pell' },
    title: '펠이 요구한 왕궁 기록',
    intro: [
      '왕궁 회의에서 농부들이 종자 주머니를 내민다. 밭의 파종 때가 지나면 물이 와도 올해 수확은 끝이다.',
      '조합 사람은 증서를 탁자에 늘어놓는다. “왕궁 도장입니다. 막고 싶으시면 이 나라 법부터 바꾸셔야죠.”',
      '호위대장 펠이 일어서서 종이 한 장을 빛에 비춘다. “도장이 찍힌 경위는 내가 알아보겠소. 마을에서 무슨 일이 있었는지는 직접 들으리다.”',
    ],
    body: '펠에게 찾은 증서를 보여 주거나, 증서를 판 주민들의 사정을 전할 수 있다.',
    doors: [
      { label: '서명을 같은 사람이 쓴 증서들을 펠에게 보여 준다', hint: '펠이 위조가 의심되는 증서를 왕궁 기록관에게 넘긴다', when: [has('ep_alabasta_a_ledger')], values: { justice: D },
        fx: [flag('ep_alabasta_a_pell'), { op: 'person', kind: 'ally', relation: '물 회의에서 증서를 함께 살핀 호위대장', canon: 'pell' }, next('ep_alabasta_a5'), log('펠이 왕궁 기록관을 불렀다. 같은 사람이 쓴 두 증서를 원본 장부와 대조하기로 했다.', 'light')] },
      { label: '증서를 팔 수밖에 없었던 집들의 사정을 대신 전한다', hint: '펠이 고개를 끄덕인다. 법보다 먼저 사람을 본다', when: [has('ep_alabasta_a_people')], values: { loyalty: D },
        fx: [flag('ep_alabasta_a_pell'), next('ep_alabasta_a5'), log('하리스가 마른 밭의 흙을 회의 탁자에 올렸다. 펠은 그 흙을 쥐고 증서 주인을 물었다.', 'light')] },
      { label: '회의는 이 나라 사람들에게 맡기고 자리를 뜬다', hint: '펠은 외지인을 붙잡지 않는다', values: { peace: D },
        fx: [next('ep_alabasta_a5'), log('펠은 문을 열어 줬지만 회의에 남아 있었다. {name}은(는) 다시 물길로 나갔다.', 'light')] },
      { label: '조합 사무소를 부순 일을 자랑삼아 늘어놓는다', hint: '회의장이 술렁인다. 펠의 눈이 차가워진다', special: 'dominion', when: [has('ep_alabasta_a_force')],
        fx: [log('펠은 무력으로 한 번 갈라진 나라를 다시 힘으로 다잡을 수는 없다고 했다.'), next('ep_alabasta_a5')] },
    ],
  },
  {
    id: 'ep_alabasta_a5', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '조합의 물이 되는 강',
    body: '갈대숲을 헤치니 수문이 보인다. 마을로 갈 물이 옆으로 꺾여 조합의 저수지를 채운다. 수문 경비 라시드가 갈대 흔들리는 쪽으로 칼끝을 돌린다.',
    doors: [
      { label: '수문 위의 라시드에게 정면으로 맞선다', hint: '수문에 가까워질 수 있지만 칼을 피해야 한다', values: { ambition: D }, danger: true,
        fx: [flag('ep_alabasta_a_found'), log('전투 · 갈대숲 수문 위 / 새물 조합 경비장 라시드'), fight('b_rashid', false, { win: 'ep_alabasta_a6', lose: 'ep_alabasta_a6', back: 'ep_alabasta_a6' })] },
      { label: '하리스가 아는 옛 우물길로 수문 아래를 기어든다', hint: '토토 노인이 파던 길이다. 수문의 약한 기둥이 보인다', when: [has('ep_alabasta_haris_trust')], values: { freedom: D },
        fx: [flag('ep_alabasta_a_found'), next('ep_alabasta_a6'), log('토토가 파던 옛 길에서 수문 밑의 약한 기둥을 봤다. 하리스가 그 자리에 돌로 표식을 남겼다.', 'light')] },
      { label: '마이사와 수문 위아래의 물 높이를 재어 적는다', hint: '꺾인 물의 양이 남는다. 다만 라시드의 칼끝이 스친다', values: { inquiry: D },
        fx: [flag('ep_alabasta_a_ledger'), flag('ep_alabasta_maisa_trust'), { op: 'hp', add: -10 }, next('ep_alabasta_a6'), log('마이사가 꺾인 물의 높이를 기록했다. 라시드의 칼을 피해 나온 뒤에도 장부는 젖지 않았다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_a6', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '물 증서 등기관 마이사' },
    title: '한 사람이 쓴 여러 이름',
    body: '마이사가 여러 집의 도장이 찍힌 증서를 겹쳐 든다. “사는 곳도 이름도 다른데, 서명을 쓴 버릇이 같아요.” 문밖에서 발소리가 멎는다. 원본을 노리는 사람이 왔다.',
    doors: [
      { label: '위조된 서명을 대조해 마이사의 장부에 적는다', hint: '조합의 주장을 뒤집을 증거가 된다', values: { inquiry: D },
        fx: [flag('ep_alabasta_a_ledger'), next('ep_alabasta_a7'), log('서명이 빠진 증서를 펠 앞에 펼쳤다. 왕궁 등기관이 원본과 대조하러 왔다.', 'light')] },
      { label: '장부를 노리는 경비를 밖으로 끌어내 싸운다', hint: '새물 조합 경비와 싸운다. 그사이 마이사가 원본을 빼낸다', when: [ready(3)], values: { ambition: D }, danger: true,
        fx: [flag('ep_alabasta_maisa_trust'), log('원본을 품은 마이사가 뒷문으로 빠진다. 나는 앞마당에서 경비를 막아선다.', 'light'),
             log('전투 · 왕궁 서기실 앞마당 / 장부를 노리는 새물 조합 경비'), fight('b_nw_scout', false, { win: 'ep_alabasta_a7', lose: 'ep_alabasta_a7', back: 'ep_alabasta_a7' }, true)] },
      { label: '우물 이용자들에게 장부를 공개한다', hint: '주민들이 제 서명의 진위를 직접 확인한다', values: { peace: D },
        fx: [flag('ep_alabasta_a_people'), next('ep_alabasta_a7'), log('우물가 사람들이 자기 도장을 확인했다. 판 적 없는 땅의 증서에는 낯선 손글씨가 있었다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_a7', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '새물 조합의 조합장 무스타파' },
    title: '무스타파가 매긴 값',
    intro: [
      '조합장 무스타파가 수문 위를 내려다보는 방에서 나를 부른다. 난간 아래로 물통을 실은 마차가 지나간다.',
      '“농부는 땅을 팔 수 있어도 물을 안 사고 배길 순 없지. 아래 물길을 닫으면 오늘 내 가격에 사 가는 거요.”',
      '내가 위조된 증서 이야기를 꺼내자 그가 종이를 덮는다. “그걸 확인할 시간에 우리 마차를 지켜 주시오. 대가를 두둑이 치르리다.”',
    ],
    body: '무스타파는 수문 곁에 서 주면 물값의 일부를 주겠다고 한다.',
    doors: [
      { label: '수문을 지켜 달라는 제안을 거절한다', hint: '무스타파가 혀를 찬다. 수문의 경비가 늘어난다', values: { loyalty: D },
        fx: [flag('ep_alabasta_a_people'), next('ep_alabasta_a8'), log('무스타파의 제안서를 돌려줬다. 다음 날 수문에 새 경비 초소가 세워졌다.', 'light')] },
      { label: '수문을 지킬 척하며 경비의 교대 시간을 묻는다', hint: '돈과 함께 경비 구역을 드나들 통행증을 받는다', values: { inquiry: D },
        fx: [flag('ep_alabasta_a_inside'), { op: 'money', add: 20000 }, next('ep_alabasta_a8'), log('돈을 받으며 무스타파의 지도를 봤다. 그는 {name}을(를) 믿고 갈대숲 통행증을 내줬다.', 'light')] },
      { label: '물값의 몫을 받고 수문 경비를 맡는다', hint: '주머니가 무거워진다. 하리스가 삽을 내던진다', values: { greed: D },
        fx: [flag('ep_alabasta_a_deal'), { op: 'money', add: 100000 }, log('새물 조합의 몫을 받았다. 증서 뭉치 위에 찍힌 도장들이 손바닥만큼 무거웠다.'), next('ep_alabasta_a8')] },
      { label: '서명을 위조한 증서만큼은 돌려 달라고 요구한다', hint: '무스타파가 셈을 한다. 몇 장쯤은 내줄 수 있다고', special: 'justice',
        fx: [log('무스타파가 증서 몇 장을 내밀었다. 나머지 수문은 그대로 닫혀 있었다.'), next('ep_alabasta_a8')] },
    ],
  },
  {
    id: 'ep_alabasta_a8', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '토토 노인의 제자 하리스' },
    title: '수문이 닫히기 전',
    body: '내일 수문이 닫히면 밭의 물이 끊긴다. 하리스가 물길보다 낮은 지붕들을 가리킨다. “당장 문을 부수면 저 집들이 잠겨요. 물을 어디로 보낼지부터 정해야 해요.”',
    doors: [
      { label: '물길 아래 마을 사람들을 높은 곳으로 옮긴다', hint: '물이 쏟아져도 집 안에 남은 사람은 없다', values: { peace: D },
        fx: [flag('ep_alabasta_a_evac'), next('ep_alabasta_a9'), log('하리스가 아래쪽 집의 문을 두드렸다. 마지막 노인이 언덕에 오른 뒤 피난길을 닫았다.', 'light')] },
      { label: '저수지의 물을 빈 도랑으로 돌린다', hint: '경비들이 새는 물을 막으러 가 수문 곁이 빈다', when: [has('ep_alabasta_a_gate')], values: { freedom: D },
        fx: [flag('ep_alabasta_a_sabotage'), next('ep_alabasta_a9_worn'), log('물이 빈 도랑으로 흐르기 시작한다. 지켜보던 경비들이 둑 쪽으로 달려간다.', 'light')] },
      { label: '거짓 거래로 들은 교대 시간에 경비를 빼돌린다', hint: '경비를 다른 곳으로 보내 무스타파와 단둘이 맞설 수 있다', when: [has('ep_alabasta_a_inside')], values: { ambition: D },
        fx: [flag('ep_alabasta_a_sabotage'), next('ep_alabasta_a9_worn'), log('거짓 전갈을 받은 경비들이 교대 종이 울리자 반대편 둑으로 간다. 무스타파만 수문에 남는다.', 'light')] },
    ],
  },
  sluiceShowdown(false),
  sluiceShowdown(true),
  {
    id: 'ep_alabasta_a10', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '돌아오는 물소리',
    body: '무스타파가 증서 가방을 끌어안고 달아난다. 경비가 물러난 자리에 주민들이 서고, 수문 모서리로 첫 물이 샌다. 이 물을 누가 어떻게 나눠 쓸지 정할 차례다.',
    doors: [
      { label: '남은 수문 기둥을 뽑아 물을 마을 쪽으로 돌린다', hint: '물길은 다시 모두의 것이 된다. 하리스가 첫 물에 손을 담근다', when: [has('ep_alabasta_haris_trust'), has('ep_alabasta_a_found'), not('ep_alabasta_a_deal')], values: { loyalty: D },
        fx: [flag('ep_alabasta_a_win'), { op: 'fame', add: 25 }, time('되살아난 알라바스타에서 새물 조합의 수문을 부수고 물길을 마을에 돌려주었다'), next('ep_alabasta_a12'), log('하리스가 열린 수문 아래에 손을 담갔다. 농부들이 물길을 따라 제 밭으로 뛰었다.', 'light')] },
      { label: '거둔 증서를 마을과 왕궁이 함께 쓰는 물 장부로 바꾼다', hint: '도장 대신 이름들이 적힌다. 누구도 혼자 물을 쥐지 못한다', when: [has('ep_alabasta_haris_trust'), has('ep_alabasta_maisa_trust'), has('ep_alabasta_a_ledger'), not('ep_alabasta_a_deal')], values: { justice: D },
        fx: [flag('ep_alabasta_a_win'), { op: 'fame', add: 30 }, time('되살아난 알라바스타에서 물 증서를 마을과 왕궁이 함께 쓰는 장부로 바꾸었다', 'pell'), next('ep_alabasta_a12'), log('마이사와 마을 사람들이 새 장부 첫 장에 함께 이름을 적었다. 펠이 왕궁 도장을 찍었다.', 'light')] },
      { label: '일단 수문을 열고 물 배분은 왕궁 회의로 넘긴다', hint: '오늘은 밭에 물을 댄다. 다음에 누가 수문을 맡을지는 다시 정한다', values: { romance: D },
        fx: [flag('ep_alabasta_a_win'), next('ep_alabasta_a11'), log('주민들과 잠금쇠를 풀자 밭 쪽으로 물이 흘렀다. 다음부터 누가 이 수문을 맡을지는 왕궁 회의에서 논의한다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_a11', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '밭으로 갈 물',
    body: '왕궁 탁자에 증서가 다시 쌓인다. 농부 하나가 마른 밭에서 뽑아 온 모종을 그 옆에 내려놓는다. 마이사가 진짜 증서와 가짜를 골라낼 장부를 펼친다.',
    doors: [
      { label: '마이사와 위조 증서를 하나하나 무효로 만든다', hint: '왕궁 등기부에서 조합의 도장이 지워진다', when: [has('ep_alabasta_maisa_trust'), has('ep_alabasta_a_ledger'), not('ep_alabasta_a_deal')], values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, time('되살아난 알라바스타에서 위조된 물 증서를 무효로 만들었다'), next('ep_alabasta_a12'), log('마이사가 등기부의 조합 도장을 지웠다. 돌아온 집들이 새 증서를 받아 들었다.', 'light')] },
      { label: '조합의 몫으로 받은 물값을 챙겨 떠날 채비를 한다', hint: '돈은 쌓인다. 물길가의 눈길이 등에 꽂힌다', when: [has('ep_alabasta_a_deal')], values: { greed: D },
        fx: [{ op: 'money', add: 50000 }, time('되살아난 알라바스타에서 물 증서를 사들인 조합의 몫을 챙겼다'), next('ep_alabasta_a12'), log('조합 몫의 돈을 받자 하리스가 물길 건너편으로 갔다. 그는 배웅하지 않았다.', 'light')] },
      { label: '물길의 일은 이 나라 사람들에게 맡긴다', hint: '말뚝은 몇 개 뽑히고 몇 개는 그대로다', values: { peace: D },
        fx: [time('되살아난 알라바스타를 지나왔다. 물길의 말뚝은 반쯤 남아 있었다'), next('ep_alabasta_a12'), log('말뚝 몇 개를 뽑고 떠났다. 뽑히지 않은 자리에서는 농부들이 계속 증서를 내밀어야 했다.', 'light')] },
    ],
  },
  {
    id: 'ep_alabasta_a12', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '토토 노인의 제자 하리스' },
    title: '유바를 떠나는 길',
    body: '유바를 떠나는 길에 하리스가 삽을 씻는 우물가를 지난다. 두레박이 퐁당 빠지는 소리가 난다. 이곳을 처음 지날 때는 물 한 모금에도 값을 물어야 했다.',
    doors: [
      { label: '하리스가 건네는 우물 바닥의 돌 하나를 받는다', hint: '스승이 가뭄 내내 파던 우물에서 나온 돌이라고 한다', when: [has('ep_alabasta_haris_trust'), not('ep_alabasta_a_deal')], values: { romance: D },
        fx: [flag('ep_alabasta_a_stone'), flag('ep_alabasta_post_done'), log('하리스에게서 유바 우물 바닥의 돌을 받았다. 손에 쥐면 서늘했다.')] },
      { label: '새 물길이 바다에 닿는 걸 보겠다는 하리스와 함께 떠난다', hint: '한동안 같은 길을 간다. 마이사가 우물가에서 손을 흔든다', when: [has('ep_alabasta_haris_trust'), has('ep_alabasta_maisa_trust'), not('ep_alabasta_a_deal')], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'crew', relation: '알라바스타에서 따라나선 우물 일꾼 하리스', years: 2 }, flag('ep_alabasta_a_stone'), flag('ep_alabasta_post_done'),
             log('하리스가 스승에게 삽을 맡기고 따라나섰다. 토토 노인은 물 한 바가지를 길에 뿌려 주었다.')] },
      { label: '모래 언덕을 넘어 다음 섬으로 간다', hint: '발자국은 바람이 지운다', values: { freedom: D },
        fx: [flag('ep_alabasta_post_done'), log('알라바스타를 떠났다. 등 뒤에서 오아시스의 물소리가 오래 들렸다.')] },
    ],
  },
];
