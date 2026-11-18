import { reach, SPECIAL_DOORS } from '../tests/v5/specialReach';
import { TURNING_BY_ID } from '../src/v5/data/turnings';
declare const process: { argv: string[] };
const tries = Number(process.argv[2] ?? 150);
const t0 = Date.now(); let miss = 0;
const only = process.argv.slice(3);
for (const d of SPECIAL_DOORS.filter((x) => !only.length || only.includes(`${x.turning}#${x.index}`))) {
  const a = Date.now(); const k = reach(d, tries);
  if (k < 0) miss++;
  console.log(`${k < 0 ? '❌' : '✅'} ${d.turning}#${d.index} ${k < 0 ? '-' : k + 1}번째 인생 ${((Date.now() - a) / 1000).toFixed(1)}s  ${TURNING_BY_ID[d.turning].doors[d.index].label}`);
}
console.log(`안 열린 문 ${miss} / ${SPECIAL_DOORS.length}, ${((Date.now() - t0) / 1000).toFixed(0)}초`);
