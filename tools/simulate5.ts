// v5 인생 N번을 돌려 설계 7장의 지표를 뽑는다. 사용: npm run simulate5 -- 2000 random
// 정책: random | first | 가치관 id(예: ambition). 시드는 9000부터 (tests/v5/sim.test.ts와 같다).
import { autoplay5, summarize, type Policy } from '../src/v5/core/autoplay';
import { VALUE_IDS } from '../src/v5/data/values';
import type { Life5, ValueId } from '../src/v5/core/types';

declare const process: { argv: string[] };

const N = Number(process.argv[2] ?? 2000);
const arg = process.argv[3] ?? 'random';
const policy: Policy = arg === 'random' || arg === 'first' ? arg : { value: arg as ValueId };
if (typeof policy === 'object' && !VALUE_IDS.includes(policy.value)) throw new Error(`모르는 정책: ${arg}`);
const SEED = 9000;
const COHORT = Math.min(400, N);               // 집안 형편을 고정한 비교 (sim.test.ts와 같은 시드 20000~)

const t0 = Date.now();
const runs = Array.from({ length: N }, (_, i) => autoplay5(SEED + i, policy));
const lives = runs.map((r) => r.s);
const rep = summarize(lives);
const sec = (Date.now() - t0) / 1000;

const pc = (x: number) => `${(x * 100).toFixed(1)}%`;
const sorted = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
const topTier = (s: Life5) => Math.max(...Object.values(s.growth.tier));
const rate = (xs: Life5[], f: (s: Life5) => boolean) => xs.filter(f).length / Math.max(1, xs.length);

console.log(`인생 ${N}번 (${arg}) — ${sec.toFixed(1)}초`);
console.log(`멈춘 인생 ${runs.filter((r) => r.stuck).length}, 불변 조건 위반 ${runs.filter((r) => r.violations.length).length}`);
for (const r of runs.filter((x) => x.violations.length).slice(0, 3)) console.log(`  seed ${r.s.rng.seed}: ${r.violations[0]}`);
console.log(`끝난 나이: 10%=${rep.ages.p10} 중앙=${rep.ages.p50} 90%=${rep.ages.p90}`);
console.log('사인:', sorted(rep.causes));
console.log('처지:', sorted(rep.standings));
console.log('가장 높은 가치관:', sorted(rep.topValue));
console.log(`한 인생에: 멈춤 ${rep.perLife.stops.toFixed(1)}번, 싸움 ${rep.perLife.fights.toFixed(1)}번, 기연 ${rep.perLife.fortunes.toFixed(2)}번 (기연 없는 인생 ${pc(rep.noFortune)})`);
console.log('집안 형편(끝)별 4단계 · 6단계 도달률:');
for (const [w, x] of Object.entries(rep.tierByWealth)) console.log(`  ${w.padEnd(12)} ${String(x.n).padStart(5)}명  4단계 ${pc(x.t4)}  6단계 ${pc(x.t6)}`);
console.log(`신체를 잃은 인생 ${pc(rep.limbLost)} (그중 열 해 넘게 더 산 인생 ${pc(rep.limbLived10)})`);
console.log(`40세 전 병 · 사고 · 굶주림 사망 ${pc(rep.youngRiskDeath)}`);

const t1 = Date.now();
const cohort = (wealth: 'noble' | 'poor', lineage: 'commoner' | 'orphan') =>
  Array.from({ length: COHORT }, (_, i) => autoplay5(20000 + i, { value: 'ambition' }, { wealth, lineage }).s);
const rich = cohort('noble', 'commoner'), poor = cohort('poor', 'orphan');
console.log(`야망 정책, 집안 고정 ${COHORT}명씩 — ${((Date.now() - t1) / 1000).toFixed(1)}초`);
console.log(`  이름난 집안 · 평민  4단계 ${pc(rate(rich, (s) => topTier(s) >= 4))}  6단계 ${pc(rate(rich, (s) => topTier(s) >= 6))}`);
console.log(`  가난한 집 · 고아    4단계 ${pc(rate(poor, (s) => topTier(s) >= 4))}  6단계 ${pc(rate(poor, (s) => topTier(s) >= 6))}`);
const m = Math.min(150, N);
const amb = Array.from({ length: m }, (_, i) => autoplay5(SEED + i, { value: 'ambition' }).s);
const pea = Array.from({ length: m }, (_, i) => autoplay5(SEED + i, { value: 'peace' }).s);
const avg = (xs: Life5[], f: (s: Life5) => number) => xs.reduce((a, s) => a + f(s), 0) / Math.max(1, xs.length);
console.log(`같은 출생 ${m}명: 야망 평균 최고 단계 ${avg(amb, topTier).toFixed(2)} · 끝난 나이 ${avg(amb, (s) => s.ended?.age ?? s.age).toFixed(1)}`
  + ` / 평온 ${avg(pea, topTier).toFixed(2)} · ${avg(pea, (s) => s.ended?.age ?? s.age).toFixed(1)}`);
