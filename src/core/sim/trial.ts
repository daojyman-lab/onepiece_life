// 스승의 시험 임무와 약속.
// 시험(몇 달 이야기 → 1대1 전투)을 통과하면 아래 단계를 1.5배 기간 수련하고,
// 그 단계를 열고 스승의 조건을 채우면 스승이 약속대로 다시 찾아와 원래 단계를 가르친다.
import { MASTER_BY_ID } from '../../data/masters';
import { GATE_NAMES } from '../../data/skills';
import { TRIAL_TEACH_MONTHS, trialOf } from '../../data/masterTrials';
import { applyEffects } from '../effects';
import type { BranchId, LifeState } from '../types';
import { log, timeline } from '../util';
import { sideEnemy } from '../world/world';

export function startTrial(s: LifeState, master: string, branch: BranchId, gate: string, next: string) {
  const m = MASTER_BY_ID[master];
  const t = trialOf(master);
  s.world.trial = { master, branch, gate, next, months: t.story.length + 1, step: 0 };
  log(s, `${m?.name ?? '스승'}: ${t.order}`, 'choice');
  timeline(s, `${m?.name ?? '스승'}에게서 시험을 받았다: ${t.short}`);
}

/** 시험 중이면 한 달 나아간다. 시험 중이면 true (그동안 임무는 쉰다) */
export function trialTick(s: LifeState): boolean {
  const tr = s.world.trial;
  if (!tr || s.pending) return !!tr;
  const t = trialOf(tr.master);
  tr.months -= 1;
  if (tr.months > 0) {
    const line = t.story[tr.step] ?? t.story[t.story.length - 1];
    tr.step += 1;
    log(s, `[시험] ${line}`, 'world');
    return true;
  }
  // 마지막 달: 1대1 시험 전투
  const enemy = sideEnemy(s, `trial_${tr.master}`, s.rng.cursor, t.foe);
  log(s, `[시험] ${t.foe.name}이(가) 앞을 막았다. 스승의 시험이다.`, 'battle');
  s.pending = {
    kind: 'prep',
    encounter: {
      source: 'choice', enemy, elite: true, lethal: false, spar: false, atSea: false, solo: true,
      reward: [{ op: 'trialDone', ok: true }],
      onLose: [{ op: 'trialDone', ok: false }],
    },
  };
  return true;
}

export function trialDone(s: LifeState, ok: boolean) {
  const tr = s.world.trial;
  if (!tr) return;
  s.world.trial = undefined;
  const m = MASTER_BY_ID[tr.master];
  const name = m?.name ?? '스승';
  if (!ok) {
    log(s, `시험에 실패했다. ${name}은(는) "더 강해져서 다시 오너라"라며 등을 돌렸다.`, 'danger');
    return;
  }
  log(s, `${name}: ${trialOf(tr.master).clear}`, 'good');
  timeline(s, `${name}의 시험을 통과했다`);
  // 아래 단계 수련 (보통의 1.5배), 그리고 원래 단계를 가르치러 다시 오겠다는 약속
  applyEffects(s, [{ op: 'apprentice', master: tr.master, branch: tr.branch, gate: tr.gate, months: TRIAL_TEACH_MONTHS, fee: 0 }]);
  s.world.masterPromise = { master: tr.master, gate: tr.next };
  log(s, `"${GATE_NAMES[tr.gate]}을(를) 익히고 준비가 되면, ${GATE_NAMES[tr.next]}을(를) 가르치러 다시 오마."`, 'growth');
}
