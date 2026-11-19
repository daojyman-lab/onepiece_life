// 도감 · 명예의 전당 · 엔딩.
import { fill, fmtMoney } from '../../../core/util';
import { FRUIT_BY_ID } from '../../../data/fruits';
import { fullName } from '../../core/birth';
import { buildEnding } from '../../core/ending';
import type { Meta5 } from '../../core/meta';
import { CANON } from '../../data/canon';
import { TURNING_BY_ID } from '../../data/turnings';
import { VALUE_NAME } from '../../data/values';
import { TIER_WORD } from '../../data/words';
import type { Life5 } from '../../core/types';
import { ageWord, endWord } from './words';

/** 도감에는 지금 인생이 없으므로 문 이름의 자리표시를 이 말로 채운다 */
const CODEX_FILL = {
  name: '나', town: '고향', island: '그 섬', rival: '어릴 적 맞수', rivalPost: '고향에서 온 길잡이', mentor: '스승', parent: '부모',
  crisisTitle: '고향 사람들이 함께한 날', crisisTown: '고향', crisisPerson: '그날 곁에 있던 사람', crisisLandmark: '마을 풍경',
};

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
    people: meta.people.map((id) => CANON[id]?.name ?? id),
    lives: meta.lives,
  };
}

/** 명예의 전당: 최근 인생이 위. end는 '일흔두 살, 노환' (끝난 까닭이 없으면 나이만) */
export function hallView(meta: Meta5): { name: string; persona: string; oneLine: string; end: string }[] {
  return [...meta.hall].reverse().map((h) => ({ name: h.name, persona: h.persona, oneLine: h.oneLine, end: endWord(h.age, h.cause) }));
}

export interface EndingView {
  name: string; end: string;                         // '일흔두 살, 노환' 꼴
  persona: string; dream: string | null; onePiece: string; oneLine: string; remembered: string;
  canonWords: { who: string; line: string }[]; canonMoments: string[];
  unchosen: string[]; secret: string | null; newCodex: string[];
  record: { label: string; value: string }[];        // 접힌 칸 (끝난 까닭이 없으면 그 줄은 없다)
}

/** 엔딩 창의 자료. meta는 이 인생을 더하기 전의 도감이어야 '새로 채운 것'이 나온다 */
export function endingView(s: Life5, meta: Meta5): EndingView {
  const e = buildEnding(s, meta), r = e.record;
  return {
    name: fullName(s.hero).trim(), end: endWord(r.age, r.cause),
    persona: e.persona, dream: e.dream, onePiece: e.onePiece, oneLine: e.oneLine, remembered: e.remembered,
    canonWords: e.canonWords, canonMoments: e.canonMoments,
    unchosen: e.unchosen, secret: e.secret, newCodex: e.newCodex,
    record: [
      { label: '끝난 나이', value: ageWord(r.age) },
      ...(r.cause ? [{ label: '까닭', value: r.cause }] : []),
      { label: '가장 높은 단계', value: TIER_WORD[r.topTier] || '없음' },
      { label: '이름값', value: fmtMoney(r.fame) },
      { label: '싸움', value: `${r.fights}번 중 ${r.wins}승` },
      { label: '잃은 부위', value: `${r.limbsLost}곳` },
      { label: '만난 기연', value: `${r.fortunes}번` },
    ],
  };
}
