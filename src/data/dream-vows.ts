// 꿈의 서약: 꿈을 품을 때 누군가에게(없으면 스스로에게) 약속하고, 그 꿈으로 가는 길목을 하나씩 지날 때마다 강해진다.
// 판정은 core/dream-vow.ts가 해마다 한다. 한 해에 한 길목만 지난다. 마지막 길목은 그 꿈을 이룬 것(core/dreams.ts의 dreamMet)이다.
// name: 인물 칸에 '다음 길목'으로 보이는 말. done: 그 길목을 지난 해의 기록 (장면 한 줄, 숫자는 쓰지 않는다).
import type { Branch, DreamId, Standing, StatKey } from '../core/types';

export type DreamCheck =
  | { k: 'standing'; is: Standing[] }                  // 지금 그 처지
  | { k: 'flag'; any: string[] }                       // 표시 가운데 하나라도
  | { k: 'bounty'; min: number }
  | { k: 'fame'; min: number }
  | { k: 'money'; min: number }
  | { k: 'rank'; min: number }
  | { k: 'tier'; branch: Branch[]; min: number }      // 그 갈래들 가운데 가장 높은 단계
  | { k: 'sea'; min: number }                          // 지금 바다의 깊이 (1 네 바다 · 2 위대한 항로 입구 · 3 전반 · 4 샤본디 · 5 신세계 전반 · 6 후반)
  | { k: 'islands'; min: number; among?: string[] }    // 발을 디딘 섬의 수 (among: 그 섬들 가운데)
  | { k: 'bond'; min: number; at?: number }            // 유대가 at(기본 80) 이상인 살아 있는 사람의 수
  | { k: 'int'; min: number }                          // 타고난 지식(능력치)
  | { k: 'age'; min: number }
  | { k: 'any'; of: DreamCheck[] }                     // 가운데 하나라도
  | { k: 'met' };                                      // 꿈을 이루었다 (마지막 길목)

export interface DreamStage { name: string; done: string; all: DreamCheck[] }
export interface DreamVow {
  /** 약속의 말: "{사람}에게 약속했다. 언젠가 ___." */
  promise: string;
  /** 길목을 지날 때마다 오르는 능력치 */
  stat: StatKey;
  /** 숙련이 오르는 갈래 (없으면 지금 주력 갈래) */
  branch?: Branch[];
  stages: DreamStage[];
}

/** 역사의 본문이나 그 흔적이 남은 섬 (원작: 알라바스타 · 스카이피아 · 어인섬 · 조우 · 와노쿠니 · 홀케이크 · 오하라 · 엘바프 · 에그헤드) */
export const HISTORY_ISLANDS = ['알라바스타 왕국', '스카이피아', '어인섬', '조우', '와노쿠니', '홀케이크 아일랜드', '오하라 옛터', '엘바프', '에그헤드'];
const SEA_LIFE: Standing[] = ['pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp'];
const SETTLED: Standing[] = ['settled', 'retired', 'shipwright'];

/** 바다로 나선 처지이거나 고향 밖의 섬을 밟았다 */
const LEFT_HOME: DreamCheck = { k: 'any', of: [{ k: 'standing', is: SEA_LIFE }, { k: 'islands', min: 1 }] };
const MARINE: DreamCheck = { k: 'standing', is: ['marine', 'cp'] };
const MARTIAL: Branch[] = ['fist', 'sword', 'polearm', 'blunt', 'gun'];

/** 무술 꿈 넷은 같은 길목을 갈래만 바꿔 쓴다 */
const martial = (branch: Branch[], arm: string, title: string, promise: string, stat: StatKey): DreamVow => ({
  promise, stat, branch,
  stages: [
    { name: `${arm} 손에 익힌다`, done: `${arm} 쥔 손에 처음으로 군더더기가 사라졌다. 약속한 길의 첫걸음이었다.`, all: [{ k: 'tier', branch, min: 1 }] },
    { name: `${arm} 제 것으로 만든다`, done: '같은 동작을 수천 번 되풀이한 끝에, 몸이 먼저 길을 기억했다.', all: [{ k: 'tier', branch, min: 2 }] },
    { name: '실력으로 이름을 알린다', done: '처음 보는 사람이 먼저 이름을 불렀다. 그 실력이 소문을 타기 시작했다.', all: [{ k: 'tier', branch, min: 2 }, { k: 'fame', min: 10 }] },
    { name: '한 사람의 경지를 넘어선다', done: '스승의 그림자를 처음으로 넘어섰다. 이제부터는 혼자 길을 내야 한다.', all: [{ k: 'tier', branch, min: 3 }] },
    { name: '위대한 항로의 강자들과 겨룬다', done: '험한 바다의 강자들 사이에서도 물러서지 않았다. 약속이 아직 살아 있었다.', all: [{ k: 'tier', branch, min: 3 }, { k: 'sea', min: 2 }] },
    { name: '이름난 자들의 반열에 든다', done: '이름난 자들과 같은 자리에서 이름이 오르내렸다. 정점이 처음으로 보이기 시작했다.', all: [{ k: 'tier', branch, min: 4 }] },
    { name: '정점의 문턱에 선다', done: '한 번 휘두를 때마다 바다가 숨을 죽였다. 남은 것은 마지막 한 걸음뿐이다.', all: [{ k: 'tier', branch, min: 5 }] },
    { name: title, done: `${title.replace(/된다$/, '되었다')}. 어린 날의 약속이 그대로 이루어졌다.`, all: [{ k: 'met' }] },
  ],
});

export const DREAM_VOWS: Record<DreamId, DreamVow> = {
  pirateKing: {
    promise: '해적왕이 되겠다고', stat: 'wil',
    stages: [
      { name: '바다로 나선다', done: '고향의 지붕들이 수평선 아래로 가라앉았다. 약속한 바다가 눈앞에 펼쳐졌다.', all: [LEFT_HOME] },
      { name: '해적 깃발 아래에 선다', done: '해골 깃발이 머리 위에서 펄럭였다. 이제 돌아갈 길은 없다.', all: [{ k: 'standing', is: ['pirate', 'warlord'] }] },
      { name: '수배서에 이름이 오른다', done: '게시판에 붙은 수배서 속 얼굴을 한참 들여다보았다. 세상이 그 이름을 알기 시작했다.', all: [{ k: 'bounty', min: 10_000_000 }] },
      { name: '위대한 항로에 들어선다', done: '나침반이 제멋대로 도는 바다에 들어섰다. 왕이 되려는 자들이 모두 이 길을 지났다.', all: [{ k: 'sea', min: 2 }] },
      { name: '제 배의 선장이 된다', done: '처음으로 제 배의 키를 잡았다. 작아도 어디로 갈지는 스스로 정한다.', all: [{ k: 'flag', any: ['captain', 'ship'] }] },
      { name: '현상금 1억을 넘긴다', done: '현상금이 1억을 넘었다. 이제는 이름만으로 길을 비켜 주는 자들이 있다.', all: [{ k: 'bounty', min: 100_000_000 }] },
      { name: '신세계에 들어선다', done: '붉은 흙의 대륙 너머, 황제들의 바다에 닿았다. 여기서부터가 진짜다.', all: [{ k: 'sea', min: 5 }] },
      { name: '현상금 3억을 넘긴다', done: '현상금이 3억을 넘었다. 황제들의 귀에도 그 이름이 들어갔다.', all: [{ k: 'bounty', min: 300_000_000 }] },
      { name: '해적왕이 된다', done: '바다의 정점에 섰다. 어린 날 입에 올렸던 그 이름 그대로였다.', all: [{ k: 'met' }] },
    ],
  },
  bestSword: martial(['sword'], '검을', '세계 최강의 검객이 된다', '세계에서 가장 강한 검객이 되겠다고', 'str'),
  bestFist: martial(['fist'], '주먹을', '세계 최강의 무투가가 된다', '맨몸으로 누구보다 강해지겠다고', 'vit'),
  bestWeapon: martial(['polearm', 'blunt'], '무기를', '세계 최강의 병기가가 된다', '이 무기로 정점에 서겠다고', 'str'),
  bestShot: martial(['gun'], '총을', '세계 최고의 저격수가 된다', '세상에서 가장 먼 표적을 맞히겠다고', 'int'),
  marineTop: {
    promise: '해군의 가장 높은 자리에 서겠다고', stat: 'wil',
    stages: [
      { name: '정의를 지킬 힘을 기른다', done: '처음으로 제 힘으로 누군가를 지켜 냈다. 정의에는 힘이 필요하다는 것을 알았다.', all: [{ k: 'any', of: [{ k: 'tier', branch: MARTIAL, min: 1 }, MARINE] }] },
      { name: '해군에 들어간다', done: '갈매기 깃발 아래에서 처음으로 경례했다. 약속한 길의 문이 열렸다.', all: [MARINE] },
      { name: '첫 공을 세운다', done: '처음 세운 공이 보고서에 이름으로 남았다. 작은 한 줄이었지만 오래 들여다보았다.', all: [MARINE, { k: 'fame', min: 5 }] },
      { name: '장교가 된다', done: '어깨에 새 계급장이 달렸다. 이제는 명령을 받는 만큼 명령을 내린다.', all: [MARINE, { k: 'any', of: [{ k: 'rank', min: 1 }, { k: 'flag', any: ['mnOfficer'] }] }] },
      { name: '위대한 항로에서 복무한다', done: '위대한 항로의 지부로 배속되었다. 정의를 시험하는 바다가 시작되었다.', all: [MARINE, { k: 'sea', min: 2 }] },
      { name: '본부가 이름을 기억한다', done: '본부의 회의에서 그 이름이 거론되었다. 위에서 내려다보는 눈이 생겼다.', all: [MARINE, { k: 'fame', min: 60 }] },
      { name: '장성의 자리에 오른다', done: '정의의 두 글자가 새겨진 코트를 어깨에 걸쳤다. 정점이 손 닿을 곳에 있다.', all: [MARINE, { k: 'rank', min: 2 }] },
      { name: '해군의 정점에 선다', done: '정의의 가장 높은 자리에 섰다. 어린 날 어른들 앞에서 했던 말 그대로였다.', all: [{ k: 'met' }] },
    ],
  },
  changeWorld: {
    promise: '이 불공평한 세상을 바꾸겠다고', stat: 'wil',
    stages: [
      { name: '세상의 부당함에 맞선다', done: '처음으로 힘 있는 자 앞에서 고개를 들었다. 작은 반항이었지만 약속의 시작이었다.', all: [{ k: 'any', of: [{ k: 'flag', any: ['revSeed', 'govEnemy', 'mnDefied', 'deserter'] }, { k: 'standing', is: ['revolution'] }] }] },
      { name: '같은 뜻을 품은 이들과 손잡는다', done: '같은 꿈을 꾸는 사람들의 손을 잡았다. 혼자 꾸던 꿈이 모두의 것이 되었다.', all: [{ k: 'standing', is: ['revolution'] }] },
      { name: '정부가 경계하는 이름이 된다', done: '정부의 문서에 그 이름이 붉은 글씨로 적혔다. 세상이 이쪽을 보기 시작했다.', all: [{ k: 'flag', any: ['govEnemy', 'wanted'] }] },
      { name: '한 마을의 사람들을 움직인다', done: '골목에 모인 사람들이 처음으로 같은 말을 했다. 바뀌지 않을 것 같던 것이 흔들렸다.', all: [{ k: 'fame', min: 20 }] },
      { name: '한 나라의 사람들을 움직인다', done: '광장에 모인 사람들이 같은 노래를 불렀다. 불씨가 나라 전체로 번졌다.', all: [{ k: 'fame', min: 60 }] },
      { name: '여러 바다에 이름이 퍼진다', done: '먼 바다의 사람들까지 그 이름을 입에 올렸다. 불씨가 바다를 건너갔다.', all: [{ k: 'fame', min: 150 }] },
      { name: '세계가 두려워하는 이름이 된다', done: '하늘의 높은 곳에서도 그 이름을 두려워했다. 세상을 바꿀 힘이 손에 쥐어졌다.', all: [{ k: 'fame', min: 400 }] },
      { name: '세상을 바꾼다', done: '세상이 조금은 달라졌다. 어린 날 보았던 억울한 얼굴들이 떠올랐다.', all: [{ k: 'met' }] },
    ],
  },
  worldEnd: {
    promise: '세상의 끝을 이 눈으로 보고 오겠다고', stat: 'spd',
    stages: [
      { name: '고향을 떠난다', done: '처음으로 고향이 보이지 않는 바다에 섰다. 지도의 빈칸이 하나씩 줄어들 것이다.', all: [LEFT_HOME] },
      { name: '위대한 항로에 들어선다', done: '세상에서 가장 험하다는 바다에 들어섰다. 끝은 아직 멀었지만 길은 이어져 있다.', all: [{ k: 'sea', min: 2 }] },
      { name: '위대한 항로의 깊은 곳에 닿는다', done: '섬마다 하늘의 색이 달랐다. 해도에 처음 보는 이름이 늘어 갔다.', all: [{ k: 'sea', min: 3 }] },
      { name: '붉은 흙의 대륙 앞에 선다', done: '세계를 가르는 붉은 벽 앞에 섰다. 그 너머를 보겠다고 다시 다짐했다.', all: [{ k: 'sea', min: 4 }] },
      { name: '낯선 섬 세 곳을 밟는다', done: '세 번째 낯선 섬의 모래를 밟았다. 해도의 빈칸이 조금씩 줄어든다.', all: [{ k: 'islands', min: 3 }] },
      { name: '신세계에 들어선다', done: '붉은 흙의 대륙을 넘어 신세계에 닿았다. 바다는 여전히 끝을 보여 주지 않는다.', all: [{ k: 'sea', min: 5 }] },
      { name: '신세계의 끝자락에 닿는다', done: '신세계에서도 가장 먼 바다에 들어섰다. 마지막 섬의 소문이 바람에 실려 왔다.', all: [{ k: 'sea', min: 6 }] },
      { name: '세상의 끝을 본다', done: '마지막 바다를 보았다. 어린 날 지도 끝을 짚던 손가락이 떠올랐다.', all: [{ k: 'met' }] },
    ],
  },
  truth: {
    promise: '세상이 감춘 진실을 알아내겠다고', stat: 'int',
    stages: [
      { name: '책을 파고든다', done: '마을의 책을 거의 다 읽었다. 어디에도 적히지 않은 시대가 있다는 것을 알았다.', all: [{ k: 'int', min: 15 }] },
      { name: '답을 찾아 고향을 떠난다', done: '고향의 책장이 더는 답을 주지 않았다. 답을 찾아 바다로 나섰다.', all: [LEFT_HOME] },
      { name: '역사의 흔적이 남은 섬에 닿는다', done: '아무도 읽지 못하는 글자가 새겨진 돌을 처음으로 보았다. 손끝이 떨렸다.', all: [{ k: 'islands', min: 1, among: HISTORY_ISLANDS }] },
      { name: '옛 글을 읽을 만큼 배운다', done: '서로 다른 섬의 옛이야기가 같은 시대를 가리킨다는 것을 알아보았다.', all: [{ k: 'int', min: 22 }] },
      { name: '두 번째 흔적을 찾는다', done: '두 번째 돌 앞에서 첫 번째 돌의 글자가 겹쳐 보였다. 조각이 이어지기 시작했다.', all: [{ k: 'islands', min: 2, among: HISTORY_ISLANDS }] },
      { name: '세 번째 흔적을 찾는다', done: '세 번째 흔적을 찾았다. 누군가 이 역사를 일부러 지웠다는 것을 알게 되었다.', all: [{ k: 'islands', min: 3, among: HISTORY_ISLANDS }] },
      { name: '감춰진 역사를 읽는다', done: '감춰진 역사의 한 조각을 읽었다. 어린 날 책의 빈칸에 남긴 표시가 떠올랐다.', all: [{ k: 'met' }] },
    ],
  },
  treasure: {
    promise: '평생 쓰고도 남을 보물을 찾겠다고', stat: 'luk',
    stages: [
      { name: '제 손으로 첫 밑천을 모은다', done: '제 손으로 모은 첫 밑천을 세어 보았다. 보물로 가는 길의 첫 동전이었다.', all: [{ k: 'money', min: 30_000 }] },
      { name: '10만 베리를 모은다', done: '주머니가 묵직해졌다. 이제는 큰 거래에도 손이 떨리지 않는다.', all: [{ k: 'money', min: 100_000 }] },
      { name: '30만 베리를 모은다', done: '돈이 돈을 부르는 법을 알게 되었다. 보물의 냄새를 맡을 줄 알게 되었다.', all: [{ k: 'money', min: 300_000 }] },
      { name: '100만 베리를 모은다', done: '처음으로 백만 베리를 손에 쥐었다. 어디에 보물이 있는지 소문이 먼저 들려온다.', all: [{ k: 'money', min: 1_000_000 }] },
      { name: '500만 베리를 모은다', done: '사람들이 돈 냄새를 맡고 먼저 찾아왔다. 섬 하나를 살 날이 머지않았다.', all: [{ k: 'money', min: 5_000_000 }] },
      { name: '바다의 보물을 손에 넣는다', done: '평생 쓰고도 남을 보물을 손에 넣었다. 어린 날 뒤집어 보던 동전이 떠올랐다.', all: [{ k: 'met' }] },
    ],
  },
  peace: {
    promise: '소중한 사람들과 오래오래 함께 살겠다고', stat: 'vit',
    stages: [
      { name: '마음을 나눌 사람들을 곁에 둔다', done: '힘들 때 먼저 떠오르는 얼굴이 생겼다. 지키고 싶은 사람들이었다.', all: [{ k: 'bond', min: 2, at: 60 }] },
      { name: '오래 곁에 두고 싶은 사람이 생긴다', done: '그 사람이 웃으면 하루가 따뜻했다. 오래 곁에 두고 싶은 사람이 생겼다.', all: [{ k: 'any', of: [{ k: 'flag', any: ['sweetheart', 'married'] }, { k: 'bond', min: 1 }] }] },
      { name: '곁의 사람들과 마음을 나눈다', done: '말하지 않아도 마음을 아는 사람들이 생겼다. 그 믿음이 어떤 보물보다 단단했다.', all: [{ k: 'bond', min: 4, at: 60 }] },
      { name: '함께 살 사람과 맺어진다', done: '같은 지붕 아래에서 아침을 맞았다. 약속한 평온이 처음으로 손에 잡혔다.', all: [{ k: 'flag', any: ['married'] }] },
      { name: '머물 곳을 정한다', done: '떠돌던 짐을 풀고 머물 곳을 정했다. 창밖의 풍경이 매일 같다는 것이 좋았다.', all: [{ k: 'standing', is: SETTLED }] },
      { name: '곁에 사람들이 모여든다', done: '명절이면 집이 좁을 만큼 사람들이 모였다. 지켜 온 것들이 서로를 지키고 있었다.', all: [{ k: 'bond', min: 3 }] },
      { name: '평온한 날을 오래 지킨다', done: '큰일 없이 지나간 날들이 쌓였다. 그것이 얼마나 귀한지 이제는 안다.', all: [{ k: 'standing', is: SETTLED }, { k: 'age', min: 40 }] },
      { name: '소중한 사람들 곁에서 늙어 간다', done: '지키고 싶던 사람들 곁에서 늙어 갔다. 어린 날 밥상에 둘러앉았던 얼굴들이 떠올랐다.', all: [{ k: 'met' }] },
    ],
  },
};

/** 꿈의 서약 보상 (core/dream-vow.ts). 길목마다: 능력치 stat, 숙련 mastery. 연속(꿈을 바꾸지 않고 이어 지난 길목)마다 숙련 streakMastery를 더하고,
 *  streakStat에 적힌 연속 수에 닿으면 능력치를 하나 더 준다. 꿈을 바꾸지 않고 모든 길목을 지나면 그 갈래의 단계가 하나 오른다(스승 없는 한계도 넘는다). */
export const DREAM_VOW_REWARD = { stat: 1, mastery: 30, streakMastery: 10, streakStat: [3, 5, 7] as readonly number[] };
