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
    title: '골목 끝 해적단', body: '골목 아이들이 빈 상자 셋을 이어 놓고 해적 놀이를 한다. 앞 상자에는 손수건 깃발, 가운데에는 반쯤 그린 지도, 뒤에는 반짝이는 병뚜껑이 놓였다. 아이들이 {name}에게 어떤 역할을 맡을지 묻는다.',
    doors: [
      { label: '선장 자리에 올라 손수건 깃발을 든다', hint: '친구들 앞에서 해적왕이 되겠다고 선언하고 골목 끝을 향해 깃발을 흔든다', values: { freedom: D },
        fx: [dream('pirateKing')] },
      { label: '지도 끝에 종이를 한 장 더 붙인다', hint: '항로의 마지막 섬은 직접 가 보고 그리겠다고 한다', values: { romance: D },
        fx: [dream('worldEnd')] },
      { label: '병뚜껑을 묻고 보물지도에 가위표를 친다', hint: '빈 상자 하나를 챙겨 두며 언젠가 보물로 채울 궁리를 한다', values: { greed: D, dominion: D },
        fx: [dream('treasure')] },
    ],
  },
  {
    id: 'dream_order', kind: 'door', when: young, weight: 25, repeat: 'once', speaker: 'hero',
    title: '십 년 뒤에 받을 편지', body: '글방에서 십 년 뒤의 자기 앞으로 편지를 쓴다. 옆자리 아이는 과자 가게 주인이 된 자신에게 편지를 썼다. {name}은(는) 봉투를 앞에 놓고 십 년 뒤 무엇을 하고 있을지 생각한다.',
    doors: [
      { label: '봉투에 원수가 된 자신의 이름을 쓴다', hint: '원수가 되면 오래 밀린 탄원서부터 읽겠다고 적는다', values: { justice: D },
        fx: [dream('marineTop')] },
      { label: '역사책에서 뜯겨 나간 쪽 번호를 편지에 적는다', hint: '사라진 쪽에 어떤 기록이 있었는지 직접 알아낼 생각이다', values: { inquiry: D },
        fx: [dream('truth')] },
      { label: '저녁상에 불러 모으고 싶은 사람들의 이름을 적는다', hint: '십 년 뒤에도 이 사람들과 함께 저녁을 먹고 싶다', values: { peace: D },
        fx: [dream('peace')] },
    ],
  },
  {
    id: 'dream_blade', kind: 'door', when: [...young, { c: 'path', is: ['sword'] }], weight: 35, repeat: 'once', speaker: 'hero',
    title: '검 끝의 약속', body: '연습이 끝나자 맞은편 아이가 팔뚝의 멍을 문지른다. 그 아이가 누구와 겨루려고 매일 연습하는지 묻는다. {name}은(는) 풀어진 칼자루의 천을 다시 감는다.',
    doors: [
      { label: '칼집으로 다시 선을 긋고 한 판 더 청한다', hint: '언젠가 세계 최강의 검객과 겨루고 싶다고 털어놓는다', values: { dominion: D },
        fx: [dream('bestSword'), { op: 'base', key: 'wil', add: 1 }] },
      { label: '칼집에 그려 둔 해골 깃발을 보여 준다', hint: '해적왕이 되면 이 문양을 깃발에 쓰겠다고 한다', values: { ambition: D },
        fx: [dream('pirateKing')] },
      { label: '칼을 내려놓고 장터에서 본 징수원 이야기를 한다', hint: '빈 솥까지 압류하는 징수원 앞에서 장터 사람들을 지킬 힘이 필요했다고 설명한다', values: { justice: D },
        fx: [dream('changeWorld')] },
    ],
  },
  {
    id: 'dream_rebel', kind: 'door', when: young, weight: 20, repeat: 'once', speaker: 'hero',
    title: '빵 바구니에 붙은 딱지', body: '징수원이 장터의 빵 바구니에 붉은 압류 딱지를 붙인다. 빵집 주인이 방금 받은 세금 영수증을 펴 보이지만 징수원은 허리의 칼을 툭 치고 다음 좌판으로 간다. 딱지의 풀이 마르기 전에 {name}이(가) 빵집 앞에 멈춰 선다.',
    doors: [
      { label: '이웃 가게의 영수증도 모아 주인과 함께 항의하러 간다', hint: '세금을 두 번 낸 가게가 몇 곳인지 확인하고 압류를 풀어 달라고 요구한다', values: { freedom: D },
        fx: [dream('changeWorld')] },
      { label: '빵집 주인에게 이 동네 검술 스승을 묻는다', hint: '세상에서 제일가는 검객이 되어 저런 횡포를 막고 싶다고 말한다', values: { dominion: D },
        fx: [dream('bestSword')] },
      { label: '딱지 뒷면에 해골 깃발을 그려 빵집 주인에게 건넨다', hint: '해적왕이 되는 날 이 깃발을 단 가게는 자신이 지키겠다고 약속한다', values: { ambition: D },
        fx: [dream('pirateKing')] },
    ],
  },
];

const LATER: Turning[] = [
  {
    id: 'dream_waver', kind: 'door', when: at(age(28, 42), st(...ACTIVE), { c: 'dream', has: true, done: false, years: 12 }), weight: 3, repeat: 'once', speaker: 'hero',
    title: '흔들리는 꿈', body: '묵은 수첩의 실밥이 터져 첫 장이 떨어졌다. 거기엔 어린 날의 글씨로 꿈 한 줄이 적혀 있다. {name}은(는) 새 수첩을 펴고 그 종이를 옆에 놓는다.',
    doors: [
      { label: '떨어진 첫 장을 새 수첩에 꿰맨다', hint: '어릴 때 눌러 쓴 글씨까지 그대로 가지고 간다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('{name}은(는) 종이의 낡은 바늘구멍을 따라 새 실을 꿰었다. 이번 수첩도 같은 글씨로 시작했다.')] },
      { label: '새 첫 장에 함께 늙고 싶은 사람들에게 보낼 안부를 쓴다', hint: '이번에는 자신이 저녁상을 차리겠다는 말을 편지에 덧붙인다', values: { peace: D },
        fx: [dream('peace')] },
      { label: '새 수첩에 마지막 바다까지 그릴 지도 자리를 비워 둔다', hint: '첫 줄에 ‘내 눈으로 본 곳만 그릴 것’이라고 적는다', values: { romance: D },
        fx: [dream('worldEnd')] },
    ],
  },
  {
    id: 'dream_last', kind: 'door', when: at(age(55, 75), st(...GROWN), { c: 'dream', has: true, done: false }), weight: 14, repeat: 'once', speaker: 'hero',
    title: '닿지 못한 꿈', body: '짐을 정리하던 {name}은(는) 오래된 꾸러미를 무릎에 올린다. 젊을 때부터 모은 메모가 한 움큼 나온다. 짐을 거들던 젊은이가 메모도 함께 묶어 둘지 묻는다.',
    doors: [
      { label: '메모를 챙겨 다시 길을 나선다', hint: '다음 날 들고 갈 짐에 메모 꾸러미를 따로 넣어 둔다', values: { romance: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 20 }, { op: 'flag', id: 'dreamLastTry' },
             heavy('다음 날 새벽, {name}은(는) 문 앞에서 무릎을 한 번 주무르고 다시 짐을 졌다. 메모 꾸러미는 꺼내기 쉽게 맨 위에 두었다.')] },
      { label: '메모를 날짜순으로 펴서 젊은이에게 읽어 준다', hint: '어디까지 해냈는지 짚어 주고 나머지를 이어 볼 생각이 있는지 묻는다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'dreamPassed' }, heavy('젊은이는 맨 위 메모를 소리 내어 읽고 나머지를 품에 넣었다. {name}은(는) 빈 꾸러미의 끈까지 풀어 건넸다.')] },
      { label: '메모에 마지막 날짜를 쓰고 꾸러미를 묶는다', hint: '남은 이야기는 저녁을 먹으며 들려주기로 한다', values: { peace: D },
        fx: [{ op: 'flag', id: 'dreamAccepted' }, heavy('{name}은(는) 꾸러미를 선반에 올리고 저녁상에 숟가락을 하나 더 놓았다.')] },
    ],
  },
];

export const DREAM_TURNINGS: Turning[] = [...BORN, ...LATER];
