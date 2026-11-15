// 화면에 나갈 말: 인생 상태를 화면이 그대로 그릴 수 있는 글과 그림 자료로 바꾼다.
// Preact도 DOM도 쓰지 않는다 (Node에서 시험한다). 가치관 점수는 숫자로 내지 않고 말로만 바꾼다.
import { josa } from '../../core/josa';
import { fmtMoney } from '../../core/util';
import { FRUIT_BY_ID } from '../../data/fruits';
import { SEA_BY_ID } from '../../data/seas';
import { weaponOfSkills, type SceneInput, type Weapon, type Who } from '../../ui/pixel/pixelArt';
import { fullName } from '../core/birth';
import { LIMB_NAME, LIMBS } from '../core/body';
import { gapOf } from '../core/fight';
import { isDeep, topValues } from '../core/values';
import { V } from '../data/balance';
import { STRENGTHS } from '../data/strengths';
import { TURNING_BY_ID } from '../data/turnings';
import { VALUE_NAME } from '../data/values';
import {
  BRANCH_NAME, ILLNESS_NAME, INJURY_NAME, LIMB_STATE_WORD, LINEAGE_NAME, STANDING_NAME, TIER_WORD, WEALTH_NAME,
} from '../data/words';
import type { Branch, EnemySpec, Life5, LogLine, Pending5, Person, Standing } from '../core/types';

// ── 화면의 말을 가르는 경계 (게임 규칙의 수가 아니라 말씨의 기준이다) ──
/** 위험 확률 → 말: 이 값 미만이면 그 말 */
const RISK_WORDS: readonly [number, string][] = [[0.03, '거의 없다'], [0.15, '낮다'], [0.4, '높다']];
const RISK_TOP = '매우 높다';
const RISK_NONE = '없다';
/** 상대의 힘 ÷ 내 힘 → 상대의 격: 이 값 미만이면 그 말 */
const MATCH_WORDS: readonly [number, string][] = [[0.7, '한참 아래다'], [1.15, '해볼 만하다'], [1.8, '버겁다']];
const MATCH_TOP = '상대가 안 된다';
/** 기록 칸에 남기는 줄 수 */
const STORY_KEEP = 160;
/** 큰 일만 고를 때 함께 남기는 무게 */
const HEAVY: ReadonlySet<LogLine['weight']> = new Set(['heavy', 'year']);

// ── 나이 ──
const ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

/** 3 → '세 살', 20 → '스무 살', 21 → '스물한 살'. 100 이상(과 1 미만)은 숫자로 '100살' */
export function ageWord(n: number): string {
  if (n < 1 || n >= 100) return `${n}살`;
  const t = Math.floor(n / 10), o = n % 10;
  const word = n === 20 ? '스무' : TENS[t] + ONES[o];
  return `${word} 살`;
}

/** 해 구분선: '열일곱 살 · 로그타운' (섬이 없으면 나이만) */
export function yearLabel(l: { age: number; island?: string }): string {
  return l.island ? `${ageWord(l.age)} · ${l.island}` : ageWord(l.age);
}

/** 가장 높은 가치관 두 가지를 말로: 깊으면 '의리가 깊다', 아니면 '의리를 안다' */
export function valueWords(s: Life5): string[] {
  return topValues(s, 2).map((id) => josa(isDeep(s, id) ? `${VALUE_NAME[id]}이(가) 깊다` : `${VALUE_NAME[id]}을(를) 안다`));
}

// ── 프로필 ──
export interface ProfileView {
  name: string; age: string; standing: string; born: string; island: string;
  values: string[]; strengths: { name: string; text: string }[];
  body: { limb: string; word: string }[];              // 멀쩡하지 않은 부위만
  skills: { name: string; tier: string }[];            // 단계가 1 이상인 갈래만
  master: string | null; fruit: string | null;
  money: string; fame: string;                         // fame: 해적 · 칠무해는 '현상금 n 베리', 그 밖은 '이름값 n' (0이면 빈 글자)
  hp: number; hurts: string[];                         // 부상과 병의 이름
}

const BOUNTY_STANDINGS: readonly Standing[] = ['pirate', 'warlord'];
const BRANCHES: readonly Branch[] = ['fist', 'sword', 'gun', 'observation', 'armament', 'conqueror', 'fruit'];

function fameWord(s: Life5): string {
  const fame = Math.round(s.hero.fame);
  if (fame <= 0) return '';
  return BOUNTY_STANDINGS.includes(s.hero.standing) ? `현상금 ${fmtMoney(fame * V.fame.bounty)} 베리` : `이름값 ${fmtMoney(fame)}`;
}

export function profileView(s: Life5): ProfileView {
  const h = s.hero, g = s.growth;
  const hurts = h.injuries.map((i) => INJURY_NAME[i.severity]);
  if (h.illness) hurts.push(ILLNESS_NAME[h.illness.id] ?? '병');
  return {
    name: fullName(h).trim(),
    age: ageWord(s.age),
    standing: STANDING_NAME[h.standing],
    born: `${h.town}의 ${WEALTH_NAME[h.wealth]} · ${LINEAGE_NAME[h.lineage]}`,
    island: h.island,
    values: valueWords(s),
    strengths: STRENGTHS.filter((x) => s.strengths.includes(x.id)).map((x) => ({ name: x.name, text: x.text })),
    body: LIMBS.flatMap((l) => {
      const st = h.limbs[l];
      return st === 'ok' ? [] : [{ limb: LIMB_NAME[l], word: LIMB_STATE_WORD[st] }];
    }),
    skills: BRANCHES.filter((b) => g.tier[b] >= 1).map((b) => ({ name: BRANCH_NAME[b], tier: TIER_WORD[g.tier[b]] ?? '' })),
    master: g.master ? `${g.master.name} (${BRANCH_NAME[g.master.branch]})` : null,
    fruit: h.fruit ? FRUIT_BY_ID[h.fruit.id]?.name ?? null : null,
    money: `${fmtMoney(h.money)} 베리`,
    fame: fameWord(s),
    hp: Math.round(h.hp),
    hurts,
  };
}

// ── 얼굴 ──
function personWho5(p: Person): Who {
  return { key: p.canon ?? p.id + p.name, gender: p.gender, age: p.age, species: p.species, faction: p.faction };
}

export function peopleView(s: Life5): { name: string; relation: string; gone: boolean; who: Who }[] {
  return s.people.map((p) => ({ name: p.name, relation: p.relation, gone: !p.alive, who: personWho5(p) }));
}

function factionOf(st: Standing): NonNullable<Who['faction']> {
  switch (st) {
    case 'pirate': case 'warlord': case 'bountyHunter': return 'pirate';
    case 'marine': case 'cp': return 'marine';
    case 'revolution': return 'rev';
    default: return 'civil';
  }
}

/** 단계가 가장 높은 무술 갈래의 무기 (모두 0이면 맨주먹) */
function heroWeapon(s: Life5): Weapon {
  const t = s.growth.tier;
  if (t.sword > 0 && t.sword >= t.gun && t.sword >= t.fist) return 'sword';
  if (t.gun > 0 && t.gun >= t.fist) return 'gun';
  return 'fist';
}

export function heroWho5(s: Life5): Who {
  return { key: `hero:${s.rng.seed}`, gender: s.hero.gender, age: s.age, species: s.hero.species, faction: factionOf(s.hero.standing), weapon: heroWeapon(s) };
}

/** 떠 있는 문의 말하는 사람: 주인공, 원작 인물, 곁의 사람(없으면 관계 이름) */
export function speakerOf(s: Life5, p: Extract<Pending5, { kind: 'door' }>): { name: string; who: Who } {
  const sp = TURNING_BY_ID[p.turning]?.speaker;
  if (!sp) return { name: p.speaker, who: { key: p.speaker } };
  if (sp === 'hero') return { name: p.speaker, who: heroWho5(s) };
  if ('canon' in sp) return { name: p.speaker, who: { key: sp.canon } };
  const person = s.people.find((x) => x.alive && x.relation === sp.relation);
  return person ? { name: person.name, who: personWho5(person) } : { name: p.speaker, who: { key: p.speaker } };
}

export function foeWho(e: EnemySpec): Who {
  return {
    key: e.faceKey ?? e.canon ?? e.id + e.name, gender: e.gender, age: e.age, species: e.species,
    faction: e.faction, form: e.form, weapon: weaponOfSkills(e.skills),
  };
}

// ── 싸움 앞 ──
function bandWord(x: number, bands: readonly [number, string][], top: string): string {
  return bands.find(([lim]) => x < lim)?.[1] ?? top;
}

/** 위험을 말로. 목숨을 걸지 않은 싸움(death 0)은 '없다' */
export function riskWords(risk: { injury: number; limb: number; death: number }): { injury: string; limb: string; death: string } {
  return {
    injury: bandWord(risk.injury, RISK_WORDS, RISK_TOP),
    limb: bandWord(risk.limb, RISK_WORDS, RISK_TOP),
    death: risk.death === 0 ? RISK_NONE : bandWord(risk.death, RISK_WORDS, RISK_TOP),
  };
}

/** 상대의 격: 상대의 힘 ÷ 내 힘으로 '한참 아래다' ~ '상대가 안 된다' */
export function matchWord(s: Life5, foe: EnemySpec): string {
  return bandWord(gapOf(s, foe), MATCH_WORDS, MATCH_TOP);
}

// ── 장면 ──
const ISLAND_COLORS = ['#70b582', '#c8b070', '#8ab0d0', '#b0d890', '#d0a0a0', '#90c0a0'];

export function sceneOf(s: Life5): SceneInput {
  const h = s.hero, p = s.pending;
  const sea = SEA_BY_ID[h.sea];
  const foe = p && (p.kind === 'fight' || p.kind === 'battle') ? foeWho(p.foe) : null;
  const hero = heroWho5(s);
  return {
    hero,
    crew: s.people.filter((x) => x.alive && x.kind === 'crew').map(personWho5),
    foe,
    sailing: false,
    place: h.island ? `${sea.name} · ${h.island}` : sea.name,
    islandColor: ISLAND_COLORS[sea.stage - 1] ?? ISLAND_COLORS[0],
    flag: hero.faction ?? 'civil',
    aura: h.fruit ? '#c890ff' : s.growth.tier.armament > 0 ? '#ff7060' : null,
  };
}

// ── 기록 ──
/** 떠오른 줄(id ≤ shownId) 가운데 마지막 160줄. onlyHeavy면 가벼운 줄을 뺀다 (해 구분선은 남긴다) */
export function storyLines(s: Life5, shownId: number, onlyHeavy: boolean): LogLine[] {
  return s.log.filter((l) => l.id <= shownId && (!onlyHeavy || HEAVY.has(l.weight))).slice(-STORY_KEEP);
}
