import type { Stats, StatKey, Species, SeaId, Person, Injury, Illness, BattleState, EnemySpec, LogType, CrewRole } from '../shared/core/types';
import type { ExtraCareerId } from '../data/rival-careers';
import type { EntryGate } from '../data/voyage';
import type { WorldEventId } from '../data/world-history';
import type { ArrivalRoute } from './voyage';
import type { CombatStyle, MartialBranch } from '../data/combat-styles';
export type { Stats, StatKey, Species, SeaId, Person, EnemySpec, BattleState };

export type ValueId = 'justice' | 'greed' | 'ambition' | 'romance' | 'inquiry' | 'loyalty' | 'freedom' | 'dominion' | 'peace';
export type Values = Record<ValueId, number>;                    // 각 0~100
/** 3×3 성향표의 현재 칸과 아직 칸을 옮기지 못한 선택의 방향. */
export interface Personality5 {
  row: number; col: number;
  pullRow: number; pullCol: number;
  choices: number;
  hold: number; established: boolean;
}
export type HomeId = 'loguetown' | 'water7' | 'wano' | 'fishman' | 'sky' | 'zou';
export type RivalCareer = 'captain' | 'fifth' | 'marine' | 'warden' | ExtraCareerId;
export type RivalLoveStatus = 'dating' | 'steady' | 'partners' | 'friends' | 'married';
export type ChildhoodOutcome = 'loss' | 'parentSafe' | 'mentor' | 'rival';
export type Wealth = 'poor' | 'common' | 'comfortable' | 'noble';
export type Lineage = 'orphan' | 'commoner' | 'marineFamily' | 'pirateChild' | 'samurai' | 'outcast';
export type Standing = 'child' | 'civil' | 'pirate' | 'marine' | 'revolution' | 'bountyHunter' | 'warlord'
  | 'shipwright' | 'cp' | 'settled' | 'prisoner' | 'retired';
export type Limb = 'eyeL' | 'eyeR' | 'armL' | 'armR' | 'legL' | 'legR';
export type WoundPart = Limb | 'head' | 'torso';
export type WoundKind = 'bruise' | 'cut' | 'burn' | 'fracture';
export type Wound5 = Injury & { part?: WoundPart; kind?: WoundKind };
export type LimbState = 'ok' | 'lost' | 'basic' | 'superior';    // basic 돈으로 단 것, superior 기연으로 얻은 것
export type Activity = 'train' | 'work' | 'study' | 'roam' | 'family' | 'rest';
export type Branch = MartialBranch | 'observation' | 'armament' | 'conqueror' | 'fruit';
/** 사건의 글이 전제하는 것. 맞지 않으면 그 전환점은 오지 않고, 그 문은 잠긴다 (needs.ts) */
export type Need = 'crew' | 'spouse' | 'child' | 'sibling' | 'parent' | 'swim' | 'sword' | 'gun' | 'fist' | 'arms' | 'ship';

export interface Hero5 {
  name: string; surname: string | null;        // 고아는 null (성을 모름)
  secretSurname: string | null;                // 숨겨진 진짜 성. 밝혀지면 surname으로 옮긴다
  gender: 'm' | 'f'; species: Species;
  home: HomeId; town: string; wealth: Wealth; lineage: Lineage;
  talents: string[];                           // src/data/talents.ts 의 id
  base: Stats; hp: number;                     // hp 0~100
  injuries: Wound5[]; illness: Illness | null;
  limbs: Record<Limb, LimbState>;
  fruit: { id: string; eatenAt: number } | null;
  money: number; fame: number; rank: number;
  standing: Standing; island: string; sea: SeaId;
  alive: boolean;
  bornWealth: Wealth;                          // 태어날 때의 집안 형편 (몰락을 세는 데 쓴다)
  provisions?: number;
  potential?: PotentialId;                     // 타고난 잠재력 (data/stages.ts). 옛 저장에는 없다: 균형형으로 본다
  skyAcclimating?: true;                       // 하늘섬에 닿은 뒤 첫 토막
  weapon?: string;                             // 전투에 가져가는 무기의 상품 ID
}
export type PotentialId = 'genius' | 'balanced' | 'late' | 'special';
export type DreamId = 'pirateKing' | 'bestSword' | 'bestFist' | 'bestWeapon' | 'bestShot' | 'marineTop' | 'changeWorld' | 'worldEnd' | 'truth' | 'treasure' | 'peace';
/** 섬 서약 (하늘섬 티카). 옛 저장의 생애 서약 기록(history의 life_*)은 읽기만 한다 */
export interface VowState {
  active: { id: string; value: ValueId; title: string; target: string; since: number; island: string; progress: string[]; targetPersonId?: string } | null;
  history: { id: string; result: 'kept' | 'failed' }[];
}
/** 꿈의 서약 (core/dream-vow.ts) */
export interface DreamVowState {
  /** 꿈마다 지난 길목의 수 (같은 길목을 두 번 받지 않는다) */
  cleared: Partial<Record<DreamId, number>>;
  /** 지금 꿈을 바꾸지 않고 이어 지난 길목의 수 */
  streak: number;
  /** 지금 꿈을 약속한 사람 (없으면 스스로) */
  to: string | null;
}
/** v7 인연의 약속 하나 (data/promises.ts · core/goals.ts) */
export interface PromiseRecord {
  id: string;                                  // data/promises.ts의 약속 id
  personId: string; name: string; relation: string;
  madeAt: number;                              // 약속한 나이
  status: 'active' | 'kept' | 'lost';
  doneAt?: number;                             // 지켰거나 지킬 수 없게 된 나이
  orphaned?: boolean;                          // 그 사람이 세상을 떠나 약속이 유언으로 남았다
}
/** v7 항해의 목표: 꿈의 서약(주목표) 곁의 인연의 약속들과, 다음 약속을 물을 때 */
export interface GoalState {
  promises: PromiseRecord[];
  offer: { id: string; personId: string } | null;   // 지금 떠 있는 약속의 장면
  asked: string[];                             // 이미 물어본 약속 id (한 인생에 한 번)
  nextAt: number;                              // 이 나이부터 다음 약속을 물을 수 있다
}
/** v7 성장의 기록: 레벨 · 등급과 해마다의 전투력 (core/level.ts) */
export interface RpgState {
  level: number; grade: string; peak: number;
  history: Record<number, number>;             // 나이 → 그해 끝의 종합 전투력
  mark: { age: number; base: Stats; branch: Record<string, number>; rating: number; level: number } | null;   // 올해가 시작될 때
}
/** 스승에게 배운 기술(전수)과 특훈의 기록 (프로필에 남는다) */
export interface MentorRecord {
  kind: 'technique' | 'training';
  teacher: string;
  age: number;
  detail: string;
  style?: CombatStyle;
  mastery?: number;
  stats?: Partial<Stats>;
}
export interface Growth5 {
  styleMastery: Partial<Record<CombatStyle, number>>;
  styleFocus: Partial<Record<MartialBranch, CombatStyle>>;
  styleWeapons: Partial<Record<CombatStyle, string>>;
  weapons: string[];                          // 보관 중이거나 장착한 실물 무기
  primaryStyle: CombatStyle | null;
  styleBonds: Partial<Record<CombatStyle, { teacherId: string; island: string; since: number; practice: number; adopted: boolean; refined: boolean }>>;
  tier: Record<Branch, number>;                // 연 오의 단계 0~6
  mastery: Record<Branch, number>;             // 0~100, 다음 단계로 가는 숙련
  master: { name: string; branch: Branch; cap: number; yearsLeft: number; paid: boolean } | null;
  pref: Record<Branch, number>;                // 선호도 (숙련과 별개): 수련할 갈래를 정한다. 재능 · 수련 · 고른 일 · 스승이 쌓는다
  path: Branch | null;                         // 기록에 알린 지금의 길 (바뀌면 큰 일로 남긴다)
  mentorHistory: MentorRecord[];               // 스승에게 배운 기술과 특훈 이력
}
export type LogWeight = 'light' | 'heavy' | 'year';
/** 기록 한 줄. island: 나이·장소 구분선(weight 'year')에만 있다. 그 뒤 기록이 일어난 섬 이름 */
export interface LogLine { id: number; age: number; text: string; weight: LogWeight; type: LogType; island?: string; moved?: true }
export interface Unchosen { age: number; turning: string; title: string; door: string }
export interface NewsIssue {
  id: string; age: number; part: number; kind: 'big' | 'world' | 'local' | 'bounty';
  title: string; body: string; logId?: number; amount?: number;
}
/** 연표 한 줄. standing: 처지가 이리로 바뀐 줄, canon: 이 원작 인물이 말한 전환점에서 고른 줄, limb: 이 부위를 잃은 줄 */
export interface TimelineEntry {
  age: number; text: string; standing?: Standing;
  choice?: string;                            // 당시 화면에서 결정한 문의 키. 인물 이름이 담긴 원문을 엔딩에도 쓴다.
  canon?: string;                              // 원작 인물 id (3단계부터). 옛 저장에는 표시 이름이 남아 있다. 있는지만 본다
  limb?: Limb;
}

export type Cond =
  | { c: 'history'; id: WorldEventId; has: boolean }
  | { c: 'shipMemory'; stage: 'unnamed' | 'named' | 'farewell' }
  | { c: 'single' }
  | { c: 'rivalAtWork'; career: ExtraCareerId }
  | { c: 'defeatedFoe' }
  | { c: 'anyOf'; conditions: Cond[] }
  | { c: 'watchMeal'; stage: 'first' | 'shelf' | 'nextWatch' | 'custom' }
  | { c: 'ashore' }
  | { c: 'disciple'; stage: DiscipleStage }
  | { c: 'styleBond'; style: CombatStyle; phase: 'new' | 'ready' | 'refine' }
  | { c: 'lifePreparation'; mode: 'guard' | 'duel' }
  | { c: 'age'; min?: number; max?: number }
  | { c: 'standing'; is: Standing[] }
  | { c: 'home'; is: HomeId[] }
  | { c: 'wealth'; min?: Wealth; max?: Wealth }
  | { c: 'lineage'; is: Lineage[] }
  | { c: 'value'; id: ValueId; deep: boolean }
  | { c: 'trait'; id: string; has: boolean }
  | { c: 'strength'; id: string; has: boolean }
  | { c: 'money'; min: number }
  | { c: 'entryContact'; gate: 'fishman' | 'zou' }
  | { c: 'weapon'; id: string; has: boolean }
  | { c: 'equippedWeapon' }
  | { c: 'prime' }
  | { c: 'fame'; min: number }
  | { c: 'bounty'; min: number }
  | { c: 'grade'; is: string[] }                 // 화면에 표시하는 종합 전투 등급
  | { c: 'turningSeen'; id: string; has: boolean } // 이 인생에서 해당 전환점을 이미 보았는가
  | { c: 'choiceAgo'; turning: string; door: number; years?: number }
  | { c: 'canonPerson'; id: string; has: boolean; kinds?: Person['kind'][] }
  | { c: 'opponent'; canon: string }
  | { c: 'tier'; branch: Branch | 'any'; min: number }
  | { c: 'flag'; id: string; has: boolean }
  | { c: 'fruit'; has: boolean }
  | { c: 'limbLost'; min: number; limbs?: Limb[] }  // limbs가 있으면 그 부위만 센다 (의수 · 의족은 팔다리만)
  | { c: 'sea'; is: SeaId[] }
  | { c: 'hardship'; min: number }
  | { c: 'secret'; known: boolean }
  | { c: 'town'; is: string[] }                 // 태어난 마을 (hero.town)
  | { c: 'standingYears'; min: number }         // 지금의 처지가 된 지 몇 해
  | { c: 'island'; is: string[]; not?: boolean } // 지금 있는 섬 (hero.island). not이면 그 섬들이 아닐 때
  | { c: 'species'; is: Species[] }             // 종족
  | { c: 'kin'; who: 'sibling' | 'parent'; has: boolean; minAge?: number }
  | { c: 'siblingReunion'; action?: 'share' | 'join' }
  | { c: 'person'; relation: string; has: boolean; kinds?: Person['kind'][]; minAge?: number }
  | { c: 'path'; is: (Branch | 'none')[] }      // 지금 걷는 길 (growth.path, 아직 없으면 'none')
  | { c: 'canonAge'; id: string; min?: number; max?: number }
  | { c: 'dream'; has: boolean; done?: boolean; is?: DreamId[]; years?: number };   // 꿈을 품었는가 (done: 이루었는가, is: 그 꿈인가, years: 품은 지 몇 해)

export type Fx =
  | { op: 'nameShip'; name: string }
  | { op: 'repairShip'; mark: ShipRepair }
  | { op: 'partShip'; how: 'helm' | 'playground' | 'house' }
  | { op: 'watchMeal'; action: 'share' | 'close' | 'reserve' | 'passOn' }
  | { op: 'kumaFight' } | { op: 'trainingReturn' }
  | { op: 'resumeVoyage'; stores: number }
  | { op: 'rememberChildhood'; storyId: string; outcome: ChildhoodOutcome }
  | { op: 'separateSpouse' }
  | { op: 'rivalDuel' } | { op: 'recruitRival' }
  | { op: 'recruitDefeated' }
  | { op: 'disciple'; action: 'accept' | 'train' | 'sail' | 'delay' | 'resolve'; outcome?: DiscipleRecord['outcome'] }
  | { op: 'beginStyle'; style: CombatStyle; teacherRelation?: string }
  | { op: 'adoptStyle' | 'refineStyle'; style: CombatStyle }
  | { op: 'lifeMilitary' }
  | { op: 'lifeEvent'; id: string; actor?: string }
  | { op: 'lifeWait'; ready: string; otherwise: string }
  | { op: 'base'; key: StatKey | 'all'; add: number }
  | { op: 'hp'; add: number }
  | { op: 'money'; add: number; trade?: boolean }
  | { op: 'fame'; add: number }
  | { op: 'escapeNotoriety'; riot?: boolean }
  | { op: 'rank'; add: number }
  | { op: 'standing'; to: Standing }
  | { op: 'wealth'; to: Wealth }                         // 집안 형편이 바뀐다 (몰락 등)
  | { op: 'move'; island: string; sea: SeaId }
  | { op: 'moveHome' }                                  // 태어난 마을과 고향의 바다로 돌아간다
  | { op: 'mastery'; branch: Branch; add: number }
  | { op: 'tier'; branch: Branch; to: number }
  | { op: 'traitAwaken'; branch: Branch }
  | { op: 'master'; name: string; branch: Branch; cap: number; years: number; paid: boolean }
  /** 스승의 기술 전수: 그 갈래의 지금 유파에 숙련을 바로 쌓고 이력에 남긴다 */
  | { op: 'learnTechnique'; teacher: string; branch: 'fist' | 'sword' | 'gun'; name: string; add: number }
  /** 스승의 특훈: 기본 능력치를 올리고 이력에 남긴다 */
  | { op: 'specialTraining'; teacher: string; training: string; stats: Partial<Stats> }
  | { op: 'flag'; id: string; newHull?: true } | { op: 'unflag'; id: string }
  | { op: 'mark'; id: string }
  | { op: 'dream'; id: DreamId }
  | { op: 'vowStart'; id: string }
  | { op: 'promise'; id: string | null }                // v7 약속의 장면: 약속한다(id) · 약속하지 않는다(null)
  | { op: 'parentMissing' }                              // 살아 있는 부모 하나가 바다에서 돌아오지 않는다 (행방불명)
  | { op: 'parentFound' }                                // 행방불명된 부모를 다시 만난다 (없으면 처음 만나는 부모로 들인다)
  | { op: 'welcomeSibling'; action: SiblingWelcomeAction }
  | { op: 'siblingReunion'; action: SiblingReunionAction }
  | { op: 'sail'; island: string; route: 'calm' | 'dream' | 'wild' }   // 고른 항로로 섬을 옮긴다 (core/voyage.ts)
  | { op: 'skiff'; buy: number; gate?: 'sky' | 'fishman' | 'wano' }   // 나룻배를 사고(buy베리) 외딴 섬이면 나가는 값을 치른다 (core/voyage.ts)
  | { op: 'entry'; gate: EntryGate; island: string; sea: SeaId; route: ArrivalRoute; option: number }
  | { op: 'entryPass'; gate: EntryGate }
  | { op: 'deepWater' }
  | { op: 'buyWeapon'; id: string }
  | { op: 'receiveWeapon'; id: string; stow?: boolean }
  | { op: 'giveAwayWeapon'; id: string }
  | { op: 'serviceWeapon' }
  | { op: 'hardship'; add: number }
  // canon이 있으면 이름 · 성별 · 나이를 원작에서 (data/canon.ts). age: 그 나이 · 주인공보다 n살 위/아래. 없으면 주인공과 같은 나이
  | { op: 'person'; kind: Person['kind']; relation: string; name?: string; canon?: string; reuseName?: boolean;
      age?: number | { older: number } | { younger: number }; gender?: 'm' | 'f'; species?: Species; faction?: Person['faction'];
      role?: CrewRole;
      level?: number;                          // 동료의 처음 레벨 (이름난 사람은 처음부터 높다). 없으면 V.person.crew.level
      medicalSkill?: number;                   // 선의의 치료 솜씨. 전투 레벨과 별개
      years?: number }                         // 임시 동행: 이 햇수만 함께하고 제 길로 떠난다 (kind 'crew'에만)                          // 동료(crew)의 싸움 자리. 없으면 V.person.crew.role
  | { op: 'pref'; branch: Branch; add: number } // 그 갈래의 선호도를 올린다 (자잘한 일도 쓸 수 있다)
  | ({ op: 'personChange'; kind?: Person['kind']; bond?: number; rename?: string; alias?: string } & ({ relation: string } | { who: ContactRole }))
  | { op: 'crewTrain'; add: number }            // 살아 있는 동료 모두의 레벨을 올린다 (해군 분대를 키운다)
  | { op: 'partCrew'; prefix: string }          // 관계 글이 prefix로 시작하는 동료가 떠난다: 동료에서 빠지고 아는 사람(ally)으로 남는다
  | { op: 'losePerson'; relation: string }
  | { op: 'losePerson'; who: 'crew' | 'spouse' | 'child' | 'sibling' | 'parent' }   // 관계 글과 상관없이 그 갈래의 사람 하나
  | { op: 'injury'; severity: Injury['severity']; part?: WoundPart; kind?: WoundKind }
  | { op: 'loseLimb'; limb: Limb | 'random' }
  | { op: 'prosthetic'; grade: 'basic' | 'superior' }
  | { op: 'illness'; id: string }
  | { op: 'eatFruit'; id: string | 'random' }
  | { op: 'reveal' }                                    // 숨긴 성씨가 밝혀진다
  // next: 싸움 뒤에 이어질 전환점 (win 이기면 · lose 지거나 간신히 빠져나오면 · back 맞서지 않고 물러나면). 이기고 win이 없으면 늘 그렇듯 싸움 뒤의 문
  | { op: 'fight'; foe: string; lethal: boolean; forced: boolean; next?: FightNext; atSea?: true }
  | { op: 'queue'; turning: string }
  | { op: 'log'; text: string; weight: LogWeight }
  | { op: 'timeline'; text: string; canon?: string }   // canon: 원작 인물과 겹친 순간이면 그 인물 id (엔딩의 「겹친 원작 순간」)
  | { op: 'die'; cause: string }
  | { op: 'chance'; p: number; skillCheck?: boolean; then: Fx[]; else?: Fx[] };

export interface FightNext { win?: string; lose?: string; back?: string }

export interface Door {
  news?: Pick<NewsIssue, 'title' | 'body'>;
  label: string; hint: string;
  when?: Cond[];                               // 출생 · 처지의 벽. 안 맞으면 잠긴다
  special?: ValueId;                           // 이 가치관이 깊어야 열리는 특별한 문
  values?: Partial<Values>;                    // 고르면 오르는 점수
  meal?: boolean;
  mark?: string;                               // 정신적 강점으로 가는 표시
  fx: Fx[];
  danger?: boolean;
  needs?: Need[];                              // 안 맞으면 잠기고 까닭이 보인다
  closes?: boolean;                            // 이 문을 고르면 이 전환점은 그 인생에서 다시 오지 않는다
}
export interface Turning {
  id: string;
  disciple?: DiscipleStage;
  kind: 'door' | 'moment' | 'fortune' | 'misfortune';    // moment 큰 계기, misfortune 고를 수 없는 불행 (문 없음)
  when: Cond[]; weight: number; repeat: 'once' | { years: number };
  fortuneOf?: ValueId;                         // kind 'fortune': 이 가치관이 가장 높을 때 온다
  speaker: 'hero' | { canon: string } | { relation: string } | { who: ContactRole };
  title: string; body: string;
  recall?: { when: Cond[]; text: string }[];    // 실제로 겪은 과거에만 보이는 장면 속 한마디
  intro?: readonly string[];                   // 선택창이 열리기 전에 이야기 창에 한 줄씩 보여 준다
  automatic?: { unless: Cond[]; fx: Fx[] };     // 조건을 채우지 못하면 선택 대신 즉시 일어나는 일
  doors: Door[];                               // misfortune은 빈 배열
  fx?: Fx[];                                   // misfortune이 일으키는 일
  tags?: ('sea' | 'night' | 'underground')[];
  needs?: Need[];                              // 안 맞으면 뽑히지 않는다
  max?: number;                                // 한 인생에 많아야 이만큼. 없으면 once는 1, 되풀이는 V.turning.maxRepeat
}
export interface Minor {
  id: string; when: Cond[]; weight: number; cooldownYears: number;
  needs?: Need[];                              // 안 맞으면 이 일은 일어나지 않는다
  // lean이 빈 객체면 누구나. needs · when이 안 맞는 결과는 고르지 않는다 (when: 반대쪽 가치관이 깊으면 빼는 데 쓴다)
  outcomes: { lean: Partial<Values>; text: string[]; fx: Fx[]; needs?: Need[]; when?: Cond[] }[];
}
export interface ResolvedDoor { label: string; hint: string; locked: string | null; special: boolean; tried: boolean; danger: boolean; goal?: string }
export type Pending5 =
  | { kind: 'door'; turning: string; moment: boolean; title: string; body: string; speaker: string; doors: ResolvedDoor[]; discipleId?: string; openedTick?: number }
  | { kind: 'fight'; foe: EnemySpec; lethal: boolean; risk: { injury: number; limb: number; death: number }; next?: FightNext; atSea?: true }
  | { kind: 'battle'; foe: EnemySpec; lethal: boolean; battle: BattleState; result: 'win' | 'lose' | 'retreat'; next?: FightNext; atSea?: true; minor?: { outcomeLine: string }; escape?: { roll: number; need: number } }
  | { kind: 'ending'; cause: string }
  | null;
export interface Stats5 {
  stops: number; fights: number; wins: number; fortunes: number; limbsLost: number; years: number;
  named: Record<string, { fights: number; wins: number }>;   // 이름 있는 상대와의 싸움, 상대의 바다(v4 보스의 sea)별
  stopsAt: number[];                           // 문을 고른(멈춘) 나이들, 멈출 때마다 하나씩
  stopTries: number;                           // 한 해의 진행이 멈추려 한 횟수
  emptyStops: number;                          // 그 가운데 띄울 전환점이 없던 횟수
  namedMet: number;                            // 이름 있는 상대와 마주친 횟수 (싸웠든 물러났든)
}
export interface TraitState {
  earned: string[];
  active: string[];
  evidence: Record<string, string[]>;
  changedAt: number | null;
  crewSeen: string[];
}
export type DiscipleStage = 'meeting' | 'training' | 'sailing' | 'reunion';
export type SiblingWelcomeAction = 'hold' | 'name' | 'letter';
export type SiblingReunionAction = 'share' | 'join' | 'part';
export type ContactRole = 'crew' | 'spouse' | 'child' | 'sibling' | 'parent';
export interface DiscipleRecord {
  personId: string; style: CombatStyle; since: number; island: string;
  trainedAt?: number; sailedAt?: number; readyAt?: number;
  outcome?: 'duel' | 'reconciled' | 'reported';
}
export interface Life5 {
  watchMeal?: {
    hullId: number; sailorId: string; sharedAt: number; stage: 'shared' | 'reserved' | 'passed' | 'closed';
    shelfSince?: number; originalCrew?: string[];
  };
  childhoodMemory?: { storyId: string; outcome: ChildhoodOutcome; town: string; personId: string; personName: string; relation: string };
  rivalLove?: { personId: string; status: RivalLoveStatus; since: number };
  rivalAffinity?: { personId: string; timePoints: number; lastSharedAge: number };
  rival?: { personId: string; career: RivalCareer; crewName: string; stage: number; port: string; fame: number };
  defeatedFoe?: string;                       // 처리 대기 중인 전투 뒤 선택의 실제 상대 ID
  /** 실제로 받아들인 제자들. 기술과 시기는 가르치기 시작한 때의 사실로 남긴다. */
  disciples?: DiscipleRecord[];
  /** 코스별 사실과 실제로 진행한 토막. 옛 저장에는 없다. */
  lifeStory?: {
    elapsed: number;
    events: { id: string; age: number; part: number; island: string; elapsed: number; actorId?: string; method?: 'guard' | 'support' }[];
    wait: { readyAt: number; expiresAt: number; island: string; then: string; otherwise: string } | null;
  };
  traits?: TraitState;
  traitScene?: ('sea' | 'night' | 'underground')[];
  traitSource?: string;
  schema: 5;
  rng: { seed: number; cursor: number };
  age: number; part: 0 | 1 | 2 | 3;            // 한 해의 네 토막
  hero: Hero5; growth: Growth5;
  values: Values; personality: Personality5; strengths: string[]; marks: Record<string, number>;
  hardship: number;
  people: Person[];
  siblingBirths?: { age: number; name: string; gender: Person['gender'] }[];   // 주인공이 이 나이가 되면 동생이 태어난다
  siblingMeeting?: string;                   // 지금 재회 선택창에 나온 형제의 인물 ID
  flags: string[]; seen: Record<string, number>; queue: string[];   // seen: id → 마지막으로 본 나이
  seenCount: Record<string, number>;           // 전환점 id → 이번 인생에 열린 횟수
  firstChoiceAge?: Record<string, number>;    // 이번 생에서 이 선택을 처음 한 나이
  closed: string[];                            // closes 문으로 닫힌 전환점 id
  standingSince: number;                       // 지금의 처지가 된 나이
  queueTries: Record<string, number>;          // 줄 선 전환점 id → 열지 못한 횟수 (V.queue.maxTries번이면 버린다)
  storyRest: number;                           // 섬 장편의 다음 장면까지 남은 일상 토막 (V.story.beat · act)
  storyNote: string;                           // 쉼이 시작될 때 띄울 막 제목 (막이 바뀔 때만)
  stopsThisYear: number;
  unchosen: Unchosen[]; tried: string[];       // tried: 이번 인생에 고른 "전환점id#문번호" (도감으로 옮겨진다)
  known: string[];                             // 지난 인생들에서 골라 본 "전환점id#문번호" (새 인생을 만들 때 도감에서 받는다)
  log: LogLine[]; timeline: TimelineEntry[];
  recentLines: string[];                       // 최근에 낸 일상 · 자잘한 일의 글 (V.lines.noRepeat개까지). 이 안의 글은 다시 뽑지 않는다
  pending: Pending5;
  stats: Stats5;
  firstBountyIssued: boolean;
  news?: NewsIssue[];
  pressTick?: number;
  publishedBounty?: number;
  seq: number;
  ended: { cause: string; age: number } | null;
  /** 전성기: from살부터 until살 전까지. 그동안 한 살은 토막을 두 바퀴 돈다 (lap: 지금 두 번째 바퀴인가) */
  prime?: { from: number; until: number; lap: boolean } | null;
  /** 첫 출항: age살에 처음 바다로 나섰다. 그해는 토막을 한 바퀴 더 돈다 (lap: 지금 덧붙은 바퀴인가).
   *  null은 아직 출항 전, undefined는 이 기록이 생기기 전의 옛 저장이라 다시 열지 않는다 */
  debut?: { age: number; lap: boolean } | null;
  /** 꿈 (인생 과업): since살에 품었고, done살에 이루었다 (못 이루었으면 null) */
  dream?: { id: DreamId; since: number; done: number | null } | null;
  /** 서약: 활성 약속 하나와 이번 인생의 결산 기록. 옛 저장은 load.ts에서 빈 값으로 채운다. */
  vows?: VowState;
  dreamVow?: DreamVowState;
  /** v7 항해의 목표 (core/goals.ts). 옛 저장에는 없다: 처음 볼 때 빈 값으로 채운다 */
  goals?: GoalState;
  /** v7 성장의 기록 (core/level.ts). 옛 저장에는 없다 */
  rpg?: RpgState;
  /** 섬을 옮길 때가 되었다: 다음 멈춤에 항로를 고른다 (해가 다 가도록 멈추지 않으면 저절로 옮긴다) */
  sail?: boolean;
  /** 항해 중: 다음 섬으로 가는 바다 위에 있다 (core/passage.ts). 닿으면 null */
  passage?: import('./passage').Passage | null;
  ships?: ShipHull[];
}
export type ShipRepair = 'plank' | 'helm' | 'seam' | 'plating' | 'keel' | 'medicine';
export interface ShipHull {
  id: number; name?: string; acquiredAt?: number;
  repairs: { kind: ShipRepair; age: number; island: string }[];
  helmFrom?: number; spiritAt?: number;
  end?: { kind: 'helm' | 'playground' | 'house' | 'lost' | 'switched'; age: number; island: string };
}
export type Command5 = { type: 'step' } | { type: 'rest' } | { type: 'answer'; index: number } | { type: 'style'; style: CombatStyle }
  | { type: 'equipWeapon'; id: string } | { type: 'traits'; ids: string[] } | { type: 'leave' };
