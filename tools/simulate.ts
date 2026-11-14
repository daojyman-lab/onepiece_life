// 인생 N번을 돌려 지표를 뽑는다. 사용: npm run simulate -- 300 smart
import { autoplay } from '../src/core/autoplay';

declare const process: { argv: string[] };
import { FRUIT_BY_ID } from '../src/data/fruits';

const N = Number(process.argv[2] ?? 200);
const policy = (process.argv[3] ?? 'random') as 'random' | 'smart';
const t0 = Date.now();
const ages: number[] = [];
const stages: Record<number, number> = {};
const causes: Record<string, number> = {};
const routes: Record<string, number> = {};
let pauses = 0, lifeEv = 0, autoE = 0, yrs = 0;
let stuck = 0, viol = 0, fruitEaters = 0, fruitStageSum = 0, noFruitStageSum = 0, choices = 0, elite = 0, eliteWin = 0;
const examples: string[] = [];
for (let i = 0; i < N; i++) {
  const res = autoplay(1000 + i, policy);
  const s = res.s;
  if (res.stuck) { stuck++; if (examples.length < 5) examples.push(`seed ${1000 + i}: 멈춤 at ${s.hero.age}세 pending=${s.pending?.kind}`); }
  if (res.violations.length) { viol++; if (examples.length < 5) examples.push(`seed ${1000 + i}: ${res.violations[0]}`); }
  ages.push(s.hero.age);
  stages[s.stats.maxStage] = (stages[s.stats.maxStage] ?? 0) + 1;
  const c = s.ended?.cause.replace(/.+과\(와\)의 싸움/, '강적전') ?? '없음';
  causes[c] = (causes[c] ?? 0) + 1;
  routes[s.hero.route] = (routes[s.hero.route] ?? 0) + 1;
  if (s.hero.fruit) { fruitEaters++; fruitStageSum += s.stats.maxStage; } else noFruitStageSum += s.stats.maxStage;
  choices += s.stats.choices;
  pauses += s.stats.pauses ?? 0; lifeEv += s.stats.lifeEvents ?? 0; autoE += s.stats.autoElite ?? 0; yrs += Math.max(1, s.hero.age - 10);
  elite += s.stats.eliteWins + s.stats.eliteLosses; eliteWin += s.stats.eliteWins;
  void FRUIT_BY_ID;
}
ages.sort((a, b) => a - b);
const pct = (q: number) => ages[Math.floor((ages.length - 1) * q)];
console.log(`인생 ${N}번 (${policy}) — ${((Date.now() - t0) / 1000).toFixed(1)}초`);
console.log(`멈춤 ${stuck}, 불변 조건 위반 ${viol}`);
console.log(`끝난 나이: 10%=${pct(0.1)} 중앙=${pct(0.5)} 90%=${pct(0.9)}`);
console.log('도달 해역:', stages);
console.log('사인:', causes);
console.log('길:', routes);
console.log(`열매 먹은 비율 ${(fruitEaters / N * 100).toFixed(0)}%, 평균 해역 (먹음 ${(fruitStageSum / Math.max(1, fruitEaters)).toFixed(2)} / 안 먹음 ${(noFruitStageSum / Math.max(1, N - fruitEaters)).toFixed(2)})`);
console.log(`인생당 선택 ${(choices / N).toFixed(0)}번, 강적전 ${(elite / N).toFixed(1)}번 (승률 ${(eliteWin / Math.max(1, elite) * 100).toFixed(0)}%)`);
console.log(`10세 이후 한 해에: 멈춤 ${(pauses / yrs).toFixed(2)}번, 작은 사건 ${(lifeEv / yrs).toFixed(1)}번 · 자동 처리한 임무 강적 인생당 ${(autoE / N).toFixed(1)}번`);
for (const e of examples) console.log(' ', e);
