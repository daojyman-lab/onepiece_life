// 섬 장편 에피소드: skypiea (v6.6). 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md
// 세 시기: 에넬의 지배 시기(주인공 12~15) / 어퍼 야드의 서바이벌과 방주 맥심(주인공 18) / 종이 울린 뒤(주인공 19~).
// 에넬은 원작 아크 전 지배 시기에만 직접 맞설 수 있다(경지 5). 이겨도 에넬은 따분해하며 물러날 뿐, 신의 자리는 그대로다.
// 원작 아크의 그 순간에는 에넬을 쓰러뜨리고 종을 울리는 것은 루피다. 주인공은 엔젤섬의 피난 · 신관과의 싸움 · 샨디아의 전선에 선다.
import type { Turning } from '../../core/types';
import { D, on, flag, has, not, next, log, time, fight, ready, type FoeDef } from './kit';
import { age, at } from '../turnings/paths';

const SKY = on('스카이피아', '엔젤섬', '샨디아 마을');

export const FOES_SKYPIEA: FoeDef[] = [
  { id: 'b_enel', name: '신 에넬', title: '하늘섬의 신', p: 78, sea: 'gl_first', faction: 'civil', age: 30,
    skills: ['fruit:goro:0', 'fruit:goro:1', 'fruit:goro:2', 'fruit:goro:3', 'obs_read'], tactic: 'offense', fruitClass: 'logia', observation: 2 },
  { id: 'b_satori', name: '사토리', title: '신관 · 구슬의 시련', p: 40, sea: 'gl_first', faction: 'civil', age: 30,
    skills: ['fist_jab', 'fist_combo', 'fist_counter', 'obs_sense'], tactic: 'counter', observation: 1 },
  { id: 'b_shura', name: '슈라', title: '신관 · 실의 시련', p: 44, sea: 'gl_first', faction: 'civil', age: 30,
    skills: ['sword_cut', 'sword_flash', 'gun_bind', 'obs_sense'], tactic: 'offense', observation: 1 },
  { id: 'b_gedatsu', name: '게다츠', title: '신관 · 늪의 시련', p: 42, sea: 'gl_first', faction: 'civil', age: 30,
    skills: ['fist_jab', 'fist_iron', 'fist_guard', 'obs_sense'], tactic: 'endurance', observation: 1 },
  { id: 'b_ohm', name: '오무', title: '신관 · 철의 시련', p: 52, sea: 'gl_first', faction: 'civil', age: 30,
    skills: ['sword_cut', 'sword_wave', 'sword_parry', 'obs_read'], tactic: 'counter', observation: 2 },
];

export const EP_SKYPIEA: Turning[] = [
  // ================================================================ 에넬의 지배 시기 (주인공 12~15)
  {
    id: 'ep_skypiea_1', kind: 'door', when: at(SKY, age(12, 15), not('ep_skypiea_done')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '번개가 떨어진 날', body: '맑은 하늘에서 천둥이 울리고, 어퍼 야드의 거대한 나무들 위로 하얀 번개가 몇 번이고 내리꽂힌다. 이튿날 엔젤섬에 소문이 돈다. 하늘의 기사 간 폴이 쓰러지고, 에넬이라는 사내가 스스로를 신이라 부른다고. {name}은(는) 구름 해안에서 타 버린 숲의 연기를 올려다본다.',
    doors: [
      { label: '새 신의 신병 모집에 이름을 적는다', hint: '번개 아래에서 먹고사는 법을 배운다', values: { ambition: D },
        fx: [flag('ep_skypiea_god'), log('신의 군대 막사에서 창 쥐는 법부터 배웠다. 모두가 말을 아꼈다. 신은 모든 목소리를 듣는다고 했다.'), next('ep_skypiea_2a')] },
      { label: '숲 가장자리의 샨디아 전사들을 따라간다', hint: '사백 년 묵은 싸움 한가운데로 들어간다', values: { loyalty: D },
        fx: [flag('ep_skypiea_shandia'), log('얼굴에 문신을 한 전사들이 처음에는 창끝을 겨누었다. 어린 손에 쥔 물주머니를 보고서야 창을 내렸다.'), next('ep_skypiea_2b')] },
      { label: '구름 숲에 쓰러진 노기사를 찾아 나선다', hint: '패배한 옛 신의 곁에 선다', values: { justice: D },
        fx: [flag('ep_skypiea_ganfall'), next('ep_skypiea_2c')] },
    ],
  },
  {
    id: 'ep_skypiea_2a', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '신관 사토리' },
    title: '구슬의 시련', body: '둥근 몸집의 신관이 볼을 부풀리며 웃는다. 호호, 오늘 어퍼 야드에 들어온 청해 사람이 있다고. 구름 숲에 떠다니는 구슬들이 하나씩 터지며 비명이 울린다. 신관은 {name}의 손에 창을 쥐여 주고, 살아남은 자를 끌고 오라고 한다.',
    doors: [
      { label: '명령대로 침입자를 끌고 온다', hint: '신관의 눈에 든다. 끌려간 자의 얼굴이 남는다', values: { dominion: D },
        fx: [{ op: 'fame', add: 5 }, { op: 'mastery', branch: 'observation', add: 8 }, { op: 'hardship', add: 1 }, next('ep_skypiea_3')] },
      { label: '침입자를 구름 뒤로 숨겨 내려보낸다', hint: '들키면 신의 심판이다', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7,
               then: [log('밧줄 끝에 매달린 청해 사람이 구름 아래로 사라지며 손을 흔들었다.')],
               else: [{ op: 'hp', add: -25 }, log('사토리의 구슬이 등 뒤에서 터졌다. 호호, 거짓말은 들린다고.')] }, next('ep_skypiea_3')] },
      { label: '창을 내던지고 신관에게 덤빈다', hint: '이길 수 없을지도 모른다. 막사로는 돌아갈 수 없다', values: { freedom: D }, danger: true,
        fx: [fight('b_satori', false, { win: 'ep_skypiea_3', lose: 'ep_skypiea_3', back: 'ep_skypiea_3' })] },
    ],
  },
  {
    id: 'ep_skypiea_2b', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'wiper' },
    title: '고향 땅의 전사', body: '바주카를 멘 젊은 전사가 담배를 비벼 끄며 숲을 노려본다. 저 땅은 조상의 땅이다, 신이든 뭐든 빼앗은 자는 몰아낸다. 밤의 습격이 시작되고, 불새를 탄 신관이 하늘에서 내려온다.',
    doors: [
      { label: '불새의 신관을 붙잡아 둔다', hint: '전사들이 물러날 틈을 번다', values: { loyalty: D }, danger: true,
        fx: [fight('b_shura', false, { win: 'ep_skypiea_3', lose: 'ep_skypiea_3' })] },
      { label: '부상자를 업고 숲 밖으로 나른다', hint: '이름은 남지 않는다. 사는 사람이 늘어난다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'person', kind: 'ally', relation: '숲에서 업어 나온 샨디아 전사', canon: 'kamakiri' }, next('ep_skypiea_3')] },
      { label: '불탄 신병 막사에서 다이얼 상자를 챙긴다', hint: '싸움보다 남는 것이 있다', values: { greed: D },
        fx: [{ op: 'money', add: 40000 }, log('불길 속에서 끌어낸 상자에는 플레임 다이얼과 임팩트 다이얼이 가득했다.'), next('ep_skypiea_3')] },
    ],
  },
  {
    id: 'ep_skypiea_2c', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'ganfall' },
    title: '하늘의 기사', body: '구름 숲 외딴 오두막, 붕대를 감은 노기사가 창을 손질한다. 곁에서 반은 말이고 반은 새인 피에르가 날개를 턴다. 나는 신의 자리를 지키지 못했다, 하지만 하늘의 백성은 지켜야 한다고 노인이 말한다.',
    doors: [
      { label: '노기사의 순찰에 길잡이로 따라선다', hint: '구름길을 익힌다. 신관들의 눈에 띈다', values: { justice: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 10 }, { op: 'person', kind: 'ally', relation: '구름 숲의 노기사', canon: 'ganfall' }, next('ep_skypiea_3')] },
      { label: '다이얼과 구름의 이치를 배운다', hint: '하늘섬의 오래된 지식이 손에 익는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, log('간 폴은 톤 다이얼에 옛 노래를 담아 들려주었다. 사라진 황금의 도시를 노래한 것이라고 했다.'), next('ep_skypiea_3')] },
      { label: '오두막을 떠나 엔젤섬으로 돌아간다', hint: '신의 눈을 피해 조용히 산다', values: { peace: D },
        fx: [log('노기사는 붙잡지 않았다. 피리 소리가 들리면 언제든 날아오겠다고만 했다.', 'light')] },
    ],
  },
  {
    id: 'ep_skypiea_3', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '신의 심판', body: '엔젤섬 광장에서 어부 하나가 술김에 신을 욕했다. 하늘이 갑자기 어두워지고, 사람들이 발밑의 구름만 내려다본다. 누군가 속삭인다. 만트라는 이 섬의 모든 말을 듣는다고. 구름 속에서 우르릉, 소리가 난다.',
    doors: [
      { label: '어부를 끌어안고 그늘로 뛴다', hint: '번개보다 빠를 수는 없다. 그래도 몸이 먼저 나간다', values: { justice: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'injury', severity: 'light' }, log('번개가 광장 바닥을 태웠다. 어부와 {name}은(는) 그을린 채 살아남았다. 신이 일부러 빗맞힌 것인지는 아무도 모른다.'), next('ep_skypiea_4')] },
      { label: '입을 다물고 고개를 숙인다', hint: '오늘을 넘긴다. 마음 한구석이 탄다', values: { peace: D },
        fx: [{ op: 'hardship', add: 1 }, log('번개는 한 사람만 데려갔다. 광장의 누구도 그 이름을 다시 입에 올리지 않았다.')] },
      { label: '어퍼 야드의 신전으로 직접 올라간다', hint: '신이 무엇인지 제 눈으로 본다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, next('ep_skypiea_4')] },
    ],
  },
  {
    id: 'ep_skypiea_4', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '신 에넬' },
    title: '신의 땅의 사내', body: '거대한 나무 꼭대기의 신전, 북을 등에 둘러멘 사내가 사과를 베어 물며 귀를 늘어뜨린다. 야하하, 네가 오는 소리는 아까부터 들렸다. 사내의 손가락 끝에서 파란 불꽃이 튄다. 무릎을 꿇든 덤비든 마음대로 하라고, 어차피 결과는 같다고.',
    doors: [
      { label: '신에게 정면으로 맞선다', hint: '번개 그 자체와 싸운다. 지면 돌아오지 못한다', when: [ready(5)], values: { dominion: D }, danger: true,
        fx: [fight('b_enel', true, { win: 'ep_skypiea_5w', lose: 'ep_skypiea_5l', back: 'ep_skypiea_5l' })] },
      { label: '무릎을 꿇고 신의 일을 묻는다', hint: '신은 방주와 끝없는 대지 이야기를 한다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, log('에넬은 따분하다는 듯 말했다. 이 좁은 하늘은 신에게 어울리지 않는다고, 언젠가 끝없는 대지로 가겠다고.'), next('ep_skypiea_5l')] },
      { label: '등을 돌려 신전 계단을 내려간다', hint: '등 뒤에서 웃음소리가 따라온다', values: { freedom: D },
        fx: [{ op: 'chance', p: 0.6,
               then: [log('웃음소리만 따라왔다. 신은 등 돌린 아이 하나에 번개를 쓸 만큼 한가하지 않았다.')],
               else: [{ op: 'hp', add: -20 }, log('발치에 번개 한 줄기가 떨어졌다. 경고였다.')] }, next('ep_skypiea_5l')] },
    ],
  },
  {
    id: 'ep_skypiea_5w', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '신 에넬' },
    title: '따분해진 신', body: '그을린 신전 바닥에 에넬이 주저앉아 귓불을 만지작거린다. 야하하, 재미있군. 하지만 신은 이런 놀이에 오래 매이지 않는다. 사내는 구름 너머 어딘가를 가리키며 몸을 번개로 바꾸어 사라진다. 그곳에서는 밤낮으로 쇠 두드리는 소리가 들린다.',
    doors: [
      { label: '신이 사라진 쪽으로 쫓아간다', hint: '구름 끝에서 무언가 거대한 것이 만들어지고 있다', values: { inquiry: D },
        fx: [flag('ep_skypiea_enel'), { op: 'fame', add: 20 }, log('구름 너머에서 황금으로 칠한 거대한 배의 뼈대를 보았다. 신은 어디론가 떠날 생각이었다.'),
             time('신 에넬과 맞서 물러나게 했다')] },
      { label: '엔젤섬 사람들에게 신도 피를 흘린다고 알린다', hint: '사람들의 눈빛이 조금 달라진다', values: { justice: D },
        fx: [flag('ep_skypiea_enel'), { op: 'fame', add: 30 }, log('그날 밤 엔젤섬에서는 오래간만에 노랫소리가 났다. 신관들은 못 들은 척했다.'),
             time('신 에넬과 맞서 물러나게 했다')] },
      { label: '말없이 신관들 앞을 지나간다', hint: '신병들이 먼저 길을 비킨다', values: { dominion: D },
        fx: [flag('ep_skypiea_enel'), log('승리는 {name} 혼자만의 비밀로 남았다.', 'light')] },
    ],
  },
  {
    id: 'ep_skypiea_5l', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'conis' },
    title: '구름 해안의 소녀', body: '정신을 차리니 엔젤섬 구름 해안이다. 또래의 소녀가 구름여우 스우를 안은 채 {name}을(를) 내려다보며 젖은 수건을 짠다. 아버지가 웨이버로 건져 왔다고, 신을 만나러 갔던 거냐고 작게 묻는다.',
    doors: [
      { label: '신전에서 본 것을 털어놓는다', hint: '두 사람만의 비밀이 생긴다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '엔젤섬 구름 해안의 소녀', canon: 'conis' }, log('소녀는 끝까지 듣고 고개를 끄덕였다. 하늘섬 사람들은 모두 같은 것을 참고 산다고.')] },
      { label: '웨이버 타는 법을 배운다', hint: '구름 위를 달리는 법이 몸에 익는다', values: { freedom: D },
        fx: [{ op: 'base', key: 'spd', add: 1 }, log('파가야 씨의 웨이버는 바람을 다이얼에 담아 구름을 갈랐다.')] },
      { label: '몸을 추스르고 다시 일어선다', hint: '언젠가 이 하늘이 바뀔 날을 기다린다', values: { ambition: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }] },
    ],
  },

  // ================================================================ 어퍼 야드의 서바이벌과 방주 맥심 (주인공 18)
  {
    id: 'ep_skypiea_10', kind: 'door', when: at(SKY, age(18, 18), not('ep_skypiea_done'), not('ep_skypiea_arc')), weight: 30, repeat: 'once', speaker: 'hero',
    title: '청해에서 온 해적', body: '밀짚모자를 쓴 청해의 해적들이 천국의 문을 넘어왔다는 소문이 엔젤섬을 휩쓴다. 같은 날 어퍼 야드에서 신관과 신병, 샨디아 전사와 청해 사람이 한꺼번에 뒤엉킨다. 신이 놀이를 시작했다고, 끝까지 서 있는 자만 남는다고 사람들이 수군댄다.',
    doors: [
      { label: '엔젤섬 사람들의 피난을 돕는다', hint: '싸움터 대신 사람들 곁에 선다', values: { peace: D },
        fx: [time('밀짚모자 일당이 어퍼 야드에 들어선 날, 엔젤섬의 피난을 도왔다', 'luffy'), next('ep_skypiea_11a')] },
      { label: '샨디아 전사들의 전선으로 달려간다', hint: '사백 년 싸움의 마지막 날이 될지 모른다', values: { loyalty: D },
        fx: [time('밀짚모자 일당이 어퍼 야드에 들어선 날, 샨디아의 전선에 섰다', 'luffy'), next('ep_skypiea_11b')] },
      { label: '철의 시련을 맡은 신관을 찾아간다', hint: '구름 숲 깊은 곳에서 칼날 같은 구름이 기다린다', values: { ambition: D }, danger: true,
        fx: [time('밀짚모자 일당이 어퍼 야드에 들어선 날, 신관 오무를 찾아 숲으로 들어갔다', 'luffy'), next('ep_skypiea_11c')] },
    ],
  },
  {
    id: 'ep_skypiea_11a', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'conis' },
    title: '엔젤섬을 버리는 날', body: '코니스가 떨리는 목소리로 외친다. 신이 하늘섬을 모두 없애려 한다고, 지금 당장 섬을 떠나라고. 처음엔 아무도 믿지 않는다. 그러다 구름 위로 먹구름이 거대하게 부풀어 오르고, 아이들이 울기 시작한다.',
    doors: [
      { label: '노인들을 웨이버에 태워 구름 끝까지 나른다', hint: '몇 번이고 오간다. 몸이 버텨 줄지 모른다', values: { peace: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 10 }, log('구름 끝에 모인 사람들이 하나둘 늘었다. {name}이(가) 나른 노인들이 맨 앞에서 기도했다.'), next('ep_skypiea_12')] },
      { label: '피난민의 짐을 노리는 신병들을 막아선다', hint: '흩어진 신의 군대가 마지막 약탈에 나섰다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'mastery', branch: 'fist', add: 10 }, next('ep_skypiea_12')] },
      { label: '비어 가는 상점에서 쓸 만한 다이얼을 챙긴다', hint: '어차피 다 사라질 섬이다', values: { greed: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'hardship', add: 1 }, next('ep_skypiea_12')] },
    ],
  },
  {
    id: 'ep_skypiea_11b', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { canon: 'laki' },
    title: '전사들의 마지막 싸움', body: '총을 든 샨디아 여전사가 이를 악문다. 와이퍼는 혼자 신에게 가겠다고 했다고, 그 길목을 늪의 신관이 막고 있다고. 발밑의 구름이 질척하게 꺼지고, 멍한 눈의 신관이 입을 반쯤 벌린 채 서 있다.',
    doors: [
      { label: '늪의 신관을 붙잡아 길을 연다', hint: '전사들이 숲 안쪽으로 나아갈 틈이 생긴다', values: { loyalty: D }, danger: true,
        fx: [fight('b_gedatsu', false, { win: 'ep_skypiea_12', lose: 'ep_skypiea_12', back: 'ep_skypiea_12' })] },
      { label: '쓰러진 전사들을 숲 밖으로 옮긴다', hint: '싸움은 남들에게 맡기고 목숨을 건진다', values: { romance: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '총을 든 샨디아 여전사', canon: 'laki' }, next('ep_skypiea_12')] },
      { label: '거대한 나무 위에서 숲의 흐름을 살핀다', hint: '누가 어디로 가는지 내려다본다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'observation', add: 10 }, log('숲 한가운데 덩굴 너머로 황금빛이 언뜻 비쳤다. 사백 년 전에 사라진 도시의 흔적이었다.'), next('ep_skypiea_12')] },
    ],
  },
  {
    id: 'ep_skypiea_11c', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: { relation: '신관 오무' },
    title: '철의 시련', body: '선글라스를 쓴 키 큰 신관이 철구름 칼을 늘어뜨린 채 사냥개를 쓰다듬는다. 천국이란 무엇이냐고, 천국은 싸울 필요가 없는 곳이라고 중얼거린다. 사방의 구름이 철조망으로 굳어 간다.',
    doors: [
      { label: '철구름 칼과 맞선다', hint: '쉽게 끝나는 싸움이 아니다', values: { dominion: D }, danger: true,
        fx: [fight('b_ohm', false, { win: 'ep_skypiea_12', lose: 'ep_skypiea_12', back: 'ep_skypiea_12' })] },
      { label: '철조망을 피해 신관이 노리는 청해 사람에게 알린다', hint: '싸움은 그들 몫이 된다', values: { freedom: D },
        fx: [{ op: 'base', key: 'spd', add: 1 }, log('철조망 너머에서 칼 세 자루를 든 청해의 사내가 고개를 끄덕였다.', 'light'), next('ep_skypiea_12')] },
      { label: '신관이 흘린 다이얼을 주워 숲을 빠져나온다', hint: '목숨과 주머니를 함께 챙긴다', values: { greed: D },
        fx: [{ op: 'money', add: 30000 }, next('ep_skypiea_12')] },
    ],
  },
  {
    id: 'ep_skypiea_12', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '하늘에 울린 종', body: '하늘을 뒤덮은 먹구름에서 번개가 비처럼 쏟아지고, 구름 위로 황금빛 배가 떠오른다. 한참 뒤, 거대한 덩굴 꼭대기에서 소리가 퍼진다. 댕, 댕. 사백 년 만에 울린 황금의 종소리가 하늘섬과 그 아래 청해까지 내려간다. 사람들이 울며 하늘을 올려다본다.',
    doors: [
      { label: '피난민들 곁에서 종소리를 듣는다', hint: '누가 울렸는지는 몰라도 끝났다는 것은 안다', values: { peace: D },
        fx: [flag('ep_skypiea_arc'), log('먹구름이 갈라지고 햇빛이 쏟아졌다. 누군가 신이 졌다고 소리쳤다.'), time('밀짚모자의 루피가 에넬을 쓰러뜨리고 황금의 종을 울렸다', 'luffy')] },
      { label: '번개를 맞은 아이를 끌어안고 버틴다', hint: '종이 울릴 때까지 놓지 않는다', values: { romance: D }, danger: true,
        fx: [flag('ep_skypiea_arc'), { op: 'hp', add: -20 }, { op: 'person', kind: 'ally', relation: '번개 속에서 끌어안았던 하늘섬 아이', age: { younger: 10 } },
             time('밀짚모자의 루피가 에넬을 쓰러뜨리고 황금의 종을 울렸다', 'luffy')] },
      { label: '덩굴 쪽으로 쏟아진 황금 조각을 줍는다', hint: '역사는 남의 몫이고 금은 손에 남는다', values: { greed: D },
        fx: [flag('ep_skypiea_arc'), { op: 'money', add: 80000 }, time('황금의 종이 울린 날, 떨어진 금 조각을 주웠다', 'luffy')] },
      { label: '신의 번개가 어디로 향할지 미리 사람들에게 알린다', hint: '그 사내의 버릇을 안다', when: [has('ep_skypiea_enel')], special: 'justice', values: { justice: D },
        fx: [flag('ep_skypiea_arc'), { op: 'fame', add: 20 }, log('번개가 떨어지기 전에 사람들을 흩었다. 신과 한 번 겨룬 몸이 그 리듬을 기억했다.'),
             time('밀짚모자의 루피가 에넬을 쓰러뜨리고 황금의 종을 울렸다', 'luffy')] },
    ],
  },

  // ================================================================ 종이 울린 뒤 (주인공 19~)
  {
    id: 'ep_skypiea_20', kind: 'door', when: at(SKY, age(19, 60), not('ep_skypiea_done')), weight: 25, repeat: 'once', speaker: 'hero',
    title: '사백 년 만의 잔치', body: '어퍼 야드의 숲 가장자리에서 하늘섬 사람들과 샨디아 사람들이 한 불 앞에 앉는다. 누군가 톤 다이얼에 담아 둔 그날의 종소리를 틀자, 잔치가 잠깐 조용해진다. 신이 떠난 하늘은 생각보다 넓다.',
    doors: [
      { label: '잔치의 불가에서 춤을 춘다', hint: '오늘만큼은 모두가 한 마을이다', values: { romance: D },
        fx: [{ op: 'base', key: 'luk', add: 1 }, next('ep_skypiea_21')] },
      { label: '덩굴에 덮인 황금 도시의 터를 함께 고친다', hint: '사라진 도시의 이야기가 손끝에서 나온다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, log('무너진 벽에 새겨진 옛 문자는 아무도 읽지 못했다. 그래도 사람들은 조심스럽게 흙을 털었다.'), next('ep_skypiea_21')] },
      { label: '청해와 다이얼을 사고파는 길을 연다', hint: '하늘과 바다 사이에 장사가 시작된다', values: { greed: D },
        fx: [{ op: 'money', add: 60000 }, next('ep_skypiea_21')] },
    ],
  },
  {
    id: 'ep_skypiea_21', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '다시 만난 얼굴', body: '잔치가 무르익을 무렵, 낯익은 얼굴 하나가 불빛 사이로 다가온다. 몇 해 사이 얼굴에 주름과 흉터가 늘었다. 그 사람이 {name}의 어깨를 툭 치며, 그날 하늘에서 들은 종소리를 기억하느냐고 묻는다.',
    doors: [
      { label: '바주카를 내려놓은 전사와 술잔을 나눈다', hint: '이제 싸울 상대가 없다고 그가 웃는다', when: [has('ep_skypiea_shandia')], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '바주카를 내려놓은 샨디아 전사', canon: 'wiper' }, log('와이퍼는 조상의 땅에 앉아 처음으로 담배를 천천히 피웠다.'), next('ep_skypiea_22')] },
      { label: '다시 하늘의 기사가 된 노인과 구름길을 달린다', hint: '피에르의 날갯짓이 여전하다', when: [has('ep_skypiea_ganfall')], values: { justice: D },
        fx: [{ op: 'person', kind: 'ally', relation: '하늘의 기사', canon: 'ganfall' }, log('간 폴은 신의 자리 대신 기사의 창을 다시 들었다. 하늘섬에 신은 더 필요 없다고 했다.'), next('ep_skypiea_22')] },
      { label: '창을 버린 옛 신병과 지난날을 털어놓는다', hint: '같은 막사에서 말을 아끼던 사이다', when: [has('ep_skypiea_god')], special: 'dominion', values: { dominion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '창을 버린 옛 신병' }, log('그는 이제 구름 숲에서 나무를 심는다고 했다. 번개 맞은 자리마다 하나씩.'), next('ep_skypiea_22')] },
      { label: '엔젤섬의 소녀였던 사람과 구름 해안을 걷는다', hint: '그날 이야기를 웃으며 할 수 있게 되었다', values: { freedom: D },
        fx: [{ op: 'person', kind: 'ally', relation: '엔젤섬 구름 해안의 친구', canon: 'conis' }, next('ep_skypiea_22')] },
    ],
  },
  {
    id: 'ep_skypiea_22', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '종소리의 메아리', body: '해가 질 무렵 덩굴 꼭대기의 황금 종이 바람에 한 번 흔들린다. 저 아래 구름 밑 어딘가에서, 사백 년 전 이 종을 기다리던 이들의 후손이 그 소리를 들었을지 모른다. {name}은(는) 구름 끝에 서서 오래 귀를 기울인다.',
    doors: [
      { label: '하늘섬에 뿌리를 내린다', hint: '이 구름 위가 집이 된다', values: { peace: D },
        fx: [flag('ep_skypiea_done'), log('구름 위의 작은 집에 다이얼 등불을 달았다. 저녁이면 종소리가 들렸다.'), time('하늘섬과 샨디아가 함께 사는 땅에 뿌리를 내렸다')] },
      { label: '구름 아래 청해로 내려갈 채비를 한다', hint: '종소리가 닿은 아래 세상이 궁금하다', values: { ambition: D },
        fx: [flag('ep_skypiea_done'), log('구름 끝에서 아래를 내려다보았다. 종소리가 닿았을 그 바다로 가 보기로 했다.'), time('하늘섬의 종소리를 뒤로하고 청해를 향했다')] },
      { label: '종소리를 톤 다이얼에 담아 품에 넣는다', hint: '어디에 가든 이 소리를 꺼내 들을 수 있다', values: { freedom: D },
        fx: [flag('ep_skypiea_done'), log('작은 조개 안에서 종소리가 언제까지나 울렸다.', 'light')] },
      { label: '그날 종을 울린 청해 사람의 이야기를 아이들에게 들려준다', hint: '그날의 하늘을 본 사람만 할 수 있는 이야기다', when: [has('ep_skypiea_arc')], special: 'romance', values: { romance: D },
        fx: [flag('ep_skypiea_done'), { op: 'fame', add: 10 }, log('밀짚모자를 쓴 고무 사내가 신을 쓰러뜨린 이야기는 하늘섬의 옛이야기가 되어 갔다.')] },
    ],
  },
];
