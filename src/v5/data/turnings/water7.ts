// 워터 세븐에서 태어난 인생 (4단계 과제 4). 물길이 거리를 가르는 조선의 도시와 바다 열차의 섬들.
// 원작의 때: 주인공이 다섯 살 무렵 톰의 재판(사법의 섬으로 끌려간다), 열두 살 무렵 아이스버그가 조선소를 하나로 묶는다(갈레라 컴퍼니),
// 열두~열일곱 살 사이 CP9가 목수로 숨어 산다, 열여덟 살 무렵 가면의 밤과 아쿠아 라구나, 그 뒤 프랑키가 아담 나무로 배를 짓는다.
// 원작 순간은 전환점과 만남(minors.ts) 가운데 하나로만 쓴다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
// 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { HOMETOWNS } from '../../../data/births';
import { kid, POOR, RICH } from './childhood';
import { age, home, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const TOWNS = HOMETOWNS.filter((t) => t.home === 'water7').map((t) => t.name);
const here: Cond[] = [home('water7'), { c: 'island', is: TOWNS }];
/** 워터 세븐의 아이 (고향을 떠나지 않았다) */
const kidW = (min: number, max: number, ...more: Cond[]): Cond[] => [...kid(min, max), ...here, ...more];
/** 그 마을의 아이 */
const kidIn = (town: string, min: number, max: number, ...more: Cond[]): Cond[] => [...kid(min, max), home('water7'), { c: 'town', is: [town] }, { c: 'island', is: [town] }, ...more];
/** 워터 세븐에 사는 어른 */
const adult = (min: number, max: number | undefined, ...more: Cond[]): Cond[] => [...here, age(min, max), ...more];
const LANDED = st('civil', 'shipwright', 'settled', 'retired');
const crossing: Cond = { c: 'standingYears', min: 1 };

export const WATER7: Turning[] = [
  // ---------------------------------------------------------------- 어린 시절
  {
    id: 'w7k_yagara_race', kind: 'door', when: kidW(6, 13), weight: 8, repeat: 'once', speaker: 'hero',
    title: '야가라 경주', body: '물길을 오가는 야가라(물소처럼 생긴 큰 물고기) 경주가 열린다. 이긴 아이에게는 시장 상인회가 새 노를 준다. 빌린 야가라는 늙고 느리다.',
    doors: [
      { label: '늙은 야가라를 달래 가며 끝까지 달린다', hint: '꼴찌일지 모른다. 야가라와는 친해진다', values: { devotion: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
      { label: '지름길 물길로 몰래 빠진다', hint: '들키면 쫓겨난다. 안 들키면 새 노를 받는다', values: { freedom: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 3000 }, { op: 'log', text: '지름길로 빠져 일등으로 들어왔다. 상인회장은 고개를 갸웃했다.', weight: 'light' }],
               else: [{ op: 'log', text: '지름길 끝에서 심판의 배가 기다리고 있었다.', weight: 'light' }] }] },
      { label: '경주 대신 물길 지도를 그린다', hint: '물길마다 물살이 다르다는 것을 안다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'w7k_dock_nails', kind: 'door', when: kidW(5, 12), weight: 9, repeat: 'once', speaker: 'hero',
    title: '도크의 녹슨 못', body: '조선소 도크 바닥에 버려진 못과 쇳조각을 주워 고철상에 팔면 빵 한 덩이 값이 된다. 경비가 오면 혼이 난다.',
    doors: [
      { label: '경비의 눈을 피해 한 자루를 채운다', hint: '빵값을 번다. 들키면 귀를 잡힌다', values: { freedom: D }, fx: [{ op: 'money', add: 2000 }] },
      { label: '경비에게 주워도 되느냐고 묻는다', hint: '허락을 받으면 떳떳하다. 안 된다고 할지 모른다', values: { justice: D },
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'money', add: 1500 }, { op: 'person', kind: 'ally', relation: '도크의 경비' }], else: [] }] },
      { label: '주운 못으로 작은 배를 만들어 본다', hint: '돈은 못 번다. 손이 야물어진다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'w7k_scrap_gang', kind: 'door', when: kidIn('워터 세븐 뒷골목', 9, 15), weight: 8, repeat: 'once', speaker: { relation: '해체업자 패거리의 형' },
    title: '해체업자 형들', body: '뒷골목 해체장의 형들이 버려진 배를 뜯어 고철로 판다. 망을 볼 꼬마가 하나 필요하다고 한다. 해적의 배도 가리지 않는다.',
    doors: [
      { label: '망을 보며 형들과 어울린다', hint: '뒷골목의 한패가 된다', values: { loyalty: D }, mark: 'fellowship', fx: [{ op: 'person', kind: 'ally', relation: '해체장의 형' }, { op: 'money', add: 2000 }] },
      { label: '해적 배를 뜯는 날만 끼어든다', hint: '해적의 물건은 값이 비싸다. 해적이 돌아오면 큰일이다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7, then: [{ op: 'money', add: 6000 }], else: [{ op: 'hp', add: -15 }, { op: 'log', text: '배 주인이 돌아왔다. 형들과 함께 물길로 달아났다.', weight: 'light' }] }] },
      { label: '형들과 어울리지 않는다', hint: '뒷골목에서 혼자 지낸다', closes: true, fx: [] },
    ],
  },
  {
    id: 'w7k_aqua_roof', kind: 'door', when: kidW(6, 15), weight: 7, repeat: 'once', speaker: 'hero',
    title: '해일 대비', body: '아쿠아 라구나 철이 다가와 아랫동네 사람들이 짐을 윗동네로 옮긴다. 혼자 사는 할머니 집은 아직 짐이 그대로다.',
    doors: [
      { label: '할머니 짐부터 옮긴다', hint: '제 짐은 늦어진다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '아랫동네 할머니' }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '짐 나르는 일을 하고 품삯을 받는다', hint: '돈을 받고 아무 집이나 옮긴다', values: { ambition: D }, fx: [{ op: 'money', add: 2500 }] },
      { label: '물길 둑에 모래주머니를 쌓는 어른들을 돕는다', hint: '동네 전체를 지킨다', values: { justice: D }, fx: [{ op: 'base', key: 'str', add: 1 }] },
    ],
  },
  {
    id: 'w7k_model_ship', kind: 'door', when: kidW(7, 14), weight: 7, repeat: 'once', speaker: 'hero',
    title: '모형 배 대회', body: '목수들이 아이들을 모아 모형 배 대회를 연다. 물길에 띄워 가장 멀리 가는 배가 이긴다. 부잣집 아이는 직공이 대신 깎아 준 배를 들고 왔다.',
    doors: [
      { label: '제 손으로 깎은 배로 나간다', hint: '못생겼어도 제 배다', values: { romance: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '심사하는 목수에게 부잣집 배를 일러바친다', hint: '공정해진다. 부잣집 아이가 앙심을 품는다', values: { justice: D }, fx: [{ op: 'person', kind: 'rival', relation: '모형 배 대회의 부잣집 아이' }] },
      { label: '부잣집 아이에게 배를 깎아 주고 돈을 받는다', hint: '상은 남의 것이 된다. 돈은 내 것이다', values: { dominion: D }, fx: [{ op: 'money', add: 3000 }] },
    ],
  },
  {
    id: 'w7k_galley_kid', kind: 'door', when: kidW(6, 13), weight: 7, repeat: 'once', speaker: 'hero',
    title: '직공장 집 아이', body: '직공장 집 아이가 우리 아버지가 이 도시의 배를 다 짓는다며 뻐긴다. 물길가 아이들이 고개를 숙인다.',
    doors: [
      { label: '배는 혼자 짓는 게 아니라고 쏘아붙인다', hint: '말싸움이 주먹다짐이 된다', values: { freedom: D }, fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'rival', relation: '직공장 집 아이' }] },
      { label: '그 아이와 친해져 조선소 구경을 간다', hint: '도크 안을 처음 본다', values: { inquiry: D }, fx: [{ op: 'person', kind: 'ally', relation: '직공장 집 아이' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '그 아이 무리를 제 아래로 끌어들인다', hint: '물길가 아이들의 우두머리가 된다', special: 'dominion', values: { dominion: D }, fx: [{ op: 'fame', add: 2 }] },
    ],
  },
  {
    id: 'w7k_rail', kind: 'door', when: kidW(6, 14), weight: 7, repeat: 'once', speaker: 'hero',
    title: '바다 위의 선로', body: '바다 위로 뻗은 선로를 따라 걸으면 옆 섬까지 갈 수 있다는 소문이 있다. 열차가 언제 오는지는 아무도 모른다.',
    doors: [
      { label: '선로를 따라 옆 섬까지 걸어간다', hint: '열차가 오면 위험하다. 처음 보는 섬을 본다', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.75, then: [{ op: 'base', key: 'spd', add: 1 }, { op: 'log', text: '해 질 녘에 옆 섬의 역에 닿았다. 역장 할머니가 혀를 차며 돌려보냈다.', weight: 'light' }],
               else: [{ op: 'hp', add: -20 }, { op: 'log', text: '기적 소리에 선로 옆으로 뛰어내렸다. 열차가 코앞을 지나갔다.', weight: 'heavy' }] }] },
      { label: '열차 시간을 적어 아이들에게 알려 준다', hint: '아무도 안 다치게 된다', values: { justice: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'w7k_tourist_purse', kind: 'door', when: kidW(7, 15), weight: 7, repeat: 'once', speaker: 'hero',
    title: '관광객의 지갑', body: '배를 맞추러 온 부자 관광객이 물길가 의자에 두툼한 지갑을 두고 곤돌라에 올랐다. 곤돌라는 벌써 다리 밑을 지난다.',
    doors: [
      { label: '지갑을 들고 물길을 따라 달린다', hint: '돌려준다. 사례를 받을지도 모른다', values: { justice: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 5000 }], else: [] }, { op: 'base', key: 'spd', add: 1 }] },
      { label: '지갑을 품에 넣는다', hint: '큰돈이 생긴다. 뒷골목에 소문이 난다', values: { dominion: D }, fx: [{ op: 'money', add: 15000 }, { op: 'hardship', add: 1 }] },
      { label: '지갑을 경비 초소에 맡긴다', hint: '내 손은 깨끗하다. 주인이 찾을지는 모른다', values: { loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'w7k_flooded_home', kind: 'door', when: kidW(5, 14, POOR), weight: 8, repeat: 'once', speaker: 'hero',
    title: '물에 잠긴 아랫동네', body: '물길이 넘쳐 아랫동네 집 바닥이 무릎까지 잠겼다. 물이 빠지려면 며칠이 걸린다. 윗동네 여관은 물이 안 든다.',
    doors: [
      { label: '여관 부엌에서 일하고 잠자리를 얻는다', hint: '며칠 동안 남의 집 그릇을 닦는다', values: { ambition: D }, fx: [{ op: 'money', add: 1500 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '아랫동네 아이들과 지붕 위에서 버틴다', hint: '함께 젖는다. 서로를 기억한다', values: { loyalty: D }, mark: 'fellowship', fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'ally', relation: '지붕 위에서 함께 버틴 아이' }] },
      { label: '물이 차오르는 길을 따라 막힌 하수구를 찾는다', hint: '어른들도 모르는 원인을 찾을지 모른다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'w7k_pirate_errand', kind: 'door', when: kidW(8, 15), weight: 7, repeat: 'once', speaker: { relation: '배를 고치러 온 해적' },
    title: '해적의 심부름', body: '배를 고치러 온 해적 하나가 동전을 튕기며, 도크가 비는 밤이 언제냐고 묻는다. 대답만 해 주면 동전은 네 것이라고 한다.',
    doors: [
      { label: '동전을 받고 알려 준다', hint: '돈을 번다. 그 밤 도크에서 무슨 일이 날지 모른다', values: { ambition: D }, fx: [{ op: 'money', add: 4000 }, { op: 'hardship', add: 1 }] },
      { label: '경비에게 해적이 수상하다고 알린다', hint: '해적이 앙심을 품을지 모른다', values: { justice: D }, fx: [{ op: 'person', kind: 'enemy', relation: '도크를 노린 해적' }, { op: 'fame', add: 1 }] },
      { label: '해적에게 바다 이야기를 대신 들려 달라고 한다', hint: '돈 대신 이야기를 받는다', values: { romance: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'w7k_old_carpenter', kind: 'door', when: kidW(8, 15), weight: 7, repeat: 'once', speaker: { relation: '은퇴한 늙은 목수' },
    title: '늙은 목수의 이야기', body: '물길가 의자에 앉은 늙은 목수가, 옛날 이 도시에는 바다 위로 달리는 열차를 만든 어인 목수가 있었다고 한다. 그 목수는 세계정부에 끌려갔다.',
    doors: [
      { label: '그 목수의 설계도가 어디 있는지 묻는다', hint: '위험한 이야기다. 늙은 목수가 입을 다물지 모른다', values: { inquiry: D }, fx: [{ op: 'flag', id: 'w7_tom_story' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '늙은 목수의 연장을 닦아 준다', hint: '이야기 값을 한다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '늙은 목수' }] },
    ],
  },
  {
    id: 'w7k_carpenter_trial', kind: 'door', when: kidW(13, 15), weight: 8, repeat: 'once', speaker: { relation: '조선소의 직공장' },
    title: '견습 목수 시험', body: '조선소가 견습 목수를 뽑는다. 하루 동안 커다란 들보 하나를 혼자 깎아야 한다. 직공 집 아이들은 미리 연습을 했다.',
    doors: [
      { label: '손바닥이 터지도록 들보를 깎는다', hint: '붙을지 모른다. 붙으면 조선소에 이름이 남는다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -5 }, { op: 'chance', p: 0.55, then: [{ op: 'flag', id: 'w7_apprentice' }, { op: 'log', text: '직공장이 들보를 쓰다듬고는 내일부터 나오라고 했다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '들보는 반쯤 깎였다. 직공장이 내년에 다시 오라고 했다.', weight: 'light' }] }] },
      { label: '옆 아이의 연장이 부러지자 제 것을 빌려준다', hint: '내 들보가 늦어진다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '견습 시험에서 연장을 빌려준 아이' }] },
      { label: '시험 대신 고철상 일을 한다', hint: '하루 품삯을 번다', values: { freedom: D }, fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'w7k_cola', kind: 'door', when: kidIn('워터 세븐 뒷골목', 7, 14), weight: 7, repeat: 'once', speaker: 'hero',
    title: '콜라 상자', body: '뒷골목 창고에 콜라 상자가 산처럼 쌓여 있다. 해체업자 두목이 콜라를 마시면 힘이 솟는다나. 창고 문이 열려 있다.',
    doors: [
      { label: '한 병만 슬쩍한다', hint: '두목이 알면 혼쭐이 난다', values: { freedom: D }, fx: [{ op: 'chance', p: 0.6, then: [{ op: 'base', key: 'spd', add: 1 }], else: [{ op: 'hp', add: -5 }] }] },
      { label: '창고 문을 닫아 준다', hint: '아무도 모르는 일을 한다', values: { loyalty: D }, fx: [] },
      { label: '콜라를 상자째 날라 주고 품삯을 받는다', hint: '뒷골목 사람들과 얼굴을 튼다', values: { romance: D }, fx: [{ op: 'money', add: 2500 }, { op: 'person', kind: 'ally', relation: '콜라 창고지기' }] },
    ],
  },
  {
    id: 'w7k_station_kid', kind: 'door', when: kidIn('시프트 역', 5, 14), weight: 8, repeat: 'once', speaker: 'hero',
    title: '역 앞의 아이', body: '열차가 닿을 때마다 역 앞은 사람들로 붐빈다. 짐을 들어 주면 동전을 주는 손님도 있고, 짐을 맡기고 사라지는 손님도 있다.',
    doors: [
      { label: '짐을 들어 주고 동전을 모은다', hint: '하루 종일 역을 뛰어다닌다', values: { romance: D }, fx: [{ op: 'money', add: 2500 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '주인 없는 짐을 열어 본다', hint: '무엇이 들었는지 모른다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 6000 }], else: [{ op: 'hardship', add: 1 }, { op: 'log', text: '짐 속에는 해군 문양이 찍힌 서류뿐이었다. 얼른 제자리에 두었다.', weight: 'light' }] }] },
      { label: '길 잃은 손님을 숙소까지 데려다준다', hint: '동전 대신 고맙다는 말을 듣는다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '길을 안내해 준 손님' }] },
    ],
  },
  {
    id: 'w7k_rich_school', kind: 'door', when: kidW(9, 15, RICH), weight: 6, repeat: 'once', speaker: 'hero',
    title: '설계 학교', body: '넉넉한 집 아이들만 다니는 설계 학교에 자리가 났다. 물길가 친구들은 그 학교 아이들을 「책상 목수」라고 놀린다.',
    doors: [
      { label: '학교에 들어가 설계를 배운다', hint: '친구들과 멀어진다. 배의 뼈대를 읽게 된다', values: { inquiry: D }, fx: [{ op: 'money', add: -10000 }, { op: 'base', key: 'int', add: 2 }] },
      { label: '학교 대신 도크에서 손으로 배운다', hint: '친구들 곁에 남는다', values: { loyalty: D }, fx: [{ op: 'base', key: 'str', add: 1 }] },
    ],
  },
  {
    id: 'w7k_rat_catcher', kind: 'door', when: kidW(6, 13, POOR), weight: 7, repeat: 'once', speaker: { relation: '조선소 창고지기' },
    title: '창고의 쥐잡이', body: '조선소 창고의 쥐가 돛천을 갉아 먹는다. 창고지기는 쥐 한 마리에 동전 한 닢을 준다고 한다. 어른들은 쳐다보지도 않는 일이다.',
    doors: [
      { label: '밤새 쥐를 잡는다', hint: '돈은 적다. 창고지기의 눈에 든다', values: { loyalty: D }, fx: [{ op: 'money', add: 1500 }, { op: 'person', kind: 'ally', relation: '조선소 창고지기' }] },
      { label: '쥐 대신 쥐구멍을 막는 법을 궁리한다', hint: '한 번에 끝낼지 모른다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '뒷골목 아이들을 불러 함께 잡고 나눈다', hint: '몫은 줄고, 아이들이 따른다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '함께 쥐를 잡은 아이' }] },
    ],
  },
  // ---------------------------------------------------------------- 원작 순간
  {
    // 원작: 루피가 바다에 나오기 열두 해 전, 바다 열차를 만든 어인 목수 톰이 사법의 섬으로 끌려간다
    id: 'w7_cn_tom_trial', kind: 'door', when: kidW(4, 7), weight: 10, repeat: 'once', speaker: 'hero',
    title: '끌려가는 어인 목수', body: '바다 열차를 만든 어인 목수가 쇠사슬에 묶여 정부의 배에 오른다. 목수는 웃으며 제 배에 부끄러운 데는 없다고 말한다. 젊은 제자 하나가 울부짖으며 배를 쫓아 달린다.',
    doors: [
      { label: '어른들 틈을 비집고 목수에게 손을 흔든다', hint: '그 웃음을 오래 기억한다', values: { romance: D }, fx: [{ op: 'flag', id: 'w7_saw_tom' }, { op: 'timeline', text: '끌려가는 어인 목수 톰을 보았다', canon: 'tom' }] },
      { label: '정부의 관리에게 돌을 던진다', hint: '어린 손이라도 붙잡히면 큰일이다', values: { justice: D }, danger: true,
        fx: [{ op: 'flag', id: 'w7_saw_tom' }, { op: 'chance', p: 0.6, then: [{ op: 'hp', add: -5 }], else: [{ op: 'hp', add: -15 }, { op: 'hardship', add: 2 }] },
             { op: 'timeline', text: '끌려가는 어인 목수 톰을 향해 돌을 던졌다', canon: 'tom' }] },
      { label: '울부짖는 제자의 옷자락을 붙잡는다', hint: '배를 쫓다 물에 빠질 것 같다', values: { devotion: D },
        fx: [{ op: 'flag', id: 'w7_saw_tom' }, { op: 'person', kind: 'ally', relation: '어인 목수의 젊은 제자', canon: 'franky' }, { op: 'timeline', text: '울부짖는 목수의 제자를 붙잡았다', canon: 'franky' }] },
    ],
  },
  {
    // 원작: 루피가 바다에 나오기 다섯 해 전, 아이스버그가 일곱 조선소를 하나로 묶어 갈레라 컴퍼니를 세우고 시장이 된다
    id: 'w7_cn_galley_founded', kind: 'door', when: [...here, age(10, 15), st('child', 'civil', 'shipwright'), { c: 'flag', id: 'left_home_young', has: false }], weight: 9, repeat: 'once', speaker: { canon: 'iceburg' },
    title: '일곱 조선소가 하나로', body: '서로 으르렁대던 일곱 조선소가 하나로 묶인다. 앞에 선 사내는 쥐를 주머니에 넣은 채, 이제 이 도시의 배는 하나의 이름으로 짓는다고 말한다. 갈 곳 잃은 늙은 직공들이 웅성거린다.',
    doors: [
      { label: '새 조선소의 문을 두드린다', hint: '일손이 모자라다고 한다', values: { ambition: D }, fx: [{ op: 'flag', id: 'w7_apprentice' }, { op: 'person', kind: 'ally', relation: '갈레라 컴퍼니의 사장', canon: 'iceburg' }] },
      { label: '갈 곳 잃은 늙은 직공들 편에 선다', hint: '새 시장에게 밉보인다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '쫓겨난 늙은 직공' }, { op: 'hardship', add: 1 }] },
      { label: '시장의 연설을 끝까지 듣는다', hint: '도시가 바뀌는 날을 본다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    // 원작: 루피가 바다에 나오고 한 해쯤 뒤, 가면을 쓴 자들이 시장의 저택을 습격한다(CP9). 같은 밤 아쿠아 라구나가 온다
    id: 'w7_cn_masks', kind: 'door', when: adult(17, 20, st('civil', 'shipwright', 'child', 'settled')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '가면의 밤', body: '시장의 저택에서 총소리가 났다. 가면을 쓴 자들이 지붕 위를 달린다. 그 걸음걸이가, 비둘기를 어깨에 얹고 다니던 조선소의 말 없는 목수와 똑같다.',
    doors: [
      { label: '저택으로 달려가 시장을 끌어낸다', hint: '불길 속이다. 가면들과 마주칠지 모른다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'person', kind: 'ally', relation: '불길에서 끌어낸 시장', canon: 'iceburg' }, { op: 'fame', add: 5 },
             { op: 'timeline', text: '가면의 밤, 불타는 저택에서 시장을 끌어냈다', canon: 'iceburg' }] },
      { label: '가면 쓴 목수의 이름을 경비대에 알린다', hint: '아무도 믿지 않을지 모른다. 그 목수의 눈이 {name}을(를) 본다', values: { justice: D },
        fx: [{ op: 'person', kind: 'enemy', relation: '비둘기를 얹은 가면의 사내', canon: 'lucci' }, { op: 'timeline', text: '가면의 밤, 가면 쓴 목수의 정체를 알렸다', canon: 'lucci' }] },
      { label: '아랫동네 사람들을 해일에서 피신시킨다', hint: '저택은 남에게 맡긴다. 오늘 밤 해일이 온다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '해일의 밤에 구한 이웃' }, { op: 'base', key: 'vit', add: 1 }] },
    ],
  },
  {
    // 원작: 사법의 섬 사건 뒤, 프랑키가 아담 나무로 밀짚모자의 배를 짓는다
    id: 'w7_cn_adam_tree', kind: 'door', when: adult(18, 22, st('civil', 'shipwright', 'settled')), weight: 8, repeat: 'once', speaker: { canon: 'franky' },
    title: '아담 나무의 배', body: '뒷골목의 해체업자 두목이 귀한 나무로 배를 짓는다. 사자 머리를 단 배다. 두목은 콜라를 들이켜며, 손이 하나 모자란다고 한다.',
    doors: [
      { label: '망치를 들고 사흘 밤을 함께 새운다', hint: '전설의 배에 못 하나를 박는다', values: { romance: D },
        fx: [{ op: 'base', key: 'str', add: 1 }, { op: 'person', kind: 'ally', relation: '사자 머리 배의 목수', canon: 'franky' }, { op: 'timeline', text: '사자 머리 배를 짓는 데 못 하나를 보탰다', canon: 'franky' }] },
      { label: '남은 나무 조각을 얻어 제 배의 용골로 쓴다', hint: '언젠가 나만의 배를 짓는다', values: { ambition: D }, fx: [{ op: 'flag', id: 'w7_adam_scrap' }, { op: 'timeline', text: '전설의 나무 조각을 얻었다', canon: 'franky' }] },
    ],
  },
  // ---------------------------------------------------------------- 워터 세븐만의 문 (처지)
  {
    id: 'w7_galley_hire', kind: 'door', when: adult(16, 32, st('child', 'civil'), crossing), weight: 8, repeat: 'once', speaker: { relation: '갈레라 컴퍼니의 직공장' },
    title: '갈레라 컴퍼니의 문', body: '도시에서 가장 큰 조선소가 목수를 뽑는다. 들보를 단번에 쪼개는 직공장이 지원자들의 손을 하나하나 본다.',
    doors: [
      { label: '목수로 들어간다', hint: '이 도시의 배를 짓는 사람이 된다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'shipwright' }, { op: 'log', text: '갈레라 컴퍼니의 작업복을 받았다. 소매가 길었다.', weight: 'heavy' }, { op: 'timeline', text: '갈레라 컴퍼니의 목수가 되었다' }] },
      { label: '직공장 자리를 노리고 들어간다', hint: '처음부터 경쟁이다. 동기들이 경계한다', when: [{ c: 'flag', id: 'w7_apprentice', has: true }], values: { ambition: D },
        fx: [{ op: 'standing', to: 'shipwright' }, { op: 'fame', add: 3 }, { op: 'person', kind: 'rival', relation: '조선소의 동기' }, { op: 'timeline', text: '견습 시절의 이름으로 갈레라 컴퍼니에 들어갔다' }] },
      { label: '남의 조선소에서는 일하지 않는다', hint: '제 손으로 따로 길을 낸다', closes: true, values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'w7_cp_offer', kind: 'door', when: adult(16, 28, st('child', 'civil', 'shipwright'), crossing, { c: 'tier', branch: 'any', min: 2 }), weight: 4, repeat: 'once', speaker: { relation: '검은 양복의 사내' },
    title: '검은 양복의 제안', body: '검은 양복을 입은 사내가 {name}의 싸움을 지켜봤다고 한다. 세계정부의 이름 없는 일을 하면, 이름 대신 힘을 주겠다고 한다.',
    doors: [
      { label: '제안을 받아들인다', hint: '이름을 버리고 정부의 그림자가 된다', values: { dominion: D },
        fx: [{ op: 'standing', to: 'cp' }, { op: 'flag', id: 'cpNew' }, { op: 'log', text: '그날 밤 {name}의 이름은 거리에서 사라졌다.', weight: 'heavy' }, { op: 'timeline', text: '세계정부의 첩보원이 되었다' }] },
      { label: '그 일이 누구를 지키는 일이냐고 묻는다', hint: '사내가 웃는다. 대답은 받아들이고 나서야 듣는다', values: { justice: D },
        fx: [{ op: 'standing', to: 'cp' }, { op: 'flag', id: 'cpNew' }, { op: 'timeline', text: '정의를 묻고 세계정부의 첩보원이 되었다' }] },
      { label: '그림자로 살 생각은 없다', hint: '사내가 명함을 거둔다', closes: true, values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'w7_franky_family', kind: 'door', when: adult(16, 32, st('child', 'civil'), crossing), weight: 5, repeat: 'once', speaker: { relation: '해체업자 패밀리의 자매' },
    title: '해체업자 패밀리', body: '뒷골목의 해체업자 패밀리가 해적을 잡아 현상금을 받고 그 배를 뜯어 판다. 두목은 잠시 자리를 비웠고, 패밀리는 싸울 줄 아는 사람을 찾는다.',
    doors: [
      { label: '패밀리에 들어가 해적을 잡는다', hint: '현상금 사냥꾼이 된다. 뒷골목이 집이 된다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'bountyHunter' }, { op: 'person', kind: 'ally', relation: '해체업자 패밀리의 자매' }, { op: 'timeline', text: '해체업자 패밀리에 들어가 현상금 사냥꾼이 되었다' }] },
      { label: '패밀리의 장부를 맡아 돈을 굴린다', hint: '싸우지 않고 패밀리를 키운다', values: { ambition: D }, fx: [{ op: 'money', add: 15000 }, { op: 'person', kind: 'ally', relation: '해체업자 패밀리' }] },
      { label: '뒷골목 일에 끼지 않는다', hint: '패밀리는 다른 사람을 찾는다', closes: true, fx: [] },
    ],
  },
  {
    id: 'w7_enies_guard', kind: 'door', when: adult(17, 30, st('child', 'civil'), crossing), weight: 4, repeat: 'once', speaker: { relation: '사법의 섬에서 온 관리' },
    title: '사법의 섬의 경비병', body: '바다 열차로 이어진 사법의 섬이 경비병을 모은다. 밤이 오지 않는 섬, 죄인이 한번 들어가면 나오지 못하는 문을 지키는 일이다.',
    doors: [
      { label: '경비병이 되어 사법의 섬으로 간다', hint: '해군의 군복을 입는다', values: { justice: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'flag', id: 'mnBoot' }, { op: 'log', text: '바다 열차를 타고 밤이 오지 않는 섬에 내렸다.', weight: 'heavy' }, { op: 'timeline', text: '사법의 섬의 경비병이 되었다' }] },
      { label: '그 문을 지나간 사람들의 이름을 몰래 적어 둔다', hint: '경비병이 되되, 눈을 뜨고 지킨다', values: { inquiry: D }, when: [{ c: 'flag', id: 'w7_saw_tom', has: true }],
        fx: [{ op: 'standing', to: 'marine' }, { op: 'flag', id: 'mnBoot' }, { op: 'flag', id: 'w7_enies_names' }, { op: 'timeline', text: '사법의 섬의 경비병이 되어 끌려간 목수의 기록을 찾았다' }] },
      { label: '죄인을 지키는 일은 하지 않는다', hint: '관리가 떠난다', closes: true, values: { freedom: D }, fx: [] },
    ],
  },
  // ---------------------------------------------------------------- 섬에 남은 어른의 삶
  {
    id: 'w7a_pirate_order', kind: 'door', when: adult(18, 60, st('shipwright', 'civil')), weight: 6, repeat: { years: 6 }, speaker: { relation: '현상금이 걸린 해적 선장' },
    title: '해적의 주문', body: '현상금이 걸린 해적 선장이 조선소에 금화 자루를 내려놓는다. 군함보다 빠른 배를 지어 달라고 한다. 해군이 이 도시를 지켜보고 있다.',
    doors: [
      { label: '돈을 받고 가장 빠른 배를 짓는다', hint: '목수는 손님을 가리지 않는다', values: { ambition: D }, fx: [{ op: 'money', add: 40000 }, { op: 'hardship', add: 1 }] },
      { label: '해적의 배는 짓지 않는다고 돌려보낸다', hint: '돈을 놓친다. 선장이 이를 간다', values: { justice: D }, fx: [{ op: 'person', kind: 'enemy', relation: '주문을 거절당한 해적 선장' }] },
      { label: '배에 몰래 해군의 표식을 숨겨 넣는다', hint: '해군에 넘길 수 있다. 들키면 끝장이다', values: { dominion: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'money', add: 50000 }, { op: 'fame', add: 3 }], else: [{ op: 'hp', add: -25 }, { op: 'person', kind: 'enemy', relation: '속은 것을 안 해적 선장' }] }] },
    ],
  },
  {
    id: 'w7a_aqua_rebuild', kind: 'door', when: adult(20, 70, LANDED), weight: 6, repeat: { years: 8 }, speaker: 'hero',
    title: '해일이 지나간 뒤', body: '아쿠아 라구나가 아랫동네를 휩쓸었다. 시장은 아랫동네를 비우고 윗동네만 다시 짓자고 한다. 아랫동네 사람들은 갈 곳이 없다.',
    doors: [
      { label: '아랫동네 사람들과 집을 다시 세운다', hint: '돈도 시간도 든다. 사람들이 남는다', values: { devotion: D }, fx: [{ op: 'money', add: -10000 }, { op: 'person', kind: 'ally', relation: '아랫동네 사람들' }] },
      { label: '비워진 아랫동네 땅을 헐값에 사들인다', hint: '언젠가 값이 오른다. 원망을 산다', values: { dominion: D }, fx: [{ op: 'money', add: -20000 }, { op: 'chance', p: 0.6, then: [{ op: 'money', add: 60000 }], else: [] }, { op: 'person', kind: 'enemy', relation: '땅을 빼앗긴 아랫동네 사람' }] },
      { label: '해일을 막는 새 둑을 설계해 시장에게 낸다', hint: '받아들여질지 모른다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.4, then: [{ op: 'fame', add: 5 }], else: [] }] },
    ],
  },
  {
    id: 'w7a_yagara_shop', kind: 'door', when: adult(22, 55, st('civil', 'settled')), weight: 5, repeat: 'once', speaker: 'hero',
    title: '야가라 대여점', body: '물길 어귀의 야가라 대여점이 문을 닫는다. 주인 노인은 야가라들을 누가 맡아 주길 바란다. 값은 싸지만 야가라는 먹성이 좋다.',
    doors: [
      { label: '가게를 맡아 야가라를 빌려준다', hint: '물길에 뿌리를 내린다', values: { peace: D }, fx: [{ op: 'money', add: -15000 }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '물길 어귀에서 야가라 대여점을 열었다' }] },
      { label: '야가라를 팔아 넘기고 차익을 남긴다', hint: '노인이 서운해한다', values: { ambition: D }, fx: [{ op: 'money', add: 12000 }] },
      { label: '야가라들을 노인 곁에 두고 돌보러 다닌다', hint: '돈은 안 된다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '야가라 대여점 노인' }] },
    ],
  },
  {
    id: 'w7a_strike', kind: 'door', when: adult(20, 50, st('shipwright')), weight: 5, repeat: 'once', speaker: { relation: '조선소의 동기' },
    title: '직공들의 파업', body: '조선소가 품삯을 깎았다. 직공들이 도크에 모여 망치를 내려놓자고 한다. 주문받은 배의 진수식은 사흘 뒤다.',
    doors: [
      { label: '망치를 내려놓고 동기들 편에 선다', hint: '품삯을 되찾을지 모른다. 회사의 눈 밖에 난다', values: { loyalty: D }, fx: [{ op: 'chance', p: 0.6, then: [{ op: 'money', add: 10000 }], else: [{ op: 'hardship', add: 1 }] }] },
      { label: '혼자라도 배를 마무리한다', hint: '진수식은 지켜진다. 동기들이 등을 돌린다', values: { justice: D }, fx: [{ op: 'fame', add: 3 }, { op: 'person', kind: 'rival', relation: '등을 돌린 동기' }] },
      { label: '사장과 직공 사이를 오가며 타협을 붙인다', hint: '양쪽 모두에게 조금씩 욕을 먹는다', values: { dominion: D }, fx: [{ op: 'fame', add: 2 }] },
    ],
  },
  {
    id: 'w7a_ghost_ship', kind: 'door', when: adult(20, 55, st('shipwright', 'civil')), weight: 4, repeat: 'once', speaker: { relation: '창백한 얼굴의 선장' },
    title: '안개 속의 배', body: '안개 낀 새벽, 돛이 찢긴 낡은 배가 도크에 닿았다. 창백한 선장은 선원들의 이름을 말하지 않고, 배만 다시 띄우게 해 달라고 한다. 값은 금괴다.',
    doors: [
      { label: '아무것도 묻지 않고 배를 고친다', hint: '금괴를 받는다. 배가 어디로 가는지는 모른다', values: { ambition: D }, fx: [{ op: 'money', add: 30000 }] },
      { label: '선원들이 어떻게 되었는지 묻는다', hint: '선장이 입을 열지 모른다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'w7_ghost_story' }] },
      { label: '찢긴 돛을 공짜로 기워 준다', hint: '선장의 눈이 처음으로 웃는다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '안개 속 배의 선장' }] },
    ],
  },
  {
    id: 'w7a_inn', kind: 'door', when: adult(25, 60, st('civil', 'settled')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '물길가 여관', body: '배를 맞추러 온 손님들이 묵을 곳이 모자라다. 물길가 빈집 하나를 여관으로 고치면 장사가 될 것이다. 손님 가운데는 해적도 있다.',
    doors: [
      { label: '여관을 열고 손님을 가리지 않는다', hint: '돈이 돈다. 해군이 들르기도 한다', values: { ambition: D }, fx: [{ op: 'money', add: -20000 }, { op: 'chance', p: 0.7, then: [{ op: 'money', add: 50000 }], else: [] }] },
      { label: '목수와 뱃사람만 받는 여관을 연다', hint: '돈은 덜 번다. 이야기가 모인다', values: { romance: D }, fx: [{ op: 'money', add: -15000 }, { op: 'standing', to: 'settled' }, { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'w7a_sinking', kind: 'door', when: adult(36, 80, LANDED), weight: 5, repeat: 'once', speaker: { relation: '구역장' },
    title: '가라앉는 도시', body: '해마다 물길의 바닥이 조금씩 높아진다. 도시가 가라앉고 있다는 것을 이제 아이들도 안다. 구역장은 아랫동네를 떠나 새 섬으로 옮기자는 문서를 돌린다.',
    doors: [
      { label: '떠날 사람들의 짐을 꾸려 준다', hint: '도시의 앞날을 받아들인다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '새 섬으로 떠난 이웃' }] },
      { label: '남은 동네를 높이 쌓아 올리자고 사람들을 모은다', hint: '오래 걸린다. 끝을 못 볼지도 모른다', values: { loyalty: D }, mark: 'obsession', fx: [{ op: 'money', add: -10000 }, { op: 'fame', add: 3 }] },
      { label: '아랫동네의 옛 모습을 기록으로 남긴다', hint: '사라질 거리를 글과 그림으로 붙잡는다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'w7a_apprentice', kind: 'door', when: adult(36, 75, st('shipwright', 'settled', 'retired', 'civil')), weight: 5, repeat: 'once', speaker: { relation: '도크를 기웃거리는 아이' },
    title: '도크의 아이', body: '날마다 도크 울타리 너머로 망치질을 지켜보는 아이가 있다. 손톱 밑이 까맣다. 뒷골목 아이다.',
    doors: [
      { label: '아이를 견습으로 들인다', hint: '가르치는 데 몇 해가 든다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '뒷골목에서 들인 견습', age: { younger: 30 } }] },
      { label: '아이에게 들보 깎는 시험을 낸다', hint: '실력이 없으면 돌려보낸다', values: { justice: D }, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'person', kind: 'ally', relation: '시험을 통과한 견습', age: { younger: 30 } }], else: [] }] },
      { label: '못 본 척 망치질을 계속한다', hint: '아이는 언젠가 오지 않는다', closes: true, fx: [] },
    ],
  },
  {
    id: 'w7a_scrap_market', kind: 'door', when: adult(36, 70, st('civil', 'settled', 'shipwright')), weight: 4, repeat: 'once', speaker: { relation: '고철 시장의 거간꾼' },
    title: '고철 시장의 자리', body: '뒷골목 고철 시장에 좋은 자리가 났다. 거간꾼은 웃돈을 내는 사람에게 주겠다고 한다. 그 자리는 원래 다리를 다친 해체업자의 것이다.',
    doors: [
      { label: '웃돈을 내고 자리를 차지한다', hint: '장사가 잘된다. 해체업자가 쫓겨난다', values: { dominion: D }, fx: [{ op: 'money', add: -10000 }, { op: 'chance', p: 0.7, then: [{ op: 'money', add: 30000 }], else: [] }, { op: 'person', kind: 'enemy', relation: '자리를 잃은 해체업자' }] },
      { label: '해체업자가 자리를 지키도록 거간꾼과 담판한다', hint: '거간꾼의 눈 밖에 난다', values: { justice: D }, fx: [{ op: 'person', kind: 'ally', relation: '다리를 다친 해체업자' }, { op: 'person', kind: 'enemy', relation: '고철 시장의 거간꾼' }] },
    ],
  },
  {
    id: 'w7a_old_dock', kind: 'door', when: adult(45, 85, LANDED), weight: 4, repeat: 'once', speaker: 'hero',
    title: '헐리는 옛 도크', body: '{name}이(가) 젊어서 처음 망치를 잡았던 옛 도크가 헐린다. 그 자리에 바다 열차의 새 역이 선다. 도크 기둥에 새긴 이름들이 아직 남아 있다.',
    doors: [
      { label: '기둥 하나를 얻어 집에 들인다', hint: '옛 이름들을 곁에 둔다', values: { romance: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
      { label: '새 역을 짓는 일에 손을 보탠다', hint: '도시는 바뀌어도 목수는 짓는다', values: { inquiry: D }, fx: [{ op: 'money', add: 15000 }] },
      { label: '헐기 전 날 옛 직공들을 불러 모은다', hint: '마지막으로 함께 도크에 선다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '옛 도크의 직공들' }] },
    ],
  },
  {
    id: 'w7a_last_ship', kind: 'door', when: adult(55, 90, st('shipwright', 'settled', 'retired', 'civil')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '마지막 배', body: '손이 예전 같지 않다. 한 척만 더 짓는다면 그것이 마지막 배가 될 것이다. 누구를 위한 배를 지을지 정해야 한다.',
    doors: [
      { label: '아무도 타지 않을 꿈의 배를 짓는다', hint: '평생 그려 온 설계를 끝낸다', values: { romance: D }, fx: [{ op: 'money', add: -20000 }, { op: 'fame', add: 5 }, { op: 'timeline', text: '평생 그려 온 마지막 배를 지었다' }] },
      { label: '가난한 어부에게 줄 고깃배를 짓는다', hint: '이름은 남지 않는다', values: { devotion: D }, fx: [{ op: 'person', kind: 'ally', relation: '마지막 배를 받은 어부' }, { op: 'timeline', text: '마지막 배를 가난한 어부에게 주었다' }] },
      { label: '견습들에게 망치를 넘기고 짓는 것을 지켜본다', hint: '내 손 대신 그들의 손이 짓는다', values: { loyalty: D }, fx: [{ op: 'timeline', text: '마지막 배는 견습들의 손으로 지어졌다' }] },
    ],
  },
  {
    id: 'w7a_train_crash', kind: 'door', when: adult(25, 65, LANDED), weight: 4, repeat: 'once', speaker: 'hero',
    title: '멈춰 선 바다 열차', body: '바다 위 선로 한가운데서 열차가 멈췄다. 폭풍이 다가오는데 객차에는 사람들이 가득하다. 정비공들은 다른 섬에 있다.',
    doors: [
      { label: '작은 배를 저어 열차까지 간다', hint: '폭풍과 시합이다', values: { devotion: D }, danger: true,
        fx: [{ op: 'chance', p: 0.65, then: [{ op: 'fame', add: 5 }, { op: 'person', kind: 'ally', relation: '열차에서 구한 손님' }], else: [{ op: 'hp', add: -25 }] }] },
      { label: '역의 기관사들과 구조 열차를 띄운다', hint: '선로를 아는 사람들과 함께한다', values: { loyalty: D }, fx: [{ op: 'fame', add: 3 }] },
      { label: '선로의 고장 난 곳을 짚어 정비공에게 전한다', hint: '열차가 제 힘으로 움직일지 모른다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
];
