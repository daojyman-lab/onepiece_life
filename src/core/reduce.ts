// 명령 처리와 불변 조건. reduce5는 입력 상태를 바꾸지 않고, apply5는 받은 상태를 그 자리에서 바꾼다.
import { selectTraits } from './traits';
import { V } from '../data/balance';
import { VALUE_IDS } from '../data/values';
import { ackBattle, answerFight } from './fight';
import { answerDoor } from './turning';
import { stepPart } from './year';
import { equipWeapon, selectStyle } from './styles';
import type { Command5, Life5 } from './types';

/**
 * 인생을 복사한다. 기록(log)과 연표(timeline)는 배열만 새로 만들고 줄은 함께 쓴다.
 * 줄은 한 번 넣은 뒤 고치지 않으므로(넣고 앞에서 잘라 낼 뿐) 함께 써도 안전하다. 나머지는 깊이 복사한다.
 */
export function cloneLife(prev: Life5): Life5 {
  const s: Life5 = structuredClone<Life5>({ ...prev, log: [], timeline: [] });
  s.log = prev.log.slice();
  s.timeline = prev.timeline.slice();
  return s;
}

/** 명령을 받은 상태에 그대로 적용한다 (복사하지 않는다) */
export function apply5(s: Life5, cmd: Command5): void {
  switch (cmd.type) {
    case 'style': if (s.hero.alive && !s.pending) selectStyle(s, cmd.style); break;
    case 'equipWeapon': if (s.hero.alive && !s.pending) equipWeapon(s, cmd.id); break;
    case 'traits': selectTraits(s, cmd.ids); break;
    case 'step': if (s.pending === null) stepPart(s); break;
    case 'rest': if (s.pending === null) stepPart(s, 'rest'); break;
    case 'answer': answer(s, cmd.index); break;
  }
}

export function reduce5(prev: Life5, cmd: Command5): Life5 {
  const s = cloneLife(prev);
  apply5(s, cmd);
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

/**
 * 어긴 불변 조건의 목록. 비어 있으면 건강한 상태다.
 * 기본은 명령마다 돌려도 싼 것만 본다(기록은 마지막 두 줄의 차례). full이면 기록 전체의 id를 확인한다.
 */
export function invariants5(s: Life5, full = false): string[] {
  const bad: string[] = [];
  for (const [k, v] of Object.entries(s.hero.base)) if (!Number.isFinite(v) || v < 0) bad.push(`base.${k}=${v}`);
  if (!(s.hero.hp >= 0 && s.hero.hp <= V.hp.max)) bad.push(`hp=${s.hero.hp}`);
  for (const id of VALUE_IDS) {
    const v = s.values[id];
    if (!(v >= 0 && v <= V.value.max)) bad.push(`values.${id}=${v}`);
  }
  const p = s.personality;
  if (!p || !Number.isInteger(p.row) || p.row < 0 || p.row > 2 ||
      !Number.isInteger(p.col) || p.col < 0 || p.col > 2 ||
      !Number.isInteger(p.pullRow) || Math.abs(p.pullRow) >= 3 ||
      !Number.isInteger(p.pullCol) || Math.abs(p.pullCol) >= 3 ||
      !Number.isInteger(p.choices) || p.choices < 0 ||
      !Number.isInteger(p.hold) || p.hold < 0 || p.hold > 3 ||
      typeof p.established !== 'boolean') bad.push('personality');
  if (s.ended && s.pending?.kind !== 'ending') bad.push('ended without ending pending');
  const n = s.log.length;
  if (n && s.log[n - 1].id >= s.seq) bad.push('log id ahead of seq');
  if (n > 1 && s.log[n - 2].id >= s.log[n - 1].id) bad.push('log ids out of order');
  if (full) {
    if (new Set(s.log.map((l) => l.id)).size !== n) bad.push('duplicate log id');
    for (let i = 1; i < n; i++) if (s.log[i - 1].id >= s.log[i].id) { bad.push('log ids out of order'); break; }
  }
  return bad;
}
