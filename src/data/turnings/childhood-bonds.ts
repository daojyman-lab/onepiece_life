// 유년기에 맺은 인연이 같은 상대와 이어지는 장면들.
import { V } from '../balance';
import { kid } from './childhood';
import type { Cond, Fx, Turning } from '../../core/types';

const D = V.value.door;
const yes = (id: string): Cond => ({ c: 'flag', id, has: true });
const no = (id: string): Cond => ({ c: 'flag', id, has: false });
const person = (relation: string, has: boolean): Cond => ({ c: 'person', relation, has });
const sibling: Cond = { c: 'kin', who: 'sibling', has: true };
const noSibling: Cond = { c: 'kin', who: 'sibling', has: false };
const trained = (id: string): Fx => ({ op: 'flag', id });

export const CHILDHOOD_BONDS: Turning[] = [
  {
    id: 'kid_wooden_sword_older_revisit', kind: 'door', when: [...kid(10, 15), person('목검을 가르친 형', true), yes('woodSwordOlderMet')],
    weight: 12, repeat: 'once', speaker: { relation: '목검을 가르친 형' }, title: '돌아온 목검',
    body: '몇 해 전 목검을 들고 찾아왔던 {swordElder}이(가) 다시 마을 길에 나타났다. 이제 {name}의 키가 그때보다 훨씬 자랐다. {swordElder}은(는) 예전처럼 한 자루를 건넨다.',
    doors: [
      { label: '이번에는 먼저 목검을 맞댄다', hint: '예전보다 오래 버틴다', values: { ambition: D }, fx: [{ op: 'mastery', branch: 'sword', add: 10 }, { op: 'personChange', relation: '목검을 가르친 형', bond: 7 }, { op: 'log', text: '{swordElder}은(는) 마지막에 목검을 내리며 오늘은 자신도 한 수 배웠다고 했다.', weight: 'heavy' }] },
      { label: '형이 먼저 발을 움직일 때까지 기다린다', hint: '그때 알아챈 버릇이 아직 남아 있다', values: { inquiry: D }, fx: [{ op: 'mastery', branch: 'observation', add: 8 }, { op: 'log', text: '{swordElder}의 발이 먼저 움직였다. {name}이(가) 몸을 비키자 형은 예전의 그 버릇을 기억하고 있었느냐며 웃었다.', weight: 'heavy' }] },
      { label: '목검을 내려놓고 서로의 지난 일을 듣는다', hint: '승부 없이도 자란 만큼을 알 수 있다', values: { peace: D }, fx: [{ op: 'personChange', relation: '목검을 가르친 형', bond: 10 }, { op: 'log', text: '{swordElder}와(과) 마을 길을 걸으며 서로가 떠올린 길과 지나온 계절을 이야기했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_wooden_sword_mentor', kind: 'door', when: [...kid(6, 14), person('스승', true)],
    weight: 9, repeat: 'once', speaker: { relation: '스승' }, title: '스승의 목검',
    body: '{mentor}이(가) 닳은 목검 두 자루를 들고 왔다. 한 자루를 {name}에게 건네며 오늘 어디부터 배울지 묻는다.',
    doors: [
      { label: '넘어져도 다시 자세를 잡는다', hint: '손바닥에 물집이 잡힌다', values: { ambition: D }, mark: 'unyielding', fx: [trained('woodSwordTrained'), { op: 'mastery', branch: 'sword', add: 10 }, { op: 'personChange', relation: '스승', bond: 5 }, { op: 'log', text: '{mentor}은(는) 마지막 겨룸에서야 목검을 거두었다. 내일은 발을 먼저 보라고 했다.', weight: 'light' }] },
      { label: '스승의 디딤발을 살핀다', hint: '칼보다 먼저 움직이는 발을 본다', values: { inquiry: D }, fx: [trained('woodSwordObserved'), { op: 'mastery', branch: 'observation', add: 7 }, { op: 'log', text: '{mentor}의 왼발이 움직일 때 몸을 비켰다. 스승은 처음으로 목검 끝을 낮췄다.', weight: 'light' }] },
      { label: '목검을 내려놓고 스승의 옛 이야기를 듣는다', hint: '스승이 칼을 든 까닭을 듣는다', values: { peace: D }, fx: [trained('woodSwordTalked'), { op: 'personChange', relation: '스승', bond: 8 }, { op: 'log', text: '{mentor}은(는) 목검을 무릎에 올려놓고 처음 자신을 가르친 사람의 이야기를 들려주었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wooden_sword_sibling', kind: 'door', when: [...kid(6, 14), person('스승', false), sibling],
    needs: ['sibling'], weight: 9, repeat: 'once', speaker: 'hero', title: '형제의 목검',
    body: '{sibling}이(가) 목검 두 자루를 들고 왔다. 늘 하던 겨룸과 달리 이번에는 누가 먼저 상대의 어깨를 건드리는지 겨루자고 한다.',
    doors: [
      { label: '질 때마다 다시 덤빈다', hint: '손에 물집이 생긴다', values: { ambition: D }, fx: [trained('woodSwordTrained'), { op: 'mastery', branch: 'sword', add: 10 }, { op: 'log', text: '{sibling}은(는) 해가 질 때까지 {name}의 다음 공격을 기다렸다. 마지막에는 둘 다 목검을 제대로 쥐기 어려웠다.', weight: 'light' }] },
      { label: '형제의 발버릇을 읽는다', hint: '다음 겨룸에서 쓸 틈을 찾는다', values: { inquiry: D }, fx: [trained('woodSwordObserved'), { op: 'mastery', branch: 'observation', add: 6 }, { op: 'log', text: '{sibling}이(가) 내리치기 전에 오른발을 고쳐 딛는 것을 알아챘다. 다음에는 먼저 그 자리를 비웠다.', weight: 'light' }] },
      { label: '승부를 멈추고 서로의 자세를 고쳐 준다', hint: '둘 다 한 가지씩 배운다', values: { loyalty: D }, fx: [trained('woodSwordTogether'), { op: 'log', text: '{sibling}와(과) 목검을 바꿔 쥐고 서로의 자세를 따라 했다. 겨룸이 끝나자 둘 다 처음보다 곧게 섰다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wooden_sword_rival', kind: 'door', when: [...kid(6, 14), person('스승', false), noSibling, person('어릴 적 맞수', true)],
    weight: 9, repeat: 'once', speaker: { relation: '어릴 적 맞수' }, title: '맞수의 목검',
    body: '{rival}이(가) 목검 두 자루를 들고 왔다. 지난번 길목에서 겨룬 뒤 오늘은 목검으로 결판을 내자며, 손잡이가 더 닳은 쪽을 {name}에게 건넨다.',
    doors: [
      { label: '넘어져도 다시 덤빈다', hint: '끝내 한 번은 목검을 맞댄다', values: { ambition: D }, mark: 'unyielding', fx: [trained('woodSwordTrained'), { op: 'mastery', branch: 'sword', add: 10 }, { op: 'personChange', relation: '어릴 적 맞수', bond: 5 }, { op: 'log', text: '{rival}은(는) 돌아서려다 {name}이(가) 다시 목검을 들자 자세를 고쳐 잡았다. 둘은 마지막으로 한 번 더 맞붙었다.', weight: 'light' }] },
      { label: '맞수의 디딤발을 살핀다', hint: '다음에는 먼저 움직일 수 있다', values: { inquiry: D }, fx: [trained('woodSwordObserved'), { op: 'mastery', branch: 'observation', add: 7 }, { op: 'log', text: '{rival}이(가) 내리치기 전 왼발을 고쳐 딛는 것을 알아챘다. 다음 겨룸에서는 그 순간 먼저 몸을 비켰다.', weight: 'light' }] },
      { label: '목검을 내려놓고 함께 축제 장비를 고친다', hint: '오늘의 승부는 미룬다', values: { peace: D }, fx: [trained('woodSwordTogether'), { op: 'personChange', relation: '어릴 적 맞수', bond: 8 }, { op: 'log', text: '{rival}와(과) 목검 대신 부러진 깃대를 붙잡았다. 둘은 승부를 축제 날로 미루기로 했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wooden_sword_friend', kind: 'door', when: [...kid(6, 14), person('스승', false), noSibling, person('어릴 적 맞수', false), person('어릴 적 동무', true)],
    weight: 9, repeat: 'once', speaker: { relation: '어릴 적 동무' }, title: '동무의 목검',
    body: '작은 배를 함께 만들던 {friend}이(가) 목검 두 자루를 가져왔다. 이번에는 물길 대신 서로의 발놀림을 겨뤄 보자고 한다.',
    doors: [
      { label: '해가 질 때까지 겨룬다', hint: '두 사람 모두 멍투성이가 된다', values: { ambition: D }, fx: [trained('woodSwordTrained'), { op: 'mastery', branch: 'sword', add: 9 }, { op: 'log', text: '{friend}와(과) 번갈아 넘어지고 일어섰다. 목검을 내려놓을 때는 둘 다 어제보다 발을 잘 디뎠다.', weight: 'light' }] },
      { label: '동무의 움직임을 관찰한다', hint: '같이 연습할 방법을 찾는다', values: { inquiry: D }, fx: [trained('woodSwordObserved'), { op: 'mastery', branch: 'observation', add: 5 }, { op: 'log', text: '{friend}에게 발을 고쳐 딛는 때를 알려 주자 동무도 {name}의 빈틈 하나를 짚어 주었다.', weight: 'light' }] },
      { label: '목검을 내려놓고 다시 작은 배를 만든다', hint: '겨룸은 다른 날로 미룬다', values: { peace: D }, fx: [trained('woodSwordTogether'), { op: 'personChange', relation: '어릴 적 동무', bond: 6 }, { op: 'log', text: '{friend}와(과) 목검을 배의 돛대로 쓸 수 있을지 장난치다가, 결국 함께 새 돛대를 깎았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_wooden_sword_new_friend', kind: 'door', when: [...kid(6, 14), person('스승', false), noSibling,
      person('어릴 적 맞수', false), person('어릴 적 동무', false), person('어릴 적 친구', true)],
    weight: 9, repeat: 'once', speaker: { relation: '어릴 적 친구' }, title: '친구의 목검',
    body: '길목에서 먼저 손을 내밀었던 {childFriend}이(가) 목검 두 자루를 가져왔다. 축제 때 같은 편으로 설 수 있을지 같이 연습해 보자고 한다.',
    doors: [
      { label: '상대가 되어 끝까지 겨룬다', hint: '친구가 서툰 자세를 고쳐 준다', values: { ambition: D }, fx: [trained('woodSwordTrained'), { op: 'mastery', branch: 'sword', add: 9 }, { op: 'log', text: '{childFriend}와(과) 번갈아 넘어지며 서로의 빈틈을 짚었다. 마지막에는 승부 대신 다음 연습 날을 잡았다.', weight: 'light' }] },
      { label: '친구의 발놀림을 보고 따라 한다', hint: '같이 움직이는 방법을 찾는다', values: { inquiry: D }, fx: [trained('woodSwordObserved'), { op: 'mastery', branch: 'observation', add: 6 }, { op: 'log', text: '{childFriend}이(가) 내민 목검의 방향을 읽고 몸을 비켰다. 친구는 웃으며 이번에는 자기 차례라고 했다.', weight: 'light' }] },
      { label: '축제에 쓸 장비부터 함께 만든다', hint: '개인 연습은 줄지만 같은 편이 된다', values: { loyalty: D }, fx: [trained('woodSwordTogether'), { op: 'personChange', relation: '어릴 적 친구', bond: 8 }, { op: 'log', text: '{childFriend}와(과) 목검을 내려놓고 깃대를 손봤다. 둘은 축제 날 같은 편에서 장비를 나르기로 했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'kid_rival_friend_festival', kind: 'door', when: [...kid(9, 13), person('어릴 적 친구', true)],
    weight: 12, repeat: 'once', speaker: { relation: '어릴 적 친구' }, title: '같은 편의 축제',
    body: '길목에서 싸우는 대신 손을 잡았던 {childFriend}이(가) 축제 준비를 도와 달라고 찾아왔다. 경기 팀이 갈라져도 둘은 여전히 친구다. 깃발은 찢어졌고, 등불을 밝힐 시간은 다가온다.',
    doors: [
      { label: '서로 다른 팀의 깃발을 고친다', hint: '경기에서는 겨뤄도 준비는 함께한다', values: { justice: D }, fx: [{ op: 'personChange', relation: '어릴 적 친구', bond: 7 }, { op: 'log', text: '{childFriend}와(과) 서로의 깃발을 번갈아 꿰맸다. 경기 때는 각자 다른 색을 들었지만 해 질 무렵엔 다시 같은 자리에 앉았다.', weight: 'heavy' }] },
      { label: '경기를 포기하고 함께 등불을 켠다', hint: '우승 기회는 없지만 늦은 길손을 맞는다', values: { loyalty: D }, fx: [{ op: 'personChange', relation: '어릴 적 친구', bond: 10 }, { op: 'log', text: '{childFriend}와(과) 등불을 하나씩 밝히자 늦게 온 주민들이 길을 찾았다. 둘은 경기장의 함성을 멀리서 들었다.', weight: 'heavy' }] },
      { label: '각자 맡은 경기를 마치고 다시 만난다', hint: '해가 지기 전까지 서로 볼 수 없다', values: { freedom: D }, fx: [{ op: 'log', text: '서로 다른 경기를 마친 뒤 {childFriend}와(과) 꺼진 등불 아래서 다시 만났다. 각자의 하루를 들려주느라 집에 돌아갈 때가 늦었다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_rival_festival_prepare', kind: 'door', when: [...kid(9, 12), person('어릴 적 맞수', true), no('rivalFestivalPrepared')],
    weight: 12, repeat: 'once', speaker: { relation: '어릴 적 맞수' }, title: '축제의 빈 깃대',
    body: '마을 축제를 앞두고 경기 깃발이 사라졌다. {rival}은(는) 길목에서 {name}을(를) 기다리며, 깃발 없이는 결승도 없다고 말한다. 낡은 깃대에는 처음 보는 항로 표식이 남아 있다.',
    doors: [
      { label: '{rival}와(과) 함께 깃발을 찾는다', hint: '서로의 버릇을 알게 되지만 연습할 시간은 줄어든다', values: { loyalty: D }, fx: [trained('rivalFestivalPrepared'), trained('rivalSearched'), { op: 'personChange', relation: '어릴 적 맞수', bond: 8 }, { op: 'log', text: '{rival}와(과) 골목을 나눠 살피다 헛간에서 깃발을 찾았다. 돌아오는 길에는 서로 어느 쪽으로 먼저 뛰는지까지 알게 되었다.', weight: 'heavy' }] },
      { label: '주민을 모아 새 깃발을 만든다', hint: '경기 준비가 늦어지지만 축제는 열 수 있다', values: { justice: D }, fx: [trained('rivalFestivalPrepared'), trained('rivalMadeFlag'), { op: 'log', text: '{rival}도 말없이 새 천을 붙잡았다. 주민들이 한 땀씩 꿰매자 날이 어두워지기 전에 깃발이 다시 섰다.', weight: 'heavy' }] },
      { label: '깃대의 항로 표식을 조사한다', hint: '승부 준비는 {rival}에게 맡긴다', values: { inquiry: D }, fx: [trained('rivalFestivalPrepared'), trained('rivalMapClue'), { op: 'log', text: '깃대 속에 말린 낡은 지도의 끝을 찾았다. {rival}은(는) 연습을 대신 맡아 주었지만 축제가 끝나면 반드시 보여 달라고 했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_rival_festival_day', kind: 'door', when: [...kid(10, 13), person('어릴 적 맞수', true), yes('rivalFestivalPrepared')],
    weight: 12, repeat: 'once', speaker: { relation: '어릴 적 맞수' }, title: '꺼진 축제 등불',
    body: '{rivalPrepareMemory} {rival}와(과) 결승을 앞두고 축제 등불이 잘못 켜진다. 주민 하나가 길을 잃은 어린아이를 찾는다. 경기는 곧 시작하고, 수색에 나서면 우승 기회는 사라진다.',
    doors: [
      { label: '경기에 남아 {rival}와(과) 끝까지 겨룬다', hint: '승패는 정해지지만 수색의 첫 시간을 놓친다', values: { ambition: D }, fx: [trained('rivalFestivalDay'), trained('rivalChoseMatch'), { op: 'mastery', branch: 'sword', add: 8 }, { op: 'log', text: '{rival}와(과) 마지막까지 겨뤘다. 승부가 끝난 뒤 둘은 곧장 수색에 합류했고, 늦게 움직인 만큼 더 먼 길을 돌아야 했다.', weight: 'heavy' }] },
      { label: '{rival}와(과) 경기장을 나와 아이를 찾는다', hint: '결승은 포기하고 함께 길을 찾는다', values: { loyalty: D }, fx: [trained('rivalFestivalDay'), trained('rivalChoseRescue'), { op: 'personChange', relation: '어릴 적 맞수', bond: 10 }, { op: 'log', text: '{rival}와(과) 서로 다른 길을 살피다가 꺼진 등불 아래 웅크린 아이를 찾아냈다. 돌아왔을 때 결승은 끝나 있었다.', weight: 'heavy' }] },
      { label: '주민을 나눠 보내고 등불을 바로잡는다', hint: '직접 결승에는 나서지 못한다', values: { justice: D }, fx: [trained('rivalFestivalDay'), trained('rivalChoseLead'), { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '주민이 길을 나눠 찾는 사이 {name}은(는) 등불의 방향을 고쳤다. 아이가 돌아오자 {rival}은(는) 결승을 다음으로 미루자고 했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'kid_rival_farewell', kind: 'door', when: [...kid(12, 15), person('어릴 적 맞수', true), yes('rivalFestivalDay')],
    weight: 12, repeat: 'once', speaker: { relation: '어릴 적 맞수' }, title: '마지막 겨룸',
    body: '{rival}이(가) 내일 다른 길로 떠난다고 한다. {rivalFestivalMemory} 손에는 그때의 닳은 목검 두 자루가 있다.',
    doors: [
      { label: '해 질 때까지 다시 겨룬다', hint: '누가 이겨도 다음 만남을 약속한다', values: { ambition: D }, fx: [trained('rivalFarewellDuel'), { op: 'mastery', branch: 'sword', add: 10 }, { op: 'personChange', relation: '어릴 적 맞수', bond: 7 }, { op: 'log', text: '{rival}와(과) 해가 질 때까지 목검을 맞댔다. 승부가 끝나자 둘은 다음번에는 서로가 걸어온 길까지 겨루자고 약속했다.', weight: 'heavy' }, { op: 'timeline', text: '{rival}와(과) 마지막으로 겨루고 재회를 약속했다' }] },
      { label: '축제에서 못 끝낸 이야기를 나눈다', hint: '승부는 남겨 두고 떠나는 이유를 듣는다', values: { inquiry: D }, fx: [trained('rivalFarewellTalk'), { op: 'personChange', relation: '어릴 적 맞수', bond: 10 }, { op: 'log', text: '{rival}은(는) 다른 길을 택한 까닭을 털어놓았다. 둘은 같은 바다를 봐도 같은 길로 갈 필요는 없다고 했다.', weight: 'heavy' }, { op: 'timeline', text: '{rival}와(과) 서로 다른 길을 가기로 했다' }] },
      { label: '닳은 목검 하나를 나눠 갖는다', hint: '다음 만남의 표식이 된다', values: { romance: D }, fx: [trained('rivalFarewellSword'), { op: 'personChange', relation: '어릴 적 맞수', bond: 8 }, { op: 'log', text: '{rival}와(과) 목검을 하나씩 나눠 들었다. 떠나는 길목에서 두 사람은 손잡이의 같은 흠집을 확인했다.', weight: 'heavy' }, { op: 'timeline', text: '{rival}와(과) 목검을 나눠 들고 헤어졌다' }] },
    ],
  },
];
