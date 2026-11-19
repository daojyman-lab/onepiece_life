// 자동 플레이와 요약 (설계 7장의 시뮬레이터가 쓴다). 순수 함수다: 시각도 Math.random도 쓰지 않는다.
// 정책이 고를 때 쓰는 난수는 인생의 난수(s.rng)와 따로 둔다. 그래야 고르는 방식이 인생의 주사위를 흐트러뜨리지 않는다.
import { chance, pick, rngOf, type Rng } from '../shared/core/rng';
import { turningOf } from './turning';
import { BACK_OFF, ENGAGE } from './fight';
import { apply5, invariants5 } from './reduce';
import { newLife5 } from './state';
import { leanPick, topValues } from './values';
import { VALUE_IDS } from '../data/values';
import type { HomeId, Life5, Lineage, ValueId, Wealth } from './types';

/**
 * random 열린 문 가운데 고르게, first 첫 번째 열린 문, value 그 가치관을 올리는 문을 먼저,
 * lean 사람처럼: 열린 문마다 V.value.leanBase + Σ(그 문의 가치관 점수 × 지금 내 점수)의 가중치로 뽑는다. 싸움은 반반.
 */
export type Policy = 'random' | 'first' | 'lean' | { value: ValueId };

const MAX_STEPS = 20000;
/** 정책의 난수 씨앗을 인생의 씨앗과 갈라놓는 수 */
const POLICY_SALT = 0x5eed;
const FIGHTERS: readonly ValueId[] = ['dominion', 'ambition'];

/** 떠 있는 일에 정책이 내놓는 답 */
export function choose(s: Life5, policy: Policy, r: Rng): number {
  const p = s.pending;
  if (p?.kind === 'door') {
    const open = p.doors.map((d, i) => (d.locked ? -1 : i)).filter((i) => i >= 0);
    if (policy === 'first') return open[0];
    if (policy === 'random') return pick(r, open);
    const doors = turningOf(p.turning)?.doors;
    if (policy === 'lean') return leanPick(s, r, open, (i) => doors?.[i]?.values ?? {}) ?? pick(r, open);
    const gain = (i: number) => doors?.[i]?.values?.[policy.value] ?? 0;
    const best = Math.max(...open.map(gain));
    return pick(r, best > 0 ? open.filter((i) => gain(i) === best) : open);
  }
  if (p?.kind === 'fight') {
    if (policy === 'first') return ENGAGE;
    if (typeof policy === 'object') {
      if (FIGHTERS.includes(policy.value)) return ENGAGE;
      if (policy.value === 'peace') return BACK_OFF;
    }
    return chance(r, 0.5) ? ENGAGE : BACK_OFF;
  }
  return 0;                                    // battle: 어떤 답이든 결과를 받아들인다
}

/**
 * 한 인생을 끝까지 자동으로 돌린다. opt의 집안 형편 · 핏줄은 출생 주사위에 넘겨 정해 둔다 (돈 · 시련 · 성씨가 그에 맞는다).
 * MAX_STEPS 안에 엔딩에 닿지 못하면 stuck. 명령마다 불변 조건을 확인해 어긴 것을 모은다.
 */
export function autoplay5(seed: number, policy: Policy = 'random', opt: { wealth?: Wealth; lineage?: Lineage; home?: HomeId } = {}):
  { s: Life5; stuck: boolean; violations: string[] } {
  const s = newLife5(seed, opt);
  const r = rngOf({ seed: seed ^ POLICY_SALT, cursor: 0 });
  const violations: string[] = [];
  for (let i = 0; i < MAX_STEPS; i++) {
    if (s.pending?.kind === 'ending') return { s, stuck: false, violations };
    apply5(s, s.pending ? { type: 'answer', index: choose(s, policy, r) } : { type: 'step' });   // 이 상태는 autoplay5의 것이다
    for (const v of invariants5(s)) if (violations.length < 20) violations.push(`${s.age}살: ${v}`);
  }
  return { s, stuck: s.pending?.kind !== 'ending', violations };
}

const pct = (xs: number[], q: number) => (xs.length ? xs[Math.floor((xs.length - 1) * q)] : 0);
const count = <K extends string>(keys: K[]) => {
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = (out[k] ?? 0) + 1;
  return out;
};
const topTier = (s: Life5) => Math.max(...Object.values(s.growth.tier));
/** 병 · 사고(난파) · 굶주림으로 젊어서 죽었다고 세는 나이 (tests/game/risk.test.ts와 같은 잣대) */
const YOUNG_AGE = 40;
export const RISK_CAUSES: readonly string[] = ['병', '난파', '굶주림'];

export interface Report {
  n: number;
  ages: { p10: number; p50: number; p90: number };
  causes: Record<string, number>;
  standings: Record<string, number>;
  topValue: Record<string, number>;
  perLife: { stops: number; fights: number; fortunes: number };
  noFortune: number;                           // 기연이 한 번도 없는 인생의 비율
  /** 집안 형편별(인생이 끝날 때의 형편) 인생 수, 4단계 · 6단계에 닿은 비율 */
  tierByWealth: Record<string, { n: number; t4: number; t6: number }>;
  limbLost: number;                            // 신체를 잃은 인생의 비율
  limbLived10: number;                         // 그중 잃은 뒤 열 해 넘게 산 비율
  youngRiskDeath: number;                      // 40세 전에 병 · 사고 · 굶주림으로 죽은 비율
  /** 이름 있는 상대와의 싸움: 모두 합한 수와 이긴 비율, 상대의 바다별 */
  named: { fights: number; winRate: number; bySea: Record<string, { fights: number; winRate: number }> };
  stopsByBand: { kid: number; youth: number; later: number };   // 한 해의 멈춤: 3~15살, 16~35살, 36살 이후
  maxSeen: { p50: number; p95: number; max: number };            // 한 인생에서 같은 전환점이 가장 많이 열린 횟수
  distinct: number;                                              // 한 인생에 열린 서로 다른 전환점의 평균
  emptyPool: number;                                             // 멈추려 했는데 띄울 전환점이 없던 비율
  namedLives: number;                                            // 이름 있는 상대와 한 번이라도 마주친 인생의 비율
  ruined: number;                                                // 가난하지 않게 태어난 인생 가운데 집안이 몰락한 비율
  topShare: Record<ValueId, number>;                             // 1위 가치관의 비율
  quietYears: number;                                            // 16살 이후 멈춤이 한 번도 없던 해의 비율
}

/** 나이대 [lo, hi]. 인생이 끝난 나이까지(그 해도 넣어) 센다 */
const BANDS = { kid: [3, 15], youth: [16, 35], later: [36, Infinity] } as const;
const WEALTH_ORDER: readonly Wealth[] = ['poor', 'common', 'comfortable', 'noble'];
const endAge = (s: Life5) => s.ended?.age ?? s.age;
const yearsIn = (s: Life5, lo: number, hi: number) => Math.max(0, Math.min(hi, endAge(s)) - lo + 1);

function stopsByBandOf(lives: Life5[]): Report['stopsByBand'] {
  const out = { kid: 0, youth: 0, later: 0 };
  for (const k of Object.keys(BANDS) as (keyof typeof BANDS)[]) {
    const [lo, hi] = BANDS[k];
    let stops = 0, years = 0;
    for (const s of lives) {
      years += yearsIn(s, lo, hi);
      for (const a of s.stats.stopsAt) if (a >= lo && a <= hi) stops += 1;
    }
    out[k] = stops / Math.max(1, years);
  }
  return out;
}

function quietYearsOf(lives: Life5[]): number {
  const lo = BANDS.youth[0];
  let quiet = 0, years = 0;
  for (const s of lives) {
    const y = yearsIn(s, lo, Infinity);
    years += y;
    quiet += y - new Set(s.stats.stopsAt.filter((a) => a >= lo)).size;
  }
  return quiet / Math.max(1, years);
}

function namedOf(lives: Life5[]): Report['named'] {
  const by: Record<string, { fights: number; wins: number }> = {};
  for (const s of lives) for (const [sea, x] of Object.entries(s.stats.named)) {
    const b = (by[sea] ??= { fights: 0, wins: 0 });
    b.fights += x.fights; b.wins += x.wins;
  }
  const all = Object.values(by).reduce((a, x) => ({ fights: a.fights + x.fights, wins: a.wins + x.wins }), { fights: 0, wins: 0 });
  const rate = (x: { fights: number; wins: number }) => x.wins / Math.max(1, x.fights);
  return {
    fights: all.fights, winRate: rate(all),
    bySea: Object.fromEntries(Object.entries(by).map(([k, x]) => [k, { fights: x.fights, winRate: rate(x) }])),
  };
}

/** 끝난 인생들의 지표 (설계 7장) */
export function summarize(lives: Life5[]): Report {
  const n = Math.max(1, lives.length);
  const avg = (f: (s: Life5) => number) => lives.reduce((a, s) => a + f(s), 0) / n;
  const ages = lives.map((s) => s.ended?.age ?? s.age).sort((a, b) => a - b);
  const tierByWealth: Report['tierByWealth'] = {};
  for (const s of lives) {
    const w = (tierByWealth[s.hero.wealth] ??= { n: 0, t4: 0, t6: 0 });
    w.n += 1;
    if (topTier(s) >= 4) w.t4 += 1;
    if (topTier(s) >= 6) w.t6 += 1;
  }
  for (const w of Object.values(tierByWealth)) { w.t4 /= w.n; w.t6 /= w.n; }
  const lost = lives.filter((s) => s.stats.limbsLost > 0);
  const lostAt = (s: Life5) => s.timeline.find((t) => /잃었다/.test(t.text))?.age ?? 0;
  const maxSeen = lives.map((s) => Math.max(0, ...Object.values(s.seenCount))).sort((a, b) => a - b);
  const notPoor = lives.filter((s) => s.hero.bornWealth !== 'poor');
  const tops = lives.map((s) => topValues(s, 1)[0]);
  const sum = (f: (s: Life5) => number) => lives.reduce((a, s) => a + f(s), 0);
  return {
    n: lives.length,
    ages: { p10: pct(ages, 0.1), p50: pct(ages, 0.5), p90: pct(ages, 0.9) },
    causes: count(lives.map((s) => s.ended?.cause ?? '없음')),
    standings: count(lives.map((s) => s.hero.standing)),
    topValue: count(lives.map((s) => topValues(s, 1)[0] ?? '없음')),
    perLife: { stops: avg((s) => s.stats.stops), fights: avg((s) => s.stats.fights), fortunes: avg((s) => s.stats.fortunes) },
    noFortune: lives.filter((s) => s.stats.fortunes === 0).length / n,
    tierByWealth,
    limbLost: lost.length / n,
    limbLived10: lost.filter((s) => (s.ended?.age ?? s.age) - lostAt(s) > 10).length / Math.max(1, lost.length),
    youngRiskDeath: lives.filter((s) => s.ended && s.ended.age < YOUNG_AGE && RISK_CAUSES.includes(s.ended.cause)).length / n,
    named: namedOf(lives),
    stopsByBand: stopsByBandOf(lives),
    maxSeen: { p50: pct(maxSeen, 0.5), p95: pct(maxSeen, 0.95), max: maxSeen[maxSeen.length - 1] ?? 0 },
    distinct: avg((s) => Object.values(s.seenCount).filter((c) => c > 0).length),
    emptyPool: sum((s) => s.stats.emptyStops) / Math.max(1, sum((s) => s.stats.stopTries)),
    namedLives: lives.filter((s) => s.stats.namedMet > 0).length / n,
    ruined: notPoor.filter((s) => WEALTH_ORDER.indexOf(s.hero.wealth) < WEALTH_ORDER.indexOf(s.hero.bornWealth)).length
      / Math.max(1, notPoor.length),
    topShare: Object.fromEntries(VALUE_IDS.map((id) => [id, tops.filter((t) => t === id).length / n])) as Record<ValueId, number>,
    quietYears: quietYearsOf(lives),
  };
}
