// 서약 콘텐츠 정의. 진행 코어는 이 자료만 읽고 장편의 선택 결과로 남은 표시를 판정한다.
import type { ValueId } from '../core/types';
import { VALUE_IDS } from './values';
import { LIFE_VOW_STORIES } from './vow-life';

export interface VowDefinition {
  id: string;
  value: ValueId;
  title: string;
  target: string;
  requires: string[];
  steps: { name: string; flag: string }[];
  forbids: string[];
  closingTurning: string;
  rewardMastery: number;
  level?: 1 | 2 | 3;
}

const LIFE_VOWS: Record<string, VowDefinition> = Object.fromEntries(
  VALUE_IDS.flatMap((value) => ([1, 2, 3] as const).map((level) => {
    const id = `life_${level}_${value}`;
    return [id, {
      id, value, level, title: LIFE_VOW_STORIES[value].promise[level - 1], target: '소중한 사람',
      requires: [], steps: [], forbids: [], closingTurning: `life_vow_settle_${level}_${value}`,
      rewardMastery: 0,
    } satisfies VowDefinition];
  })),
);

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
  },
  ...LIFE_VOWS,
};
