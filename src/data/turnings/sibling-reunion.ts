import type { Turning } from '../../core/types';
import { V } from '../balance';

export const SIBLING_REUNION_ID = 'family_sibling_reunion';

export const SIBLING_REUNION: Turning = {
  id: SIBLING_REUNION_ID, kind: 'door', weight: 0, repeat: { years: 1 }, max: V.turning.maxRepeat,
  when: [{ c: 'siblingReunion' }], needs: ['sibling'], speaker: 'hero',
  title: '여행길에서 다시 만난 {siblingMeetingName}',
  body: '{island}에서 낯익은 목소리가 들렸다. 고개를 돌리니 {siblingMeetingName}(이)었다. 뜻밖의 만남에 둘 다 걸음을 멈췄다. {siblingMeetingName}은(는) 마침 {siblingVisit}.',
  doors: [
    { label: '다음 해까지 잠시 동행한다', hint: '비블카드를 나누고 함께 다닌다. 다음 해에는 형제가 자기 일로 돌아간다',
      when: [{ c: 'siblingReunion', action: 'join' }], fx: [{ op: 'siblingReunion', action: 'join' }] },
    { label: '비블카드를 나누고 헤어진다', hint: '서로의 조각으로 어느 섬에 있는지 짐작할 수 있다',
      when: [{ c: 'siblingReunion', action: 'share' }], fx: [{ op: 'siblingReunion', action: 'share' }] },
    { label: '서로의 근황을 들은 뒤 각자의 길로 간다', hint: '함께 앉아 그동안의 일을 이야기한다', fx: [{ op: 'siblingReunion', action: 'part' }] },
  ],
};
