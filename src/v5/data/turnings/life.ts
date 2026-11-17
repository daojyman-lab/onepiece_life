// 삶의 사건 (과제 9, 설계 5.5): 어느 처지에서나 오는 사랑과 혼인, 자식, 부모, 형제, 벗과 빚과 배신, 누구를 구할지,
// 다쳐서 물러남. 로그타운에서 태어난 사람에게 열린다.
// 청혼(people.ts의 pp_marriage)은 먼저 마음에 둔 사람이 생긴 뒤에만 온다: life_meet가 표시 'sweetheart'를 세운다.
// 혼인과 자식에는 헌신이나 평온만 붙지 않는다. 받아들이는 문과 거절하는 문에 서로 다른 가치관이 붙는다.
// 자식이 자라서 오는 사건은 주인공이 쉰 살 넘어서 온다 (자식의 나이를 보는 조건이 아직 없다 — 과제 13에 보고).
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { ACTIVE, GROWN, HUNTED, SEAFARING, age, at, st } from './paths';
import type { Cond, Turning } from '../../core/types';

/** 해군은 떠돌이를 동료로 받지 않는다 (marine.ts의 mn_squad_pick) */
const NOT_SQUAD: Cond = { c: 'standing', is: ['child', 'civil', 'pirate', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'prisoner', 'retired'] };
const D = V.value.door;
const has = (id: string): Cond => ({ c: 'flag', id, has: true });
const not = (id: string): Cond => ({ c: 'flag', id, has: false });
const active = st(...ACTIVE);
const grown = st(...GROWN);

const LOVE: Turning[] = [
  // ---------------------------------------------------------------- 사랑과 혼인
  {
    // v4 fm_meet. 청혼(pp_marriage) 앞에 오는 "먼저 만나는 사건"
    id: 'life_meet', kind: 'door', when: at(age(17, 40), active, not('sweetheart'), not('married'), not('waitingLove')),
    weight: 6, repeat: 'once', speaker: 'hero',
    title: '자꾸 마주치는 눈', body: '{island} 항구의 꽃가게 앞을 지날 때마다 같은 사람과 눈이 마주친다. 오늘은 그 사람이 먼저 웃었다. {name}의 손에는 내일 떠나는 배의 표가 들려 있다.',
    doors: [
      { label: '배를 한 척 늦추고 먼저 말을 건다', hint: '떠날 날이 밀리고, 마음에 둔 사람이 생긴다', values: { romance: D },
        fx: [{ op: 'flag', id: 'sweetheart' }, { op: 'money', add: -3000 }, { op: 'log', text: '배는 {name}을(를) 두고 떠났다. 꽃가게 앞에서 해가 질 때까지 이야기를 나눴다.', weight: 'heavy' }] },
      { label: '말없이 꽃 한 송이를 사서 그 사람의 손에 쥐여 주고 배에 오른다', hint: '아무것도 묻지 않고 떠난다. 그 얼굴이 오래 남는다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 1 }, { op: 'log', text: '배가 멀어질 때까지 꽃가게 앞에 서 있는 사람이 보였다.', weight: 'light' }] },
      { label: '떠나는 날을 미루고 그 사람의 가게 일을 거든다', hint: '몇 달을 묵묵히 곁에 있는다. 하던 일은 멈춘다', values: { romance: D },
        fx: [{ op: 'flag', id: 'sweetheart' }, { op: 'money', add: -8000 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '꽃가게 문을 닫는 동안 짐을 날랐다. 배표는 접혀 서랍 속에 들어갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_family_objection', kind: 'door', when: at(age(18, 42), active, has('sweetheart'), not('married')),
    weight: 5, repeat: 'once', speaker: { relation: '마음에 둔 사람의 아버지' },
    title: '문간의 아버지', body: '마음에 둔 사람의 아버지가 {name}을(를) 문간에 세워 둔 채 들이지 않는다. 근본도 벌이도 모르는 사람에게 제 집 사람을 맡길 수 없다고, 다시는 찾아오지 말라고 한다.',
    doors: [
      { label: '보란 듯이 이름을 얻어 다시 오겠다고 한다', hint: '몇 해를 독하게 일한다. 그동안 그 사람이 기다릴지는 모른다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'flag', id: 'provingSelf' }, { op: 'money', add: 10000 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '그 집 문 앞에서 발길을 돌렸다. 몇 해 동안 모은 품삯과 소문을 안고 다시 찾아갈 생각이었다.', weight: 'light' }] },
      { label: '그 사람의 손을 잡고 밤배로 달아난다', hint: '혼인은 하지만 그 집과는 끝이다. 아는 사람 없는 곳에서 시작한다', values: { romance: D }, danger: true,
        fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'person', kind: 'family', relation: '배우자' }, { op: 'flag', id: 'married' },
             { op: 'hardship', add: 2 }, { op: 'timeline', text: '반대를 무릅쓰고 마음에 둔 사람과 달아나 혼인했다' }, { op: 'log', text: '밤배가 떠날 때 그 사람은 작은 보퉁이 하나만 들고 있었다. 뒷집의 등불이 멀어졌다.', weight: 'light' }] },
      { label: '그 사람이 집을 잃지 않게 스스로 물러난다', hint: '마음을 접는다. 그 사람은 집에 남는다', values: { loyalty: D },
        fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'hardship', add: 4 }, { op: 'log', text: '다시는 꽃가게 앞을 지나지 않았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'life_love_or_route', kind: 'door', when: at(age(20, 42), active, has('sweetheart'), not('married')),
    weight: 5, repeat: 'once', speaker: { relation: '마음에 둔 사람' },
    title: '두 개의 배표', body: '마음에 둔 사람이 먼 섬의 지도 공방에 자리를 얻었다. 같은 달, {name}에게도 오래 기다린 일이 다른 쪽 바다에서 들어왔다. 배표 두 장이 탁자 위에 놓여 있다.',
    doors: [
      { label: '제 일을 버리고 그 사람의 섬으로 간다', hint: '쌓아 온 것을 놓는다. 낯선 섬에서 다시 시작한다', values: { romance: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'flag', id: 'followedLove' }, { op: 'log', text: '그 사람의 섬에 내렸다. 바닷바람이 고향과 달랐다.', weight: 'heavy' }] },
      { label: '제 길을 간다', hint: '일은 붙잡고, 그 사람과는 여기서 헤어진다', values: { ambition: D },
        fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'money', add: 20000 }, { op: 'hardship', add: 3 }, { op: 'log', text: '두 배표를 따로 접었다. 그 사람의 배가 먼저 떠나고 공방의 주소만 남았다.', weight: 'light' }] },
      { label: '해마다 편지를 보내겠다며 기다려 달라고 한다', hint: '둘 다 제 길을 간다. 약속 하나가 남는다', values: { loyalty: D },
        fx: [{ op: 'unflag', id: 'sweetheart' }, { op: 'flag', id: 'waitingLove' }, { op: 'log', text: '서로의 항구 주소를 적어 주었다. 첫 편지는 배가 떠난 이튿날 썼다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_waited', kind: 'door', when: at(age(24, 55), active, has('waitingLove'), not('married')),
    weight: 6, repeat: 'once', speaker: { relation: '기다리던 사람' },
    title: '아직 기다린다는 편지', body: '닳고 닳은 편지 한 통이 몇 달을 돌아 {name}의 손에 닿았다. 아직 기다리고 있다고, 그런데 이제 기다리는 일이 조금 지쳤다고 적혀 있다.',
    doors: [
      { label: '하던 일을 접고 돌아가 혼인한다', hint: '약속을 지킨다. 바다의 일은 거기서 멈춘다', values: { justice: D },
        fx: [{ op: 'unflag', id: 'waitingLove' }, { op: 'person', kind: 'family', relation: '배우자' }, { op: 'flag', id: 'married' },
             { op: 'moveHome' }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '오래 기다려 준 사람과 혼인했다' }, { op: 'log', text: '닳은 편지를 품에 넣고 돌아가는 배에 올랐다. 마중 나온 사람의 눈가에 긴 기다림이 남아 있었다.', weight: 'light' }] },
      { label: '이제 기다리지 말라는 답장을 쓴다', hint: '그 사람을 놓아준다. 답장을 쓰는 데 사흘이 걸린다', values: { freedom: D },
        fx: [{ op: 'unflag', id: 'waitingLove' }, { op: 'hardship', add: 4 }, { op: 'log', text: '사흘 만에 답장을 봉했다. 부두 우체통에 넣은 뒤에도 한참 손을 떼지 못했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_empty_table', kind: 'door', when: at(age(25, 65), active, has('married')),
    weight: 4, repeat: 'once', needs: ['spouse'], speaker: { relation: '배우자' },
    title: '식어 버린 밥상', body: '집을 비우는 날이 늘었다. 오랜만에 돌아온 밤, 배우자가 식어 버린 밥상 앞에서 말한다. 이렇게 사는 게 둘이 사는 거냐고.',
    doors: [
      { label: '일을 줄이고 집에 머문다', hint: '벌이가 줄고, 하던 일에서 밀려난다', values: { peace: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'fame', add: -2 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '다음 날 저녁에는 밥이 식기 전에 집에 왔다. 대신 일감 장부의 빈칸이 늘었다.', weight: 'light' }] },
      { label: '배우자를 일에 끌어들여 함께 다닌다', hint: '함께 있게 되고, 함께 위험해진다', values: { ambition: D }, danger: true,
        fx: [{ op: 'money', add: 10000 }, { op: 'chance', p: 0.15, then: [{ op: 'losePerson', who: 'spouse' }, { op: 'log', text: '함께 나선 일에서 배우자를 잃었다.', weight: 'heavy' }] , else: [{ op: 'log', text: '둘이 같은 배에 올라 첫 항구를 함께 지났다. 위험한 밤에도 손이 닿는 거리에 있었다.', weight: 'light' }]}] },
      { label: '서로의 길을 인정하고 갈라선다', hint: '각자 산다. 집 열쇠를 돌려준다', values: { freedom: D },
        fx: [{ op: 'losePerson', who: 'spouse' }, { op: 'unflag', id: 'married' }, { op: 'timeline', text: '배우자와 갈라섰다' }, { op: 'log', text: '집 열쇠를 식탁 위에 놓았다. 배우자가 가져갈 물건을 고르는 동안 밖에서 기다렸다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_spouse_ill', kind: 'door', when: at(age(25, 75), grown, has('married')),
    weight: 4, repeat: 'once', needs: ['spouse'], speaker: { relation: '의원' },
    title: '배우자의 병', body: '배우자가 오래 앓던 기침에 피가 섞여 나온다. 의원은 위대한 항로의 큰 섬에 가야 고칠 수 있다고, 뱃삯과 약값이 모아 둔 돈을 다 써도 모자랄 거라고 한다.',
    doors: [
      { label: '가진 것을 다 털어 큰 섬의 의사에게 데려간다', hint: '빈털터리가 된다. 살릴 수 있을지는 모른다', values: { loyalty: D },
        fx: [{ op: 'money', add: -60000 },
             { op: 'chance', p: 0.65, then: [{ op: 'log', text: '배우자가 다시 일어나 앉았다. 빈 주머니가 하나도 아깝지 않았다.', weight: 'heavy' }],
               else: [{ op: 'losePerson', who: 'spouse' }, { op: 'log', text: '큰 섬의 의사도 손을 쓰지 못했다.', weight: 'heavy' }, { op: 'timeline', text: '배우자를 병으로 잃었다' }] }] },
      { label: '약값을 벌려고 위험한 일거리를 맡는다', hint: '큰돈이 걸린 일이다. 그동안 곁에 있을 수 없다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'money', add: 20000 },
             { op: 'chance', p: 0.45, then: [{ op: 'losePerson', who: 'spouse' }, { op: 'hardship', add: 3 }, { op: 'log', text: '돈을 쥐고 돌아왔을 때 배우자는 이미 떠나고 없었다.', weight: 'heavy' }], else: [{ op: 'log', text: '약값 봉투를 쥐고 돌아왔다. 배우자는 아직 기침했지만 눈을 뜨고 {name}의 이름을 불렀다.', weight: 'light' }]}] },
      { label: '옛 의서를 뒤지며 손수 약을 달인다', hint: '돈은 덜 든다. 맞는 약을 찾을지는 모른다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 },
             { op: 'chance', p: 0.5, then: [{ op: 'log', text: '석 달 만에 기침이 멎었다.', weight: 'heavy' }],
               else: [{ op: 'losePerson', who: 'spouse' }, { op: 'log', text: '달인 약은 끝내 듣지 않았다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'life_spouse_move', kind: 'door', when: at(age(25, 65), st('civil', 'shipwright', 'settled'), has('married')),
    weight: 4, repeat: 'once', needs: ['spouse'], speaker: { relation: '배우자' },
    title: '떠나자는 말', body: '배우자가 이 섬을 떠나 고향 쪽 바다에서 새로 살자고 한다. 거기에 늙은 식구들이 있다고. {name}이(가) {island}에서 쌓은 일과 이웃은 두고 가야 한다.',
    doors: [
      { label: '배우자를 따라 섬을 떠난다', hint: '일과 이웃을 두고 간다. 처음부터 다시 쌓는다', values: { romance: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'unflag', id: 'shop' }, { op: 'standing', to: 'civil' },
             { op: 'log', text: '이삿짐을 실은 배가 {island}를 떠났다.', weight: 'heavy' }, { op: 'timeline', text: '배우자를 따라 섬을 옮겼다' }] },
      { label: '여기서 쌓은 것을 버릴 수 없다며 남는다', hint: '배우자 혼자 떠난다. 집이 텅 빈다', values: { ambition: D },
        fx: [{ op: 'losePerson', who: 'spouse' }, { op: 'unflag', id: 'married' }, { op: 'hardship', add: 3 }, { op: 'log', text: '배우자의 배가 떠난 뒤 집에는 두 사람 몫의 그릇이 남았다. 하나를 치우는 데 오래 걸렸다.', weight: 'light' }] },
      { label: '늙은 식구들을 이 섬으로 모셔 오자고 한다', hint: '집이 비좁아지고 살림이 빠듯해진다. 아무도 떠나지 않는다', values: { romance: D },
        fx: [{ op: 'money', add: -25000 }, { op: 'person', kind: 'ally', relation: '모셔 온 배우자의 늙은 식구', age: { older: 28 } }, { op: 'log', text: '늙은 식구들이 짐을 풀자 작은 방에 잠자리를 더 깔았다. 저녁마다 둘러앉을 사람이 늘었다.', weight: 'light' }] },
    ],
  },
];

const FAMILY: Turning[] = [
  // ---------------------------------------------------------------- 자식
  {
    id: 'life_child_sea', kind: 'door', when: at(age(50, 78), grown),
    weight: 5, repeat: 'once', needs: ['child'], speaker: { relation: '다 자란 자식' },
    title: '자식의 돛', body: '다 자란 자식이 바다로 나가겠다고 한다. 해적이 들끓는 바다라는 걸 알면서도. {name}이(가) 젊을 때 보던 눈빛과 똑같다.',
    doors: [
      { label: '모은 돈으로 튼튼한 배를 마련해 준다', hint: '빈 둥지가 된다. 그 배가 어디까지 갈지는 모른다', values: { freedom: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'flag', id: 'childSailed' }, { op: 'timeline', text: '자식에게 배를 마련해 바다로 보냈다' }, { op: 'log', text: '새 배의 돛을 함께 올렸다. 항구가 비자 집에서 자식의 발소리가 더는 들리지 않았다.', weight: 'light' }] },
      { label: '집안 일을 이어야 한다며 붙든다', hint: '자식은 남는다. 그 눈빛이 원망으로 바뀐다', values: { loyalty: D },
        fx: [{ op: 'hardship', add: 2 }, { op: 'flag', id: 'childKeptHome' }, { op: 'log', text: '자식은 집안 일을 배웠다. 그러나 항구의 돛이 오를 때마다 손을 멈췄다.', weight: 'light' }] },
      { label: '늙은 몸으로 같은 배에 오른다', hint: '다시 바다로 나간다. 노쇠한 몸에 바다는 거칠다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'mastery', branch: 'observation', add: 6 }, { op: 'log', text: '자식의 배에서 늙은 선원 노릇을 했다. 자식은 한 번도 귀찮아하지 않았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'life_child_secret', kind: 'door', when: at(age(48, 78), grown),
    weight: 4, repeat: 'once', needs: ['child'], speaker: 'hero',
    title: '닫힌 방문', body: '자식이 말이 없어졌다. 방문을 걸어 잠그고, 집안의 돈이 조금씩 비고, 밤늦게 낯선 사람들과 부두를 오간다는 말이 들린다.',
    doors: [
      { label: '밤에 몰래 부두까지 뒤를 밟는다', hint: '무엇에 휘말렸는지 알게 된다. 들키면 자식이 등을 돌린다', values: { freedom: D },
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'money', add: -20000 }, { op: 'log', text: '노름판의 빚이었다. 빚을 대신 갚고 자식을 데려왔다.', weight: 'heavy' }],
               else: [{ op: 'hardship', add: 3 }, { op: 'log', text: '뒤를 밟던 걸 들켰다. 자식은 그날 밤 집을 나갔다.', weight: 'heavy' }] }] },
      { label: '제 일은 제가 감당하게 두고 기다린다', hint: '아무것도 묻지 않는다. 일이 커질 수도 있다', values: { freedom: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'log', text: '반년 뒤 자식이 먼저 털어놓았다. 이미 스스로 정리한 일이었다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -30000 }, { op: 'log', text: '빚쟁이들이 문을 두드렸다. 일이 커질 대로 커져 있었다.', weight: 'heavy' }] }] },
      { label: '불러 앉혀 엄하게 다그친다', hint: '자식이 입을 열지도, 더 닫을지도 모른다', values: { dominion: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'log', text: '자식이 울면서 털어놓았다.', weight: 'light' }],
               else: [{ op: 'hardship', add: 2 }, { op: 'log', text: '자식은 끝내 입을 다물었다. 그 뒤로 둘 사이에 말이 줄었다.', weight: 'light' }] }] },
    ],
  },
  {
    // 뭍에서 일군 일(가게 · 작업장)을 물려줄 때. 바다의 처지는 아래의 깃발 · 제복 쪽이 온다
    id: 'life_child_name', kind: 'door', when: at(age(52, 80), st('civil', 'shipwright', 'settled', 'retired')),
    weight: 4, repeat: 'once', needs: ['child'], speaker: { relation: '다 자란 자식' },
    title: '물려줄 이름', body: '{name}이(가) 평생 일군 일을 물려받을 나이가 된 자식이, 제 이름으로 전혀 다른 일을 시작하고 싶다고 한다. 손님들도 거래처도 {name}의 이름을 보고 온 사람들이다.',
    doors: [
      { label: '제 일은 접고 자식의 새 일에 밑천을 댄다', hint: '평생 일군 것이 문을 닫는다. 자식은 제 길을 간다', values: { freedom: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'unflag', id: 'shop' }, { op: 'log', text: '자식의 간판이 걸리던 날, {name}은(는) 맨 앞줄에서 박수를 쳤다.', weight: 'heavy' }] },
      { label: '집안의 이름을 지켜 달라고 설득한다', hint: '일은 이어진다. 자식의 꿈은 접힌다', values: { loyalty: D },
        fx: [{ op: 'hardship', add: 1 }, { op: 'flag', id: 'heirKept' }, { op: 'log', text: '자식은 옛 간판을 그대로 걸었다. 새 일을 그리던 도면은 서랍 안으로 들어갔다.', weight: 'light' }] },
      { label: '자식의 새 일을 제 일 밑으로 들여 함께 키운다', hint: '둘 다 놓지 않는다. 일이 두 배로 바빠진다', values: { ambition: D },
        fx: [{ op: 'money', add: 20000 }, { op: 'hp', add: -8 }, { op: 'log', text: '옛 장부 옆에 자식의 새 장부를 펼쳤다. 첫 거래처를 함께 찾아갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_foundling', kind: 'door', when: at(age(22, 65), active),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '나무 상자 속의 아이', body: '{island}의 부둣가 나무 상자 안에서 울음소리가 난다. 서너 살쯤 된 아이가 담요에 싸여 있다. 상자에는 "부탁합니다" 한 줄만 적혀 있다.',
    doors: [
      { label: '집으로 데려가 제 손으로 키운다', hint: '하던 일을 줄이고 식구가 하나 는다', values: { peace: D }, 
        fx: [{ op: 'person', kind: 'family', relation: '자식', age: 3 }, { op: 'money', add: -10000 }, { op: 'timeline', text: '부둣가에 버려진 아이를 거두어 자식으로 삼았다' }, { op: 'log', text: '상자를 안고 집으로 돌아왔다. 작은 신발 한 켤레가 문간에 놓였다.', weight: 'light' }] },
      { label: '마을 고아원에 맡기고 해마다 돈을 보낸다', hint: '곁에 두지는 않는다. 그 아이가 굶지는 않는다', values: { justice: D }, 
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'ally', relation: '고아원에 맡긴 아이', age: 3 }, { op: 'log', text: '고아원 문이 닫힐 때 아이가 상자 담요를 쥐고 있었다. 첫 돈 봉투를 다음 달에 보냈다.', weight: 'light' }] },
      { label: '아이 없는 부잣집에 넘기고 사례를 받는다', hint: '아이는 배부르게 자랄지 모른다. 주머니는 확실히 두둑해진다', values: { greed: D }, fx: [{ op: 'money', add: 30000 }, { op: 'log', text: '부잣집 마차가 떠나는 동안 아이는 담요 밖으로 손을 내밀었다. 사례금은 무거웠다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 부모
  {
    id: 'life_parent_sick', kind: 'door', when: at(age(18, 55), active),
    weight: 4, repeat: 'once', needs: ['parent'], speaker: 'hero',
    title: '앓아누운 부모', body: '{town}에서 소식이 왔다. 부모가 병으로 일손을 놓았다고 한다. 오래 돌봐야 하는 병이고, 집에는 약값을 댈 사람이 없다.',
    doors: [
      { label: '{town}(으)로 돌아가 곁에서 돌본다', hint: '하던 일을 멈추고 고향에 머문다', values: { peace: D }, 
        fx: [{ op: 'moveHome' }, { op: 'money', add: -10000 }, { op: 'log', text: '{town}의 옛집에서 부모의 약을 달였다.', weight: 'heavy' }] },
      { label: '약값을 벌어 다달이 부친다', hint: '곁에 있지 못하는 대신 일을 두 배로 한다', values: { loyalty: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'hp', add: -8 }, { op: 'log', text: '매달 약값을 부쳤다. 부모의 답장에는 나아진 날보다 외로운 날의 이야기가 많았다.', weight: 'light' }] },
      { label: '이 일을 끝내고 가겠다는 답장을 보낸다', hint: '하던 일은 끝낸다. 늦을지도 모른다', values: { ambition: D },
        fx: [{ op: 'money', add: 10000 },
             { op: 'chance', p: 0.35, then: [{ op: 'losePerson', who: 'parent' }, { op: 'hardship', add: 3 }, { op: 'log', text: '일을 끝내고 돌아갔을 때 부모는 이미 땅에 묻혀 있었다.', weight: 'heavy' }], else: [{ op: 'log', text: '일을 마치고 고향에 닿았다. 부모가 문 앞까지 걸어 나와 늦은 답장을 꺼냈다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'life_parent_secret', kind: 'door', when: at(age(18, 50), active),
    weight: 4, repeat: 'once', needs: ['parent'], speaker: 'hero',
    title: '서랍 속의 문서', body: '고향 집의 오래된 서랍에서 낯선 항구의 통행증과, 모르는 이름들이 빼곡한 장부가 나왔다. 부모가 한 번도 말한 적 없는 지난날이다.',
    doors: [
      { label: '부모를 앉혀 놓고 묻는다', hint: '부모는 오래 입을 다물다가 무언가를 털어놓는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'parentPast' },
             { op: 'log', text: '부모는 젊은 날 해적선에서 일했다고 털어놓았다. 장부의 이름들은 그 배의 선원들이었다.', weight: 'heavy' }] },
      { label: '서랍 속 문서를 아는 사람에게 팔아 치운다', hint: '돈이 생긴다. 부모는 무엇이 사라졌는지 묻지 못한다', values: { greed: D }, fx: [{ op: 'money', add: 30000 }, { op: 'log', text: '장부를 받아 간 사람은 부모의 이름을 보자 값을 올렸다. 집에 돌아와 빈 서랍을 닫았다.', weight: 'light' }] },
      { label: '통행증의 항구를 직접 찾아간다', hint: '먼 뱃길이다. 부모가 왜 숨겼는지 알게 될지도 모른다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'money', add: -15000 }, { op: 'flag', id: 'parentPast' }, { op: 'hp', add: -5 },
             { op: 'person', kind: 'ally', relation: '부모의 옛 뱃동무', age: { older: 30 } }, { op: 'log', text: '통행증에 찍힌 항구에 내렸다. 오래된 명부에서 부모의 이름을 찾았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_parent_remarry', kind: 'door', when: at(age(16, 45), active),
    weight: 3, repeat: 'once', needs: ['parent'], speaker: { relation: '혼자 된 부모' },
    title: '새 식구', body: '오래 혼자 살아온 부모가 머뭇거리며, 같이 살고 싶은 사람이 생겼다고 한다. 그 사람에게는 다 큰 아이들이 셋 있고, 고향 집은 그 식구들로 가득 찰 것이다.',
    doors: [
      { label: '새 식구를 반갑게 맞는다', hint: '고향 집이 낯설어진다. 집안이 다시 화목해진다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', relation: '부모의 새 짝', age: { older: 25 } }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '새 식구들이 짐을 풀자 고향 집 식탁에 의자가 셋 늘었다.', weight: 'light' }] },
      { label: '돌아가신 쪽을 잊느냐며 반대한다', hint: '부모와 사이가 틀어진다', values: { dominion: D }, 
        fx: [{ op: 'hardship', add: 3 }, { op: 'flag', id: 'parentRift' }, { op: 'log', text: '부모는 그 사람과 함께 마당에 섰다. {name}에게는 문을 열어 주지 않았다.', weight: 'light' }] },
      { label: '새 식구가 들어오기 전에 집안 재산을 제 이름으로 돌려 둔다', hint: '재산은 지킨다. 집안에 찬바람이 분다', values: { greed: D }, fx: [{ op: 'money', add: 38000 }, { op: 'log', text: '문서에 도장을 찍은 뒤 새 식구가 들어왔다. 저녁 식탁에서 누구도 재산 이야기를 꺼내지 않았다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 형제
  {
    id: 'life_sibling_guarantee', kind: 'door', when: at(age(20, 60), active),
    weight: 4, repeat: 'once', needs: ['sibling'], speaker: { relation: '형제' },
    title: '형제의 보증', body: '형제가 큰 상인에게 돈을 빌려 배 한 척을 사겠다며, {name}에게 보증을 서 달라고 한다. 잘되면 둘 다 큰돈을 만지고, 잘못되면 {name}의 집이 넘어간다.',
    doors: [
      { label: '두말없이 보증을 선다', hint: '형제를 믿는다. 집을 건다', values: { loyalty: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 30000 }, { op: 'log', text: '형제의 배는 첫 항해에서 큰 이문을 남겼다.', weight: 'heavy' }],
               else: [{ op: 'money', add: -50000 }, { op: 'hardship', add: 3 }, { op: 'log', text: '형제의 배가 가라앉았다. 빚쟁이들이 {name}의 집으로 왔다.', weight: 'heavy' }] }] },
      { label: '장부와 항로부터 보여 달라고 한다', hint: '형제의 자존심을 건드린다. 위험한 거래라면 걸러 낸다', values: { inquiry: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'log', text: '장부에 구멍이 있었다. 형제는 화를 냈지만 거래를 물렸고, 반년 뒤 그 상인이 사기꾼으로 붙잡혔다.', weight: 'heavy' }],
               else: [{ op: 'hardship', add: 2 }, { op: 'log', text: '형제는 다른 보증인을 찾았다. 그 뒤로 둘 사이가 서먹해졌다.', weight: 'light' }] }] },
      { label: '보증 대신 제 돈을 대고 동업자가 된다', hint: '돈은 직접 건다. 형제와 한배를 탄다', values: { ambition: D }, danger: true,
        fx: [{ op: 'money', add: -30000 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 70000 }, { op: 'log', text: '형제의 배가 첫 항해에서 이문을 냈다. 두 사람이 나란히 항구 장부에 서명했다.', weight: 'light' }] , else: [{ op: 'log', text: '배가 빈손으로 돌아왔다. 두 사람은 같은 탁자에서 남은 돈을 다시 셌다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'life_sibling_other_side', kind: 'door', when: at(age(18, 55), st(...HUNTED)),
    weight: 4, repeat: 'once', needs: ['sibling'], speaker: { relation: '해군이 된 형제' },
    title: '군함 위의 얼굴', body: '{name}이(가) 탄 배를 쫓아오는 군함의 뱃머리에 낯익은 얼굴이 서 있다. 해군 장교가 된 형제다. 형제가 확성기를 들고 배를 세우라고 외친다.',
    doors: [
      { label: '형제와 칼을 맞대지 않으려 다른 바다로 달아난다', hint: '이 바다의 일을 버린다', values: { loyalty: D },
        fx: [{ op: 'fame', add: -3 }, { op: 'flag', id: 'fledSibling' }, { op: 'hardship', add: 1 }, { op: 'log', text: '형제의 확성기 소리가 멀어질 때까지 돛을 내리지 않았다. 배를 돌린 뒤에도 손이 떨렸다.', weight: 'light' }] },
      { label: '배를 돌려 맞선다', hint: '형제에게 이기든 지든 그 사이는 돌아오지 않는다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 8 }, { op: 'person', kind: 'rival', relation: '군함의 형제' }, { op: 'log', text: '군함과 배가 가까워지자 형제가 먼저 칼을 뽑았다. 둘의 칼이 맞닿는 소리가 갑판에 울렸다.', weight: 'light' }] },
      { label: '배를 세우고 혼자 군함에 올라 형제를 설득한다', hint: '붙잡힐 수도 있다. 형제가 귀를 기울일지도 모른다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'chance', p: 0.4, then: [{ op: 'log', text: '형제는 한참을 노려보다 군함을 돌렸다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '형제는 울면서 {name}의 손에 수갑을 채웠다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'life_inheritance', kind: 'door', when: at(age(30, 70), grown, { c: 'kin', who: 'parent', has: false }),   // 부모가 남긴 것: 부모가 세상을 떠난 뒤에만
    weight: 4, repeat: 'once', needs: ['sibling'], speaker: { relation: '형제' },
    title: '하나뿐인 집', body: '부모가 남긴 {town}의 집과 밭은 하나뿐이다. 형제는 거기서 식구들과 살아야 한다며 통째로 달라고 하고, 동네 어른들은 반씩 나누는 게 법도라고 한다.',
    doors: [
      { label: '형제에게 모두 넘긴다', hint: '다툼 없이 끝낸다. 고향에 제 몫은 남지 않는다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', relation: '고향 집을 지키는 형제' }, { op: 'log', text: '형제가 집 열쇠를 받아 들었다. 고향을 떠나며 밭두렁을 마지막으로 걸었다.', weight: 'light' }] },
      { label: '법도대로 반씩 나누자고 한다', hint: '몫은 챙긴다. 형제가 서운해한다', values: { justice: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'hardship', add: 1 }, { op: 'log', text: '동네 어른들이 경계에 말뚝을 박았다. 형제는 제 몫의 밭에서 눈을 돌렸다.', weight: 'light' }] },
      { label: '맏이의 몫이라며 제가 차지한다', hint: '집은 손에 들어오고, 형제와는 남이 된다', values: { greed: D }, 
        fx: [{ op: 'money', add: 90000 }, { op: 'flag', id: 'siblingFeud' }, { op: 'hardship', add: 2 }, { op: 'log', text: '집 문서에 제 이름을 올렸다. 형제의 식구들이 짐을 싣고 떠났다.', weight: 'light' }] },
    ],
  },
];

const BONDS: Turning[] = [
  // ---------------------------------------------------------------- 벗과 빚과 배신, 누구를 구할지
  {
    id: 'life_friend_debt', kind: 'door', when: at(age(18, 60), active),
    weight: 4, repeat: 'once', speaker: { relation: '빚쟁이' },
    title: '벗이 남긴 빚', body: '보증을 서 준 오랜 벗이 빚을 두고 사라졌다. 빚쟁이들이 {name}을(를) 찾아와 벗 대신 갚으라고 한다. 벗이 어느 섬에 숨었는지 짐작 가는 데가 있다.',
    doors: [
      { label: '벗 대신 빚을 갚는다', hint: '모아 둔 것이 사라진다. 벗을 탓하지 않는다', values: { loyalty: D },
        fx: [{ op: 'money', add: -40000 }, { op: 'hardship', add: 2 }, { op: 'log', text: '빚쟁이에게 돈을 건넸다. 벗의 빈 자리를 보면서도 뒤쫓지 않았다.', weight: 'light' }] },
      { label: '벗을 찾아가 끌고 와서 제 빚을 갚게 한다', hint: '몇 달이 걸린다. 그 벗과는 끝이다', values: { dominion: D }, 
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'rival', relation: '끌려와 빚을 갚은 옛 벗' }, { op: 'log', text: '숨은 섬에서 벗을 찾아 데려왔다. 빚을 갚은 뒤 둘은 다른 배를 탔다.', weight: 'light' }] },
      { label: '빚쟁이들을 문밖으로 내던진다', hint: '빚은 그대로 남고, 빚쟁이들이 사람을 모아 온다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'enemy', relation: '앙심을 품은 빚쟁이' }, { op: 'flag', id: 'loanSharkGrudge' }, { op: 'log', text: '빚쟁이를 내쫓자 문 앞에 부서진 등불이 남았다. 다음 날 더 많은 발자국이 골목에 찍혔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_found_bag', kind: 'door', when: at(age(16, 65), active),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '길가의 가방', body: '{island}의 외진 길가에 묵직한 가방이 떨어져 있다. 금화 꾸러미와 함께, 얼마 전 털린 상회의 인장이 찍힌 장부가 들어 있다.',
    doors: [
      { label: '해군 초소에 그대로 갖다 준다', hint: '금화는 손대지 않는다. 장부가 강도를 잡는 데 쓰인다', values: { justice: D },
        fx: [{ op: 'fame', add: 1 }, { op: 'person', kind: 'ally', relation: '장부를 돌려받은 상회 주인' }, { op: 'log', text: '해군은 장부의 인장을 알아봤다. 금화 꾸러미는 초소 창고에 봉인됐다.', weight: 'light' }] },
      { label: '금화만 챙기고 장부는 태운다', hint: '큰돈이 생긴다. 가방을 잃은 자들이 찾고 있을 것이다', values: { greed: D }, danger: true,
        fx: [{ op: 'money', add: 60000 }, { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'enemy', relation: '가방을 찾던 강도' }, { op: 'log', text: '강도들이 빈 가방을 들고 찾아왔다. 불붙은 장부 재가 남은 곳에서 {name}을(를) 알아봤다.', weight: 'light' }], else: [{ op: 'log', text: '장부 재를 바람에 날렸다. 금화는 나눠 숨겼고 한동안 길목을 살폈다.', weight: 'light' }]}] },
      { label: '장부를 읽어 강도의 뒤를 캔다', hint: '누가 털었는지 알게 된다. 강도의 눈에 띌 수 있다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'fame', add: 2 }, { op: 'chance', p: 0.25, then: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -10 }, { op: 'log', text: '장부의 숫자를 따라가자 강도가 먼저 길목을 막았다. 탈출했지만 상처가 남았다.', weight: 'light' }] , else: [{ op: 'log', text: '장부에 적힌 창고를 찾아 강도의 은신처를 밝혀냈다. 해군이 그들을 뒤쫓았다.', weight: 'light' }]}] },
    ],
  },
  {
    id: 'life_fallen_benefactor', kind: 'door', when: at(age(22, 70), active),
    weight: 4, repeat: 'once', speaker: { relation: '몰락한 은인' },
    title: '은인의 몰락', body: '어려운 시절 {name}에게 밥과 잠자리를 내주던 상인이 쫄딱 망해 {island}에 왔다. 빚쟁이를 피해 다닌다며, 며칠만 재워 달라고 한다.',
    doors: [
      { label: '집에 들여 몇 해라도 먹여 살린다', hint: '살림이 빠듯해진다. 빚쟁이가 문을 두드릴 수도 있다', values: { loyalty: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'ally', relation: '몰락한 옛 은인', age: { older: 20 } }, { op: 'log', text: '은인은 빚쟁이가 지나갈 때까지 다락에서 지냈다. 오래전 내주던 밥그릇을 이번에는 {name}이(가) 채웠다.', weight: 'light' }] },
      { label: '은인의 빚을 대신 갚아 다시 일어서게 한다', hint: '모아 둔 돈이 크게 나간다', values: { justice: D },
        fx: [{ op: 'money', add: -50000 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 30000 }, { op: 'log', text: '다시 일어선 은인이 몇 해 뒤 갚은 돈을 두 배로 돌려주었다.', weight: 'heavy' }] , else: [{ op: 'log', text: '빚은 갚았지만 은인은 한동안 빈 가게 앞을 떠나지 못했다. 다시 물건을 들이기까지 시간이 걸렸다.', weight: 'light' }]}] },
      { label: '은인의 남은 물건을 헐값에 사서 되판다', hint: '팔리면 돈이 남고, 안 팔리면 산 값만 날린다. 은인은 고맙다며 떠난다', values: { greed: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'hardship', add: 1 },
             { op: 'chance', p: 0.6, then: [{ op: 'money', add: 45000 }, { op: 'log', text: '사들인 물건이 웃돈을 받고 팔려 나갔다.', weight: 'light' }],
               else: [{ op: 'log', text: '사들인 물건은 끝내 팔리지 않았다. 창고 구석에서 먼지만 쌓였다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'life_friend_betrayal', kind: 'door', when: at(age(20, 65), active),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '판 쪽에 선 벗', body: '오랜 벗이 {name}의 큰 거래를 남에게 몰래 넘겼다. 거래는 깨졌고, 벗은 그 대가로 받은 돈으로 새 배를 샀다. 벗이 {island}의 술집에 있다는 말이 들린다.',
    doors: [
      { label: '벗이 챙긴 몫을 이자까지 쳐서 빼앗아 온다', hint: '돈은 돌아온다. 서로 원수가 된다', values: { greed: D },
        fx: [{ op: 'money', add: 15000 }, { op: 'person', kind: 'rival', relation: '원수가 된 옛 벗' }, { op: 'log', text: '술집 앞에서 옛 벗의 새 배를 먼저 보았다. 금고에서 받아 낸 돈을 세고 서로 등을 돌렸다.', weight: 'light' }] },
      { label: '술집에 가서 까닭을 묻고 용서한다', hint: '손해는 그대로다. 벗은 술잔을 들지 못한다', values: { loyalty: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'chance', p: 0.5, then: [{ op: 'person', kind: 'ally', relation: '용서받은 옛 벗' }, { op: 'log', text: '벗은 술잔을 내려놓고 빼앗은 몫을 돌려주겠다고 했다. 오래 걸리더라도 기다리기로 했다.', weight: 'light' }] , else: [{ op: 'log', text: '벗은 빈 술잔만 만지작거렸다. 왜 그랬는지 끝내 대답하지 못했다.', weight: 'light' }]}] },
      { label: '아무 말 없이 연을 끊는다', hint: '얽히지 않는다. 다시는 그 이름을 입에 올리지 않는다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 2 }, { op: 'log', text: '술집 문 앞까지 갔다가 돌아섰다. 그 뒤로 그 배의 이름을 들어도 묻지 않았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_enemy_plea', kind: 'door', when: at(age(22, 70), active),
    weight: 3, repeat: 'once', speaker: { relation: '옛 원수' },
    title: '원수의 부탁', body: '오래전 {name}에게 큰 해를 입힌 자가 피투성이가 되어 문 앞에 쓰러졌다. 의원에게 갈 돈을 빌려 달라고, 그때 일은 잘못했다고 한다.',
    doors: [
      { label: '의원에게 업고 가서 치료비를 낸다', hint: '원한을 내려놓는다. 돈이 나가고, 그 뒤로 밤잠이 편하다', values: { peace: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'chance', p: 0.5, then: [{ op: 'person', kind: 'ally', relation: '목숨을 빚진 옛 원수' }, { op: 'log', text: '의원의 불이 꺼질 무렵 원수가 살아 나왔다. 그는 갚을 빚이 생겼다며 고개를 숙였다.', weight: 'light' }] , else: [{ op: 'log', text: '의원은 새벽에 고개를 저었다. {name}은(는) 치료비 영수증을 접어 넣었다.', weight: 'light' }]}] },
      { label: '문을 닫는다', hint: '그자가 어떻게 되든 상관하지 않는다', values: { dominion: D },
        fx: [{ op: 'hardship', add: 1 }, { op: 'log', text: '문밖의 숨소리가 새벽녘에 멎었다.', weight: 'light' }] },
      { label: '그때 일을 눈감아 주는 값으로 남은 재산을 받아 낸다', hint: '돈은 생긴다. 원수는 살아도 빈털터리가 된다', values: { greed: D }, fx: [{ op: 'money', add: 45000 }, { op: 'log', text: '원수는 남은 재산의 문서를 내밀었다. 의원이 그를 데려가는 동안 손에서 종이가 바스락거렸다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_two_castaways', kind: 'door', when: at(age(18, 65), active),
    weight: 3, repeat: 'once', speaker: 'hero',
    title: '바위섬의 두 사람', body: '작은 배를 몰고 가다 난파선의 생존자 둘을 바위섬에서 찾았다. 하나는 오랜 벗이고, 하나는 {name}에게 큰 손해를 입힌 사람이다. 물이 차오르고, 배에는 한 사람 자리만 남았다.',
    doors: [
      { label: '벗을 태운다', hint: '다른 하나는 물결 속에 남는다', values: { loyalty: D },
        fx: [{ op: 'hardship', add: 3 }, { op: 'log', text: '벗을 태우고 노를 저었다. 뒤를 돌아보지 않았다.', weight: 'heavy' }] },
      { label: '더 많이 다친 쪽을 먼저 태운다', hint: '그게 원수라도. 벗에게는 돌아오겠다고 한다', values: { justice: D },
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'log', text: '다시 돌아갔을 때 벗은 바위 꼭대기에 매달려 있었다. 둘 다 살았다.', weight: 'heavy' }],
               else: [{ op: 'hardship', add: 4 }, { op: 'log', text: '다시 돌아갔을 때 바위섬은 물에 잠겨 있었다.', weight: 'heavy' }] }] },
      { label: '배의 짐을 모두 버리고 둘 다 태운다', hint: '실은 것을 다 잃는다. 배가 견딜지는 모른다', values: { romance: D }, danger: true,
        fx: [{ op: 'money', add: -30000 }, { op: 'chance', p: 0.7, then: [{ op: 'fame', add: 2 }, { op: 'log', text: '가라앉을 듯 기우뚱거리던 배가 끝내 항구에 닿았다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 3 }, { op: 'log', text: '배가 뒤집혔다. {name}만 겨우 해안에 닿았다.', weight: 'heavy' }] }] },
    ],
  },
  {
    // v4 bd_rival_reunion: 어릴 적 맞수(표시 'kidRival')와 다시 만난다. pp_promise와 같은 꼴
    id: 'life_rival_reunion', kind: 'door', when: at(age(20, 50), active, has('kidRival')),
    weight: 5, repeat: 'once', speaker: { relation: '어릴 적 맞수' },
    title: '다시 만난 맞수', body: '{island}의 술집 문이 열리고, 어릴 적 맨날 붙어 싸우던 맞수가 들어온다. 한눈에 서로를 알아본다. 맞수가 웃으며 소매를 걷어붙인다.',
    doors: [
      { label: '소매를 걷어붙이고 다시 붙는다', hint: '술집이 박살 난다. 누가 이기든 둘 다 멍투성이다', values: { dominion: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -12 }, { op: 'mastery', branch: 'fist', add: 10 }, { op: 'money', add: -5000 }, { op: 'log', text: '술집 탁자가 뒤집혔다. 둘은 멍든 얼굴로 웃으며 잔을 들었다.', weight: 'light' }] },
      { label: '술잔을 채워 밀어 준다', hint: '밤새 옛이야기를 한다', values: { peace: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '밤새 웃고 떠들었다. 해가 뜨자 맞수는 손을 흔들고 떠났다.', weight: 'light' }] },
      { label: '같이 가자고 손을 내민다', hint: '어제의 맞수가 등을 맡길 사람이 된다', values: { loyalty: D }, when: [NOT_SQUAD],
        fx: [{ op: 'person', kind: 'crew', relation: '함께하게 된 어릴 적 맞수' }, { op: 'timeline', text: '어릴 적 맞수와 같은 길을 걷게 되었다' }, { op: 'log', text: '맞수는 손을 한참 바라보다 잡았다. 다음 항구에서부터 같은 배에 올랐다.', weight: 'light' }] },
    ],
  },
  {
    id: 'life_injured_retreat', kind: 'door', when: at(age(22, 60), st(...SEAFARING), { c: 'limbLost', min: 1 }, { c: 'standingYears', min: 2 }),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '예전 같지 않은 몸', body: '잃은 몸이 아물었지만, 갑판 위에서 {name}은(는) 예전 같지 않다. 젊은 선원들이 {name}의 몫까지 뛰는 게 보인다. 오늘 밤 배가 {island}에 닿는다.',
    doors: [
      { label: '{island}에 내려 뭍에서 산다', hint: '바다의 일은 여기서 끝낸다', values: { peace: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'timeline', text: '다친 몸으로 바다를 떠나 {island}에 내렸다' }, { op: 'log', text: '항구에 짐을 내렸다. 배가 떠나는 동안 물결 소리만 끝까지 들었다.', weight: 'light' }] },
      { label: '남은 몸에 맞는 싸움법을 처음부터 다시 익힌다', hint: '몇 해를 처음 배우는 사람처럼 뒹군다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'mastery', branch: 'observation', add: 12 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '갑판에서 넘어졌다가 다시 일어났다. 젊은 선원들이 기다리는 동안 자세를 고쳤다.', weight: 'light' }] },
      { label: '앞에 서는 대신 젊은 선원들을 가르치는 자리로 물러선다', hint: '공은 남의 것이 된다. 배는 더 강해진다', values: { loyalty: D },
        fx: [{ op: 'fame', add: -2 }, { op: 'person', kind: 'ally', relation: '가르친 젊은 선원', age: { younger: 12 } }, { op: 'log', text: '젊은 선원이 처음으로 앞자리에 섰다. {name}은(는) 뒤에서 그 손의 빈틈을 짚어 주었다.', weight: 'light' }] },
    ],
  },
];


export const LIFE: Turning[] = [...LOVE, ...FAMILY, ...BONDS];
