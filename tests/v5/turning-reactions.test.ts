import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/v5/data/turnings';
import type { Fx } from '../../src/v5/core/types';

// 확률 분기의 모든 길을 따라간다. 전투와 엔딩은 별도 화면이 곧바로 반응한다.
function reactionPaths(fx: Fx[], reacted = false): boolean[] {
  let paths = [reacted];
  for (const op of fx) {
    if (op.op === 'chance') {
      paths = paths.flatMap((seen) => [
        ...reactionPaths(op.then, seen),
        ...reactionPaths(op.else ?? [], seen),
      ]);
    } else if (op.op === 'log' || op.op === 'fight' || op.op === 'die') {
      paths = paths.map(() => true);
    }
  }
  return paths;
}

function narration(fx: Fx[]): string[] {
  return fx.flatMap((op) => op.op === 'log' ? [op.text]
    : op.op === 'chance' ? [...narration(op.then), ...narration(op.else ?? [])] : []);
}

const normalized = (text: string): string => text.trim().replace(/[.!?。]+$/, '');

function chanceGaps(fx: Fx[]): string[] {
  return fx.flatMap((op) => op.op === 'chance'
    ? [...(reactionPaths(op.then).some((reacted) => !reacted) ? ['성공'] : []),
        ...(reactionPaths(op.else ?? []).some((reacted) => !reacted) ? ['실패'] : []),
        ...chanceGaps(op.then), ...chanceGaps(op.else ?? [])] : []);
}

describe('선택 후 장면', () => {
  it('모든 선택과 확률 분기는 성향 문구 외에 즉시 보이는 반응을 남긴다', () => {
    const missing = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      reactionPaths(door.fx).some((reacted) => !reacted) ? [`${turning.id}#${index}: ${door.label}`] : [],
    ));
    expect(missing.slice(0, 30).concat(missing.length > 30 ? [`외 ${missing.length - 30}개`] : [])).toEqual([]);
  });

  it('선택 전에 보인 힌트를 선택 후 장면으로 되풀이하지 않는다', () => {
    const copied = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      narration(door.fx).some((text) => normalized(text) === normalized(door.hint))
        ? [`${turning.id}#${index}: ${door.label}`] : [],
    ));
    expect(copied.slice(0, 30).concat(copied.length > 30 ? [`외 ${copied.length - 30}개`] : [])).toEqual([]);
  });

  it('확률로 갈린 결과마다 각각의 반응을 보여 준다', () => {
    const missing = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      chanceGaps(door.fx).map((branch) => `${turning.id}#${index}: ${branch}`),
    ));
    expect(missing.slice(0, 30).concat(missing.length > 30 ? [`외 ${missing.length - 30}개`] : [])).toEqual([]);
  });

  it('반응 문장에 깨진 글자가 없다', () => {
    const broken = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      narration(door.fx).some((text) => /�|\?{3,}/.test(text)) ? [`${turning.id}#${index}`] : [],
    ));
    expect(broken).toEqual([]);
  });
});
