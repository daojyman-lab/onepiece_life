// 인생의 길 (설계 5.5, 5.6): 처지를 바꾸는 문과 바다를 옮기는 문. 로그타운에서 태어난 사람에게 열린다.
// 처지마다 열리는 길이 다르다. 감옥에 갇힌 사람에게는 감옥의 전환점만 열린다 (모든 문에 처지 조건이 있다).
// 바다는 보스를 이겨서가 아니라 표류 · 납치 · 징집 · 배를 얻음 · 원작 인물을 따라감 같은 일로 바뀐다.
// 원작 인물은 주인공의 나이에 맞춰 나온다 (주인공 열일곱 살 무렵이 원작의 시작).
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import type { Cond, SeaId, Standing, Turning } from '../../core/types';

const D = V.value.door;
/** 정점: 현상금 30억 (해군은 같은 크기의 공적) */
const APEX_FAME = 3_000_000_000 / V.fame.bounty;
/** 칠무해 제의: 현상금 3억 */
const WARLORD_FAME = 300_000_000 / V.fame.bounty;
/** CP 발탁: 공적 3천만 */
const CP_FAME = 30_000_000 / V.fame.bounty;
const ACADEMY_FEE = 100000;
const SHOP_COST = 100000;
const DRAFT_EXEMPT = 50000;

/** 아이도 죄수도 아닌 사람 */
export const GROWN: Standing[] = ['civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'retired'];
/** 아직 한창인 사람 (은퇴하지 않은 어른) */
export const ACTIVE: Standing[] = GROWN.filter((x) => x !== 'retired');
/** 바다를 떠도는 처지 */
export const SEAFARING: Standing[] = ['pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp'];
/** 해적과 손잡지 않는 쪽 (이름 있는 해적과 맞서는 사람) */
export const LAWFUL: Standing[] = ['marine', 'cp', 'bountyHunter'];
/** 해군에 쫓기는 쪽 (이름 있는 해군과 맞서는 사람) */
export const HUNTED: Standing[] = ['pirate', 'revolution'];
const ALL_SEAS_BUT_EAST: SeaId[] = ['west', 'north', 'south', 'gl_entry', 'gl_first', 'sabaody', 'nw_first', 'nw_late'];
const BLUES: SeaId[] = ['east', 'west', 'north', 'south'];

/** 로그타운에서 태어난 사람 + 조건들 */
export const at = (...c: Cond[]): Cond[] => [{ c: 'home', is: ['loguetown'] }, ...c];
export const st = (...is: Standing[]): Cond => ({ c: 'standing', is });
export const age = (min?: number, max?: number): Cond => ({ c: 'age', min, max });
export const sea = (...is: SeaId[]): Cond => ({ c: 'sea', is });

export const PATHS: Turning[] = [
  // ---------------------------------------------------------------- 해적
  {
    id: 'path_pirate_taken', kind: 'door', when: at(age(15, 30), st('child', 'civil', 'settled', 'shipwright'), sea('east')),
    weight: 6, repeat: 'once', speaker: 'hero',
    title: '해적에게 붙잡히다', body: '{island} 앞바다에서 해적선이 고깃배를 덮쳤다. 선장이 {name}의 멱살을 움켜쥐고, 마침 일손이 모자랐다며 웃는다.',
    doors: [
      { label: '끌려가 선원이 된다', hint: '돌아갈 길은 당분간 없다', values: { romance: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'log', text: '해적선의 막내 선원이 되었다. 갑판을 닦으며 바다를 배운다.', weight: 'heavy' },
             { op: 'timeline', text: '해적선에 끌려가 선원이 되었다' }] },
      { label: '해군에 밀고하고 빠져나온다', hint: '해적들이 원한을 품는다', values: { justice: D },
        fx: [{ op: 'fame', add: 2 }, { op: 'flag', id: 'piratesGrudge' }, { op: 'log', text: '해군 순찰선이 해적선을 덮쳤다. {name}은(는) 그 틈에 빠져나왔다.', weight: 'heavy' }] },
      { label: '바다에 뛰어든다', hint: '헤엄쳐 돌아갈 수 있을지는 모른다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7,
               then: [{ op: 'hp', add: -15 }, { op: 'log', text: '밤새 헤엄친 끝에 {island}의 바위틈에 닿았다.', weight: 'heavy' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -30 }, { op: 'log', text: '암초에 부딪혀 크게 다친 채 겨우 뭍에 기어올랐다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'path_pirate_sail', kind: 'door', when: at(age(16, 35), st('child', 'civil', 'settled', 'shipwright', 'bountyHunter')),
    weight: 6, repeat: 'once', speaker: 'hero',
    title: '깃발을 올리다', body: '{island} 부두에 낡은 배 한 척이 헐값에 나왔다. 해골 깃발 하나만 그려 넣으면 내일이라도 바다로 나갈 수 있다.',
    doors: [
      { label: '배를 사서 해골 깃발을 올린다', hint: '오늘부터 쫓기는 몸이 된다', values: { freedom: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'standing', to: 'pirate' }, { op: 'flag', id: 'captain' },
             { op: 'log', text: '낡은 돛대 끝에 직접 그린 해골 깃발이 펄럭였다.', weight: 'heavy' }, { op: 'timeline', text: '해적 깃발을 올렸다' }] },
      { label: '이름난 해적선에 견습으로 오른다', hint: '남의 깃발 아래서 바다를 배운다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'person', kind: 'ally', relation: '모시는 해적 선장' }, { op: 'timeline', text: '해적선의 견습 선원이 되었다' }] },
      { label: '바다는 꿈으로만 둔다', hint: '뭍에서의 삶이 이어진다', values: { peace: D }, fx: [] },
      { label: '부두의 건달들을 모아 선단을 꾸린다', hint: '처음부터 우두머리로 바다에 나선다', special: 'dominion', values: { dominion: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'flag', id: 'captain' }, { op: 'fame', add: 10 },
             { op: 'person', kind: 'crew', relation: '부두 건달 출신 선원' }, { op: 'timeline', text: '건달들을 이끌고 해적이 되었다' }] },
    ],
  },
  {
    id: 'path_raid', kind: 'door', when: at(st('pirate', 'warlord'), age(16)),
    weight: 5, repeat: { years: 3 }, speaker: 'hero',
    title: '수평선의 상선', body: '망루에서 고함이 울린다. 짐을 가득 실은 상선이 호위도 없이 {island} 쪽으로 느릿느릿 움직이고 있다.',
    doors: [
      { label: '상선을 덮친다', hint: '현상금이 오른다', values: { dominion: D },
        fx: [{ op: 'money', add: 60000 }, { op: 'fame', add: 30 }, { op: 'log', text: '상선의 짐칸을 털었다. 수배서의 숫자가 또 올랐다.', weight: 'heavy' }] },
      { label: '그냥 보내 준다', hint: '배고픈 선원들이 투덜댄다', values: { peace: D }, fx: [] },
      { label: '상선을 노리는 다른 해적을 쫓아낸다', hint: '상인들에게 이름이 알려진다', values: { justice: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 15 }, { op: 'money', add: 20000 }] },
      { label: '사황의 깃발을 단 배를 건드린다', hint: '신세계 전체가 그 이름을 알게 된다', when: [sea('nw_first', 'nw_late')], values: { ambition: D }, danger: true,
        fx: [{ op: 'fame', add: 300 }, { op: 'hp', add: -30 }, { op: 'injury', severity: 'heavy' },
             { op: 'log', text: '사황의 보급선을 털었다. 그날로 세상의 모든 신문에 {name}의 얼굴이 실렸다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'path_warlord', kind: 'door', when: at(st('pirate'), { c: 'fame', min: WARLORD_FAME }),
    weight: 8, repeat: 'once', speaker: { relation: '세계 정부의 사자' },
    title: '칠무해 제의', body: '세계 정부의 사자가 {island}에 정박한 {name}의 배에 올랐다. 현상금을 거두는 대신, 정부의 깃발 아래로 들어오라는 제의다.',
    doors: [
      { label: '제의를 받아들인다', hint: '쫓기지 않는 대신 목줄이 채워진다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'warlord' }, { op: 'fame', add: 100 }, { op: 'timeline', text: '왕의 칠무해가 되었다' }] },
      { label: '사자를 바다에 던져 버린다', hint: '정부 전체를 적으로 돌린다', values: { freedom: D },
        fx: [{ op: 'fame', add: 50 }, { op: 'flag', id: 'govEnemy' }, { op: 'log', text: '사자는 바다에 빠진 채 욕을 퍼부었다. 현상금이 껑충 뛰었다.', weight: 'heavy' }] },
      { label: '받아들이되 정부를 발판으로 쓴다', hint: '목줄을 쥔 손을 언젠가 물어뜯는다', special: 'dominion', values: { dominion: D },
        fx: [{ op: 'standing', to: 'warlord' }, { op: 'fame', add: 150 }, { op: 'flag', id: 'warlordSchemer' }, { op: 'timeline', text: '칠무해의 자리를 발판으로 삼았다' }] },
    ],
  },
  {
    id: 'path_apex_pirate', kind: 'door', when: at(st('pirate', 'warlord'), { c: 'fame', min: APEX_FAME }, { c: 'flag', id: 'apex', has: false }),
    weight: 20, repeat: 'once', speaker: 'hero',
    title: '바다의 정점', body: '{name}의 현상금이 세상에서 가장 높은 자리에 닿았다. 바다 위의 모든 깃발이 그 이름 앞에서 머뭇거린다.',
    doors: [
      { label: '바다의 왕좌에 앉는다', hint: '세상이 그 이름을 해적왕이라 부른다', values: { ambition: D },
        fx: [{ op: 'flag', id: 'apex' }, { op: 'flag', id: 'pirateKing' }, { op: 'fame', add: 500 },
             { op: 'log', text: '세상은 {name}을(를) 해적왕이라 불렀다.', weight: 'heavy' }, { op: 'timeline', text: '바다의 정점에 섰다' }] },
      { label: '왕관 대신 수평선을 고른다', hint: '이름만 남기고 끝없는 항해를 계속한다', values: { freedom: D },
        fx: [{ op: 'flag', id: 'apex' }, { op: 'log', text: '가장 높은 이름을 얻고도 {name}은(는) 왕좌에 앉지 않았다. 배는 다시 수평선을 향했다.', weight: 'heavy' },
             { op: 'timeline', text: '정점에 닿고도 항해를 계속했다' }] },
    ],
  },

  // ---------------------------------------------------------------- 해군과 정부
  {
    id: 'path_marine_join', kind: 'door', when: at(age(15, 25), st('child', 'civil')),
    weight: 7, repeat: 'once', speaker: { relation: '해군 모병관' },
    title: '해군 모병', body: '{island} 광장에 해군 모병 천막이 섰다. 모병관이 지원서를 내밀며, 사관학교에 갈 사람은 따로 줄을 서라고 한다.',
    doors: [
      { label: '말단 수병으로 지원한다', hint: '바닥부터 구른다', values: { justice: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'log', text: '흰 제복을 받았다. 말단 수병의 하루가 시작되었다.', weight: 'heavy' }, { op: 'timeline', text: '해군에 입대했다' }] },
      { label: '입학금을 내고 사관학교에 들어간다', hint: '장교의 길이 열린다', when: [{ c: 'money', min: ACADEMY_FEE }], values: { ambition: D },
        fx: [{ op: 'money', add: -ACADEMY_FEE }, { op: 'standing', to: 'marine' }, { op: 'rank', add: 1 },
             { op: 'master', name: '사관학교 교관', branch: 'sword', cap: 4, years: 3, paid: true }, { op: 'timeline', text: '해군 사관학교에 들어갔다' }] },
      { label: '가문의 추천장으로 사관학교에 들어간다', hint: '아버지의 이름이 문을 열어 준다', when: [{ c: 'lineage', is: ['marineFamily'] }], values: { loyalty: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'rank', add: 1 },
             { op: 'master', name: '사관학교 교관', branch: 'sword', cap: 4, years: 3, paid: true }, { op: 'timeline', text: '가문의 추천으로 사관학교에 들어갔다' }] },
      { label: '지원서를 구겨 버린다', hint: '누구의 명령도 받지 않는다', values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'path_smoker', kind: 'door', when: at(age(14, 17), st('child', 'civil'), sea('east')),
    weight: 6, repeat: 'once', speaker: { canon: '스모커' },
    title: '흰 연기의 대령', body: '시가 두 대를 문 해군 대령이 {island} 뒷골목에서 {name}을(를) 불러 세운다. 건달 셋을 혼자 쫓아내는 걸 봤다고 한다.',
    doors: [
      { label: '그의 부대에 들어간다', hint: '거칠지만 곧은 상관을 얻는다', values: { justice: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'person', kind: 'ally', relation: '상관', name: '스모커', canon: 'smoker' },
             { op: 'timeline', text: '스모커 대령의 부대에 들어갔다' }] },
      { label: '고개만 꾸벅하고 돌아선다', hint: '연기 냄새만 남는다', values: { freedom: D }, fx: [] },
      { label: '부대 대신 그의 주먹을 배우고 싶다고 조른다', hint: '한동안 귀찮게 따라다닌다', values: { ambition: D },
        fx: [{ op: 'mastery', branch: 'fist', add: 15 }, { op: 'person', kind: 'ally', relation: '연기 냄새의 대령', name: '스모커', canon: 'smoker' }] },
    ],
  },
  {
    id: 'path_conscript', kind: 'door', when: at(age(16, 30), st('civil'), sea('east')),
    weight: 2, repeat: 'once', speaker: { relation: '해군 징집관' },
    title: '징집령', body: '큰 전쟁이 가깝다는 소문과 함께 {island}에 징집령이 내려왔다. 성한 젊은이는 모두 해군 본부 근처의 군영으로 보낸다고 한다.',
    doors: [
      { label: '징집에 응한다', hint: '먼 바다의 군영으로 실려 간다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
             { op: 'log', text: '징집선에 실려 몇 개의 바다를 건너뛰었다. 눈을 뜨니 샤본디 제도의 군영이었다.', weight: 'heavy' },
             { op: 'timeline', text: '징집되어 샤본디 제도로 실려 갔다' }] },
      { label: '산으로 숨어든다', hint: '징집관의 명단에 이름이 남는다', values: { freedom: D }, fx: [{ op: 'flag', id: 'draftDodger' }] },
      { label: '돈을 내고 빠진다', hint: '돈으로 면제를 산다', when: [{ c: 'money', min: DRAFT_EXEMPT }], values: { peace: D },
        fx: [{ op: 'money', add: -DRAFT_EXEMPT }] },
    ],
  },
  {
    id: 'path_patrol', kind: 'door', when: at(st('marine', 'cp', 'bountyHunter'), age(16)),
    weight: 5, repeat: { years: 3 }, speaker: 'hero',
    title: '해적 소탕', body: '{island} 근해에 해적선이 나타났다는 보고가 들어왔다. 마을 사람들이 부두에 모여 불안하게 바다를 본다.',
    doors: [
      { label: '앞장서서 해적선에 오른다', hint: '공을 세우면 이름이 오른다', values: { justice: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 30 }, { op: 'money', add: 30000 }, { op: 'log', text: '해적선을 붙잡아 끌고 왔다. 부두에서 박수가 터졌다.', weight: 'heavy' }] },
      { label: '항구를 지키며 기다린다', hint: '싸움은 남이 한다', values: { peace: D }, fx: [] },
      { label: '해적들을 몰래 놓아준다', hint: '들키면 끝장이다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.8, then: [{ op: 'flag', id: 'letPiratesGo' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '해적을 놓아준 것이 들켰다. 제복을 벗기고 감옥에 가두었다.', weight: 'heavy' }] }] },
      { label: '사황의 부하를 쫓아 깊이 들어간다', hint: '신세계에 이름이 울린다', when: [sea('nw_first', 'nw_late')], values: { ambition: D }, danger: true,
        fx: [{ op: 'fame', add: 300 }, { op: 'hp', add: -30 }, { op: 'injury', severity: 'heavy' },
             { op: 'log', text: '사황의 간부를 붙잡아 왔다. 해군 본부가 {name}의 이름을 기억했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'path_cp', kind: 'door', when: at(st('marine'), age(20, 40), { c: 'fame', min: CP_FAME }),
    weight: 5, repeat: 'once', speaker: { relation: '정부의 감찰관' },
    title: '존재하지 않는 기관', body: '이름 없는 감찰관이 {name}을(를) 밀실로 부른다. 존재하지 않는 기관에서 일해 보지 않겠느냐고, 무엇을 보든 입을 다물 수 있겠느냐고.',
    doors: [
      { label: '어둠 속의 첩보원이 된다', hint: '이름을 지우고 명령만 따른다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'cp' }, { op: 'master', name: '첩보 기관의 교관', branch: 'fist', cap: 4, years: 4, paid: false },
             { op: 'timeline', text: '정부의 첩보 기관에 들어갔다' }] },
      { label: '바다의 해군으로 남는다', hint: '제복을 입은 채로 싸운다', values: { justice: D }, fx: [] },
      { label: '밀실에서 들은 것을 신문사에 흘린다', hint: '정부의 눈 밖에 난다', values: { freedom: D }, danger: true,
        fx: [{ op: 'standing', to: 'civil' }, { op: 'flag', id: 'govEnemy' }, { op: 'fame', add: 20 },
             { op: 'log', text: '신문에 정부의 비밀이 실렸다. {name}은(는) 제복을 벗고 쫓기는 몸이 되었다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'path_apex_marine', kind: 'door', when: at(st('marine', 'cp'), { c: 'fame', min: APEX_FAME }, { c: 'flag', id: 'apex', has: false }),
    weight: 20, repeat: 'once', speaker: { relation: '해군 본부' },
    title: '정의의 정점', body: '{name}의 공적이 해군 역사상 가장 높은 자리에 닿았다. 본부의 전령이 원수의 망토를 들고 찾아온다.',
    doors: [
      { label: '원수의 망토를 걸친다', hint: '바다의 모든 해군이 그 명령을 따른다', values: { justice: D },
        fx: [{ op: 'flag', id: 'apex' }, { op: 'rank', add: 3 }, { op: 'fame', add: 500 },
             { op: 'log', text: '{name}은(는) 해군의 정점에 섰다.', weight: 'heavy' }, { op: 'timeline', text: '해군 원수가 되었다' }] },
      { label: '망토를 돌려보내고 현장에 남는다', hint: '자리는 사양해도 이름은 남는다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'apex' }, { op: 'log', text: '원수의 자리를 사양했다. 그래도 바다는 {name}을(를) 해군의 정점으로 기억했다.', weight: 'heavy' },
             { op: 'timeline', text: '정점에 닿고도 현장에 남았다' }] },
    ],
  },

  // ---------------------------------------------------------------- 혁명군 · 현상금 사냥꾼 · 조선공
  {
    id: 'path_rev_dragon', kind: 'door', when: at(age(17, 18), st('child', 'civil', 'pirate'), sea('east')),
    weight: 5, repeat: 'once', speaker: { canon: '드래곤' },
    title: '폭풍 속의 사내', body: '처형대에 벼락이 떨어지던 날, 망토를 두른 사내가 비에 젖은 {name}에게 말을 건다. 이 세상이 왜 이 모양인지 궁금하지 않느냐고.',
    doors: [
      { label: '사내를 따라간다', hint: '세상의 뒤편으로 들어간다. 돌아올 수 없다', values: { justice: D },
        fx: [{ op: 'standing', to: 'revolution' }, { op: 'person', kind: 'ally', relation: '망토의 사내', name: '드래곤', canon: 'dragon' },
             { op: 'timeline', text: '폭풍 속의 사내를 따라 혁명군이 되었다' }] },
      { label: '무슨 소리냐며 뿌리친다', hint: '빗속에 사내가 사라진다', values: { peace: D }, fx: [] },
      { label: '세상의 비밀을 묻는다', hint: '대답 대신 오래된 책 한 권을 받는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'dragonBook' }] },
    ],
  },
  {
    id: 'path_rev_turn', kind: 'door', when: at(age(19, 55), st('marine', 'pirate', 'civil', 'bountyHunter', 'cp', 'shipwright', 'settled')),
    weight: 3, repeat: 'once', speaker: { relation: '혁명군 밀사' },
    title: '전향의 밤', body: '{island}의 허름한 여관방. 혁명군 밀사가 {name} 앞에 지도 한 장을 펼친다. 바다 건너 왕국 하나가 백성을 굶겨 죽이고 있다고.',
    doors: [
      { label: '밀사의 손을 잡는다', hint: '지금까지의 처지를 모두 버린다', values: { justice: D },
        fx: [{ op: 'standing', to: 'revolution' }, { op: 'timeline', text: '혁명군으로 돌아섰다' }] },
      { label: '밀사를 해군에 넘긴다', hint: '공을 세우지만 뒷맛이 쓰다', values: { ambition: D }, fx: [{ op: 'fame', add: 20 }] },
      { label: '못 들은 걸로 하고 돌려보낸다', hint: '아무 일도 없었던 밤이 된다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'path_bounty', kind: 'door', when: at(age(17, 40), st('civil', 'pirate', 'settled', 'shipwright')),
    weight: 4, repeat: 'once', speaker: { relation: '현상금 사냥꾼' },
    title: '수배서를 뗀 손', body: '{island} 해군 지부 게시판 앞에서 칼을 찬 사냥꾼이 수배서 한 장을 떼어 낸다. 둘이 잡으면 반씩 나누자고 {name}에게 제안한다.',
    doors: [
      { label: '사냥꾼의 길로 들어선다', hint: '남의 목에 걸린 돈으로 산다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'bountyHunter' }, { op: 'person', kind: 'ally', relation: '사냥꾼 동료' }, { op: 'timeline', text: '현상금 사냥꾼이 되었다' }] },
      { label: '수배서의 얼굴을 알아보고 몰래 귀띔해 준다', hint: '쫓기는 자에게 빚을 지운다', values: { loyalty: D }, fx: [{ op: 'flag', id: 'warnedPirate' }] },
      { label: '거절한다', hint: '사람 사냥은 내 일이 아니다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'path_shipwright', kind: 'door', when: at(age(15, 30), st('child', 'civil', 'settled')),
    weight: 5, repeat: 'once', speaker: { relation: '조선소의 목수장' },
    title: '조선소의 망치 소리', body: '{island} 조선소에서 늙은 목수장이 대패를 내려놓는다. 손이 야무지니 견습으로 들어오라고 한다.',
    doors: [
      { label: '견습 목수가 된다', hint: '나무와 쇠로 평생을 산다', values: { inquiry: D },
        fx: [{ op: 'standing', to: 'shipwright' }, { op: 'base', key: 'vit', add: 1 }, { op: 'timeline', text: '조선소의 견습 목수가 되었다' }] },
      { label: '배 고치는 법만 배우고 떠난다', hint: '언젠가 내 배를 손볼 수 있다', values: { romance: D },
        fx: [{ op: 'flag', id: 'shipSkill' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '정중히 사양한다', hint: '망치 소리를 뒤로한다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'path_iceburg', kind: 'door', when: at(age(18, 50), st('civil', 'pirate', 'settled', 'bountyHunter', 'shipwright'), sea('gl_first')),
    weight: 5, repeat: 'once', speaker: { canon: '아이스버그' },
    title: '물의 도시의 시장', body: '물의 도시의 조선 회사 사장이 어깨에 쥐를 얹은 채 {name}이(가) 손본 배를 한참 들여다본다. 회사에 들어오지 않겠느냐고 한다.',
    doors: [
      { label: '조선 회사의 목수가 된다', hint: '물의 도시에 눌러산다', values: { inquiry: D },
        fx: [{ op: 'standing', to: 'shipwright' }, { op: 'move', island: '워터 세븐', sea: 'gl_first' },
             { op: 'person', kind: 'ally', relation: '조선 회사 사장', name: '아이스버그', canon: 'iceburg' }, { op: 'timeline', text: '워터 세븐의 조선 회사에 들어갔다' }] },
      { label: '배 한 척을 부탁하고 다시 떠난다', hint: '가진 돈을 털어 튼튼한 배를 얻는다', values: { romance: D },
        fx: [{ op: 'money', add: -50000 }, { op: 'flag', id: 'goodShip' }, { op: 'base', key: 'luk', add: 1 }] },
      { label: '고개를 젓는다', hint: '지금의 길을 간다', values: { peace: D }, fx: [] },
    ],
  },

  // ---------------------------------------------------------------- 정착 · 감옥 · 은퇴
  {
    id: 'path_settle', kind: 'door', when: at(age(25, 70), st('pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp', 'civil')),
    weight: 3, repeat: { years: 6 }, speaker: 'hero',
    title: '닻을 내리다', body: '{island}의 언덕에서 내려다보는 바다가 유난히 잔잔하다. 여기서라면 남은 날을 보내도 좋겠다는 생각이 든다.',
    doors: [
      { label: '{island}에 집을 짓고 눌러앉는다', hint: '바다는 창밖으로만 본다', values: { peace: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'log', text: '{island}에 작은 집을 지었다. 파도 소리가 자장가가 되었다.', weight: 'heavy' },
             { op: 'timeline', text: '{island}에 닻을 내렸다' }] },
      { label: '아직 바다가 부른다', hint: '다시 돛을 올린다', values: { romance: D }, fx: [] },
      { label: '모은 돈으로 가게를 연다', hint: '손님을 맞으며 산다', when: [{ c: 'money', min: SHOP_COST }], values: { devotion: D },
        fx: [{ op: 'money', add: -SHOP_COST }, { op: 'standing', to: 'settled' }, { op: 'flag', id: 'shop' }, { op: 'timeline', text: '{island}에 가게를 열었다' }] },
    ],
  },
  {
    id: 'path_take_blame', kind: 'door', when: at(age(17, 50), st('pirate', 'revolution', 'bountyHunter', 'civil', 'shipwright', 'settled')),
    weight: 2, repeat: 'once', speaker: { relation: '쫓기는 동료' },
    title: '대신 진 죄', body: '해군이 {island}의 골목을 뒤지고 있다. 숨이 턱에 닿은 동료가, 자기에게는 기다리는 가족이 있다며 {name}의 소매를 붙잡는다.',
    doors: [
      { label: '동료 대신 붙잡혀 간다', hint: '쇠창살 너머에서 몇 해를 보낸다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'standing', to: 'prisoner' }, { op: 'hardship', add: 8 }, { op: 'log', text: '동료의 죄를 대신 지고 감옥에 들어갔다.', weight: 'heavy' },
             { op: 'timeline', text: '동료의 죄를 대신 지고 갇혔다' }] },
      { label: '함께 달아난다', hint: '둘 다 쫓기는 몸이 된다', values: { freedom: D }, fx: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'wanted' }] },
      { label: '동료를 해군에 넘긴다', hint: '대가로 죄를 사면받는다', values: { ambition: D }, fx: [{ op: 'fame', add: 5 }, { op: 'flag', id: 'soldOut' }] },
    ],
  },
  {
    id: 'prison_days', kind: 'door', when: at(st('prisoner')),
    weight: 10, repeat: { years: 1 }, speaker: 'hero',
    title: '쇠창살 너머', body: '감옥의 하루는 길다. 차가운 돌바닥 위에서 {name}은(는) 벽에 그은 금을 세어 본다.',
    doors: [
      { label: '묵묵히 버틴다', hint: '몸과 마음이 단단해진다', values: { peace: D }, mark: 'unyielding', fx: [{ op: 'base', key: 'vit', add: 1 }] },
      { label: '옆 감방의 죄수와 친해진다', hint: '쇠창살 너머로 이야기를 나눈다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '감방 동료' }] },
      { label: '빠져나갈 길을 살핀다', hint: '간수의 발소리를 외운다', values: { freedom: D }, fx: [{ op: 'queue', turning: 'prison_escape' }] },
    ],
  },
  {
    id: 'prison_release', kind: 'door', when: at(st('prisoner')),
    weight: 4, repeat: { years: 1 }, speaker: { relation: '간수' },
    title: '형기를 마치다', body: '녹슨 문이 열린다. 간수가 {name}의 짐 꾸러미를 바닥에 던지며, 다시는 보지 말자고 한다.',
    doors: [
      { label: '고개를 숙이고 뭍의 삶으로 돌아간다', hint: '조용히 다시 시작한다', values: { peace: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'log', text: '감옥 문을 나섰다. 바깥 공기가 낯설었다.', weight: 'heavy' }, { op: 'timeline', text: '형기를 마치고 풀려났다' }] },
      { label: '감옥에서 만난 자들과 바다로 나간다', hint: '쫓기는 삶으로 돌아간다', values: { freedom: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'person', kind: 'crew', relation: '감옥 동기' }, { op: 'timeline', text: '감옥 동기들과 바다로 나갔다' }] },
      { label: '해군의 끄나풀이 되기로 하고 나온다', hint: '옛 동료들을 팔아 남은 형기를 지운다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'bountyHunter' }, { op: 'flag', id: 'informant' }] },
    ],
  },
  {
    id: 'prison_escape', kind: 'door', when: at(st('prisoner')),
    weight: 2, repeat: { years: 1 }, speaker: 'hero',
    title: '탈옥', body: '간수가 열쇠 꾸러미를 허리춤에 매단 채 졸고 있다. 감옥 밖은 거친 바다다.',
    doors: [
      { label: '오늘 밤 감옥을 빠져나간다', hint: '붙잡히면 더 깊은 곳에 갇힌다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6,
               then: [{ op: 'standing', to: 'pirate' }, { op: 'fame', add: 20 }, { op: 'flag', id: 'escapee' },
                      { op: 'log', text: '어둠을 틈타 감옥을 빠져나왔다. 이제 쫓기는 몸이다.', weight: 'heavy' }, { op: 'timeline', text: '감옥을 빠져나왔다' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -20 },
                      { op: 'log', text: '탈옥은 실패했다. 매질과 함께 더 깊은 감방에 처박혔다.', weight: 'heavy' }] }] },
      { label: '죄수들을 이끌고 감옥을 뒤집는다', hint: '혼자가 아니라 무리로 나간다', special: 'dominion', values: { dominion: D }, danger: true,
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'fame', add: 60 }, { op: 'hp', add: -20 }, { op: 'person', kind: 'crew', relation: '탈옥 동지' },
             { op: 'log', text: '폭동이 감옥을 집어삼켰다. 앞장선 {name}의 이름이 신문에 실렸다.', weight: 'heavy' }, { op: 'timeline', text: '죄수들을 이끌고 탈옥했다' }] },
      { label: '때를 기다린다', hint: '오늘은 눈을 감는다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'path_retire', kind: 'door', when: at(age(50), st('pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp', 'shipwright', 'settled', 'civil')),
    weight: 5, repeat: { years: 5 }, speaker: 'hero',
    title: '칼을 내려놓다', body: '거울 속의 {name}은(는) 어느새 희끗한 머리다. 무릎도 예전 같지 않다. 이제 물러날 때가 되었는지도 모른다.',
    doors: [
      { label: '모든 것을 내려놓고 물러난다', hint: '남은 날은 조용히 보낸다', values: { peace: D },
        fx: [{ op: 'standing', to: 'retired' }, { op: 'log', text: '{name}은(는) 모든 것을 내려놓고 물러났다.', weight: 'heavy' }, { op: 'timeline', text: '은퇴했다' }] },
      { label: '아직 할 일이 남았다', hint: '쓰러질 때까지 걷는다', values: { ambition: D }, fx: [] },
      { label: '젊은이에게 아는 것을 물려주고 물러난다', hint: '제자를 받으며 남은 날을 보낸다', values: { devotion: D },
        fx: [{ op: 'standing', to: 'retired' }, { op: 'person', kind: 'ally', relation: '제자' }, { op: 'timeline', text: '제자를 두고 은퇴했다' }] },
    ],
  },

  // ---------------------------------------------------------------- 바다를 옮기는 일
  {
    id: 'path_drift', kind: 'door', when: at(age(15), st('civil', 'shipwright', 'settled', ...SEAFARING), sea(...BLUES)),
    weight: 2, repeat: 'once', speaker: 'hero',
    title: '표류', body: '고기잡이를 나갔던 배가 거센 해류에 휩쓸렸다. 며칠을 떠돈 끝에 낯선 섬의 그림자가 보인다.',
    doors: [
      { label: '해류가 데려가는 대로 몸을 맡긴다', hint: '어디에 닿을지 모른다', values: { romance: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'move', island: '리틀 가든', sea: 'gl_entry' },
             { op: 'log', text: '거인들이 싸우는 원시의 섬, 리틀 가든에 떠밀려 왔다. 위대한 항로였다.', weight: 'heavy' }, { op: 'timeline', text: '리틀 가든으로 표류했다' }] },
      { label: '노를 저어 돌아갈 길을 찾는다', hint: '굶주림을 견뎌야 한다', values: { devotion: D },
        fx: [{ op: 'hp', add: -20 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '열흘 만에 익숙한 해안선이 보였다.', weight: 'heavy' }] },
      { label: '지나가는 배에 신호를 보낸다', hint: '누구의 배일지는 모른다', values: { peace: D },
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'move', island: '위스키 피크', sea: 'gl_entry' }, { op: 'log', text: '현상금 사냥꾼의 배에 건져져 위스키 피크에 내렸다.', weight: 'heavy' }],
               else: [{ op: 'move', island: '로그타운', sea: 'east' }, { op: 'log', text: '해군 순찰선에 구조되어 로그타운으로 돌아왔다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'path_kidnap', kind: 'door', when: at(age(16, 45), st('civil', 'shipwright', 'settled', 'bountyHunter', 'pirate'), sea('east', 'gl_entry', 'gl_first', 'sabaody')),
    weight: 1.5, repeat: 'once', speaker: 'hero',
    title: '사슬', body: '술잔에 탄 약에 정신을 잃었다. 깨어 보니 쇠사슬에 묶인 채 배 밑창이다. 노예 사냥꾼들이 신세계의 왕국으로 간다고 떠든다.',
    doors: [
      { label: '끌려가며 때를 기다린다', hint: '신세계까지 끌려간다', values: { peace: D },
        fx: [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'hardship', add: 10 },
             { op: 'log', text: '신세계의 섬 드레스로자까지 끌려왔다. 사슬을 끊고 달아난 것은 그로부터 한참 뒤였다.', weight: 'heavy' },
             { op: 'timeline', text: '노예 사냥꾼에게 신세계로 끌려갔다' }] },
      { label: '사슬을 풀고 바다에 뛰어든다', hint: '살아서 뭍에 닿을지는 모른다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'hp', add: -20 }, { op: 'log', text: '밤바다를 헤엄쳐 가까운 섬에 닿았다.', weight: 'heavy' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -40 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
                      { op: 'log', text: '파도에 휩쓸려 정신을 잃었다. 눈을 뜨니 샤본디 제도의 해변이었다.', weight: 'heavy' }] }] },
      { label: '같이 묶인 사람들을 깨워 함께 들고일어난다', hint: '혼자가 아니면 해볼 만하다', special: 'loyalty', values: { loyalty: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 20 }, { op: 'person', kind: 'crew', relation: '함께 사슬을 끊은 동료' },
             { op: 'log', text: '사슬을 끊은 사람들이 배를 빼앗았다. 노예 사냥꾼들은 바다에 던져졌다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'path_got_ship', kind: 'door', when: at(st('pirate', 'bountyHunter', 'revolution'), sea(...BLUES)),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '주인 잃은 배', body: '{island} 항구에 주인을 잃은 범선 한 척이 묶여 있다. 위대한 항로를 건널 만한 배다.',
    doors: [
      { label: '배를 얻어 붉은 산을 넘는다', hint: '세상에서 가장 험한 바다로 들어선다', values: { romance: D },
        fx: [{ op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'fame', add: 5 },
             { op: 'log', text: '배는 붉은 산의 물길을 거슬러 올라 위대한 항로에 들어섰다.', weight: 'heavy' }, { op: 'timeline', text: '위대한 항로에 들어섰다' }] },
      { label: '배를 팔아 돈을 챙긴다', hint: '당분간은 이 바다로 족하다', values: { ambition: D }, fx: [{ op: 'money', add: 80000 }] },
      { label: '원래 주인을 찾아 돌려준다', hint: '고맙다는 말만 듣는다', values: { justice: D }, fx: [{ op: 'fame', add: 3 }] },
    ],
  },
  {
    id: 'path_follow_luffy', kind: 'door', when: at(age(17, 19), st('child', 'civil', 'pirate', 'bountyHunter', 'shipwright'), sea('east')),
    weight: 6, repeat: 'once', speaker: { canon: '몽키 D. 루피' },
    title: '처형대 위의 웃음', body: '{island} 처형대에서 목이 잘릴 뻔했던 밀짚모자 소년이 벼락 속에서 웃으며 살아났다. 그의 작은 배가 폭풍 속으로 떠나려 한다.',
    doors: [
      { label: '그 배를 쫓아 붉은 산을 넘는다', hint: '폭풍을 뚫고 위대한 항로로 간다', values: { romance: D },
        fx: [{ op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'person', kind: 'ally', relation: '밀짚모자 소년', name: '루피', canon: 'luffy' },
             { op: 'log', text: '밀짚모자의 배를 쫓아 붉은 산을 넘었다. 등 뒤로 로그타운이 멀어졌다.', weight: 'heavy' },
             { op: 'timeline', text: '밀짚모자를 따라 위대한 항로에 들어섰다' }] },
      { label: '그 웃음을 가슴에 새긴다', hint: '그날을 오래 기억한다', values: { freedom: D }, fx: [{ op: 'flag', id: 'sawLuffy' }] },
      { label: '해군에 그 배의 행방을 알린다', hint: '해군의 눈에 든다', values: { justice: D }, fx: [{ op: 'fame', add: 5 }] },
    ],
  },
  {
    id: 'path_home_return', kind: 'door', when: at(age(20), st(...ACTIVE), sea(...ALL_SEAS_BUT_EAST)),
    weight: 2, repeat: { years: 8 }, speaker: 'hero',
    title: '고향행 배', body: '{island} 항구에서 이스트 블루로 가는 상선이 닻을 올리고 있다. 갑판 위에서 들려오는 사투리가 귀에 익다.',
    doors: [
      { label: '배에 올라 로그타운으로 돌아간다', hint: '자란 거리로 돌아간다', values: { devotion: D },
        fx: [{ op: 'move', island: '로그타운', sea: 'east' }, { op: 'log', text: '오랜만에 로그타운의 처형대를 올려다보았다. 거리는 그대로였다.', weight: 'heavy' },
             { op: 'timeline', text: '고향 로그타운으로 돌아왔다' }] },
      { label: '돌아보지 않는다', hint: '갈 길이 아직 멀다', values: { ambition: D }, fx: [] },
      { label: '고향에 편지와 돈을 부친다', hint: '마음만 먼저 돌려보낸다', values: { loyalty: D }, fx: [{ op: 'money', add: -10000 }] },
    ],
  },
  {
    id: 'path_sea_alabasta', kind: 'door', when: at(st(...SEAFARING), sea('gl_entry')),
    weight: 5, repeat: { years: 3 }, speaker: 'hero',
    title: '기록 지침', body: '손목의 기록 지침이 다음 섬을 가리킨다. 바늘 끝 쪽에서 뜨거운 모래바람이 불어온다.',
    doors: [
      { label: '바늘을 따라 사막의 왕국으로 간다', hint: '위대한 항로 깊숙이 들어간다', values: { romance: D },
        fx: [{ op: 'move', island: '알라바스타 왕국', sea: 'gl_first' }, { op: 'log', text: '모래바람을 헤치고 사막의 왕국 알라바스타에 닿았다.', weight: 'heavy' }] },
      { label: '이 바다에서 더 단련한다', hint: '서두르지 않는다', values: { peace: D }, fx: [] },
      { label: '바늘 대신 하늘섬의 소문을 쫓는다', hint: '돌아오지 못할 수도 있다', special: 'inquiry', values: { inquiry: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'move', island: '스카이피아', sea: 'gl_first' }, { op: 'base', key: 'int', add: 1 },
             { op: 'log', text: '솟구치는 해류를 타고 구름 위의 섬 스카이피아에 올랐다.', weight: 'heavy' }, { op: 'timeline', text: '하늘섬에 올랐다' }] },
    ],
  },
  {
    id: 'path_sea_sabaody', kind: 'door', when: at(st(...SEAFARING), sea('gl_first')),
    weight: 5, repeat: { years: 3 }, speaker: 'hero',
    title: '붉은 대륙 앞', body: '위대한 항로의 절반을 지났다. 수평선 너머로 세상을 가르는 붉은 벽이 보이기 시작한다.',
    doors: [
      { label: '비눗방울 섬으로 배를 몬다', hint: '이름난 자들이 모이는 곳으로 간다', values: { ambition: D },
        fx: [{ op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'log', text: '비눗방울이 떠오르는 섬, 샤본디 제도에 닻을 내렸다.', weight: 'heavy' }] },
      { label: '이 바다에 머문다', hint: '아직은 이 바다가 맞다', values: { peace: D }, fx: [] },
      { label: '안개 속의 거대한 유령선에 다가간다', hint: '살아서 나올 수 있을지 모른다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'move', island: '스릴러 바크', sea: 'sabaody' },
             { op: 'log', text: '안개 속의 유령섬 스릴러 바크에 발을 들였다. 그림자가 멋대로 움직였다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'path_sea_newworld', kind: 'door', when: at(st(...SEAFARING), sea('sabaody')),
    weight: 5, repeat: { years: 3 }, speaker: 'hero',
    title: '바다 밑의 길', body: '코팅 장인이 배를 비눗방울로 감싸 준다. 바다 밑으로 내려가면 어인섬을 지나 신세계로 이어진다고 한다.',
    doors: [
      { label: '바다 밑으로 내려가 신세계로 간다', hint: '되돌아오기 어려운 바다다', values: { romance: D },
        fx: [{ op: 'move', island: '펑크 해저드', sea: 'nw_first' }, { op: 'log', text: '깊은 바다를 지나 신세계로 솟아올랐다. 불타는 섬과 얼어붙은 섬이 맞붙은 펑크 해저드였다.', weight: 'heavy' },
             { op: 'timeline', text: '신세계에 들어섰다' }] },
      { label: '이 바다에 머문다', hint: '아직 신세계는 이르다', values: { peace: D }, fx: [] },
      { label: '붉은 대륙을 맨몸으로 기어올라 넘는다', hint: '아무도 하지 않는 길이다', special: 'freedom', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'fame', add: 30 },
             { op: 'log', text: '붉은 벽을 맨손으로 넘어 신세계에 내려섰다. 소문이 먼저 바다를 건넜다.', weight: 'heavy' }, { op: 'timeline', text: '붉은 대륙을 넘어 신세계에 들어섰다' }] },
    ],
  },
  {
    id: 'path_sea_late', kind: 'door', when: at(st(...SEAFARING), sea('nw_first')),
    weight: 5, repeat: { years: 3 }, speaker: 'hero',
    title: '사황의 바다', body: '신세계의 더 깊은 곳, 사황들이 다스리는 바다의 소문이 들려온다. 그 끝에 마지막 섬이 있다고 한다.',
    doors: [
      { label: '닫힌 나라 와노쿠니로 간다', hint: '사무라이와 괴물의 나라다', values: { ambition: D },
        fx: [{ op: 'move', island: '와노쿠니', sea: 'nw_late' }, { op: 'log', text: '폭포를 거슬러 올라 닫힌 나라 와노쿠니에 들어섰다.', weight: 'heavy' }, { op: 'timeline', text: '와노쿠니에 닿았다' }] },
      { label: '이 바다에 머문다', hint: '여기서도 충분히 험하다', values: { peace: D }, fx: [] },
      { label: '거인의 나라를 찾아간다', hint: '전사들의 나라에서 무엇을 얻을지 모른다', values: { romance: D },
        fx: [{ op: 'move', island: '엘바프', sea: 'nw_late' }, { op: 'base', key: 'str', add: 1 },
             { op: 'log', text: '하늘에 닿는 나무 아래, 거인의 나라 엘바프에 닿았다.', weight: 'heavy' }, { op: 'timeline', text: '엘바프에 닿았다' }] },
    ],
  },
];
