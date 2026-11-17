import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { checkAll } from '../../src/v5/core/cond';
import { lineFits } from '../../src/v5/core/year';
import { LINES } from '../../src/v5/data/lines';
import { TURNING_BY_ID } from '../../src/v5/data/turnings';

describe('섬에 맞는 공통 지문', () => {
  it('어른의 장소별 기록 줄은 현재 섬에 맞는 한 줄만 고른다', () => {
    const s = newLife5(1);
    s.age = 25;
    const stories = LINES.filter((line) => /모험담을 들었다|방문객의 이야기를 들었다|오래된 땅의 이야기|지상에 다녀온|먼 고을 이야기|길손이 들려준 먼 곳/.test(line.text));
    for (const island of ['쿠라우 도시', '엔젤섬', '샨디아 마을', '어인가', '쿠리', '로그타운']) {
      s.hero.island = island;
      expect(stories.filter((line) => lineFits(s, line)), island).toHaveLength(1);
    }
  });

  it('와노 내륙의 어린 시절에 부두의 뱃사람 사건을 내지 않는다', () => {
    const s = newLife5(1);
    s.age = 7;
    s.hero.island = '쿠리';
    expect(checkAll(s, TURNING_BY_ID.kid_sailor_tale.when)).toBe(false);
    const wanoTale = TURNING_BY_ID.kid_wano_wanderer_tale;
    expect(wanoTale).toBeDefined();
    expect(checkAll(s, wanoTale.when)).toBe(true);
    s.hero.island = '후샤 마을';
    expect(checkAll(s, wanoTale.when)).toBe(false);
  });

  it('조우에 도착한 해적에게 해군의 길목 포위를 내지 않는다', () => {
    const s = newLife5(1);
    s.age = 25;
    s.hero.standing = 'pirate';
    s.hero.island = '조우';
    s.hero.fame = 30;
    expect(checkAll(s, TURNING_BY_ID.pirate_tavern_caught.when)).toBe(false);
  });
});
