import { COMBAT_STYLES, COMBAT_STYLE_BY_ID, DEFAULT_STYLE, isCombatStyle, MARTIAL_BRANCHES, STYLE_BRANCH_ID, type CombatStyle, type MartialBranch } from '../data/combat-styles';
import { ITEM_BY_ID } from '../shared/data/items';
import { STYLE_ORIGIN_BY_ID } from '../data/style-origins';
import { V } from '../data/balance';
import { logLine } from './log';
import { josa } from '../shared/core/josa';
import type { Activity, Branch, Life5 } from './types';

export const isMartialBranch = (b: Branch): b is MartialBranch => MARTIAL_BRANCHES.includes(b as MartialBranch);
export function focusedStyle(s: Life5, b: MartialBranch): CombatStyle {
  const id = s.growth.styleFocus[b];
  return isCombatStyle(id) && COMBAT_STYLE_BY_ID[id].branch === b ? id : DEFAULT_STYLE[b];
}
export function styleTier(s: Life5, id: CombatStyle): number {
  return Math.min(V.growth.maxTier, s.growth.tier[COMBAT_STYLE_BY_ID[id].branch], Math.floor((s.growth.styleMastery[id] ?? 0) / V.growth.tierUp));
}
export function aggregateStyleMastery(s: Life5, group: 'martial' | 'weapon'): number {
  return COMBAT_STYLES.filter((x) => x.group === group).reduce((sum, x) => sum + (s.growth.styleMastery[x.id] ?? 0), 0);
}
export function addStyleMastery(s: Life5, b: Branch, amount: number, cap: number): void {
  if (!isMartialBranch(b) || amount <= 0) return;
  const id = focusedStyle(s, b);
  const before = s.growth.styleMastery[id] ?? 0;
  s.growth.styleMastery[id] = Math.max(before, Math.min(cap * V.growth.tierUp, before + amount));
}
export function primaryStyle(s: Life5): CombatStyle | null {
  return isCombatStyle(s.growth.primaryStyle) ? s.growth.primaryStyle : null;
}
export function styleName(s: Life5, b: Branch): string | null {
  return isMartialBranch(b) ? COMBAT_STYLE_BY_ID[focusedStyle(s, b)].name : null;
}
export function hasStyle(s: Life5, id: CombatStyle): boolean {
  return styleTier(s, id) >= 1 && (s.growth.styleBonds[id]?.adopted === true || (s.growth.styleMastery[id] ?? 0) > 0);
}
export function selectStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || !hasStyle(s, id)) return;
  const def = COMBAT_STYLE_BY_ID[id];
  if (!styleUsable(s, id)) return;
  const changed = s.growth.primaryStyle !== id;
  rememberWeapon(s);
  s.growth.styleFocus[def.branch] = id;
  s.growth.primaryStyle = id;
  s.growth.pref[def.branch] = Math.max(...Object.values(s.growth.pref)) + (changed ? V.growth.pref.masterLead : 0);
  s.growth.path = def.branch;
  if (s.growth.styleWeapons[id]) s.hero.weapon = s.growth.styleWeapons[id];
  else delete s.hero.weapon;
  if (!changed) return;
  logLine(s, `${def.group === 'weapon' ? '무기술' : '체술'}의 ${def.name}을(를) 주력으로 삼았다.`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: josa(`${def.name}을(를) 주력으로 삼았다`) });
}
/** 구입·전향 전에 지금 가진 무기의 실제 갈래와 유파에 소유를 기록한다. */
export function rememberWeapon(s: Life5): void {
  const item = s.hero.weapon ? ITEM_BY_ID[s.hero.weapon] : undefined;
  const branch = MARTIAL_BRANCHES.find((b) => STYLE_BRANCH_ID[b] === item?.branch);
  if (item && branch) s.growth.styleWeapons[focusedStyle(s, branch)] = item.id;
}
export function styleUsable(s: Life5, id: CombatStyle): boolean {
  const def = COMBAT_STYLE_BY_ID[id];
  if (id === 'kicking') return [s.hero.limbs.legL, s.hero.limbs.legR].some((x) => x !== 'lost');
  const arms = [s.hero.limbs.armL, s.hero.limbs.armR].filter((x) => x !== 'lost').length;
  return arms >= def.hands;
}
export function beginStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || s.growth.styleBonds[id] || !styleUsable(s, id)) return;
  const o = STYLE_ORIGIN_BY_ID[id];
  const teacher = {
    id: `p${s.seq++}`, name: o.teacher, gender: 'm' as const, age: Math.max(30, s.age + 18),
    kind: 'master' as const, relation: `${COMBAT_STYLE_BY_ID[id].name}의 인연`, canon: null,
    bond: 40, faction: 'civil' as const, species: id === 'fishmanKarate' ? 'fishman' as const : 'human' as const, alive: true,
  };
  s.people.push(teacher);
  s.growth.styleBonds[id] = { teacherId: teacher.id, island: s.hero.island, since: s.age, practice: 0, adopted: false, refined: false };
  logLine(s, `${o.teacher}와(과) 약속을 맺었다. ${o.practice}`, 'heavy', 'growth');
}
export function practiceStyles(s: Life5, activity: Activity): void {
  if (!['train', 'work', 'roam'].includes(activity) || s.hero.illness || s.hero.injuries.some((i) => i.severity === 'heavy') || s.hero.standing === 'prisoner') return;
  for (const [id, bond] of Object.entries(s.growth.styleBonds)) {
    if (bond.adopted || bond.practice >= 3 || bond.island !== s.hero.island || !isCombatStyle(id) || !styleUsable(s, id) || !s.people.some((p) => p.id === bond.teacherId && p.alive)) continue;
    bond.practice = Math.min(3, bond.practice + 1);
    if (bond.practice === 3 && !s.flags.includes(`style:ready:${id}`)) {
      s.flags.push(`style:ready:${id}`);
      if (!s.queue.includes(`style_adopt_${id}`)) s.queue.push(`style_adopt_${id}`);
      logLine(s, `${COMBAT_STYLE_BY_ID[id].name}의 기초 연습을 마쳤다. ${STYLE_ORIGIN_BY_ID[id].teacher}에게 돌아갈 준비가 되었다.`, 'heavy', 'growth');
    }
    break; // 한 토막에 한 인연의 연습을 한다. 여러 유파를 동시에 공짜로 완성하지 않는다.
  }
}
export function styleBondReady(s: Life5, id: CombatStyle, phase: 'ready' | 'refine'): boolean {
  const bond = s.growth.styleBonds[id];
  if (!bond || bond.island !== s.hero.island || !s.people.some((p) => p.id === bond.teacherId && p.alive) || !styleUsable(s, id)) return false;
  return phase === 'ready' ? !bond.adopted && bond.practice >= 3
    : bond.adopted && !bond.refined && styleTier(s, id) >= 3 && (s.hardship >= 40 || s.stats.wins >= 5);
}
export function hasLocalStyleLesson(s: Life5): boolean {
  return Object.entries(s.growth.styleBonds).some(([id, b]) => isCombatStyle(id) && styleUsable(s, id) && !b.adopted && b.practice < 3 && b.island === s.hero.island &&
    s.people.some((p) => p.id === b.teacherId && p.alive));
}
export function adoptStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || !styleBondReady(s, id, 'ready')) return;
  const def = COMBAT_STYLE_BY_ID[id], bond = s.growth.styleBonds[id]!;
  bond.adopted = true;
  if (def.weapon) s.growth.styleWeapons[id] = `style_${id}`;
  s.growth.styleMastery[id] = Math.max(V.growth.tierUp, s.growth.styleMastery[id] ?? 0);
  s.growth.tier[def.branch] = Math.max(1, s.growth.tier[def.branch]);
  logLine(s, STYLE_ORIGIN_BY_ID[id].accept, 'heavy', 'growth');
  selectStyle(s, id);
}
export function refineStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || !styleBondReady(s, id, 'refine')) return;
  const bond = s.growth.styleBonds[id]!;
  bond.refined = true;
  // 재회의 가르침은 그 유파에만 더한다. 현재의 다른 주력에 흘리지 않는다.
  s.growth.styleMastery[id] = Math.min(600, (s.growth.styleMastery[id] ?? 0) + 20);
  logLine(s, STYLE_ORIGIN_BY_ID[id].follow, 'heavy', 'growth');
  logLine(s, `${COMBAT_STYLE_BY_ID[id].name}의 고급 수련을 배웠다. 이제 극의까지 자신의 힘으로 갈고닦을 수 있다.`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: josa(`${STYLE_ORIGIN_BY_ID[id].teacher}와(과) 다시 ${COMBAT_STYLE_BY_ID[id].name}을(를) 갈고닦았다`) });
}

/** 저장 변환은 멱등이다. 검의 경지를 새 창에 복제하지 않는다. */
export function normalizeStyles(s: Life5, legacy: boolean): void {
  const g = s.growth;
  for (const b of MARTIAL_BRANCHES) {
    g.tier[b] ??= 0; g.mastery[b] ??= 0; g.pref[b] ??= 0;
  }
  if (!g.styleMastery || typeof g.styleMastery !== 'object' || Array.isArray(g.styleMastery)) g.styleMastery = {};
  if (!g.styleFocus || typeof g.styleFocus !== 'object' || Array.isArray(g.styleFocus)) g.styleFocus = {};
  if (!g.styleBonds || typeof g.styleBonds !== 'object' || Array.isArray(g.styleBonds)) g.styleBonds = {};
  if (!g.styleWeapons || typeof g.styleWeapons !== 'object' || Array.isArray(g.styleWeapons)) g.styleWeapons = {};
  for (const [id, bond] of Object.entries(g.styleBonds)) {
    if (!isCombatStyle(id) || !bond || typeof bond !== 'object' || typeof bond.teacherId !== 'string' ||
      typeof bond.island !== 'string' || !Number.isFinite(bond.practice) || typeof bond.adopted !== 'boolean' || typeof bond.refined !== 'boolean') {
      delete (g.styleBonds as Record<string, unknown>)[id];
    } else bond.practice = Math.min(3, Math.max(0, bond.practice));
  }
  for (const [id, item] of Object.entries(g.styleWeapons)) {
    if (!isCombatStyle(id) || !ITEM_BY_ID[item] || ITEM_BY_ID[item].branch !== STYLE_BRANCH_ID[COMBAT_STYLE_BY_ID[id].branch]) delete (g.styleWeapons as Record<string, unknown>)[id];
  }
  for (const x of COMBAT_STYLES) {
    const n = g.styleMastery[x.id];
    g.styleMastery[x.id] = typeof n === 'number' && Number.isFinite(n) ? Math.min(600, Math.max(0, n)) : 0;
  }
  if (legacy) for (const b of MARTIAL_BRANCHES) {
    const id = DEFAULT_STYLE[b];
    g.styleMastery[id] = Math.min(600, (g.tier[b] ?? 0) * 100 + (g.mastery[b] ?? 0));
  }
  for (const b of MARTIAL_BRANCHES) g.styleFocus[b] = focusedStyle(s, b);
  if (!isCombatStyle(g.primaryStyle)) g.primaryStyle = null;
  if (legacy && s.hero.weapon === 'sp2') {
    g.styleMastery.spear = Math.max(100, g.styleMastery.spear ?? 0);
    g.tier.polearm = Math.max(1, g.tier.polearm); g.primaryStyle = 'spear'; g.path = 'polearm';
  }
  if (legacy && s.hero.weapon === 'sw_ss') {
    g.styleMastery.club = Math.max(100, g.styleMastery.club ?? 0);
    g.tier.blunt = Math.max(1, g.tier.blunt); g.primaryStyle = 'club'; g.path = 'blunt';
  }
  if (s.hero.weapon) {
    const held = ITEM_BY_ID[s.hero.weapon];
    const branch = MARTIAL_BRANCHES.find((b) => STYLE_BRANCH_ID[b] === held?.branch);
    if (branch) {
      const id = primaryStyle(s) ?? focusedStyle(s, branch);
      if (COMBAT_STYLE_BY_ID[id].branch === branch) g.styleWeapons[id] = s.hero.weapon;
    }
  }
}
