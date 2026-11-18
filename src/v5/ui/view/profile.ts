// 인물 칸 · 장면 · 기록 · 연표.
import { fmtMoney } from '../../../core/util';
import { FRUIT_BY_ID } from '../../../data/fruits';
import { SEA_BY_ID } from '../../../data/seas';
import type { SceneInput } from '../../../ui/pixel/pixelArt';
import { SPECIES_NAMES } from '../../../data/births';
import { fullName } from '../../core/birth';
import { LIMB_NAME, LIMBS } from '../../core/body';
import { V } from '../../data/balance';
import { townLabel } from '../../data/homes';
import { STRENGTHS } from '../../data/strengths';
import { POTENTIALS } from '../../data/stages';
import { DREAMS } from '../../data/dreams';
import { COMBAT_STYLES } from '../../data/combat-styles';
import { aggregateStyleMastery } from '../../core/styles';
import { stageName } from '../../core/stages';
import {
  BRANCH_NAME, ILLNESS_NAME, INJURY_NAME, LIMB_STATE_WORD, LINEAGE_NAME, MARINE_OFFICER_RANK, MARINE_TITLES, PIRATE_TITLES, PIRATE_TOP_TITLE,
  POWER_TOP, POWER_WORDS, STANDING_NAME, TIER_WORD, VALUE_ADJ, WEALTH_NAME,
} from '../../data/words';
import { topValues } from '../../core/values';
import { rating5 } from '../../core/power';
import { bandWord } from './words';
import { GRADES, GRADE_TOP } from '../../data/words';
import type { Branch, Life5, LogLine, Standing } from '../../core/types';
import { foeWho, heroWho5, personWho5 } from './faces';
import { ageWord, valueWords } from './words';

/** 기록 칸에 남기는 줄 수 */
const STORY_KEEP = 160;
/** 큰 일만 고를 때 함께 남기는 무게 */
const HEAVY: ReadonlySet<LogLine['weight']> = new Set(['heavy', 'year']);

export interface ProfileView {
  name: string; age: string; standing: string; born: string;
  stage: string;                                       // 생애 단계 (유년기 · 수련기 · 청년기 · 장년기 · 전성기 · 황혼기)
  potential: string;
  dream: string | null;                                // 꿈 (예: '해적왕 · 이루었다')                                   // 타고난 잠재력 (예: '대기만성형 · 오랜 실전 끝에 늦게 크게 자란다')
  role: string | null;                                 // 해적 · 칠무해의 자리: 제 깃발을 올린 '선장'인가, 남의 배를 타는 '선원'인가
  who: string;                                         // 성별 · 종족 (예: '남자 · 인간')
  values: string[]; strengths: { name: string; text: string }[];
  body: { limb: string; word: string }[];              // 멀쩡하지 않은 부위만
  skills: { name: string; tier: string }[];            // 단계가 1 이상인 갈래만
  master: string | null; fruit: string | null;
  path: string | null;                                 // 주력 (걷는 길): 검술 · 체술 · 사격 …
  haki: string | null;                                 // 패기: 깨운 것만 (견문색 2단계 · 무장색 1단계)
  styleFocus: string | null;
  styles: { id: string; name: string; mastery: number; group: 'martial' | 'weapon' }[];
  martialMastery: number; weaponMastery: number;
  power: string;                                       // 전투력: 수와 대충의 격 (예: '189 · 이스트 블루의 해적 선장급')
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

/**
 * 처지의 이름. 해적은 이름값(명성)에 따라 신참 해적 → 이름난 해적 → 악명 높은 해적 → 대해적,
 * 해군은 병사 → 부사관(분대장) → 장교. 신참 · 병사를 벗어나면 가장 높은 가치관의 말을 앞에 붙인다 (예: '야망 있는 이름난 해적')
 */
export function standingTitle(s: Life5): string {
  const h = s.hero;
  const top = topValues(s, 1)[0];
  const adj = (base: string) => (top ? `${VALUE_ADJ[top]} ${base}` : base);
  if (h.standing === 'pirate') {
    const fame = Math.round(h.fame);
    if (fame < PIRATE_TITLES[0][0]) return PIRATE_TITLES[0][1];
    return adj(PIRATE_TITLES.find(([lim]) => fame < lim)?.[1] ?? PIRATE_TOP_TITLE);
  }
  if (h.standing === 'marine') {
    if (h.rank >= MARINE_OFFICER_RANK) return adj(MARINE_TITLES.officer);
    if (s.flags.includes('mnOfficer')) return adj(MARINE_TITLES.nco);
    return MARINE_TITLES.soldier;
  }
  return STANDING_NAME[h.standing];
}

export function profileView(s: Life5): ProfileView {
  const h = s.hero, g = s.growth;
  const hurts = h.injuries.map((i) => INJURY_NAME[i.severity]);
  if (h.illness) hurts.push(ILLNESS_NAME[h.illness.id] ?? '병');
  return {
    name: fullName(h).trim(),
    age: ageWord(s.age),
    stage: stageName(s),
    dream: s.dream ? `${DREAMS[s.dream.id].name}${s.dream.done !== null ? ' · 이루었다' : ''}` : null,
    potential: (() => { const p = POTENTIALS[s.hero.potential ?? 'balanced']; return `${p.name} · ${p.text}`; })(),
    standing: standingTitle(s),
    role: h.standing === 'pirate' || h.standing === 'warlord' ? (s.flags.includes('captain') ? '선장' : '선원') : null,
    who: `${h.gender === 'f' ? '여자' : '남자'} · ${SPECIES_NAMES[h.species]}`,
    born: `${townLabel(h.home, h.town)}의 ${WEALTH_NAME[h.wealth]} · ${LINEAGE_NAME[h.lineage]}`,
    values: valueWords(s),
    strengths: STRENGTHS.filter((x) => s.strengths.includes(x.id)).map((x) => ({ name: x.name, text: x.text })),
    body: LIMBS.flatMap((l) => {
      const st = h.limbs[l];
      return st === 'ok' ? [] : [{ limb: LIMB_NAME[l], word: LIMB_STATE_WORD[st] }];
    }),
    skills: BRANCHES.filter((b) => g.tier[b] >= 1).map((b) => ({ name: BRANCH_NAME[b], tier: TIER_WORD[g.tier[b]] ?? '' })),
    path: g.path ? BRANCH_NAME[g.path] : null,
    haki: (['observation', 'armament', 'conqueror'] as const).filter((b) => g.tier[b] >= 1).map((b) => `${BRANCH_NAME[b]} ${TIER_WORD[g.tier[b]] ?? ''}`.trim()).join(' · ') || null,
    styleFocus: g.styleFocus ? COMBAT_STYLES.find((x) => x.id === g.styleFocus)?.name ?? null : null,
    styles: COMBAT_STYLES.map((x) => ({ id: x.id, name: x.name, mastery: g.styleMastery[x.id] ?? 0, group: x.group })),
    martialMastery: aggregateStyleMastery(s, 'martial'),
    weaponMastery: aggregateStyleMastery(s, 'weapon'),
    master: g.master ? `${g.master.name} (${BRANCH_NAME[g.master.branch]})` : null,
    fruit: h.fruit ? FRUIT_BY_ID[h.fruit.id]?.name ?? null : null,
    power: (() => { const p = Math.round(rating5(s)); return `${bandWord(p, GRADES, GRADE_TOP)}급 · ${fmtMoney(p)} · ${bandWord(p, POWER_WORDS, POWER_TOP)}`; })(),
    money: `${fmtMoney(h.money)} 베리`,
    fame: fameWord(s),
    hp: Math.round(h.hp),
    hurts,
  };
}

// ── 장면 ──
const ISLAND_COLORS = ['#70b582', '#c8b070', '#8ab0d0', '#b0d890', '#d0a0a0', '#90c0a0'];
/** 장면에 그리는 동료 수 (v4 drawScene이 그리는 만큼) */
const SCENE_CREW = 3;

/** 장면 자료. ready는 이야기가 다 떠올랐는가: 그 전에는 싸움 상대를 그리지 않는다(창보다 먼저 나오지 않게) */
export function sceneOf(s: Life5, ready: boolean): SceneInput {
  const h = s.hero, p = s.pending;
  const sea = SEA_BY_ID[h.sea];
  const foe = ready && p && (p.kind === 'fight' || p.kind === 'battle') ? foeWho(p.foe) : null;
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
