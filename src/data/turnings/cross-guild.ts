import type { Turning } from '../../core/types';
import { V } from '../balance';
import { afterHistory, GROWN, st } from './paths';

const D = V.value.door;
export const CROSS_GUILD_NOTICE: Turning = {
  id: 'cross_guild_dock_poster', kind: 'door', repeat: 'once', weight: 14, speaker: 'hero',
  when: [afterHistory('crossGuild'), { c: 'ashore' }, st(...GROWN),
    { c: 'island', is: ['셸스 타운', '로그타운', '오렌지 마을', '시럽 마을', '후샤 마을', '워터 세븐', '샤본디 제도', '드레스로자', '알라바스타 왕국'] }],
  title: '수배서를 떼러 온 해병', body: '부두 게시판 앞에서 해병 하나가 까치발을 섰다. 손끝이 겨우 닿은 전단에 꼭 그 얼굴이 그려져 있다. 여자아이가 생선 가게에서 작은 발판을 빌려 왔다. “아빠, 해적 잡는 사람이 왜 여기 붙어 있어?” 해병이 대답하기도 전에 골목에서 그물추 끄는 소리가 났다.',
  doors: [
    { label: '짐꾼들에게 길을 비워 달라 외치고 해병과 아이를 앞장서 데려간다', hint: '사람들을 이끌어 두 사람을 경비정까지 호위한다', values: { dominion: D },
      fx: [{ op: 'log', text: '두 짐꾼은 손수레를 가로세우고 다른 한 명은 경비정에 소리쳐 밧줄을 던지게 했다. 아이가 아버지 손을 잡고 올라간 뒤에야 수레들이 다시 움직였다.', weight: 'heavy' }] },
    { label: '아이와 종이를 물에 불려 떼어 낸다', hint: '경비정에서 해병들이 건너올 때까지 곁에 있는다', values: { loyalty: D },
      fx: [{ op: 'log', text: '젖은 종이가 아이 손에서 찢어졌다. 아버지의 얼굴이 그려진 반쪽을 주머니에 넣는 동안 경비정에서 해병 둘이 건너왔다. 그물을 든 자는 슬그머니 골목으로 돌아갔다.', weight: 'heavy' }] },
    { label: '항구 통신원에게 전단이 붙은 곳을 알려 주고 제보료를 받는다', hint: '통신원이 경비정에 먼저 알리고 현장을 취재한다', values: { greed: D },
      news: { title: '부두 게시판에 해병 역수배 전단', body: '독자의 제보를 받고 부두에 나온 통신원이 크로스 길드 표식을 확인했다. 해군은 게시판에 붙은 전단을 증거로 거둬 갔다.' },
      fx: [{ op: 'money', add: 1000 }, { op: 'log', text: '경비정의 뱃고동이 울리자 그물을 들던 손이 내려갔다. 통신원은 전단의 인쇄 자국까지 수첩에 베껴 두고 약속한 제보료를 건넸다.', weight: 'heavy' }] },
  ],
};
