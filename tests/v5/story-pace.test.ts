// 섬 장편의 막 구성과 장면 사이의 시간 (data/episodes/pacing.ts, core/turning.ts의 storyPause, core/year.ts의 storyInterlude)
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/core/rng';
import { choose } from '../../src/v5/core/autoplay';
import { apply5 } from '../../src/v5/core/reduce';
import { newLife5 } from '../../src/v5/core/state';
import { V } from '../../src/v5/data/balance';
import { EPISODE_TURNINGS } from '../../src/v5/data/episodes';
import { STORY_PACE } from '../../src/v5/data/episodes/pacing';

describe('막 구성표', () => {
  it('모든 장편 장면이 막 구성표에 있다', () => {
    expect(EPISODE_TURNINGS.map((t) => t.id).filter((id) => !STORY_PACE[id])).toEqual([]);
  });
  it('막 구성표에 없는 장면 id가 없다', () => {
    const ids = new Set(EPISODE_TURNINGS.map((t) => t.id));
    expect(Object.keys(STORY_PACE).filter((id) => !ids.has(id))).toEqual([]);
  });
  it('장편의 첫 장면은 실시간 장면이 아니고 1막이다', () => {
    for (const t of EPISODE_TURNINGS.filter((t) => t.weight > 0)) {
      expect(STORY_PACE[t.id].cont, t.id).toBe(false);
      expect(STORY_PACE[t.id].act, t.id).toMatch(/^1막/);
    }
  });
});

type Hop = { prev: string; id: string; gap: number; aged: boolean; header: boolean };

/** 줄 서 있다가 열린 장편 장면마다 { 앞 장면, 쉰 토막 수, 그 사이 나이 변화, 막 제목이 떴는가 } */
function hops(seed: number): Hop[] {
  const s = newLife5(seed, {});
  const r = rngOf({ seed: seed * 7, cursor: 0 });
  const out: Hop[] = [];
  let prev: string | null = null; let gap = 0; let ageAt = 0; let header = false;
  for (let i = 0; i < 20000 && !s.ended; i++) {
    const was = s.pending;
    const queued = s.queue.slice();
    const lastLog = s.log.at(-1)?.id ?? -1;
    apply5(s, s.pending ? { type: 'answer', index: choose(s, 'random', r) } : { type: 'step' });
    if (s.log.some((l) => l.id > lastLog && l.type === 'info' && l.text.startsWith('── ') && /막|에필로그/.test(l.text))) header = true;
    if (was) continue;
    const p = s.pending;
    if (p?.kind === 'door' && p.turning.startsWith('ep_')) {
      if (prev && queued.includes(p.turning)) out.push({ prev, id: p.turning, gap, aged: s.age !== ageAt, header });
      prev = p.turning; gap = 0; ageAt = s.age; header = false;
    } else if (prev && !s.pending) {             // 다른 일(부상의 계기 등)이 끼어든 토막은 세지 않는다
      gap++;
      if (!s.queue.some((q) => q.startsWith('ep_')) && gap > V.story.act[1]) prev = null;   // 장편이 끝났다
    }
  }
  return out;
}

describe('장면 사이의 시간', () => {
  const all = Array.from({ length: 150 }, (_, i) => hops(100 + i)).flat();
  const kind = (h: Hop) => (STORY_PACE[h.id].cont ? 'cont' : STORY_PACE[h.prev].act === STORY_PACE[h.id].act ? 'beat' : 'act');

  it('시뮬레이션에서 세 경우가 모두 충분히 나온다', () => {
    for (const k of ['cont', 'beat', 'act']) expect(all.filter((h) => kind(h) === k).length, k).toBeGreaterThan(20);
  });
  it('실시간으로 이어지는 장면은 쉬지 않는다', () => {
    for (const h of all.filter((h) => kind(h) === 'cont')) expect(h.gap, `${h.prev} → ${h.id}`).toBe(0);
  });
  it('같은 막 안에서는 짧게 쉰다', () => {
    for (const h of all.filter((h) => kind(h) === 'beat')) {
      expect(h.gap, `${h.prev} → ${h.id}`).toBeGreaterThanOrEqual(V.story.beat[0]);
      expect(h.gap, `${h.prev} → ${h.id}`).toBeLessThanOrEqual(V.story.beat[1]);
      expect(h.header, `${h.prev} → ${h.id}`).toBe(false);
    }
  });
  it('막이 바뀌면 길게 쉬고 막 제목을 띄운다', () => {
    for (const h of all.filter((h) => kind(h) === 'act')) {
      expect(h.gap, `${h.prev} → ${h.id}`).toBeGreaterThanOrEqual(V.story.act[0]);
      expect(h.gap, `${h.prev} → ${h.id}`).toBeLessThanOrEqual(V.story.act[1]);
      expect(h.header, `${h.prev} → ${h.id}`).toBe(true);
    }
  });
  it('장면 사이의 시간에는 나이를 먹지 않는다', () => {
    expect(all.filter((h) => h.aged).map((h) => `${h.prev} → ${h.id}`)).toEqual([]);
  });
});
