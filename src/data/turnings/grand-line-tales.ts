import type { Cond, Fx, Turning } from '../../core/types';
import { V } from '../balance';
import { PILOT_CARD, POST_SNAIL } from '../keepsakes';
import { GROWN, age, st } from './paths';

const D = V.value.door;
const ashore: Cond = { c: 'ashore' };
const island = (...is: string[]): Cond => ({ c: 'island', is });
const flag = (id: string, has = true): Cond => ({ c: 'flag', id, has });
const met = (relation: string): Cond => ({ c: 'person', relation, has: true, kinds: ['ally'] });
const since = (turning: string, door: number, years: number): Cond => ({ c: 'choiceAgo', turning, door, years });
const note = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const postalPorts = island('후샤 마을', '시럽 마을', '셸스 타운', '로그타운', '워터 세븐', '시프트 역', '드레스로자', '북쪽 상업 도시');
const deepPorts = island('자야', '워터 세븐', '샤본디 제도', '드레스로자', '엘바프');
const keeper = '달팽이콩을 맡긴 우체국장';
const pilot = '비블카드를 나눈 도선사';

export const GRAND_LINE_TALES: Turning[] = [
  {
    id: 'gl_post_snail', kind: 'door', when: [age(7), st('child', ...GROWN), ashore, postalPorts],
    weight: 12, repeat: 'once', speaker: { relation: '우체국장 포포' },
    title: '수화기 속의 딸꾹질', body: '{island} 우체국 창틀에서 전보벌레가 울었다. “푸루루루… 힉!” 수화기 너머 사람이 딸꾹질을 할 때마다 달팽이까지 몸을 들썩였다. 우체국장 포포가 상추를 한 장 내밀었다. “은퇴하는 녀석이야. 달팽이콩이라고 해. 나보다 아는 번호가 많지.”',
    doors: [
      { label: '상추를 먹이고 달팽이콩을 맡는다', hint: '포포가 우체국 직통 번호를 등껍질 안쪽에 적어 준다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', name: '포포', age: 46, relation: keeper }, { op: 'flag', id: POST_SNAIL },
          note('포포가 건너편 방에서 시험 전화를 걸었다. 달팽이콩의 입가에 포포와 똑같은 팔자수염이 불룩 솟았다. 수화기를 놓자 수염도 쏙 들어갔다.')] },
      { label: '마지막 근무가 끝날 때까지 대신 전화를 받는다', hint: '달팽이콩은 우체국 창가에서 낮잠을 잔다', values: { peace: D }, fx: [note('생선값을 흥정하는 전화가 세 통, 잃어버린 틀니를 찾는 전화가 한 통 왔다. 마지막 손님은 자기 입에서 틀니를 찾았다.')] },
    ],
  },
  {
    id: 'gl_post_call', kind: 'door', when: [st('child', ...GROWN), ashore, postalPorts, flag(POST_SNAIL), met(keeper), since('gl_post_snail', 0, 1)],
    weight: 35, repeat: 'once', speaker: { relation: keeper },
    title: '팔자수염이 돌아왔다', body: '달팽이콩의 입가에 팔자수염이 돋았다. 포포다. “내 말 들리나? 우편 자루가 뒤바뀌었어. 그쪽 시장에 수배서가 한 상자 도착했을 걸세.” 마침 생선 장수가 빨간 코 해적 얼굴에 고등어를 싸려 했다.',
    doors: [
      { label: '수배서를 걷고 우체국에 도착을 알린다', hint: '포포에게 배달을 마쳤다는 연락을 돌린다', values: { justice: D },
        fx: [{ op: 'personChange', relation: keeper, bond: 5 }, { op: 'flag', id: 'postCallAnswered' }, note('“전부 찾았어. 한 장은 고등어 냄새가 좀 나.” 수화기 너머로 웃음이 터졌다. 달팽이콩도 팔자수염을 파르르 떨었다.')] },
      { label: '생선 장수에게 수화기를 건넨다', hint: '두 사람이 직접 자루를 맞바꾸게 한다', values: { freedom: D },
        fx: [note('장수와 포포가 한참 실랑이를 했다. 잠시 뒤 진짜 주문서가 나왔다. 해군 식당도 오늘 저녁은 고등어였다.')] },
    ],
  },
  {
    id: 'gl_vivre_pilot', kind: 'door', when: [age(15), st(...GROWN, 'child'), ashore, deepPorts],
    weight: 15, repeat: 'once', speaker: { relation: '도선사 마레' },
    title: '바람을 거슬러 가는 종이', body: '부두에 날아든 종잇조각 하나가 바람을 거슬러 {name}의 발등을 타고 넘었다. 그 끝에 짐짝에 발이 끼인 도선사 마레가 있었다. 짐을 들어 주자 마레는 종이를 반으로 찢었다. “내 손톱으로 만든 비블카드야. 이쪽 귀퉁이를 가지면 어디서든 나를 찾을 수 있어.”',
    doors: [
      { label: '마레의 이름을 적어 귀퉁이를 간직한다', hint: '이 조각은 도선사 마레가 있는 쪽으로 움직인다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', name: '마레', age: 35, relation: pilot }, { op: 'flag', id: PILOT_CARD },
          note('마레가 잔교 끝으로 걸어가는 동안 손바닥에서 종이가 조금씩 기었다. 모퉁이를 돌아 보이지 않게 된 뒤에도 방향은 정확했다.')] },
      { label: '짐을 정리하고 종이는 마레에게 돌려준다', hint: '오늘 배를 놓칠 사람부터 돕는다', values: { peace: D },
        fx: [note('마레는 두 조각을 포개 모자에 넣었다. 마지막 짐이 제 배에 오르자 부두 여기저기서 출항 종이 울렸다.')] },
    ],
  },
  {
    id: 'gl_vivre_reunion', kind: 'door', when: [age(16), st(...GROWN), ashore, deepPorts, flag(PILOT_CARD), met(pilot), since('gl_vivre_pilot', 0, 1)],
    weight: 40, repeat: 'once', speaker: 'hero',
    title: '주머니 속에서 작아진 이름', body: '아침에 펼쳐 본 비블카드는 마레의 이름이 겨우 남을 만큼 줄어 있었다. 손을 펴자 종이가 부두 건너편 창고를 향해 기었다. 안개에 가린 물길에서 반쯤 잠긴 도선의 종이 한 번 울렸다.',
    doors: [
      { label: '종이가 당기는 쪽으로 구명정을 이끈다', hint: '안개 속에서도 뱃머리가 향할 곳을 안다', values: { loyalty: D }, fx: [
        { op: 'personChange', relation: pilot, bond: 10 }, { op: 'flag', id: 'pilotRescued' },
        note('종이가 손바닥 끝에 닿았을 때 마레의 손이 뱃전을 잡았다. 며칠 뒤 병상에 앉은 마레가 죽을 두 그릇 비웠다. 그새 제 이름 아래로 흰 여백이 조금 돌아와 있었다.')] },
      { label: '구조대장에게 비블카드를 넘기고 등불을 지킨다', hint: '구조대가 종이로 길을 찾고, 불빛을 보고 돌아온다', values: { justice: D }, fx: [
        { op: 'unflag', id: PILOT_CARD }, { op: 'flag', id: 'pilotRescued' },
        note('들것 위에서 마레가 손가락을 들었다. 구조대장이 젖은 모자에 종이 조각을 꽂아 주자, 마레는 그제야 힘을 빼고 누웠다.')] },
    ],
  },
  {
    id: 'gl_brook_song', kind: 'door', when: [age(18, 19), st(...GROWN), ashore, island('스릴러 바크')],
    weight: 16, repeat: 'once', speaker: { canon: 'brook' },
    title: '찻잔을 달그락거리는 손가락뼈', body: '안개 속 잔교에 앉은 해골이 바이올린 활을 내려놓고 찻잔을 들었다. 찻물이 턱뼈 사이로 줄줄 샜다. “요호호호! 이래서 다과회에는 늘 여벌 바지가 필요하지요.” 브룩은 죽었다가 되살아난 뒤에도 잊지 않은 노래가 있다며, 고래 한 마리가 좋아한 가락을 켰다.',
    doors: [
      { label: '고래가 알아듣는다는 후렴을 배운다', hint: '등대가 있는 쌍둥이 언덕에서 라분을 만나면 들려줄 수 있다', values: { romance: D }, fx: [
        { op: 'person', kind: 'ally', canon: 'brook', relation: '고래의 노래를 가르쳐 준 음악가' }, { op: 'flag', id: 'laboonRefrain' },
        note('음을 하나 빼먹자 앙상한 손가락이 현을 짚고 기다렸다. 마침내 후렴을 끝까지 부른 뒤에야 브룩이 마지막 화음을 얹었다. “그 녀석 이름은 라분입니다.”')] },
      { label: '찻물이 새지 않게 받침 접시를 대 준다', hint: '다 식기 전에 함께 차를 마신다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', canon: 'brook', relation: '차를 나눈 해골 음악가' }, note('마지막 한 모금을 받아 내자 브룩이 찻잔 두 개를 포개 씌웠다. 달그락 박자에 맞춰 둘이서 잔교 끝까지 걸었다.')] },
    ],
  },
  {
    id: 'gl_laboon_refrain', kind: 'door', when: [age(18), st(...GROWN), ashore, island('리버스 마운틴'), flag('laboonRefrain')],
    weight: 40, repeat: 'once', speaker: 'hero',
    title: '등대보다 큰 청중', body: '쌍둥이 언덕의 등대가 그늘에 잠겼다. 섬만 한 고래가 수면에 눈 하나를 내놓고 있었다. 이마를 덮은 흉터 위로 물이 흘렀다. 스릴러 바크에서 브룩이 짚어 주던 첫 음이 떠올랐다.',
    doors: [
      { label: '라분이 들을 수 있게 후렴을 부른다', hint: '바이올린이 쉬어 가던 자리까지 불러 본다', values: { loyalty: D }, fx: [
        note('마지막 마디가 끝나자 발밑의 돌이 울렸다. 고래의 낮고 긴 소리였다. 등대지기는 물안경을 벗고 한참 있다가 다시 썼다.'),
        { op: 'timeline', text: '브룩에게 배운 노래를 쌍둥이 언덕에서 라분에게 들려주었다', canon: 'brook' }] },
      { label: '낮게 휘파람을 불며 등대 곁에 앉는다', hint: '고래가 떠날 때까지 자리를 지킨다', values: { peace: D },
        fx: [note('라분은 해가 기울 때까지 눈 하나를 물 밖에 내놓고 있었다. 조용히 돌아설 때 뺨에 물보라 한 방울이 튀었다.')] },
    ],
  },
  {
    id: 'gl_cola_drydock', kind: 'door', when: [age(16), st(...GROWN), ashore, postalPorts, flag('learnedColaPump'), since('cn_franky_backstreet', 1, 1)],
    weight: 28, repeat: 'once', speaker: 'hero',
    title: '양동이 열 개와 콜라 한 병', body: '밤새 물이 찬 수리 도크에서 사람들이 양동이를 돌렸다. 구석의 낡은 펌프에는 둥근 병 자국 세 개가 남아 있었다. 워터 세븐에서 프랑키와 함께 고친 바로 그 형식이었다. 마침 도시락 바구니에서 콜라병 부딪히는 소리가 났다.',
    doors: [
      { label: '콜라로 펌프를 깨워 도크의 물을 뺀다', hint: '두목과 함께 들었던 딸꾹 소리를 기다린다', values: { inquiry: D }, fx: [
        note('펌프가 딸꾹질을 두 번 하더니 토해내듯 물을 뿜었다. 수리공 한 사람이 팔을 들어 올렸다. 남들도 어설프게 따라 했다. 멀리 있는 프랑키가 봤다면 별 모양이 비뚤어졌다며 한마디 했을 게다.')] },
      { label: '가장 어린 수리공에게 병을 건네고 곁에서 가르친다', hint: '항구에 펌프를 아는 사람이 한 명 더 생긴다', values: { loyalty: D }, fx: [
        { op: 'person', kind: 'ally', relation: '함께 콜라 펌프를 살린 수리공', age: 19 },
        note('수리공이 레버를 당겨 물을 뿜자 양동이 열 개가 나란히 비었다. 다음 침수 때 자기가 맡겠다며 작업복에 끼워 둔 병따개를 톡톡 쳤다.')] },
    ],
  },
  {
    id: 'gl_reef_eye', kind: 'door', when: [age(8), st('child', ...GROWN), ashore, island('어인섬', '어인가', '류구 왕국', '바다의 숲')],
    weight: 12, repeat: 'once', speaker: 'hero',
    title: '거품 밖의 눈꺼풀', body: '어인섬을 감싼 거품 너머에서 환하던 물빛이 꺼졌다. 등대지기가 불을 비추자 집채만 한 눈동자 속에 등대 전체가 거꾸로 비쳤다. 어린 해왕류 한 마리가 거품에 코를 기대고 있었다. 더 깊은 곳에서 그것보다 훨씬 큰 그림자가 불렀다.',
    doors: [
      { label: '등대 불을 낮추고 작은 녀석이 돌아서기를 기다린다', hint: '거품에 비친 제 모습이 사라지면 고개를 돌릴지도 모른다', values: { peace: D }, fx: [
        { op: 'flag', id: 'reefKingWatched' }, note('불이 낮아지자 해왕류는 코로 거품을 딱 한 번 밀고 돌아섰다. 뒤따라 헤엄치는 모습을 본 등대지기가 작게 중얼거렸다. “저게 아직 젖니일 거야.”')] },
      { label: '거품 안쪽에서 눈과 등지느러미를 그려 둔다', hint: '등대 창틀을 눈금 삼아 크기를 남긴다', values: { inquiry: D }, fx: [
        { op: 'flag', id: 'reefKingWatched' }, note('종이 끝에 닿도록 긴 지느러미를 그렸다. 옆에서 보던 꼬마가 종이를 한 장 더 갖다 댔다. 그래도 꼬리를 넣을 자리가 모자랐다.')] },
    ],
  },
  {
    id: 'gl_redhair_tab', kind: 'door', when: [age(5, 7), st('child'), ashore, island('후샤 마을'), flag('left_home_young', false)],
    weight: 14, repeat: 'once', speaker: { canon: 'shanks' },
    title: '선장 몫까지 먹은 사람', body: '마키노의 술집 창문으로 뼈다귀가 한 바퀴 돌아 나왔다. 빨간 머리 해적단이 외상 장부를 정산하는 날이었다. 럭키 루가 고기를 문 채 빈 접시를 세었고 베크맨이 장부를 짚었다. 샹크스는 자기 접시가 비었다고 항의하다가 맨 먼저 웃음을 터뜨렸다.',
    doors: [
      { label: '빈 접시 뒷면까지 세어 본다', hint: '마키노가 분필을 한 토막 내민다', values: { inquiry: D }, fx: [
        { op: 'person', kind: 'ally', canon: 'makino', relation: '함께 해적들의 외상을 센 주인' },
        note('장을 넘기니 선장이 사 준 접시마다 작게 동그라미가 쳐 있었다. 맨 끝 동그라미 아래엔 후샤 아이들이 먹은 고기 꼬치 값도 들어 있었다.')] },
      { label: '부엌에서 선장에게 남은 고기 한 점을 가져온다', hint: '선장이 빈 의자를 발로 끌어 준다', meal: true, values: { loyalty: D }, fx: [
        { op: 'person', kind: 'ally', canon: 'shanks', relation: '술집 창가에서 꼬치를 나눈 선장' },
        note('샹크스가 꼬치를 딱 반으로 갈랐다. “서둘러. 우리 배엔 접시보다 빠른 손이 열 개쯤 있거든.” 럭키 루가 억울하다는 듯 양손을 들었다. 고기는 여전히 입에 있었다.')] },
    ],
  },
  {
    id: 'gl_heart_hatch', kind: 'door', when: [age(17, 19), st(...GROWN), ashore, island('샤본디 제도')],
    weight: 14, repeat: 'once', speaker: 'hero',
    title: '부두 아래서 받아 가는 빨래', body: '샤본디 부두의 세탁부가 하트 무늬 작업복에 마지막 다림질을 했다. 손님 배는 보이지 않았다. 잠시 뒤 노란 잠수함이 수면 위로 솟고, 둥근 해치에서 흰곰이 고개를 내밀었다. “죄송합니다. 조류가 빨라서요.” 세탁부가 아직 아무 말도 안 했다고 하자 곰이 또 사과했다.',
    doors: [
      { label: '젖지 않도록 작업복 꾸러미를 내려 준다', hint: '베포가 한 벌씩 세어 해치 안으로 건넨다', values: { loyalty: D }, fx: [
        note('“샤치, 펭귄, 이번엔 이름표 바꾸지 마!” 안에서 두 사람이 동시에 대답했다. 흰곰 베포는 제 옷의 지퍼가 털을 물자 또 미안하다고 했다. 이번에는 지퍼한테였다.')] },
      { label: '세탁부 곁에서 잠수함이 잠기는 걸 지켜본다', hint: '물속에서도 작업이 돌아가는 소리가 난다', values: { inquiry: D }, fx: [
        note('해치가 닫히자 발아래로 둥근 창들이 지나갔다. 흰 수술등 아래 모자를 쓴 선장이 손을 씻고 있었다. 배의 노란 등이 물빛 속에서 차례로 꺼졌다.')] },
    ],
  },
  {
    id: 'gl_quayside_feast', kind: 'door', when: [age(7), st('child', ...GROWN), ashore, postalPorts],
    weight: 8, repeat: 'once', speaker: 'hero',
    title: '식탁이 짧으면 잔교를 쓰지', body: '고깃집 주방장이 마지막 꼬치를 들고 나오자 긴 식탁의 다리가 부러졌다. 누군가 널빤지를 잔교 위에 쭉 깔았다. 금세 뼈 달린 고기가 줄을 이었고 술통에서는 국자로 술을 떴다. 아이들 몫은 거품이 똑같이 나는 사과주스였다.',
    doors: [
      { label: '고기 산에서 제일 큰 뼈를 골라 잡는다', hint: '반대편에서도 같은 뼈를 잡은 사람이 있다', meal: true, values: { freedom: D },
        fx: [note('뼈 하나를 마주 물고 끝까지 뜯다 보니 건너편 사람과 코끝이 닿았다. 두 사람 다 웃음을 참지 못해 남은 고기를 접시에 떨어뜨렸다.')] },
      { label: '술통을 굴려 와 어른들 건배에 끼어든다', hint: '첫 잔은 부엌에서 땀 흘린 사람에게 돌린다', when: [age(19)], meal: true, values: { loyalty: D },
        fx: [note('술을 푸던 국자까지 잔에 부딪쳐 땡 하고 울렸다. 밤새 술통 세 개가 비었고 마지막 통은 뒤집어서 북으로 썼다.')] },
      { label: '빈 접시 두 장으로 박자를 맞춘다', hint: '노래를 몰라도 한몫할 수 있다', values: { romance: D }, fx: [note('주방장은 칼등으로 도마를 두드리고 생선 장수는 국자를 흔들었다. 후렴이 올 때마다 입 안 가득 고기를 문 사람들이 엉뚱한 음을 냈다.')] },
    ],
  },
];
