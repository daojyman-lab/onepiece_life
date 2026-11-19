// 현상금 사냥꾼의 길 (과제 7): 사냥꾼의 처지에서 오는 전환점. 들어서는 길은 paths.ts의 path_bounty와
// pirate.ts의 pirate_turn_hunter(해적에서), 감옥의 prison_release(끄나풀)다.
// 첫 사냥, 잡은 자를 넘길지 놓아줄지, 동업자, 사냥감이 아는 사람일 때, 해적이나 해군으로 넘어가는 길.
// 다른 처지로 건너가게 하는 전환점에는 처지가 된 지 두 해 이상(standingYears)을 건다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { chose, known, age, at, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const HUNTER_ONLY = st('bountyHunter');
const settledIn = (n: number): Cond => ({ c: 'standingYears', min: n });
const noFlag = (id: string): Cond => ({ c: 'flag', id, has: false });
const fame = (min: number): Cond => ({ c: 'fame', min });

export const HUNTER: Turning[] = [
  // ---------------------------------------------------------------- 첫 사냥
  {
    id: 'hunter_first_hunt', kind: 'door', when: at(age(16), HUNTER_ONLY),
    weight: 8, repeat: 'once', speaker: 'hero',
    title: '첫 사냥감', body: '처음으로 손에 쥔 수배서. 현상금이 몇 푼 안 되는 좀도둑 해적이 {island} 변두리 창고에 숨어 지낸다고 한다. 혼자가 아니라 졸개 둘이 붙어 있다.',
    doors: [
      { label: '대낮에 정면으로 찾아가 붙잡는다', hint: '셋을 한꺼번에 상대한다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7,
               then: [{ op: 'hp', add: -15 }, { op: 'money', add: 25000 }, { op: 'fame', add: 3 }, { op: 'log', text: '셋을 모두 묶어 지부 앞에 앉혔다. 첫 현상금이 손에 쥐어졌다.', weight: 'heavy' }],
               else: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -25 }, { op: 'log', text: '졸개의 칼에 옆구리를 베였다. 해적은 창고 뒷문으로 달아났다.', weight: 'heavy' }] }] },
      { label: '창고 둘레에 덫을 놓고 기다린다', hint: '다칠 일은 적지만 사흘 밤을 지새우고도 놓칠 수 있다', values: { inquiry: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.45,
               then: [{ op: 'money', add: 25000 }, { op: 'log', text: '사흘째 새벽, 덫에 걸린 해적이 비명을 질렀다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '해적은 덫 하나를 알아보고 다른 길로 섬을 빠져나갔다.', weight: 'heavy' }] }] },
      { label: '졸개 하나를 매수해 두목을 끌어낸다', hint: '현상금의 절반이 졸개에게 간다', values: { ambition: D },
        fx: [{ op: 'money', add: 12000 }, { op: 'flag', id: 'boughtInformer' }, { op: 'log', text: '매수한 졸개가 두목을 빈 창고로 데려왔다. 두목을 넘긴 뒤 받은 현상금에서 약속한 몫을 떼어 주자 졸개는 뒤도 보지 않고 떠났다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 넘길지 놓아줄지
  {
    id: 'hunter_release', kind: 'door', when: at(age(16), HUNTER_ONLY),
    weight: 6, repeat: { years: 5 }, speaker: { relation: '붙잡힌 해적' },
    title: '밧줄에 묶인 사내', body: '지부로 끌고 가는 길, 밧줄에 묶인 해적이 무릎을 꿇는다. 앓아누운 어머니의 약값 때문에 상선을 털었다고, 한 번만 눈감아 달라고 운다.',
    doors: [
      { label: '그대로 지부에 넘긴다', hint: '현상금을 받는다. 우는 소리는 오래 남는다', values: { ambition: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'hardship', add: 1 }, { op: 'log', text: '지부원이 묶인 사내를 안으로 끌고 가고 현상금을 건넸다. 며칠 뒤에도 약값을 구해야 한다던 그의 울음이 떠올랐다.', weight: 'light' }] },
      { label: '밧줄을 풀어 준다', hint: '빈손으로 돌아가고, 거짓말이었을지도 모른다', values: { loyalty: D },
        fx: [{ op: 'chance', p: 0.6,
               then: [{ op: 'flag', id: 'mercy' }, { op: 'log', text: '사내는 몇 번이고 고개를 숙이고 산길로 사라졌다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -15 }, { op: 'log', text: '밧줄이 풀리자마자 사내가 칼을 뽑았다. 어머니 이야기는 거짓이었다.', weight: 'heavy' }] }] },
      { label: '사내의 말이 참인지 마을까지 따라가 확인한다', hint: '사흘이 걸리고, 다른 사냥감을 놓친다', values: { justice: D },
        fx: [{ op: 'money', add: -5000 }, { op: 'chance', p: 0.5,
               then: [{ op: 'log', text: '어머니는 정말 앓고 있었다. 사내를 풀어 주고 약값을 보탰다.', weight: 'heavy' }],
               else: [{ op: 'money', add: 40000 }, { op: 'log', text: '마을에 어머니는 없었다. 사내를 그대로 지부에 넘겼다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'hunter_wrong_man', kind: 'door', when: at(age(17), HUNTER_ONLY),
    weight: 4, repeat: 'once', speaker: { relation: '잘못 붙잡힌 어부' },
    title: '닮은 얼굴', body: '현상금이 꽤 큰 해적을 잡았다고 생각했다. 지부로 가는 길에 사내의 손바닥을 보니 그물 자국투성이다. 수배서와 꼭 닮았을 뿐인 어부일지도 모른다.',
    doors: [
      { label: '풀어 주고 다친 값을 치른다', hint: '헛걸음에 돈까지 쓴다', values: { justice: D },
        fx: [{ op: 'money', add: -8000, trade: true }, { op: 'person', kind: 'ally', relation: '닮은 얼굴의 어부' }, { op: 'log', text: '밧줄을 풀고 다친 값을 내밀자 어부는 그물 자국이 남은 손으로 받았다. 나중에 그가 다시 부두에 나왔을 때 먼저 {name}을(를) 불렀다.', weight: 'light' }] },
      { label: '그대로 넘긴다', hint: '지부가 가려낼 일이다. 현상금은 크다', values: { greed: D }, 
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'money', add: 90000 }, { op: 'hardship', add: 3 }, { op: 'log', text: '지부는 서류만 보고 돈을 내주었다. 어부의 얼굴을 다시 보지 못했다.', weight: 'heavy' }],
               else: [{ op: 'fame', add: -5 }, { op: 'log', text: '지부가 어부임을 알아보았다. 사냥꾼들 사이에 웃음거리가 되었다.', weight: 'heavy' }] }] },
      { label: '어부를 미끼로 진짜 해적을 끌어낸다', hint: '어부를 위험에 세운다', values: { dominion: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6,
               then: [{ op: 'money', add: 60000 }, { op: 'fame', add: 5 }, { op: 'log', text: '제 얼굴을 쓴 자를 찾아 진짜 해적이 나타났다. 덫이 닫혔다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 2 }, { op: 'log', text: '진짜 해적은 어부를 베고 달아났다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'hunter_bribe', kind: 'door', when: at(age(17), HUNTER_ONLY),
    weight: 5, repeat: { years: 6 }, speaker: { relation: '붙잡힌 해적 선장' },
    title: '두 배의 값', body: '붙잡힌 해적 선장이 묶인 채로 웃는다. 배에 숨겨 둔 금화가 있다고, 놓아주면 현상금의 두 배를 주겠다고.',
    doors: [
      { label: '금화를 받고 놓아준다', hint: '사냥꾼의 이름에 금이 간다', values: { greed: D }, 
        fx: [{ op: 'money', add: 105000 }, { op: 'flag', id: 'tookBribe' }, { op: 'log', text: '배의 숨은 금화를 확인하고 선장의 밧줄을 풀었다. 빈손으로 지부에 돌아온 까닭을 묻는 이들이 늘자 동료 사냥꾼들이 거리를 두었다.', weight: 'light' }] },
      { label: '거절하고 지부에 넘긴다', hint: '받을 수 있던 돈의 절반만 받는다', values: { justice: D },
        fx: [{ op: 'money', add: 35000 }, { op: 'fame', add: 3 }, { op: 'log', text: '금화가 있다는 말을 듣고도 선장을 지부에 넘겼다. 지부원은 정해진 현상금만 세어 주고 약속을 지킨 사냥꾼이라며 이름을 기록했다.', weight: 'light' }] },
      { label: '금화도 받고 선장도 넘긴다', hint: '해적들이 그 이름을 원한과 함께 기억한다', values: { greed: D }, 
        fx: [{ op: 'money', add: 150000 }, { op: 'flag', id: 'doubleCross' },
             { op: 'log', text: '숨긴 금화를 찾아낸 뒤에도 선장의 밧줄을 풀지 않았다. 지부에서 현상금을 받는 모습을 선원의 눈이 끝까지 쫓았다.', weight: 'heavy' },
             { op: 'chance', p: 0.4, then: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'heavy' },
               { op: 'log', text: '선장의 부하들이 밤길에 {name}을(를) 덮쳤다. 상처를 입고 겨우 포위망에서 빠져나왔다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '복수를 벼르던 부하들은 지부 앞에서 발길을 돌렸다. 그날 밤은 무사했지만 소문은 멀리 퍼졌다.', weight: 'light' }] }] },
    ],
  },

  // ---------------------------------------------------------------- 동업자
  {
    id: 'hunter_partner', kind: 'door', when: at(age(17), HUNTER_ONLY),
    weight: 5, repeat: 'once', speaker: { relation: '외눈의 사냥꾼' },
    title: '반씩 나누자', body: '{island}에서 수배서를 살피던 외눈의 사냥꾼이 맞은편에 앉는다. 혼자서는 큰 사냥감을 못 잡는다며, 앞으로 모든 현상금을 반씩 나누자고 한다.',
    doors: [
      { label: '준비비를 나누고 동업자가 된다', hint: '등을 맡길 사람과 나눠 가질 사람이 함께 생긴다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'crew', relation: '외눈의 동업자' }, { op: 'money', add: -5000 }, { op: 'log', text: '두 사람은 준비비를 나누고 첫 사냥감의 수배서를 함께 펼쳤다. 외눈의 사냥꾼은 내일 새벽 다시 만나자고 했다.', weight: 'light' }] },
      { label: '혼자 사냥하겠다며 자리를 뜬다', hint: '현상금도 위험도 혼자 짊어진다', values: { freedom: D }, fx: [{ op: 'log', text: '외눈의 사냥꾼은 더는 붙잡지 않았다. {name}은(는) 혼자 수배서를 접어 주머니에 넣고 걸어 나왔다.', weight: 'light' }], closes: true },
      { label: '동업하는 척하고 미끼로 쓴다', hint: '큰 사냥감을 잡고 사람 하나를 잃는다', values: { dominion: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'fame', add: 5 }, { op: 'hardship', add: 2 }, { op: 'flag', id: 'usedPartner' },
             { op: 'log', text: '외눈의 사냥꾼이 사냥감의 칼을 받아 내는 사이 뒤에서 덮쳤다. 그는 다시 {name}을(를) 찾아오지 않았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'hunter_partner_split', kind: 'door', when: at(age(18), HUNTER_ONLY, chose('hunter_partner', 0, 2), known('외눈의 동업자', 'crew'), { c: 'person', relation: '배신한 옛 동료', has: false }), needs: ['crew'],
    weight: 4, repeat: 'once', speaker: { relation: '외눈의 동업자' },
    title: '사라진 몫', body: '함께 잡은 거물의 현상금을 반씩 나누자던 {person:외눈의 동업자}이(가) 혼자 받아 갔다는 소문이 들린다. 그 동료는 아무 일 없다는 얼굴로 다음 수배서를 내민다.',
    doors: [
      { label: '아무것도 묻지 않고 다음 사냥에 나선다', hint: '믿음을 지키거나 또 속는다', values: { loyalty: D },
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'money', add: 40000 }, { op: 'log', text: '동료가 말없이 돈주머니를 건넸다. 앓는 가족에게 먼저 보냈다고 했다.', weight: 'heavy' }],
               else: [{ op: 'personChange', relation: '외눈의 동업자', kind: 'rival', rename: '배신한 옛 동료' }, { op: 'flag', id: 'betrayed' }, { op: 'money', add: -20000 },
                      { op: 'log', text: '다음 날 아침, 동료는 둘의 돈 상자와 함께 사라졌다.', weight: 'heavy' }] }] },
      { label: '대놓고 따지고 몫을 받아 낸다', hint: '돈은 돌아와도 사이는 끝난다', values: { justice: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'personChange', relation: '외눈의 동업자', kind: 'rival', bond: -20 }, { op: 'log', text: '동료는 숨겨 둔 돈주머니를 내놓았다. 각자의 몫을 센 뒤에도 다음 수배서를 함께 펼칠 사람은 남지 않았다.', weight: 'light' }] },
      { label: '먼저 동료의 몫까지 챙겨 떠난다', hint: '속기 전에 속인다', values: { greed: D },
        fx: [{ op: 'money', add: 105000 }, { op: 'personChange', relation: '외눈의 동업자', kind: 'rival', bond: -20 }, { op: 'flag', id: 'hunterGrudge' }, { op: 'log', text: '동료가 돌아오기 전에 돈 상자를 들고 떠났다. 뒤늦게 비어 있는 자리를 본 동료가 {name}의 행선지를 묻고 다녔다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 사냥감이 아는 사람일 때
  {
    id: 'hunter_known_face', kind: 'door', when: at(age(18), HUNTER_ONLY, settledIn(2), chose('kid_promise', 1, 4), known('어릴 적 동무', 'ally')),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '수배서 속의 동무', body: '새로 붙은 수배서의 얼굴이 낯익다. 부두에서 작은 배를 함께 띄우고, 먼 섬으로 떠나는 날 손을 흔들어 보냈던 {friend}이다. 제법 큰 현상금이 붙었고, 지금 {island} 근처에 숨어 있다고 한다.',
    doors: [
      { label: '찾아가 붙잡아 넘긴다', hint: '현상금은 크고, 동무의 마지막 눈빛이 오래 따라다닌다', values: { justice: D },
        fx: [{ op: 'personChange', relation: '어릴 적 동무', kind: 'rival', bond: -20 }, { op: 'money', add: 50000 }, { op: 'fame', add: 5 }, { op: 'hardship', add: 4 },
             { op: 'log', text: '동무는 끝까지 {name}의 눈을 보았다. 지부의 문이 닫혔다.', weight: 'heavy' }] },
      { label: '먼저 찾아가 달아나라고 귀띔한다', hint: '사냥꾼 조합에 알려지면 일이 끊긴다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'warnedPirate' }, { op: 'chance', p: 0.3, then: [{ op: 'fame', add: -10 }, { op: 'money', add: -10000 }, { op: 'log', text: '동무를 달아나게 한 일이 조합에 알려졌다. 맡던 사냥이 끊기고 벌금까지 냈다.', weight: 'light' }], else: [{ op: 'log', text: '동무에게 숨은 길을 일러 주었다. 조합에는 아무도 그 만남을 알리지 않았다.', weight: 'light' }] }] },
      { label: '동무의 배에 올라 함께 바다로 나간다', hint: '사냥하던 쪽에서 쫓기는 쪽이 된다', values: { romance: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'personChange', relation: '어릴 적 동무', kind: 'crew', bond: 12 },
             { op: 'timeline', text: '수배된 동무를 따라 해적이 되었다' }, { op: 'log', text: '동무가 갑판에서 자리를 비켜 주었다. 새 배가 출항하자 뒤에 남은 지부의 깃발이 점점 작아졌다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'hunter_old_poster', kind: 'door', when: at(age(20), HUNTER_ONLY),
    weight: 3, repeat: 'once', speaker: { relation: '늙은 지부 서기' },
    title: '빛바랜 수배서', body: '지부의 늙은 서기가 서랍 깊은 곳에서 스무 해 묵은 수배서를 꺼낸다. 아무도 잡지 못한 채 잊힌 이름이다. 아직 살아 있다는 소문이 있다고 한다.',
    doors: [
      { label: '스무 해의 흔적을 끝까지 쫓는다', hint: '몇 해를 들이고 빈손일 수도 있다', values: { inquiry: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.4,
               then: [{ op: 'fame', add: 20 }, { op: 'money', add: 80000 }, { op: 'log', text: '외딴 섬의 등대에서 늙은 그를 찾아냈다. 그는 순순히 손을 내밀었다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '흔적은 바다 한가운데서 끊겼다. 서기는 그럴 줄 알았다며 웃었다.', weight: 'heavy' }] }] },
      { label: '그 이름에 얽힌 이야기를 모아 팔아넘긴다', hint: '신문사가 값을 쳐준다', values: { greed: D }, fx: [{ op: 'money', add: 30000 }, { op: 'log', text: '서기와 옛 선원들에게 들은 이야기를 신문사에 넘겼다. 다음 호에는 빛바랜 수배서의 얼굴이 다시 실렸고 원고료가 도착했다.', weight: 'light' }] },
      { label: '전설은 전설로 남겨 둔다', hint: '서랍이 다시 닫힌다', values: { romance: D }, fx: [{ op: 'flag', id: 'leftLegend' }, { op: 'log', text: '서기는 빛바랜 수배서를 원래 서랍에 넣었다. {name}은(는) 잊힌 이름을 한 번 더 읽고 지부를 떠났다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 큰 사냥 · 이름
  {
    id: 'hunter_big_game', kind: 'door', when: at(age(18), HUNTER_ONLY, fame(5)),
    weight: 5, repeat: { years: 5 }, speaker: 'hero',
    title: '거물의 수배서', body: '이 바다에서 가장 큰 현상금이다. 상선 서른 척을 가라앉힌 해적 선장이 {island} 근해에 닻을 내렸다. 사냥꾼들은 수배서만 만지작거릴 뿐 아무도 일어서지 않는다.',
    doors: [
      { label: '혼자 그 배에 오른다', hint: '살아 돌아오면 이름이 바다에 퍼진다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.4,
               then: [{ op: 'hp', add: -30 }, { op: 'fame', add: 40 }, { op: 'money', add: 120000 },
                      { op: 'log', text: '선장을 갑판에 눕혔다. 사냥꾼들 사이에 그날 밤 {name}의 이름이 퍼졌다.', weight: 'heavy' }, { op: 'timeline', text: '거물 해적을 홀로 잡았다' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -40 }, { op: 'chance', p: 0.3,
                 then: [{ op: 'loseLimb', limb: 'random' }, { op: 'log', text: '포위망을 뚫고 갑판 밖으로 몸을 던졌다. 뭍에 기어오른 뒤에야 찢어진 옷으로 상처를 눌렀다.', weight: 'heavy' }],
                 else: [{ op: 'log', text: '칼과 총에 크게 다쳤지만 몸을 끌고 배 밖으로 빠져나왔다. 다른 사냥꾼을 찾아갈 힘도 남지 않았다.', weight: 'heavy' }] }] }] },
      { label: '다른 사냥꾼들을 모아 함께 친다', hint: '몫은 열로 나뉜다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'money', add: 25000 }, { op: 'fame', add: 10 }, { op: 'person', kind: 'ally', relation: '함께 싸운 사냥꾼' }, { op: 'log', text: '열 명이 갑판에 올라 선장을 붙잡았다. 지부에서 현상금을 나눌 때 함께 싸운 사냥꾼 하나가 다음 사냥도 함께하자며 손을 내밀었다.', weight: 'heavy' }] },
      { label: '목숨이 아까워 수배서를 내려놓는다', hint: '사냥에 나서지 않는 쪽에 낀다', fx: [{ op: 'fame', add: -3 }, { op: 'log', text: '수배서를 접어 내려놓자 기다리던 사냥꾼들도 흩어졌다. 누군가는 {name}이(가) 큰 사냥을 피했다고 떠들었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'hunter_nickname', kind: 'door', when: at(age(19), HUNTER_ONLY, fame(30)),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '거꾸로 걸린 값', body: '바다의 해적들이 {name}을(를) 별명으로 부르기 시작했다. 해적들끼리 돈을 모아 그 목에 거꾸로 값을 걸었다는 소문도 들린다.',
    doors: [
      { label: '별명을 내걸고 더 큰 사냥감을 찾는다', hint: '쫓는 만큼 쫓긴다', values: { ambition: D },
        fx: [{ op: 'fame', add: 20 }, { op: 'flag', id: 'pirateHunterName' }, { op: 'hp', add: -10 }, { op: 'log', text: '별명을 내건 첫 사냥 뒤 부두에 이름이 퍼졌다. 돌아오는 길에는 현상금을 노린 해적에게 뒤를 잡혀 피를 흘렸다.', weight: 'light' }] },
      { label: '이름을 지우고 작은 사냥으로 조용히 산다', hint: '큰돈은 다시 만지지 못한다', values: { peace: D },
        fx: [{ op: 'fame', add: -15 }, { op: 'flag', id: 'quietHunter' }, { op: 'log', text: '별명을 떼고 작은 수배서만 골랐다. 부두 사람들은 더는 {name}을(를) 알아보지 못했고 해적들이 모은 목값 소문도 잦아들었다.', weight: 'light' }] },
      { label: '목을 노리는 해적들을 한곳에 꾀어 쓸어버린다', hint: '한 번에 끝내거나 한 번에 끝난다', values: { dominion: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'fame', add: 50 }, { op: 'money', add: 100000 }, { op: 'hp', add: -25 },
                      { op: 'log', text: '가짜 보물 소문에 몰려든 해적들을 섬 하나에 가두었다. 그 바다의 수배서가 절반으로 줄었다.', weight: 'heavy' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -40 }, { op: 'loseLimb', limb: 'random' }, { op: 'log', text: '미끼를 알아챈 해적들이 오히려 {name}을(를) 포위했다. 큰 상처를 입고 가까스로 섬을 빠져나왔다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'hunter_rival', kind: 'door', when: at(age(18), HUNTER_ONLY),
    weight: 4, repeat: 'once', speaker: { relation: '다른 사냥꾼' },
    title: '같은 사냥감', body: '사흘을 쫓은 해적의 은신처 앞에서 다른 사냥꾼과 마주쳤다. 상대도 같은 수배서를 품에 넣고 있다. 둘 다 물러설 생각이 없다.',
    doors: [
      { label: '먼저 뛰어들어 사냥감을 낚아챈다', hint: '현상금을 얻고 원한도 얻는다', values: { ambition: D },
        fx: [{ op: 'money', add: 35000 }, { op: 'person', kind: 'rival', relation: '사냥감을 빼앗긴 사냥꾼' }, { op: 'log', text: '은신처에 먼저 뛰어들어 해적을 묶었다. 뒤따라온 사냥꾼은 지부에서 돈을 받는 {name}을(를) 끝까지 노려보았다.', weight: 'light' }] },
      { label: '함께 잡고 반씩 나눈다', hint: '절반이지만 다치지 않는다', values: { loyalty: D },
        fx: [{ op: 'money', add: 18000 }, { op: 'person', kind: 'ally', relation: '반씩 나눈 사냥꾼' }, { op: 'log', text: '둘이 출구를 나눠 막아 해적을 붙잡았다. 지부 앞에서 현상금을 반씩 세자 상대가 다음 수배서도 함께 보자고 했다.', weight: 'light' }] },
      { label: '경쟁자부터 쓰러뜨린다', hint: '사냥감은 그 틈에 달아날지도 모른다', values: { dominion: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 5 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 35000 }, { op: 'log', text: '경쟁자를 쓰러뜨리고도 사냥감을 놓치지 않았다. 상처를 안고 현상금을 챙겼다.', weight: 'light' }], else: [{ op: 'log', text: '경쟁자를 쓰러뜨린 사이 사냥감이 달아났다. 상처와 두 사람의 원한만 남았다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'hunter_village_guard', kind: 'door', when: at(age(17), HUNTER_ONLY),
    weight: 4, repeat: 'once', speaker: { relation: '어촌의 촌장' },
    title: '헐값의 의뢰', body: '{island}의 가난한 어촌이 사냥꾼을 찾는다. 해적선이 곧 다시 온다고, 모은 돈이 이것뿐이라며 촌장이 동전 주머니를 내민다.',
    doors: [
      { label: '헐값에 의뢰를 받아 마을을 지킨다', hint: '목숨을 걸고 받는 돈이 술값도 안 된다', values: { justice: D }, danger: true,
        fx: [{ op: 'money', add: 3000 }, { op: 'hp', add: -25 }, { op: 'fame', add: 10 }, { op: 'person', kind: 'ally', relation: '어촌의 촌장' },
             { op: 'log', text: '해적선이 마을 앞바다에서 뱃머리를 돌렸다. 촌장이 말린 생선을 한 짐 실어 주었다.', weight: 'heavy' }] },
      { label: '해적의 현상금이 붙어야 움직이겠다고 한다', hint: '마을은 돈을 더 긁어모아야 한다', values: { greed: D }, 
        fx: [{ op: 'money', add: 45000 }, { op: 'hp', add: -15 }, { op: 'hardship', add: 1 }, { op: 'log', text: '촌장은 집집마다 돈을 더 걷어 약속한 값을 맞췄다. 해적을 몰아낸 뒤에도 마을 사람들은 빈 주머니를 들고 돌아갔다.', weight: 'heavy' }] },
      { label: '해적을 쫓은 뒤 마을을 거점으로 삼아 보호세를 걷는다', hint: '해적이 하던 일을 사냥꾼이 한다', values: { greed: D }, 
        fx: [{ op: 'hp', add: -20 }, { op: 'money', add: 75000 }, { op: 'flag', id: 'protectionRacket' }, { op: 'log', text: '해적선을 쫓아낸 뒤 이번에는 {name}이(가) 마을에 돈을 내라고 했다. 촌장은 동전 주머니를 다시 꺼내며 눈을 피했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'hunter_seized_ship', kind: 'door', when: at(age(17), HUNTER_ONLY, noFlag('ship')),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '선장 없는 해적선', body: '선장을 붙잡아 넘기고 나니, 부두에 그 해적선과 겁에 질린 선원 다섯이 남았다. 지부는 배를 넘기면 포상을 얹어 주겠다고 한다.',
    doors: [
      { label: '배를 제 것으로 삼는다', hint: '지부의 포상은 없다. 사냥터가 바다 전체가 된다', values: { ambition: D },
        fx: [{ op: 'flag', id: 'ship' }, { op: 'log', text: '해골 깃발을 내리고 빈 돛대를 올렸다. 사냥꾼의 배가 되었다.', weight: 'heavy' }, { op: 'timeline', text: '사냥한 해적의 배를 얻었다' }] },
      { label: '배와 선원들을 지부에 넘긴다', hint: '포상을 받고 선원들은 감옥에 간다', values: { justice: D },
        fx: [{ op: 'money', add: 45000 }, { op: 'fame', add: 5 }, { op: 'log', text: '지부가 배를 접수하고 선원 다섯을 줄줄이 묶어 데려갔다. 담당자는 포상금을 세어 주며 선장까지 넘긴 사냥꾼의 이름을 적었다.', weight: 'light' }] },
      { label: '선원들에게 배를 돌려주고 떠나라고 한다', hint: '포상도 배도 없다', values: { freedom: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'person', kind: 'crew', relation: '배를 돌려받은 선원' },
               { op: 'log', text: '선원 하나가 남겠다며 {name}의 짐을 들었다.', weight: 'heavy' }], else: [{ op: 'log', text: '선원 다섯은 닻을 올리고 서둘러 떠났다. {name}은(는) 배도 포상금도 받지 않은 채 텅 빈 부두에 남았다.', weight: 'light' }] }] },
    ],
  },

  // ---------------------------------------------------------------- 다른 처지로
  {
    id: 'hunter_marine_offer', kind: 'door', when: at(age(18, 40), HUNTER_ONLY, settledIn(2), fame(15)),
    weight: 4, repeat: 'once', speaker: { relation: '해군 대령' },
    title: '제복의 권유', body: '{name}이(가) 넘긴 해적들의 명단을 훑던 해군 대령이 고개를 든다. 돈 때문에 사냥하기엔 아까운 솜씨라며, 해군에 들어오면 하사 자리부터 주겠다고 한다.',
    doors: [
      { label: '흰 제복을 입는다', hint: '현상금 대신 봉급과 명령을 받는다', values: { justice: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'rank', add: 1 }, { op: 'timeline', text: '현상금 사냥꾼에서 해군이 되었다' }, { op: 'log', text: '대령이 하사 계급장을 달아 주었다. 첫 봉급 명부에 이름을 올리자마자 다음 출동 명령이 내려왔다.', weight: 'heavy' }] },
      { label: '누구의 명령도 받지 않겠다고 한다', hint: '대령은 다시 묻지 않는다', values: { freedom: D }, fx: [{ op: 'log', text: '대령은 추천서를 찢지 않고 서랍에 넣었다. {name}은(는) 제복 없이 지부를 나와 다음 수배서를 찾았다.', weight: 'light' }], closes: true },
      { label: '제복 대신 해군의 끄나풀이 된다', hint: '정보를 넘기고 뒷돈을 받는다', values: { greed: D },
        fx: [{ op: 'money', add: 38000 }, { op: 'flag', id: 'marineInformant' }, { op: 'log', text: '대령에게 해적의 은신처를 적은 쪽지를 건넸다. 며칠 뒤 봉인 없는 돈봉투가 도착했고, 공식 명부에는 {name}의 이름이 없었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'hunter_pirate_invite', kind: 'door', when: at(age(18, 40), HUNTER_ONLY, settledIn(2)),
    weight: 3, repeat: 'once', speaker: { relation: '쫓던 해적 선장' },
    title: '쫓던 배의 초대', body: '석 달을 쫓던 해적 선장이 마침내 {name}을(를) 마주하고는 칼 대신 술병을 내민다. 이만큼 끈질긴 사람은 처음 본다며, 사냥 대신 함께 바다를 누비자고 한다.',
    doors: [
      { label: '해골 깃발 아래로 들어간다', hint: '어제까지의 수배서가 내일은 내 얼굴이 된다', values: { romance: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'person', kind: 'ally', relation: '사냥감이었던 선장' }, { op: 'timeline', text: '쫓던 해적의 배에 올라 해적이 되었다' }, { op: 'log', text: '선장은 술병을 건넨 뒤 갑판으로 이끌었다. 닻이 올라가자 {name}은(는) 석 달 동안 쫓던 배에서 새 항로를 바라보았다.', weight: 'heavy' }] },
      { label: '술병을 받는 척하며 붙잡아 넘긴다', hint: '석 달의 사냥이 끝나고 현상금을 받는다', values: { justice: D },
        fx: [{ op: 'money', add: 60000 }, { op: 'fame', add: 8 }, { op: 'hardship', add: 1 }, { op: 'log', text: '술병을 받으려던 선장의 손을 꺾어 묶었다. 지부에서 현상금을 받자 석 달간의 추격은 끝났지만 선장의 제안은 귀에 남았다.', weight: 'heavy' }] },
      { label: '술병만 받고 이번 한 번은 보내 준다', hint: '다음에 만나면 다시 사냥이다', values: { freedom: D }, fx: [{ op: 'flag', id: 'sparedCaptain' }, { op: 'log', text: '선장은 술병을 놓고 배로 돌아갔다. {name}은(는) 빈 부두에서 술 한 모금을 마신 뒤 다음에 만나면 수배서를 다시 꺼내겠다고 했다.', weight: 'light' }], closes: true },
    ],
  },
  {
    id: 'hunter_lay_down', kind: 'door', when: at(age(25), HUNTER_ONLY, settledIn(2)),
    weight: 3, repeat: 'once', speaker: { relation: '마을의 원로' },
    title: '눌러앉을 자리', body: '{island}의 원로들이 조합에서 {name}의 이름을 듣고 찾아왔다. 마을의 경비대장 자리가 비었다고, 이제 떠돌지 말고 눌러앉으라고 한다.',
    doors: [
      { label: '경비대장이 되어 눌러앉는다', hint: '사냥은 끝나고 그 거리를 제 손으로 다스린다', values: { dominion: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'log', text: '손때 묻은 수배서 뭉치를 태우고 마을 경비대의 문패를 달았다.', weight: 'heavy' }, { op: 'timeline', text: '사냥을 그만두고 마을의 경비대장이 되었다' }] },
      { label: '마지막으로 큰 사냥 한 건만 더 한다', hint: '돌아오면 자리는 남아 있지 않을지도 모른다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 15 }, { op: 'money', add: 40000 }, { op: 'log', text: '상처를 안고 마지막 사냥감을 지부에 넘겼다. 마을로 돌아오니 경비대장 자리는 아직 비어 있었지만 원로들은 그동안의 일을 다시 묻고 있었다.', weight: 'light' }] },
      { label: '자리 대신 마을 젊은이 하나를 제자로 키운다', hint: '사냥은 이어 가고, 가르칠 날만큼 떠돌지 못한다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '어린 사냥꾼 제자', age: { younger: 10 } }, { op: 'money', add: -10000 }, { op: 'log', text: '원로가 데려온 젊은이를 곁에 세우고 장비를 마련해 주었다. {name}은(는) 다음 사냥을 떠나기 전 며칠씩 발자국 읽는 법을 가르쳤다.', weight: 'light' }] },
    ],
  },
];
