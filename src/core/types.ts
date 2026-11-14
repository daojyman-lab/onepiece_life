// 상태와 정적 데이터의 형태. docs/02_설계/02_상태와_데이터.md 를 따른다.
// 상태에는 값만 둔다. 함수를 넣지 않는다.

export type SeaId =
  | 'east' | 'west' | 'north' | 'south'
  | 'gl_entry' | 'gl_first' | 'sabaody' | 'nw_first' | 'nw_late';
export type Stage = 1 | 2 | 3 | 4 | 5 | 6;
export type Route = 'none' | 'pirate' | 'marine' | 'revolution';
export type StatKey = 'str' | 'spd' | 'vit' | 'int' | 'wil' | 'luk';
export type Stats = Record<StatKey, number>;
export type BranchId =
  | 'martial.fist' | 'martial.sword' | 'martial.gun'
  | 'haki.observation' | 'haki.armament' | 'haki.conqueror'
  | 'fruit';
export type Tactic = 'offense' | 'defense' | 'counter' | 'endurance';
export type CrewRole = 'vanguard' | 'support' | 'medic' | 'navigator' | 'cook' | 'shipwright';
export type FruitClass = 'paramecia' | 'zoan' | 'logia';
export type Species = 'human' | 'fishman' | 'merfolk' | 'mink' | 'giant' | 'longarm' | 'longleg' | 'threeeye' | 'tontatta' | 'celestial' | 'skypiean';

// ---------------------------------------------------------------- 주인공

export interface Injury { severity: 'light' | 'heavy' | 'scar'; monthsLeft: number; stat?: StatKey; treated?: boolean }
export interface Illness { id: string; stage: 1 | 2 | 3; months: number }

export interface Hero {
  name: string; surname: string; gender: 'm' | 'f';
  species: Species;
  birth: { seaId: SeaId; place: string; household: string; month: number };
  age: number;
  route: Route;
  rank: number;
  fame: number;
  money: number;
  base: Stats;
  hp: number;                 // 건강 0~100
  injuries: Injury[];
  illness: Illness | null;
  traits: string[];
  fruit: { id: string; eatenAt: number } | null;
  alive: boolean;
}

// ---------------------------------------------------------------- 성장

export interface Growth {
  focus: BranchId | null;                 // 주력: 무술 3유파 중 하나
  secondary: BranchId | null;             // 보조: 무술 3유파 중 하나 (절반 속도)
  haki?: BranchId | null;                 // 패기 칸: 깨우친 패기 중 하나를 둔다. 주력 · 보조와 따로 자란다
  skills: Record<string, { mastery: number }>;
  gates: string[];
  master: { personId: string; name: string; branch: BranchId; gate: string; monthsLeft: number } | null;
  focusSince: number;         // 주력이 정해진 나이
}

export interface Loadout {
  skills: string[];           // 최대 6
  tactic: Tactic;
  retreatAt: 0 | 0.3 | 0.5;
  weapon: string | null; armor: string | null; charm: string | null;
  consumables: string[];      // 최대 3
  crew: { personId: string; role: CrewRole }[];
}

export interface CrewInfo {
  role: CrewRole; level: number; power: number; skills: string[]; injuredMonths: number;
}

export interface Person {
  id: string; name: string; gender: 'm' | 'f'; age: number;
  kind: 'family' | 'master' | 'crew' | 'rival' | 'enemy' | 'ally';
  relation: string;           // 아버지, 라이벌, 스승 … 화면용
  canon: string | null;
  bond: number;
  faction: 'civil' | 'pirate' | 'marine' | 'rev';
  species: Species;
  crew?: CrewInfo;
  power?: number;             // 라이벌 같은 비동료의 대략적 힘
  alive: boolean;
}

export interface MissionProgress {
  id: string; state: 'open' | 'active' | 'done' | 'failed'; step: number; monthsInStep: number; port: string;
}

export interface WorldProgress {
  stage: Stage;
  seaId: SeaId;
  missions: MissionProgress[];
  refillAt: number | null;     // 실패한 임무를 대신할 임무가 뽑히는 달 (절대 달)
  boss: { id: string; state: 'hidden' | 'revealed' | 'defeated'; attempts: number; nextAskAt: number };
  ship: string | null;
  defeated: string[];
  news: { year: number; text: string }[];
  apex: boolean;               // 6단계 보스를 넘었다
}

export interface Inventory {
  items: { id: string; count: number }[];
  unknownFruits: { uid: string; fruitId: string; hints: string[]; foundAt: number; asked: boolean }[];
}

export interface ChoiceTracker {
  nextAt: number;              // 절대 달
  thisYear: number;
  seen: Record<string, number>;   // id → 마지막으로 본 절대 달
  flags: string[];
  queue: string[];
  pauses?: number;             // 올해 멈춘 수 (선택 + 강적 준비). 해가 바뀌면 0
}

export type LogType = 'info' | 'growth' | 'battle' | 'choice' | 'danger' | 'world' | 'money' | 'good' | 'life';
export interface LogEntry { t: number; text: string; type: LogType }
export interface TimelineEntry { t: number; age: number; text: string }

export interface LifeStats {
  routineWins: number; routineLosses: number;
  eliteWins: number; eliteLosses: number;
  choices: number; maxStage: number; nearDeaths: number;
  pauses?: number; lifeEvents?: number; autoElite?: number;
}

// ---------------------------------------------------------------- 전투 (직렬화 가능)

export interface EnemySpec {
  id: string; name: string; canon: string | null;
  base: Stats; fruitClass: FruitClass | null; armament: 0 | 1 | 2 | 3; observation: 0 | 1 | 2 | 3;
  skills: string[]; tactic: Tactic;
  officers: EnemySpec[];
  faction: Person['faction']; species: Species; gender: 'm' | 'f'; age: number;
  title?: string;
  form?: 'seaking';            // 사람이 아닌 모습 (그림을 다르게 그린다)
}

export interface Encounter {
  source: 'mission' | 'boss' | 'rival' | 'choice' | 'routine';
  enemy: EnemySpec;
  elite: boolean;
  lethal: boolean;
  spar: boolean;
  atSea: boolean;
  missionIdx?: number;
  reward?: Effect[];
}

export interface CUnit {
  key: string; name: string; side: 'L' | 'R';
  hero: boolean; leader: boolean; role: CrewRole | 'hero' | 'enemy';
  maxHp: number; hp: number; maxSp: number; sp: number;
  st: Stats; def: number; armament: number; observation: number;
  fruitClass: FruitClass | null;
  skills: { id: string; mastery: number; cd: number }[];
  tactic: Tactic; retreatAt: number;
  weapon: { branch: BranchId; mult: number; seastone: boolean } | null;
  consumables: string[];
  guard: number; guardTurns: number; evade: number; evadeTurns: number; buff: number; buffTurns: number;
  bound: number; sealed: number;
  pGuard: number; pDodge: number; pBuff: number;   // 장착한 패시브 기술의 상시 효과
  lastBig: boolean;
  personId?: string; faction: Person['faction']; species: Species; gender: 'm' | 'f'; age: number;
  form?: 'seaking';
}

export interface Duel { id: number; l: number; r: number; helpersL: number[]; helpersR: number[]; over: boolean; winner: 'L' | 'R' | null }

export type BattleEvent =
  | { k: 'round'; n: number }
  | { k: 'act'; d: number; who: number; target: number; skill: string; name: string; dmg: number; crit: boolean; dodge: boolean; note?: string }
  | { k: 'heal'; d: number; who: number; target: number; amount: number; name: string }
  | { k: 'guard'; d: number; who: number; name: string }
  | { k: 'down'; d: number; who: number }
  | { k: 'join'; d: number; who: number; side: 'L' | 'R' }
  | { k: 'retreat'; who: number; ok: boolean }
  | { k: 'item'; d: number; who: number; item: string; name: string }
  | { k: 'drown'; who: number }
  | { k: 'rest'; who: number }
  | { k: 'end'; result: 'win' | 'lose' | 'retreat' };

export interface BattleState {
  round: number;
  units: CUnit[];
  duels: Duel[];
  events: BattleEvent[];
  result: null | 'win' | 'lose' | 'retreat';
  rng: { seed: number; cursor: number };
  usage: Record<string, { uses: number; damage: number }>;
  awaiting: null | 'intervene';
  resting: boolean;
  atSea: boolean;
  navigator: boolean;
}

// ---------------------------------------------------------------- 대기 중인 일

export interface ResolvedOption {
  label: string; hint: string; effects: Effect[]; disabled: string | null; next?: string; danger?: boolean;
}

export type Pending =
  | { kind: 'choice'; choiceId: string; category: Choice['category']; title: string; body: string;
      speaker: { name: string; personId?: string; faction?: Person['faction']; species?: Species; gender?: 'm' | 'f'; age?: number } | null;
      options: ResolvedOption[] }
  | { kind: 'prep'; encounter: Encounter }
  | { kind: 'battle'; encounter: Encounter; battle: BattleState; risk: Risk }
  | { kind: 'intervene'; encounter: Encounter; battle: BattleState; risk: Risk }
  | { kind: 'ending'; cause: string }
  | null;

export type Risk = 'safe' | 'danger' | 'lethal';

// ---------------------------------------------------------------- 한 인생

export interface LifeState {
  schema: 1;
  rng: { seed: number; cursor: number };
  time: { year: number; month: number };
  hero: Hero;
  growth: Growth;
  loadout: Loadout;
  people: Person[];
  world: WorldProgress;
  inventory: Inventory;
  choice: ChoiceTracker;
  log: LogEntry[];
  timeline: TimelineEntry[];
  pending: Pending;
  stats: LifeStats;
  lastBattle: { name: string; result: string; summary: { skill: string; name: string; uses: number; damage: number }[] } | null;
  seq: number;                // 고유 번호 발급기
  notices: string[];          // 화면이 한 번 보여 주고 지우는 알림
  metaEvents: MetaEvent[];    // 인생 밖 기록(도감)에 반영할 일. app 층이 MetaState에 옮기고 비운다
  ended: { cause: string; age: number } | null;
  known: { fruits: string[]; people: string[] };   // 새 인생을 만들 때 도감에서 옮겨 온 것
}

export type MetaEvent =
  | { k: 'fruit'; id: string; grade: number }
  | { k: 'met'; id: string; where: SeaId; taught?: boolean }
  | { k: 'defeated'; id: string; where: SeaId }
  | { k: 'skill'; id: string };

// ---------------------------------------------------------------- 인생 밖

export interface HallEntry {
  name: string; route: Route; ageAtEnd: number; cause: string;
  stage: number; fame: number; fruit: string | null; topSkills: string[];
  endedAt: string;
}
export interface MetaState {
  schema: 1;
  fruitCodex: Record<string, { eaten: number; bestTier: number }>;
  peopleCodex: Record<string, { met: number; taughtBy: boolean; defeated: boolean; where: SeaId }>;
  skillCodex: string[];
  hall: HallEntry[];
  lives: number;
}

// ---------------------------------------------------------------- 정적 데이터

export interface SkillEffect { type: 'guard' | 'dodge' | 'heal' | 'buff' | 'debuff' | 'bind'; value: number; turns: number }
export type SkillWhen = 'always' | 'hpBelow50' | 'enemyHpBelow30' | 'afterEnemyBig' | 'opening' | 'allyDown';
export type SkillTag = 'armament' | 'area' | 'pierce' | 'heal' | 'bind' | 'transform' | 'awaken';

export interface Skill {
  id: string; name: string; branch: BranchId; tier: 1 | 2 | 3 | 4 | 5 | 6;
  kind: 'attack' | 'guard' | 'support' | 'passive';
  stat: 'str' | 'spd' | 'int' | 'wil';
  power: number; cost: number; cooldown: number;
  when: SkillWhen;
  tags: SkillTag[];
  effect?: SkillEffect;
  requires: { skills?: { id: string; mastery: number }[]; base?: Partial<Stats>; gate?: string };
  text: string;
}

export interface FruitTemplate {
  id: string; kind: Skill['kind']; stat: Skill['stat']; power: number; cost: number; cooldown: number;
  when: SkillWhen; tags: SkillTag[]; effect?: SkillEffect;
}

export interface Fruit {
  id: string; name: string; cls: FruitClass;
  grade: 1 | 2 | 3 | 4 | 5;
  theme: string;
  skills: { template: string; name: string }[];
  canonUser: string | null;
}

export interface Master {
  id: string; name: string; canon: string | null; title: string;
  seas: SeaId[]; minStage: Stage; route: Array<'pirate' | 'marine' | 'any'>;
  teaches: { branch: BranchId; gate: string; months: number }[];
  accepts: Condition[];
  fee: number;
  faction: Person['faction']; gender: 'm' | 'f'; age: number; species: Species;
}

export interface Sea {
  id: SeaId; stage: Stage; name: string; ports: string[]; enemyPower: [number, number];
  shipRequired: number; armament: 0 | 1 | 2 | 3;
}

export type MissionStep =
  | { kind: 'story'; months: number; text: string; effects: Effect[] }
  | { kind: 'battle'; enemy: string; elite: boolean; atSea?: boolean; text: string };

export interface Mission {
  id: string; stages: Stage[] | 'any'; route: 'pirate' | 'marine' | 'any';
  title: string;
  steps: MissionStep[];
  reward: Effect[];
}

export interface Boss extends EnemySpec {
  sea: SeaId[]; stage: Stage; route: 'pirate' | 'marine' | 'any'; drops: Effect[]; intro: string;
}

export interface Item {
  id: string; name: string;
  kind: 'weapon' | 'armor' | 'charm' | 'consumable';
  grade: 1 | 2 | 3 | 4 | 5;
  branch?: BranchId;          // 무기가 맞는 갈래
  mult?: number;              // 무기 배율
  armor?: number;             // 방어구 방어
  bonus?: Partial<Stats>;     // 장신구
  use?: 'heal' | 'sp' | 'seastone' | 'smoke' | 'net';
  seastone?: boolean;         // 해루석 무기: 이 무기로 하는 공격은 자연계에 무장색 한 단계만큼 더 닿는다
  price: number;
  text: string;
}

export interface Ship { id: string; name: string; tier: number; crew: number; price: number }

export type ChoiceCategory = 'childhood' | 'entry' | 'master' | 'fruit' | 'career' | 'challenge' | 'bond' | 'crisis' | 'ship';

export interface ChoiceOption {
  label: string; hint: string; when?: Condition[]; effects: Effect[]; next?: string; danger?: boolean;
}
export interface Choice {
  id: string;
  category: ChoiceCategory;
  when: Condition[];
  weight: number;
  repeat: 'once' | 'cooldown';
  cooldownYears?: number;
  template?: 'fruit' | 'master' | 'challenge' | 'ship' | 'focus' | 'haki';
  speaker: 'hero' | { person: string } | { canon: string; faction?: Person['faction']; gender?: 'm' | 'f'; age?: number };
  title: string; body: string;
  options: ChoiceOption[];
}

// ---------------------------------------------------------------- 조건과 효과

export type Condition =
  | { c: 'age'; min?: number; max?: number }
  | { c: 'route'; is: Route[] }
  | { c: 'stage'; min?: number; max?: number }
  | { c: 'base'; key: StatKey; min: number }
  | { c: 'skill'; id: string; mastery?: number }
  | { c: 'gate'; id: string; has: boolean }
  | { c: 'fruit'; has: boolean }
  | { c: 'flag'; id: string; has: boolean }
  | { c: 'trait'; id: string; has: boolean }
  | { c: 'money'; min: number }
  | { c: 'crew'; min?: number; max?: number }
  | { c: 'injured'; is: boolean }
  | { c: 'ill'; is: boolean }
  | { c: 'birthSea'; is: SeaId[] }
  | { c: 'focus'; is: (BranchId | null)[] }
  | { c: 'species'; is: Species[] }
  | { c: 'person'; kind: Person['kind']; has: boolean };

export interface PersonSeed {
  kind: Person['kind']; relation: string; name?: string; gender?: 'm' | 'f'; age?: number;
  faction?: Person['faction']; bond?: number; power?: number; tag?: string; canon?: string | null;
}
export interface CrewSeed { role: CrewRole; name?: string; gender?: 'm' | 'f'; power?: number }

export type Effect =
  | { op: 'base'; key: StatKey | 'all'; add: number }
  | { op: 'hp'; add: number }
  | { op: 'money'; add: number }
  | { op: 'moneyPct'; pct: number }
  | { op: 'fame'; add: number }
  | { op: 'focus'; branch: BranchId | null; slot: 'focus' | 'secondary' | 'haki' }
  | { op: 'learn'; skill: string }
  | { op: 'mastery'; skill: string | 'focus'; add: number }
  | { op: 'gate'; id: string }
  | { op: 'apprentice'; master: string; branch: BranchId; gate: string; months: number; fee: number }
  | { op: 'route'; to: Route }
  | { op: 'rank'; add: number }
  | { op: 'flag'; id: string }
  | { op: 'unflag'; id: string }
  | { op: 'trait'; id: string }
  | { op: 'person'; add: PersonSeed }
  | { op: 'bond'; who: string; add: number }
  | { op: 'recruit'; crew: CrewSeed }
  | { op: 'item'; id: string; count: number }
  | { op: 'findFruit'; pool: 'any' | 'gradeMin3' | string }
  | { op: 'eatFruit'; uid: string }
  | { op: 'sellFruit'; uid: string }
  | { op: 'appraise'; uid: string; fee: number }
  | { op: 'injury'; severity: Injury['severity'] }
  | { op: 'heal' }
  | { op: 'sellBest' }
  | { op: 'illness'; id: string }
  | { op: 'battle'; enemy: string; elite: boolean; lethal: boolean; spar?: boolean }
  | { op: 'ship'; id: string; price: number }
  | { op: 'bossLater'; months: number }
  | { op: 'queue'; choice: string }
  | { op: 'log'; text: string; type: LogType }
  | { op: 'timeline'; text: string }
  | { op: 'die'; cause: string }
  | { op: 'retire' }
  | { op: 'chance'; p: number; then: Effect[]; else?: Effect[] };
