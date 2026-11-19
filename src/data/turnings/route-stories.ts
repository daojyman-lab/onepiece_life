import { TRAINING_LINES } from '../training-routes';
import type { Fx, Turning } from '../../core/types';
const reply = (text: string): Fx => ({ op: 'log', text, weight: 'light' });

const next = (turning: string): Fx => ({ op: 'queue', turning });
const flag = (id: string): Fx => ({ op: 'flag', id });
export const DEFERRED_ROUTE = 'route:deferred';

/** 첫 방문에 바로 제안한다. 후속 장면은 선택한 경우에만 대기열에 넣는다. */
export const ROUTE_ARRIVALS: Record<string, string> = {
  ...Object.fromEntries(TRAINING_LINES.map(line => [line.island, 'field_' + line.course])),
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
      { label: '네루와 함께 잔해를 치운다', hint: '고래가 다가오기 전에 줄을 묶어야 한다', fx: [reply('네루가 줄 끝을 던졌다. 잔해에 매듭 하나를 지을 때마다 먹이터가 조금씩 넓어졌다.'), flag('cape:net'), next('cape_2')] },
      { label: '크로커스에게 고래를 놀라게 하지 않는 법을 묻는다', hint: '기다리는 동안 무엇을 지킬지 듣는다', fx: [reply('크로커스는 손을 들어 물가의 일꾼들을 멈춰 세웠다. 라분이 몸을 돌리자 그 뒤로 파도가 밀려왔다.'), flag('cape:quiet'), next('cape_2')] },
      { label: '먼발치에서 울음소리만 듣는다', hint: '등대지기에게 길을 묻고 출항한다', fx: [reply('등대 불빛이 시야에서 사라질 때까지 낮은 울음이 갑판을 울렸다.'), { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'cape_2', title: '쌍둥이 곶 · 끊어진 밧줄',
    body: '날카로운 돛대 조각이 밧줄을 끊는다. 라분은 먹이터로 다가오고, 네루는 손을 놓지 못한다. 부유물을 밀어낼 배는 한 척뿐이다.',
    doors: [
      { label: '자기 배로 잔해를 끌어낸다', hint: '손과 어깨를 다쳐도 먹이터를 비운다', fx: [reply('팽팽한 줄이 손바닥을 훑고 지나갔다. 돛대 조각은 배 뒤로 끌려 나왔다.'), { op: 'hp', add: -8 }, flag('cape:cleared'), next('cape_3')] },
      { label: '라분이 돌아갈 때까지 조용히 기다렸다가 줄을 다시 건다', hint: '서두르지 않고 작업을 마친다', when: [{ c: 'flag', id: 'cape:quiet', has: true }], fx: [reply('라분이 돌아선 뒤에야 물에 발을 담갔다. 이번 매듭은 단단히 버텼다.'), flag('cape:cleared'), next('cape_3')] },
      { label: '네루를 먼저 물에서 끌어올린다', hint: '잔해 일부는 남지만 사람은 구한다', fx: [reply('네루의 소매를 낚아채 갑판 위로 당겼다. 두 사람의 옷에서 바닷물이 흘렀다.'), next('cape_3')] },
    ],
  },
  {
    id: 'cape_3', title: '쌍둥이 곶 · 돌아올 자리를 남기다',
    body: '네루가 젖은 장갑을 등대 난간에 넌다. 크로커스는 다음 배를 위해 정박 줄을 고쳐 묶는다. 라분의 약속을 대신 이뤄 줄 수는 없지만, 오늘 이곳에 남길 일은 있다.',
    doors: [
      { label: '먹이터에 표지를 남기고 네루와 작별한다', hint: '뒤따르는 배에도 잔해를 버리지 말라고 알린다', fx: [reply('등대 아래 새 표지가 매달렸다. 다음 배가 먹이터를 피해 닻을 내렸다.'), flag('cape:done'), { op: 'timeline', text: '쌍둥이 곶에서 라분의 먹이터와 돌아올 자리를 지켰다' }] },
      { label: '고래의 울음소리를 항해 일지에 적는다', hint: '약속을 기다리는 장소를 기억한다', fx: [reply('빈 오선에 고래가 숨을 고르는 간격만큼 점을 찍었다.'), flag('cape:done'), { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'garden_1', title: '리틀 가든 · 결투 바깥의 발자국',
    body: '원시림 사이로 두 개의 거대한 옛 야영지가 보인다. 결투의 흔적을 조사하던 식물 채집가 이토가 독충에 쏘여 쓰러졌다. 이토의 조수는 약초 표본과 귀환용 기록 지침을 서로 다른 계곡에 떨어뜨렸다.',
    doors: [
      { label: '약초 표본을 찾으러 간다', hint: '치료를 먼저 준비한다', fx: [reply('넓은 잎에 감싸 둔 표본은 아직 마르지 않았다. 조수가 붉은 줄기로 지혈초를 골랐다.'), flag('garden:herb'), next('garden_2')] },
      { label: '조수와 함께 지침을 되찾는다', hint: '섬에서 돌아갈 방법을 확보한다', fx: [reply('바위틈에서 주운 지침이 손바닥 위에서 멈췄다. 조수는 돌아갈 해변에 표시를 남겼다.'), flag('garden:log'), next('garden_2')] },
      { label: '일행에게 남은 식량을 주고 떠난다', hint: '탐사에 함께하지 않는다', fx: [reply('조수가 건빵을 받아 이토 옆에 놓았다. 둘은 나무 그늘에서 바람이 잦기를 기다렸다.'), { op: 'money', add: -1000 }] },
    ],
  },
  {
    id: 'garden_2', title: '리틀 가든 · 화산이 울리는 계곡',
    body: '분화의 진동에 공룡 무리가 계곡으로 내려온다. 지금 눈앞에는 이토를 실어 나를 들것과 한 사람이 겨우 지날 길이 있다.',
    doors: [
      { label: '표본의 지혈초를 써서 이토를 옮긴다', hint: '찾아온 약초로 치료한다', when: [{ c: 'flag', id: 'garden:herb', has: true }], fx: [reply('약초를 감은 자리가 더는 벌어지지 않았다. 들것이 천천히 움직였다.'), flag('garden:treated'), next('garden_3')] },
      { label: '표본 가방을 버리고 들것을 짊어진다', hint: '채집물은 잃고 사람을 구한다', fx: [reply('표본 가방을 내려놓자 들것을 들 어깨가 비었다. 가죽끈이 멍든 쇄골을 눌렀다.'), { op: 'hp', add: -10 }, next('garden_3')] },
    ],
  },
  {
    id: 'garden_3', title: '리틀 가든 · 작은 사람들의 귀환',
    body: '이토가 해변에서 눈을 뜬다. 조수는 빈 표본 통에 날짜와 구조한 사람의 이름을 적는다. 누가 더 큰 사냥감을 잡았는지 다투던 거인들의 옛 이야기는, 이 작은 들것 앞에서 다른 의미로 남는다.',
    doors: [
      { label: '약초 지도를 드럼 왕국의 의사에게 전하기로 한다', hint: '다음 섬에서 치료 기록을 이어 간다', fx: [reply('이토가 접은 지도에 약초의 단면을 그렸다. 환자를 본 의사에게 먼저 보여 달라고 당부했다.'), flag('garden:done'), flag('garden:referral'), { op: 'timeline', text: '리틀 가든에서 채집가를 구조하고 드럼 왕국에 전할 약초 지도를 받았다' }] },
      { label: '일행에게 귀환 준비를 맡기고 출항한다', hint: '구조의 기억을 남긴다', fx: [reply('해변에 돌아온 조수가 자기 이름 아래 구조자의 이름도 적었다.'), flag('garden:done'), { op: 'fame', add: 3 }] },
    ],
  },
  {
    id: 'drum_1', title: '드럼 왕국 · 눈 속의 왕진 가방',
    body: '항구에서 만난 운반꾼 모카가 약품 수레 앞에서 발을 구른다. 눈사태로 고갯길이 막혔고 외딴집의 환자는 약을 기다린다. 의사의 도착을 기다리는 동안 주민들끼리 할 일을 나눠야 한다.',
    doors: [
      { label: '모카와 눈길을 뚫는다', hint: '배달할 길을 확보한다', fx: [reply('모카와 번갈아 삽을 넣었다. 수레 한 대가 빠져나갈 폭의 눈길이 뚫렸다.'), flag('drum:path'), next('drum_2')] },
      { label: '항구 창고에서 대체할 물품을 찾는다', hint: '빈 약상자를 구호 물자로 채운다', fx: [reply('창고 안쪽에서 기름과 마른 천을 꺼내 빈 약상자에 넣었다.'), flag('drum:supply'), next('drum_2')] },
      { label: '리틀 가든에서 받은 약초 지도를 건넨다', hint: '현지 의료진이 안전한 사용법을 판단한다', when: [{ c: 'flag', id: 'garden:referral', has: true }], fx: [reply('의료진이 지도를 받아 환자 기록과 함께 묶었다. 모카의 수레에 필요한 물품이 더 실렸다.'), flag('drum:record'), next('drum_2')] },
    ],
  },
  {
    id: 'drum_2', title: '드럼 왕국 · 한 집을 더 돌면',
    body: '물품을 받은 주민이 이웃집에도 열이 나는 아이가 있다고 말한다. 모카는 남은 기름을 왕진용 등불과 귀환용 썰매 사이에 나눠야 한다. 주인공의 선택을 들은 주민들이 각자의 집에서 담요를 들고 나온다.',
    doors: [
      { label: '등불을 들고 이웃집까지 간다', hint: '돌아오는 길은 걸어야 한다', fx: [reply('등불이 이웃집 창문에 비쳤다. 눈길을 걸어 돌아오는 동안 발이 퉁퉁 부었다.'), { op: 'hp', add: -10 }, flag('drum:visit'), next('drum_3')] },
      { label: '환자들을 가까운 집으로 모으고 보온한다', hint: '여러 집에 흩어진 물자를 합친다', fx: [reply('화롯가에 빈 자리가 생겼다. 이웃들이 마른 담요를 한 장씩 갖고 들어왔다.'), flag('drum:shelter'), next('drum_3')] },
    ],
  },
  {
    id: 'drum_3', title: '드럼 왕국 · 봄을 기다리는 기록',
    body: '눈이 잦아들자 주민들이 환자 명단을 의료진에게 전달한다. 모카는 약품 수량만 적던 장부에 찾아가야 할 집과 길을 그려 넣는다. 이튿날 첫 왕진 썰매가 그 지도를 들고 외딴집으로 향한다.',
    doors: [
      { label: '왕진 지도를 항구에 남긴다', hint: '다음 운반꾼이 같은 길을 찾을 수 있다', fx: [reply('다음 왕진 썰매는 새 지도에서 첫집으로 꺾는 모퉁이를 찾았다.'), flag('drum:done'), { op: 'base', key: 'int', add: 1 }, { op: 'timeline', text: '드럼 왕국 주민들과 왕진 물품을 나르고 외딴집의 위치를 기록했다' }] },
      { label: '모카와 항해 중 응급 처치를 연습한다', hint: '이번 경험을 다음 항해에 쓴다', fx: [reply('모카가 천을 접어 팔을 받치는 법을 보여 주었다. 서로 감아 보고 매듭을 고쳤다.'), flag('drum:done'), { op: 'hp', add: 10 }] },
    ],
  },
];

export const ROUTE_STORIES = scenes.map((t): Turning => ({
  ...t, kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
  when: [{ c: 'age', min: 16 }, { c: 'island', is: [t.id.startsWith('cape_') ? '쌍둥이 곶' : t.id.startsWith('garden_') ? '리틀 가든' : '드럼 왕국'] }],
}));

const routePreparations = [
  { id: 'route_sky', paidResult: '조선공이 돛대 아래 새 줄을 걸고 장력을 맞췄다.', workResult: '직접 건 보강 줄을 조선공이 당겨 보고 고개를 끄덕였다.', island: '자야', permit: 'route:sky', title: '상승 해류의 준비',
    body: '다음 상승 해류를 기다리는 동안 항구의 조선공이 돛대를 살핀다. 물기둥을 타려면 돛대를 버틸 보강 줄이 필요하다.',
    paid: '조선공에게 보강 줄을 주문한다', work: '조선공을 도와 직접 돛대를 보강한다', benefit: '녹 업 스트림에서 배를 다루기 쉬워진다' },
  { id: 'route_coating', paidResult: '자재값이 장부에 적혔다. 코팅공은 출항 날 찾아갈 부두를 손가락으로 짚었다.', workResult: '마지막 수지 통을 굴려 놓자 코팅공이 자기 선착장의 표식을 건넸다.', island: '샤본디 제도', permit: 'route:coating', title: '바다 아래로 가는 막',
    body: '수지 통을 정리하던 코팅공이 다음 심해 항해 일정을 묻는다. 오늘 필요한 자재를 미리 마련해 주면 출항하는 날 선착장에서 배를 맡아 주겠다고 한다.',
    paid: '코팅공에게 자재값을 건넨다', work: '코팅공과 함께 수지 통을 나른다', benefit: '심해 관문에서 이 장인에게 코팅을 맡길 수 있다' },
  { id: 'route_zou', paidResult: '배삯을 받은 항해사가 비브르 카드 한 귀퉁이를 찢어 건넸다.', workResult: '짐을 함께 묶자 항해사가 카드를 찢었다. 작은 조각이 손바닥 위에서 방향을 잡았다.', island: '드레스로자', permit: 'route:zou', title: '움직이는 섬의 길잡이',
    body: '부두에서 만난 밍크족 항해사가 고향에 가져갈 짐을 묶는다. 조우를 찾는다면 비브르 카드 한 조각을 나눠 주겠다고 한다.',
    paid: '짐을 실을 배삯을 보탠다', work: '항해사의 짐을 배까지 나른다', benefit: '안개 속에서 비브르 카드를 따라 조우로 간다' },
] as const;

for (const prep of routePreparations) ROUTE_STORIES.push({
  id: prep.id, title: prep.title, body: prep.body, kind: 'door', weight: 0, repeat: { years: 0 }, speaker: 'hero',
  when: [{ c: 'age', min: 16 }, { c: 'island', is: [prep.island] }, { c: 'flag', id: prep.permit, has: false }, { c: 'flag', id: DEFERRED_ROUTE, has: false }],
  doors: [
    { label: prep.paid, hint: '오천 베리를 낸다. ' + prep.benefit, when: [{ c: 'money', min: 5000 }], fx: [reply(prep.paidResult), { op: 'money', add: -5000 }, flag(prep.permit)] },
    { label: prep.work, hint: '몸은 고되지만 품삯으로 준비를 마친다. ' + prep.benefit, fx: [reply(prep.workResult), { op: 'hp', add: -8 }, flag(prep.permit)] },
    { label: '이번에는 준비를 미룬다', hint: '다른 항구에 다녀온 뒤 다시 의뢰할 수 있다', fx: [reply('출항 준비는 거기서 멈췄다. 다시 오면 들르겠다고 작별을 건넸다.'), flag(DEFERRED_ROUTE)] },
  ],
});

ROUTE_STORIES.push({
  id: 'garden_giants', kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
  when: [{ c: 'age', min: 16, max: 18 }, { c: 'island', is: ['리틀 가든'] }],
  title: '리틀 가든 · 두 거인의 건배',
  body: '화산이 울리자 도리와 브로기가 무기를 든다. 두 거인은 백 년째 결판나지 않은 승부를 이어 간다고 한다. 누가 이길지 묻자 둘 다 자기 이름을 외치고 웃는다. 결투가 끝난 자리에, 숲길에서 쓰러진 작은 채집가의 소식이 들려온다.',
  doors: [
    { label: '거인들의 결투를 지켜본 뒤 채집가를 찾는다', hint: '승부에 끼어들지 않고 숲으로 간다', fx: [reply('두 거인이 웃으며 맞댄 술통이 울렸다. 소리를 뒤로하고 채집가가 쓰러진 계곡으로 향했다.'), next('garden_1')] },
    { label: '고기와 물을 나누고 채집가의 위치를 묻는다', hint: '거인이 가리킨 계곡으로 향한다', fx: [reply('브로기가 빈 물통을 돌려주며 숲의 굽은 나무를 가리켰다. 그 아래 들것 한 귀퉁이가 보였다.'), { op: 'money', add: -500 }, next('garden_1')] },
  ],
});
