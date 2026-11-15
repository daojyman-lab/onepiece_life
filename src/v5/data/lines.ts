// 일상 기록 한 줄. 능력치는 바뀌지 않는다. 가치관 쪽으로 기울여 뽑는다 (leanPick).
// 자리표시: {town} 고향 마을, {island} 지금 있는 섬
import type { Cond, Values } from '../core/types';

export interface DailyLine5 { when: Cond[]; lean: Partial<Values>; text: string }

const kid: Cond = { c: 'age', min: 3, max: 15 };
const adult: Cond = { c: 'age', min: 16, max: 44 };
const old: Cond = { c: 'age', min: 45 };

const L = (when: Cond, lean: Partial<Values>, text: string): DailyLine5 => ({ when: [when], lean, text });

export const LINES: DailyLine5[] = [
  // ---------------- 정의
  L(kid, { justice: 1 }, '골목에서 작은 아이를 괴롭히던 형들 앞을 막아섰다.'),
  L(kid, { justice: 1 }, '해군 기지 앞을 지날 때마다 걸음을 멈추고 깃발을 올려다보았다.'),
  L(adult, { justice: 1 }, '부둣가 노점상의 돈을 뜯던 건달을 쫓아냈다.'),
  L(adult, { justice: 1 }, '현상수배서를 한 장씩 넘겨 보며 오래 생각에 잠겼다.'),
  L(old, { justice: 1 }, '젊은이들의 다툼을 말리고 양쪽 말을 끝까지 들었다.'),
  L(old, { justice: 1 }, '옳지 않은 일을 보면 아직도 주먹이 먼저 쥐어졌다.'),
  // ---------------- 헌신
  L(kid, { devotion: 1 }, '앓아누운 이웃 할머니에게 물을 길어다 드렸다.'),
  L(kid, { devotion: 1 }, '동생들의 밥을 먼저 덜어 주고 남은 것을 먹었다.'),
  L(adult, { devotion: 1 }, '다친 뱃사람을 업고 의원까지 뛰었다.'),
  L(adult, { devotion: 1 }, '번 돈의 절반을 {town}의 고아원에 보냈다.'),
  L(old, { devotion: 1 }, '마을 아이들에게 그물 깁는 법을 가르쳤다.'),
  L(old, { devotion: 1 }, '남의 집 지붕을 고쳐 주느라 하루를 다 썼다.'),
  // ---------------- 야망
  L(kid, { ambition: 1 }, '언젠가 바다에서 가장 이름난 사람이 되겠다고 큰소리쳤다.'),
  L(kid, { ambition: 1 }, '나뭇가지로 친구들을 모두 이길 때까지 집에 가지 않았다.'),
  L(adult, { ambition: 1 }, '새벽마다 부두에서 목검을 휘둘렀다.'),
  L(adult, { ambition: 1 }, '{island}에서 가장 센 자의 이름을 수첩에 적어 두었다.'),
  L(old, { ambition: 1 }, '아직 이루지 못한 것을 손가락으로 꼽아 보았다.'),
  L(old, { ambition: 1 }, '늙었다는 말을 들으면 괜히 더 무거운 짐을 졌다.'),
  // ---------------- 낭만
  L(kid, { romance: 1 }, '항구에 들어온 배의 깃발을 하나하나 그려 두었다.'),
  L(kid, { romance: 1 }, '노인에게 바다 건너 하늘섬 이야기를 졸라 들었다.'),
  L(adult, { romance: 1 }, '술집에서 처음 본 뱃사람들과 밤새 노래를 불렀다.'),
  L(adult, { romance: 1 }, '수평선 너머로 지는 해를 끝까지 바라보았다.'),
  L(old, { romance: 1 }, '젊은 날의 항해 이야기를 몇 번이고 되풀이했다.'),
  L(old, { romance: 1 }, '낡은 해도를 펴 놓고 가 보지 못한 섬을 손끝으로 짚었다.'),
  // ---------------- 탐구
  L(kid, { inquiry: 1 }, '조개껍데기와 돌멩이를 모아 이름을 붙였다.'),
  L(kid, { inquiry: 1 }, '책방 구석에서 해도 읽는 법을 혼자 익혔다.'),
  L(adult, { inquiry: 1 }, '{island}의 오래된 비석에 새겨진 글자를 베껴 왔다.'),
  L(adult, { inquiry: 1 }, '구름 모양으로 내일 날씨를 맞혀 보았다.'),
  L(old, { inquiry: 1 }, '평생 모은 기록을 정리하며 밤을 새웠다.'),
  L(old, { inquiry: 1 }, '모르는 것이 아직 너무 많다는 사실이 즐거웠다.'),
  // ---------------- 의리
  L(kid, { loyalty: 1 }, '친구가 깬 유리창 값을 같이 물어 주었다.'),
  L(kid, { loyalty: 1 }, '한번 한 약속은 비가 와도 지키러 나갔다.'),
  L(adult, { loyalty: 1 }, '빚진 사람의 부탁이라 군말 없이 먼 길을 다녀왔다.'),
  L(adult, { loyalty: 1 }, '등을 맡긴 사람의 험담을 듣고 자리를 박차고 나왔다.'),
  L(old, { loyalty: 1 }, '먼저 간 친구의 기일에 술 한 잔을 따랐다.'),
  L(old, { loyalty: 1 }, '오랜 동료의 편지를 받고 한참 웃었다.'),
  // ---------------- 자유
  L(kid, { freedom: 1 }, '서당을 빠져나와 언덕에서 하루 종일 바람을 맞았다.'),
  L(kid, { freedom: 1 }, '어른들이 정해 준 길 말고 다른 길로 집에 돌아갔다.'),
  L(adult, { freedom: 1 }, '정해진 일 없이 {island}의 해변을 따라 걸었다.'),
  L(adult, { freedom: 1 }, '누가 시킨 일이라면 일부러 늦게 했다.'),
  L(old, { freedom: 1 }, '아무에게도 말하지 않고 작은 배를 타고 나갔다 왔다.'),
  L(old, { freedom: 1 }, '얽매인 것 없이 사는 게 제일이라고 중얼거렸다.'),
  // ---------------- 패도
  L(kid, { dominion: 1 }, '골목대장 자리를 걸고 힘센 아이와 맞붙었다.'),
  L(kid, { dominion: 1 }, '친구들이 자기 말을 따르지 않으면 참지 못했다.'),
  L(adult, { dominion: 1 }, '눈을 피하지 않는 자가 있으면 먼저 다가가 노려보았다.'),
  L(adult, { dominion: 1 }, '{island}의 뒷골목 사람들이 이름을 듣고 길을 비켰다.'),
  L(old, { dominion: 1 }, '젊은 놈들이 겁먹는 눈빛을 보며 아직 녹슬지 않았다고 생각했다.'),
  L(old, { dominion: 1 }, '내 말 한마디에 일이 정해지는 자리에 앉아 있었다.'),
  // ---------------- 평온
  L(kid, { peace: 1 }, '볕 좋은 툇마루에서 고양이와 함께 낮잠을 잤다.'),
  L(kid, { peace: 1 }, '싸움이 나면 슬그머니 자리를 피해 바닷가로 갔다.'),
  L(adult, { peace: 1 }, '작은 텃밭에 씨를 뿌리고 물을 주었다.'),
  L(adult, { peace: 1 }, '조용한 저녁, 차 한 잔을 앞에 두고 파도 소리를 들었다.'),
  L(old, { peace: 1 }, '{town}의 바닷가 의자에 앉아 하루를 보냈다.'),
  L(old, { peace: 1 }, '아무 일 없는 하루가 고마웠다.'),
  // ---------------- 누구나
  L(kid, {}, '{town}의 시장에서 심부름을 했다.'),
  L(kid, {}, '비 오는 날, 처마 밑에서 빗소리를 들었다.'),
  L(kid, {}, '바닷가에서 게를 잡다가 손가락을 물렸다.'),
  L(kid, {}, '키가 한 뼘 자랐다.'),
  L(adult, {}, '{island}의 항구에 낯선 배가 들어왔다.'),
  L(adult, {}, '오랜만에 실컷 자고 일어났다.'),
  L(adult, {}, '폭풍이 지나간 뒤, 부서진 것들을 치웠다.'),
  L(adult, {}, '먹을 것을 사러 장에 나갔다가 빈손으로 돌아왔다.'),
  L(old, {}, '무릎이 쑤시는 걸 보니 비가 올 모양이었다.'),
  L(old, {}, '거울 속 흰머리를 하나 뽑았다.'),
  L(old, {}, '{town}에서 보낸 어린 날이 꿈에 나왔다.'),
  L(old, {}, '이른 아침 바닷바람을 쐬며 오래 걸었다.'),
];
