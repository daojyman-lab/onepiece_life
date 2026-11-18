// 섬 장편의 장면 사이에 흐르는 며칠 (V.story.rest, core/year.ts의 storyInterlude)
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/core/rng';
import { choose } from '../../src/v5/core/autoplay';
import { apply5 } from '../../src/v5/core/reduce';
import { newLife5 } from '../../src/v5/core/state';
import { V } from '../../src/v5/data/balance';
import { TURNING_BY_ID } from '../../src/v5/data/turnings';

const week = (id: string) => TURNING_BY_ID[id]?.title.match(/^(\d+)주차/)?.[1] ?? id;

/** 장편 장면이 뜰 때마다 { 장면, 그 전 장면 이후의 클릭 수, 그 사이 나이 변화 } */
function scenes(seed: number) {
  const s = newLife5(seed, {});
  const r = rngOf({ seed: seed * 7, cursor: 0 });
  const out: { id: string; prev: string | null; gap: number; aged: boolean }[] = [];
  let prev: string | null = null; let gap = 0; let ageAt = 0;
  for (let i = 0; i < 20000 && !s.ended; i++) {
    const was = s.pending;
    const queued = s.queue.slice();
    apply5(s, s.pending ? { type: 'answer', index: choose(s, 'random', r) } : { type: 'step' });
    if (was) continue;
    const p = s.pending;
    if (p?.kind === 'door' && p.turning.startsWith('ep_')) {
      if (prev && queued.includes(p.turning)) out.push({ id: p.turning, prev, gap, aged: s.age !== ageAt });
      prev = p.turning; gap = 0; ageAt = s.age;
    } else if (prev && !s.pending) {             // 다른 일(부상의 계기 등)이 끼어든 토막은 세지 않는다
      gap++;
      if (!s.queue.some((q) => q.startsWith('ep_')) && gap > V.story.rest[1]) prev = null;   // 장편이 끝났다
    }
  }
  return out;
}

describe('섬 장편의 페이싱', () => {
  const all = Array.from({ length: 120 }, (_, i) => scenes(100 + i)).flat();
  // 줄 서 있다가 열린 장면만 본다 (앞 장면의 문이나 싸움이 줄 세운 것)
  const chained = all;

  it('시뮬레이션에서 장편 장면이 충분히 나온다', () => {
    expect(chained.length).toBeGreaterThan(30);
  });
  it('다른 주의 장면 사이에는 일상 토막이 V.story.rest만큼 흐른다', () => {
    for (const x of chained.filter((x) => week(x.id) !== week(x.prev!))) {
      expect(x.gap, `${x.prev} → ${x.id}`).toBeGreaterThanOrEqual(V.story.rest[0]);
      expect(x.gap, `${x.prev} → ${x.id}`).toBeLessThanOrEqual(V.story.rest[1]);
    }
  });
  it('같은 주의 장면은 곧장 이어진다', () => {
    for (const x of chained.filter((x) => week(x.id) === week(x.prev!))) expect(x.gap, `${x.prev} → ${x.id}`).toBe(0);
  });
  it('장면 사이의 며칠에는 나이를 먹지 않는다', () => {
    expect(chained.filter((x) => x.aged).map((x) => `${x.prev} → ${x.id}`)).toEqual([]);
  });
});
