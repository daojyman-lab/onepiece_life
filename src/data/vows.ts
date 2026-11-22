// 섬 서약 정의. 진행 코어(core/vow.ts)는 이 자료만 읽고 장편의 선택 결과로 남은 표시를 판정한다.
// 꿈의 서약은 data/dream-vows.ts에 따로 있다.
import type { ValueId } from '../core/types';

export interface VowDefinition {
  id: string;
  value: ValueId;
  title: string;
  target: string;
  requires: string[];
  steps: { name: string; flag: string }[];
  forbids: string[];
  closingTurning: string;
  /** 지켰을 때 지금 갈래에 더하는 숙련 (섬 이야기의 몫) */
  rewardMastery: number;
  /** 지킨 뒤 열리는 장면 */
  awakening?: string;
}

export const VOWS: Record<string, VowDefinition> = {
  sky_tika_guard: {
    id: 'sky_tika_guard', value: 'loyalty', title: '티카가 이끄는 피난길을 끝까지 지킨다', target: '티카',
    requires: ['ep_skypiea_tika_trust', 'ep_skypiea_b_ledger'],
    steps: [
      { name: '피난길 준비', flag: 'ep_skypiea_b_vow_prepared' },
      { name: '피난처 완성', flag: 'ep_skypiea_b_vow_refuge' },
    ],
    forbids: ['ep_skypiea_b_deal'],
    closingTurning: 'ep_skypiea_b9',
    rewardMastery: 25,
    awakening: 'sky_vow_awakening',
  },
};
