// 유년기 전환점 (3~15살, 공통 사건과 섬별 대체 사건). 문의 말에는 가치관 이름도 점수도 쓰지 않는다. 상황과 일어날 일만 적는다.
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
 *  바다 · 항구를 전제하는 글은 index.ts의 landlocked가 내륙 고향에서 막는다 */
export const kid = (min: number, max: number): Cond[] => [{ c: 'age', min, max }, { c: 'standing', is: ['child'] }, stayed];
/** 그 마을에서 태어나 지금도 그 마을에 사는 아이 */
export const kidIn = (town: string, min: number, max: number, ...more: Cond[]): Cond[] =>
  [...kid(min, max), { c: 'town', is: [town] }, { c: 'island', is: [town] }, ...more];
/** 고향을 떠난 아이 */
const away = (min: number, max: number): Cond[] =>
  [{ c: 'age', min, max }, { c: 'home', is: ['loguetown'] }, { c: 'standing', is: ['child'] }, { c: 'flag', id: LEFT_HOME, has: true }];
export const POOR: Cond = { c: 'wealth', max: 'poor' };
export const RICH: Cond = { c: 'wealth', min: 'comfortable' };
const sickWhen: Cond[] = [...kid(6, 14), { c: 'flag', id: 'kidSicknessSeen', has: false }];
const noParent: Cond = { c: 'kin', who: 'parent', has: false };
const noGrandmother: Cond = { c: 'person', relation: '할머니', has: false };
const noGrandfather: Cond = { c: 'person', relation: '할아버지', has: false };
const noMentor: Cond = { c: 'person', relation: '스승', has: false };
const sickSeen: Fx = { op: 'flag', id: 'kidSicknessSeen' };
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
      { label: '끼어들어 막아선다', hint: '대신 얻어맞을지도 모른다', values: { justice: D }, mark: 'unyielding', fx: [{ op: 'hp', add: -10 }, { op: 'log', text: '골목대장의 주먹에 입술이 터졌다. 작은 아이는 떨어진 빵을 주워 달아났고, {name}은(는) 끝까지 길을 막았다.', weight: 'light' }] },
      { label: '골목대장 편에 붙어 빵 부스러기를 얻는다', hint: '배는 부르다. 빵을 빼앗긴 아이가 {name}을(를) 쳐다본다', values: { greed: D }, fx: [{ op: 'log', text: '빵을 나눠 먹는 동안 작은 아이는 빈손으로 골목을 떠났다. 골목대장은 다음에도 곁에 오라며 자리를 내주었다.', weight: 'light' }] },
      { label: '골목대장을 꺾고 골목을 차지한다', hint: '골목 아이들이 {name}을(를) 따르게 된다', special: 'dominion', values: { dominion: D },
        fx: [{ op: 'flag', id: 'kidBoss' }, { op: 'log', text: '그날부터 골목 아이들은 {name}의 눈치를 보았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_sailor_tale', kind: 'door', when: kid(3, 9), weight: 10, repeat: 'once', speaker: { relation: '늙은 뱃사람' },
    title: '늙은 뱃사람의 이야기', body: '{island}의 길목에서 다리를 저는 늙은 뱃사람이 위대한 항로 이야기를 들려준다.',
    doors: [
      { label: '밤늦도록 이야기를 듣는다', hint: '바다 저편이 마음에 오래 남는다', values: { romance: D }, fx: [{ op: 'log', text: '주변이 어두워진 뒤에도 뱃사람은 마지막 섬 이야기를 마저 들려주었다. {name}은(는) 돌아가는 길에 들은 말을 몇 번이고 되뇌었다.', weight: 'light' }] },
      { label: '지도를 그려 달라고 조른다', hint: '머릿속에 바닷길이 그려진다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '뱃사람은 손가락으로 섬의 자리를 짚으며 종이에 항로를 그렸다. 틀린 이름을 몇 번 고쳐 적다 보니 지도가 손때로 까매졌다.', weight: 'light' }] },
      { label: '뱃사람의 보물 이야기를 부잣집 아이에게 팔아넘긴다', hint: '몇 닢을 번다. 뱃사람이 다시는 이야기를 들려주지 않는다', values: { greed: D }, fx: [{ op: 'money', add: 2000 }, { op: 'log', text: '부잣집 아이에게 동전을 받고 들은 말을 옮겼다. 이튿날 뱃사람은 {name}이(가) 다가가자 이야기를 멈추고 자리를 떴다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wano_wanderer_tale', kind: 'door',
    when: [...kid(3, 9), { c: 'island', is: ['하나노미야코', '쿠리', '에비스 마을'] }],
    weight: 10, repeat: 'once', speaker: { relation: '떠돌이 낭인' },
    title: '떠돌이 낭인의 이야기', body: '{island}의 마을 어귀에서 쉬던 떠돌이 낭인이 먼 고을을 걸어온 이야기를 들려준다. 낡은 칼집에는 지나온 길의 흙이 묻어 있다.',
    doors: [
      { label: '밤늦도록 이야기를 듣는다', hint: '가 보지 못한 고을이 마음에 오래 남는다', values: { romance: D },
        fx: [{ op: 'log', text: '주변이 어두워진 뒤에도 낭인은 지나온 고을 이야기를 마저 들려주었다. {name}은(는) 돌아가는 길에 그 지명을 몇 번이고 되뇌었다.', weight: 'light' }] },
      { label: '지나온 길을 그려 달라고 조른다', hint: '고을과 고을 사이의 길이 머릿속에 그려진다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '낭인은 손가락으로 고개와 강을 짚으며 종이에 길을 그렸다. 틀린 지명을 몇 번 고쳐 적다 보니 종이가 손때로 까매졌다.', weight: 'light' }] },
      { label: '낭인의 보따리에서 동전을 슬쩍 꺼낸다', hint: '몇 닢을 얻는다. 낭인은 다시 이야기를 들려주지 않는다', values: { greed: D },
        fx: [{ op: 'money', add: 2000 }, { op: 'log', text: '낭인이 보따리의 빈 자리를 눈치챘다. 이튿날 {name}이(가) 다가가자 이야기를 멈추고 자리를 떴다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_sick_elder', kind: 'door', when: [...sickWhen, { c: 'kin', who: 'parent', has: true }], needs: ['parent'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '가족의 열병', body: '{parent}가 열병으로 앓아누웠다. 평소 잠을 덮어 주던 손이 오늘은 이불 밖으로 나오지 않는다. 의원은 약값을 먼저 말한다.',
    doors: [
      { label: '장터에서 짐을 날라 약값을 번다', hint: '손은 아프지만 약을 살 수 있다', values: { ambition: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '해 질 때까지 짐을 나르자 손바닥에 물집이 잡혔다. 품삯을 내밀며 {parent}의 열을 설명하자 의원이 약봉지를 건넸다.', weight: 'light' }, sickSeen] },
      { label: '집안 돈으로 약을 사 온다', hint: '약값은 크지만 오늘 안에 돌아올 수 있다', when: [{ c: 'wealth', min: 'comfortable' }], values: { peace: D }, fx: [{ op: 'money', add: -10000 }, { op: 'log', text: '약 봉투를 들고 돌아오자 {parent}가 겨우 눈을 떴다. 집안 돈은 줄었지만 침상 곁의 걱정은 조금 누그러졌다.', weight: 'light' }, sickSeen] },
      { label: '약초 책을 뒤져 약을 달인다', hint: '잘될지는 해 봐야 안다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '책장마다 약초 모양을 대조해 쓴 탕약을 달였다. {parent}는 한 모금 마시고 얼굴을 찌푸렸지만 {name}의 손을 놓지 않았다.', weight: 'light' }, sickSeen] },
    ],
  },
  {
    id: 'kid_sick_grandmother', kind: 'door', when: [...sickWhen, noParent, { c: 'flag', id: 'grandGuard', has: true }, { c: 'person', relation: '할머니', has: true }], weight: 9, repeat: 'once', speaker: 'hero',
    title: '식어 가는 아궁이', body: '할머니가 열병으로 누운 뒤 아궁이 불이 꺼졌다. 늘 먼저 일어나 밥을 짓던 사람이 물 한 모금도 삼키기 힘들어한다.',
    doors: [
      { label: '남의 집 물동이를 날라 약값을 번다', hint: '물동이는 무겁지만 의원을 부를 수 있다', values: { ambition: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '몇 집의 물동이를 채우고 받은 동전을 세어 의원에게 달려갔다. 할머니는 약을 받아 들고도 먼저 갈라진 손바닥을 살폈다.', weight: 'light' }, sickSeen] },
      { label: '이웃에게 도움을 청한다', hint: '혼자 짊어지지 않아도 된다', values: { loyalty: D }, fx: [{ op: 'log', text: '이웃이 마른 장작과 약초를 들고 왔다. 할머니는 부엌에 다시 불이 붙는 소리를 듣고 겨우 미소를 지었다.', weight: 'light' }, sickSeen] },
      { label: '할머니가 가르쳐 준 약초를 찾아 달인다', hint: '기억을 더듬어 손수 돌본다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '할머니가 예전에 가리켜 준 잎을 골라 쓴 물을 달였다. 한 모금 넘긴 할머니가 맞는 풀이라고 고개를 끄덕였다.', weight: 'light' }, sickSeen] },
    ],
  },
  {
    id: 'kid_sick_grandfather', kind: 'door', when: [...sickWhen, noParent, { c: 'flag', id: 'grandGuard', has: true }, { c: 'person', relation: '할아버지', has: true }], weight: 9, repeat: 'once', speaker: 'hero',
    title: '멈춘 손길', body: '할아버지가 열병으로 누운 뒤 손때 묻은 공구가 작업대 위에 그대로 놓였다. 저녁마다 들려주던 이야기도 기침에 끊긴다.',
    doors: [
      { label: '장작을 패 주고 품삯으로 약을 산다', hint: '도끼질이 서툴러도 끝까지 해 본다', values: { ambition: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '해 질 때까지 장작을 패고 의원에게 동전을 내밀었다. 할아버지는 약봉지보다 먼저 부르튼 손을 보고 한참 말을 잇지 못했다.', weight: 'light' }, sickSeen] },
      { label: '할아버지와 아는 이웃을 찾아간다', hint: '옛 인연이 힘을 보탤지도 모른다', values: { loyalty: D }, fx: [{ op: 'log', text: '이웃은 할아버지에게 빌린 공구를 돌려주러 온 참이었다. 사정을 듣자 약값을 보태고 침상 곁에 앉아 옛이야기를 꺼냈다.', weight: 'light' }, sickSeen] },
      { label: '의원에게 열을 낮출 방법을 배운다', hint: '밤새 곁에서 직접 돌본다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '의원이 일러 준 대로 찬 물수건을 갈아 얹었다. 새벽녘 할아버지의 기침이 잦아들자 그제야 의자에 기대 잠들었다.', weight: 'light' }, sickSeen] },
    ],
  },
  {
    id: 'kid_sick_mentor', kind: 'door', when: [...sickWhen, noParent, noGrandmother, noGrandfather, { c: 'person', relation: '스승', has: true }], weight: 9, repeat: 'once', speaker: 'hero',
    title: '스승의 빈자리', body: '늘 새벽 수련을 깨우던 스승이 열병으로 일어나지 못했다. 목검은 문 옆에 기대어 있고 약을 구할 사람은 {name}뿐이다.',
    doors: [
      { label: '심부름을 맡아 스승의 약값을 번다', hint: '수련 대신 하루를 일한다', values: { ambition: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '해 질 때까지 심부름을 하고 의원에게 품삯을 내밀었다. 스승은 약을 받자마자 오늘 수련은 쉬라며 {name}의 손을 끌어당겼다.', weight: 'light' }, sickSeen] },
      { label: '스승을 오래 알던 사람을 찾아간다', hint: '혼자 감당할 일을 나눈다', values: { loyalty: D }, fx: [{ op: 'log', text: '옛 친구는 스승의 이름을 듣고 약상자를 들고 찾아왔다. 두 사람이 낮은 목소리로 이야기를 나누는 동안 {name}은(는) 물을 데웠다.', weight: 'light' }, sickSeen] },
      { label: '의원에게 간호하는 법을 배운다', hint: '스승 곁을 지키며 열을 살핀다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '의원이 알려 준 대로 물수건을 갈고 열이 오르는 때를 적었다. 스승은 눈을 뜨자마자 잘 배웠다고 말했다.', weight: 'light' }, sickSeen] },
    ],
  },
  {
    id: 'kid_sick_neighbor', kind: 'door', when: [...sickWhen, noParent, noGrandmother, noGrandfather, noMentor, { c: 'flag', id: 'lonely', has: false }], weight: 9, repeat: 'once', speaker: 'hero',
    title: '닫힌 이웃집 문', body: '가끔 남은 밥을 내주던 이웃이 열병으로 문을 열지 못한다. {name}은(는) 빈 그릇을 든 채 한참 문 앞에 서 있다.',
    doors: [
      { label: '이웃의 약값을 벌려고 짐을 나른다', hint: '빈 그릇을 돌려줄 때 약도 건넨다', values: { ambition: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '짐을 나르고 번 돈으로 약을 샀다. 이웃은 문틈으로 약봉지를 받고, 전에 건넸던 그릇에 따뜻한 물을 채워 돌려주었다.', weight: 'light' }, sickSeen] },
      { label: '다른 이웃들에게 사정을 알린다', hint: '작은 도움을 모은다', values: { loyalty: D }, fx: [{ op: 'log', text: '한 사람은 물을 끓이고 다른 사람은 의원을 불렀다. 닫혀 있던 이웃집 문이 열리자 {name}은(는) 빈 그릇을 안고 안으로 들어갔다.', weight: 'light' }, sickSeen] },
      { label: '의원에게 할 수 있는 일을 묻는다', hint: '약이 오기 전까지 곁을 지킨다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '의원이 알려 준 대로 물을 조금씩 먹이고 숨소리를 살폈다. 이웃은 정신이 들자 왜 아직 여기 있느냐고 묻고는 이불을 한쪽 내주었다.', weight: 'light' }, sickSeen] },
    ],
  },
  {
    id: 'kid_sick_alone', kind: 'door', when: [...sickWhen, noParent, noGrandmother, noGrandfather, noMentor, { c: 'flag', id: 'lonely', has: true }], weight: 9, repeat: 'once', speaker: 'hero',
    title: '혼자 앓는 밤', body: '열병이 찾아왔다. 좁은 잠자리에서 눈을 뜨니 물을 떠다 줄 사람도 약을 사다 줄 사람도 없다.',
    doors: [
      { label: '몸을 일으켜 약값을 벌러 나간다', hint: '쓰러지기 전에 의원에게 닿아야 한다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '열병으로 비틀거리면서도 짐을 나르고 품삯으로 약을 샀다. 스스로 물을 떠 약을 삼킨 뒤에야 이불 속으로 돌아왔다.', weight: 'light' }, sickSeen] },
      { label: '지나가는 사람에게 도움을 청한다', hint: '처음으로 낯선 이에게 손을 내민다', values: { loyalty: D }, fx: [{ op: 'log', text: '지나가던 사람이 의원을 불러 주었다. 이름도 묻지 못한 채 약을 받아 들었지만, 누군가 곁에 앉아 있던 밤은 오래 남았다.', weight: 'light' }, sickSeen] },
      { label: '물과 그늘을 찾아 열이 내리기를 기다린다', hint: '혼자 버틸 방법을 찾는다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '물을 조금씩 마시며 열이 오를 때마다 그늘로 옮겼다. 새벽에 땀이 식자 스스로 버틴 밤이 끝났다는 걸 알았다.', weight: 'light' }, sickSeen] },
    ],
  },
  {
    id: 'kid_marine_parade', kind: 'door', when: kid(4, 12), weight: 10, repeat: 'once', speaker: 'hero',
    title: '해군의 행진', body: '{island} 항구에 군함이 들어왔다. 흰 제복의 수병들이 줄을 맞춰 광장을 지나간다.',
    doors: [
      { label: '수병에게 경례하는 법을 배운다', hint: '언젠가 저 제복을 입고 싶어진다', values: { justice: D }, fx: [{ op: 'log', text: '수병이 손끝의 각도를 고쳐 주었다. 군함이 떠난 뒤에도 {name}은(는) 거울 앞에서 그 자세를 몇 번이고 되풀이했다.', weight: 'light' }] },
      { label: '아버지의 옛 전우를 찾아간다', hint: '해군 집안의 연줄로 군함에 올라 본다', when: [{ c: 'lineage', is: ['marineFamily'] }], values: { loyalty: D, justice: D }, fx: [{ op: 'flag', id: 'marineContact' }, { op: 'log', text: '옛 전우는 아버지 이름을 듣고 갑판으로 이끌었다. 출항 종이 울릴 때까지 군함 곳곳을 보여 주고, 다음에 오면 또 찾아오라 했다.', weight: 'light' }] },
      { label: '행진 대열 뒤에서 수병 흉내를 내며 놀린다', hint: '어른들에게 꾸중을 듣는다', values: { freedom: D }, mark: 'rebel', fx: [{ op: 'log', text: '구경하던 아이들이 웃음을 터뜨리자 수병 하나가 뒤돌아보았다. 어른에게 붙잡혀 광장 밖으로 끌려가면서도 {name}은(는) 웃음을 참지 못했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wanted_poster', kind: 'door', when: kid(5, 13), weight: 10, repeat: 'once', speaker: 'hero',
    title: '현상수배서', body: '마을 게시판에 새 현상수배서가 붙었다. 활짝 웃는 해적의 얼굴 아래 큰돈이 적혀 있다.',
    doors: [
      { label: '수배서를 몰래 떼어 간직한다', hint: '저 사람처럼 웃으며 살고 싶어진다', values: { freedom: D, romance: D }, fx: [{ op: 'log', text: '종이를 접어 품에 넣자 게시판에는 못 자국만 남았다. 집에 돌아와 구겨진 웃는 얼굴을 펴 보았다.', weight: 'light' }] },
      { label: '언젠가 내 얼굴도 저기 걸리겠다고 다짐한다', hint: '마음속에 큰 꿈이 자리 잡는다', values: { ambition: D }, mark: 'obsession', fx: [{ op: 'log', text: '수배서 아래 선 채 한참 현상금의 자릿수를 세었다. 그날부터 빈 종이 귀퉁이에 자신의 이름을 써 보곤 했다.', weight: 'light' }] },
      { label: '아버지가 남긴 바다 이야기를 떠올린다', hint: '해적의 아이만 아는 이야기가 있다', when: [{ c: 'lineage', is: ['pirateChild'] }], values: { freedom: D, loyalty: D }, fx: [{ op: 'flag', id: 'fatherTale' }, { op: 'log', text: '수배서의 웃는 얼굴에서 아버지가 들려주던 항구 이름이 떠올랐다. {name}은(는) 집에 돌아가 그 이야기를 다시 물었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wooden_sword', kind: 'door', when: kid(6, 14), weight: 10, repeat: 'once', speaker: 'hero',
    title: '목검', body: '동네 형이 목검 두 자루를 들고 와 한판 붙자고 한다. 이긴 적이 한 번도 없다.',
    doors: [
      { label: '지고 또 덤빈다', hint: '해가 질 무렵엔 온몸이 멍투성이다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: 'mastery', branch: 'sword', add: 10 }, { op: 'log', text: '몇 번째로 흙바닥에 누웠는지 잊었다. 형은 돌아서려다 {name}이(가) 다시 목검을 들자 자세를 고쳐 잡았다.', weight: 'light' }] },
      { label: '덤비지 않고 형의 버릇을 지켜본다', hint: '이길 틈이 보이기 시작한다', values: { inquiry: D }, mark: 'composure', fx: [{ op: 'mastery', branch: 'observation', add: 5 }, { op: 'log', text: '형이 내리치기 전 왼발을 고쳐 딛는 것을 알아챘다. 다음 겨룸에서는 그 발이 움직일 때 먼저 몸을 비켰다.', weight: 'light' }] },
      { label: '그만하고 같이 바다나 보자고 한다', hint: '싸움 없이 하루가 저문다', values: { peace: D }, fx: [{ op: 'log', text: '형은 목검을 내려놓고 함께 방파제에 앉았다. 두 사람은 서로를 이기는 대신 돌아오는 배를 세며 해가 질 때까지 시간을 보냈다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_stray_dog', kind: 'door', when: kid(3, 10), weight: 10, repeat: 'once', speaker: 'hero',
    title: '떠돌이 개', body: '비 오는 날, 다리를 저는 떠돌이 개가 처마 밑에서 떨고 있다.',
    doors: [
      { label: '데려가 몰래 돌본다', hint: '먹을 것을 나눠야 한다', values: { peace: D }, fx: [{ op: 'flag', id: 'kidDog' }, { op: 'log', text: '마른 천으로 개의 다리를 감쌌다. 며칠 뒤에는 처마 아래서 {name}의 발소리만 들어도 꼬리를 흔들었다.', weight: 'light' }] },
      { label: '동네 아이들을 불러 함께 개집을 짓는다', hint: '함께할 친구가 생긴다', values: { loyalty: D }, mark: 'fellowship', fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 친구' }, { op: 'log', text: '아이들이 널빤지와 헌 담요를 하나씩 가져왔다. 개집 지붕이 올라간 뒤에도 그 아이들은 날마다 함께 모였다.', weight: 'light' }] },
      { label: '개장수에게 넘기고 동전을 받는다', hint: '동전 몇 닢이 생긴다. 이튿날 처마 밑은 비어 있다', values: { greed: D }, fx: [{ op: 'money', add: 500 }, { op: 'log', text: '개장수의 수레가 골목을 빠져나갔다. 주머니 속 동전을 만지작거리다 돌아오니 처마 밑에 젖은 발자국만 남았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_spyglass', kind: 'door', when: kid(5, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '부잣집 아이의 망원경', body: '부잣집 아이가 새 망원경을 자랑하며, 만져 보고 싶으면 절을 하라고 한다.',
    doors: [
      { label: '절하지 않고 돌아선다', hint: '망원경은 끝내 못 본다', values: { freedom: D }, mark: 'rebel', fx: [{ op: 'log', text: '아이는 망원경을 높이 치켜들고 놀렸지만 {name}은(는) 돌아보지 않았다. 혼자 언덕에 올라 맨눈으로 먼 배를 찾았다.', weight: 'light' }] },
      { label: '망원경을 빼앗아 버린다', hint: '그 집 어른들이 찾아온다', values: { dominion: D }, fx: [{ op: 'flag', id: 'kidFeared' }, { op: 'log', text: '망원경을 쥔 손을 놓지 않자 아이가 울음을 터뜨렸다. 저녁에는 그 집 어른들이 문 앞에 찾아왔고, 동네 아이들은 {name}을(를) 피해 다녔다.', weight: 'light' }] },
      { label: '우리 집 망원경을 들고 나와 맞선다', hint: '집안 형편이 받쳐 준다', when: [{ c: 'wealth', min: 'comfortable' }], values: { dominion: D }, fx: [{ op: 'log', text: '두 망원경을 나란히 들이대자 자랑하던 아이가 먼저 말을 잃었다. 곁에 모인 아이들은 어느 쪽이 더 멀리 보이는지 번갈아 들여다보았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_dice', kind: 'door', when: kid(9, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '부두의 노름판', body: '부두 뒷골목에서 뱃사람들이 주사위 노름을 한다. 한 사람이 끼워 주겠다며 손짓한다.',
    doors: [
      { label: '노름판에 끼어든다', hint: '돈을 얻거나 빈손으로 끝난다', values: { greed: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'money', add: 4000 }, { op: 'log', text: '마지막 주사위가 멈추자 뱃사람들의 웃음이 끊겼다. {name}은(는) 쌓인 동전을 움켜쥐고 노름판을 빠져나왔다.', weight: 'light' }], else: [{ op: 'money', add: -3000 }, { op: 'log', text: '마지막 주사위가 빗나갔다. 이번 판에서 돌아오는 몫은 없었다. 뱃사람들은 벌써 다음 판을 벌였다.', weight: 'light' }] }] },
      { label: '노름판의 속임수를 지켜본다', hint: '손놀림의 비밀을 알아챈다', values: { inquiry: D }, mark: 'composure', fx: [{ op: 'log', text: '한 뱃사람이 주사위를 던지기 직전 손가락으로 모서리를 바꿔 쥐었다. {name}은(는) 그 손을 보고도 모른 척 판을 떠났다.', weight: 'light' }] },
      { label: '경비대에 알린다', hint: '뱃사람들의 미움을 산다', values: { justice: D }, fx: [{ op: 'person', kind: 'rival', relation: '노름판의 뱃사람' }, { op: 'log', text: '경비대가 골목에 들이닥치자 판이 뒤집혔다. 붙잡힌 뱃사람 하나가 {name}의 얼굴을 똑똑히 기억해 두겠다고 소리쳤다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_bread', kind: 'door', when: kid(4, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '빵집 앞', body: '배고픈 겨울 아침, {town} 빵집 창가에 갓 구운 빵이 식고 있다.',
    doors: [
      { label: '빵 하나를 집어 들고 달아난다', hint: '들키면 크게 혼난다', values: { freedom: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.4, then: [{ op: 'hp', add: -8 }, { op: 'log', text: '빵집 주인에게 덜미를 잡혀 골목이 떠나가게 혼났다.', weight: 'light' }], else: [{ op: 'log', text: '골목 모퉁이를 돌아서야 발을 멈췄다. 아직 따뜻한 빵을 급히 베어 물며 뒤를 살폈지만 주인은 나오지 않았다.', weight: 'light' }] }] },
      { label: '빵집 일을 거들고 얻어먹는다', hint: '하루 종일 반죽을 친다', values: { romance: D }, fx: [{ op: 'base', key: 'str', add: 1 }, { op: 'log', text: '밀가루가 옷깃까지 내려앉을 무렵 주인이 식은 빵 하나를 건넸다. {name}은(는) 반죽을 친 팔을 털며 그 자리에서 먹었다.', weight: 'light' }] },
      { label: '거리 아이들을 모아 빵을 나눠 갖는다', hint: '거리의 아이들이 {name}을(를) 따른다', when: [{ c: 'lineage', is: ['orphan'] }], values: { dominion: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '거리의 동무' }, { op: 'log', text: '거리 아이들이 빵을 한 조각씩 나눴다. 가장 작은 아이가 제 몫을 들고 {name}의 뒤를 따라오더니 그날부터 곁에 남았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_scaffold', kind: 'door', when: kidIn('로그타운', 6, 15), weight: 10, repeat: 'once', speaker: 'hero',
    title: '처형대', body: '{island} 광장의 처형대. 어른들은 해적왕이 저 위에서 웃으며 죽었다고 말한다.',
    doors: [
      { label: '몰래 처형대 위에 올라가 바다를 본다', hint: '들키면 경비에게 끌려 내려온다', values: { romance: D }, mark: 'obsession', fx: [{ op: 'log', text: '나무판 위에 서자 광장 끝 바다가 보였다. 경비의 발소리가 가까워져 뛰어내렸지만, 그 높이에서 본 풍경은 오래 남았다.', weight: 'light' }] },
      { label: '해적왕이 남긴 말을 곱씹는다', hint: '그 말의 뜻을 알고 싶어진다', values: { inquiry: D }, fx: [{ op: 'log', text: '광장 사람마다 해적왕의 마지막 말을 다르게 전했다. {name}은(는) 처형대 아래서 몇 사람의 이야기를 더 들은 뒤 집으로 돌아갔다.', weight: 'light' }] },
      { label: '언젠가 저 사람보다 높이 서겠다고 맹세한다', hint: '한 번 한 맹세는 거둘 수 없다', special: 'ambition', values: { ambition: D },
        fx: [{ op: 'flag', id: 'kingOath' }, { op: 'log', text: '처형대의 그림자가 발밑까지 닿을 때까지 서 있었다. 그날의 맹세는 아무에게도 말하지 않았지만, 광장을 지날 때마다 되살아났다.', weight: 'heavy' }, { op: 'timeline', text: '처형대 앞에서 맹세했다' }] },
    ],
  },
  {
    id: 'kid_shipwreck', kind: 'door', when: kid(7, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '폭풍 뒤의 해변', body: '폭풍이 지난 아침, 해변에 부서진 배와 정신을 잃은 뱃사람이 떠밀려 왔다.',
    doors: [
      { label: '물에 뛰어들어 사람을 끌어올린다', hint: '파도가 아직 거칠다', needs: ['swim'], values: { justice: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '구해 준 뱃사람' }, { op: 'log', text: '파도가 둘을 다시 끌어당겼지만 모래밭까지 기어 나왔다. 정신을 차린 뱃사람은 {name}의 손을 놓지 않고 이름을 물었다.', weight: 'light' }] },
      { label: '부서진 배의 짐을 뒤진다', hint: '쓸 만한 것이 나올지도 모른다', values: { inquiry: D }, fx: [{ op: 'money', add: 2000 }, { op: 'log', text: '부서진 궤짝 틈에서 젖지 않은 동전 꾸러미를 찾아냈다. 멀리서 구조하러 온 어른들의 목소리가 들리자 짐을 닫았다.', weight: 'light' }] },
      { label: '어른들을 부르러 달려간다', hint: '어른들이 알아서 한다', values: { peace: D, loyalty: D }, fx: [{ op: 'log', text: '마을에서 들것과 물을 가져온 어른들이 뱃사람을 옮겼다. {name}은(는) 모래 위에 남은 발자국을 따라가며 그가 숨 쉬는지 거듭 확인했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_blind_swordsman', kind: 'door', when: kid(8, 15), weight: 8, repeat: 'once', speaker: { relation: '눈먼 검객' },
    title: '눈먼 검객', body: '마을 어귀 나무 아래, 눈먼 검객이 말없이 차를 끓이고 있다. 허리에 낡은 칼 한 자루가 있다.',
    doors: [
      { label: '옆에 앉아 차를 얻어 마신다', hint: '아무 말 없이 해가 진다', values: { peace: D }, fx: [{ op: 'log', text: '검객은 찻잔 하나를 더 내놓았다. 서로 말을 걸지 않은 채 잎사귀 소리와 찻물 식는 소리만 들었다.', weight: 'light' }] },
      { label: '칼을 가르쳐 달라고 조른다', hint: '몇 번이고 쫓겨난다', values: { ambition: D }, mark: 'obsession', fx: [{ op: 'mastery', branch: 'sword', add: 10 }, { op: 'log', text: '검객은 처음에는 돌려보냈다. 사흘째 다시 찾아오자 비로소 나뭇가지를 쥐여 주고 발을 놓는 자리부터 고쳐 주었다.', weight: 'light' }] },
      { label: '검객처럼 눈을 감고 바람 소리를 듣는다', hint: '보이지 않던 것이 들린다', special: 'peace', values: { inquiry: D }, 
        fx: [{ op: 'mastery', branch: 'observation', add: 15 }, { op: 'log', text: '눈을 감자 검객의 찻잔보다 먼저 나뭇잎 스치는 소리가 들렸다. 검객은 아무 말 없이 다시 물을 끓였다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_ship_friend', kind: 'door', when: [...kid(5, 9), { c: 'person', relation: '어릴 적 동무', has: false }], weight: 9, repeat: 'once', speaker: 'hero',
    title: '물길의 작은 배', body: '부두에서 주운 나무 조각으로 작은 배를 만들고 있는데 또래 아이 하나가 다가온다. 돛을 달면 더 멀리 갈 수 있다며 천 조각을 내민다.',
    doors: [
      { label: '돛을 함께 달고 배를 띄운다', hint: '둘의 배가 물살을 따라 멀리 간다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 동무' }, { op: 'log', text: '{friend}와(과) 돛을 달자 작은 배가 부두 밖으로 흘러갔다. 둘은 배가 보이지 않을 때까지 물길을 따라 뛰었다.', weight: 'light' }, { op: 'timeline', text: '{friend}와(과) 첫 배를 만들어 띄웠다' }] },
      { label: '누가 만든 배가 더 빠른지 겨룬다', hint: '다음번에도 서로의 배를 가져오기로 한다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 동무' }, { op: 'log', text: '{friend}와(과) 나란히 배를 띄웠다. 물살이 달라 승부가 나지 않자 다음 날 같은 자리에서 다시 만나기로 했다.', weight: 'light' }] },
      { label: '천 조각을 받고 나무를 나눠 준다', hint: '각자의 배를 만들지만 매일 같은 부두에 모인다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 동무' }, { op: 'log', text: '{friend}와(과) 나무와 천을 나눴다. 그 뒤로도 둘은 부두에서 각자의 배를 만들며 서로 손이 모자랄 때 도왔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_promise', kind: 'door', when: [...kid(8, 15), { c: 'person', relation: '어릴 적 동무', has: true, kinds: ['ally'] }], weight: 9, repeat: 'once', speaker: { relation: '어릴 적 동무' },
    title: '떠나는 친구', body: '부두에서 함께 작은 배를 만들던 {friend}이(가) 먼 섬으로 이사를 간다. 떠나기 전날 밤, 바닷가에서 약속을 하자고 한다.',
    doors: [
      { label: '언젠가 같은 배를 타자고 약속한다', hint: '이 약속은 오래 남는다', values: { romance: D }, mark: 'obsession', fx: [{ op: 'flag', id: 'kidPromise' }, { op: 'personChange', relation: '어릴 적 동무', bond: 10 }, { op: 'log', text: '{friend}은(는) 다음에 만날 배의 이름을 미리 짓자며 웃었다. 배가 떠나는 아침, 둘은 항구 양쪽에서 그 이름을 소리쳐 불렀다.', weight: 'light' }, { op: 'timeline', text: '{friend}와(과) 언젠가 같은 배를 타기로 약속했다' }] },
      { label: '웃으며 보내 준다', hint: '담담하게 헤어진다', values: { peace: D }, fx: [{ op: 'log', text: '{friend}이(가) 탄 배가 작아질 때까지 손을 흔들었다. 동무가 보이지 않게 된 뒤에야 바닷가에 앉아 조금 더 시간을 보냈다.', weight: 'light' }] },
      { label: '손바닥을 그어 피로 맹세한다', hint: '평생 잊지 못할 밤이 된다', special: 'loyalty', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'bloodOath' }, { op: 'personChange', relation: '어릴 적 동무', bond: 15 }, { op: 'log', text: '두 손바닥을 맞댄 뒤 {friend}은(는) 상처를 천으로 싸 주었다. 이튿날 배가 떠날 때도 그 붕대가 손에 남아 있었다.', weight: 'heavy' }, { op: 'timeline', text: '{friend}와(과) 피로 맹세했다' }] },
    ],
  },

  // ---------------------------------------------------------------- 어느 집 아이에게나 (가족이 없어도)
  {
    id: 'kid_rival', kind: 'door', when: [...kid(3, 9), { c: 'kin', who: 'sibling', has: false }, { c: 'flag', id: 'lonely', has: false }],   // 형제가 있으면 맞수 대신 형제의 이야기가 온다 (bonds.ts)
    weight: 9, repeat: 'once', speaker: 'hero',
    title: '눈이 마주친 또래', body: '마을 어귀의 좁은 길에서 고집 센 또래와 마주쳤다. 둘 다 먼저 눈을 피하지 않는다.',
    doors: [
      { label: '먼저 주먹을 날린다', hint: '코피가 터지도록 뒹군다. 그 아이와는 오래 겨루는 사이가 된다', values: { dominion: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -8 }, { op: 'person', kind: 'rival', relation: '어릴 적 맞수' }, { op: 'flag', id: 'kidRival' }, { op: 'log', text: '둘 다 흙투성이가 된 뒤에야 주먹을 내렸다. 다음 날 그 아이는 같은 자리에서 다시 {name}을(를) 기다리고 있었다.', weight: 'light' }] },
      { label: '마을을 한 바퀴 돌아 누가 먼저 도착하는지 겨룬다', hint: '지면 한 해 내내 놀림감이 된다. 이기든 지든 다음 시합을 약속하게 된다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'person', kind: 'rival', relation: '어릴 적 맞수' }, { op: 'flag', id: 'kidRival' },
             { op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'base', key: 'spd', add: 1 }, { op: 'log', text: '출발선에 먼저 돌아왔다. 뒤따라온 아이는 숨을 고르자마자 내일 다시 겨루자고 했다.', weight: 'light' }], else: [{ op: 'log', text: '출발선으로 돌아왔을 때 반 걸음 뒤졌다. 그해 내내 놀림을 받았다.', weight: 'light' }] }] },
      { label: '눈싸움을 그만두고 손을 내민다', hint: '그 아이는 한참 망설이다 손을 잡는다. 겨룰 상대 대신 놀 동무가 생긴다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '어릴 적 친구' }, { op: 'log', text: '내민 손을 한참 보던 아이가 마침내 맞잡았다. 둘은 마을 어귀까지 나란히 걸으며 서로 이름을 물었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_drown', kind: 'door', when: kid(3, 9), weight: 8, repeat: 'once', speaker: 'hero',
    title: '부두에서 빠진 날', body: '부두 끝에서 놀다 발을 헛디뎌 바다에 빠졌다. 짠물이 코로 들어오고, 부두 기둥은 손이 닿을 듯 말 듯하다.',
    doors: [
      { label: '발버둥 쳐 헤엄쳐 나온다', hint: '물을 잔뜩 먹고 기어 나온다. 그날부터 바다가 덜 무섭다', needs: ['swim'], values: { freedom: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '기둥에 손끝이 닿자 몸을 끌어올렸다. 한동안 부두 바닥에 엎드려 짠물을 토한 뒤 젖은 옷으로 집에 돌아갔다.', weight: 'light' }] },
      { label: '목이 터져라 도움을 부른다', hint: '지나가던 어부가 건져 준다. 어른들이 한동안 {name}을(를) 부두에 못 가게 한다',
        fx: [{ op: 'person', kind: 'ally', relation: '생명의 은인' }, { op: 'flag', id: 'pierBanned' }, { op: 'log', text: '어부가 배 끝에서 손을 뻗어 {name}을(를) 끌어올렸다. 집에 돌아오자 어른들이 젖은 옷을 갈아입히고 한동안 부두 근처에는 가지 말라고 했다.', weight: 'light' }] },
      { label: '기둥의 따개비를 붙잡고 숨을 고른다', hint: '손바닥이 따개비에 찢긴다. 물이 빠질 때까지 혼자 버틴다', values: { ambition: D }, mark: 'composure',
        fx: [{ op: 'hp', add: -15 }, { op: 'log', text: '물이 빠지고서야 피투성이 손으로 부두에 기어올랐다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_fever', kind: 'door', when: kid(3, 9), weight: 7, repeat: 'once', speaker: 'hero',
    title: '열병', body: '{name}이(가) 열병에 걸려 사흘째 끓는다. 돌봐 주는 어른이 의원을 불러왔지만, 듣는 약은 값이 비싸다.',
    doors: [
      { label: '비싼 약을 쓴다', hint: '사흘 만에 일어난다. 집안 돈이 크게 축난다', when: [RICH], fx: [{ op: 'money', add: -20000 }, { op: 'log', text: '약을 먹고 사흘째 되는 날 열이 내렸다. 침상 곁에 쌓인 빈 약봉투를 치우며 어른은 이제 괜찮다고 몇 번이고 말했다.', weight: 'light' }] },
      { label: '약 없이 이를 악물고 견딘다', hint: '살아나기는 한다. 몸이 더 단단해질 수도, 기침이 평생 남을 수도 있다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -20 }, { op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '나흘째 아침 스스로 물을 마실 수 있었다. 이후 다시 일어나 걷는 데 오래 걸렸지만 열병을 이겨 냈다.', weight: 'light' }], else: [{ op: 'injury', severity: 'scar' }, { op: 'log', text: '열은 내렸지만 기침이 깊이 남았다. 처음 바깥으로 나온 날에도 몇 걸음마다 벽을 짚고 숨을 골라야 했다.', weight: 'light' }] }] },
      { label: '나으면 약초밭 일을 거들겠다고 약속하고 약을 받는다', hint: '약은 듣는다. 몇 해 동안 의원 집 약초밭의 잡초는 {name}의 몫이다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'doctorDebt' }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '의원은 약을 먹인 뒤 약초밭에서 알아볼 풀 이름을 일러 주었다. 열이 내리자 {name}은(는) 약속대로 밭에 나가 잡초를 뽑기 시작했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_lighthouse', kind: 'door', when: kid(5, 11), weight: 8, repeat: 'once', speaker: 'hero',
    title: '꺼진 등대', body: '폭풍 치는 밤, {island} 곶의 등대 불이 꺼졌다. 등대지기 노인은 계단에 쓰러져 있고, 먼바다에서 고깃배들의 불빛이 흔들린다.',
    doors: [
      { label: '등대 꼭대기에 올라가 불을 다시 붙인다', hint: '바람에 몇 번이고 넘어진다. 고깃배들이 불빛을 보고 항구로 들어온다', values: { ambition: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -12 }, { op: 'log', text: '날이 밝을 때까지 등잔을 붙들고 있었다. 고깃배는 하나도 빠짐없이 돌아왔다.', weight: 'heavy' }] },
      { label: '노인을 업고 마을 의원에게 달린다', hint: '노인은 살아난다. 그날 밤 항구에 들어오지 못한 배가 하나 있다', values: { justice: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '등대지기 노인' }, { op: 'hardship', add: 3 }, { op: 'log', text: '의원이 노인을 살려 냈다. 그러나 아침까지 돌아오지 않은 고깃배 한 척 때문에 항구 사람들은 여러 날 바다만 지켜보았다.', weight: 'heavy' }] },
      { label: '골목 아이들을 다그쳐 종을 치고 물을 나르게 한다', hint: '아이들이 {name}의 말을 듣고 움직인다. 어른들이 달려와 둘 다 해낸다', values: { dominion: D }, fx: [{ op: 'fame', add: 1 }, { op: 'log', text: '종소리에 깬 어른들이 등대와 의원 쪽으로 나뉘어 달렸다. 새벽에는 등대 불이 다시 켜졌고 노인도 의식을 되찾았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_pirate_boy', kind: 'door', when: kid(9, 14), weight: 8, repeat: 'once', speaker: 'hero',
    title: '숨어든 해적 소년', body: '해적선이 해군에게 쫓겨 달아난 다음 날, 창고 짚더미 속에서 다친 해적 소년을 찾았다. {name}과(와) 비슷한 나이다. 해군이 집집이 문을 두드리고 있다.',
    doors: [
      { label: '창고에 숨겨 두고 밤마다 먹을 것을 나른다', hint: '들키면 해적을 숨긴 죄를 진다. 소년은 떠나며 반드시 갚겠다고 한다', values: { loyalty: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.7,
               then: [{ op: 'person', kind: 'ally', relation: '숨겨 준 해적 소년' }, { op: 'flag', id: 'hidPirate' }, { op: 'log', text: '해군이 떠난 밤 소년은 창고 뒷문으로 빠져나갔다. 다친 팔을 감싼 채 {name}의 이름을 기억하겠다며 손을 흔들었다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'marineRecord' }, { op: 'log', text: '해군에게 들켰다. 소년은 끌려가고 {name}의 이름은 초소의 장부에 올랐다.', weight: 'heavy' }] }] },
      { label: '해군에 알린다', hint: '포상금이 나온다. 끌려가는 소년이 {name}을(를) 한 번 돌아본다', values: { justice: D },
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'turnedInPirate' }, { op: 'log', text: '해군이 소년의 팔을 묶고 데려갔다. 포상금을 받는 동안 소년은 한 번 돌아보았지만 아무 말도 하지 않았다.', weight: 'heavy' }] },
      { label: '숨겨 주는 값으로 해적선의 보물 이야기를 내놓으라고 한다', hint: '소년은 마지못해 낡은 해도 한 장을 내준다. 값을 치른 사이에 고마움은 없다', values: { greed: D }, 
        fx: [{ op: 'flag', id: 'pirateMap' }, { op: 'base', key: 'luk', add: 1 }, { op: 'log', text: '소년은 낡은 해도를 내밀고 다친 몸으로 창고를 떠났다. {name}은(는) 해도를 펴 보았지만 소년이 어디로 갔는지는 묻지 않았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_scholarship', kind: 'door', when: kid(10, 14), weight: 8, repeat: 'once', speaker: { relation: '학당 선생' },
    title: '학당 선생의 추천', body: '마을 학당 선생이 {name}의 셈 솜씨를 보고, 큰 섬의 학교가 보는 장학 시험을 권했다. 시험 날은 동무들과 한 해 내내 준비한 축제 날과 겹친다.',
    doors: [
      { label: '장학 시험을 치르러 간다', hint: '붙으면 학교의 문이 열린다. 축제의 북은 다른 아이가 친다', values: { inquiry: D },
        fx: [{ op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'scholar' }, { op: 'log', text: '합격자 명단에서 자기 이름을 찾았다. 선생은 축제 이야기를 묻지 않고 새 학교에 가져갈 책부터 챙겨 주었다.', weight: 'heavy' }, { op: 'timeline', text: '장학 시험에 붙었다' }],
               else: [{ op: 'log', text: '시험장에서 손이 떨렸다. 떨어진 채 돌아오니 축제는 끝나 있었다.', weight: 'light' }] }] },
      { label: '시험 대신 축제의 북을 친다', hint: '동무들과 한 약속을 지킨다. 선생은 다시는 추천장을 쓰지 않는다', values: { loyalty: D }, closes: true,
        fx: [{ op: 'person', kind: 'ally', relation: '축제를 함께한 동무' }, { op: 'log', text: '북소리에 맞춰 동무들이 행진했다. 선생은 관중 속에서 조용히 지켜보다 떠났지만, 축제가 끝나자 친구 하나가 곁에 남아 밤새 북을 옮겼다.', weight: 'light' }] },
      { label: '시험을 보고 밤배로 돌아와 북도 친다', hint: '이틀 밤을 새운다. 둘 다 해낼 수도, 둘 다 망칠 수도 있다', values: { ambition: D }, mark: 'daring',
        fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.4, skillCheck: true, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'scholar' }, { op: 'log', text: '시험을 마치고 돌아와 마지막 행진에 맞춰 북을 쳤다. 며칠 뒤 합격 소식이 오자 동무들이 먼저 환호했다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '시험지는 반이 비었고 북채는 손에서 미끄러졌다.', weight: 'light' }] }] },
    ],
  },

  // ---------------------------------------------------------------- 가난한 집 아이만
  {
    id: 'kid_hunger', kind: 'door', when: [...kid(5, 12), POOR], weight: 8, repeat: 'once', speaker: 'hero',
    title: '굶주린 겨울', body: '흉어가 이어진 겨울, {town}의 가난한 골목에서는 하루 한 끼도 귀하다. 곡물상은 창고 문을 걸어 잠그고 값이 오르기만 기다린다.',
    doors: [
      { label: '새벽 어시장에서 생선 내장 치우는 일을 얻는다', hint: '비린내와 칼자국을 얻고 하루 한 끼를 번다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'str', add: 1 }, { op: 'log', text: '칼자국이 남은 손으로 생선 내장을 치운 뒤 저녁 한 끼를 받아 왔다. 다음 날에도 어시장 주인은 그 손을 알아보고 일을 맡겼다.', weight: 'light' }] },
      { label: '배급 줄에서 더 어린아이에게 제 몫을 넘긴다', hint: '그 아이는 겨울을 넘긴다. {name}은(는) 한동안 일어서면 눈앞이 캄캄하다', values: { peace: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -20 }, { op: 'log', text: '작은 아이가 받은 그릇을 두 손으로 감쌌다. {name}은(는) 빈손으로 돌아왔고, 며칠 동안 일어설 때마다 벽을 짚어야 했다.', weight: 'light' }] },
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
        fx: [{ op: 'flag', id: 'firedFactory' }, { op: 'hardship', add: 3 }, { op: 'log', text: '감독이 {name}을(를) 공장 밖으로 밀어냈다. 안에 남은 아이들은 회초리가 내려갈 때마다 붙잡힌 손목을 떠올렸다.', weight: 'heavy' }] },
      { label: '어린아이 몫까지 밤늦게 꼰다', hint: '손바닥이 갈라진다. 그 아이는 회초리를 피한다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '남은 삼 껍질을 밤까지 꼬았다. 다음 날 어린아이는 회초리를 피했지만 {name}의 손바닥에는 새 살이 갈라졌다.', weight: 'light' }] },
      { label: '감독의 눈에 들어 아이들의 반장이 된다', hint: '품삯이 오른다. 그 대신 느린 아이를 감독에게 일러야 하는 자리다', values: { greed: D }, 
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'factoryForeman' }, { op: 'log', text: '감독은 더 두툼한 품삯 봉투를 건넸다. 느린 아이의 이름을 묻는 순간, 다른 아이들은 {name}의 눈을 피했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_debt', kind: 'door', when: [...kid(11, 15), POOR], needs: ['parent'], weight: 8, repeat: 'once', speaker: { relation: '빚쟁이' },
    title: '빚쟁이', body: '험상궂은 빚쟁이 둘이 {name}의 집 문을 걷어찼다. 이달 안에 갚지 못하면 살림을 모두 들고 가겠다고 한다. 부모는 고개만 숙이고 있다.',
    doors: [
      { label: '부두 짐 나르기로 갚겠다고 나선다', hint: '한 해 내내 등이 휜다. 빚쟁이는 한 달 말미를 준다', values: { freedom: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'str', add: 1 }, { op: 'log', text: '빚쟁이는 한 달 뒤 다시 오겠다며 문을 닫았다. {name}은(는) 그때부터 부두에서 가장 무거운 짐부터 들었다.', weight: 'light' }] },
      { label: '빚쟁이에게 몽둥이를 휘두른다', hint: '빚쟁이 하나가 물러난다. 다음 달에는 셋이 온다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'flag', id: 'debtGrudge' }, { op: 'log', text: '빚쟁이 하나가 물러났지만 다른 하나가 {name}을(를) 바닥에 내동댕이쳤다. 다음 달에는 사람을 더 데리고 오겠다는 말을 남겼다.', weight: 'heavy' }] },
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
        fx: [{ op: 'hp', add: -15 }, { op: 'hardship', add: 5 }, { op: 'log', text: '부모는 친척에게 보낼 편지를 찢었다. 그 겨울 식탁에 오르는 그릇은 모두 작아졌지만 형제의 자리는 비지 않았다.', weight: 'heavy' }] },
      { label: '노름판에서 겨울 날 돈을 따 오겠다고 나간다', hint: '따면 아무도 떠나지 않는다. 잃으면 형제가 떠나고 빚이 남는다', values: { ambition: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.4, skillCheck: true, then: [{ op: 'money', add: 3000 }, { op: 'log', text: '주사위가 세 번 연달아 웃었다. 그 겨울 아무도 집을 떠나지 않았다.', weight: 'heavy' }],
               else: [{ op: 'hardship', add: 5 }, { op: 'log', text: '가진 것을 다 잃었다. 형제는 이튿날 친척 집으로 가는 배에 올랐다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'kid_parent_hurt', kind: 'door', when: [...kid(8, 14), POOR], needs: ['parent'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '다친 부모', body: '부두에서 짐을 부리던 부모 한 분이 떨어진 화물에 다리를 다쳤다. 선주는 일하다 다친 것은 제 탓이라며 품삯도 주지 않는다.',
    doors: [
      { label: '학당을 그만두고 대신 부두에 나간다', hint: '집에 쌀이 떨어지지 않는다. 글공부는 거기서 끝난다', values: { inquiry: D }, mark: 'fellowship',
        fx: [{ op: 'base', key: 'str', add: 1 }, { op: 'base', key: 'int', add: -1 }, { op: 'flag', id: 'quitSchool' }, { op: 'log', text: '책을 학당에 돌려주고 부모가 쓰던 짐수레를 끌었다. 저녁에는 쌀을 사 왔지만 더는 교실에 돌아가지 못했다.', weight: 'heavy' }] },
      { label: '날마다 선주의 집 앞에서 품삯을 내놓으라고 버틴다', hint: '선주의 일꾼들에게 떠밀려 넘어진다. 한 달을 버티면 몇 푼이라도 받을지 모른다', values: { justice: D }, mark: 'obsession',
        fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'money', add: 2000 }, { op: 'log', text: '한 달 만에 선주가 품삯 절반을 내던졌다.', weight: 'light' }], else: [{ op: 'log', text: '한 달이 지나도 선주는 문을 열지 않았다. {name}은(는) 빈손으로 돌아와 다친 부모의 붕대를 갈아 주었다.', weight: 'light' }] }] },
      { label: '선주의 창고에서 품삯만큼 물건을 들고 나온다', hint: '잃은 품삯을 되찾는다. 들키면 도둑으로 몰린다', values: { freedom: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'money', add: 2000 }, { op: 'log', text: '창고에서 꺼낸 물건을 팔아 부모의 품삯만큼 쥐었다. 선주는 어디서 돈이 났는지 끝내 알지 못했다.', weight: 'light' }], else: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'thiefMark' }, { op: 'log', text: '창고 문을 나서다 일꾼들에게 붙잡혔다. 물건은 빼앗겼고, 선주는 마을에 {name}을(를) 도둑이라고 알렸다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'go_work', kind: 'door', when: [...kid(14, 15), POOR], weight: 12, repeat: 'once', speaker: 'hero',
    title: '열다섯의 일터', body: '{island}의 염전과 배 고치는 작업장과 어선이 열다섯 살 일꾼을 받는다. 품삯을 미리 받으면 몇 해는 그 일터에 묶인다.',
    doors: [
      { label: '품삯을 미리 받고 어선에 오른다', hint: '집에 목돈이 들어간다. 빚진 몸으로 몇 해 그물을 끈다', values: { romance: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 5000 }, { op: 'base', key: 'str', add: 1 }, { op: 'flag', id: 'boundFisher' }, { op: 'log', text: '선주는 선불을 건네고 몇 해 치 일거리를 장부에 적었다. 첫 출항부터 {name}은(는) 새벽마다 그물을 끌었다.', weight: 'heavy' }, { op: 'timeline', text: '품삯을 미리 받고 어선을 탔다' }] },
      { label: '염전에서 날품을 팔아 제 밥벌이를 한다', hint: '햇볕에 등이 타들어 간다. 누구에게도 매이지 않는다', values: { freedom: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '첫날부터 소금기와 햇볕이 등을 태웠다. 일당을 손에 쥔 저녁에는 누구의 장부에도 다음 날 이름이 묶이지 않았다.', weight: 'light' }] },
      { label: '작업장 목수에게 배 고치는 일을 배운다', hint: '품삯은 반이다. 언젠가 배 한 척은 혼자 손볼 수 있게 된다', values: { inquiry: D },
        fx: [{ op: 'flag', id: 'shipSkill' }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '목수는 작은 틈으로 물이 새는 까닭부터 가르쳤다. {name}은(는) 반 품삯을 받으며 해가 질 때까지 널빤지를 갈아 끼웠다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 넉넉한 집 아이만
  {
    id: 'kid_tutor', kind: 'door', when: [...kid(7, 12), RICH], needs: ['parent'], weight: 8, repeat: 'once', speaker: { relation: '가정교사' },
    title: '가정교사', body: '부모가 {name}에게 가정교사를 들였다. 깐깐한 선생은 하루 여섯 시간 글과 셈을 가르치고, 틀릴 때마다 손바닥을 때린다. 창밖으로 동네 아이들이 부두로 몰려간다.',
    doors: [
      { label: '선생의 책을 끝까지 판다', hint: '머리가 트인다. 동네 아이들은 더 이상 {name}을(를) 부르러 오지 않는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'bookish' }, { op: 'log', text: '창밖에서 친구들이 한 번 부르다 떠났다. {name}은(는) 책장을 넘겨 틀린 셈을 다시 풀었고, 선생은 처음으로 손바닥 대신 고개를 끄덕였다.', weight: 'light' }] },
      { label: '선생을 골려 내쫓는다', hint: '선생은 사흘 만에 짐을 싼다. 부모가 노해 용돈을 끊는다', values: { freedom: D }, mark: 'rebel', closes: true,
        fx: [{ op: 'money', add: -5000 }, { op: 'flag', id: 'tutorGone' }, { op: 'log', text: '가정교사는 사흘 만에 책을 싸 들고 나갔다. 부모는 용돈을 끊었고, {name}은(는) 비어 있는 책상 대신 친구들이 노는 부두로 달려갔다.', weight: 'light' }] },
      { label: '글 대신 해도 읽는 법만 가르쳐 달라고 조른다', hint: '선생은 반쯤 포기하고 바다 지도를 펼친다. 셈은 끝내 서툴다', values: { romance: D },
        fx: [{ op: 'flag', id: 'readsCharts' }, { op: 'mastery', branch: 'observation', add: 4 }, { op: 'log', text: '선생이 지도 위의 암초 표시를 짚어 주었다. 구구단은 여전히 자주 틀렸지만, {name}은(는) 배가 지나는 길을 혼자 찾아냈다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_feast', kind: 'door', when: [...kid(8, 13), RICH], weight: 8, repeat: 'once', speaker: 'hero',
    title: '잔치가 끝난 뒤', body: '{name}의 집에서 큰 잔치가 끝났다. 하인들이 남은 음식을 바다에 쏟아 버리려 하고, 뒷문 밖에서는 골목 아이들이 그 광경을 지켜본다.',
    doors: [
      { label: '남은 음식을 뒷문 밖으로 나른다', hint: '골목 아이들이 배불리 먹는다. 집안 어른들이 거지 떼를 불러들였다며 용돈을 깎는다', values: { peace: D }, mark: 'fellowship',
        fx: [{ op: 'money', add: -2000 }, { op: 'flag', id: 'feastShared' }, { op: 'log', text: '뒷문 밖 아이들이 접시를 비웠다. 집안 어른은 다음 달 용돈을 깎았지만, 아이들은 며칠 뒤에도 {name}을(를) 보고 손을 흔들었다.', weight: 'light' }] },
      { label: '음식 나눌 차례를 정하는 일을 쥔다', hint: '골목 아이들이 {name} 앞에 줄을 선다. 줄에서 밀려난 아이가 원한을 품는다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'feastBoss' }, { op: 'person', kind: 'enemy', relation: '줄에서 밀려난 아이' }, { op: 'log', text: '음식 그릇 앞에 긴 줄이 생겼다. 밀려난 아이 하나가 빈손으로 돌아가며 {name}을(를) 노려보았다.', weight: 'light' }] },
      { label: '버리라고 시킨 어른에게 따진다', hint: '음식은 끝내 버려진다. 집안에서 버릇없는 아이로 찍힌다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'flag', id: 'talkedBack' }, { op: 'log', text: '어른은 끝내 음식을 바다에 버리게 했다. 잔치가 끝난 집 안에서는 {name}이(가) 버릇없다는 말이 오래 돌았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_family_trade', kind: 'door', when: [...kid(10, 14), RICH], needs: ['parent'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '가업', body: '부모가 {name}을(를) 가게 계산대에 앉히며 이제 가업을 배울 때라고 했다. 장부에는 외상을 갚지 못한 가난한 집들의 이름이 길게 적혀 있다.',
    doors: [
      { label: '가업 수업을 시작한다', hint: '몇 해면 가게를 맡을 수 있다. 놀던 동무들과는 멀어진다', values: { loyalty: D },
        fx: [{ op: 'money', add: 5000 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'familyTrade' }, { op: 'log', text: '부모는 장부 한 권과 계산대 열쇠를 맡겼다. 외상 이름을 외우는 동안 친구들이 가게 밖을 지나가도 자리를 뜰 수 없었다.', weight: 'light' }] },
      { label: '가업 대신 칼을 배우겠다고 버틴다', hint: '부모는 등을 돌리고 용돈을 끊는다. 동네 도장에 공짜로 매달린다', values: { ambition: D }, mark: 'obsession', closes: true,
        fx: [{ op: 'money', add: -10000 }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'log', text: '부모는 용돈을 끊고 계산대에서 비키라고 했다. {name}은(는) 도장 문이 열릴 때마다 가장 먼저 와서 마루를 쓸었다.', weight: 'light' }] },
      { label: '외상 장부에서 가난한 집 몇의 이름을 몰래 지운다', hint: '그 집들은 겨울을 넘긴다. 들키면 가게의 돈을 훔친 셈이 된다', values: { justice: D }, mark: 'daring',
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'erasedDebts' }, { op: 'log', text: '장부에서 사라진 이름을 아무도 묻지 않았다. 그 집들은 겨울이 지나도록 가게 앞을 조심스레 지나갔다.', weight: 'light' }],
               else: [{ op: 'money', add: -20000 }, { op: 'flag', id: 'caughtErasing' }, { op: 'log', text: '지운 자리가 들켰다. 부모는 그 돈을 {name}의 몫에서 덜어 냈다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'kid_betrothal', kind: 'door', when: [...kid(12, 15), RICH], needs: ['parent'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '혼담', body: '이웃 섬 큰 상인 집안에서 혼담이 들어왔다. 부모는 두 집안이 손을 잡으면 장사가 두 배가 된다며 기뻐한다. 상대는 얼굴도 본 적이 없다.',
    doors: [
      { label: '집안을 위해 정혼을 받아들인다', hint: '열여덟이 되면 이웃 섬으로 간다. 집안의 장사가 크게 핀다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'betrothed' }, { op: 'money', add: 10000 }, { op: 'person', kind: 'ally', relation: '정혼자' }, { op: 'log', text: '두 집안은 잔을 부딪치고 거래 장부를 펼쳤다. 낯선 정혼자는 처음 보낸 편지에서 {name}이(가) 좋아하는 것이 무엇인지 물었다.', weight: 'heavy' }] },
      { label: '혼담 자리에서 뛰쳐나간다', hint: '두 집안 사이가 틀어진다. 부모는 {name}의 몫으로 떼어 둔 돈을 거둬들인다', values: { freedom: D }, mark: 'rebel', closes: true,
        fx: [{ op: 'money', add: -30000 }, { op: 'flag', id: 'brokeBetrothal' }, { op: 'log', text: '혼담 자리가 어수선해졌고 상대 집안은 돌아갔다. 부모는 마련해 둔 돈을 거둬들인 뒤 한동안 {name}과(와) 말을 섞지 않았다.', weight: 'heavy' }] },
      { label: '상대 집안의 장부부터 보여 달라고 한다', hint: '어른들이 아연해한다. 건방진 아이라는 소문과 함께 셈 밝은 아이라는 소문이 난다', values: { ambition: D }, mark: 'composure',
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'shrewdMatch' }, { op: 'log', text: '상대 집안 어른은 웃음을 거두고 장부를 가져왔다. 숫자를 따져 묻는 동안 혼담의 조건이 바뀌었고, 두 집안 모두 {name}을(를) 새삼 다르게 보았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_sunk_fortune', kind: 'door', when: [...kid(11, 15), RICH], needs: ['parent'], weight: 7, repeat: 'once', speaker: 'hero',
    title: '가라앉은 상선', body: '{name}의 집 재산을 실은 상선이 폭풍에 가라앉았다. 빚을 받으러 온 사람들이 문 앞에 줄을 섰고, 부모는 밤마다 장부를 붙들고 있다.',
    doors: [
      { label: '집안 물건을 팔아 빚부터 막자고 한다', hint: '집은 지킨다. 넉넉하던 살림은 끝난다', values: { justice: D },
        fx: [{ op: 'wealth', to: 'common' }, { op: 'money', add: -20000 }, { op: 'log', text: '집 안의 비단과 장식이 하나씩 팔려 나갔다. 빚쟁이의 발길이 끊긴 뒤에도 예전만큼 넉넉한 식탁은 돌아오지 않았다.', weight: 'heavy' }] },
      { label: '부모 대신 빚쟁이들을 만나 갚을 날을 미룬다', hint: '아이의 말에 어른들이 웃는다. 말이 통하면 한 해를 벌고, 아니면 창피만 산다', values: { ambition: D }, mark: 'daring',
        fx: [{ op: 'chance', p: 0.5, skillCheck: true, then: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: '빚쟁이들이 한 해 말미를 주었다. 그 한 해에 집안은 겨우 숨을 돌렸다.', weight: 'heavy' }],
               else: [{ op: 'wealth', to: 'common' }, { op: 'log', text: '빚쟁이들은 웃고 돌아가 이튿날 창고를 비웠다.', weight: 'heavy' }] }] },
      { label: '하인들의 밀린 품삯부터 치르자고 고집한다', hint: '하인들은 빈손으로 떠나지 않는다. 집은 남의 손에 넘어간다', values: { justice: D },
        fx: [{ op: 'wealth', to: 'poor' }, { op: 'money', add: -50000 }, { op: 'flag', id: 'paidServants' }, { op: 'log', text: '하인들은 품삯 봉투를 쥐고 마지막까지 집을 정리했다. 문에 새 주인의 자물쇠가 걸리자 가족은 남은 짐을 직접 들고 나왔다.', weight: 'heavy' }, { op: 'timeline', text: '집안이 기울 때 하인들의 품삯부터 치렀다' }] },
    ],
  },
  {
    id: 'go_heir', kind: 'door', when: [...kid(14, 15), RICH], needs: ['parent'], weight: 12, repeat: 'once', speaker: 'hero',
    title: '집안의 열다섯', body: '부모가 {name}의 앞날을 정할 때가 됐다고 한다. 가게를 물려받거나, 학자를 집에 불러 더 배우거나. 그런데 {name}은(는) 요즘 부두에서 해적 수배서를 들여다보는 날이 많다.',
    doors: [
      { label: '가게를 물려받기로 한다', hint: '열여섯이면 계산대 뒤에 선다. 바다는 창문 너머의 풍경이 된다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 20000 }, { op: 'flag', id: 'familyShop' }, { op: 'log', text: '부모가 가게 열쇠와 장부를 넘겼다. 그날 저녁 계산대를 닫으며 {name}은(는) 창밖으로 출항하는 배를 보았다.', weight: 'heavy' }, { op: 'timeline', text: '집안의 가게를 물려받았다' }] },
      { label: '학자를 집에 불러 바다와 별을 배운다', hint: '집안 돈이 크게 든다. 몇 해는 책상 앞에서 보낸다', values: { inquiry: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'learned' }, { op: 'log', text: '집에 온 학자는 밤마다 별자리를 그리게 했다. 부모가 치른 수업료만큼 책이 쌓였고, {name}은(는) 창밖 항로를 다른 눈으로 읽기 시작했다.', weight: 'light' }] },
      { label: '집안 돈으로 배 한 척을 사 달라고 조른다', hint: '부모와 크게 다투고 용돈이 끊긴다. 열여섯이 되면 제 힘으로 나가야 한다', values: { romance: D }, mark: 'rebel',
        fx: [{ op: 'money', add: -20000 }, { op: 'flag', id: 'wantsShip' }, { op: 'log', text: '부모는 배값을 내줄 수 없다며 몫으로 떼어 둔 돈도 거뒀다. {name}은(는) 빈 주머니로 부두에 가 배를 구할 다른 길을 물었다.', weight: 'heavy' }] },
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
        fx: [{ op: 'flag', id: 'toldOnSibling' }, { op: 'log', text: '부모가 돛단배를 묶어 두자 형제는 {name}을(를) 지나쳐 갔다. 먹구름은 밤새 앞바다를 덮었고, 둘은 같은 집에서 며칠이나 말이 없었다.', weight: 'light' }] },
      { label: '돛단배의 밧줄을 몰래 풀어 떠내려 보낸다', hint: '아무도 바다에 나가지 않는다. 형제의 몇 달 품이 물거품이 된다', mark: 'composure',
        fx: [{ op: 'flag', id: 'sankSiblingBoat' }, { op: 'log', text: '아침에 배가 사라진 것을 본 형제는 물가를 오래 뒤졌다. 폭풍이 지난 뒤에도 배는 돌아오지 않았고 {name}은(는) 밧줄을 풀었다는 말을 삼켰다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_parent_poster', kind: 'door', when: [...kid(8, 14), { c: 'lineage', is: ['pirateChild'] }], needs: ['parent'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '다락의 수배서', body: '다락을 뒤지다 낡은 수배서 한 장을 찾았다. 젊은 날의 부모 얼굴이 웃고 있다. 그 아래 적힌 현상금은 아직 지워지지 않았다.',
    doors: [
      { label: '수배서를 불태우고 못 본 척한다', hint: '집의 비밀은 지켜진다. {name}도 그 비밀을 평생 지고 산다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'parentSecret' }, { op: 'log', text: '수배서가 아궁이에서 말려 올라가며 타들었다. 부모는 재를 보고 아무 말도 하지 않았고, {name}도 다락에서 본 얼굴을 묻지 않았다.', weight: 'heavy' }] },
      { label: '그 시절 바다 이야기를 해 달라고 조른다', hint: '부모는 오래 망설이다 입을 연다. 그날부터 {name}의 꿈이 바다로 기운다', values: { romance: D }, mark: 'obsession',
        fx: [{ op: 'flag', id: 'fatherTale' }, { op: 'log', text: '부모는 수배서를 접어 두고 오래전 배에서 만난 사람들의 이름을 하나씩 꺼냈다. {name}은(는) 이야기가 끝나도 계단을 내려가지 않았다.', weight: 'light' }] },
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
        fx: [{ op: 'hp', add: -15 }, { op: 'mastery', branch: 'fist', add: 5 }, { op: 'log', text: '주먹다짐 끝에 일터 주인이 둘을 떼어 놓았다. 멍든 얼굴로 돌아온 다음 날부터 나이 많은 일꾼은 {name}의 품삯에 손대지 않았다.', weight: 'light' }] },
      { label: '일터 주인에게 일러바친다', hint: '주인은 막내의 말을 반만 믿는다. 일꾼들 사이에서 고자질쟁이가 된다', values: { justice: D },
        fx: [{ op: 'flag', id: 'awayTattler' }, { op: 'log', text: '주인은 일꾼에게 경고만 했다. 빼앗기는 몫은 줄었지만, 식사 때면 다른 일꾼들이 {name} 옆자리를 비워 두었다.', weight: 'light' }] },
      { label: '몫을 내주고 그 일꾼에게 일을 배운다', hint: '배는 고프다. 그 대신 손이 빨리 는다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '배를 곯으며 나이 많은 일꾼의 손놀림을 따라 했다. 얼마 뒤에는 같은 짐을 더 빨리 나를 수 있었지만 품삯은 여전히 나눠 줘야 했다.', weight: 'light' }] },
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
        fx: [{ op: 'flag', id: 'stayedAway' }, { op: 'log', text: '고향 배가 떠난 뒤에도 부두에 남아 오늘 맡은 일을 끝냈다. 밤에는 친구들의 얼굴이 떠올랐지만 이 항구에서 아침을 맞았다.', weight: 'heavy' }] },
    ],
  },
];
