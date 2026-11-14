// 만남(Encounter)에서 전투를 꾸리고, 승률을 미리 보고, 정찰 정보를 낸다.
import { B } from '../../data/balance';
import { hashString } from '../rng';
import type { BattleState, CUnit, Encounter, LifeState, Loadout, Risk } from '../types';
import { crewUnit, enemyUnit, heroUnit } from './units';
import { feastLeft, firstMateOf } from '../people';
import { runBattle, startBattle } from './engine';
import { observationLevel } from '../growth/skillbook';

const C = B.combat;

/** 준비 화면의 짝 짓기. 키: 'hero' 또는 동료 personId, 값: 적 번호(0 = 우두머리) */
export type Assign = Record<string, number>;

export function defaultAssign(s: LifeState, enc: Encounter, lo: Loadout): Assign {
  const a: Assign = { hero: 0 };
  const officers = enc.enemy.officers.length;
  let k = 1;
  for (const c of fighters(s, lo)) {
    a[c.personId] = k <= officers ? k++ : 0;
  }
  return a;
}

function fighters(s: LifeState, lo: Loadout) {
  return lo.crew.filter((c) => {
    const p = s.people.find((x) => x.id === c.personId && x.alive && x.kind === 'crew');
    return p && p.crew && p.crew.injuredMonths <= 0 && (p.crew.role === 'vanguard' || p.crew.role === 'support');
  });
}

export function buildUnits(s: LifeState, enc: Encounter, lo: Loadout, assign: Assign) {
  const units: CUnit[] = [heroUnit(s, lo)];
  const idxOf: Record<string, number> = { hero: 0 };
  const mate = firstMateOf(s);
  const feast = feastLeft(s) > 0;
  if (!enc.spar && !enc.solo && enc.source !== 'routine') {
    for (const c of lo.crew) {
      const p = s.people.find((x) => x.id === c.personId && x.alive && x.kind === 'crew');
      if (!p || !p.crew || p.crew.injuredMonths > 0) continue;
      idxOf[p.id] = units.length;
      const u = crewUnit(p, s.world.stage);
      // 부선장은 더 강하고, 다른 동료를 이끈다. 회식 뒤에는 사기가 오른다
      if (mate) { if (p.id === mate.id) { u.pBuff += B.crew.mateBuff; u.pGuard += B.crew.mateGuard; } else u.pBuff += B.crew.mateLead; }
      if (feast) u.pBuff += B.crew.feastBuff;
      units.push(u);
    }
  }
  const enemyStart = units.length;
  units.push(enemyUnit(enc.enemy, true, 0));
  enc.enemy.officers.forEach((o, i) => units.push(enemyUnit(o, false, i + 1)));
  const asg: Record<number, number> = {};
  for (const [k, v] of Object.entries(assign)) if (k in idxOf) asg[idxOf[k]] = enemyStart + Math.min(v, enc.enemy.officers.length);
  return { units, asg };
}

export function createBattle(s: LifeState, enc: Encounter, lo: Loadout, assign: Assign, seed: number): BattleState {
  const { units, asg } = buildUnits(s, enc, lo, assign);
  // 갑판 대포: 바다 위 강적전이면 적이 체력 10%를 잃고 시작한다
  if (enc.atSea && !enc.spar && enc.source !== 'routine' && s.world.shipParts?.includes('cannon')) {
    for (const u of units) if (u.side === 'R') u.hp = Math.round(u.hp * 0.9);
  }
  return startBattle(units, asg, seed, enc.atSea);
}

/** 지금 편성으로 N번 미리 돌려 본 승률 (0~1). 상태를 바꾸지 않는다 */
export function winRate(s: LifeState, enc: Encounter, lo: Loadout, assign: Assign, runs = C.preview.runs): number {
  let wins = 0;
  const base = hashString(`${s.rng.seed}:${s.rng.cursor}:${enc.enemy.id}`);
  for (let i = 0; i < runs; i++) {
    const b = createBattle(s, enc, lo, assign, (base + i * 7919) >>> 0);
    runBattle(b, true);
    if (b.result === 'win') wins++;
  }
  return wins / runs;
}

/** 지능에 따라 오차가 섞인 승률과 위험도 */
export function shownOdds(s: LifeState, real: number): { shown: number; noise: number } {
  const hasNav = s.people.some((p) => p.alive && p.kind === 'crew' && p.crew?.role === 'navigator');
  const noise = Math.max(2, C.preview.noiseBase - s.hero.base.int * C.preview.noisePerInt - (hasNav ? 4 : 0));
  // 오차는 결정적으로: 같은 상황이면 같은 값
  const h = hashString(`${s.rng.seed}:${s.time.year}:${s.time.month}`) % 1000 / 1000;
  const shown = Math.max(0, Math.min(1, real + (h * 2 - 1) * noise / 100));
  return { shown, noise };
}

export function riskOf(rate: number): Risk {
  return rate >= C.risk.safe ? 'safe' : rate >= C.risk.danger ? 'danger' : 'lethal';
}

/** 정찰로 보이는 정보의 깊이: 0 이름 · 계통 · 간부 수 / 1 전법 · 주력 기술 / 2 전부 */
export function scoutLevel(s: LifeState, knownInCodex: boolean): 0 | 1 | 2 {
  const hasNav = s.people.some((p) => p.alive && p.kind === 'crew' && p.crew?.role === 'navigator');
  const nest = s.world.shipParts?.includes('crowsnest') ? 1 : 0;
  if (s.hero.base.int >= C.scout.fullInt || knownInCodex || observationLevel(s) >= 2) return 2;
  const lv = (s.hero.base.int >= C.scout.midInt || hasNav ? 1 : 0) + nest;
  return Math.min(2, lv) as 0 | 1 | 2;
}
