// 섬 장편의 막 구성과 장면 사이의 시간 (data/episodes/pacing.ts, core/turning.ts의 storyPause, core/year.ts의 storyInterlude)
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/shared/core/rng';
import { choose } from '../../src/core/autoplay';
import { apply5 } from '../../src/core/reduce';
import { newLife5 } from '../../src/core/state';
import { V } from '../../src/data/balance';
import { EPISODE_TURNINGS } from '../../src/data/episodes';
import { STORY_PACE } from '../../src/data/episodes/pacing';

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
  let prev: string | null = null; let gap = 0; let ageAt = 0; let header = false; let calendarAdvanced = false;
  for (let i = 0; i < 20000 && !s.ended; i++) {
    const was = s.pending;
    const queued = s.queue.slice();
    const seenBefore = queued.map(id => s.seenCount[id] ?? 0);
    const ageBefore = s.age, partBefore = s.part;
    const waitingForEvidence = !!s.lifeStory?.wait;
    const interlude = s.storyRest > 0 && queued.some((id) => id.startsWith('ep_'));
    const lastLog = s.log.at(-1)?.id ?? -1;
    apply5(s, s.pending ? { type: 'answer', index: choose(s, 'random', r) } : { type: 'step' });
    if (s.log.some((l) => l.id > lastLog && l.type === 'info' && l.text.startsWith('── ') && /막|에필로그/.test(l.text))) header = true;
    if (was) continue;
    // 증인 조사처럼 실제 한 철이 필요한 생애 사건은 장편 사이의 연출 쉼이 아니다.
    // 달력이 진행됐다면 그 앞뒤 장면을 연속된 장편 장면으로 비교하지 않는다.
    if (s.age !== ageBefore || s.part !== partBefore) {
      if (!interlude && waitingForEvidence) { prev = null; gap = 0; header = false; calendarAdvanced = false; }
      else if (prev && queued.some((id) => id.startsWith('ep_'))) calendarAdvanced = true;
    }
    const p = s.pending;
    // 그리지오의 사무실은 힘이 모자라면 선택창 없이 바로 전투를 연다. 이때도 막의 한 장면이 열렸다.
    const opened = p?.kind === 'door' && p.turning.startsWith('ep_') ? p.turning
      : queued.find((id, j) => id.startsWith('ep_') && s.seenCount[id] > seenBefore[j]);
    if (opened) {
      if (prev && queued.includes(opened)) out.push({ prev, id: opened, gap, aged: s.age !== ageAt || calendarAdvanced, header });
      prev = opened; gap = 0; ageAt = s.age; header = false; calendarAdvanced = false;
    } else if (prev && !s.pending) {             // 다른 일(부상의 계기 등)이 끼어든 토막은 세지 않는다
      if (interlude) gap++;
      if (!s.queue.some((q) => q.startsWith('ep_')) && !s.lifeStory?.wait) prev = null;
    }
  }
  return out;
}

describe('장면 사이의 시간', () => {
  const all = Array.from({ length: 150 }, (_, i) => hops(100 + i)).flat();
  const kind = (h: Hop) => (STORY_PACE[h.id].cont ? 'cont' : STORY_PACE[h.prev].act === STORY_PACE[h.id].act ? 'beat' : 'act');

  it('일반 추첨으로 열린 첫 장면부터 다음 장면의 쉼을 센다', () => {
    expect(all.some((h) => h.prev === 'ep_loguetown_c1' && h.id === 'ep_loguetown_c2')).toBe(true);
  });

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
  it('장면 사이의 연출 쉼에는 달력이 진행되지 않는다', () => {
    expect(all.filter((h) => h.aged).map((h) => `${h.prev} → ${h.id}`)).toEqual([]);
  });
});
