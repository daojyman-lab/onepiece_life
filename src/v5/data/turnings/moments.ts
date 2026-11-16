// 큰 계기 (설계 5.2a). 인생을 뒤흔드는 일이 지나간 뒤, 그 일을 어떻게 받아들일지 고른다.
// 불행 · 신체 손실 · 싸움이 id로 줄에 세운다. 가중치 0: 줄을 서야만 오고, 보통 때 저절로 뽑히지 않는다.
// 문마다 다른 가치관 하나를 V.value.door만큼 적는다 (큰 계기는 엔진이 V.value.moment 배로 키운다).
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import type { Turning } from '../../core/types';

const D = V.value.door;
const moment = (id: string, x: Pick<Turning, 'title' | 'body' | 'doors'>): Turning =>
  ({ id, kind: 'moment', when: [], weight: 0, repeat: { years: 1 }, speaker: 'hero', ...x });

export const MOMENTS: Turning[] = [
  moment('moment_limb', {
    title: '잃어버린 몸', body: '{name}은(는) 붕대에 감긴 자리를 오래 내려다본다. 예전처럼 움직이지 않는 몸으로 내일을 맞아야 한다.',
    doors: [
      { label: '남은 몸으로 다시 일어선다', hint: '처음부터 다시 단련한다. 전보다 더 독하게', values: { ambition: D }, mark: 'unyielding', fx: [] },
      { label: '이 몸을 만든 자에게 갚아 준다', hint: '잃은 만큼 되갚기 전에는 멈추지 않는다', values: { dominion: D }, fx: [] },
      { label: '바다를 떠나 뭍에 자리를 잡는다', hint: '싸움 대신 다른 일로 남은 날을 산다', values: { peace: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'log', text: '바다를 등지고 {island}에 눌러앉았다.', weight: 'heavy' }] },
    ],
  }),
  moment('moment_loss', {
    title: '남겨진 사람', body: '아끼던 사람이 더는 곁에 없다. 텅 빈 자리를 바라보며 {name}은(는) 한참을 움직이지 못한다.',
    doors: [
      { label: '남은 사람들을 끝까지 지킨다', hint: '다시는 누구도 잃지 않겠다고 다짐한다', values: { loyalty: D }, mark: 'fellowship', fx: [] },
      { label: '그 사람이 꿈꾸던 곳으로 떠난다', hint: '못다 한 길을 대신 걷는다', values: { romance: D }, fx: [] },
      { label: '이렇게 만든 세상을 바로잡는다', hint: '같은 일이 다시 없도록 맞서기로 한다', values: { justice: D }, fx: [] },
    ],
  }),
  moment('moment_defeat', {
    title: '바닥에 쓰러진 날', body: '온 힘을 다했지만 상대에게 닿지도 못했다. 흙바닥에 엎드린 {name}의 귀에 비웃음이 남는다.',
    doors: [
      { label: '더 강해져서 다시 찾아간다', hint: '이 패배를 잊지 않는다', values: { ambition: D }, mark: 'unyielding', fx: [] },
      { label: '왜 졌는지 처음부터 되짚는다', hint: '힘보다 앎이 모자랐다고 여긴다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '싸움에서 한 걸음 물러선다', hint: '이기고 지는 것이 다가 아니라고 받아들인다', values: { peace: D }, fx: [] },
    ],
  }),
  moment('moment_saved', {
    title: '내밀어진 손', body: '모든 것이 끝났다고 여긴 순간, 이름도 모르는 누군가가 {name}을(를) 끌어올렸다. 그는 대가를 묻지 않았다.',
    doors: [
      { label: '그 은혜를 평생 갚는다', hint: '그 사람의 뒤를 따르기로 한다', values: { loyalty: D }, fx: [] },
      { label: '받은 만큼 다른 이에게 베푼다', hint: '언젠가 누군가에게 같은 손을 내민다', values: { justice: D }, fx: [] },
      { label: '고맙다는 말만 남기고 길을 떠난다', hint: '누구에게도 매이지 않는다', values: { freedom: D }, fx: [] },
    ],
  }),
  moment('moment_betrayed', {
    title: '등 뒤의 칼', body: '가장 믿었던 이가 등을 돌렸다. {name}은(는) 함께 웃던 날들을 하나씩 떠올리며 이를 악문다.',
    doors: [
      { label: '배신자를 끝까지 쫓는다', hint: '빚은 반드시 받아 낸다', values: { dominion: D }, fx: [] },
      { label: '그래도 남은 동료를 믿는다', hint: '한 사람 때문에 모두를 버리지 않는다', needs: ['crew'], values: { loyalty: D }, mark: 'fellowship', fx: [] },
      { label: '누구에게도 기대지 않고 홀로 선다', hint: '앞으로는 혼자 길을 정한다', values: { freedom: D }, fx: [] },
    ],
  }),
  moment('moment_ruin', {
    title: '무너진 집안', body: '대대로 지켜 온 집이 남의 손에 넘어갔다. 빈손이 된 {name}은(는) {town}의 거리를 말없이 걷는다.',
    doors: [
      { label: '빼앗긴 것을 모두 되찾는다', hint: '몇 해가 걸려도 집안을 다시 일으킨다', values: { ambition: D }, fx: [] },
      { label: '집안을 무너뜨린 진실을 캐낸다', hint: '누가 어떻게 꾸몄는지 밝혀낸다', values: { inquiry: D }, fx: [] },
      { label: '가진 것 없이 바다로 나간다', hint: '잃을 것이 없으니 어디든 갈 수 있다', values: { romance: D }, fx: [] },
    ],
  }),

  // ---------------------------------------------------------------- 과제 11
  moment('moment_child', {
    title: '먼저 간 아이', body: '{name}은(는) 먼저 간 아이가 쓰던 방의 문을 오래 열지 못한다. 순서가 바뀌었다. 바다가 무엇을 가져갔는지, 아직 실감이 나지 않는다.',
    doors: [
      { label: '그 아이가 가려던 바다로 대신 나간다', hint: '못다 한 항해를 잇는다', values: { romance: D }, fx: [] },
      { label: '남은 식구와 아이들 곁을 떠나지 않는다', hint: '다시는 아무도 혼자 바다에 보내지 않는다', values: { loyalty: D }, mark: 'fellowship', fx: [] },
      { label: '그 아이를 삼킨 바다의 일을 끝까지 캐묻는다', hint: '그날 무슨 일이 있었는지 알아낸다', values: { inquiry: D }, fx: [] },
    ],
  }),
  moment('moment_demoted', {
    title: '외딴 초소', body: '바람만 부는 초소에서 {name}은(는) 떨어진 계급장을 손바닥에 올려놓는다. 덮어쓴 죄는 끝내 벗겨지지 않았다.',
    doors: [
      { label: '여기서부터 다시 올라간다', hint: '누구보다 먼저 일어나 누구보다 늦게 잔다', values: { ambition: D }, mark: 'unyielding', fx: [] },
      { label: '죄를 씌운 윗선을 끝까지 밝힌다', hint: '제복 안의 썩은 곳을 들춘다', values: { justice: D }, mark: 'rebel', fx: [] },
      { label: '초소의 사람들과 조용히 산다', hint: '자리를 다투는 일에서 물러난다', values: { peace: D }, fx: [] },
    ],
  }),
];
