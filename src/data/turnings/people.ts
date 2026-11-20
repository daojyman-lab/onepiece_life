// 사람과 몸과 돈 (설계 5.2의 중대한 선택): 스승, 동료, 배신, 결혼과 자식, 누구를 구할지, 쓰러진 적, 빚, 전 재산,
// 열매, 의수 · 의족, 그리고 바다마다 이름 있는 상대와의 마주침. 로그타운에서 태어난 사람에게 열린다.
// 돈으로 들이는 스승은 paid: true, cap 4를 넘지 않는다. 그 위는 기연(fortunes.ts)의 몫이다.
// 이름 있는 상대는 제 바다(sea 조건)에서, 원작의 때(주인공의 나이)에 맞춰 만난다. 강한 바다일수록
// 경지가 모자란 사람에게는 맞서는 문이 잠기고 숨기 · 달아나기 · 흥정 같은 문만 열린다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { afterHistory, beforeHistory, known, ACTIVE, GROWN, HUNTED, LAWFUL, SEAFARING, age, at, sea, st } from './paths';
import type { Cond, Door, Fx, Turning, Values } from '../../core/types';

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

const DOJO_WHEN = at(age(12, 40), st('child', 'civil', 'pirate', 'marine', 'bountyHunter', 'shipwright', 'settled', 'revolution'));
const DOJO_PARTNER: Cond = { c: 'anyOf', conditions: [
  { c: 'kin', who: 'sibling', has: true },
  { c: 'person', relation: '어릴 적 맞수', has: true, kinds: ['rival'] },
] };
const DOJO_STYLES = [
  { branch: 'sword', art: '검술', weight: 4, value: 'ambition', practice: '아이들이 목검을 맞댄다.',
    tip: '칼을 내려칠 때 손에 힘을 주지 말고 앞발부터 딛으라고 알려 줬다.', spar: '나뭇가지를 들고 한 번씩 번갈아 공격을 막았다.' },
  { branch: 'gun', art: '총술', weight: 4, value: 'inquiry', practice: '사범이 빈 깡통을 세우고 사격 자세를 보여 준다.',
    tip: '숨을 내쉰 뒤 어깨가 흔들리지 않을 때 방아쇠를 당기라고 알려 줬다.', spar: '빈 깡통 세 개를 세우고 누가 먼저 맞히는지 겨뤘다.' },
  { branch: 'fist', art: '권법', weight: 12, value: 'dominion', practice: '수련생들이 모래밭에서 맨주먹으로 겨룬다.',
    tip: '주먹을 뻗을 때 발뒤꿈치와 허리를 함께 돌리는 법을 보여 줬다.', spar: '모래밭에 금을 긋고 누가 먼저 선 밖으로 밀리는지 겨뤘다.' },
] as const;

const DOJO_TURNINGS = DOJO_STYLES.flatMap(({ branch, art, weight, value, practice, tip, spar }): Turning[] => {
  const name = `도장의 ${art} 사범`;
  const log = (text: string): Fx => ({ op: 'log', text, weight: 'light' });
  const dojo: Turning = {
    id: `pp_dojo_${branch}`, kind: 'door', when: DOJO_WHEN, weight, repeat: { years: 6 }, speaker: { relation: name },
    title: `${art} 도장`,
    body: `{island}의 ${art} 도장이다. ${practice} 문 옆에는 입문하려면 수업료를 내라는 팻말이 걸려 있다.`,
    doors: [
      { label: '수업료를 내고 입문한다', hint: `${art}을 처음부터 배운다`, when: [{ c: 'money', min: DOJO_FEE }], needs: ['arms'], values: { [value]: D },
        fx: [{ op: 'money', add: -DOJO_FEE, trade: true }, { op: 'master', branch, name, cap: PAID_CAP, years: 8, paid: true },
          log('수업료를 내자 사범이 내일 아침 첫 수업에 나오라고 했다.')] },
      { label: '담 너머로 수련을 훔쳐본다', hint: '수련생들의 동작을 눈에 익힌다. 가끔 사범이 요령을 알려 주기도 한다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch, add: 8 }, { op: 'chance', p: 0.3,
          then: [{ op: 'mastery', branch, add: 10 }, log(`담 너머에서 지켜보는 걸 본 사범이 안으로 불렀다. ${tip} 수업이 끝나자 다시 담 밖으로 나왔다.`)],
          else: [log('사범이 다음 수련생을 부르는 동안 발을 옮기는 순서와 자세를 눈에 담았다. 문이 닫힐 때쯤 혼자 담을 내려왔다.')] }] },
      { label: '도장은 못 가니 {dojoPartner}에게 대련을 하자고 한다', hint: '도장 밖에서 서로 겨루며 연습한다', when: [DOJO_PARTNER], needs: ['arms'],
        values: { dominion: D }, fx: [{ op: 'mastery', branch, add: 8 }, log(`{dojoPartner}와(과) 도장에서 조금 떨어진 빈터로 갔다. ${spar}`)] },
    ],
  };
  // 직전 도장 창에서 무료 입문을 묻고 저장한 경우에도 같은 사범의 현재 선택지를 띄운다.
  return [dojo, { ...dojo, id: `${dojo.id}_admission`, weight: 0 }];
});

export const PEOPLE: Turning[] = [
  {
    id: 'pp_bookseller', kind: 'door', when: at(age(7, 14), st('child'), { c: 'flag', id: 'left_home_young', has: false }),
    weight: 6, repeat: 'once', speaker: { relation: '먼지 묻은 책방 주인' },
    title: '책갈피의 글씨', body: '책방 문 앞에서 주운 책갈피에 모르는 글씨가 적혀 있다. 책방 주인이 가게 안에서 연필을 내민다. 들고 와 앉으면 읽는 법을 가르쳐 주겠다고 한다.',
    doors: [
      { label: '가게 문이 닫힐 때까지 함께 읽는다', hint: '다음에 읽을 책도 한 권 빌린다', values: { inquiry: D },
        fx: [{ op: 'person', kind: 'ally', relation: '글을 가르쳐 준 책방 주인', age: { older: 22 } }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '{person:글을 가르쳐 준 책방 주인}이(가) 책갈피 뒤에 {name}의 이름을 써 줬다. 빌려 간 책을 다 읽으면 다시 오라고 했다.', weight: 'light' }] },
      { label: '책갈피를 돌려주고 놀러 간다', hint: '책방 주인이 문간에서 손을 흔든다', values: { freedom: D },
        fx: [{ op: 'log', text: '책갈피를 건네자 책방 주인이 읽던 책에 끼웠다. 골목 저쪽에서 아이들이 부르는 소리가 났다.', weight: 'light' }] },
    ],
  },
  // ---------------------------------------------------------------- 스승
  ...DOJO_TURNINGS,
  // 오래된 저장에서 이미 열린 도장 창은 같은 번호와 결과로 마저 고를 수 있다.
  {
    id: 'pp_dojo', kind: 'door', when: DOJO_WHEN,
    weight: 0, repeat: { years: 6 }, speaker: { relation: '도장의 사범' },
    title: '도장의 문', body: '{island}에 이름난 사범들이 모인 도장이 있다. 수업료만 낸다면 누구든 받아 준다고 한다.',
    doors: [
      { label: '검술 사범에게 수업료를 낸다', hint: '칼 쓰는 법을 처음부터 제대로 배운다', when: [{ c: 'money', min: DOJO_FEE }], values: { ambition: D },
        fx: [{ op: 'money', add: -DOJO_FEE, trade: true }, { op: 'master', name: '도장의 검술 사범', branch: 'sword', cap: PAID_CAP, years: 8, paid: true }, { op: 'learnTechnique', teacher: '도장의 검술 사범', branch: 'sword', name: '기본 검로', add: 10 }, { op: 'log', text: '검술 사범이 목검을 쥐여 줬다. 첫 수업은 칼을 뽑는 자세만 반복했다.', weight: 'light' }] },
      { label: '총포 교관에게 수업료를 낸다', hint: '먼 곳을 맞히는 눈을 기른다', when: [{ c: 'money', min: DOJO_FEE }], values: { inquiry: D },
        fx: [{ op: 'money', add: -DOJO_FEE, trade: true }, { op: 'master', name: '도장의 총포 교관', branch: 'gun', cap: PAID_CAP, years: 8, paid: true }, { op: 'learnTechnique', teacher: '도장의 총포 교관', branch: 'gun', name: '호흡을 고정한 정조준', add: 10 }, { op: 'log', text: '교관이 사격장 끝 표적을 가리켰다. 총을 들기도 전에 바람 방향부터 읽게 했다.', weight: 'light' }] },
      { label: '담 너머로 수련을 훔쳐본다', hint: '돈 없이 눈으로만 배운다', values: { inquiry: D }, fx: [{ op: 'mastery', branch: 'fist', add: 8 }, { op: 'log', text: '담 너머에서 발놀림을 외웠다. 집에 돌아와 혼자 같은 자세를 되풀이했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_fist_dojo', kind: 'door', when: DOJO_WHEN,
    weight: 0, repeat: { years: 6 }, speaker: { relation: '권법 사범' },
    title: '권법 도장', body: '{island}의 권법 도장에서는 수련생들이 맨주먹으로 겨룬다. 수업료를 내면 누구든 받지만, 첫날은 사범에게 얻어맞는 것으로 시작한다고 한다.',
    doors: [
      { label: '권법 사범에게 수업료를 낸다', hint: '맨몸으로 버티고 때리는 법을 배운다', when: [{ c: 'money', min: DOJO_FEE }], values: { dominion: D },
        fx: [{ op: 'money', add: -DOJO_FEE, trade: true }, { op: 'master', name: '도장의 권법 사범', branch: 'fist', cap: PAID_CAP, years: 8, paid: true }, { op: 'learnTechnique', teacher: '도장의 권법 사범', branch: 'fist', name: '기본 연타와 방어 자세', add: 10 }, { op: 'log', text: '사범의 첫 주먹에 바닥을 굴렀다. 일어서는 법부터 다시 배웠다.', weight: 'light' }] },
      { label: '문 앞의 문하생을 때려눕히고 들어간다', hint: '사범의 눈에 들거나, 쫓겨난다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'mastery', branch: 'fist', add: 8 },
             { op: 'log', text: '문하생 둘을 눕히고 도장 안으로 들어섰다. 사범은 웃지도 않고 다음 상대를 불렀다.', weight: 'light' }] },
      { label: '도장 앞 건달들을 제 패거리로 끌어모은다', hint: '사범 대신 제가 우두머리가 된다. 도장과는 원수가 된다', values: { dominion: D }, fx: [{ op: 'person', kind: 'enemy', relation: '권법 도장의 사범' }, { op: 'log', text: '건달들이 도장 앞에서 {name}을(를) 우두머리로 불렀다. 사범은 문을 잠갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_wander_master', kind: 'door', when: at(age(14, 45), st('child', ...ACTIVE)),
    weight: 3, repeat: 'once', speaker: { relation: '떠돌이 무인' },
    title: '밥값 대신', body: '{island}에서 끼니를 얻으려 장작을 패던 떠돌이 무인이 쉬어 가던 {name}에게 빈 밥그릇을 보인다. 밥만 사 주면 몇 해 가르쳐 주겠다고 한다.',
    doors: [
      { label: '스승으로 모신다', hint: '돈은 들지 않지만 끝까지 가르칠 사람은 아니다', values: { inquiry: D }, 
        fx: [{ op: 'master', name: '떠돌이 무인', branch: 'fist', cap: V.growth.noMasterCap, years: 3, paid: false }, { op: 'learnTechnique', teacher: '떠돌이 무인', branch: 'fist', name: '힘을 싣는 기본 타격', add: 8 }, { op: 'log', text: '밥그릇을 비운 뒤 무인은 빈터에서 첫 자세를 보였다. 떠날 날은 말하지 않았다.', weight: 'light' }] },
      { label: '혼자 하겠다고 한다', hint: '누구의 제자도 되지 않는다', values: { freedom: D }, fx: [ { op: 'log', text: '무인은 밥그릇을 내려놓고 혼자 걷는 길을 가리켰다. {name}은(는) 그를 따라가지 않았다.', weight: 'light' }] },
      { label: '무인이 잠든 사이 비급만 베껴 팔아넘긴다', hint: '돈이 생긴다. 무인은 그 길로 떠난다', values: { greed: D }, fx: [{ op: 'money', add: 12000 }, { op: 'log', text: '잠든 무인 곁에서 비급을 베껴 팔았다. 아침에는 장작 패던 자리가 비었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_haki_master', kind: 'door', when: at(st(...SEAFARING), sea('gl_first', 'sabaody', 'nw_first', 'nw_late')),
    weight: 3, repeat: { years: 8 }, speaker: { relation: '은퇴한 부선장' },
    title: '보이지 않는 힘', body: '{island}에서 은발의 노인이 작은 동전을 손끝으로 굴린다. 이 너머의 바다에서 살아남으려면 보이지 않는 힘을 알아야 한다며, 수업료를 부른다.',
    doors: [
      { label: '수업료를 내고 몸에 두르는 기운을 배운다', hint: '보이지 않는 갑옷을 입는 법', when: [{ c: 'money', min: HAKI_FEE }], values: { ambition: D },
        fx: [{ op: 'money', add: -HAKI_FEE, trade: true }, { op: 'master', name: '은퇴한 부선장', branch: 'armament', cap: PAID_CAP, years: 4, paid: true }, { op: 'log', text: '노인이 주먹을 내밀라고 했다. 보이지 않는 기운이 팔을 감싸자 손끝의 동전이 튕겨 나갔다.', weight: 'light' }] },
      { label: '수업료를 내고 기척을 읽는 법을 배운다', hint: '보이지 않는 것을 보는 법', when: [{ c: 'money', min: HAKI_FEE }], values: { peace: D },
        fx: [{ op: 'money', add: -HAKI_FEE, trade: true }, { op: 'master', name: '은퇴한 부선장', branch: 'observation', cap: PAID_CAP, years: 4, paid: true }, { op: 'log', text: '노인이 눈을 감으라고 했다. 뒤쪽에서 동전이 땅에 닿는 소리가 먼저 들렸다.', weight: 'light' }] },
      { label: '수업은 사양하고 이야기만 듣는다', hint: '들은 것만으로도 눈이 조금 뜨인다', values: { romance: D }, fx: [{ op: 'mastery', branch: 'observation', add: 10 }, { op: 'log', text: '노인의 이야기를 끝까지 들었다. 다음 길목에서 낯선 발소리가 유난히 또렷했다.', weight: 'light' }] },
    ],
  },

  {
    id: 'pp_harbor_duel', kind: 'door', when: at(age(16, 40), st(...SEAFARING), { c: 'path', is: ['sword'] }),
    needs: ['sword'], weight: 6, repeat: 'once', speaker: { relation: '막배를 기다리는 검객' },
    title: '막배의 종', body: '부두의 검객이 빈터에서 한 수 겨뤄 보자고 한다. 검을 맞댄 지 얼마 되지 않아 막배의 종이 울린다. 검객은 이 배를 놓치면 고향에 갈 수 없다며 칼을 거둔다.',
    doors: [
      { label: '다음에 만나 결판을 내자고 약속한다', hint: '검객이 고향 섬의 이름을 적어 준다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'rival', relation: '결판을 미룬 검객' }, { op: 'log', text: '{person:결판을 미룬 검객}이(가) 섬 이름 옆에 자기 이름을 썼다. 배가 떠날 때까지 둘은 칼집을 들어 인사했다.', weight: 'heavy' }] },
      { label: '오늘 겨룬 것으로 족하다며 배웅한다', hint: '검객은 웃으며 배에 오른다', values: { freedom: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 3 }, { op: 'log', text: '검객은 웃으며 떠났다. 빈터에는 둘의 발자국만 남았다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 동료 · 배신 · 약속
  {
    id: 'pp_crew', kind: 'door', when: at(age(16), st('pirate', 'revolution', 'bountyHunter', 'warlord')),
    weight: 8, repeat: { years: 4 }, speaker: { relation: '낯선 떠돌이' },
    title: '태워 달라는 자', body: '{island} 부두에서 낡은 짐 보따리를 멘 떠돌이가 {name}을(를) 막아선다. 배에 태워 주면 무엇이든 하겠다고 한다.',
    doors: [
      { label: '동료로 받아들인다', hint: '등을 맡길 사람이 하나 는다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'crew', relation: '동료' }, { op: 'log', text: '떠돌이의 보따리를 갑판으로 올렸다. 첫 항해의 야간 망을 함께 섰다.', weight: 'light' }] },
      { label: '뱃삯을 두둑이 받고 태워 준다', hint: '선원이 아니라 손님이다. 다음 항구에서 내린다', values: { greed: D }, fx: [{ op: 'money', add: 15000 }, { op: 'log', text: '뱃삯을 받고 선실 한 칸을 내줬다. 다음 항구에서 그가 보따리를 메고 내렸다.', weight: 'light' }] },
      { label: '한판 붙어 보고 정한다', hint: '실력을 보고 받는다', values: { dominion: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'crew', relation: '시험을 통과한 동료' }, { op: 'log', text: '갑판에서 몇 합을 겨룬 뒤 손을 내밀었다. 떠돌이가 그 손을 잡고 선원들의 줄에 섰다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_traitor', kind: 'door', when: at(st(...GROWN), { c: 'flag', id: 'betrayed', has: true }, known('배신한 옛 동료', 'rival')),
    weight: 8, repeat: 'once', speaker: { relation: '배신한 옛 동료' },
    title: '배신자와의 재회', body: '{island}의 길목에서 {person:배신한 옛 동료}와(과) 눈이 마주쳤다. 떠나던 날의 일을 떠올렸는지, 그가 들고 있던 짐을 떨어뜨린다.',
    doors: [
      { label: '용서하고 손을 내민다', hint: '오래 묵은 것을 내려놓는다', values: { peace: D },
        fx: [{ op: 'personChange', relation: '배신한 옛 동료', kind: 'ally', rename: '용서한 옛 동료', bond: 10 }, { op: 'hardship', add: -5 }, { op: 'log', text: '말없이 손을 내밀었다. 옛 동료는 고개를 들지 못했다.', weight: 'heavy' }] },
      { label: '빼앗긴 것을 받아 낸다', hint: '그 자리에서 값을 치르게 한다', values: { dominion: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'fame', add: 5 }, { op: 'log', text: '빼앗긴 것을 이자까지 쳐서 받아 냈다.', weight: 'heavy' }] },
      { label: '말없이 등을 돌린다', hint: '다시는 엮이지 않는다', values: { freedom: D }, fx: [ { op: 'log', text: '뒤돌아 걸었다. 떨어진 짐을 줍는 소리만 뒤에서 들렸다.', weight: 'light' }] },
      { label: '다시 한번 믿어 본다', hint: '돌아올 자리를 내어 준다', special: 'loyalty', values: { loyalty: D }, when: [NOT_SQUAD],
        fx: [{ op: 'personChange', relation: '배신한 옛 동료', kind: 'crew', rename: '돌아온 옛 동료', bond: 15 }, { op: 'timeline', text: '배신한 동료를 다시 받아들였다' }, { op: 'log', text: '빈 자리를 가리키자 옛 동료가 한참 서 있었다. 마침내 배의 난간을 잡고 올랐다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_promise', kind: 'door', when: at(age(18, 35), st(...ACTIVE), { c: 'flag', id: 'kidPromise', has: true }, { c: 'person', relation: '어릴 적 동무', has: true }),
    weight: 6, repeat: 'once', speaker: { relation: '어릴 적 동무' },
    title: '약속한 동무', body: '{island} 항구에서 {friend}이(가) {name}의 이름을 크게 부른다. 오래전 바닷가에서 같은 배를 타자고 약속한 그 동무다.',
    doors: [
      { label: '약속대로 같은 배에 오른다', hint: '어릴 적 약속을 지킨다', values: { loyalty: D }, when: [NOT_SQUAD],
        fx: [{ op: 'personChange', relation: '어릴 적 동무', kind: 'crew', bond: 20 }, { op: 'timeline', text: '{friend}와(과) 어린 시절 약속대로 같은 배에 올랐다' }, { op: 'log', text: '{friend}이(가) 약속한 배의 이름을 말했다. 둘은 같은 갑판에서 돛줄을 당겼다.', weight: 'light' }] },
      { label: '서로 다른 길을 걷고 있음을 받아들인다', hint: '웃으며 다시 헤어진다', values: { peace: D }, fx: [{ op: 'personChange', relation: '어릴 적 동무', bond: 5 }, { op: 'log', text: '{friend}와(과) 부두 끝에서 서로 다른 배표를 보여 주고 웃었다. 이번에는 돌아보지 않았다.', weight: 'light' }] },
      { label: '다른 깃발 아래서 맞수가 되기로 한다', hint: '평생의 맞수가 생긴다', values: { dominion: D },
        fx: [{ op: 'personChange', relation: '어릴 적 동무', kind: 'rival', bond: -10 }, { op: 'log', text: '{friend}은(는) 해군 모자를 꺼내 보였다. 둘은 각자 고른 깃발을 따르되 다시 만나면 물러서지 않기로 했다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 가족
  {
    id: 'pp_marriage', kind: 'door', when: at(age(20, 45), st(...ACTIVE), { c: 'flag', id: 'sweetheart', has: true }, known('꽃가게에서 만난 사람', 'ally')),   // 마음에 둔 사람(life_meet)이 있어야 온다
    weight: 5, repeat: 'once', speaker: { relation: '꽃가게에서 만난 사람' },
    title: '청혼', body: '{island}의 바닷가에서, {person:꽃가게에서 만난 사람}이(가) {name}의 손을 잡는다. 함께 살자고, 이번에는 대답을 듣고 싶다고.',
    doors: [
      { label: '청혼을 받아들인다', hint: '평생을 함께할 사람이 생긴다', values: { justice: D },
        fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'personChange', relation: '꽃가게에서 만난 사람', kind: 'family', rename: '배우자', bond: 12 }, { op: 'flag', id: 'married' }, { op: 'timeline', text: '혼인했다' }, { op: 'log', text: '바닷가에서 대답하자 상대가 손을 더 꼭 쥐었다. 둘의 이름이 혼인 장부에 나란히 올랐다.', weight: 'light' }] },
      { label: '바다를 택한다', hint: '그 사람은 기다려 주지 않는다', values: { freedom: D }, fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'hardship', add: 3 }, { op: 'log', text: '상대는 쥐고 있던 손을 놓았다. 떠나는 배에서 바닷가를 다시 보지 못했다.', weight: 'light' }] },
      { label: '돌아올 때까지 기다려 달라고 한다', hint: '약속 하나를 품고 떠난다', values: { romance: D }, fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'flag', id: 'waitingLove' }, { op: 'log', text: '돌아올 항구의 이름을 함께 적었다. 상대는 약속을 접어 품에 넣었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_child', kind: 'door', when: at(age(21, 40), st(...ACTIVE), { c: 'flag', id: 'married', has: true }),   // 마흔까지: 자식이 자라서 오는 사건(life.ts)은 쉰 넘어 온다
    weight: 6, repeat: 'once', needs: ['spouse'], speaker: 'hero',
    title: '작은 손', body: '갓난아이가 {name}의 손가락을 꼭 쥐었다. 이 작은 손이 앞으로의 날들을 바꿔 놓을 것 같다.',
    doors: [
      { label: '{island}에 자리 잡고 곁에서 키운다', hint: '바다보다 아이를 고른다', values: { romance: D },
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 0 }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '아이가 태어나 {island}에 자리 잡았다' }, { op: 'log', text: '아이의 작은 침대를 창가에 놓았다. 항구의 돛보다 먼저 깨어나는 울음에 익숙해졌다.', weight: 'light' }] },
      { label: '아이를 맡기고 다시 떠난다', hint: '돌아올 이유가 하나 생긴다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 0 }, { op: 'hardship', add: 3 }, { op: 'timeline', text: '아이가 태어났다' }, { op: 'log', text: '배가 떠날 때 아이는 집 안에서 울었다. 항구가 멀어질수록 그 소리가 선명했다.', weight: 'light' }] },
      { label: '아이에게 바다를 보여 주겠다며 데려간다', hint: '거친 삶을 함께 산다', special: 'romance', values: { romance: D },
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 0 }, { op: 'flag', id: 'childAtSea' }, { op: 'timeline', text: '아이와 함께 바다를 떠돌았다' }, { op: 'log', text: '갑판에 작은 담요를 묶어 바람을 막았다. 아이가 처음 본 수평선이 흔들렸다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_debt', kind: 'door', when: at(age(18, 40), st(...ACTIVE), { c: 'lineage', is: ['commoner', 'marineFamily', 'pirateChild', 'outcast'] }, { c: 'wealth', max: 'common' }),
    weight: 6, repeat: 'once', needs: ['parent'], speaker: { relation: '빚쟁이' },
    title: '집안의 빚', body: '빚쟁이들이 {town}의 집에 들이닥쳤다. 집안이 진 빚을 갚지 못하면 늙은 부모를 끌고 가겠다고 한다.',
    doors: [
      { label: '빚을 떠안는다', hint: '몇 해는 번 돈을 고스란히 넘긴다', values: { romance: D },
        fx: [{ op: 'money', add: -60000 }, { op: 'hardship', add: 5 }, { op: 'flag', id: 'familyDebt' }, { op: 'timeline', text: '집안의 빚을 떠안았다' }, { op: 'log', text: '빚쟁이는 부모의 집에서 물러났다. 대신 몇 해 동안 품삯 봉투가 바로 그들에게 갔다.', weight: 'light' }] },
      { label: '빚쟁이들을 두들겨 쫓아낸다', hint: '뒤탈이 남는다', values: { dominion: D }, fx: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'loanSharkGrudge' }, { op: 'log', text: '빚쟁이를 문밖으로 내던졌다. 다음 날 골목에는 낯선 사내 둘이 서 있었다.', weight: 'light' }] },
      { label: '집과 연을 끊고 떠난다', hint: '부모의 얼굴을 다시 보지 못할 수도 있다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 5 }, { op: 'timeline', text: '집과 연을 끊었다' }, { op: 'log', text: '집 문 앞을 지나쳐 항구로 갔다. 부모의 불 켜진 창이 뒤로 멀어졌다.', weight: 'light' }] },
      { label: '빚 문서를 사들여 빚쟁이 노릇을 대신한다', hint: '빚은 사라지고, 이웃들의 빚까지 손에 쥔다', special: 'greed', when: [{ c: 'money', min: 30000 }], values: { greed: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'chance', p: 0.75, skillCheck: true, then: [{ op: 'money', add: 120000 }, { op: 'log', text: '골목의 빚 문서가 모두 {name}의 손에 들어왔다. 이자는 꼬박꼬박 들어왔다.', weight: 'heavy' }],
               else: [{ op: 'flag', id: 'loanSharkGrudge' }, { op: 'log', text: '빚 문서를 사들였지만 갚을 사람들이 밤새 섬을 떠났다. 종이 뭉치만 남았다.', weight: 'heavy' }] },
             { op: 'timeline', text: '집안의 빚 문서를 사들였다' }] },
    ],
  },
  {
    id: 'pp_parent', kind: 'door', when: at(age(25, 60), st(...ACTIVE), { c: 'lineage', is: ['commoner', 'marineFamily', 'pirateChild', 'outcast'] }),
    weight: 3, repeat: 'once', needs: ['parent'], speaker: 'hero',
    title: '고향에서 온 편지', body: '{town}에서 편지가 왔다. 늙은 부모가 자리에 누워 {name}을(를) 찾는다고 한다.',
    doors: [
      { label: '모든 것을 두고 고향으로 달려간다', hint: '하던 일은 멈춘다', values: { loyalty: D },
        fx: [{ op: 'moveHome' }, { op: 'log', text: '{town}(으)로 달려가 부모의 마지막 숨을 곁에서 지켰다.', weight: 'heavy' },
             { op: 'losePerson', who: 'parent' }, { op: 'timeline', text: '부모의 임종을 지켰다' }] },
      { label: '돌아가지 못한다', hint: '평생 마음에 걸린다', values: { ambition: D },
        fx: [{ op: 'hardship', add: 4 }, { op: 'log', text: '편지를 접어 품에 넣었다. 다음 소식은 부고였다.', weight: 'heavy' },
             { op: 'losePerson', who: 'parent' }] },
      { label: '돌아가 남은 재산부터 셈한다', hint: '임종은 지킨다. 식구들의 눈길이 차갑다', values: { greed: D },
        fx: [{ op: 'moveHome' }, { op: 'money', add: 22000 }, { op: 'losePerson', who: 'parent' }, { op: 'timeline', text: '부모의 임종을 지키고 재산부터 챙겼다' }, { op: 'log', text: '고향집의 상자를 열어 남은 문서를 셌다. 식구들이 임종방 문턱에서 말없이 바라봤다.', weight: 'light' }] },
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
      { label: '불길 속으로 다시 뛰어든다', hint: '둘 다 구할지도 모른다. 몸이 버틸지는 모른다', special: 'justice', values: { ambition: D }, danger: true,
        fx: [{ op: 'injury', severity: 'heavy' }, { op: 'fame', add: 20 }, { op: 'chance', p: 0.35,
          then: [{ op: 'loseLimb', limb: 'random' }, { op: 'log', text: '아이들을 내보낸 뒤 다시 불길로 뛰어들어 동료까지 구했다. 무너지는 들보를 피해 기어 나온 뒤에야 다친 몸을 살폈다. 모두 살아 나왔다.', weight: 'heavy' }],
          else: [{ op: 'log', text: '아이들을 내보낸 뒤 다시 불길로 뛰어들어 동료까지 구했다. 온몸에 큰 상처를 입었지만 모두 살아 나왔다.', weight: 'heavy' }] }] },
    ],
  },
  {
    // 이름 있는 상대를 이기면 ackBattle이 줄에 세운다. 가중치 0: 저절로 뽑히지 않는다
    id: 'after_fight', kind: 'door', when: [], weight: 0, repeat: { years: 0 }, speaker: 'hero',
    title: '쓰러진 적', body: '싸움이 끝났다. 쓰러진 {defeatedFoe}이(가) 피를 흘리며 {name}을(를) 올려다본다. 이 자를 어떻게 할지는 이제 {name}에게 달렸다.',
    doors: [
      { label: '살려서 보내 준다', hint: '언젠가 다시 마주칠지도 모른다', values: { peace: D },
        fx: [{ op: 'log', text: '상대를 일으켜 세워 보내 주었다. 등 뒤에서 이를 가는 소리가 들렸다.', weight: 'light' }] },
      { label: '가진 것을 모두 빼앗는다', hint: '이긴 자의 몫을 챙긴다', values: { greed: D, dominion: D },
        fx: [{ op: 'money', add: 75000 }, { op: 'log', text: '쓰러진 자의 금고를 털었다.', weight: 'light' }] },
      { label: '동료가 되라고 손을 내민다', hint: '어제의 적이 등을 맡길 사람이 될지도 모른다', values: { loyalty: D }, when: [NOT_SQUAD, { c: 'defeatedFoe' }],
        fx: [{ op: 'recruitDefeated' }, { op: 'log', text: '한참을 노려보던 상대가 마침내 손을 잡았다.', weight: 'heavy' }] },
    ],
  },

  // ---------------------------------------------------------------- 돈 · 몸
  {
    id: 'pp_all_in', kind: 'door', when: at(age(18), st(...ACTIVE), { c: 'money', min: ALL_IN_MIN }),
    weight: 1, repeat: { years: 10 }, speaker: { relation: '노름판의 전주' },
    title: '한판 승부', body: '{island} 뒷골목의 노름판. 전주가 웃으며, 가진 것을 전부 걸면 판돈을 크게 쳐 주겠다고 한다.',
    doors: [
      { label: '판을 떠난다', hint: '가진 것은 지킨다', values: { peace: D }, fx: [ { op: 'log', text: '전주가 패를 섞는 동안 자리에서 일어났다. 주머니의 돈은 그대로였다.', weight: 'light' }] },
      { label: '전 재산을 건다', hint: '모두 얻거나 모두 잃는다', values: { ambition: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'money', add: 200000 }, { op: 'log', text: '마지막 패가 뒤집혔다. 노름판의 돈이 모두 {name}의 앞으로 밀려왔다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -100000000 }, { op: 'hardship', add: 4 }, { op: 'log', text: '마지막 패가 뒤집혔다. 빈 주머니로 노름판을 나섰다.', weight: 'heavy' }] }] },
      { label: '전주의 속임수를 꿰뚫고 판을 뒤집는다', hint: '눈치 빠른 사람만 할 수 있다', special: 'inquiry', values: { inquiry: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'fame', add: 2 }, { op: 'log', text: '패가 뒤집히기 전에 전주의 손목을 붙잡았다. 숨긴 패가 소매에서 떨어졌다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_fruit', kind: 'door', when: at(age(12), st('child', ...GROWN), { c: 'fruit', has: false }),
    weight: 2, repeat: 'once', speaker: 'hero',
    title: '소용돌이 무늬의 열매', body: '{island} 시장의 노점 구석에 소용돌이 무늬가 새겨진 열매 하나가 굴러다닌다. 상인은 그게 무엇인지도 모르는 눈치다.',
    doors: [
      { label: '헐값에 사서 그 자리에서 먹는다', hint: '한 번 먹으면 다시는 헤엄칠 수 없다', needs: ['swim'], values: { romance: D }, fx: [{ op: 'eatFruit', id: 'random' }, { op: 'log', text: '열매를 한입 베어 물자 혀가 저렸다. 바닷물 한 방울이 닿자 몸이 무겁게 가라앉았다.', weight: 'light' }] },
      { label: '사 두었다가 비싸게 판다', hint: '알아보는 사람을 만나면 큰돈이 된다. 못 만나면 산 값만 날린다', values: { greed: D }, fx: [{ op: 'money', add: -10000, trade: true }, { op: 'chance', p: 0.6, skillCheck: true, then: [{ op: 'money', add: 165000 }, { op: 'log', text: '열매를 알아본 수집가가 금화 자루를 내밀었다.', weight: 'light' }], else: [{ op: 'log', text: '열매를 알아보는 사람은 끝내 나타나지 않았다. 열매는 썩어 버렸다.', weight: 'light' }] }] },
      { label: '모른 척 지나간다', hint: '수상한 것은 건드리지 않는다', values: { peace: D }, fx: [ { op: 'log', text: '노점 앞을 지나쳤다. 상인은 여전히 열매의 값을 모른 채 손님을 불렀다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pp_prosthetic', kind: 'door', when: at(st('child', ...GROWN), { c: 'limbLost', min: 1, limbs: ['armL', 'armR', 'legL', 'legR'] }),
    weight: 8, repeat: { years: 1 }, speaker: { relation: '의수 장인' },
    title: '기름때 묻은 공방', body: '{island}의 공방에서 기름때 묻은 장인이 {name}이(가) 잃은 자리를 살핀다. 값만 치르면 쓸 만한 것을 달아 주겠다고 한다.',
    doors: [
      { label: '값을 치르고 의수나 의족을 단다', hint: '예전만은 못해도 다시 움직일 수 있다', when: [{ c: 'money', min: PROSTHETIC_COST }], values: { ambition: D },
        fx: [{ op: 'money', add: -PROSTHETIC_COST, trade: true }, { op: 'prosthetic', grade: 'basic' }, { op: 'log', text: '쇠와 가죽으로 만든 것을 달았다. 처음 몇 걸음은 남의 몸 같았다.', weight: 'heavy' }] },
      { label: '잃은 채로 산다', hint: '남은 몸에 익숙해진다', values: { peace: D }, fx: [ { op: 'log', text: '장인의 공방을 나왔다. 남은 몸에 맞춰 끈과 옷매무새를 다시 고쳤다.', weight: 'light' }], closes: true },
    ],
  },

  // ---------------------------------------------------------------- 이름 있는 상대 (바다마다)
  {
    id: 'meet_morgan', kind: 'door', when: at(age(15, 24), st(...HUNTED), sea('east'), beforeHistory('strawHatPoster'), { c: 'ashore' }, { c: 'island', is: ['셸스 타운'] }, { c: 'opponent', canon: 'morgan' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'morgan' },
    title: '도끼손 대령', body: '셸스 타운의 해군 기지. 도끼 손의 대령이 마을 사람들을 처형대 앞에 세워 놓고, 해적 깃발을 단 {name}이(가) 탄 배를 노려본다.',
    doors: [
      fightDoor('대령에게 맞선다', '목숨을 건 싸움이 된다', { freedom: D }, 'b_morgan', READY(1)),
      { label: '마을 사람들을 먼저 빼돌린다', hint: '싸움은 피하지만 쫓긴다', values: { freedom: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 5 }, { op: 'log', text: '밤새 마을 사람들을 배에 태워 옆 섬으로 옮겼다.', weight: 'heavy' }] },
      { label: '닻을 올려 달아난다', hint: '오늘은 등을 보인다. 군함이 따라붙으면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_morgan', lethal: false, forced: false }] , else: [{ op: 'log', text: '군함이 뒤따라오지 않았다. 처형대 앞의 사람들은 배가 떠날 때까지 고개를 들지 못했다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_arlong', kind: 'door', when: at(age(15, 24), st(...LAWFUL), sea('east'), beforeHistory('strawHatPoster'), { c: 'ashore' }, { c: 'island', is: ['코노미 제도', '코코야시 마을'] }, { c: 'opponent', canon: 'arlong' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'arlong' },
    title: '톱상어의 섬', body: '코노미 제도의 마을들이 어인 해적에게 공물을 바치고 있다. 톱니 코의 선장이 {name}을(를) 보고 이빨을 드러낸다.',
    doors: [
      fightDoor('어인 해적에게 맞선다', '목숨을 건 싸움이 된다', { justice: D }, 'b_arlong', READY(2)),
      { label: '뇌물을 받고 눈을 감는다', hint: '주머니는 두둑해지고 마을은 그대로다', values: { greed: D },
        fx: [{ op: 'money', add: 75000 }, { op: 'flag', id: 'tookBribe' }, { op: 'log', text: '공물 자루가 어인선으로 옮겨졌다. 받은 돈을 세는 동안 마을 사람들은 집 문을 닫았다.', weight: 'light' }] },
      { label: '본부에 지원을 요청하고 물러난다', hint: '지원은 언제 올지 모른다. 물러나는 길목을 어인들이 막아설 수도 있다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_arlong', lethal: false, forced: false }] , else: [{ op: 'log', text: '본부에 보낸 전보는 답이 없었다. 어인들의 눈을 피해 뒷길로 빠져나왔다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_smoker', kind: 'door', when: at(age(17), st(...HUNTED), sea('gl_entry'), { c: 'opponent', canon: 'smoker' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'smoker' },
    title: '연기의 추격자', body: '흰 연기가 {island}의 거리를 뒤덮는다. 시가 두 대를 문 해군이 {name}의 앞을 막아선다. 이 바다까지 쫓아왔다.',
    doors: [
      fightDoor('연기 속으로 뛰어든다', '맨손으로는 닿지 않을지도 모른다', { ambition: D }, 'b_smoker', READY(3)),
      duelDoor('목숨은 걸지 않고 겨뤄 본다', '실력만 가늠한다', { loyalty: D }, 'b_smoker', READY(2)),
      { label: '뒷골목으로 달아난다', hint: '연기가 끈질기게 따라온다. 붙잡히면 맞닥뜨린다', values: { freedom: D }, fx: [{ op: 'hp', add: -5 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_smoker', lethal: false, forced: false }] , else: [{ op: 'log', text: '연기가 뒷골목 입구를 지나쳤다. 벽에 기대 숨을 고른 뒤 다른 길로 나왔다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_mr1', kind: 'door', when: at(age(16, 24), st(...LAWFUL, 'revolution'), sea('gl_entry'), beforeHistory('alabastaRain'), { c: 'opponent', canon: 'daz' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'daz' },
    title: '칼날의 사내', body: '{island}의 어둠 속에서 민머리의 사내가 팔을 칼날로 바꾼다. 비밀 결사의 사냥꾼이 {name}을(를) 다음 목표로 정했다.',
    doors: [
      fightDoor('칼날에 맞선다', '온몸이 칼인 상대다', { justice: D }, 'b_mr1', READY(2)),
      { label: '결사의 비밀을 캐내고 빠진다', hint: '싸움 대신 정보를 얻는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'baroqueSecret' }, { op: 'log', text: '결사의 문서에서 다음 목표를 읽었다. 칼날 사내가 돌아오기 전에 골목을 빠져나왔다.', weight: 'light' }] },
      { label: '숨을 죽이고 지나가길 기다린다', hint: '오늘 밤만 넘기면 된다. 들키면 칼날과 마주한다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_mr1', lethal: false, forced: false }] , else: [{ op: 'log', text: '칼날이 골목 반대편으로 지나갔다. 숨을 내쉰 뒤 어둠 속에서 나왔다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_lucci', kind: 'door', when: at(age(18), st(...HUNTED), sea('gl_first'), { c: 'opponent', canon: 'lucci' }),
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
    id: 'meet_crocodile', kind: 'door', when: at(age(16, 24), st(...LAWFUL, 'revolution'), sea('gl_first'), afterHistory('alabastaDrought'), beforeHistory('alabastaRain'), { c: 'ashore' }, { c: 'island', is: ['알라바스타 왕국'] }, { c: 'opponent', canon: 'crocodile' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'crocodile' },
    title: '사막의 왕', body: '모래폭풍 너머, 갈고리 손의 칠무해가 왕국을 삼키려 한다. 그가 {name}을(를) 내려다보며 시가 연기를 내뿜는다.',
    doors: [
      fightDoor('모래의 사내에게 맞선다', '물이 없으면 닿지 않는다', { justice: D }, 'b_crocodile', READY(3)),
      { label: '그의 음모를 왕국에 알린다', hint: '수비대가 성문 밖 주민들을 대피시킨다', values: { inquiry: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'log', text: '서쪽 성문에 비밀 결사의 문서를 전했다. 수비대가 피난민을 안으로 들이고 빗장을 걸었다. 멀리 광장에서는 포성이 계속됐다.', weight: 'heavy' }] },
      { label: '모래바람을 피해 떠난다', hint: '이 나라의 일은 이 나라에 맡긴다. 모래가 발목을 잡으면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_crocodile', lethal: false, forced: false }] , else: [{ op: 'log', text: '모래폭풍 뒤로 갈고리 손의 그림자가 사라졌다. 왕국의 성문이 닫히기 전에 길을 떠났다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_kizaru', kind: 'door', when: at(age(18), st(...HUNTED), sea('sabaody'), { c: 'opponent', canon: 'kizaru' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'kizaru' },
    title: '빛의 대장', body: '{island}의 하늘이 눈부시게 번쩍인다. 느릿한 말투의 해군 대장이 {name} 앞에 빛으로 내려선다. 빛보다 빠른 발차기가 날아온다.',
    doors: [
      fightDoor('빛에 맞선다', '해군 대장이다. 살아남을 수 있을지 모른다', { ambition: D }, 'b_darc', READY(4)),
      { label: '동료들을 흩어지게 하고 달아난다', hint: '다시 모일 수 있을지는 모른다', needs: ['crew'], values: { loyalty: D },
        fx: [{ op: 'hp', add: -25 }, { op: 'hardship', add: 6 }, { op: 'log', text: '빛이 쏟아지는 섬에서 동료들과 흩어져 달아났다.', weight: 'heavy' }] },
      { label: '숨어서 대장이 떠나기를 기다린다', hint: '숨소리도 내지 않는다. 빛이 숨은 곳을 비추면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'hp', add: -5 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_darc', lethal: false, forced: false }] , else: [{ op: 'log', text: '빛이 숨은 자리 옆을 스쳤다. 대장의 발소리가 멀어진 뒤 골목을 빠져나왔다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_hody', kind: 'door', when: at(age(18, 26), st(...SEAFARING), sea('sabaody'), beforeHistory('fishmanPact'), { c: 'ashore' }, { c: 'island', is: ['어인섬', '어인가', '류구 왕국', '바다의 숲'] }, { c: 'opponent', canon: 'hody' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'hody' },
    title: '바다 밑의 증오', body: '어인섬의 광장. 붉은 약에 취한 어인이 인간을 몰아내자고 외친다. 핏발 선 눈이 {name}에게 꽂힌다.',
    doors: [
      fightDoor('광장 한가운데서 맞선다', '섬 사람들이 지켜본다', { justice: D }, 'b_hody', READY(3)),
      duelDoor('목숨은 걸지 않고 막아선다', '쓰러뜨리기보다 멈추게 한다', { justice: D }, 'b_hody', READY(2)),
      { label: '섬을 빠져나간다', hint: '바다 밑의 일은 바다 밑에 맡긴다. 붉은 눈이 뒤쫓아 오면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_hody', lethal: false, forced: false }] , else: [{ op: 'log', text: '붉은 약에 취한 어인들이 광장에 남았다. {name}의 배는 바다 밑 길을 벗어났다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_fujitora', kind: 'door', when: at(age(19), st(...HUNTED), sea('nw_first'), afterHistory('punkDuel'), { c: 'opponent', canon: 'fujitora' }),
    weight: 3, repeat: { years: 8 }, speaker: { canon: 'fujitora' },
    title: '눈 감은 대장', body: '{island}의 하늘에서 운석이 떨어진다. 눈을 감은 해군 대장이 지팡이 칼을 짚고 {name}의 기척을 읽는다.',
    doors: [
      fightDoor('운석 아래서 맞선다', '하늘을 끌어내리는 상대다', { ambition: D }, 'b_fujitora', READY(5)),
      { label: '주사위 한 판으로 승부를 청한다', hint: '대장은 도박을 좋아한다', values: { romance: D },
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'fame', add: 20 }, { op: 'log', text: '주사위가 {name}의 편을 들었다. 대장은 웃으며 칼을 거두었다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'log', text: '주사위가 등을 돌렸다. 땅이 꺼지는 틈에 겨우 빠져나왔다.', weight: 'heavy' }] }] },
      { label: '중력에 짓눌리기 전에 달아난다', hint: '땅이 무너져 내린다. 기척을 읽히면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'hp', add: -15 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_fujitora', lethal: false, forced: false }] , else: [{ op: 'log', text: '땅이 내려앉는 틈에 골목 밖으로 나왔다. 지팡이 칼의 소리가 뒤에서 멀어졌다.', weight: 'light' }]}] },
    ],
  },
  // 신세계 전반에서 쫓기는 사람이 만나는 다른 원작 인물들 (눈 감은 대장만 되풀이되지 않게)
  {
    id: 'meet_sabo_colosseum', kind: 'door', when: at(age(19, 26), st(...HUNTED), sea('nw_first'), afterHistory('fishmanPact'), beforeHistory('dressrosaFree'), { c: 'ashore' }, { c: 'island', is: ['드레스로자'] }, { c: 'opponent', canon: 'sabo' }),
    weight: 3, repeat: 'once', speaker: { canon: 'sabo' },
    title: '투기장의 불꽃', body: '{island}의 투기장에서 실크해트를 쓴 사내가 불꽃을 두르고 서 있다. 사내는 {name}을(를) 흘끗 보더니, 이 나라를 뒤집을 거라며 손을 내민다. 바깥에서 해군의 함대가 섬을 둘러싼다.',
    doors: [
      { label: '손을 잡고 나라를 뒤집는 데 끼어든다', hint: '혁명군과 한편이 된다. 해군의 눈에 이름이 남는다', values: { justice: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 15 }, { op: 'person', kind: 'ally', relation: '실크해트의 혁명가', canon: 'sabo' }, { op: 'timeline', text: '투기장에서 혁명군의 사보와 함께 싸웠다', canon: 'sabo' }, { op: 'log', text: '불꽃이 함대의 시선을 끌었다. 혁명군이 건넨 지도를 들고 사람들을 경기장 밖으로 이끌었다.', weight: 'light' }] },
      { label: '불꽃이 시선을 끄는 틈에 투기장의 상금을 챙긴다', hint: '큰돈이 된다. 해군과 혁명군 모두 그 얼굴을 기억한다', values: { greed: D },
        fx: [{ op: 'money', add: 90000 }, { op: 'timeline', text: '사보의 불꽃이 투기장을 삼킨 날 상금을 챙겨 달아났다', canon: 'sabo' }, { op: 'log', text: '상금 상자를 들고 뒷문으로 빠졌다. 투기장 사람들은 해군과 혁명군 사이를 뛰었다.', weight: 'light' }] },
      { label: '남의 싸움이라며 섬을 빠져나간다', hint: '포위망이 좁혀지기 전에 떠난다', values: { freedom: D }, fx: [{ op: 'timeline', text: '불꽃의 혁명가를 등지고 섬을 떠났다', canon: 'sabo' }, { op: 'log', text: '해군의 포위망이 닫히기 전 배를 띄웠다. 투기장 위 불꽃은 오래 보였다.', weight: 'light' }] },
    ],
  },
  {
    id: 'meet_tsuru', kind: 'door', when: at(age(19), st(...HUNTED), sea('nw_first', 'sabaody'), { c: 'opponent', canon: 'tsuru' }),
    weight: 3, repeat: { years: 8 }, speaker: { canon: 'tsuru' },
    title: '빨래하는 중장', body: '{island} 앞바다에 군함 한 척이 닻을 내렸다. 갑판의 노파가 빨래판을 들고, 너 같은 녀석들은 한 번 빨아서 널어야 정신을 차린다며 웃는다. 노련한 함대가 퇴로를 막는다.',
    doors: [
      { label: '노파와 마주 앉아 말로 풀어 본다', hint: '해군에서 가장 오래 산 머리다. 무엇을 내주게 될지 모른다', values: { inquiry: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 5 }, { op: 'log', text: '노파는 차 한 잔을 다 마시고는, 다음에 보면 빨아 버리겠다며 함대를 물렸다.', weight: 'heavy' }],
          else: [{ op: 'money', add: -20000 }, { op: 'log', text: '노파와 말을 섞을수록 내줄 것만 늘었다. 배의 금고가 가벼워졌다.', weight: 'heavy' }] },
          { op: 'timeline', text: '해군의 츠루 중장과 마주 앉았다', canon: 'tsuru' }] },
      { label: '안개를 틈타 퇴로를 뚫는다', hint: '함대 사이를 빠져나간다. 몇 발은 맞는다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'timeline', text: '츠루 중장의 함대를 뚫고 달아났다', canon: 'tsuru' }, { op: 'log', text: '안개 속 군함 사이를 가로질렀다. 포탄 몇 발이 선미를 스쳤지만 항로가 열렸다.', weight: 'light' }] },
      { label: '부하들을 미끼로 남기고 혼자 달아난다', hint: '혼자는 산다. 남은 이들은 빨래판 앞에 선다', values: { greed: D }, needs: ['crew'],
        fx: [{ op: 'hardship', add: 2 }, { op: 'personChange', who: 'crew', kind: 'rival', rename: '함대 앞에 남겨진 동료' }, { op: 'timeline', text: '츠루 중장의 함대 앞에 부하들을 두고 달아났다', canon: 'tsuru' }, { op: 'log', text: '부하들의 배가 함대 앞에 남았다. 혼자 빠져나온 뒤 빈 갑판을 오래 봤다.', weight: 'light' }] },
    ],
  },
  {
    id: 'meet_ryokugyu', kind: 'door', when: at(age(22), st(...HUNTED), sea('nw_first', 'nw_late'), { c: 'opponent', canon: 'ryokugyu' }),
    weight: 3, repeat: { years: 8 }, speaker: { canon: 'ryokugyu' },
    title: '숲이 된 섬', body: '하룻밤 사이 {island}의 거리가 숲으로 뒤덮였다. 나무 위에 걸터앉은 해군 대장이 하품을 하며, 사흘을 굶었더니 배가 고프다고 한다. 뿌리가 발목을 감아 온다.',
    doors: [
      { label: '뿌리를 끊고 숲을 불태우며 달아난다', hint: '섬 사람들의 집도 함께 탄다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 1 }, { op: 'timeline', text: '숲이 된 섬에서 녹우 대장을 피해 달아났다', canon: 'ryokugyu' }, { op: 'log', text: '뿌리에 불이 붙자 숲이 갈라졌다. 빠져나온 뒤 섬 사람들의 집에서도 연기가 올랐다.', weight: 'light' }] },
      { label: '섬 사람들을 이끌고 땅속 수로로 빠져나간다', hint: '다 같이 나간다. 오래 걸린다', values: { justice: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 5 }, { op: 'timeline', text: '숲이 된 섬에서 사람들을 이끌고 빠져나왔다', canon: 'ryokugyu' }, { op: 'log', text: '땅속 수로에서 사람들을 하나씩 끌어올렸다. 마지막 사람이 나오자 입구가 뿌리로 막혔다.', weight: 'light' }] },
      { label: '배고프다는 대장에게 먹을 것을 바치고 지나간다', hint: '대장은 먹는 동안 눈을 감는다. 다시 만나면 모른다', values: { peace: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'timeline', text: '녹우 대장에게 먹을 것을 바치고 지나갔다', canon: 'ryokugyu' }, { op: 'log', text: '대장이 음식을 먹는 동안 뿌리가 움직임을 멈췄다. 그 사이 조용히 골목을 지났다.', weight: 'light' }] },
    ],
  },
  {
    id: 'meet_doflamingo', kind: 'door', when: at(age(17, 26), st('civil', 'shipwright', 'settled', ...SEAFARING), sea('nw_first'), afterHistory('fishmanPact'), beforeHistory('dressrosaFree'), { c: 'ashore' }, { c: 'island', is: ['드레스로자'] }, { c: 'opponent', canon: 'doflamingo' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'doflamingo' },
    title: '하늘의 악마', body: '드레스로자의 하늘에 실로 엮은 새장이 내려온다. 분홍 깃털 외투의 왕이 웃으며 {name}을(를) 꼭두각시로 만들려 한다.',
    doors: [
      fightDoor('새장 안에서 왕에게 맞선다', '실이 온몸을 노린다', { justice: D }, 'b_doflamingo', READY(5)),
      { label: '지하의 저항군과 손잡는다', hint: '싸움보다 사람들을 빼내는 쪽을 맡는다', values: { inquiry: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '지하 저항군' }, { op: 'fame', add: 10 }, { op: 'log', text: '저항군이 지하 통로를 열었다. 새장 안의 사람들을 차례로 빼냈다.', weight: 'light' }] },
      { label: '실이 닿기 전에 섬을 떠난다', hint: '새장 밖으로 빠져나간다. 실에 걸리면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_doflamingo', lethal: false, forced: false }] , else: [{ op: 'log', text: '실이 닿기 전에 선미가 새장 밖으로 나왔다. 뒤에서는 섬의 지붕들이 좁혀졌다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_akainu', kind: 'door', when: at(age(19), st(...HUNTED), sea('nw_late'), afterHistory('punkDuel'), { c: 'opponent', canon: 'akainu' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'akainu' },
    title: '마그마의 원수', body: '바다가 끓어오른다. 철저한 정의를 외치는 해군의 정점이 마그마의 주먹을 들고 {name}이(가) 탄 배를 막아선다.',
    doors: [
      fightDoor('마그마에 맞선다', '이 산을 넘으면 바다의 정점이 보인다', { ambition: D }, 'b_akainu', READY(6)),
      { label: '배를 버리고 바다 밑으로 피한다', hint: '배는 잃어도 목숨은 남는다', needs: ['swim'], values: { peace: D },
        fx: [{ op: 'hp', add: -25 }, { op: 'money', add: -100000 }, { op: 'log', text: '배가 불기둥에 삼켜졌다. 바다 밑으로 숨어 겨우 살아남았다.', weight: 'heavy' }] },
      { label: '동료들을 먼저 보내고 혼자 시간을 번다', hint: '돌아오지 못할 수도 있다', needs: ['crew'], values: { loyalty: D }, danger: true,
        fx: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -40 }, { op: 'fame', add: 50 }, { op: 'chance', p: 0.3, then: [{ op: 'loseLimb', limb: 'random' }, { op: 'log', text: '동료들의 배가 벗어나는 동안 마그마가 남은 몸을 덮쳤다. 살아 돌아왔지만 한쪽을 잃었다.', weight: 'light' }] , else: [{ op: 'log', text: '동료들의 배가 벗어나는 동안 마그마를 홀로 막았다. 상처를 안고 겨우 뒤따랐다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'meet_kaido', kind: 'door', when: at(age(17, 30), st(...LAWFUL, 'pirate', 'revolution'), sea('nw_late'), beforeHistory('wanoFree'), { c: 'ashore' }, { c: 'island', is: ['와노쿠니', '하나노미야코', '쿠리', '에비스 마을'] }, { c: 'opponent', canon: 'kaido' }),
    weight: 8, repeat: { years: 5 }, speaker: { canon: 'kaido' },
    title: '가장 강한 생물', body: '와노쿠니의 하늘을 푸른 용이 가른다. 세상에서 가장 강하다는 사황이 술병을 기울이며 {name}을(를) 내려다본다.',
    doors: [
      fightDoor('용에게 맞선다', '세상에서 가장 강한 상대다', { dominion: D }, 'b_kaido', READY(6)),
      duelDoor('목숨은 걸지 않고 한 수 청한다', '사황은 강한 자를 반긴다', { ambition: D }, 'b_kaido', READY(5)),
      { label: '사무라이들 사이에 숨는다', hint: '때가 올 때까지 기다린다. 용의 눈에 띄면 맞닥뜨린다', values: { peace: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fight', foe: 'b_kaido', lethal: false, forced: false }] , else: [{ op: 'log', text: '사무라이들의 행렬 속에 몸을 숨겼다. 푸른 용이 지나간 뒤에야 다시 숨을 쉬었다.', weight: 'light' }]}] },
    ],
  },
];
