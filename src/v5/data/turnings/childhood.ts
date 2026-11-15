// 유년기 전환점 (3~15살, 로그타운). 문의 말에는 가치관 이름도 점수도 쓰지 않는다. 상황과 일어날 일만 적는다.
// 자리표시: {name} 이름만, {town} 자란 마을, {island} 섬. 성씨는 쓰지 않는다 (고아는 성이 없다).
import { V } from '../balance';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const kid = (min: number, max: number): Cond[] => [{ c: 'age', min, max }, { c: 'home', is: ['loguetown'] }];

export const CHILDHOOD: Turning[] = [
  {
    id: 'kid_bully', kind: 'door', when: kid(3, 10), weight: 10, repeat: 'once', speaker: 'hero',
    title: '골목대장', body: '{town} 골목에서 덩치 큰 아이가 작은 아이의 빵을 빼앗아 들고 웃는다.',
    doors: [
      { label: '끼어들어 막아선다', hint: '대신 얻어맞을지도 모른다', values: { justice: D }, mark: 'unyielding', fx: [{ op: 'hp', add: -10 }] },
      { label: '못 본 척 지나간다', hint: '오늘은 아무 일 없이 집에 간다', values: { peace: D }, fx: [] },
      { label: '골목대장을 꺾고 골목을 차지한다', hint: '아이들이 너를 따르게 된다', special: 'dominion', values: { dominion: D },
        fx: [{ op: 'flag', id: 'kidBoss' }, { op: 'log', text: '그날부터 골목 아이들은 {name}의 눈치를 보았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_sailor_tale', kind: 'door', when: kid(3, 9), weight: 10, repeat: 'once', speaker: { relation: '늙은 뱃사람' },
    title: '늙은 뱃사람의 이야기', body: '{island} 부두의 술집 앞, 다리를 저는 늙은 뱃사람이 위대한 항로 이야기를 들려준다.',
    doors: [
      { label: '밤늦도록 이야기를 듣는다', hint: '바다 저편이 마음에 오래 남는다', values: { romance: D }, fx: [] },
      { label: '지도를 그려 달라고 조른다', hint: '머릿속에 바닷길이 그려진다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '해 지기 전에 돌아가 집안일을 돕는다', hint: '이야기는 반만 듣는다', values: { devotion: D }, fx: [] },
    ],
  },
  {
    id: 'kid_sick_elder', kind: 'door', when: kid(6, 14), weight: 9, repeat: 'once', speaker: 'hero',
    title: '앓아누운 어른', body: '{name}을(를) 돌봐 주던 어른이 열병으로 앓아누웠다. 약값이 만만치 않다.',
    doors: [
      { label: '부두에서 짐을 날라 약값을 번다', hint: '몸은 고되지만 약을 살 수 있다', values: { devotion: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '의원에게서 비싼 약을 사 온다', hint: '집안 돈으로 금방 해결된다', when: [{ c: 'wealth', min: 'comfortable' }], values: { devotion: D }, fx: [{ op: 'money', add: -10000 }] },
      { label: '약초 책을 뒤져 직접 달인다', hint: '잘될지는 해 봐야 안다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'kid_marine_parade', kind: 'door', when: kid(4, 12), weight: 10, repeat: 'once', speaker: 'hero',
    title: '해군의 행진', body: '{island} 항구에 군함이 들어왔다. 흰 제복의 수병들이 줄을 맞춰 광장을 지나간다.',
    doors: [
      { label: '수병에게 경례하는 법을 배운다', hint: '언젠가 저 제복을 입고 싶어진다', values: { justice: D }, fx: [] },
      { label: '아버지의 옛 동료를 찾아간다', hint: '해군 집안의 연줄로 군함에 올라 본다', when: [{ c: 'lineage', is: ['marineFamily'] }], values: { loyalty: D, justice: D }, fx: [{ op: 'flag', id: 'marineContact' }] },
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
      { label: '데려가 몰래 돌본다', hint: '먹을 것을 나눠야 한다', values: { devotion: D }, fx: [{ op: 'flag', id: 'kidDog' }] },
      { label: '동네 아이들을 불러 함께 개집을 짓는다', hint: '함께할 친구가 생긴다', values: { loyalty: D }, mark: 'fellowship', fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 친구' }] },
      { label: '그냥 지나친다', hint: '젖지 않고 집에 간다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'kid_spyglass', kind: 'door', when: kid(5, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '부잣집 아이의 망원경', body: '부잣집 아이가 새 망원경을 자랑하며, 만져 보고 싶으면 절을 하라고 한다.',
    doors: [
      { label: '절하지 않고 돌아선다', hint: '망원경은 끝내 못 본다', values: { freedom: D }, mark: 'rebel', fx: [] },
      { label: '망원경을 빼앗아 버린다', hint: '그 집 어른들이 찾아온다', values: { dominion: D }, fx: [{ op: 'flag', id: 'kidFeared' }] },
      { label: '우리 집 망원경을 들고 나와 맞선다', hint: '집안 형편이 받쳐 준다', when: [{ c: 'wealth', min: 'comfortable' }], values: { ambition: D }, fx: [] },
    ],
  },
  {
    id: 'kid_dice', kind: 'door', when: kid(9, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '부두의 노름판', body: '부두 뒷골목에서 뱃사람들이 주사위 노름을 한다. 한 사람이 끼워 주겠다며 손짓한다.',
    doors: [
      { label: '가진 돈을 몽땅 건다', hint: '크게 따거나 몽땅 잃는다', values: { ambition: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 3000 }], else: [{ op: 'money', add: -3000 }] }] },
      { label: '노름판의 속임수를 지켜본다', hint: '손놀림의 비밀을 알아챈다', values: { inquiry: D }, mark: 'composure', fx: [] },
      { label: '경비대에 알린다', hint: '뱃사람들의 미움을 산다', values: { justice: D }, fx: [] },
    ],
  },
  {
    id: 'kid_bread', kind: 'door', when: kid(4, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '빵집 앞', body: '배고픈 겨울 아침, {town} 빵집 창가에 갓 구운 빵이 식고 있다.',
    doors: [
      { label: '빵 하나를 집어 들고 달아난다', hint: '들키면 크게 혼난다', values: { freedom: D }, mark: 'daring', danger: true, fx: [] },
      { label: '빵집 일을 거들고 얻어먹는다', hint: '하루 종일 반죽을 친다', values: { devotion: D }, fx: [{ op: 'base', key: 'str', add: 1 }] },
      { label: '거리 아이들을 모아 빵을 나눠 갖는다', hint: '거리의 아이들이 너를 따른다', when: [{ c: 'lineage', is: ['orphan'] }], values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '거리의 동무' }] },
    ],
  },
  {
    id: 'kid_scaffold', kind: 'door', when: kid(6, 15), weight: 10, repeat: 'once', speaker: 'hero',
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
      { label: '물에 뛰어들어 사람을 끌어올린다', hint: '파도가 아직 거칠다', values: { devotion: D, justice: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '구해 준 뱃사람' }] },
      { label: '부서진 배의 짐을 뒤진다', hint: '쓸 만한 것이 나올지도 모른다', values: { ambition: D }, fx: [{ op: 'money', add: 2000 }] },
      { label: '어른들을 부르러 달려간다', hint: '어른들이 알아서 한다', values: { peace: D, loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'kid_blind_swordsman', kind: 'door', when: kid(8, 15), weight: 8, repeat: 'once', speaker: { relation: '눈먼 검객' },
    title: '눈먼 검객', body: '마을 어귀 나무 아래, 눈먼 검객이 말없이 차를 끓이고 있다. 허리에 낡은 칼 한 자루가 있다.',
    doors: [
      { label: '옆에 앉아 차를 얻어 마신다', hint: '아무 말 없이 해가 진다', values: { peace: D }, fx: [] },
      { label: '칼을 가르쳐 달라고 조른다', hint: '몇 번이고 쫓겨난다', values: { ambition: D }, mark: 'obsession', fx: [{ op: 'mastery', branch: 'sword', add: 10 }] },
      { label: '검객처럼 눈을 감고 바람 소리를 듣는다', hint: '보이지 않던 것이 들린다', special: 'peace', values: { peace: D },
        fx: [{ op: 'mastery', branch: 'observation', add: 15 }] },
    ],
  },
  {
    id: 'kid_promise', kind: 'door', when: kid(8, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '떠나는 친구', body: '가장 가까운 동무가 먼 섬으로 이사를 간다. 떠나기 전날 밤, 바닷가에서 약속을 하자고 한다.',
    doors: [
      { label: '언젠가 같은 배를 타자고 약속한다', hint: '이 약속은 오래 남는다', values: { loyalty: D, romance: D }, mark: 'obsession', fx: [{ op: 'flag', id: 'kidPromise' }] },
      { label: '웃으며 보내 준다', hint: '담담하게 헤어진다', values: { peace: D }, fx: [] },
      { label: '손바닥을 그어 피로 맹세한다', hint: '평생 잊지 못할 밤이 된다', special: 'loyalty', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'bloodOath' }, { op: 'timeline', text: '떠나는 동무와 피로 맹세했다' }] },
    ],
  },
];
