// 데비 백 파이트: 해적끼리 세 판을 겨뤄, 이긴 판마다 상대 선원 하나를 데려가는 오랜 놀이.
// 1판 도넛 레이스(속도 · 지능 · 항해사), 2판 그로기 링(힘 · 체력 · 돌격대), 3판 선장끼리 1대1 전투.
// 지면 상대가 우리 배에서 가장 강한 동료를 골라 데려간다.
import { crewLabel, crewOf, recruit } from '../people';
import { rngOf } from '../rng';
import type { LifeState } from '../types';
import { fmtMoney, log, timeline } from '../util';
import { sea, sideEnemy } from '../world/world';
import { crewCapacity } from '../effects';

/** 상대 선장 (해역마다) */
function foxy(s: LifeState) {
  return s.world.stage <= 3
    ? { name: '「은여우」 포크시', title: '포크시 해적단 선장', canon: 'foxy' }
    : { name: '「해적 사냥」 폭시 2세', title: '데비 백 파이트 상습범' };
}

/** 이긴 판: 상대 선원 하나를 데려온다 (자리가 없으면 몸값을 받는다) */
function winRound(s: LifeState, what: string) {
  if (crewOf(s).length < crewCapacity(s)) {
    const p = recruit(s, { role: 'vanguard' });
    if (p) {
      if (s.loadout.crew.length < crewCapacity(s)) s.loadout.crew.push({ personId: p.id, role: p.crew!.role });
      log(s, `${what}에서 이겼다! 상대 선원 ${crewLabel(p)}을(를) 데려왔다.`, 'good');
      return;
    }
  }
  const money = Math.round(8000 * s.world.stage);
  s.hero.money += money;
  log(s, `${what}에서 이겼다! 배에 자리가 없어 대신 몸값 ${fmtMoney(money)} 베리를 받았다.`, 'good');
}

/** 진 판: 상대가 가장 강한 동료를 골라 간다 */
function loseRound(s: LifeState, what: string) {
  const crew = crewOf(s).filter((p) => p.crew).sort((a, z) => z.crew!.power - a.crew!.power);
  const p = crew[0];
  if (!p) { log(s, `${what}에서 졌다. 데려갈 선원이 없어 상대가 혀를 찼다.`, 'danger'); return; }
  p.kind = 'ally'; p.relation = '데비 백 파이트로 빼앗긴 동료'; p.bond = Math.max(0, p.bond - 10);
  s.loadout.crew = s.loadout.crew.filter((c) => c.personId !== p.id);
  if (s.world.firstMate === p.id) s.world.firstMate = undefined;
  log(s, `${what}에서 졌다… 상대가 손가락으로 ${crewLabel(p)}을(를) 가리켰다. "저 녀석을 받아 가지." 규칙은 규칙이다.`, 'danger');
  timeline(s, `데비 백 파이트에서 ${p.name}을(를) 빼앗겼다`);
}

/** 1 · 2판은 겨루기, 3판은 선장끼리 전투를 띄운다 */
export function davyBack(s: LifeState) {
  const r = rngOf(s.rng);
  const h = s.hero.base;
  const [lo, hi] = sea(s).enemyPower;
  const mid = (lo + hi) / 2;
  const crew = crewOf(s).filter((p) => p.crew && !p.crew.injuredMonths);
  const nav = crew.some((p) => p.crew!.role === 'navigator');
  const wright = crew.some((p) => p.crew!.role === 'shipwright');
  const fighters = crew.filter((p) => p.crew!.role === 'vanguard' || p.crew!.role === 'support').map((p) => p.crew!.power).sort((a, z) => z - a);
  const F = foxy(s);
  log(s, `「데비 백 파이트!」 ${F.name}이(가) 깃발을 걸고 외쳤다. 세 판 승부, 이긴 쪽이 진 쪽의 선원을 데려간다.`, 'world');
  // 1판 도넛 레이스
  const race = (h.spd + h.int) * (0.8 + r() * 0.5) + (nav ? mid * 0.6 : 0) + (wright ? mid * 0.3 : 0);
  const raceFoe = mid * 2 * (0.85 + r() * 0.4);
  if (race >= raceFoe) winRound(s, '1판 도넛 레이스'); else loseRound(s, '1판 도넛 레이스');
  // 2판 그로기 링 (선장 + 가장 센 동료 둘)
  const ring = (h.str + h.vit) * (0.8 + r() * 0.4) + (fighters[0] ?? 0) * 0.8 + (fighters[1] ?? 0) * 0.5;
  const ringFoe = mid * 3 * (0.85 + r() * 0.4);
  if (ring >= ringFoe) winRound(s, '2판 그로기 링'); else loseRound(s, '2판 그로기 링');
  // 3판 선장끼리 1대1
  log(s, `마지막 3판은 선장끼리의 싸움이다. ${F.name}이(가) 느릿느릿한 빛을 손바닥에 모았다.`, 'battle');
  const enemy = sideEnemy(s, 'dbf', s.rng.cursor, { ...F, mult: 1.05, bias: { int: 1.3, spd: 1.1 }, skills: ['gun_bind', 'fist_combo', 'gun_quick', 'fist_jab'], faction: 'pirate' });
  s.pending = {
    kind: 'prep',
    encounter: {
      source: 'choice', enemy, elite: true, lethal: false, spar: false, atSea: false, solo: true,
      reward: [{ op: 'dbfRound', won: true }],
      onLose: [{ op: 'dbfRound', won: false }],
    },
  };
}

export function dbfFinal(s: LifeState, won: boolean) {
  if (won) winRound(s, '3판 선장 결투'); else loseRound(s, '3판 선장 결투');
  s.hero.fame += won ? 8 : 2;
  log(s, '데비 백 파이트가 끝났다. 두 해적단은 술통을 굴리며 헤어졌다.', 'world');
}
