import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { apply5 } from '../../src/core/reduce';
import { normalizeLife5 } from '../../src/core/load';
import { openTurning } from '../../src/core/turning';
import { buildVoyage, voyageChoices, voyageId } from '../../src/core/voyage';
import type { Life5 } from '../../src/core/types';
import { HOMES } from '../../src/data/homes';
import { AMAZON_ROADS, TRAINING_LINES } from '../../src/data/training-routes';
import { availableTrainingLines, seaOfPort, portOf, connectedPorts } from '../../src/data/navigation';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { passagePart } from '../../src/core/passage';

function visitor(port: string, gender: 'm' | 'f' = 'f') {
  const s = newLife5(27, { home: 'loguetown', gender });
  s.age = 25;
  s.pending = null;
  s.queue = [];
  Object.assign(s.hero, { island: port, sea: seaOfPort(port), standing: 'pirate' });
  return s;
}

function landed(s: Life5) {
  for (let i = 0; s.passage && i < 20; i++) {
    passagePart(s, () => 0);
    if (s.pending?.kind === 'door' && s.pending.turning.startsWith('islet_')) apply5(s, { type: 'answer', index: 2 });
  }
  expect(s.passage).toBeFalsy();
}

function board(s: Life5, id: string) {
  const choices = voyageChoices(s, () => 0.3)!;
  const menu = buildVoyage(voyageId(s, choices))!;
  const door = menu.doors.findIndex(d => d.fx.some(f => f.op === 'trainingTrip' && f.line === id));
  expect(door).toBeGreaterThanOrEqual(0);
  expect(openTurning(s, menu)).toBe(true);
  apply5(s, { type: 'answer', index: door });
  landed(s);
}

function stepDoor(s: Life5) {
  apply5(s, { type: 'step' });
  if (s.pending?.kind !== 'door') throw Error('수련 선택지가 열리지 않았다');
  return s.pending;
}

describe('수련 섬의 승선·실습·귀항', () => {
  for (const line of TRAINING_LINES) it(line.from + ' → ' + line.island + ' 왕복과 네 가지 수련 결과', () => {
    for (const branch of [0, 1]) for (const ending of [0, 1]) {
      let s = visitor(line.from);
      board(s, line.id);
      expect(s.hero).toMatchObject({ island: line.island, sea: line.sea });
      expect(stepDoor(s).turning).toBe('field_' + line.course);
      apply5(s, { type: 'answer', index: branch });
      s = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
      const follow = stepDoor(s);
      expect(follow.turning).toMatch(new RegExp('^field_' + line.course + '_'));
      const gain = TURNING_BY_ID[follow.turning].doors[ending].fx.find(f => f.op === 'base' || f.op === 'mastery')!;
      const measured = (): number => gain.op === 'base' && gain.key !== 'all' ? s.hero.base[gain.key] :
        gain.op === 'mastery' ? s.growth.mastery[gain.branch] : NaN;
      const before = measured();
      apply5(s, { type: 'answer', index: ending });
      expect(measured()).toBeGreaterThan(before);
      expect(s.flags).toContain('training:done:' + line.course);
      landed(s);
      expect(portOf(s.hero.island)).toBe(line.from);
      expect(s.hero.sea).toBe(seaOfPort(line.from));
      const after = measured();
      apply5(s, { type: 'trainingTrip', line: line.id });
      landed(s);
      expect(stepDoor(s).turning).toBe('field_' + line.course + '_return');
      apply5(s, { type: 'answer', index: 0 });
      landed(s);
      expect(measured()).toBe(after);
    }
  });
  it('수련을 미루면 같은 항구에서 재도전할 수 있다', () => {
    const s = visitor('자야');
    apply5(s, { type: 'trainingTrip', line: 'balloon' });
    expect(stepDoor(s).turning).toBe('field_weatheria');
    apply5(s, { type: 'answer', index: 2 });
    expect(s.hero.island).toBe('자야');
    expect(s.flags).not.toContain('training:done:weatheria');
    board(s, 'balloon');
    expect(stepDoor(s).turning).toBe('field_weatheria');
  });
  it('기존 항로 창의 인덱스와 승선 제한을 지킨다', () => {
    const s = visitor('자야');
    const old = 'voyage:25:-:워터 세븐|||:자야';
    expect(buildVoyage(old)?.doors.map(d => d.label)).toEqual(['잔잔한 뱃길로 워터 세븐에 간다', '이곳에 더 머문다']);
    apply5(s, { type: 'trainingTrip', line: 'workshop' });
    expect(s.hero.island).toBe('자야');
    s.age = 15;
    expect(availableTrainingLines(s)).toEqual([]);
    s.age = 20; s.hero.standing = 'prisoner';
    expect(availableTrainingLines(s)).toEqual([]);
    s.hero.standing = 'pirate';
    openTurning(s, TURNING_BY_ID.route_sky);
    apply5(s, { type: 'trainingTrip', line: 'balloon' });
    expect(s.hero.island).toBe('자야');
    expect(s.passage).toBeFalsy();
  });
  it('드럼에서 토리노로 가다 보급섬에 정박한 저장을 이어 원래 배편으로 돌아간다', () => {
    let stopped = false;
    for (let seed = 0; seed < 60 && !stopped; seed++) {
      let s = visitor('드럼 왕국');
      s.rng = { seed, cursor: 0 };
      apply5(s, { type: 'trainingTrip', line: 'relief' });
      if (s.passage?.stopover !== 'planned') continue;
      passagePart(s, () => 0);
      expect(s.hero.island).toBe('이름 없는 섬');
      stopped = true;
      s = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
      expect(s.pending?.kind).toBe('door');
      apply5(s, { type: 'answer', index: 0 });
      landed(s);
      expect(s.hero).toMatchObject({ island: '토리노 왕국', sea: 'south', provisions: 3 });
      expect(stepDoor(s).turning).toBe('field_torino');
      apply5(s, { type: 'answer', index: 2 });
      landed(s);
      expect(s.hero.island).toBe('드럼 왕국');
    }
    expect(stopped).toBe(true);
  });
  it('부두가 속한 마을과 이전 저장의 정박 위치를 인식한다', () => {
    const worker = visitor('시프트 역');
    expect(availableTrainingLines(worker).map(line => line.id)).toContain('workshop');
    const legacy = visitor('아마존 릴리', 'm');
    const restored = normalizeLife5(JSON.parse(JSON.stringify(legacy)))!;
    expect(restored.hero.island).toBe(AMAZON_ROADS);
    expect(availableTrainingLines(restored).map(line => line.id)).toEqual(['kuja']);
  });
  it('여인섬의 외해에서 남성도 상륙 없이 루스카이나를 왕복한다', () => {
    const s = visitor('샤본디 제도', 'm');
    const choices = voyageChoices(s, () => 0.3)!;
    const menu = buildVoyage(voyageId(s, choices))!;
    const idx = menu.doors.findIndex(d => d.fx.some(f => f.op === 'sail' && f.island === '아마존 릴리'));
    expect(idx).toBeGreaterThanOrEqual(0);
    openTurning(s, menu);
    apply5(s, { type: 'answer', index: idx });
    landed(s);
    expect(s.hero.island).toBe(AMAZON_ROADS);
    board(s, 'kuja');
    stepDoor(s);
    apply5(s, { type: 'answer', index: 2 });
    landed(s);
    expect(s.hero.island).toBe(AMAZON_ROADS);
  });
  it.each(Object.values(HOMES).map(home => home.island))('%s에서 일곱 수련 장소의 출발항까지 항로가 이어진다', origin => {
    const reached = new Set([origin]);
    for (const port of reached) for (const next of connectedPorts(port, seaOfPort(port)!, ['ship', 'route:coating', 'route:sky', 'route:zou'], 25)) reached.add(next);
    for (const course of new Set(TRAINING_LINES.map(l => l.course))) {
      expect(TRAINING_LINES.some(l => l.course === course && reached.has(l.from)), course).toBe(true);
    }
    expect(connectedPorts('자야', 'gl_first', [], 25)).not.toContain('웨더리아');
  });
});
