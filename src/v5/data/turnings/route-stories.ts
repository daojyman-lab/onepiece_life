import type { Fx, Turning } from '../../core/types';

const next = (turning: string): Fx => ({ op: 'queue', turning });
const flag = (id: string): Fx => ({ op: 'flag', id });
export const DEFERRED_ROUTE = 'route:deferred';

/** 첫 방문에 바로 제안한다. 후속 장면은 선택한 경우에만 대기열에 넣는다. */
export const ROUTE_ARRIVALS: Record<string, string> = {
  '셸스 타운': 'shells_ledger', '오렌지 마을': 'orange_sign', '시모츠키 마을': 'shimotsuki_dojo',
  '진귀한 동물의 섬': 'rare_tracks', '롱 링 롱 랜드': 'longring_tide',
  '스릴러 바크': 'bark_bell', '플로리안 트라이앵글': 'florian_bell',
  '쌍둥이 곶': 'cape_1', '리틀 가든': 'garden_1', '드럼 왕국': 'drum_1',
  '자야': 'route_sky', '샤본디 제도': 'route_coating', '드레스로자': 'route_zou',
};

const scenes: Pick<Turning, 'id' | 'title' | 'body' | 'doors'>[] = [
  {
    id: 'cape_1', title: '쌍둥이 곶 · 바위에 닿는 노랫소리',
    body: '등대 아래에서 거대한 고래가 울고 있다. 라분의 이마에는 오래된 상처가 겹쳐 있다. 등대지기 크로커스는 돌아오겠다는 사람들을 기다리는 고래라고 말한다. 부두의 수리공 네루는 파도에 떠밀린 배의 잔해가 라분의 먹이터로 흘러든다고 걱정한다.',
    doors: [
      { label: '네루와 함께 잔해를 치운다', hint: '고래가 다가오기 전에 줄을 묶어야 한다', fx: [flag('cape:net'), next('cape_2')] },
      { label: '크로커스에게 고래를 놀라게 하지 않는 법을 묻는다', hint: '기다리는 동안 무엇을 지킬지 듣는다', fx: [flag('cape:quiet'), next('cape_2')] },
      { label: '먼발치에서 울음소리만 듣는다', hint: '등대지기에게 길을 묻고 출항한다', fx: [{ op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'cape_2', title: '쌍둥이 곶 · 끊어진 밧줄',
    body: '날카로운 돛대 조각이 밧줄을 끊는다. 라분은 먹이터로 다가오고, 네루는 손을 놓지 못한다. 부유물을 밀어낼 배는 한 척뿐이다.',
    doors: [
      { label: '자기 배로 잔해를 끌어낸다', hint: '손과 어깨를 다쳐도 먹이터를 비운다', fx: [{ op: 'hp', add: -8 }, flag('cape:cleared'), next('cape_3')] },
      { label: '라분이 돌아갈 때까지 조용히 기다렸다가 줄을 다시 건다', hint: '서두르지 않고 작업을 마친다', when: [{ c: 'flag', id: 'cape:quiet', has: true }], fx: [flag('cape:cleared'), next('cape_3')] },
      { label: '네루를 먼저 물에서 끌어올린다', hint: '잔해 일부는 남지만 사람은 구한다', fx: [next('cape_3')] },
    ],
  },
  {
    id: 'cape_3', title: '쌍둥이 곶 · 돌아올 자리를 남기다',
    body: '네루가 젖은 장갑을 등대 난간에 넌다. 크로커스는 다음 배를 위해 정박 줄을 고쳐 묶는다. 라분의 약속을 대신 이뤄 줄 수는 없지만, 오늘 이곳에 남길 일은 있다.',
    doors: [
      { label: '먹이터에 표지를 남기고 네루와 작별한다', hint: '뒤따르는 배에도 잔해를 버리지 말라고 알린다', fx: [flag('cape:done'), { op: 'timeline', text: '쌍둥이 곶에서 라분의 먹이터와 돌아올 자리를 지켰다' }] },
      { label: '고래의 울음소리를 항해 일지에 적는다', hint: '약속을 기다리는 장소를 기억한다', fx: [flag('cape:done'), { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'garden_1', title: '리틀 가든 · 결투 바깥의 발자국',
    body: '원시림 사이로 두 개의 거대한 옛 야영지가 보인다. 결투의 흔적을 조사하던 식물 채집가 이토가 독충에 쏘여 쓰러졌다. 이토의 조수는 약초 표본과 귀환용 기록 지침을 서로 다른 계곡에 떨어뜨렸다.',
    doors: [
      { label: '약초 표본을 찾으러 간다', hint: '치료를 먼저 준비한다', fx: [flag('garden:herb'), next('garden_2')] },
      { label: '조수와 함께 지침을 되찾는다', hint: '섬에서 돌아갈 방법을 확보한다', fx: [flag('garden:log'), next('garden_2')] },
      { label: '일행에게 남은 식량을 주고 떠난다', hint: '탐사에 함께하지 않는다', fx: [{ op: 'money', add: -1000 }] },
    ],
  },
  {
    id: 'garden_2', title: '리틀 가든 · 화산이 울리는 계곡',
    body: '분화의 진동에 공룡 무리가 계곡으로 내려온다. 지금 눈앞에는 이토를 실어 나를 들것과 한 사람이 겨우 지날 길이 있다.',
    doors: [
      { label: '표본의 지혈초를 써서 이토를 옮긴다', hint: '찾아온 약초로 치료한다', when: [{ c: 'flag', id: 'garden:herb', has: true }], fx: [flag('garden:treated'), next('garden_3')] },
      { label: '표본 가방을 버리고 들것을 짊어진다', hint: '채집물은 잃고 사람을 구한다', fx: [{ op: 'hp', add: -10 }, next('garden_3')] },
    ],
  },
  {
    id: 'garden_3', title: '리틀 가든 · 작은 사람들의 귀환',
    body: '이토가 해변에서 눈을 뜬다. 조수는 빈 표본 통에 날짜와 구조한 사람의 이름을 적는다. 누가 더 큰 사냥감을 잡았는지 다투던 거인들의 옛 이야기는, 이 작은 들것 앞에서 다른 의미로 남는다.',
    doors: [
      { label: '약초 지도를 드럼 왕국의 의사에게 전하기로 한다', hint: '다음 섬에서 치료 기록을 이어 간다', fx: [flag('garden:done'), flag('garden:referral'), { op: 'timeline', text: '리틀 가든에서 채집가를 구조하고 드럼 왕국에 전할 약초 지도를 받았다' }] },
      { label: '일행에게 귀환 준비를 맡기고 출항한다', hint: '구조의 기억을 남긴다', fx: [flag('garden:done'), { op: 'fame', add: 3 }] },
    ],
  },
  {
    id: 'drum_1', title: '드럼 왕국 · 눈 속의 왕진 가방',
    body: '항구에서 만난 운반꾼 모카가 약품 수레 앞에서 발을 구른다. 눈사태로 고갯길이 막혔고 외딴집의 환자는 약을 기다린다. 의사의 도착을 기다리는 동안 주민들끼리 할 일을 나눠야 한다.',
    doors: [
      { label: '모카와 눈길을 뚫는다', hint: '배달할 길을 확보한다', fx: [flag('drum:path'), next('drum_2')] },
      { label: '항구 창고에서 대체할 물품을 찾는다', hint: '빈 약상자를 구호 물자로 채운다', fx: [flag('drum:supply'), next('drum_2')] },
      { label: '리틀 가든에서 받은 약초 지도를 건넨다', hint: '현지 의료진이 안전한 사용법을 판단한다', when: [{ c: 'flag', id: 'garden:referral', has: true }], fx: [flag('drum:record'), next('drum_2')] },
    ],
  },
  {
    id: 'drum_2', title: '드럼 왕국 · 한 집을 더 돌면',
    body: '물품을 받은 주민이 이웃집에도 열이 나는 아이가 있다고 말한다. 모카는 남은 기름을 왕진용 등불과 귀환용 썰매 사이에 나눠야 한다. 주인공의 선택을 들은 주민들이 각자의 집에서 담요를 들고 나온다.',
    doors: [
      { label: '등불을 들고 이웃집까지 간다', hint: '돌아오는 길은 걸어야 한다', fx: [{ op: 'hp', add: -10 }, flag('drum:visit'), next('drum_3')] },
      { label: '환자들을 가까운 집으로 모으고 보온한다', hint: '여러 집에 흩어진 물자를 합친다', fx: [flag('drum:shelter'), next('drum_3')] },
    ],
  },
  {
    id: 'drum_3', title: '드럼 왕국 · 봄을 기다리는 기록',
    body: '눈이 잦아들자 주민들이 환자 명단을 의료진에게 전달한다. 모카는 약품 수량만 적던 장부에 찾아가야 할 집과 길을 그려 넣는다. 이 섬의 왕좌와 의술의 역사는 그대로 흐르고, 외딴집 하나가 오늘 밤을 넘긴다.',
    doors: [
      { label: '왕진 지도를 항구에 남긴다', hint: '다음 운반꾼이 같은 길을 찾을 수 있다', fx: [flag('drum:done'), { op: 'base', key: 'int', add: 1 }, { op: 'timeline', text: '드럼 왕국 주민들과 왕진 물품을 나르고 외딴집의 위치를 기록했다' }] },
      { label: '모카와 항해 중 응급 처치를 연습한다', hint: '이번 경험을 다음 항해에 쓴다', fx: [flag('drum:done'), { op: 'hp', add: 10 }] },
    ],
  },
];

export const ROUTE_STORIES = scenes.map((t): Turning => ({
  ...t, kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
  when: [{ c: 'age', min: 16 }, { c: 'island', is: [t.id.startsWith('cape_') ? '쌍둥이 곶' : t.id.startsWith('garden_') ? '리틀 가든' : '드럼 왕국'] }],
}));

ROUTE_STORIES.push(...([
    ['route_sky', '자야', '상승 해류의 준비', '하늘로 오르는 배에 필요한 보강법을 항구의 조선공이 설명한다.', 'route:sky'],
    ['route_coating', '샤본디 제도', '바다 아래로 가는 막', '코팅공이 배를 살피며 심해 항로의 위험과 막을 보호하는 법을 알려 준다.', 'route:coating'],
    ['route_zou', '드레스로자', '움직이는 섬의 길잡이', '항구에서 만난 오리지널 밍크 항해사가 자기 고향으로 안내하겠다고 한다. 움직이는 섬은 기록 지침만으로 찾을 수 없다.', 'route:zou'],
  ] as const).map(([id, island, title, body, permit]): Turning => ({
    id, title, body, kind: 'door', weight: 0, repeat: { years: 0 }, speaker: 'hero',
    when: [{ c: 'age', min: 16 }, { c: 'island', is: [island] }, { c: 'flag', id: permit, has: false }, { c: 'flag', id: DEFERRED_ROUTE, has: false }],
    doors: [
      { label: '출항 준비를 의뢰한다', hint: '비용을 내고 특수 항로를 연다', when: [{ c: 'money' as const, min: 5000 }], fx: [{ op: 'money' as const, add: -5000 }, flag(permit)] },
      { label: '현지 일손을 도우며 준비한다', hint: '체력을 쓰고 특수 항로를 연다', fx: [{ op: 'hp' as const, add: -8 }, flag(permit)] },
      { label: '이번에는 다른 항로를 고른다', hint: '이 항구에 돌아오면 다시 준비할 수 있다', fx: [flag(DEFERRED_ROUTE)] },
    ],
  })));

ROUTE_STORIES.push({
  id: 'garden_giants', kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
  when: [{ c: 'age', min: 16, max: 18 }, { c: 'island', is: ['리틀 가든'] }],
  title: '리틀 가든 · 두 거인의 건배',
  body: '화산이 울리자 도리와 브로기가 무기를 든다. 두 거인은 백 년째 결판나지 않은 승부를 이어 간다고 한다. 누가 이길지 묻자 둘 다 자기 이름을 외치고 웃는다. 결투가 끝난 자리에, 숲길에서 쓰러진 작은 채집가의 소식이 들려온다.',
  doors: [
    { label: '거인들의 결투를 지켜본 뒤 채집가를 찾는다', hint: '승부에 끼어들지 않고 숲으로 간다', fx: [next('garden_1')] },
    { label: '고기와 물을 나누고 채집가의 위치를 묻는다', hint: '거인이 가리킨 계곡으로 향한다', fx: [{ op: 'money', add: -500 }, next('garden_1')] },
  ],
});
