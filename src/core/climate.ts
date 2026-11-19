// 섬의 기후 (data/climates.ts): 그 섬에 머무는 한 토막마다 섬이 가진 기후가 일상에 끼어든다.
// 바다 위(passage)에서는 섬의 기후 대신 바다의 날씨가 온다. 기후로는 죽지 않는다.
import { chance, pick, rngOf, type Rng } from '../shared/core/rng';
import { V } from '../data/balance';
import { HOMES } from '../data/homes';
import { climateOf, type IslandClimate } from '../data/climates';
import { dayLine, isRecent, logLine } from './log';
import type { Life5 } from './types';

/** 이 사람은 이 섬의 기후에 익숙한가: 그 섬(또는 고향의 섬)에서 태어났거나, 그 땅의 종족 */
export function usedTo(s: Life5, island: string, c: IslandClimate): boolean {
  const h = s.hero;
  if (h.town === island || HOMES[h.home].island === island) return true;
  if (c.natives?.includes(h.species)) return true;
  return climateOf(h.town, s) === c;            // 하늘섬의 다른 섬 · 어인섬의 다른 거리처럼 같은 기후의 섬에서 나고 자랐다
}

/**
 * 기후만 쓰는 따로 된 주사위. 인생의 주사위(s.rng)를 건드리지 않아서, 기후가 있는 섬에 머물러도 사건 · 싸움의 흐름이 바뀌지 않는다.
 * 같은 인생 · 같은 나이 · 같은 토막이면 같은 기후다 (저장 · 불러오기 뒤에도)
 */
export function climateRng(s: Life5): Rng {
  const lap = s.prime?.lap ? 1 : 0;
  return rngOf({ seed: (s.rng.seed ^ 0x636c696d) >>> 0, cursor: ((s.age * 2 + lap) * 4 + s.part) * 4 });
}

/** 섬에 머무는 한 토막. 끼어들면 기록 한 줄과 체력 변화. r을 주지 않으면 기후의 주사위(climateRng)를 쓴다 */
export function climatePart(s: Life5, r: Rng = climateRng(s)): void {
  const h = s.hero;
  if (s.passage || !h.island) return;
  const c = climateOf(h.island, s);
  if (!c) return;
  const local = usedTo(s, h.island, c);
  const hurt = (n: number | undefined) => { if (n && !local) h.hp = Math.max(1, Math.min(V.hp.max, h.hp + n)); };
  if (c.season && s.part === c.season.part && chance(r, c.season.p)) {
    logLine(s, c.season.line, 'heavy');
    hurt(c.season.hp);
    return;
  }
  // 익숙한 사람에게는 기후가 일상이라 드물게만 눈에 띈다
  if (!chance(r, local ? c.p * V.climate.localMult : c.p)) return;
  const fresh = c.lines.filter((l) => !isRecent(s, l));
  if (!fresh.length) return;
  dayLine(s, pick(r, fresh));
  hurt(c.hp);
}
