// 섬 장편 에피소드의 공용 도구 (v6.6, 규칙: docs/02_설계/섬_장편_에피소드_작성규칙.md)
// 에피소드 = 섬에 닿으면 열리는 첫 장면(가중치 > 0) + 문이 줄 세우는 뒤 장면들(가중치 0, queue로만 온다).
import { statsAround } from '../../shared/data/bosses';
import { V } from '../balance';
import type { Cond, EnemySpec, Fx, FightNext, SeaId } from '../../core/types';

export const D = V.value.door;
/** 이 섬(들)에 있을 때 */
export const on = (...islands: string[]): Cond => ({ c: 'island', is: islands });
export const flag = (id: string): Fx => ({ op: 'flag', id });
export const has = (id: string): Cond => ({ c: 'flag', id, has: true });
export const not = (id: string): Cond => ({ c: 'flag', id, has: false });
export const next = (turning: string): Fx => ({ op: 'queue', turning });
export const log = (text: string, weight: 'light' | 'heavy' = 'heavy'): Fx => ({ op: 'log', text, weight });
export const time = (text: string, canon?: string): Fx => ({ op: 'timeline', text, ...(canon ? { canon } : {}) });
/** 이름 있는 상대와의 싸움. lethal이면 지면 죽을 수 있다. n: 싸움 뒤에 이어질 장면 */
export const fight = (foe: string, lethal: boolean, n?: FightNext, forced = false): Fx => ({ op: 'fight', foe, lethal, forced, ...(n ? { next: n } : {}) });
export const ready = (min: number): Cond => ({ c: 'tier', branch: 'any', min });

/** 에피소드에 새로 나오는 이름 있는 상대. p: 힘(바다의 보스 둘레, 이스트 블루 20~28 · 위대한 항로 전반 40~70 · 어인섬 ~90 · 신세계 100~180) */
export interface FoeDef {
  id: string; name: string; title: string; canon?: string; p: number; sea: SeaId;
  bias?: Parameters<typeof statsAround>[1];
  faction?: EnemySpec['faction']; gender?: 'm' | 'f'; age?: number;
  skills: string[]; tactic: EnemySpec['tactic'];
  armament?: number; observation?: number; fruitClass?: EnemySpec['fruitClass']; species?: EnemySpec['species'];
}
export function makeFoes(defs: FoeDef[]): EnemySpec[] {
  return defs.map(({ p, bias, sea, armament, observation, fruitClass, species, canon, faction, gender, age, ...o }) => ({
    ...o, canon: canon ?? null, faction: faction ?? 'pirate', gender: gender ?? 'm', age: age ?? 30,
    base: statsAround(p, bias), officers: [], armament: (armament ?? 0) as EnemySpec['armament'], observation: (observation ?? 0) as EnemySpec['observation'],
    fruitClass: fruitClass ?? null, species: species ?? 'human', sea: [sea],
  }) as EnemySpec);
}
