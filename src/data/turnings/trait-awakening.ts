import type { Branch, Turning } from '../../core/types';

export const TRAIT_AWAKENINGS: Turning[] = (['observation', 'armament', 'conqueror'] as Branch[]).map(branch => {
  const names = { observation: '눈을 감고 듣는 기척', armament: '물러서지 않는 손바닥', conqueror: '쓰러진 이들 앞에서' };
  const bodies = {
    observation: '스승이 천으로 눈을 가리게 했다. 발자국을 외우는 대신, 움직이기 직전의 기척을 붙잡아 보라고 한다. 여러 해 반복한 연습이 손끝까지 닿는다.',
    armament: '타격을 흘리던 스승이 이번에는 손바닥으로 받아 보라고 했다. 몸에 힘만 주면 아프다. 여러 해 배운 호흡을 다시 가다듬는다.',
    conqueror: '돌아온 길에는 함께 버텼던 사람들의 상처가 남았다. 또다시 누군가를 앞세울 수는 없었다. 한 발 앞으로 나서자 마주 선 자들이 숨을 삼킨다.',
  };
  return {
    id: `trait_awaken_${branch}`, kind: 'door', when: [], weight: 0, repeat: { years: 1 }, max: 2, speaker: 'hero',
    title: names[branch as keyof typeof names], body: bodies[branch as keyof typeof bodies],
    doors: [
      { label: '배운 감각을 끝까지 붙잡는다', hint: branch === 'conqueror' ? '왕의 자질을 몸 밖으로 드러낸다' : '입문 성공률은 보통 사 할, 패기 재능이 있으면 육 할 오 푼이다',
        fx: [{ op: 'traitAwaken', branch }, { op: 'log', text: '숨을 고르고 몸 안의 감각을 밖으로 내보냈다.', weight: 'light' }] },
      { label: '지금은 몸을 추스른다', hint: '이 갈래의 발현 시도는 여기서 마친다', fx: [{ op: 'flag', id: `trait_awaken_declined_${branch}` }, { op: 'log', text: '무리하지 않고 감각을 가라앉혔다.', weight: 'light' }] },
    ],
  };
});

TRAIT_AWAKENINGS.push({
  id: 'trait_market_meal', kind: 'door',
  when: [{ c: 'age', min: 6 }, { c: 'standing', is: ['child', 'civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'retired'] }, { c: 'island', is: ['로그타운', '워터 세븐', '알라바스타 왕국', '하나노미야코', '쿠리', '어인가', '류구 왕국', '엔젤섬', '샨디아 마을', '조우', '쿠라우 도시', '고래숲'] }],
  weight: 2, repeat: { years: 3 }, speaker: 'hero',
  title: '시장의 늦은 식사', body: '{island} 시장의 가게에서 따뜻한 밥 냄새가 난다. 그릇을 비우면 주인이 한 번 더 담아 준다고 한다. 오늘은 발길을 멈추고 배를 채워도 좋겠다.',
  doors: [
    { label: '든든히 먹고 한 그릇 더 청한다', hint: '밥값을 치르고 기운을 되찾는다', meal: true, fx: [{ op: 'money', add: -500, trade: true }, { op: 'hp', add: 12 }, { op: 'log', text: '빈 그릇을 내밀자 따뜻한 밥이 한 번 더 올라왔다.', weight: 'light' }] },
    { label: '집에 돌아가 먹는다', hint: '주머니를 아낀다', fx: [{ op: 'log', text: '밥 냄새를 뒤로하고 익숙한 길을 따라 돌아갔다.', weight: 'light' }] },
  ],
});
