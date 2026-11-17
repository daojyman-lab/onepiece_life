// Run: node_modules/.bin/vite-node tools/audit-turning-reactions.ts [id-prefix]
import { TURNINGS } from '../src/v5/data/turnings';
import type { Fx } from '../src/v5/core/types';
declare const process: { argv: string[] };

function narratedPaths(fx: Fx[], narrated = false): boolean[] {
  let paths = [narrated];
  for (const op of fx) {
    if (op.op === 'chance') paths = paths.flatMap((seen) => [
      ...narratedPaths(op.then, seen), ...narratedPaths(op.else ?? [], seen),
    ]);
    else if (op.op === 'log' || op.op === 'fight' || op.op === 'die') paths = paths.map(() => true);
  }
  return paths;
}

const prefix = process.argv[2] ?? '';
const turnings = TURNINGS.filter((turning) => turning.id.startsWith(prefix));
const rows = turnings.flatMap((turning) =>
  turning.doors.flatMap((door, index) => narratedPaths(door.fx).some((done) => !done)
    ? [`${turning.id}#${index} | ${turning.title} | ${door.label} | ${door.hint}`] : []),
);
console.log(`${prefix || 'all'}: ${rows.length} / ${turnings.reduce((sum, turning) => sum + turning.doors.length, 0)} choices need an immediate reaction`);
for (const row of rows) console.log(row);
