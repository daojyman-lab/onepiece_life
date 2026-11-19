// 와노쿠니에서 태어난 인생 (4단계 과제 5). 폭포에 둘러싸인 쇄국의 나라.
// 원작의 때: 주인공이 태어나기 몇 해 전 광월 오뎅이 처형되었다. 주인공은 쿠로즈미 오로치가 쇼군이고 백수 카이도가 나라를 쥔 시대에 자란다.
// 주인공이 스물한 살 무렵 시모츠키 야스이에가 처형되고, 그해 불의 축제 밤에 붉은 칼집의 무사들과 밀짚모자가 오니가시마로 쳐들어간다.
// 그 뒤 카이도가 쓰러지고 나라가 열린다(쇄국이 풀린다).
// 원작 순간은 전환점과 만남(minors-homes.ts) 가운데 하나로만 쓴다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
// 와노에는 해군이 없다. 바다로 나가는 길은 homes-sea.ts에 있다(열여덟 이후).
import { V } from '../balance';
import { HOMETOWNS } from '../../shared/data/births';
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
      { label: '이길 때까지 덤빈다', hint: '팔이 멍투성이가 된다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: "log", text: "대나무 검이 부러질 때까지 맞붙었다. 팔은 멍들었지만 상대가 먼저 숨을 고르며 검을 내렸다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'hp', add: -5 }] },
      { label: '진 아이를 일으켜 세워 준다', hint: '시합보다 친구가 남는다', values: { loyalty: D }, fx: [{ op: "log", text: "진 아이에게 손을 내밀자 둘은 도장 밖 우물가에 나란히 앉았다. 다음 시합에서는 같은 편이 되자고 했다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '대나무 칼 시합의 친구' }] },
      { label: '어른들에게 붉은 칼집이 누구냐고 묻는다', hint: '꾸중을 듣는다. 어느 노인이 몰래 대답해 준다', values: { inquiry: D }, fx: [{ op: "log", text: "어른들은 그 이름을 입에 올리지 말라고 꾸짖었다. 돌아가는 길에 노인이 붉은 칼집의 무사들이 남긴 일을 낮은 목소리로 들려주었다.", weight: "light" }, { op: 'flag', id: 'wano_heard_oden' }] },
    ],
  },
  {
    id: 'wanok_poison_river', kind: 'door', when: kidW(5, 14, POOR), weight: 9, repeat: 'once', speaker: 'hero',
    title: '검은 강', body: '산 너머 공장에서 흘러나온 물이 강을 검게 물들였다. 그 물을 마신 아이들이 앓는다. 깨끗한 물은 쇼군의 도시에서만 판다.',
    doors: [
      { label: '산을 넘어 깨끗한 물을 길어 온다', hint: '하루가 꼬박 걸린다. 마을 아이들이 마신다', values: { romance: D }, fx: [{ op: "log", text: "산 너머 샘에서 물동이를 채워 돌아왔다. 마을 아이들이 깨끗한 물을 마시는 동안 빈 동이를 다시 챙겼다.", weight: "light" }, { op: 'base', key: 'vit', add: 1 }, { op: 'person', kind: 'ally', relation: '물을 나눠 준 이웃 아이' }] },
      { label: '숯으로 물을 거르는 법을 궁리한다', hint: '되는지 안 되는지 직접 마셔 봐야 안다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -10 }, { op: 'log', text: '숯을 거친 물을 마셨지만 밤새 배가 뒤틀렸다. 검은 강물을 거르기에는 아직 모자랐다.', weight: 'light' }], else: [{ op: 'log', text: '숯을 여러 겹 쌓아 거른 물을 마셨다. 적어도 그날 밤은 탈이 나지 않아 거르는 법을 적어 두었다.', weight: 'light' }] }] },
      { label: '공장 굴뚝에 돌을 던진다', hint: '어린 화풀이다. 감시꾼에게 쫓긴다', values: { freedom: D }, fx: [{ op: "log", text: "돌이 굴뚝에 부딪치자 공장 감시꾼이 뛰어나왔다. 산길로 달아나는 동안에도 매캐한 연기는 멎지 않았다.", weight: "light" }, { op: 'base', key: 'spd', add: 1 }] },
    ],
  },
  {
    id: 'wanok_rice', kind: 'door', when: kidW(5, 14), weight: 8, repeat: 'once', speaker: 'hero',
    title: '쌀 배급', body: '쇼군의 관리가 쌀을 나눠 준다. 줄은 길고 쌀은 적다. 앞에 선 할머니가 주저앉았고, 관리는 줄을 서지 않은 사람에게는 주지 않는다고 소리친다.',
    doors: [
      { label: '할머니 몫까지 받아 집에 데려다준다', hint: '두 사람 몫을 들고 간다', values: { romance: D }, fx: [{ op: "log", text: "할머니 몫까지 받아 두 자루를 짊어지고 집으로 갔다. 할머니가 문턱에 앉아 쌀 한 줌을 씻기 시작했다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '배급 줄의 할머니' }] },
      { label: '관리에게 할머니 몫을 달라고 따진다', hint: '어린 목소리라도 관리의 눈에 띈다', values: { justice: D }, fx: [{ op: 'hardship', add: 1 }, { op: 'chance', p: 0.5, then: [{ op: "log", text: "관리의 고함에도 줄 선 사람들이 할머니 몫을 달라고 따라 외쳤다. 쌀을 받아 할머니 손에 건넸다.", weight: "light" }, { op: 'fame', add: 1 }], else: [{ op: "log", text: "관리가 쌀주머니를 거두고 밀쳐냈다. 할머니를 일으켜 세우는 사이 뒤의 줄이 조용해졌다.", weight: "light" }, { op: 'hp', add: -5 }] }] },
      { label: '줄 앞자리를 팔고 쌀값을 번다', hint: '줄은 사고팔 수 있다', values: { greed: D }, fx: [{ op: "log", text: "앞자리를 넘겨받은 사람이 쌀을 먼저 챙겼다. {name}은(는) 빈 손 대신 받은 돈을 쥐고 줄 밖으로 나왔다.", weight: "light" }, { op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'wanok_shrine', kind: 'door', when: kidW(5, 13), weight: 7, repeat: 'once', speaker: 'hero',
    title: '신사의 등불 축제', body: '신사에 등불이 걸리는 밤이다. 아이들은 소원을 적은 종이를 등불에 매단다. 무엇을 적어도 쇼군의 관리가 읽어 볼지 모른다는 소문이 있다.',
    doors: [
      { label: '바깥 바다를 보고 싶다고 적는다', hint: '나라 밖을 바라는 것은 금지된 소원이다', values: { romance: D }, fx: [{ op: "log", text: "소원 종이를 매달자 바깥 바다라는 글자가 바람에 흔들렸다. 신사 관리가 읽기 전에 종이를 더 높이 올렸다.", weight: "light" }, { op: 'flag', id: 'wano_wish_sea' }] },
      { label: '병든 이웃이 낫기를 적는다', hint: '조용한 소원이다', values: { peace: D }, fx: [{ op: "log", text: "이웃의 이름을 적은 종이를 등불 아래 묶었다. 집으로 돌아가자 아픈 이웃의 창에 아직 불이 켜져 있었다.", weight: "light" }] },
      { label: '아무것도 적지 않고 등불만 구경한다', hint: '읽힐 소원은 쓰지 않는다', values: { peace: D }, fx: [{ op: "log", text: "등불만 바라보다 빈 종이를 접어 가져왔다. 다른 이들의 소원이 바람에 부딪쳐 작은 소리를 냈다.", weight: "light" }] },
    ],
  },
  {
    id: 'wanok_sumo', kind: 'door', when: kidW(8, 15), weight: 7, repeat: 'once', speaker: { relation: '스모 도장의 사범' },
    title: '스모 도장', body: '마을 스모 도장의 사범이 덩치 큰 아이들만 받는다. 작은 아이는 문 앞에서 돌려보낸다.',
    doors: [
      { label: '문 앞에서 사흘을 버티며 받아 달라고 한다', hint: '사범이 질려서 받아 줄지도 모른다', values: { ambition: D }, mark: 'unyielding', fx: [{ op: 'chance', p: 0.6, then: [{ op: "log", text: "사범이 마침내 도장 안으로 불렀다. 첫 판에는 바로 넘어졌지만 발을 디디는 법부터 배우기 시작했다.", weight: "light" }, { op: 'mastery', branch: 'fist', add: 10 }], else: [{ op: "log", text: "사흘째 문 앞에서 버티다 비틀거렸다. 사범은 물 한 바가지를 주고 다음에 다시 오라고 했다.", weight: "light" }, { op: 'hp', add: -5 }] }] },
      { label: '도장 대신 산에서 바위를 민다', hint: '혼자 몸을 만든다', values: { freedom: D }, fx: [{ op: "log", text: "산길의 바위를 하루씩 밀었다. 도장 문은 닫혀 있어도 발밑의 흙 자국은 날마다 깊어졌다.", weight: "light" }, { op: 'base', key: 'str', add: 1 }] },
    ],
  },
  {
    id: 'wanok_samurai_blade', kind: 'door', when: kidW(8, 15, SAMURAI), weight: 9, repeat: 'once', speaker: { relation: '무사 집안의 어른' },
    title: '집안의 칼', body: '무사 집안의 어른이 대대로 내려온 칼을 꺼내 보인다. 옛 영주를 섬기던 칼이라 지금은 꺼내 들기만 해도 벌을 받는다. 어른은 언젠가 이 칼을 쓸 날이 올 거라고 한다.',
    doors: [
      { label: '그날을 위해 칼을 배운다', hint: '몰래 수련한다. 들키면 집안이 위험하다', values: { loyalty: D }, fx: [{ op: "log", text: "집안의 칼을 천으로 감싸 숨겼다. 밤마다 빈 마당에서 칼을 뽑고 다시 넣는 연습을 했다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 12 }, { op: 'flag', id: 'wano_family_blade' }, { op: 'receiveWeapon', id: 'wano_heirloom', stow: true }] },
      { label: '칼을 땅에 묻자고 한다', hint: '집안을 지키려면 잊어야 한다고 여긴다', values: { peace: D }, fx: [{ op: "log", text: "칼을 흙에 묻자 어른들이 삽자루를 오래 붙들었다. 집안은 조용해졌지만 묻은 자리만은 잊지 않았다.", weight: "light" }] },
      { label: '그 칼로 쇼군의 관리를 베겠다고 한다', hint: '어른이 놀라 입을 막는다', values: { justice: D }, fx: [{ op: "log", text: "쇼군의 관리를 베겠다는 말을 듣고 어른이 입을 막았다. 칼집을 치우면서도 그날 이후 {name}의 눈을 경계했다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'wanok_kite', kind: 'door', when: kidW(5, 12), weight: 7, repeat: 'once', speaker: 'hero',
    title: '연날리기', body: '바람 센 날 언덕에서 연을 날린다. 연줄에 유리 가루를 묻혀 남의 연을 끊는 아이들이 있다.',
    doors: [
      { label: '유리 가루를 묻혀 모든 연을 끊는다', hint: '언덕의 하늘을 차지한다', values: { dominion: D }, fx: [{ op: "log", text: "유리 가루를 묻힌 연줄이 다른 연을 차례로 끊었다. 언덕에 남은 아이들은 빈 하늘과 {name}의 연을 번갈아 보았다.", weight: "light" }, { op: 'fame', add: 1 }] },
      { label: '끊긴 연을 주워 고쳐 돌려준다', hint: '연을 잃은 아이들이 고마워한다', values: { loyalty: D }, fx: [{ op: "log", text: "끊어진 연의 대나무 살을 고쳐 주었다. 연을 돌려받은 아이들이 다시 언덕에서 함께 줄을 풀었다.", weight: "light" }] },
      { label: '가장 높이 띄우는 법만 궁리한다', hint: '줄을 끊지 않고 이긴다', values: { inquiry: D }, fx: [{ op: "log", text: "바람이 바뀌는 높이를 찾아 줄을 조금씩 놓았다. 다른 연을 건드리지 않고도 제 연이 가장 높이 올랐다.", weight: "light" }, { op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'wanok_factory', kind: 'door', when: kidW(9, 15, POOR), weight: 8, repeat: 'once', speaker: { relation: '공장의 감독' },
    title: '무기 공장의 일손', body: '산 너머 무기 공장이 아이 일손을 모은다. 하루에 쌀 한 되를 준다. 공장에서 만든 무기는 카이도의 해적들이 쓴다.',
    doors: [
      { label: '공장에 들어가 쌀을 번다', hint: '쌀이 생긴다. 무엇을 만드는지 알게 된다', values: { ambition: D }, fx: [{ op: "log", text: "쌀 한 되를 받아 집으로 돌아왔지만 손에는 기름 냄새가 남았다. 공장 안에서는 해적들이 쓸 무기가 계속 나왔다.", weight: "light" }, { op: 'money', add: 3000 }, { op: 'hp', add: -10 }, { op: 'base', key: 'str', add: 1 }] },
      { label: '공장에서 설계도를 몰래 베껴 온다', hint: '들키면 끝이다. 언젠가 쓸모가 있을지 모른다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: "log", text: "감시꾼이 돌아서자 설계도를 베껴 옷 속에 숨겼다. 공장 밖에 나온 뒤에야 손이 떨리는 것을 알았다.", weight: "light" }, { op: 'flag', id: 'wano_factory_plan' }, { op: 'base', key: 'int', add: 1 }], else: [{ op: "log", text: "도면을 접는 소리에 감시꾼이 돌아봤다. 매를 맞고 빈 손으로 쫓겨나 공장 문이 닫히는 것을 보았다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'hardship', add: 2 }] }] },
      { label: '해적의 무기는 만들지 않는다', hint: '쌀 대신 배를 곯는다', values: { justice: D }, fx: [{ op: "log", text: "공장 관리에게 무기를 만들지 않겠다고 했다. 배급 줄에서 이름이 지워진 뒤 집의 쌀독이 바닥을 드러냈다.", weight: "light" }, { op: 'hp', add: -5 }] },
    ],
  },
  {
    id: 'wanok_ronin', kind: 'door', when: kidIn('쿠리', 8, 15), weight: 8, repeat: 'once', speaker: { relation: '떠돌이 낭인' },
    title: '쿠리의 낭인', body: '쿠리의 무너진 성터에 떠돌이 낭인 하나가 산다. 낭인은 옛날 이 땅의 영주가 무법자들을 품어 마을을 세웠다고 한다.',
    doors: [
      { label: '낭인에게 칼을 가르쳐 달라고 조른다', hint: '낭인이 귀찮아하면서도 가르쳐 준다', values: { romance: D }, fx: [{ op: "log", text: "낭인은 귀찮다는 듯 나뭇가지를 검처럼 쥐여 주었다. 첫 자세가 틀릴 때마다 손등을 가볍게 쳤다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 10 }, { op: 'person', kind: 'ally', relation: '쿠리의 떠돌이 낭인' }] },
      { label: '낭인에게 먹을 것을 날라 준다', hint: '낭인은 말없이 받는다', values: { freedom: D }, fx: [{ op: "log", text: "주먹밥을 내밀자 낭인은 말없이 받았다. 다음 날 그가 머무는 곳 앞에는 빈 그릇이 씻겨 놓여 있었다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '쿠리의 떠돌이 낭인' }] },
      { label: '낭인을 관리에게 알린다', hint: '상을 받는다. 낭인이 사라진다', values: { greed: D }, fx: [{ op: "log", text: "관리들이 낭인이 머물던 집을 뒤졌다. 상을 받아 나왔을 때 낭인의 짐과 발자국은 이미 사라졌다.", weight: "light" }, { op: 'money', add: 4000 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'wanok_tea_house', kind: 'door', when: kidIn('하나노미야코', 7, 15), weight: 8, repeat: 'once', speaker: 'hero',
    title: '찻집 심부름', body: '꽃의 도시 찻집에서 심부름을 하면 귀한 손님들의 이야기가 들린다. 오늘은 쇼군의 관리 둘이 구석에서 무언가를 속삭인다.',
    doors: [
      { label: '찻잔을 나르며 귀를 기울인다', hint: '들은 것을 누구에게 말할지는 나중 일이다', values: { inquiry: D }, fx: [{ op: "log", text: "찻잔을 채우는 동안 관리들이 무기 수레가 지나갈 길을 낮게 말했다. 손님이 떠난 뒤에도 그 지명을 잊지 않았다.", weight: "light" }, { op: 'flag', id: 'wano_overheard' }, { op: 'base', key: 'int', add: 1 }] },
      { label: '찻집 일을 성실히 하고 삯을 받는다', hint: '눈과 귀를 닫는다', values: { loyalty: D }, fx: [{ op: "log", text: "잔을 씻고 바닥을 쓸며 하루 일을 마쳤다. 관리들의 대화에는 끼지 않았고 주인은 약속한 삯을 건넸다.", weight: "light" }, { op: 'money', add: 2000 }] },
      { label: '관리의 지갑을 슬쩍한다', hint: '들키면 큰일이다', values: { greed: D }, danger: true, fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "관리들이 찻값을 다투는 틈에 지갑을 빼냈다. 손님들이 떠난 뒤에야 뒷골목에서 돈을 세었다.", weight: "light" }, { op: 'money', add: 12000 }], else: [{ op: "log", text: "지갑에 손을 대는 순간 관리가 손목을 낚아챘다. 찻집 주인의 만류에도 매를 맞고 밖으로 내쫓겼다.", weight: "light" }, { op: 'hp', add: -15 }, { op: 'hardship', add: 2 }] }] },
    ],
  },
  {
    id: 'wanok_laughing', kind: 'door', when: kidIn('에비스 마을', 6, 15), weight: 9, repeat: 'once', speaker: 'hero',
    title: '웃음밖에 남지 않은 마을', body: '이 마을 어른들은 슬플 때도 웃는다. 이상한 열매를 먹은 뒤로 웃음밖에 나오지 않는다고 한다. 장례식에서도 다들 웃는다.',
    doors: [
      { label: '웃는 어른들 대신 우는 법을 잊지 않으려 한다', hint: '남몰래 운다', values: { romance: D }, fx: [{ op: "log", text: "웃음소리가 가득한 골목을 벗어나 혼자 울었다. 눈물을 닦고 돌아왔을 때도 어른들의 웃음은 계속됐다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '그 열매를 누가 나눠 줬는지 캐묻는다', hint: '쇼군의 이름이 나온다. 위험한 이야기다', values: { justice: D }, fx: [{ op: "log", text: "열매를 나눠 준 이의 이름을 따라가자 쇼군의 하인들이 나왔다. 더 묻기 전에 이웃이 조용히 소매를 잡았다.", weight: "light" }, { op: 'flag', id: 'wano_smile_truth' }] },
      { label: '어른들 따라 함께 웃는다', hint: '그렇게라도 견딘다', values: { loyalty: D }, fx: [{ op: "log", text: "어른들 사이에서 같이 웃었다. 입은 웃는데 눈앞의 빈 밥그릇은 그대로였다.", weight: "light" }] },
    ],
  },
  {
    id: 'wanok_forbidden_name', kind: 'door', when: kidW(7, 15), weight: 7, repeat: 'once', speaker: { relation: '술 취한 노인' },
    title: '부르면 안 되는 이름', body: '술 취한 노인이 길가에서 「오뎅 님」 하고 울며 노래한다. 사람들이 노인을 피한다. 그 이름을 입에 올리면 잡혀간다.',
    doors: [
      { label: '노인을 집까지 부축해 준다', hint: '노인이 옛 이야기를 들려준다', values: { loyalty: D }, fx: [{ op: "log", text: "노인을 부축해 집에 닿자 문을 걸고 옛 영주의 이야기를 들었다. 노인은 다시 노래를 부르지 말아 달라고 했다.", weight: "light" }, { op: 'flag', id: 'wano_heard_oden' }, { op: 'person', kind: 'ally', relation: '오뎅을 부르던 노인' }] },
      { label: '관리가 오기 전에 노인의 입을 막는다', hint: '노인이 서운해한다. 둘 다 무사하다', values: { loyalty: D }, fx: [{ op: "log", text: "관리의 발소리가 가까워져 노인의 노래를 끊었다. 관리가 지나간 뒤 노인은 손을 떼고 서운한 얼굴로 돌아섰다.", weight: "light" }] },
      { label: '그 노래를 따라 외운다', hint: '부르면 안 되는 노래가 머리에 남는다', values: { freedom: D }, fx: [{ op: "log", text: "노래의 마지막 구절까지 따라 불렀다. 골목을 떠난 뒤에도 금지된 이름이 입안에 남았다.", weight: "light" }, { op: 'flag', id: 'wano_heard_oden' }] },
    ],
  },
  {
    id: 'wanok_broken_bridge', kind: 'door', when: kidW(6, 14), weight: 7, repeat: 'once', speaker: 'hero',
    title: '끊어진 다리', body: '폭우에 마을 다리가 끊어졌다. 관리는 고쳐 주지 않는다. 건너편 밭에 가려면 산을 하루 돌아야 한다.',
    doors: [
      { label: '아이들을 모아 통나무를 나른다', hint: '어른들이 하나둘 따라온다', values: { dominion: D }, mark: 'fellowship', fx: [{ op: "log", text: "아이들과 통나무를 끌어내자 어른들이 밧줄을 들고 합류했다. 해가 질 무렵 다리의 첫 발판이 놓였다.", weight: "light" }, { op: 'base', key: 'str', add: 1 }] },
      { label: '밧줄을 걸어 혼자 건너는 길을 낸다', hint: '빠르지만 위험하다', values: { freedom: D }, danger: true, fx: [{ op: 'chance', p: 0.7, then: [{ op: "log", text: "밧줄을 팽팽히 걸고 먼저 강을 건넜다. 건너편 밭으로 갈 작은 길이 생겼다.", weight: "light" }, { op: 'base', key: 'spd', add: 1 }], else: [{ op: "log", text: "빗물에 젖은 밧줄이 손에서 미끄러졌다. 강물에 부딪친 뒤 겨우 돌을 붙잡고 올라왔다.", weight: "light" }, { op: 'hp', add: -15 }] }] },
      { label: '건너편으로 짐을 날라 주고 삯을 받는다', hint: '산길로 하루씩 다닌다', values: { ambition: D }, fx: [{ op: "log", text: "산길을 돌아 짐을 건네고 동전을 받았다. 다리 아래의 거센 물은 그날도 건널 수 없었다.", weight: "light" }, { op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'wanok_snow_grave', kind: 'door', when: kidW(9, 15), weight: 6, repeat: 'once', speaker: 'hero',
    title: '눈 덮인 무덤들', body: '북쪽 링고의 눈 덮인 언덕에는 이름 없는 칼들이 무덤처럼 꽂혀 있다. 옛날 그 칼의 주인들이 무엇을 위해 싸웠는지는 아무도 말하지 않는다.',
    doors: [
      { label: '칼 하나를 뽑아 들고 휘둘러 본다', hint: '무덤의 칼을 건드리면 벌을 받는다는 말이 있다', values: { ambition: D }, fx: [{ op: "log", text: "무덤의 칼을 뽑자 차가운 날이 눈을 갈랐다. 다시 꽂기 전까지 누가 보고 있지 않은지 산길을 살폈다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'hardship', add: 1 }] },
      { label: '칼 앞에 술 한 잔을 붓고 내려온다', hint: '모르는 이들에게 예를 갖춘다', values: { loyalty: D }, fx: [{ op: "log", text: "무덤 앞에 술을 따르자 눈 위에 작은 자국이 났다. 이름 모를 무사들에게 고개를 숙이고 내려왔다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '칼에 새겨진 이름들을 적어 온다', hint: '잊힌 이들을 기억한다', values: { inquiry: D }, fx: [{ op: "log", text: "칼집마다 새긴 이름을 적어 내려왔다. 마을 노인은 그중 하나를 알아보고 오래전 전투를 이야기했다.", weight: "light" }, { op: 'flag', id: 'wano_heard_oden' }] },
    ],
  },
  {
    id: 'wanok_rich_kimono', kind: 'door', when: kidW(7, 15, RICH), weight: 6, repeat: 'once', speaker: 'hero',
    title: '비단옷', body: '넉넉한 집이라 새 비단옷을 맞춘다. 같은 날 이웃 아이는 해진 옷으로 공장에 간다. 옷감 가게 주인이 남은 천을 어떻게 할지 묻는다.',
    doors: [
      { label: '남은 천으로 이웃 아이의 옷을 지어 달라고 한다', hint: '집안 어른이 언짢아한다', values: { freedom: D }, fx: [{ op: "log", text: "남은 천으로 이웃 아이의 소매를 맞췄다. 집안 어른은 천이 줄어든 것을 보고 한동안 말을 하지 않았다.", weight: "light" }, { op: 'money', add: -3000 }, { op: 'person', kind: 'ally', relation: '옷을 얻은 이웃 아이' }] },
      { label: '새 옷을 입고 꽃의 도시를 걷는다', hint: '부러운 눈길을 받는다', values: { ambition: D }, fx: [{ op: "log", text: "새 옷을 입고 꽃의 도시 거리를 걸었다. 시장의 아이들이 옷깃을 보며 수군거렸다.", weight: "light" }, { op: 'fame', add: 1 }] },
    ],
  },
  {
    id: 'wanok_ninja', kind: 'door', when: kidW(7, 14), weight: 6, repeat: 'once', speaker: 'hero',
    title: '지붕 위의 그림자', body: '밤마다 지붕 위를 달리는 그림자가 있다. 쇼군의 닌자라고도 하고, 옛 영주의 닌자가 아직 살아 있다고도 한다.',
    doors: [
      { label: '지붕에 올라 그림자를 쫓는다', hint: '떨어질 수도 있다', values: { romance: D }, danger: true, fx: [{ op: 'chance', p: 0.7, then: [{ op: "log", text: "지붕마다 발을 옮겨 그림자를 따라잡았다. 그림자는 골목 끝으로 사라졌지만 지붕을 넘는 길을 익혔다.", weight: "light" }, { op: 'base', key: 'spd', add: 1 }], else: [{ op: "log", text: "기와가 미끄러져 지붕 아래로 떨어졌다. 그림자의 발소리는 멀어지고 몸만 멍들었다.", weight: "light" }, { op: 'hp', add: -15 }] }] },
      { label: '그림자가 지나는 길에 주먹밥을 놓아 둔다', hint: '다음 날 주먹밥이 없어졌다', values: { peace: D }, fx: [{ op: "log", text: "지붕 끝에 두었던 주먹밥이 아침에 사라졌다. 대신 기와 위에 작은 발자국 하나가 남았다.", weight: "light" }, { op: 'flag', id: 'wano_ninja_rice' }] },
    ],
  },
  // ---------------------------------------------------------------- 원작 순간
  {
    // 원작: 루피가 와노에 오는 해(주인공 스물한 살 무렵), 에비스 마을의 「돈 뿌리는 노인」 시모츠키 야스이에가 처형된다
    id: 'wano_cn_yasuie', kind: 'door', when: adult(19, 23, st('civil', 'settled', 'shipwright', 'child', 'pirate')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '돈 뿌리는 노인의 처형', body: '꽃의 도시 광장에 십자 형틀이 섰다. 매달린 노인은 가난한 마을에 몰래 돈을 뿌리던 사람이다. 웃는 열매를 먹은 마을 사람들이 울지도 못하고 웃는다. 쏘기 전, 노인이 쇼군을 향해 크게 웃는다.',
    doors: [
      { label: '형틀 앞으로 뛰쳐나간다', hint: '총구가 {name}을(를) 향할지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: "log", text: "형틀 쪽으로 뛰자 경비가 총구를 돌렸다. 노인은 웃는 얼굴로 손짓해 더 다가오지 말라고 했다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'hardship', add: 3 }, { op: 'timeline', text: '돈 뿌리는 노인 시모츠키 야스이에의 처형을 막으려 했다', canon: 'yasuie' }] },
      { label: '노인이 남긴 말을 끝까지 듣는다', hint: '그 웃음을 기억한다', values: { loyalty: D }, fx: [{ op: "log", text: "노인의 마지막 말이 광장의 웃음소리를 뚫고 들렸다. 사람들이 그가 남긴 뜻을 서로 낮게 되풀이했다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }, { op: 'timeline', text: '시모츠키 야스이에의 마지막 웃음을 보았다', canon: 'yasuie' }] },
      { label: '광장을 떠나 집으로 돌아간다', hint: '보지 않는다. 오래 잊지 못한다', values: { peace: D }, fx: [{ op: "log", text: "광장을 떠나 문을 닫았지만 밖의 총성이 들렸다. 저녁에야 노인의 이름을 다시 입 밖에 냈다.", weight: "light" }, { op: 'timeline', text: '시모츠키 야스이에가 처형되던 날 광장을 등졌다', canon: 'yasuie' }] },
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
      { label: '도시에 남아 불을 끄고 다친 사람을 나른다', hint: '싸움 대신 도시를 지킨다', values: { justice: D }, fx: [{ op: "log", text: "도시의 지붕에서 불길을 끄고 쓰러진 사람을 옮겼다. 멀리서 섬의 전투 소리가 들릴 동안 길을 비워 두었다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '축제의 밤에 구한 사람' }, { op: 'timeline', text: '불의 축제 밤, 불타는 도시를 지켰다' }] },
      { label: '카이도 쪽에 이 소식을 판다', hint: '큰돈을 받는다. 낭인들에게 들키면 끝이다', values: { greed: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "정보를 받은 카이도 쪽 사람이 돈을 던져 주었다. 축제의 북소리 사이로 낭인들의 배가 급히 방향을 바꾸는 것이 보였다.", weight: "light" }, { op: 'money', add: 90000 }], else: [{ op: "log", text: "돈을 받기 전 낭인들이 배신을 알아챘다. 항구에서 맞붙다 다친 채 달아났고 그들은 얼굴을 기억했다.", weight: "light" }, { op: 'hp', add: -25 }, { op: 'person', kind: 'enemy', relation: '배신을 안 낭인' }] }] },
    ],
  },
  {
    // 원작: 카이도가 쓰러진 뒤 쇄국이 풀리고 나라가 열린다
    id: 'wano_cn_opened', kind: 'door', when: adult(OPENED, 60, LANDED), weight: 8, repeat: 'once', speaker: 'hero',
    title: '열린 나라', body: '새 쇼군이 나라를 연다고 했다. 공장이 멈추고 검은 강이 맑아지기 시작했다. 폭포 아래로 내려가는 배가 처음으로 떳떳하게 떠난다.',
    doors: [
      { label: '그 배를 타고 바깥 바다를 보러 간다', hint: '열린 나라의 첫 손님이 된다', values: { romance: D },
        fx: [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'log', text: '폭포 아래의 바다는 넓었다. 나라는 등 뒤에서 작아졌다.', weight: 'heavy' }, { op: 'timeline', text: '나라가 열린 해 바깥 바다로 나갔다' }] },
      { label: '맑아진 강가에 논을 다시 일군다', hint: '나라 안에서 새로 시작한다', values: { peace: D }, fx: [{ op: "log", text: "강에서 독한 냄새가 빠지자 물을 논으로 끌어들였다. 첫 모가 서는 것을 보고 이웃들이 밭으로 돌아왔다.", weight: "light" }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '나라가 열린 해 맑아진 강가에 논을 일궜다' }] },
      { label: '바깥 상인들과 거래를 튼다', hint: '쇄국이 풀린 틈에 돈이 돈다', values: { ambition: D }, fx: [{ op: "log", text: "바깥 상인의 배가 항구에 닿았다. 처음 보는 물건을 내려놓고 와노의 물건을 싣는 동안 거래 장부가 채워졌다.", weight: "light" }, { op: 'money', add: 30000 }] },
    ],
  },
  // ---------------------------------------------------------------- 와노만의 문 (처지 · 핏줄)
  {
    id: 'wano_beasts', kind: 'door', when: adult(16, OPENED - 1, st('child', 'civil'), crossing), weight: 5, repeat: 'once', speaker: { relation: '백수 해적단의 간부' },
    title: '백수 해적단의 징집', body: '카이도의 해적단이 마을에서 젊은이를 뽑는다. 이상한 열매를 먹으면 짐승의 힘을 얻는다고 한다. 거절한 집은 쌀 배급에서 빠진다.',
    doors: [
      { label: '해적단에 들어가 힘을 얻는다', hint: '무명 검을 지급받고 해적이 된다. 마을 사람들이 눈을 피한다', values: { dominion: D },
        fx: [{ op: 'log', text: '카이도의 해적들이 제복과 무명 검 한 자루를 건넸다. 마을로 돌아오자 이웃들이 길을 비켜 주고 눈을 피했다.', weight: 'light' }, { op: 'receiveWeapon', id: 'sw1' }, { op: 'standing', to: 'pirate' }, { op: 'base', key: 'str', add: 2 }, { op: 'person', kind: 'ally', relation: '백수 해적단의 간부' }, { op: 'timeline', text: '카이도의 해적단에 들어갔다' }] },
      { label: '집안의 쌀을 위해 들어가되 마음은 주지 않는다', hint: '해적이 된다. 언젠가 등을 돌릴지 모른다', values: { romance: D },
        fx: [{ op: "log", text: "해적의 표식을 달고 배급 쌀을 집으로 보냈다. 가족은 먹었지만 {name}은(는) 명령이 내려올 때마다 얼굴을 굳혔다.", weight: "light" }, { op: 'standing', to: 'pirate' }, { op: 'flag', id: 'wano_beast_spy' }, { op: 'timeline', text: '쌀 배급을 위해 카이도의 해적단에 들어갔다' }] },
      { label: '징집을 거절한다', hint: '배급에서 빠진다', closes: true, values: { justice: D }, fx: [{ op: "log", text: "징집 관리가 이름에 줄을 그었다. 다음 배급 날 집안의 그릇은 빈 채로 돌아왔다.", weight: "light" }, { op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'wano_oniwaban', kind: 'door', when: adult(16, 30, st('child', 'civil'), crossing, { c: 'tier', branch: 'any', min: 2 }), weight: 4, repeat: 'once', speaker: { relation: '쇼군의 닌자 대장' },
    title: '쇼군의 닌자', body: '쇼군의 닌자 대장이 {name}의 날랜 몸놀림을 보았다고 한다. 쇼군을 위해 그림자로 일하면 집안은 굶지 않는다.',
    doors: [
      { label: '닌자가 된다', hint: '쇼군의 눈과 귀가 된다', values: { ambition: D },
        fx: [{ op: "log", text: "어둠 속에서 쇼군의 전갈을 받아 움직였다. 궁의 복도에서는 얼굴보다 발소리를 숨기는 법을 먼저 배웠다.", weight: "light" }, { op: 'standing', to: 'cp' }, { op: 'flag', id: 'cpNew' }, { op: 'timeline', text: '쇼군의 닌자가 되었다' }] },
      { label: '닌자가 되어 옛 영주의 무사들에게 정보를 흘린다', hint: '두 주인을 섬긴다. 들키면 목이 날아간다', values: { loyalty: D }, when: [{ c: 'flag', id: 'wano_heard_oden', has: true }],
        fx: [{ op: "log", text: "쇼군에게 올릴 보고를 적으면서 옛 영주의 무사에게 보낼 쪽지도 숨겼다. 두 봉투가 다른 길로 나갔다.", weight: "light" }, { op: 'standing', to: 'cp' }, { op: 'flag', id: 'cpNew' }, { op: 'flag', id: 'wano_double' }, { op: 'timeline', text: '쇼군의 닌자가 되어 몰래 옛 영주의 편에 섰다' }] },
      { label: '그림자로 살지 않는다', hint: '대장이 사라진다', closes: true, values: { freedom: D }, fx: [{ op: "log", text: "닌자 대장은 대답을 듣고 지붕 위로 사라졌다. 다음 밤부터 창밖의 그림자는 다시 보이지 않았다.", weight: "light" }] },
    ],
  },
  {
    id: 'wano_samurai_oath', kind: 'door', when: adult(18, 40, SAMURAI, LANDED), weight: 6, repeat: 'once', speaker: { relation: '옛 영주를 섬기던 무사' },
    title: '무사의 맹세', body: '옛 영주를 섬기던 무사가 집에 찾아왔다. 스무 해 전의 맹세를 기억하는 집안을 찾아다닌다고 한다. 언젠가 칼을 들 날이 오면 함께하겠느냐고 묻는다.',
    doors: [
      { label: '집안의 칼을 꺼내 맹세한다', when: [{ c: 'weapon', id: 'wano_heirloom', has: true }], hint: '그날이 오면 목숨을 건다', values: { loyalty: D }, mark: 'obsession', fx: [{ op: "log", text: "집안의 칼을 꺼내 무사 앞에서 맹세했다. 칼날을 닦아 감춰 두고 불의 축제가 올 날을 기다렸다.", weight: "light" }, { op: 'flag', id: 'wano_sworn' }, { op: 'person', kind: 'ally', relation: '옛 영주의 무사' }] },
      { label: '집안을 지키려 맹세를 거절한다', hint: '무사가 고개를 끄덕이고 떠난다', closes: true, values: { peace: D }, fx: [{ op: "log", text: "무사는 칼집에 손을 얹은 채 고개를 끄덕였다. 그가 떠난 뒤 집안의 문은 오래 닫혀 있었다.", weight: "light" }] },
      { label: '무사를 쇼군에게 넘긴다', hint: '집안은 무사하다. 무사의 이름이 저주처럼 남는다', values: { greed: D }, fx: [{ op: "log", text: "관리들이 무사를 묶어 데려갔다. 가족은 화를 피했지만 대문 앞에서 들은 그의 이름을 지울 수 없었다.", weight: "light" }, { op: 'money', add: 30000 }, { op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'wano_udon', kind: 'door', when: adult(16, 50, st('civil', 'settled', 'child')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '우동의 광산', body: '세금을 못 낸 사람들이 우동의 감옥 광산으로 끌려간다. 오늘은 이웃집 차례다. 관리는 대신 갈 사람이 있으면 받아 주겠다고 한다.',
    doors: [
      { label: '이웃 대신 광산으로 간다', hint: '죄수가 된다. 이웃은 남는다', values: { justice: D },
        fx: [{ op: "log", text: "이웃 대신 죄수의 줄에 섰다. 광산으로 가는 수레가 출발할 때 이웃은 길가에서 모자를 벗었다.", weight: "light" }, { op: 'standing', to: 'prisoner' }, { op: 'hardship', add: 3 }, { op: 'person', kind: 'ally', relation: '대신 지켜 준 이웃' }, { op: 'timeline', text: '이웃 대신 우동의 광산으로 끌려갔다' }] },
      { label: '이웃의 세금을 대신 내 준다', hint: '가진 돈을 내놓는다', values: { loyalty: D }, when: [{ c: 'money', min: 15000 }], fx: [{ op: "log", text: "세금을 대신 내자 관리가 이웃의 이름에 표시를 지웠다. 집으로 돌아와 보니 쌀을 살 돈이 줄어 있었다.", weight: "light" }, { op: 'money', add: -15000 }] },
      { label: '관리에게 덤벼든다', hint: '함께 끌려갈지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "관리를 밀쳐 이웃이 수레에서 내려올 틈을 만들었다. 매를 맞고도 광산행 줄에서는 빠져나왔다.", weight: "light" }, { op: 'hp', add: -15 }], else: [{ op: "log", text: "경비들이 달려들어 이웃과 함께 손을 묶었다. 우동 광산의 문이 닫힐 때까지 서로를 볼 수 있었다.", weight: "light" }, { op: 'standing', to: 'prisoner' }, { op: 'hp', add: -20 }, { op: 'timeline', text: '관리에게 덤볐다가 우동의 광산으로 끌려갔다' }] }] },
    ],
  },
  // ---------------------------------------------------------------- 섬에 남은 어른의 삶
  {
    id: 'wanoa_smile_trade', kind: 'door', when: adult(18, 50, LANDED), weight: 5, repeat: 'once', speaker: { relation: '뒷골목의 거간꾼' },
    title: '웃는 열매의 거간꾼', body: '뒷골목 거간꾼이 이상한 열매를 판다. 먹으면 짐승의 힘을 얻거나, 아니면 평생 웃기만 한다. 값은 비싸고 사려는 사람은 많다.',
    doors: [
      { label: '열매를 사서 되판다', hint: '팔리면 큰돈이 된다. 누군가는 웃기만 하게 된다', values: { greed: D }, fx: [{ op: 'hardship', add: 1 }, { op: 'money', add: -10000, trade: true }, { op: 'chance', p: 0.7, skillCheck: true, then: [{ op: 'money', add: 52000 }, { op: 'log', text: '열매는 웃돈을 받고 팔려 나갔다.', weight: 'light' }], else: [{ op: 'log', text: '관리의 단속에 열매를 빼앗겼다. 산 값만 날렸다.', weight: 'light' }] }] },
      { label: '거간꾼의 창고를 불태운다', hint: '들키면 끌려간다', values: { justice: D }, danger: true, fx: [{ op: 'chance', p: 0.6, then: [{ op: "log", text: "거간꾼의 창고에 불이 붙자 열매 상자가 타들어 갔다. 뒷골목 사람들은 멀리서 연기를 보고 모였다.", weight: "light" }, { op: 'fame', add: 3 }], else: [{ op: "log", text: "감시꾼에게 들켜 불길 앞에서 붙잡혔다. 매를 맞고 달아났지만 창고에는 아직 열매가 남아 있었다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'hardship', add: 2 }] }] },
      { label: '눈을 돌린다', hint: '뒷골목의 일이다', closes: true, fx: [{ op: "log", text: "열매를 사러 온 사람들의 줄을 지나쳤다. 다음 날 뒷골목에서 웃음이 멎지 않는 새 사람이 보였다.", weight: "light" }] },
    ],
  },
  {
    id: 'wanoa_tax', kind: 'door', when: adult(18, 70, LANDED), weight: 6, repeat: { years: 6 }, speaker: { relation: '쇼군의 세리' },
    title: '올해의 세금', body: '쇼군의 세리가 올해 세금을 두 배로 올렸다. 못 내면 광산이다. 마을 사람들이 {name}의 집 앞에 모여 어떻게 할지 묻는다.',
    doors: [
      { label: '마을 사람들의 세금을 모아 대신 협상한다', hint: '세리와 담판한다. 미움을 받을지 모른다', values: { dominion: D }, fx: [{ op: "log", text: "세리 앞에 마을의 세금 장부를 펼쳤다. 이웃들이 뒤에 서 있는 동안 낼 수 있는 몫을 다시 적었다.", weight: "light" }, { op: 'money', add: -8000 }, { op: 'fame', add: 2 }] },
      { label: '세리에게 뒷돈을 쥐여 우리 집만 줄인다', hint: '마을 사람들은 모른다', values: { greed: D }, fx: [{ op: "log", text: "세리가 뒷돈을 소매에 넣고 우리 집의 액수를 줄였다. 밖에서는 이웃들이 여전히 두 배의 세금을 모으고 있었다.", weight: "light" }, { op: 'money', add: -3000 }] },
      { label: '세금을 내지 말자고 마을을 이끈다', hint: '쇼군의 칼이 마을로 향할지 모른다', values: { justice: D }, danger: true, fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "마을 사람들이 세금 자루를 들고 나오지 않았다. 세리는 물러섰지만 쇼군에게 보고하겠다고 으름장을 놓았다.", weight: "light" }, { op: 'fame', add: 5 }], else: [{ op: "log", text: "쇼군의 병사들이 마을로 들어와 세금 자루를 뒤졌다. 버티던 사람들은 맞고 흩어졌다.", weight: "light" }, { op: 'hardship', add: 3 }, { op: 'hp', add: -15 }] }] },
    ],
  },
  {
    id: 'wanoa_swordsmith', kind: 'door', when: adult(16, OPENED - 1, LANDED), weight: 5, repeat: 'once', speaker: { relation: '늙은 대장장이' },
    title: '명검의 주문', body: '늙은 대장장이가 평생의 마지막 칼을 벼린다. 주문한 사람은 카이도의 간부다. 대장장이는 칼에 혼이 담긴다고, 누구에게 가는지가 중요하다고 한다.',
    doors: [
      { label: '칼을 빼돌려 옛 영주의 무사에게 전한다', hint: '대장장이와 함께 목숨을 건다', values: { loyalty: D }, danger: true, fx: [{ op: 'chance', p: 0.6, then: [{ op: "log", text: "대장장이가 칼을 포에 싸서 건넸다. 옛 영주의 무사가 받아 갔고 간부의 심부름꾼은 빈 칼집만 보고 돌아갔다.", weight: "light" }, { op: 'fame', add: 3 }, { op: 'person', kind: 'ally', relation: '늙은 대장장이', age: 62 }], else: [{ op: "log", text: "간부의 부하가 칼을 옮기던 길을 막았다. 대장장이와 함께 맞서다 다친 채 칼을 빼앗겼다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'hardship', add: 2 }] }] },
      { label: '대장장이 곁에서 칼 벼리는 법을 배운다', hint: '칼은 간부에게 간다. 기술은 남는다', values: { inquiry: D }, fx: [{ op: "log", text: "대장장이가 불의 색을 보며 망치질할 때를 가르쳤다. 완성된 칼은 간부의 손에 갔지만 벼린 자국은 눈에 남았다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'base', key: 'int', add: 1 }] },
      { label: '그 칼을 사겠다고 웃돈을 부른다', hint: '대장장이가 마지막으로 벼린 검을 산다', values: { ambition: D },
        when: [{ c: 'money', min: 50000 }, { c: 'weapon', id: 'wano_last_order', has: false }],
        fx: [{ op: 'buyWeapon', id: 'wano_last_order' }, { op: 'mastery', branch: 'sword', add: 15 },
          { op: 'log', text: '대장장이는 칼집에 마지막 검을 넣어 내 손에 맡겼다. 문밖에서 기다리던 간부의 심부름꾼은 빈손으로 돌아갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'wanoa_duel', kind: 'door', when: adult(18, 45, LANDED, { c: 'tier', branch: 'sword', min: 2 }), weight: 5, repeat: 'once', speaker: { relation: '결투를 청하는 무사' },
    title: '결투의 청', body: '이름난 도장의 무사가 {name}에게 결투를 청한다. 와노에서 결투를 거절하는 것은 칼을 버리는 것과 같다.',
    doors: [
      { label: '결투에 응한다', hint: '이기면 이름이 난다. 지면 크게 다친다', values: { ambition: D }, danger: true, fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "도장의 무사가 칼을 거두고 패배를 인정했다. 구경꾼들이 길을 열어 주며 새 이름을 불렀다.", weight: "light" }, { op: 'fame', add: 8 }, { op: 'mastery', branch: 'sword', add: 10 }], else: [{ op: "log", text: "상대의 칼끝에 쓰러져 한동안 일어나지 못했다. 무사는 승부가 끝났다고 선언하고 돌아섰다.", weight: "light" }, { op: 'hp', add: -30 }] }] },
      { label: '목검으로 하자고 청한다', hint: '피를 보지 않는다. 비겁하다는 말을 들을지 모른다', values: { peace: D }, fx: [{ op: "log", text: "목검을 맞대자 도장의 무사가 잠시 놀랐다. 피는 보지 않았지만 구경꾼 사이에서 비겁하다는 수군거림이 돌았다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 5 }] },
      { label: '도장의 문하로 들어가겠다고 한다', hint: '결투 대신 그 칼을 배운다', values: { inquiry: D }, fx: [{ op: "log", text: "무사가 결투 대신 도장 문을 열었다. 새벽마다 같은 마당에서 칼을 뽑는 법을 배웠다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'person', kind: 'ally', relation: '결투를 청했던 무사' }] },
    ],
  },
  {
    id: 'wanoa_brewery', kind: 'door', when: adult(25, 60, st('civil', 'settled')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '양조장', body: '강가의 낡은 양조장이 팔린다. 맑은 물이 나오는 우물도 함께 넘긴다고 한다. 쌀은 귀하고 술은 비싸다.',
    doors: [
      { label: '양조장을 사서 술을 빚는다', hint: '뿌리를 내린다. 쌀을 구하는 게 일이다', values: { peace: D }, fx: [{ op: "log", text: "양조장 솥에 첫 쌀을 붓고 불을 지폈다. 술 냄새가 마을에 퍼지자 쌀을 팔겠다는 농부들이 찾아왔다.", weight: "light" }, { op: 'money', add: -25000 }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '강가의 양조장에서 술을 빚기 시작했다' }] },
      { label: '우물만 사서 마을에 맑은 물을 나눈다', hint: '돈은 안 된다', values: { romance: D }, fx: [{ op: "log", text: "우물에서 맑은 물을 퍼 이웃들에게 나눴다. 돈은 들어오지 않아도 빈 동이를 든 사람들이 날마다 왔다.", weight: "light" }, { op: 'money', add: -10000, trade: true }, { op: 'person', kind: 'ally', relation: '맑은 물을 얻은 마을' }] },
      { label: '양조장을 사서 쇼군의 관리들에게 술을 댄다', hint: '돈과 연줄이 생긴다', values: { greed: D }, fx: [{ op: 'money', add: -25000, trade: true }, { op: 'chance', p: 0.7, skillCheck: true, then: [{ op: 'money', add: 90000 }, { op: 'log', text: '관리들의 술자리가 끊이지 않았다. 술값을 치르는 손도 커져 양조장에 돈이 쌓였다.', weight: 'light' }], else: [{ op: 'log', text: '관리들은 술을 가져가면서도 값을 미뤘다. 빈 술독과 외상 장부만 늘었다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'wanoa_terakoya', kind: 'door', when: adult(36, 75, LANDED), weight: 5, repeat: 'once', speaker: 'hero',
    title: '마을 서당', body: '마을 아이들이 글을 모른다. 쇼군은 글을 아는 백성을 싫어한다. 빈 헛간 하나면 서당을 열 수 있다.',
    doors: [
      { label: '서당을 열어 글과 옛이야기를 가르친다', hint: '관리의 눈에 띌지 모른다', values: { inquiry: D }, fx: [{ op: "log", text: "서당 문을 열자 아이들이 글자를 따라 썼다. 옛 영주의 이야기가 나오자 밖을 지나던 관리가 창가에서 걸음을 늦췄다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '서당에서 글을 배운 아이', age: 10 }, { op: 'fame', add: 2 }] },
      { label: '셈과 장사만 가르친다', hint: '먹고사는 법만 가르친다. 탈은 없다', values: { peace: D }, fx: [{ op: "log", text: "아이들은 셈판을 두드리며 장사 값을 맞췄다. 수업이 끝난 뒤에도 시장에서 쓸 숫자를 서로 물었다.", weight: "light" }] },
      { label: '아이들에게 칼을 가르친다', hint: '언젠가 칼을 들 날을 위해', when: [{ c: 'tier', branch: 'sword', min: 2 }], values: { loyalty: D }, fx: [{ op: "log", text: "아이들에게 나무칼을 나눠 주었다. 작은 손들이 같은 자세를 반복하는 소리가 서당 마당에 났다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 5 }] },
    ],
  },
  {
    id: 'wanoa_old_song', kind: 'door', when: adult(40, 85, LANDED, { c: 'anyOf', conditions: [
      { c: 'choiceAgo', turning: 'wanok_forbidden_name', door: 0 }, { c: 'choiceAgo', turning: 'wanok_forbidden_name', door: 2 },
    ] }), weight: 4, repeat: 'once', speaker: 'hero',
    title: '부르면 안 되던 노래', body: '어릴 적 술 취한 노인에게서 들었던, 부르면 안 되는 노래가 입가에 맴돈다. 손주뻘 아이들이 무슨 노래냐고 묻는다.',
    doors: [
      { label: '노래를 가르쳐 준다', hint: '이야기는 이어진다', values: { romance: D }, fx: [{ op: "log", text: "잊힌 노래의 첫 구절을 부르자 아이가 곧바로 따라 했다. 다음 날 골목에서 다른 아이들의 목소리로도 들렸다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '아무 노래도 아니라고 한다', hint: '아이들을 지킨다', values: { justice: D }, fx: [{ op: "log", text: "아무 노래도 아니라고 하자 아이는 다른 노래를 흥얼거리며 떠났다. 금지된 이름은 그날 골목에 남지 않았다.", weight: "light" }] },
    ],
  },
  {
    id: 'wanoa_famine', kind: 'door', when: adult(36, 80, LANDED), weight: 5, repeat: 'once', speaker: 'hero',
    title: '흉년', body: '비가 오지 않아 논이 갈라졌다. 창고에 쌀이 조금 있다. 쇼군의 관리는 그 쌀도 바치라고 하고, 굶는 이웃들은 문 앞에 서 있다.',
    doors: [
      { label: '창고를 열어 이웃과 나눈다', hint: '관리에게 끌려갈지 모른다', values: { peace: D }, fx: [{ op: 'person', kind: 'ally', relation: '흉년에 쌀을 나눈 이웃' }, { op: 'chance', p: 0.4, then: [{ op: 'hardship', add: 2 }, { op: 'log', text: '이웃들이 쌀을 나눠 든 뒤 관리가 찾아와 창고를 뒤졌다. 그날부터 집 앞에 감시꾼이 서성였다.', weight: 'light' }], else: [{ op: 'log', text: '이웃들이 쌀을 나눠 들고 조용히 돌아갔다. 빈 창고 앞에는 고맙다는 인사가 오래 남았다.', weight: 'light' }] }] },
      { label: '쌀을 숨기고 집안부터 살린다', hint: '이웃들의 눈길이 아프다', values: { peace: D }, fx: [{ op: "log", text: "쌀독을 집 안쪽으로 옮겼다. 이웃의 빈 그릇을 보면서도 식구들의 밥상부터 채웠다.", weight: "light" }] },
      { label: '쌀값이 오를 때 비싸게 판다', hint: '돈을 번다. 원망을 산다', values: { greed: D }, fx: [{ op: "log", text: "쌀값이 오르자 창고의 자루를 열었다. 돈을 받아 든 뒤 줄 선 이웃들의 눈을 마주치기 어려웠다.", weight: "light" }, { op: 'money', add: 45000 }, { op: 'person', kind: 'enemy', relation: '흉년에 원망을 품은 이웃' }] },
    ],
  },
  {
    id: 'wanoa_last_blade', kind: 'door', when: adult(55, 90, LANDED, { c: 'flag', id: 'wano_family_blade', has: true }, { c: 'weapon', id: 'wano_heirloom', has: true }), weight: 4, repeat: 'once', speaker: 'hero',
    title: '칼을 물려준다', body: '어릴 적 밤마다 마당에서 뽑아 보던 집안의 칼이다. 낡은 천을 풀자 칼집에 난 흠집까지 그대로다. 이 칼을 어디에 맡길지 정하려 한다.',
    doors: [
      { label: '함께 수련한 무사에게 준다', hint: '한때 문하에 들었던 도장에 맡긴다', when: [{ c: 'person', relation: '결투를 청했던 무사', has: true, kinds: ['ally'] }], values: { loyalty: D }, fx: [{ op: 'giveAwayWeapon', id: 'wano_heirloom' }, { op: "log", text: "{person:결투를 청했던 무사}은(는) 두 손으로 칼집을 받았다. 도장에서 가장 볕이 잘 드는 자리에 놓고 곁에 집안의 이름을 적었다.", weight: "light" }, { op: 'timeline', text: '집안의 칼을 {person:결투를 청했던 무사}에게 맡겼다' }] },
      { label: '신사에 바친다', hint: '칼은 아무에게도 가지 않는다', values: { peace: D }, fx: [{ op: 'giveAwayWeapon', id: 'wano_heirloom' }, { op: "log", text: "신사에 칼을 올려놓자 관리가 천으로 덮었다. 누구도 뽑지 못한 채 그 자리에 남았다.", weight: "light" }, { op: 'timeline', text: '평생의 칼을 신사에 바쳤다' }] },
      { label: '시합을 열어 이긴 사람에게 준다', hint: '칼은 강한 손에 간다', values: { dominion: D }, fx: [{ op: 'giveAwayWeapon', id: 'wano_heirloom' }, { op: "log", text: "시합의 마지막 승자가 칼을 받았다. 패한 이들도 날을 한 번씩 보고 물러났다.", weight: "light" }, { op: 'fame', add: 3 }, { op: 'timeline', text: '시합을 열어 평생의 칼을 물려주었다' }] },
    ],
  },
  {
    id: 'wanoa_ronin_guest', kind: 'door', when: adult(20, 65, LANDED), weight: 5, repeat: 'once', speaker: { relation: '비 맞은 낭인' },
    title: '비 맞은 낭인', body: '비 오는 밤 낭인 하나가 처마 밑에서 하룻밤만 묵게 해 달라고 한다. 쫓기는 몸이라고 숨기지 않는다. 숨겨 준 집도 벌을 받는다.',
    doors: [
      { label: '집에 들여 재운다', hint: '들키면 함께 벌을 받는다', values: { loyalty: D }, fx: [{ op: 'person', kind: 'ally', relation: '비 오는 밤 숨겨 준 낭인' }, { op: 'chance', p: 0.3, then: [{ op: 'hardship', add: 2 }, { op: 'log', text: '낭인이 방에서 쉬는 동안 관리가 문을 두드렸다. 숨겨 준 일이 들켜 한동안 감시를 받게 되었다.', weight: 'light' }], else: [{ op: 'log', text: '낭인은 마른 옷을 입고 날이 밝기 전에 떠났다. 문턱에는 비에 젖은 짚신 자국이 남았다.', weight: 'light' }] }] },
      { label: '주먹밥과 우산만 주어 보낸다', hint: '서로 이름을 묻지 않는다', values: { freedom: D }, fx: [{ op: "log", text: "낭인은 주먹밥을 받아 들고 우산을 썼다. 이름을 묻지 않은 채 빗길로 사라졌다.", weight: "light" }] },
      { label: '관리에게 알린다', hint: '상을 받는다', values: { greed: D }, fx: [{ op: "log", text: "관리들이 낭인을 묶어 데려갔다. 상으로 받은 돈을 세는 동안 빈 방에 젖은 발자국만 남았다.", weight: "light" }, { op: 'money', add: 12000 }, { op: 'person', kind: 'enemy', relation: '고발당한 낭인' }] },
    ],
  },
  {
    id: 'wanoa_outsider', kind: 'door', when: adult(OPENED, 75, LANDED), weight: 5, repeat: 'once', speaker: { relation: '바깥에서 온 상인' },
    title: '바깥에서 온 사람', body: '나라가 열린 뒤 바깥 상인이 마을에 왔다. 말도 옷도 다르다. 마을 사람들은 문을 닫고, 상인은 길을 묻는다.',
    doors: [
      { label: '집에 들여 바깥 이야기를 듣는다', hint: '바다 너머를 처음 듣는다', values: { inquiry: D }, fx: [{ op: "log", text: "낯선 상인이 바다 건너 항구와 배의 이야기를 했다. 식탁의 불이 꺼질 때까지 모두가 그 말을 들었다.", weight: "light" }, { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '바깥에서 온 상인' }] },
      { label: '상인을 꽃의 도시까지 안내하고 삯을 받는다', hint: '바깥 돈이 들어온다', values: { ambition: D }, fx: [{ op: "log", text: "상인을 꽃의 도시까지 데려가자 그가 바깥 동전을 쥐여 주었다. 시장 사람들은 낯선 물건을 둘러보았다.", weight: "light" }, { op: 'money', add: 10000 }] },
      { label: '바깥 사람은 믿지 않는다', hint: '문을 닫는다', values: { loyalty: D }, fx: [{ op: "log", text: "문을 닫자 상인의 발소리가 골목 끝으로 멀어졌다. 바깥 바다 이야기는 듣지 못했다.", weight: "light" }] },
    ],
  },
];
