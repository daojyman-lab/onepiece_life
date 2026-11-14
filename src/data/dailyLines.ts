// 하루하루를 그리는 한 줄. 능력치는 바뀌지 않는다. 달마다 작은 사건과 섞여 기록에 남는다.
// 자리표시: {place} 고향, {port} 지금 항구, {sea} 해역, {rival} 라이벌, {father} {mother} (고아면 보호자), {crew} 동료 한 명
import type { Condition } from '../core/types';

export interface DailyLine {
  when: Condition[];
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  text: string;
}

const baby: Condition = { c: 'age', max: 2 };
const child: Condition = { c: 'age', min: 3, max: 9 };
const teen: Condition = { c: 'age', min: 10, max: 15 };
const home: Condition = { c: 'route', is: ['none'] };
const adult: Condition = { c: 'age', min: 16 };
const sea: Condition = { c: 'route', is: ['pirate', 'marine', 'revolution'] };
const pirate: Condition = { c: 'route', is: ['pirate', 'revolution'] };
const marine: Condition = { c: 'route', is: ['marine'] };
const crew: Condition = { c: 'crew', min: 1 };
const old: Condition = { c: 'age', min: 45 };

const L = (when: Condition[], text: string, season?: DailyLine['season']): DailyLine => ({ when, text, season });

export const DAILY_LINES: DailyLine[] = [
  // ---------------- 아기 (0~2세)
  L([baby], '{mother}의 품에서 파도 소리를 들으며 잠들었다.'),
  L([baby], '처음으로 걸음마를 뗐다. 세 걸음 만에 넘어졌다.'),
  L([baby], '처음 한 말은 "바다"였다고 한다.'),
  L([baby], '밤새 울어서 {father}이(가) 업고 부두를 걸었다.'),
  L([baby], '갈매기를 보고 손뼉을 치며 웃었다.'),
  L([baby], '이가 나기 시작해 무엇이든 깨물었다.'),
  L([baby], '{place} 사람들이 돌아가며 안아 주었다.'),
  L([baby], '모래를 한 움큼 집어 먹으려다 혼났다.'),
  L([baby], '{place}의 바닷바람을 맞으며 무럭무럭 자랐다.'),
  L([baby], '{father}이(가) 깎아 준 나무 배를 꼭 쥐고 잤다.'),
  L([baby], '고열이 나서 온 집안이 밤을 새웠다.'),
  L([baby], '{mother}의 자장가를 들으면 금세 울음을 그쳤다.'),
  L([baby], '마당에서 기어 다니다 닭을 쫓아갔다.'),

  // ---------------- 유년기
  L([child], '들판에서 하루 종일 뛰어놀았다.'),
  L([child], '친구들과 해안가를 거닐며 조개를 주웠다.'),
  L([child], '{place} 골목에서 술래잡기를 했다. 끝까지 들키지 않았다.'),
  L([child], '{mother}이(가) 끓여 준 생선 수프를 두 그릇이나 먹었다.'),
  L([child], '부두에 앉아 들어오는 배들을 하나하나 세었다.'),
  L([child], '처음 보는 갈매기 깃털을 주워 보물 상자에 넣었다.'),
  L([child], '비 오는 날, 처마 밑에서 빗소리를 들으며 낮잠을 잤다.'),
  L([child], '{father}에게 매듭 묶는 법을 배웠다. 자꾸 풀렸다.'),
  L([child], '모래로 커다란 해적선을 만들었다. 파도가 가져갔다.'),
  L([child], '동네 개와 친구가 되었다.'),
  L([child], '나뭇가지를 칼 삼아 해적 놀이를 했다. 오늘은 내가 선장이었다.'),
  L([child], '밤하늘의 별을 세다가 잠들었다.'),
  L([child], '{place}의 노인이 옛날 해적왕 이야기를 들려주었다.'),
  L([child], '처음으로 혼자 심부름을 다녀왔다.'),
  L([child], '벚꽃 잎이 바다 위로 흩날렸다.', 'spring'),
  L([child], '바닷물에 발을 담그고 하루를 보냈다.', 'summer'),
  L([child], '떨어진 낙엽을 모아 작은 불을 피웠다. 혼났다.', 'autumn'),
  L([child], '눈이 내려 친구들과 눈싸움을 했다.', 'winter'),

  // ---------------- 수련기 (고향)
  L([teen, home], '수련을 마치고 바닷가에 누워 노을을 봤다.'),
  L([teen, home], '친구들과 절벽에서 바다로 뛰어들었다.'),
  L([teen, home], '{place} 시장에서 생선 손질을 거들었다.'),
  L([teen, home], '도장 마당을 쓸었다. 수련의 시작은 청소라고 했다.'),
  L([teen, home], '{rival}와(과) 말없이 같은 언덕에 앉아 있었다.'),
  L([teen, home], '항구에 들어온 해군 군함을 멀리서 구경했다.'),
  L([teen, home], '낡은 현상수배서를 벽에 붙여 두었다.'),
  L([teen, home], '비가 와서 하루 종일 집에서 칼을 닦았다.'),
  L([teen, home], '{mother}이(가) 무리하지 말라며 주먹밥을 싸 주었다.'),
  L([teen, home], '마을 아이들이 수련하는 모습을 구경하러 왔다.'),
  L([teen, home], '밤에 몰래 나가 혼자 기술을 연습했다.'),
  L([teen, home], '꽃 피는 계절, 수련장 가는 길이 분홍빛이었다.', 'spring'),
  L([teen, home], '땀이 비 오듯 흐르는 여름, 바다에 뛰어들어 열을 식혔다.', 'summer'),
  L([teen, home], '수확철이라 수련 대신 일손을 도왔다.', 'autumn'),
  L([teen, home], '얼어붙은 아침, 하얀 입김을 뿜으며 달렸다.', 'winter'),

  // ---------------- 바다 (공통)
  L([adult, sea], '잔잔한 바다 위에서 하루가 조용히 지나갔다.'),
  L([adult, sea], '{sea}의 수평선 너머로 해가 졌다.'),
  L([adult, sea], '{port}에 배를 대고 물과 식량을 채웠다.'),
  L([adult, sea], '갑판에 누워 구름이 흘러가는 것을 봤다.'),
  L([adult, sea], '{port}의 골목을 걸으며 처음 보는 풍경을 구경했다.'),
  L([adult, sea], '밤바다에 달빛이 길게 깔렸다.'),
  L([adult, sea], '돛을 기워 꿰맸다. 손끝이 따끔했다.'),
  L([adult, sea], '{port} 항구의 아이들이 졸졸 따라다녔다.'),
  L([adult, sea], '배 위에서 낚싯대를 드리웠다. 아무것도 낚지 못했다.'),
  L([adult, sea], '안개가 짙어 하루 종일 닻을 내리고 기다렸다.'),
  L([adult, sea], '{port}의 선술집에서 뱃사람들의 허풍을 들었다.'),
  L([adult, sea], '바람이 좋아 하루 만에 먼 길을 갔다.'),
  L([adult, sea], '고향 {place}이(가) 문득 그리워졌다.'),
  L([adult, sea], '봄바람을 타고 배가 미끄러지듯 나아갔다.', 'spring'),
  L([adult, sea], '뜨거운 햇볕에 갑판이 달아올랐다.', 'summer'),
  L([adult, sea], '{port}에서 가을 축제가 한창이었다.', 'autumn'),
  L([adult, sea], '차가운 바닷바람에 외투 깃을 세웠다.', 'winter'),

  // 해적
  L([adult, pirate], '해적 깃발이 바람에 펄럭였다.'),
  L([adult, pirate], '해군 순찰선을 피해 섬 그늘에 숨어 하루를 보냈다.'),
  L([adult, pirate], '{port}에서 수배서를 본 사람들이 수군거렸다.'),
  L([adult, pirate], '보물 지도를 펼쳐 놓고 밤늦게까지 들여다봤다.'),
  // 해군
  L([adult, marine], '기지 식당에서 동기들과 밥을 먹었다.'),
  L([adult, marine], '{port} 시민들이 해군 제복을 보고 인사했다.'),
  L([adult, marine], '군함 갑판을 반들반들하게 닦았다.'),
  L([adult, marine], '야간 경계를 섰다. 별이 많은 밤이었다.'),
  // 동료
  L([adult, crew], '{crew}와(과) 갑판에서 실없는 농담을 나눴다.'),
  L([adult, crew], '{crew}가 만든 저녁을 함께 먹었다.'),
  L([adult, crew], '{crew}와(과) 나란히 앉아 바다를 봤다.'),
  L([adult, crew], '{crew}의 코 고는 소리에 잠을 설쳤다.'),
  L([adult, crew], '모두 함께 갑판에서 노래를 불렀다.'),
  // 가정
  L([{ c: 'flag', id: 'married', has: true }], '{spouse}의 편지가 왔다. "몸조심해. 저녁은 꼭 챙겨 먹고."'),
  L([{ c: 'flag', id: 'married', has: true }], '{spouse}이(가) 짜 준 목도리를 둘렀다. 바닷바람이 덜 차가웠다.'),
  L([{ c: 'flag', id: 'married', has: true }], '바다 건너 {place}의 집을 생각했다.'),
  L([{ c: 'flag', id: 'has_child', has: true }], '{child}이(가) 그린 서툰 그림을 선실 벽에 붙여 두었다.'),
  L([{ c: 'flag', id: 'has_child', has: true }], '{child}이(가) "나도 커서 바다에 나갈래!"라고 했다는 편지가 왔다.'),
  L([{ c: 'flag', id: 'has_lover', has: true }], '{lover}에게 줄 조개껍데기 목걸이를 샀다.'),
  L([{ c: 'flag', id: 'has_lover', has: true }], '{lover}의 얼굴이 떠올라 괜히 웃음이 났다.'),

  // 나이 든 뒤
  L([old], '아침 일찍 눈이 떠져 조용히 바다를 봤다.'),
  L([old], '젊은 시절의 싸움을 떠올리며 웃었다.'),
  L([old], '흰머리가 하나 늘었다.'),
];

/** 달 → 계절 */
export function seasonOf(month: number): DailyLine['season'] {
  return month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter';
}
