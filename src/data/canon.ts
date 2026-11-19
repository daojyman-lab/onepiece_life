// 원작 인물. id는 저장(도감의 people, 사람의 canon)에 남으므로 바꾸지 않는다.
// offset: 주인공이 열일곱 살일 때 이 사람의 나이 − 17. 나이는 원작이 시작할 때(루피 열일곱)의 나이를 따른다.
import type { Person, Species } from '../core/types';
import { RECRUITS } from './recruits';

export interface CanonPerson {
  id: string; name: string; gender: 'm' | 'f'; offset: number; faction: Person['faction'];
  species?: Species;                           // 없으면 사람
}

type Row = [name: string, gender: 'm' | 'f', ageAtStart: number, faction: Person['faction'], species?: Species];

const ROWS: Record<string, Row> = {
  // 밀짚모자와 그 둘레
  luffy: ['몽키 D. 루피', 'm', 17, 'pirate'],
  zoro: ['롤로노아 조로', 'm', 19, 'pirate'],
  nami: ['나미', 'f', 18, 'pirate'],
  usopp: ['우솝', 'm', 17, 'pirate'],
  sanji: ['상디', 'm', 19, 'pirate'],
  ace: ['포트거스 D. 에이스', 'm', 20, 'pirate'],
  sabo: ['사보', 'm', 20, 'rev'],
  shanks: ['샹크스', 'm', 37, 'pirate'],
  makino: ['마키노', 'f', 29, 'civil'],
  dadan: ['다단', 'f', 51, 'pirate'],
  garp: ['몽키 D. 가프', 'm', 76, 'marine'],
  dragon: ['드래곤', 'm', 53, 'rev'],
  // 이스트 블루의 마을들
  coby: ['코비', 'm', 16, 'marine'],
  helmeppo: ['헤르메포', 'm', 21, 'marine'],
  morgan: ['도끼손 모건', 'm', 42, 'marine'],
  buggy: ['버기', 'm', 37, 'pirate'],
  alvida: ['알비다', 'f', 25, 'pirate'],
  kuro: ['쿠로', 'm', 33, 'pirate'],
  kaya: ['카야', 'f', 17, 'civil'],
  zeff: ['제프', 'm', 65, 'civil'],
  krieg: ['돈 크리크', 'm', 42, 'pirate'],
  mihawk: ['미호크', 'm', 41, 'pirate'],
  arlong: ['톱상어 아론', 'm', 39, 'pirate', 'fishman'],
  hatchan: ['하찌', 'm', 38, 'pirate', 'fishman'],
  nojiko: ['노지코', 'f', 20, 'civil'],
  genzo: ['겐조', 'm', 45, 'civil'],
  koshiro: ['코우시로', 'm', 47, 'civil'],
  smoker: ['스모커', 'm', 34, 'marine'],
  tashigi: ['타시기', 'f', 21, 'marine'],
  // 먼 바다 (지금 데이터가 부르는 사람과 이름 있는 상대)
  iceburg: ['아이스버그', 'm', 34, 'civil'],
  daz: ['미스터 1', 'm', 31, 'pirate'],
  lucci: ['롭 루치', 'm', 28, 'marine'],
  crocodile: ['크로커다일', 'm', 44, 'pirate'],
  kizaru: ['키자루', 'm', 56, 'marine'],
  hody: ['호디 존스', 'm', 28, 'pirate', 'fishman'],
  fujitora: ['후지토라', 'm', 52, 'marine'],
  doflamingo: ['돈키호테 도플라밍고', 'm', 39, 'pirate'],
  akainu: ['아카이누', 'm', 53, 'marine'],
  kaido: ['백수 카이도', 'm', 57, 'pirate'],
  marco: ['마르코', 'm', 43, 'pirate'],
  kid: ['유스타스 키드', 'm', 21, 'pirate'],
  // 섬에서 만나 배에 태우는 사람들 (turnings/islands.ts)
  gin: ['긴', 'm', 25, 'pirate'],
  johnny: ['조니', 'm', 23, 'civil'],
  bonclay: ['봉쿠레', 'm', 30, 'pirate'],
  duval: ['듀발', 'm', 27, 'pirate'],
  sai: ['사이', 'm', 28, 'pirate'],
  bartolomeo: ['바르톨로메오', 'm', 22, 'pirate'],
  cavendish: ['캐번디시', 'm', 24, 'pirate'],
  ideo: ['이데오', 'm', 25, 'pirate'],
  koala: ['코알라', 'f', 21, 'rev'],
  hack: ['핵', 'm', 38, 'rev', 'fishman'],
  // 과제 10: 위대한 항로와 신세계에서 만나는 사람들
  chopper: ['토니토니 쵸파', 'm', 15, 'pirate'],
  vivi: ['네펠타리 비비', 'f', 16, 'civil'],
  franky: ['프랑키', 'm', 34, 'pirate'],
  brook: ['브룩', 'm', 88, 'pirate'],
  whitebeard: ['흰수염 에드워드 뉴게이트', 'm', 72, 'pirate'],
  jinbe: ['징베', 'm', 44, 'pirate', 'fishman'],
  law: ['트라팔가 로', 'm', 24, 'pirate'],
  // 4단계: 워터 세븐
  tom: ['톰', 'm', 72, 'civil', 'fishman'],
  kokoro: ['코코로', 'f', 70, 'civil', 'merfolk'],
  // 4단계: 와노쿠니 (카이도는 위에 있다). 와노에서 원작이 일어나는 해는 주인공 스물한 살 무렵이다
  hiyori: ['코즈키 히요리', 'f', 22, 'civil'],
  denjiro: ['덴지로', 'm', 37, 'civil'],
  yasuie: ['시모츠키 야스이에', 'm', 59, 'civil'],
  tama: ['오타마', 'f', 4, 'civil'],
  // 4단계: 신세계에서 쫓기는 사람이 만나는 해군
  tsuru: ['츠루', 'f', 72, 'marine'],
  ryokugyu: ['녹우 아라마키', 'm', 44, 'marine'],
};

// 배에 태울 수 있는 인물 (data/recruits.ts). 위에 이미 있는 사람은 위의 것을 쓴다
for (const [id, name, gender, age, faction, species] of RECRUITS) ROWS[id] ??= [name, gender, age, faction, ...(species ? [species as Species] : [])] as Row;

export const CANON: Record<string, CanonPerson> = Object.fromEntries(Object.entries(ROWS).map(([id, [name, gender, age, faction, species]]) =>
  [id, { id, name, gender, offset: age - 17, faction, ...(species ? { species } : {}) }]));

/** 주인공이 heroAge살일 때 이 원작 인물의 나이. 아직 태어나지 않았으면 0. 모르는 인물은 주인공과 같은 나이 */
export function canonAge(id: string, heroAge: number): number {
  return Math.max(0, heroAge + (CANON[id]?.offset ?? 0));
}
