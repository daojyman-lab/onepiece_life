// 외딴 고향 섬에서 맞지 않는 글을 가려내는 낱말과 마을 (4단계 과제 2).
// 전환점은 turnings/index.ts의 landlocked가, 자잘한 일은 minors.ts의 끝에서 같은 규칙으로 막는다.
import { HOMETOWNS } from '../shared/data/births';
import type { Cond, Minor } from '../core/types';

/** 바다에 닿지 않는 고향 마을과 항해로 다시 도착했을 때의 섬 이름 */
export const INLAND_TOWNS = [
  ...HOMETOWNS.filter((t) => ['zou', 'sky', 'fishman', 'wano'].includes(t.home)).map((t) => t.name),
  '조우', '스카이피아', '어인섬',
];
/** 세계정부와 바다의 사건이 닿지 않는 장소: 위의 셋과 쇄국한 와노쿠니 */
export const ISOLATED_TOWNS = [...INLAND_TOWNS, '와노쿠니'];
/** 항구 · 배 · 헤엄 같은 바닷가의 글 */
export const COASTAL_WORDS = /부두|항구|어부|고깃배|바닷가|해변|갯벌|선창|선착장|등대|배를|배에|배가|배 한|돛|해적선|군함|헤엄|파도|모래사장|짐꾼|뱃사람|선원|바다에 뛰어|앞바다|어촌|포구|조선소|그물|방파제|방조제|해안|바닷물|썰물|밀물/;
/** 해군 · 현상금 · 세계정부의 글 */
export const WORLD_GOV_WORDS = /해군|지부|현상금|세계정부|수배/;
/** 바다에 나가야 되는 처지 */
export const SEA_STANDINGS = ['pirate', 'marine', 'revolution', 'bountyHunter', 'cp', 'warlord'];
/**
 * 자잘한 일도 전환점과 같이 막는다: 고향 · 마을 · 섬 조건이 없는 일이 바다 조건이 있거나 해군 · 현상금을 말하면 외딴 고향 섬에서,
 * 바닷가를 말하면 바다에 닿지 않는 고향 섬에서 일어나지 않는다. 같은 객체에 조건을 더한다.
 */
export function landlockedMinor(m: Minor): Minor {
  if (m.when.some((c) => c.c === 'home' || c.c === 'town' || c.c === 'island')) return m;
  const x = m.outcomes.flatMap((o) => o.text).join(' ');
  const add: Cond[] = [];
  if (m.when.some((c) => c.c === 'sea') || WORLD_GOV_WORDS.test(x)) add.push({ c: 'island', is: ISOLATED_TOWNS, not: true });
  else if (COASTAL_WORDS.test(x)) add.push({ c: 'island', is: INLAND_TOWNS, not: true });
  m.when.push(...add);
  return m;
}
