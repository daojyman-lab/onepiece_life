// 부모와 손위 형제는 처음부터, 손아래 형제는 유년기에 태어난다. 고아에게는 따로 보호자가 있을 수 있다.
import { homeFirstNames } from './names';
import { chance, int, pick, rngOf, weighted, type Rng } from '../shared/core/rng';
import { V } from '../data/balance';
import { NEWBORN_SIBLING, SIBLING_BIRTH_ID } from '../data/turnings/sibling-birth';
import { RELATION_KIND } from '../data/words';
import { clamp } from '../shared/core/util';
import { logLine, logSentences } from './log';
import type { Life5, Lineage, Person, SiblingWelcomeAction } from './types';

/** 형제의 관계 낱말. 손위는 주인공의 성별에 따라 부르는 말이 다르다 (아들에게 형 · 누나, 딸에게 오빠 · 언니) */
function siblingWord(heroGender: 'm' | 'f', gender: 'm' | 'f', older: boolean): string {
  if (!older) return gender === 'm' ? '남동생' : '여동생';
  if (gender === 'm') return heroGender === 'm' ? '형' : '오빠';
  return heroGender === 'm' ? '누나' : '언니';
}

function addFamilyMember(s: Life5, name: string, relation: string, gender: Person['gender'], age: number): Person {
  const person: Person = {
    id: `p${s.seq++}`, name, gender, age, kind: 'family', relation, canon: null,
    bond: V.person.bond, faction: 'civil', species: s.hero.species, alive: true,
  };
  s.people.push(person);
  return person;
}

function familyName(s: Life5, first: string): string {
  return s.hero.surname ? `${s.hero.surname} ${first}` : first;
}

/** 시작 가족과 미래의 동생을 한 번 뽑는다. 동생은 태어날 때 인물 목록에 들어간다. */
export function rollFamily(s: Life5, r: Rng): void {
  const h = s.hero;
  if (h.lineage === 'orphan') { orphanFate(s); return; }
  const F = V.family;
  const used = new Set([h.name]);
  const chooseName = (gender: Person['gender']): string => {
    const all = homeFirstNames(h.home, gender);
    const pool = all.filter((x) => !used.has(x));
    const first = pick(r, pool.length ? pool : all);
    used.add(first);
    return familyName(s, first);
  };

  const father = int(r, F.parentOlder[0], F.parentOlder[1]), mother = int(r, F.parentOlder[0], F.parentOlder[1]);
  addFamilyMember(s, chooseName('m'), '아버지', 'm', s.age + father);
  addFamilyMember(s, chooseName('f'), '어머니', 'f', s.age + mother);
  // 손위 형제는 젊은 쪽 부모가 parentAtBirth살일 때보다 먼저 태어날 수 없다
  const eldestGap = Math.min(F.siblingGap[1], Math.min(father, mother) - F.parentAtBirth);

  const counts = Array.from({ length: F.maxSiblings + 1 }, (_, i) => i);
  const n = weighted(r, counts, (i) => F.siblings[h.wealth][i] ?? 0) ?? 0;
  const firstBirthAge = Math.max(s.age + 1, F.siblingGap[0]);
  const birthAges = Array.from({ length: Math.max(0, F.siblingGap[1] - firstBirthAge + 1) }, (_, i) => firstBirthAge + i);
  for (let i = 0; i < n; i++) {
    const gender = pick(r, ['m', 'f'] as const);
    const older = birthAges.length === 0 || chance(r, F.olderP);
    if (older) {
      const gap = int(r, F.siblingGap[0], eldestGap);
      addFamilyMember(s, chooseName(gender), siblingWord(h.gender, gender, true), gender, s.age + gap);
    } else {
      const [age] = birthAges.splice(int(r, 0, birthAges.length - 1), 1);
      (s.siblingBirths ??= []).push({ age, name: chooseName(gender), gender });
    }
  }
}

const FAMILY_BACKGROUND: Partial<Record<Lineage, string>> = {
  marineFamily: ' 집안은 해군과 인연이 깊었다.',
  pirateChild: ' 부모 중 한 사람은 해적이었다.',
  samurai: ' 무사의 집안이었다.',
  outcast: ' 집안은 핏줄을 이유로 차별을 받곤 했다.',
};

/** 첫 선택 전에 주인공이 알고 있는 가족을 소개한다. */
export function introduceFamily(s: Life5): void {
  if (s.hero.lineage === 'orphan') {
    const guardian = s.people.find((p) => p.relation === '할머니' || p.relation === '할아버지');
    const text = guardian
      ? `${guardian.relation} ${guardian.name}이(가) 어린아이를 거두어 길렀다.`
      : s.flags.includes('lonely') ? '기댈 가족 없이 마을 한구석에서 자랐다.'
      : '부모가 누구인지 알 길은 없었다. 마을에서 어린 시절을 보냈다.';
    logSentences(s, text, 'heavy', 'world');
    return;
  }

  const parents = s.people.filter((p) => RELATION_KIND.parent.includes(p.relation)).map((p) => `${p.relation} ${p.name}`);
  const [father, mother] = parents;
  logSentences(s, `${father}와(과) ${mother}의 손에서 자랐다.${FAMILY_BACKGROUND[s.hero.lineage] ?? ''}`, 'heavy', 'world');
  const older = s.people.filter((p) => RELATION_KIND.sibling.includes(p.relation)).sort((a, b) => b.age - a.age)
    .map((p) => `${p.age}살 ${p.relation} ${p.name}`);
  if (older.length) logLine(s, `집에는 먼저 태어난 ${older.join(', ')}이(가) 있었다.`, 'heavy', 'world');
}

export function atFamilyHome(s: Life5): boolean {
  return s.hero.island === s.hero.town && !s.passage && s.hero.standing === 'child' && !s.flags.includes('left_home_young');
}

function siblingBirthYear(s: Life5): void {
  const births = s.siblingBirths;
  if (!births) return;
  const birth = births.find((b) => b.age === s.age);
  const future = births.filter((b) => b.age > s.age);
  if (future.length) s.siblingBirths = future;
  else delete s.siblingBirths;
  if (!birth || !s.people.some((p) => p.kind === 'family' && p.relation === '어머니' && p.alive)) return;

  const relation = siblingWord(s.hero.gender, birth.gender, false);
  const baby = addFamilyMember(s, birth.name, relation, birth.gender, 0);
  baby.aliases = [NEWBORN_SIBLING];
  s.queue.unshift(SIBLING_BIRTH_ID);
  const news = `${relation}이 태어났다.`;
  const text = atFamilyHome(s) ? `방 안에서 아기 울음이 들렸다. ${news}` : `고향에서 소식이 왔다. ${news}`;
  logLine(s, text, 'heavy', 'life');
  s.timeline.push({ age: s.age, text: news });
}

export function welcomeSibling(s: Life5, action: SiblingWelcomeAction): void {
  const baby = s.people.find((p) => p.alive && p.kind === 'family' && p.aliases?.includes(NEWBORN_SIBLING));
  if (!baby) return;
  baby.aliases = baby.aliases?.filter((alias) => alias !== NEWBORN_SIBLING);
  baby.bond = clamp(baby.bond + (action === 'hold' ? 8 : 5), 0, V.person.bondMax);

  if (action === 'name') {
    const reserved = s.siblingBirths?.map((b) => b.name) ?? [];
    const used = new Set([familyName(s, s.hero.name), ...s.people.map((p) => p.name), ...reserved]);
    const candidates = homeFirstNames(s.hero.home, baby.gender).map((first) => familyName(s, first)).filter((name) => !used.has(name));
    if (candidates.length) baby.name = pick(rngOf(s.rng), candidates);
  }

  const text = {
    hold: `어머니가 아기의 목을 받치는 법을 가르쳐 줬다. 품에 안긴 동생이 손가락을 꼭 쥐었다. 어머니는 아기를 ${baby.name}(이)라고 불렀다.`,
    name: atFamilyHome(s) ? `어머니와 떠오르는 이름을 하나씩 불러 봤다. 둘은 ${baby.name}(이)라는 이름을 골라 아기에게 들려줬다.`
      : `편지에 떠오른 이름을 적었다. 고향에서 동생을 ${baby.name}(이)라고 부르기로 했다는 답장이 왔다.`,
    letter: `이름을 듣고 편지에 ${baby.name}(이)라고 적었다. 동생이 글을 읽을 수 있을 때 건네 달라고 부탁했다.`,
  }[action];
  logLine(s, text, 'heavy', 'choice');
}

const FAMILY_WORDS: readonly string[] = Object.values(RELATION_KIND).flat();

export function markPersonDead(s: Life5, p: Person): void {
  p.alive = false;
  if (RELATION_KIND.spouse.includes(p.relation)) s.flags = s.flags.filter(f => f !== 'married');
}

export function separateSpouse(s: Life5): void {
  const spouse = s.people.find(p => p.alive && RELATION_KIND.spouse.includes(p.relation));
  if (!spouse) return;
  if (s.rivalLove?.personId === spouse.id) {
    spouse.relation = '어릴 적 맞수';
    s.rivalLove = { personId: spouse.id, status: 'friends', since: s.age };
  } else {
    spouse.relation = '헤어진 배우자';
    if (spouse.kind === 'family') spouse.kind = 'ally';
  }
  s.flags = s.flags.filter(f => f !== 'married');
  s.hardship += V.hardship.loss;
}

/**
 * 한 해가 지날 때: 동생이 태어나고, 늙은 가족(원작 인물 · 함께 싸우는 동료 제외)은 노환으로 세상을 떠날 수 있다.
 * V.family.oldFrom살부터 해마다 확률이 오른다. 떠나면 무거운 기록 한 줄을 남긴다.
 */
export function familyYear(s: Life5): void {
  siblingBirthYear(s);
  const F = V.family, r = rngOf(s.rng);
  for (const p of s.people) {
    if (!p.alive || p.canon || p.crew || !FAMILY_WORDS.includes(p.relation) || p.age < F.oldFrom) continue;
    if (!chance(r, Math.min(F.oldP.cap, F.oldP.start + F.oldP.perYear * (p.age - F.oldFrom)))) continue;
    markPersonDead(s, p);
    const lateReunion = s.hero.lineage === 'orphan' && p.aliases?.includes('다시 만난 부모');
    const grief = lateReunion
      ? `늦게 만난 ${p.relation}와(과) 나누지 못한 세월이 떠올라 마음이 먹먹했다.`
      : '함께한 날들이 떠올라 한동안 마음이 먹먹했다.';
    const who = p.siblingLife ? `${p.relation} ${p.name}` : p.relation;
    const card = p.siblingLife?.vivreCard ? ' 지니고 있던 비블카드 조각도 재가 되어 흩어졌다.' : '';
    logLine(s, `${who}이(가) 세상을 떠났다. ${grief}${card}`, 'heavy', 'life');
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
  if (p) {
    p.alive = true; p.missing = false; p.bond = Math.max(p.bond, V.person.bond);
    p.aliases = [...new Set([...(p.aliases ?? []), '다시 만난 부모'])];
  }
  else {
    const gender = pick(r, ['m', 'f'] as const);
    s.people.push({
      id: `p${s.seq++}`, name: pick(r, homeFirstNames(s.hero.home, gender)), gender, age: s.age + int(r, 22, 34),
      aliases: ['다시 만난 부모'],
      kind: 'family', relation: gender === 'm' ? '아버지' : '어머니', canon: null, bond: V.person.bond, faction: 'civil', species: s.hero.species, alive: true,
    });
  }
  if (!s.flags.includes('parentFound')) s.flags.push('parentFound');
}
