import { ISSUE_AT, WORLD_HISTORY, hasWorldEvent, historyTick, worldTick, type WorldEventId } from '../data/world-history';
import { V } from '../data/balance';
import { logLine } from './log';
import type { Life5, NewsIssue } from './types';

export const PRESS_LIMIT = 80;
type Copy = Pick<NewsIssue, 'title' | 'body'>;

// 지역지의 단신. 시기에 따라 사라지는 제도나 인물을 일반 기사에 섞지 않는다.
const PORT_COPY: Copy[] = [
  { title: '등대지기들이 모은 항로 정정표', body: '이번 항구 통신에는 여울에 뜬 표지와 등대 불빛을 구별하는 그림이 실렸다. 마지막 장에는 해도에 고쳐 적을 자리가 한 칸 비어 있다.' },
  { title: '부두 장터, 얼음값까지 적은 생선 시세표', body: '생선 이름 옆에 얼음 한 상자 값이 따로 적혔다. 먼 섬까지 갈 배라면 생선값보다 얼음값을 먼저 보라는 경매사의 말도 실렸다.' },
  { title: '야간 우편선이 싣는 편지들', body: '봉투에 섬 이름만 적어 배달되지 못한 편지가 우체국에 쌓였다. 우편국은 다음 배가 뜨기 전까지 선착장이나 마을 이름을 덧써 달라고 부탁했다.' },
  { title: '항구 진료소의 뱃사람 검진일', body: '선원들이 약 상자째 들고 올 수 있도록 진료대를 부두로 옮겼다. 의사는 물에 젖어 글씨가 번진 약병부터 골라 냈다.' },
  { title: '조선소 소식, 물때에 맞춰 여는 도크', body: '수리 차례를 기다리는 배들을 위해 도크 앞에 물때표가 걸렸다. 선박의 길이와 흘수를 미리 적어 보내면 목수가 받침목을 먼저 골라 놓는다.' },
  { title: '항해사들이 보내온 안개 신호', body: '뱃고동을 듣고도 상대 배가 어느 쪽인지 몰랐다는 독자 편지에 항해사가 답했다. 지면 한쪽을 통째로 써서 안개 속 신호가 오가는 순서를 그렸다.' },
];

function delivery(s: Life5): string {
  if (s.hero.standing === 'prisoner') return '간수가 펼친 신문에 뉴스 쿠의 배달 인장이 찍혀 있었다.';
  if (s.passage) return '뉴스 쿠가 지나가는 배의 갑판에 신문을 떨어뜨렸다.';
  if (['어인섬', '어인가', '류구 왕국', '바다의 숲'].includes(s.hero.island)) return '뉴스 쿠가 지상 항구에 부린 신문이 코팅선을 타고 어인섬에 들어왔다.';
  if (['와노쿠니', '쿠리', '하나노미야코', '에비스 마을', '스카이피아', '엔젤섬', '샨디아 마을'].includes(s.hero.island)) return '같은 날, 바깥 바다의 정기선을 따라 뉴스 쿠가 신문을 실어 날랐다.';
  return '뉴스 쿠가 우편 가방을 열어 오늘 자 신문을 내려놓았다.';
}

/** 기사와 배달 로그는 같은 시점에 하나씩 남긴다. logId로 읽기 속도보다 먼저 제목이 보이는 것을 막는다. */
export function publishIssue(s: Life5, issue: Omit<NewsIssue, 'age' | 'part' | 'logId'>, announcement?: string): void {
  const archive = s.news ??= [];
  if (archive.some(old => old.id === issue.id)) return;
  logLine(s, announcement ?? `${delivery(s)} 「${issue.title}」`, issue.kind === 'local' ? 'light' : 'heavy', 'world');
  archive.push({ ...issue, age: s.age, part: worldTick(s) % V.partsPerYear, logId: s.log[s.log.length - 1].id });
  if (archive.length > PRESS_LIMIT) archive.splice(0, archive.length - PRESS_LIMIT);
}

export function birthEdition(s: Life5): void {
  s.pressTick = worldTick(s);
  publishIssue(s, { id: 'birth-edition', kind: 'local', title: `${s.hero.town}에서 온 항구 통신`,
    body: `${s.hero.town}에서 건너온 우편낭이 신문사에 도착했다. 편지 묶음 겉장에는 이곳으로 보내는 답장을 어느 배에 맡기면 되는지 적혀 있다.` });
}

/** 진행되는 분기에만 발행한다. 전성기 두 번째 바퀴·이야기 사이의 며칠·다시 열기로 신문이 쌓이지 않는다. */
export function deliverEdition(s: Life5): void {
  const tick = worldTick(s);
  if (s.pressTick !== undefined && tick <= s.pressTick) return;
  s.pressTick = tick;
  reconcileWorld(s);
  const id = ISSUE_AT.get(tick);
  if (id) {
    const { kind, title, body } = WORLD_HISTORY[id];
    publishIssue(s, { id, kind, title, body });
  } else if (s.part === 0) {
    const i = (s.age + (s.rng.seed >>> 0)) % PORT_COPY.length;
    publishIssue(s, { id: `port:${s.age}`, kind: 'local', ...PORT_COPY[i] });
  }
}

const FATES = new Map<string, { event: WorldEventId; departure?: WorldEventId; leave: string }>([
  ['ace', { event: 'marineford', departure: 'eniesLobby', leave: '에이스가 항구에서 검은수염의 행방을 물었다. 단서를 얻은 그는 혼자 가겠다며 일행과 헤어졌다.' }],
  ['whitebeard', { event: 'marineford', leave: '흰수염이 에이스를 데리러 간다며 자기 깃발 아래로 돌아갔다.' }],
  ['pedro', { event: 'wholeCake', leave: '페드로가 짐을 꾸렸다. 상디를 데리러 가는 이들과 동행하겠다고 했다.' }],
  ['ashura', { event: 'wanoFree', leave: '아슈라 도지가 칼집을 허리에 찼다. 와노의 옛 전우들에게 돌아갈 때라고 했다.' }],
]);

/** 연표에 실재하는 인연만 정리한다. 옛 저장 인생에 작별을 목격했다는 기억을 추가하지 않는다. */
export function reconcileWorld(s: Life5, announce = true): void {
  const tick = worldTick(s);
  for (const p of s.people) {
    const fate = p.alive && p.canon ? FATES.get(p.canon) : undefined;
    if (!fate) continue;
    const end = historyTick(fate.event);
    if (tick >= end) {
      p.alive = false;
      p.age = Math.max(0, p.age - Math.max(0, s.age - WORLD_HISTORY[fate.event].age));
      delete p.crew;
      delete p.tempUntil;
    } else if (tick >= (fate.departure ? historyTick(fate.departure) : end - 1) && p.crew) {
      delete p.crew;
      delete p.tempUntil;
      p.kind = 'ally';
      if (announce) logLine(s, fate.leave, 'heavy', 'life');
    }
  }
  if (s.hero.alive && s.hero.standing === 'warlord' && hasWorldEvent(s, 'reverie')) {
    s.hero.standing = 'pirate';
    s.standingSince = s.age;
    s.timeline.push({ age: s.age, standing: 'pirate', text: '칠무해 제도 폐지로 정부 공인장을 잃고 다시 해적이 되었다' });
  }
}
