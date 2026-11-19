// 같은 전체 코드에서 첫 코스만 닫은 비교군을 돌려 전역 밸런스와 코스의 영향을 구분한다.
import { choose, type Policy } from '../src/core/autoplay';
import { newLife5 } from '../src/core/state';
import { apply5, invariants5 } from '../src/core/reduce';
import { rngOf } from '../src/shared/core/rng';
import { estimateMinutes } from '../src/app/flow';

function run(seed: number, policy: Policy, disabled: boolean) {
  const s = newLife5(seed);
  if (disabled) s.closed.push('life_course_promise'); // 진단 전용: 코스의 최초 선택만 막는다.
  const r = rngOf({ seed: seed ^ 0x5eed, cursor: 0 });
  for (let i = 0; i < 20000 && s.pending?.kind !== 'ending'; i++) {
    apply5(s, s.pending ? { type: 'answer', index: choose(s, policy, r) } : { type: 'step' });
    if (invariants5(s).length) throw new Error(`invalid life ${seed}`);
  }
  return s;
}
for (const disabled of [false, true]) {
  const lives = Array.from({ length: 40 }, (_, i) => run(9000 + i, 'random', disabled));
  console.log(JSON.stringify({ course: disabled ? 'closed-for-comparison' : 'enabled',
    n: lives.length, entered: lives.filter((s) => s.lifeStory?.events.length).length,
    minutes: lives.reduce((sum, s) => sum + estimateMinutes(s.seq, s.stats.stops), 0) / lives.length,
    stops: lives.reduce((sum, s) => sum + s.stats.stops, 0) / lives.length,
    ended: lives.filter((s) => s.pending?.kind === 'ending').length,
  }));
}
