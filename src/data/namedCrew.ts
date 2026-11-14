// 원작의 조연급 인물이 배(분대)에 오르는 인연 사건. 주연급은 넣지 않는다.
// 보통 동료보다 처음부터 레벨이 높고(levelBonus), 해마다 더 크게 자란다(growth = 잠재력).
import type { Choice, Condition, CrewRole, Person, Route, Species } from '../core/types';

export interface NamedCrew {
  id: string;                 // Person.canon (얼굴 씨앗도 이것)
  name: string;
  epithet: string;
  routes: Route[];
  role: CrewRole;
  gender: 'm' | 'f'; age: number; species: Species;
  faction: Person['faction'];
  trait: string;              // data/crewTraits.ts
  fruit?: string;             // data/fruits.ts
  stage: [number, number];    // 나올 수 있는 해역 단계
  rankMin?: number;           // 해군: 분대를 꾸릴 수 있어야 한다
  levelBonus: number;
  powerMult: number;          // 처음 힘 배율
  growth: number;             // 해마다 자라는 힘 배율 (잠재력)
  potential: string;          // 화면에 보이는 잠재력 설명
  title: string; speaker: string; body: string;
  accept: string; decline: string; joinLog: string;
}

export const NAMED_CREW: NamedCrew[] = [
  // ---- 해군
  { id: 'coby', name: '코비', epithet: '열혈 견습', routes: ['marine'], role: 'vanguard', gender: 'm', age: 16, species: 'human', faction: 'marine', trait: 'optimist',
    stage: [1, 4], rankMin: 3, levelBonus: 2, powerMult: 1.25, growth: 1.9, potential: '잠재력 최상 · 해마다 크게 자란다',
    title: '해군 대장을 꿈꾸는 소년', speaker: '견습 해군 코비',
    body: '알비다 해적단에서 잡일을 하다 도망쳐 나왔다는 안경 쓴 소년이 막 입대했다. 겁은 많은데 눈빛이 곧다. "저, 언젠가 해군 대장이 될 거예요!" 훈련이 끝나도 혼자 남아 주먹을 지른다.',
    accept: '내 분대로 데려온다', decline: '다른 분대에 양보한다',
    joinLog: '코비가 분대에 들어왔다. "열심히 하겠습니다!" 목소리가 연병장에 울렸다.' },
  { id: 'helmeppo', name: '헬메포', epithet: '쿠크리', routes: ['marine'], role: 'vanguard', gender: 'm', age: 18, species: 'human', faction: 'marine', trait: 'braggart',
    stage: [1, 4], rankMin: 3, levelBonus: 2, powerMult: 1.2, growth: 1.7, potential: '잠재력 높음 · 쿠크리 쌍검',
    title: '대령의 아들', speaker: '잡일병 헬메포',
    body: '셸스 타운 해군 대령의 아들이던 금발 청년. 아버지가 강등된 뒤 잡일부터 다시 시작했다. 허세는 여전하지만, 쿠크리 두 자루를 차고 밤마다 몰래 연습하는 걸 다들 안다.',
    accept: '내 분대로 데려온다', decline: '못 본 척한다',
    joinLog: '헬메포가 분대에 들어왔다. "흥, 내가 들어와 준 거야!" 그러고는 제일 먼저 갑판을 닦았다.' },
  { id: 'tashigi', name: '타시기', epithet: '검 수집가', routes: ['marine'], role: 'vanguard', gender: 'f', age: 23, species: 'human', faction: 'marine', trait: 'stoic',
    stage: [2, 5], rankMin: 4, levelBonus: 3, powerMult: 1.25, growth: 1.5, potential: '잠재력 높음 · 명검 「시구레」',
    title: '안경 쓴 검사', speaker: '해군 조장 타시기',
    body: '스모커 밑에서 일하던 검사 타시기가 잠시 네 부대로 파견되었다. 명검을 악당 손에서 되찾겠다는 신념이 확고하다. 자주 넘어지지만 칼끝은 흔들리지 않는다.',
    accept: '파견을 받아들인다', decline: '스모커에게 돌려보낸다',
    joinLog: '타시기가 분대에 합류했다. 인사하다 안경이 떨어졌다.' },
  // ---- 해적
  { id: 'bartolomeo', name: '바르톨로메오', epithet: '식인종', routes: ['pirate'], role: 'vanguard', gender: 'm', age: 24, species: 'human', faction: 'pirate', trait: 'hot', fruit: 'bari',
    stage: [2, 5], levelBonus: 3, powerMult: 1.3, growth: 1.6, potential: '잠재력 높음 · 배리어배리어 열매',
    title: '「식인종」의 고백', speaker: '「식인종」 바르톨로메오',
    body: '닭벼슬 머리에 송곳니를 드러낸 해적이 네 현상 수배서를 가슴에 품고 나타났다. 울면서 무릎을 꿇는다. "서, 선배님! 이 몸, 선배님 배에서 싸우게 해 주십쇼!" 소문난 배리어 능력자다.',
    accept: '배에 태운다', decline: '사인만 해 주고 보낸다',
    joinLog: '바르톨로메오가 배에 올랐다. 네 수배서를 선실 벽에 붙이고 절을 했다.' },
  { id: 'cavendish', name: '캐번디시', epithet: '백마', routes: ['pirate'], role: 'vanguard', gender: 'm', age: 26, species: 'human', faction: 'pirate', trait: 'romantic',
    stage: [3, 6], levelBonus: 3, powerMult: 1.3, growth: 1.5, potential: '잠재력 높음 · 명검 「듀랑달」',
    title: '「백마」 캐번디시', speaker: '「백마」 캐번디시',
    body: '하얀 말을 탄 금발 미남이 네 앞을 막았다. 네 인기에 질투가 나서 쓰러뜨리러 왔다더니, 한 판 겨루고는 마음을 바꿨다. "좋아, 당분간 네 옆에서 빛나 주지."',
    accept: '배에 태운다', decline: '정중히 거절한다',
    joinLog: '캐번디시가 배에 올랐다. 갑판에 거울부터 걸었다.' },
  { id: 'ideo', name: '이데오', epithet: '파괴포', routes: ['pirate'], role: 'vanguard', gender: 'm', age: 28, species: 'human', faction: 'pirate', trait: 'drinker',
    stage: [3, 6], levelBonus: 2, powerMult: 1.25, growth: 1.4, potential: '잠재력 높음 · 「파괴포」 주먹',
    title: '「파괴포」 이데오', speaker: '「파괴포」 이데오',
    body: '복서 출신 해적 「파괴포」 이데오가 술집에서 팔씨름을 걸어왔다. 지고 나서 껄껄 웃더니 술잔을 내밀었다. "네 밑에서라면 더 큰 판에서 싸울 수 있겠군."',
    accept: '배에 태운다', decline: '술만 마시고 헤어진다',
    joinLog: '이데오가 배에 올랐다. 주먹으로 돛대를 두드려 보고는 만족했다.' },
  // ---- 혁명군
  { id: 'koala', name: '코알라', epithet: '어인 가라테 사범', routes: ['revolution'], role: 'vanguard', gender: 'f', age: 22, species: 'human', faction: 'rev', trait: 'optimist',
    stage: [2, 6], levelBonus: 3, powerMult: 1.25, growth: 1.6, potential: '잠재력 높음 · 어인 가라테 사범',
    title: '어인 가라테 사범', speaker: '혁명군 코알라',
    body: '혁명군 본부에서 어인 가라테를 가르치는 코알라가 네 부대에 배속되었다. 노예였던 과거를 웃으며 이야기하는 사람이다. "같이 해방하러 가자!"',
    accept: '함께 간다', decline: '본부에 남겨 둔다',
    joinLog: '코알라가 합류했다. 첫날부터 대원들에게 정권 지르기를 가르쳤다.' },
  { id: 'hack', name: '핵', epithet: '어인 가라테', routes: ['revolution'], role: 'vanguard', gender: 'm', age: 40, species: 'fishman', faction: 'rev', trait: 'stoic',
    stage: [3, 6], levelBonus: 3, powerMult: 1.3, growth: 1.3, potential: '잠재력 보통 이상 · 어인 가라테 고수',
    title: '어인 가라테 고수', speaker: '혁명군 핵',
    body: '혁명군의 어인 핵이 묵묵히 네 앞에 섰다. 어인 가라테 사범 대리라는 그는 말이 적고 정의감이 강하다. 짧게 고개를 끄덕였다. "따르겠다."',
    accept: '함께 간다', decline: '다른 부대로 보낸다',
    joinLog: '핵이 합류했다. 말없이 가장 무거운 짐을 짊어졌다.' },
];
export const NAMED_CREW_BY_ID = Object.fromEntries(NAMED_CREW.map((n) => [n.id, n])) as Record<string, NamedCrew>;

/** 네임드 동료 인연 선택지 */
export const NAMED_CREW_CHOICES: Choice[] = NAMED_CREW.map((n): Choice => {
  const when: Condition[] = [{ c: 'route', is: n.routes }, { c: 'age', min: 16 }, { c: 'stage', min: n.stage[0], max: n.stage[1] }];
  if (n.rankMin) when.push({ c: 'rank', min: n.rankMin });
  return {
    id: `nc_${n.id}`, category: 'bond', weight: 4, repeat: 'once', when,
    speaker: { canon: n.speaker, faction: n.faction, gender: n.gender, age: n.age, face: n.id, species: n.species },
    title: n.title, body: n.body,
    options: [
      { label: n.accept, hint: `원작 인물 동료 · ${n.potential}`, effects: [{ op: 'recruit', crew: { role: n.role, named: n.id } }] },
      { label: n.decline, hint: '인연만 남는다. 다시 오지 않는다', effects: [{ op: 'fame', add: 2 }, { op: 'base', key: 'luk', add: 1 }] },
    ],
  };
});
