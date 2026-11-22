import { V } from './balance';

export interface WorldClock { age: number; part: number; prime?: { lap?: boolean } | null }
export const canonYear = (age: number): number => V.canon.startYear + age - V.canon.heroAge;

/** 전성기의 두 번째 바퀴는 같은 해에 머문다. 그해 이미 일어난 역사를 되감지 않는다. */
export const worldTick = (clock: WorldClock): number => clock.age * V.partsPerYear + (clock.prime?.lap ? V.partsPerYear - 1 : clock.part);

// 나이는 6.2 기획서의 게임 시간표다. 같은 해 안에서 기사의 선후를 가르기 위해 네 토막을 쓴다.
interface Dispatch { age: number; part: number; kind: 'big' | 'world' | 'local' | 'bounty'; title: string; body: string }
export const WORLD_HISTORY = {
  dressrosaCoup: { age: 11, part: 2, kind: 'world', title: '드레스로자 왕좌에 돈키호테 도플라밍고',
    body: '드레스로자에서 왕이 바뀌었다. 항구로 들어가는 화물선들은 새 왕실 인장이 찍힌 입항 허가서를 받고 있다. 리쿠 왕이 그날 밤 무슨 일을 겪었는지는 지면에 실리지 않았다.' },
  alabastaDrought: { age: 14, part: 3, kind: 'local', title: '알라바스타 항구, 곡물 대신 식수를 주문',
    body: '나노하나에 들어온 상선들이 빈 물통을 싣고 이웃 섬으로 돌아갔다. 내륙에 비가 끊기면서 낙타 한 마리가 하루에 몇 통을 나를 수 있는지부터 따져야 한다고 상인들은 전했다.' },
  strawHatPoster: { age: 17, part: 0, kind: 'bounty', title: '밀짚모자 루피, 첫 수배액 삼천만 베리',
    body: '이스트 블루 해군 지부가 몽키 D. 루피의 수배서를 배포했다. 기사보다 사진이 먼저 눈에 들어온다. 밀짚모자를 쓴 소년이 이를 활짝 드러내고 웃고 있다. 첫 수배액은 30,000,000 베리.' },
  loguetownStorm: { age: 17, part: 1, kind: 'local', title: '로그타운 처형대에 낙뢰, 항구는 폭풍 속',
    body: '번개가 처형대를 때리자 광장이 순식간에 비었다. 뒤이어 불어온 돌풍에 항구로 향한 해군의 추격 대열도 흩어졌다. 상점 주인들은 셔터를 다시 달았고 부두에서는 끊어진 계류줄부터 갈았다.' },
  alabastaRain: { age: 17, part: 3, kind: 'big', title: '알라바스타에 비가 돌아왔다',
    body: '알루바나에서 날아온 사진에는 하늘을 올려다보는 두 군대가 담겼다. 싸움이 멎고 말랐던 수로에 물이 들기 시작했다. 해군은 크로커다일의 칠무해 칭호를 박탈하고 그를 체포했다고 발표했다. 해군이 공을 돌린 사람은 스모커 대령이다.' },
  skyBell: { age: 18, part: 0, kind: 'local', title: '자야 앞바다, 구름 위에서 들려온 종',
    body: '낮 조업을 나간 배 세 척이 닻을 내리고 같은 소리를 들었다. “배 밑도 곶에 있는 등대 쪽도 아니었소.” 어부는 하늘을 가리켰다. 소리의 근원은 청해 통신원이 끝내 확인하지 못했다.' },
  eniesLobby: { age: 18, part: 2, kind: 'big', title: '에니에스 로비 포격, 밀짚모자 일당 수배서 교체',
    body: '세계정부의 사법 섬에서 포격이 끝났다. 해군이 배포한 새 수배서에는 삼억 베리의 밀짚모자와 동료들의 얼굴이 나란히 실렸다. 워터 세븐 역에서는 섬으로 갈 짐을 싣던 사람들이 운행 공지를 기다리고 있다.' },
  sabaodyIncident: { age: 18, part: 3, kind: 'world', title: '천룡인 피격, 샤본디에 해군 대장 출동',
    body: '샤본디 경매장 주변의 출입이 통제됐다. 군함이 정박지를 채우자 코팅을 마친 배들도 돛을 올리지 못했다. 현장 통신은 밀짚모자 일당의 행방을 확인하지 못했다고 전했다.' },
  marineford: { age: 19, part: 2, kind: 'big', title: '마린포드 종전, 에이스와 흰수염 사망',
    body: '해군 본부에서 포성이 멎었다. 포트거스 D. 에이스와 에드워드 뉴게이트의 사망이 확인됐다. 흰수염의 깃발을 달던 섬들은 다음 보급선이 무사히 들어올지 항구에 사람을 보내고 있다.' },
  punkDuel: { age: 20, part: 1, kind: 'world', title: '해군 새 원수에 사카즈키, 쿠잔은 해군을 떠나다',
    body: '원수 자리를 두고 벌인 두 대장의 열흘 결투가 끝났다. 펑크 해저드 근해를 지난 배들은 한쪽 수평선에서는 불길이, 반대쪽에서는 얼음 안개가 보인다고 전했다.' },
  fishmanPact: { age: 21, part: 0, kind: 'world', title: '어인섬에서 왕궁을 되찾았다는 소식',
    body: '류구 왕국은 신어인 해적단의 반란이 끝났다고 전했다. 피난 때 빈 거품 수레로 아이들을 실어 날랐던 주민들은 광장에서 헤어진 가족을 찾고 있다.' },
  dressrosaFree: { age: 21, part: 2, kind: 'big', title: '드레스로자의 새장 소멸, 도플라밍고 체포',
    body: '거리를 가르던 실이 사라지고 장난감이었던 사람들이 제 모습으로 돌아왔다. 항구에 임시 게시판이 섰다. 주민들은 조금 전까지 기억조차 못 했던 가족의 이름을 적어 붙이고 있다.' },
  wholeCake: { age: 21, part: 3, kind: 'big', title: '모르건즈의 특별판, 빅 맘의 다과회를 뒤흔든 밀짚모자',
    body: '모르건즈는 홀케이크 아일랜드에서 빠져나온 몽키 D. 루피를 두고 세계경제신문 1면에 “다섯 번째 황제”라는 제목을 뽑았다. 그 면을 펼치자 루피의 새 수배서가 떨어졌다. 사진 밑의 액수는 15억 베리다.' },
  reverie: { age: 22, part: 0, kind: 'world', title: '레벨리 결의, 왕하 칠무해 제도 폐지',
    body: '세계회의에 모인 왕들이 칠무해 제도의 폐지를 결의했다. 해군은 옛 칠무해들의 거점으로 함대를 보냈다. 어제까지 항구 검문을 통과시키던 정부의 공인장이 효력을 잃었다.' },
  wanoFree: { age: 22, part: 2, kind: 'big', title: '와노쿠니에서 두 사황이 패했다',
    body: '와노쿠니에서 카이도와 빅 맘이 패했다는 소식이 바다를 건넜다. 꽃의 도읍에서는 새 쇼군 모모노스케의 이름을 부르고 있다. 바깥 상선에 국경을 열겠다는 발표는 아직 없다.' },
  newEmperors: { age: 22, part: 3, kind: 'bounty', title: '새 사황의 얼굴, 밀짚모자와 천냥광대',
    body: '빨간 머리와 검은수염 곁에 밀짚모자 루피와 천냥광대 버기의 얼굴이 실렸다. 루피의 수배액은 30억 베리. 부두 게시판에는 새 사진을 붙일 자리가 모자라 옛 종이부터 한 장씩 떼었다.' },
  crossGuild: { age: 23, part: 0, kind: 'big', title: '해병 얼굴이 수배서에, 크로스 길드의 역수배',
    body: '천냥광대의 표식을 단 조직 크로스 길드가 해병들에게 현상금을 걸었다. 기사는 종이 두 장을 나란히 실었다. 왼쪽은 해군이 해적을 수배하는 공고, 오른쪽은 해적이 해병을 수배하는 전단이다.' },
} as const satisfies Record<string, Dispatch>;

export type WorldEventId = keyof typeof WORLD_HISTORY;
export const historyTick = (id: WorldEventId): number => worldTick(WORLD_HISTORY[id]);
export const hasWorldEvent = (clock: WorldClock, id: WorldEventId): boolean => worldTick(clock) >= historyTick(id);
export const ISSUE_AT = new Map((Object.keys(WORLD_HISTORY) as WorldEventId[]).map(id => [historyTick(id), id]));
