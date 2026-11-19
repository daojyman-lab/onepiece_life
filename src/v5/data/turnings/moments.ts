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
    title: '그날 저녁의 식탁', body: '그날 일을 겪은 사람들이 한 상에 둘러앉았다. 국은 식었고 누구도 먼저 숟가락을 들지 않는다. 맞은편에 앉은 이가 {name}에게 오늘 밤 묵을 만한 곳을 아는지 묻는다.',
    doors: [
      { label: '잘 곳을 구한 사람부터 손을 들어 보라고 한다', hint: '묵을 곳이 없는 사람과 함께 잠자리를 알아본다', values: { loyalty: D }, mark: 'fellowship', fx: [] },
      { label: '식탁 한쪽을 비우고 지도를 펼친다', hint: '맞은편 사람이 가 보고 싶어 하던 곳을 짚으며 내일 함께 떠나자고 제안한다', values: { romance: D }, fx: [] },
      { label: '그날 각자 본 일을 한 장에 받아 적는다', hint: '전해 들은 소문은 빼고 각자가 직접 본 일만 남긴다', values: { justice: D }, fx: [] },
    ],
  }),
  moment('moment_defeat', {
    title: '바닥에 쓰러진 날', body: '온 힘을 다했지만 상대에게 닿지도 못했다. 흙바닥에 엎드린 {name}의 귀에 비웃음이 남는다.',
    doors: [
      { label: '흙 묻은 무릎을 털고 다시 일어선다', hint: '다음에 다시 겨루자고 청한다', values: { ambition: D }, mark: 'unyielding', fx: [] },
      { label: '눈을 감고 넘어지기 직전의 소리를 떠올린다', hint: '오늘 패배를 곱씹자 놓친 소리 하나가 떠오른다. 등 뒤에서 모래가 밟히던 소리다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '다시 덤비라는 말에 손바닥의 흙부터 턴다', hint: '비웃음이 들려도 돌아보지 않고 자리를 뜬다', values: { peace: D }, fx: [] },
    ],
  }),
  moment('moment_saved', {
    title: '내밀어진 손', body: '모든 것이 끝났다고 여긴 순간, 이름도 모르는 누군가가 {name}을(를) 끌어올렸다. 그는 대가를 묻지 않았다.',
    doors: [
      { label: '돌아서려는 사람을 불러 세워 이름을 묻는다', hint: '나중에 보답할 수 있도록 어디로 찾아가면 되는지도 묻는다', values: { loyalty: D }, fx: [] },
      { label: '일어서자마자 뒤에 남은 사람이 있는지 살핀다', hint: '도움이 필요한 사람을 큰 소리로 부르고 대답을 기다린다', values: { justice: D }, fx: [] },
      { label: '고맙다는 말만 남기고 길을 떠난다', hint: '혼자 걸을 수 있을 때까지 곁에 있어 준 사람에게 인사한다', values: { freedom: D }, fx: [] },
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
      { label: '근무표의 첫 당번 칸에 제 이름을 적는다', hint: '아침 점호 때 인원을 세는 일부터 맡는다', values: { ambition: D }, mark: 'unyielding', fx: [] },
      { label: '그날 받은 명령서와 징계 통지서를 나란히 편다', hint: '명령을 내린 사람과 책임자로 적힌 사람의 이름에 각각 밑줄을 긋는다', values: { justice: D }, mark: 'rebel', fx: [] },
      { label: '계급장을 서랍에 넣고 식사 당번 옆에 앉는다', hint: '식사 당번이 건넨 소쿠리에 양파를 까 담는다', values: { peace: D }, fx: [] },
    ],
  }),
];
