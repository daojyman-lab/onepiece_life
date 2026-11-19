import { describe, expect, it } from 'vitest';
import { normalizeLife5 } from '../../src/core/load';
import { depart, passagePart, resumeVoyage, UNNAMED_ISLET } from '../../src/core/passage';
import { newLife5 } from '../../src/core/state';
import { answerDoor } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { seaOfPort } from '../../src/data/navigation';

function sailor(seed: number, port = '알라바스타 왕국') {
  const s = newLife5(seed, { home: 'loguetown' });
  Object.assign(s.hero, { island: port, sea: seaOfPort(port), standing: 'pirate', hp: 65, provisions: 0 });
  s.age = 24;
  s.pending = null;
  s.rng = { seed, cursor: 0 };
  return s;
}

function finish(s: Life5) {
  for (let tick = 0; s.passage && tick < 12; tick++) passagePart(s, () => 0);
  expect(s.passage).toBeNull();
}

function findStop(order = false) {
  for (let seed = 0; seed < 100; seed++) {
    const s = sailor(seed);
    if (order) s.hero.standing = 'marine';
    depart(s, '워터 세븐', order ? 'drift' : 'dream', order);
    passagePart(s, () => 0);
    if (s.hero.island === UNNAMED_ISLET) return s;
  }
  throw new Error('외해 구간에 정박이 나타나지 않았다');
}

describe('외해의 이름 없는 섬', () => {
  it('장거리만 식량을 쓰고 때때로 기항한다. 해저와 상승 해류에서는 계속 항해한다', () => {
    let stops = 0;
    for (let seed = 0; seed < 100; seed++) {
      const s = sailor(seed); s.hero.provisions = 2;
      depart(s, '워터 세븐', 'dream');
      expect(s.hero).toMatchObject({ hp: 68, provisions: 1 });
      passagePart(s, () => 0);
      if (s.hero.island === UNNAMED_ISLET) stops++;
      for (const [from, to] of [['자야', '스카이피아'], ['샤본디 제도', '어인섬'], ['셸스 타운', '오렌지 마을']]) {
        const short = sailor(seed, from); short.hero.provisions = 4;
        depart(short, to, 'dream');
        expect(short.passage?.stopover).toBeUndefined();
        expect(short.hero).toMatchObject({ hp: 65, provisions: 4 });
      }
    }
    expect(stops).toBeGreaterThan(15);
    expect(stops).toBeLessThan(60);
  });

  it('날씨를 겪고 정박한 배는 저장 뒤에도 보급과 도착 보상을 한 번만 받는다', () => {
    const s = findStop();
    const will = s.hero.base.wil;
    expect(s.pending).toMatchObject({ turning: 'islet_resupply' });
    expect(s.pending?.kind === 'door' && s.pending.body).toContain('워터 세븐');
    expect(s.passage?.last).toBeDefined();
    expect(s.flags).not.toContain('at:워터 세븐');
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    answerDoor(loaded, 0);
    finish(loaded);
    expect(loaded.hero).toMatchObject({ island: '워터 세븐', sea: 'gl_first', provisions: 3 });
    expect(loaded.hero.base.wil).toBe(will + 1);
    resumeVoyage(loaded, 3);
    expect(loaded.hero.provisions).toBe(3);
    expect(loaded.hero.base.wil).toBe(will + 1);
  });

  it('같은 배는 다음 외해에서 연속으로 멈추지 않고, 뒤의 항해에서는 다른 정박을 선택할 수 있다', () => {
    const s = findStop(true);
    const seed = s.rng.seed;
    s.hero.provisions = 6;
    answerDoor(s, 0); finish(s);
    expect(s.hero.provisions).toBe(6);
    expect(s.log.some(l => l.text.includes('전근 명령'))).toBe(true);
    s.rng = { seed, cursor: 0 };
    depart(s, '플로리안 트라이앵글', 'drift', true);
    expect(s.passage?.stopover).toBeUndefined();
    finish(s);
    s.hero.island = '알라바스타 왕국'; s.hero.sea = 'gl_first';
    s.rng = { seed, cursor: 0 };
    depart(s, '워터 세븐', 'drift', true);
    passagePart(s, () => 0);
    expect(s.pending).toMatchObject({ turning: 'islet_rainwater' });
    const stores = s.hero.provisions;
    answerDoor(s, 2); finish(s);
    expect(s.hero.provisions).toBe(stores);
  });

  it('종전 정박 저장은 원래 목적지로 이어지고 잘못된 식량·목적지는 읽지 않는다', () => {
    const life = sailor(8, '워터 세븐');
    const old = { ...life, hero: { ...life.hero, island: UNNAMED_ISLET, provisions: undefined },
      passage: { destination: '플로리안 트라이앵글', route: 'transfer' } };
    const loaded = normalizeLife5(old)!;
    expect(loaded.hero.provisions).toBe(0);
    expect(loaded.passage).toMatchObject({ to: '플로리안 트라이앵글', from: '워터 세븐', order: true });
    passagePart(loaded, () => 0);
    answerDoor(loaded, 1);
    expect(loaded.hero).toMatchObject({ island: '플로리안 트라이앵글', provisions: 1, sea: 'sabaody' });
    expect(normalizeLife5({ ...old, passage: { destination: '알 수 없는 항구', route: 'dream' } })).toBeNull();
    expect(normalizeLife5({ ...old, passage: null })).toBeNull();
    expect(normalizeLife5({ ...life, hero: { ...life.hero, provisions: -1 } })).toBeNull();
  });
});
