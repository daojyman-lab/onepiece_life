// 자동 전투 (docs/02_설계/04_전투.md). 전투 상태는 값이라 개입 지점에서 멈췄다가 이어서 계산할 수 있다.
import { B } from '../../data/balance';
import { ITEM_BY_ID } from '../../data/items';
import { getSkill } from '../growth/skillbook';
import { rngOf, type Rng } from '../rng';
import type { BattleState, CUnit, Duel, Skill } from '../types';

const C = B.combat;

export interface Pairing { enemy: number; units: number[] }   // 적 하나(units 인덱스)와 그를 맡는 우리 편

/**
 * 전투를 시작한다. units: 우리 편과 적. 주인공은 0번. 적 우두머리는 leader=true.
 * assign: 우리 편 유닛 인덱스 → 맡을 적 유닛 인덱스
 */
export function startBattle(units: CUnit[], assign: Record<number, number>, seed: number, atSea: boolean): BattleState {
  const heroIdx = units.findIndex((u) => u.hero);
  const enemies = units.map((u, i) => (u.side === 'R' ? i : -1)).filter((i) => i >= 0);
  const leader = enemies.find((i) => units[i].leader) ?? enemies[0];
  const fighters = units.map((u, i) => (u.side === 'L' && (u.role === 'hero' || u.role === 'vanguard' || u.role === 'support') ? i : -1)).filter((i) => i >= 0);

  // 맡을 적 정리. 우두머리는 반드시 누군가 맡는다. 비면 주인공이 맡는다
  const target: Record<number, number> = {};
  for (const f of fighters) target[f] = enemies.includes(assign[f]) ? assign[f] : leader;
  if (!fighters.some((f) => target[f] === leader)) target[heroIdx] = leader;

  const duels: Duel[] = [];
  let id = 0;
  for (const e of enemies) {
    const mine = fighters.filter((f) => target[f] === e);
    if (!mine.length) continue;
    const principal = mine.includes(heroIdx) ? heroIdx : mine[0];
    duels.push({ id: id++, l: principal, r: e, helpersL: mine.filter((x) => x !== principal), helpersR: [], over: false, winner: null });
  }
  // 아무도 맡지 않은 적은 주인공의 싸움에 붙는다
  const heroDuel = duels.find((d) => d.l === heroIdx)!;
  for (const e of enemies) if (!duels.some((d) => d.r === e)) heroDuel.helpersR.push(e);

  return {
    round: 0, units, duels, events: [], result: null, initialHp: units.map((u) => u.hp),
    rng: { seed, cursor: 0 }, usage: {}, awaiting: null, resting: false, atSea,
    navigator: units.some((u) => u.side === 'L' && u.role === 'navigator'),
  };
}

const alive = (u: CUnit) => u.hp > 0;
const ratio = (u: CUnit) => u.hp / u.maxHp;

/** 물러나기 성공 확률 (0~1). 속도의 몫으로 정하고, 연막이 있으면 더한다 */
export function retreatChance(mySpd: number, foeSpd: number, smoke = false): number {
  const R = C.retreat;
  const share = Math.max(0, mySpd) / Math.max(1, Math.max(0, mySpd) + Math.max(0, foeSpd));
  return Math.max(R.min, Math.min(R.max, R.base + R.perShare * (share - 0.5) + (smoke ? R.smoke : 0)));
}

/** 주사위 판정: 1~100을 굴려 need(= 확률 × 100) 이하면 성공 */
export function rollDice(r: Rng, p: number): { roll: number; need: number; ok: boolean } {
  const roll = 1 + Math.floor(r() * 100);
  const need = Math.round(p * 100);
  return { roll, need, ok: roll <= need };
}

/** 누군가 빈사(체력이 deathmatchBelow 아래)가 되면 목숨을 건 싸움으로 바꾼다. 한 번만 */
function checkDeathmatch(b: BattleState, who: number) {
  if (b.deathmatch) return;
  if (ratio(b.units[who]) >= C.deathmatchBelow) return;
  b.deathmatch = true;
  b.events.push({ k: 'deathmatch', who });
}

function heroIndex(b: BattleState) { return b.units.findIndex((u) => u.hero); }
function heroDuel(b: BattleState) { const h = heroIndex(b); return b.duels.find((d) => !d.over && d.l === h) ?? null; }
function leaderIdx(b: BattleState) { return b.units.findIndex((u) => u.side === 'R' && u.leader); }

// ---------------------------------------------------------------- 자연계

/**
 * 자연계 상대에게 들어가는 피해의 비율과 그 이유. 규칙은 여기 한 곳에만 둔다.
 * - 상대가 해루석에 닿아 있거나(봉인) 묶여 있으면 실체가 잡혀 그대로 들어간다
 * - 아니면 단계 = 무장색 + 관통 기술 + 해루석 무기 + 해루석 탄환, 단계별 배율
 */
export function logiaMult(a: Pick<CUnit, 'armament' | 'weapon'>, t: Pick<CUnit, 'fruitClass' | 'sealed' | 'bound'>, sk: Skill | null, extra: { seastone?: boolean } = {}): { mult: number; why: string | null } {
  if (t.fruitClass !== 'logia') return { mult: 1, why: null };
  if (t.sealed > 0) return { mult: 1, why: '해루석에 닿아 실체가 잡혔다' };
  if (t.bound > 0) return { mult: 1, why: '묶여서 실체가 드러났다' };
  const weaponHit = a.weapon?.seastone && (!sk || sk.branch === a.weapon.branch);
  const lv = Math.min(3, a.armament + (sk?.tags.includes('pierce') ? 1 : 0) + (weaponHit ? 1 : 0) + (extra.seastone ? 1 : 0));
  const mult = C.logia[lv];
  return { mult, why: mult < 1 ? '자연계라 잘 안 먹힌다' : null };
}

// ---------------------------------------------------------------- 피해

function tacticDeal(u: CUnit, sk: Skill | null, round: number) {
  const t = C.tactic[u.tactic];
  let m = t.deal;
  if (u.tactic === 'counter' && sk?.when === 'afterEnemyBig') m = t.counterDeal!;
  if (u.tactic === 'endurance' && round > t.lateRound!) m *= t.lateDeal!;
  return m;
}

function hit(b: BattleState, r: Rng, d: number, ai: number, ti: number, sk: Skill | null, power: number, extra: { seastone?: boolean; helper?: boolean; proc?: boolean; element?: string; name?: string } = {}) {
  const a = b.units[ai], t = b.units[ti];
  const facts = {
    helper: extra.helper === true, stat: sk?.stat ?? 'str' as const, speedGap: a.st.spd - t.st.spd,
    guarded: (t.guardTurns > 0 && t.guard > 0) || t.pGuard > 0, observation: false,
    armament: false,
    actorHp: a.hp, targetHp: t.hp, targetAfter: t.hp,
  };
  const area = sk?.tags.includes('area');
  // 회피
  let dodge = C.dodge.base + (t.st.spd - a.st.spd) * C.dodge.perSpd;
  const withoutObservation = Math.max(0, Math.min(C.dodge.max, dodge)) + t.pDodge + (t.evadeTurns > 0 ? t.evade : 0);
  dodge = Math.max(0, Math.min(C.dodge.max, dodge)) + t.observation * C.dodge.perObs + t.pDodge + (t.evadeTurns > 0 ? t.evade : 0);
  if (area) dodge *= C.dodge.areaMult;
  const name = extra.name ?? (sk ? sk.name : extra.seastone ? '해루석 탄환' : extra.helper ? '협공' : '기본 공격');
  const dodgeRoll = r();
  facts.observation = t.observation > 0 && dodgeRoll >= Math.min(0.95, withoutObservation * (area ? C.dodge.areaMult : 1)) && dodgeRoll < Math.min(0.95, dodge);
  if (dodgeRoll < Math.min(0.95, dodge)) {
    b.events.push({ k: 'act', d, who: ai, target: ti, skill: sk?.id ?? 'basic', name, dmg: 0, crit: false, dodge: true, facts });
    if (t.evadeTurns > 0) t.evadeTurns = 0;
    return 0;
  }
  const statKey = sk ? sk.stat : 'str';
  const stat = Math.max(a.st[statKey], statKey === 'int' ? 0 : a.st.str * 0.5);
  const mastery = sk ? C.mastery.min + C.mastery.span * (a.skills.find((k) => k.id === sk.id)?.mastery ?? 50) / 100 : 1;
  const weaponHit = sk ? a.weapon?.branch === sk.branch : !extra.proc && !extra.seastone;
  const weapon = weaponHit ? a.weapon?.mult ?? 1 : 1;
  const rand = C.rand[0] + (C.rand[1] - C.rand[0]) * r();
  const am = a.mods, tm = t.mods;
  const crit = r() < C.crit.base + a.st.luk * C.crit.perLuk + (am.crit ?? 0);
  const lg = logiaMult(a, t, sk, extra);
  facts.armament = a.armament > 0 && lg.mult > logiaMult({ armament: 0, weapon: a.weapon }, t, sk, extra).mult;
  const logia = lg.mult;
  const guard = (t.guardTurns > 0 ? t.guard : 0) + t.pGuard;
  // 패시브: 공격하는 쪽
  const allyDown = b.units.some((u) => u.side === a.side && u.hp <= 0);
  const passive = (am.dmg ?? 1) * (!sk || sk.branch !== 'fruit' ? am.phys ?? 1 : 1)
    * (1 + (am.lowHpPower ?? 0) * (1 - ratio(a)))
    * (b.round <= 2 ? 1 + (am.opening ?? 0) : 1)
    * (b.atSea ? 1 + (am.atSea ?? 0) : 1)
    * (allyDown ? 1 + (am.allyDown ?? 0) : 1)
    * (sk?.when === 'afterEnemyBig' ? 1 + (am.counter ?? 0) : 1);
  // 패시브: 맞는 쪽 (속성 저항)
  const element = (extra.element ?? am.element) as keyof NonNullable<typeof tm.resist> | undefined;
  const resist = element && tm.resist?.[element] !== undefined ? tm.resist[element]! : 1;
  let dmg = stat * power * mastery * weapon * tacticDeal(a, sk, b.round) * rand
    * 100 / (100 + t.def * C.defenseK)
    * (crit ? am.critMult ?? C.crit.mult : 1) * logia * Math.max(0.1, 1 - guard)
    * C.tactic[t.tactic].take * (1 + a.pBuff + (a.buffTurns > 0 ? a.buff : 0))
    * passive * (tm.take ?? 1) * resist;
  dmg = Math.max(resist === 0 ? 0 : 1, Math.round(dmg));
  // 불굴: 쓰러질 공격을 한 번 버틴다
  let stood = false;
  if (dmg >= t.hp && tm.lastStand && !t.stood && t.hp > 1) { t.stood = true; dmg = t.hp - 1; stood = true; }
  t.hp = Math.max(0, t.hp - dmg);
  if (t.guardTurns > 0) t.guardTurns -= 1;
  checkDeathmatch(b, ti);
  const note = stood ? '쓰러지지 않고 버텼다!' : resist === 0 ? '전혀 통하지 않는다' : resist < 1 ? '잘 안 먹힌다' : lg.why ?? undefined;
  facts.targetAfter = t.hp;
  b.events.push({ k: 'act', d, who: ai, target: ti, skill: sk?.id ?? 'basic', name, dmg, crit, dodge: false, note, proc: extra.proc, facts });
  // 패시브: 흡수 · 묶기 · 봉인 · 추가 공격
  if (am.drain && dmg > 0 && a.hp < a.maxHp) {
    const amount = Math.min(a.maxHp - a.hp, Math.max(1, Math.round(dmg * am.drain)));
    a.hp += amount;
    b.events.push({ k: 'heal', d, who: ai, target: ai, amount, name: '흡수' });
  }
  if (am.bindOnHit && t.hp > 0 && r() < am.bindOnHit) t.bound = Math.max(t.bound, 1);
  if (am.sealOnHit && t.fruitClass && t.hp > 0 && r() < am.sealOnHit) t.sealed = Math.max(t.sealed, 1);
  if (!extra.proc && am.proc && t.hp > 0 && r() < am.proc.p) hit(b, r, d, ai, ti, null, am.proc.power, { proc: true, element: am.proc.element, name: am.proc.name });
  if (a.hero) {
    const key = sk?.id ?? 'basic';
    const u = (b.usage[key] ??= { uses: 0, damage: 0 });
    u.uses += 1; u.damage += dmg;
  }
  // 열매의 대가: 바다 위에서 체력이 낮을 때 큰 기술을 맞으면 빠질 수 있다
  if (b.atSea && t.hero && t.fruitClass && t.hp > 0 && ratio(t) < C.drown.hpBelow && power >= C.bigPower) {
    if (r() < (b.navigator ? C.drown.navigatorP : C.drown.p)) {
      b.events.push({ k: 'drown', who: ti });
      t.hp = 0;
      checkDeathmatch(b, ti);
    }
  }
  if (extra.seastone && t.fruitClass) t.sealed = C.seastoneSeal;
  return dmg;
}

// ---------------------------------------------------------------- 기술 고르기

function usable(u: CUnit, sk: Skill, foe: CUnit, b: BattleState, allyDown: boolean): boolean {
  if (sk.kind === 'passive') return false;
  if (sk.branch === 'fruit' && u.sealed > 0) return false;
  const cost = sk.cost * C.tactic[u.tactic].cost;
  if (u.sp < cost) return false;
  switch (sk.when) {
    case 'always': return true;
    case 'opening': return b.round <= 2;
    case 'hpBelow50': return ratio(u) < 0.5;
    case 'enemyHpBelow30': return ratio(foe) < 0.3;
    case 'afterEnemyBig': return foe.lastBig;
    case 'allyDown': return allyDown;
  }
}

function order(u: CUnit, list: { sk: Skill; i: number }[]) {
  const by = (f: (s: Skill) => number) => list.sort((a, b) => f(b.sk) - f(a.sk));
  switch (u.tactic) {
    case 'offense': return by((s) => s.power);
    case 'defense': return by((s) => (s.kind === 'guard' || s.effect?.type === 'heal' ? 100 : 0) + s.power);
    case 'counter': return by((s) => (s.when === 'afterEnemyBig' ? 100 : 0) + s.power);
    case 'endurance': return by((s) => -s.cost + s.power * 0.01);
  }
}

// ---------------------------------------------------------------- 한 번의 행동

function act(b: BattleState, r: Rng, d: Duel, ai: number, ti: number) {
  const a = b.units[ai], t = b.units[ti];
  if (!alive(a) || !alive(t) || b.result) return;
  if (a.bound > 0) {
    a.bound -= 1;
    b.events.push({ k: 'act', d: d.id, who: ai, target: ti, skill: 'bound', name: '묶여서 움직이지 못한다', dmg: 0, crit: false, dodge: false });
    return;
  }
  // 1. 물러나기: 누군가 빈사가 된 뒤(목숨을 건 싸움)에는 물러날 수 없다. 연막이 있어도 주사위를 굴린다
  if (a.hero && a.retreatAt > 0 && !b.deathmatch && ratio(a) < a.retreatAt) {
    const smoke = a.consumables.indexOf('smoke');
    if (smoke >= 0) a.consumables.splice(smoke, 1);
    const { roll, need, ok } = rollDice(r, retreatChance(a.st.spd, t.st.spd, smoke >= 0));
    b.events.push({ k: 'retreat', who: ai, ok, roll, need });
    if (ok) { b.result = 'retreat'; return; }
  }
  // 2. 소모품
  const use = (id: string) => {
    const i = a.consumables.indexOf(id);
    if (i < 0) return false;
    a.consumables.splice(i, 1);
    b.events.push({ k: 'item', d: d.id, who: ai, item: id, name: ITEM_BY_ID[id]?.name ?? id });
    return true;
  };
  if (ratio(a) < 0.5 && use('potion')) { a.hp = Math.min(a.maxHp, a.hp + Math.round(a.maxHp * 0.3)); a.lastBig = false; tickDown(a); return; }
  if (a.sp < 15 && use('meat')) { a.sp = Math.min(a.maxSp, a.sp + 40); a.lastBig = false; tickDown(a); return; }
  if (b.round <= 2 && t.bound === 0 && a.consumables.includes('net')) {
    use('net');
    const caught = r() < 0.7 + Math.max(0, (a.st.spd - t.st.spd) * 0.01);
    if (caught) t.bound = 1;
    b.events.push({ k: 'act', d: d.id, who: ai, target: ti, skill: 'net', name: '해루석 그물', dmg: 0, crit: false, dodge: !caught, note: caught ? (t.fruitClass === 'logia' ? '그물에 걸렸다! 실체가 드러났다' : '그물에 걸렸다!') : '빗나갔다' });
    a.lastBig = false; tickDown(a); return;
  }
  if (t.fruitClass && t.sealed === 0 && a.consumables.includes('seastone')) {
    use('seastone');
    hit(b, r, d.id, ai, ti, null, 1.2, { seastone: true });
    a.lastBig = false; tickDown(a); return;
  }
  // 3. 기술
  const allyDown = b.units.some((u) => u.side === a.side && !alive(u));
  const cands = order(a, a.skills.map((k, i) => ({ sk: getSkill(k.id)!, i })).filter((x) => x.sk && a.skills[x.i].cd === 0 && usable(a, x.sk, t, b, allyDown)));
  const pickd = cands[0];
  if (!pickd) {
    hit(b, r, d.id, ai, ti, null, 1.0);
    a.sp = Math.min(a.maxSp, a.sp + C.basicRecover);
    a.lastBig = false;
    tickDown(a);
    return;
  }
  const { sk, i } = pickd;
  a.sp -= Math.round(sk.cost * C.tactic[a.tactic].cost);
  a.skills[i].cd = sk.cooldown + 1;
  tickDown(a);
  a.lastBig = sk.kind === 'attack' && sk.power >= C.bigPower;
  if (sk.kind === 'attack') {
    hit(b, r, d.id, ai, ti, sk, sk.power);
    return;
  }
  const e = sk.effect;
  if (!e) return;
  const scale = 0.7 + 0.6 * (a.skills[i].mastery / 100);
  if (e.type === 'guard') { a.guard = e.value; a.guardTurns = e.turns; b.events.push({ k: 'guard', d: d.id, who: ai, name: sk.name, skill: sk.id, effect: e.type }); }
  else if (e.type === 'dodge') { a.evade = e.value; a.evadeTurns = e.turns; b.events.push({ k: 'guard', d: d.id, who: ai, name: sk.name, skill: sk.id, effect: e.type }); }
  else if (e.type === 'heal') {
    const amount = Math.round(a.maxHp * e.value * scale);
    a.hp = Math.min(a.maxHp, a.hp + amount);
    b.events.push({ k: 'heal', d: d.id, who: ai, target: ai, amount, name: sk.name });
  } else if (e.type === 'buff') { a.buff = e.value; a.buffTurns = e.turns; b.events.push({ k: 'guard', d: d.id, who: ai, name: sk.name, skill: sk.id, effect: e.type }); }
  else if (e.type === 'bind' || e.type === 'debuff') {
    const ok = r() < e.value * scale;
    if (ok) t.bound = Math.max(t.bound, e.turns);
    b.events.push({ k: 'act', d: d.id, who: ai, target: ti, skill: sk.id, name: sk.name, dmg: 0, crit: false, dodge: !ok, note: ok ? '상대가 묶였다' : '빗나갔다' });
  }
}

function tickDown(u: CUnit) {
  for (const k of u.skills) if (k.cd > 0) k.cd -= 1;
  if (u.buffTurns > 0) u.buffTurns -= 1;
  if (u.evadeTurns > 0) u.evadeTurns -= 1;
  if (u.sealed > 0) u.sealed -= 1;
}

// ---------------------------------------------------------------- 교전이 끝났을 때

function settleDuel(b: BattleState, d: Duel, autoIntervene: boolean, r: Rng) {
  if (d.over) return;
  const h = heroIndex(b);
  // 쓰러진 주역 자리를 돕던 사람이 잇는다
  if (!alive(b.units[d.r])) {
    b.events.push({ k: 'down', d: d.id, who: d.r });
    if (b.units[d.r].leader) { b.result = 'win'; return; }
    const next = d.helpersR.find((x) => alive(b.units[x]));
    if (next !== undefined) { d.r = next; d.helpersR = d.helpersR.filter((x) => x !== next); }
  }
  if (!alive(b.units[d.l])) {
    b.events.push({ k: 'down', d: d.id, who: d.l });
    if (d.l === h) { b.result = 'lose'; return; }
    const next = d.helpersL.find((x) => alive(b.units[x]));
    if (next !== undefined) { d.l = next; d.helpersL = d.helpersL.filter((x) => x !== next); }
  }
  const lAlive = alive(b.units[d.l]), rAlive = alive(b.units[d.r]);
  if (lAlive && rAlive) return;
  d.over = true;
  d.winner = lAlive ? 'L' : 'R';
  const hd = b.duels.find((x) => !x.over && x.l === h);
  if (d.winner === 'R') {
    // 손이 빈 적은 주인공의 싸움에 붙는다
    const target = hd ?? b.duels.find((x) => !x.over && b.units[x.r].leader);
    const freed = [d.r, ...d.helpersR].filter((x) => alive(b.units[x]));
    if (target) for (const x of freed) { target.helpersR.push(x); b.events.push({ k: 'join', d: target.id, who: x, side: 'R' }); }
    return;
  }
  // 우리 편이 이겼다
  const freed = [d.l, ...d.helpersL].filter((x) => alive(b.units[x]));
  if (d.l === h) {
    // 주인공의 손이 비었다
    const open = b.duels.filter((x) => !x.over);
    if (!open.length) return;
    if (autoIntervene) intervene(b, open.find((x) => b.units[x.r].leader)?.id ?? open[0].id, r);
    else b.awaiting = 'intervene';
    return;
  }
  const target = hd ?? b.duels.find((x) => !x.over);
  if (target) for (const x of freed) { target.helpersL.push(x); b.events.push({ k: 'join', d: target.id, who: x, side: 'L' }); }
}

/** 주인공이 도울 교전을 고른다. duelId = -1 이면 숨 고르기 */
export function intervene(b: BattleState, duelId: number, _r?: Rng) {
  const h = heroIndex(b);
  b.awaiting = null;
  if (duelId < 0) { b.resting = true; return; }
  const d = b.duels.find((x) => x.id === duelId && !x.over);
  if (!d) return;
  // 주인공이 함께 싸우던 동료도 데려간다
  const old = b.duels.find((x) => x.l === h && x.over);
  const comrades = old ? old.helpersL.filter((x) => alive(b.units[x])) : [];
  if (old) old.helpersL = [];
  d.helpersL.push(d.l, ...comrades);
  d.l = h;
  b.events.push({ k: 'join', d: d.id, who: h, side: 'L' });
}

// ---------------------------------------------------------------- 진행

function medics(b: BattleState) {
  if (b.round % C.medicEvery !== 0) return;
  for (const [mi, m] of b.units.entries()) {
    if (m.side !== 'L' || m.role !== 'medic' || !alive(m)) continue;
    const pool = b.units.map((u, i) => ({ u, i })).filter((x) => x.u.side === 'L' && alive(x.u) && x.u.role !== 'medic');
    pool.sort((a, z) => ratio(a.u) - ratio(z.u));
    const t = pool[0];
    if (!t || ratio(t.u) > 0.9) continue;
    const amount = Math.round(t.u.maxHp * C.medicHeal);
    t.u.hp = Math.min(t.u.maxHp, t.u.hp + amount);
    b.events.push({ k: 'heal', d: -1, who: mi, target: t.i, amount, name: '응급 치료' });
  }
}

function round(b: BattleState, r: Rng, autoIntervene: boolean) {
  b.round += 1;
  b.events.push({ k: 'round', n: b.round });
  medics(b);
  // 패시브: 재생
  for (const [i, u] of b.units.entries()) {
    if (u.hp <= 0 || !u.mods.regen || u.hp >= u.maxHp) continue;
    const amount = Math.max(1, Math.round(u.maxHp * u.mods.regen));
    u.hp = Math.min(u.maxHp, u.hp + amount);
    b.events.push({ k: 'heal', d: -1, who: i, target: i, amount, name: '재생' });
  }
  const h = heroIndex(b);
  if (b.resting) {
    const hu = b.units[h];
    hu.sp = Math.min(hu.maxSp, hu.sp + Math.round(hu.maxSp * C.restSp));
    b.events.push({ k: 'rest', who: h });
    b.resting = false;
  }
  for (const d of b.duels) {
    if (d.over || b.result) continue;
    const L = b.units[d.l], R = b.units[d.r];
    const lFirst = L.st.spd + r() * C.initiativeRand >= R.st.spd + r() * C.initiativeRand;
    const seq: [number, number][] = lFirst ? [[d.l, d.r], [d.r, d.l]] : [[d.r, d.l], [d.l, d.r]];
    for (const [x, y] of seq) {
      act(b, r, d, x, y);
      if (b.result) return;
      settleDuel(b, d, autoIntervene, r);
      if (b.result || d.over) break;
    }
    if (d.over || b.result) continue;
    // 돕는 사람들
    for (const hx of d.helpersL) {
      const u = b.units[hx];
      if (!alive(u) || !alive(b.units[d.r])) continue;
      hit(b, r, d.id, hx, d.r, null, u.role === 'support' ? C.supportHelperPower : C.helperPower, { helper: true });
    }
    for (const hx of d.helpersR) {
      const u = b.units[hx];
      if (!alive(u) || !alive(b.units[d.l])) continue;
      hit(b, r, d.id, hx, d.l, null, C.helperPower, { helper: true });
    }
    settleDuel(b, d, autoIntervene, r);
    if (b.result) return;
  }
  // 주인공이 쉬고 있었고 손이 비어 있으면 다시 묻는다
  if (!b.result && !heroDuel(b) && b.duels.some((x) => !x.over) && !b.awaiting && !b.resting) {
    if (autoIntervene) {
      const open = b.duels.filter((x) => !x.over);
      intervene(b, open.find((x) => b.units[x.r].leader)?.id ?? open[0].id);
    } else b.awaiting = 'intervene';
  }
}

/** 결판이 나거나 개입 지점에 닿을 때까지 계산한다 */
export function runBattle(b: BattleState, autoIntervene: boolean): BattleState {
  const r = rngOf(b.rng);
  while (!b.result && !b.awaiting) {
    if (b.round >= C.maxRounds) {
      const hero = b.units[heroIndex(b)], lead = b.units[leaderIdx(b)];
      b.result = ratio(hero) >= ratio(lead) ? 'win' : 'lose';
      break;
    }
    round(b, r, autoIntervene);
  }
  if (b.result) b.events.push({ k: 'end', result: b.result });
  return b;
}

/** 개입 선택지: 아직 끝나지 않은 교전들 */
export function openDuels(b: BattleState) {
  return b.duels.filter((d) => !d.over);
}
