// 화면 없이 인생을 끝까지 돌린다. 대량 시뮬레이션과 테스트에 쓴다.
import { defaultAssign, winRate } from './combat/battle';
import { openDuels } from './combat/engine';
import { reduce, invariants } from './reduce';
import { int, rngOf } from './rng';
import { newLife } from './state';
import type { LifeState } from './types';

export interface AutoResult { s: LifeState; steps: number; stuck: boolean; violations: string[] }

/** policy: 'random'은 아무 선택지나, 'smart'는 먹고 · 도전하고 · 배우는 쪽을 고른다 */
export function autoplay(seed: number, policy: 'random' | 'smart' = 'random', maxSteps = 20000): AutoResult {
  let s = newLife(seed);
  const pick = { seed: seed ^ 0x5bd1e995, cursor: 0 };
  const r = rngOf(pick);
  const violations: string[] = [];
  let steps = 0;
  while (steps < maxSteps) {
    steps++;
    const p = s.pending;
    let next: LifeState;
    if (!p) next = reduce(s, { type: 'tick' });
    else if (p.kind === 'choice') {
      const ok = p.options.map((o, i) => ({ o, i })).filter((x) => !x.o.disabled);
      let i = ok[int(r, 0, ok.length - 1)].i;
      if (policy === 'smart') {
        const prefer = ok.find((x) => /먹는다|지금 도전|배운다|받아들인다|동료로|산다|모든 것을 걸고|해적이 된다|해군에 지원/.test(x.o.label));
        if (prefer && (p.category !== 'challenge' || r() < 0.7)) i = prefer.i;
      }
      next = reduce(s, { type: 'answerChoice', index: i });
    } else if (p.kind === 'prep') {
      const assign = defaultAssign(s, p.encounter, s.loadout);
      // 똑똑한 정책: 보스가 너무 강하면 미룬다
      if (policy === 'smart' && p.encounter.source === 'boss' && winRate(s, p.encounter, s.loadout, assign, 60) < 0.45) {
        next = reduce(s, { type: 'withdrawPrep' });
      } else next = reduce(s, { type: 'confirmPrep', loadout: s.loadout, assign });
    } else if (p.kind === 'intervene') {
      const open = openDuels(p.battle);
      next = reduce(s, { type: 'intervene', duel: open[0]?.id ?? -1 });
    } else if (p.kind === 'battle') {
      next = reduce(s, { type: 'ackBattle' });
    } else break; // ending
    if (next === s) return { s, steps, stuck: true, violations };
    s = next;
    s.metaEvents = []; s.notices = [];
    const bad = invariants(s);
    if (bad.length) violations.push(...bad.map((b) => `${s.hero.age}세: ${b}`));
  }
  return { s, steps, stuck: s.pending?.kind !== 'ending', violations };
}
