// 분포 회귀를 시드/정책별로 재현한다. 인원 수를 줄여 먼저 원인을 확인하고 전체 테스트로 확정한다.
import { autoplay5, summarize, type Policy } from '../src/core/autoplay';
import type { Life5, Lineage, Wealth } from '../src/core/types';
declare const process: { argv: string[] };

const n = Math.max(1, Number(process.argv[2]) || 100);
const selected = process.argv.slice(3);
const top = (s: Life5) => Math.max(...Object.values(s.growth.tier));
const average = (lives: Life5[], f: (s: Life5) => number) => lives.reduce((sum, s) => sum + f(s), 0) / lives.length;
function cohort(name: string, seed: number, policy: Policy, birth: { wealth?: Wealth; lineage?: Lineage } = {}) {
  if (selected.length && !selected.includes(name)) return;
  const runs = Array.from({ length: n }, (_, i) => autoplay5(seed + i, policy, birth));
  const lives = runs.map((r) => r.s), report = summarize(lives);
  console.log(JSON.stringify({ name, n, stopped: runs.filter((r) => r.stuck || r.violations.length).length,
    tier: average(lives, top), t4: average(lives, (s) => +(top(s) >= 4)), t6: average(lives, (s) => +(top(s) >= 6)),
    age: average(lives, (s) => s.ended!.age), stops: report.perLife.stops, bands: report.stopsByBand,
    topShare: report.topShare }));
}
cohort('random', 9000, 'random');
cohort('lean', 9000, 'lean');
cohort('ambition', 9000, { value: 'ambition' });
cohort('peace', 9000, { value: 'peace' });
cohort('rich', 20000, { value: 'ambition' }, { wealth: 'noble', lineage: 'commoner' });
cohort('poor', 20000, { value: 'ambition' }, { wealth: 'poor', lineage: 'orphan' });
