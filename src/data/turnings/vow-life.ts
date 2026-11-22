// 섬 서약을 지킨 뒤의 장면. (꿈의 서약은 장면 없이 기록으로 남는다: core/dream-vow.ts)
import type { Turning } from '../../core/types';

export const LIFE_VOW_TURNINGS: Turning[] = [{
  id: 'sky_vow_awakening', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
  title: '티카의 피난길',
  body: '티카가 마지막 웨이버를 안전한 구름길로 밀어 넣는다. 위험을 알면서도 곁을 지킨 날들이 손끝에 감각으로 남았다.',
  doors: [
    { label: '티카와 다시 구름길을 걷는다', hint: '지킨 약속은 연표에 남는다',
      fx: [{ op: 'log', text: '티카가 웨이버의 자리를 내 주었다. 구름길이 전보다 넓게 보였다.', weight: 'light' }] },
    { label: '피난길의 끝을 한 번 더 돌아본다', hint: '등불이 아직 켜져 있다',
      fx: [{ op: 'log', text: '멀리 켜진 등불들이 서로에게 돌아갈 길을 알려 주었다.', weight: 'light' }] },
  ],
}];
