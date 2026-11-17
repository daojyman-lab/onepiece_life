// 꿈을 품고, 바꾸고, 이룬다 (통합 기획 3장 · 4.2)
import { CHANGE_FAME, DREAMS, PEACE_AGE, TREASURE_MONEY } from '../data/dreams';
import { josa } from '../shared/core/josa';
import { logLine } from './log';
import type { DreamId, Life5 } from './types';

/** 꿈을 품는다 (처음이든, 바뀌든). 이미 이룬 꿈을 다시 고르면 아무 일도 없다 */
export function setDream(s: Life5, id: DreamId): void {
  if (s.dream?.id === id) return;
  const before = s.dream;
  s.dream = { id, since: s.age, done: null };
  const name = DREAMS[id].name;
  if (before) {
    logLine(s, `${s.hero.name}의 꿈이 바뀌었다. ${DREAMS[before.id].name}에서 ${name}(으)로.`, 'heavy', 'life');
    s.timeline.push({ age: s.age, text: josa(`꿈을 ${name}(으)로 바꾸었다`) });
  } else {
    logLine(s, `${s.hero.name}은(는) 꿈을 품었다. ${name}.`, 'heavy', 'life');
    s.timeline.push({ age: s.age, text: josa(`${name}을(를) 꿈꾸기 시작했다`) });
  }
}

/** 지금 이 꿈을 이룬 상태인가 */
export function dreamMet(s: Life5, id: DreamId): boolean {
  const h = s.hero, f = (x: string) => s.flags.includes(x);
  switch (id) {
    case 'pirateKing': return f('pirateKing');
    case 'bestSword': return s.growth.tier.sword >= 6;
    case 'marineTop': return f('apex') && (h.standing === 'marine' || h.standing === 'cp');
    case 'changeWorld': return h.standing === 'revolution' && h.fame >= CHANGE_FAME;
    case 'worldEnd': return f('sawLastSea') || f('lastSeaChart');
    case 'truth': return f('readsStone') || f('readForbidden') || f('scholar');
    case 'treasure': return h.money >= TREASURE_MONEY;
    case 'peace': return (f('married') || s.people.some((p) => p.alive && p.bond >= 80)) && s.age >= PEACE_AGE && ['civil', 'settled', 'retired', 'shipwright'].includes(h.standing);
  }
}

/** 해가 바뀔 때: 품은 꿈을 이루었으면 기록한다 */
export function dreamYear(s: Life5): void {
  const d = s.dream;
  if (!d || d.done !== null || !dreamMet(s, d.id)) return;
  d.done = s.age;
  logLine(s, `꿈을 이루었다. ${DREAMS[d.id].done}. 어린 날 품었던 그 꿈이었다.`, 'heavy', 'good');
  s.timeline.push({ age: s.age, text: josa(`꿈을 이루었다: ${DREAMS[d.id].name}`) });
}

/** 엔딩의 한 줄: 꿈과 그 결말 */
export function dreamLine(s: Life5): string | null {
  const d = s.dream;
  if (!d) return null;
  const D = DREAMS[d.id];
  if (d.done !== null) return josa(`${D.name}을(를) 꿈꾸었고, ${D.done}.`);
  const tail = s.flags.includes('dreamPassed') ? ' 그 꿈은 다음 사람에게 건네졌다.'
    : s.flags.includes('dreamAccepted') ? ' 그래도 좇은 시간을 후회하지 않았다.'
    : s.flags.includes('dreamLastTry') ? ' 그래도 마지막까지 그곳을 향해 걸었다.' : '';
  return josa(`${D.name}을(를) 꿈꾸었지만, ${D.missed}.${tail}`);
}

const VALUE_ANSWER: Record<string, string> = {
  freedom: '누구에게도 매이지 않고 바람처럼 산 날들이었다',
  romance: '끝없이 이어진 모험, 그 자체였다',
  inquiry: '세계가 감춘 이야기를 하나씩 알아 가는 기쁨이었다',
  greed: '손에 쥐었던 반짝이는 모든 것이었다',
  peace: '아무 일 없이 지나간 평범한 하루의 따뜻함이었다',
  justice: '끝까지 지키려 했던 옳은 것이었다',
  ambition: '누구보다 높이 오르려던 그 마음이었다',
  dominion: '한계를 넘어 강해지던 그 순간들이었다',
  loyalty: '함께 바다를 건넜던 사람들이었다',
};

/** 마지막 질문 "너에게 원피스는 무엇이었나?"의 대답 (통합 기획 10.4). 어떤 대답도 다른 대답보다 옳지 않다 */
export function onePieceAnswer(s: Life5, top: string | undefined): string {
  const d = s.dream;
  const changed = s.timeline.some((t) => t.text.startsWith('꿈을 ') && t.text.includes('바꾸었다'));
  const close = s.people.filter((p) => p.alive !== undefined && p.bond >= 80 && p.kind !== 'family').length;
  if (d && d.done !== null) return josa(`나에게 원피스란, 평생 꿈꾸었던 ${DREAMS[d.id].name} 그 끝이었다.`);
  if (changed && d?.id === 'peace') return '처음에는 가장 높은 곳이었다. 하지만 마지막에는, 지켜야 할 삶이 있었다.';
  if (close >= 3 || top === 'loyalty') return '나에게 원피스란, 함께 바다를 건넜던 사람들이었다.';
  if (d) return '끝내 닿지 못했다. 그래도 그곳을 향해 떠났던 순간만큼은 후회하지 않는다.';
  return `나에게 원피스란, ${VALUE_ANSWER[top ?? 'romance'] ?? VALUE_ANSWER.romance}.`;
}
