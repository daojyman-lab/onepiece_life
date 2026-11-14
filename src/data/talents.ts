// 타고난 재능. 태어날 때 1~3개가 무작위로 붙는다. 좋은 것도 나쁜 것도 있고, 균형은 맞추지 않는다 (좀보이드식).
// 효과의 종류: 태어날 때 능력치(stat), 전투 패시브(mods), 숙련 속도(mastery), 패기 눈뜸(haki), 병 · 부상 · 노환 · 돈 · 동료.
import type { BranchId, Stats } from '../core/types';
import type { Mods } from './passives';

export interface Talent {
  id: string; name: string; good: boolean; desc: string;
  weight: number;                         // 뽑힐 가중치 (작을수록 드물다)
  stat?: Partial<Stats>;                  // 태어날 때 더한다
  mods?: Mods;                            // 전투 패시브
  mastery?: Partial<Record<BranchId | 'all' | 'haki', number>>;   // 숙련 속도 ×
  hakiAwaken?: number;                    // 패기 눈뜸 성공 확률 +
  illness?: number;                       // 병에 걸릴 확률 ×
  injury?: number;                        // 부상 기간 ×
  oldAge?: number;                        // 노환 확률 ×
  money?: number;                         // 시작 돈 (덮어쓴다)
  crewLevel?: number;                     // 영입하는 동료 레벨 +
  excludes?: string[];                    // 함께 붙을 수 없는 재능
}

export const TALENTS: Talent[] = [
  // ---------------- 좋은 재능
  { id: 'conqueror', name: '패왕색 잠재', good: true, weight: 1, desc: '왕의 자질. 패왕색을 깨우칠 수 있다' },
  { id: 'hakiTalent', name: '패기 재능', good: true, weight: 4, desc: '패기 눈뜸 확률 +25%, 패기 숙련 1.3배', hakiAwaken: 0.25, mastery: { haki: 1.3 } },
  { id: 'strong', name: '장사', good: true, weight: 8, desc: '힘 +4, 체술 숙련 1.15배', stat: { str: 4 }, mastery: { 'martial.fist': 1.15 }, excludes: ['weak'] },
  { id: 'swift', name: '날랜 몸', good: true, weight: 8, desc: '속도 +4', stat: { spd: 4 }, excludes: ['slow'] },
  { id: 'swordTalent', name: '검술 재능', good: true, weight: 6, desc: '검술 숙련 1.3배', mastery: { 'martial.sword': 1.3 } },
  { id: 'gunTalent', name: '사격 재능', good: true, weight: 6, desc: '사격 숙련 1.3배, 치명타 +3%', mastery: { 'martial.gun': 1.3 }, mods: { crit: 0.03 }, excludes: ['nearsighted'] },
  { id: 'fistTalent', name: '격투 재능', good: true, weight: 6, desc: '체술 숙련 1.3배', mastery: { 'martial.fist': 1.3 } },
  { id: 'genius', name: '수재', good: true, weight: 5, desc: '지능 +5, 모든 숙련 1.1배', stat: { int: 5 }, mastery: { all: 1.1 } },
  { id: 'tough', name: '강골', good: true, weight: 7, desc: '체력 +4, 부상 기간 −30%', stat: { vit: 4 }, injury: 0.7, excludes: ['sickly'] },
  { id: 'lucky', name: '행운아', good: true, weight: 6, desc: '운 +6', stat: { luk: 6 } },
  { id: 'ironStomach', name: '튼튼한 위장', good: true, weight: 6, desc: '병에 걸릴 확률 절반', illness: 0.5, excludes: ['sickly'] },
  { id: 'swimmer', name: '물개', good: true, weight: 5, desc: '바다 위 전투 피해 +10%', mods: { atSea: 0.1 }, excludes: ['seasick'] },
  { id: 'charisma', name: '타고난 인망', good: true, weight: 4, desc: '데려오는 동료 레벨 +2', crewLevel: 2 },
  { id: 'fastLearner', name: '습득이 빠름', good: true, weight: 4, desc: '모든 숙련 1.2배', mastery: { all: 1.2 }, excludes: ['clumsy'] },
  { id: 'longLife', name: '장수의 핏줄', good: true, weight: 4, desc: '노환 확률 절반', oldAge: 0.5, excludes: ['shortLife'] },
  // ---------------- 안 좋은 재능
  { id: 'sickly', name: '병약함', good: false, weight: 7, desc: '체력 −3, 병에 걸릴 확률 2배', stat: { vit: -3 }, illness: 2 },
  { id: 'deaf', name: '청각 장애', good: false, weight: 3, desc: '회피 −5%. 대신 기척에 예민해 견문색 숙련 1.3배', mods: { dodge: -0.05 }, mastery: { 'haki.observation': 1.3 } },
  { id: 'weak', name: '허약', good: false, weight: 6, desc: '힘 −3', stat: { str: -3 } },
  { id: 'slow', name: '굼뜸', good: false, weight: 6, desc: '속도 −3', stat: { spd: -3 } },
  { id: 'clumsy', name: '덤벙이', good: false, weight: 6, desc: '모든 숙련 0.9배, 회피 −3%', mastery: { all: 0.9 }, mods: { dodge: -0.03 } },
  { id: 'nearsighted', name: '근시', good: false, weight: 5, desc: '사격 숙련 0.7배, 치명타 −2%', mastery: { 'martial.gun': 0.7 }, mods: { crit: -0.02 } },
  { id: 'seasick', name: '뱃멀미', good: false, weight: 5, desc: '바다 위 전투 피해 −15%', mods: { atSea: -0.15 } },
  { id: 'shortLife', name: '단명의 핏줄', good: false, weight: 3, desc: '노환 확률 1.5배', oldAge: 1.5 },
  { id: 'poor', name: '가난한 집안', good: false, weight: 6, desc: '빈손으로 시작한다', money: 0 },
  { id: 'hemophobia', name: '피 공포증', good: false, weight: 3, desc: '체력이 떨어질수록 약해진다 (최대 피해 −25%)', mods: { lowHpPower: -0.25 } },
  { id: 'brittle', name: '약한 뼈', good: false, weight: 4, desc: '부상 기간 1.5배, 받는 피해 +5%', injury: 1.5, mods: { take: 1.05 }, excludes: ['tough'] },
];
export const TALENT_BY_ID = Object.fromEntries(TALENTS.map((t) => [t.id, t])) as Record<string, Talent>;
