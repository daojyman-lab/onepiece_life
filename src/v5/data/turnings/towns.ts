// 마을의 유년기 (3~15살): 그 마을에서 태어나 지금도 그 마을에 사는 아이에게만 온다 (kidIn).
// 이 파일: 후샤 마을, 고아 왕국 그레이 터미널, 셸스 타운, 오렌지 마을. 나머지 네 마을은 towns-2.ts.
// 원작의 일은 주인공의 나이(루피와 같은 나이)에 맞춰 오고, 주인공이 그 결말을 바꾸지 않는다.
//   빨간 머리 해적단이 후샤 마을에 머문 것은 주인공 예닐곱 살, 그레이 터미널의 큰불은 일곱 살.
//   모건 대령과 그 외아들 헤르메포는 주인공의 십대 내내 셸스 타운에 있다.
// 마을마다 열다섯 살 무렵 어디로 갈지를 묻는 전환점(go_*)이 하나 있고, 고향을 아주 떠나는 문은 마을마다 많아야 하나다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { POOR, RICH, kidIn, leaveTo } from './childhood';
import { TOWNS_2 } from './towns-2';
import type { Turning } from '../../core/types';

const D = V.value.door;
const FUSHA = '후샤 마을', GRAY = '고아 왕국 그레이 터미널', SHELLS = '셸스 타운', ORANGE = '오렌지 마을';

const TOWNS_1: Turning[] = [
  // ---------------------------------------------------------------- 후샤 마을: 마키노의 술집, 코르보 산의 산적
  {
    id: 'town_fusha_redhair', kind: 'door', when: kidIn(FUSHA, 6, 7), weight: 20, repeat: 'once', speaker: { canon: 'shanks' },
    title: '빨간 머리의 술자리', body: '마키노의 술집에 빨간 머리 선장의 해적단이 한 해째 눌러앉아 있다. 선장은 마을 아이들에게 고기를 나눠 주면서도, 배에 태워 달라는 말에는 웃으며 고개를 젓는다.',
    doors: [
      { label: '짧은 항해를 나가는 날 배의 술통에 숨어든다', hint: '닻을 올리기 전에 들키면 선원의 어깨에 얹혀 돌아온다. 집에서는 한동안 문밖에 못 나간다', values: { freedom: D }, mark: 'daring',
        fx: [{ op: 'flag', id: 'stowawayRedHair' }, { op: 'log', text: '돛대 아래 술통 속에서 들켰다. 선장은 배를 잡고 웃으며 {name}을(를) 부두에 내려놓았다.', weight: 'heavy' }] },
      { label: '망보는 선원에게 매듭과 바람 읽는 법을 배운다', hint: '술집 심부름으로 번 동전은 그 선원의 술값으로 다 나간다. 바다의 낌새가 눈에 들어온다', values: { inquiry: D },
        fx: [{ op: 'money', add: -500 }, { op: 'mastery', branch: 'observation', add: 6 }, { op: 'log', text: '술값을 내자 선원은 밧줄을 쥐여 주고 바람에 따라 돛이 당겨지는 때를 짚어 주었다. 며칠 뒤 {name}은(는) 배가 흔들리기 전에 매듭을 고쳤다.', weight: 'light' }] },
      { label: '선장 앞에서 언젠가 내 배를 띄우겠다고 큰소리친다', hint: '술집의 어른들이 두고두고 놀린다. 뱉은 말은 거둘 수 없다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'flag', id: 'redHairVow' }, { op: 'log', text: '선장은 잔을 내려놓고 그날이 오면 배 이름을 알려 달라고 했다. 술집 사람들은 웃었지만 {name}은(는) 말을 거두지 않았다.', weight: 'heavy' }, { op: 'timeline', text: '빨간 머리 선장 앞에서 제 배를 띄우겠다고 큰소리쳤다' }] },
    ],
  },
  {
    id: 'town_fusha_higuma', kind: 'door', when: kidIn(FUSHA, 7, 7), weight: 20, repeat: 'once', speaker: 'hero',
    title: '술집에 들이닥친 산적', body: '해적들이 바다에 나간 사이, 산적 두목 히구마 일당이 마키노의 술집 문을 걷어차고 들어와 술을 내놓으라고 한다. 그 무렵 마을에는 루피라는 꼬마가 이상한 열매를 먹고 몸이 고무처럼 늘어났다는 소문이 돌았다.',
    doors: [
      { label: '마키노를 감싸며 산적의 다리에 매달린다', hint: '어린 주먹으로는 상대가 안 된다. 얻어맞고 마룻바닥에 내동댕이쳐진다', values: { justice: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '산적의 발길질에 나가떨어졌다. 마키노가 울면서 {name}의 이마를 닦아 주었다.', weight: 'heavy' }] },
      { label: '뒷문으로 빠져나가 촌장을 부르러 달린다', hint: '촌장이 달려오지만 산적은 늙은이의 말을 듣지 않는다. 술집의 술은 다 털린다', values: { freedom: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'ally', relation: '술집 주인', canon: 'makino' }, { op: 'log', text: '촌장이 술집에 도착했을 때 산적은 이미 술통을 비우고 있었다. 마키노는 급히 달려온 {name}의 손을 잡고 다친 곳이 없는지 살폈다.', weight: 'light' }] },
      { label: '탁자 밑에 숨어 산적들의 얼굴과 말버릇을 외운다', hint: '다친 데는 없다. 숨어 있던 일이 오래 마음에 걸린다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'flag', id: 'higumaFaces' }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '탁자 밑에서 히구마의 목소리와 졸개들의 얼굴을 하나씩 외웠다. 산적이 떠난 뒤 술집 바닥에 엎드려 있던 자신이 부끄러워 한동안 말이 없었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_fusha_debt', kind: 'door', when: kidIn(FUSHA, 8, 12, POOR), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '산적의 빚', body: '흉년 끝에 집에서 산적에게 돈을 빌렸다. 갚을 날이 지나자 산적 졸개가 밤마다 문을 두드린다. 부모는 촌장에게는 알리지 말라고 몇 번이고 당부했다.',
    doors: [
      { label: '촌장에게 졸개의 행패를 낱낱이 이른다', hint: '마을 어른들이 산길을 지키기 시작한다. 부모는 크게 노하고, 졸개는 {name}의 얼굴을 기억한다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'flag', id: 'banditGrudge' }, { op: 'log', text: '촌장이 지팡이를 짚고 산 어귀까지 올라갔다. 그날 밤 부모는 {name}과(와) 말하지 않았다.', weight: 'light' }] },
      { label: '산에 장작을 져다 바치며 빚을 조금씩 던다', hint: '한 철 내내 산길을 오르내린다. 어깨가 단단해지고 발목을 몇 번이고 삔다', values: { inquiry: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '장작을 진 채 산길을 오르내렸다. 졸개는 받은 장작을 빚 장부에 한 줄씩 적었고, {name}은(는) 저녁마다 부은 발목을 주물렀다.', weight: 'light' }] },
      { label: '졸개를 이길 때까지 풍차 뒤에서 몽둥이를 휘두른다', hint: '한 번은 크게 얻어맞는다. 그다음부터 졸개가 문을 두드리는 밤이 준다', values: { dominion: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'mastery', branch: 'fist', add: 8 }, { op: 'log', text: '졸개에게 한 차례 크게 맞은 뒤에도 풍차 뒤에서 몽둥이를 휘둘렀다. 다시 마주쳤을 때 졸개는 문을 두드리는 대신 먼발치서 돌아섰다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'town_fusha_crate', kind: 'door', when: kidIn(FUSHA, 11, 14, RICH), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '창고 바닥의 상자', body: '해군 영웅 가프 중장이 마을에 들른다는 전갈이 왔다. 그 전날 밤, 부모가 곡물 창고 바닥 밑에 상자 하나를 숨겼다. 틈으로 보인 것은 바다 건너에서 몰래 들여온 화약이었다.',
    doors: [
      { label: '가프 중장의 부하에게 상자를 알린다', hint: '집안의 장사는 무너진다. 부모와는 오래 말을 섞지 못한다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'wealth', to: 'common' }, { op: 'flag', id: 'reportedFamily' }, { op: 'log', text: '가프의 부하들이 창고 바닥을 열고 화약 상자를 꺼냈다. 장사를 접은 부모는 {name}과(와) 눈도 맞추지 않았다.', weight: 'heavy' }, { op: 'timeline', text: '집안의 밀수를 해군에 알렸다' }] },
      { label: '상자를 더 깊이 묻는 일을 거든다', hint: '집은 무사하다. 그 대신 평생 입 밖에 낼 수 없는 일이 생긴다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'familySecret' }, { op: 'hardship', add: 2 }, { op: 'log', text: '상자를 덮은 마룻바닥 위로 해군의 발소리가 지나갔다. 부모는 가슴을 쓸어내렸지만 {name}은(는) 이후에도 그 창고에 들어갈 때마다 바닥을 살폈다.', weight: 'heavy' }] },
      { label: '입을 다무는 값으로 부모에게 배삯을 받아 낸다', hint: '주머니는 두둑해진다. 부모는 그날부터 {name}을(를) 남처럼 본다', values: { greed: D }, 
        fx: [{ op: 'money', add: 30000 }, { op: 'flag', id: 'coldFamily' }, { op: 'log', text: '부모는 배삯을 세어 주고 상자 이야기는 다시 꺼내지 말라고 했다. 그날 뒤로 식탁에서 {name}의 자리가 조금 멀어졌다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'go_fusha', kind: 'door', when: kidIn(FUSHA, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '풍차 아래의 작은 배', body: '풍차 방앗간 아래 개울목에 주인 잃은 작은 배가 떠밀려 왔다. 루피라는 녀석은 산에서 혼자 수련하며 열일곱이 되면 바다로 나간다고 떠들고 다닌다. {name}에게도 어디로 갈지 정할 때가 왔다.',
    doors: [
      { label: '작은 배를 고쳐 섬 사이 짐배 일을 시작한다', hint: '열여섯을 기다리지 않고 제 밥벌이를 한다. 배를 고치느라 모아 둔 돈이 다 든다', values: { freedom: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: -2000 }, { op: 'flag', id: 'smallBoat' }, { op: 'log', text: '모은 돈으로 판자와 밧줄을 사 작은 배를 띄웠다. 첫 짐을 실은 날 풍차가 시야에서 작아질 때까지 노를 놓지 않았다.', weight: 'heavy' }, { op: 'timeline', text: '작은 짐배를 고쳐 섬 사이를 오갔다' }] },
      { label: '로그타운으로 가는 상선의 갑판 일꾼이 된다', hint: '고향을 떠나 위대한 항로 입구의 항구에서 내린다. 돌아올 날은 정하지 않는다', values: { romance: D },
        fx: leaveTo('로그타운', '상선의 갑판을 닦으며 바다를 건넜다. 처형대가 보이는 항구에 내렸다.', '열다섯에 후샤 마을을 떠나 로그타운으로 갔다') },
      { label: '촌장 밑에서 마을 일을 거들며 남는다', hint: '바다는 멀어진다. 마을이 {name}을(를) 믿고 일을 맡기기 시작한다', values: { peace: D },
        fx: [{ op: 'flag', id: 'villageHand' }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '촌장은 부두와 풍차의 일을 하나씩 맡겼다. 사람들은 처음엔 어린아이를 찾다가, 얼마 뒤에는 {name}에게 직접 부탁하러 왔다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 고아 왕국 그레이 터미널: 쓰레기 산과 높은 성벽
  {
    id: 'town_gray_stash', kind: 'door', when: kidIn(GRAY, 6, 7), weight: 18, repeat: 'once', speaker: 'hero',
    title: '철판 밑의 보물', body: '쓰레기 산 너머 숲가, 녹슨 철판 밑에 누군가 동전과 보석 부스러기를 모아 두었다. 쇠파이프를 든 주근깨 소년과 모자를 쓴 소년이 날마다 그곳을 살피러 온다.',
    doors: [
      { label: '손대지 않고 철판을 도로 덮어 둔다', hint: '배고픈 밤이 이어진다. 두 소년은 끝내 {name}을(를) 모른다', values: { justice: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'log', text: '철판을 원래대로 덮고 빈손으로 돌아왔다. 밤에는 배가 고파도 숲가로 다시 가지 않았고, 두 소년은 누가 다녀갔는지 알지 못했다.', weight: 'light' }] },
      { label: '동전 한 줌을 집어 온다', hint: '며칠은 배불리 먹는다. 들키면 쇠파이프가 날아온다', values: { greed: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 2000 }, { op: 'log', text: '두 소년이 오기 전에 동전 한 줌을 챙겨 나왔다. 며칠 동안 굶지 않았지만 숲가를 지날 때마다 발걸음을 재촉했다.', weight: 'light' }],
               else: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '주근깨 소년에게 붙잡혀 쇠파이프로 흠씬 두들겨 맞았다.', weight: 'heavy' }] }] },
      { label: '두 소년이 오는 길목에서 쓰레기 산 패거리를 망봐 준다', hint: '패거리의 눈 밖에 나 고철 줍는 자리를 잃는다. 두 소년이 {name}의 얼굴을 알게 된다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'grayLookout' }, { op: 'log', text: '패거리가 오는 것을 알려 두 소년이 철판을 덮고 몸을 숨겼다. 패거리는 {name}의 고철 자리를 빼앗았고, 소년들은 떠나기 전 얼굴을 확인했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_gray_fire', kind: 'door', when: kidIn(GRAY, 7, 7), weight: 25, repeat: 'once', speaker: 'hero',
    title: '불타는 쓰레기 산', body: '왕국이 귀한 손님을 맞기 전날 밤, 그레이 터미널 곳곳에서 한꺼번에 불길이 솟았다. 성문은 굳게 닫혀 있고, 연기 속에서 사람들의 비명이 들린다.',
    doors: [
      { label: '판잣집 아이들을 이끌고 바닷가 쪽으로 빠져나간다', hint: '불길을 헤치다 팔과 등에 화상을 입는다. 살아 나온 아이들이 {name}의 곁에 남는다', values: { loyalty: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'person', kind: 'ally', relation: '불길에서 함께 나온 아이' }, { op: 'log', text: '아이들을 붙잡고 연기 속을 헤쳐 바닷가에 닿았다. 화상 입은 팔로도 마지막 아이의 손을 놓지 않았고, 살아 나온 아이 하나가 계속 곁에 머물렀다.', weight: 'heavy' },
             { op: 'flag', id: 'grayFire' }, { op: 'timeline', text: '그레이 터미널의 큰불에서 아이들을 이끌고 빠져나왔다' }] },
      { label: '닫힌 성문을 두드리며 열어 달라고 외친다', hint: '성문은 열리지 않는다. 연기를 들이마시고 쓰러졌다가 겨우 깨어난다', values: { justice: D }, mark: 'rebel', danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'base', key: 'vit', add: -1 }, { op: 'flag', id: 'grayFire' },
             { op: 'log', text: '성문은 끝내 열리지 않았다. 성벽 위의 병사들은 불길을 내려다보기만 했다.', weight: 'heavy' }, { op: 'timeline', text: '그레이 터미널의 큰불 속에서 닫힌 성문을 두드렸다' }] },
      { label: '가진 것을 다 버리고 혼자 숲으로 달린다', hint: '살아남는다. 판잣집도 모아 둔 고철도 잿더미가 되고, 뒤에 남은 얼굴들이 오래 떠오른다', mark: 'composure',
        fx: [{ op: 'money', add: -5000 }, { op: 'hardship', add: 5 }, { op: 'flag', id: 'grayFire' }, { op: 'log', text: '숲에 닿아 돌아보니 판잣집이 있던 자리까지 불길에 잠겼다. 날이 밝은 뒤에도 모아 둔 고철과 뒤에 남은 이들의 이름이 떠올랐다.', weight: 'heavy' }, { op: 'timeline', text: '그레이 터미널의 큰불에서 혼자 살아남았다' }] },
    ],
  },
  {
    id: 'town_gray_scrap', kind: 'door', when: kidIn(GRAY, 8, 13, POOR), weight: 10, repeat: 'once', speaker: { relation: '고철패의 우두머리' },
    title: '고철패의 부름', body: '고철을 독차지한 패거리가 쓰레기 산의 아이들을 불러 모은다. 따르는 아이는 배불리 먹고, 거절한 아이는 고철 줍는 자리를 빼앗긴다. 우두머리는 해 지기 전까지 답을 가져오라고 했다.',
    doors: [
      { label: '패거리에 들어가 고철 몫을 받는다', hint: '끼니 걱정은 사라진다. 그 대신 다른 아이들의 자리를 빼앗는 일을 맡는다', values: { greed: D },
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'scrapGang' }, { op: 'log', text: '우두머리는 고철 몫을 내주고 다음 날 다른 아이의 자리를 차지하라고 시켰다. 배를 채운 뒤에도 그 아이의 빈 바구니가 눈에 밟혔다.', weight: 'light' }] },
      { label: '거절하고 숲가에서 혼자 먹을 것을 찾는다', hint: '배를 곯고 짐승에게 물린다. 누구의 몫도 빼앗지 않는다', values: { freedom: D }, mark: 'rebel', closes: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '숲가에서 먹을 것을 찾다 짐승에게 물렸다. 빈손으로 돌아오는 날도 있었지만 패거리가 정한 몫을 빼앗지는 않았다.', weight: 'light' }] },
      { label: '자리를 빼앗긴 아이들을 모아 벼랑 아래 새 고철 자리를 튼다', hint: '패거리와 몇 번이고 맞붙는다. 함께 버틴 아이들이 생긴다', values: { loyalty: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '고철 자리를 함께 지킨 아이' }, { op: 'log', text: '벼랑 아래서 몇 번이나 패거리와 부딪쳤다. 그래도 함께 모인 아이들은 다음 날 다시 그 자리에 왔고 고철 바구니를 나눠 들었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_gray_brooch', kind: 'door', when: kidIn(GRAY, 8, 13, RICH), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '성벽 안의 브로치', body: '{name}의 집은 높은 성벽 안 귀족 거리에 있다. 집안의 은 브로치가 사라지자, 성벽 밖에서 온 하녀 아이가 도둑으로 몰려 끌려갔다. 브로치는 {name}이(가) 장난치다 화단에 떨어뜨린 것이다.',
    doors: [
      { label: '부모에게 사실을 털어놓는다', hint: '하녀 아이는 풀려난다. 크게 꾸지람을 듣고 한 해 동안 성문 밖에 나가지 못한다', values: { justice: D },
        fx: [{ op: 'flag', id: 'confessed' }, { op: 'flag', id: 'grounded' }, { op: 'log', text: '화단에서 브로치를 꺼내 보이자 하녀 아이가 풀려났다. 부모는 {name}을(를) 집에 들여보낸 뒤 한 해 동안 성문 밖에 나가지 못하게 했다.', weight: 'heavy' }] },
      { label: '브로치를 몰래 찾아 놓고 하녀 아이의 식구에게 용돈을 보낸다', hint: '누명은 벗겨지지만 아이는 일자리를 잃는다. 모아 둔 용돈이 바닥난다', values: { romance: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'log', text: '브로치가 화단에서 발견되자 하녀 아이의 누명은 벗겨졌다. 그러나 집안은 다시 고용하지 않았고, {name}이(가) 보낸 돈은 아이의 가족에게 닿았다.', weight: 'heavy' }] },
      { label: '입을 다문다', hint: '하녀 아이는 성벽 밖으로 쫓겨나 다시 보이지 않는다. 아무도 {name}을(를) 탓하지 않는다',
        fx: [{ op: 'flag', id: 'guiltSecret' }, { op: 'hardship', add: 2 }, { op: 'log', text: '하녀 아이가 성문 밖으로 쫓겨나는 날에도 화단의 브로치는 그대로 있었다. 아무도 {name}을(를) 의심하지 않았고, 그 사실이 더 오래 남았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'go_gray', kind: 'door', when: kidIn(GRAY, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '왕국을 떠나는 배', body: '주근깨 소년이 작은 배 하나로 바다에 나갔다는 소문이 성벽 밖에 돌았다. 왕국의 항구에서는 로그타운으로 가는 상선이 짐꾼을 구하고, 성벽 안 귀족 집은 문지기를 구한다.',
    doors: [
      { label: '로그타운행 상선의 짐꾼으로 오른다', hint: '쓰레기 산을 떠나 위대한 항로 입구의 항구에서 내린다. 돌아올 판잣집은 남기지 않는다', values: { freedom: D },
        fx: leaveTo('로그타운', '짐칸의 냄새를 맡으며 며칠을 건넜다. 성벽 없는 항구 도시가 눈앞에 있었다.', '열다섯에 고아 왕국을 떠나 로그타운으로 갔다') },
      { label: '성벽 안 귀족 집의 문지기가 된다', hint: '배는 부르다. 성벽 밖 옛 이웃들이 {name}을(를) 성벽 안의 사람이라 부르며 등을 돌린다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 5000 }, { op: 'flag', id: 'wallGuard' }, { op: 'log', text: '귀족 집의 문 앞에서 하루 종일 사람들을 가려 들였다. 성벽 밖 옛 이웃이 지나가자 인사를 건넸지만 그들은 걸음을 늦추지 않았다.', weight: 'heavy' }, { op: 'timeline', text: '성벽 안 귀족 집의 문지기가 되었다' }] },
      { label: '쓰레기 산에 남아 어린아이들을 거둔다', hint: '버는 것은 모두 아이들 입으로 들어간다. 판잣집 하나가 {name}의 집이 된다', values: { romance: D }, mark: 'fellowship',
        fx: [{ op: 'hardship', add: 5 }, { op: 'person', kind: 'ally', relation: '거둔 아이' }, { op: 'flag', id: 'grayKeeper' }, { op: 'log', text: '판잣집 지붕을 고치자 아이들이 하나둘 들어왔다. 벌어 온 것을 모두 나눠 먹어야 했지만 저녁마다 빈자리가 줄었다.', weight: 'heavy' }] },
    ],
  },

  // ---------------------------------------------------------------- 셸스 타운: 해군 기지, 모건 대령과 헤르메포
  {
    id: 'town_shells_errand', kind: 'door', when: kidIn(SHELLS, 10, 14), weight: 10, repeat: 'once', speaker: 'hero',
    title: '기지의 견습 자리', body: '해군 기지에서 잡일할 견습 아이를 뽑는다는 방이 붙었다. 모집하는 곳으로 가는 길에, 병사들이 노점 아이의 좌판을 짓밟고 웃으며 지나갔다. 아이는 다친 다리로 흩어진 과일을 줍고 있다.',
    doors: [
      { label: '좌판을 짓밟은 병사를 기지 앞에서 고발한다', hint: '모건 대령의 기지에서 병사를 고발한 아이는 견습이 될 수 없다. 병사들이 {name}의 얼굴을 기억한다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'baseGrudge' }, { op: 'log', text: '기지 앞에서 병사의 짓을 말하자 모집 담당자는 지원서를 치웠다. 병사들은 {name}의 어깨를 밀치고 이름을 물었다.', weight: 'light' }] },
      { label: '노점 아이를 업고 의원에게 간다', hint: '모집 시간은 놓친다. 약값은 {name}이(가) 치른다', values: { peace: D },
        fx: [{ op: 'money', add: -1000 }, { op: 'person', kind: 'ally', relation: '노점의 아이' }, { op: 'log', text: '의원에게 약값을 내고 돌아오니 견습 모집은 끝나 있었다. 노점 아이는 남은 과일을 하나 건네며 내일 좌판을 다시 세울 때 와 달라고 했다.', weight: 'light' }] },
      { label: '못 본 척 모집에 나간다', hint: '견습 자리를 얻어 품삯을 받는다. 그 아이의 우는 소리가 귀에 남는다', values: { greed: D }, 
        fx: [{ op: 'money', add: 4000 }, { op: 'flag', id: 'baseErrand' }, { op: 'log', text: '기지에서 견습 품삯을 받았다. 첫날 일을 마치고 장터를 지나며 쓰러진 좌판이 있던 자리를 피해서 걸었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_shells_helmeppo', kind: 'door', when: kidIn(SHELLS, 12, 15), weight: 12, repeat: 'once', speaker: { canon: 'helmeppo' },
    title: '대령의 외아들', body: '모건 대령의 외아들 헤르메포가 병사 둘을 거느리고 장터를 돈다. 아버지에게 이른다는 말 한마디에 상인들은 천막을 접는다. 오늘은 {name}이(가) 일하는 노점 앞에서 걸음을 멈췄다.',
    doors: [
      { label: '노점을 뒤엎으려는 손을 붙잡는다', hint: '병사들에게 끌려가 기지 뒤뜰에서 매를 맞는다. 헤르메포는 그 얼굴을 잊지 않는다', values: { freedom: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'person', kind: 'enemy', relation: '앙심을 품은 대령의 외아들', canon: 'helmeppo' }, { op: 'log', text: '병사들이 {name}을(를) 뒤뜰에 끌고 가 매질했다. 헤르메포는 돌아서기 전에 얼굴을 확인하고 다시 만나면 기억하겠다고 말했다.', weight: 'heavy' }] },
      { label: '고개를 숙이고 헤르메포의 심부름꾼이 된다', hint: '노점은 무사하고 용돈도 생긴다. 장터 사람들이 {name}에게 등을 돌린다', values: { ambition: D },
        fx: [{ op: 'money', add: 3000 }, { op: 'flag', id: 'helmeppoLackey' }, { op: 'log', text: '헤르메포는 심부름값을 내밀고 다른 노점으로 앞장섰다. {name}이(가) 뒤따라가자 지켜보던 상인들이 고개를 돌렸다.', weight: 'light' }] },
      { label: '상인들과 천막을 함께 거두어 뒷골목에 장을 다시 연다', hint: '그날 벌이는 공친다. 뒷골목 장터 사람들이 {name}을(를) 제 식구처럼 대한다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'money', add: -1000 }, { op: 'flag', id: 'backAlleyMarket' }, { op: 'log', text: '상인들은 천막을 걷어 뒷골목에 다시 펼쳤다. 그날 장사는 망쳤지만 다음 날 빈자리를 남겨 두고 {name}을(를) 불렀다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_shells_tax', kind: 'door', when: kidIn(SHELLS, 9, 14), weight: 10, repeat: 'once', speaker: 'hero',
    title: '대령의 세금', body: '모건 대령이 마을에 새 세금을 매겼다. 기한을 넘긴 이웃 어부가 기지 마당의 말뚝에 묶였고, 물 한 모금 주는 자도 같은 벌을 받는다는 방이 붙었다.',
    doors: [
      { label: '밤에 기지 담을 넘어 물을 건넨다', hint: '어부는 그 밤을 넘긴다. 들키면 같은 말뚝에 묶인다', values: { peace: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'log', text: '보초가 조는 사이 물통을 건네고 담을 넘어 돌아왔다.', weight: 'light' }],
               else: [{ op: 'hp', add: -20 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '보초에게 붙잡혀 사흘을 어부 옆 말뚝에 묶여 있었다.', weight: 'heavy' }] }] },
      { label: '세금 장부를 몰래 들여다보고 돈이 어디로 가는지 알아낸다', hint: '대령이 세금으로 제 동상을 세운다는 것을 안다. 아는 것만으로는 아무것도 바뀌지 않는다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'flag', id: 'morganLedger' }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '장부에는 세금이 대령의 동상 공사비로 넘어간 기록이 있었다. {name}은(는) 숫자를 외우고 장부를 덮었지만 어부의 말뚝은 그대로였다.', weight: 'light' }] },
      { label: '대령의 방이 붙은 벽에 밤새 낙서를 한다', hint: '마을 아이들이 낄낄댄다. 병사들이 낙서한 아이를 찾아 집집이 뒤진다', values: { freedom: D }, mark: 'rebel',
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'graffiti' }, { op: 'log', text: '아침에 병사들이 지우기 전에 마을 아이들이 낙서를 보고 웃었다. {name}은(는) 손에 남은 먹물을 닦고 다른 골목으로 돌아갔다.', weight: 'light' }],
               else: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'baseGrudge' }, { op: 'log', text: '손에 묻은 먹물 때문에 병사에게 붙들려 매를 맞았다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'town_shells_fish', kind: 'door', when: kidIn(SHELLS, 9, 14, POOR), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '깎인 생선 값', body: '기지에 생선을 대는 상인이 빚을 핑계로 집에서 잡은 생선 값을 또 깎았다. 부모는 하루 벌이를 몽땅 내고도 빚을 다 갚지 못했다. 상인 집 도련님은 기지를 등에 업고 골목에서 {name}을(를) 비웃는다.',
    doors: [
      { label: '기지로 가는 화물선에 숨어 큰 항구로 가려 한다', hint: '사흘 만에 들켜 다음 항구에서 되돌려 보내진다. 집에는 빚과 꾸지람이 기다린다', values: { freedom: D }, mark: 'daring',
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'stowawayCaught' }, { op: 'log', text: '짐칸에서 들켰다. 선원들이 {name}을(를) 셸스 타운으로 가는 배에 도로 태웠다.', weight: 'heavy' }] },
      { label: '도련님의 멱살을 잡는다', hint: '골목은 조용해진다. 상인이 생선 값을 더 깎고, 기지의 병사가 집에 찾아온다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'merchantGrudge' }, { op: 'hardship', add: 5 }, { op: 'log', text: '도련님은 골목에서 물러났지만 상인은 생선값을 더 깎았다. 저녁에는 기지 병사까지 집 문 앞에 나타났다.', weight: 'heavy' }] },
      { label: '새벽마다 어시장에서 생선 손질을 거들어 빚을 던다', hint: '손에 칼자국이 늘고 놀 틈이 없다. 빚이 조금씩 준다', values: { loyalty: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'str', add: 1 }, { op: 'log', text: '새벽 어시장에서 손질한 생선이 쌓일수록 빚 장부의 숫자가 조금씩 줄었다. {name}의 손에는 새 칼자국이 늘었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'go_shells', kind: 'door', when: kidIn(SHELLS, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '기지의 문 앞에서', body: '셸스 타운의 해군 기지가 열다섯 살 견습 수병을 받는다는 방을 내걸었다. 같은 날 부두에는 로그타운으로 가는 보급선이 닻을 내렸다.',
    doors: [
      { label: '기지의 견습 수병으로 들어간다', hint: '흰 제복을 입는다. 모건 대령의 말이 곧 법인 기지다', values: { justice: D },
        fx: [{ op: 'standing', to: 'marine' }, { op: 'flag', id: 'underMorgan' }, { op: 'log', text: '흰 견습 제복을 입고 첫 점호에 섰다. 모건 대령의 명령이 내려오자 병사들은 이유를 묻지 않고 움직였다.', weight: 'heavy' }, { op: 'timeline', text: '셸스 타운 기지의 견습 수병이 되었다' }] },
      { label: '보급선의 잡일꾼이 되어 로그타운으로 간다', hint: '대령의 마을을 떠나 위대한 항로 입구의 항구에서 새로 시작한다', values: { freedom: D },
        fx: leaveTo('로그타운', '보급선의 갑판에서 셸스 타운의 기지가 작아지는 것을 보았다.', '열다섯에 셸스 타운을 떠나 로그타운으로 갔다') },
      { label: '부두 창고 일을 맡아 마을 사람들 곁에 남는다', hint: '대령의 세금을 함께 견딘다. 바다로 나갈 날은 미뤄진다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 2000 }, { op: 'log', text: '부두 창고에서 첫 품삯을 받았다. 기지의 세금 방이 다시 붙자 이웃들과 함께 계산서를 들여다보며 창고 문을 닫았다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 오렌지 마을: 부들 촌장, 먹이 가게와 강아지 슈슈
  {
    id: 'town_orange_dogs', kind: 'door', when: kidIn(ORANGE, 6, 11), weight: 10, repeat: 'once', speaker: 'hero',
    title: '닭장의 구멍', body: '장터의 닭이 자꾸 사라지자 어른들은 떠돌이 개들 짓이라고 했다. 개를 잡아 오는 아이에게는 장터 견습 자리를 준다고 한다. 먹이 가게 할아버지만 개들 편을 든다. 할아버지의 가게 앞에는 강아지 슈슈가 늘 앉아 있다.',
    doors: [
      { label: '닭장의 발자국을 따져 진짜 범인을 찾는다', hint: '족제비 굴을 찾아낸다. 어른들은 아이가 건방지다며 견습 자리를 주지 않는다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'weaselFound' }, { op: 'log', text: '닭장 뒤 족제비 굴을 찾아 어른들에게 보여 주었다. 개들은 풀려났지만 어른들은 {name}이(가) 자신들을 가르치려 든다며 견습 자리를 주지 않았다.', weight: 'light' }] },
      { label: '늙은 떠돌이 개를 창고에 숨겨 먹인다', hint: '제 끼니를 덜어 먹인다. 들키면 개도 {name}도 창고에서 쫓겨난다', values: { justice: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -5 }, { op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'kidDog' }, { op: 'log', text: '몰래 가져온 먹이를 먹은 늙은 개가 창고 구석에서 잠들었다. {name}은(는) 다음 날에도 제 몫을 덜어 문틈으로 밀어 넣었다.', weight: 'light' }],
               else: [{ op: 'log', text: '창고 주인에게 들켰다. 늙은 개는 쫓겨났고 {name}은(는) 그 개를 따라 한참을 걸었다.', weight: 'light' }] }] },
      { label: '개 사냥에 끼어 견습 자리를 얻는다', hint: '개에게 팔을 물린다. 먹이 가게 할아버지가 {name}을(를) 다시는 반기지 않는다', values: { ambition: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'money', add: 2000 }, { op: 'flag', id: 'dogHunter' }, { op: 'log', text: '개에게 물린 팔을 싸맨 채 장터 견습 품삯을 받았다. 먹이 가게 앞을 지나자 할아버지는 슈슈를 안으로 들이고 문을 닫았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'town_orange_scale', kind: 'door', when: kidIn(ORANGE, 9, 14, POOR), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '속인 저울', body: '부모가 품을 파는 생선 절임 공장에서, 주인이 저울추를 바꿔 일꾼들의 몫을 깎아 왔다. 심부름을 갔다가 진짜 무게가 적힌 장부를 손에 넣었다.',
    doors: [
      { label: '장부를 부들 촌장에게 가져간다', hint: '촌장이 공장 주인을 불러 세운다. 그 대신 부모가 공장에서 쫓겨나 집이 더 어려워진다', values: { justice: D },
        fx: [{ op: 'hardship', add: 5 }, { op: 'flag', id: 'exposedScale' }, { op: 'log', text: '부들 촌장이 장부와 저울을 나란히 놓고 공장 주인을 불렀다. 속임수는 드러났지만 부모는 이튿날부터 공장에 들어갈 수 없었다.', weight: 'heavy' }] },
      { label: '장부를 들고 공장 주인을 찾아가 입막음 값을 받는다', hint: '집에 돈이 들어온다. 일꾼들은 여전히 속는다', values: { greed: D }, mark: 'daring',
        fx: [{ op: 'money', add: 6000 }, { op: 'flag', id: 'blackmailer' }, { op: 'log', text: '공장 주인은 돈을 세어 주며 장부를 다시 내놓으라고 했다. 집에는 돈이 들어왔지만 다음 품삯날에도 일꾼들은 바뀐 저울로 생선을 달았다.', weight: 'heavy' }] },
      { label: '장부는 덮어 두고 공장 일을 나눠 맡는다', hint: '부모의 손이 조금 덜 바빠진다. 놀 틈은 사라지고 속임수는 그대로 남는다', values: { inquiry: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '부모 옆에서 생선을 나르고 절임통을 닦았다. 부모의 손은 조금 쉬었지만 저울추는 여전히 주인 쪽으로 기울었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_orange_wall', kind: 'door', when: kidIn(ORANGE, 8, 13, RICH), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '높아진 담장', body: '항구에서 가장 큰 잡화점인 {name}의 집에서, 골목 패거리가 물건을 훔쳐 가는 일이 잦아졌다. 부모는 담장을 높이고 집 밖에 나가지 말라고 했다. 부들 촌장은 담장보다 사람이 먼저라며 혀를 찼다.',
    doors: [
      { label: '밤에 담을 넘어 패거리를 찾아간다', hint: '훔쳐 간 까닭을 듣게 된다. 부모의 믿음을 잃고 용돈이 끊긴다', values: { freedom: D }, mark: 'rebel',
        fx: [{ op: 'money', add: -5000 }, { op: 'person', kind: 'ally', relation: '골목 패거리의 대장' }, { op: 'log', text: '패거리 대장은 배고픈 동생들 이야기를 털어놓았다. {name}은(는) 집에 돌아와 부모의 꾸지람과 끊긴 용돈을 받았지만, 골목에는 다시 찾아갈 사람이 생겼다.', weight: 'light' }] },
      { label: '패거리 대장에게 일대일로 붙는다', hint: '얼굴에 상처가 남는다. 다음 날부터 가게 물건이 사라지지 않는다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'mastery', branch: 'fist', add: 6 }, { op: 'log', text: '대장과 싸우다 얼굴에 상처가 났다. 다음 날부터 가게 물건은 사라지지 않았고, 패거리도 {name}의 담장을 피해 다녔다.', weight: 'light' }] },
      { label: '담장 안에서 가게 장부와 셈을 배운다', hint: '골목 또래들과 멀어진다. 가게의 돈이 어디서 새는지 보이기 시작한다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'shopLedger' }, { op: 'log', text: '장부를 맞추다 물건이 새는 날짜와 거래처를 찾았다. 밖에서 놀던 아이들의 목소리는 담장 너머로만 들렸다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_orange_mast', kind: 'door', when: kidIn(ORANGE, 11, 14), weight: 10, repeat: 'once', speaker: 'hero',
    title: '수평선의 낯선 돛대', body: '오렌지 마을 앞바다에 깃발 없는 배 한 척이 사흘째 떠 있다. 마을 회의는 배를 숨길지 사람들을 옮길지 결론을 내지 못했고, 부들 촌장은 혼자 낡은 갑옷을 꺼내 입었다.',
    doors: [
      { label: '작은 배로 노를 저어 정체를 보러 간다', hint: '가까이 가면 무엇인지 알 수 있다. 저쪽의 화살이 먼저 닿을 수도 있다', values: { inquiry: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'flag', id: 'scoutedShip' }, { op: 'log', text: '밀수꾼의 배였다. 촌장에게 알리자 마을 사람들이 횃불을 들고 해안을 지켰고, 배는 이튿날 떠났다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '갑판에서 날아온 화살이 어깨를 스쳤다. 피를 흘리며 노를 저어 돌아왔다.', weight: 'heavy' }] }] },
      { label: '노인과 어린아이들을 언덕 너머로 옮기는 일을 맡는다', hint: '사흘 밤을 뜬눈으로 새운다. 집안일은 내팽개친다', values: { freedom: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -10 }, { op: 'log', text: '노인과 아이들을 언덕 너머 빈집으로 옮겼다. 사흘 밤을 깨운 끝에 깃발 없는 배가 떠났고, {name}은(는) 그제야 집에 돌아가 쓰러져 잤다.', weight: 'light' }] },
      { label: '부들 촌장 곁에서 망루를 지킨다', hint: '배가 오면 가장 먼저 맞서는 자리다. 촌장이 마을 회의에서 {name}의 이름을 부른다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'boodleTrust' }, { op: 'log', text: '촌장과 함께 망루에서 밤을 새웠다. 배가 물러난 뒤 마을 회의에서 촌장은 낡은 갑옷을 벗으며 {name}의 이름을 불렀다.', weight: 'light' }] },
    ],
  },
  {
    id: 'go_orange', kind: 'door', when: kidIn(ORANGE, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '장터의 열다섯', body: '부들 촌장이 항구 창고를 새로 지을 일꾼을 찾는다. 같은 날 로그타운의 무기점 상인이 짐꾼을 구하러 장터에 왔다. 먹이 가게 할아버지는 기침을 하면서도, 슈슈의 산책을 맡아 줄 사람을 찾는다.',
    doors: [
      { label: '촌장의 창고 짓는 일꾼이 된다', hint: '열여섯을 기다리지 않고 망치를 잡는다. 촌장 밑에서 마을을 짓는 일이 평생의 일이 될지 모른다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'base', key: 'str', add: 1 }, { op: 'flag', id: 'boodleWorker' }, { op: 'log', text: '촌장은 창고 기둥을 세우는 일부터 맡겼다. 첫날 손에 물집이 잡혔지만, 완성된 지붕 아래에는 마을 사람들의 짐이 하나씩 쌓였다.', weight: 'light' }] },
      { label: '무기점 상인을 따라 로그타운으로 간다', hint: '항구 마을을 떠나 처형대가 있는 큰 도시에서 짐을 진다', values: { ambition: D },
        fx: leaveTo('로그타운', '칼 상자를 지고 상인을 따라 배에 올랐다. 오렌지 마을의 지붕들이 수평선 아래로 가라앉았다.', '열다섯에 오렌지 마을을 떠나 로그타운으로 갔다') },
      { label: '장터 잡일로 살며 할아버지와 슈슈 곁에 남는다', hint: '벌이는 보잘것없다. 기침하는 노인의 날들이 조용히 이어진다', values: { peace: D },
        fx: [{ op: 'flag', id: 'shushuWalker' }, { op: 'money', add: -1000 }, { op: 'log', text: '슈슈는 날마다 같은 길로 {name}을(를) 이끌었다. 잡일로 번 돈은 넉넉지 않았지만 기침하는 할아버지가 쉬는 동안 먹이 가게 문을 지킬 수 있었다.', weight: 'light' }] },
    ],
  },
];

/** 여덟 마을의 유년기 */
export const TOWNS: Turning[] = [...TOWNS_1, ...TOWNS_2];
