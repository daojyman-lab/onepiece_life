import { describe, expect, it } from 'vitest';
import { check } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { passagePart } from '../../src/core/passage';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openQueued, openTurning } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { buildVoyage, openRouteArrival, regularDestinations, voyageChoices, voyageId } from '../../src/core/voyage';
import { stepPart } from '../../src/core/year';
import { connectedPorts, CONTENT_CLASS, destinationAt, ROUTE_TREE, portOf, seaOfPort } from '../../src/data/navigation';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { SEAS } from '../../src/shared/data/seas';

function traveler(port: string, age = 25) {
  const s = newLife5(32, { home: 'loguetown' });
  Object.assign(s.hero, { standing: 'pirate', island: port, sea: seaOfPort(port), money: 50000 });
  s.pending = null;
  s.age = age;
  s.vows!.declined = true;
  return s;
}

function travel(s: Life5, port: string) {
  const choices = voyageChoices(s, () => 0.1)!;
  const menu = buildVoyage(voyageId(s, choices))!;
  const index = menu.doors.findIndex(d => d.fx.some(f => f.op === 'sail' && f.island === port));
  expect(index, port).toBeGreaterThanOrEqual(0);
  expect(openTurning(s, menu)).toBe(true);
  answerDoor(s, index);
  for (let i = 0; s.passage && i < 12; i++) {
    passagePart(s, () => 0);
    if (s.pending?.kind === 'door' && s.pending.turning.startsWith('islet_')) answerDoor(s, 2);
  }
  expect(s.passage).toBeNull();
}

describe('연결 항로와 기항 이야기', () => {
  it('각 바다의 기존 항구로 되돌아가 놓친 지역 이야기를 이어 갈 수 있다', () => {
    for (const sea of SEAS) for (const age of [18, 25]) {
      const ports = new Set(sea.ports.filter(p => p !== '플로리안 트라이앵글' || age > 18).map(p => destinationAt(p, age)));
      for (const origin of ports) {
        const reached = new Set([origin]);
        for (const from of reached) for (const to of connectedPorts(from, sea.id, [], age)) {
          if (ports.has(to)) reached.add(to);
        }
        expect(reached, origin).toEqual(ports);
      }
    }
  });
  it('모든 등록 기항지의 다음 항구를 실제 항로 창에 표시한다', () => {
    expect(Object.values(CONTENT_CLASS).map(g => g.length)).toEqual([6, 9, 6]);
    for (const port of Object.keys(ROUTE_TREE)) for (const age of [18, 24]) {
      const s = traveler(port, age);
      s.flags.push('ship');
      const destinations = regularDestinations(s);
      for (const port of destinations) expect(seaOfPort(port), port).toBeDefined();
      const menu = buildVoyage(voyageId(s, voyageChoices(s, () => 0.4)!))!;
      const offered = menu.doors.flatMap(d => d.fx.flatMap(f => f.op === 'sail' ? [f.island] : []));
      expect(offered.sort(), port).toEqual(destinations.sort());
      expect(menu.doors.at(-1)?.label).toBe('이곳에 더 머문다');
    }
    expect(portOf('쿠라우 도시')).toBe('조우');
    expect(regularDestinations(traveler('로그타운'))).not.toContain('리버스 마운틴');
    expect(regularDestinations(traveler('샤본디 제도'))).toContain('아마존 릴리');
    expect(regularDestinations(traveler('쿠라우 도시'), true)).not.toContain('와노쿠니');
  });

  it('실제 항로와 선택으로 쌍둥이 곶·리틀 가든·드럼의 연속 장면을 거쳐 해역을 넘는다', () => {
    const s = traveler('리버스 마운틴');
    for (const [port, first, ending] of [
      ['쌍둥이 곶', 'cape_1', 'cape:done'], ['리틀 가든', 'garden_1', 'garden:done'], ['드럼 왕국', 'drum_1', 'drum:done'],
    ]) {
      travel(s, port);
      stepPart(s);
      expect(s.pending).toMatchObject({ turning: first });
      if (first === 'drum_1') expect(s.pending?.kind === 'door' && s.pending.doors[2].locked).toBeNull();
      answerDoor(s, first === 'drum_1' ? 2 : 0);
      expect(openQueued(s)).toBe(true);
      answerDoor(s, 0);
      expect(openQueued(s)).toBe(true);
      answerDoor(s, 0);
      expect(s.flags).toContain(ending);
    }
    travel(s, '알라바스타 왕국');
    expect(s.hero).toMatchObject({ island: '알라바스타 왕국', sea: 'gl_first' });
  });

  it.each([
    ['자야', '롱 링 롱 랜드', 'route_sky', 'route:sky'],
    ['샤본디 제도', '아마존 릴리', 'route_coating', 'route:coating'],
    ['드레스로자', '펑크 해저드', 'route_zou', 'route:zou'],
  ])('%s에서 미룬 준비는 다른 항구에 다녀온 뒤 다시 열린다', (port, nearby, scene, flag) => {
    let s = traveler(port);
    expect(openRouteArrival(s)).toBe(true);
    expect(s.pending).toMatchObject({ turning: scene });
    answerDoor(s, 2);
    s.age++;
    s = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(openRouteArrival(s)).toBe(false);
    travel(s, nearby);
    travel(s, port);
    expect(openRouteArrival(s)).toBe(true);
    answerDoor(s, 1);
    expect(s.flags).toContain(flag);
    expect(openRouteArrival(s)).toBe(false);
    if (scene === 'route_coating') expect(check(s, { c: 'entryContact', gate: 'fishman' })).toBe(true);
    if (scene === 'route_zou') expect(check(s, { c: 'entryContact', gate: 'zou' })).toBe(true);
  });

  it.each([[18, '스릴러 바크', 'bark_bell'], [19, '플로리안 트라이앵글', 'florian_bell']] as const)(
    '%i세에 해당하는 안개 항로에서 측심원을 구해 샤본디에 닿는다', (age, target, scene) => {
      const s = traveler('워터 세븐', age);
      travel(s, target);
      expect(openRouteArrival(s)).toBe(true);
      expect(s.pending).toMatchObject({ turning: scene });
      answerDoor(s, 1);
      expect(openQueued(s)).toBe(true); answerDoor(s, 0);
      expect(openQueued(s)).toBe(true); answerDoor(s, 2);
      expect(s.flags).toContain('florian:rescued');
      travel(s, '샤본디 제도');
      expect(s.hero.island).toBe('샤본디 제도');
    });

  it('구판의 항로 창을 읽을 때 현재 연표에 맞는 목적지로 바꾼다', () => {
    const s = traveler('워터 세븐', 19);
    openTurning(s, buildVoyage('voyage:18:-:|스릴러 바크|')!);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(loaded.pending?.kind === 'door' && loaded.pending.doors[0].label).toContain('플로리안');
    answerDoor(loaded, 0);
    expect(loaded.passage?.to).toBe('플로리안 트라이앵글');
    s.pending = null;
    openTurning(s, TURNING_BY_ID.path_sea_sabaody);
    answerDoor(s, 2);
    expect(s.hero.island).toBe('플로리안 트라이앵글');
  });
});
