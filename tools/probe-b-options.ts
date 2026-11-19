// B등급 도달률 후보 수치의 임시 탐색. 게임 파일을 수정하지 않고 실행 중 균형값만 바꾼다.
import { rngOf } from '../src/core/rng';
import { choose, type Policy } from '../src/v5/core/autoplay';
import { rating5 } from '../src/v5/core/power';
import { apply5 } from '../src/v5/core/reduce';
import { newLife5 } from '../src/v5/core/state';
import { V } from '../src/v5/data/balance';

declare const process: { argv: string[] };
const tune = V as unknown as { growth: { perPart: number; noMasterCap: number; statP: { train: number; study: number; roam: number }; tierCurve: number[] } };
const count = Number(process.argv[2] ?? 100);
const base = {
  perPart: V.growth.perPart,
  noMasterCap: V.growth.noMasterCap,
  train: V.growth.statP.train,
  study: V.growth.statP.study,
  roam: V.growth.statP.roam,
  tierCurve: [...V.growth.tierCurve],
};

function play(seed: number, policy: Policy) {
  const s = newLife5(seed);
  const r = rngOf({ seed: seed ^ 0x5eed, cursor: 0 });
  let max = Math.round(rating5(s));
  let by23 = max;
  for (let step = 0; step < 20000 && s.pending?.kind !== 'ending'; step++) {
    apply5(s, s.pending ? { type: 'answer', index: choose(s, policy, r) } : { type: 'step' });
    if (!s.hero.alive) continue;
    const now = Math.round(rating5(s));
    max = Math.max(max, now);
    if (s.age <= 23) by23 = Math.max(by23, now);
  }
  return { max, by23, stuck: s.pending?.kind !== 'ending' };
}

const variants = [
  { name: 'baseline', set: () => {} },
  { name: 'training', set: () => { tune.growth.perPart = 7; tune.growth.noMasterCap = 4; tune.growth.statP.train = 1; } },
  { name: 'tier-curve', set: () => { tune.growth.tierCurve = [1, 1.3, 1.7, 2.4, 3.1, 4.2, 5.6]; } },
  { name: 'tier-curve-strong', set: () => { tune.growth.tierCurve = [1, 1.7, 2.3, 3.5, 5.0, 6.6, 8.3]; } },
  { name: 'tier-curve-stronger', set: () => { tune.growth.tierCurve = [1, 1.8, 2.5, 3.9, 5.5, 7.2, 9.2]; } },
  { name: 'broad-stats', set: () => { tune.growth.statP.train = 1; tune.growth.statP.study = 0.9; tune.growth.statP.roam = 0.9; } },
];

for (const variant of variants.filter((x) => !process.argv[3] || x.name === process.argv[3])) {
  tune.growth.perPart = base.perPart;
  tune.growth.noMasterCap = base.noMasterCap;
  tune.growth.statP.train = base.train;
  tune.growth.statP.study = base.study;
  tune.growth.statP.roam = base.roam;
  tune.growth.tierCurve = [...base.tierCurve];
  variant.set();
  for (const [name, policy] of [['random', 'random'], ['lean', 'lean']] as const) {
    const runs = Array.from({ length: count }, (_, i) => play(9000 + i, policy));
    const peaks = runs.map((x) => x.max).sort((a, b) => a - b);
    const b = runs.filter((x) => x.max >= 500).length;
    console.log(JSON.stringify({ variant: variant.name, policy: name, n: count,
      B: b, B280: runs.filter((x) => x.max >= 280).length,
      B300: runs.filter((x) => x.max >= 300).length,
      BBy23: runs.filter((x) => x.by23 >= 500).length,
      p70: peaks[Math.floor(peaks.length * 0.7)], p90: peaks[Math.floor(peaks.length * 0.9)],
      max: peaks[peaks.length - 1], stuck: runs.filter((x) => x.stuck).length }));
  }
}
