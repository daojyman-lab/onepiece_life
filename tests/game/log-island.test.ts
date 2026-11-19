import { describe, expect, it } from 'vitest';
import { normalizeLife5 } from '../../src/core/load';
import { apply5 } from '../../src/core/reduce';
import { newLife5 } from '../../src/core/state';
import { openTurning } from '../../src/core/turning';
import { buildVoyage, requestArrival, voyageChoices, voyageId } from '../../src/core/voyage';
import { rngOf } from '../../src/shared/core/rng';
import type { Life5 } from '../../src/core/types';

const PORT = '모로섬';
const landing = 'moro_landing';
const sunset = 'moro_sunset';
const needle = 'moro_needle';
function sailor() {
  const s = newLife5(37);
  s.pending = null;
  s.age = 26;
  s.part = 3;
  Object.assign(s.hero, { standing: 'pirate', island: '위스키 피크', sea: 'gl_entry' });
  s.dream = { id: 'worldEnd', since: 23, done: null };
  return s;
}
function reload(s: Life5) {
  return normalizeLife5(JSON.parse(JSON.stringify(s)))!;
}
function scene(s: Life5, id: string) {
  if (s.pending?.kind !== 'door' || s.pending.turning !== id) throw new Error(`${id} 대신 ${JSON.stringify(s.pending)}`);
  return s.pending;
}
const answer = (s: Life5, index: number) => apply5(s, { type: 'answer', index });
const step = (s: Life5) => apply5(s, { type: 'step' });
function makeLandfall() {
  let s = sailor();
  // 리버스 마운틴도 탐험가의 꿈에 맞는다. 출발지를 그곳으로 바꾸면 모로섬이 꿈 항로다.
  s.hero.island = '리버스 마운틴';
  const routeChoices = voyageChoices(s, rngOf({ seed: 7, cursor: 0 }))!;
  expect(routeChoices.dream).toBe(PORT);
  const route = buildVoyage(voyageId(s, routeChoices))!;
  expect(openTurning(s, route)).toBe(true);
  answer(s, route.doors.findIndex(d => d.fx.some(e => e.op === 'sail' && e.island === PORT)));
  expect(s.hero.island).toBe('리버스 마운틴');
  expect(s.queue).not.toContain(landing);
  // 항해 도중 저장한 마지막 구간에서 시작한다. 날씨에 관계없이 이제 닿는다.
  s.passage!.partsSpent = s.passage!.maxParts - 1;
  s.passage!.last = 'calm';
  s = reload(s);
  step(s);
  expect(s.hero.island).toBe(PORT);
  expect([s.age, s.part]).toEqual([27, 0]);
  scene(s, landing);
  return s;
}

describe('모로섬의 사흘', () => {
  it.each([[0, 0], [1, 1], [0, 2]])('첫날의 경험 %i에서 둘째 날의 선택 %i로 이어지고 저장 뒤에도 기억한다', (lesson, action) => {
    let s = makeLandfall();
    const clock = [s.age, s.part];
    answer(s, lesson);
    // 함께 기다리던 다른 일은 섬의 사흘이 끝난 뒤에 계속한다.
    s.queue.unshift('after_fight');
    s = reload(s);
    step(s);
    const dayTwo = scene(s, sunset);
    expect(dayTwo.doors[lesson].locked).toBeNull();
    expect(dayTwo.doors[1 - lesson].locked).toBeTruthy();
    expect(dayTwo.doors[2].locked).toBeNull();
    answer(s, 1 - lesson);
    scene(s, sunset);
    answer(s, action);
    step(s);
    s = reload(s);
    const finalDay = scene(s, needle);
    const traces = ['약병', '세 번', '천막'];
    expect(finalDay.body).toContain(traces[action]);
    expect([s.age, s.part]).toEqual(clock);
    answer(s, 1);
    expect(s.flags).toContain('moroPlumb');
    expect(s.queue).toContain('after_fight');
    expect(s.passage).toBeNull();
    step(s);
    scene(s, 'after_fight');
    answer(s, 0);
    requestArrival(s, '위스키 피크', 'gl_entry', 'story');
    requestArrival(s, PORT, 'gl_entry', 'drift');
    expect(s.queue).not.toContain(landing);
    expect(s.log.at(-1)?.text).toContain(traces[action]);
  });

  it('바늘이 굳으면 실제 다음 항해를 시작한다', () => {
    const s = makeLandfall();
    answer(s, 1); step(s); answer(s, 1); step(s);
    answer(s, 0);
    expect(s.hero.island).toBe(PORT);
    expect(s.passage?.to).toBe('리틀 가든');
    expect(s.flags).not.toContain('moroPlumb');
  });

  it('옛 저장의 방문 이력이나 장면 이동만으로 섬에서 겪은 일을 지어내지 않는다', () => {
    const s = sailor();
    s.flags.push(`at:${PORT}`);
    requestArrival(s, PORT, 'gl_entry', 'story');
    const old = reload(s);
    expect(old.queue).not.toContain(landing);
    expect(old.log.some(l => l.text.includes('약병') || l.text.includes('천막'))).toBe(false);
    expect(old.flags).not.toContain('moroPlumb');
  });
});
