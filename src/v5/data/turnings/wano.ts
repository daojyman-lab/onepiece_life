// 와노쿠니에서 태어난 인생 (4단계 과제 5). 폭포에 둘러싸인 쇄국의 나라.
// 원작의 때: 주인공이 태어나기 몇 해 전 광월 오뎅이 처형되었다. 주인공은 쿠로즈미 오로치가 쇼군이고 백수 카이도가 나라를 쥔 시대에 자란다.
// 주인공이 스물한 살 무렵 시모츠키 야스이에가 처형되고, 그해 불의 축제 밤에 붉은 칼집의 무사들과 밀짚모자가 오니가시마로 쳐들어간다.
// 그 뒤 카이도가 쓰러지고 나라가 열린다(쇄국이 풀린다).
// 원작 순간은 전환점과 만남(minors-homes.ts) 가운데 하나로만 쓴다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
// 와노에는 해군이 없다. 바다로 나가는 길은 homes-sea.ts에 있다(열여덟 이후).
import { V } from '../balance';
import { HOMETOWNS } from '../../../data/births';
import { kid, POOR, RICH } from './childhood';
import { age, home, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const TOWNS = HOMETOWNS.filter((t) => t.home === 'wano').map((t) => t.name);
const here: Cond[] = [home('wano'), { c: 'island', is: TOWNS }];
const kidW = (min: number, max: number, ...more: Cond[]): Cond[] => [...kid(min, max), ...here, ...more];
const kidIn = (town: string, min: number, max: number, ...more: Cond[]): Cond[] => [...kid(min, max), home('wano'), { c: 'town', is: [town] }, { c: 'island', is: [town] }, ...more];
const adult = (min: number, max: number | undefined, ...more: Cond[]): Cond[] => [...here, age(min, max), ...more];
const LANDED = st('civil', 'settled', 'retired', 'shipwright');
const SAMURAI: Cond = { c: 'lineage', is: ['samurai'] };
const crossing: Cond = { c: 'standingYears', min: 1 };
/** 카이도가 쓰러지고 나라가 열린 뒤 (주인공 스물두 살 이후) */
const OPENED = 22;

export const WANO: Turning[] = [
  // ---------------------------------------------------------------- 어린 시절
  {
    id: 'wanok_bamboo', kind: 'door', when: kidW(6, 13), weight: 9, repeat: 'once', speaker: 'hero',
    title: '대나무 칼 시합', body: '마을 아이들이 대나무 칼로 시합을 한다. 이긴 아이는 「붉은 칼집의 무사」 역을 맡는다. 어른들은 그 이름을 들으면 얼굴이 굳는다.',
    doors: [
      { label: '이길 때까지 덤빈다', hint: '팔이 멍투성이가 된다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'hp', add: -5 }] },
      { label: '진 아이를 일으켜 세워 준다', hint: '시합보다 친구가 남는다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '대나무 칼 시합의 친구' }] },
      { label: '어른들에게 붉은 칼집이 누구냐고 묻는다', hint: '꾸중을 듣는다. 어느 노인이 몰래 대답해 준다', values: { inquiry: D }, fx: [{ op: 'flag', id: 'wano_heard_oden' }] },
    ],
  },
  {
    id: 'wanok_poison_river', kind: 'door', when: kidW(5, 14, POOR), weight: 9, repeat: 'once', speaker: 'hero',
    title: '검은 강', body: '산 너머 공장에서 흘러나온 물이 강을 검게 물들였다. 그 물을 마신 아이들이 앓는다. 깨끗한 물은 쇼군의 도시에서만 판다.',
    doors: [
      { label: '산을 넘어 깨끗한 물을 길어 온다', hint: '하루가 꼬박 걸린다. 마을 아이들이 마신다', values: { romance: D }, fx: [{ op: 'base', key: 'vit', add: 1 }, { op: 'person', kind: 'ally', relation: '물을 나눠 준 이웃 아이' }] },
      { label: '숯으로 물을 거르는 법을 궁리한다', hint: '되는지 안 되는지 직접 마셔 봐야 안다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -10 }], else: [] }] },
      { label: '공장 굴뚝에 돌을 던진다', hint: '어린 화풀이다. 감시꾼에게 쫓긴다', values: { freedom: D }, fx: [{ op: 'base', key: 'spd', add: 1 }] },
    ],
  },
  {
    id: 'wanok_rice', kind: 'door', when: kidW(5, 14), weight: 8, repeat: 'once', speaker: 'hero',
    title: '쌀 배급', body: '쇼군의 관리가 쌀을 나눠 준다. 줄은 길고 쌀은 적다. 앞에 선 할머니가 주저앉았고, 관리는 줄을 서지 않은 사람에게는 주지 않는다고 소리친다.',
    doors: [
      { label: '할머니 몫까지 받아 집에 데려다준다', hint: '두 사람 몫을 들고 간다', values: { romance: D }, fx: [{ op: 'person', kind: 'ally', relation: '배급 줄의 할머니' }] },
      { label: '관리에게 할머니 몫을 달라고 따진다', hint: '어린 목소리라도 관리의 눈에 띈다', values: { justice: D }, fx: [{ op: 'hardship', add: 1 }, { op: 'chance', p: 0.5, then: [{ op: 'fame', add: 1 }], else: [{ op: 'hp', add: -5 }] }] },
      { label: '줄 앞자리를 팔고 쌀값을 번다', hint: '줄은 사고팔 수 있다', values: { greed: D }, fx: [{ op: 'money', add: 1500 }] },
    ],
  },
  {
    id: 'wanok_shrine', kind: 'door', when: kidW(5, 13), weight: 7, repeat: 'once', speaker: 'hero',
    title: '신사의 등불 축제', body: '신사에 등불이 걸리는 밤이다. 아이들은 소원을 적은 종이를 등불에 매단다. 무엇을 적어도 쇼군의 관리가 읽어 볼지 모른다는 소문이 있다.',
    doors: [
      { label: '바깥 바다를 보고 싶다고 적는다', hint: '나라 밖을 바라는 것은 금지된 소원이다', values: { romance: D }, fx: [{ op: 'flag', id: 'wano_wish_sea' }] },
      { label: '병든 이웃이 낫기를 적는다', hint: '조용한 소원이다', values: { peace: D }, fx: [] },
      { label: '아무것도 적지 않고 등불만 구경한다', hint: '읽힐 소원은 쓰지 않는다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'wanok_sumo', kind: 'door', when: kidW(8, 15), weight: 7, repeat: 'once', speaker: { relation: '스모 도장의 사범' },
    title: '스모 도장', body: '마을 스모 도장의 사범이 덩치 큰 아이들만 받는다. 작은 아이는 문 앞에서 돌려보낸다.',
    doors: [
      { label: '문 앞에서 사흘을 버티며 받아 달라고 한다', hint: '사범이 질려서 받아 줄지도 모른다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: 'chance', p: 0.6, then: [{ op: 'mastery', branch: 'fist', add: 10 }], else: [{ op: 'hp', add: -5 }] }] },
      { label: '도장 대신 산에서 바위를 민다', hint: '혼자 몸을 만든다', values: { freedom: D }, fx: [{ op: 'base', key: 'str', add: 1 }] },
    ],
  },
  {
    id: 'wanok_samurai_blade', kind: 'door', when: kidW(8, 15, SAMURAI), weight: 9, repeat: 'once', speaker: { relation: '무사 집안의 어른' },
    title: '집안의 칼', body: '무사 집안의 어른이 대대로 내려온 칼을 꺼내 보인다. 옛 영주를 섬기던 칼이라 지금은 꺼내 들기만 해도 벌을 받는다. 어른은 언젠가 이 칼을 쓸 날이 올 거라고 한다.',
    doors: [
      { label: '그날을 위해 칼을 배운다', hint: '몰래 수련한다. 들키면 집안이 위험하다', values: { loyalty: D }, fx: [{ op: 'mastery', branch: 'sword', add: 12 }, { op: 'flag', id: 'wano_family_blade' }] },
      { label: '칼을 땅에 묻자고 한다', hint: '집안을 지키려면 잊어야 한다고 여긴다', values: { peace: D }, fx: [] },
      { label: '그 칼로 쇼군의 관리를 베겠다고 한다', hint: '어른이 놀라 입을 막는다', values: { justice: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'wanok_kite', kind: 'door', when: kidW(5, 12), weight: 7, repeat: 'once', speaker: 'hero',
    title: '연날리기', body: '바람 센 날 언덕에서 연을 날린다. 연줄에 유리 가루를 묻혀 남의 연을 끊는 아이들이 있다.',
    doors: [
      { label: '유리 가루를 묻혀 모든 연을 끊는다', hint: '언덕의 하늘을 차지한다', values: { dominion: D }, fx: [{ op: 'fame', add: 1 }] },
      { label: '끊긴 연을 주워 고쳐 돌려준다', hint: '연을 잃은 아이들이 고마워한다', values: { loyalty: D }, fx: [] },
      { label: '가장 높이 띄우는 법만 궁리한다', hint: '줄을 끊지 않고 이긴다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'wanok_factory', kind: 'door', when: kidW(9, 15, POOR), weight: 8, repeat: 'once', speaker: { relation: '공장의 감독' },
    title: '무기 공장의 일손', body: '산 너머 무기 공장이 아이 일손을 모은다. 하루에 쌀 한 되를 준다. 공장에서 만든 무기는 카이도의 해적들이 쓴다.',
    doors: [
      { label: '공장에 들어가 쌀을 번다', hint: '쌀이 생긴다. 무엇을 만드는지 알게 된다', values: { ambition: D }, fx: [{ op: 'money', add: 3000 }, { op: 'hp', add: -10 }, { op: 'base', key: 'str', add: 1 }] },
      { label: '공장에서 설계도를 몰래 베껴 온다', hint: '들키면 끝이다. 언젠가 쓸모가 있을지 모른다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'wano_factory_plan' }, { op: 'base', key: 'int', add: 1 }], else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 2 }] }] },
      { label: '해적의 무기는 만들지 않는다', hint: '쌀 대신 배를 곯는다', values: { justice: D }, fx: [{ op: 'hp', add: -5 }] },
    ],
  },
  {
    id: 'wanok_ronin', kind: 'door', when: kidIn('쿠리', 8, 15), weight: 8, repeat: 'once', speaker: { relation: '떠돌이 낭인' },
    title: '쿠리의 낭인', body: '쿠리의 무너진 성터에 떠돌이 낭인 하나가 산다. 낭인은 옛날 이 땅의 영주가 무법자들을 품어 마을을 세웠다고 한다.',
    doors: [
      { label: '낭인에게 칼을 가르쳐 달라고 조른다', hint: '낭인이 귀찮아하면서도 가르쳐 준다', values: { romance: D }, fx: [{ op: 'mastery', branch: 'sword', add: 10 }, { op: 'person', kind: 'ally', relation: '쿠리의 떠돌이 낭인' }] },
      { label: '낭인에게 먹을 것을 날라 준다', hint: '낭인은 말없이 받는다', values: { freedom: D }, fx: [{ op: 'person', kind: 'ally', relation: '쿠리의 떠돌이 낭인' }] },
      { label: '낭인을 관리에게 알린다', hint: '상을 받는다. 낭인이 사라진다', values: { greed: D }, fx: [{ op: 'money', add: 3000 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'wanok_tea_house', kind: 'door', when: kidIn('하나노미야코', 7, 15), weight: 8, repeat: 'once', speaker: 'hero',
    title: '찻집 심부름', body: '꽃의 도시 찻집에서 심부름을 하면 귀한 손님들의 이야기가 들린다. 오늘은 쇼군의 관리 둘이 구석에서 무언가를 속삭인다.',
    doors: [
      { label: '찻잔을 나르며 귀를 기울인다', hint: '들은 것을 누구에게 말할지는 나중 일이다', values: { inquiry: D }, fx: [{ op: 'flag', id: 'wano_overheard' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '찻집 일을 성실히 하고 삯을 받는다', hint: '눈과 귀를 닫는다', values: { loyalty: D }, fx: [{ op: 'money', add: 2000 }] },
      { label: '관리의 지갑을 슬쩍한다', hint: '들키면 큰일이다', values: { greed: D }, danger: true, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 8000 }], else: [{ op: 'hp', add: -15 }, { op: 'hardship', add: 2 }] }] },
    ],
  },
  {
    id: 'wanok_laughing', kind: 'door', when: kidIn('에비스 마을', 6, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '웃음밖에 남지 않은 마을', body: '이 마을 어른들은 슬플 때도 웃는다. 이상한 열매를 먹은 뒤로 웃음밖에 나오지 않는다고 한다. 장례식에서도 다들 웃는다.',
    doors: [
      { label: '웃는 어른들 대신 우는 법을 잊지 않으려 한다', hint: '남몰래 운다', values: { romance: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
      { label: '그 열매를 누가 나눠 줬는지 캐묻는다', hint: '쇼군의 이름이 나온다. 위험한 이야기다', values: { justice: D }, fx: [{ op: 'flag', id: 'wano_smile_truth' }] },
      { label: '어른들 따라 함께 웃는다', hint: '그렇게라도 견딘다', values: { loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'wanok_forbidden_name', kind: 'door', when: kidW(7, 15), weight: 7, repeat: 'once', speaker: { relation: '술 취한 노인' },
    title: '부르면 안 되는 이름', body: '술 취한 노인이 길가에서 「오뎅 님」 하고 울며 노래한다. 사람들이 노인을 피한다. 그 이름을 입에 올리면 잡혀간다.',
    doors: [
      { label: '노인을 집까지 부축해 준다', hint: '노인이 옛 이야기를 들려준다', values: { loyalty: D }, fx: [{ op: 'flag', id: 'wano_heard_oden' }, { op: 'person', kind: 'ally', relation: '오뎅을 부르던 노인' }] },
      { label: '관리가 오기 전에 노인의 입을 막는다', hint: '노인이 서운해한다. 둘 다 무사하다', values: { loyalty: D }, fx: [] },
      { label: '그 노래를 따라 외운다', hint: '부르면 안 되는 노래가 머리에 남는다', values: { freedom: D }, fx: [{ op: 'flag', id: 'wano_heard_oden' }] },
    ],
  },
  {
    id: 'wanok_broken_bridge', kind: 'door', when: kidW(6, 14), weight: 7, repeat: 'once', speaker: 'hero',
    title: '끊어진 다리', body: '폭우에 마을 다리가 끊어졌다. 관리는 고쳐 주지 않는다. 건너편 밭에 가려면 산을 하루 돌아야 한다.',
    doors: [
      { label: '아이들을 모아 통나무를 나른다', hint: '어른들이 하나둘 따라온다', values: { dominion: D }, mark: 'fellowship', fx: [{ op: 'base', key: 'str', add: 1 }] },
      { label: '밧줄을 걸어 혼자 건너는 길을 낸다', hint: '빠르지만 위험하다', values: { freedom: D }, danger: true, fx: [{ op: 'chance', p: 0.7, then: [{ op: 'base', key: 'spd', add: 1 }], else: [{ op: 'hp', add: -15 }] }] },
      { label: '건너편으로 짐을 날라 주고 삯을 받는다', hint: '산길로 하루씩 다닌다', values: { ambition: D }, fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'wanok_snow_grave', kind: 'door', when: kidW(9, 15), weight: 6, repeat: 'once', speaker: 'hero',
    title: '눈 덮인 무덤들', body: '북쪽 링고의 눈 덮인 언덕에는 이름 없는 칼들이 무덤처럼 꽂혀 있다. 옛날 그 칼의 주인들이 무엇을 위해 싸웠는지는 아무도 말하지 않는다.',
    doors: [
      { label: '칼 하나를 뽑아 들고 휘둘러 본다', hint: '무덤의 칼을 건드리면 벌을 받는다는 말이 있다', values: { ambition: D }, fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'hardship', add: 1 }] },
      { label: '칼 앞에 술 한 잔을 붓고 내려온다', hint: '모르는 이들에게 예를 갖춘다', values: { loyalty: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
      { label: '칼에 새겨진 이름들을 적어 온다', hint: '잊힌 이들을 기억한다', values: { inquiry: D }, fx: [{ op: 'flag', id: 'wano_heard_oden' }] },
    ],
  },
  {
    id: 'wanok_rich_kimono', kind: 'door', when: kidW(7, 15, RICH), weight: 6, repeat: 'once', speaker: 'hero',
    title: '비단옷', body: '넉넉한 집이라 새 비단옷을 맞춘다. 같은 날 이웃 아이는 해진 옷으로 공장에 간다. 옷감 가게 주인이 남은 천을 어떻게 할지 묻는다.',
    doors: [
      { label: '남은 천으로 이웃 아이의 옷을 지어 달라고 한다', hint: '집안 어른이 언짢아한다', values: { freedom: D }, fx: [{ op: 'money', add: -3000 }, { op: 'person', kind: 'ally', relation: '옷을 얻은 이웃 아이' }] },
      { label: '새 옷을 입고 꽃의 도시를 걷는다', hint: '부러운 눈길을 받는다', values: { ambition: D }, fx: [{ op: 'fame', add: 1 }] },
    ],
  },
  {
    id: 'wanok_ninja', kind: 'door', when: kidW(7, 14), weight: 6, repeat: 'once', speaker: 'hero',
    title: '지붕 위의 그림자', body: '밤마다 지붕 위를 달리는 그림자가 있다. 쇼군의 닌자라고도 하고, 옛 영주의 닌자가 아직 살아 있다고도 한다.',
    doors: [
      { label: '지붕에 올라 그림자를 쫓는다', hint: '떨어질 수도 있다', values: { romance: D }, danger: true, fx: [{ op: 'chance', p: 0.7, then: [{ op: 'base', key: 'spd', add: 1 }], else: [{ op: 'hp', add: -15 }] }] },
      { label: '그림자가 지나는 길에 주먹밥을 놓아 둔다', hint: '다음 날 주먹밥이 없어졌다', values: { peace: D }, fx: [{ op: 'flag', id: 'wano_ninja_rice' }] },
    ],
  },
  // ---------------------------------------------------------------- 원작 순간
  {
    // 원작: 루피가 와노에 오는 해(주인공 스물한 살 무렵), 에비스 마을의 「돈 뿌리는 노인」 시모츠키 야스이에가 처형된다
    id: 'wano_cn_yasuie', kind: 'door', when: adult(19, 23, st('civil', 'settled', 'shipwright', 'child', 'pirate')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '돈 뿌리는 노인의 처형', body: '꽃의 도시 광장에 십자 형틀이 섰다. 매달린 노인은 가난한 마을에 몰래 돈을 뿌리던 사람이다. 웃는 열매를 먹은 마을 사람들이 울지도 못하고 웃는다. 쏘기 전, 노인이 쇼군을 향해 크게 웃는다.',
    doors: [
      { label: '형틀 앞으로 뛰쳐나간다', hint: '총구가 {name}을(를) 향할지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 3 }, { op: 'timeline', text: '돈 뿌리는 노인 시모츠키 야스이에의 처형을 막으려 했다', canon: 'yasuie' }] },
      { label: '노인이 남긴 말을 끝까지 듣는다', hint: '그 웃음을 기억한다', values: { loyalty: D }, fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'timeline', text: '시모츠키 야스이에의 마지막 웃음을 보았다', canon: 'yasuie' }] },
      { label: '광장을 떠나 집으로 돌아간다', hint: '보지 않는다. 오래 잊지 못한다', values: { peace: D }, fx: [{ op: 'timeline', text: '시모츠키 야스이에가 처형되던 날 광장을 등졌다', canon: 'yasuie' }] },
    ],
  },
  {
    // 원작: 같은 해 불의 축제 밤, 붉은 칼집의 무사들과 밀짚모자가 오니가시마로 쳐들어간다
    id: 'wano_cn_raid', kind: 'door', when: adult(19, 24, st('civil', 'settled', 'shipwright', 'pirate', 'child')), weight: 10, repeat: 'once', speaker: { relation: '달 문양을 품은 낭인' },
    title: '불의 축제의 밤', body: '불의 축제 밤, 달 문양을 품에 숨긴 낭인들이 항구에 모인다. 오늘 밤 카이도의 섬으로 쳐들어간다고 한다. 배는 낡았고 사람은 모자라다.',
    doors: [
      { label: '칼을 들고 배에 오른다', hint: '살아 돌아올지 모른다. 나라가 바뀌는 밤이다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 15 }, { op: 'mastery', branch: 'sword', add: 10 }, { op: 'flag', id: 'wano_raid' },
             { op: 'log', text: '해골 섬의 지붕 위에서 용과 사람이 싸웠다. 새벽에 불길 속에서 누군가 이겼다고 외쳤다.', weight: 'heavy' },
             { op: 'timeline', text: '불의 축제 밤, 카이도의 섬으로 쳐들어갔다' }] },
      { label: '도시에 남아 불을 끄고 다친 사람을 나른다', hint: '싸움 대신 도시를 지킨다', values: { justice: D }, fx: [{ op: 'person', kind: 'ally', relation: '축제의 밤에 구한 사람' }, { op: 'timeline', text: '불의 축제 밤, 불타는 도시를 지켰다' }] },
      { label: '카이도 쪽에 이 소식을 판다', hint: '큰돈을 받는다. 낭인들에게 들키면 끝이다', values: { greed: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 60000 }], else: [{ op: 'hp', add: -25 }, { op: 'person', kind: 'enemy', relation: '배신을 안 낭인' }] }] },
    ],
  },
  {
    // 원작: 카이도가 쓰러진 뒤 쇄국이 풀리고 나라가 열린다
    id: 'wano_cn_opened', kind: 'door', when: adult(OPENED, 60, LANDED), weight: 8, repeat: 'once', speaker: 'hero',
    title: '열린 나라', body: '새 쇼군이 나라를 연다고 했다. 공장이 멈추고 검은 강이 맑아지기 시작했다. 폭포 아래로 내려가는 배가 처음으로 떳떳하게 떠난다.',
    doors: [
      { label: '그 배를 타고 바깥 바다를 보러 간다', hint: '열린 나라의 첫 손님이 된다', values: { romance: D },
        fx: [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'log', text: '폭포 아래의 바다는 넓었다. 나라는 등 뒤에서 작아졌다.', weight: 'heavy' }, { op: 'timeline', text: '나라가 열린 해 바깥 바다로 나갔다' }] },
      { label: '맑아진 강가에 논을 다시 일군다', hint: '나라 안에서 새로 시작한다', values: { peace: D }, fx: [{ op: 'standing', to: 'settled' }, { op: 'timeline', text: '나라가 열린 해 맑아진 강가에 논을 일궜다' }] },
      { label: '바깥 상인들과 거래를 튼다', hint: '쇄국이 풀린 틈에 돈이 돈다', values: { ambition: D }, fx: [{ op: 'money', add: 30000 }] },
    ],
  },
  // ---------------------------------------------------------------- 와노만의 문 (처지 · 핏줄)
  {
    id: 'wano_beasts', kind: 'door', when: adult(16, 30, st('child', 'civil'), crossing), weight: 5, repeat: 'once', speaker: { relation: '백수 해적단의 간부' },
    title: '백수 해적단의 징집', body: '카이도의 해적단이 마을에서 젊은이를 뽑는다. 이상한 열매를 먹으면 짐승의 힘을 얻는다고 한다. 거절한 집은 쌀 배급에서 빠진다.',
    doors: [
      { label: '해적단에 들어가 힘을 얻는다', hint: '해적이 된다. 마을 사람들이 눈을 피한다', values: { dominion: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'base', key: 'str', add: 2 }, { op: 'person', kind: 'ally', relation: '백수 해적단의 간부' }, { op: 'timeline', text: '카이도의 해적단에 들어갔다' }] },
      { label: '집안의 쌀을 위해 들어가되 마음은 주지 않는다', hint: '해적이 된다. 언젠가 등을 돌릴지 모른다', values: { romance: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'flag', id: 'wano_beast_spy' }, { op: 'timeline', text: '쌀 배급을 위해 카이도의 해적단에 들어갔다' }] },
      { label: '징집을 거절한다', hint: '배급에서 빠진다', closes: true, values: { justice: D }, fx: [{ op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'wano_oniwaban', kind: 'door', when: adult(16, 30, st('child', 'civil'), crossing, { c: 'tier', branch: 'any', min: 2 }), weight: 4, repeat: 'once', speaker: { relation: '쇼군의 닌자 대장' },
    title: '쇼군의 닌자', body: '쇼군의 닌자 대장이 {name}의 날랜 몸놀림을 보았다고 한다. 쇼군을 위해 그림자로 일하면 집안은 굶지 않는다.',
    doors: [
      { label: '닌자가 된다', hint: '쇼군의 눈과 귀가 된다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'cp' }, { op: 'flag', id: 'cpNew' }, { op: 'timeline', text: '쇼군의 닌자가 되었다' }] },
      { label: '닌자가 되어 옛 영주의 무사들에게 정보를 흘린다', hint: '두 주인을 섬긴다. 들키면 목이 날아간다', values: { loyalty: D }, when: [{ c: 'flag', id: 'wano_heard_oden', has: true }],
        fx: [{ op: 'standing', to: 'cp' }, { op: 'flag', id: 'cpNew' }, { op: 'flag', id: 'wano_double' }, { op: 'timeline', text: '쇼군의 닌자가 되어 몰래 옛 영주의 편에 섰다' }] },
      { label: '그림자로 살지 않는다', hint: '대장이 사라진다', closes: true, values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'wano_samurai_oath', kind: 'door', when: adult(18, 40, SAMURAI, LANDED), weight: 6, repeat: 'once', speaker: { relation: '옛 영주를 섬기던 무사' },
    title: '무사의 맹세', body: '옛 영주를 섬기던 무사가 집에 찾아왔다. 스무 해 전의 맹세를 기억하는 집안을 찾아다닌다고 한다. 언젠가 칼을 들 날이 오면 함께하겠느냐고 묻는다.',
    doors: [
      { label: '집안의 칼을 꺼내 맹세한다', hint: '그날이 오면 목숨을 건다', values: { loyalty: D }, mark: 'obsession', fx: [{ op: 'flag', id: 'wano_sworn' }, { op: 'person', kind: 'ally', relation: '옛 영주의 무사' }] },
      { label: '집안을 지키려 맹세를 거절한다', hint: '무사가 고개를 끄덕이고 떠난다', closes: true, values: { peace: D }, fx: [] },
      { label: '무사를 쇼군에게 넘긴다', hint: '집안은 무사하다. 무사의 이름이 저주처럼 남는다', values: { greed: D }, fx: [{ op: 'money', add: 20000 }, { op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'wano_udon', kind: 'door', when: adult(16, 50, st('civil', 'settled', 'child')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '우동의 광산', body: '세금을 못 낸 사람들이 우동의 감옥 광산으로 끌려간다. 오늘은 이웃집 차례다. 관리는 대신 갈 사람이 있으면 받아 주겠다고 한다.',
    doors: [
      { label: '이웃 대신 광산으로 간다', hint: '죄수가 된다. 이웃은 남는다', values: { justice: D },
        fx: [{ op: 'standing', to: 'prisoner' }, { op: 'hardship', add: 3 }, { op: 'person', kind: 'ally', relation: '대신 지켜 준 이웃' }, { op: 'timeline', text: '이웃 대신 우동의 광산으로 끌려갔다' }] },
      { label: '이웃의 세금을 대신 내 준다', hint: '가진 돈을 내놓는다', values: { loyalty: D }, when: [{ c: 'money', min: 15000 }], fx: [{ op: 'money', add: -15000 }] },
      { label: '관리에게 덤벼든다', hint: '함께 끌려갈지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'hp', add: -15 }], else: [{ op: 'standing', to: 'prisoner' }, { op: 'hp', add: -20 }, { op: 'timeline', text: '관리에게 덤볐다가 우동의 광산으로 끌려갔다' }] }] },
    ],
  },
  // ---------------------------------------------------------------- 섬에 남은 어른의 삶
  {
    id: 'wanoa_smile_trade', kind: 'door', when: adult(18, 50, LANDED), weight: 5, repeat: 'once', speaker: { relation: '뒷골목의 거간꾼' },
    title: '웃는 열매의 거간꾼', body: '뒷골목 거간꾼이 이상한 열매를 판다. 먹으면 짐승의 힘을 얻거나, 아니면 평생 웃기만 한다. 값은 비싸고 사려는 사람은 많다.',
    doors: [
      { label: '열매를 사서 되판다', hint: '팔리면 큰돈이 된다. 누군가는 웃기만 하게 된다', values: { greed: D }, fx: [{ op: 'hardship', add: 1 }, { op: 'money', add: -10000 }, { op: 'chance', p: 0.7, then: [{ op: 'money', add: 35000 }, { op: 'log', text: '열매는 웃돈을 받고 팔려 나갔다.', weight: 'light' }], else: [{ op: 'log', text: '관리의 단속에 열매를 빼앗겼다. 산 값만 날렸다.', weight: 'light' }] }] },
      { label: '거간꾼의 창고를 불태운다', hint: '들키면 끌려간다', values: { justice: D }, danger: true, fx: [{ op: 'chance', p: 0.6, then: [{ op: 'fame', add: 3 }], else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 2 }] }] },
      { label: '눈을 돌린다', hint: '뒷골목의 일이다', closes: true, fx: [] },
    ],
  },
  {
    id: 'wanoa_tax', kind: 'door', when: adult(18, 70, LANDED), weight: 6, repeat: { years: 6 }, speaker: { relation: '쇼군의 세리' },
    title: '올해의 세금', body: '쇼군의 세리가 올해 세금을 두 배로 올렸다. 못 내면 광산이다. 마을 사람들이 {name}의 집 앞에 모여 어떻게 할지 묻는다.',
    doors: [
      { label: '마을 사람들의 세금을 모아 대신 협상한다', hint: '세리와 담판한다. 미움을 받을지 모른다', values: { dominion: D }, fx: [{ op: 'money', add: -8000 }, { op: 'fame', add: 2 }] },
      { label: '세리에게 뒷돈을 쥐여 우리 집만 줄인다', hint: '마을 사람들은 모른다', values: { greed: D }, fx: [{ op: 'money', add: -3000 }] },
      { label: '세금을 내지 말자고 마을을 이끈다', hint: '쇼군의 칼이 마을로 향할지 모른다', values: { justice: D }, danger: true, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 5 }], else: [{ op: 'hardship', add: 3 }, { op: 'hp', add: -15 }] }] },
    ],
  },
  {
    id: 'wanoa_swordsmith', kind: 'door', when: adult(20, 65, LANDED), weight: 5, repeat: 'once', speaker: { relation: '늙은 대장장이' },
    title: '명검의 주문', body: '늙은 대장장이가 평생의 마지막 칼을 벼린다. 주문한 사람은 카이도의 간부다. 대장장이는 칼에 혼이 담긴다고, 누구에게 가는지가 중요하다고 한다.',
    doors: [
      { label: '칼을 빼돌려 옛 영주의 무사에게 전한다', hint: '대장장이와 함께 목숨을 건다', values: { loyalty: D }, danger: true, fx: [{ op: 'chance', p: 0.6, then: [{ op: 'fame', add: 3 }, { op: 'person', kind: 'ally', relation: '늙은 대장장이' }], else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 2 }] }] },
      { label: '대장장이 곁에서 칼 벼리는 법을 배운다', hint: '칼은 간부에게 간다. 기술은 남는다', values: { inquiry: D }, fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'base', key: 'int', add: 1 }] },
      { label: '그 칼을 사겠다고 웃돈을 부른다', hint: '가진 돈을 다 쓴다', values: { ambition: D }, when: [{ c: 'money', min: 50000 }], fx: [{ op: 'money', add: -50000 }, { op: 'mastery', branch: 'sword', add: 15 }] },
    ],
  },
  {
    id: 'wanoa_duel', kind: 'door', when: adult(18, 45, LANDED, { c: 'tier', branch: 'sword', min: 2 }), weight: 5, repeat: 'once', speaker: { relation: '결투를 청하는 무사' },
    title: '결투의 청', body: '이름난 도장의 무사가 {name}에게 결투를 청한다. 와노에서 결투를 거절하는 것은 칼을 버리는 것과 같다.',
    doors: [
      { label: '결투에 응한다', hint: '이기면 이름이 난다. 지면 크게 다친다', values: { ambition: D }, danger: true, fx: [{ op: 'chance', p: 0.5, then: [{ op: 'fame', add: 8 }, { op: 'mastery', branch: 'sword', add: 10 }], else: [{ op: 'hp', add: -30 }] }] },
      { label: '목검으로 하자고 청한다', hint: '피를 보지 않는다. 비겁하다는 말을 들을지 모른다', values: { peace: D }, fx: [{ op: 'mastery', branch: 'sword', add: 5 }] },
      { label: '도장의 문하로 들어가겠다고 한다', hint: '결투 대신 그 칼을 배운다', values: { inquiry: D }, fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'person', kind: 'ally', relation: '결투를 청했던 무사' }] },
    ],
  },
  {
    id: 'wanoa_brewery', kind: 'door', when: adult(25, 60, st('civil', 'settled')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '양조장', body: '강가의 낡은 양조장이 팔린다. 맑은 물이 나오는 우물도 함께 넘긴다고 한다. 쌀은 귀하고 술은 비싸다.',
    doors: [
      { label: '양조장을 사서 술을 빚는다', hint: '뿌리를 내린다. 쌀을 구하는 게 일이다', values: { peace: D }, fx: [{ op: 'money', add: -25000 }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '강가의 양조장에서 술을 빚기 시작했다' }] },
      { label: '우물만 사서 마을에 맑은 물을 나눈다', hint: '돈은 안 된다', values: { romance: D }, fx: [{ op: 'money', add: -10000 }, { op: 'person', kind: 'ally', relation: '맑은 물을 얻은 마을' }] },
      { label: '양조장을 사서 쇼군의 관리들에게 술을 댄다', hint: '돈과 연줄이 생긴다', values: { greed: D }, fx: [{ op: 'money', add: -25000 }, { op: 'chance', p: 0.7, then: [{ op: 'money', add: 60000 }], else: [] }] },
    ],
  },
  {
    id: 'wanoa_terakoya', kind: 'door', when: adult(36, 75, LANDED), weight: 5, repeat: 'once', speaker: 'hero',
    title: '마을 서당', body: '마을 아이들이 글을 모른다. 쇼군은 글을 아는 백성을 싫어한다. 빈 헛간 하나면 서당을 열 수 있다.',
    doors: [
      { label: '서당을 열어 글과 옛이야기를 가르친다', hint: '관리의 눈에 띌지 모른다', values: { inquiry: D }, fx: [{ op: 'person', kind: 'ally', relation: '서당의 아이들', age: { younger: 30 } }, { op: 'fame', add: 2 }] },
      { label: '셈과 장사만 가르친다', hint: '먹고사는 법만 가르친다. 탈은 없다', values: { peace: D }, fx: [] },
      { label: '아이들에게 칼을 가르친다', hint: '언젠가 칼을 들 날을 위해', values: { loyalty: D }, fx: [{ op: 'mastery', branch: 'sword', add: 5 }] },
    ],
  },
  {
    id: 'wanoa_old_song', kind: 'door', when: adult(40, 85, LANDED), weight: 4, repeat: 'once', speaker: 'hero',
    title: '부르면 안 되던 노래', body: '어릴 적 술 취한 노인에게서 들었던, 부르면 안 되는 노래가 입가에 맴돈다. 손주뻘 아이들이 무슨 노래냐고 묻는다.',
    doors: [
      { label: '노래를 가르쳐 준다', hint: '이야기는 이어진다', values: { romance: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
      { label: '아무 노래도 아니라고 한다', hint: '아이들을 지킨다', values: { justice: D }, fx: [] },
    ],
  },
  {
    id: 'wanoa_famine', kind: 'door', when: adult(36, 80, LANDED), weight: 5, repeat: 'once', speaker: 'hero',
    title: '흉년', body: '비가 오지 않아 논이 갈라졌다. 창고에 쌀이 조금 있다. 쇼군의 관리는 그 쌀도 바치라고 하고, 굶는 이웃들은 문 앞에 서 있다.',
    doors: [
      { label: '창고를 열어 이웃과 나눈다', hint: '관리에게 끌려갈지 모른다', values: { peace: D }, fx: [{ op: 'person', kind: 'ally', relation: '흉년에 쌀을 나눈 이웃' }, { op: 'chance', p: 0.4, then: [{ op: 'hardship', add: 2 }], else: [] }] },
      { label: '쌀을 숨기고 집안부터 살린다', hint: '이웃들의 눈길이 아프다', values: { peace: D }, fx: [] },
      { label: '쌀값이 오를 때 비싸게 판다', hint: '돈을 번다. 원망을 산다', values: { greed: D }, fx: [{ op: 'money', add: 30000 }, { op: 'person', kind: 'enemy', relation: '흉년에 원망을 품은 이웃' }] },
    ],
  },
  {
    id: 'wanoa_last_blade', kind: 'door', when: adult(55, 90, LANDED), weight: 4, repeat: 'once', speaker: 'hero',
    title: '칼을 물려준다', body: '평생 곁에 둔 칼을 이제 누군가에게 물려줄 때다. 칼은 주인을 고른다고들 한다.',
    doors: [
      { label: '가장 오래 곁을 지킨 젊은이에게 준다', hint: '곁을 지켜 준 마음에 답한다', values: { loyalty: D }, fx: [{ op: 'timeline', text: '평생의 칼을 곁을 지킨 젊은이에게 물려주었다' }] },
      { label: '신사에 바친다', hint: '칼은 아무에게도 가지 않는다', values: { peace: D }, fx: [{ op: 'timeline', text: '평생의 칼을 신사에 바쳤다' }] },
      { label: '시합을 열어 이긴 사람에게 준다', hint: '칼은 강한 손에 간다', values: { dominion: D }, fx: [{ op: 'fame', add: 3 }, { op: 'timeline', text: '시합을 열어 평생의 칼을 물려주었다' }] },
    ],
  },
  {
    id: 'wanoa_ronin_guest', kind: 'door', when: adult(20, 65, LANDED), weight: 5, repeat: 'once', speaker: { relation: '비 맞은 낭인' },
    title: '비 맞은 낭인', body: '비 오는 밤 낭인 하나가 처마 밑에서 하룻밤만 묵게 해 달라고 한다. 쫓기는 몸이라고 숨기지 않는다. 숨겨 준 집도 벌을 받는다.',
    doors: [
      { label: '집에 들여 재운다', hint: '들키면 함께 벌을 받는다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '비 오는 밤 숨겨 준 낭인' }, { op: 'chance', p: 0.3, then: [{ op: 'hardship', add: 2 }], else: [] }] },
      { label: '주먹밥과 우산만 주어 보낸다', hint: '서로 이름을 묻지 않는다', values: { freedom: D }, fx: [] },
      { label: '관리에게 알린다', hint: '상을 받는다', values: { greed: D }, fx: [{ op: 'money', add: 8000 }, { op: 'person', kind: 'enemy', relation: '고발당한 낭인' }] },
    ],
  },
  {
    id: 'wanoa_outsider', kind: 'door', when: adult(OPENED, 75, LANDED), weight: 5, repeat: 'once', speaker: { relation: '바깥에서 온 상인' },
    title: '바깥에서 온 사람', body: '나라가 열린 뒤 바깥 상인이 마을에 왔다. 말도 옷도 다르다. 마을 사람들은 문을 닫고, 상인은 길을 묻는다.',
    doors: [
      { label: '집에 들여 바깥 이야기를 듣는다', hint: '바다 너머를 처음 듣는다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '바깥에서 온 상인' }] },
      { label: '상인을 꽃의 도시까지 안내하고 삯을 받는다', hint: '바깥 돈이 들어온다', values: { ambition: D }, fx: [{ op: 'money', add: 10000 }] },
      { label: '바깥 사람은 믿지 않는다', hint: '문을 닫는다', values: { loyalty: D }, fx: [] },
    ],
  },
];
