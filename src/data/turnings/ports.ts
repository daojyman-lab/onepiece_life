import type { Cond, Door, Fx, Turning } from '../../core/types';
const reply = (text: string): Fx => ({ op: 'log', text, weight: 'light' });

function ashore(island: string | string[], id: string, title: string, body: string, doors: Door[], conditions: Cond[] = []): Turning {
  return {
    id, title, body, doors, kind: 'door', speaker: 'hero', weight: 0, repeat: 'once',
    when: [{ c: 'age', min: 16 }, { c: 'island', is: Array.isArray(island) ? island : [island] }, ...conditions],
  };
}

const fogWaters = ['스릴러 바크', '플로리안 트라이앵글'];
const stillMissing: Cond[] = [{ c: 'flag', id: 'florian:rescued', has: false }];
const followBell: Door[] = [
  { label: '종을 두 번 치고 답을 기다린다', hint: '배마다 다른 신호를 구별한다', fx: [reply('두 번 울린 종에 짧은 답이 돌아왔다. 안개 속에서 한 소리가 가까워졌다.'), { op: 'queue', turning: 'florian_echo' }] },
  { label: '물에 뜬 길이줄을 거둬들인다', hint: '줄 끝에서 조난선에 무슨 일이 있었는지 찾는다', fx: [reply('젖은 길이줄을 한 팔씩 감아 올리자 납추보다 가벼운 무언가가 따라 올라왔다.'), { op: 'queue', turning: 'florian_line' }] },
];

export const PORT_STORIES: Turning[] = [
  ashore('셸스 타운', 'shells_ledger', '셸스 타운 · 장부 속의 한 사람',
    '해군 기지 아래 부두에서 생선 장수가 저울을 내려놓는다. 납품 장부에 배 두 척의 품삯이 한 줄로 적혔다. 먹물이 번진 선주 이름은 읽을 수 없지만, 짐꾼들은 어느 배가 어느 시간에 들어왔는지 기억한다.', [
      { label: '짐꾼들의 입항 시각을 맞춰 본다', hint: '두 선주가 각자 품삯을 받도록 장부를 고친다', fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', weight: 'heavy', text: '선주 둘이 각자의 줄에 손도장을 찍었다. 생선 장수가 그제야 저울을 다시 걸었다.' }] },
      { label: '생선이 상하기 전에 시장으로 나른다', hint: '오늘 팔 몫부터 건지고 운반 삯을 받는다', fx: [reply('시장에 도착하자 생선 눈이 아직 맑았다. 장수가 빈 광주리에 품삯을 얹어 주었다.'), { op: 'money', add: 1500 }] },
    ]),
  ashore('오렌지 마을', 'orange_sign', '오렌지 마을 · 문 닫는 소리',
    '가게들이 문을 닫을 때마다 골목 끝에서 개 한 마리가 짖는다. 장화 가게 주인은 나무 간판이 헐거워져 바람만 불어도 덜컥거린다고 한다. 손님은 벌써 다 갔는데 개는 그 밑을 지키고 있다.', [
      { label: '간판을 내려 경첩에 가죽을 덧댄다', hint: '조용해진 골목에 개가 몸을 누인다', fx: [{ op: 'fame', add: 2 }, { op: 'log', weight: 'light', text: '장화 가게 주인은 가죽 조각으로 개 목에 꼭 맞는 이름표도 하나 만들었다.' }] },
      { label: '가게 앞에 앉아 마지막 손님을 기다린다', hint: '잠든 개 곁에서 비 그치는 소리를 듣는다', fx: [reply('개가 문턱에 턱을 괴었다. 빗물이 처마에서 한 방울씩 떨어졌다.'), { op: 'hp', add: 5 }] },
    ]),
  ashore('시모츠키 마을', 'shimotsuki_dojo', '시모츠키 마을 · 닳은 마룻장',
    '검술 도장의 어린 수련생은 매번 같은 자리에서 발이 걸린다. 마룻장 하나가 들떠 있다. 아이는 그 위에 분필로 발 모양을 그려 두었다. 내일 처음 오는 아이가 넘어질까 걱정된단다.', [
      { label: '마룻장을 고친 뒤 발 모양을 따라 디뎌 본다', hint: '목검 없이도 배울 수 있는 발놀림이다', fx: [reply('새로 박은 못 곁에 맨발을 디뎠다. 마룻장이 까딱도 하지 않았다.'), { op: 'mastery', branch: 'sword', add: 8 }] },
      { label: '아이와 함께 도장 전체의 바닥을 살핀다', hint: '들뜬 자리마다 천 조각으로 표시한다', fx: [reply('수련생이 천 조각을 세어 보았다. 내일 고칠 마룻장은 세 곳이었다.'), { op: 'base', key: 'int', add: 1 }] },
    ]),
  ashore('진귀한 동물의 섬', 'rare_tracks', '진귀한 동물의 섬 · 한 마리의 발자국',
    '수풀 앞에서 뱀처럼 긴 자국과 닭발 자국이 한꺼번에 끊긴다. 두 짐승이 싸운 줄 알았더니, 닭 볏이 달린 뱀이 갈대 사이에서 빠져나온다. 작은 몸에 감긴 낡은 낚싯줄이 뒤로 끌린다.', [
      { label: '낚싯줄 끝을 눌러 줄만 끊어 준다', hint: '숲의 주인은 건드리지 않고 버려진 줄을 걷는다', fx: [{ op: 'base', key: 'spd', add: 1 }, { op: 'log', weight: 'light', text: '볏이 갈대 사이로 사라졌다. 주워 온 낚싯줄은 손바닥 안에 꼭 찼다.' }] },
      { label: '멀찍이서 얽힌 갈대를 들어 준다', hint: '짐승이 스스로 빠져나오는 모습을 그린다', fx: [reply('갈대가 들리자 몸을 한 번 비튼 짐승이 빠져나갔다. 진흙에 길쭉한 자국이 남았다.'), { op: 'base', key: 'int', add: 1 }] },
    ]),
  ashore('롱 링 롱 랜드', 'longring_tide', '롱 링 롱 랜드 · 두 개의 물금',
    '길쭉한 말들이 물가에서 풀을 뜯는다. 유목민이 천막 말뚝에 오늘의 물높이를 새긴다. 고리 모양 땅의 얕은 목은 지금 물에 잠겨 있다. 건너편에 사는 이에게 맡길 종자 자루만 물가에 쌓였다.', [
      { label: '작은 배로 종자 자루를 건너편에 나른다', hint: '다음 물때를 기다리지 않고 씨앗을 전한다', fx: [{ op: 'money', add: 2000 }, { op: 'log', weight: 'heavy', text: '돌아오는 뱃전으로 긴 말의 코가 따라왔다. 건너편에서 받은 풀 한 다발을 내밀었다.' }] },
      { label: '말뚝의 물금을 베껴 다음 사공에게 남긴다', hint: '가라앉은 길에서 뱃바닥이 닿을 곳을 표시한다', fx: [reply('다음 사공이 물금 옆에 배 밑창 깊이를 새겼다. 얕은 길을 한눈에 읽을 수 있었다.'), { op: 'base', key: 'int', add: 1 }] },
    ]),
  ashore('스릴러 바크', 'bark_bell', '스릴러 바크 · 종 세 번, 대답 두 번',
    '워터 세븐에서 온 측심선 방울새 호를 찾던 중, 안개 속에 성벽이 나타났다. 바닷물이 벽을 때릴 때마다 성벽 전체가 물결을 따라 들린다. 섬만 한 배다. 바깥 사슬을 밟고 난간에 오르니 빈 보트 하나가 선체에 부딪힌다. 안쪽에서 종이 세 번, 안개 저편에서 두 번 울린다.', followBell, stillMissing),
  ashore('플로리안 트라이앵글', 'florian_bell', '플로리안 트라이앵글 · 목격 기록의 여백',
    '워터 세븐의 측심선 방울새 호가 돌아오지 않았다. 마지막 기록에는 스릴러 바크의 옛 목격 지점이 표시돼 있다. 그 지점에서 보이는 건 빈 보트와 끊긴 길이줄뿐이다. 안개 저편에서 종이 세 번, 더 먼 곳에서 두 번 울린다.', followBell, stillMissing),
  ashore(fogWaters, 'florian_echo', '안개 속의 세 번째 종',
    '첫 소리는 기울어진 측심선의 종이 파도에 흔들리는 소리였다. 두 번째 소리는 사람이 친다. 전복된 보트 밑에서 두 사람이 살아 있다며 구조를 청한다. 어디로 당겨야 할지 알려 주어야 한다.', [
      { label: '종을 옮겨 안전한 쪽에서 계속 울린다', hint: '두 사람이 소리를 따라 선미까지 온다', fx: [reply('난간 끝으로 옮긴 종 밑에서 손 하나가 솟고 뒤이어 또 하나가 보였다.'), { op: 'queue', turning: 'florian_names' }] },
      { label: '보트에 줄을 던지고 한 사람씩 끌어당긴다', hint: '손바닥은 쓸려도 둘 다 갑판에 오른다', fx: [reply('거친 밧줄에 손이 쓸렸다. 갑판 위에서 두 사람이 숨을 몰아쉬었다.'), { op: 'hp', add: -4 }, { op: 'queue', turning: 'florian_names' }] },
    ]),
  ashore(fogWaters, 'florian_line', '안개 속의 길이줄',
    '줄 끝의 납추에 아이 신발만 한 천 주머니가 달려 있다. 안에서 두 사람의 이름과 보트 밑에 갇혔다는 사연이 적힌 쪽지가 나온다. 줄을 팽팽하게 당기자 뒤집힌 보트에서 같은 박자로 두 번 당겨 온다.', [
      { label: '남은 줄을 이어 두 사람이 붙들고 오게 한다', hint: '구조 줄을 살려 두고 이름 주머니를 건진다', fx: [reply('한 사람씩 줄을 타고 올라왔다. 마지막에 젖은 주머니가 난간 안쪽으로 넘어왔다.'), { op: 'flag', id: 'florian:pouch' }, { op: 'queue', turning: 'florian_names' }] },
      { label: '측심 장비를 버려 보트를 댈 자리를 낸다', hint: '장비가 가라앉은 자리에 두 사람이 오른다', fx: [reply('측심추를 풀어 바다에 내리자 보트 댈 자리가 났다. 둘이 난간을 붙들었다.'), { op: 'queue', turning: 'florian_names' }] },
    ]),
  ashore(fogWaters, 'florian_names', '항해 일지의 빈 두 줄',
    '담요를 덮은 두 사람이 펜 한 자루를 주고받는다. 한 사람은 자기 이름을 서툴게 쓰고, 다른 사람은 이름 대신 지문을 찍는다. 측심선은 잃었지만, 부두에 걸릴 실종자 명단은 고칠 수 있다.', [
      { label: '두 사람의 귀환 기록을 항구에 보낸다', hint: '기다리는 사람들이 먼저 소식을 듣는다', fx: [reply('항구의 실종자 명단에서 이름 두 개가 지워졌다. 옆에는 생환이라고 적혔다.'), { op: 'flag', id: 'florian:rescued' }, { op: 'timeline', text: '방울새 호에서 실종된 측심원 두 사람의 생환 소식을 전했다' }] },
      { label: '구조 신호와 마지막 좌표를 해도에 남긴다', hint: '다음 측심선이 안개 속에서 쓸 기록을 남긴다', fx: [reply('조난 신호가 이어진 두 지점을 해도에 그었다. 마지막 표시는 사람을 건진 곳이었다.'), { op: 'flag', id: 'florian:rescued' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '이름 주머니를 돌려주고 귀환 전보를 친다', hint: '두 사람의 서명을 원래 주머니 안에 담는다', when: [{ c: 'flag', id: 'florian:pouch', has: true }], fx: [reply('젖은 이름 주머니를 받아 든 두 사람 앞에서 귀환 전보가 전송됐다.'), { op: 'flag', id: 'florian:rescued' }, { op: 'timeline', text: '방울새 호 측심원들에게 두 이름이 든 주머니를 돌려주었다' }] },
    ]),
];

const resupply: Turning = {
  id: 'islet_resupply', kind: 'door', weight: 0, repeat: { years: 0 }, speaker: 'hero',
  when: [],
  title: '이름 없는 섬 · 한나절의 정박',
  body: '{destination}(으)로 가는 도중 바람이 잦아들었다. 바위틈에서 민물이 흐르고, 썰물이 드러낸 여울에는 작은 물고기가 갇혀 있다. 바람이 돌아오기 전에 무엇을 실을까?',
  doors: [
    { label: '닻을 내리고 민물과 소금에 절일 물고기를 싣는다', hint: '항해 식량 세 몫을 싣는다. 배에는 여섯 몫까지 실린다', fx: [reply('물통이 차고 생선에 소금이 배었다. 뱃전에 묶은 밧줄을 거뒀다.'), { op: 'resumeVoyage', stores: 3 }] },
    { label: '작은 배로 샘물을 길어 죽을 끓이고 쉰다', hint: '체력을 회복하고 항해 식량 한 몫을 챙긴다', fx: [reply('샘물로 끓인 죽 한 그릇에 손끝이 따뜻해졌다. 남은 물을 통에 담았다.'), { op: 'hp', add: 8 }, { op: 'resumeVoyage', stores: 1 }] },
    { label: '섬을 지나쳐 원래 항로를 따른다', hint: '물때가 바뀌기 전에 목적지로 간다', fx: [reply('여울에 돛 그림자만 스쳤다. 배는 바람을 놓치지 않고 나아갔다.'), { op: 'resumeVoyage', stores: 0 }] },
  ],
};

export const RESUPPLY_STORIES: Turning[] = [resupply, {
  ...resupply, id: 'islet_rainwater', title: '이름 없는 섬 · 빗물 고인 웅덩이',
  body: '{destination}(으)로 가는 길에 새들이 낮은 바위섬을 맴돈다. 밤새 고인 빗물이 바위 그늘에 남아 있고 검은 돌 사이에는 조개가 붙어 있다. 밀물이 들기 전까지 작은 배를 댈 수 있다.',
  doors: [
    { label: '빗물을 거르고 조개를 삶아 싣는다', hint: '항해 식량 세 몫을 챙긴다. 배에는 여섯 몫까지 실린다', fx: [reply('천으로 거른 빗물과 삶은 조개를 나눠 실었다. 마지막 통의 마개를 단단히 닫았다.'), { op: 'resumeVoyage', stores: 3 }] },
    { label: '교대로 바위 그늘에서 눈을 붙인다', hint: '체력을 회복하고 물 한 통을 채운다', fx: [reply('먼저 쉰 이가 노를 잡았다. 바위 아래 두었던 물통을 배 안으로 당겼다.'), { op: 'hp', add: 8 }, { op: 'resumeVoyage', stores: 1 }] },
    { label: '밀물을 따라 항해를 계속한다', hint: '닻을 내리지 않고 목적지를 향한다', fx: [reply('부표 없는 바위섬이 뒤로 멀어졌다. 밀물이 차오른 자리를 배가 빠져나갔다.'), { op: 'resumeVoyage', stores: 0 }] },
  ],
}];
