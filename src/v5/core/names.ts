// 이름 짓기: 고향의 아이 이름, 곁에서 만나는 사람의 이름 (성이 있기도 없기도 하다)
import { chance, pick, weighted, type Rng } from '../../core/rng';
import { FIRST_NAMES } from '../../data/births';
import { HOME_POOLS, NAME_POOLS, NPC_SURNAME_P, npcStyle } from '../data/names';
import type { HomeId, Life5 } from './types';

const poolOf = (keys: readonly string[], gender: 'm' | 'f'): string[] =>
  keys.flatMap((k) => { const p = NAME_POOLS[k]; return [...(p[gender].length ? p[gender] : p.m)]; });

/** 그 고향에서 태어난 아이의 이름 후보 (이스트 블루풍 기본 이름 + 고향의 풀) */
export function homeFirstNames(home: HomeId, gender: 'm' | 'f'): string[] {
  const keys = HOME_POOLS[home];
  if (home === 'wano') return poolOf(['wano'], gender);
  const base = home === 'fishman' || home === 'sky' ? [] : FIRST_NAMES[gender];
  return [...base, ...(keys ? poolOf(keys, gender) : [])];
}

/** 곁에서 만나는 사람의 이름. 지금 처지 · 섬에 맞는 풀에서 고르고, 확률로 성을 붙인다 */
export function npcName(s: Life5, r: Rng, gender: 'm' | 'f'): string {
  const st = npcStyle(s.hero.home, s.hero.island, s.hero.standing);
  const key = weighted(r, st.pools, (x) => x[1])![0];
  const first = pick(r, poolOf([key], gender));
  return chance(r, NPC_SURNAME_P) ? `${pick(r, st.surnames)} ${first}` : first;
}
