// 유년기 전환점 (3~15살, 이스트 블루의 여덟 마을 어디서나). 문의 말에는 가치관 이름도 점수도 쓰지 않는다. 상황과 일어날 일만 적는다.
// 자리표시: {name} 이름만, {town} 자란 마을, {island} 섬. 성씨는 쓰지 않는다 (고아는 성이 없다).
// 마을마다의 전환점은 towns.ts · towns-2.ts에 있다. 여기의 kidIn · leaveTo를 함께 쓴다.
// 집을 아주 떠난 아이(left_home_young)에게는 고향의 유년기가 더 오지 않고, 떠난 아이의 전환점(kid_away_*)이 온다.
import { V } from '../balance';
import type { Cond, Fx, Turning } from '../../core/types';

const D = V.value.door;
/** 열두 살 넘어 고향을 아주 떠난 아이의 표시. 고향으로 돌아오면 지운다 (kid_away_letter) */
export const LEFT_HOME = 'left_home_young';
const stayed: Cond = { c: 'flag', id: LEFT_HOME, has: false };
/** 아직 아이(처지 child)인 사람(어느 고향이든), 이 나이 사이, 고향을 떠나지 않았다. 열다섯 살이라도 죄수나 해적이면 열리지 않는다.
 *  바다 · 항구를 전제하는 글은 index.ts의 landlocked가 바다에 닿지 않는 고향(조우 · 하늘섬 · 어인섬)에서 막는다 */
export const kid = (min: number, max: number): Cond[] => [{ c: 'age', min, max }, { c: 'standing', is: ['child'] }, stayed];
/** 그 마을에서 태어나 지금도 그 마을에 사는 아이 */
export const kidIn = (town: string, min: number, max: number, ...more: Cond[]): Cond[] =>
  [...kid(min, max), { c: 'town', is: [town] }, { c: 'island', is: [town] }, ...more];
/** 고향을 떠난 아이 */
const away = (min: number, max: number): Cond[] =>
  [{ c: 'age', min, max }, { c: 'home', is: ['loguetown'] }, { c: 'standing', is: ['child'] }, { c: 'flag', id: LEFT_HOME, has: true }];
export const POOR: Cond = { c: 'wealth', max: 'poor' };
export const RICH: Cond = { c: 'wealth', min: 'comfortable' };
/** 고향을 아주 떠난다: 이스트 블루의 항구로 옮기고, 떠났다는 표시를 남긴다 */
export const leaveTo = (island: string, text: string, line: string): Fx[] => [
  { op: 'move', island, sea: 'east' }, { op: 'flag', id: LEFT_HOME },
  { op: 'log', text, weight: 'heavy' }, { op: 'timeline', text: line },
];

export const CHILDHOOD: Turning[] = [
  {
    id: 'kid_bully', kind: 'door', when: kid(3, 10), weight: 10, repeat: 'once', speaker: 'hero',
    title: '골목대장', body: '{town} 골목에서 덩치 큰 아이가 작은 아이의 빵을 빼앗아 들고 웃는다.',
    doors: [
      { label: '끼어들어 막아선다', hint: '대신 얻어맞을지도 모른다', values: { justice: D }, mark: 'unyielding', fx: [{ op: 'hp', add: -10 }] },
      { label: '골목대장 편에 붙어 빵 부스러기를 얻는다', hint: '배는 부르다. 빵을 빼앗긴 아이가 {name}을(를) 쳐다본다', values: { greed: D }, fx: [] },
      { label: '골목대장을 꺾고 골목을 차지한다', hint: '골목 아이들이 {name}을(를) 따르게 된다', special: 'dominion', values: { dominion: D },
        fx: [{ op: 'flag', id: 'kidBoss' }, { op: 'log', text: '그날부터 골목 아이들은 {name}의 눈치를 보았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_sailor_tale', kind: 'door', when: kid(3, 9), weight: 10, repeat: 'once', speaker: { relation: '늙은 뱃사람' },
    title: '늙은 뱃사람의 이야기', body: '{island} 부두의 술집 앞, 다리를 저는 늙은 뱃사람이 위대한 항로 이야기를 들려준다.',
    doors: [
      { label: '밤늦도록 이야기를 듣는다', hint: '바다 저편이 마음에 오래 남는다', values: { romance: D }, fx: [] },
      { label: '지도를 그려 달라고 조른다', hint: '머릿속에 바닷길이 그려진다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '뱃사람의 보물 이야기를 부잣집 아이에게 팔아넘긴다', hint: '몇 닢을 번다. 뱃사람이 다시는 이야기를 들려주지 않는다', values: { greed: D }, fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'kid_sick_elder', kind: 'door', when: kid(6, 14), weight: 9, repeat: 'once', speaker: 'hero',
    title: '앓아누운 어른', body: '{name}을(를) 돌봐 주던 어른이 열병으로 앓아누웠다. 약값이 만만치 않다.',
    doors: [
      { label: '부두에서 짐을 날라 약값을 번다', hint: '몸은 고되지만 약을 살 수 있다', values: { ambition: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '의원에게서 비싼 약을 사 온다', hint: '집안 돈으로 금방 해결된다', when: [{ c: 'wealth', min: 'comfortable' }], values: { peace: D }, fx: [{ op: 'money', add: -10000 }] },
      { label: '약초 책을 뒤져 직접 달인다', hint: '잘될지는 해 봐야 안다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'kid_marine_parade', kind: 'door', when: kid(4, 12), weight: 10, repeat: 'once', speaker: 'hero',
    title: '해군의 행진', body: '{island} 항구에 군함이 들어왔다. 흰 제복의 수병들이 줄을 맞춰 광장을 지나간다.',
    doors: [
      { label: '수병에게 경례하는 법을 배운다', hint: '언젠가 저 제복을 입고 싶어진다', values: { justice: D }, fx: [] },
      { label: '아버지의 옛 전우를 찾아간다', hint: '해군 집안의 연줄로 군함에 올라 본다', when: [{ c: 'lineage', is: ['marineFamily'] }], values: { loyalty: D, justice: D }, fx: [{ op: 'flag', id: 'marineContact' }] },
      { label: '행진 대열 뒤에서 수병 흉내를 내며 놀린다', hint: '어른들에게 꾸중을 듣는다', values: { freedom: D }, mark: 'rebel', fx: [] },
    ],
  },
  {
    id: 'kid_wanted_poster', kind: 'door', when: kid(5, 13), weight: 10, repeat: 'once', speaker: 'hero',
    title: '현상수배서', body: '마을 게시판에 새 현상수배서가 붙었다. 활짝 웃는 해적의 얼굴 아래 큰돈이 적혀 있다.',
    doors: [
      { label: '수배서를 몰래 떼어 간직한다', hint: '저 사람처럼 웃으며 살고 싶어진다', values: { freedom: D, romance: D }, fx: [] },
      { label: '언젠가 내 얼굴도 저기 걸리겠다고 다짐한다', hint: '마음속에 큰 꿈이 자리 잡는다', values: { ambition: D }, mark: 'obsession', fx: [] },
      { label: '아버지가 남긴 바다 이야기를 떠올린다', hint: '해적의 아이만 아는 이야기가 있다', when: [{ c: 'lineage', is: ['pirateChild'] }], values: { freedom: D, loyalty: D }, fx: [{ op: 'flag', id: 'fatherTale' }] },
    ],
  },
  {
    id: 'kid_wooden_sword', kind: 'door', when: kid(6, 14), weight: 10, repeat: 'once', speaker: 'hero',
    title: '목검', body: '동네 형이 목검 두 자루를 들고 와 한판 붙자고 한다. 이긴 적이 한 번도 없다.',
    doors: [
      { label: '지고 또 덤빈다', hint: '해가 질 무렵엔 온몸이 멍투성이다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: 'mastery', branch: 'sword', add: 10 }] },
      { label: '덤비지 않고 형의 버릇을 지켜본다', hint: '이길 틈이 보이기 시작한다', values: { inquiry: D }, mark: 'composure', fx: [{ op: 'mastery', branch: 'observation', add: 5 }] },
      { label: '그만하고 같이 바다나 보자고 한다', hint: '싸움 없이 하루가 저문다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'kid_stray_dog', kind: 'door', when: kid(3, 10), weight: 10, repeat: 'once', speaker: 'hero',
    title: '떠돌이 개', body: '비 오는 날, 다리를 저는 떠돌이 개가 처마 밑에서 떨고 있다.',
    doors: [
      { label: '데려가 몰래 돌본다', hint: '먹을 것을 나눠야 한다', values: { peace: D }, fx: [{ op: 'flag', id: 'kidDog' }] },
      { label: '동네 아이들을 불러 함께 개집을 짓는다', hint: '함께할 친구가 생긴다', values: { loyalty: D }, mark: 'fellowship', fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 친구' }] },
      { label: '개장수에게 넘기고 동전을 받는다', hint: '동전 몇 닢이 생긴다. 이튿날 처마 밑은 비어 있다', values: { greed: D }, fx: [{ op: 'money', add: 500 }] },
    ],
  },
  {
    id: 'kid_spyglass', kind: 'door', when: kid(5, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '부잣집 아이의 망원경', body: '부잣집 아이가 새 망원경을 자랑하며, 만져 보고 싶으면 절을 하라고 한다.',
    doors: [
      { label: '절하지 않고 돌아선다', hint: '망원경은 끝내 못 본다', values: { freedom: D }, mark: 'rebel', fx: [] },
      { label: '망원경을 빼앗아 버린다', hint: '그 집 어른들이 찾아온다', values: { dominion: D }, fx: [{ op: 'flag', id: 'kidFeared' }] },
      { label: '우리 집 망원경을 들고 나와 맞선다', hint: '집안 형편이 받쳐 준다', when: [{ c: 'wealth', min: 'comfortable' }], values: { dominion: D }, fx: [] },
    ],
  },
  {
    id: 'kid_dice', kind: 'door', when: kid(9, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '부두의 노름판', body: '부두 뒷골목에서 뱃사람들이 주사위 노름을 한다. 한 사람이 끼워 주겠다며 손짓한다.',
    doors: [
      { label: '가진 돈을 몽땅 건다', hint: '크게 따거나 몽땅 잃는다', values: { greed: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 4000 }], else: [{ op: 'money', add: -3000 }] }] },
      { label: '노름판의 속임수를 지켜본다', hint: '손놀림의 비밀을 알아챈다', values: { inquiry: D }, mark: 'composure', fx: [] },
      { label: '경비대에 알린다', hint: '뱃사람들의 미움을 산다', values: { justice: D }, fx: [{ op: 'person', kind: 'rival', relation: '노름판의 뱃사람' }] },
    ],
  },
  {
    id: 'kid_bread', kind: 'door', when: kid(4, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '빵집 앞', body: '배고픈 겨울 아침, {town} 빵집 창가에 갓 구운 빵이 식고 있다.',
    doors: [
      { label: '빵 하나를 집어 들고 달아난다', hint: '들키면 크게 혼난다', values: { freedom: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.4, then: [{ op: 'hp', add: -8 }, { op: 'log', text: '빵집 주인에게 덜미를 잡혀 골목이 떠나가게 혼났다.', weight: 'light' }] }] },
      { label: '빵집 일을 거들고 얻어먹는다', hint: '하루 종일 반죽을 친다', values: { romance: D }, fx: [{ op: 'base', key: 'str', add: 1 }] },
      { label: '거리 아이들을 모아 빵을 나눠 갖는다', hint: '거리의 아이들이 {name}을(를) 따른다', when: [{ c: 'lineage', is: ['orphan'] }], values: { dominion: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '거리의 동무' }] },
    ],
  },
  {
    id: 'kid_scaffold', kind: 'door', when: kidIn('로그타운', 6, 15), weight: 10, repeat: 'once', speaker: 'hero',
    title: '처형대', body: '{island} 광장의 처형대. 어른들은 해적왕이 저 위에서 웃으며 죽었다고 말한다.',
    doors: [
      { label: '몰래 처형대 위에 올라가 바다를 본다', hint: '들키면 경비에게 끌려 내려온다', values: { romance: D }, mark: 'obsession', fx: [] },
      { label: '해적왕이 남긴 말을 곱씹는다', hint: '그 말의 뜻을 알고 싶어진다', values: { inquiry: D }, fx: [] },
      { label: '언젠가 저 사람보다 높이 서겠다고 맹세한다', hint: '한 번 한 맹세는 거둘 수 없다', special: 'ambition', values: { ambition: D },
        fx: [{ op: 'flag', id: 'kingOath' }, { op: 'timeline', text: '처형대 앞에서 맹세했다' }] },
    ],
  },
  {
    id: 'kid_shipwreck', kind: 'door', when: kid(7, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '폭풍 뒤의 해변', body: '폭풍이 지난 아침, 해변에 부서진 배와 정신을 잃은 뱃사람이 떠밀려 왔다.',
    doors: [
      { label: '물에 뛰어들어 사람을 끌어올린다', hint: '파도가 아직 거칠다', needs: ['swim'], values: { justice: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '구해 준 뱃사람' }] },
      { label: '부서진 배의 짐을 뒤진다', hint: '쓸 만한 것이 나올지도 모른다', values: { inquiry: D }, fx: [{ op: 'money', add: 2000 }] },
      { label: '어른들을 부르러 달려간다', hint: '어른들이 알아서 한다', values: { peace: D, loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'kid_blind_swordsman', kind: 'door', when: kid(8, 15), weight: 8, repeat: 'once', speaker: { relation: '눈먼 검객' },
    title: '눈먼 검객', body: '마을 어귀 나무 아래, 눈먼 검객이 말없이 차를 끓이고 있다. 허리에 낡은 칼 한 자루가 있다.',
    doors: [
      { label: '옆에 앉아 차를 얻어 마신다', hint: '아무 말 없이 해가 진다', values: { peace: D }, fx: [] },
      { label: '칼을 가르쳐 달라고 조른다', hint: '몇 번이고 쫓겨난다', values: { ambition: D }, mark: 'obsession', fx: [{ op: 'mastery', branch: 'sword', add: 10 }] },
      { label: '검객처럼 눈을 감고 바람 소리를 듣는다', hint: '보이지 않던 것이 들린다', special: 'peace', values: { inquiry: D }, 
        fx: [{ op: 'mastery', branch: 'observation', add: 15 }] },
    ],
  },
  {
    id: 'kid_promise', kind: 'door', when: kid(8, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '떠나는 친구', body: '가장 가까운 동무가 먼 섬으로 이사를 간다. 떠나기 전날 밤, 바닷가에서 약속을 하자고 한다.',
    doors: [
      { label: '언젠가 같은 배를 타자고 약속한다', hint: '이 약속은 오래 남는다', values: { romance: D }, mark: 'obsession', fx: [{ op: 'flag', id: 'kidPromise' }] },
      { label: '웃으며 보내 준다', hint: '담담하게 헤어진다', values: { peace: D }, fx: [] },
      { label: '손바닥을 그어 피로 맹세한다', hint: '평생 잊지 못할 밤이 된다', special: 'loyalty', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'bloodOath' }, { op: 'timeline', text: '떠나는 동무와 피로 맹세했다' }] },
    ],
  },

  // ---------------------------------------------------------------- 어느 집 아이에게나 (가족이 없어도)
  {
    id: 'kid_rival', kind: 'door', when: [...kid(3, 9), { c: 'kin', who: 'sibling', has: false }, { c: 'flag', id: 'lonely', has: false }],   // 형제가 있으면 맞수 대신 형제의 이야기가 온다 (bonds.ts)
    weight: 9, repeat: 'once', speaker: 'hero',
    title: '눈이 마주친 또래', body: '부둣가에서 고집 센 또래 하나와 눈이 마주쳤다. 둘 다 먼저 눈을 피하지 않는다.',
    doors: [
      { label: '먼저 주먹을 날린다', hint: '코피가 터지도록 뒹군다. 그 아이와는 오래 겨루는 사이가 된다', values: { dominion: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -8 }, { op: 'person', kind: 'rival', relation: '어릴 적 맞수' }, { op: 'flag', id: 'kidRival' }] },
      { label: '등대까지 달리기로 겨루자고 한다', hint: '지면 한 해 내내 놀림감이 된다. 이기든 지든 다음 시합을 약속하게 된다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'person', kind: 'rival', relation: '어릴 적 맞수' }, { op: 'flag', id: 'kidRival' },
             { op: 'chance', p: 0.5, then: [{ op: 'base', key: 'spd', add: 1 }], else: [{ op: 'log', text: '등대 앞에서 반 걸음 뒤졌다. 그해 내내 놀림을 받았다.', weight: 'light' }] }] },
      { label: '눈싸움을 그만두고 손을 내민다', hint: '그 아이는 한참 망설이다 손을 잡는다. 겨룰 상대 대신 놀 동무가 생긴다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 친구' }] },
    ],
  },
  {
    id: 'kid_drown', kind: 'door', when: kid(3, 9), weight: 8, repeat: 'once', speaker: 'hero',
    title: '부두에서 빠진 날', body: '부두 끝에서 놀다 발을 헛디뎌 바다에 빠졌다. 짠물이 코로 들어오고, 부두 기둥은 손이 닿을 듯 말 듯하다.',
    doors: [
      { label: '발버둥 쳐 헤엄쳐 나온다', hint: '물을 잔뜩 먹고 기어 나온다. 그날부터 바다가 덜 무섭다', needs: ['swim'], values: { freedom: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '목이 터져라 도움을 부른다', hint: '지나가던 어부가 건져 준다. 어른들이 한동안 {name}을(를) 부두에 못 가게 한다',
        fx: [{ op: 'person', kind: 'ally', relation: '생명의 은인' }, { op: 'flag', id: 'pierBanned' }] },
      { label: '기둥의 따개비를 붙잡고 숨을 고른다', hint: '손바닥이 따개비에 찢긴다. 물이 빠질 때까지 혼자 버틴다', values: { ambition: D }, mark: 'composure',
        fx: [{ op: 'hp', add: -15 }, { op: 'log', text: '물이 빠지고서야 피투성이 손으로 부두에 기어올랐다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_fever', kind: 'door', when: kid(3, 9), weight: 7, repeat: 'once', speaker: 'hero',
    title: '열병', body: '{name}이(가) 열병에 걸려 사흘째 끓는다. 돌봐 주는 어른이 의원을 불러왔지만, 듣는 약은 값이 비싸다.',
    doors: [
      { label: '비싼 약을 쓴다', hint: '사흘 만에 일어난다. 집안 돈이 크게 축난다', when: [RICH], fx: [{ op: 'money', add: -20000 }] },
      { label: '약 없이 이를 악물고 견딘다', hint: '살아나기는 한다. 몸이 더 단단해질 수도, 기침이 평생 남을 수도 있다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -20 }, { op: 'chance', p: 0.5, then: [{ op: 'base', key: 'vit', add: 1 }], else: [{ op: 'injury', severity: 'scar' }] }] },
      { label: '나으면 약초밭 일을 거들겠다고 약속하고 약을 받는다', hint: '약은 듣는다. 몇 해 동안 의원 집 약초밭의 잡초는 {name}의 몫이다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'doctorDebt' }, { op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'kid_lighthouse', kind: 'door', when: kid(5, 11), weight: 8, repeat: 'once', speaker: 'hero',
    title: '꺼진 등대', body: '폭풍 치는 밤, {island} 곶의 등대 불이 꺼졌다. 등대지기 노인은 계단에 쓰러져 있고, 먼바다에서 고깃배들의 불빛이 흔들린다.',
    doors: [
      { label: '등대 꼭대기에 올라가 불을 다시 붙인다', hint: '바람에 몇 번이고 넘어진다. 고깃배들이 불빛을 보고 항구로 들어온다', values: { ambition: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -12 }, { op: 'log', text: '날이 밝을 때까지 등잔을 붙들고 있었다. 고깃배는 하나도 빠짐없이 돌아왔다.', weight: 'heavy' }] },
      { label: '노인을 업고 마을 의원에게 달린다', hint: '노인은 살아난다. 그날 밤 항구에 들어오지 못한 배가 하나 있다', values: { justice: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '등대지기 노인' }, { op: 'hardship', add: 3 }] },
      { label: '골목 아이들을 다그쳐 종을 치고 물을 나르게 한다', hint: '아이들이 {name}의 말을 듣고 움직인다. 어른들이 달려와 둘 다 해낸다', values: { dominion: D }, fx: [{ op: 'fame', add: 1 }] },
    ],
  },
  {
    id: 'kid_pirate_boy', kind: 'door', when: kid(9, 14), weight: 8, repeat: 'once', speaker: 'hero',
    title: '숨어든 해적 소년', body: '해적선이 해군에게 쫓겨 달아난 다음 날, 창고 짚더미 속에서 다친 해적 소년을 찾았다. {name}과(와) 비슷한 나이다. 해군이 집집이 문을 두드리고 있다.',
    doors: [
      { label: '창고에 숨겨 두고 밤마다 먹을 것을 나른다', hint: '들키면 해적을 숨긴 죄를 진다. 소년은 떠나며 반드시 갚겠다고 한다', values: { loyalty: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.7,
               then: [{ op: 'person', kind: 'ally', relation: '숨겨 준 해적 소년' }, { op: 'flag', id: 'hidPirate' }],
               else: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'marineRecord' }, { op: 'log', text: '해군에게 들켰다. 소년은 끌려가고 {name}의 이름은 초소의 장부에 올랐다.', weight: 'heavy' }] }] },
      { label: '해군에 알린다', hint: '포상금이 나온다. 끌려가는 소년이 {name}을(를) 한 번 돌아본다', values: { justice: D },
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'turnedInPirate' }] },
      { label: '숨겨 주는 값으로 해적선의 보물 이야기를 내놓으라고 한다', hint: '소년은 마지못해 낡은 해도 한 장을 내준다. 값을 치른 사이에 고마움은 없다', values: { greed: D }, 
        fx: [{ op: 'flag', id: 'pirateMap' }, { op: 'base', key: 'luk', add: 1 }] },
    ],
  },
  {
    id: 'kid_scholarship', kind: 'door', when: kid(10, 14), weight: 8, repeat: 'once', speaker: { relation: '학당 선생' },
    title: '학당 선생의 추천', body: '마을 학당 선생이 {name}의 셈 솜씨를 보고, 큰 섬의 학교가 보는 장학 시험을 권했다. 시험 날은 동무들과 한 해 내내 준비한 축제 날과 겹친다.',
    doors: [
      { label: '장학 시험을 치르러 간다', hint: '붙으면 학교의 문이 열린다. 축제의 북은 다른 아이가 친다', values: { inquiry: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'scholar' }, { op: 'timeline', text: '장학 시험에 붙었다' }],
               else: [{ op: 'log', text: '시험장에서 손이 떨렸다. 떨어진 채 돌아오니 축제는 끝나 있었다.', weight: 'light' }] }] },
      { label: '시험 대신 축제의 북을 친다', hint: '동무들과 한 약속을 지킨다. 선생은 다시는 추천장을 쓰지 않는다', values: { loyalty: D }, closes: true,
        fx: [{ op: 'person', kind: 'ally', relation: '축제를 함께한 동무' }] },
      { label: '시험을 보고 밤배로 돌아와 북도 친다', hint: '이틀 밤을 새운다. 둘 다 해낼 수도, 둘 다 망칠 수도 있다', values: { ambition: D }, mark: 'daring',
        fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.4, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'scholar' }],
               else: [{ op: 'log', text: '시험지는 반이 비었고 북채는 손에서 미끄러졌다.', weight: 'light' }] }] },
    ],
  },

  // ---------------------------------------------------------------- 가난한 집 아이만
  {
    id: 'kid_hunger', kind: 'door', when: [...kid(5, 12), POOR], weight: 8, repeat: 'once', speaker: 'hero',
    title: '굶주린 겨울', body: '흉어가 이어진 겨울, {town}의 가난한 골목에서는 하루 한 끼도 귀하다. 곡물상은 창고 문을 걸어 잠그고 값이 오르기만 기다린다.',
    doors: [
      { label: '새벽 어시장에서 생선 내장 치우는 일을 얻는다', hint: '비린내와 칼자국을 얻고 하루 한 끼를 번다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'str', add: 1 }] },
      { label: '배급 줄에서 더 어린아이에게 제 몫을 넘긴다', hint: '그 아이는 겨울을 넘긴다. {name}은(는) 한동안 일어서면 눈앞이 캄캄하다', values: { peace: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -20 }] },
      { label: '골목 아이들을 모아 곡물상 문 앞에 드러눕는다', hint: '곡물상이 자루 몇 개를 풀거나, 몽둥이를 든 일꾼을 내보낸다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'log', text: '구경꾼이 늘자 곡물상이 자루 셋을 풀었다. 골목은 그 겨울을 넘겼다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -15 }, { op: 'log', text: '몽둥이를 든 일꾼들이 아이들을 흩어 놓았다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'kid_rope_works', kind: 'door', when: [...kid(9, 14), POOR], weight: 8, repeat: 'once', speaker: 'hero',
    title: '밧줄 공장', body: '{name}은(는) 항구의 밧줄 공장에서 삼 껍질을 꼬는 일을 시작했다. 감독은 손이 느린 아이를 회초리로 다스린다. 오늘은 가장 어린아이의 손에서 피가 났다.',
    doors: [
      { label: '회초리를 든 감독의 손목을 붙잡는다', hint: '그날로 공장에서 쫓겨난다. 아이들은 그 일을 오래 이야기한다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'flag', id: 'firedFactory' }, { op: 'hardship', add: 3 }] },
      { label: '어린아이 몫까지 밤늦게 꼰다', hint: '손바닥이 갈라진다. 그 아이는 회초리를 피한다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '감독의 눈에 들어 아이들의 반장이 된다', hint: '품삯이 오른다. 그 대신 느린 아이를 감독에게 일러야 하는 자리다', values: { greed: D }, 
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'factoryForeman' }] },
    ],
  },
  {
    id: 'kid_debt', kind: 'door', when: [...kid(11, 15), POOR], needs: ['parent'], weight: 8, repeat: 'once', speaker: { relation: '빚쟁이' },
    title: '빚쟁이', body: '험상궂은 빚쟁이 둘이 {name}의 집 문을 걷어찼다. 이달 안에 갚지 못하면 살림을 모두 들고 가겠다고 한다. 부모는 고개만 숙이고 있다.',
    doors: [
      { label: '부두 짐 나르기로 갚겠다고 나선다', hint: '한 해 내내 등이 휜다. 빚쟁이는 한 달 말미를 준다', values: { freedom: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'str', add: 1 }] },
      { label: '빚쟁이에게 몽둥이를 휘두른다', hint: '빚쟁이 하나가 물러난다. 다음 달에는 셋이 온다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'flag', id: 'debtGrudge' }] },
      { label: '빚쟁이의 품에서 빚 문서를 훔쳐 불태운다', hint: '종이는 사라져도 빚쟁이의 기억은 남는다. 잡히면 경비대에 넘겨진다', values: { freedom: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'flag', id: 'burnedDebt' }, { op: 'log', text: '빚 문서가 아궁이에서 재가 되었다. 빚쟁이는 다시 오지 않았다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'thiefMark' }, { op: 'log', text: '빚쟁이의 손에 덜미를 잡혀 경비대에 넘겨졌다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'kid_sent_away', kind: 'door', when: [...kid(7, 13), POOR], needs: ['parent', 'sibling'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '친척 집에 보낼 아이', body: '먹을 입이 하나 줄어야 겨울을 난다. 부모는 형제 가운데 하나를 먼 섬 친척 집에 일손으로 보내기로 했다.',
    doors: [
      { label: '내가 가겠다고 나선다', hint: '한 해 동안 남의 집 일을 하고 돌아온다. 돌아오면 제 자리가 조금 낯설다', values: { inquiry: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '한 해 동안 친척 집 물레방아를 돌리고 돌아왔다.', weight: 'heavy' }] },
      { label: '아무도 보내지 말자고 부모를 붙든다', hint: '온 식구가 한 겨울을 굶주림으로 버틴다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'hardship', add: 5 }] },
      { label: '노름판에서 겨울 날 돈을 따 오겠다고 나간다', hint: '따면 아무도 떠나지 않는다. 잃으면 형제가 떠나고 빚이 남는다', values: { ambition: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.4, then: [{ op: 'money', add: 3000 }, { op: 'log', text: '주사위가 세 번 연달아 웃었다. 그 겨울 아무도 집을 떠나지 않았다.', weight: 'heavy' }],
               else: [{ op: 'hardship', add: 5 }, { op: 'log', text: '가진 것을 다 잃었다. 형제는 이튿날 친척 집으로 가는 배에 올랐다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'kid_parent_hurt', kind: 'door', when: [...kid(8, 14), POOR], needs: ['parent'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '다친 부모', body: '부두에서 짐을 부리던 부모 한 분이 떨어진 화물에 다리를 다쳤다. 선주는 일하다 다친 것은 제 탓이라며 품삯도 주지 않는다.',
    doors: [
      { label: '학당을 그만두고 대신 부두에 나간다', hint: '집에 쌀이 떨어지지 않는다. 글공부는 거기서 끝난다', values: { inquiry: D }, mark: 'fellowship',
        fx: [{ op: 'base', key: 'str', add: 1 }, { op: 'base', key: 'int', add: -1 }, { op: 'flag', id: 'quitSchool' }] },
      { label: '날마다 선주의 집 앞에서 품삯을 내놓으라고 버틴다', hint: '선주의 일꾼들에게 떠밀려 넘어진다. 한 달을 버티면 몇 푼이라도 받을지 모른다', values: { justice: D }, mark: 'obsession',
        fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 2000 }, { op: 'log', text: '한 달 만에 선주가 품삯 절반을 내던졌다.', weight: 'light' }] }] },
      { label: '선주의 창고에서 품삯만큼 물건을 들고 나온다', hint: '잃은 품삯을 되찾는다. 들키면 도둑으로 몰린다', values: { freedom: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 2000 }], else: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'thiefMark' }] }] },
    ],
  },
  {
    id: 'go_work', kind: 'door', when: [...kid(14, 15), POOR], weight: 12, repeat: 'once', speaker: 'hero',
    title: '열다섯의 일터', body: '{island}의 염전과 배 고치는 작업장과 어선이 열다섯 살 일꾼을 받는다. 품삯을 미리 받으면 몇 해는 그 일터에 묶인다.',
    doors: [
      { label: '품삯을 미리 받고 어선에 오른다', hint: '집에 목돈이 들어간다. 빚진 몸으로 몇 해 그물을 끈다', values: { romance: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 5000 }, { op: 'base', key: 'str', add: 1 }, { op: 'flag', id: 'boundFisher' }, { op: 'timeline', text: '품삯을 미리 받고 어선을 탔다' }] },
      { label: '염전에서 날품을 팔아 제 밥벌이를 한다', hint: '햇볕에 등이 타들어 간다. 누구에게도 매이지 않는다', values: { freedom: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '작업장 목수에게 배 고치는 일을 배운다', hint: '품삯은 반이다. 언젠가 배 한 척은 혼자 손볼 수 있게 된다', values: { inquiry: D },
        fx: [{ op: 'flag', id: 'shipSkill' }, { op: 'base', key: 'int', add: 1 }] },
    ],
  },

  // ---------------------------------------------------------------- 넉넉한 집 아이만
  {
    id: 'kid_tutor', kind: 'door', when: [...kid(7, 12), RICH], needs: ['parent'], weight: 8, repeat: 'once', speaker: { relation: '가정교사' },
    title: '가정교사', body: '부모가 {name}에게 가정교사를 들였다. 깐깐한 선생은 하루 여섯 시간 글과 셈을 가르치고, 틀릴 때마다 손바닥을 때린다. 창밖으로 동네 아이들이 부두로 몰려간다.',
    doors: [
      { label: '선생의 책을 끝까지 판다', hint: '머리가 트인다. 동네 아이들은 더 이상 {name}을(를) 부르러 오지 않는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'bookish' }] },
      { label: '선생을 골려 내쫓는다', hint: '선생은 사흘 만에 짐을 싼다. 부모가 노해 용돈을 끊는다', values: { freedom: D }, mark: 'rebel', closes: true,
        fx: [{ op: 'money', add: -5000 }, { op: 'flag', id: 'tutorGone' }] },
      { label: '글 대신 해도 읽는 법만 가르쳐 달라고 조른다', hint: '선생은 반쯤 포기하고 바다 지도를 펼친다. 셈은 끝내 서툴다', values: { romance: D },
        fx: [{ op: 'flag', id: 'readsCharts' }, { op: 'mastery', branch: 'observation', add: 4 }] },
    ],
  },
  {
    id: 'kid_feast', kind: 'door', when: [...kid(8, 13), RICH], weight: 8, repeat: 'once', speaker: 'hero',
    title: '잔치가 끝난 뒤', body: '{name}의 집에서 큰 잔치가 끝났다. 하인들이 남은 음식을 바다에 쏟아 버리려 하고, 뒷문 밖에서는 골목 아이들이 그 광경을 지켜본다.',
    doors: [
      { label: '남은 음식을 뒷문 밖으로 나른다', hint: '골목 아이들이 배불리 먹는다. 집안 어른들이 거지 떼를 불러들였다며 용돈을 깎는다', values: { peace: D }, mark: 'fellowship',
        fx: [{ op: 'money', add: -2000 }, { op: 'flag', id: 'feastShared' }] },
      { label: '음식 나눌 차례를 정하는 일을 쥔다', hint: '골목 아이들이 {name} 앞에 줄을 선다. 줄에서 밀려난 아이가 원한을 품는다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'feastBoss' }, { op: 'person', kind: 'enemy', relation: '줄에서 밀려난 아이' }] },
      { label: '버리라고 시킨 어른에게 따진다', hint: '음식은 끝내 버려진다. 집안에서 버릇없는 아이로 찍힌다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'flag', id: 'talkedBack' }] },
    ],
  },
  {
    id: 'kid_family_trade', kind: 'door', when: [...kid(10, 14), RICH], needs: ['parent'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '가업', body: '부모가 {name}을(를) 가게 계산대에 앉히며 이제 가업을 배울 때라고 했다. 장부에는 외상을 갚지 못한 가난한 집들의 이름이 길게 적혀 있다.',
    doors: [
      { label: '가업 수업을 시작한다', hint: '몇 해면 가게를 맡을 수 있다. 놀던 동무들과는 멀어진다', values: { loyalty: D },
        fx: [{ op: 'money', add: 5000 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'familyTrade' }] },
      { label: '가업 대신 칼을 배우겠다고 버틴다', hint: '부모는 등을 돌리고 용돈을 끊는다. 동네 도장에 공짜로 매달린다', values: { ambition: D }, mark: 'obsession', closes: true,
        fx: [{ op: 'money', add: -10000 }, { op: 'mastery', branch: 'sword', add: 8 }] },
      { label: '외상 장부에서 가난한 집 몇의 이름을 몰래 지운다', hint: '그 집들은 겨울을 넘긴다. 들키면 가게의 돈을 훔친 셈이 된다', values: { justice: D }, mark: 'daring',
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'erasedDebts' }],
               else: [{ op: 'money', add: -20000 }, { op: 'flag', id: 'caughtErasing' }, { op: 'log', text: '지운 자리가 들켰다. 부모는 그 돈을 {name}의 몫에서 덜어 냈다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'kid_betrothal', kind: 'door', when: [...kid(12, 15), RICH], needs: ['parent'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '혼담', body: '이웃 섬 큰 상인 집안에서 혼담이 들어왔다. 부모는 두 집안이 손을 잡으면 장사가 두 배가 된다며 기뻐한다. 상대는 얼굴도 본 적이 없다.',
    doors: [
      { label: '집안을 위해 정혼을 받아들인다', hint: '열여덟이 되면 이웃 섬으로 간다. 집안의 장사가 크게 핀다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'betrothed' }, { op: 'money', add: 10000 }, { op: 'person', kind: 'ally', relation: '정혼자' }] },
      { label: '혼담 자리에서 뛰쳐나간다', hint: '두 집안 사이가 틀어진다. 부모는 {name}의 몫으로 떼어 둔 돈을 거둬들인다', values: { freedom: D }, mark: 'rebel', closes: true,
        fx: [{ op: 'money', add: -30000 }, { op: 'flag', id: 'brokeBetrothal' }] },
      { label: '상대 집안의 장부부터 보여 달라고 한다', hint: '어른들이 아연해한다. 건방진 아이라는 소문과 함께 셈 밝은 아이라는 소문이 난다', values: { ambition: D }, mark: 'composure',
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'shrewdMatch' }] },
    ],
  },
  {
    id: 'kid_sunk_fortune', kind: 'door', when: [...kid(11, 15), RICH], needs: ['parent'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '가라앉은 상선', body: '{name}의 집 재산을 실은 상선이 폭풍에 가라앉았다. 빚을 받으러 온 사람들이 문 앞에 줄을 섰고, 부모는 밤마다 장부를 붙들고 있다.',
    doors: [
      { label: '집안 물건을 팔아 빚부터 막자고 한다', hint: '집은 지킨다. 넉넉하던 살림은 끝난다', values: { justice: D },
        fx: [{ op: 'wealth', to: 'common' }, { op: 'money', add: -20000 }] },
      { label: '부모 대신 빚쟁이들을 만나 갚을 날을 미룬다', hint: '아이의 말에 어른들이 웃는다. 말이 통하면 한 해를 벌고, 아니면 창피만 산다', values: { ambition: D }, mark: 'daring',
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '빚쟁이들이 한 해 말미를 주었다. 그 한 해에 집안은 겨우 숨을 돌렸다.', weight: 'heavy' }],
               else: [{ op: 'wealth', to: 'common' }, { op: 'log', text: '빚쟁이들은 웃고 돌아가 이튿날 창고를 비웠다.', weight: 'heavy' }] }] },
      { label: '하인들의 밀린 품삯부터 치르자고 고집한다', hint: '하인들은 빈손으로 떠나지 않는다. 집은 남의 손에 넘어간다', values: { justice: D },
        fx: [{ op: 'wealth', to: 'poor' }, { op: 'money', add: -50000 }, { op: 'flag', id: 'paidServants' }, { op: 'timeline', text: '집안이 기울 때 하인들의 품삯부터 치렀다' }] },
    ],
  },
  {
    id: 'go_heir', kind: 'door', when: [...kid(14, 15), RICH], needs: ['parent'], weight: 12, repeat: 'once', speaker: 'hero',
    title: '집안의 열다섯', body: '부모가 {name}의 앞날을 정할 때가 됐다고 한다. 가게를 물려받거나, 학자를 집에 불러 더 배우거나. 그런데 {name}은(는) 요즘 부두에서 해적 수배서를 들여다보는 날이 많다.',
    doors: [
      { label: '가게를 물려받기로 한다', hint: '열여섯이면 계산대 뒤에 선다. 바다는 창문 너머의 풍경이 된다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 20000 }, { op: 'flag', id: 'familyShop' }, { op: 'timeline', text: '집안의 가게를 물려받았다' }] },
      { label: '학자를 집에 불러 바다와 별을 배운다', hint: '집안 돈이 크게 든다. 몇 해는 책상 앞에서 보낸다', values: { inquiry: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'learned' }] },
      { label: '집안 돈으로 배 한 척을 사 달라고 조른다', hint: '부모와 크게 다투고 용돈이 끊긴다. 열여섯이 되면 제 힘으로 나가야 한다', values: { romance: D }, mark: 'rebel',
        fx: [{ op: 'money', add: -20000 }, { op: 'flag', id: 'wantsShip' }] },
    ],
  },

  // ---------------------------------------------------------------- 가족이 있는 아이
  {
    id: 'kid_sibling_boat', kind: 'door', when: kid(8, 13), needs: ['sibling'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '형제의 돛단배', body: '형제가 몰래 고친 돛단배로 오늘 밤 앞바다의 무인도까지 가 보자고 한다. 하늘 끝에 먹구름이 걸려 있다.',
    doors: [
      { label: '같이 탄다', hint: '폭풍을 만나면 둘 다 돌아오지 못할 수도 있다. 해내면 평생 이야기할 밤이 된다', values: { romance: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'islandNight' }, { op: 'log', text: '무인도의 모래밭에 누워 별을 셌다. 새벽에 둘이 몰래 돌아왔다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '돌풍에 돛이 찢겼다. 이튿날 고깃배가 둘을 건져 올렸다.', weight: 'heavy' }] }] },
      { label: '부모에게 일러 배를 묶어 두게 한다', hint: '형제는 무사하다. 한동안 {name}과(와) 말을 섞지 않는다', needs: ['parent'], values: { freedom: D },
        fx: [{ op: 'flag', id: 'toldOnSibling' }] },
      { label: '돛단배의 밧줄을 몰래 풀어 떠내려 보낸다', hint: '아무도 바다에 나가지 않는다. 형제의 몇 달 품이 물거품이 된다', mark: 'composure',
        fx: [{ op: 'flag', id: 'sankSiblingBoat' }] },
    ],
  },
  {
    id: 'kid_parent_poster', kind: 'door', when: [...kid(8, 14), { c: 'lineage', is: ['pirateChild'] }], needs: ['parent'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '다락의 수배서', body: '다락을 뒤지다 낡은 수배서 한 장을 찾았다. 젊은 날의 부모 얼굴이 웃고 있다. 그 아래 적힌 현상금은 아직 지워지지 않았다.',
    doors: [
      { label: '수배서를 불태우고 못 본 척한다', hint: '집의 비밀은 지켜진다. {name}도 그 비밀을 평생 지고 산다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'parentSecret' }] },
      { label: '그 시절 바다 이야기를 해 달라고 조른다', hint: '부모는 오래 망설이다 입을 연다. 그날부터 {name}의 꿈이 바다로 기운다', values: { romance: D }, mark: 'obsession',
        fx: [{ op: 'flag', id: 'fatherTale' }] },
      { label: '수배서를 들고 해군 초소로 간다', hint: '포상금은 크다. 집은 그날로 부서진다', values: { justice: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'losePerson', who: 'parent' }, { op: 'log', text: '해군이 집에 들이닥쳤다. 끌려가는 부모는 {name}을(를) 끝내 돌아보지 않았다.', weight: 'heavy' },
             { op: 'timeline', text: '부모의 수배서를 해군에 넘겼다' }] },
    ],
  },

  // ---------------------------------------------------------------- 고향을 떠난 아이
  {
    id: 'kid_away_deck', kind: 'door', when: away(12, 15), weight: 10, repeat: 'once', speaker: 'hero',
    title: '낯선 항구의 막내', body: '고향을 떠난 지 몇 달, {island}의 일터에서 {name}은(는) 가장 어린 일꾼이다. 나이 많은 일꾼 하나가 날마다 {name}의 몫을 가로챈다.',
    doors: [
      { label: '나이 많은 일꾼에게 덤빈다', hint: '얻어맞고 일자리가 흔들린다. 그 뒤로 몫을 빼앗기지 않는다', values: { dominion: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -15 }, { op: 'mastery', branch: 'fist', add: 5 }] },
      { label: '일터 주인에게 일러바친다', hint: '주인은 막내의 말을 반만 믿는다. 일꾼들 사이에서 고자질쟁이가 된다', values: { justice: D },
        fx: [{ op: 'flag', id: 'awayTattler' }] },
      { label: '몫을 내주고 그 일꾼에게 일을 배운다', hint: '배는 고프다. 그 대신 손이 빨리 는다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }] },
    ],
  },
  {
    id: 'kid_away_letter', kind: 'door', when: away(12, 15), weight: 8, repeat: 'once', speaker: { relation: '고향 배의 뱃사람' },
    title: '고향에서 온 배', body: '{town}에서 온 배의 뱃사람이 고향 소식을 전한다. 함께 자란 아이들이 {name}을(를) 기다린다고 한다. 그 배는 내일 아침 {town}(으)로 돌아간다.',
    doors: [
      { label: '고향으로 돌아가는 배에 오른다', hint: '떠나 온 길을 거슬러 간다. 여기서 얻은 일자리는 다른 아이에게 간다', values: { loyalty: D },
        fx: [{ op: 'moveHome' }, { op: 'unflag', id: LEFT_HOME }, { op: 'log', text: '{town}의 부두에 내렸다. 떠날 때보다 마을이 작아 보였다.', weight: 'heavy' },
             { op: 'timeline', text: '고향으로 돌아왔다' }] },
      { label: '돌아가지 않고 이 항구에서 버틴다', hint: '고향의 얼굴들이 꿈에 나온다. 여기서 제 자리를 만든다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'flag', id: 'stayedAway' }] },
    ],
  },
];
