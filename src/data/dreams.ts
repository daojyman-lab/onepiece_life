// 꿈(인생 과업, 통합 기획 3장): 무엇을 이루고 싶은가. 가치관(신념)은 왜 그것을 바라는가.
// 수련기 끝 무렵에 고르고(turnings/dreams.ts), 살면서 바뀔 수 있다. 이루었는지는 해마다 core/dreams.ts가 본다.
import type { DreamId } from '../core/types';

export const DREAMS: Record<DreamId, { name: string; done: string; missed: string }> = {
  pirateKing: { name: '해적왕', done: '바다의 정점에 섰다', missed: '해적왕의 자리에는 끝내 닿지 못했다' },
  bestSword:  { name: '세계 최강의 검객', done: '검의 끝에 닿았다', missed: '검의 끝은 끝내 보이지 않았다' },
  marineTop:  { name: '해군의 정점', done: '정의의 가장 높은 자리에 섰다', missed: '정의의 정점에는 닿지 못했다' },
  changeWorld:{ name: '세상을 바꾸는 것', done: '세상이 조금은 달라졌다', missed: '세상은 생각보다 단단했다' },
  worldEnd:   { name: '세상의 끝을 보는 것', done: '마지막 바다를 보았다', missed: '세상의 끝은 수평선 너머에 남았다' },
  truth:      { name: '세계의 진실을 아는 것', done: '감춰진 역사의 한 조각을 읽었다', missed: '진실의 문은 끝내 열리지 않았다' },
  treasure:   { name: '바다의 보물을 손에 넣는 것', done: '평생 쓰고도 남을 보물을 손에 넣었다', missed: '보물은 늘 한 발 앞에 있었다' },
  peace:      { name: '소중한 사람들과 평온하게 사는 것', done: '지키고 싶던 사람들 곁에서 늙어 갔다', missed: '평온한 날은 생각보다 멀었다' },
};
export const DREAM_IDS = Object.keys(DREAMS) as DreamId[];
/** 혁명으로 세상을 바꾸었다고 볼 이름값 */
export const CHANGE_FAME = 1000;
/** 보물을 손에 넣었다고 볼 돈 */
export const TREASURE_MONEY = 30_000_000;
/** 평온한 삶을 이루었다고 볼 나이 */
export const PEACE_AGE = 45;
