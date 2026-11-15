// 명령 처리와 불변 조건. 입력 상태는 바꾸지 않는다.
import { V } from '../data/balance';
import { VALUE_IDS } from '../data/values';
import { ackBattle, answerFight } from './fight';
import { answerDoor } from './turning';
import { stepPart } from './year';
import type { Command5, Life5 } from './types';

export function reduce5(prev: Life5, cmd: Command5): Life5 {
  const s = structuredClone(prev);
  switch (cmd.type) {
    case 'step': if (s.pending === null) stepPart(s); break;
    case 'answer': answer(s, cmd.index); break;
  }
  return s;
}

/** 떠 있는 일에 따라 답을 나눈다. 엔딩에서는 아무것도 하지 않는다. */
function answer(s: Life5, index: number): void {
  switch (s.pending?.kind) {
    case 'door': answerDoor(s, index); return;
    case 'fight': answerFight(s, index); return;
    case 'battle': ackBattle(s); return;
  }
}

/** 어긴 불변 조건의 목록. 비어 있으면 건강한 상태다. */
export function invariants5(s: Life5): string[] {
  const bad: string[] = [];
  for (const [k, v] of Object.entries(s.hero.base)) if (!Number.isFinite(v) || v < 0) bad.push(`base.${k}=${v}`);
  if (!(s.hero.hp >= 0 && s.hero.hp <= V.hp.max)) bad.push(`hp=${s.hero.hp}`);
  for (const id of VALUE_IDS) {
    const v = s.values[id];
    if (!(v >= 0 && v <= V.value.max)) bad.push(`values.${id}=${v}`);
  }
  if (s.ended && s.pending?.kind !== 'ending') bad.push('ended without ending pending');
  if (new Set(s.log.map((l) => l.id)).size !== s.log.length) bad.push('duplicate log id');
  return bad;
}
