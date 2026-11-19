// 일반 새 게임을 끝까지 플레이해 특별한 문의 재현 시드와 출생/정책을 찾는다.
import { tryReach } from '../tests/game/specialReach';
import type { HomeId } from '../src/core/types';
declare const process: { argv: string[] };
const only = process.argv.slice(2);

for (const [turning, firstSeed] of [['ep_alabasta_p4', 52000], ['ep_alabasta_p6', 50000]] as const) {
  if (only.length && !only.includes(turning)) continue;
  const start = Number(process.argv[3]) || firstSeed;
  let found = false;
  for (let seed = start; seed < start + 600 && !found; seed++) {
    for (const home of ['water7', 'sky'] as HomeId[]) {
      for (const chase of [false, true]) {
        if (tryReach({ turning, index: 3 }, seed, home, chase)) {
          console.log(JSON.stringify({ turning, index: 3, seed, home, chase }));
          found = true; break;
        }
      }
      if (found) break;
    }
  }
  if (!found) console.log(JSON.stringify({ turning, found: false }));
}
