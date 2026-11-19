// 꿈을 품고, 흔들리고, 마지막에 돌아보는 순간 (통합 기획 3장 · 4.2 · 4.5)
// 처음 품는 꿈은 꿈이 없는 동안에만 찾아온다. 싸움의 꿈은 실제로 익힌 주력과 이어진다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { ACTIVE, GROWN, age, at, st } from './paths';
import type { Cond, DreamId, Fx, Turning } from '../../core/types';

const D = V.value.door;
const NO_DREAM: Cond = { c: 'dream', has: false };
const dream = (id: DreamId): Fx => ({ op: 'dream', id });
const heavy = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const young = at(age(13, 17), NO_DREAM);

const contests = [
  { branch: 'fist', dream: 'bestFist', title: '빈 의자 하나', body: '광장의 무투 시합이 끝났다. 우승자는 의자 하나를 남겨 두고 다음 시합에서 자신을 이긴 사람이 가져가라고 한다. 맨손으로 수련해 온 {name}은(는) 관중이 돌아간 뒤에도 그 자리에 서 있다.',
    claim: '다음 시합에는 내 이름을 걸고 도전한다', record: '접수대가 닫히기 직전에 이름을 올렸다. 지금까지 수련한 체술로 저 의자의 주인이 되고 싶었다.' },
  { branch: 'polearm', dream: 'bestWeapon', title: '긴 병기의 시합', body: '긴 병기를 드는 이들이 장터에 모였다. 우승자가 자기 이름을 새긴 나무패를 기둥에 걸고 내려온다. {name}은(는) 손에 익힌 병기를 짚은 채 그 이름을 읽는다.',
    claim: '내 병기로 저 자리를 차지하겠다고 선언한다', record: '기둥 앞에서 이름을 말했다. 손에 익힌 긴 병기로 돌아오겠다고 하자 사람들이 길을 터 주었다.' },
  { branch: 'blunt', dream: 'bestWeapon', title: '다음 대회의 이름표', body: '둔기를 겨루는 대회가 끝나자 우승자가 다음 도전자의 이름표를 직접 받는다. {name}은(는) 그동안 손에 익혀 온 둔기를 내려놓고 빈 이름표 하나를 받아 든다.',
    claim: '우승자 앞에서 내 이름표를 가장 위에 건다', record: '우승자가 이름표를 읽고 고개를 끄덕였다. 다음에는 내 둔기로 그 자리에 서겠다고 답했다.' },
  { branch: 'gun', dream: 'bestShot', title: '우승자의 표적지', body: '사격 대회가 파한 뒤 우승자의 표적지가 광장에 걸렸다. 사격을 익혀 온 {name}이(가) 한참을 들여다보자 기록원이 다음 대회에 나올 생각이냐며 명부를 펼쳤다.',
    claim: '내 이름을 적고 우승 기록에 도전한다', record: '명부에 이름을 썼다. 다음 대회가 끝나면 사람들이 내 표적지 앞에 멈춰 서기를 바랐다.' },
] as const;

const BORN: Turning[] = [
  {
    id: 'dream_horizon', kind: 'door', when: young, weight: 25, repeat: 'once', speaker: 'hero',
    title: '골목 끝 해적단', body: '골목 아이들이 빈 상자 셋을 이어 놓고 해적 놀이를 한다. 앞 상자에는 손수건 깃발, 가운데에는 반쯤 그린 지도, 뒤에는 반짝이는 병뚜껑이 놓였다. 아이들이 {name}에게 어떤 역할을 맡을지 묻는다.',
    doors: [
      { label: '누구에게도 매이지 않는 왕이 되겠다고 다짐한다', hint: '가장 높은 곳에서 바람처럼 살고 싶다', values: { freedom: D },
        fx: [dream('pirateKing'), { op: 'log', text: "{name}은(는) 수평선에 걸린 마지막 빛을 보며 왕의 이름을 입에 올렸다. 누구의 명령도 받지 않는 항해가 그날의 꿈이 되었다.", weight: 'heavy' }] },
      { label: '세상의 끝을 이 눈으로 보겠다고 다짐한다', hint: '아무도 본 적 없는 곳까지 가고 싶다', values: { romance: D },
        fx: [dream('worldEnd'), { op: 'log', text: "지도 끝의 빈자리를 손가락으로 짚었다. {name}은(는) 그 너머를 제 눈으로 확인할 날을 마음속에 새겼다.", weight: 'heavy' }] },
      { label: '평생 쓰고도 남을 보물을 찾겠다고 다짐한다', hint: '반짝이는 것을 손에 쥐는 상상만으로 가슴이 뛴다', values: { greed: D, dominion: D },
        fx: [dream('treasure'), { op: 'log', text: "손에 쥔 작은 동전을 몇 번이고 뒤집어 보았다. 언젠가 세상에서 가장 큰 보물을 찾겠다는 다짐이 그보다 무겁게 남았다.", weight: 'heavy' }] },
    ],
  },
  {
    id: 'dream_order', kind: 'door', when: young, weight: 25, repeat: 'once', speaker: 'hero',
    title: '십 년 뒤에 받을 편지', body: '글방에서 십 년 뒤의 자기 앞으로 편지를 쓴다. 옆자리 아이는 과자 가게 주인이 된 자신에게 편지를 썼다. {name}은(는) 봉투를 앞에 놓고 십 년 뒤 무엇을 하고 있을지 생각한다.',
    doors: [
      { label: '옳은 것을 지키는 가장 높은 자리에 서겠다고 다짐한다', hint: '억울한 사람이 없는 세상의 꼭대기에 서고 싶다', values: { justice: D },
        fx: [dream('marineTop'), { op: 'log', text: "억울한 얼굴들이 떠올라 {name}은(는) 어른들 앞에서 해군의 가장 높은 자리에 서겠다고 말했다. 웃는 사람도 있었지만 다짐은 거두지 않았다.", weight: 'heavy' }] },
      { label: '세상이 감춘 진실을 알아내겠다고 다짐한다', hint: '책이 말하지 않는 빈칸이 궁금하다', values: { inquiry: D },
        fx: [dream('truth'), { op: 'log', text: "책의 비어 있는 대목에 표시를 남겼다. 아무도 답하지 못한 질문을 언젠가 직접 풀겠다고 {name}은(는) 결심했다.", weight: 'heavy' }] },
      { label: '소중한 사람들과 오래오래 함께 살겠다고 다짐한다', hint: '크고 먼 것보다 곁에 있는 것을 지키고 싶다', values: { peace: D },
        fx: [dream('peace'), { op: 'log', text: "종이 한 귀퉁이에 작은 식탁을 그렸다. 언젠가 소중한 사람들과 거기 둘러앉아 저녁을 먹고 싶었다.", weight: 'heavy' }] },
    ],
  },
  {
    id: 'dream_blade', kind: 'door', needs: ['sword'], when: [...young, { c: 'path', is: ['sword'] }], weight: 35, repeat: 'once', speaker: 'hero',
    title: '검 끝의 약속', body: '연습이 끝나자 맞은편 아이가 팔뚝의 멍을 문지른다. 그 아이가 누구와 겨루려고 매일 연습하는지 묻는다. {name}은(는) 풀어진 칼자루의 천을 다시 감는다.',
    doors: [
      { label: '세상에서 가장 강한 검객이 되겠다고 다짐한다', hint: '정점에 선 검객을 넘어서고 싶다', values: { dominion: D },
        fx: [dream('bestSword'), { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: "{name}은(는) 검을 다시 쥐고, 세상에서 가장 강한 검객의 이름을 소리 내어 말했다. 다음 훈련부터는 한 번도 대충 휘두르지 않았다.", weight: 'heavy' }] },
      { label: '이 검으로 누구보다 높은 왕이 되겠다고 다짐한다', hint: '검은 길을 여는 도구다', values: { ambition: D },
        fx: [dream('pirateKing'), { op: 'log', text: "검끝을 수평선 쪽으로 들어 올렸다. {name}에게 검술은 왕이 되기 위해 바다로 나아가는 첫 길이 되었다.", weight: 'heavy' }] },
      { label: '이 검으로 썩은 세상을 바꾸겠다고 다짐한다', hint: '약한 사람들을 짓밟는 것들을 베고 싶다', values: { justice: D },
        fx: [dream('changeWorld'), { op: 'log', text: "{name}은(는) 검을 쥔 손을 내려다봤다. 힘없는 사람을 짓밟는 자들 앞에서 이 검을 쓰겠다는 뜻이 분명해졌다.", weight: 'heavy' }] },
    ],
  },
  {
    id: 'dream_rebel', kind: 'door', when: young, weight: 20, repeat: 'once', speaker: 'hero',
    title: '빵 바구니에 붙은 딱지', body: '징수원이 장터의 빵 바구니에 붉은 압류 딱지를 붙인다. 빵집 주인이 방금 받은 세금 영수증을 펴 보이지만 징수원은 허리의 칼을 툭 치고 다음 좌판으로 간다. 딱지의 풀이 마르기 전에 {name}이(가) 빵집 앞에 멈춰 선다.',
    doors: [
      { label: '이 세상을 뿌리부터 바꾸겠다고 다짐한다', hint: '누구도 무릎 꿇지 않는 세상을 꿈꾼다', values: { freedom: D },
        fx: [dream('changeWorld'), { op: 'log', text: "{name}은(는) 고개를 숙인 사람 곁으로 가서 일어나라고 손을 내밀었다. 오래된 질서를 바꾸겠다는 꿈이 그날부터 말이 아닌 행동이 되었다.", weight: 'heavy' }] },
      { label: '세상에서 가장 강한 검객이 되겠다고 다짐한다', hint: '검을 배워 누구의 힘 앞에도 굽히지 않겠다', values: { dominion: D },
        fx: [dream('bestSword'), { op: 'log', text: "고개를 숙이라는 소리를 들은 밤, {name}은(는) 나뭇가지를 깎아 첫 동작부터 연습해 보았다. 세상에서 가장 강한 검객이 되어 누구의 힘 앞에도 굽히지 않겠다고 정했다.", weight: 'heavy' }] },
      { label: '그 높은 사람들보다 더 높이 오르겠다고 다짐한다', hint: '꼭대기에 서면 세상이 내 말을 듣는다', values: { ambition: D },
        fx: [dream('pirateKing'), { op: 'log', text: "높은 자들이 사라진 길목에서 {name}은(는) 언젠가 그들보다 높은 자리에 서겠다고 선언했다. 듣는 이가 없어도 그 약속은 남았다.", weight: 'heavy' }] },
    ],
  },
];

const LATER: Turning[] = [
  {
    id: 'dream_waver', kind: 'door', when: at(age(28, 42), st(...ACTIVE), { c: 'dream', has: true, done: false, years: 12 }), weight: 3, repeat: 'once', speaker: 'hero',
    title: '흔들리는 꿈', body: '묵은 수첩의 실밥이 터져 첫 장이 떨어졌다. 거기엔 어린 날의 글씨로 꿈 한 줄이 적혀 있다. {name}은(는) 새 수첩을 펴고 그 종이를 옆에 놓는다.',
    doors: [
      { label: '처음 품었던 꿈을 끝까지 붙든다', hint: '멀어도 내 꿈이다. 놓으면 내가 아니다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('{name}은(는) 그 꿈을 처음 품었을 때의 다짐을 다시 한 번 입 밖에 냈다. 꿈은 그대로였다.')] },
      { label: '곁의 사람들을 지키는 삶을 새 꿈으로 삼는다', hint: '크고 먼 것보다 지금 곁에 있는 것', values: { peace: D },
        fx: [dream('peace'), { op: 'log', text: "{name}은(는) 오래 좇던 목표보다 곁의 사람들과 보내는 시간을 먼저 택했다. 함께 저녁을 먹으며 지금 지킬 삶을 새 꿈으로 받아들였다.", weight: 'heavy' }] },
      { label: '아무도 본 적 없는 곳을 향하는 것으로 꿈을 바꾼다', hint: '정점보다 끝을 보고 싶어졌다', values: { romance: D },
        fx: [dream('worldEnd'), { op: 'log', text: "오래 품었던 꿈을 가슴에 남긴 채 지도 가장자리에 새 표시를 남겼다. {name}은(는) 아무도 가 보지 못한 곳을 향해 길을 바꿨다.", weight: 'heavy' }] },
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
        fx: [{ op: 'person', kind: 'ally', relation: '꿈을 이어받은 사람', age: 21 }, { op: 'flag', id: 'dreamPassed' }, heavy('{person:꿈을 이어받은 사람}은(는) 맨 위 메모를 소리 내어 읽고 나머지를 품에 넣었다. {name}은(는) 빈 꾸러미의 끈까지 풀어 건넸다.')] },
      { label: '메모에 마지막 날짜를 쓰고 꾸러미를 묶는다', hint: '남은 이야기는 저녁을 먹으며 들려주기로 한다', values: { peace: D },
        fx: [{ op: 'flag', id: 'dreamAccepted' }, heavy('{name}은(는) 꾸러미를 선반에 올리고 저녁상에 숟가락을 하나 더 놓았다.')] },
    ],
  },
];

export const DREAM_TURNINGS: Turning[] = [...BORN, ...contests.map((c): Turning => ({
  id: `dream_contest_${c.branch}`, kind: 'door', when: [...young, { c: 'path', is: [c.branch] }, { c: 'tier', branch: c.branch, min: 1 }],
  weight: 35, repeat: 'once', speaker: 'hero', title: c.title, body: c.body,
  doors: [
    { label: c.claim, hint: '손에 익힌 싸움법으로 정점에 서고 싶다', values: { dominion: D }, fx: [dream(c.dream), heavy(c.record)] },
    { label: '대회를 뒤로하고 내 연습을 계속한다', hint: '아직 꿈을 정하지 않았다', values: { freedom: D },
      fx: [heavy('광장을 나와 늘 연습하던 곳으로 돌아왔다. 꿈 이야기는 다른 날로 미뤄 두었다.')] },
  ],
})), ...LATER];
