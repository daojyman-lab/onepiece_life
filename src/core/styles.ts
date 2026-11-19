import { COMBAT_STYLES, COMBAT_STYLE_BY_ID, DEFAULT_STYLE, isCombatStyle, MARTIAL_BRANCHES, type CombatStyle, type MartialBranch } from '../data/combat-styles';
import { ITEM_BY_ID } from '../shared/data/items';
import { STYLE_ORIGIN_BY_ID } from '../data/style-origins';
import { V } from '../data/balance';
import { logLine } from './log';
import { josa } from '../shared/core/josa';
import type { Activity, Branch, Life5, Person } from './types';
import type { Item } from '../shared/core/types';

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

function weaponItem(id: string | undefined): Item | undefined {
  const item = id && ITEM_BY_ID[id];
  return item && item.kind === 'weapon' && item.weaponStyles?.length ? item : undefined;
}
export function weaponStyleFor(item: Item): CombatStyle {
  return item.weaponStyles?.[0] ?? 'boxing';
}
export function ownedWeapons(s: Life5): Item[] {
  return s.growth.weapons.map(id => weaponItem(id)).filter((item): item is Item => !!item);
}
export function hasWeapon(s: Life5, id: string): boolean {
  return s.growth.weapons.includes(id) || s.hero.weapon === id;
}
export function canEquipWeapon(s: Life5, id: string): boolean {
  const item = weaponItem(id);
  if (!item || !hasWeapon(s, id)) return false;
  const style = primaryStyle(s);
  return style ? item.weaponStyles!.includes(style) && styleUsable(s, style) : item.weaponStyles!.some(x => styleUsable(s, x));
}
export function equippedWeapon(s: Life5): Item | undefined {
  return s.hero.weapon && canEquipWeapon(s, s.hero.weapon) ? weaponItem(s.hero.weapon) : undefined;
}
function equip(s: Life5, item: Item): void {
  const active = primaryStyle(s);
  s.hero.weapon = item.id;
  s.growth.styleWeapons[active ?? weaponStyleFor(item)] = item.id;
}
export function equipWeapon(s: Life5, id: string): void {
  if (!canEquipWeapon(s, id) || s.hero.weapon === id) return;
  const item = ITEM_BY_ID[id];
  equip(s, item);
  logLine(s, `${item.name}을(를) 주무기로 골랐다.`, 'light', 'growth');
}
/** 같은 유파의 무기도 각각 보관한다. 새 물건을 얻는 것만으로 유파가 바뀌지는 않는다. */
export function receiveWeapon(s: Life5, id: string, mode: 'gift' | 'purchase' | 'stow' = 'gift'): void {
  const item = weaponItem(id);
  if (!item || hasWeapon(s, id)) return;
  s.growth.weapons.push(id);
  const wear = mode !== 'stow' && canEquipWeapon(s, id) && (mode === 'purchase' || !s.hero.weapon);
  if (wear) equip(s, item);
  const action = mode === 'purchase' ? '샀다' : '받았다';
  logLine(s, `${item.name}을(를) ${action}.${wear ? ' 주무기로 들었다.' : ''}`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: josa(`${s.hero.island}에서 ${item.name}을(를) ${action}`) });
}
export function giveAwayWeapon(s: Life5, id: string): void {
  s.growth.weapons = s.growth.weapons.filter(x => x !== id);
  for (const style of COMBAT_STYLES) if (s.growth.styleWeapons[style.id] === id) delete s.growth.styleWeapons[style.id];
  if (s.hero.weapon === id) delete s.hero.weapon;
}

export function selectStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || !hasStyle(s, id)) return;
  const def = COMBAT_STYLE_BY_ID[id];
  if (!styleUsable(s, id)) return;
  const changed = s.growth.primaryStyle !== id;
  s.growth.styleFocus[def.branch] = id;
  s.growth.primaryStyle = id;
  s.growth.pref[def.branch] = Math.max(...Object.values(s.growth.pref)) + (changed ? V.growth.pref.masterLead : 0);
  s.growth.path = def.branch;
  const remembered = weaponItem(s.growth.styleWeapons[id]);
  const item = remembered && canEquipWeapon(s, remembered.id) ? remembered
    : ownedWeapons(s).filter(x => canEquipWeapon(s, x.id)).sort((a, b) => (b.mult ?? 1) - (a.mult ?? 1))[0];
  if (item) equip(s, item);
  else delete s.hero.weapon;
  if (!changed) return;
  logLine(s, `${def.group === 'weapon' ? '무기술' : '체술'}의 ${def.name}을(를) 주력으로 삼았다.`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: josa(`${def.name}을(를) 주력으로 삼았다`) });
}
export function styleUsable(s: Life5, id: CombatStyle): boolean {
  const def = COMBAT_STYLE_BY_ID[id];
  if (id === 'kicking') return [s.hero.limbs.legL, s.hero.limbs.legR].some((x) => x !== 'lost');
  const arms = [s.hero.limbs.armL, s.hero.limbs.armR].filter((x) => x !== 'lost').length;
  return arms >= def.hands;
}
export function beginStyle(s: Life5, id: CombatStyle, contact?: Person): void {
  if (s.passage || !isCombatStyle(id) || s.growth.styleBonds[id] || !styleUsable(s, id)) return;
  const o = STYLE_ORIGIN_BY_ID[id];
  const relation = `${COMBAT_STYLE_BY_ID[id].name}의 인연`;
  const teacher = contact ?? {
    id: `p${s.seq++}`, name: o.teacher, gender: 'm' as const, age: Math.max(30, s.age + 18),
    kind: 'master' as const, relation, canon: null,
    bond: 40, faction: 'civil' as const, species: id === 'fishmanKarate' ? 'fishman' as const : 'human' as const, alive: true,
  };
  if (contact) contact.aliases = [...new Set([...(contact.aliases ?? []), relation])];
  else s.people.push(teacher);
  s.growth.styleBonds[id] = { teacherId: teacher.id, island: s.hero.island, since: s.age, practice: 0, adopted: false, refined: false };
  const practice = teacher.name === (o.mentor?.name ?? o.teacher) ? o.practice : `${s.hero.island}에서 다시 만나 ${COMBAT_STYLE_BY_ID[id].name}의 기초를 배우기로 했다.`;
  logLine(s, `${teacher.name}와(과) 약속을 맺었다. ${practice}`, 'heavy', 'growth');
}
export function practiceStyles(s: Life5, activity: Activity): void {
  if (s.passage || !['train', 'work', 'roam'].includes(activity) || s.hero.illness || s.hero.injuries.some((i) => i.severity === 'heavy') || s.hero.standing === 'prisoner') return;
  for (const [id, bond] of Object.entries(s.growth.styleBonds)) {
    if (bond.adopted || bond.practice >= 3 || bond.island !== s.hero.island || !isCombatStyle(id) || !styleUsable(s, id) || !s.people.some((p) => p.id === bond.teacherId && p.alive)) continue;
    bond.practice = Math.min(3, bond.practice + 1);
    if (bond.practice === 3 && !s.flags.includes(`style:ready:${id}`)) {
      s.flags.push(`style:ready:${id}`);
      if (!s.queue.includes(`style_adopt_${id}`)) s.queue.push(`style_adopt_${id}`);
      const teacher = s.people.find(p => p.id === bond.teacherId)!;
      logLine(s, `${COMBAT_STYLE_BY_ID[id].name}의 기초 연습을 마쳤다. ${teacher.name}에게 돌아갈 준비가 되었다.`, 'heavy', 'growth');
    }
    break; // 한 토막에 한 인연의 연습을 한다. 여러 유파를 동시에 공짜로 완성하지 않는다.
  }
}
export function styleBondReady(s: Life5, id: CombatStyle, phase: 'ready' | 'refine'): boolean {
  const bond = s.growth.styleBonds[id];
  if (s.passage || !bond || bond.island !== s.hero.island || !s.people.some((p) => p.id === bond.teacherId && p.alive) || !styleUsable(s, id)) return false;
  return phase === 'ready' ? !bond.adopted && bond.practice >= 3
    : bond.adopted && !bond.refined && styleTier(s, id) >= 3 && (s.hardship >= 40 || s.stats.wins >= 5);
}
export function hasLocalStyleLesson(s: Life5): boolean {
  return !s.passage && Object.entries(s.growth.styleBonds).some(([id, b]) => isCombatStyle(id) && styleUsable(s, id) && !b.adopted && b.practice < 3 && b.island === s.hero.island &&
    s.people.some((p) => p.id === b.teacherId && p.alive));
}
export function adoptStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || !styleBondReady(s, id, 'ready')) return;
  const def = COMBAT_STYLE_BY_ID[id], bond = s.growth.styleBonds[id]!;
  bond.adopted = true;
  s.growth.styleMastery[id] = Math.max(V.growth.tierUp, s.growth.styleMastery[id] ?? 0);
  s.growth.tier[def.branch] = Math.max(1, s.growth.tier[def.branch]);
  const teacher = s.people.find(p => p.id === bond.teacherId)!;
  const origin = STYLE_ORIGIN_BY_ID[id];
  logLine(s, teacher.name === (origin.mentor?.name ?? origin.teacher) ? origin.accept : `${teacher.name}에게 배운 ${def.name}을(를) 주력으로 삼기로 했다.`, 'heavy', 'growth');
  if (def.weapon) receiveWeapon(s, `style_${id}`, 'stow');
  selectStyle(s, id);
}
export function refineStyle(s: Life5, id: CombatStyle): void {
  if (!isCombatStyle(id) || !styleBondReady(s, id, 'refine')) return;
  const bond = s.growth.styleBonds[id]!;
  bond.refined = true;
  // 재회의 가르침은 그 유파에만 더한다. 현재의 다른 주력에 흘리지 않는다.
  s.growth.styleMastery[id] = Math.min(600, (s.growth.styleMastery[id] ?? 0) + 20);
  const teacher = s.people.find(p => p.id === bond.teacherId)!;
  const origin = STYLE_ORIGIN_BY_ID[id];
  logLine(s, teacher.name === (origin.mentor?.name ?? origin.teacher) ? origin.follow : `${teacher.name}와(과) 다시 마주 앉아 첫 수련 때의 약속을 되짚었다.`, 'heavy', 'growth');
  logLine(s, `${COMBAT_STYLE_BY_ID[id].name}의 고급 수련을 배웠다. 이제 극의까지 자신의 힘으로 갈고닦을 수 있다.`, 'heavy', 'growth');
  s.timeline.push({ age: s.age, text: josa(`${teacher.name}와(과) 다시 ${COMBAT_STYLE_BY_ID[id].name}을(를) 갈고닦았다`) });
}

/** 저장 변환은 멱등이다. 검의 경지를 새 창에 복제하지 않는다. */
export function normalizeStyles(s: Life5, legacy: boolean, legacyWeapons = false): void {
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
  // 옛 저장은 같은 갈래의 다른 유파 칸에 무기를 넣기도 했다. 소유부터 살린 뒤 장착 관계를 복구한다.
  const owned = new Set<string>();
  const stored = Array.isArray(g.weapons) ? g.weapons : [];
  for (const id of [...stored, ...Object.values(g.styleWeapons), s.hero.weapon]) if (id && weaponItem(id)) owned.add(id);
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
  if (legacyWeapons) {
    for (const def of COMBAT_STYLES) if (def.weapon && g.styleBonds[def.id]?.adopted) owned.add(`style_${def.id}`);
    for (const [choice, id] of LEGACY_WEAPON_CHOICES) if (s.tried.includes(choice)) owned.add(id);
    if (s.tried.some(key => key.startsWith('wanoa_last_blade#'))) owned.delete('wano_heirloom');
  }
  for (const [style, id] of Object.entries(g.styleWeapons)) {
    if (!owned.has(id) || !isCombatStyle(style) || !weaponItem(id)?.weaponStyles?.includes(style)) {
      delete (g.styleWeapons as Record<string, unknown>)[style];
    }
  }
  g.weapons = [...owned];
  const active = primaryStyle(s);
  const held = weaponItem(s.hero.weapon);
  if (held && owned.has(held.id) && (!active || held.weaponStyles!.includes(active))) equip(s, held);
  else if (s.hero.weapon) {
    delete s.hero.weapon;
    const preferred = active && weaponItem(g.styleWeapons[active]);
    if (preferred && owned.has(preferred.id)) equip(s, preferred);
    else if (active) {
      const alternative = ownedWeapons(s).find(x => x.weaponStyles!.includes(active));
      if (alternative) equip(s, alternative);
    }
  }
}

/** 선택만으로 그 실물의 소유가 확정되던 사건들. 거절이나 빌려 쓴 무기는 제외한다. */
const LEGACY_WEAPON_CHOICES: [string, string][] = [
  ['wanok_samurai_blade#0', 'wano_heirloom'],
  ['wanoa_swordsmith#2', 'wano_last_order'], ['wano_beasts#0', 'sw1'],
  ['cn_tashigi_swords#1', 'loguetown_meito'],
  ['sw_inherit_yard#0', 'yard_hammer'],
  ['port_weapon_loguetown#0', 'sw2'], ['port_weapon_water7#0', 'sp2'],
  ['port_weapon_loguetown#1', 'gu2'], ['port_weapon_water7#1', 'gu2'],
];
