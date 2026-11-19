// 깃발 아래의 길 (과제 8): 혁명군. 로그타운에서 태어난 사람에게 열린다.
// 들어서는 계기(천룡인의 행차, 짓밟힌 마을, 혁명군의 사람을 만남), 기지의 날들, 잠입, 동지와 임무 사이,
// 정체가 드러남, 무너뜨린 뒤의 나라, 그리고 떠남. 혁명군에도 패도와 야망의 문이 있고, 정의는 해군만의 것이 아니다.
// 망토의 사내(path_rev_dragon)와 전향의 밤(path_rev_turn)은 paths.ts에 있다. 표시 'revSeed'가 코알라의 방문으로 잇는다.
// 다른 처지에서 건너오는 전환점에는 standingYears를 둔다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { age, at, st } from './paths';
import type { Cond, Standing, Turning } from '../../core/types';

const D = V.value.door;
const years = (min: number): Cond => ({ c: 'standingYears', min });
/** 혁명군으로 건너올 수 있는 처지 (닻을 내린 사람 settled는 부르지 않는다) */
const OUTSIDE: Standing[] = ['civil', 'shipwright', 'pirate', 'bountyHunter'];
const rev = st('revolution');

export const REVOLUTION: Turning[] = [
  // ---------------------------------------------------------------- 들어서는 계기
  {
    // v4 cr_rev_seed: 해적만이 아니라 어느 처지에서나. 지켜보던 눈이 코알라의 방문(rev_koala)으로 잇는다
    id: 'rev_noble_parade', kind: 'door', when: at(age(16, 50), st(...OUTSIDE, 'settled'), { c: 'ashore' }),
    weight: 5, repeat: 'once', speaker: { relation: '천룡인' },
    title: '천룡인의 행차', body: '{island}에 천룡인의 배가 들자 거리의 사람들이 일제히 엎드렸다. “저건 내 어부로 한다이. 생선은 사면 된다지만 낚싯대를 들고 서 있는 건 귀엽다이.” 투구에 손가락을 대고 어부를 콕 찍었다. 호위병이 목줄을 꺼냈다. 어부의 맨발 옆에서 갓 낚은 물고기가 펄떡였다.',
    doors: [
      { label: '목줄을 끊고 어부를 군중 속으로 숨긴다', hint: '해군이 거리를 뒤지고, 어딘가에서 누가 지켜본다', values: { justice: D }, danger: true,
        fx: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -12 }, { op: 'fame', add: 10 }, { op: 'flag', id: 'revSeed' },
             { op: 'log', text: '어부는 군중 속으로 사라졌다. 골목 끝에서 망토를 쓴 누군가가 {name}을(를) 오래 바라보았다.', weight: 'heavy' }] },
      { label: '천룡인의 가마에 돌을 던지고 달아난다', hint: '얼굴이 알려지면 평생 쫓긴다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'flag', id: 'govEnemy' }, { op: 'flag', id: 'revSeed' }, { op: 'fame', add: 15 }, { op: 'log', text: '돌이 가마에 부딪치자 {name}은(는) 골목으로 뛰어들었다. 해군은 얼굴을 기억했고, 군중 사이에서 누군가 그 장면을 지켜봤다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '돌은 가마에 맞았고, {name}은(는) 그 자리에서 붙잡혔다.', weight: 'heavy' }] }] },
      { label: '이마를 땅에 대고 끝날 때까지 참는다', hint: '아무 일도 없었고, 그 목줄 소리가 오래 남는다', fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: 3 }, { op: 'log', text: '흙에 이마를 댄 채 목줄이 끌리는 소리를 들었다. 행렬이 지나간 뒤에야 일어났지만, 그 소리는 밤까지 귀에서 떠나지 않았다.', weight: 'light' }] },
    ],
  },
  {
    id: 'rev_burned_village', kind: 'door', when: at(age(16, 45), st('civil', 'shipwright'), years(2)),
    weight: 3, repeat: 'once', speaker: 'hero',
    title: '세금 대신 불', body: '바다 건너 왕국의 병사들이 {island} 근처의 어촌에 들이닥쳤다. 왕에게 바칠 세금을 못 냈다며 집에 불을 놓는다. 해군의 군함은 먼바다에 떠서 지켜보기만 한다.',
    doors: [
      { label: '살아남은 사람들을 이끌고 산으로 숨는다', hint: '가진 것을 나누며 겨울을 난다', values: { romance: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'hardship', add: 4 }, { op: 'person', kind: 'ally', relation: '불탄 마을의 생존자' }, { op: 'flag', id: 'revSeed' }, { op: 'log', text: '살아남은 이들과 산속에 자리를 잡고 남은 식량을 나눴다. 겨울을 함께 버틴 사람 하나가 {name}의 곁에 남았다.', weight: 'light' }] },
      { label: '혁명군을 찾아 바다로 나선다', hint: '지금의 삶을 버리고 세상의 뒤편으로 들어간다', values: { justice: D },
        fx: [{ op: 'standing', to: 'revolution' }, { op: 'log', text: '불탄 마을의 재를 한 줌 쥐고 바다로 나섰다. 석 달 뒤 혁명군의 배에 닿았다.', weight: 'heavy' },
             { op: 'timeline', text: '불탄 마을을 보고 혁명군을 찾아갔다' }] },
      { label: '불을 놓은 병사들의 막사를 밤에 덮친다', hint: '혼자서 갚는다. 수배서에 얼굴이 실린다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 15 }, { op: 'flag', id: 'wanted' }, { op: 'injury', severity: 'light' }, { op: 'log', text: '밤중에 병사들의 막사를 덮쳐 불을 놓은 자들을 쓰러뜨렸다. 상처를 안고 빠져나온 뒤에는 {name}의 얼굴이 수배서에 올랐다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_koala', kind: 'door', when: at(age(17, 40), st(...OUTSIDE), years(2), { c: 'flag', id: 'revSeed', has: true }),
    weight: 6, repeat: 'once', speaker: { canon: 'koala' },
    title: '모자를 쓴 여자', body: '{island}의 허름한 식당에서 모자를 눌러쓴 여자가 {name}의 맞은편에 앉는다. {name}이(가) 세상의 부당한 일에서 눈을 돌리지 않는 사람이라는 이야기를 들었다고, 혁명군에는 그런 사람이 필요하다고 한다.',
    doors: [
      { label: '그녀를 따라 혁명군의 배에 오른다', hint: '지금의 이름과 삶을 뒤에 두고 간다', values: { justice: D },
        fx: [{ op: 'standing', to: 'revolution' }, { op: 'person', kind: 'ally', relation: '혁명군으로 이끈 여자', canon: 'koala' },
             { op: 'timeline', text: '코알라를 따라 혁명군에 들어갔다' }, { op: 'log', text: '코알라가 식당 뒷문으로 {name}을(를) 이끌었다. 부두에서 혁명군의 배에 오르자 익숙한 섬의 불빛이 멀어졌다.', weight: 'heavy' }] },
      { label: '{island}에 남아 소식만 전해 주겠다고 한다', hint: '정보원이 된다. 들키면 함께 끌려간다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'flag', id: 'revInformant' }, { op: 'person', kind: 'ally', relation: '소식을 받아 가는 여자', canon: 'koala' },
             { op: 'chance', p: 0.15, then: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '코알라에게 보낸 쪽지가 해군의 손에 들어갔다. 약속한 장소에 나가자 기다리던 병사들이 {name}에게 수갑을 채웠다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '{name}은(는) 섬에 남아 항구의 움직임을 적은 쪽지를 코알라에게 건넸다. 둘의 연락은 들키지 않은 채 이어졌다.', weight: 'light' }] }] },
      { label: '누구의 깃발 아래에도 들지 않겠다고 한다', hint: '그녀는 웃으며 일어서고, 다시 오지 않는다', values: { freedom: D }, closes: true, fx: [{ op: 'log', text: '코알라는 더 권하지 않고 모자를 고쳐 썼다. 식당을 나선 뒤로 {name} 앞에 다시 나타나지 않았다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 혁명군의 날들
  {
    id: 'rev_base_days', kind: 'door', when: at(rev, age(16, 50)),
    weight: 9, repeat: 'once', speaker: { relation: '기지의 선임' },
    title: '숨은 기지', body: '아무 지도에도 없는 섬의 기지. 노예선에서 풀려난 사람, 나라를 잃은 사람, 해군에서 도망친 사람이 한데 산다. 선임이 {name}에게 무엇부터 배우겠느냐고 묻는다.',
    doors: [
      { label: '어인 사범에게 맨주먹을 배운다', hint: '몇 해 동안 날마다 바닥에 내던져진다', values: { ambition: D },
        fx: [{ op: 'master', name: '어인 가라테 사범', branch: 'fist', cap: 4, years: 4, paid: false },
             { op: 'person', kind: 'ally', relation: '어인 가라테 사범', canon: 'hack' }, { op: 'hp', add: -8 }, { op: 'log', text: '어인 사범은 첫 수업부터 {name}을(를) 바닥에 메쳤다. 아픈 몸으로 다시 일어서자 사범이 다음 동작을 가르쳐 주었다.', weight: 'light' }] },
      { label: '기지의 서고에서 세상의 옛 기록을 읽는다', hint: '눈이 트이지만 몸은 무뎌진다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 2 }, { op: 'base', key: 'str', add: -1 }, { op: 'log', text: '서고의 낡은 기록을 밤새 대조하며 왕국들의 숨긴 역사를 알아냈다. 책상에 머문 만큼 연병장에서는 예전처럼 힘이 나지 않았다.', weight: 'light' }] },
      { label: '노예선에서 구한 아이들의 밥을 짓는다', hint: '싸움에서 멀어지고, 아이들이 {name}을(를) 따른다', values: { justice: D },
        fx: [{ op: 'person', kind: 'ally', relation: '기지에서 키운 아이' }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '밥솥을 비우기가 무섭게 아이들이 그릇을 들고 찾아왔다. 그중 하나는 식사 뒤에도 남아 설거지를 거들었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'rev_palace_servant', kind: 'door', when: at(rev, age(18, 50)),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '궁정의 하인', body: '왕의 곡간에 곡식이 썩어 가는지 확인하려 궁정 하인으로 들어간 지 반년. 어린 공주는 {name}을(를) 하나뿐인 친구로 여긴다. 오늘 밤 봉기의 신호가 오면 성문을 열어야 한다.',
    doors: [
      { label: '예정대로 성문을 연다', hint: '봉기는 성공하고, 공주는 {name}을(를) 다시 보지 않는다', values: { justice: D },
        fx: [{ op: 'fame', add: 25 }, { op: 'hardship', add: 4 }, { op: 'log', text: '성문이 열렸다. 횃불 사이로 공주의 얼굴이 보였다. {name}은(는) 고개를 돌렸다.', weight: 'heavy' }] },
      { label: '성문을 열기 전에 공주를 성 밖으로 빼낸다', hint: '신호가 늦어져 동지들이 다칠 수 있다', values: { justice: D }, danger: true,
        fx: [{ op: 'person', kind: 'ally', relation: '성 밖으로 빼낸 공주' },
             { op: 'chance', p: 0.5, then: [{ op: 'fame', add: 10 }, { op: 'log', text: '공주를 성 밖에 숨긴 뒤 제때 성문으로 돌아왔다. 문이 열리자 동지들이 밀려들었고 공주는 싸움을 피했다.', weight: 'heavy' }], else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 4 }, { op: 'log', text: '공주를 성 밖에 숨기느라 신호가 늦었다. 성문을 열러 돌아왔을 때 동지 여럿이 쓰러져 있었고 {name}도 다쳤다.', weight: 'heavy' }] }] },
      { label: '공주를 볼모로 잡고 왕을 무릎 꿇린다', hint: '피 없이 끝나지만, 공주의 눈에 증오가 남는다', values: { dominion: D },
        fx: [{ op: 'fame', add: 30 }, { op: 'person', kind: 'enemy', relation: '볼모였던 공주' }, { op: 'log', text: '공주를 앞세우자 왕은 호위병들에게 칼을 내리게 했다. 왕이 무릎을 꿇는 동안 공주는 {name}에게서 눈을 떼지 않았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_comrade_or_mission', kind: 'door', when: at(rev, age(18, 55), years(1)),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '붙잡힌 동지', body: '무기고를 날려 버릴 도화선에 막 불을 붙이려는데, 함께 온 동지가 경비병에게 붙잡혔다는 신호가 온다. 돌아가면 도화선은 꺼지고, 이 작전에 두 해가 들었다.',
    doors: [
      { label: '도화선을 버리고 동지를 구하러 간다', hint: '작전은 실패하고, 둘 다 살아 나올지 모른다', values: { loyalty: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'chance', p: 0.55, then: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '목숨을 빚진 동지' }, { op: 'log', text: '도화선을 버리고 경비병 사이로 뛰어들어 동지를 끌어냈다. {name}은(는) 부상을 입었지만 둘은 살아 돌아왔다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '동지에게 닿기도 전에 둘 다 붙잡혔다.', weight: 'heavy' }] }] },
      { label: '도화선에 불을 붙인다', hint: '무기고는 날아가고, 동지는 돌아오지 않는다', values: { justice: D },
        fx: [{ op: 'fame', add: 25 }, { op: 'hardship', add: 6 }, { op: 'timeline', text: '동지를 두고 무기고를 날려 버렸다' }, { op: 'log', text: '도화선에 불을 붙인 뒤 무기고가 터지는 것을 보았다. 작전은 성공했지만 붙잡힌 동지는 끝내 돌아오지 않았다.', weight: 'heavy' }] },
      { label: '경비대장을 붙잡아 동지와 맞바꾼다', hint: '둘 다 살리려면 더 큰 판을 벌여야 한다', special: 'dominion', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 30 }, { op: 'person', kind: 'ally', relation: '맞바꿔 구한 동지' }, { op: 'log', text: '경비대장을 붙잡는 동안 칼에 베였지만 교환 장소까지 끌고 갔다. 동지가 풀려나자 둘은 함께 추격을 피해 달아났다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_field_medic', kind: 'door', when: at(rev, age(17, 60)),
    weight: 5, repeat: 'once', speaker: { relation: '퇴각을 명하는 지휘관' },
    title: '퇴각 명령', body: '봉기가 무너졌다. 지휘관이 해 뜨기 전에 배로 물러나라고 명한다. 헛간에는 걸을 수 없는 부상자 열둘이 누워 있고, 왕국의 병사들이 아침이면 들이닥친다.',
    doors: [
      { label: '헛간에 남아 부상자들의 상처를 꿰맨다', hint: '병사들이 오면 함께 붙잡힌다', values: { peace: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'person', kind: 'ally', relation: '헛간에서 살린 부상자' }, { op: 'log', text: '병사들은 헛간을 그냥 지나쳤다. 열둘 가운데 아홉이 살았다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '피 묻은 손 그대로 붙잡혀 끌려갔다.', weight: 'heavy' }] }] },
      { label: '명령대로 배로 물러난다', hint: '살아서 다음 싸움을 하고, 헛간의 일은 듣지 않는다', values: { loyalty: D },
        fx: [{ op: 'hardship', add: 5 }, { op: 'log', text: '지휘관의 명령대로 해 뜨기 전에 배에 올랐다. 헛간의 부상자들은 데려오지 못했고, 배가 멀어질 때까지 뒤를 돌아봤다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_leaflets', kind: 'door', when: at(rev, age(17, 60)),
    weight: 4, repeat: 'once', speaker: { relation: '늙은 인쇄공' },
    title: '밤의 인쇄기', body: '혁명군의 전단을 찍는 늙은 인쇄공이 {name}에게 글을 맡긴다. 왕이 곡식을 숨긴 증거는 반쯤밖에 모이지 않았다. 내일 아침이면 이 전단이 온 도시의 벽에 붙는다.',
    doors: [
      { label: '확인한 것만 적는다', hint: '사람들은 반신반의하고, 거짓으로 몰릴 틈은 없다', values: { inquiry: D },
        fx: [{ op: 'fame', add: 5 }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '확인된 장부의 내용만 전단에 적었다. 아침에 벽 앞에 모인 사람들은 고개를 갸웃했지만 적힌 사실을 반박하지는 못했다.', weight: 'light' }] },
      { label: '사람들이 끓어오를 이야기를 보탠다', hint: '도시가 들고일어나고, 거짓이 드러나면 혁명군의 말이 힘을 잃는다', values: { dominion: D },
        fx: [{ op: 'fame', add: 20 }, { op: 'chance', p: 0.3, then: [{ op: 'fame', add: -15 }, { op: 'hardship', add: 3 }, { op: 'log', text: '전단의 거짓이 드러나자 사람들은 혁명군의 말까지 의심했다. 인쇄공은 다음 종이를 앞에 두고 침묵했다.', weight: 'heavy' }], else: [{ op: 'log', text: '전단이 붙은 아침, 거리마다 곡식 창고의 문을 열라는 외침이 번졌다.', weight: 'light' }] }] },
      { label: '인쇄공 대신 붙잡혀 간다', hint: '인쇄기는 살아남고 {name}은(는) 갇힌다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '병사들이 문을 부수기 전에 {name}이(가) 먼저 걸어 나가 손을 내밀었다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_slave_ship', kind: 'door', when: at(rev, age(17, 60)),
    weight: 5, repeat: { years: 4 }, max: 2, speaker: 'hero',
    title: '노예선의 밑창', body: '혁명군이 덮친 노예선의 밑창에서 사슬에 묶인 사람들이 빛을 보고 눈을 가린다. 노예상 선장은 갑판에 무릎을 꿇었다.',
    doors: [
      { label: '배를 돌려 풀려난 사람들을 저마다의 고향에 내려 준다', hint: '몇 달이 걸리고 기지의 보급을 축낸다', values: { freedom: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'fame', add: 5 }, { op: 'log', text: '마지막 사람이 제 고향 부두에 내리며 사슬 자국이 남은 손을 흔들었다.', weight: 'light' }] },
      { label: '싸울 수 있는 자들을 혁명군으로 받아들인다', hint: '세력이 커지고, 혁명군의 이름이 더 무거워진다', values: { ambition: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'person', kind: 'ally', relation: '노예선에서 데려온 전사' }, { op: 'log', text: '풀려난 사람들 가운데 싸우겠다는 이들이 혁명군의 배에 올랐다. 한 사람이 동료들을 이끌어 {name}에게 손을 내밀었다.', weight: 'light' }] },
      { label: '노예상 선장을 해군 지부 앞에 묶어 둔다', hint: '해군이 제 법으로 다스리게 하고, 그 지부가 노예상과 한패면 헛일이다', values: { justice: D },
        fx: [{ op: 'fame', add: 8 }, { op: 'chance', p: 0.4, then: [{ op: 'hardship', add: 2 }, { op: 'log', text: '노예상을 묶어 지부 앞에 두었지만 사흘 뒤 뒷문으로 풀려났다는 소식이 왔다. {name}은(는) 지부와 노예상의 관계를 의심했다.', weight: 'heavy' }],
          else: [{ op: 'log', text: '노예상을 묶어 지부 앞에 두자 해군이 그를 끌고 들어갔다. 풀려난 사람들은 노예선에서 내려 각자의 길을 찾았다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'rev_grain_ship', kind: 'door', when: at(rev, age(18, 60)),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '곡식을 실은 군함', body: '굶는 왕국의 왕에게 곡식을 실어 나르는 해군 보급선. 그 곡식은 왕의 곳간으로만 간다. 갑판에는 이제 막 입대한 듯한 앳된 수병들이 보초를 선다.',
    doors: [
      { label: '수병들을 묶어만 두고 곡식을 마을들에 나눈다', hint: '굶는 사람들이 한 철을 나고, 해군은 혁명군의 이름을 더 높이 건다', values: { romance: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'hp', add: -8 }, { op: 'log', text: '곡식 자루가 밤새 마을에서 마을로 넘어갔다.', weight: 'light' }] },
      { label: '보급선을 통째로 가라앉혀 본때를 보인다', hint: '바다의 모든 보급선이 떨고, 수병들도 바다에 빠진다', values: { dominion: D },
        fx: [{ op: 'fame', add: 30 }, { op: 'hardship', add: 5 }, { op: 'flag', id: 'govEnemy' }, { op: 'log', text: '보급선이 가라앉자 앳된 수병들이 바다에 뛰어들었다. 정부가 {name}을(를) 적으로 지목했고, 굶는 마을에 보낼 곡식도 함께 사라졌다.', weight: 'heavy' }] },
      { label: '곡식을 팔아 혁명군의 무기를 산다', hint: '다음 싸움은 든든하지만, 오늘 굶는 사람은 그대로 굶는다', values: { ambition: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'hardship', add: 2 }, { op: 'log', text: '곡식을 팔아 받은 돈으로 무기를 들여왔다. 창고가 채워지는 동안 마을 사람들은 빈 그릇을 들고 배가 지나간 자리를 바라봤다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_old_friend', kind: 'door', when: at(rev, age(20, 55), years(2)),
    weight: 4, repeat: 'once', speaker: { relation: '해군이 된 어릴 적 동무' },
    title: '쫓아온 얼굴', body: '{name}을(를) 막아선 해군 장교는 {town}에서 함께 자란 동무다. 동무는 칼을 뽑지 않은 채, 지금 항복하면 목숨만은 지켜 주겠다고 한다.',
    doors: [
      { label: '어릴 적 바닷가의 약속을 꺼내 함께 가자고 한다', hint: '동무가 흔들릴 수도, 부하들을 부를 수도 있다', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.35, then: [{ op: 'person', kind: 'ally', relation: '제복을 버린 옛 동무' }, { op: 'log', text: '동무는 한참 말이 없다가, 제복의 단추를 하나씩 풀었다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'flag', id: 'wanted' }, { op: 'person', kind: 'rival', relation: '해군이 된 옛 동무' }, { op: 'log', text: '옛 약속을 꺼내자 동무는 부하들을 불렀다. 칼을 피하며 달아난 {name}의 이름이 수배 명단에 올랐고, 둘의 승부는 끝나지 않았다.', weight: 'heavy' }] }] },
      { label: '동무를 쓰러뜨리고 달아난다', hint: '빠져나가지만, 다시는 {town}의 동무로 돌아가지 못한다', values: { freedom: D },
        fx: [{ op: 'hp', add: -12 }, { op: 'person', kind: 'enemy', relation: '등을 맞은 옛 동무' }, { op: 'log', text: '동무를 쓰러뜨리고 추격을 피해 달아났다. {name}도 상처를 입었고, 돌아본 동무의 눈에는 어릴 적의 정이 남지 않았다.', weight: 'heavy' }] },
      { label: '동무의 공이 되도록 손을 내민다', hint: '동무는 진급하고 {name}은(는) 갇힌다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '두 손을 내밀었다. 수갑을 채우는 동무의 손이 떨렸다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_forbidden_page', kind: 'door', when: at(rev, age(20, 65)),
    weight: 3, repeat: 'once', speaker: { relation: '정보국의 선임' },
    title: '금지된 종잇조각', body: '정부의 문서 창고를 턴 동지들이 낡은 종잇조각 하나를 가져왔다. 세상이 지운 백 년에 관한 것이라고 한다. 이것을 지닌 사실만으로 정부는 섬 하나를 지운다.',
    doors: [
      { label: '밤마다 해독에 매달린다', hint: '세상의 밑바닥을 들여다보고, 정부의 눈길을 산다', values: { inquiry: D },
        fx: [{ op: 'flag', id: 'readForbidden' }, { op: 'base', key: 'int', add: 2 }, { op: 'flag', id: 'govEnemy' }, { op: 'log', text: '밤마다 종잇조각의 글자를 맞춰 지워진 백 년의 단서를 읽어 냈다. 정부의 추적이 기지까지 닿자 문서를 숨기고 거처를 옮겼다.', weight: 'heavy' }] },
      { label: '사령부에 그대로 올려 보낸다', hint: '맡은 일만 한다. 무엇이 적혔는지는 끝내 모른다', values: { loyalty: D },
        fx: [{ op: 'fame', add: 5 }, { op: 'log', text: '종잇조각을 봉투에 넣어 사령부로 보냈다. 내용은 들여다보지 않았고, 선임은 전달을 마친 {name}의 이름을 보고서에 적었다.', weight: 'light' }] },
      { label: '종잇조각을 불태운다', hint: '아무도 지워지지 않고, 아무것도 알 수 없게 된다', mark: 'composure',
        fx: [{ op: 'hardship', add: 1 }, { op: 'log', text: '종잇조각을 불에 넣고 마지막 글자가 사라질 때까지 지켜봤다. 기지 사람들은 당장의 추적을 피했지만, 그 안의 이야기도 함께 사라졌다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_exposed', kind: 'door', when: at(rev, age(20, 65), years(3)),
    weight: 4, repeat: 'once', speaker: { relation: '이웃 사람' },
    title: '벽보의 얼굴', body: '몇 해를 숨어 산 {island}에서 이웃이 수배서 한 장을 들고 찾아왔다. 그림 속 얼굴이 {name}과(와) 꼭 닮았다. 이웃은 문을 등지고 서서 대답을 기다린다.',
    doors: [
      { label: '이웃을 믿고 모두 털어놓는다', hint: '비밀을 지켜 줄 사람이 생기거나, 해군이 온다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'person', kind: 'ally', relation: '비밀을 지켜 준 이웃' }, { op: 'log', text: '사정을 들은 이웃이 수배서를 접어 품에 넣었다. 며칠 뒤 해군이 골목을 뒤질 때도 {name}의 집 쪽은 가리키지 않았다.', weight: 'light' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '사흘 뒤 해군이 문을 두드렸다. 이웃은 끝내 얼굴을 내밀지 않았다.', weight: 'heavy' }] }] },
      { label: '그날 밤 살림을 버리고 섬을 떠난다', hint: '아무도 다치지 않고, 몇 해 일군 것이 사라진다', values: { freedom: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'hardship', add: 3 }, { op: 'flag', id: 'wanted' }, { op: 'log', text: '그날 밤 살림을 두고 배에 올랐다. 수배서는 섬에 남았고, 몇 해 모은 돈과 익숙한 이웃을 뒤로해야 했다.', weight: 'heavy' }] },
      { label: '입을 열면 어떻게 되는지 조용히 일러 둔다', hint: '이웃은 입을 다물고, 다시는 {name}의 집 앞을 지나지 않는다', values: { dominion: D },
        fx: [{ op: 'person', kind: 'enemy', relation: '겁에 질린 이웃' }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '입을 열면 어떻게 되는지 낮게 말하자 이웃은 수배서를 움켜쥐고 물러섰다. 그 뒤로는 {name}의 집 앞을 피해 다녔다.', weight: 'heavy' }] },
    ],
  },

  // ---------------------------------------------------------------- 무너뜨린 뒤, 그리고 떠남
  {
    id: 'rev_after_king', kind: 'door', when: at(rev, age(24, 65), years(3)),
    weight: 4, repeat: 'once', speaker: { relation: '광장의 사람들' },
    title: '빈 왕좌', body: '왕은 바다 건너로 달아났다. 광장에 모인 사람들이 봉기를 이끈 {name}의 이름을 외치며, 비어 있는 왕좌에 앉으라고 한다.',
    doors: [
      { label: '왕좌를 치우고 사람들이 대표를 뽑게 한다', hint: '느리고 시끄러운 나라가 시작되고, {name}은(는) 다음 나라로 간다', values: { justice: D },
        fx: [{ op: 'fame', add: 20 }, { op: 'timeline', text: '무너뜨린 나라의 왕좌를 치웠다' }, { op: 'log', text: '광장에서 왕좌를 치우자 사람들은 저마다 대표의 이름을 외치기 시작했다. {name}은(는) 그 논쟁을 남겨 두고 다음 나라로 향했다.', weight: 'heavy' }] },
      { label: '왕좌에 앉는다', hint: '혁명을 이끈 손이 이제 나라를 쥔다. 혁명군은 그 이름을 지운다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'flag', id: 'ruler' }, { op: 'fame', add: 50 },
             { op: 'timeline', text: '무너뜨린 나라의 왕좌에 앉았다' }, { op: 'log', text: '사람들이 보는 앞에서 왕좌에 앉았다. 혁명군은 {name}의 이름을 명단에서 지웠고, 이제 이 나라의 명령은 {name}에게서 나왔다.', weight: 'heavy' }] },
      { label: '이 나라에 남아 밭을 간다', hint: '싸움을 내려놓고 이름 없는 사람으로 산다', values: { peace: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'log', text: '혁명의 깃발을 접어 두고 쟁기를 잡았다. 이웃들은 {name}이(가) 누구였는지 묻지 않았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'rev_leave', kind: 'door', when: at(rev, age(25, 65), years(5)),
    weight: 3, repeat: 'once', speaker: 'hero',
    title: '끝나지 않는 싸움', body: '혁명군이 된 지 여러 해. 왕국 하나를 무너뜨리면 다른 왕국이 굶긴다. 거울 속의 얼굴에 흉터가 늘었고, 기지의 아이들은 어느새 총을 든다.',
    doors: [
      { label: '총을 내려놓고 뭍의 조용한 마을로 간다', hint: '싸움에서 물러나지만, 정부의 명단에서는 지워지지 않는다', values: { peace: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'flag', id: 'wanted' }, { op: 'timeline', text: '혁명군을 떠나 뭍에 자리 잡았다' }, { op: 'log', text: '총을 기지에 두고 뭍의 마을로 옮겼다. 조용히 집을 구했지만 정부의 수배 명단에는 여전히 {name}의 이름이 남았다.', weight: 'heavy' }] },
      { label: '어느 깃발에도 매이지 않는 해적이 된다', hint: '세상을 바꾸는 대신 제 바다를 산다', values: { freedom: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'flag', id: 'captain' }, { op: 'flag', id: 'ship' }, { op: 'timeline', text: '혁명군을 떠나 해적 깃발을 올렸다' }, { op: 'log', text: '기지의 깃발을 접고 제 배의 돛대에 새 해적기를 올렸다. {name}은(는) 선장 자리에 서서 첫 항로를 직접 정했다.', weight: 'heavy' }] },
      { label: '아이들이 총을 들지 않아도 될 때까지 남는다', hint: '더 깊은 싸움으로 들어간다. 몸이 먼저 지친다', values: { inquiry: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 15 }, { op: 'log', text: '총을 든 기지의 아이들을 보고 {name}은(는) 다시 임무 명단에 이름을 적었다. 다음 작전을 마치고 돌아왔을 때는 몸을 가눌 힘도 남지 않았다.', weight: 'heavy' }] },
    ],
  },
];
