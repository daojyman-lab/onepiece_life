// 처지가 바뀌었을 때 연표에 남는 짧은 말. 한 줄 인생(엔딩)이 이 줄들을 잇는다.
// 말끝은 모두 "~다"로 맺는다 (한 줄 인생에서 "~고"로 바꿔 잇는다).
import type { Standing } from '../core/types';

export const STANDING_PHRASE: Record<Standing, string> = {
  child: '다시 아이가 되었다',
  civil: '뭍의 삶으로 돌아왔다',
  pirate: '해적이 되었다',
  marine: '해군이 되었다',
  revolution: '혁명군이 되었다',
  bountyHunter: '현상금 사냥꾼이 되었다',
  warlord: '칠무해가 되었다',
  shipwright: '조선공이 되었다',
  cp: '정부의 첩보원이 되었다',
  settled: '뭍에 자리를 잡았다',
  prisoner: '감옥에 갇혔다',
  retired: '은퇴했다',
};

/** 아이에서 곧장 건너갈 때는 "돌아왔다"가 맞지 않아 이 말을 쓴다 */
export const STANDING_FROM_CHILD: Partial<Record<Standing, string>> = {
  civil: '뭍에서 제 몫의 일을 시작했다',
};
