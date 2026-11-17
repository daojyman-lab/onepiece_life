// Run: node_modules/.bin/vite-node tools/audit-chance-outcomes.ts
import { TURNINGS } from '../src/data/turnings';
import type { Fx } from '../src/core/types';

function hasReaction(fx: Fx[]): boolean {
  let paths = [false];
  for (const op of fx) {
    if (op.op === 'chance') paths = paths.flatMap((seen) => [
      ...reactionPaths(op.then, seen), ...reactionPaths(op.else ?? [], seen),
    ]);
    else if (op.op === 'log' || op.op === 'fight' || op.op === 'die') paths = paths.map(() => true);
  }
  return paths.every(Boolean);
}

function reactionPaths(fx: Fx[], reacted = false): boolean[] {
  let paths = [reacted];
  for (const op of fx) {
    if (op.op === 'chance') paths = paths.flatMap((seen) => [
      ...reactionPaths(op.then, seen), ...reactionPaths(op.else ?? [], seen),
    ]);
    else if (op.op === 'log' || op.op === 'fight' || op.op === 'die') paths = paths.map(() => true);
  }
  return paths;
}

function gaps(fx: Fx[]): string[] {
  return fx.flatMap((op) => op.op === 'chance'
    ? [...(!hasReaction(op.then) ? ['then'] : []), ...(!hasReaction(op.else ?? []) ? ['else'] : []),
        ...gaps(op.then).map((s) => `then/${s}`), ...gaps(op.else ?? []).map((s) => `else/${s}`)]
    : []);
}

const rows = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
  gaps(door.fx).map((branch) => `${turning.id}#${index} ${branch} | ${door.label}`)));
console.log(`${rows.length} chance branches lack their own outcome narration`);
for (const row of rows) console.log(row);
