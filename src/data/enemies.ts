// 강적의 원형. 이야기에 나오는 상대와 실제로 싸우는 상대가 같도록, 임무 · 선택은 원형을 이름으로 부른다.
// 쓰는 법: 'gen:elite:seaking' (우두머리 한 명), 'gen:captain:pirate_captain' (간부를 거느린 우두머리)
import type { EnemySpec } from '../core/types';

export interface Archetype {
  title: string;
  faction: EnemySpec['faction'] | 'opposite';     // opposite: 해적이면 해군, 해군이면 해적
  names?: string[];                               // 정해진 이름 후보. 없으면 「별명」 이름
  species?: EnemySpec['species'];
  form?: EnemySpec['form'];
  noOfficers?: boolean;
  skills?: string[];                              // 정해진 기술. 없으면 힘에 맞춰 뽑는다
  fruitAllowed?: boolean;
  bias?: { str?: number; spd?: number; vit?: number; int?: number; wil?: number };
}

export const ARCHETYPES: Record<string, Archetype> = {
  seaking: {
    title: '바다의 괴물', faction: 'civil', form: 'seaking', noOfficers: true, fruitAllowed: false,
    names: ['거대 해왕류', '뿔 달린 해왕류', '바다뱀 해왕류', '줄무늬 해왕류'],
    skills: ['fist_jab', 'fist_combo', 'fist_quake', 'fist_iron'],
    bias: { str: 1.25, vit: 1.4, spd: 0.8, int: 0.2, wil: 0.6 },
  },
  bounty_hunter: { title: '현상금 사냥꾼', faction: 'civil', fruitAllowed: true },
  corrupt_officer: { title: '부패한 해군 상관', faction: 'marine', fruitAllowed: false },
  marine_officer: { title: '해군 장교', faction: 'marine', fruitAllowed: true },
  pirate_captain: { title: '해적 선장', faction: 'pirate', fruitAllowed: true },
  wanted: { title: '현상수배범', faction: 'pirate', fruitAllowed: true },
  slaver: { title: '인신매매 조직 보스', faction: 'civil', fruitAllowed: true },
  tyrant: { title: '섬의 폭군', faction: 'civil', fruitAllowed: true },
  thug: { title: '무법자 두목', faction: 'civil', fruitAllowed: false },
  arena: { title: '투기장 챔피언', faction: 'civil', fruitAllowed: true },
  rival_crew: { title: '경쟁 해적단 선장', faction: 'pirate', fruitAllowed: true },
};
