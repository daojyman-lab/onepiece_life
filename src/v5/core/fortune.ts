// 시련과 기연 (설계 5.3), 고를 수 없는 불행, 고아의 비밀 성씨 (설계 5.4).
// 해가 바뀔 때 불행 → 기연 순으로 한 번씩 굴린다. 기연은 문을 띄우고, 불행은 문 없이 일어난다.
import { SURNAMES } from '../../data/births';
import { chance, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { TURNINGS } from '../data/turnings';
import { checkAll } from './cond';
import { applyFx, fillText } from './fx';
import { needsOk } from './needs';
import { logLine } from './state';
import { openTurning, repeatAllows, resolveDoors } from './turning';
import { topValues } from './values';
import type { Life5, StatKey, Turning } from './types';

/** 이 해에 큰 기연이 올 확률. 어린아이는 0, 아니면 시련에 따라 오르되 상한을 넘지 않는다 */
export function fortuneP(s: Life5): number {
  const F = V.fortune;
  if (s.age < F.minAge) return 0;
  return Math.min(F.capP, F.baseP + s.hardship * F.perHardship);
}

/**
 * 해가 바뀔 때 한 번 부른다. 확률에 걸리면 가장 높은 가치관에 맞는 기연을 띄운다
 * (가치관이 하나도 없으면 아무 기연이나). 올해 멈춘 횟수와는 상관없다.
 * 이미 떠 있는 일이 있으면 덮지 않는다. 띄웠으면 시련이 줄어든다.
 */
export function rollFortune(s: Life5, r: Rng): boolean {
  if (s.pending || !chance(r, fortuneP(s))) return false;
  const top = topValues(s, 1)[0];
  const pool = TURNINGS.filter((t) => t.kind === 'fortune' && (top === undefined || t.fortuneOf === top)
    && checkAll(s, t.when) && needsOk(s, t.needs) && repeatAllows(s, t) && resolveDoors(s, t).some((d) => !d.locked));
  const t = weighted(r, pool, (x) => x.weight);
  if (!t || !openTurning(s, t)) return false;
  s.stats.fortunes += 1;
  s.hardship *= V.hardship.afterFortune;
  return true;
}

/**
 * 해마다 한 번, 조건이 맞는 불행 가운데 하나가 일어날지 판정한다. 각 불행의 가중치가 곧 그 해의 확률이다
 * (한 해에 많아야 하나). 일어나면 무겁게 기록하고 효과를 적용한다. 문은 띄우지 않는다.
 */
export function rollMisfortune(s: Life5, r: Rng): boolean {
  const pool = TURNINGS.filter((t) => t.kind === 'misfortune' && checkAll(s, t.when) && needsOk(s, t.needs) && repeatAllows(s, t));
  let u = r();
  for (const t of pool) {
    u -= t.weight;
    if (u < 0) { strike(s, t); return true; }
  }
  return false;
}

function strike(s: Life5, t: Turning): void {
  s.seen[t.id] = s.age;
  s.seenCount[t.id] = (s.seenCount[t.id] ?? 0) + 1;
  logLine(s, fillText(s, t.body), 'heavy', 'danger');
  s.timeline.push({ age: s.age, text: t.title });
  applyFx(s, t.fx ?? []);
}

/** 숨은 성이 밝혀진다: 성을 되찾고, 그 성씨의 타고난 힘이 한 번 더 깨어난다. 숨은 성이 없으면 아무 일도 없다 */
export function revealSurname(s: Life5): void {
  const h = s.hero;
  const name = h.secretSurname;
  if (!name) return;
  const def = SURNAMES.find((x) => x.kind === 'rare' && x.name === name) ?? SURNAMES.find((x) => x.name === name);
  h.surname = name;
  h.secretSurname = null;
  for (const [k, v] of Object.entries(def?.bonus ?? {}) as [StatKey, number][])
    h.base[k] = Math.max(0, h.base[k] + v * V.surname.revealMult);
  if (!s.flags.includes('surnameKnown')) s.flags.push('surnameKnown');
  logLine(s, `품에 지녀 온 것이 실마리가 되어 잃어버린 성이 밝혀졌다. ${h.name}의 진짜 이름은 「${name} ${h.name}」(이)었다. 잠들어 있던 핏줄의 힘이 깨어난다.`, 'heavy', 'world');
}
