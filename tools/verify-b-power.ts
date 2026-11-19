// 실제 자동 플레이 중 화면 표시용 전투 등급이 B 이상에 도달하는지 측정한다.
// 실행: npx vite-node tools/verify-b-power.ts [정책별 인생 수]
import { rngOf } from '../src/core/rng';
import { choose, type Policy } from '../src/v5/core/autoplay';
import { rating5, topTier } from '../src/v5/core/power';
import { apply5 } from '../src/v5/core/reduce';
import { newLife5 } from '../src/v5/core/state';

declare const process: { argv: string[] };
const count = Number(process.argv[2] ?? 100);
const thresholds = { B: 500, A: 770, S: 1500, SS: 2600, SSS: 5700 } as const;
const policies: { name: string; choice: Policy }[] = [
  { name: 'random', choice: 'random' },
  { name: 'lean', choice: 'lean' },
  { name: 'ambition', choice: { value: 'ambition' } },
];

function play(seed: number, policy: Policy) {
  const s = newLife5(seed);
  const r = rngOf({ seed: seed ^ 0x5eed, cursor: 0 });
  let max = Math.round(rating5(s));
  let maxAt = s.age;
  let firstB: number | null = null;
  let maxBy23 = max;
  let maxBy35 = max;
  for (let step = 0; step < 20000 && s.pending?.kind !== 'ending'; step++) {
    apply5(s, s.pending ? { type: 'answer', index: choose(s, policy, r) } : { type: 'step' });
    if (!s.hero.alive) continue;
    const now = Math.round(rating5(s));
    if (now > max) { max = now; maxAt = s.age; }
    if (s.age <= 23) maxBy23 = Math.max(maxBy23, now);
    if (s.age <= 35) maxBy35 = Math.max(maxBy35, now);
    if (firstB === null && now >= thresholds.B) firstB = s.age;
  }
  return { seed, max, maxAt, maxBy23, maxBy35, firstB, final: Math.round(rating5(s)), tier: topTier(s), age: s.ended?.age ?? s.age,
    fights: s.stats.fights, wins: s.stats.wins, stuck: s.pending?.kind !== 'ending' };
}

for (const { name, choice } of policies) {
  const runs = Array.from({ length: count }, (_, i) => play(9000 + i, choice));
  const ranked = [...runs].sort((a, b) => b.max - a.max);
  const byGrade = Object.fromEntries(Object.entries(thresholds).map(([grade, min]) =>
    [grade, runs.filter((x) => x.max >= min).length]));
  const firstBAges = runs.flatMap((x) => x.firstB === null ? [] : [x.firstB]).sort((a, b) => a - b);
  console.log(JSON.stringify({ policy: name, lives: count, reached: byGrade,
    BBy23: runs.filter((x) => x.maxBy23 >= thresholds.B).length,
    BBy35: runs.filter((x) => x.maxBy35 >= thresholds.B).length,
    highestBy23: Math.max(...runs.map((x) => x.maxBy23)),
    fights: runs.reduce((total, run) => total + run.fights, 0),
    wins: runs.reduce((total, run) => total + run.wins, 0),
    finalBOrAbove: runs.filter((x) => x.final >= thresholds.B).length,
    medianFirstBAge: firstBAges.length ? firstBAges[Math.floor(firstBAges.length / 2)] : null,
    highest: ranked.slice(0, 3).map(({ seed, max, maxAt, tier }) => ({ seed, power: Math.round(max), age: maxAt, tier })),
    stuck: runs.filter((x) => x.stuck).length }));
  if (runs.some((x) => x.stuck)) throw new Error(`${name}: 끝나지 않은 인생이 있다`);
  if (!runs.some((x) => x.max >= thresholds.B)) throw new Error(`${name}: B등급에 도달한 인생이 없다`);
  if (count >= 100 && byGrade.B / count < 0.30) throw new Error(`${name}: B 이상 ${byGrade.B}/${count}, 목표 30% 미달`);
}
