// 섬마다의 이야기 (항해: core/year.ts의 voyage). 바다를 다니는 사람은 해마다 같은 바다의 다른 섬에 닿고, 그 섬에 닿아야 이 전환점이 열린다.
// 원작의 조연을 배에 태우는 문은 제 배가 있어야 열린다 (needs 'ship'. 제 배를 가진 해적은 선장이다).
// 주연급(밀짚모자 일당 등)은 배에 태우지 않는다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { SEAFARING, age, at, st } from './paths';
import type { Cond, Fx, Turning } from '../../core/types';

const D = V.value.door;
const on = (island: string): Cond => ({ c: 'island', is: [island] });
const SAIL = st(...SEAFARING);
const heavy = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const line = (text: string, canon?: string): Fx => ({ op: 'timeline', text, ...(canon ? { canon } : {}) });
const flag = (id: string): Fx => ({ op: 'flag', id });
/** 해군 · CP는 떠돌이를 배에 태우지 않는다 */
const FREE = st('pirate', 'bountyHunter', 'revolution', 'warlord');

/** 이미 있던 바다의 전환점 가운데 그 섬에서 일어나는 것 (index.ts가 섬 조건을 더한다) */
export const ISLAND_OF: Record<string, string> = {
  gl_whisky_peak: '위스키 피크', gl_little_garden: '리틀 가든', gl_mock_town: '자야', gl_aqua_laguna: '워터 세븐',
  gl_sabaody_auction: '샤본디 제도', nw_zou: '조',
};

export const ISLANDS: Turning[] = [
  // ---------------------------------------------------------------- 이스트 블루
  {
    id: 'isl_baratie_gin', kind: 'door', when: at(age(16, 40), SAIL, on('해상 레스토랑 발라티에')), weight: 10, repeat: 'once', speaker: { canon: 'gin' },
    title: '뒷문 계단의 사내', body: '바다 위의 레스토랑, 그 뒷문 계단에 며칠을 굶은 사내가 쓰러져 있다. 톤파를 쥔 손에 굳은살이 두껍다. 이름난 해적 함대의 전투 총대장이었다고 한다. 요리사들은 돈 없는 손님은 손님이 아니라며 문을 닫았다.',
    doors: [
      { label: '제 돈으로 밥을 시켜 내밀고, 갈 곳이 없으면 타라고 한다', hint: '사내는 눈물을 흘리며 그릇을 비운다. 한 번 받은 밥은 잊지 않는 사람이다', needs: ['ship'], when: [FREE], values: { loyalty: D },
        fx: [{ op: 'money', add: -3000 }, { op: 'person', kind: 'crew', relation: '밥 한 끼로 배에 오른 전투 총대장', canon: 'gin', role: 'vanguard' },
             heavy('긴이 그릇을 내려놓고 말했다. 이 밥값은 목숨으로 갚겠다고.'), line('굶주린 긴에게 밥을 사 주고 배에 태웠다', 'gin')] },
      { label: '밥만 사 주고 이름도 묻지 않는다', hint: '사내는 떠나는 등을 오래 본다', values: { peace: D },
        fx: [{ op: 'money', add: -3000 }, { op: 'person', kind: 'ally', relation: '밥 한 끼를 빚진 사내', canon: 'gin' }, line('굶주린 사내에게 밥을 사 주었다', 'gin')] },
      { label: '해군 초소에 알려 현상금을 받는다', hint: '쓰러진 사람은 잡기 쉽다. 주머니가 묵직해진다', values: { greed: D },
        fx: [{ op: 'money', add: 60000 }, { op: 'fame', add: 5 }, flag('soldGin')] },
    ],
  },
  {
    id: 'isl_conomi_johnny', kind: 'door', when: at(age(16, 40), SAIL, on('코노미 제도')), weight: 10, repeat: 'once', speaker: { canon: 'johnny' },
    title: '종이 한 장 차이', body: '귤밭이 보이는 선착장에서 선글라스를 낀 사냥꾼 콤비가 수배서 뭉치를 넘기고 있다. 둘 중 하나는 괴혈병으로 이가 흔들린다. {name}의 얼굴을 본 선글라스 쪽이 벌떡 일어선다. 한 수 가르쳐 달라는 것이다.',
    doors: [
      { label: '칼을 받아 주고, 따라오고 싶으면 타라고 한다', hint: '둘은 그날부터 {name}을(를) 형님이라 부른다', needs: ['ship'], when: [FREE], values: { dominion: D },
        fx: [{ op: 'person', kind: 'crew', relation: '형님이라 부르며 따라온 사냥꾼', canon: 'johnny', role: 'support' },
             heavy('조니가 갑판에 무릎을 꿇었다. 형님! 종이 한 장 차이로 졌습니다!'), line('사냥꾼 조니를 배에 태웠다', 'johnny')] },
      { label: '앓는 쪽에게 귤을 짜 먹이는 법부터 일러 준다', hint: '뱃사람이 왜 이를 잃는지 아는 사람은 드물다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '귤 한 알을 빚진 사냥꾼', canon: 'johnny' }] },
      { label: '수배서 뭉치에서 값나가는 것만 골라 사들인다', hint: '쓸 만한 사냥감의 행방을 손에 넣는다', when: [{ c: 'money', min: 5000 }], values: { ambition: D },
        fx: [{ op: 'money', add: -5000 }, { op: 'fame', add: 8 }, flag('boughtPosters')] },
    ],
  },
  // ---------------------------------------------------------------- 위대한 항로 입구
  {
    id: 'isl_reverse_keeper', kind: 'door', when: at(age(16), SAIL, on('리버스 마운틴')), weight: 10, repeat: 'once', speaker: { relation: '등대지기 노인' },
    title: '쌍둥이 곶의 등대지기', body: '붉은 산을 넘어 떨어진 곳에 등대가 서 있다. 꽃 같은 머리의 늙은 등대지기가 신문을 접으며 {name}을(를) 올려다본다. 이 바다에서는 나침반이 듣지 않는다고, 섬의 자기를 기억하는 지침이 있어야 한다고 한다.',
    doors: [
      { label: '젊은 날 어느 배를 탔느냐고 캐묻는다', hint: '노인은 한참 웃다가, 세상 끝까지 갔다 온 배의 이야기를 조금 들려준다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('heardRoger'), heavy('노인이 말했다. 그 섬은 정말로 있다고. 그리고 우리는 너무 일찍 갔다고.')] },
      { label: '고래의 상처를 돌보는 일을 한 철 거든다', hint: '떠날 날이 밀린다. 노인은 사람 몸 고치는 법도 조금 일러 준다', values: { peace: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, { op: 'hp', add: 15 }] },
      { label: '지침이 가리키는 가장 험한 길을 고른다', hint: '일곱 갈래 가운데 아무도 가지 않는 길이다', values: { romance: D }, danger: true,
        fx: [{ op: 'fame', add: 10 }, { op: 'chance', p: 0.4, then: [{ op: 'hp', add: -20 }] }] },
    ],
  },
  // ---------------------------------------------------------------- 위대한 항로 전반
  {
    id: 'isl_alabasta_bonclay', kind: 'door', when: at(age(16, 45), SAIL, on('알라바스타 왕국')), weight: 10, repeat: 'once', speaker: { canon: 'bonclay' },
    title: '백조 뱃머리의 배', body: '모래 왕국의 강어귀에 백조 뱃머리를 단 배가 떠 있다. 등에 백조를 멘 화장한 사내가 발레를 추다가 물에 빠졌다. 건져 올리자 사내는 {name}의 얼굴을 만지더니, 눈 깜짝할 사이에 똑같은 얼굴이 되어 웃는다.',
    doors: [
      { label: '밤새 같이 춤추고 노래하다 벗이 된다', hint: '우정에 걸린 시간은 하룻밤이다. 사내는 제 배를 버리고 따라오겠다고 한다', needs: ['ship'], when: [FREE], values: { romance: D },
        fx: [{ op: 'person', kind: 'crew', relation: '하룻밤에 벗이 된 발레 권법가', canon: 'bonclay', role: 'vanguard' },
             heavy('봉쿠레가 뱃머리에서 외쳤다. 우정에 세월은 상관없는 거야!'), line('발레 권법가 봉쿠레와 벗이 되었다', 'bonclay')] },
      { label: '그 능력으로 무엇을 하고 다니는지 묻는다', hint: '사내는 입에 손가락을 댄다. 이 나라에 무언가 숨은 조직이 있다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('baroqueHint'), { op: 'person', kind: 'ally', relation: '강에서 건져 준 발레 권법가', canon: 'bonclay' }] },
      { label: '제 얼굴을 한 사내를 믿지 않고 배에서 내리게 한다', hint: '아무 일도 일어나지 않는다. 백조 배는 노래하며 멀어진다', values: { justice: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'isl_enies_gate', kind: 'door', when: at(age(17), SAIL, on('에니에스 로비')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '밤이 오지 않는 섬', body: '해가 지지 않는 사법의 섬. 폭포 한가운데에 재판소가 떠 있고, 그 뒤로 바다를 막아선 거대한 문이 보인다. 호송 열차에서 쇠사슬에 묶인 사람들이 줄지어 내린다. 여기서 끌려간 사람은 돌아온 적이 없다고 한다.',
    doors: [
      { label: '줄의 맨 끝, 가장 어린 죄수의 족쇄를 몰래 푼다', hint: '한 사람은 달아난다. 섬 전체가 {name}을(를) 쫓는다', values: { freedom: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 20 }, flag('govEnemy'), heavy('사이렌이 울렸다. 어린 죄수는 폭포 아래로 사라졌고, {name}은(는) 한낮 같은 밤을 내내 달렸다.')] },
      { label: '재판소 기록실에 숨어들어 판결문을 읽는다', hint: '여기서는 누구도 무죄가 된 적이 없다는 것을 알게 된다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('readVerdicts'), { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -15 }, flag('govEnemy')] }] },
      { label: '끌려가는 사람들의 이름을 하나씩 받아 적는다', hint: '아무것도 바꾸지 못한다. 누군가에게 전할 소식은 남는다', values: { justice: D },
        fx: [flag('prisonerNames'), heavy('열두 명의 이름을 적었다. 그 가운데 셋은 고향 섬의 이름까지 말해 주었다.')] },
    ],
  },
  // ---------------------------------------------------------------- 샤본디 제도 둘레
  {
    id: 'isl_sabaody_duval', kind: 'door', when: at(age(17, 50), SAIL, on('샤본디 제도')), weight: 10, repeat: 'once', speaker: { canon: 'duval' },
    title: '철가면의 인신매매단', body: '비눗방울이 떠오르는 맹그로브 숲 앞바다, 날치를 탄 무리가 배를 에워싼다. 철가면을 쓴 두목은 수배서와 닮았다는 까닭 하나로 평생을 쫓겼다며 세상을 저주한다. 가면 밑의 얼굴은 엉망이다.',
    doors: [
      { label: '두들겨 패서 얼굴 뼈를 바로잡아 준다', hint: '두목은 거울을 보고 울음을 터뜨린다. 그날부터 은인이라며 따라다닌다', needs: ['ship'], when: [FREE], values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'crew', relation: '얼굴을 고쳐 준 날치 기수', canon: 'duval', role: 'support' },
             heavy('듀발이 윙크를 날렸다. 이 잘생긴 얼굴, 평생 은인께 바치겠습니다!'), line('날치 기수 듀발을 배에 태웠다', 'duval')] },
      { label: '날치 떼를 따돌리고 숲 안쪽으로 달아난다', hint: '싸우지 않는다. 비눗방울 사이로 숨는다', values: { freedom: D },
        fx: [{ op: 'base', key: 'spd', add: 1 }] },
      { label: '무리가 잡아 둔 사람들을 풀어 주라고 한다', hint: '말로는 듣지 않는다. 주먹이 오간다', values: { justice: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 15 }, heavy('우리의 자물쇠를 부쉈다. 풀려난 사람들이 숲속으로 흩어졌다.')] },
    ],
  },
  {
    id: 'isl_thriller_shadow', kind: 'door', when: at(age(17), SAIL, on('스릴러 바크')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '안개 속의 떠다니는 섬', body: '짙은 안개 속에서 섬만 한 배가 나타났다. 숲에는 그림자가 없는 사람들이 숨어 산다. 해가 뜨면 몸이 타 버린다고 한다. 성에서는 밤마다 꿰맨 자국투성이의 시체들이 걸어 나온다.',
    doors: [
      { label: '걸어 다니는 시체의 입에 소금을 밀어 넣어 본다', hint: '그림자 하나가 제 주인에게 돌아간다. 성의 주인이 알아챈다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 15 }, heavy('시체가 쓰러지고 검은 것이 숲 쪽으로 날아갔다. 숲에서 누군가 울면서 햇빛 속으로 걸어 나왔다.')] },
      { label: '성의 보물 창고만 털고 안개 속으로 빠져나간다', hint: '주머니는 무거워진다. 숲의 사람들은 그대로 남는다', values: { greed: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7, then: [{ op: 'money', add: 120000 }], else: [{ op: 'hp', add: -25 }, heavy('창고에는 보물 대신 웃는 유령들이 가득했다. 온몸에 힘이 빠져 기어 나왔다.')] }] },
      { label: '그림자 없는 사람들과 숲에 숨어 새벽을 넘긴다', hint: '아무것도 얻지 못한다. 그들의 이야기를 밤새 듣는다', values: { peace: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'isl_amazon_arena', kind: 'door', when: at(age(17), SAIL, on('아마존 릴리')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '여인들의 섬', body: '무풍 지대 한가운데, 여인들만 사는 전사의 나라에 떠밀려 왔다. 뱀을 활 삼아 쏘는 화살이 바위를 뚫는다. 화살촉에는 눈에 보이지 않는 무언가가 실려 있다. 전사들이 {name}을(를) 투기장으로 끌고 간다.',
    doors: [
      { label: '투기장 한가운데서 전사들과 겨룬다', hint: '이 섬에서는 강한 것이 아름다운 것이다. 뼈가 성하지 않을 수 있다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'mastery', branch: 'fist', add: 20 }, { op: 'fame', add: 10 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] }] },
      { label: '화살에 실린 것이 무엇인지 늙은 전사에게 묻는다', hint: '노파는 그것이 누구에게나 잠들어 있는 힘이라고 한다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, flag('heardHaki'), heavy('노파가 말했다. 의심하지 않는 것, 그것이 힘이라고.')] },
      { label: '밤에 뗏목을 엮어 몰래 빠져나간다', hint: '바다뱀이 우글거리는 바다다. 그래도 투기장보다는 낫다', values: { freedom: D },
        fx: [{ op: 'hp', add: -8 }] },
    ],
  },
  {
    id: 'isl_fishman_hack', kind: 'door', when: at(age(18, 50), st('revolution'), on('어인섬')), weight: 10, repeat: 'once', speaker: { canon: 'hack' },
    title: '어인 가라테의 사범', body: '바닷속 도장에서 어인 사범이 물방울 하나로 기왓장 백 장을 깬다. 사람과 어인이 같은 도장에서 땀을 흘리는 날을 보고 싶다고, 그래서 혁명군의 깃발 아래 있다고 한다. 사범이 {name}에게 자세를 잡아 보라고 한다.',
    doors: [
      { label: '같은 배에서 싸우자고 청한다', hint: '사범은 제자 하나를 더 들인 셈 치겠다며 웃는다', needs: ['ship'], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'crew', relation: '한배에 오른 어인 가라테 사범', canon: 'hack', role: 'vanguard' }, line('어인 가라테 사범 핵과 한배를 탔다', 'hack')] },
      { label: '물을 다루는 주먹을 한 철 배운다', hint: '손바닥이 부르튼다. 물 한 방울의 무게를 알게 된다', values: { ambition: D },
        fx: [{ op: 'mastery', branch: 'fist', add: 25 }, { op: 'hp', add: -8 }] },
      { label: '이 섬의 사람들이 지상을 어떻게 보는지 듣는다', hint: '쉽게 풀릴 이야기가 아니라는 것을 알게 된다', values: { justice: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('fishmanHistory')] },
    ],
  },
  // ---------------------------------------------------------------- 신세계
  {
    id: 'isl_dressrosa_sai', kind: 'door', when: at(age(18, 55), SAIL, on('드레스로자')), weight: 10, repeat: 'once', speaker: { canon: 'sai' },
    title: '투기장의 대기실', body: '투기장 대기실은 이름난 싸움꾼들로 가득하다. 꽃 나라에서 온 수군의 젊은 두령이 창을 닦다가 {name}을(를) 본다. 우승 상품이 열매라는 소문에 온 세상의 주먹이 모였다. 두령이 술병을 들어 보인다.',
    doors: [
      { label: '잔을 받고, 한 번 잔을 나눈 사이의 맹세를 한다', hint: '꽃 나라의 수군은 잔을 나눈 상대를 끝까지 따른다', needs: ['ship'], when: [FREE], values: { loyalty: D },
        fx: [{ op: 'person', kind: 'crew', relation: '잔을 나눈 꽃 나라 수군의 두령', canon: 'sai', role: 'vanguard' },
             heavy('사이가 잔을 바닥에 내리쳤다. 오늘부터 팔보수군은 네 부름에 답한다.'), line('꽃 나라 수군의 사이와 잔을 나눴다', 'sai')] },
      { label: '투기장에 이름을 올리고 끝까지 싸운다', hint: '살아서 나오면 온 신세계가 그 이름을 안다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 60 }, { op: 'mastery', branch: 'fist', add: 20 }, { op: 'chance', p: 0.35, then: [{ op: 'injury', severity: 'heavy' }] },
             line('드레스로자의 투기장에서 끝까지 싸웠다')] },
      { label: '경기는 보지 않고 누가 누구에게 돈을 거는지만 살핀다', hint: '판을 읽으면 큰돈이 들어온다. 이 섬의 뒷거래도 조금 보인다', values: { greed: D },
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'money', add: 130000 }], else: [{ op: 'money', add: -20000 }] }] },
    ],
  },
  {
    id: 'isl_wholecake_tea', kind: 'door', when: at(age(18), SAIL, on('홀케이크 아일랜드')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '과자로 지은 나라', body: '섬 전체가 달콤한 냄새를 풍긴다. 집은 비스킷이고 강은 주스다. 나무와 문짝이 노래를 한다. 이 나라의 여왕은 여섯 달마다 온 섬에서 수명을 걷어 간다고 한다. 다과회 날이 다가와 거리가 술렁인다.',
    doors: [
      { label: '과자 집 지붕을 뜯어 배가 터지도록 먹는다', hint: '평생 가장 단 하루다. 집주인이 노래로 병사를 부른다', values: { romance: D },
        fx: [{ op: 'hp', add: 15 }, { op: 'chance', p: 0.4, then: [{ op: 'hp', add: -20 }, heavy('지붕이 비명을 질렀다. 체스 병사들에게 쫓겨 초콜릿 다리 밑에서 사흘을 숨었다.')] }] },
      { label: '다과회에 올릴 조공 과자 수레를 빼돌린다', hint: '세상에서 가장 비싼 과자다. 여왕의 눈에 띄면 끝이다', values: { greed: D }, danger: true,
        fx: [{ op: 'chance', p: 0.55, then: [{ op: 'money', add: 150000 }, flag('yonkoGrudge')], else: [{ op: 'hp', add: -30 }, { op: 'injury', severity: 'light' }, flag('yonkoGrudge')] }] },
      { label: '성 깊은 곳에 붉은 돌이 있다는 소문을 캔다', hint: '마지막 섬으로 가는 길의 한 조각이다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'base', key: 'int', add: 1 }, flag('roadStoneRumor'), { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -20 }] }] },
    ],
  },
  {
    id: 'isl_elbaf_giant', kind: 'door', when: at(age(18), SAIL, on('엘바프')), weight: 10, repeat: 'once', speaker: { canon: 'hajrudin' },
    title: '거인의 나라', body: '세상에서 가장 큰 나무 아래에 거인들의 나라가 있다. 술통이 집채만 하다. 용병으로 세상을 떠돌던 젊은 거인 선장이 옛 거병 해적단을 다시 일으키겠다며 잔을 든다. 거인이 {name}을(를) 손바닥에 올려 눈높이를 맞춘다.',
    doors: [
      { label: '집채만 한 술통을 같이 비우고 한 깃발 아래 서자고 한다', hint: '거인은 작은 사람의 배짱에 크게 웃는다', needs: ['ship'], when: [FREE], values: { loyalty: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'crew', relation: '술통을 같이 비운 거인 전사', canon: 'hajrudin', role: 'vanguard' },
             heavy('하이루딘의 웃음소리에 나뭇잎이 떨어졌다. 좋다, 작은 선장!'), line('엘바프의 거인 하이루딘과 술통을 비웠다', 'hajrudin')] },
      { label: '전사의 결투를 청한다', hint: '엘바프에서는 결투에서 달아나지 않는 것이 긍지다. 맞으면 날아간다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -35 }, { op: 'fame', add: 40 }, { op: 'base', key: 'wil', add: 1 }, { op: 'chance', p: 0.4, then: [{ op: 'injury', severity: 'heavy' }] },
             heavy('세 번 날아갔고 세 번 일어났다. 거인들이 방패를 두드리며 {name}의 이름을 불렀다.')] },
      { label: '거인들의 책 창고에서 한 철을 보낸다', hint: '책 한 권이 문짝만 하다. 세상의 오래된 일이 적혀 있다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 2 }, flag('elbafLibrary')] },
    ],
  },
  {
    id: 'isl_laugh_mist', kind: 'door', when: at(age(20), SAIL, on('라프텔 근해')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '지침이 도는 바다', body: '세상의 끝이 가까운 바다. 지침의 바늘이 제자리를 맴돈다. 안개 너머 어딘가에 마지막 섬이 있다고 한다. 여기까지 온 배는 손에 꼽는다. 갑판 위의 모두가 숨을 죽인다.',
    doors: [
      { label: '지침을 버리고 안개 속으로 들어간다', hint: '아무도 돌아와서 말해 주지 않은 바다다', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.35,
               then: [{ op: 'fame', add: 150 }, flag('sawLastSea'), heavy('안개가 걷힌 한순간, 수평선에 섬의 그림자가 섰다. 붉은 돌 없이는 닿을 수 없는 거리였다. 그래도 보았다.'), line('마지막 섬의 그림자를 보았다')],
               else: [{ op: 'hp', add: -30 }, { op: 'hardship', add: 3 }, heavy('사흘을 맴돌다 처음 자리로 돌아와 있었다. 바다가 아직은 아니라고 말하는 것 같았다.')] }] },
      { label: '닻을 내리고 이 바다의 해류를 낱낱이 그린다', hint: '뒤에 올 누군가는 이 해도를 들고 더 멀리 간다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'fame', add: 30 }, flag('lastSeaChart'), line('세상 끝 바다의 해도를 그렸다')] },
      { label: '여기까지 온 것으로 되었다며 뱃머리를 돌린다', hint: '웃으면서 돌아간다', values: { peace: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'fame', add: 15 }] },
    ],
  },
];
