import type { Cond, Door, Turning } from '../../core/types';

function ashore(island: string | string[], id: string, title: string, body: string, doors: Door[], conditions: Cond[] = []): Turning {
  return {
    id, title, body, doors, kind: 'door', speaker: 'hero', weight: 0, repeat: 'once',
    when: [{ c: 'age', min: 16 }, { c: 'island', is: Array.isArray(island) ? island : [island] }, ...conditions],
  };
}

const fogWaters = ['스릴러 바크', '플로리안 트라이앵글'];
const stillMissing: Cond[] = [{ c: 'flag', id: 'florian:rescued', has: false }];
const followBell: Door[] = [
  { label: '종을 두 번 치고 답을 기다린다', hint: '배마다 다른 신호를 구별한다', fx: [{ op: 'queue', turning: 'florian_echo' }] },
  { label: '물에 뜬 길이줄을 거둬들인다', hint: '줄 끝에서 조난선에 무슨 일이 있었는지 찾는다', fx: [{ op: 'queue', turning: 'florian_line' }] },
];

export const PORT_STORIES: Turning[] = [
  ashore('셸스 타운', 'shells_ledger', '셸스 타운 · 장부 속의 한 사람',
    '해군 기지 아래 부두에서 생선 장수가 저울을 내려놓는다. 납품 장부에 배 두 척의 품삯이 한 줄로 적혔다. 먹물이 번진 선주 이름은 읽을 수 없지만, 짐꾼들은 어느 배가 어느 시간에 들어왔는지 기억한다.', [
      { label: '짐꾼들의 입항 시각을 맞춰 본다', hint: '두 선주가 각자 품삯을 받도록 장부를 고친다', fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', weight: 'heavy', text: '선주 둘이 각자의 줄에 손도장을 찍었다. 생선 장수가 그제야 저울을 다시 걸었다.' }] },
      { label: '생선이 상하기 전에 시장으로 나른다', hint: '오늘 팔 몫부터 건지고 운반 삯을 받는다', fx: [{ op: 'money', add: 1500 }] },
    ]),
  ashore('오렌지 마을', 'orange_sign', '오렌지 마을 · 문 닫는 소리',
    '가게들이 문을 닫을 때마다 골목 끝에서 개 한 마리가 짖는다. 장화 가게 주인은 나무 간판이 헐거워져 바람만 불어도 덜컥거린다고 한다. 손님은 벌써 다 갔는데 개는 그 밑을 지키고 있다.', [
      { label: '간판을 내려 경첩에 가죽을 덧댄다', hint: '조용해진 골목에 개가 몸을 누인다', fx: [{ op: 'fame', add: 2 }, { op: 'log', weight: 'light', text: '장화 가게 주인은 가죽 조각으로 개 목에 꼭 맞는 이름표도 하나 만들었다.' }] },
      { label: '가게 앞에 앉아 마지막 손님을 기다린다', hint: '잠든 개 곁에서 비 그치는 소리를 듣는다', fx: [{ op: 'hp', add: 5 }] },
    ]),
  ashore('시모츠키 마을', 'shimotsuki_dojo', '시모츠키 마을 · 닳은 마룻장',
    '검술 도장의 어린 수련생은 매번 같은 자리에서 발이 걸린다. 마룻장 하나가 들떠 있다. 아이는 그 위에 분필로 발 모양을 그려 두었다. 내일 처음 오는 아이가 넘어질까 걱정된단다.', [
      { label: '마룻장을 고친 뒤 발 모양을 따라 디뎌 본다', hint: '목검 없이도 배울 수 있는 발놀림이다', fx: [{ op: 'mastery', branch: 'sword', add: 8 }] },
      { label: '아이와 함께 도장 전체의 바닥을 살핀다', hint: '들뜬 자리마다 천 조각으로 표시한다', fx: [{ op: 'base', key: 'int', add: 1 }] },
    ]),
  ashore('진귀한 동물의 섬', 'rare_tracks', '진귀한 동물의 섬 · 한 마리의 발자국',
    '수풀 앞에서 뱀처럼 긴 자국과 닭발 자국이 한꺼번에 끊긴다. 두 짐승이 싸운 줄 알았더니, 닭 볏이 달린 뱀이 갈대 사이에서 빠져나온다. 작은 몸에 감긴 낡은 낚싯줄이 뒤로 끌린다.', [
      { label: '낚싯줄 끝을 눌러 줄만 끊어 준다', hint: '숲의 주인은 건드리지 않고 버려진 줄을 걷는다', fx: [{ op: 'base', key: 'spd', add: 1 }, { op: 'log', weight: 'light', text: '볏이 갈대 사이로 사라졌다. 주워 온 낚싯줄은 손바닥 안에 꼭 찼다.' }] },
      { label: '멀찍이서 얽힌 갈대를 들어 준다', hint: '짐승이 스스로 빠져나오는 모습을 그린다', fx: [{ op: 'base', key: 'int', add: 1 }] },
    ]),
  ashore('롱 링 롱 랜드', 'longring_tide', '롱 링 롱 랜드 · 두 개의 물금',
    '길쭉한 말들이 물가에서 풀을 뜯는다. 유목민이 천막 말뚝에 오늘의 물높이를 새긴다. 고리 모양 땅의 얕은 목은 지금 물에 잠겨 있다. 건너편에 사는 이에게 맡길 종자 자루만 물가에 쌓였다.', [
      { label: '작은 배로 종자 자루를 건너편에 나른다', hint: '다음 물때를 기다리지 않고 씨앗을 전한다', fx: [{ op: 'money', add: 2000 }, { op: 'log', weight: 'heavy', text: '돌아오는 뱃전으로 긴 말의 코가 따라왔다. 건너편에서 받은 풀 한 다발을 내밀었다.' }] },
      { label: '말뚝의 물금을 베껴 다음 사공에게 남긴다', hint: '가라앉은 길에서 뱃바닥이 닿을 곳을 표시한다', fx: [{ op: 'base', key: 'int', add: 1 }] },
    ]),
  ashore('스릴러 바크', 'bark_bell', '스릴러 바크 · 종 세 번, 대답 두 번',
    '워터 세븐에서 온 측심선 방울새 호를 찾던 중, 안개 속에 성벽이 나타났다. 바닷물이 벽을 때릴 때마다 성벽 전체가 물결을 따라 들린다. 섬만 한 배다. 바깥 사슬을 밟고 난간에 오르니 빈 보트 하나가 선체에 부딪힌다. 안쪽에서 종이 세 번, 안개 저편에서 두 번 울린다.', followBell, stillMissing),
  ashore('플로리안 트라이앵글', 'florian_bell', '플로리안 트라이앵글 · 목격 기록의 여백',
    '워터 세븐의 측심선 방울새 호가 돌아오지 않았다. 마지막 기록에는 스릴러 바크의 옛 목격 지점이 표시돼 있다. 그 지점에서 보이는 건 빈 보트와 끊긴 길이줄뿐이다. 안개 저편에서 종이 세 번, 더 먼 곳에서 두 번 울린다.', followBell, stillMissing),
  ashore(fogWaters, 'florian_echo', '안개 속의 세 번째 종',
    '첫 소리는 기울어진 측심선의 종이 파도에 흔들리는 소리였다. 두 번째 소리는 사람이 친다. 전복된 보트 밑에서 두 사람이 살아 있다며 구조를 청한다. 어디로 당겨야 할지 알려 주어야 한다.', [
      { label: '종을 옮겨 안전한 쪽에서 계속 울린다', hint: '두 사람이 소리를 따라 선미까지 온다', fx: [{ op: 'queue', turning: 'florian_names' }] },
      { label: '보트에 줄을 던지고 한 사람씩 끌어당긴다', hint: '손바닥은 쓸려도 둘 다 갑판에 오른다', fx: [{ op: 'hp', add: -4 }, { op: 'queue', turning: 'florian_names' }] },
    ]),
  ashore(fogWaters, 'florian_line', '안개 속의 길이줄',
    '줄 끝의 납추에 아이 신발만 한 천 주머니가 달려 있다. 안에서 두 사람의 이름과 보트 밑에 갇혔다는 사연이 적힌 쪽지가 나온다. 줄을 팽팽하게 당기자 뒤집힌 보트에서 같은 박자로 두 번 당겨 온다.', [
      { label: '남은 줄을 이어 두 사람이 붙들고 오게 한다', hint: '구조 줄을 살려 두고 이름 주머니를 건진다', fx: [{ op: 'flag', id: 'florian:pouch' }, { op: 'queue', turning: 'florian_names' }] },
      { label: '측심 장비를 버려 보트를 댈 자리를 낸다', hint: '장비가 가라앉은 자리에 두 사람이 오른다', fx: [{ op: 'queue', turning: 'florian_names' }] },
    ]),
  ashore(fogWaters, 'florian_names', '항해 일지의 빈 두 줄',
    '담요를 덮은 두 사람이 펜 한 자루를 주고받는다. 한 사람은 자기 이름을 서툴게 쓰고, 다른 사람은 이름 대신 지문을 찍는다. 측심선은 잃었지만, 부두에 걸릴 실종자 명단은 고칠 수 있다.', [
      { label: '두 사람의 귀환 기록을 항구에 보낸다', hint: '기다리는 사람들이 먼저 소식을 듣는다', fx: [{ op: 'flag', id: 'florian:rescued' }, { op: 'timeline', text: '방울새 호에서 실종된 측심원 두 사람의 생환 소식을 전했다' }] },
      { label: '구조 신호와 마지막 좌표를 해도에 남긴다', hint: '다음 측심선이 안개 속에서 쓸 기록을 남긴다', fx: [{ op: 'flag', id: 'florian:rescued' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '이름 주머니를 돌려주고 귀환 전보를 친다', hint: '두 사람의 서명을 원래 주머니 안에 담는다', when: [{ c: 'flag', id: 'florian:pouch', has: true }], fx: [{ op: 'flag', id: 'florian:rescued' }, { op: 'timeline', text: '방울새 호 측심원들에게 두 이름이 든 주머니를 돌려주었다' }] },
    ]),
];

export const RESUPPLY: Turning = {
  id: 'islet_resupply', kind: 'door', weight: 0, repeat: { years: 0 }, speaker: 'hero',
  when: [{ c: 'island', is: ['이름 없는 섬'] }],
  title: '이름 없는 섬 · 한나절의 정박',
  body: '{destination}(으)로 가는 도중 바람이 잦아들었다. 바위틈에서 민물이 흐르고, 썰물이 드러낸 여울에는 작은 물고기가 갇혀 있다. 바람이 돌아오기 전에 무엇을 실을까?',
  doors: [
    { label: '물통을 채우고 잡은 물고기를 소금에 절인다', hint: '항해 식량 세 몫을 싣는다. 배에는 여섯 몫까지 실린다', fx: [{ op: 'resumeVoyage', stores: 3 }] },
    { label: '샘물을 받아 죽을 끓이고 그늘에서 쉰다', hint: '체력을 회복하고 항해 식량 한 몫을 챙긴다', fx: [{ op: 'hp', add: 8 }, { op: 'resumeVoyage', stores: 1 }] },
    { label: '물때를 살핀 뒤 바로 출항한다', hint: '짐을 늘리지 않고 원래 목적지로 간다', fx: [{ op: 'resumeVoyage', stores: 0 }] },
  ],
};
