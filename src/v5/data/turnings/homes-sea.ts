// 고향마다 바다로 나가는 길과 돌아오는 길 (4단계 과제 3, 설계 5.1).
// 로그타운(이스트 블루)의 길은 sea.ts에 있다. 여기는 나머지 다섯 고향이다.
// - 워터 세븐: 바다 열차와 조선소의 도시라 길이 넓다.
// - 와노쿠니: 쇄국. 열여덟 살이 넘어야, 드물게 열린다.
// - 어인섬: 지상으로 가는 문이 좁다. 나가면 차별이 시련으로 쌓인다.
// - 하늘섬: 청해로 내려가는 것 자체가 큰 일이다.
// - 조우: 고립된 섬. 바다로 나갈 계기가 있어야 한다.
// 고향으로 돌아가는 일은 moveHome이다 (태어난 마을, 고향의 바다).
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { HOMETOWNS } from '../../../data/births';
import { age, home, sea, st } from './paths';
import type { Cond, HomeId, Turning } from '../../core/types';

const D = V.value.door;
const townsOf = (id: HomeId) => HOMETOWNS.filter((t) => t.home === id).map((t) => t.name);
/** 그 고향에서 태어나 지금도 고향의 마을에 있다 */
const atHome = (id: HomeId, ...more: Cond[]): Cond[] => [home(id), { c: 'island', is: townsOf(id) }, ...more];
/** 그 고향에서 태어나 지금은 고향을 떠나 있다 */
const away = (id: HomeId, ...more: Cond[]): Cond[] => [home(id), { c: 'island', is: townsOf(id), not: true }, ...more];
/** 아직 뭍의 삶을 사는 사람 (떠나는 길을 받는 처지) */
const LANDED = st('child', 'civil', 'shipwright', 'settled');
const ROAMING = st('civil', 'shipwright', 'settled', 'pirate', 'marine', 'revolution', 'bountyHunter', 'cp', 'warlord');
const settledIn = { c: 'standingYears', min: 1 } as const;

export const HOMES_LEAVE: Turning[] = [
  // ---------------------------------------------------------------- 워터 세븐
  {
    id: 'w7_sea_train', kind: 'door', when: atHome('water7', age(15, 40), LANDED), weight: 4, repeat: 'once', speaker: { relation: '바다 열차의 기관사' },
    title: '바다 열차의 화부', body: '바다 위 선로를 달리는 열차의 기관사가 석탄을 퍼 넣을 젊은 화부를 구한다. 마지막 역에서는 먼 섬으로 가는 상선이 기다린다고 한다.',
    doors: [
      { label: '화부가 되어 마지막 역까지 가고, 거기서 상선에 오른다', hint: '물의 도시를 떠난다. 돌아오는 표는 없다', values: { romance: D },
        fx: [{ op: 'move', island: '자야', sea: 'gl_first' }, { op: 'base', key: 'vit', add: 1 },
             { op: 'log', text: '석탄 먼지를 뒤집어쓴 채 마지막 역에 내렸다. 상선은 거짓말쟁이들의 섬이라는 자야로 갔다.', weight: 'heavy' },
             { op: 'timeline', text: '바다 열차를 타고 물의 도시를 떠났다' }] },
      { label: '한 철만 화부로 일하고 돌아온다', hint: '석탄 삽에 손바닥이 갈라진다. 품삯이 넉넉하다', values: { ambition: D },
        fx: [{ op: 'money', add: 15000 }, { op: 'hp', add: -5 }] },
      { label: '물의 도시에 남는다', hint: '선로 끝은 꿈으로만 둔다', closes: true, fx: [] },
    ],
  },
  {
    id: 'w7_galley_ship', kind: 'door', when: atHome('water7', age(17, 45), LANDED), weight: 3, repeat: 'once', speaker: { relation: '조선소의 직공장' },
    title: '새 배의 첫 항해', body: '조선소에서 갓 내린 상선이 샤본디까지 첫 항해를 한다. 직공장은 배를 아는 사람이 하나쯤 타야 한다며 {name}을(를) 본다.',
    doors: [
      { label: '배에 올라 샤본디까지 간다', hint: '제 손이 닿은 배와 함께 바다를 건넌다', values: { loyalty: D },
        fx: [{ op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'base', key: 'int', add: 1 },
             { op: 'log', text: '첫 항해는 무사했다. 비눗방울이 떠다니는 섬에서 배를 넘겨주었다.', weight: 'heavy' },
             { op: 'timeline', text: '조선소의 새 배를 타고 샤본디 제도에 갔다' }] },
      { label: '그 배를 통째로 사서 깃발을 올린다', hint: '가진 돈을 다 쓴다. 오늘부터 쫓기는 몸이 된다', values: { freedom: D }, when: [{ c: 'money', min: 100000 }, settledIn],
        fx: [{ op: 'money', add: -100000 }, { op: 'standing', to: 'pirate' }, { op: 'flag', id: 'captain' }, { op: 'flag', id: 'ship' },
             { op: 'move', island: '알라바스타 왕국', sea: 'gl_first' }, { op: 'log', text: '갓 지은 배에 해골 깃발을 올렸다. 직공장이 혀를 찼다.', weight: 'heavy' },
             { op: 'timeline', text: '물의 도시에서 산 배로 해적이 되었다' }] },
      { label: '도크에 남아 다음 배를 짓는다', hint: '배는 떠나도 목수는 남는다', closes: true, fx: [{ op: 'money', add: 8000 }] },
    ],
  },
  {
    id: 'w7_aqua_laguna', kind: 'door', when: atHome('water7', age(12, 60), st('child', 'civil', 'shipwright', 'settled', 'retired')), weight: 3, repeat: 'once', speaker: 'hero',
    title: '아쿠아 라구나', body: '해마다 오는 큰 해일이 올해는 유난히 높다. 물길 아래 거리까지 바닷물이 차오르는데, 부두의 작은 배에 아이 둘이 갇혀 있다.',
    doors: [
      { label: '작은 배로 뛰어들어 아이들을 끌어낸다', hint: '물살에 배째 휩쓸릴지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5,
          then: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '해일에서 건진 아이', age: { younger: 10 } }, { op: 'log', text: '아이 둘을 안고 계단 위로 기어올랐다.', weight: 'heavy' }],
          else: [{ op: 'hp', add: -30 }, { op: 'move', island: '자야', sea: 'gl_first' },
                 { op: 'log', text: '아이들을 계단에 밀어 올린 순간 물살이 배를 삼켰다. 사흘을 떠다니다 낯선 섬의 모래밭에 닿았다.', weight: 'heavy' },
                 { op: 'timeline', text: '아쿠아 라구나에 휩쓸려 고향을 떠났다' }] }] },
      { label: '높은 곳으로 사람들을 이끈다', hint: '배의 아이들은 다른 사람이 맡는다', values: { justice: D }, fx: [{ op: 'fame', add: 3 }] },
    ],
  },
  // ---------------------------------------------------------------- 와노쿠니 (쇄국: 열여덟 이후)
  {
    id: 'wano_waterfall', kind: 'door', when: atHome('wano', age(18, 45), LANDED), weight: 2, repeat: 'once', speaker: 'hero',
    title: '폭포 아래의 바다', body: '나라를 두른 폭포 위에서 내려다보면 바깥 바다가 끝없이 펼쳐져 있다. 폭포를 거슬러 오르는 큰 잉어 떼가 오늘은 거꾸로 아래로 내려간다.',
    doors: [
      { label: '잉어의 등에 매달려 폭포 아래로 내려간다', hint: '살아서 바닥에 닿을지 모른다. 닿으면 나라 밖이다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'move', island: '드레스로자', sea: 'nw_first' },
             { op: 'log', text: '물보라 속으로 떨어졌다. 눈을 뜨니 바깥 상선의 갑판이었고, 배는 사랑과 정열의 나라로 간다고 했다.', weight: 'heavy' },
             { op: 'timeline', text: '폭포를 내려가 나라 밖으로 나갔다' }] },
      { label: '폭포 위에서 바깥 바다를 그림으로 남긴다', hint: '나라를 떠나지 않는다. 그림은 몰래 숨긴다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '나라를 버리지 않는다', hint: '돌아서서 마을로 내려간다', closes: true, values: { loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'wano_smuggler', kind: 'door', when: atHome('wano', age(18, 40), LANDED), weight: 2, repeat: 'once', speaker: { relation: '바깥 무기상의 선원' },
    title: '밤바다의 밀수선', body: '쇼군의 항구에 밤마다 바깥 무기상의 배가 들어온다. 짐을 내리는 선원 하나가, 빈 궤짝 하나쯤 사람 하나 숨기기에 넉넉하다고 웃는다.',
    doors: [
      { label: '빈 궤짝에 숨어 밀수선에 오른다', hint: '들키면 끝이다. 안 들키면 나라 밖이다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.65,
          then: [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'log', text: '궤짝 틈으로 바깥 항구의 불빛이 들어왔다. 나라 밖이었다.', weight: 'heavy' },
                 { op: 'timeline', text: '밀수선에 숨어 나라 밖으로 나갔다' }],
          else: [{ op: 'standing', to: 'prisoner' }, { op: 'hardship', add: 4 }, { op: 'log', text: '궤짝 뚜껑이 열렸다. 관리들이 기다리고 있었다.', weight: 'heavy' },
                 { op: 'timeline', text: '밀항하려다 붙잡혔다' }] }] },
      { label: '관리에게 밀수선을 알린다', hint: '상을 받는다. 바깥 선원은 다시 오지 않는다', values: { justice: D }, fx: [{ op: 'money', add: 10000 }, { op: 'person', kind: 'enemy', relation: '밀수선의 선원' }] },
      { label: '못 본 척한다', hint: '항구의 밤은 늘 그렇다', closes: true, fx: [] },
    ],
  },
  {
    id: 'wano_retainers', kind: 'door', when: atHome('wano', age(18, 50), LANDED, { c: 'lineage', is: ['samurai', 'commoner'] }), weight: 2, repeat: 'once', speaker: { relation: '쫓기는 낭인' },
    title: '쫓기는 가신들', body: '옛 영주를 섬기던 낭인들이 관리에게 쫓긴다. 바깥 바다의 나라로 몸을 숨길 거라며, 노를 저을 사람이 하나 모자란다고 한다.',
    doors: [
      { label: '노를 잡고 낭인들과 바다로 나간다', hint: '나라에서는 역적이 된다', values: { loyalty: D },
        fx: [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'person', kind: 'ally', relation: '바다로 함께 달아난 낭인' }, { op: 'hardship', add: 2 },
             { op: 'log', text: '밤바다를 사흘 저었다. 낭인들은 바깥 나라의 항구에서 흩어졌다.', weight: 'heavy' },
             { op: 'timeline', text: '쫓기는 낭인들과 나라를 떠났다' }] },
      { label: '배를 대 주고 집으로 돌아간다', hint: '함께 가지는 않는다. 들키면 같이 벌을 받는다', values: { loyalty: D }, fx: [{ op: 'chance', p: 0.3, then: [{ op: 'hardship', add: 2 }, { op: 'hp', add: -10 }] }] },
      { label: '관리에게 숨은 곳을 알린다', hint: '상을 받는다. 낭인들의 칼끝이 언젠가 돌아온다', values: { greed: D },
        fx: [{ op: 'money', add: 20000 }, { op: 'person', kind: 'enemy', relation: '고발당한 낭인' }] },
    ],
  },
  // ---------------------------------------------------------------- 어인섬 (지상으로 가는 문이 좁다)
  {
    id: 'fm_coating', kind: 'door', when: atHome('fishman', age(16, 45), LANDED), weight: 2, repeat: 'once', speaker: { relation: '코팅 장인' },
    title: '거품 옷을 입힌 배', body: '지상으로 오르는 배에 거품 옷을 입히는 장인이 값을 부른다. 지상 사람들이 어인을 어떻게 보는지는 섬의 누구나 안다.',
    doors: [
      { label: '값을 치르고 지상으로 오른다', hint: '샤본디에 닿는다. 그곳의 눈길을 견뎌야 한다', values: { romance: D }, when: [{ c: 'money', min: 20000 }],
        fx: [{ op: 'money', add: -20000 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'hardship', add: 3 },
             { op: 'log', text: '해수면을 뚫고 올라가 처음으로 하늘을 봤다. 항구의 사람들이 손가락질했다.', weight: 'heavy' },
             { op: 'timeline', text: '거품 옷을 입힌 배로 지상에 올랐다' }] },
      { label: '장인의 일을 거들며 코팅을 배운다', hint: '섬에 남는다. 언젠가 제 배를 띄울 수 있다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '지상은 바라보지 않는다', hint: '섬 밖의 차별을 알기에 남는다', closes: true, fx: [] },
    ],
  },
  {
    id: 'fm_slaver', kind: 'door', when: atHome('fishman', age(13, 30), st('child', 'civil', 'settled')), weight: 2, repeat: 'once', speaker: 'hero',
    title: '바다의 숲의 그물', body: '바다의 숲에서 놀던 아이들 위로 커다란 그물이 내려왔다. 지상의 노예상이다. {name}의 발목에도 그물코가 감긴다.',
    doors: [
      { label: '그물을 물어뜯고 아이들부터 빼낸다', hint: '아이들은 달아난다. {name}은(는) 끌려갈지 모른다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5,
          then: [{ op: 'hp', add: -15 }, { op: 'log', text: '그물이 찢어졌다. 아이들과 함께 산호 틈으로 숨었다.', weight: 'heavy' }],
          else: [{ op: 'hp', add: -20 }, { op: 'hardship', add: 6 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
                 { op: 'log', text: '아이들은 달아났다. {name}은(는) 물통에 갇혀 지상으로 끌려 올라갔다. 경매장 뒤뜰의 소동 틈에야 물통이 깨졌다.', weight: 'heavy' },
                 { op: 'timeline', text: '노예상에게 붙잡혀 지상으로 끌려갔다' }] }] },
      { label: '그물째 노예상의 배를 끌어당긴다', hint: '힘으로 배를 뒤집는다. 놓치면 함께 끌려간다', values: { dominion: D }, danger: true,
        fx: [{ op: 'chance', p: 0.55,
          then: [{ op: 'base', key: 'str', add: 1 }, { op: 'fame', add: 3 }, { op: 'log', text: '노예상의 배가 뒤집혔다. 숲에 다시는 그물이 내려오지 않았다.', weight: 'heavy' }],
          else: [{ op: 'hp', add: -25 }, { op: 'hardship', add: 6 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
                 { op: 'timeline', text: '노예상에게 붙잡혀 지상으로 끌려갔다' }] }] },
    ],
  },
  {
    id: 'fm_sun_flag', kind: 'door', when: atHome('fishman', age(17, 40), LANDED, settledIn), weight: 2, repeat: 'once', speaker: { relation: '태양 깃발의 어인 선원' },
    title: '태양을 단 깃발', body: '노예의 낙인을 덮으려고 태양을 그려 넣은 깃발의 어인 해적선이 어인가에 닿았다. 선원이 지상으로 함께 가자고 한다.',
    doors: [
      { label: '태양 깃발 아래 지상으로 오른다', hint: '해적이 된다. 차별과 맞서는 배다', values: { justice: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'person', kind: 'ally', relation: '태양 깃발의 선원' }, { op: 'hardship', add: 2 },
             { op: 'log', text: '태양 깃발이 해수면을 뚫고 올라갔다.', weight: 'heavy' }, { op: 'timeline', text: '태양 깃발의 해적선에 올랐다' }] },
      { label: '지상에 원한을 갚으러 간다', hint: '해적이 된다. 사람을 미워하는 배를 고른다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'pirate' }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'hardship', add: 2 }, { op: 'timeline', text: '사람에게 원한을 품고 해적이 되었다' }] },
      { label: '섬에 남는다', hint: '깃발이 떠나는 것을 지켜본다', closes: true, fx: [] },
    ],
  },
  // ---------------------------------------------------------------- 하늘섬 (청해로 내려가는 것이 큰 일이다)
  {
    id: 'sky_edge', kind: 'door', when: atHome('sky', age(12, 45), st('child', 'civil', 'settled')), weight: 3, repeat: 'once', speaker: 'hero',
    title: '구름의 끝', body: '구름 바다의 가장자리에 버려진 웨이버 한 척이 걸려 있다. 그 아래는 아무도 돌아온 적 없는 청해다.',
    doors: [
      { label: '웨이버를 타고 구름 아래로 내려간다', hint: '떨어질지 내려갈지 모른다. 어느 쪽이든 하늘섬을 떠난다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'move', island: '자야', sea: 'gl_first' },
             { op: 'log', text: '구름을 뚫고 한참을 떨어졌다. 바다는 파랗고 무겁고 짰다.', weight: 'heavy' },
             { op: 'timeline', text: '구름 아래 청해로 내려갔다' }] },
      { label: '웨이버를 끌어 와 고쳐 탄다', hint: '구름 바다를 누비는 솜씨가 는다. 내려가지는 않는다', values: { freedom: D }, fx: [{ op: 'base', key: 'spd', add: 1 }] },
      { label: '구름 끝에 다가가지 않는다', hint: '아래는 어른들 말대로 무서운 곳이다', closes: true, fx: [] },
    ],
  },
  {
    id: 'sky_blue_sea_ship', kind: 'door', when: atHome('sky', age(16, 45), LANDED), weight: 2, repeat: 'once', speaker: { relation: '청해에서 올라온 선장' },
    title: '청해에서 올라온 배', body: '바닷물을 거꾸로 솟구치는 물기둥을 타고 청해의 배가 올라왔다. 선장은 내려갈 때 구름 바다를 아는 길잡이가 필요하다고 한다.',
    doors: [
      { label: '길잡이가 되어 함께 내려간다', hint: '하늘섬을 떠난다. 청해의 해적들과 섞여 산다', values: { romance: D },
        fx: [{ op: 'move', island: '자야', sea: 'gl_first' }, { op: 'person', kind: 'ally', relation: '청해에서 올라온 선장' },
             { op: 'log', text: '구름 바다를 빠져나와 청해의 거친 파도를 처음 탔다.', weight: 'heavy' }, { op: 'timeline', text: '청해의 배를 따라 하늘섬을 떠났다' }] },
      { label: '청해의 금붙이를 받고 길만 알려 준다', hint: '돈을 받는다. 그 배가 어디로 갔는지는 모른다', values: { ambition: D }, fx: [{ op: 'money', add: 20000 }] },
      { label: '아래 사람들은 믿지 않는다', hint: '배를 돌려보낸다', closes: true, values: { loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'sky_judgement', kind: 'door', when: atHome('sky', age(16, 50), st('child', 'civil', 'settled'), { c: 'value', id: 'freedom', deep: true }), weight: 2, repeat: 'once', speaker: 'hero',
    title: '하늘의 심판', body: '신의 이름을 함부로 입에 올린 사람에게 번개가 떨어진다는 소문이 돈다. {name}이(가) 술자리에서 한 말이 신관의 귀에 들어갔다고 한다.',
    doors: [
      { label: '구름 끝으로 달아나 아래로 뛰어내린다', hint: '살지 죽을지 모른다. 심판에서는 벗어난다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -35 }, { op: 'move', island: '자야', sea: 'gl_first' }, { op: 'log', text: '등 뒤에서 번개가 구름을 갈랐다. 떨어지는 동안 하늘섬이 점처럼 작아졌다.', weight: 'heavy' },
             { op: 'timeline', text: '심판을 피해 하늘섬에서 뛰어내렸다' }] },
      { label: '고개를 숙이고 숨죽여 지낸다', hint: '몇 해를 겁에 질려 산다', values: { peace: D }, fx: [{ op: 'hardship', add: 2 }] },
    ],
  },
  // ---------------------------------------------------------------- 조우 (바다로 나갈 계기가 필요하다)
  {
    id: 'zou_rope', kind: 'door', when: atHome('zou', age(16, 45), LANDED), weight: 3, repeat: 'once', speaker: { relation: '밧줄을 지키는 밍크족 전사' },
    title: '코끼리 다리의 밧줄', body: '천 년을 걷는 코끼리의 다리를 타고 바다까지 내려가는 밧줄 길이 있다. 바깥 상선이 오는 날만 내려 준다. 오늘이 그날이다.',
    doors: [
      { label: '밧줄을 타고 내려가 상선에 오른다', hint: '고향의 숲을 떠난다. 코끼리는 계속 걸어간다', values: { romance: D },
        fx: [{ op: 'move', island: '드레스로자', sea: 'nw_first' }, { op: 'log', text: '밧줄 끝에서 올려다본 코끼리는 구름보다 컸다. 상선은 장난감의 나라로 갔다.', weight: 'heavy' },
             { op: 'timeline', text: '코끼리의 다리를 타고 내려가 바다로 나갔다' }] },
      { label: '상선과 약초를 바꾸고 올라온다', hint: '바깥 물건이 손에 들어온다', values: { ambition: D }, fx: [{ op: 'money', add: 15000 }] },
      { label: '숲에 남는다', hint: '바깥은 전사들에게 맡긴다', closes: true, fx: [] },
    ],
  },
  {
    id: 'zou_mission', kind: 'door', when: atHome('zou', age(18, 40), LANDED, { c: 'tier', branch: 'any', min: 2 }), weight: 2, repeat: 'once', speaker: { relation: '낮 왕의 부하 장수' },
    title: '바깥 임무', body: '공작의 명으로 바깥 바다에 나가 동맹의 소식을 알아 올 전사를 뽑는다. 장수는 {name}의 창 솜씨를 보았다고 한다.',
    doors: [
      { label: '임무를 받고 바깥 바다로 나간다', hint: '동맹의 나라를 찾아 떠난다', values: { loyalty: D },
        fx: [{ op: 'move', island: '와노쿠니', sea: 'nw_late' }, { op: 'fame', add: 5 }, { op: 'log', text: '폭포를 거슬러 오르는 잉어를 타고 쇄국의 나라에 숨어들었다.', weight: 'heavy' },
             { op: 'timeline', text: '전사의 임무로 바깥 바다에 나갔다' }] },
      { label: '다른 전사에게 양보하고 숲을 지킨다', hint: '고향을 비울 수 없다', values: { justice: D }, fx: [] },
    ],
  },
  {
    id: 'zou_taken', kind: 'door', when: atHome('zou', age(12, 35), st('child', 'civil', 'settled')), weight: 2, repeat: 'once', speaker: 'hero',
    title: '바깥 해적의 배', body: '코끼리의 발치에 바깥 해적선이 닻을 내렸다. 밧줄 길로 올라온 해적들이 밍크족 아이들을 붙잡아 간다. 비싸게 팔린다고 웃는다.',
    doors: [
      { label: '전기를 두르고 해적들에게 덤빈다', hint: '이길지 모른다. 지면 끌려간다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5,
          then: [{ op: 'fame', add: 3 }, { op: 'base', key: 'str', add: 1 }, { op: 'log', text: '번쩍이는 주먹에 해적들이 밧줄을 타고 달아났다.', weight: 'heavy' }],
          else: [{ op: 'hp', add: -25 }, { op: 'hardship', add: 5 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
                 { op: 'log', text: '사슬에 묶여 해적선 밑창에 실렸다. 샤본디의 경매장 뒤뜰에서 소동이 벌어진 틈에 달아났다.', weight: 'heavy' },
                 { op: 'timeline', text: '바깥 해적에게 붙잡혀 고향을 떠났다' }] }] },
      { label: '아이들을 숲 깊이 숨긴다', hint: '싸우지 않는다. 해적들은 빈손으로 떠난다', values: { justice: D }, fx: [{ op: 'person', kind: 'ally', relation: '숲에 숨겨 준 아이', age: { younger: 8 } }] },
    ],
  },
];

export const HOMES_RETURN: Turning[] = [
  {
    id: 'w7_return', kind: 'door', when: away('water7', age(20), ROAMING, sea('gl_entry', 'gl_first', 'sabaody')), weight: 2, repeat: { years: 8 }, speaker: 'hero',
    title: '물의 도시행 배', body: '{island}의 항구에 물의 도시에서 지은 배가 닿았다. 뱃머리의 조각이 낯익다.',
    doors: [
      { label: '배를 얻어 타고 {town}(으)로 돌아간다', hint: '물길의 거리로 돌아간다', values: { loyalty: D },
        fx: [{ op: 'moveHome' }, { op: 'log', text: '물길 위로 곤돌라가 미끄러졌다. {town}은(는) 그대로였다.', weight: 'heavy' }, { op: 'timeline', text: '고향 {town}(으)로 돌아왔다' }] },
      { label: '돌아보지 않는다', hint: '갈 길이 아직 멀다', values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'wano_return', kind: 'door', when: away('wano', age(22), ROAMING, sea('nw_first', 'nw_late')), weight: 2, repeat: { years: 10 }, speaker: 'hero',
    title: '폭포를 오르는 잉어', body: '{island}의 뱃사람들이, 쇄국의 나라를 두른 폭포를 큰 잉어가 거슬러 오르는 철이라고 한다. 고향의 벚꽃이 필 무렵이다.',
    doors: [
      { label: '잉어에 매달려 폭포를 오른다', hint: '나라에 몰래 돌아간다. 떨어지면 크게 다친다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'moveHome' }, { op: 'log', text: '폭포 꼭대기에서 고향의 산이 보였다.', weight: 'heavy' }, { op: 'timeline', text: '폭포를 올라 고향 {town}(으)로 돌아왔다' }] },
      { label: '고향 쪽 하늘에 술잔을 올린다', hint: '돌아가지 않는다', values: { romance: D }, fx: [] },
    ],
  },
  {
    id: 'fm_return', kind: 'door', when: away('fishman', age(20), ROAMING, sea('sabaody', 'gl_first', 'nw_first')), weight: 2, repeat: { years: 8 }, speaker: 'hero',
    title: '해저 일만 미터', body: '{island}에서 거품 옷을 입힌 배가 바닷속 섬으로 내려간다. 지상의 눈길에 지친 어인들이 줄을 선다.',
    doors: [
      { label: '배에 올라 {town}(으)로 돌아간다', hint: '바닷속 고향으로 내려간다', values: { romance: D },
        fx: [{ op: 'moveHome' }, { op: 'log', text: '햇빛이 닿지 않는 깊이에서 고향의 거품 지붕이 빛났다.', weight: 'heavy' }, { op: 'timeline', text: '바닷속 고향 {town}(으)로 돌아왔다' }] },
      { label: '지상에 남는다', hint: '돌아가면 다시는 오르지 못할 것 같다', values: { ambition: D }, fx: [] },
    ],
  },
  {
    id: 'sky_return', kind: 'door', when: away('sky', age(20), ROAMING, sea('gl_entry', 'gl_first')), weight: 2, repeat: { years: 10 }, speaker: 'hero',
    title: '거꾸로 솟는 물기둥', body: '{island} 앞바다에서 바닷물이 하늘로 솟구치는 날이 다가온다고 한다. 그 물기둥을 타면 구름 위까지 오른다.',
    doors: [
      { label: '물기둥에 배를 맡긴다', hint: '하늘섬으로 돌아간다. 배가 견딜지 모른다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'moveHome' }, { op: 'log', text: '물기둥 꼭대기에서 흰 구름 바다가 펼쳐졌다. 고향이었다.', weight: 'heavy' }, { op: 'timeline', text: '물기둥을 타고 하늘섬으로 돌아왔다' }] },
      { label: '청해에 남는다', hint: '이제 이 바다가 사는 곳이다', values: { freedom: D }, fx: [] },
    ],
  },
  {
    id: 'zou_return', kind: 'door', when: away('zou', age(20), ROAMING, sea('nw_first', 'nw_late')), weight: 2, repeat: { years: 8 }, speaker: 'hero',
    title: '걷는 섬의 발자국', body: '{island}의 뱃사람들이, 바다 위를 걷는 거대한 코끼리를 먼바다에서 봤다고 한다. 지금 가면 따라잡을 수 있다.',
    doors: [
      { label: '배를 빌려 코끼리를 쫓아간다', hint: '밧줄 길을 타고 고향의 숲으로 돌아간다', values: { inquiry: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'moveHome' }, { op: 'log', text: '코끼리의 다리를 타고 올라가니 숲의 냄새가 그대로였다.', weight: 'heavy' }, { op: 'timeline', text: '걷는 섬을 쫓아 고향 {town}(으)로 돌아왔다' }] },
      { label: '코끼리가 가는 쪽으로 고개만 숙인다', hint: '돌아가지 않는다', values: { loyalty: D }, fx: [] },
    ],
  },
];
