import type { Life5, Turning } from '../core/types';
import { trainingSite } from './training-routes';

export const KUMA_FOE = 'kuma_interception';
export const KUMA_MET = 'kuma:met';
const war = 'cn_whitebeard_war';

// 게임 연표의 두 목격 지점. 전쟁을 이미 본 저장에서는 같은 나이에도 만남을 열지 않는다.
const sightings = [
  { id: 'kuma_bark', island: '스릴러 바크', age: 18, sea: 'sabaody',
    title: '스릴러 바크 · 안개 속의 발바닥 자국',
    body: '구조한 측심선 사람들을 부서진 돛 아래로 옮긴다. 바닥에는 커다란 곰 발바닥 모양의 자국이 패여 있다. 성경을 옆구리에 낀 바솔로뮤 쿠마가 잔해 사이의 좁은 통로로 걸어온다. 맨 뒤의 부상자는 아직 통로를 건너지 못했다.' },
  { id: 'kuma_grove', island: '샤본디 제도', age: 19, sea: 'sabaody',
    title: '샤본디 제도 · 장갑을 벗은 남자',
    body: '맹그로브 뿌리 너머에서 포성이 울린다. 피난민들이 수지 방울에 실은 들것을 밀다가 커다란 사내와 마주친다. 같은 얼굴의 병기들과 달리 이 남자는 성경을 들고 있다. 바솔로뮤 쿠마가 한 손의 장갑을 벗는다.' },
] as const;

export function kumaSighting(s: Life5) {
  if (!s.hero.alive || s.ended || s.passage || s.hero.standing === 'prisoner' ||
      s.seenCount[war] || s.hero.fruit?.id === 'nikyu' ||
      s.people.some(person => person.canon === 'kuma' ? !person.alive || person.kind === 'crew' : person.alive && person.crew?.fruit === 'nikyu')) return;
  if (s.hero.island === '스릴러 바크' && !s.flags.includes('florian:rescued')) return;
  return sightings.find(place => place.age === s.age && place.sea === s.hero.sea && place.island === s.hero.island);
}

export const KUMA_ENCOUNTERS: Turning[] = sightings.map(place => ({
  id: place.id, title: place.title, body: place.body, kind: 'door', speaker: 'hero', weight: 0, repeat: 'once',
  when: [{ c: 'age', min: place.age, max: place.age }, { c: 'island', is: [place.island] },
    { c: 'sea', is: [place.sea] }, { c: 'flag', id: KUMA_MET, has: false }],
  doors: [
    { label: '들것이 빠져나갈 때까지 쿠마의 앞을 막는다', hint: '장갑을 벗은 손이 닿기 전에 길을 확보한다', danger: true,
      fx: [{ op: 'log', text: '마지막 들것을 등 뒤로 보내고 혼자 길 가운데 섰다. 쿠마가 빈손을 들어 올렸다.', weight: 'heavy' }, { op: 'kumaFight' }] },
    { label: '들것 한쪽을 잡고 옆길로 빠져나간다', hint: '부상자를 데리고 쿠마와 거리를 벌린다',
      fx: [{ op: 'log', text: '들것이 기울지 않도록 걸음을 맞췄다. 뒤돌아봤을 때에는 큰 발자국만 남아 있었다.', weight: 'light' }, { op: 'flag', id: KUMA_MET }] },
  ],
}));

// 직업·도제 경험을 먼저 반영하고, 그 다음으로 꿈과 수련 갈래를 본다. 저장을 다시 열어도 결과가 같다.
export function kumaDestination(s: Life5) {
  const path = s.growth.path;
  const dream = s.dream?.id;
  let island = '루스카이나';
  if (s.hero.standing === 'shipwright') island = '벌지모아';
  else if (s.flags.includes('medicApprentice') || s.tried.includes('rev_field_medic#0')) island = '토리노 왕국';
  else if (s.flags.includes('chartSkill') || dream === 'worldEnd') island = '웨더리아';
  else if (dream === 'pirateKing') island = '루스카이나';
  else if (dream === 'bestSword' || path === 'sword') island = '쿠라이가나';
  else if (path === 'gun') island = '보인 열도';
  else if (path === 'fist') island = '카마바카 왕국';
  return trainingSite(island)!;
}

export const landingTrace: Record<string, string> = {
  rusukaina: '부러진 나뭇가지 위로 우박이 튀었다. 물가 너머에서 쿠자의 순찰선이 이쪽을 살피고 있었다.',
  kuraigana: '무너진 성문 옆에 발바닥 모양의 구덩이가 패였다. 잔해 위에 앉은 원숭이가 손을 짚고 일어서는 동작을 그대로 따라 했다.',
  boin: '몸을 받아 낸 잎이 기울기 시작했다. 가장자리에서 표본을 모으던 사람이 사다리 쪽으로 손짓했다.',
  weatheria: '발밑이 흙인데 구름은 눈 아래에 있었다. 관측반이 넘어진 풍향계를 일으켜 세우고 다친 데가 없는지 살폈다.',
  kamabakka: '분홍빛 모래에 떨어지자 냄비를 든 요리사가 뛰어나왔다. 모래를 털고 그를 따라가니 긴 식탁에 빈자리가 있었다.',
  torino: '거대한 새가 일으킨 바람에 몇 번이나 뒤집힌 뒤, 큰 나무 아래의 잎더미에 내려앉았다.',
  baldimore: '눈밭에 패인 자국 앞에서 우편 썰매가 멈췄다. 정비공이 일으켜 주며 난로가 있는 작업장을 가리켰다.',
};
