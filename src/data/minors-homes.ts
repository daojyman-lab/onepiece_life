// 다섯 고향의 자잘한 일과 저절로 지나가는 원작의 만남 (4단계 과제 4~8). 규칙은 minors.ts의 머리말과 같다.
// 원작의 만남은 한 인생에 한 번(cooldownYears 99)이고, 결과마다 연표에 원작 표시를 남긴다.
// 같은 원작 순간을 전환점으로도 쓰지 않는다 (turnings/<고향>.ts와 겹치지 않게).
import { HOMETOWNS } from '../shared/data/births';
import { beforeHistory } from './turnings/paths';
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
/** 그 마을에서 태어나 지금 그 마을에 있다 + 나이 */
const inTown = (town: string, min: number, max?: number, ...more: Cond[]): Cond[] =>
  [{ c: 'home', is: [HOMETOWNS.find((t) => t.name === town)!.home] }, { c: 'town', is: [town] }, { c: 'island', is: [town] }, { c: 'age', min, max }, ...more];
const KID = st('child');
const GROWN = st('civil', 'shipwright', 'settled', 'retired');

// ======================================================== 워터 세븐 (과제 4)
const WATER7: Minor[] = [
  { id: 'm_w7_cn_kokoro', when: at('water7', 5, 14, KID), weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('kokoro', '시프트 역의 인어 할머니에게 술 냄새 나는 칭찬을 들었다', { romance: 1 }, ['바다 열차 역의 인어 할머니 역장이 술병을 든 채 {name}의 머리를 쓰다듬었다.', '시프트 역 앞에서 인어 할머니 역장과 손녀를 따라 열차 꼬리까지 달렸다.']),
      met('kokoro', '시프트 역의 인어 할머니의 짐을 들어 주었다', { romance: 1 }, ['시프트 역 인어 할머니 역장의 장바구니를 역까지 들어 주었다.', '역장 할머니가 떨어뜨린 술병을 주워 주고 사탕을 받았다.']),
      met('kokoro', '시프트 역의 인어 할머니가 웃는 소리를 들었다', {}, ['시프트 역 쪽에서 인어 할머니 역장의 큰 웃음소리가 들려왔다.', '역장 할머니가 열차 앞에서 깃발을 흔드는 것을 보았다.']),
    ] },
  { id: 'm_w7_cn_lucci', when: at('water7', 12, 18, beforeHistory('eniesLobby')), weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('lucci', '비둘기를 얹은 목수에게 말을 걸었다', { inquiry: 1 }, ['비둘기를 어깨에 얹은 말 없는 목수에게 말을 걸었다. 대답은 비둘기가 했다.', '조선소의 말 없는 목수가 들보를 한 손으로 드는 것을 보고 어떻게 그러냐고 물었다. 비둘기가 비밀이라고 했다.']),
      met('lucci', '비둘기를 얹은 목수의 눈이 무서워 길을 비켰다', { peace: 1 }, ['비둘기를 얹은 목수와 눈이 마주치자 등골이 서늘해 길을 비켰다.', '말 없는 목수의 눈빛이 짐승 같아서 다리 밑으로 돌아갔다.']),
      met('lucci', '비둘기를 얹은 목수를 보았다', {}, ['조선소 지붕 위에서 비둘기를 얹은 목수가 바람을 맞고 서 있었다.', '말 없는 목수의 비둘기가 시장 지붕에 앉아 {name}을(를) 내려다보았다.']),
    ] },
  { id: 'm_w7_cn_franky', when: at('water7', 8, 18, beforeHistory('eniesLobby')), weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('franky', '해체업자 두목의 콜라 심부름을 했다', { loyalty: 1 }, ['파란 머리 해체업자 두목이 콜라를 사 오라며 동전을 던졌다. 거스름돈은 가지라고 했다.', '해체업자 두목의 춤을 따라 하자 두목이 엄지를 치켜세웠다.']),
      met('franky', '해체업자 두목의 고철 배를 구경했다', { romance: 1 }, ['뒷골목에서 해체업자 두목이 고철로 만든 이상한 배를 띄우는 것을 구경했다.', '해체업자 두목이 버려진 대포로 불꽃을 쏘아 올리는 것을 보았다.']),
      met('franky', '뒷골목에서 해체업자 두목이 소리치는 것을 들었다', {}, ['뒷골목에서 해체업자 두목의 우렁찬 목소리가 들려왔다.', '해체업자 패밀리가 두목을 둘러싸고 노래하는 소리가 들려왔다.']),
    ] },
  { id: 'm_w7_yagara', when: at('water7', 4, 15), weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['다친 야가라의 지느러미를 붕대로 감아 주었다.', '늙은 야가라에게 몰래 빵 조각을 먹였다.'], fx: [] },
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
      { lean: { greed: 1 }, text: ['도크에 못을 대는 장사로 쏠쏠하게 벌었다.', '해적의 배에 쓸 못을 웃돈을 받고 팔았다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: { justice: 1 }, text: ['녹슨 못을 새 못이라 속여 파는 상인을 직공장에게 알렸다.', '무게를 속인 못 자루를 상인에게 되돌려 보냈다.'], fx: [] },
      { lean: {}, text: ['도크에 못 한 자루를 날라 주었다.', '고철상에 쇳조각을 팔아 술값을 벌었다.'], fx: [{ op: 'money', add: 500 }] },
    ] },
  { id: 'm_w7_tourist', when: at('water7', 10), weight: 6, cooldownYears: 2,
    outcomes: [
      { lean: { peace: 1 }, text: ['길 잃은 관광객을 물길 지도를 그려 가며 숙소까지 데려다주었다.', '관광객의 곤돌라가 다리에 걸리자 밀어 주었다.'], fx: [] },
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

// ======================================================== 와노쿠니 (과제 5)
const WANO: Minor[] = [
  { id: 'm_wano_cn_komurasaki', when: [...inTown('하나노미야코', 15, 22, beforeHistory('wanoFree'))], weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('hiyori', '꽃의 도시의 이름난 기녀 행렬을 보았다', { romance: 1 }, ['꽃의 도시 큰길로 이름난 기녀 무라사키의 행렬이 지나갔다. 그 눈이 슬퍼 보였다.', '기녀 무라사키가 탄 가마의 발이 바람에 들려 얼굴이 잠깐 보였다.']),
      met('hiyori', '기녀 무라사키가 떨어뜨린 부채를 주워 주었다', { justice: 1 }, ['행렬에서 떨어진 부채를 주워 건네자 기녀 무라사키가 작게 고맙다고 했다.', '기녀 무라사키의 하녀가 흘린 짐을 주워 주었다.']),
      met('hiyori', '기녀 무라사키의 소문을 들었다', {}, ['기녀 무라사키가 쇼군의 술잔을 거절했다는 소문이 돌았다.', '찻집에서 기녀 무라사키의 거문고 소리가 들려왔다.']),
    ] },
  { id: 'm_wano_cn_kyoshiro', when: [...inTown('하나노미야코', 16, 22, beforeHistory('wanoFree'))], weight: 5, cooldownYears: ONCE,
    outcomes: [
      met('denjiro', '졸린 눈의 협객 두목에게 길을 비켰다', { peace: 1 }, ['꽃의 도시 협객 두목 쿄시로가 하품을 하며 지나가자 모두 길을 비켰다.', '졸린 눈의 협객 두목이 찻집에 들어서자 떠들던 건달들이 입을 다물었다.']),
      met('denjiro', '협객 두목의 칼이 번쩍이는 것을 보았다', { inquiry: 1 }, ['졸린 눈의 협객 두목이 눈 깜짝할 새 칼을 뽑았다가 넣는 것을 보았다. 어떻게 한 건지 알 수 없었다.', '협객 두목 쿄시로의 칼집 끝이 붉게 칠해져 있는 것을 보았다.']),
      met('denjiro', '협객 두목의 이름을 들었다', {}, ['꽃의 도시의 밤은 협객 두목 쿄시로의 것이라는 말을 들었다.', '쿄시로 일가의 건달들이 찻집 자릿세를 걷어 갔다.']),
    ] },
  { id: 'm_wano_cn_money_fairy', when: [...inTown('에비스 마을', 5, 20)], weight: 6, cooldownYears: ONCE,
    outcomes: [
      met('yasuie', '돈 뿌리는 노인이 남긴 동전을 주웠다', { loyalty: 1 }, ['아침에 문을 여니 문턱에 동전 몇 닢이 놓여 있었다. 마을 사람들은 돈 뿌리는 노인의 짓이라며 웃었다.', '밤새 누군가 지붕 위로 동전을 던져 놓고 갔다. 동전으로 이웃집 약을 샀다.']),
      met('yasuie', '돈 뿌리는 노인의 뒷모습을 보았다', { inquiry: 1 }, ['새벽 골목에서 누더기 노인이 집집마다 동전을 놓고 가는 뒷모습을 보았다.', '동전 자루를 멘 노인이 {name}에게 손가락을 입에 대 보였다.']),
      met('yasuie', '돈 뿌리는 노인의 이야기를 들었다', {}, ['에비스 마을에 몰래 돈을 뿌리는 노인이 있다는 이야기를 들었다.', '마을 사람들이 동전을 주우며 웃었다. 그 웃음만은 진짜 같았다.']),
    ] },
  { id: 'm_wano_cn_tama', when: [...inTown('쿠리', 15, 22)], weight: 5, cooldownYears: ONCE,
    outcomes: [
      met('tama', '쿠리의 꼬마 쿠노이치에게 수수경단을 얻었다', { romance: 1 }, ['쿠리의 꼬마 오타마가 바다에서 올 사람을 기다린다며 수수경단을 나눠 주었다.', '오타마가 짐승들을 길들이는 수수경단이라며 하나를 건넸다. 맛은 그저 그랬다.']),
      met('tama', '쿠리의 꼬마에게 먹을 것을 나눠 주었다', { romance: 1 }, ['굶주린 쿠리의 꼬마 오타마에게 주먹밥을 나눠 주었다.', '오타마가 앓아누웠다는 말에 깨끗한 물을 길어다 주었다.']),
      met('tama', '쿠리의 꼬마가 바다를 보고 있는 것을 보았다', {}, ['쿠리의 바위 위에서 꼬마 오타마가 바다 쪽을 오래 보고 있었다.', '오타마는 바다를 바라보며 오래전의 약속을 되뇌었다.']),
    ] },
  { id: 'm_wano_cn_dragon', when: at('wano', 4, 21), weight: 4, cooldownYears: ONCE,
    outcomes: [
      met('kaido', '하늘을 가르는 푸른 용을 보았다', { ambition: 1 }, ['구름 사이로 푸른 용이 날아갔다. 어른들은 고개를 숙였고 {name}은(는) 눈을 떼지 못했다.', '천둥 같은 울음소리와 함께 푸른 용이 산을 넘어갔다.']),
      met('kaido', '용의 그림자가 지나갈 때 숨었다', { peace: 1 }, ['푸른 용의 그림자가 마을을 덮자 집 안으로 뛰어들어 숨었다.', '용이 날아가는 동안 어른들과 함께 엎드려 숨을 죽였다.']),
      met('kaido', '용의 울음소리를 들었다', {}, ['멀리 해골 섬 쪽에서 용의 울음소리가 들렸다.', '카이도가 또 술에 취해 날뛴다는 소문이 돌았다.']),
    ] },
  { id: 'm_wano_rice', when: at('wano', 5), weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['배급받은 쌀을 반 덜어 옆집에 갖다주었다.', '굶는 아이에게 주먹밥을 쥐여 주었다.'], fx: [] },
      { lean: { greed: 1 }, text: ['쌀 배급 줄에서 앞자리를 팔아 돈을 벌었다.', '남은 쌀을 웃돈을 받고 팔았다.'], fx: [{ op: 'money', add: 800 }] },
      { lean: {}, text: ['쌀 배급 줄에서 반나절을 기다렸다.', '배급받은 쌀에 돌이 섞여 있었다.'], fx: [] },
    ] },
  { id: 'm_wano_river', when: at('wano', 5, undefined, beforeHistory('wanoFree')), weight: 6, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['검은 강물을 숯으로 걸러 마셔 보았다.', '검은 강의 물고기가 왜 죽는지 공장 쪽 물길을 따라가 보았다.'], fx: [] },
      { lean: { justice: 1 }, text: ['강에 공장 물을 버리는 일꾼들을 관리에게 따졌다가 쫓겨났다.', '검은 강에 몰래 표지를 세워 아이들이 마시지 않게 했다.'], fx: [] },
      { lean: {}, text: ['산 너머 맑은 샘까지 물을 길으러 다녀왔다.', '검은 강가에서 빨래를 하다 손이 얼얼해졌다.'], fx: [] },
    ] },
  { id: 'm_wano_festival', when: at('wano', 4), weight: 6, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['신사 축제에서 등불을 들고 밤새 춤을 추었다.', '축제의 불꽃을 보며 바깥 바다를 떠올렸다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['축제 준비로 마을 사람들과 밤새 가마를 꾸몄다.', '축제 가마를 메고 마을을 돌았다.'], fx: [] },
      { lean: {}, text: ['축제 노점에서 경단을 사 먹었다.', '축제 북소리를 들으며 잠들었다.'], fx: [] },
    ] },
];

export const HOME_MINORS: Minor[] = [
  ...WATER7,
  ...WANO,
];
