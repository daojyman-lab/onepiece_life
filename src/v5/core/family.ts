// 출생 때의 가족: 부모 둘과 형제 몇. 가족은 싸우지 않는다 (crew가 없다). 고아는 가족이 없다.
import { FIRST_NAMES } from '../../data/births';
import { chance, int, pick, rngOf, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { RELATION_KIND } from '../data/words';
import { logLine } from './log';
import type { Life5, Person } from './types';

/** 형제의 관계 낱말. 손위는 주인공의 성별에 따라 부르는 말이 다르다 (아들에게 형 · 누나, 딸에게 오빠 · 언니) */
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

  const father = int(r, F.parentOlder[0], F.parentOlder[1]), mother = int(r, F.parentOlder[0], F.parentOlder[1]);
  add('아버지', 'm', s.age + father);
  add('어머니', 'f', s.age + mother);
  // 손위 형제는 젊은 쪽 부모가 parentAtBirth살일 때보다 먼저 태어날 수 없다
  const eldestGap = Math.min(F.siblingGap[1], Math.min(father, mother) - F.parentAtBirth);

  const counts = Array.from({ length: F.maxSiblings + 1 }, (_, i) => i);
  const n = weighted(r, counts, (i) => F.siblings[h.wealth][i] ?? 0) ?? 0;
  for (let i = 0; i < n; i++) {
    const gender = pick(r, ['m', 'f'] as const);
    const youngest = Math.min(F.siblingGap[1], s.age);   // 손아래로 둘 수 있는 가장 큰 차이
    const older = youngest < F.siblingGap[0] || chance(r, F.olderP);
    const gap = int(r, F.siblingGap[0], older ? eldestGap : youngest);
    add(siblingWord(h.gender, gender, older), gender, older ? s.age + gap : s.age - gap);
  }
}

const FAMILY_WORDS: readonly string[] = Object.values(RELATION_KIND).flat();

/**
 * 한 해가 지날 때: 늙은 가족(가족 관계 낱말의 사람. 원작 인물 · 함께 싸우는 동료는 빼고)이 노환으로 세상을 떠날 수 있다.
 * V.family.oldFrom살부터 해마다 확률이 오른다. 떠나면 무거운 기록 한 줄을 남긴다.
 */
export function familyYear(s: Life5): void {
  const F = V.family, r = rngOf(s.rng);
  for (const p of s.people) {
    if (!p.alive || p.canon || p.crew || !FAMILY_WORDS.includes(p.relation) || p.age < F.oldFrom) continue;
    if (!chance(r, Math.min(F.oldP.cap, F.oldP.start + F.oldP.perYear * (p.age - F.oldFrom)))) continue;
    p.alive = false;
    logLine(s, `${p.relation}이(가) 세상을 떠났다.`, 'heavy', 'life');
  }
}
