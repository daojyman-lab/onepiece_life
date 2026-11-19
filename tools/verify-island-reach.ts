// 실제 자동 플레이에서 주요 6섬 장편의 발견률과 강제 도착 시 진입/완주를 확인한다.
// 실행: npx vite-node tools/verify-island-reach.ts [인생 수]
import { autoplay5 } from '../src/v5/core/autoplay';
import { apply5 } from '../src/v5/core/reduce';
import { checkAll } from '../src/v5/core/cond';
import { newLife5 } from '../src/v5/core/state';
import { openTurning } from '../src/v5/core/turning';
import { TURNING_BY_ID } from '../src/v5/data/turnings';
import type { Life5, SeaId } from '../src/v5/core/types';

declare const process: { argv: string[] };
const pendingOf = (s: Life5): Life5['pending'] => s.pending;

const episodes = [
  { island: '로그타운', sea: 'east', age: 30, entry: 'ep_loguetown_c1', done: 'ep_loguetown_post_done', prefix: 'ep_loguetown_' },
  { island: '알라바스타 왕국', sea: 'gl_first', age: 30, entry: 'ep_alabasta_a1', done: 'ep_alabasta_post_done', prefix: 'ep_alabasta_' },
  { island: '스카이피아', sea: 'gl_first', age: 30, entry: 'ep_skypiea_a1', done: 'ep_skypiea_after_done', prefix: 'ep_skypiea_' },
  { island: '어인섬', sea: 'sabaody', age: 30, entry: 'ep_fishman_a_1', done: 'ep_fishman_a_done', prefix: 'ep_fishman_' },
  { island: '드레스로자', sea: 'nw_first', age: 30, entry: 'ep_dressrosa_c1', done: 'ep_dressrosa_c_done', prefix: 'ep_dressrosa_' },
  { island: '와노쿠니', sea: 'nw_late', age: 30, entry: 'ep_wano_after_1', done: 'ep_wano_done', prefix: 'ep_wano_' },
] as const;

const count = Number(process.argv[2] ?? 100);
const entryIds = episodes.map((x) => x.prefix);
for (const policy of ['random', 'lean'] as const) {
  const runs = Array.from({ length: count }, (_, i) => autoplay5(9000 + i, policy));
  const any = runs.filter(({ s }) => Object.keys(s.seenCount).some((id) => entryIds.some((p) => id.startsWith(p))));
  const islandCount = (s: Life5) => episodes.filter((x) => Object.keys(s.seenCount).some((id) => id.startsWith(x.prefix))).length;
  const byIsland = episodes.map((x) => ({ island: x.island,
    episode: runs.filter(({ s }) => Object.keys(s.seenCount).some((id) => id.startsWith(x.prefix))).length,
    afterEntry: runs.filter(({ s }) => !!s.seenCount[x.entry]).length,
  }));
  console.log(JSON.stringify({ policy, lives: count, anyEpisode: any.length,
    nonLogEpisode: runs.filter(({ s }) => episodes.slice(1).some((x) => Object.keys(s.seenCount).some((id) => id.startsWith(x.prefix)))).length,
    twoOrMore: runs.filter(({ s }) => islandCount(s) >= 2).length,
    allSix: runs.filter(({ s }) => islandCount(s) === 6).length,
    stuck: runs.filter((x) => x.stuck).length,
    byIsland }));
  if (runs.some((x) => x.stuck)) throw new Error(`${policy}: 끝나지 않은 인생이 있다`);
  if (count >= 100 && byIsland.some((x) => x.episode === 0)) throw new Error(`${policy}: 전혀 등장하지 않은 주요 섬이 있다`);
}

for (const x of episodes) {
  const s: Life5 = newLife5(42);
  s.pending = null;
  s.age = x.age;
  s.hero.sea = x.sea as SeaId;
  s.hero.island = x.island;
  s.hero.standing = 'pirate';
  const t = TURNING_BY_ID[x.entry];
  const eligible = !!t && checkAll(s, t.when);
  const opened = !!t && eligible && openTurning(s, t);
  let steps = 0;
  if (opened) while (!s.flags.includes(x.done) && steps < 60 && s.hero.alive) {
    const p = pendingOf(s);
    if (!p) apply5(s, { type: 'step' });
    else if (p.kind === 'door') {
      const scene = TURNING_BY_ID[p.turning];
      const safe = p.doors.findIndex((d, i) => !d.locked && !scene?.doors[i].fx?.some((e) => e.op === 'fight'));
      const first = p.doors.findIndex((d) => !d.locked);
      apply5(s, { type: 'answer', index: safe >= 0 ? safe : first });
    } else apply5(s, { type: 'answer', index: 0 });
    steps++;
  }
  console.log(JSON.stringify({ forced: x.island, eligible, opened, finished: s.flags.includes(x.done), steps,
    seenScenes: Object.keys(s.seenCount).filter((id) => id.startsWith(x.prefix)).length,
    lastPending: pendingOf(s)?.kind === 'door' ? (pendingOf(s) as Extract<Life5['pending'], { kind: 'door' }>).turning : pendingOf(s)?.kind ?? null }));
  if (!eligible || !opened || !s.flags.includes(x.done)) throw new Error(`${x.island} 후일담 진입 또는 완주 실패`);
}
