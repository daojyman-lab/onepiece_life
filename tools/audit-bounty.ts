// 일반 자동 플레이의 성장 단계별 현상금을 확인한다. 게임 상태나 선택 정책은 바꾸지 않는다.
import { autoplay5 } from '../src/core/autoplay';
import { bountyOf } from '../src/core/bounty';
import { V } from '../src/data/balance';
declare const process: { argv: string[] };
const n = Math.max(1, Number(process.argv[2]) || 100);
const runs = Array.from({ length: n }, (_, i) => autoplay5(9000 + i, 'random'));
const rows = runs.map(({ s }) => ({ tier: Math.max(...Object.values(s.growth.tier)),
  fame: s.hero.fame, previousConversion: s.hero.fame * V.fame.bounty, bounty: bountyOf(s) }));
const quantile = (xs: number[], q: number) => xs.slice().sort((a, b) => a - b)[Math.floor((xs.length - 1) * q)] ?? 0;
console.log(JSON.stringify({ n, stuck: runs.filter(r => r.stuck).length, invalid: runs.filter(r => r.violations.length).length,
  tiers: Array.from({ length: 7 }, (_, tier) => {
    const group = rows.filter(r => r.tier === tier);
    return { tier, n: group.length, previousConversionMedian: quantile(group.map(r => r.previousConversion), 0.5),
      bountyMedian: quantile(group.map(r => r.bounty), 0.5), bountyMax: quantile(group.map(r => r.bounty), 1) };
  }),
}));
