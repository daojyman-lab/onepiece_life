// 출생 때의 가족: 부모 둘과 형제 몇. 가족은 싸우지 않는다 (crew가 없다). 고아는 가족이 없다.
import { homeFirstNames } from './names';
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
  if (h.lineage === 'orphan') { orphanFate(s); return; }
  const F = V.family;
  const used = new Set([h.name]);
  const add = (relation: string, gender: 'm' | 'f', age: number) => {
    const all = homeFirstNames(h.home, gender);
    const pool = all.filter((x) => !used.has(x));
    const first = pick(r, pool.length ? pool : all);
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
    const lateReunion = s.hero.lineage === 'orphan' && s.flags.includes('parentFound') && ['아버지', '어머니'].includes(p.relation);
    const grief = lateReunion
      ? `늦게 만난 ${p.relation}와(과) 나누지 못한 세월이 떠올라 마음이 먹먹했다.`
      : '함께한 날들이 떠올라 한동안 마음이 먹먹했다.';
    logLine(s, `${p.relation}이(가) 세상을 떠났다. ${grief}`, 'heavy', 'life');
  }
}

/**
 * 고아의 사정 (통합 기획 6.2). 같은 씨앗이면 같은 사정이 되도록 주사위 대신 씨앗을 쓴다.
 *  - 조부모 손에 자람: 할머니나 할아버지가 보호자다 (가족이 아니라 곁의 사람으로 둔다). 스승 대신 조부모의 이야기가 온다
 *  - 부모가 행방불명: 부모는 바다로 나가 돌아오지 않았다. 훗날 바다에서 다시 만날 수 있다
 *  - 아무 인연 없이 자람: 드물다. 기댈 사람 하나 없이 자라 일찍 끝난다 (다음 인생을 부른다)
 */
function orphanFate(s: Life5): void {
  const O = V.family.orphan, h = s.hero;
  const roll = (Math.imul(s.rng.seed ^ 0x2c1b3c6d, 2246822519) >>> 0) % 100;
  if (roll < O.grand) {
    const female = roll % 2 === 0;
    const [lo, hi] = V.family.grandOlder;
    s.people.push({
      id: `p${s.seq++}`, name: pickName(s, female ? 'f' : 'm'), gender: female ? 'f' : 'm', age: s.age + lo + (roll % (hi - lo + 1)),
      kind: 'ally', relation: female ? '할머니' : '할아버지', canon: null, bond: V.person.bond + 20, faction: 'civil', species: h.species, alive: true,
    });
    s.flags.push('grandGuard');
    if (roll % 3 === 0) s.flags.push('parentsLost');           // 조부모가 감춘 부모의 행방
  } else if (roll < O.grand + O.lost) s.flags.push('parentsLost');
  else if (roll >= 100 - O.lonely) s.flags.push('lonely');
}

function pickName(s: Life5, gender: 'm' | 'f'): string {
  const all = homeFirstNames(s.hero.home, gender);
  return all[(s.rng.seed >>> 3) % all.length];
}

/** 살아 있는 부모 하나(아버지가 먼저)가 행방불명이 된다 */
export function parentMissing(s: Life5): void {
  const p = s.people.find((x) => x.alive && x.relation === '아버지') ?? s.people.find((x) => x.alive && x.relation === '어머니');
  if (!p) return;
  p.alive = false; p.missing = true;
  if (!s.flags.includes('parentsLost')) s.flags.push('parentsLost');
  s.hardship += V.hardship.loss;
}

/** 행방불명된 부모를 다시 만난다. 기록에 없던 부모(고아)라면 처음 만나는 부모로 들인다 */
export function parentFound(s: Life5): void {
  const r = rngOf(s.rng);
  const p = s.people.find((x) => x.missing);
  if (p) { p.alive = true; p.missing = false; p.bond = Math.max(p.bond, V.person.bond); }
  else {
    const gender = pick(r, ['m', 'f'] as const);
    s.people.push({
      id: `p${s.seq++}`, name: pick(r, homeFirstNames(s.hero.home, gender)), gender, age: s.age + int(r, 22, 34),
      kind: 'family', relation: gender === 'm' ? '아버지' : '어머니', canon: null, bond: V.person.bond, faction: 'civil', species: s.hero.species, alive: true,
    });
  }
  if (!s.flags.includes('parentFound')) s.flags.push('parentFound');
}
