// v7 항해의 목표 · 인연의 약속: 인생에서 중요한 사람과 나눈 약속이 그 인생의 목표가 된다.
// 꿈의 서약(data/dream-vows.ts)이 인생의 북극성이라면, 약속은 그 곁에서 길을 끄는 작은 별이다.
// 약속은 core/goals.ts가 때가 되면 장면(PROMISE_TURNINGS)으로 묻고, 해마다 지켰는지 본다.
// {promisee}: 약속을 나눈 사람의 이름. 글은 숫자를 쓰지 않는다 (숫자는 기록 한 줄 끝에 붙는다).
import type { DreamCheck } from './dream-vows';
import type { StatKey, Turning, ValueId } from '../core/types';

/** 약속을 나눌 사람의 갈래 */
export type PromiseWho = 'sibling' | 'parent' | 'grandparent' | 'master' | 'friend' | 'rival' | 'crew' | 'spouse';
/** 목표가 인생을 끄는 방향: 활동의 기울기 · 사건의 빈도 · 선택지의 표시가 이것을 본다 (core/goals.ts) */
export type GoalFocus = 'train' | 'fight' | 'sea' | 'fame' | 'wealth' | 'study' | 'bond';

export interface PromiseDef {
  id: string;
  who: PromiseWho;
  /** 이 나이 사이에만 약속의 장면이 온다 */
  age: [number, number];
  /** 장면이 오기 위한 조건 (모두) */
  offer?: DreamCheck[];
  /** 인물 칸의 한 줄: '바다 건너까지 이름이 들리게 한다' */
  words: string;
  /** 목표를 이룬 조건 (모두) */
  goal: DreamCheck[];
  /** 약속한 뒤 적어도 이만큼 해가 지나야 지킨 것으로 본다 */
  years?: number;
  /** 화면의 목표 문구 (진행 막대 옆) */
  goalText: string;
  /** 지키면 오르는 능력치 */
  stat: StatKey;
  focus: GoalFocus[];
  /** 그 사람이 세상을 떠나면 지킬 수 없는 약속인가 (아니면 유언이 되어 남는다) */
  bound?: boolean;
  scene: { title: string; body: string; yes: [string, string]; yesValues: Partial<Record<ValueId, number>>; no: [string, string] };
  /** 지킨 해의 기록 */
  kept: string;
  /** 그 사람이 떠난 뒤에 지킨 해의 기록 */
  keptLate: string;
  /** 지킬 수 없게 된 해의 기록 (bound만) */
  lost?: string;
}

const SEA_LIFE = ['pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp'] as const;
const LEFT_HOME: DreamCheck = { k: 'any', of: [{ k: 'standing', is: [...SEA_LIFE] }, { k: 'islands', min: 1 }] };
const MARTIAL = ['fist', 'sword', 'polearm', 'blunt', 'gun'] as const;

export const PROMISES: PromiseDef[] = [
  {
    id: 'sib_guard', who: 'sibling', age: [7, 13],
    words: '지켜 줄 수 있을 만큼 강해진다', goalText: '무술 두 번째 경지 · 약속한 지 3년',
    goal: [{ k: 'tier', branch: [...MARTIAL], min: 2 }], years: 3, stat: 'str', focus: ['train', 'fight'],
    scene: {
      title: '지붕 위의 약속',
      body: '{promisee}이(가) 무릎을 끌어안고 물었다. 바다 너머에는 무서운 사람들만 사느냐고. 대답 대신 주먹을 쥐어 보였다.',
      yes: ['"내가 지켜 줄 만큼 강해질게."', '새끼손가락을 걸었다'], yesValues: { loyalty: 2, dominion: 1 },
      no: ['"그런 건 어른들이 알아서 해."', '지붕에서 먼저 내려왔다'],
    },
    kept: '{promisee}에게 지켜 주겠다고 한 말이 더는 허풍이 아니게 되었다. 지붕 위에서 건 새끼손가락이 떠올랐다.',
    keptLate: '지켜 주겠다던 {promisee}은(는) 이제 없다. 그래도 그날 건 새끼손가락만큼은 끝까지 지켰다.',
  },
  {
    id: 'sib_name', who: 'sibling', age: [13, 20],
    words: '바다 건너까지 이름이 들리게 한다', goalText: '고향 밖에서 이름값 30',
    goal: [LEFT_HOME, { k: 'fame', min: 30 }], stat: 'wil', focus: ['fame', 'sea'],
    scene: {
      title: '부두 끝의 약속',
      body: '{promisee}이(가) 부두 끝에 앉아 수평선을 보며 말했다. 멀리 가더라도 소식은 들려 달라고. 편지 말고, 소문으로.',
      yes: ['"신문에 내 이름이 나오면, 그게 내 편지야."', '바다 건너까지 이름을 떨치겠다'], yesValues: { romance: 2, ambition: 1 },
      no: ['"소식 같은 거 없어도 잘 살 거야."', '대답을 미뤘다'],
    },
    kept: '어느 항구의 신문에 실린 이름을 {promisee}도 읽었을 것이다. 부두 끝에서 한 약속은 소문이 되어 돌아갔다.',
    keptLate: '소문을 들어 줄 {promisee}은(는) 이제 없다. 그래도 그 이름은 바다 건너까지 닿았다.',
  },
  {
    id: 'parent_name', who: 'parent', age: [14, 24],
    words: '어디서든 부끄럽지 않은 이름을 얻는다', goalText: '이름값 20 · 약속한 지 4년',
    goal: [{ k: 'fame', min: 20 }], years: 4, stat: 'vit', focus: ['fame', 'bond'],
    scene: {
      title: '현관 앞의 약속',
      body: '{promisee}은(는) 짐을 꾸리는 손을 오래 바라보다 한마디만 했다. 어디서 무엇을 하든, 이름을 부끄럽게 만들지만 말라고.',
      yes: ['"부끄럽지 않은 이름으로 돌아올게요."', '고개를 깊이 숙였다'], yesValues: { loyalty: 2, justice: 1 },
      no: ['"이름 같은 건 아무래도 좋아요."', '문을 나섰다'],
    },
    kept: '고향에 닿은 소문을 {promisee}이(가) 들었다고 했다. 이름을 부끄럽게 만들지 않겠다던 약속을 지켰다.',
    keptLate: '{promisee}은(는) 그 소문을 듣지 못했다. 그래도 현관 앞에서 한 약속은 끝내 지켰다.',
  },
  {
    id: 'parent_roof', who: 'parent', age: [12, 25], offer: [{ k: 'wealthMax', is: 'common' }],
    words: '번 돈으로 집 지붕부터 고쳐 드린다', goalText: '20만 베리를 모은다',
    goal: [{ k: 'money', min: 200_000 }], stat: 'luk', focus: ['wealth', 'bond'],
    scene: {
      title: '비 새는 지붕 아래의 약속',
      body: '밤새 빗물을 받던 양동이를 비우며 {promisee}이(가) 웃었다. 이 집도 오래 버텼다고. 그 웃음이 이상하게 오래 남았다.',
      yes: ['"내가 돈 벌면 지붕부터 고쳐 드릴게요."', '양동이를 대신 들었다'], yesValues: { loyalty: 1, greed: 2 },
      no: ['"비 새는 것도 나름 운치 있네요."', '농담으로 넘겼다'],
    },
    kept: '모은 돈을 고향으로 부쳤다. 새 지붕 아래에서 {promisee}이(가) 그날처럼 웃었다는 편지가 왔다.',
    keptLate: '지붕을 고쳐 드릴 {promisee}은(는) 이제 없다. 그래도 모은 돈으로 그 집 지붕만큼은 새로 얹었다.',
  },
  {
    id: 'grand_sea', who: 'grandparent', age: [8, 16],
    words: '옛이야기 속 위대한 항로를 제 눈으로 본다', goalText: '위대한 항로 전반에 닿는다',
    goal: [{ k: 'sea', min: 3 }], stat: 'spd', focus: ['sea'],
    scene: {
      title: '아궁이 앞의 약속',
      body: '{promisee}의 옛이야기는 늘 같은 곳에서 끝났다. 나침반이 미쳐 도는 바다, 거기까지 가 본 사람은 마을에 아무도 없다고.',
      yes: ['"내가 가서 보고 와서 들려줄게."', '이야기의 끝을 이어 주겠다'], yesValues: { romance: 2, freedom: 1 },
      no: ['"그런 바다가 진짜 있을 리 없잖아."', '불씨를 뒤적였다'],
    },
    kept: '나침반이 미쳐 도는 바다에 닿았다. {promisee}의 옛이야기가 끝나던 자리에서, 이제 내 이야기가 시작된다.',
    keptLate: '이야기를 들려줄 {promisee}은(는) 이제 없다. 그래도 옛이야기가 끝나던 바다에 끝내 닿았다.',
  },
  {
    id: 'master_surpass', who: 'master', age: [10, 34],
    words: '언젠가 스승을 넘어선다', goalText: '무술 세 번째 경지 · 종합 전투력 C급',
    goal: [{ k: 'tier', branch: [...MARTIAL], min: 3 }, { k: 'rating', min: 240 }], stat: 'str', focus: ['train', 'fight'],
    scene: {
      title: '닳은 목검의 약속',
      body: '수련이 끝난 저녁, {promisee}은(는) 닳은 목검을 내려다보며 말했다. 제자가 스승을 넘지 못하면 그 가르침은 거기서 끝나는 거라고.',
      yes: ['"언젠가 반드시 넘어서겠습니다."', '목검을 고쳐 쥐었다'], yesValues: { dominion: 2, ambition: 1 },
      no: ['"스승님을 넘을 생각은 없습니다."', '고개를 저었다'],
    },
    kept: '처음으로 {promisee}의 칼끝을 읽었다. 스승은 졌다면서 그날 가장 크게 웃었다.',
    keptLate: '넘어서는 모습을 보여 줄 {promisee}은(는) 이제 없다. 그래도 닳은 목검의 약속은 끝내 지켰다.',
  },
  {
    id: 'friend_big', who: 'friend', age: [12, 20],
    words: '다시 만날 땐 큰 사람이 되어 있는다', goalText: '이름값 25',
    goal: [{ k: 'fame', min: 25 }], stat: 'wil', focus: ['fame'],
    scene: {
      title: '갈림길의 약속',
      body: '갈림길에서 {promisee}이(가) 손을 내밀었다. 다음에 만날 때 누가 더 큰 사람이 되어 있는지 내기하자고.',
      yes: ['"내기는 내가 이길 거야."', '손을 맞잡았다'], yesValues: { ambition: 2, loyalty: 1 },
      no: ['"그런 내기 안 해."', '먼저 등을 돌렸다'],
    },
    kept: '어느 항구에서 {promisee}의 편지가 닿았다. 내기는 네가 이겼다고, 한 줄만 적혀 있었다.',
    keptLate: '내기의 답을 들을 {promisee}은(는) 이제 없다. 그래도 갈림길에서 한 내기만큼은 이겼다.',
  },
  {
    id: 'rival_win', who: 'rival', age: [10, 40], offer: [{ k: 'flag', any: ['rivalDuel:lost'] }],
    words: '다음엔 반드시 이긴다', goalText: '맞수를 이긴다',
    goal: [{ k: 'flag', any: ['rivalDuel:beaten'] }], stat: 'str', focus: ['train', 'fight'], bound: true,
    scene: {
      title: '패배 뒤의 약속',
      body: '{promisee}은(는) 먼지를 털며 내려다보았다. 분하면 강해지라고, 몇 번이든 상대해 주겠다고.',
      yes: ['"다음엔 반드시 이긴다."', '바닥을 짚고 일어섰다'], yesValues: { dominion: 2, ambition: 1 },
      no: ['"너랑 겨루는 건 이걸로 끝이야."', '등을 돌렸다'],
    },
    kept: '{promisee}을(를) 끝내 이겼다. 패배 뒤에 한 약속이 오늘에야 이루어졌다.',
    keptLate: '{promisee}을(를) 이겼다.',
    lost: '이기겠다고 약속한 {promisee}은(는) 이제 없다. 그 약속은 영영 이룰 수 없게 되었다.',
  },
  {
    id: 'rival_sea', who: 'rival', age: [15, 30],
    words: '바다 위에서 다시 만나도 지지 않는다', goalText: '종합 전투력 B급',
    goal: [{ k: 'rating', min: 500 }], stat: 'spd', focus: ['train', 'sea'],
    scene: {
      title: '먼저 떠나는 맞수',
      body: '{promisee}은(는) 먼저 바다로 나간다고 했다. 다음에 만날 때 시시해져 있으면 상대도 안 해 주겠다고.',
      yes: ['"그때도 내가 이긴다."', '주먹을 맞부딪쳤다'], yesValues: { dominion: 1, freedom: 1, ambition: 1 },
      no: ['"잘 가. 나는 내 길을 갈게."', '손만 흔들었다'],
    },
    kept: '이제 어느 바다에서 {promisee}을(를) 만나도 지지 않는다. 먼저 떠나던 등에 대고 한 말을 지켰다.',
    keptLate: '{promisee}은(는) 이제 없다. 그래도 그 등에 대고 한 말만큼은 지켰다.',
  },
  {
    id: 'crew_newworld', who: 'crew', age: [17, 45], offer: [{ k: 'standing', is: ['pirate', 'warlord', 'bountyHunter', 'revolution'] }, { k: 'crew', min: 2 }],
    words: '모두 함께 신세계까지 간다', goalText: '동료 둘과 신세계에 닿는다',
    goal: [{ k: 'sea', min: 5 }, { k: 'crew', min: 2 }], stat: 'wil', focus: ['sea', 'fight', 'bond'],
    scene: {
      title: '돛대 아래의 약속',
      body: '밤 당번을 서던 {promisee}이(가) 돛대에 기대 물었다. 이 배로 어디까지 갈 수 있을 것 같으냐고.',
      yes: ['"다 같이 신세계까지."', '모두의 잔에 술을 따랐다'], yesValues: { loyalty: 2, freedom: 1 },
      no: ['"갈 수 있는 데까지."', '대답을 흐렸다'],
    },
    kept: '황제들의 바다에 닿은 밤, {promisee}이(가) 돛대 아래에서 잔을 들었다. 다 같이 오자던 약속을 지켰다.',
    keptLate: '{promisee}은(는) 끝까지 함께 오지 못했다. 그래도 남은 동료들과 그 바다에 닿아 빈 잔을 하나 채웠다.',
  },
  {
    id: 'spouse_old', who: 'spouse', age: [20, 50],
    words: '함께 늙어 간다', goalText: '약속한 지 10년, 둘 다 살아서',
    goal: [{ k: 'age', min: 0 }], years: 10, stat: 'vit', focus: ['bond'], bound: true,
    scene: {
      title: '등불 아래의 약속',
      body: '등불을 끄기 전에 {promisee}이(가) 말했다. 큰일 같은 건 바라지 않으니, 그저 같이 늙어 가자고.',
      yes: ['"같이 늙어 가자."', '등불을 끄지 않고 오래 마주 앉았다'], yesValues: { peace: 2, loyalty: 1 },
      no: ['"바다는 약속을 지켜 주지 않아."', '창밖을 보았다'],
    },
    kept: '어느새 {promisee}의 머리에도 흰 것이 섞였다. 같이 늙어 가자던 약속을 지금도 지키는 중이다.',
    keptLate: '{promisee}과(와) 늙어 갔다.',
    lost: '같이 늙어 가자던 {promisee}은(는) 먼저 떠났다. 등불 아래의 약속은 혼자 남았다.',
  },
];

export const PROMISE_BY_ID: Record<string, PromiseDef> = Object.fromEntries(PROMISES.map((p) => [p.id, p]));
export const PROMISE_TURNING_PREFIX = 'promise_';
export const promiseTurningId = (id: string) => `${PROMISE_TURNING_PREFIX}${id}`;

/** 약속의 장면: 가중치 0이라 저절로 뽑히지 않고, core/goals.ts가 때가 되면 연다 */
export const PROMISE_TURNINGS: Turning[] = PROMISES.map((p) => ({
  id: promiseTurningId(p.id),
  kind: 'moment' as const,
  when: [], weight: 0, repeat: 'once' as const,
  speaker: 'hero' as const,
  title: p.scene.title, body: p.scene.body,
  doors: [
    { label: p.scene.yes[0], hint: p.scene.yes[1], values: p.scene.yesValues, fx: [{ op: 'promise', id: p.id }] },
    { label: p.scene.no[0], hint: p.scene.no[1], values: { freedom: 1 }, fx: [{ op: 'promise', id: null }] },
  ],
}));
