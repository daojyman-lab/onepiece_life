import { playLifeCourse } from './life-course-policy';
import { lifeStoryAnswer } from '../src/core/life-story';
import { newLife5 } from '../src/core/state';
declare const process: { argv: string[] };

const seed = Number(process.argv[2]) || 16;
if (process.argv.includes('--find')) {
  console.log(Array.from({ length: 150 }, (_, i) => i + 1).filter((n) => newLife5(n, { home: 'loguetown' }).hero.town === '로그타운'));
} else for (const mode of ['guard', 'duel', 'evidence'] as const) {
  const s = playLifeCourse(seed, mode);
  console.log(JSON.stringify({ seed, mode, town: s.hero.town, age: s.age, alive: s.hero.alive,
    sword: s.growth.tier.sword, fights: s.stats.fights, events: s.lifeStory?.events,
    ending: lifeStoryAnswer(s) }, null, 2));
}
