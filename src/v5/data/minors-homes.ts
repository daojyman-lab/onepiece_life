// 다섯 고향의 자잘한 일과 저절로 지나가는 원작의 만남 (4단계 과제 4~8). 규칙은 minors.ts의 머리말과 같다.
// 원작의 만남은 한 인생에 한 번(cooldownYears 99)이고, 결과마다 연표에 원작 표시를 남긴다.
// 같은 원작 순간을 전환점으로도 쓰지 않는다 (turnings/<고향>.ts와 겹치지 않게).
import { HOMETOWNS } from '../../data/births';
import type { Cond, HomeId, Minor, Standing } from '../core/types';

type Out = Minor['outcomes'][number];
const met = (canon: string, mark: string, lean: Out['lean'], text: string[], fx: Out['fx'] = []): Out =>
  ({ lean, text, fx: [...fx, { op: 'timeline', text: mark, canon }] });
const ONCE = 99;
const st = (...is: Standing[]): Cond => ({ c: 'standing', is });
const townsOf = (id: HomeId) => HOMETOWNS.filter((t) => t.home === id).map((t) => t.name);
/** 그 고향에서 태어나 지금 고향에 있다 + 나이 */
const at = (id: HomeId, min: number, max?: number, ...more: Cond[]): Cond[] =>
  [{ c: 'home', is: [id] }, { c: 'island', is: townsOf(id) }, { c: 'age', min, max }, ...more];
const KID = st('child');
const GROWN = st('civil', 'shipwright', 'settled', 'retired');

// ======================================================== 워터 세븐 (과제 4)
const WATER7: Minor[] = [
  { id: 'm_w7_cn_kokoro', when: at('water7', 5, 14, KID), weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('kokoro', '시프트 역의 인어 할머니에게 술 냄새 나는 칭찬을 들었다', { romance: 1 }, ['바다 열차 역의 인어 할머니 역장이 술병을 든 채 {name}의 머리를 쓰다듬었다.', '시프트 역 앞에서 인어 할머니 역장과 손녀를 따라 열차 꼬리까지 달렸다.']),
      met('kokoro', '시프트 역의 인어 할머니의 짐을 들어 주었다', { devotion: 1 }, ['시프트 역 인어 할머니 역장의 장바구니를 역까지 들어 주었다.', '역장 할머니가 떨어뜨린 술병을 주워 주고 사탕을 받았다.']),
      met('kokoro', '시프트 역의 인어 할머니가 웃는 소리를 들었다', {}, ['시프트 역 쪽에서 인어 할머니 역장의 큰 웃음소리가 들려왔다.', '역장 할머니가 열차 앞에서 깃발을 흔드는 것을 보았다.']),
    ] },
  { id: 'm_w7_cn_lucci', when: at('water7', 12, 18), weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('lucci', '비둘기를 얹은 목수에게 말을 걸었다', { inquiry: 1 }, ['비둘기를 어깨에 얹은 말 없는 목수에게 말을 걸었다. 대답은 비둘기가 했다.', '조선소의 말 없는 목수가 들보를 한 손으로 드는 것을 보고 어떻게 그러냐고 물었다. 비둘기가 비밀이라고 했다.']),
      met('lucci', '비둘기를 얹은 목수의 눈이 무서워 길을 비켰다', { peace: 1 }, ['비둘기를 얹은 목수와 눈이 마주치자 등골이 서늘해 길을 비켰다.', '말 없는 목수의 눈빛이 짐승 같아서 다리 밑으로 돌아갔다.']),
      met('lucci', '비둘기를 얹은 목수를 보았다', {}, ['조선소 지붕 위에서 비둘기를 얹은 목수가 바람을 맞고 서 있었다.', '말 없는 목수의 비둘기가 시장 지붕에 앉아 {name}을(를) 내려다보았다.']),
    ] },
  { id: 'm_w7_cn_franky', when: at('water7', 8, 18), weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('franky', '해체업자 두목의 콜라 심부름을 했다', { loyalty: 1 }, ['파란 머리 해체업자 두목이 콜라를 사 오라며 동전을 던졌다. 거스름돈은 가지라고 했다.', '해체업자 두목의 춤을 따라 했다가 두목이 「슈퍼」라며 엄지를 세웠다.']),
      met('franky', '해체업자 두목의 고철 배를 구경했다', { romance: 1 }, ['뒷골목에서 해체업자 두목이 고철로 만든 이상한 배를 띄우는 것을 구경했다.', '해체업자 두목이 버려진 대포로 불꽃을 쏘아 올리는 것을 보았다.']),
      met('franky', '뒷골목에서 해체업자 두목이 소리치는 것을 들었다', {}, ['뒷골목에서 「슈퍼!」 하는 고함이 들렸다.', '해체업자 패밀리가 두목을 둘러싸고 노래하는 소리가 들려왔다.']),
    ] },
  { id: 'm_w7_yagara', when: at('water7', 4, 15), weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 1 }, text: ['다친 야가라의 지느러미를 붕대로 감아 주었다.', '늙은 야가라에게 몰래 빵 조각을 먹였다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['주인 몰래 야가라를 타고 물길을 한 바퀴 돌았다.', '야가라 등에 올라탔다가 물길 한가운데서 떨어질 뻔했다.'], fx: [] },
      { lean: {}, text: ['물길가에 앉아 야가라들이 지나가는 것을 보았다.', '야가라가 물을 뿜어 옷이 다 젖었다.'], fx: [] },
    ] },
  { id: 'm_w7_canal_slip', when: at('water7', 4, 12, KID), weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['물길 계단에서 미끄러진 친구의 손목을 붙잡았다.', '물길가 난간에 매달린 아이를 끌어 올렸다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['누가 물길 난간 위를 오래 걷나 내기를 해서 이겼다.', '물길 위 다리 난간을 끝까지 걸어 아이들의 박수를 받았다.'], fx: [] },
      { lean: {}, text: ['물길 계단에서 미끄러져 무릎이 까졌다.', '물길가에서 놀다가 신발 한 짝을 떠내려 보냈다.'], fx: [] },
    ] },
  { id: 'm_w7_nails', when: at('water7', 16, undefined, GROWN), weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { ambition: 1 }, text: ['도크에 못을 대는 장사로 쏠쏠하게 벌었다.', '해적의 배에 쓸 못을 웃돈을 받고 팔았다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: { justice: 1 }, text: ['녹슨 못을 새 못이라 속여 파는 상인을 직공장에게 알렸다.', '무게를 속인 못 자루를 상인에게 되돌려 보냈다.'], fx: [] },
      { lean: {}, text: ['도크에 못 한 자루를 날라 주었다.', '고철상에 쇳조각을 팔아 술값을 벌었다.'], fx: [{ op: 'money', add: 500 }] },
    ] },
  { id: 'm_w7_tourist', when: at('water7', 10), weight: 6, cooldownYears: 2,
    outcomes: [
      { lean: { devotion: 1 }, text: ['길 잃은 관광객을 물길 지도를 그려 가며 숙소까지 데려다주었다.', '관광객의 곤돌라가 다리에 걸리자 밀어 주었다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['관광객에게 물길 안내를 하고 두둑한 팁을 받았다.', '관광객에게 조선소 구경을 시켜 주고 돈을 받았다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: {}, text: ['물길가 의자에서 관광객들의 곤돌라 구경을 했다.', '관광객이 물길 사진을 찍어 달라고 해서 찍어 주었다.'], fx: [] },
    ] },
  { id: 'm_w7_dock_lunch', when: at('water7', 16, undefined, st('shipwright', 'civil')), weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['도크에서 점심을 굶는 견습에게 도시락을 반 나눠 주었다.', '실수한 견습 대신 직공장의 꾸중을 들었다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['도크 점심시간에 견습들에게 제 몫의 일까지 떠넘겼다.', '견습들 앞에서 들보를 한 번에 쪼개 보이고 우쭐했다.'], fx: [] },
      { lean: {}, text: ['도크 그늘에서 점심을 먹고 잠깐 졸았다.', '도크 위에서 물길을 내려다보며 빵을 먹었다.'], fx: [] },
    ] },
  { id: 'm_w7_aqua_rumor', when: at('water7', 6), weight: 5, cooldownYears: 3,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['물길 바닥의 높이를 재어 올해 해일이 얼마나 올지 셈해 보았다.', '늙은 뱃사람들에게 지난 해일들의 높이를 물어 적어 두었다.'], fx: [] },
      { lean: { peace: 1 }, text: ['해일 철을 앞두고 윗동네 친척 집에 짐을 미리 옮겨 두었다.', '해일 소문에 들뜬 사람들 틈에서 묵묵히 덧창을 달았다.'], fx: [] },
      { lean: {}, text: ['올해 해일이 유난히 높을 거라는 소문을 들었다.', '아쿠아 라구나 철이라 아랫동네가 어수선했다.'], fx: [] },
    ] },
];

export const HOME_MINORS: Minor[] = [
  ...WATER7,
];
