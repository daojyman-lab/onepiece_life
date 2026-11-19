import type { Cond, Fx, Turning } from '../../core/types';
import { V } from '../balance';
import { kid } from './childhood';
import { GROWN, chose, st } from './paths';

const onWatch = st('pirate', 'warlord', 'bountyHunter', 'revolution');
const ashore: Cond = { c: 'ashore' };
const ports: Cond = { c: 'island', is: ['후샤 마을', '시럽 마을', '코코야시 마을', '오렌지 마을', '셸스 타운', '로그타운', '워터 세븐', '워터 세븐 뒷골목', '시프트 역', '자야', '샤본디 제도', '드레스로자'] };
const listener = '어릴 적 풍차고래 이야기를 들은 아이';
const author = '{person:어릴 적 풍차고래 이야기를 들은 아이}';
const knowsListener: Cond = { c: 'person', relation: listener, has: true };
const log = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const timeline = (text: string): Fx => ({ op: 'timeline', text });
const D = V.value.door;

export const LIFE_AT_SEA: Turning[] = [
  {
    id: 'aboard_last_fish', kind: 'door', repeat: { years: 1 }, weight: 14, speaker: 'hero', needs: ['ship', 'crew'],
    when: [onWatch, { c: 'watchMeal', stage: 'first' }],
    title: '한 사람 늦은 저녁', body: '갑판에서 갓 잡은 생선을 구웠다. 불판을 치울 무렵 교대를 마친 {firstWatch}이(가) 내려와 젓가락을 들었다. 큰 접시에는 머리와 가시만 남았다. {name}의 그릇엔 아직 손대지 않은 꼬리 쪽 살이 한 토막 있었다.',
    doors: [
      { label: '남겨 둔 생선 꼬리를 반으로 나눈다', hint: '아직 따뜻할 때 둘이 먹는다', meal: true,
        fx: [log('말없이 꼬리 반쪽을 밀어 주자 {firstWatch}이(가) 자리를 당겨 앉았다. 두 사람이 살을 다 발라 먹고 나서야 불판을 씻었다.'), { op: 'watchMeal', action: 'share' }] },
      { label: '불씨가 남았을 때 생선을 한 마리 더 굽는다', hint: '불판을 도로 올린다', meal: true,
        fx: [log('불판에 작은 생선을 한 마리 더 올렸다. {firstWatch}은(는) 빈속에 기다리기는 싫다며 남은 밥부터 한술 떴다.'), { op: 'watchMeal', action: 'close' }] },
      { label: '젓가락을 내려놓고 다음 끼니의 교대 순서를 정한다', hint: '망꾼도 식사 시간에 내려올 수 있게 한다', values: { dominion: D },
        fx: [log('“내일은 내가 먼저 먹고 올라갈게. 그때 내려와.” {firstWatch}이(가) 고개를 끄덕였다. 오늘 남은 생선은 한 접시에 놓고 같이 먹었다.'), { op: 'watchMeal', action: 'close' }] },
    ],
  },
  {
    id: 'aboard_covered_plate', kind: 'door', repeat: { years: 1 }, weight: 30, speaker: 'hero', needs: ['ship', 'crew'],
    when: [onWatch, { c: 'watchMeal', stage: 'shelf' }],
    title: '한 접시 더', body: '고기 냄새를 맡은 사람들이 배 부엌에 모였다. 의자가 하나 비어 있다. 오늘도 첫 당직은 {firstWatch}의 차례였다. 큰 접시에 고기를 쏟으려는데 지난번에 불판 앞에서 생선 꼬리를 반 나누던 일이 떠올랐다.',
    doors: [
      { label: '당직 몫부터 덜어 찬장에 넣는다', hint: '접시 위에 그릇 하나를 엎어 둔다', meal: true,
        fx: [log('교대하고 내려온 {firstWatch}에게 찬장을 가리켰다. 그날부터 상을 차리는 사람은 당직표를 먼저 보고, 자리가 비면 그 몫을 덜어 두었다.'), { op: 'watchMeal', action: 'reserve' }] },
      { label: '올라가서 망을 대신 보고 먼저 먹고 오라고 한다', hint: '오늘은 돌아가며 따뜻할 때 먹는다',
        fx: [log('{firstWatch}이(가) 빈 접시를 돌려주러 올라올 때까지 뱃전에서 망을 봤다. 그제야 자리를 바꿔 남은 고기를 먹었다.'), { op: 'watchMeal', action: 'close' }] },
    ],
  },
  {
    id: 'aboard_watch_remembered', kind: 'door', repeat: { years: 1 }, weight: 36, speaker: 'hero', needs: ['ship', 'crew'],
    when: [onWatch, { c: 'watchMeal', stage: 'nextWatch' }],
    title: '“그건 놔둬.”', body: '늦은 저녁, 누군가 찬장을 열어 덮어 둔 접시를 꺼내려 했다. {firstWatch}이(가) 설거지를 하다 말고 고개를 들었다. “그건 놔둬. 당직 거야.” 오늘 위에 있는 사람은 {nextWatch}였다.',
    doors: [
      { label: '남은 국도 데워 둔다', hint: '교대가 끝나면 같이 내놓는다',
        fx: [log('{nextWatch}이(가) 내려와 덮개를 들었다. 그 옆에 국을 놓아 주는 동안 {firstWatch}은(는) 마저 그릇을 씻었다.'), { op: 'watchMeal', action: 'passOn' }] },
      { label: '그 접시는 두고 빈 그릇만 걷는다', hint: '당직자가 자기 몫을 찾게 둔다',
        fx: [log('늦게 내려온 {nextWatch}은(는) 곧장 찬장을 열어 접시를 꺼냈다. 이제는 어디에 두는지 알려 줄 필요도 없었다.'), { op: 'watchMeal', action: 'passOn' }] },
    ],
  },
  {
    id: 'child_windmill_whale', kind: 'door', repeat: 'once', weight: 11, speaker: 'hero',
    when: [...kid(7, 13), ashore, ports],
    title: '고래 등에 달린 것', body: '물고기 그림으로 흙바닥을 가득 채운 또래 아이가 막대기를 내밀었다. “고래도 그릴 줄 알아?” 큼직한 등을 그리고 나니 왠지 허전했다. 막대기 끝으로 풍차 날개 네 장을 덧그렸더니 아이 눈이 동그래졌다. “진짜 이런 고래가 있어?”',
    doors: [
      { label: '등의 풍차가 돌면 고래가 숨을 쉰다고 큰소리친다', hint: '아이는 그 말을 믿고 그림을 수첩에 옮긴다', fx: [
        { op: 'person', kind: 'ally', relation: listener },
        log('“내가 봤어. 저만한 게 돌아가더라.” 바람 없는 날에는 어떡하냐고 묻자 {name}은(는) 고래가 입으로 후 불면 된다고 했다. 아이는 웃더니 그림 밑에 제 이름을 적었다. {person:어릴 적 풍차고래 이야기를 들은 아이}.'),
        timeline(`${author}에게 등에 풍차가 달린 고래를 봤다고 허풍을 떨었다`)] },
      { label: '방금 지어낸 고래라고 털어놓는다', hint: '빈자리에 각자 상상한 물고기를 마저 그린다',
        fx: [log('아이는 그럼 자기 물고기에는 빵집을 차리겠다고 했다. 둘은 굴뚝에서 거품이 나오는 그림까지 그리고 손에 묻은 흙을 털었다.')] },
      { label: '지어낸 고래라고 알려 주고 유리구슬 한 알에 그림을 그려 준다', hint: '아이가 원하는 고래를 종이에 그려 바꾼다', values: { greed: D },
        fx: [log('아이는 파란 유리구슬을 내놓으며 풍차 대신 물레방아를 그려 달라고 했다. 종이를 받아 든 아이가 대뜸 물었다. “그럼 이 방앗간에선 생선가루가 나와?”')] },
    ],
  },
  {
    id: 'letter_windmill_whale', kind: 'door', repeat: 'once', weight: 19, speaker: 'hero',
    when: [st(...GROWN), ashore, ports, chose('child_windmill_whale', 0, 7), knowsListener, { c: 'turningSeen', id: 'book_windmill_whale', has: false }],
    title: '봉투에서 나온 꼬리 셋', body: `우편물 사이에 ${author}의 이름이 적힌 봉투가 있었다. 안에는 고래 꼬리 그림이 세 장 들어 있었다. “처음엔 다 같은 놈인 줄 알았어. 무늬를 보니 셋이 다르더라. 풍차 달린 녀석은 아직 못 봤어.”`,
    doors: [
      { label: '풍차는 지어낸 말이었다고 답장을 쓴다', hint: '세 장의 꼬리 그림은 잘 받았다고 덧붙인다',
        fx: [log('한참 펜을 쥐고 있다가 그날 막대기로 풍차를 덧그린 얘기를 썼다. 마지막 줄에는 세 번째 꼬리에 난 흉터가 뭔지 물었다.')] },
      { label: '다음에는 고래가 숨 쉬러 올라오는 모습도 그려 달라고 쓴다', hint: '종이를 한 장 덧대 그림이 구겨지지 않게 편다',
        fx: [log('세 꼬리 중 어느 게 가장 자주 보이냐고 물었다. 답장을 부치고 돌아와 그림을 다시 펼쳐 보고서야 첫 번째 꼬리의 작은 흰 점을 찾았다.')] },
    ],
  },
  {
    id: 'book_windmill_whale', kind: 'door', repeat: 'once', weight: 30, speaker: 'hero',
    when: [st(...GROWN), ashore, ports, knowsListener, chose('child_windmill_whale', 0, 24)],
    title: '《풍차고래를 찾아서》', body: `항구 서점 창가에 《풍차고래를 찾아서》라는 책이 놓여 있었다. 저자는 ${author}. 그림은 마흔세 종째에서 끝났다. 등에 풍차를 단 고래는 한 마리도 없었다. 첫 장을 다시 펴자 손글씨를 본뜬 문장이 보였다. “처음 바다를 궁금하게 해 준 허풍쟁이에게.”`,
    recall: [{ when: [chose('letter_windmill_whale', 1, 0)], text: '고래가 숨을 뿜는 장에 낯익은 꼬리가 있었다. 오래전 편지에서 봤던 그 작은 흰 점까지 그대로였다.' },
      { when: [chose('letter_windmill_whale', 0, 0)], text: '세 번째 꼬리의 흉터를 확대한 그림도 있었다. 여백에는 짧게 한 줄이 적혀 있었다. “옛 친구가 편지로 물은 자리.”' }],
    doors: [
      { label: '책방 주인에게 어릴 적 흙바닥 그림 이야기를 해 준다', hint: '헌사 속 허풍쟁이가 누구인지 밝힌다',
        fx: [log('책방 주인은 바람 없는 날엔 고래가 제 입으로 풍차를 분다는 대목에서 웃었다. 그러다 헌사에 손가락을 얹더니 계산대 너머로 {name}의 얼굴을 한 번 더 보았다.'), timeline(`${author}의 고래 도감에서 어릴 적 제 허풍을 다시 만났다`)] },
      { label: '창가에 앉아 마흔세 번째 고래까지 천천히 읽는다', hint: '이름과 그림을 하나씩 맞춰 본다',
        fx: [log('해가 기울었을 때는 꼬리 모양만 보고도 처음 몇 종을 가릴 수 있었다. 마지막 장의 작은 글씨까지 읽고 책을 두 손으로 덮었다.'), timeline(`어릴 적 풍차고래 이야기를 듣던 ${author}의 도감을 끝까지 읽었다`)] },
      { label: '책방 주인과 판매 몫을 정하고 부두에 가판을 편다', hint: '고래 구경 배를 기다리는 손님들에게 책을 판다', values: { greed: D },
        fx: [log('“저 꼬리를 보시면 이 장을 펴세요.” 배를 기다리던 손님 둘이 도감을 한 권씩 샀다. 저녁에 책방으로 돌아와 주인과 이날 몫을 나눴다.'), { op: 'money', add: 1200 }] },
    ],
  },
];
