// 생애 단계 · 전성기 · 잠재력 · 노화 (통합 기획 4장 · 5장)
import { chance, pick, type Rng } from '../shared/core/rng';
import { V } from '../data/balance';
import { SEA_STANDINGS } from '../data/landlocked';
import { POTENTIAL_IDS, POTENTIALS, PRIME_NAME, STAGES } from '../data/stages';
import { logLine } from './log';
import type { Branch, Life5, PotentialId, StatKey } from './types';

/** 전성기 한가운데인가: 들어선 뒤 아직 끝나는 나이에 닿지 않았다 */
export function inPrime(s: Life5, age = s.age): boolean {
  return !!s.prime && age >= s.prime.from && age < s.prime.until;
}

/** 그 나이의 생애 단계 이름. 전성기면 '전성기' */
export function stageName(s: Life5, age = s.age): string {
  if (inPrime(s, age)) return PRIME_NAME;
  return STAGES.find((x) => age <= x.to)!.name;
}

/** 출생의 씨앗으로 정하는 잠재력. 주사위 흐름을 건드리지 않도록 rng를 쓰지 않는다 */
export function potentialOf(seed: number): PotentialId {
  const total = POTENTIAL_IDS.reduce((a, id) => a + POTENTIALS[id].weight, 0);
  let roll = (Math.imul(seed ^ 0x5bd1e995, 2654435761) >>> 0) % total;
  for (const id of POTENTIAL_IDS) { roll -= POTENTIALS[id].weight; if (roll < 0) return id; }
  return 'balanced';
}

/** 잠재력이 주는 수련 배율 (b: 수련하는 갈래, 없으면 맨몸) */
export function potentialMult(s: Life5, b: Branch | null): number {
  const p = POTENTIALS[s.hero.potential ?? 'balanced'];
  const m = p.mult.find((x) => s.age <= x.to)?.m ?? 1;
  return m * (p.special && b && b === s.growth.path ? p.special : 1);
}

/** 전성기에 들어선다 (전환점의 문이 'prime' 표시를 남길 때) */
export function enterPrime(s: Life5): void {
  if (s.prime) return;
  s.prime = { from: s.age, until: Math.min(s.age + V.prime.years, V.aging.from), lap: false };
  logLine(s, `${s.hero.name}의 전성기가 시작되었다. 같은 한 해가 전보다 길게 흐른다.`, 'heavy', 'life');
  s.timeline.push({ age: s.age, text: '전성기에 들어섰다' });
}

/** 해가 바뀐 뒤: 전성기가 저무는 해면 알린다 */
export function primeYear(s: Life5): void {
  if (s.prime && s.age === s.prime.until) {
    logLine(s, '가장 빛나던 시절이 조용히 저물었다. 쌓은 것은 남았지만, 시간은 다시 제 빠르기로 흐른다.', 'heavy', 'life');
    s.timeline.push({ age: s.age, text: '전성기가 저물었다' });
  }
}

/** 첫 출항의 해 한가운데인가: 처음 바다로 나선 그 나이. 전성기와 겹치면 전성기가 이미 느리게 흐르므로 더하지 않는다 */
export function inDebut(s: Life5, age = s.age): boolean {
  return !!s.debut && s.debut.age === age && !inPrime(s, age);
}

/**
 * 처음 바다로 나선다 (항구를 떠나거나 이야기가 먼 섬으로 데려갈 때). 바다를 다니는 처지로 V.voyage.minAge살이 넘어야 한다.
 * 그해는 토막을 한 바퀴 더 돈다: 원작의 이스트 블루 ~ 마린포드가 몰린 열여섯~열아홉 무렵을 더 촘촘히 겪는다
 */
export function beginDebut(s: Life5): void {
  if (s.debut !== null) return;                 // 이미 나섰거나(값) 옛 저장(undefined)
  if (s.age < V.voyage.minAge || !SEA_STANDINGS.includes(s.hero.standing)) return;
  s.debut = { age: s.age, lap: false };
  logLine(s, `${s.hero.name}은(는) 처음으로 바다에 나섰다. 보이는 것마다 낯설어서, 하루가 길다.`, 'heavy', 'life');
  s.timeline.push({ age: s.age, text: '처음 바다에 나섰다' });
}

const BODY: readonly StatKey[] = ['str', 'spd', 'vit'];
const AGING_LINES = [
  '아침마다 몸이 굳어 있다. 예전처럼 단숨에 일어나지 못한다.',
  '오래 걸으면 무릎이 먼저 쉬자고 한다.',
  '한 번 다친 곳이 날이 궂으면 다시 쑤신다.',
  '숨이 예전보다 빨리 찬다. 그래도 손에 익은 것은 그대로다.',
];

/** 노화: V.aging.from살부터 신체(근력 · 속도 · 체력)만 서서히 떨어진다. 잃은 부위와 남은 부상이 있으면 더 빨리 */
export function agingYear(s: Life5, r: Rng): void {
  const A = V.aging;
  if (s.age < A.from) return;
  if (s.age === A.from) logLine(s, `쉰을 넘기자 몸이 먼저 나이를 알아차렸다. 쌓은 솜씨와 감각은 그대로지만, 몸이 그만큼 따라 주지 않는다.`, 'heavy', 'life');
  const lost = Object.values(s.hero.limbs).filter((x) => x !== 'ok').length + s.hero.injuries.length;
  const p = Math.min(A.cap, A.start + A.perYear * (s.age - A.from) + A.wear * lost);
  for (let i = 0; i < A.rolls; i++) {
    if (!chance(r, p)) continue;
    const keys = BODY.filter((k) => s.hero.base[k] > V.birth.statFloor);
    if (!keys.length) return;
    s.hero.base[pick(r, keys)] -= 1;
  }
  if (chance(r, A.lineP)) logLine(s, pick(r, AGING_LINES), 'light', 'life');
}
