// 꿈을 품고, 흔들리고, 마지막에 돌아보는 순간 (통합 기획 3장 · 4.2 · 4.5)
// 품는 순간은 네 갈래 중 하나만 온다(꿈이 없을 때만). 어느 고향에서나 열리도록 바닷가 · 해군 · 현상금의 낱말을 쓰지 않는다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { ACTIVE, GROWN, age, at, st } from './paths';
import type { Cond, DreamId, Fx, Turning } from '../../core/types';

const D = V.value.door;
const NO_DREAM: Cond = { c: 'dream', has: false };
const dream = (id: DreamId): Fx => ({ op: 'dream', id });
const heavy = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const young = at(age(13, 17), NO_DREAM);

const BORN: Turning[] = [
  {
    id: 'dream_horizon', kind: 'door', when: young, weight: 25, repeat: 'once', speaker: 'hero',
    title: '수평선 너머', body: '어릴 적 들은 이야기가 아직도 귓가에 맴돈다. 세상 어딘가에 모든 것을 손에 넣은 왕이 남긴 보물이 있다고 했다. 지도에 없는 섬이 아직 수없이 많다고도 했다. {name}은(는) 밤마다 멀리 수평선을 바라본다. 가슴속에서 무언가가 이름을 갖기 시작한다.',
    doors: [
      { label: '누구에게도 매이지 않는 왕이 되겠다고 다짐한다', hint: '가장 높은 곳에서 바람처럼 살고 싶다', values: { freedom: D },
        fx: [dream('pirateKing')] },
      { label: '세상의 끝을 이 눈으로 보겠다고 다짐한다', hint: '아무도 본 적 없는 곳까지 가고 싶다', values: { romance: D },
        fx: [dream('worldEnd')] },
      { label: '평생 쓰고도 남을 보물을 찾겠다고 다짐한다', hint: '반짝이는 것을 손에 쥐는 상상만으로 가슴이 뛴다', values: { greed: D },
        fx: [dream('treasure')] },
    ],
  },
  {
    id: 'dream_order', kind: 'door', when: young, weight: 25, repeat: 'once', speaker: 'hero',
    title: '무엇이 되고 싶은가', body: '어른들이 묻는다. 커서 무엇이 될 거냐고. 예전에는 웃으며 아무렇게나 대답했지만, 이제는 그 물음이 조금 무겁다. {name}은(는) 지금까지 본 것들을 하나씩 떠올린다. 억울한 얼굴, 오래된 책, 저녁 밥상에 둘러앉은 사람들.',
    doors: [
      { label: '옳은 것을 지키는 가장 높은 자리에 서겠다고 다짐한다', hint: '억울한 사람이 없는 세상의 꼭대기에 서고 싶다', values: { justice: D },
        fx: [dream('marineTop')] },
      { label: '세상이 감춘 진실을 알아내겠다고 다짐한다', hint: '책이 말하지 않는 빈칸이 궁금하다', values: { inquiry: D },
        fx: [dream('truth')] },
      { label: '소중한 사람들과 오래오래 함께 살겠다고 다짐한다', hint: '크고 먼 것보다 곁에 있는 것을 지키고 싶다', values: { peace: D },
        fx: [dream('peace')] },
    ],
  },
  {
    id: 'dream_blade', kind: 'door', when: [...young, { c: 'path', is: ['sword'] }], weight: 35, repeat: 'once', speaker: 'hero',
    title: '검 끝의 약속', body: '손바닥의 굳은살이 단단해졌다. 매일 휘두르는 검이 이제는 몸의 일부 같다. 언젠가 들은 이름, 세상에서 가장 강하다는 검객의 이야기가 떠오른다. {name}은(는) 검을 내려다본다. 이 검으로 어디까지 갈 수 있을까.',
    doors: [
      { label: '세상에서 가장 강한 검객이 되겠다고 다짐한다', hint: '정점에 선 검객을 넘어서고 싶다', values: { dominion: D },
        fx: [dream('bestSword'), { op: 'base', key: 'wil', add: 1 }] },
      { label: '이 검으로 누구보다 높은 왕이 되겠다고 다짐한다', hint: '검은 길을 여는 도구다', values: { ambition: D },
        fx: [dream('pirateKing')] },
      { label: '이 검으로 썩은 세상을 바꾸겠다고 다짐한다', hint: '약한 사람들을 짓밟는 것들을 베고 싶다', values: { justice: D },
        fx: [dream('changeWorld')] },
    ],
  },
  {
    id: 'dream_rebel', kind: 'door', when: young, weight: 20, repeat: 'once', speaker: 'hero',
    title: '불공평한 세상', body: '높은 사람들이 지나가면 모두가 고개를 숙인다. 이유를 물으면 원래 그런 거라고 한다. {name}은(는) 그 대답이 마음에 들지 않는다. 주먹을 쥐었다 편다. 원래 그런 것을 바꾸는 사람도 있지 않을까.',
    doors: [
      { label: '이 세상을 뿌리부터 바꾸겠다고 다짐한다', hint: '누구도 무릎 꿇지 않는 세상을 꿈꾼다', values: { freedom: D },
        fx: [dream('changeWorld')] },
      { label: '아무도 함부로 못 하는 가장 강한 사람이 되겠다고 다짐한다', hint: '힘이 있으면 아무도 고개를 숙이라고 하지 않는다', values: { dominion: D },
        fx: [dream('bestSword')] },
      { label: '그 높은 사람들보다 더 높이 오르겠다고 다짐한다', hint: '꼭대기에 서면 세상이 내 말을 듣는다', values: { ambition: D },
        fx: [dream('pirateKing')] },
    ],
  },
];

const LATER: Turning[] = [
  {
    id: 'dream_waver', kind: 'door', when: at(age(28, 42), st(...ACTIVE), { c: 'dream', has: true, done: false, years: 12 }), weight: 3, repeat: 'once', speaker: 'hero',
    title: '흔들리는 꿈', body: '어린 날 품은 꿈을 오래 좇았다. 그런데 요즘 {name}은(는) 문득 멈춰 선다. 그 꿈은 아직 너무 멀고, 그사이 곁에는 지켜야 할 것들이 생겼다. 꿈은 아직 같은 꿈일까.',
    doors: [
      { label: '처음 품었던 꿈을 끝까지 붙든다', hint: '멀어도 내 꿈이다. 놓으면 내가 아니다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('{name}은(는) 어린 날의 다짐을 다시 한 번 입 밖에 냈다. 꿈은 그대로였다.')] },
      { label: '곁의 사람들을 지키는 삶을 새 꿈으로 삼는다', hint: '크고 먼 것보다 지금 곁에 있는 것', values: { peace: D },
        fx: [dream('peace')] },
      { label: '아무도 본 적 없는 곳을 향하는 것으로 꿈을 바꾼다', hint: '정점보다 끝을 보고 싶어졌다', values: { romance: D },
        fx: [dream('worldEnd')] },
    ],
  },
  {
    id: 'dream_last', kind: 'door', when: at(age(55, 75), st(...GROWN), { c: 'dream', has: true, done: false }), weight: 14, repeat: 'once', speaker: 'hero',
    title: '닿지 못한 꿈', body: '머리가 하얗게 셌다. 어린 날 품은 꿈은 끝내 손에 잡히지 않았다. {name}은(는) 오래된 다짐을 떠올린다. 남은 시간은 많지 않다. 이 꿈을 어떻게 할까.',
    doors: [
      { label: '마지막으로 한 번 더 그 꿈을 향해 나선다', hint: '몸은 늙었어도 마음은 그날 그대로다', values: { romance: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 20 }, { op: 'flag', id: 'dreamLastTry' },
             heavy('{name}은(는) 낡은 짐을 꾸려 다시 길을 나섰다. 사람들은 말렸지만, 그 눈빛은 어린 날과 똑같았다.')] },
      { label: '그 꿈을 다음 사람에게 넘겨준다', hint: '내가 못 간 곳에 누군가는 닿을 것이다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'dreamPassed' }, heavy('{name}은(는) 젊은 사람에게 오래 품은 꿈 이야기를 들려주었다. 그 눈이 반짝였다.')] },
      { label: '닿지 못한 꿈도 내 인생이었다고 받아들인다', hint: '좇은 시간만큼은 후회하지 않는다', values: { peace: D },
        fx: [{ op: 'flag', id: 'dreamAccepted' }, heavy('{name}은(는) 꿈을 내려놓았다. 이상하게 마음이 가벼웠다.')] },
    ],
  },
];

export const DREAM_TURNINGS: Turning[] = [...BORN, ...LATER];
