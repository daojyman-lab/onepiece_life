// Run: node_modules/.bin/vite-node tools/audit-turning-copy.ts
import { TURNINGS } from '../src/data/turnings';
import type { Fx } from '../src/core/types';

function logs(fx: Fx[]): string[] {
  return fx.flatMap((op) => op.op === 'log' ? [op.text]
    : op.op === 'chance' ? [...logs(op.then), ...logs(op.else ?? [])] : []);
}

const same = (a: string, b: string): boolean => a.trim().replace(/[.!?。]+$/, '') === b.trim().replace(/[.!?。]+$/, '');
const copied = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
  logs(door.fx).some((text) => same(text, door.hint))
    ? [`${turning.id}#${index} | ${door.hint}`] : []));
console.log(`${copied.length} choices repeat their pre-choice hint as narration`);
for (const row of copied) console.log(row);
