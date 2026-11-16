// 사람과 몸과 돈 (설계 5.2의 중대한 선택): 스승, 동료, 배신, 결혼과 자식, 누구를 구할지, 쓰러진 적, 빚, 전 재산,
// 열매, 의수 · 의족, 그리고 바다마다 이름 있는 상대와의 마주침. 로그타운에서 태어난 사람에게 열린다.
// 돈으로 들이는 스승은 paid: true, cap 4를 넘지 않는다. 그 위는 기연(fortunes.ts)의 몫이다.
// 이름 있는 상대는 제 바다(sea 조건)에서, 원작의 때(주인공의 나이)에 맞춰 만난다. 강한 바다일수록
// 경지가 모자란 사람에게는 맞서는 문이 잠기고 숨기 · 달아나기 · 흥정 같은 문만 열린다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { ACTIVE, GROWN, HUNTED, LAWFUL, SEAFARING, age, at, sea, st } from './paths';
import type { Cond, Door, Turning, Values } from '../../core/types';

const D = V.value.door;
const PAID_CAP = V.growth.paidCap;
const DOJO_FEE = 250000;
const HAKI_FEE = 300000;
const PROSTHETIC_COST = 40000;
const ALL_IN_MIN = 50000;

/** 경지가 이만큼은 되어야 그 바다의 이름 있는 상대에게 맞서는 문이 열린다 */
const READY = (min: number): Cond[] => [{ c: 'tier', branch: 'any', min }];
/** 목숨을 건 싸움으로 맞선다 */
const fightDoor = (label: string, hint: string, values: Partial<Values>, foe: string, when?: Cond[]): Door =>
  ({ label, hint, values, danger: true, when, fx: [{ op: 'fight', foe, lethal: true, forced: false }] });
/** 목숨은 걸지 않고 겨룬다 */
const duelDoor = (label: string, hint: string, values: Partial<Values>, foe: string, when?: Cond[]): Door =>
  ({ label, hint, values, when, fx: [{ op: 'fight', foe, lethal: false, forced: false }] });

/** 해군은 떠돌이를 동료로 받지 않는다: 분대원은 분대장이 된 뒤 신병으로 받는다 (marine.ts의 mn_squad_pick) */
const NOT_SQUAD: Cond = { c: 'standing', is: ['child', 'civil', 'pirate', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'prisoner', 'retired'] };

export const PEOPLE: Turning[] = [
  // ---------------------------------------------------------------- 스승
  {
    id: 'pp_dojo', kind: 'door', when: at(age(12, 40), st('child', 'civil', 'pirate', 'marine', 'bountyHunter', 'shipwright', 'settled', 'revolution')),
    weight: 8, repeat: { years: 6 }, speaker: { relation: '도장의 사범' },
    title: '도장의 문', body: '{island}에 이름난 사범들이 모인 도장이 있다. 수업료만 낸다면 누구든 받아 준다고 한다.',
    doors: [
      { label: '검술 사범에게 수업료를 낸다', hint: '칼 쓰는 법을 처음부터 제대로 배운다', when: [{ c: 'money', min: DOJO_FEE }], values: { ambition: D },
        fx: [{ op: 'money', add: -DOJO_FEE }, { op: 'master', name: '도장의 검술 사범', branch: 'sword', cap: PAID_CAP, years: 8, paid: true }] },
      { label: '총포 교관에게 수업료를 낸다', hint: '먼 곳을 맞히는 눈을 기른다', when: [{ c: 'money', min: DOJO_FEE }], values: { inquiry: D },
        fx: [{ op: 'money', add: -DOJO_FEE }, { op: 'master', name: '도장의 총포 교관', branch: 'gun', cap: PAID_CAP, years: 8, paid: true }] },
      { label: '담 너머로 수련을 훔쳐본다', hint: '돈 없이 눈으로만 배운다', values: { inquiry: D }, fx: [{ op: 'mastery', branch: 'fist', add: 8 }] },
    ],
  },
  {
    // 도장의 문이 셋을 넘지 않도록 권법 사범은 따로 온다
    id: 'pp_fist_dojo', kind: 'door', when: at(age(12, 40), st('child', 'civil', 'pirate', 'marine', 'bountyHunter', 'shipwright', 'settled', 'revolution')),
    weight: 4, repeat: { years: 6 }, speaker: { relation: '권법 사범' },
    title: '권법 도장', body: '{island} 부둣가의 권법 도장에서는 맨주먹으로 뱃사람들을 바닥에 눕힌다. 수업료를 내면 누구든 받지만, 첫날은 사범에게 얻어맞는 것으로 시작한다고 한다.',
    doors: [
      { label: '권법 사범에게 수업료를 낸다', hint: '맨몸으로 버티고 때리는 법을 배운다', when: [{ c: 'money', min: DOJO_FEE }], values: { dominion: D },
        fx: [{ op: 'money', add: -DOJO_FEE }, { op: 'master', name: '도장의 권법 사범', branch: 'fist', cap: PAID_CAP, years: 8, paid: true }] },
      { label: '문 앞의 문하생을 때려눕히고 들어간다', hint: '사범의 눈에 들거나, 쫓겨난다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'mastery', branch: 'fist', add: 8 },
             { op: 'log', text: '문하생 둘을 눕히고 도장 안으로 들어섰다. 사범은 웃지도 않고 다음 상대를 불렀다.', weight: 'light' }] },
      { label: '발길을 돌린다', hint: '얻어맞으며 배울 생각은 없다', fx: [] },
    ],
  },
  {
    id: 'pp_wander_master', kind: 'door', when: at(age(14, 45), st('child', ...ACTIVE)),
    weight: 3, repeat: 'once', speaker: { relation: '떠돌이 무인' },
    title: '밥값 대신', body: '{island} 주막에서 밥값 대신 장작을 패던 떠돌이 무인이 {name}의 손바닥 굳은살을 본다. 밥만 사 주면 몇 해 가르쳐 주겠다고 한다.',
    doors: [
      { label: '스승으로 모신다', hint: '돈은 들지 않지만 끝까지 가르칠 사람은 아니다', values: { inquiry: D }, 
        fx: [{ op: 'master', name: '떠돌이 무인', branch: 'fist', cap: V.growth.noMasterCap, years: 3, paid: false }] },
      { label: '혼자 하겠다고 한다', hint: '누구의 제자도 되지 않는다', values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'pp_haki_master', kind: 'door', when: at(st(...SEAFARING), sea('gl_first', 'sabaody', 'nw_first', 'nw_late')),
    weight: 3, repeat: { years: 8 }, speaker: { relation: '은퇴한 부선장' },
    title: '보이지 않는 힘', body: '{island}의 바에서 은발의 노인이 술잔을 굴린다. 이 너머의 바다에서 살아남으려면 보이지 않는 힘을 알아야 한다며, 수업료를 부른다.',
    doors: [
      { label: '수업료를 내고 몸에 두르는 기운을 배운다', hint: '보이지 않는 갑옷을 입는 법', when: [{ c: 'money', min: HAKI_FEE }], values: { ambition: D },
        fx: [{ op: 'money', add: -HAKI_FEE }, { op: 'master', name: '은퇴한 부선장', branch: 'armament', cap: PAID_CAP, years: 4, paid: true }] },
      { label: '수업료를 내고 기척을 읽는 법을 배운다', hint: '보이지 않는 것을 보는 법', when: [{ c: 'money', min: HAKI_FEE }], values: { peace: D },
        fx: [{ op: 'money', add: -HAKI_FEE }, { op: 'master', name: '은퇴한 부선장', branch: 'observation', cap: PAID_CAP, years: 4, paid: true }] },
      { label: '술 한 잔만 사고 이야기를 듣는다', hint: '들은 것만으로도 눈이 조금 뜨인다', values: { romance: D }, fx: [{ op: 'mastery', branch: 'observation', add: 10 }] },
    ],
  },

  // ---------------------------------------------------------------- 동료 · 배신 · 약속
  {
    id: 'pp_crew', kind: 'door', when: at(age(16), st('pirate', 'revolution', 'bountyHunter', 'warlord')),
    weight: 8, repeat: { years: 4 }, speaker: { relation: '낯선 떠돌이' },
    title: '태워 달라는 자', body: '{island} 부두에서 낡은 짐 보따리를 멘 떠돌이가 {name}을(를) 막아선다. 배에 태워 주면 무엇이든 하겠다고 한다.',
    doors: [
      { label: '동료로 받아들인다', hint: '등을 맡길 사람이 하나 는다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'crew', relation: '동료' }] },
      { label: '돌려보낸다', hint: '믿을 수 없는 사람은 태우지 않는다', values: { peace: D }, fx: [] },
      { label: '한판 붙어 보고 정한다', hint: '실력을 보고 받는다', values: { dominion: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'crew', relation: '시험을 통과한 동료' }] },
    ],
  },
  {
    id: 'pp_traitor', kind: 'door', when: at(st(...GROWN), { c: 'flag', id: 'betrayed', has: true }),
    weight: 8, repeat: 'once', speaker: { relation: '배신한 옛 동료' },
    title: '배신자와의 재회', body: '몇 해 만에 {island}의 술집에서 그 얼굴을 다시 보았다. {name}을(를) 팔아넘겼던 그자가 들고 있던 잔을 떨어뜨린다.',
    doors: [
      { label: '용서하고 잔을 채워 준다', hint: '오래 묵은 것을 내려놓는다', values: { peace: D },
        fx: [{ op: 'hardship', add: -5 }, { op: 'log', text: '말없이 잔을 채워 주었다. 옛 동료는 고개를 들지 못했다.', weight: 'heavy' }] },
      { label: '빼앗긴 것을 받아 낸다', hint: '그 자리에서 값을 치르게 한다', values: { dominion: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'fame', add: 5 }, { op: 'log', text: '빼앗긴 것을 이자까지 쳐서 받아 냈다.', weight: 'heavy' }] },
      { label: '말없이 등을 돌린다', hint: '다시는 엮이지 않는다', values: { freedom: D }, fx: [] },
      { label: '다시 한번 믿어 본다', hint: '돌아올 자리를 내어 준다', special: 'loyalty', values: { loyalty: D }, when: [NOT_SQUAD],
        fx: [{ op: 'person', kind: 'crew', relation: '돌아온 옛 동료' }, { op: 'timeline', text: '배신한 동료를 다시 받아들였다' }] },
    ],
  },
  {
    id: 'pp_promise', kind: 'door', when: at(age(18, 35), st(...ACTIVE), { c: 'flag', id: 'kidPromise', has: true }),
    weight: 6, repeat: 'once', speaker: { relation: '어릴 적 동무' },
    title: '약속한 동무', body: '{island} 항구에서 누군가 {name}의 이름을 크게 부른다. 오래전 바닷가에서 약속을 나눈 그 동무다.',
    doors: [
      { label: '약속대로 같은 배에 오른다', hint: '어릴 적 약속을 지킨다', values: { loyalty: D }, when: [NOT_SQUAD],
        fx: [{ op: 'person', kind: 'crew', relation: '어릴 적 동무' }, { op: 'timeline', text: '어릴 적 약속대로 동무와 같은 배에 올랐다' }] },
      { label: '서로 다른 길을 걷고 있음을 받아들인다', hint: '웃으며 다시 헤어진다', values: { peace: D }, fx: [] },
      { label: '서로 칼을 겨눌 사이가 되었음을 안다', hint: '평생의 맞수가 생긴다', values: { dominion: D }, 
        fx: [{ op: 'person', kind: 'rival', relation: '맞수가 된 동무' }] },
    ],
  },

  // ---------------------------------------------------------------- 가족
  {
    id: 'pp_marriage', kind: 'door', when: at(age(20, 45), st(...ACTIVE), { c: 'flag', id: 'sweetheart', has: true }),   // 마음에 둔 사람(life_meet)이 있어야 온다
    weight: 5, repeat: 'once', speaker: { relation: '마음에 둔 사람' },
    title: '청혼', body: '{island}의 바닷가에서, 오래 곁에 있던 사람이 {name}의 손을 잡는다. 함께 살자고, 이번에는 대답을 듣고 싶다고.',
    doors: [
      { label: '청혼을 받아들인다', hint: '평생을 함께할 사람이 생긴다', values: { devotion: D },
        fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'person', kind: 'family', relation: '배우자' }, { op: 'flag', id: 'married' }, { op: 'timeline', text: '혼인했다' }] },
      { label: '바다를 택한다', hint: '그 사람은 기다려 주지 않는다', values: { freedom: D }, fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'hardship', add: 3 }] },
      { label: '돌아올 때까지 기다려 달라고 한다', hint: '약속 하나를 품고 떠난다', values: { romance: D }, fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'flag', id: 'waitingLove' }] },
    ],
  },
  {
    id: 'pp_child', kind: 'door', when: at(age(21, 40), st(...ACTIVE), { c: 'flag', id: 'married', has: true }),   // 마흔까지: 자식이 자라서 오는 사건(life.ts)은 쉰 넘어 온다
    weight: 6, repeat: 'once', speaker: 'hero',
    title: '작은 손', body: '갓난아이가 {name}의 손가락을 꼭 쥐었다. 이 작은 손이 앞으로의 날들을 바꿔 놓을 것 같다.',
    doors: [
      { label: '{island}에 자리 잡고 곁에서 키운다', hint: '바다보다 아이를 고른다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 0 }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '아이가 태어나 {island}에 자리 잡았다' }] },
      { label: '아이를 맡기고 다시 떠난다', hint: '돌아올 이유가 하나 생긴다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 0 }, { op: 'hardship', add: 3 }, { op: 'timeline', text: '아이가 태어났다' }] },
      { label: '아이에게 바다를 보여 주겠다며 데려간다', hint: '거친 삶을 함께 산다', special: 'romance', values: { romance: D },
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 0 }, { op: 'flag', id: 'childAtSea' }, { op: 'timeline', text: '아이와 함께 바다를 떠돌았다' }] },
    ],
  },
  {
    id: 'pp_debt', kind: 'door', when: at(age(18, 40), st(...ACTIVE), { c: 'lineage', is: ['commoner', 'marineFamily', 'pirateChild', 'outcast'] }, { c: 'wealth', max: 'common' }),
    weight: 6, repeat: 'once', needs: ['parent'], speaker: { relation: '빚쟁이' },
    title: '집안의 빚', body: '빚쟁이들이 {town}의 집에 들이닥쳤다. 집안이 진 빚을 갚지 못하면 늙은 부모를 끌고 가겠다고 한다.',
    doors: [
      { label: '빚을 떠안는다', hint: '몇 해는 번 돈을 고스란히 넘긴다', values: { devotion: D },
        fx: [{ op: 'money', add: -60000 }, { op: 'hardship', add: 5 }, { op: 'flag', id: 'familyDebt' }, { op: 'timeline', text: '집안의 빚을 떠안았다' }] },
      { label: '빚쟁이들을 두들겨 쫓아낸다', hint: '뒤탈이 남는다', values: { dominion: D }, fx: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'loanSharkGrudge' }] },
      { label: '집과 연을 끊고 떠난다', hint: '부모의 얼굴을 다시 보지 못할 수도 있다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 5 }, { op: 'timeline', text: '집과 연을 끊었다' }] },
    ],
  },
  {
    id: 'pp_parent', kind: 'door', when: at(age(25, 60), st(...ACTIVE), { c: 'lineage', is: ['commoner', 'marineFamily', 'pirateChild', 'outcast'] }),
    weight: 3, repeat: 'once', needs: ['parent'], speaker: 'hero',
    title: '고향에서 온 편지', body: '{town}에서 편지가 왔다. 늙은 부모가 자리에 누워 {name}을(를) 찾는다고 한다.',
    doors: [
      { label: '모든 것을 두고 고향으로 달려간다', hint: '하던 일은 멈춘다', values: { devotion: D },
        fx: [{ op: 'moveHome' }, { op: 'log', text: '{town}(으)로 달려가 부모의 마지막 숨을 곁에서 지켰다.', weight: 'heavy' },
             { op: 'losePerson', who: 'parent' }, { op: 'timeline', text: '부모의 임종을 지켰다' }] },
      { label: '돌아가지 못한다', hint: '평생 마음에 걸린다', values: { ambition: D },
        fx: [{ op: 'hardship', add: 4 }, { op: 'log', text: '편지를 접어 품에 넣었다. 다음 소식은 부고였다.', weight: 'heavy' },
             { op: 'losePerson', who: 'parent' }] },
    ],
  },

  // ---------------------------------------------------------------- 누구를 구할지 · 쓰러진 적
  {
    id: 'pp_rescue', kind: 'door', when: at(age(16), st(...ACTIVE)),
    weight: 3, repeat: 'once', needs: ['crew'], speaker: 'hero',
    title: '불타는 배', body: '포격을 맞은 배가 불길에 휩싸였다. 한쪽에선 동료가 기둥에 깔려 있고, 다른 쪽에선 아이들이 갇혀 울고 있다. 둘 다 구할 시간은 없다.',
    doors: [
      { label: '동료를 먼저 구한다', hint: '아이들의 울음이 귀에 남는다', values: { loyalty: D },
        fx: [{ op: 'hardship', add: 4 }, { op: 'log', text: '동료를 업고 빠져나왔다. 아이들은 끝내 구하지 못했다.', weight: 'heavy' }] },
      { label: '아이들을 먼저 구한다', hint: '동료를 잃을지도 모른다', values: { justice: D },
        fx: [{ op: 'losePerson', who: 'crew' }, { op: 'fame', add: 10 },
             { op: 'log', text: '아이들을 안고 빠져나왔다. 돌아보니 동료가 있던 자리는 이미 불길 속이었다.', weight: 'heavy' }] },
      { label: '불길 속으로 다시 뛰어든다', hint: '둘 다 구할지도 모른다. 몸이 버틸지는 모른다', special: 'devotion', values: { devotion: D }, danger: true,
        fx: [{ op: 'injury', severity: 'heavy' }, { op: 'fame', add: 20 }, { op: 'chance', p: 0.35, then: [{ op: 'loseLimb', limb: 'random' }] },
             { op: 'log', text: '불길을 두 번 뚫었다. 모두 살았지만 {name}의 몸에는 지워지지 않는 자국이 남았다.', weight: 'heavy' }] },
    ],
  },
  {
    // 이름 있는 상대를 이기면 ackBattle이 줄에 세운다. 가중치 0: 저절로 뽑히지 않는다
    id: 'after_fight', kind: 'door', when: [], weight: 0, repeat: { years: 0 }, speaker: 'hero',
    title: '쓰러진 적', body: '싸움이 끝났다. 쓰러진 상대가 피를 흘리며 {name}을(를) 올려다본다. 이 자를 어떻게 할지는 이제 {name}에게 달렸다.',
    doors: [
      { label: '살려서 보내 준다', hint: '언젠가 다시 마주칠지도 모른다', values: { peace: D },
        fx: [{ op: 'log', text: '상대를 일으켜 세워 보내 주었다. 등 뒤에서 이를 가는 소리가 들렸다.', weight: 'light' }] },
      { label: '가진 것을 모두 빼앗는다', hint: '이긴 자의 몫을 챙긴다', values: { dominion: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'log', text: '쓰러진 자의 금고를 털었다.', weight: 'light' }] },
      { label: '동료가 되라고 손을 내민다', hint: '어제의 적이 등을 맡길 사람이 될지도 모른다', values: { loyalty: D }, when: [NOT_SQUAD],
        fx: [{ op: 'person', kind: 'crew', relation: '쓰러뜨린 적이었던 동료' }, { op: 'log', text: '한참을 노려보던 상대가 마침내 손을 잡았다.', weight: 'heavy' }] },
    ],
  },

  // ---------------------------------------------------------------- 돈 · 몸
  {
    id: 'pp_all_in', kind: 'door', when: at(age(18), st(...ACTIVE), { c: 'money', min: ALL_IN_MIN }),
    weight: 1, repeat: { years: 10 }, speaker: { relation: '노름판의 전주' },
    title: '한판 승부', body: '{island} 뒷골목의 노름판. 전주가 웃으며, 가진 것을 전부 걸면 판돈을 크게 쳐 주겠다고 한다.',
    doors: [
      { label: '판을 떠난다', hint: '가진 것은 지킨다', values: { peace: D }, fx: [] },
      { label: '전 재산을 건다', hint: '모두 얻거나 모두 잃는다', values: { ambition: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'money', add: 200000 }, { op: 'log', text: '마지막 패가 뒤집혔다. 노름판의 돈이 모두 {name}의 앞으로 밀려왔다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -100000000 }, { op: 'hardship', add: 4 }, { op: 'log', text: '마지막 패가 뒤집혔다. 빈 주머니로 노름판을 나섰다.', weight: 'heavy' }] }] },
      { label: '전주의 속임수를 꿰뚫고 판을 뒤집는다', hint: '눈치 빠른 사람만 할 수 있다', special: 'inquiry', values: { inquiry: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'fame', add: 2 }] },
    ],
  },
  {
    id: 'pp_fruit', kind: 'door', when: at(age(12), st('child', ...GROWN), { c: 'fruit', has: false }),
    weight: 2, repeat: 'once', speaker: 'hero',
    title: '소용돌이 무늬의 열매', body: '{island} 시장의 노점 구석에 소용돌이 무늬가 새겨진 열매 하나가 굴러다닌다. 상인은 그게 무엇인지도 모르는 눈치다.',
    doors: [
      { label: '헐값에 사서 그 자리에서 먹는다', hint: '한 번 먹으면 다시는 헤엄칠 수 없다', needs: ['swim'], values: { romance: D }, fx: [{ op: 'eatFruit', id: 'random' }] },
      { label: '사 두었다가 비싸게 판다', hint: '아는 사람에게는 큰돈이 된다', values: { ambition: D }, fx: [{ op: 'money', add: 100000 }] },
      { label: '모른 척 지나간다', hint: '수상한 것은 건드리지 않는다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'pp_prosthetic', kind: 'door', when: at(st('child', ...GROWN), { c: 'limbLost', min: 1 }),
    weight: 8, repeat: { years: 1 }, speaker: { relation: '의수 장인' },
    title: '기름때 묻은 공방', body: '{island}의 공방에서 기름때 묻은 장인이 {name}이(가) 잃은 자리를 살핀다. 값만 치르면 쓸 만한 것을 달아 주겠다고 한다.',
    doors: [
      { label: '값을 치르고 의수나 의족을 단다', hint: '예전만은 못해도 다시 움직일 수 있다', when: [{ c: 'money', min: PROSTHETIC_COST }], values: { ambition: D },
        fx: [{ op: 'money', add: -PROSTHETIC_COST }, { op: 'prosthetic', grade: 'basic' }, { op: 'log', text: '쇠와 가죽으로 만든 것을 달았다. 처음 몇 걸음은 남의 몸 같았다.', weight: 'heavy' }] },
      { label: '잃은 채로 산다', hint: '남은 몸에 익숙해진다', values: { peace: D }, fx: [], closes: true },
    ],
  },

  // ---------------------------------------------------------------- 이름 있는 상대 (바다마다)
  {
    id: 'meet_morgan', kind: 'door', when: at(age(15, 24), st(...HUNTED), sea('east')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'morgan' },
    title: '도끼손 대령', body: '셸스 타운의 해군 기지. 도끼 손의 대령이 마을 사람들을 처형대 앞에 세워 놓고, 해적 깃발을 단 {name}의 배를 노려본다.',
    doors: [
      fightDoor('대령에게 맞선다', '목숨을 건 싸움이 된다', { freedom: D }, 'b_morgan', READY(1)),
      { label: '마을 사람들을 먼저 빼돌린다', hint: '싸움은 피하지만 쫓긴다', values: { devotion: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 5 }, { op: 'log', text: '밤새 마을 사람들을 배에 태워 옆 섬으로 옮겼다.', weight: 'heavy' }] },
      { label: '닻을 올려 달아난다', hint: '오늘은 등을 보인다. 군함이 따라붙으면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_morgan', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_arlong', kind: 'door', when: at(age(15, 24), st(...LAWFUL), sea('east')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'arlong' },
    title: '톱상어의 섬', body: '코노미 제도의 마을들이 어인 해적에게 공물을 바치고 있다. 톱니 코의 선장이 {name}을(를) 보고 이빨을 드러낸다.',
    doors: [
      fightDoor('어인 해적에게 맞선다', '목숨을 건 싸움이 된다', { justice: D }, 'b_arlong', READY(2)),
      { label: '뇌물을 받고 눈을 감는다', hint: '주머니는 두둑해지고 마을은 그대로다', values: { ambition: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'flag', id: 'tookBribe' }] },
      { label: '본부에 지원을 요청하고 물러난다', hint: '지원은 언제 올지 모른다. 물러나는 길목을 어인들이 막아설 수도 있다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_arlong', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_smoker', kind: 'door', when: at(age(17), st(...HUNTED), sea('gl_entry')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'smoker' },
    title: '연기의 추격자', body: '흰 연기가 {island}의 거리를 뒤덮는다. 시가 두 대를 문 해군이 {name}의 앞을 막아선다. 이 바다까지 쫓아왔다.',
    doors: [
      fightDoor('연기 속으로 뛰어든다', '맨손으로는 닿지 않을지도 모른다', { ambition: D }, 'b_smoker', READY(3)),
      duelDoor('목숨은 걸지 않고 겨뤄 본다', '실력만 가늠한다', { loyalty: D }, 'b_smoker', READY(2)),
      { label: '뒷골목으로 달아난다', hint: '연기가 끈질기게 따라온다. 붙잡히면 맞닥뜨린다', values: { freedom: D }, fx: [{ op: 'hp', add: -5 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_smoker', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_mr1', kind: 'door', when: at(age(16, 24), st(...LAWFUL, 'revolution'), sea('gl_entry')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'daz' },
    title: '칼날의 사내', body: '{island}의 어둠 속에서 민머리의 사내가 팔을 칼날로 바꾼다. 비밀 결사의 사냥꾼이 {name}을(를) 다음 목표로 정했다.',
    doors: [
      fightDoor('칼날에 맞선다', '온몸이 칼인 상대다', { justice: D }, 'b_mr1', READY(2)),
      { label: '결사의 비밀을 캐내고 빠진다', hint: '싸움 대신 정보를 얻는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'baroqueSecret' }] },
      { label: '숨을 죽이고 지나가길 기다린다', hint: '오늘 밤만 넘기면 된다. 들키면 칼날과 마주한다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_mr1', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_lucci', kind: 'door', when: at(age(18), st(...HUNTED), sea('gl_first')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'lucci' },
    title: '정부의 암살자', body: '{island}의 다리 위, 비둘기를 어깨에 얹은 사내가 길을 막는다. 정부의 이름으로 {name}을(를) 처리하러 왔다고 한다.',
    doors: [
      fightDoor('암살자에게 맞선다', '사람을 죽이는 기술의 끝을 상대한다', { loyalty: D }, 'b_lucci', READY(3)),
      { label: '다리 아래 지나가는 짐배 위로 뛰어내린다', hint: '살아남는 것이 먼저다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'log', text: '다리 난간을 넘어 짐배의 갑판으로 떨어졌다. 짐 더미 틈에 몸을 숨긴 채 다리를 벗어났다.', weight: 'heavy' }] },
      { label: '항복하고 끌려간다', hint: '목숨만은 건진다', values: { peace: D },
        fx: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '두 손을 들었다. 쇠고랑이 채워졌다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'meet_crocodile', kind: 'door', when: at(age(16, 24), st(...LAWFUL, 'revolution'), sea('gl_first')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'crocodile' },
    title: '사막의 왕', body: '모래폭풍 너머, 갈고리 손의 칠무해가 왕국을 삼키려 한다. 그가 {name}을(를) 내려다보며 시가 연기를 내뿜는다.',
    doors: [
      fightDoor('모래의 사내에게 맞선다', '물이 없으면 닿지 않는다', { justice: D }, 'b_crocodile', READY(3)),
      { label: '그의 음모를 왕국에 알린다', hint: '싸우지 않고 판을 뒤집는다', values: { inquiry: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'log', text: '비밀 결사의 계획을 왕국에 알렸다. 반란은 한 발 늦게 터졌다.', weight: 'heavy' }] },
      { label: '모래바람을 피해 떠난다', hint: '이 나라의 일은 이 나라에 맡긴다. 모래가 발목을 잡으면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_crocodile', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_kizaru', kind: 'door', when: at(age(18), st(...HUNTED), sea('sabaody')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'kizaru' },
    title: '빛의 대장', body: '{island}의 하늘이 눈부시게 번쩍인다. 느릿한 말투의 해군 대장이 {name} 앞에 빛으로 내려선다. 빛보다 빠른 발차기가 날아온다.',
    doors: [
      fightDoor('빛에 맞선다', '해군 대장이다. 살아남을 수 있을지 모른다', { ambition: D }, 'b_darc', READY(4)),
      { label: '동료들을 흩어지게 하고 달아난다', hint: '다시 모일 수 있을지는 모른다', needs: ['crew'], values: { loyalty: D },
        fx: [{ op: 'hp', add: -25 }, { op: 'hardship', add: 6 }, { op: 'log', text: '빛이 쏟아지는 섬에서 동료들과 흩어져 달아났다.', weight: 'heavy' }] },
      { label: '숨어서 대장이 떠나기를 기다린다', hint: '숨소리도 내지 않는다. 빛이 숨은 곳을 비추면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'hp', add: -5 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_darc', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_hody', kind: 'door', when: at(age(18, 26), st(...SEAFARING), sea('sabaody')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'hody' },
    title: '바다 밑의 증오', body: '어인섬의 광장. 붉은 약에 취한 어인이 인간을 몰아내자고 외친다. 핏발 선 눈이 {name}에게 꽂힌다.',
    doors: [
      fightDoor('광장 한가운데서 맞선다', '섬 사람들이 지켜본다', { justice: D }, 'b_hody', READY(3)),
      duelDoor('목숨은 걸지 않고 막아선다', '쓰러뜨리기보다 멈추게 한다', { devotion: D }, 'b_hody', READY(2)),
      { label: '섬을 빠져나간다', hint: '바다 밑의 일은 바다 밑에 맡긴다. 붉은 눈이 뒤쫓아 오면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_hody', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_fujitora', kind: 'door', when: at(age(19), st(...HUNTED), sea('nw_first')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'fujitora' },
    title: '눈 감은 대장', body: '{island}의 하늘에서 운석이 떨어진다. 눈을 감은 해군 대장이 지팡이 칼을 짚고 {name}의 기척을 읽는다.',
    doors: [
      fightDoor('운석 아래서 맞선다', '하늘을 끌어내리는 상대다', { ambition: D }, 'b_fujitora', READY(5)),
      { label: '주사위 한 판으로 승부를 청한다', hint: '대장은 도박을 좋아한다', values: { romance: D },
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'fame', add: 20 }, { op: 'log', text: '주사위가 {name}의 편을 들었다. 대장은 웃으며 칼을 거두었다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'log', text: '주사위가 등을 돌렸다. 땅이 꺼지는 틈에 겨우 빠져나왔다.', weight: 'heavy' }] }] },
      { label: '중력에 짓눌리기 전에 달아난다', hint: '땅이 무너져 내린다. 기척을 읽히면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'hp', add: -15 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_fujitora', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_doflamingo', kind: 'door', when: at(age(17, 26), st('civil', 'shipwright', 'settled', ...SEAFARING), sea('nw_first')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'doflamingo' },
    title: '하늘의 악마', body: '드레스로자의 하늘에 실로 엮은 새장이 내려온다. 분홍 깃털 외투의 왕이 웃으며 {name}을(를) 꼭두각시로 만들려 한다.',
    doors: [
      fightDoor('새장 안에서 왕에게 맞선다', '실이 온몸을 노린다', { justice: D }, 'b_doflamingo', READY(5)),
      { label: '지하의 저항군과 손잡는다', hint: '싸움보다 사람들을 빼내는 쪽을 맡는다', values: { devotion: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '지하 저항군' }, { op: 'fame', add: 10 }] },
      { label: '실이 닿기 전에 섬을 떠난다', hint: '새장 밖으로 빠져나간다. 실에 걸리면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_doflamingo', lethal: false, forced: false }] }] },
    ],
  },
  {
    id: 'meet_akainu', kind: 'door', when: at(age(19), st(...HUNTED), sea('nw_late')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'akainu' },
    title: '마그마의 원수', body: '바다가 끓어오른다. 철저한 정의를 외치는 해군의 정점이 마그마의 주먹을 들고 {name}의 배를 막아선다.',
    doors: [
      fightDoor('마그마에 맞선다', '이 산을 넘으면 바다의 정점이 보인다', { ambition: D }, 'b_akainu', READY(6)),
      { label: '배를 버리고 바다 밑으로 피한다', hint: '배는 잃어도 목숨은 남는다', needs: ['swim'], values: { peace: D },
        fx: [{ op: 'hp', add: -25 }, { op: 'money', add: -100000 }, { op: 'log', text: '배가 불기둥에 삼켜졌다. 바다 밑으로 숨어 겨우 살아남았다.', weight: 'heavy' }] },
      { label: '동료들을 먼저 보내고 혼자 시간을 번다', hint: '돌아오지 못할 수도 있다', needs: ['crew'], values: { loyalty: D }, danger: true,
        fx: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -40 }, { op: 'fame', add: 50 }, { op: 'chance', p: 0.3, then: [{ op: 'loseLimb', limb: 'random' }] }] },
    ],
  },
  {
    id: 'meet_kaido', kind: 'door', when: at(age(17, 30), st(...LAWFUL, 'pirate', 'revolution'), sea('nw_late')),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'kaido' },
    title: '가장 강한 생물', body: '와노쿠니의 하늘을 푸른 용이 가른다. 세상에서 가장 강하다는 사황이 술병을 기울이며 {name}을(를) 내려다본다.',
    doors: [
      fightDoor('용에게 맞선다', '세상에서 가장 강한 상대다', { dominion: D }, 'b_kaido', READY(6)),
      duelDoor('목숨은 걸지 않고 한 수 청한다', '사황은 강한 자를 반긴다', { ambition: D }, 'b_kaido', READY(5)),
      { label: '사무라이들 사이에 숨는다', hint: '때가 올 때까지 기다린다. 용의 눈에 띄면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_kaido', lethal: false, forced: false }] }] },
    ],
  },
];
