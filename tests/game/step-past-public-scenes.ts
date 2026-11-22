import { apply5 } from '../../src/core/reduce';
import type { Life5 } from '../../src/core/types';

/** 같은 시점에 먼저 열리는 공개판 생애 사건도 실제 선택으로 마친 뒤 다음 장면을 확인한다. */
export function stepPastPublicScenes(s: Life5): void {
  apply5(s, { type: 'step' });
  for (let i = 0; i < 12; i++) {
    const p = s.pending;
    if (p?.kind !== 'door' || !/^(life_course_|life_vow_|trait_awaken_)/.test(p.turning)) return;
    const index = p.turning.startsWith('life_vow_offer_') ? 1 : p.doors.findIndex(d => !d.locked && !d.danger);
    if (index < 0) throw new Error('생애 사건에서 고를 수 있는 문이 없다: ' + p.turning);
    apply5(s, { type: 'answer', index });
    apply5(s, { type: 'step' });
  }
  throw new Error('같은 시점의 생애 사건이 끝나지 않았다');
}
