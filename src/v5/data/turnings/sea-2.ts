// 바다 이동 (과제 10, 설계 5.6) 둘째: 이스트 블루를 떠난 뒤의 바다에서 오는 전환점.
// 위대한 항로 전반(입구 · 전반 · 샤본디)과 후반(신세계 전반 · 후반). 강한 바다일수록 맞서는 문은 경지가 있어야 열리고,
// 약한 사람에게는 숨기 · 달아나기 · 흥정하기 · 빌붙기의 문이 늘 하나 이상 열려 있다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { SEAFARING, age, at, sea, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const READY = (min: number): Cond[] => [{ c: 'tier', branch: 'any', min }];
/** 바다를 다니거나 그 바다의 섬에 사는 사람 */
const HERE = st(...SEAFARING, 'civil', 'shipwright');

export const SEA_GRAND_LINE: Turning[] = [
  // ---------------------------------------------------------------- 위대한 항로 입구와 전반, 샤본디
  {
    id: 'gl_whisky_peak', kind: 'door', when: at(age(16), HERE, sea('gl_entry')),
    weight: 5, repeat: 'once', speaker: { relation: '선인장 바위 마을의 촌장' },
    title: '너무 반가운 마을', body: '선인장 바위가 솟은 항구 마을 사람들이 뱃사람들을 환영한다며 잔치를 열었다. 술이 끝없이 나온다. 그런데 술집 벽에 걸린 현상수배서들이 하나같이 뜯긴 자국투성이다.',
    doors: [
      { label: '잔치를 즐기고 곯아떨어진다', hint: '깨어나 보면 무엇이 없어졌을지 모른다', values: { romance: D },
        fx: [{ op: 'hp', add: 10 }, { op: 'chance', p: 0.6, then: [{ op: 'money', add: -15000 }, { op: 'log', text: '깨어 보니 주머니가 비어 있었다. 마을 사람들은 언제 그랬냐는 듯 웃었다.', weight: 'light' }] }] },
      { label: '취한 척하다 밤에 몰래 배로 돌아간다', hint: '잔치의 끝을 보지 않는다. 다치지 않는다', values: { freedom: D },
        fx: [{ op: 'log', text: '새벽, 마을 쪽에서 칼 부딪치는 소리가 들렸다. 뒤돌아보지 않고 닻을 올렸다.', weight: 'light' }] },
      { label: '덮쳐 오는 사냥꾼들을 거꾸로 묶어 버린다', hint: '마을 전체가 사냥꾼이다. 경지가 있어야 버틴다', values: { dominion: D }, danger: true, when: READY(2),
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 10 }, { op: 'log', text: '선인장 바위 아래 사냥꾼 수십을 묶어 놓고 술을 마저 마셨다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'gl_little_garden', kind: 'door', when: at(age(16), HERE, sea('gl_entry')),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '백 년의 결투', body: '공룡이 사는 원시의 섬 한가운데서 두 거인이 도끼와 칼을 맞대고 있다. 백 년째 끝나지 않는 결투라고 한다. 화산이 연기를 뿜을 때마다 둘은 다시 맞붙는다.',
    doors: [
      { label: '바위에 앉아 결투가 끝날 때까지 지켜본다', hint: '해가 지고 달이 뜬다. 끝은 나지 않는다', values: { romance: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '두 거인은 지쳐 쓰러지고도 웃었다. 내일 또 하자고.', weight: 'heavy' }] },
      { label: '공룡을 피해 숲 그늘에 숨어 지낸다', hint: '기록 지침이 차오를 때까지 한 해를 숨어 산다', values: { peace: D },
        fx: [{ op: 'hp', add: -5 }] },
      { label: '두 거인에게 고기와 술을 나르며 이야기를 듣는다', hint: '거인의 나라 이야기를 듣는다. 고기를 구하느라 공룡과 마주친다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'heardElbaf' }] },
    ],
  },
  {
    id: 'gl_log_broken', kind: 'door', when: at(age(16), st(...SEAFARING), sea('gl_entry', 'gl_first')),
    weight: 4, repeat: { years: 6 }, speaker: 'hero',
    title: '멈춘 기록 지침', body: '손목의 기록 지침 바늘이 제멋대로 돈다. 섬의 자기장이 바늘을 망가뜨렸다. 이 바다에서 길을 잃는다는 건 죽는다는 뜻이다. 항구에는 다음 섬으로 떠나는 다른 해적선이 있다.',
    doors: [
      { label: '다른 배의 꽁무니를 따라간다', hint: '앞 배의 선장에게 뱃삯 대신 몫을 떼어 준다', 
        fx: [{ op: 'money', add: -10000 }] },
      { label: '별과 해류를 읽어 스스로 길을 찾는다', hint: '틀리면 바다 한가운데서 굶는다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '별을 따라 사흘 만에 다음 섬의 그림자를 보았다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'log', text: '열흘을 헤맨 끝에 겨우 이름 모를 섬에 닿았다.', weight: 'heavy' }] }] },
      { label: '섬에 머물며 새 지침을 구할 때까지 기다린다', hint: '몇 달을 보낸다. 서두르지 않는다', values: { peace: D },
        fx: [{ op: 'money', add: -5000 }, { op: 'hp', add: 10 }] },
    ],
  },
  {
    id: 'gl_mock_town', kind: 'door', when: at(age(17), st(...SEAFARING), sea('gl_first')),
    weight: 4, repeat: 'once', speaker: { relation: '술집의 해적' },
    title: '꿈을 비웃는 마을', body: '자야의 모크 타운은 꿈을 비웃는 해적들의 마을이다. 하늘에 섬이 있다는 말을 하자 술집 전체가 웃음바다가 된다. 덩치 큰 해적 하나가 {name}의 머리에 술을 붓는다.',
    doors: [
      { label: '술을 뒤집어쓴 채 잔을 비우고 나간다', hint: '싸움을 피한다. 웃음소리가 등 뒤를 따라온다', mark: 'composure', values: { peace: D },
        fx: [{ op: 'hardship', add: 1 }] },
      { label: '술을 부은 해적의 멱살을 잡는다', hint: '술집 전체와 붙는다. 경지가 없으면 바닥을 구른다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'chance', p: 0.5, then: [{ op: 'fame', add: 5 }], else: [{ op: 'hp', add: -10 }, { op: 'injury', severity: 'light' }] }] },
      { label: '같이 웃으며 하늘섬 이야기는 농담이었다고 한다', hint: '술값을 얻어먹는다. 그날 밤 꿈 이야기를 다시는 꺼내지 않는다', values: { ambition: D },
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'mockedDream' }] },
    ],
  },
  {
    id: 'gl_aqua_laguna', kind: 'door', when: at(age(16), HERE, sea('gl_first')),
    weight: 4, repeat: 'once', speaker: { relation: '물의 도시의 목수' },
    title: '물의 도시의 큰 물결', body: '워터 세븐에 해마다 오는 큰 물결이 밀려온다. 아래 도시는 모두 높은 곳으로 피했다. 뒷골목에 아직 다리를 다친 노인이 남아 있다는 외침이 들린다. 빈집들의 문은 열려 있다.',
    doors: [
      { label: '큰 물결 속으로 노인을 데리러 간다', hint: '물결이 집채만 하다. 헤엄을 못 치면 끝이다', values: { devotion: D }, danger: true, needs: ['swim'],
        fx: [{ op: 'hp', add: -20 }, { op: 'person', kind: 'ally', relation: '큰 물결에서 건진 노인', age: { older: 40 } }, { op: 'fame', add: 3 }] },
      { label: '목수들과 함께 방파제를 지킨다', hint: '밤새 모래주머니를 쌓는다. 도시가 {name}을(를) 기억한다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '빈집들의 문을 열고 들어간다', hint: '물결이 다 쓸어 갈 것들이다. 아무도 보지 않는다', values: { ambition: D },
        fx: [{ op: 'money', add: 20000 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'gl_skypiea_toll', kind: 'door', when: at(age(17), st(...SEAFARING), sea('gl_first'), { c: 'island', is: ['스카이피아'] }),
    weight: 5, repeat: 'once', speaker: { relation: '하늘섬 입구의 문지기 노파' },
    title: '구름 위의 입국세', body: '하늘섬의 입구, 구름 위에서 날개 달린 노파가 사진기를 들고 묻는다. 관광인지 전쟁인지. 입국세는 한 사람에 금 열 냥이다. 내지 않아도 들어갈 수는 있다고, 대신 책임은 지지 않는다고.',
    doors: [
      { label: '입국세를 내고 들어간다', hint: '하늘섬의 법을 따른다', values: { justice: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'log', text: '흰 구름 바다의 섬에서 하늘 사람들이 춤을 추었다.', weight: 'light' }] },
      { label: '구름 사이로 몰래 들어간다', hint: '돈은 아낀다. 신의 군대에 쫓길 수 있다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'hp', add: -20 }, { op: 'log', text: '번개 같은 신관의 군대에 쫓겨 구름 숲을 헤맸다.', weight: 'heavy' }] }] },
      { label: '노파에게 하늘섬의 옛이야기를 청한다', hint: '황금의 종과 사라진 도시 이야기를 듣는다', values: { inquiry: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'heardShandora' }] },
    ],
  },
  {
    id: 'gl_sabaody_auction', kind: 'door', when: at(age(17), HERE, sea('sabaody')),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '휴먼 숍', body: '샤본디 제도 1번 그로브의 경매장에 사람들이 줄지어 들어간다. 오늘의 상품은 사람이다. 무대 뒤의 우리 안에서 어린 인어가 울고 있다. 앞줄에 천룡인이 앉아 있다.',
    doors: [
      { label: '경매장 앞에서 고개를 숙이고 지나간다', hint: '천룡인과 엮이지 않는다. 우는 소리가 오래 남는다', fx: [{ op: 'hardship', add: 2 }] },
      { label: '가진 돈을 다 모아 한 사람의 값을 치른다', hint: '빈털터리가 된다. 사슬 하나가 풀린다', values: { devotion: D }, when: [{ c: 'money', min: 50000 }],
        fx: [{ op: 'money', add: -50000 }, { op: 'person', kind: 'ally', relation: '경매장에서 값을 치러 풀어 준 사람' }, { op: 'timeline', text: '샤본디의 경매장에서 한 사람의 값을 치러 풀어 주었다' }] },
      { label: '무대 뒤로 숨어들어 우리의 자물쇠를 부순다', hint: '천룡인의 물건에 손대는 일이다. 해군 대장이 온다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 15 }, { op: 'flag', id: 'govEnemy' }, { op: 'log', text: '소동 속에서 인어를 물가로 데려갔다. 그날 밤 해군 대장이 섬에 왔다는 소문이 돌았다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '경비에게 붙잡혀 사슬에 묶였다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'gl_sabaody_coating', kind: 'door', when: at(age(17), st(...SEAFARING), sea('sabaody'), { c: 'flag', id: 'ship', has: true }),
    weight: 5, repeat: 'once', speaker: { relation: '코팅 장인' },
    title: '코팅의 값', body: '배를 비눗방울로 감싸야 깊은 바닷속 길을 지나 신세계에 갈 수 있다. 코팅 장인이 부른 값은 가진 돈의 몇 배다. 사흘이 걸리고, 그동안 이 섬에서는 해군 대장의 그림자가 어른거린다.',
    doors: [
      { label: '장인 밑에서 일해 코팅 값을 갚는다', hint: '한 해를 이 섬에서 보낸다. 손은 고되지만 빚은 없다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'str', add: 1 }] },
      { label: '코팅을 마친 큰 해적단의 배에 빌붙어 함께 내려간다', hint: '남의 깃발 밑에서 신세계에 간다. 그 선장의 심부름을 해야 한다', values: { ambition: D },
        fx: [{ op: 'move', island: '어인섬', sea: 'sabaody' }, { op: 'flag', id: 'underling' }, { op: 'log', text: '남의 배 갑판 구석에 앉아 깊은 바닷속으로 내려갔다. 빛이 사라지고 물고기들이 지나갔다.', weight: 'heavy' }] },
      { label: '이 섬에 눌러앉아 놀이공원 뒷일을 한다', hint: '신세계는 접는다. 비눗방울 섬의 일상이 시작된다', values: { peace: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 5000 }, { op: 'timeline', text: '샤본디 제도에 눌러앉았다' }] },
    ],
  },
];

export const SEA_NEW_WORLD: Turning[] = [
  // ---------------------------------------------------------------- 신세계
  {
    id: 'nw_tribute', kind: 'door', when: at(age(18), st(...SEAFARING), sea('nw_first')),
    weight: 5, repeat: 'once', speaker: { relation: '사황의 사자' },
    title: '과자 공물', body: '배가 사황의 영역에 들어섰다. 체스 말 병사들을 거느린 사자가 다가와, 이 바다를 지나려면 다달이 과자 한 톤을 바치라고 한다. 바치지 못한 섬은 지도에서 사라졌다고.',
    doors: [
      { label: '공물을 바치기로 하고 지나간다', hint: '다달이 돈이 나간다. 무사히 지나간다', values: { peace: D },
        fx: [{ op: 'money', add: -30000 }] },
      { label: '밤을 틈타 영역 밖으로 달아난다', hint: '체스 말 병사들이 쫓아온다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] }] },
      { label: '사황의 산하에 들어가 그 깃발을 단다', hint: '공물은 면하고 명령을 받는다. 그 깃발이 지켜 준다', values: { ambition: D },
        fx: [{ op: 'flag', id: 'underling' }, { op: 'fame', add: 10 }, { op: 'timeline', text: '사황의 깃발 아래로 들어갔다' }] },
    ],
  },
  {
    id: 'nw_dressrosa_toys', kind: 'door', when: at(age(18), HERE, sea('nw_first'), { c: 'island', is: ['드레스로자'] }),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '말하는 장난감들의 나라', body: '드레스로자의 거리에는 사람과 장난감이 함께 산다. 외다리 장난감 병정이 {name}의 옷자락을 잡고 속삭인다. 이 장난감들은 원래 사람이었다고, 아무도 그들을 기억하지 못한다고.',
    doors: [
      { label: '말을 흘려듣고 이 나라를 서둘러 떠난다', hint: '이 나라의 일에 엮이지 않는다', values: { peace: D },
        fx: [{ op: 'log', text: '항구를 떠나며 돌아보니 장난감 병정이 아직 부두에 서 있었다.', weight: 'light' }] },
      { label: '병정을 따라 지하의 장난감들을 만난다', hint: '이 나라의 왕이 숨긴 것을 보게 된다. 쫓기게 된다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'dressrosaSecret' }, { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -15 }] }] },
      { label: '장난감들의 반란에 칼을 보탠다', hint: '칠무해의 나라와 싸운다. 경지가 있어야 살아남는다', values: { justice: D }, danger: true, when: READY(4),
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 30 }, { op: 'flag', id: 'govEnemy' }, { op: 'timeline', text: '드레스로자의 장난감들 편에서 싸웠다' }] },
    ],
  },
  {
    id: 'nw_zou', kind: 'door', when: at(age(18), HERE, sea('nw_first')),
    weight: 4, repeat: 'once', speaker: { relation: '털복숭이 밍크족 전사' },
    title: '걷는 코끼리 위의 나라', body: '천 년을 걷는 거대한 코끼리의 등 위에 밍크족의 나라가 있다. 숲이 부서지고 연기가 오른다. 사황의 부하가 누군가를 찾는다며 나라를 짓밟고 갔다고 한다. 다친 밍크족들이 나무 아래 누워 있다.',
    doors: [
      { label: '숲에 숨어 짓밟는 자들이 지나가길 기다린다', hint: '나서지 않는다. 살아남는다', fx: [{ op: 'hardship', add: 1 }] },
      { label: '다친 밍크족들의 상처를 싸맨다', hint: '며칠을 숲에서 보낸다. 털복숭이 전사들이 {name}을(를) 친구라 부른다', values: { devotion: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'ally', relation: '털복숭이 밍크족 전사' }] },
      { label: '짓밟은 자들을 뒤쫓아 앙갚음한다', hint: '사황의 부하다. 경지가 있어야 맞선다', values: { loyalty: D }, danger: true, when: READY(4),
        fx: [{ op: 'hp', add: -25 }, { op: 'fame', add: 20 }] },
    ],
  },
  {
    id: 'nw_wano_smile', kind: 'door', when: at(age(18), HERE, sea('nw_late'), { c: 'island', is: ['와노쿠니'] }),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '웃음밖에 남지 않은 마을', body: '와노쿠니의 가난한 마을 사람들이 굶주린 얼굴로 웃고 있다. 가짜 열매를 먹고 웃음 말고는 모든 표정을 잃었다고 한다. 성 아랫마을에서는 쇼군의 잔치가 한창이다.',
    doors: [
      { label: '몰래 쌀을 날라 마을에 나눈다', hint: '쇼군의 순찰에 걸리면 끝이다', values: { devotion: D }, danger: true,
        fx: [{ op: 'money', add: -15000 }, { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -15 }] }, { op: 'person', kind: 'ally', relation: '웃음밖에 남지 않은 마을의 노인', age: { older: 30 } }] },
      { label: '성 아랫마을의 잔치에 끼어 쇼군의 눈에 든다', hint: '배부르게 먹는다. 무엇을 등지고 있는지 안다', values: { ambition: D },
        fx: [{ op: 'money', add: 20000 }, { op: 'hardship', add: 2 }] },
      { label: '산속의 옛 사무라이들을 찾아간다', hint: '스무 해를 기다린 반란의 이야기를 듣는다. 엮이면 빠져나올 수 없다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'wanoRebel' }, { op: 'mastery', branch: 'sword', add: 8 }] },
    ],
  },
  {
    id: 'nw_egghead', kind: 'door', when: at(age(18), HERE, sea('nw_late'), { c: 'island', is: ['에그헤드'] }),
    weight: 5, repeat: 'once', speaker: { relation: '천재 박사의 조수' },
    title: '미래의 섬', body: '에그헤드는 오백 년 뒤의 기술이 굴러다니는 섬이다. 천재 박사의 조수가 일손을 구한다며 다가온다. 그런데 섬 둘레의 바다에 해군의 군함들이 하나둘 모이고 있다.',
    doors: [
      { label: '조수를 도와 박사의 연구실 일을 한다', hint: '세상이 모르는 것을 본다. 정부가 이 섬을 노린다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 2 }, { op: 'flag', id: 'eggheadLab' }, { op: 'chance', p: 0.3, then: [{ op: 'flag', id: 'govEnemy' }] }] },
      { label: '군함이 둘러싸기 전에 섬을 빠져나간다', hint: '미래는 보지 못한다. 포위망 밖으로 나간다', values: { peace: D },
        fx: [{ op: 'log', text: '빠져나온 다음 날, 섬 쪽 하늘에 빛줄기가 내리꽂혔다.', weight: 'light' }] },
      { label: '연구실의 물건을 빼내 비싸게 판다', hint: '큰돈이 된다. 박사의 경비 기계가 쫓아온다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 80000 }], else: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'light' }] }] },
    ],
  },
  {
    id: 'nw_yonko_offer', kind: 'door', when: at(age(19), st('pirate', 'warlord'), sea('nw_first', 'nw_late'), { c: 'fame', min: 30 }),
    weight: 4, repeat: 'once', speaker: { relation: '사황 해적단의 간부' },
    title: '깃발을 내리라는 말', body: '사황 해적단의 간부가 {name}의 배에 올랐다. 이 바다에서 깃발을 지키는 해적은 오래 못 간다고, 사황의 산하에 들어오면 이름도 배도 지켜 주겠다고 한다.',
    doors: [
      { label: '깃발을 바꿔 달고 산하로 들어간다', hint: '뒷배가 생긴다. 명령이 생긴다', values: { ambition: D },
        fx: [{ op: 'flag', id: 'underling' }, { op: 'money', add: 50000 }, { op: 'timeline', text: '사황의 산하로 들어갔다' }] },
      { label: '정중히 돌려보낸다', hint: '제 깃발을 지킨다. 그 해적단이 언젠가 다시 온다', values: { freedom: D }, closes: true,
        fx: [{ op: 'flag', id: 'yonkoGrudge' }] },
      { label: '간부에게 칼을 겨눈다', hint: '사황의 이름에 도전한다. 경지가 있어야 한다', values: { dominion: D }, danger: true, when: READY(5),
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 60 }, { op: 'flag', id: 'yonkoGrudge' }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'heavy' }] }] },
    ],
  },
  {
    id: 'nw_weather', kind: 'door', when: at(age(18), st(...SEAFARING), sea('nw_first', 'nw_late')),
    weight: 4, repeat: { years: 6 }, speaker: 'hero',
    title: '신세계의 날씨', body: '맑던 하늘에서 번개가 떨어지고, 바다 한가운데서 불기둥이 솟는다. 신세계의 날씨는 한 시간 앞을 모른다. 항해사가 얼굴이 하얘져서 어느 쪽으로 가야 할지 모르겠다고 한다.',
    doors: [
      { label: '가까운 섬의 만에 배를 숨기고 기다린다', hint: '며칠을 잃는다. 배는 무사하다', values: { peace: D },
        fx: [{ op: 'hp', add: 5 }] },
      { label: '폭풍의 한가운데를 뚫고 나간다', hint: '돛이 찢어질 수 있다. 빠져나가면 남보다 앞선다', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'fame', add: 5 }], else: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'light' }] }] },
      { label: '구름과 바람의 냄새를 읽어 길을 찾는다', hint: '틀리면 번개를 맞는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'mastery', branch: 'observation', add: 6 }] },
    ],
  },
  {
    id: 'nw_g5', kind: 'door', when: at(age(18), st('pirate', 'revolution'), sea('nw_first')),
    weight: 4, repeat: 'once', speaker: { relation: '거친 해군 지부의 병사' },
    title: '거친 지부의 검문', body: '신세계의 해군 지부 가운데 가장 거칠다는 곳의 군함이 배를 세웠다. 병사들은 제복을 풀어 헤치고 담배를 문 채 히죽거린다. 규정 따위는 없다는 얼굴들이다.',
    doors: [
      { label: '밤안개 속으로 달아난다', hint: '대포알이 뒤를 따라온다', values: { freedom: D },
        fx: [{ op: 'hp', add: -10 }] },
      { label: '병사들에게 술과 돈을 쥐여 준다', hint: '눈감아 줄지도 모른다. 더 달라고 할지도 모른다', values: { ambition: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'chance', p: 0.3, then: [{ op: 'money', add: -20000 }] }] },
      { label: '갑판에서 병사들과 맞붙는다', hint: '거친 만큼 강하다. 경지가 있어야 버틴다', values: { dominion: D }, danger: true, when: READY(4),
        fx: [{ op: 'hp', add: -25 }, { op: 'fame', add: 20 }] },
    ],
  },
  {
    id: 'nw_last_island', kind: 'door', when: at(age(19), st(...SEAFARING), sea('nw_late')),
    weight: 3, repeat: 'once', speaker: { relation: '늙은 고고학자' },
    title: '마지막 섬의 소문', body: '{island}의 낡은 술집에서 늙은 고고학자가 붉은 돌의 탁본을 펼친다. 네 개의 돌을 모으면 마지막 섬으로 가는 길이 보인다고. 이미 몇몇 해적단이 그 돌을 쫓고 있다.',
    doors: [
      { label: '탁본의 수수께끼를 함께 푼다', hint: '몇 해를 매달릴지 모른다. 세계가 감춘 것에 다가간다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'readForbidden' }, { op: 'chance', p: 0.3, then: [{ op: 'flag', id: 'govEnemy' }] }] },
      { label: '돌을 쫓는 해적단에 탁본을 판다', hint: '큰돈이 된다. 마지막 섬은 남의 꿈이 된다', values: { ambition: D },
        fx: [{ op: 'money', add: 60000 }] },
      { label: '그 끝을 보러 뱃머리를 돌린다', hint: '돌아오지 못할 바다로 간다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'move', island: '라프텔 근해', sea: 'nw_late' }, { op: 'timeline', text: '마지막 섬의 소문을 쫓아 바다 끝으로 갔다' }] },
    ],
  },
];
