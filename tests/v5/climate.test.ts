// tests/v5/climate.test.ts — 섬의 기후 (특별한 장소)
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/core/rng';
import { SEAS } from '../../src/data/seas';
import { newLife5 } from '../../src/v5/core/state';
import { climatePart, usedTo } from '../../src/v5/core/climate';
import { arrive, canonYear, rollWeather } from '../../src/v5/core/passage';
import { ISLAND_CLIMATE, climateOf } from '../../src/v5/data/climates';
import { HOMES } from '../../src/v5/data/homes';
import type { Life5 } from '../../src/v5/core/types';

/** 그 섬에 머무는 바깥사람 하나 */
function visitor(island: string, sea: Life5['hero']['sea'], seed = 3): Life5 {
  const s = newLife5(seed);
  s.pending = null; s.age = 22; s.hero.standing = 'pirate';
  s.hero.island = island; s.hero.sea = sea; s.hero.hp = 100;
  return s;
}
/** n토막 동안 섬의 기후만 굴린다 */
function stay(s: Life5, n: number, seed = 1) {
  const r = rngOf({ seed, cursor: 0 });
  const before = s.log.length;
  for (let i = 0; i < n; i++) { s.part = (i % 4) as Life5['part']; climatePart(s, r); }
  return s.log.slice(before);
}

describe('섬의 기후 자료', () => {
  it('기후가 있는 섬은 모두 실제로 있는 섬(바다의 항구나 고향의 섬)이다', () => {
    const known = new Set([...SEAS.flatMap((x) => x.ports), ...Object.values(HOMES).map((h) => h.island), '엔젤섬', '샨디아 마을', '어인가', '류구 왕국', '바다의 숲', '하나노미야코', '쿠리', '에비스 마을']);
    for (const island of Object.keys(ISLAND_CLIMATE)) expect(known.has(island), island).toBe(true);
  });
  it('펑크 해저드 · 하늘섬 · 조우에 기후가 있다', () => {
    expect(climateOf('펑크 해저드')?.name).toBe('불과 얼음의 섬');
    expect(climateOf('스카이피아')?.name).toBe('하늘섬');
    expect(climateOf('조')?.name).toBe('코끼리 등 위의 섬');
    expect(climateOf('조우')).toBe(climateOf('조'));
    expect(climateOf('후샤 마을')).toBeUndefined();
  });
});

describe('섬에 머무는 동안', () => {
  it('펑크 해저드에 머물면 불과 얼음의 기록이 남고 체력이 깎이지만, 죽지는 않는다', () => {
    const s = visitor('펑크 해저드', 'nw_first');
    s.hero.hp = 10;
    const lines = stay(s, 40);
    expect(lines.some((l) => ISLAND_CLIMATE['펑크 해저드'].lines.includes(l.text))).toBe(true);
    expect(s.hero.hp).toBeGreaterThanOrEqual(1);
    expect(s.hero.hp).toBeLessThan(10);
  });
  it('하늘섬 사람은 하늘섬 기후에 다치지 않고, 밍크는 조우에서 다치지 않는다', () => {
    const sky = visitor('스카이피아', 'gl_first');
    sky.hero.species = 'skypiean';
    expect(usedTo(sky, '스카이피아', ISLAND_CLIMATE['스카이피아'])).toBe(true);
    stay(sky, 40);
    expect(sky.hero.hp).toBe(100);
    const mink = visitor('조', 'nw_first');
    mink.hero.species = 'mink';
    stay(mink, 40);
    expect(mink.hero.hp).toBe(100);
  });
  it('워터 세븐에는 해마다 같은 토막에 아쿠아 라구나가 온다', () => {
    const s = visitor('워터 세븐', 'gl_first');
    const lines = stay(s, 40);
    const aqua = lines.filter((l) => l.text.includes('아쿠아 라구나'));
    expect(aqua.length).toBeGreaterThan(0);
    expect(aqua.every((l) => l.weight === 'heavy')).toBe(true);
  });
  it('기후가 없는 섬, 바다 위에서는 아무것도 끼어들지 않는다', () => {
    const plain = visitor('후샤 마을', 'east');
    expect(stay(plain, 40)).toEqual([]);
    const sea = visitor('펑크 해저드', 'nw_first');
    sea.passage = { to: '드레스로자', route: 'calm', partsLeft: 2, partsSpent: 0, maxParts: 5 };
    expect(stay(sea, 40)).toEqual([]);
  });
});

describe('특별한 섬으로 가는 길', () => {
  it('하늘섬에는 노크업 스트림으로 닿는다', () => {
    const s = visitor('자야', 'gl_first');
    arrive(s, { to: '스카이피아', route: 'dream', partsLeft: 0, partsSpent: 1, maxParts: 4 });
    expect(s.hero.island).toBe('스카이피아');
    expect(s.log.some((l) => l.text.includes('노크업 스트림'))).toBe(true);
  });
  it('스릴러 바크로 가는 바다는 안개가 짙다', () => {
    const r = rngOf({ seed: 2, cursor: 0 });
    const fog = (tilt?: Record<string, number>) => Array.from({ length: 2000 }, () => rollWeather('paradise', 'dream', undefined, r, tilt)).filter((w) => w === 'fog').length;
    expect(fog(ISLAND_CLIMATE['스릴러 바크'].approach!.tilt)).toBeGreaterThan(fog() * 2);
  });
  it('열일곱 살이 해원력 1522년이다', () => {
    expect(canonYear(17)).toBe(1522);
    expect(canonYear(19)).toBe(1524);
  });
});
