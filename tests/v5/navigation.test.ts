import { describe, expect, it } from 'vitest';
import { connectedPorts, CONTENT_CLASS, portOf, ROUTE_TREE, seaOfPort } from '../../src/v5/data/navigation';
import { newLife5 } from '../../src/v5/core/state';
import { apply5 } from '../../src/v5/core/reduce';
import { applyFx } from '../../src/v5/core/fx';
import { buildVoyage, sailTo, voyageChoices, voyageId } from '../../src/v5/core/voyage';
import { rngOf } from '../../src/core/rng';
import { normalizeLife5 } from '../../src/v5/core/load';
import type { Life5 } from '../../src/v5/core/types';

const pendingOf = (s: Life5): Life5['pending'] => s.pending;

describe('연결된 섬 항로', () => {
  it('모든 연결의 목적지에 해역이 있고 분류는 6/9/6이며 겹치지 않는다', () => {
    for (const ports of Object.values(ROUTE_TREE)) for (const port of ports) expect(seaOfPort(port), port).toBeDefined();
    expect(Object.values(CONTENT_CLASS).map((x) => x.length)).toEqual([6, 9, 6]);
    expect(new Set(Object.values(CONTENT_CLASS).flat()).size).toBe(21);
  });
  it('초반 갈림길을 거쳐 다음 해역까지 실제 항해 선택으로 간다', () => {
    const s = newLife5(4); s.pending = null; s.age = 25; s.hero.island = '리버스 마운틴'; s.hero.sea = 'gl_entry';
    for (const target of ['쌍둥이 곶', '리틀 가든', '드럼 왕국', '알라바스타 왕국']) {
      const choices = voyageChoices(s, rngOf(s.rng))!;
      const route = buildVoyage(voyageId(s, choices))!;
      const door = route.doors.find((d) => d.fx.some((f) => f.op === 'sail' && f.island === target));
      expect(door, target).toBeDefined();
      const effect = door!.fx.find((f) => f.op === 'sail')!;
      if (effect.op === 'sail') sailTo(s, effect.island, effect.route);
    }
    expect(s.hero.sea).toBe('gl_first');
    expect(s.hero.island).toBe('알라바스타 왕국');
  });
  it('다음 해역으로 건너가고 갈림길이 하나인 항로도 열린다', () => {
    const s = newLife5(4); s.pending = null; s.age = 25; s.hero.island = '드럼 왕국'; s.hero.sea = 'gl_entry';
    const choices = voyageChoices(s, rngOf(s.rng))!;
    expect(choices.calm).toBe('알라바스타 왕국');
    expect(buildVoyage(voyageId(s, choices))?.doors).toHaveLength(2);
    sailTo(s, '알라바스타 왕국', 'calm');
    expect(s.hero.sea).toBe('gl_first');
  });
  it('특수 항로에 코팅과 길잡이가 필요하다', () => {
    expect(connectedPorts('샤본디 제도', 'sabaody', [], 25)).not.toContain('어인섬');
    expect(connectedPorts('샤본디 제도', 'sabaody', ['route:coating'], 25)).toContain('어인섬');
    expect(connectedPorts('드레스로자', 'nw_first', ['route:zou'], 25)).toContain('조우');
    expect(portOf('쿠라우 도시')).toBe('조우');
  });
  it('거절한 특수 항로는 같은 항구에 머무는 동안 쉬고 다른 항구에 가면 다시 열린다', () => {
    const s = newLife5(4);
    s.pending = null; s.age = 28; s.hero.island = '자야'; s.hero.sea = 'gl_first';
    apply5(s, { type: 'step' });
    expect(pendingOf(s)).toMatchObject({ turning: 'route_sky' });
    apply5(s, { type: 'answer', index: 2 });
    s.age++;
    apply5(s, { type: 'step' });
    expect(s.seenCount.route_sky).toBe(1);
    s.pending = null;
    applyFx(s, [{ op: 'move', island: '샤본디 제도', sea: 'sabaody' }]);
    apply5(s, { type: 'step' });
    expect(pendingOf(s)).toMatchObject({ turning: 'route_coating' });
    apply5(s, { type: 'answer', index: 2 });
    applyFx(s, [{ op: 'moveHome' }, { op: 'move', island: '자야', sea: 'gl_first' }]);
    apply5(s, { type: 'step' });
    expect(pendingOf(s)).toMatchObject({ turning: 'route_sky' });
  });
  it('조로 저장한 옛 위치와 방문 표시를 조우로 읽는다', () => {
    const s = newLife5(4); s.hero.island = '조'; s.flags.push('at:조');
    const loaded = normalizeLife5(s)!;
    expect(loaded.hero.island).toBe('조우'); expect(loaded.flags).toContain('at:조우');
  });
  it.each([
    ['쌍둥이 곶', 'gl_entry', 'cape:done'], ['리틀 가든', 'gl_entry', 'garden:done'], ['드럼 왕국', 'gl_entry', 'drum:done'],
  ] as const)('%s 도착에서 일반 선택으로 후일담까지 이어진다', (island, sea, done) => {
    const s = newLife5(4); s.pending = null; s.age = 25; s.hero.island = island; s.hero.sea = sea;
    apply5(s, { type: 'step' });
    expect(pendingOf(s)?.kind).toBe('door');
    for (let i = 0; i < 12 && !s.flags.includes(done); i++) {
      const pending = pendingOf(s);
      if (pending?.kind === 'door') apply5(s, { type: 'answer', index: pending.doors.findIndex((d) => !d.locked) });
      else apply5(s, { type: 'step' });
    }
    expect(s.flags).toContain(done);
  });
});
