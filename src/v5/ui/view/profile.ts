// 인물 칸 · 장면 · 기록 · 연표.
import { fmtMoney } from '../../../core/util';
import { FRUIT_BY_ID } from '../../../data/fruits';
import { SEA_BY_ID } from '../../../data/seas';
import type { SceneInput } from '../../../ui/pixel/pixelArt';
import { fullName } from '../../core/birth';
import { LIMB_NAME, LIMBS } from '../../core/body';
import { V } from '../../data/balance';
import { STRENGTHS } from '../../data/strengths';
import {
  BRANCH_NAME, ILLNESS_NAME, INJURY_NAME, LIMB_STATE_WORD, LINEAGE_NAME, STANDING_NAME, TIER_WORD, WEALTH_NAME,
} from '../../data/words';
import type { Branch, Life5, LogLine, Standing } from '../../core/types';
import { foeWho, heroWho5, personWho5 } from './faces';
import { ageWord, valueWords } from './words';

/** 기록 칸에 남기는 줄 수 */
const STORY_KEEP = 160;
/** 큰 일만 고를 때 함께 남기는 무게 */
const HEAVY: ReadonlySet<LogLine['weight']> = new Set(['heavy', 'year']);

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
