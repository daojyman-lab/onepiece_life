// 엔딩 자료 (설계 5.8): 끝난 인생에서 화면에 띄울 문장과 기록을 모은다. 화면은 만들지 않는다.
// 가치관 점수(숫자)는 어떤 문장에도 넣지 않는다. 말로만 드러낸다.
import { FRUIT_BY_ID } from '../../data/fruits';
import { josa } from '../../core/josa';
import { fill, fmtMoney } from '../../core/util';
import { V } from '../data/balance';
import {
  CANON_WORDS, CANON_WORDS_DEFAULT, HEADLINE, PERSONA_NONE, PERSONA_PLAIN, RUMOR, SECRET_LINE, UNCHOSEN_LINE,
} from '../data/ending';
import { STRENGTHS } from '../data/strengths';
import { TURNING_BY_ID } from '../data/turnings';
import { VALUE_PERSONA } from '../data/values';
import { fullName } from './birth';
import { fillText } from './fx';
import type { Meta5 } from './meta';
import { topValues } from './values';
import type { Fx, Life5, Turning } from './types';

export interface Ending5 {
  persona: string;
  oneLine: string;
  remembered: string;
  canonWords: { who: string; line: string }[];
  canonMoments: string[];
  unchosen: string[];
  secret: string | null;
  newCodex: string[];
  record: { age: number; cause: string; topTier: number; fame: number; fights: number; wins: number; limbsLost: number; fortunes: number };
}

const E = V.ending;

/** 끝난 나이와 원인. 아직 끝나지 않은 인생이면 지금 나이와 빈 원인 */
function endOf(s: Life5): { age: number; cause: string } {
  return s.ended ?? { age: s.age, cause: '' };
}

/** 가장 높은 가치관 한두 가지의 앞 구절 + 가장 먼저 얻은 강점의 뒤 구절 */
export function personaOf(s: Life5): string {
  const top = topValues(s, 2);
  if (top.length === 0) return PERSONA_NONE;
  const first = s.strengths.map((id) => STRENGTHS.find((x) => x.id === id)).find((x) => x !== undefined);
  return `${top.map((id) => VALUE_PERSONA[id]).join(' ')} 살았고, ${first?.persona ?? PERSONA_PLAIN}.`;
}

/** "~다"로 끝난 말을 이어 쓰는 꼴("~고")로 */
const asClause = (text: string) => text.replace(/다$/, '고');

/**
 * "{town}에서 태어나" + 처지가 바뀐 지점(연표) 최대 셋 + 죽음.
 * 셋이 넘으면 맨 처음 하나와 마지막 것들을 꼽는다. 원인이 "~다"로 끝나는 말이면 그대로 맺는다.
 */
export function oneLineOf(s: Life5): string {
  const turns = s.timeline.filter((t) => t.standing).map((t) => t.text);
  const picked = turns.length <= E.oneLine ? turns : [turns[0], ...turns.slice(turns.length - (E.oneLine - 1))];
  const end = endOf(s);
  const death = !s.ended ? `${end.age}살의 오늘에 이르렀다.`
    : /다$/.test(end.cause) ? `${end.age}살에 ${end.cause}.` : `${end.age}살에 ${end.cause}(으)로 죽었다.`;
  return josa(`${s.hero.town}에서 태어나 ${[...picked.map(asClause), death].join(', ')}`);
}

/** 명성이 낮으면 고향의 소문, 높으면 신문 1면 */
function rememberedOf(s: Life5): string {
  const h = s.hero;
  if (h.fame < E.knownFame) return fill(RUMOR, { town: h.town });
  return fill(HEADLINE[h.standing] ?? HEADLINE.default, {
    name: fullName(h), town: h.town, age: String(endOf(s).age), bounty: fmtMoney(h.fame * V.fame.bounty),
  });
}

/** 만난 원작 인물 최대 셋의 한마디. 유대가 높으면 가까운 사이의 말 */
function canonWordsOf(s: Life5): Ending5['canonWords'] {
  const seen = new Set<string>();
  const out: Ending5['canonWords'] = [];
  for (const p of s.people) {
    if (!p.canon || seen.has(p.canon) || out.length >= E.canonWords) continue;
    seen.add(p.canon);
    const w = CANON_WORDS[p.canon] ?? CANON_WORDS_DEFAULT;
    out.push({ who: p.name, line: fill(p.bond >= E.bondHigh ? w.high : w.low, { name: s.hero.name }) });
  }
  return out;
}

const allFx = (fx: Fx[]): Fx[] => fx.flatMap((f) => (f.op === 'chance' ? [f, ...allFx(f.then), ...allFx(f.else ?? [])] : [f]));
/** 큰 계기이거나, 문 하나라도 처지나 바다를 바꾸는 전환점 */
const isBig = (t: Turning | undefined): boolean =>
  !!t && (t.kind === 'moment' || t.doors.some((d) => allFx(d.fx).some((f) => f.op === 'standing' || f.op === 'move')));

/**
 * 고르지 않은 문 최대 셋, 전환점 하나에 하나씩(처음 놓친 문). 큰 계기와 길을 바꾸는 전환점이 먼저,
 * 그 안에서는 일어난 차례대로
 */
function unchosenOf(s: Life5): string[] {
  const once = s.unchosen.filter((u, i) => s.unchosen.findIndex((x) => x.turning === u.turning) === i);
  const big = once.filter((u) => isBig(TURNING_BY_ID[u.turning]));
  const rest = once.filter((u) => !isBig(TURNING_BY_ID[u.turning]));
  return [...big, ...rest].slice(0, E.unchosen)
    .map((u) => fill(UNCHOSEN_LINE, { age: String(u.age), title: u.title, door: u.door }));
}

/** 골라 본 문 "id#번호"를 읽을 수 있는 말로. 데이터에 없는 전환점이면 키 그대로 */
function doorName(s: Life5, key: string): string {
  const [id, i] = key.split('#');
  const t = TURNING_BY_ID[id];
  const d = t?.doors[Number(i)];
  return t && d ? fillText(s, `${t.title}: ${d.label}`) : key;
}

/** 이번 인생에서 도감에 처음 채운 것: 골라 본 문, 먹은 열매, 만난 원작 인물 */
function newCodexOf(s: Life5, meta: Meta5): string[] {
  const doors = s.tried.filter((k) => !(k in meta.doors)).map((k) => doorName(s, k));
  const fruit = s.hero.fruit && !meta.fruits.includes(s.hero.fruit.id) ? [FRUIT_BY_ID[s.hero.fruit.id]?.name ?? s.hero.fruit.id] : [];
  const people = new Map<string, string>();
  for (const p of s.people) if (p.canon && !meta.people.includes(p.canon) && !people.has(p.canon)) people.set(p.canon, p.name);
  return [...doors, ...fruit, ...people.values()];
}

export function buildEnding(s: Life5, meta: Meta5): Ending5 {
  const end = endOf(s);
  return {
    persona: personaOf(s),
    oneLine: oneLineOf(s),
    remembered: rememberedOf(s),
    canonWords: canonWordsOf(s),
    canonMoments: s.timeline.filter((t) => t.canon).map((t) => `${t.age}세, ${t.text}`),
    unchosen: unchosenOf(s),
    secret: s.hero.secretSurname ? fill(SECRET_LINE, { surname: s.hero.secretSurname }) : null,
    newCodex: newCodexOf(s, meta),
    record: {
      age: end.age, cause: end.cause, topTier: Math.max(...Object.values(s.growth.tier)), fame: s.hero.fame,
      fights: s.stats.fights, wins: s.stats.wins, limbsLost: s.stats.limbsLost, fortunes: s.stats.fortunes,
    },
  };
}
