// 일상 기록 한 줄. 능력치는 바뀌지 않는다. 가치관 쪽으로 기울여 뽑는다 (leanPick).
// 자리표시: {town} 고향 마을, {island} 지금 있는 섬, {parent} 살아 있는 부모의 호칭
// 글이 형제 · 동료 · 부모 · 헤엄을 전제하면 needs에 적는다 (tests/v5/content-12.test.ts가 낱말로 확인한다).
// 물러서는 줄에는 맞서는 가치관이, 맞서는 줄에는 평온이 깊으면 나오지 않는 조건을 붙인다 (방금 싸움에 끼어든 사람에게 "자리를 피했다"가 나오지 않게).
// 처지가 배를 타는 처지(해적 · 해군 · 혁명군)면 그 처지가 배를 전제하므로 'ship'을 따로 적지 않는다. 'ship'은 제 배를 가졌을 때다.
import type { Branch, Cond, Need, Standing, ValueId, Values } from '../core/types';

/** money: 글이 말하는 돈의 오감 (보냈다 · 써 버렸다면 음수, 주웠다 · 받아 냈다면 양수). 쓰는 줄은 그만한 돈이 있어야 나온다 */
export interface DailyLine5 { when: Cond[]; lean: Partial<Values>; text: string; needs?: Need[]; money?: number; onceKey?: string }

// ---------------- 나이대
const kid: Cond = { c: 'age', min: 3, max: 15 };
const small: Cond = { c: 'age', min: 3, max: 9 };
const teen: Cond = { c: 'age', min: 10, max: 15 };
const adult: Cond = { c: 'age', min: 16, max: 44 };
const old: Cond = { c: 'age', min: 45 };
const grown: Cond = { c: 'age', min: 16 };
const youth: Cond = { c: 'age', min: 16, max: 35 };
const prime: Cond = { c: 'age', min: 36, max: 59 };
const elder: Cond = { c: 'age', min: 60 };
// ---------------- 처지 · 마을 · 몸
const st = (...is: Standing[]): Cond => ({ c: 'standing', is });
const atSea = st('pirate', 'marine', 'revolution');
const town = (name: string): Cond[] => [{ c: 'town', is: [name] }, kid];
const island = (...is: string[]): Cond => ({ c: 'island', is });
const fruit: Cond = { c: 'fruit', has: true };
/** 지금 걷는 길 (무기를 쥐는 줄은 그 길을 걷는 사람에게만) */
const path = (...is: (Branch | 'none')[]): Cond => ({ c: 'path', is });
/** 이 가치관이 깊으면 나오지 않는다 */
const not = (id: ValueId): Cond => ({ c: 'value', id, deep: false });
const calm = not('dominion');                 // 물러서는 줄: 맞서는 사람에게는 나오지 않는다
const fierce = not('peace');                  // 맞서는 줄: 조용한 사람에게는 나오지 않는다

const L = (when: Cond | Cond[], lean: Partial<Values>, text: string, needs?: Need[], money?: number): DailyLine5 =>
  ({ when: Array.isArray(when) ? when : [when], lean, text, ...(needs ? { needs } : {}), ...(money ? { money } : {}) });
/** 돈이 오가는 줄 */
const M = (when: Cond | Cond[], lean: Partial<Values>, text: string, money: number): DailyLine5 => L(when, lean, text, undefined, money);

export const LINES: DailyLine5[] = [
  // ---------------- 정의
  L(kid, { justice: 1 }, '골목에서 작은 아이를 괴롭히던 형들 앞을 막아섰다.'),
  L(kid, { justice: 1 }, '해군 기지 앞을 지날 때마다 걸음을 멈추고 깃발을 올려다보았다.'),
  L(adult, { justice: 1 }, '부둣가 노점상의 돈을 뜯던 건달을 쫓아냈다.'),
  L(adult, { justice: 1 }, '현상수배서를 한 장씩 넘겨 보며 오래 생각에 잠겼다.'),
  L(old, { justice: 1 }, '젊은이들의 다툼을 말리고 양쪽 말을 끝까지 들었다.'),
  L(old, { justice: 1 }, '지나가다 가게 주인이 일꾼의 품삯을 떼먹었다는 말을 듣고 굳이 나섰다. 장부를 펼쳐 밀린 돈을 받아냈고, 일꾼이 돈을 챙기는 걸 보고서야 화가 가라앉았다.'),
  // ---------------- 탐욕 (4단계: 헌신 대신. 부패하고 제 잇속을 먼저 챙긴다)
  M(kid, { greed: 1 }, '심부름 거스름돈에서 몇 닢을 몰래 떼어 주머니에 넣었다.', 200),
  M(kid, { greed: 1 }, '주운 동전을 주인을 찾지 않고 제 비밀 상자에 넣었다.', 200),
  L(adult, { greed: 1 }, '장부의 숫자를 살짝 고쳐 차액을 제 몫으로 돌렸다.'),
  M(adult, { greed: 1 }, '급한 사람에게 물건값을 두 배로 불렀다.', 2000),
  L(old, { greed: 1 }, '모아 둔 돈을 몇 번이고 세어 보고 다시 숨겼다.'),
  M(old, { greed: 1 }, '빌려준 돈의 이자를 하루도 미루지 않고 받아 냈다.', 3000),
  // ---------------- 남을 돌보는 줄 (헌신이 빠진 뒤 정의 · 의리 · 평온으로)
  L(kid, { romance: 1 }, '앓아누운 이웃 할머니에게 물을 길어다 드렸다.'),
  L(kid, { peace: 1 }, '동생들의 밥을 먼저 덜어 주고 남은 것을 먹었다.', ['sibling']),
  L(adult, { justice: 1 }, '다친 뱃사람을 업고 의원까지 뛰었다.'),
  M(adult, { loyalty: 1 }, '번 돈 가운데 얼마를 {town}의 고아원에 보냈다.', -3000),
  L(old, { romance: 1 }, '마을 아이들에게 그물 깁는 법을 가르쳤다.'),
  L(old, { peace: 1 }, '남의 집 지붕을 고쳐 주느라 하루를 다 썼다.'),
  // ---------------- 야망
  L(kid, { ambition: 1 }, '언젠가 바다에서 가장 이름난 사람이 되겠다고 큰소리쳤다.'),
  L(kid, { ambition: 1 }, '나뭇가지로 친구들을 모두 이길 때까지 집에 가지 않았다.'),
  L([adult, path('sword')], { ambition: 1 }, '새벽마다 부두에서 목검을 휘둘렀다.'),
  L([adult, path('fist')], { ambition: 1 }, '새벽마다 모래 자루를 매달아 놓고 주먹이 까지도록 두드렸다.'),
  L([adult, path('gun')], { ambition: 1 }, '새벽마다 빈 병을 세워 놓고 한 발씩 맞혀 나갔다.'),
  L(adult, { ambition: 1 }, '{island}에서 가장 센 자의 이름을 수첩에 적어 두었다.'),
  L(old, { ambition: 1 }, '아직 이루지 못한 것을 손가락으로 꼽아 보았다.'),
  L(old, { ambition: 1 }, '늙었다는 말을 들으면 괜히 더 무거운 짐을 졌다.'),
  // ---------------- 낭만
  L(kid, { romance: 1 }, '항구에 들어온 배의 깃발을 하나하나 그려 두었다.'),
  L(kid, { romance: 1 }, '노인에게 바다 건너 하늘섬 이야기를 졸라 들었다.'),
  L(adult, { romance: 1 }, '처음 만난 길손과 밤늦도록 노래를 주고받았다.'),
  L(adult, { romance: 1 }, '수평선 너머로 지는 해를 끝까지 바라보았다.'),
  L(old, { romance: 1 }, '젊은 날의 이야기를 몇 번이고 되풀이했다.'),
  L(old, { romance: 1 }, '낡은 해도를 펴 놓고 가 보지 못한 섬을 손끝으로 짚었다.'),
  // ---------------- 탐구
  L(kid, { inquiry: 1 }, '조개껍데기와 돌멩이를 모아 이름을 붙였다.'),
  L(kid, { inquiry: 1 }, '책방 구석에서 해도 읽는 법을 혼자 익혔다.'),
  L(adult, { inquiry: 1 }, '{island}의 오래된 비석에 새겨진 글자를 베껴 왔다.'),
  L(adult, { inquiry: 1 }, '구름 모양으로 내일 날씨를 맞혀 보았다.'),
  L(old, { inquiry: 1 }, '평생 모은 기록을 정리하며 밤을 새웠다.'),
  L(old, { inquiry: 1 }, '모르는 것이 아직 너무 많다는 사실이 즐거웠다.'),
  // ---------------- 의리
  M(kid, { loyalty: 1 }, '친구가 깬 유리창 값을 같이 물어 주었다.', -300),
  L(kid, { loyalty: 1 }, '한번 한 약속은 비가 와도 지키러 나갔다.'),
  L(adult, { loyalty: 1 }, '빚진 사람의 부탁이라 군말 없이 먼 길을 다녀왔다.'),
  L(adult, { loyalty: 1 }, '등을 맡긴 사람의 험담을 듣고 자리를 박차고 나왔다.'),
  L(old, { loyalty: 1 }, '먼저 간 친구의 기일에 술 한 잔을 따랐다.'),
  L(old, { loyalty: 1 }, '오랜 벗의 편지를 받고 한참 웃었다.'),
  // ---------------- 자유
  L(kid, { freedom: 1 }, '서당을 빠져나와 언덕에서 하루 종일 바람을 맞았다.'),
  L(kid, { freedom: 1 }, '어른들이 정해 준 길 말고 다른 길로 집에 돌아갔다.'),
  L(adult, { freedom: 1 }, '정해진 일 없이 {island}의 해변을 따라 걸었다.'),
  L(adult, { freedom: 1 }, '누가 시킨 일이라면 일부러 늦게 했다.'),
  L(old, { freedom: 1 }, '아무에게도 말하지 않고 작은 배를 타고 나갔다 왔다.'),
  L(old, { freedom: 1 }, '얽매인 것 없이 사는 게 제일이라고 중얼거렸다.'),
  // ---------------- 패도
  L([kid, fierce], { dominion: 1 }, '골목대장 자리를 걸고 힘센 아이와 맞붙었다.'),
  L(kid, { dominion: 1 }, '친구들이 자기 말을 따르지 않으면 참지 못했다.'),
  L([adult, fierce], { dominion: 1 }, '눈을 피하지 않는 자가 있으면 먼저 다가가 노려보았다.'),
  L(adult, { dominion: 1 }, '{island}의 뒷골목 사람들이 이름을 듣고 길을 비켰다.'),
  L(old, { dominion: 1 }, '젊은 놈들이 겁먹는 눈빛을 보며 아직 녹슬지 않았다고 생각했다.'),
  L(old, { dominion: 1 }, '내 말 한마디에 일이 정해지는 자리에 앉아 있었다.'),
  // ---------------- 평온
  L(kid, { peace: 1 }, '볕 좋은 툇마루에서 고양이와 함께 낮잠을 잤다.'),
  L([kid, calm, not('justice')], { peace: 1 }, '싸움이 나면 슬그머니 자리를 피해 바닷가로 갔다.'),
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

  // ======================================================== 마을의 풍경 (그 마을에서 자라는 아이)
  // ---------------- 후샤 마을: 풍차, 어촌, 마을 술집, 코르보 산
  L(town('후샤 마을'), {}, '풍차가 도는 언덕에서 연을 날렸다.'),
  L(town('후샤 마을'), { peace: 1 }, '마을 술집 앞을 쓸어 주고 우유 한 잔을 얻어 마셨다.'),
  L(town('후샤 마을'), { inquiry: 1 }, '코르보 산 쪽에서 들려오는 고함 소리가 궁금해 숲 어귀까지 가 보았다.'),
  L(town('후샤 마을'), { freedom: 1 }, '촌장 할아버지의 잔소리를 듣고도 다음 날 또 부두에 나갔다.'),
  L(town('후샤 마을'), { romance: 1 }, '술집에 모인 뱃사람들의 노래를 창밖에서 따라 불렀다.'),
  L(town('후샤 마을'), {}, '방앗간 풍차 아래에서 밀가루를 뒤집어쓰고 놀았다.'),
  // ---------------- 고아 왕국 그레이 터미널: 쓰레기 산, 성벽, 판잣집
  L(town('고아 왕국 그레이 터미널'), {}, '쓰레기 산에서 쓸 만한 판자를 골라 판잣집 지붕을 기웠다.'),
  L(town('고아 왕국 그레이 터미널'), { ambition: 1 }, '성벽 너머 귀족 거리를 올려다보며 언젠가 저 문을 지나가겠다고 마음먹었다.'),
  L(town('고아 왕국 그레이 터미널'), { justice: 1 }, '고철을 줍는 꼬마들의 무거운 자루를 대신 들어 주었다.'),
  L(town('고아 왕국 그레이 터미널'), { freedom: 1 }, '성문 경비병이 쫓아내도 웃으며 쓰레기 산으로 돌아갔다.'),
  L(town('고아 왕국 그레이 터미널'), { inquiry: 1 }, '귀족들이 버린 신문 조각을 주워 글자를 익혔다.'),
  L(town('고아 왕국 그레이 터미널'), {}, '연기 자욱한 쓰레기 산 꼭대기에서 먼바다를 바라보았다.'),
  // ---------------- 셸스 타운: 해군 기지, 구령과 나팔, 마을 식당
  L(town('셸스 타운'), { ambition: 1 }, '기지 담장 너머 구령 소리에 맞춰 골목에서 발을 맞춰 걸었다.'),
  L(town('셸스 타운'), { justice: 1 }, '기지 앞 초소 병사에게 수배서 읽는 법을 물었다.'),
  L(town('셸스 타운'), {}, '마을 식당 뒷문에서 감자 껍질을 벗기고 수프 한 그릇을 얻었다.'),
  L(town('셸스 타운'), { loyalty: 1 }, '담장 아래 떨어진 병사의 모자를 주워 초소에 가져다주었다.'),
  L(town('셸스 타운'), {}, '기지의 나팔 소리에 아침마다 눈을 떴다.'),
  L(town('셸스 타운'), { freedom: 1 }, '기지 쪽은 쳐다보지도 않고 반대편 해변으로 놀러 갔다.'),
  // ---------------- 오렌지 마을: 애완동물 가게, 시장, 항구 짐꾼, 마을을 세운 촌장
  L(town('오렌지 마을'), { romance: 1 }, '애완동물 가게 앞에 묶인 개에게 물그릇을 채워 주었다.'),
  L(town('오렌지 마을'), {}, '시장 가판대 사이를 뛰어다니다 과일 장수에게 혼났다.'),
  L(town('오렌지 마을'), { inquiry: 1 }, '항구에 내려지는 상자마다 찍힌 표식을 하나하나 읽어 보았다.'),
  L(town('오렌지 마을'), { romance: 1 }, '촌장 할아버지가 맨손으로 마을을 일군 이야기를 몇 번이고 다시 들었다.'),
  L(town('오렌지 마을'), {}, '애완동물 가게 진열창 앞에서 강아지들이 자는 것을 구경했다.'),
  L(town('오렌지 마을'), { ambition: 1 }, '시장 짐꾼들 틈에 끼어 제 몸만 한 상자를 날라 보았다.'),
  // ---------------- 시럽 마을: 언덕 위 저택, 조용한 시골, 거짓말쟁이 소년
  L(town('시럽 마을'), {}, '언덕 위 저택 창문에 불이 켜지는 것을 멀리서 바라보았다.'),
  L([{ c: 'town', is: ['시럽 마을'] }, { c: 'age', min: 8, max: 15 }], { romance: 1 }, '해적이 쳐들어온다는 코가 긴 아이의 외침에 또 속고도 웃었다.'),
  L(town('시럽 마을'), {}, '해안 비탈길을 내려가 조용한 포구에서 하루를 보냈다.'),
  L(town('시럽 마을'), { inquiry: 1 }, '마을 의원의 약초밭 이름표를 하나씩 외웠다.'),
  L(town('시럽 마을'), { peace: 1 }, '아무 일도 일어나지 않는 마을 길을 느릿느릿 걸었다.'),
  L(town('시럽 마을'), { freedom: 1 }, '울타리를 넘어 언덕 너머 숲까지 혼자 다녀왔다.'),
  // ---------------- 코코야시 마을: 귤밭, 바람개비 모자의 순경
  L(town('코코야시 마을'), {}, '귤밭 사이를 지나며 떨어진 귤을 바구니에 주워 담았다.'),
  L(town('코코야시 마을'), { peace: 1 }, '잘 익은 귤을 골라 이웃집 문 앞에 두고 왔다.'),
  L(town('코코야시 마을'), {}, '모자에 바람개비를 꽂은 순경 아저씨에게 길을 물었다.'),
  L(town('코코야시 마을'), { inquiry: 1 }, '귤나무 가지마다 열린 열매를 세어 올해 수확을 점쳐 보았다.'),
  L(town('코코야시 마을'), { romance: 1 }, '귤밭 언덕에 누워 노을 지는 바다를 끝까지 보았다.'),
  L(town('코코야시 마을'), { ambition: 1 }, '어른들보다 먼저 귤 상자를 다 채우겠다고 해가 지도록 땄다.'),
  // ---------------- 시모츠키 마을: 검술 도장, 논둑
  L(town('시모츠키 마을'), {}, '도장 담 밖에서 목검 부딪는 소리를 들으며 걸었다.'),
  L([...town('시모츠키 마을'), path('sword', 'none')], { ambition: 1 }, '도장 마당 끝에서 어른들의 칼 쓰는 자세를 흉내 냈다.'),
  L(town('시모츠키 마을'), { justice: 1 }, '도장 신발장에 흩어진 신을 가지런히 놓아두고 나왔다.'),
  L(town('시모츠키 마을'), {}, '논둑을 따라 걸으며 물꼬에 막힌 흙을 걷어 냈다.'),
  L(town('시모츠키 마을'), { peace: 1 }, '저녁 무렵 논둑에 앉아 개구리 우는 소리를 들었다.'),
  L(town('시모츠키 마을'), { justice: 1 }, '도장 아이들이 약한 아이를 놀리자 사범님께 일렀다.'),
  // ---------------- 로그타운: 처형대, 무기점, 위대한 항로로 가는 배
  L(town('로그타운'), { romance: 1 }, '해적왕이 처형된 광장의 처형대를 한참 올려다보았다.'),
  L(town('로그타운'), {}, '무기점 진열창에 걸린 칼들을 코를 박고 구경했다.'),
  L(town('로그타운'), { inquiry: 1 }, '광장에 모인 뱃사람들이 어디로 가는지 엿듣고 수첩에 적었다.'),
  L(town('로그타운'), { loyalty: 1 }, '바람에 기운 노점 좌판을 붙들어 주고 사과 한 알을 얻었다.'),
  L(town('로그타운'), {}, '바다로 나가기 전 마지막으로 들른다는 배들을 부두에서 세어 보았다.'),
  L(town('로그타운'), { ambition: 1 }, '위대한 항로로 떠나는 배를 보며 저 배에 타겠다고 큰소리쳤다.'),

  // ======================================================== 어린 날 (v4 일상 · 작은 사건에서)
  L(small, { freedom: 1 }, '뒷산에서 해가 질 때까지 뛰어놀았다.'),
  L(kid, {}, '감기에 걸려 며칠을 이불 속에서 앓았다.'),
  L(small, {}, '부두 아래에서 헤엄을 배우다 물을 잔뜩 먹었다.', ['swim']),
  L(small, { ambition: 1 }, '나뭇가지 칼싸움에서 이기고 하루 종일 으스댔다.'),
  L(small, {}, '{parent}를 따라 시장에 가서 생선 고르는 법을 배웠다.', ['parent']),
  L(small, { romance: 1 }, '{parent}의 무릎에 앉아 먼바다 이야기를 들었다.', ['parent']),
  M(small, {}, '모래사장에서 반짝이는 동전 한 닢을 주웠다.', 50),
  L(small, { freedom: 1 }, '몰래 고깃배에 숨어들었다가 들켜 호되게 혼났다.'),
  L(small, {}, '모래로 커다란 배를 쌓았다가 파도에 빼앗겼다.'),
  L(teen, {}, '새벽마다 바닷가 모래밭을 달렸다.'),
  L(teen, { ambition: 1 }, '손바닥이 터지도록 같은 동작을 되풀이했다.'),
  L(teen, { inquiry: 1 }, '밤늦도록 항해술 책을 읽었다.'),
  L(teen, { dominion: 1 }, '마을 축제 씨름판에 나가 세 판을 내리 이겼다.'),
  L(teen, { romance: 1 }, '대해적의 현상금 기사를 오려 벽에 붙여 두었다.'),
  L(teen, {}, '{parent}가 새로 지어 준 옷을 입고 수련을 나갔다.', ['parent']),
  L(teen, { freedom: 1 }, '친구들과 절벽에서 바다로 뛰어들었다.', ['swim']),
  L(teen, {}, '수확철이라 수련 대신 일손을 거들었다.'),

  // ======================================================== 처지마다
  // ---------------- 해적
  L([grown, st('pirate')], { justice: 1 }, '들른 항구에서 털어 가자는 말을 끝까지 반대했다.'),
  L([grown, st('pirate')], { romance: 1 }, '배에 남은 식량을 털어 굶주린 포구 아이들에게 나눠 주었다.'),
  M([grown, st('pirate')], { greed: 1 }, '나눠 갖기로 한 노획물 가운데 금붙이 몇 개를 몰래 제 궤짝에 숨겼다.', 4000),
  L([grown, st('pirate')], { ambition: 1 }, '새로 붙은 수배서들의 현상금을 손가락으로 짚어 보며 웃었다.'),
  L([grown, st('pirate')], { inquiry: 1 }, '해도에 없는 해안선을 따라 걸으며 지형을 그려 넣었다.'),
  L([grown, st('pirate')], { romance: 1 }, '갑판에 둘러앉아 밤새 술잔을 돌리며 노래했다.'),
  // 선장(표시 'captain')과 남의 배를 타는 선원은 하루가 다르다
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: true }], { dominion: 1 }, '해도를 펴 놓고 다음 뱃길을 혼자 정했다.'),
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: true }], { loyalty: 1 }, '선원들의 몫을 장부에 적고 나서야 제 몫을 셌다.'),
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: true }], { peace: 1 }, '선장실 창으로 잠든 갑판을 한참 내려다보았다.'),
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: false }], { ambition: 1 }, '선장이 키를 잡는 손놀림을 어깨너머로 눈에 익혔다.'),
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: false }], { freedom: 1 }, '선장의 호통을 한 귀로 흘리고 돛대 꼭대기에서 낮잠을 잤다.'),
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: false }], { justice: 1 }, '고참이 떠넘긴 갑판 청소를 군말 없이 끝냈다.'),
  L([grown, st('pirate'), { c: 'flag', id: 'captain', has: false }], { loyalty: 1 }, '선장을 비웃는 사람과 언성을 높이다 스스로 그 자리를 떠났다.'),
  L([grown, st('pirate')], { freedom: 1 }, '깃발을 올리고 바람 부는 대로 뱃머리를 돌렸다.'),
  L([grown, st('pirate'), fierce], { dominion: 1 }, '항구에서 시비를 건 사내에게 먼저 주먹을 날렸다.'),
  L([grown, st('pirate'), calm], { peace: 1 }, '귀찮은 싸움은 웃어넘기고 해안 길로 비켜 갔다.'),
  L([grown, st('pirate')], {}, '돛을 기우다 바늘에 손끝을 찔렸다.'),
  L([grown, st('pirate')], {}, '해군 순찰선을 피해 섬 그늘에서 하루를 보냈다.'),
  L([grown, st('pirate')], { romance: 1 }, '보물 지도를 펼쳐 놓고 밤늦게까지 들여다보았다.'),
  L([grown, st('pirate', 'revolution'), { c: 'fame', min: 5 }], {}, '항구 게시판에 붙은 제 수배서 앞에서 사람들이 수군거렸다.'),
  L([grown, st('pirate', 'revolution')], { romance: 1 }, '동료들과 갑판에서 밤새 연회를 벌였다.', ['crew']),
  // ---------------- 해군
  L([grown, st('marine')], { peace: 1 }, '초소 앞에 쓰러진 행인을 부축해 진료소까지 데려갔다.'),
  M([grown, st('marine')], { greed: 1 }, '압수한 밀수품 몇 상자를 보고서에서 빼고 뒤로 팔았다.', 5000),
  L([grown, st('marine')], { justice: 1 }, '상인에게 뒷돈을 받는 고참을 보고 그 자리에서 따져 물었다.'),
  L([grown, st('marine')], { ambition: 1 }, '훈련이 끝난 뒤에도 연병장 모래밭을 몇 바퀴 더 달렸다.'),
  L([grown, st('marine')], { inquiry: 1 }, '항해 일지에 없는 섬의 이름을 해도에 적어 넣었다.'),
  L([grown, st('marine')], { romance: 1 }, '야간 경계를 서며 별이 쏟아지는 밤바다를 보았다.'),
  L([grown, st('marine')], { loyalty: 1 }, '함께 입대한 동기의 당번을 말없이 대신 섰다.'),
  L([grown, st('marine')], { freedom: 1 }, '쓸데없는 명령은 못 들은 척하고 맡은 구역만 돌았다.'),
  L([grown, st('marine')], { dominion: 1 }, '대련장에서 덤벼 오는 병사들을 차례로 바닥에 눕혔다.'),
  L([grown, st('marine')], { peace: 1 }, '길목의 말다툼을 말없이 떼어 놓고 각자 갈 길로 돌려보냈다.'),
  L([grown, st('marine')], {}, '제복 단추를 닦고 군화 끈을 새로 맸다.'),
  L([grown, st('marine')], {}, '기지 마당에서 아침 점호를 받고 구보를 했다.'),
  L([grown, st('marine')], {}, '밀린 보고서를 밤새 썼다.'),
  L([grown, st('marine')], { justice: 1 }, '{island}의 시민들이 제복을 보고 고개 숙여 인사했다.'),
  // ---------------- 혁명군
  L([grown, st('revolution')], { justice: 1 }, '검문에 걸린 노인의 짐을 대신 들고 골목 끝까지 바래다주었다.'),
  L([grown, st('revolution')], { justice: 1 }, '빼앗긴 곡식이 어디로 갔는지 찾아 마을 사람들에게 알렸다.'),
  L([grown, st('revolution')], { ambition: 1 }, '연락 지점을 모두 외울 때까지 지도를 몇 번이고 다시 그렸다.'),
  L([grown, st('revolution')], { inquiry: 1 }, '벽보 뒤에 숨겨 둔 쪽지를 모아 이름들을 맞춰 보았다.'),
  L([grown, st('revolution')], { romance: 1 }, '언젠가 올 새 세상 이야기를 모닥불 앞에서 밤새 나눴다.'),
  L([grown, st('revolution')], { loyalty: 1 }, '붙잡혀 간 동지의 이름을 끝까지 입에 올리지 않았다.'),
  L([grown, st('revolution')], { freedom: 1 }, '가명을 하나 더 지어 낯선 마을로 숨어들었다.'),
  L([grown, st('revolution'), fierce], { dominion: 1 }, '길을 막은 경비병을 정면으로 밀어붙이고 지나갔다.'),
  L([grown, st('revolution'), calm], { peace: 1 }, '부딪치기 싫어 어두운 뒷골목으로 우회했다.'),
  L([grown, st('revolution')], {}, '새벽 시장에서 빵을 사며 여느 손님처럼 굴었다.'),
  // ---------------- 현상금 사냥꾼
  L([grown, st('bountyHunter')], { justice: 1 }, '현상금도 없는 좀도둑을 붙잡아 상인에게 물건을 돌려주었다.'),
  L([grown, st('bountyHunter')], { loyalty: 1 }, '받은 보수를 떼어 수배범에게 털린 마을에 두고 왔다.'),
  L([grown, st('bountyHunter')], { ambition: 1 }, '게시판에서 가장 큰 현상금의 수배서를 뜯어 품에 넣었다.'),
  L([grown, st('bountyHunter')], { inquiry: 1 }, '수배범이 남긴 발자국과 꽁초로 간 길을 짐작했다.'),
  L([grown, st('bountyHunter')], { romance: 1 }, '사냥을 쉬고 노점 악사의 연주를 끝까지 들었다.'),
  L([grown, st('bountyHunter')], { loyalty: 1 }, '함께 쫓던 사냥꾼과 약속한 대로 현상금을 반씩 나눴다.'),
  L([grown, st('bountyHunter')], { freedom: 1 }, '마음에 들지 않는 의뢰는 값이 커도 받지 않았다.'),
  L([grown, st('bountyHunter'), fierce], { dominion: 1 }, '구역을 넘본 사냥꾼을 때려눕히고 {island}에서 쫓아냈다.'),
  L([grown, st('bountyHunter'), calm], { peace: 1 }, '시비를 거는 술꾼을 비켜 빈자리에서 조용히 밥을 먹었다.'),
  L([grown, st('bountyHunter')], {}, '무기를 손질하고 시장에 도는 소문을 들으러 나갔다.'),
  // ---------------- 조선공
  L([grown, st('shipwright')], { romance: 1 }, '수리비가 모자란 어부의 배를 저녁 늦게까지 남아 고쳐 주었다.'),
  M([grown, st('shipwright')], { greed: 1 }, '새 목재 값을 받고 헌 목재를 끼워 넣었다.', 3000),
  L([grown, st('shipwright')], { justice: 1 }, '썩은 목재를 섞어 판 목재상을 조선소 사람들 앞에서 따졌다.'),
  L([grown, st('shipwright')], { ambition: 1 }, '이음새가 꼭 맞을 때까지 같은 나무를 몇 번이고 깎았다.'),
  L([grown, st('shipwright')], { inquiry: 1 }, '오래된 배의 설계도를 펴 놓고 용골 잇는 법을 견주어 보았다.'),
  L([grown, st('shipwright')], { romance: 1 }, '남은 나무 조각으로 작은 배 모형을 깎아 창가에 두었다.'),
  L([grown, st('shipwright')], { loyalty: 1 }, '맡은 배는 끝까지 제 손으로 마무리하고 연장을 닦았다.'),
  L([grown, st('shipwright')], { freedom: 1 }, '도면을 덮어 두고 손이 가는 대로 뱃머리를 깎았다.'),
  L([grown, st('shipwright'), fierce], { dominion: 1 }, '작업 순서를 무시하는 목수를 윽박질러 제자리로 돌려보냈다.'),
  L([grown, st('shipwright'), calm], { peace: 1 }, '말다툼이 붙자 연장을 내려놓고 물러나 차를 끓였다.'),
  L([grown, st('shipwright')], {}, '대패 날을 갈고 바닥의 톱밥을 쓸어 담았다.'),
  // ---------------- 뭍사람 (시민)
  L([grown, st('civil')], { peace: 1 }, '팔고 남은 음식을 모아 굶는 이웃에게 갖다주었다.'),
  M([grown, st('civil')], { greed: 1 }, '저울 눈금을 슬쩍 틀어 놓고 하루 장사를 했다.', 1500),
  L([grown, st('civil')], { justice: 1 }, '저울을 속이는 상인 앞에서 눈금을 다시 달아 보였다.'),
  L([grown, st('civil')], { ambition: 1 }, '남보다 한 시간 일찍 문을 열고 한 시간 늦게 닫았다.'),
  L([grown, st('civil')], { inquiry: 1 }, '항구에 들어온 신문을 사서 먼 나라 소식을 꼼꼼히 읽었다.'),
  L([grown, st('civil')], { romance: 1 }, '일을 마치고 문간에 앉아 낡은 기타를 퉁겼다.'),
  L([grown, st('civil')], { loyalty: 1 }, '오래 거래한 집의 물건만은 값이 올라도 계속 받아 썼다.'),
  L([grown, st('civil')], { freedom: 1 }, '하루 일을 쉬고 발길 닿는 대로 섬 반대편까지 걸었다.'),
  L([grown, st('civil'), fierce], { dominion: 1 }, '좋은 좌판 자리를 두고 다투던 장사꾼을 밀어붙여 쫓아냈다.'),
  L([grown, st('civil')], { peace: 1 }, '손님끼리 다투자 차 한 잔씩 내주며 가라앉혔다.'),
  L([grown, st('civil')], {}, '가게를 닫고 바닥을 닦은 뒤 장부를 맞춰 보았다.'),
  // ---------------- 뭍에 자리 잡은 사람
  L([grown, st('settled')], { justice: 1 }, '우물에 물을 길어 두고 지나가는 사람도 마시게 했다.'),
  L([grown, st('settled')], { greed: 1 }, '흉년을 기다리며 곳간의 곡식을 풀지 않았다.'),
  L([grown, st('settled')], { justice: 1 }, '마을 공동 창고의 장부를 누구나 보게 내걸었다.'),
  L([grown, st('settled')], { ambition: 1 }, '돌밭을 갈아엎어 밭을 한 고랑 더 늘렸다.'),
  L([grown, st('settled')], { inquiry: 1 }, '바닷가에 밀려온 낯선 물건이 어디서 왔는지 따져 보았다.'),
  L([grown, st('settled')], { romance: 1 }, '장이 파한 빈 광장에서 혼자 콧노래를 부르며 춤을 췄다.'),
  L([grown, st('settled')], { loyalty: 1 }, '오래전 누군가와 함께 심은 나무에 올해도 거름을 주었다.'),
  L([grown, st('settled')], { freedom: 1 }, '마을 모임에 빠지고 혼자 산마루에 올라 바람을 쐬었다.'),
  L([grown, st('settled')], { dominion: 1 }, '이웃이 넘겨 박은 울타리 말뚝을 뽑아 제자리에 도로 박았다.'),
  L([grown, st('settled')], { peace: 1 }, '이웃끼리 다투는 소리에 나가 양쪽을 차분히 달랬다.'),
  L([grown, st('settled')], {}, '마당 잡초를 뽑고 처마 밑에 빗물 받을 통을 놓았다.'),
  // ---------------- 은퇴한 사람
  L([grown, st('retired')], { loyalty: 1 }, '시장 골목의 부서진 의자를 고쳐 아이들이 앉게 내주었다.'),
  L([grown, st('retired')], { justice: 1 }, '억울하게 벌금을 문 장사꾼 편에 서서 관리에게 따졌다.'),
  L([grown, st('retired')], { ambition: 1 }, '몸이 허락하는 한 매일 언덕길을 올랐다.'),
  L([grown, st('retired')], { inquiry: 1 }, '서랍 속 항해 책을 펴 가 보지 못한 섬을 찾아보았다.'),
  L([grown, st('retired')], { romance: 1 }, '포구에서 들려오는 뱃노래에 맞춰 잊었던 가락을 흥얼거렸다.'),
  L([grown, st('retired')], { loyalty: 1 }, '옛 벗의 생일이면 해마다 같은 자리에 모였다.'),
  L([grown, st('retired')], { freedom: 1 }, '정해진 끼니 시간도 없이 내키는 대로 먹고 잤다.'),
  L([grown, st('retired'), fierce], { dominion: 1 }, '광장에서 시비를 건 젊은이를 큰소리로 몰아붙였다.'),
  L([grown, st('retired'), calm], { peace: 1 }, '모임에서 다툼이 번지자 조용히 일어나 집으로 돌아왔다.'),
  L([grown, st('retired')], {}, '해 질 녘 창틀을 닦고 찻잔을 가지런히 놓았다.'),
  // ---------------- 감옥
  L([grown, st('prisoner')], { romance: 1 }, '배급받은 빵을 반으로 나눠 앓는 옆 감방 사람에게 건넸다.'),
  L([grown, st('prisoner')], { justice: 1 }, '누명을 쓴 죄수 편에 서서 간수 앞에서 사정을 말했다.'),
  L([grown, st('prisoner')], { ambition: 1 }, '좁은 감방 바닥에서 날마다 팔굽혀펴기를 했다.'),
  L([grown, st('prisoner')], { inquiry: 1 }, '벽에 새겨진 옛 죄수들의 표식을 하나씩 풀어 보았다.'),
  L([grown, st('prisoner')], { romance: 1 }, '창살 틈으로 보이는 손바닥만 한 하늘에 바다를 그려 보았다.'),
  L([grown, st('prisoner')], { loyalty: 1 }, '맡겨진 비밀을 끝까지 입 밖에 내지 않았다.'),
  L([grown, st('prisoner')], { freedom: 1 }, '벽돌 틈과 간수의 발소리를 세며 나갈 틈을 살폈다.'),
  L([grown, st('prisoner'), fierce], { dominion: 1 }, '감방을 휘어잡으려던 사내를 먼저 밀어붙여 물러서게 했다.'),
  L([grown, st('prisoner')], { peace: 1 }, '복도의 시비에도 대꾸하지 않고 벽에 기대 눈을 감았다.'),
  L([grown, st('prisoner')], {}, '벽에 금을 그어 지난 날수를 세었다.'),

  // ======================================================== 바다 위 (배를 타는 처지)
  L([grown, atSea], {}, '거친 파도 속에서 밤새 돛줄을 붙잡고 버텼다.'),
  L([grown, atSea], { ambition: 1 }, '모두 잠든 갑판 한쪽에서 혼자 수련했다.'),
  L([grown, atSea], { inquiry: 1 }, '지나온 바닷길을 해도에 새로 그려 넣었다.'),
  L([grown, atSea], {}, '배 옆으로 해왕류의 등이 천천히 지나갔다.'),
  L([grown, atSea], {}, '{island}에 배를 대고 물과 식량을 채웠다.'),
  L([grown, atSea], {}, '안개가 짙어 하루 종일 닻을 내리고 기다렸다.'),
  L([grown, atSea], { freedom: 1 }, '갑판에 드러누워 구름이 흘러가는 것을 보았다.'),
  L([grown, atSea], { peace: 1 }, '뱃전에 낚싯대를 드리우고 한나절을 보냈다.'),

  // ======================================================== 어른 누구나
  L(grown, {}, '{island}의 이름난 요리를 배불리 먹었다.'),
  L(grown, {}, '밧줄에 손바닥이 쓸려 며칠 따끔거렸다.'),
  L([grown, island('쿠라우 도시', '고래숲', '조우')], {}, '조우에서 먼 바다를 다녀온 밍크족 여행자의 모험담을 들었다.'),
  L([grown, island('엔젤섬', '스카이피아')], {}, '하늘섬의 구름길에서 아래 바다를 다녀온 방문객의 이야기를 들었다.'),
  L([grown, island('샨디아 마을')], {}, '샨디아 전사들이 들려주는 오래된 땅의 이야기에 귀를 기울였다.'),
  L([grown, island('어인가', '류구 왕국', '바다의 숲', '어인섬')], {}, '어인섬에서 지상에 다녀온 이가 들려주는 이야기를 들었다.'),
  L([grown, island('하나노미야코', '쿠리', '에비스 마을', '와노쿠니')], {}, '와노쿠니에서 떠돌이 낭인이 들려주는 먼 고을 이야기에 귀를 기울였다.'),
  L([grown, { c: 'island', is: ['쿠라우 도시', '고래숲', '조우', '엔젤섬', '스카이피아', '샨디아 마을', '어인가', '류구 왕국', '바다의 숲', '어인섬', '하나노미야코', '쿠리', '에비스 마을', '와노쿠니'], not: true }], {}, '{island}에서 길손이 들려준 먼 곳의 이야기를 들었다.'),
  L(grown, {}, '차가운 바닷바람에 외투 깃을 세웠다.'),
  L(grown, {}, '몸 성히 지내라는 {parent}의 편지가 왔다.', ['parent']),
  L(grown, { loyalty: 1 }, '동료와 밤새 서로의 꿈 이야기를 나눴다.', ['crew']),
  L([grown, fruit], {}, '파도가 덮쳐 와 바다에 빠질 뻔했다. 열매를 먹은 몸이 원망스러웠다.'),
  L([grown, fruit], { inquiry: 1 }, '열매의 힘을 이리저리 시험해 보았다.'),
  // ---------------- 젊은 날 (16~35)
  M(youth, { freedom: 1 }, '손에 쥔 큰돈을 하루 만에 다 써 버렸다.', -10000),
  L(youth, {}, '밤새 뛰어다니고도 아침이면 몸이 가뿐했다.'),
  L(youth, { romance: 1 }, '항구 축제에서 처음 본 사람과 밤새 이야기를 나눴다.'),
  { ...L([youth, { c: 'value', id: 'ambition', deep: true }, fierce], { ambition: 1 },
    '자기보다 강하다는 싸움꾼이 결투에서 상대가 칼을 뽑기도 전에 넘어뜨렸다는 소문이 돌았다. 어떤 발놀림이었는지 끝까지 캐묻고, 잠자리에 들어서도 그 움직임을 막을 방법을 몇 번이고 그려 보았다.'),
    onceKey: 'stronger_rumor' },
  // ---------------- 한창때 (36~59)
  L(prime, {}, '어깨가 결려 아침 수련을 짧게 끝냈다.'),
  L(prime, {}, '젊은 날의 무모한 일을 떠올리며 혀를 찼다.'),
  L(prime, { peace: 1 }, '겁 없이 덤비는 젊은이들을 보면 걱정이 앞섰다.'),
  L(prime, { inquiry: 1 }, '모은 돈을 세어 보며 남은 날들을 헤아렸다.'),
  L({ c: 'age', min: 40 }, { justice: 1 }, '젊은 선원에게 매듭 묶는 요령을 가르쳤다.'),
  // ---------------- 노년 (60~)
  L(elder, {}, '이가 하나 빠져 딱딱한 빵을 국에 적셔 먹었다.'),
  L(elder, { romance: 1 }, '동네 꼬마들이 옛날이야기를 해 달라고 졸랐다.'),
  L(elder, { inquiry: 1 }, '젊어서 다닌 바다의 이름을 하나씩 잊어 가는 게 서운했다.'),
  L(elder, { peace: 1 }, '볕 드는 창가에서 졸다 깨다 하루를 보냈다.'),
];
