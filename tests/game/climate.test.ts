// tests/v5/climate.test.ts — 섬의 기후 (특별한 장소)
import { describe, expect, it } from 'vitest';
import { rngOf } from '../../src/shared/core/rng';
import { SEAS } from '../../src/shared/data/seas';
import { newLife5 } from '../../src/core/state';
import { normalizeLife5 } from '../../src/core/load';
import { climatePart, usedTo } from '../../src/core/climate';
import { arrive, canonYear, depart, passagePart, rollPassage, rollWeather, type Passage } from '../../src/core/passage';
import { answerDoor } from '../../src/core/turning';
import { ISLAND_CLIMATE, climateOf } from '../../src/data/climates';
import { HOMES } from '../../src/data/homes';
import type { Life5 } from '../../src/core/types';
import { sceneOf } from '../../src/ui/view/profile';

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
    expect(lines.some((l) => climateOf('펑크 해저드', s)!.lines.includes(l.text))).toBe(true);
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

describe('그 시기의 항구와 바다', () => {
  function voyage(to: string): Passage {
    return { to, route: 'dream', partsLeft: 2, partsSpent: 0, maxParts: 5 };
  }

  it('알라바스타의 가뭄은 세 해만 지속되고, 되살아난 강은 전성기 두 번째 바퀴에도 흐른다', () => {
    const s = visitor('알라바스타 왕국', 'gl_first');
    const port = voyage(s.hero.island);
    const enter = (age: number, part: Life5['part']) => {
      s.age = age;
      s.part = part;
      const hp = s.hero.hp;
      climatePart(s, () => 0);
      return {
        place: sceneOf(s, true).place, line: s.log.at(-1)!.text, hp: s.hero.hp - hp,
        weather: rollPassage(port, s.hero.sea, 0, () => 0.68, s).weather,
      };
    };
    expect(enter(14, 2)).toMatchObject({ place: expect.stringContaining('사막의 나라'), weather: 'storm' });
    expect(enter(14, 3)).toMatchObject({ place: expect.stringContaining('가뭄'), hp: -3, weather: 'fog' });
    expect(enter(17, 2).place).toContain('가뭄');
    const after = enter(17, 3);
    expect(after).toMatchObject({ place: expect.stringContaining('돌아온 물길'), line: expect.stringContaining('물길'), hp: -1, weather: 'storm' });
    s.prime = { from: 17, until: 18, lap: true };
    expect(enter(17, 0).place).toBe(after.place);
  });

  it('펑크 해저드에 접근하는 도중 두 대장이 결투하면 그 토막부터 바다와 도착지가 바뀐다', () => {
    const s = visitor('드레스로자', 'nw_first');
    s.age = 20; s.part = 0;
    depart(s, '펑크 해저드', 'dream');
    const weather = (island: string) => rollPassage(voyage(island), s.hero.sea, 0, () => 0.74, s).weather;
    expect(weather('펑크 해저드')).toBe('calm');
    const nearby = weather('드레스로자');
    const beforeDuel = structuredClone(s);
    arrive(beforeDuel, beforeDuel.passage!);
    expect(sceneOf(beforeDuel, true).place).toContain('연구소');
    expect(beforeDuel.log.some(l => l.text.includes('연구소로 이어지는 철책'))).toBe(true);
    climatePart(beforeDuel, () => 0);
    expect(beforeDuel.log.at(-1)!.text).toContain('연구소');
    expect(beforeDuel.hero.hp).toBe(100);
    passagePart(s, () => 0.74);
    expect(s.passage?.last).toBe('calm');
    s.part = 1;
    expect(weather('드레스로자')).toBe(nearby);
    expect(weather('펑크 해저드')).toBe('anomaly');
    s.passage!.partsSpent = s.passage!.maxParts - 1;
    passagePart(s, () => 0.74);
    expect(s.hero.island).toBe('펑크 해저드');
    expect(sceneOf(s, true).place).toContain('불과 얼음');
    expect(s.log.some(l => l.text.includes('반은 불타고 반은 얼어붙은 섬'))).toBe(true);
  });

  it('이전 v5 저장의 항해도 현재 시각을 읽고 섬의 기후는 사건 주사위를 소비하지 않는다', () => {
    const s = visitor('드레스로자', 'nw_first');
    s.age = 20; s.part = 0; s.prime = { from: 20, until: 21, lap: true };
    depart(s, '펑크 해저드', 'dream');
    const snapshot = JSON.parse(JSON.stringify(s));
    delete snapshot.news;
    const loaded = normalizeLife5(snapshot)!;
    passagePart(loaded, () => 0.74);
    expect(loaded.passage?.last).toBe('anomaly');
    const rng = { ...loaded.rng };
    arrive(loaded, loaded.passage!);
    climatePart(loaded);
    expect(loaded.rng).toEqual(rng);
    expect(sceneOf(loaded, true).place).toContain('불과 얼음');
  });

  it('해원력만 넘기면 그해 첫 토막의 접근 날씨를 쓰고 칼름벨트는 늘 무풍이다', () => {
    const sameRoll = () => 0.74;
    expect(rollWeather('newWorld', 'dream', canonYear(20), sameRoll, '펑크 해저드')).toBe('calm');
    expect(rollWeather('newWorld', 'dream', canonYear(21), sameRoll, '펑크 해저드')).toBe('anomaly');
    expect(rollWeather('calmBelt', 'wild', { age: 17, part: 1 }, sameRoll, '로그타운')).toBe('calm');
  });

  it('로그타운의 폭풍은 사건이 일어나는 한 철 동안 그 항구에만 닿는다', () => {
    const s = visitor('로그타운', 'east');
    s.age = 17;
    const weather = (to: string) => rollPassage(voyage(to), 'east', 0, () => 0.60, s).weather;
    for (const part of [0, 1, 2] as const) {
      s.part = part;
      expect(weather('로그타운')).toBe(part === 1 ? 'storm' : 'tailwind');
      expect(weather('시럽 마을')).toBe('tailwind');
      expect(sceneOf(s, false).place.includes('폭풍')).toBe(part === 1);
    }
    s.part = 1; s.prime = { from: 17, until: 18, lap: true };
    expect(weather('로그타운')).toBe('tailwind');
  });

  it('드레스로자의 장난감과 에니에스 로비의 법정, 와노쿠니 고향의 강에도 그때의 모습이 남는다', () => {
    const at = (island: string, age: number, part: number) => climateOf(island, { age, part })!;
    expect(at('드레스로자', 11, 1).lines.join(' ')).not.toContain('장난감');
    expect(at('드레스로자', 21, 1).lines.join(' ')).toContain('장난감');
    expect(at('드레스로자', 21, 2).lines.join(' ')).not.toContain('장난감들이');
    expect(at('에니에스 로비', 18, 1).approach!.arrive).not.toContain('폐허');
    expect(at('에니에스 로비', 18, 2).approach!.arrive).toContain('폐허');
    const s = visitor('쿠리', 'nw_late');
    s.hero.town = '하나노미야코'; s.hero.home = 'wano';
    s.age = 22; s.part = 2;
    expect(at('쿠리', 22, 1).lines.join(' ')).toContain('굴뚝의 연기');
    expect(usedTo(s, '쿠리', at('쿠리', 22, 2))).toBe(true);
    expect(at('쿠리', 22, 2).lines.join(' ')).toContain('멎은 굴뚝');
  });
});

describe('특별한 섬으로 가는 길', () => {
  it('하늘섬에는 노크업 스트림으로 닿는다', () => {
    const s = visitor('자야', 'gl_first');
    arrive(s, { to: '스카이피아', route: 'dream', partsLeft: 0, partsSpent: 1, maxParts: 4 });
    // 항해를 마쳐도 진입 방법을 고르기 전에는 출발지에 남는다.
    expect(s.hero.island).toBe('자야');
    expect(s.pending?.kind).toBe('door');
    s.rng = { seed: 1, cursor: 0 };
    answerDoor(s, 0);
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
