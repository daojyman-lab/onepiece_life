import type { Stats, StatKey, Species, SeaId, Person, Injury, Illness, BattleState, EnemySpec, LogType } from '../../core/types';
export type { Stats, StatKey, Species, SeaId, Person, EnemySpec, BattleState };

export type ValueId = 'justice' | 'devotion' | 'ambition' | 'romance' | 'inquiry' | 'loyalty' | 'freedom' | 'dominion' | 'peace';
export type Values = Record<ValueId, number>;                    // 각 0~100
export type HomeId = 'loguetown' | 'water7' | 'wano' | 'fishman' | 'sky' | 'zou';
export type Wealth = 'poor' | 'common' | 'comfortable' | 'noble';
export type Lineage = 'orphan' | 'commoner' | 'marineFamily' | 'pirateChild' | 'samurai' | 'outcast';
export type Standing = 'child' | 'civil' | 'pirate' | 'marine' | 'revolution' | 'bountyHunter' | 'warlord'
  | 'shipwright' | 'cp' | 'settled' | 'prisoner' | 'retired';
export type Limb = 'eyeL' | 'eyeR' | 'armL' | 'armR' | 'legL' | 'legR';
export type LimbState = 'ok' | 'lost' | 'basic' | 'superior';    // basic 돈으로 단 것, superior 기연으로 얻은 것
export type Activity = 'train' | 'work' | 'study' | 'roam' | 'family' | 'rest';
export type Branch = 'fist' | 'sword' | 'gun' | 'observation' | 'armament' | 'conqueror' | 'fruit';

export interface Hero5 {
  name: string; surname: string | null;        // 고아는 null (성을 모름)
  secretSurname: string | null;                // 숨겨진 진짜 성. 밝혀지면 surname으로 옮긴다
  gender: 'm' | 'f'; species: Species;
  home: HomeId; town: string; wealth: Wealth; lineage: Lineage;
  talents: string[];                           // src/data/talents.ts 의 id
  base: Stats; hp: number;                     // hp 0~100
  injuries: Injury[]; illness: Illness | null;
  limbs: Record<Limb, LimbState>;
  fruit: { id: string; eatenAt: number } | null;
  money: number; fame: number; rank: number;
  standing: Standing; island: string; sea: SeaId;
  alive: boolean;
}
export interface Growth5 {
  tier: Record<Branch, number>;                // 연 오의 단계 0~6
  mastery: Record<Branch, number>;             // 0~100, 다음 단계로 가는 숙련
  master: { name: string; branch: Branch; cap: number; yearsLeft: number; paid: boolean } | null;
}
export type LogWeight = 'light' | 'heavy' | 'year';
export interface LogLine { id: number; age: number; text: string; weight: LogWeight; type: LogType }
export interface Unchosen { age: number; turning: string; title: string; door: string }
/** 연표 한 줄. standing: 처지가 이리로 바뀐 줄, canon: 이 원작 인물이 말한 전환점에서 고른 줄 */
export interface TimelineEntry { age: number; text: string; standing?: Standing; canon?: string }

export type Cond =
  | { c: 'age'; min?: number; max?: number }
  | { c: 'standing'; is: Standing[] }
  | { c: 'home'; is: HomeId[] }
  | { c: 'wealth'; min?: Wealth; max?: Wealth }
  | { c: 'lineage'; is: Lineage[] }
  | { c: 'value'; id: ValueId; deep: boolean }
  | { c: 'strength'; id: string; has: boolean }
  | { c: 'money'; min: number }
  | { c: 'fame'; min: number }
  | { c: 'tier'; branch: Branch | 'any'; min: number }
  | { c: 'flag'; id: string; has: boolean }
  | { c: 'fruit'; has: boolean }
  | { c: 'limbLost'; min: number }
  | { c: 'sea'; is: SeaId[] }
  | { c: 'hardship'; min: number }
  | { c: 'secret'; known: boolean };

export type Fx =
  | { op: 'base'; key: StatKey | 'all'; add: number }
  | { op: 'hp'; add: number }
  | { op: 'money'; add: number }
  | { op: 'fame'; add: number }
  | { op: 'rank'; add: number }
  | { op: 'standing'; to: Standing }
  | { op: 'wealth'; to: Wealth }                         // 집안 형편이 바뀐다 (몰락 등)
  | { op: 'move'; island: string; sea: SeaId }
  | { op: 'mastery'; branch: Branch; add: number }
  | { op: 'tier'; branch: Branch; to: number }
  | { op: 'master'; name: string; branch: Branch; cap: number; years: number; paid: boolean }
  | { op: 'flag'; id: string } | { op: 'unflag'; id: string }
  | { op: 'mark'; id: string }
  | { op: 'hardship'; add: number }
  | { op: 'person'; kind: Person['kind']; relation: string; name?: string; canon?: string }
  | { op: 'losePerson'; relation: string }
  | { op: 'injury'; severity: Injury['severity'] }
  | { op: 'loseLimb'; limb: Limb | 'random' }
  | { op: 'prosthetic'; grade: 'basic' | 'superior' }
  | { op: 'illness'; id: string }
  | { op: 'eatFruit'; id: string | 'random' }
  | { op: 'reveal' }                                    // 숨긴 성씨가 밝혀진다
  | { op: 'fight'; foe: string; lethal: boolean; forced: boolean }
  | { op: 'queue'; turning: string }
  | { op: 'log'; text: string; weight: LogWeight }
  | { op: 'timeline'; text: string }
  | { op: 'die'; cause: string }
  | { op: 'chance'; p: number; then: Fx[]; else?: Fx[] };

export interface Door {
  label: string; hint: string;
  when?: Cond[];                               // 출생 · 처지의 벽. 안 맞으면 잠긴다
  special?: ValueId;                           // 이 가치관이 깊어야 열리는 특별한 문
  values?: Partial<Values>;                    // 고르면 오르는 점수
  mark?: string;                               // 정신적 강점으로 가는 표시
  fx: Fx[];
  danger?: boolean;
}
export interface Turning {
  id: string;
  kind: 'door' | 'moment' | 'fortune' | 'misfortune';    // moment 큰 계기, misfortune 고를 수 없는 불행 (문 없음)
  when: Cond[]; weight: number; repeat: 'once' | { years: number };
  fortuneOf?: ValueId;                         // kind 'fortune': 이 가치관이 가장 높을 때 온다
  speaker: 'hero' | { canon: string } | { relation: string };
  title: string; body: string;
  doors: Door[];                               // misfortune은 빈 배열
  fx?: Fx[];                                   // misfortune이 일으키는 일
}
export interface Minor {
  id: string; when: Cond[]; weight: number; cooldownYears: number;
  outcomes: { lean: Partial<Values>; text: string[]; fx: Fx[] }[];   // lean이 빈 객체면 누구나
}
export interface ResolvedDoor { label: string; hint: string; locked: string | null; special: boolean; tried: boolean; danger: boolean }
export type Pending5 =
  | { kind: 'door'; turning: string; moment: boolean; title: string; body: string; speaker: string; doors: ResolvedDoor[] }
  | { kind: 'fight'; foe: EnemySpec; lethal: boolean; risk: { injury: number; limb: number; death: number } }
  | { kind: 'battle'; foe: EnemySpec; lethal: boolean; battle: BattleState; result: 'win' | 'lose' | 'retreat' }
  | { kind: 'ending'; cause: string }
  | null;
export interface Stats5 { stops: number; fights: number; wins: number; fortunes: number; limbsLost: number; years: number }
export interface Life5 {
  schema: 5;
  rng: { seed: number; cursor: number };
  age: number; part: 0 | 1 | 2 | 3;            // 한 해의 네 토막
  hero: Hero5; growth: Growth5;
  values: Values; strengths: string[]; marks: Record<string, number>;
  hardship: number;
  people: Person[];
  flags: string[]; seen: Record<string, number>; queue: string[];   // seen: id → 마지막으로 본 나이
  queueTries: Record<string, number>;          // 줄 선 전환점 id → 열지 못한 횟수 (V.queue.maxTries번이면 버린다)
  stopsThisYear: number;
  unchosen: Unchosen[]; tried: string[];       // tried: "전환점id#문번호" (도감으로 옮겨진다)
  log: LogLine[]; timeline: TimelineEntry[];
  pending: Pending5;
  stats: Stats5;
  seq: number;
  ended: { cause: string; age: number } | null;
}
export type Command5 = { type: 'step' } | { type: 'answer'; index: number };
