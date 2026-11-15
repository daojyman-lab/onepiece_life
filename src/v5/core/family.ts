// 출생 때의 가족: 부모 둘과 형제 몇. 가족은 싸우지 않는다 (crew가 없다). 고아는 가족이 없다.
import { FIRST_NAMES } from '../../data/births';
import { chance, int, pick, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import type { Life5, Person } from './types';

/** 형제의 관계 낱말: [손위, 손아래]. 손위는 주인공의 성별에 따라 부르는 말이 다르다 */
function siblingWord(heroGender: 'm' | 'f', gender: 'm' | 'f', older: boolean): string {
  if (!older) return gender === 'm' ? '남동생' : '여동생';
  if (gender === 'm') return heroGender === 'm' ? '형' : '오빠';
  return heroGender === 'm' ? '누나' : '언니';
}

/**
 * 출생 때 한 번. 부모와 형제를 s.people에 넣는다. 성은 주인공과 같고, 이름은 주인공 · 서로와 겹치지 않는다.
 * 손아래 형제는 이미 태어난 아이만 둔다 (지금 주인공 나이보다 더 어릴 수는 없다).
 */
export function rollFamily(s: Life5, r: Rng): void {
  const h = s.hero;
  if (h.lineage === 'orphan') return;
  const F = V.family;
  const used = new Set([h.name]);
  const add = (relation: string, gender: 'm' | 'f', age: number) => {
    const pool = FIRST_NAMES[gender].filter((x) => !used.has(x));
    const first = pick(r, pool.length ? pool : FIRST_NAMES[gender]);
    used.add(first);
    const p: Person = {
      id: `p${s.seq++}`, name: h.surname ? `${h.surname} ${first}` : first, gender, age,
      kind: 'family', relation, canon: null,
      bond: V.person.bond, faction: 'civil', species: h.species, alive: true,
    };
    s.people.push(p);
  };

  add('아버지', 'm', s.age + int(r, F.parentOlder[0], F.parentOlder[1]));
  add('어머니', 'f', s.age + int(r, F.parentOlder[0], F.parentOlder[1]));

  const counts = Array.from({ length: F.maxSiblings + 1 }, (_, i) => i);
  const n = weighted(r, counts, (i) => F.siblings[h.wealth][i] ?? 0) ?? 0;
  for (let i = 0; i < n; i++) {
    const gender = pick(r, ['m', 'f'] as const);
    const youngest = Math.min(F.siblingGap[1], s.age);   // 손아래로 둘 수 있는 가장 큰 차이
    const older = youngest < F.siblingGap[0] || chance(r, F.olderP);
    const gap = int(r, F.siblingGap[0], older ? F.siblingGap[1] : youngest);
    add(siblingWord(h.gender, gender, older), gender, older ? s.age + gap : s.age - gap);
  }
}
