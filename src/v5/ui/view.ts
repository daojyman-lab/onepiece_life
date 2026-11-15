// 화면에 나갈 말: 인생 상태를 화면이 그대로 그릴 수 있는 글과 그림 자료로 바꾼다.
// Preact도 DOM도 쓰지 않는다 (Node에서 시험한다). 가치관 점수는 숫자로 내지 않고 말로만 바꾼다.
import { josa } from '../../core/josa';
import { fill, fmtMoney } from '../../core/util';
import { FRUIT_BY_ID } from '../../data/fruits';
import { SEA_BY_ID } from '../../data/seas';
import { weaponOfSkills, type SceneInput, type Weapon, type Who } from '../../ui/pixel/pixelArt';
import { fullName } from '../core/birth';
import { LIMB_NAME, LIMBS } from '../core/body';
import { buildEnding } from '../core/ending';
import { gapOf } from '../core/fight';
import type { Meta5 } from '../core/meta';
import { isDeep, topValues } from '../core/values';
import { V } from '../data/balance';
import { STRENGTHS } from '../data/strengths';
import { TURNING_BY_ID, TURNINGS } from '../data/turnings';
import { VALUE_NAME } from '../data/values';
import {
  BRANCH_NAME, ILLNESS_NAME, INJURY_NAME, LIMB_STATE_WORD, LINEAGE_NAME, STANDING_NAME, TIER_WORD, WEALTH_NAME,
} from '../data/words';
import type { Branch, EnemySpec, Life5, LogLine, Pending5, Person, Standing } from '../core/types';
import type { BattleEvent, BattleState, CUnit } from '../../core/types';

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

/** 0 → '갓난아기', 3 → '세 살', 20 → '스무 살', 21 → '스물한 살'. 100 이상은 숫자로 '100살' */
export function ageWord(n: number): string {
  if (n === 0) return '갓난아기';
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
  const who: Who = { key: `hero:${s.rng.seed}`, gender: s.hero.gender, age: s.age, species: s.hero.species, faction: factionOf(s.hero.standing), weapon: heroWeapon(s) };
  const body: NonNullable<Who['body']> = {};
  for (const k of LIMBS) { const st = s.hero.limbs[k]; if (st !== 'ok') body[k] = st; }
  if (Object.keys(body).length) who.body = body;
  return who;
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

export interface FightView { name: string; who: Who; match: string; lethal: boolean; risk: { label: string; word: string }[] }

/** 싸움 앞의 물음: 상대, 상대의 격, 위험 세 줄. 목숨을 걸지 않은 싸움은 죽을 위험이 '없다' */
export function fightView(s: Life5, p: Extract<Pending5, { kind: 'fight' }>): FightView {
  const w = riskWords(p.risk);
  return {
    name: p.foe.name, who: foeWho(p.foe), match: matchWord(s, p.foe), lethal: p.lethal,
    risk: [
      { label: '다칠 위험', word: w.injury },
      { label: '몸을 잃을 위험', word: w.limb },
      { label: '죽을 위험', word: p.lethal ? w.death : RISK_NONE },
    ],
  };
}

// ── 선택 창 ──
export interface DoorView {
  heading: string;                     // 큰 계기면 '큰 계기 · {제목}', 아니면 제목
  moment: boolean; speaker: { name: string; who: Who }; body: string;
  doors: { index: number; label: string; hint: string; locked: string | null; danger: boolean; tags: { text: string; red: boolean }[] }[];
}

/** 선택 창의 자료. 문 옆에는 '전에 골라 본 문' 같은 표시만 붙고, 문이 올리는 가치관은 싣지 않는다 */
export function doorView(s: Life5, p: Extract<Pending5, { kind: 'door' }>): DoorView {
  const sp = speakerOf(s, p);
  const isHero = TURNING_BY_ID[p.turning]?.speaker === 'hero';
  return {
    heading: p.moment ? `큰 계기 · ${p.title}` : p.title,
    moment: p.moment,
    speaker: { name: isHero ? `${sp.name} (나)` : sp.name, who: sp.who },
    body: p.body,
    doors: p.doors.map((d, index) => ({
      index, label: d.label, locked: d.locked, danger: d.danger,
      hint: d.locked ? `✕ ${d.locked}` : d.hint,
      tags: [
        d.special && { text: '특별한 문', red: false },
        d.tried && { text: '전에 골라 본 문', red: false },
        d.danger && { text: '위험', red: true },
      ].filter((t): t is { text: string; red: boolean } => !!t),
    })),
  };
}

// ── 자동 전투 (v4 src/ui/modals/BattleModal.tsx의 hpAt · line을 옮긴다) ──
/** 물약(item 'potion')이 되돌리는 체력의 몫 (v4와 같다) */
const POTION_HEAL = 0.3;

/** 사건 upto개까지 진행했을 때 각 인물의 체력 */
export function hpAt(b: BattleState, upto: number): number[] {
  const hp = b.units.map((u) => u.maxHp);
  for (let i = 0; i < upto && i < b.events.length; i++) {
    const e = b.events[i];
    if (e.k === 'act') hp[e.target] = Math.max(0, hp[e.target] - e.dmg);
    else if (e.k === 'heal') hp[e.target] = Math.min(b.units[e.target].maxHp, hp[e.target] + e.amount);
    else if (e.k === 'item' && e.item === 'potion') hp[e.who] = Math.min(b.units[e.who].maxHp, hp[e.who] + Math.round(b.units[e.who].maxHp * POTION_HEAL));
    else if (e.k === 'drown') hp[e.who] = 0;
  }
  return hp;
}

/** 사건 한 줄의 글 */
export function battleLine(b: BattleState, e: BattleEvent): string {
  return josa(rawBattleLine(b, e));
}
function rawBattleLine(b: BattleState, e: BattleEvent): string {
  const n = (i: number) => b.units[i]?.name ?? '?';
  switch (e.k) {
    case 'round': return `── ${e.n}합 ──`;
    case 'act': {
      if (e.skill === 'bound') return `${n(e.who)}: ${e.name}`;
      const tail = e.dodge ? (e.note ?? '빗나갔다') : e.dmg > 0 ? `${e.dmg}${e.crit ? ' 치명타!' : ''}${e.note ? ` (${e.note})` : ''}` : (e.note ?? '');
      return `${n(e.who)} ▶ ${n(e.target)} 「${e.name}」 ${tail}`.trimEnd();
    }
    case 'heal': return `${n(e.who)} 「${e.name}」 ${n(e.target)} 체력 +${e.amount}`;
    case 'guard': return `${n(e.who)} 「${e.name}」`;
    case 'down': return `${n(e.who)}이(가) 쓰러졌다!`;
    case 'join': return `${n(e.who)}이(가) ${e.side === 'L' ? '우리 편 싸움에 합세했다' : '적의 싸움에 합세했다'}`;
    case 'retreat': return e.ok ? `${n(e.who)}이(가) 물러났다` : `${n(e.who)}이(가) 물러나려다 실패했다`;
    case 'item': return `${n(e.who)}이(가) ${e.name}을(를) 썼다`;
    case 'drown': return `${n(e.who)}이(가) 바다에 빠졌다! 힘이 빠진다…`;
    case 'rest': return `${n(e.who)}이(가) 숨을 고른다`;
    case 'end': return e.result === 'win' ? '★ 승리 ★' : e.result === 'retreat' ? '물러났다' : '패배…';
  }
}

/** 전투 인물의 겉모습: 주인공이면 heroWho5 (몸의 표시까지) */
export function unitWho(s: Life5, u: CUnit): Who {
  if (u.hero) return heroWho5(s);
  return { key: u.faceKey || u.key + u.name, gender: u.gender, age: u.age, species: u.species, faction: u.faction, form: u.form, weapon: weaponOfSkills(u.skills.map((k) => k.id)) };
}

const RESULT_LINE = { win: '이겼다.', lose: '졌다.', retreat: '물러났다.' } as const;

/** 재생이 끝난 뒤의 결과 줄 */
export function resultLine(result: 'win' | 'lose' | 'retreat', lethal: boolean): string {
  return RESULT_LINE[result];
}

// ── 장면 ──
const ISLAND_COLORS = ['#70b582', '#c8b070', '#8ab0d0', '#b0d890', '#d0a0a0', '#90c0a0'];
/** 장면에 그리는 동료 수 (v4 drawScene이 그리는 만큼) */
const SCENE_CREW = 3;

export function sceneOf(s: Life5): SceneInput {
  const h = s.hero, p = s.pending;
  const sea = SEA_BY_ID[h.sea];
  const foe = p && (p.kind === 'fight' || p.kind === 'battle') ? foeWho(p.foe) : null;
  const hero = heroWho5(s);
  return {
    hero,
    crew: s.people.filter((x) => x.alive && x.kind === 'crew').slice(0, SCENE_CREW).map(personWho5),
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

/** 연표: 나이 말과 글. 같은 나이 · 같은 글이 연달아 나오면 한 번만 */
export function timelineView(s: Life5): { age: string; text: string }[] {
  return s.timeline
    .filter((e, i, a) => i === 0 || a[i - 1].age !== e.age || a[i - 1].text !== e.text)
    .map((e) => ({ age: ageWord(e.age), text: e.text }));
}

// ── 도감 · 명예의 전당 ──
/** 도감에는 지금 인생이 없으므로 문 이름의 자리표시를 이 말로 채운다 */
const CODEX_FILL = { name: '나', town: '고향', island: '그 섬' };

/** 원작 인물 id → 이름. 전환점의 '사람을 만난다' 효과에 적힌 이름에서 모은다 */
const CANON_NAME: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const t of TURNINGS) for (const fx of [...(t.fx ?? []), ...t.doors.flatMap((d) => d.fx)]) {
    if (fx.op === 'person' && fx.canon && fx.name && !out[fx.canon]) out[fx.canon] = fx.name;
  }
  return out;
})();

export interface CodexView { doors: { title: string; door: string; values: string[] }[]; fruits: string[]; people: string[]; lives: number }

/** 도감: 골라 본 문(전환점 제목 · 문 이름 · 올린 가치관 이름, 제목 순), 먹어 본 열매, 만난 인물. 데이터에 없는 문은 건너뛴다 */
export function codexView(meta: Meta5): CodexView {
  const doors = Object.entries(meta.doors).flatMap(([key, values]) => {
    const [id, i] = key.split('#');
    const t = TURNING_BY_ID[id];
    const d = t?.doors[Number(i)];
    if (!t || !d) return [];
    return [{ title: t.title, door: fill(d.label, CODEX_FILL), values: values.map((v) => VALUE_NAME[v]).filter(Boolean), i: Number(i) }];
  });
  doors.sort((a, b) => a.title.localeCompare(b.title, 'ko') || a.i - b.i);
  return {
    doors: doors.map(({ title, door, values }) => ({ title, door, values })),
    fruits: meta.fruits.map((id) => FRUIT_BY_ID[id]?.name ?? id),
    people: meta.people.map((id) => CANON_NAME[id] ?? id),
    lives: meta.lives,
  };
}

/** 끝난 나이와 까닭: '일흔두 살, 노환' (끝난 까닭이 없으면 나이만) */
function endWord(age: number, cause: string): string {
  return cause ? `${ageWord(age)}, ${cause}` : ageWord(age);
}

/** 명예의 전당: 최근 인생이 위. end는 '일흔두 살, 노환' (끝난 까닭이 없으면 나이만) */
export function hallView(meta: Meta5): { name: string; persona: string; oneLine: string; end: string }[] {
  return [...meta.hall].reverse().map((h) => ({ name: h.name, persona: h.persona, oneLine: h.oneLine, end: endWord(h.age, h.cause) }));
}

// ── 엔딩 ──
export interface EndingView {
  name: string; end: string;                         // '일흔두 살, 노환' 꼴
  persona: string; oneLine: string; remembered: string;
  canonWords: { who: string; line: string }[]; canonMoments: string[];
  unchosen: string[]; secret: string | null; newCodex: string[];
  record: { label: string; value: string }[];        // 접힌 칸
}

/** 엔딩 창의 자료. meta는 이 인생을 더하기 전의 도감이어야 '새로 채운 것'이 나온다 */
export function endingView(s: Life5, meta: Meta5): EndingView {
  const e = buildEnding(s, meta), r = e.record;
  return {
    name: fullName(s.hero).trim(), end: endWord(r.age, r.cause),
    persona: e.persona, oneLine: e.oneLine, remembered: e.remembered,
    canonWords: e.canonWords, canonMoments: e.canonMoments,
    unchosen: e.unchosen, secret: e.secret, newCodex: e.newCodex,
    record: [
      { label: '끝난 나이', value: ageWord(r.age) },
      { label: '까닭', value: r.cause || '-' },
      { label: '가장 높은 단계', value: TIER_WORD[r.topTier] || '없음' },
      { label: '이름값', value: fmtMoney(r.fame) },
      { label: '싸움', value: `${r.fights}번 중 ${r.wins}승` },
      { label: '잃은 부위', value: `${r.limbsLost}곳` },
      { label: '만난 기연', value: `${r.fortunes}번` },
    ],
  };
}
