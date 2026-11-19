// 자잘한 일 (설계 5.2 분류표: 일상의 다툼과 화해, 부탁, 잡졸과의 시비, 장비 교체, 치료, 작은 내기, 생활비, 어느 일을 맡을지).
// 되돌릴 수 없는 일은 자잘한 일이 아니다: fx에 standing, loseLimb, die, fight를 쓰지 않는다.
// 기록이 한 줄로 끝나도록 스스로 기록을 남기는 효과(log, mark, mastery)도 쓰지 않는다.
// 결과마다 lean이 가치관 쪽으로 기울이고, lean이 빈 결과는 누구에게나 일어날 수 있다. 결과마다 글이 둘 이상이다.
// 글이 형제 · 배우자 · 부모 · 헤엄을 전제하면 needs에 적는다 (일 전체면 일에, 그 결과만이면 결과에).
// 물러서는 결과에는 맞서는 가치관이, 맞서는 결과에는 평온이 깊으면 고르지 않는 조건(when)을 붙인다.
// 해적 · 해군 · 혁명군은 처지가 배를 전제하므로 'ship'을 따로 적지 않는다.
// id는 전환점과 seen을 함께 쓰므로 'm_'로 시작한다 (기존 시비 사건 'brawl'만 예외).
// 자리표시: {name} 이름만, {town} 자란 마을, {island} 지금 있는 섬, {parent} 살아 있는 부모의 호칭
import type { Cond, Minor, SeaId, Standing, ValueId } from '../core/types';
import { beforeHistory } from './turnings/paths';
import { HOME_MINORS } from './minors-homes';
import { landlockedMinor } from './landlocked';

const kid: Cond = { c: 'age', min: 3, max: 15 };
const young: Cond = { c: 'age', min: 5, max: 12 };
const adult: Cond = { c: 'age', min: 16 };
const old: Cond = { c: 'age', min: 45 };
const FREE: Standing[] = ['civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'retired'];
const free: Cond = { c: 'standing', is: FREE };
const ashore: Cond = { c: 'standing', is: ['civil', 'shipwright', 'settled', 'bountyHunter', 'retired'] };
const crew: Cond = { c: 'standing', is: ['pirate', 'marine', 'revolution'] };
const equippedWeapon: Cond = { c: 'equippedWeapon' };
const st = (...is: Standing[]): Cond => ({ c: 'standing', is });
const money = (min: number): Cond => ({ c: 'money', min });
/** 이 가치관이 깊으면 이 결과는 고르지 않는다 */
const not = (id: ValueId): Cond => ({ c: 'value', id, deep: false });
const calm = [not('dominion')];               // 물러서는 결과
const fierce = [not('peace')];                // 맞서는 결과

// ---------------- 저절로 지나가는 원작의 만남 (과제 10)
type Out = Minor['outcomes'][number];
/** 연표에 원작 표시를 남기는 결과 */
const met = (canon: string, mark: string, lean: Out['lean'], text: string[], fx: Out['fx'] = []): Out =>
  ({ lean, text, fx: [...fx, { op: 'timeline', text: mark, canon }] });
const inTown = (name: string, min: number, max: number): Cond[] => [{ c: 'town', is: [name] }, { c: 'island', is: [name] }, { c: 'age', min, max }];
const atSeaAge = (seas: SeaId[], min: number, max?: number): Cond[] => [{ c: 'sea', is: seas }, { c: 'age', min, max }];
const ONCE = 99;
function canonPassing(): Minor[] {
  return [
    { id: 'm_cn_dadan', when: [{ c: 'town', is: ['후샤 마을', '고아 왕국 그레이 터미널'] }, { c: 'age', min: 5, max: 12 }, st('child')], weight: 6, cooldownYears: ONCE,
      outcomes: [
        met('dadan', '코르보 산의 산적 일가에게 혼쭐이 났다', { freedom: 1 }, ['코르보 산에 몰래 들어갔다가 산적 일가의 여두목에게 귀를 잡혀 끌려 나왔다.', '산적 소굴의 고기를 훔치다 걸려 장작을 한 짐 패고서야 풀려났다.']),
        met('dadan', '코르보 산의 산적 일가에게 감자를 얻었다', { romance: 1 }, ['길 잃은 산적 일가의 꼬마를 소굴까지 데려다주고 찐 감자를 얻었다.', '산적 일가의 빨래를 거들어 주고 감자 한 바구니를 받아 왔다.']),
        met('dadan', '코르보 산의 산적 일가를 멀리서 보았다', {}, ['코르보 산 쪽에서 산적들이 아이들을 쫓아다니며 고함치는 소리가 들렸다.', '산적 일가의 여두목이 시장에서 술을 잔뜩 사 가는 것을 보았다.']),
      ] },
    { id: 'm_cn_makino', when: [...inTown('후샤 마을', 3, 12), st('child')], weight: 6, cooldownYears: ONCE,
      outcomes: [
        met('makino', '마키노의 술집에서 우유를 얻어 마셨다', { romance: 1 }, ['마키노의 술집 구석에 앉아 해적들의 노래를 들으며 우유를 마셨다.', '마키노가 내준 우유를 마시며 술집에 걸린 해도를 오래 올려다보았다.']),
        met('makino', '마키노의 술집 일을 거들었다', { peace: 1 }, ['마키노의 술집에서 빈 잔을 나르고 사과 하나를 얻었다.', '비 오는 날 마키노의 술집 앞 물웅덩이를 메워 주었다.']),
        met('makino', '마키노의 술집 앞을 지났다', {}, ['마키노의 술집 창문 너머로 웃음소리가 흘러나왔다.', '마키노가 술집 앞을 쓸며 손을 흔들어 주었다.']),
      ] },
    { id: 'm_cn_helmeppo', when: [...inTown('셸스 타운', 8, 15)], weight: 6, cooldownYears: ONCE,
      outcomes: [
        met('helmeppo', '대령 집 도련님 앞에서 고개를 숙이지 않았다', { freedom: 0.5, justice: 0.5 }, ['개를 끌고 거들먹거리는 대령 집 도련님 앞에서 끝내 고개를 숙이지 않았다.', '대령 집 도련님이 노점 과일을 걷어차자 똑바로 노려보았다.']),
        met('helmeppo', '대령 집 도련님 앞에서 고개를 숙였다', { peace: 1 }, ['대령 집 도련님이 지나갈 때 다른 사람들처럼 길가로 비켜섰다.', '대령 집 도련님 눈에 띄지 않게 골목으로 돌아갔다.']),
        met('helmeppo', '대령 집 도련님이 거리를 휘젓는 것을 보았다', {}, ['대령 집 도련님이 병사들을 거느리고 장터를 한 바퀴 돌았다.', '대령 집 도련님이 아버지에게 이른다며 소리치는 것을 들었다.']),
      ] },
    { id: 'm_cn_usopp', when: [...inTown('시럽 마을', 5, 15)], weight: 6, cooldownYears: ONCE,
      outcomes: [
        met('usopp', '거짓말쟁이 소년과 함께 해적이 온다고 외쳤다', { romance: 1 }, ['코 긴 소년을 따라 해적이 쳐들어온다고 외치며 마을을 한 바퀴 돌았다.', '코 긴 소년이 지어낸 거대 금붕어 이야기에 밤늦도록 맞장구를 쳤다.']),
        met('usopp', '거짓말쟁이 소년에게 거짓말은 그만두라고 했다', { justice: 1 }, ['해적이 온다고 외치는 코 긴 소년에게 사람들이 지쳤다고 말해 주었다.', '거짓말에 속은 할머니 편을 들어 코 긴 소년에게 사과하라고 했다.']),
        met('usopp', '해적이 쳐들어온다는 외침을 들었다', {}, ['아침부터 해적이 쳐들어온다는 외침이 들렸다. 오늘도 거짓말이었다.', '빗자루를 든 어른들이 코 긴 소년을 쫓아 언덕을 뛰어 올라갔다.']),
      ] },
    { id: 'm_cn_bellemere', when: [...inTown('코코야시 마을', 3, 9)], weight: 6, cooldownYears: ONCE,
      outcomes: [
        met('bellemere', '귤밭의 벨메일에게 귤을 얻었다', { justice: 1 }, ['귤밭의 벨메일이 담배를 물고 귤 한 아름을 안겨 주었다.', '벨메일의 귤밭에서 잡초를 뽑아 주고 귤을 얻었다.']),
        met('bellemere', '귤밭의 두 자매와 뛰어놀았다', { freedom: 1 }, ['귤밭의 주황 머리 아이와 언덕을 뛰어다니다 해 지는 줄 몰랐다.', '귤밭의 두 자매와 숨바꼭질을 하다 벨메일에게 다 같이 혼났다.']),
        met('bellemere', '귤밭 언덕을 지났다', {}, ['귤밭 언덕에서 벨메일이 두 아이를 부르는 소리가 들렸다.', '귤 향기가 나는 언덕길을 지나 집으로 돌아왔다.']),
      ] },
    { id: 'm_cn_smoker', when: [...inTown('로그타운', 12, 15)], weight: 6, cooldownYears: ONCE,
      outcomes: [
        met('smoker', '시가 두 대를 문 해군을 따라 걸었다', { justice: 1 }, ['시가 두 대를 문 해군이 광장을 지나가자 몇 걸음 떨어져 따라 걸었다.', '흰 연기를 뿜는 해군에게 처형대가 왜 아직 있느냐고 물어보았다.']),
        met('smoker', '시가 두 대를 문 해군을 피해 골목으로 숨었다', { freedom: 1 }, ['시가 연기 냄새가 나자 골목으로 숨었다. 해적 흉내를 내던 참이었다.', '흰 연기를 뿜는 해군이 지나갈 때 뒷골목 아이들과 함께 흩어졌다.']),
        met('smoker', '시가 두 대를 문 해군이 광장을 지나가는 것을 보았다', {}, ['시가 두 대를 문 해군이 처형대 앞을 지나갔다.', '광장에 흰 연기 냄새가 오래 남았다.']),
      ] },
    { id: 'm_cn_sanji', when: [...atSeaAge(['east'], 14, 17), beforeHistory('loguetownStorm')], weight: 4, cooldownYears: ONCE,
      outcomes: [
        met('sanji', '발라티에의 금발 요리사에게 볶음밥을 얻어먹었다', { romance: 1 }, ['돈 없이 발라티에에 들렀다가 금발의 요리사가 내준 볶음밥을 먹었다.', '발라티에의 금발 요리사가 배고프면 언제든 오라며 뒷문을 열어 주었다.']),
        met('sanji', '발라티에에서 밥값을 치렀다', { justice: 1 }, ['발라티에에서 밥을 먹고 요리사가 받지 않겠다는 밥값을 탁자에 두고 나왔다.', '발라티에의 요리사들 싸움을 구경하다 밥값을 넉넉히 치렀다.']),
        met('sanji', '바다 위의 식당을 지나쳤다', {}, ['바다 위의 식당 발라티에에서 요리사들의 고함이 들려왔다.', '물고기 모양의 식당이 수평선에서 반짝였다.']),
      ] },
    { id: 'm_cn_luffy_poster', when: [{ c: 'age', min: 17, max: 18 }, st('civil', 'pirate', 'marine', 'bountyHunter', 'shipwright', 'settled', 'revolution', 'child')], weight: 4, cooldownYears: ONCE,
      outcomes: [
        met('luffy', '밀짚모자의 첫 수배서를 보았다', { romance: 1 }, ['게시판에 붙은 밀짚모자의 첫 수배서를 한참 들여다보았다. 활짝 웃는 얼굴이었다.', '밀짚모자의 수배서를 떼어 품에 넣었다.']),
        met('luffy', '밀짚모자의 수배서를 보고 혀를 찼다', { justice: 1 }, ['새로 붙은 밀짚모자 해적의 수배서를 보고 세상이 어지럽다고 혀를 찼다.', '수배서 속 밀짚모자의 웃음이 어딘지 불길하게 보였다.']),
        met('luffy', '새 수배서들이 붙었다', {}, ['게시판에 새 수배서가 붙었다. 밀짚모자를 쓴 소년이었다.', '이스트 블루에서 새 해적이 나왔다는 소문이 돌았다.']),
      ] },
    { id: 'm_cn_laboon', when: [...atSeaAge(['gl_entry'], 16)], weight: 5, cooldownYears: ONCE,
      outcomes: [
        met('laboon', '붉은 산 아래의 거대한 고래와 마주쳤다', { romance: 1 }, ['붉은 산을 넘자 머리에 상처투성이인 거대한 고래가 붉은 벽을 향해 울부짖고 있었다.', '쌍둥이 곶의 늙은 등대지기에게 쉰 해째 옛 선원들을 기다리는 고래 이야기를 들었다.']),
        met('laboon', '거대한 고래의 머리를 치료하는 의사를 도왔다', { loyalty: 1 }, ['쌍둥이 곶의 늙은 의사를 도와 고래 머리의 상처에 약을 발랐다.', '붉은 벽에 머리를 박는 고래를 달래려 하루 종일 노래를 불러 주었다.']),
        met('laboon', '거대한 고래의 울음을 들었다', {}, ['붉은 산 아래 바다에서 고래의 울음이 길게 울렸다.', '쌍둥이 곶의 등대가 고래의 그림자에 가렸다.']),
      ] },
    { id: 'm_cn_mihawk', when: [...atSeaAge(['east', 'gl_entry', 'gl_first'], 16)], weight: 3, cooldownYears: ONCE,
      outcomes: [
        met('mihawk', '관 모양의 작은 배를 탄 검사를 보았다', { ambition: 1 }, ['관 모양의 작은 배가 지나갔다. 등에 커다란 칼을 멘 사내가 매의 눈으로 이쪽을 보았다.', '세계 최강의 검사라는 사내의 배가 지나가자 뱃사람들이 숨을 죽였다.']),
        met('mihawk', '관 모양의 배를 피해 뱃머리를 돌렸다', { peace: 1 }, ['관 모양의 작은 배가 보이자 배 위의 모두가 말없이 뱃머리를 돌렸다.', '매의 눈을 한 검사의 배를 피해 섬 그늘에 숨었다.']),
        met('mihawk', '세계 최강의 검사가 지나갔다는 소문을 들었다', {}, ['관 모양의 배를 탄 검사가 근처 바다를 지났다는 소문이 돌았다.', '해적선 하나가 반으로 갈라져 떠내려왔다. 누구의 짓인지는 다들 알았다.']),
      ] },
    { id: 'm_cn_bonney', when: [...atSeaAge(['sabaody'], 17)], weight: 4, cooldownYears: ONCE,
      outcomes: [
        met('bonney', '샤본디의 식당에서 피자를 다투었다', { dominion: 1 }, ['샤본디의 식당에서 분홍 머리 여자가 남의 피자까지 먹어 치우기에 접시를 끌어당겼다.', '분홍 머리 여자와 마지막 피자 한 판을 두고 눈싸움을 벌였다.']),
        met('bonney', '샤본디의 식당에서 피자를 양보했다', { peace: 1 }, ['분홍 머리 여자가 피자 스무 판째를 먹는 것을 보고 제 몫을 밀어 주었다.', '식당의 자리를 두고 다투는 해적들을 피해 밖에서 먹었다.']),
        met('bonney', '샤본디에 이름난 해적들이 모였다', {}, ['샤본디의 식당 구석에서 분홍 머리 여자가 피자를 쌓아 놓고 먹고 있었다.', '샤본디에 현상금 1억이 넘는 해적들이 모였다는 소문이 돌았다.']),
      ] },
    { id: 'm_cn_jinbe_kids', when: [...atSeaAge(['sabaody', 'nw_first'], 17), { c: 'island', is: ['어인섬'] }], weight: 5, cooldownYears: ONCE,
      outcomes: [
        met('jinbe', '어인섬의 아이들에게 인간의 노래를 가르쳤다', { romance: 1 }, ['어인섬의 해변에서 인간을 처음 본 아이들에게 이스트 블루의 노래를 가르쳤다.', '어인섬 아이들의 정권 지르기 수련을 끝까지 구경해 주었다.']),
        met('jinbe', '어인 가라테 수련을 어깨너머로 배웠다', { ambition: 1 }, ['고래상어 어인이 아이들에게 가르치는 정권 지르기를 어깨너머로 따라 했다.', '물을 쳐서 멀리 보내는 어인 가라테를 몰래 흉내 내 보았다.']),
        met('jinbe', '바다 밑의 섬을 걸었다', {}, ['바다 밑 섬의 빛나는 나무들 사이를 걸었다.', '인어들이 지나가며 인간을 신기하게 쳐다보았다.']),
      ] },
    { id: 'm_cn_colosseum', when: [...atSeaAge(['nw_first'], 18), { c: 'island', is: ['드레스로자'] }, beforeHistory('dressrosaFree')], weight: 5, cooldownYears: ONCE,
      outcomes: [
        met('kyros', '외다리 장난감 병정의 싸움에 돈을 걸었다', { ambition: 1 }, ['콜로세움에서 외다리로 싸우는 장난감 병정에게 돈을 걸었다. 병정이 이겼다.', '외다리 병정의 싸움을 보며 함성을 질렀다.']),
        met('kyros', '외다리 장난감 병정에게 빵을 나눠 주었다', { peace: 1 }, ['콜로세움 뒷골목에서 외다리 장난감 병정에게 빵 한 조각을 나눠 주었다.', '장난감 병정이 넘어지자 손을 내밀어 일으켜 주었다.']),
        met('kyros', '콜로세움의 함성을 들었다', {}, ['콜로세움 쪽에서 큰 함성이 들렸다.', '드레스로자의 거리에서 장난감 병정 하나가 아이를 지켜보고 있었다.']),
      ] },
    { id: 'm_cn_wano', when: [...atSeaAge(['nw_late'], 18), { c: 'island', is: ['와노쿠니'] }, beforeHistory('wanoFree')], weight: 5, cooldownYears: ONCE,
      outcomes: [
        met('wano', '어묵 냄비를 짊어진 무사에게 어묵을 얻었다', { romance: 1 }, ['꽃의 도읍 뒷길에서 어묵 냄비를 짊어진 털북숭이 무사에게 어묵 한 꼬치를 얻었다.', '어묵 냄비를 진 무사가 스무 해 전의 영주 이야기를 하다 울었다.']),
        met('wano', '쫓기는 무사를 숨겨 주었다', { loyalty: 1 }, ['쇼군의 순찰에 쫓기는 무사를 쌀가마 뒤에 숨겨 주었다.', '산속으로 가는 무사에게 주먹밥을 싸 주었다.']),
        met('wano', '꽃의 도읍을 걸었다', {}, ['꽃의 도읍의 축제 불빛 아래를 걸었다.', '어묵 냄새가 나는 거리에서 사무라이들이 칼자루에 손을 얹고 지나갔다.']),
      ] },
  ];
}

export const MINORS: Minor[] = ([
  // ======================================================== 어린 시절 (3~15살)
  {
    id: 'm_kid_quarrel', when: [kid], weight: 10, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['싸운 친구의 집 앞까지 찾아가 먼저 사과했다.', '다툰 친구가 혼날 때 옆에 서서 같이 꾸중을 들었다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['말다툼 끝에 친구를 밀쳐 넘어뜨렸다.', '말싸움에서 지자 친구의 연을 빼앗아 버렸다.'], fx: [] },
      { lean: { peace: 0.6 }, text: ['다툰 친구에게 아끼던 사탕을 내밀며 화해했다.', '다툰 친구와 나란히 앉아 말없이 노을을 보다가 풀었다.'], fx: [] },
      { lean: {}, text: ['친구와 다투고 사흘 동안 말을 하지 않았다.', '사소한 일로 친구와 토라졌다가 저녁 무렵 다시 놀았다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_errand', when: [kid], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['이웃 아주머니의 장바구니를 집까지 들어다 드렸다.', '이웃 할아버지의 그물을 바닷가까지 날라다 드렸다.'], fx: [{ op: 'money', add: 100 }] },
      { lean: { freedom: 1 }, text: ['심부름 가던 길에 바닷가로 새 버렸다가 꾸중을 들었다.', '심부름 돈으로 사탕을 사 먹고 시치미를 뗐다.'], fx: [] },
      { lean: {}, text: ['{town} 시장에 심부름을 다녀왔다.', '빵집 심부름을 하고 덤으로 빵 한 조각을 얻었다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_marbles', when: [kid], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['구슬치기 내기에서 골목 아이들의 구슬을 모두 땄다.', '팽이 싸움에서 골목 아이들의 팽이를 모두 쓰러뜨렸다.'], fx: [] },
      { lean: { peace: 1 }, text: ['내기는 싫다며 구슬치기를 구경만 했다.', '내기 대신 혼자 구슬을 굴리며 놀았다.'], fx: [] },
      { lean: { romance: 1 }, text: ['딴 구슬을 잃은 아이에게 도로 나눠 주었다.', '가장 예쁜 구슬을 좋아하는 아이에게 몰래 건넸다.'], fx: [] },
      { lean: {}, text: ['구슬치기 내기에서 아끼던 유리구슬을 잃었다.', '팽이 내기에서 아끼던 팽이를 잃었다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_older_boys', when: [kid], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['어린 아이를 놀리던 큰 아이들에게 대들었다가 흠씬 맞았다.', '놀림받는 아이 앞을 막아섰다가 코피가 터졌다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: { peace: 1 }, when: calm, text: ['시비를 거는 큰 아이들을 피해 먼 길로 돌아서 집에 갔다.', '큰 아이들이 모인 골목을 지나지 않으려고 바닷가로 돌아갔다.'], fx: [] },
      { lean: { dominion: 1 }, when: fierce, text: ['시비를 거는 큰 아이의 정강이를 걷어차고 달아났다.', '시비 거는 큰 아이에게 모래를 한 줌 뿌리고 달아났다.'], fx: [] },
      { lean: {}, text: ['큰 아이들이 시비를 걸어 와 뛰어서 달아났다.', '큰 아이들에게 딱지를 빼앗기고 울며 돌아왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_scrape', when: [kid], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['넘어져 무릎이 까진 뒤로 며칠 얌전히 지냈다.', '삔 발목에 천을 감고 사흘 동안 집에서 그림책만 봤다.'], fx: [{ op: 'hp', add: 3 }] },
      { lean: { ambition: 0.6, freedom: 0.4 }, text: ['무릎이 까진 채로 다음 날 또 뛰어나갔다.', '팔꿈치에 피가 맺힌 채로 나무 타기를 계속했다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: {}, text: ['넘어져 까진 무릎에 약초를 짓이겨 붙였다.', '넘어져 깨진 무릎을 바닷물에 씻고 볕에 말렸다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_bookshop', when: [kid], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['책방 구석에서 찾은 낡은 항해 일지를 밤새 읽었다.', '책방 주인에게 해도의 기호가 무슨 뜻인지 하나씩 물었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['책을 펴 놓고 창밖으로 지나가는 배만 바라보았다.', '책방에 간다고 하고 언덕에서 놀다 왔다.'], fx: [] },
      { lean: {}, text: ['책방 주인이 빌려준 그림책을 돌려주러 갔다.', '책방 문 앞 의자에서 그림책을 넘기다 졸았다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_lean_supper', when: [kid, { c: 'wealth', max: 'poor' }], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['모아 둔 동전을 몰래 쌀독에 넣어 두었다.', '제 몫의 감자를 반으로 쪼개 옆집 꼬마에게 주었다.'], fx: [{ op: 'money', add: -100 }] },
      { lean: { ambition: 1 }, text: ['묽은 죽에서 콩 한 알을 건졌다. 나중에 식당을 열면 국자로 한 번 뜰 때마다 콩이 수북이 담기게 하리라 마음먹었다.', '빈 그릇을 배 삼아 숟가락으로 노를 저었다. 배 한 척을 사서 직접 잡은 생선으로 죽을 끓이는 상상을 했다.'], fx: [] },
      { lean: {}, text: ['저녁이 묽은 죽 한 그릇뿐이었다.', '배가 고파 잠이 오지 않는 밤이었다.'], fx: [{ op: 'hp', add: -2 }] },
    ],
  },
  {
    // 무기를 쥐는 일은 그 길로 기운 아이(또는 아직 길이 없는 아이)에게만, 하면 그 길이 더 좋아진다 (선호도)
    id: 'm_kid_wooden_sword', when: [kid, { c: 'path', is: ['sword', 'none'] }], weight: 6, cooldownYears: 2,
    outcomes: [
      { lean: { ambition: 1 }, text: ['부러진 목검 대신 단단한 떡갈나무로 새 목검을 깎았다.', '목검 손잡이가 닳도록 휘둘러 새 천을 감았다.'], fx: [{ op: 'pref', branch: 'sword', add: 3 }] },
      { lean: { romance: 1 }, text: ['주워 온 나무 막대에 이름을 새기고 보물처럼 아꼈다.', '목검에 바다의 이름을 붙이고 매일 밤 머리맡에 두었다.'], fx: [{ op: 'pref', branch: 'sword', add: 2 }] },
      { lean: {}, text: ['쓰던 나무칼이 부러져 바닷가에서 새 막대를 주워 왔다.', '목검을 바위에 부딪쳐 끝이 쪼개졌다.'], fx: [{ op: 'pref', branch: 'sword', add: 1 }] },
    ],
  },
  {
    id: 'm_kid_stray', when: [kid], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['비 맞은 떠돌이 고양이에게 생선 대가리를 나눠 주었다.', '다리를 저는 갈매기에게 물과 생선 부스러기를 챙겨 주었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['떠돌이 개에게 돌을 던지던 아이들을 말렸다.', '고양이 꼬리에 깡통을 묶은 아이들에게 그만두라고 소리쳤다.'], fx: [] },
      { lean: {}, text: ['떠돌이 개에게 쫓겨 담장 위로 기어올랐다.', '골목 고양이에게 손등을 할퀴었다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_odd_job', when: [{ c: 'age', min: 8, max: 15 }], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['어른들도 꺼리는 생선 상자 나르기를 자청했다.', '새벽 경매장의 얼음 나르는 일을 끝까지 버텼다.'], fx: [{ op: 'money', add: 500 }, { op: 'hp', add: -2 }] },
      { lean: { inquiry: 1 }, text: ['항구 사무소에서 장부 옮겨 적는 일을 거들었다.', '배 짐표를 대조하는 일을 맡아 숫자를 맞췄다.'], fx: [{ op: 'money', add: 300 }] },
      { lean: {}, text: ['그물 손질을 거들고 동전 몇 닢을 받았다.', '어시장 바닥을 쓸고 동전 몇 닢을 받았다.'], fx: [{ op: 'money', add: 300 }] },
    ],
  },
  {
    id: 'm_kid_lost_child', when: [kid], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 0.5 }, text: ['울고 있는 길 잃은 꼬마의 손을 잡고 집을 찾아 주었다.', '엄마를 찾는 꼬마를 업고 장터를 세 바퀴 돌았다.'], fx: [] },
      { lean: { peace: 1 }, text: ['길 잃은 꼬마를 어른에게 데려다주고 돌아왔다.', '길 잃은 꼬마 곁에 앉아 엄마가 올 때까지 같이 기다렸다.'], fx: [] },
      { lean: {}, text: ['장터에서 길 잃은 꼬마를 보았지만 곧 엄마가 데려갔다.', '길 잃은 꼬마가 우는 소리에 돌아봤지만 금세 어른이 달려왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_stray_pup', when: [kid], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['비에 젖은 강아지를 안아다 헛간에 몰래 숨겨 주었다.', '굶주린 강아지에게 아껴 둔 빵을 다 나눠 주었다.'], fx: [] },
      { lean: { dominion: 1 }, when: fierce, text: ['으르렁대는 들개에게 막대기를 휘둘러 골목 밖으로 쫓아 버렸다.', '먹이를 탐내는 들개 앞에서 물러서지 않고 소리를 질러 내쫓았다.'], fx: [] },
      { lean: { peace: 1 }, when: calm, text: ['개가 짖어 대는 골목을 피해 다른 길로 돌아갔다.', '들개가 다가오자 가만히 서서 지나가기를 기다렸다.'], fx: [] },
      { lean: {}, text: ['길 잃은 강아지를 쫓아다니다 해가 저물었다.', '강아지와 골목에서 한참 술래잡기를 했다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_bottle', when: [kid], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['바닷가에 밀려온 유리병 속 쪽지의 낯선 글자를 베껴 두었다.', '유리병에 든 해도 조각을 들여다보며 어느 바다인지 짐작해 보았다.'], fx: [] },
      { lean: { romance: 1 }, text: ['유리병에 소원을 적은 종이를 넣어 파도에 띄웠다.', '바다 건너 온 유리병을 보물 상자에 넣어 두었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['유리병이 흘러온 쪽을 따라 해안을 끝까지 걸어가 보았다.', '유리병을 주운 날 뗏목을 만들겠다며 판자를 모았다.'], fx: [] },
      { lean: {}, text: ['바닷가에서 예쁜 유리병을 주워 깨끗이 씻었다.', '모래에 박힌 빈 병을 주워 물을 채우고 놀았다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_dojo_peek', when: [kid], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['어른들의 수련을 어깨너머로 보고 밤늦도록 혼자 따라 했다.', '담장 너머로 본 자세를 나뭇가지로 백 번 따라 했다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['같이 훔쳐보던 친구가 들키자 함께 나서서 꾸중을 들었다.', '담장에서 떨어진 친구를 부축해 같이 도망쳤다.'], fx: [] },
      { lean: { justice: 1 }, text: ['약한 수련생을 괴롭히는 큰 수련생에게 담장 위에서 그러지 말라고 외쳤다.', '대련에서 반칙하는 것을 보고 사범에게 일렀다.'], fx: [] },
      { lean: {}, text: ['담장 틈으로 어른들의 대련을 구경하다 돌아왔다.', '기합 소리가 울리는 마당을 한참 넋 놓고 보았다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_harbor_sailor', when: [kid], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['배에서 내린 선원에게 거인과 하늘섬 이야기를 들으며 눈을 반짝였다.', '늙은 항해사의 허풍을 해 질 때까지 따라다니며 들었다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['정박한 배의 나침반이 어떻게 생겼는지 선원에게 꼬치꼬치 물었다.', '선원들에게 매듭 묶는 법을 하나씩 배웠다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['밧줄을 감던 선원이 모자를 씌워 주었다. 눈을 덮는 챙을 한 손으로 받쳐 들고 선장 흉내를 냈다.', '배에서 가장 힘센 선원에게 팔씨름을 걸었다가 손등이 바닥에 닿았다.'], fx: [] },
      { lean: {}, text: ['배 둘레를 맴돌다 선원이 던져 준 사과를 받아먹었다.', '항구에 들어온 큰 범선을 구경하며 오후를 보냈다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_hideout', when: [kid], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { freedom: 1 }, text: ['아무도 모르는 절벽 아래 동굴에 비밀 기지를 꾸몄다.', '숲에서 가장 높은 나무 위에 혼자만의 자리를 만들었다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['비바람에 무너진 비밀 기지 지붕을 친구들 몫까지 고쳐 놓았다.', '비밀 기지에 숨겨 둔 과자를 친구들이 올 때까지 손대지 않았다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['뒷산 빈 오두막을 차지하고 들어오려는 아이들에게 조개껍데기를 받았다.', '가장 좋은 놀이터를 기지로 삼고 다른 패거리를 쫓아냈다.'], fx: [] },
      { lean: {}, text: ['나무 상자와 판자를 모아 풀숲에 작은 기지를 지었다.', '비밀 기지에 누워 구름을 보다 낮잠을 잤다.'], fx: [] },
    ],
  },
  // ---------------- v4 어린 시절 사건에서 (ch_errand, ch_storm, ch_chest)
  {
    id: 'm_kid_chores', when: [young], needs: ['parent'], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['{parent} 대신 그물 손질을 끝내 놓고 저녁상을 차렸다.', '{parent}가 장에 간 사이 빨래를 다 걷어 개 두었다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['{parent} 가게의 장부를 들여다보며 숫자 맞추는 법을 익혔다.', '{parent}에게 생선 값 매기는 법을 물어 수첩에 적었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['집안일을 하다 말고 몰래 빠져나가 바닷가에서 놀았다.', '그물 손질을 하라는 말을 못 들은 척 언덕으로 달아났다.'], fx: [] },
      { lean: {}, text: ['{parent}를 도와 그물을 깁다 손가락을 찔렸다.', '{parent}를 도와 하루 종일 생선을 말렸다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_storm_night', when: [young], needs: ['parent'], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['폭풍이 치는 밤, 이웃 꼬마들을 우리 집 다락으로 데려와 재웠다.', '폭풍 속에 혼자 사는 이웃 할머니 집 덧문을 걸어 드렸다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['폭풍이 치는 밤, {parent}와 함께 날아가려는 지붕을 밤새 붙잡았다.', '{parent} 곁에서 물에 잠긴 마당의 물을 밤새 퍼냈다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { peace: 1 }, text: ['폭풍이 지나가길 기다리며 이불을 뒤집어쓰고 숨죽였다.', '덜컹거리는 창문 소리를 들으며 {parent} 품에서 잠들었다.'], fx: [] },
      { lean: {}, text: ['폭풍이 지나간 아침, 부서진 울타리 조각을 주워 모았다.', '폭풍에 쓰러진 나무를 보러 동네 아이들과 몰려갔다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_sand_chest', when: [young], weight: 4, cooldownYears: 3,
    outcomes: [
      { lean: { ambition: 1 }, text: ['모래톱에서 파낸 낡은 상자 속 동전을 모아 첫 저금을 했다.', '상자에서 나온 은화 몇 닢을 팔아 용돈으로 삼았다.'], fx: [{ op: 'money', add: 300 }] },
      { lean: { justice: 1 }, text: ['모래톱에서 찾은 상자를 촌장에게 가져가 주인을 찾게 했다.', '상자에 새겨진 이름을 보고 주인을 찾아 항구를 돌았다.'], fx: [] },
      { lean: { romance: 1 }, text: ['썰물 뒤 모래톱에서 파낸 녹슨 상자를 보물처럼 침대 밑에 숨겼다.', '상자에서 나온 낡은 나침반을 목에 걸고 다녔다.'], fx: [] },
      { lean: {}, text: ['썰물 뒤 모래톱에서 낡은 상자를 파냈는데 안은 비어 있었다.', '모래톱의 상자를 열어 보니 젖은 헝겊만 가득했다.'], fx: [] },
    ],
  },

  // ======================================================== 어른 (16살부터)
  {
    id: 'brawl', when: [adult, free], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1, ambition: 0.3 }, when: fierce, text: ['길목의 시비에 끼어들어 주먹을 날렸다.', '시비를 건 사내의 멱살을 잡아 사람들 사이에서 끌어냈다.'], fx: [{ op: 'hp', add: -8 }, { op: 'chance', p: 0.5, then: [{ op: 'fame', add: 1 }] }] },
      { lean: { peace: 1 }, when: calm, text: ['말다툼이 커지기 전에 조용히 자리를 떴다.', '주먹이 오가기 전에 한발 물러나 길을 비켰다.'], fx: [] },
      { lean: {}, text: ['시비가 붙은 사람들 곁에서 한동안 눈치만 살폈다.', '싸움에 휘말려 옷자락만 찢긴 채 빠져나왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_thugs', when: [adult, free], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['노점상을 괴롭히던 건달 둘을 쫓아냈다.', '아이 돈을 뺏던 건달의 팔을 비틀어 돈을 돌려주게 했다.'], fx: [{ op: 'hp', add: -3 }, { op: 'fame', add: 1 }] },
      { lean: { peace: 1 }, when: calm, text: ['건달들의 시비를 웃어넘기고 길을 비켜 주었다.', '건달들이 비키라기에 웃으며 길을 내주었다.'], fx: [] },
      { lean: { greed: 1 }, when: fierce, text: ['길을 막은 건달들을 때려눕히고 가진 돈을 털었다.', '시비 건 건달들을 눕히고 주머니를 털어 갔다.'], fx: [{ op: 'hp', add: -5 }, { op: 'money', add: 2000 }] },
      { lean: {}, text: ['건달들과 멱살잡이를 하다 순찰 해군이 오자 흩어졌다.', '건달들과 실랑이하다 지나가던 순찰대 덕에 풀려났다.'], fx: [{ op: 'hp', add: -2 }] },
    ],
  },
  {
    id: 'm_bet', when: [adult, free, money(3000)], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['길가에 벌어진 카드 내기의 마지막 판에 가진 것을 다 걸었다.', '처음 만난 사람과 주사위 한 판에 가진 돈을 다 걸었다.'],
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 5000 }], else: [{ op: 'money', add: -3000 }] }] },
      { lean: { peace: 1 }, text: ['도박판에 끼라는 말을 정중히 거절했다.', '판돈을 꺼내지 않고 조용히 자리를 떴다.'], fx: [] },
      { lean: { ambition: 0.6, dominion: 0.4 }, text: ['팔씨름 내기에서 부두 장정들을 차례로 꺾었다.', '내기 씨름에서 장정 셋을 연달아 넘기고 판돈을 쓸어 갔다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: {}, text: ['주사위 내기에서 조금 잃고 일어났다.', '카드 내기에서 몇 판을 내리 지고 털고 일어났다.'], fx: [{ op: 'money', add: -1000 }] },
    ],
  },
  {
    id: 'm_rent', when: [adult, ashore], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { freedom: 1 }, text: ['방세가 밀리자 짐을 싸서 더 작은 방으로 옮겼다.', '방세를 아끼려고 지붕 낮은 빈방으로 옮겼다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { romance: 1 }, text: ['집주인 할머니의 지붕을 고쳐 주고 방세를 조금 깎았다.', '집주인 할아버지의 장작을 패 주고 방세를 조금 덜어 냈다.'], fx: [{ op: 'money', add: -1500 }] },
      { lean: {}, text: ['방세를 치르고 나니 주머니가 가벼워졌다.', '밀린 외상값을 갚았다.'], fx: [{ op: 'money', add: -3000 }] },
    ],
  },
  {
    id: 'm_groceries', when: [adult, free], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { greed: 1 }, text: ['생선 장수를 윽박질러 값을 반으로 깎았다.', '바가지를 씌우려는 장사꾼을 노려보아 제값에 샀다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { peace: 1 }, text: ['사정이 딱한 노점에서 일부러 넉넉히 샀다.', '팔리지 않는 할머니의 나물을 몽땅 사 왔다.'], fx: [{ op: 'money', add: -1500 }] },
      { lean: {}, text: ['{island} 시장에서 한 주 먹을 것을 샀다.', '{island} 시장에서 쌀 한 자루와 말린 생선을 샀다.'], fx: [{ op: 'money', add: -1000 }] },
    ],
  },
  {
    id: 'm_gear', when: [adult, free, money(10000)], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { greed: 1 }, text: ['새 여행 가방을 샀다. 돈주머니를 넣을 안주머니부터 확인했다.', '장터에서 비를 맞아도 안쪽까지 젖지 않는 가방을 골랐다.'], fx: [{ op: 'money', add: -8000 }] },
      { lean: { romance: 0.7, loyalty: 0.3 }, when: [equippedWeapon], text: ['{weapon}을(를) 공방에 맡겼다. 장인은 낡은 부분만 손보고 오래된 흠집은 남겨 두었다.', '장인이 손질을 마친 {weapon}을(를) 내밀었다. 손때 묻은 자리가 그대로였다.'], fx: [{ op: 'money', add: -2000 }] },
      { lean: {}, text: ['닳은 장화를 새것으로 바꿨다.', '해진 외투를 새로 맞췄다.'], fx: [{ op: 'money', add: -1500 }] },
    ],
  },
  {
    id: 'm_clinic', when: [adult, free], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 0.5, freedom: 0.5 }, text: ['욱신거리는 상처를 대충 동여매고 그냥 지나갔다.', '덜 아문 상처를 동여매고 수련을 쉬지 않았다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: { peace: 1 }, text: ['열이 내릴 때까지 며칠 푹 쉬었다.', '아픈 곳이 나을 때까지 아무 일도 맡지 않고 쉬었다.'], fx: [{ op: 'hp', add: 10 }] },
      { lean: {}, text: ['욱신거리던 상처를 의원에게 보이고 약을 받았다.', '의원에게 상처를 꿰매고 약값을 치렀다.'], fx: [{ op: 'money', add: -3000 }, { op: 'hp', add: 15 }] },
    ],
  },
  {
    id: 'm_cold', when: [adult], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['감기 기운에도 쉬지 않고 버텼다.', '열이 펄펄 끓는데도 일을 나갔다.'], fx: [{ op: 'hp', add: -10 }] },
      { lean: { peace: 0.6 }, text: ['따뜻한 국을 끓여 먹고 푹 잤다.', '생강차를 끓여 마시고 이불을 뒤집어쓰고 잤다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: {}, text: ['감기에 걸려 며칠 앓았다.', '상한 생선을 먹고 하루를 꼬박 앓았다.'], fx: [{ op: 'hp', add: -6 }] },
    ],
  },
  {
    id: 'm_favor', when: [adult, free], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['이웃의 이삿짐을 하루 종일 날라 주었다.', '앓는 이웃 대신 그 집 그물을 걷어다 주었다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { greed: 1 }, text: ['귀찮은 부탁을 이리저리 핑계 대며 피했다.', '부탁할 일이 있다는 이웃을 보고 슬쩍 다른 골목으로 샜다.'], fx: [] },
      { lean: {}, text: ['부탁받은 편지를 항구 사무소에 전해 주었다.', '부탁받은 짐을 이웃 마을까지 날라 주었다.'], fx: [] },
    ],
  },
  {
    id: 'm_loan', when: [adult, free, money(5000)], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['오랜 친구가 돈을 빌려 달라기에 묻지 않고 내주었다.', '친구의 빚을 대신 갚아 주고 차용증을 찢었다.'], fx: [{ op: 'money', add: -3000 }] },
      { lean: { justice: 0.5 }, text: ['빌려 달라는 돈 대신 일자리를 알아봐 주었다.', '돈을 빌리러 온 친구와 같이 일자리를 알아보러 다녔다.'], fx: [] },
      { lean: {}, text: ['돈을 빌려 달라는 말에 형편이 어렵다며 거절했다.', '빌려 달라는 말에 한참 망설이다 고개를 저었다.'], fx: [] },
    ],
  },
  {
    id: 'm_quarrel', when: [adult, free], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['사소한 일로 다툰 친구와 술 한잔으로 풀었다.', '다툰 친구의 집에 술병을 들고 먼저 찾아갔다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['잔소리하는 친구와 다투고 한동안 발길을 끊었다.', '이래라저래라 하는 친구에게 대꾸하지 않고 떠나 버렸다.'], fx: [] },
      { lean: { peace: 1 }, text: ['언성이 높아지기 전에 먼저 고개를 숙였다.', '말다툼이 길어지자 먼저 웃으며 손을 내밀었다.'], fx: [] },
      { lean: {}, text: ['말다툼 끝에 어색하게 헤어졌다.', '친구와 언성을 높이고 며칠 서먹하게 지냈다.'], fx: [] },
    ],
  },
  {
    id: 'm_job', when: [adult, ashore], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['가장 힘든 하역 일을 자청해 품삯을 두둑이 받았다.', '남들이 꺼리는 밤 하역을 맡아 품삯을 두 배로 받았다.'], fx: [{ op: 'money', add: 2500 }, { op: 'hp', add: -3 }] },
      { lean: { inquiry: 1 }, text: ['고문서 정리하는 일을 맡아 낡은 기록을 읽었다.', '항구 사무소에서 배 짐표 맞추는 일을 맡았다.'], fx: [{ op: 'money', add: 1000 }] },
      { lean: { romance: 1 }, text: ['길모퉁이에서 노래를 부르고 동전을 받았다.', '사람들이 모인 곳에서 이야기꾼 노릇을 하고 동전을 받았다.'], fx: [{ op: 'money', add: 800 }] },
      { lean: {}, text: ['항구에서 짐 나르는 일을 맡아 품삯을 받았다.', '어시장에서 생선 상자를 나르고 일당을 받았다.'], fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'm_rumor', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['지나가던 여행자에게 들은 먼 곳의 소문을 수첩에 적어 두었다.', '길손이 흘린 지명과 길목을 수첩 귀퉁이에 적어 두었다.'], fx: [] },
      { lean: { romance: 0.6, freedom: 0.4 }, text: ['길손의 허풍 섞인 모험담에 밤늦도록 귀를 기울였다.', '먼 곳에 산다는 거인 이야기를 듣고 밤새 잠을 못 이뤘다.'], fx: [] },
      { lean: {}, text: ['지나가는 사람들의 소문을 흘려들었다.', '소문 몇 마디를 듣고 그냥 잊었다.'], fx: [] },
    ],
  },
  {
    id: 'm_bookstall', when: [adult, free, money(2000)], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['헌책방에서 오래된 해도 한 장을 샀다.', '헌책방에서 옛 항해 일지 한 권을 샀다.'], fx: [{ op: 'money', add: -1500 }] },
      { lean: { romance: 1 }, text: ['헌책방에서 낡은 모험 소설 한 권을 샀다.', '헌책방에서 뱃노래를 모은 낡은 악보를 샀다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: {}, text: ['헌책방을 한 바퀴 구경만 하고 나왔다.', '헌책방 주인과 날씨 이야기만 하다 나왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_wallet', when: [adult, free], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 1 }, text: ['주운 지갑을 주인에게 돌려주고 사례도 마다했다.', '주운 돈주머니의 주인을 반나절 찾아다녀 돌려주었다.'], fx: [] },
      { lean: { dominion: 0.6, ambition: 0.4 }, text: ['주운 지갑의 돈을 챙기고 지갑은 바다에 던졌다.', '주운 돈주머니를 찾으러 온 사내를 노려보아 돌려보냈다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: {}, text: ['주운 지갑의 주인을 찾는다는 쪽지를 붙였다.', '주운 지갑을 근처 사람에게 주인을 찾아 달라며 맡겼다.'], fx: [] },
    ],
  },
  {
    id: 'm_pickpocket', when: [adult, free, money(2000)], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 0.6, dominion: 0.4 }, text: ['소매치기를 끝까지 쫓아가 지갑을 되찾았다.', '소매치기의 손목을 낚아채 지갑을 되찾았다.'], fx: [] },
      { lean: { peace: 1 }, text: ['털린 돈은 잊기로 하고 그냥 집으로 갔다.', '도둑맞은 돈은 액땜이라 치고 웃어넘겼다.'], fx: [{ op: 'money', add: -2000 }] },
      { lean: {}, text: ['시장 통에서 소매치기에게 지갑을 털렸다.', '북적이는 부두에서 돈주머니가 사라진 것을 알았다.'], fx: [{ op: 'money', add: -2000 }] },
    ],
  },
  {
    id: 'm_drunk_friend', when: [adult, free], weight: 4, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 0.5 }, text: ['술에 취한 친구를 업고 집까지 데려다주었다.', '취해 쓰러진 친구 곁에서 날이 밝을 때까지 지켰다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['취한 친구를 앉혀 두고 먼저 돌아왔다.', '술주정을 듣다 못해 친구를 두고 밤길을 걸었다.'], fx: [] },
      { lean: {}, text: ['취해서 우는 친구의 넋두리를 새벽까지 들어 주었다.', '취한 친구와 부둣가에 앉아 노래를 불렀다.'], fx: [] },
    ],
  },
  {
    id: 'm_festival', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['항구 축제에서 밤새 춤을 췄다.', '축제 등불 아래서 처음 보는 사람들과 어깨동무를 하고 노래했다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { peace: 1 }, text: ['축제 불꽃을 멀리 언덕에서 바라보았다.', '축제 소리가 들리는 집 앞에 앉아 차를 마셨다.'], fx: [] },
      { lean: { ambition: 0.6, dominion: 0.4 }, text: ['축제 씨름판에 나가 장정들을 넘어뜨렸다.', '축제 힘겨루기에 나가 통나무를 가장 멀리 던졌다.'], fx: [{ op: 'fame', add: 1 }] },
      { lean: {}, text: ['축제 노점에서 구운 오징어를 사 먹었다.', '축제 노점에서 솜사탕을 사 먹었다.'], fx: [{ op: 'money', add: -200 }] },
    ],
  },
  {
    id: 'm_arm_wrestle', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, text: ['힘자랑하던 장정을 바닥에 메다꽂았다.', '팔씨름 판의 왕이라던 사내를 단번에 눌렀다.'], fx: [{ op: 'fame', add: 1 }] },
      { lean: { peace: 1 }, text: ['힘겨루기를 하자는 장정에게 져 주고 웃었다.', '팔씨름을 하자는 말에 손을 내젓고 술 한 잔을 샀다.'], fx: [] },
      { lean: {}, text: ['부두 장정과 팔씨름 한 판을 겨루고 비겼다.', '팔씨름 한 판에 손목이 시큰거렸다.'], fx: [] },
    ],
  },
  {
    id: 'm_letter', when: [adult, free], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['오래 연락이 없던 {town}의 친구에게 편지를 썼다.', '{town}에 두고 온 친구의 생일을 기억해 선물을 부쳤다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['고향에서 온 편지를 읽지 않고 서랍에 넣어 두었다.', '돌아오라는 편지에 답장 대신 지금 있는 섬 이름만 적어 보냈다.'], fx: [] },
      { lean: {}, text: ['쓰다 만 편지를 서랍에 넣어 두었다.', '편지를 쓰려다 첫 줄에서 막혀 그만두었다.'], fx: [] },
    ],
  },
  {
    id: 'm_drowning', when: [adult, free], needs: ['swim'], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 1 }, text: ['파도에 휩쓸린 사람을 보자마자 바다에 뛰어들어 건져 냈다.', '물에 빠졌던 사람의 등을 두드려 물을 토하게 하고 담요를 덮어 주었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['사람이 빠졌는데 구경만 하던 사람들을 꾸짖어 밧줄을 던지게 했다.', '사람을 밀어 빠뜨린 취객을 붙잡아 초소로 끌고 갔다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['모두가 망설이는 거친 물살로 먼저 헤엄쳐 들어갔다.', '소용돌이를 뚫고 사람을 건져 부두 사람들의 박수를 받았다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: {}, text: ['부두에 빠진 사람에게 헤엄쳐 가서 물 밖으로 끌어냈다.', '젖은 옷을 짜며 건져 낸 사람이 숨 쉬는 것을 보고 자리를 떴다.'], fx: [] },
    ],
  },
  {
    id: 'm_old_coin', when: [adult, free], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['우연히 얻은 낡은 주화의 무늬를 알아내려고 헌책방을 다 뒤졌다.', '옛 주화에 새겨진 연호로 사라진 나라를 짐작해 보았다.'], fx: [] },
      { lean: { romance: 1 }, text: ['보물선에서 나왔을지 모를 옛 주화를 부적처럼 목에 걸었다.', '주화 하나를 만지작거리며 몇백 년 전 바다를 그려 보았다.'], fx: [] },
      { lean: { greed: 1 }, text: ['헐값에 사려는 골동품상 앞에서 주화를 거두고 부른 값을 다 받았다.', '주화를 노리고 뒤를 밟던 좀도둑들을 붙잡아 혼쭐을 냈다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: {}, text: ['주운 옛 동전을 골동품 가게에 팔아 술값을 했다.', '옛 동전을 골동품 가게에 가져가 몇 푼 받았다.'], fx: [{ op: 'money', add: 500 }] },
    ],
  },
  {
    id: 'm_sibling_letter', when: [adult, free], needs: ['sibling'], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['형제가 어렵다는 편지를 받고 하던 일을 제쳐 두고 도울 길을 찾았다.', '형제가 부탁한 물건을 구해 바로 부쳤다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { peace: 1 }, text: ['형제의 안부 편지를 읽고 모은 돈과 이곳 특산물을 소포로 부쳤다.', '형제가 앓는다는 소식에 약초를 구해 편지와 함께 보냈다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { freedom: 1 }, text: ['집으로 돌아오라는 형제의 편지를 읽고 웃으며 접어 두었다.', '형제에게 안부만 짧게 적은 답장을 보내고 제 길을 갔다.'], fx: [] },
      { lean: {}, text: ['형제의 편지를 읽고 그동안 지낸 이야기를 적어 답장했다.', '오랜만에 온 형제의 소식을 반갑게 읽고 품에 넣었다.'], fx: [] },
    ],
  },
  {
    id: 'm_rain_shelter', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['갑자기 쏟아진 비를 피해 처마 밑에서 빗소리를 들었다.', '뛰지 않고 큰 나무 밑에서 비가 그칠 때까지 쉬어 갔다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['처마 밑에서 떠는 아이에게 겉옷을 벗어 덮어 주었다.', '하나뿐인 우산을 노인에게 주고 빗속을 걸어 돌아왔다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['구름이 흘러가는 쪽을 보고 소나기가 그칠 때를 맞혔다.', '처마 밑에 모인 사람들의 이야기에서 이 섬의 소문을 들었다.'], fx: [] },
      { lean: {}, text: ['갑자기 쏟아지는 비에 가까운 처마 밑으로 달려 들어갔다.', '비가 잦아들 때까지 젖은 옷자락을 털었다.'], fx: [] },
    ],
  },
  {
    id: 'm_home_letter', when: [adult, free, money(5000)], needs: ['parent'], weight: 4, cooldownYears: 3,
    outcomes: [
      { lean: { romance: 1 }, text: ['흉년이 들었다는 {parent}의 편지를 받고 모은 돈을 부쳤다.', '{parent}께 쌀값을 넉넉히 보냈다.'], fx: [{ op: 'money', add: -4000 }] },
      { lean: { loyalty: 1 }, text: ['흉년 소식에 이웃집 몫까지 나눠 쓰라며 돈을 보냈다.', '{parent}의 편지를 받자마자 답장과 함께 약값을 부쳤다.'], fx: [{ op: 'money', add: -4000 }] },
      { lean: { ambition: 1 }, text: ['돈은 조금만 부치고 더 벌어 크게 갚겠다고 답장을 썼다.', '고향에 보낼 돈을 아껴 일을 늘리는 데 썼다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: {}, text: ['{parent}의 편지에 안부를 적어 답장하고 동전 몇 닢을 넣었다.', '고향 소식을 듣고 형편대로 조금 부쳤다.'], fx: [{ op: 'money', add: -1000 }] },
    ],
  },
  // ---------------- 배를 탄 처지 (해적 · 해군 · 혁명군)
  {
    id: 'm_deck_duty', when: [adult, crew], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['밤 당번을 대신 서 달라는 옆 해먹 선원의 부탁을 들어주었다.', '몸살 난 선원의 몫까지 갑판을 닦았다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { freedom: 1 }, text: ['갑판 청소 당번을 빼먹고 돛대 위에서 낮잠을 잤다.', '당번표를 몰래 바꿔 놓고 뱃머리에서 바다만 보았다.'], fx: [] },
      { lean: {}, text: ['하루 종일 갑판을 닦고 밧줄을 감았다.', '돛줄을 감고 물통을 채우며 하루를 보냈다.'], fx: [] },
    ],
  },
  {
    id: 'm_dock_grunts', when: [adult, crew], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, when: fierce, text: ['항구에서 시비 건 남의 배 졸개들을 두들겨 팼다.', '부두에서 길을 막은 남의 배 선원들을 밀쳐 바다에 빠뜨렸다.'], fx: [{ op: 'hp', add: -4 }, { op: 'fame', add: 1 }] },
      { lean: { peace: 1 }, when: calm, text: ['다른 배 선원들과의 시비를 피해 배로 돌아왔다.', '시비를 거는 남의 배 선원들에게 술 한 병을 건네고 물러났다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['졸개들에게 둘러싸인 같은 배 선원 곁으로 달려가 함께 싸웠다.', '같은 배 선원이 얻어맞았다는 말에 술잔을 내려놓고 부두로 뛰어갔다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: {}, text: ['항구에서 남의 배 졸개들과 노려보다 헤어졌다.', '부두에서 남의 배 선원들과 욕을 주고받고 돌아섰다.'], fx: [] },
    ],
  },
  {
    id: 'm_homecoming', when: [{ c: 'age', min: 20 }, crew], needs: ['spouse'], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { peace: 1 }, text: ['오랜만에 집에 들러 배우자 곁에서 며칠 푹 쉬었다.', '집에 와서 아무 데도 나가지 않고 마당만 쓸었다.'], fx: [{ op: 'hp', add: 5 }] },
      { lean: { peace: 1 }, text: ['배우자에게 줄 먼 섬의 옷감을 들고 집에 들렀다.', '오랜만의 집에서 새는 지붕부터 고쳐 놓았다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { freedom: 1 }, text: ['집에 들러 얼굴만 보이고 이튿날 새벽 바다로 돌아갔다.', '배우자의 잔소리를 웃으며 듣고 다시 짐을 꾸렸다.'], fx: [] },
      { lean: {}, text: ['오랜만에 집에 들러 배우자와 저녁을 먹었다.', '집에 들러 그동안 쌓인 편지를 읽었다.'], fx: [] },
    ],
  },
  // ---------------- 해적
  {
    id: 'm_pirate_night_watch', when: [adult, st('pirate')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['지친 선원의 몫까지 밤새 망루를 지켰다.', '몸이 성치 않은 선원을 해먹으로 돌려보내고 대신 보초를 섰다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { romance: 1 }, text: ['망루에 앉아 별빛 쏟아지는 밤바다를 보며 콧노래를 불렀다.', '밤바다 너머 아직 가 보지 못한 항로를 손가락으로 그려 보았다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['모두 잠든 갑판에서 혼자 당직을 서며 수평선을 살폈다.', '보초를 서는 내내 수배서 뭉치를 넘기며 이름난 해적들의 얼굴을 외웠다.'], fx: [] },
      { lean: {}, text: ['찬 밤바람을 맞으며 교대 때까지 망루를 지켰다.', '졸음을 참으며 밤새 파도 소리를 들었다.'], fx: [] },
    ],
  },
  {
    id: 'm_pirate_share', when: [adult, st('pirate')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, text: ['전리품 더미에서 가장 값나가는 것을 먼저 집어 들었다.', '몫이 적다고 투덜대는 선원을 노려보아 입을 다물게 했다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: { peace: 1 }, text: ['다친 선원의 약값에 쓰라고 제 몫의 은화를 밀어 주었다.', '고향에 보낼 돈이 필요하다는 선원에게 제 몫을 덜어 주었다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { romance: 1 }, text: ['금화 대신 이상한 모양의 나침반과 낡은 일지를 몫으로 골랐다.', '보석은 마다하고 정체 모를 뼈 장식을 챙겼다.'], fx: [] },
      { lean: {}, text: ['갑판에 둘러앉아 정한 대로 전리품을 똑같이 나눴다.', '몫으로 받은 동전 주머니를 해먹 밑에 숨겨 두었다.'], fx: [{ op: 'money', add: 1500 }] },
    ],
  },
  {
    id: 'm_pirate_storm', when: [adult, st('pirate')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['파도에 휩쓸릴 뻔한 선원의 팔을 붙잡아 끌어올렸다.', '쓰러진 돛대 밑에 깔린 선원을 끌어내다 등을 긁혔다.'], fx: [{ op: 'hp', add: -4 }] },
      { lean: { freedom: 1 }, text: ['폭풍이 몰아치는 뱃머리에 서서 소리 내어 웃었다.', '모두 선실로 숨을 때 돛대에 매달려 바람을 맞았다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['거친 해류를 뚫고 가자며 직접 키를 잡았다.', '폭풍 속에서 맨 먼저 돛을 접으러 돛대에 올랐다.'], fx: [] },
      { lean: {}, text: ['풀린 밧줄을 단단히 묶고 폭풍이 지나가기를 기다렸다.', '들이치는 바닷물을 밤새 양동이로 퍼냈다.'], fx: [] },
    ],
  },
  {
    id: 'm_pirate_merchant', when: [adult, st('pirate')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['상선에 탄 아이와 노인의 짐에는 손대지 못하게 막아섰다.', '항복한 선원들에게 주먹을 쓰려는 해적을 붙잡아 말렸다.'], fx: [] },
      { lean: { dominion: 1 }, when: fierce, text: ['맞서는 상선 호위병을 쓰러뜨리고 창고 열쇠를 빼앗았다.', '겁먹은 상인들을 갑판에 앉혀 놓고 가장 좋은 술통을 굴려 왔다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: { inquiry: 1 }, text: ['화물보다 선장실의 해류 기록을 먼저 찾아 읽었다.', '상인이 가진 먼 바다 신문과 교역 지도를 챙겼다.'], fx: [] },
      { lean: {}, text: ['상선에서 식량과 물만 넉넉히 옮겨 싣고 물러났다.', '상선이 순순히 내놓은 통행료를 받고 뱃머리를 돌렸다.'], fx: [{ op: 'money', add: 1000 }] },
    ],
  },
  {
    id: 'm_pirate_port_rumor', when: [adult, st('pirate')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['길목의 정보상에게 값을 치르고 해군 순찰 길을 알아냈다.', '떠도는 해류 소문을 듣고 값을 치른 뒤 해도 귀퉁이에 적었다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { romance: 1 }, text: ['안개 바다에 유령선이 나온다는 소문에 가슴이 뛰었다.', '보물이 잠든 무인도 이야기를 밤새 귀 기울여 들었다.'], fx: [] },
      { lean: { peace: 1 }, when: calm, text: ['해군이 가까이 왔다는 소문을 듣고 조용히 배로 돌아왔다.', '시끄러운 항구 거리를 피해 한적한 해안에서 그물을 손질했다.'], fx: [] },
      { lean: {}, text: ['항구 시장에서 출항에 쓸 말린 고기와 과일을 사 날랐다.', '부두에 앉아 오가는 배들을 보며 럼주 한 병을 비웠다.'], fx: [] },
    ],
  },
  {
    id: 'm_pirate_loot', when: [adult, st('pirate')], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['곡식을 사재기한 악덕 상인의 창고를 털어 마을 사람들에게 나눠 주었다.', '사람을 사고판다는 상인의 금고를 털고 장부를 불살랐다.'], fx: [{ op: 'money', add: 1000 }] },
      { lean: { dominion: 1 }, text: ['항구에서 가장 큰 상점에 쳐들어가 금고를 통째로 들고 나왔다.', '창고지기를 묶어 두고 창고를 바닥까지 비웠다.'], fx: [{ op: 'money', add: 3000 }] },
      { lean: { peace: 1 }, text: ['턴 창고의 쌀가마를 굶는 포구 마을 앞에 내려놓고 왔다.', '창고에서 나온 약을 앓는 아이가 있는 집에 몰래 두었다.'], fx: [] },
      { lean: {}, text: ['항구 창고에서 술통 몇 개를 몰래 굴려 왔다.', '창고를 털러 갔다가 경비가 많아 술통 하나만 들고 돌아왔다.'], fx: [{ op: 'money', add: 500 }] },
    ],
  },
  {
    id: 'm_pirate_sunken', when: [adult, st('pirate')], needs: ['swim'], weight: 4, cooldownYears: 3,
    outcomes: [
      { lean: { ambition: 1 }, text: ['가라앉은 옛 상선까지 헤엄쳐 내려가 금화 상자를 건져 올렸다.', '숨을 참고 몇 번이고 헤엄쳐 내려가 가라앉은 배의 화물을 건졌다.'], fx: [{ op: 'money', add: 3000 }, { op: 'hp', add: -3 }] },
      { lean: { inquiry: 1 }, text: ['가라앉은 상선의 항해 일지를 건져 말려서 읽었다.', '침몰선의 선체를 살펴 어디서 부서졌는지 짐작해 보았다.'], fx: [] },
      { lean: { peace: 1 }, text: ['침몰선 근처에 큰 그림자가 지나가자 그만두고 배로 돌아왔다.', '건지기 어려운 화물은 바다에 두고 손을 털었다.'], fx: [] },
      { lean: {}, text: ['가라앉은 상선에서 쓸 만한 밧줄과 닻을 건져 올렸다.', '침몰선을 뒤졌지만 녹슨 쇠붙이뿐이었다.'], fx: [] },
    ],
  },
  // ---------------- 해적 · 혁명군
  {
    id: 'm_sea_feast', when: [adult, st('pirate'), { c: 'flag', id: 'captain', has: true }, money(20000)], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['금고가 넘치자 배에서 밤새 연회를 열었다.', '모두에게 술과 고기를 돌리고 노래판을 벌였다.'], fx: [{ op: 'money', add: -5000 }] },
      { lean: { loyalty: 1 }, text: ['이번 항해에서 고생한 선원들에게 몫을 더 얹어 주었다.', '다친 선원의 몫은 따로 떼어 두었다.'], fx: [{ op: 'money', add: -3000 }] },
      { lean: { ambition: 1 }, text: ['남은 돈을 새 대포와 돛을 사는 데 썼다.', '연회 대신 다음 항해에 쓸 물자부터 사들였다.'], fx: [{ op: 'money', add: -5000 }] },
      { lean: {}, text: ['금고를 세어 일부는 연회에, 나머지는 비상금으로 나눴다.', '오랜만에 배부르게 먹고 일찍 잤다.'], fx: [{ op: 'money', add: -2000 }] },
    ],
  },
  {
    id: 'm_sea_treasure_map', when: [adult, st('pirate', 'revolution')], weight: 4, cooldownYears: 3,
    outcomes: [
      { lean: { romance: 1 }, text: ['술값 대신 받은 낡은 보물 지도를 들고 근처 무인도를 뒤졌다.', '보물 지도를 들고 모래사장을 파다가 작은 상자 하나를 찾았다.'],
        fx: [{ op: 'chance', p: 0.3, then: [{ op: 'money', add: 3000 }] }] },
      { lean: { inquiry: 1 }, text: ['술값 대신 받은 보물 지도의 잉크와 종이를 뜯어보고 가짜임을 알아냈다.', '지도에 그려진 해안선을 실제 해도와 하나하나 맞춰 보았다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['보물 지도를 가진 사내의 술값을 대신 내주고 지도를 사들였다.', '지도에 적힌 섬을 다음 항로에 넣자고 우겼다.'], fx: [{ op: 'money', add: -2000 }] },
      { lean: {}, text: ['술값 대신 받은 보물 지도를 선실 벽에 붙여 두었다.', '낡은 보물 지도를 들여다보다 잠이 들었다.'], fx: [] },
    ],
  },
  // ---------------- 해군
  {
    id: 'm_marine_tax', when: [adult, st('marine')], weight: 8, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 1 }, text: ['상인에게 뒷돈을 요구하던 고참의 손목을 붙잡아 말렸다.', '세금을 빼돌린 고참의 장부를 상관에게 그대로 올렸다.'], fx: [] },
      { lean: { justice: 1 }, text: ['세금을 못 내 우는 노점상 할머니 몫을 제 봉급에서 보탰다.', '가난한 어부의 그물은 압수 목록에서 빼 주었다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { dominion: 1 }, text: ['세금을 늦게 낸 상점 주인을 다그쳐 그 자리에서 받아 냈다.', '말이 많은 상인들 앞에서 탁자를 내리쳐 세금을 걷었다.'], fx: [] },
      { lean: {}, text: ['명령서에 적힌 대로 항구 상인들에게 세금을 걷었다.', '세금 자루와 장부를 맞춰 보고 일을 마쳤다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_drill', when: [adult, st('marine')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['일과가 끝난 뒤에도 연병장에 남아 모래주머니를 차고 달렸다.', '진급 심사를 앞두고 교관에게 대련을 청했다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['구보 중 발목을 삔 신병을 부축해 끝까지 같이 뛰었다.', '사격 자세가 서툰 후임 곁에 남아 해 질 때까지 봐 주었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['제식 훈련 도중 대열을 빠져나와 지붕 위에서 낮잠을 잤다.', '교관이 구령을 붙이기도 전에 제 박자대로 먼저 걸어 나갔다.'], fx: [] },
      { lean: {}, text: ['구령에 맞춰 연병장을 돌며 그날 훈련을 마쳤다.', '땀에 젖은 군복을 털고 식당으로 향했다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_stowaway', when: [adult, st('marine')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['군함 창고에 숨어든 배고픈 아이에게 몰래 주먹밥을 갖다주었다.', '밀항하다 들킨 아이를 벌 받지 않게 다음 항구에 조용히 내려 주었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['밀항한 아이를 규정대로 넘기되 사정을 봐 달라는 글을 함께 올렸다.', '아이의 고향을 알아내 그 마을로 가는 배편에 태워 보냈다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['아이를 숨겨 주다 걸린 동기와 벌을 반씩 나눠 받았다.', '당직 동기에게 탈이 없도록 제가 먼저 찾은 것으로 해 두었다.'], fx: [] },
      { lean: {}, text: ['식량 창고에 숨어 있던 밀항자를 찾아 당직 장교에게 넘겼다.', '군함이 항구에 닿자 밀항한 아이를 부두에 내려 주었다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_archive', when: [adult, st('marine')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['문서고 구석에서 옛 해전 기록을 찾아 밤새 읽었다.', '가로챈 전보의 암호를 풀어 보려고 밤을 새웠다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['현상수배범들의 행적을 정리해 토벌 계획을 써 올렸다.', '본부에서 내려온 작전 지침을 달달 외워 지휘관 눈에 들었다.'], fx: [] },
      { lean: { peace: 1 }, when: calm, text: ['출동 대신 문서 정리 당번을 자청해 조용히 하루를 보냈다.', '시끄러운 막사를 피해 자료실 구석에서 서류를 분류했다.'], fx: [] },
      { lean: {}, text: ['밀린 기지 일지와 보급 장부를 정리해 꽂아 두었다.', '새로 온 수배서 뭉치를 기지 게시판에 나란히 붙였다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_captive', when: [adult, st('marine')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, text: ['감방에서 소란을 피우는 해적 포로를 눌러 앉혀 입을 다물게 했다.', '건방지게 구는 포로의 철창을 걷어차 조용히 시켰다.'], fx: [] },
      { lean: { justice: 1 }, text: ['포로를 몰래 때리려는 병사를 막아서고 규정을 읊었다.', '포로에게도 정해진 밥과 치료는 줘야 한다고 따졌다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['잡힌 해적에게 며칠을 물어 남은 일당이 숨은 곳을 알아냈다.', '포로의 몸에 새겨진 해적단 문양을 그려 정보과에 넘겼다.'], fx: [] },
      { lean: {}, text: ['교대 시간에 맞춰 유치장 복도를 돌며 자물쇠를 확인했다.', '호송선에 태울 포로 명단을 맞춰 보았다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_private', when: [{ c: 'age', min: 16, max: 25 }, st('marine')], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['순찰 때마다 맨 앞에 서서 분대장의 눈에 들었다.', '분대에서 제일 먼저 일어나 제일 늦게 잤다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['순찰 도중 요령껏 빠져나와 부두에서 낮잠을 잤다.', '분대장 몰래 순찰 길을 바꿔 시장 구경을 했다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['분대장이 꾸중 듣는 자리에 함께 서서 고개를 숙였다.', '실수한 같은 분대 신병의 벌 당번을 같이 섰다.'], fx: [] },
      { lean: {}, text: ['이등병 막사에서 군화를 닦고 점호를 받았다.', '분대를 따라 항구 순찰을 한 바퀴 돌았다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_patrol', when: [adult, st('marine')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['순찰 중 조난한 어선을 보고 보트를 내려 어부들을 건져 올렸다.', '순찰 중 길에 쓰러진 노인을 업고 진료소로 갔다.'], fx: [] },
      { lean: { justice: 1 }, text: ['순찰 중 술 취해 행패 부리는 사내를 붙잡아 초소로 데려갔다.', '순찰 중 저울을 속이는 상인을 붙잡아 벌금을 물렸다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['순찰 중 길을 비키지 않는 건달을 밀쳐 길바닥에 앉혔다.', '순찰 중 수상한 배를 세워 놓고 선원들을 한 줄로 세웠다.'], fx: [] },
      { lean: {}, text: ['항구 순찰을 돌며 정박한 배들의 깃발을 적었다.', '순찰 중 길 잃은 여행자에게 길을 알려 주었다.'], fx: [] },
    ],
  },
  {
    id: 'm_marine_aqua_laguna', when: [adult, st('marine'), { c: 'island', is: ['워터 세븐'] }], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['아쿠아 라구나가 오기 전, 뒷골목 노인들을 업어 고지대로 옮겼다.', '해일이 오는 밤, 집을 떠나지 않으려는 할머니를 끝까지 달래 데려갔다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { justice: 1 }, text: ['해일 틈에 빈집을 털던 좀도둑들을 붙잡아 묶어 두었다.', '피난길에 자리를 다투는 사람들을 갈라 순서대로 올려 보냈다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['아쿠아 라구나를 앞두고 맡은 구역의 피난을 맨 먼저 끝냈다.', '해일 대비 작업에서 가장 무거운 모래 자루를 맡았다.'], fx: [] },
      { lean: {}, text: ['아쿠아 라구나가 지나간 뒤 수로에 떠다니는 쓰레기를 건져 냈다.', '해일 경보에 맞춰 주민들을 고지대로 안내했다.'], fx: [] },
    ],
  },
  // ---------------- 혁명군
  {
    id: 'm_rev_leaflet', when: [adult, st('revolution')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['왕족의 횡포를 적은 전단을 성문 앞 가장 눈에 띄는 곳에 붙였다.', '관리의 비리를 적은 벽보를 시장 한복판에 내걸었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['순찰대를 따돌리며 지붕을 건너뛰고 전단을 뿌렸다.', '정해진 구역을 벗어나 귀족 거리까지 전단을 날렸다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['전단을 돌리다 쫓기는 동지를 위해 반대쪽 골목에서 소란을 피웠다.', '들킬 뻔한 동지의 인쇄물 가방을 대신 메고 어둠 속으로 달렸다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: {}, text: ['통행금지 시간을 피해 골목마다 조용히 전단을 밀어 넣었다.', '새벽안개가 걷히기 전에 맡은 전단을 다 돌렸다.'], fx: [] },
    ],
  },
  {
    id: 'm_rev_ration', when: [adult, st('revolution')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['제 몫의 비상식량까지 털어 빈민가 아이들에게 죽을 쑤어 주었다.', '앓는 노인이 있는 판잣집에 약초와 깨끗한 물을 두고 왔다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['식량을 나눠 주며 모인 사람들 앞에서 세상을 바꾸자고 외쳤다.', '빈민가 청년들을 모아 몸 지키는 법을 가르쳤다.'], fx: [] },
      { lean: { justice: 1 }, text: ['구호 식량을 빼돌려 팔던 상인을 찾아내 자루를 되찾았다.', '줄을 새치기해 약한 사람의 몫을 가로채던 불량배들을 혼냈다.'], fx: [] },
      { lean: {}, text: ['구호 물자를 손수레에 싣고 빈민가 골목을 돌았다.', '명단에 따라 밀가루와 소금을 골고루 나눠 주었다.'], fx: [] },
    ],
  },
  {
    id: 'm_rev_cipher', when: [adult, st('revolution')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['옛 문자와 해류 기호를 섞어 새 암호표를 만들었다.', '정부의 검열 방식을 살펴 들키지 않는 연락 방법을 궁리했다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['연락이 끊긴 지부 동지들의 소식을 알아보려고 밤새 전전벌레 앞을 지켰다.', '동지가 남긴 암호 흔적을 끝까지 따라가 접선 장소를 찾아냈다.'], fx: [] },
      { lean: { romance: 1 }, text: ['새 시대를 노래하는 시 구절을 암구호로 쓰자고 했다.', '암호문 끝에 자유로운 바다에서 다시 보자는 작은 표식을 남겼다.'], fx: [] },
      { lean: {}, text: ['본부에서 온 지령을 풀어 읽고 종이를 불에 태웠다.', '정해진 시간에 전전벌레 앞에 앉아 신호를 기다렸다.'], fx: [] },
    ],
  },
  {
    id: 'm_rev_checkpoint', when: [adult, st('revolution')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { freedom: 1 }, text: ['통행증을 요구하는 초소를 피해 밤에 성벽을 넘어 들어갔다.', '검문 줄에 서지 않고 짐배 밑창에 숨어 봉쇄된 항구로 들어갔다.'], fx: [] },
      { lean: { dominion: 1 }, when: fierce, text: ['짐을 뒤지려는 문지기를 노려보아 그냥 통과했다.', '뒷골목을 지키던 경비병을 기절시키고 수레를 몰았다.'], fx: [] },
      { lean: { peace: 1 }, when: calm, text: ['의심을 사지 않으려고 행상으로 꾸며 먼 길을 돌아갔다.', '검문이 느슨해질 때까지 찻집에 앉아 기다렸다.'], fx: [] },
      { lean: {}, text: ['미리 준비한 상인 신분증을 보이고 검문소를 지났다.', '짐수레 바닥에 물자를 숨긴 채 성문을 통과했다.'], fx: [] },
    ],
  },
  {
    id: 'm_rev_debate', when: [adult, st('revolution')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['모닥불 앞에서 우리가 바라는 세상 이야기를 밤새 나눴다.', '지친 동지들에게 자유를 되찾은 섬의 옛이야기를 들려주었다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['방어만 하지 말고 무기고부터 치자며 작전을 이끌었다.', '더 큰 작전을 맡겨 달라며 지휘관 앞에서 계획을 펼쳐 보였다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['여러 나라의 세금 제도를 견주며 다음 거점을 골랐다.', '실패한 옛 봉기 기록을 짚어 가며 작전의 빈틈을 찾았다.'], fx: [] },
      { lean: {}, text: ['아지트 탁자에 둘러앉아 보급로 이야기를 나눴다.', '회의 내내 말없이 듣고 기록을 정리했다.'], fx: [] },
    ],
  },
  // ---------------- 현상금 사냥꾼
  {
    id: 'm_hunter_board', when: [adult, st('bountyHunter')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['게시판에서 가장 높은 현상금의 수배서를 떼어 냈다.', '다들 피하는 거물의 수배서를 품에 넣었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['현상금은 적어도 마을을 약탈한 자의 수배서를 먼저 골랐다.', '누명 같아 보이는 수배서는 제쳐 두고 사정을 알아보았다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['수배범들이 나타난 바다와 버릇을 수첩에 적어 다음 행선지를 짐작했다.', '수배서 사진의 배경과 무기를 보고 숨은 곳을 좁혀 갔다.'], fx: [] },
      { lean: {}, text: ['새로 붙은 수배서를 훑으며 만만한 상대를 찾았다.', '근처에 나타났다는 좀도둑의 얼굴을 익혀 두었다.'], fx: [] },
    ],
  },
  {
    id: 'm_hunter_rival', when: [adult, st('bountyHunter')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { greed: 1 }, when: fierce, text: ['사냥감을 가로채려던 다른 사냥꾼을 눕히고 몫을 차지했다.', '시비를 건 동업자의 무기를 쳐내고 구역에서 내쫓았다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: { loyalty: 1 }, text: ['함께 쫓던 사냥꾼이 다치자 현상금을 반으로 나눠 치료비로 주었다.', '먼저 잡은 쪽이 다 갖자는 말을 마다하고 약속대로 나눴다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { peace: 1 }, when: calm, text: ['사냥감을 두고 다투기 싫어 다른 사냥꾼에게 넘기고 물러났다.', '동업자들이 몰려들자 다툼을 피해 자리를 비켜 주었다.'], fx: [] },
      { lean: {}, text: ['다른 사냥꾼과 구역을 나눠 각자 쫓기로 했다.', '누가 먼저 잡나 신경전을 벌이며 골목을 뒤졌다.'], fx: [] },
    ],
  },
  {
    id: 'm_hunter_broker', when: [adult, st('bountyHunter')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { greed: 1 }, text: ['수수료를 떼먹으려는 중개인의 멱살을 잡아 다 받아 냈다.', '탁자를 내리쳐 중개인이 깎으려던 돈까지 챙겼다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: { greed: 1 }, text: ['기지까지 따라오라는 해군의 말을 마다하고 그 자리에서 돈만 받아 떠났다.', '번거로운 절차를 건너뛰고 중개인에게 넘겨 현금만 챙겼다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: { loyalty: 1 }, text: ['받은 현상금에서 수배범에게 털린 마을 사람들 몫을 떼어 주었다.', '사냥감에게 털렸던 상인에게 현상금 일부를 건넸다.'], fx: [{ op: 'money', add: 500 }] },
      { lean: {}, text: ['붙잡은 해적을 해군 지부에 넘기고 현상금을 받았다.', '신원 확인을 마치고 현상금 봉투를 챙겨 나왔다.'], fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'm_hunter_stakeout', when: [adult, st('bountyHunter')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { ambition: 1 }, text: ['비 오는 지붕 위에서 밤새 꼼짝 않고 수배범을 기다렸다.', '배고픔을 참으며 은신처 길목을 해가 뜰 때까지 지켰다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { romance: 1 }, text: ['달빛 아래 지도를 펴고 사냥이 끝나면 갈 섬을 골랐다.', '지루한 잠복 중에 옛 전설 속 사냥꾼 이야기를 혼자 중얼거렸다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['잠복이 길어지자 미련 없이 털고 일어나 다른 길을 찾았다.', '숨어 기다리는 대신 소굴 문을 직접 두드렸다.'], fx: [] },
      { lean: {}, text: ['창고 그늘에 몸을 숨기고 수배범의 배가 들어오기를 기다렸다.', '외투 깃을 세우고 수배범이 자주 가는 거리를 지켜보았다.'], fx: [] },
    ],
  },
  {
    id: 'm_hunter_petty', when: [adult, st('bountyHunter')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['굶는 식구 때문에 빵을 훔쳤다는 좀도둑의 사정을 듣고 놓아주었다.', '약값을 구하려다 수배된 사내에게 오히려 동전 몇 닢을 쥐여 주었다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { justice: 1 }, text: ['훔친 물건을 주인에게 돌려주게 한 뒤 해군에 넘겼다.', '적은 현상금이라도 죄는 치러야 한다며 규정대로 묶었다.'], fx: [{ op: 'money', add: 500 }] },
      { lean: { ambition: 1 }, text: ['푼돈짜리 좀도둑은 거들떠보지 않고 큰 사냥감을 쫓았다.', '잔챙이에게 쓸 힘을 아껴 거물의 뒤를 밟았다.'], fx: [] },
      { lean: {}, text: ['길에서 마주친 좀도둑을 붙잡아 용돈을 벌었다.', '달아나는 소매치기의 발을 걸어 넘어뜨리고 포상금을 받았다.'], fx: [{ op: 'money', add: 500 }] },
    ],
  },
  {
    id: 'm_hunter_escort', when: [adult, st('bountyHunter')], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['끌고 가던 수배범이 앓아눕자 약을 사 먹이고 길을 늦췄다.', '굶은 수배범에게 제 몫의 빵을 나눠 주었다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { dominion: 1 }, text: ['끌고 가던 길에 도망치려던 수배범을 다시 붙잡아 두 손을 묶었다.', '말이 많은 수배범에게 재갈을 물리고 끌고 갔다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['끌고 가는 동안 수배범에게 그 패거리의 은신처를 캐물었다.', '수배범의 지도를 빼앗아 그가 다니던 뱃길을 따라 그려 보았다.'], fx: [] },
      { lean: {}, text: ['붙잡은 수배범을 끌고 해군 지부까지 이틀을 걸었다.', '끌고 가던 수배범과 한마디도 나누지 않고 길을 갔다.'], fx: [] },
    ],
  },
  // ---------------- 조선공
  {
    id: 'm_wright_timber', when: [adult, st('shipwright')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['나뭇결과 무게를 따져 가장 좋은 용골감을 골라냈다.', '처음 보는 섬 나무의 단단함을 밤새 시험해 보았다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['어떤 폭풍에도 버틸 배를 짓겠다며 가장 큰 원목을 골랐다.', '다들 손대기 꺼리는 단단한 고목을 끝내 돛대로 깎았다.'], fx: [] },
      { lean: { justice: 1 }, text: ['썩은 나무를 속여 팔려던 목재상을 그 자리에서 꾸짖었다.', '싼 나무를 쓰자는 선주의 말을 딱 잘라 거절했다.'], fx: [] },
      { lean: {}, text: ['목재소에서 잘 마른 판자를 골라 조선소로 날랐다.', '주문받은 배 크기에 맞춰 각목과 못을 세었다.'], fx: [] },
    ],
  },
  {
    id: 'm_wright_fisher', when: [adult, st('shipwright')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['수리비가 모자란 늙은 어부의 조각배를 돈 받지 않고 고쳐 주었다.', '가난한 어부의 배 구멍을 메우고 노까지 새로 깎아 주었다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['오래 밥을 챙겨 주던 단골 어부의 배부터 먼저 고쳤다.', '이웃의 고깃배가 부서지자 밤을 새워 고쳐 놓았다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['수리비를 깎겠다는 선주에게 망치를 들어 보이며 제값을 받았다.', '돈을 안 내고 배를 빼 가려던 패거리를 각목으로 막아 세웠다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: {}, text: ['밑바닥이 갈라진 고깃배에 역청을 발라 메웠다.', '어선의 낡은 키를 떼어 내고 새 판자를 덧댔다.'], fx: [{ op: 'money', add: 1000 }] },
    ],
  },
  {
    id: 'm_wright_figurehead', when: [adult, st('shipwright')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['선주의 꿈이 담긴 바다짐승 선수상을 밤새 깎았다.', '배가 오래 무사하기를 빌며 선수상에 칠을 올렸다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['도면을 무시하고 손이 가는 대로 선수상을 깎았다.', '정해진 모양 대신 바람을 가르는 새 모양으로 뱃머리를 꾸몄다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['선수상 무게가 배의 균형에 어떤 영향을 주는지 따져 보았다.', '바닷물에 오래 견디는 칠을 섞어 보려고 몇 번이고 시험했다.'], fx: [] },
      { lean: {}, text: ['주문서 그림대로 선수상을 깎아 달았다.', '떨어져 나간 선수상을 쇠못으로 다시 박았다.'], fx: [{ op: 'money', add: 1000 }] },
    ],
  },
  {
    id: 'm_wright_accident', when: [adult, st('shipwright')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['무너지는 비계 아래 있던 목수를 밀쳐 내고 대신 어깨를 부딪쳤다.', '위험한 높은 곳 작업을 후배 대신 맡았다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: { peace: 1 }, text: ['톱에 손을 벤 견습공을 업고 의원에게 달려가 치료비를 냈다.', '더위에 지친 일꾼들에게 제 돈으로 수박을 사 돌렸다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { justice: 1 }, text: ['안전 밧줄 없이 일을 시키는 감독에게 따져 작업을 멈추게 했다.', '닳은 밧줄을 그대로 쓰려는 반장을 말리고 새 밧줄로 바꿨다.'], fx: [] },
      { lean: {}, text: ['도크 바닥의 공구와 톱밥을 치웠다.', '느슨해진 도르래 밧줄을 다시 감고 일을 마쳤다.'], fx: [] },
    ],
  },
  {
    id: 'm_wright_pirate_ship', when: [adult, st('shipwright')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['포탄 자국투성이 배에서 모험의 흔적을 보고 기꺼이 망치를 들었다.', '해적이든 아니든 바다를 아끼는 선주가 마음에 들어 배를 고쳐 주었다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: { justice: 1 }, text: ['약탈품으로 수리비를 내겠다는 해적들을 돌려보냈다.', '민간 배를 들이받은 흔적이 있는 해적선은 못 고친다고 버텼다.'], fx: [] },
      { lean: { peace: 1 }, when: calm, text: ['해적과 엮이기 싫어 일이 밀렸다며 조용히 돌려보냈다.', '험상궂은 뱃사람들이 오자 작업실 문을 걸고 없는 척했다.'], fx: [] },
      { lean: {}, text: ['배의 내력은 묻지 않고 수리비만 받고 포탄 자국을 메웠다.', '밤사이 돛대와 선체를 손봐 새벽에 떠나게 했다.'], fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'm_wright_apprentice', when: [adult, st('shipwright')], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['판자를 망친 견습공에게 처음부터 다시 대패 잡는 법을 보여 주었다.', '밤늦게까지 남아 견습공의 서툰 이음새를 같이 맞췄다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['판자를 망친 견습공에게 고함을 질러 하루 종일 청소만 시켰다.', '실수한 견습공의 연장을 빼앗고 구경만 하게 했다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['견습공이 망친 판자를 버리고 제 손으로 새로 깎아 일정을 맞췄다.', '견습공들과 누가 더 빨리 판자를 켜나 시합을 붙였다.'], fx: [] },
      { lean: {}, text: ['견습공이 망친 판자를 고쳐 쓰느라 하루가 다 갔다.', '견습공에게 못 박는 법을 몇 번 일러 주었다.'], fx: [] },
    ],
  },
  // ---------------- 뭍사람 (시민)
  {
    id: 'm_civil_stall', when: [adult, st('civil')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['비 오는 날 나물을 팔던 할머니의 바구니를 몽땅 사 드렸다.', '손님이 없어 한숨 쉬는 옆 좌판을 위해 지나가는 사람들을 불러 모았다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { justice: 1 }, text: ['저울을 속이는 상인을 사람들 앞에서 붙잡아 다시 달게 했다.', '자릿세를 뜯으러 온 불량배들 앞에 상인들을 대신해 나섰다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['새벽같이 나가 시장에서 가장 좋은 자리를 잡았다.', '다른 가게에 없는 먼 섬의 물건을 들여와 팔았다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: {}, text: ['좌판에 물건을 가지런히 늘어놓고 손님을 맞았다.', '해 질 녘 남은 물건을 떨이로 팔고 하루 셈을 맞췄다.'], fx: [{ op: 'money', add: 1000 }] },
    ],
  },
  {
    id: 'm_civil_dock_load', when: [adult, st('civil')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['허리를 삔 일꾼 친구의 몫까지 상자를 날랐다.', '품삯을 떼인 친구와 함께 관리소 앞에서 끝까지 따졌다.'], fx: [] },
      { lean: { greed: 1 }, text: ['가장 무거운 자루를 혼자 번쩍 들어 일꾼들의 입을 다물게 했다.', '일감을 가로채려던 타지 일꾼들을 밀어내고 자리를 지켰다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: { freedom: 1 }, text: ['날씨가 좋아 오후 일을 내팽개치고 방파제에서 낚시를 했다.', '반장의 잔소리가 싫어 오전 품삯만 받고 바닷가로 놀러 갔다.'], fx: [] },
      { lean: {}, text: ['상선에서 내린 곡식 자루를 창고까지 날랐다.', '이마의 땀을 닦으며 하루 품삯을 받았다.'], fx: [{ op: 'money', add: 1000 }] },
    ],
  },
  {
    id: 'm_civil_festival_prep', when: [adult, st('civil')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { romance: 1 }, text: ['마을 축제에 걸 오색 깃발과 등불을 밤새 꾸몄다.', '광장 한가운데서 북소리에 맞춰 춤을 추었다.'], fx: [] },
      { lean: { peace: 1 }, text: ['축제가 끝난 광장에 남아 쓰레기를 혼자 치웠다.', '바쁜 이웃들 대신 마을 아이들을 돌보며 음식을 나눠 주었다.'], fx: [] },
      { lean: { peace: 1 }, text: ['붐비는 축제를 피해 마을 어귀 언덕에서 불꽃을 보았다.', '시끄러운 술자리를 빠져나와 바닷가를 걸었다.'], fx: [] },
      { lean: {}, text: ['이웃들과 광장에 축제 천막과 탁자를 세웠다.', '축제 노점에서 구운 고기와 맥주를 사 먹었다.'], fx: [{ op: 'money', add: -500 }] },
    ],
  },
  {
    id: 'm_civil_stranger', when: [adult, st('civil')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['지나가던 외지 상인에게 위대한 항로의 날씨와 섬 이야기를 물었다.', '나그네가 두고 간 낯선 나라의 지도를 밤새 들여다보았다.'], fx: [] },
      { lean: { romance: 1 }, text: ['떠돌이 악사에게 술을 사고 먼바다의 영웅담을 들었다.', '수평선 너머에서 왔다는 여행자의 이야기에 떠날 날을 꿈꿨다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { justice: 1 }, text: ['외지인에게 바가지를 씌우려는 장사꾼을 타일러 제값을 받게 했다.', '길 잃은 여행자의 짐을 노리던 건달들을 쫓아 보냈다.'], fx: [] },
      { lean: {}, text: ['마을에 온 여행자에게 길을 알려 주었다.', '옆자리에 앉은 외지인과 눈인사를 나누고 밥을 먹었다.'], fx: [] },
    ],
  },
  {
    id: 'm_civil_storm_roof', when: [adult, st('civil')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['제 집보다 혼자 사는 옆집 노인의 지붕부터 고쳤다.', '물에 잠긴 이웃집 세간을 밤새 함께 건져 냈다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['바람에 날아간 친구네 가게 간판을 찾아 다시 못질해 주었다.', '약속한 배달을 지키려고 비바람을 뚫고 고개를 넘었다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: { peace: 1 }, text: ['비바람이 오기 전에 덧문을 걸고 따뜻한 차를 마셨다.', '난롯불을 지피고 빗소리를 들으며 하루를 보냈다.'], fx: [{ op: 'hp', add: 3 }] },
      { lean: {}, text: ['지붕에 올라가 들뜬 판자를 망치로 박았다.', '마당 물길을 다시 파고 새는 창틈을 헝겊으로 막았다.'], fx: [] },
    ],
  },
  // ---------------- 뭍에 자리 잡은 사람 · 시민 · 은퇴
  {
    id: 'm_orphanage', when: [adult, st('civil', 'settled', 'retired'), money(10000)], weight: 4, cooldownYears: 3,
    outcomes: [
      { lean: { peace: 1 }, text: ['지붕이 무너진 항구 고아원에 모아 둔 돈을 보냈다.', '고아원 지붕을 고치는 데 돈을 보태고 직접 판자도 날랐다.'], fx: [{ op: 'money', add: -5000 }] },
      { lean: { justice: 1 }, text: ['고아원 기금을 빼돌린 관리인을 찾아내 마을 회의에 세웠다.', '고아원 지붕 수리비를 떼먹은 목수를 찾아가 일을 마치게 했다.'], fx: [] },
      { lean: { ambition: 1 }, text: ['고아원 지붕 고치는 일을 앞장서 맡아 마을에 이름을 알렸다.', '제 이름을 새긴 현판을 다는 조건으로 수리비를 냈다.'], fx: [{ op: 'money', add: -3000 }] },
      { lean: {}, text: ['고아원 지붕이 무너졌다는 말을 듣고 동전 몇 닢을 모금함에 넣었다.', '고아원 수리하는 날 하루 일손을 보탰다.'], fx: [{ op: 'money', add: -300 }] },
    ],
  },
  {
    id: 'm_settled_garden', when: [adult, st('settled')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['텃밭에서 가장 잘 익은 채소를 바구니에 담아 이웃에게 돌렸다.', '이웃 노인의 밭까지 새벽마다 물을 대 주었다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['바닷바람에도 잘 크는 새 씨앗을 구해 흙을 바꿔 가며 심어 보았다.', '물길을 고쳐 대 보고 작년보다 굵은 감자를 캤다.'], fx: [] },
      { lean: { peace: 1 }, text: ['햇볕 아래 흙냄새를 맡으며 천천히 잡초를 뽑았다.', '밭 귀퉁이 그늘에 누워 바람 소리를 들으며 낮잠을 잤다.'], fx: [{ op: 'hp', add: 3 }] },
      { lean: {}, text: ['텃밭에 물을 주고 다 자란 감자를 캐 두었다.', '새들이 쪼지 못하게 밭 둘레에 허수아비를 세웠다.'], fx: [] },
    ],
  },
  {
    id: 'm_settled_fence', when: [adult, st('settled')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { peace: 1 }, text: ['경계를 따지는 이웃에게 한 뼘 양보하고 울타리를 물렸다.', '얼굴 붉히기 싫어 말뚝을 제 마당 쪽으로 옮겨 박았다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['제 땅에 울타리를 치려던 이웃을 다그쳐 물러나게 했다.', '억지를 부리는 옆집 주인 앞에서 말뚝을 뽑아 제자리에 박았다.'], fx: [] },
      { lean: { justice: 1 }, text: ['마을의 옛 토지 대장을 가져와 경계를 똑바로 나눴다.', '어느 쪽 편도 들지 않고 양쪽 집 울타리 선을 그었다.'], fx: [] },
      { lean: {}, text: ['이웃과 함께 낡은 울타리를 걷어 내고 새 말뚝을 박았다.', '기울어진 울타리를 밧줄과 판자로 덧대었다.'], fx: [] },
    ],
  },
  {
    id: 'm_settled_supper', when: [adult, st('settled')], needs: ['spouse'], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['지친 배우자를 위해 장을 봐 와서 따뜻한 저녁을 차렸다.', '배우자가 좋아하는 생선을 구워 살을 발라 주었다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { romance: 1 }, text: ['식탁에 촛불을 켜고 처음 만난 날 이야기를 나눴다.', '마당에 자리를 펴고 별을 보며 둘이서 저녁을 먹었다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['바쁜 날이었지만 저녁 약속을 지키려고 일을 미루고 일찍 들어갔다.', '먼 길 다녀온 배우자의 짐을 받아 들고 발 씻을 물을 데웠다.'], fx: [] },
      { lean: {}, text: ['소박한 반찬을 차려 놓고 마주 앉아 하루 이야기를 나눴다.', '저녁을 먹고 나란히 설거지를 했다.'], fx: [] },
    ],
  },
  {
    id: 'm_settled_watch', when: [adult, st('settled')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['마을 창고를 털려던 밤도둑을 끝까지 쫓아가 붙잡았다.', '골목에서 행패 부리는 주정뱅이들을 꾸짖어 돌려보냈다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['마을 어귀를 어슬렁거리던 수상한 외지인들을 몰아냈다.', '야경꾼 대장을 자처하며 마을 어귀의 불량배들을 쫓아냈다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['몸살 난 이웃 대신 야경 당번을 맡아 새벽까지 골목을 돌았다.', '함께 돌던 야경꾼을 먼저 쉬게 하고 혼자 해안 초소를 지켰다.'], fx: [] },
      { lean: {}, text: ['횃불과 딱따기를 들고 순번에 맞춰 마을을 한 바퀴 돌았다.', '별일 없는 것을 보고 자정 넘어 집에 들어갔다.'], fx: [] },
    ],
  },
  {
    id: 'm_settled_horizon', when: [adult, st('settled')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { freedom: 1 }, text: ['사는 게 답답해져 작은 배를 몰고 먼바다까지 나갔다 왔다.', '일을 내려놓고 며칠 섬 반대편 해안을 마음 가는 대로 걸었다.'], fx: [] },
      { lean: { romance: 1 }, text: ['절벽 끝에 앉아 수평선으로 사라지는 범선을 보며 옛 항해를 떠올렸다.', '다락에 걸어 둔 낡은 해도를 펴 보며 가슴 뛰던 날을 떠올렸다.'], fx: [] },
      { lean: { peace: 1 }, text: ['잔잔한 파도 소리를 들으며 더 싸우지 않아도 되는 지금이 좋았다.', '노을 지는 해변을 천천히 걸었다.'], fx: [] },
      { lean: {}, text: ['방파제에 앉아 갈매기 떼가 나는 것을 보았다.', '바닷가를 걷다 조개껍데기 몇 개를 주머니에 넣었다.'], fx: [] },
    ],
  },
  // ---------------- 은퇴한 사람
  {
    id: 'm_retired_old_weapon', when: [st('retired'), equippedWeapon], needs: ['arms'], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['마당에서 {weapon}을(를) 들어 보았다. 팔을 내린 뒤에도 손에는 묵직한 감각이 남았다.', '{weapon}을(를) 든 채 천천히 돌아선 뒤 아직 할 만하다고 웃었다.'], fx: [] },
      { lean: { romance: 1 }, text: ['{weapon}에 난 자국을 따라 손가락을 움직였다.', '{weapon}을(를) 닦고 천에 싸면서 콧노래를 흥얼거렸다.'], fx: [] },
      { lean: { peace: 1 }, text: ['손질을 마친 {weapon}을(를) 마른 천에 싸 두었다.', '{weapon}을(를) 한쪽에 내려놓고 달아오른 손을 찻잔에 감쌌다.'], fx: [] },
      { lean: {}, text: ['마른 천으로 {weapon}에 앉은 먼지를 닦았다.', '볕 좋은 마당에 앉아 {weapon}에 맺힌 이슬을 닦았다.'], fx: [] },
    ],
  },
  {
    id: 'm_retired_aspirant', when: [st('retired')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['가르침을 청하는 젊은이에게 아는 것을 다 일러 주고 밥까지 먹여 보냈다.', '바다로 떠난다는 젊은이의 허술한 장비를 고쳐 주고 노잣돈을 쥐여 주었다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { ambition: 1 }, text: ['건방진 젊은이의 도전을 받아 한 번에 꺾고 벽이 얼마나 높은지 보여 주었다.', '찾아온 젊은이에게 혹독한 수련을 시키며 최고가 되라고 다그쳤다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['가르쳐 달라는 젊은이를 뒷문으로 따돌리고 낚시를 갔다.', '스승 노릇은 질색이라며 알아서 부딪쳐 보라고 돌려보냈다.'], fx: [] },
      { lean: {}, text: ['찾아온 젊은이의 자세를 한 번 봐 주고 짧게 일러 보냈다.', '댓돌에 앉아 젊은이들의 대련을 보며 혀를 찼다.'], fx: [] },
    ],
  },
  {
    id: 'm_retired_old_friend', when: [st('retired')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['소식이 끊겼던 옛 뱃동무가 찾아오자 맨발로 뛰어나가 밤새 술잔을 기울였다.', '형편이 어려워진 옛 뱃동무에게 모아 둔 돈을 선뜻 내주었다.'], fx: [{ op: 'money', add: -2000 }] },
      { lean: { romance: 1 }, text: ['흰머리가 된 옛 뱃동무와 방파제에 앉아 젊은 날 이야기로 밤을 새웠다.', '옛 뱃동무가 가져온 술을 나누며 먼저 간 이들의 이름을 불렀다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['오랜만에 만난 옛 뱃동무에게 그동안 바뀐 바다 소식을 자세히 물었다.', '옛 뱃동무와 그때 풀지 못한 일의 앞뒤를 맞춰 보았다.'], fx: [] },
      { lean: {}, text: ['마을을 지나던 옛 친구와 찻집에서 안부를 나눴다.', '먼 곳에서 온 옛 친구의 편지에 답장을 써 부쳤다.'], fx: [] },
    ],
  },
  {
    id: 'm_retired_memoir', when: [st('retired')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['평생 겪은 날씨와 해류를 정리해 뒷사람을 위한 항해 수첩을 썼다.', '옛날 본 유적의 무늬를 기억해 내 종이에 옮겨 그렸다.'], fx: [] },
      { lean: { justice: 1 }, text: ['묻혀 버린 일과 억울하게 죽은 사람들의 이름을 빠짐없이 적어 두었다.', '힘 있는 자들의 잘못을 뒷사람이 알도록 있는 그대로 적었다.'], fx: [] },
      { lean: { romance: 1 }, text: ['살면서 가장 빛나던 항해를 모험 소설처럼 적어 나갔다.', '젊은이들이 읽고 가슴 뛰기를 바라며 바다 이야기를 일기장에 채웠다.'], fx: [] },
      { lean: {}, text: ['돋보기를 쓰고 앉아 낡은 일기장을 정리했다.', '모아 둔 수배서와 신문 조각을 해마다 묶어 철했다.'], fx: [] },
    ],
  },
  {
    id: 'm_retired_tavern', when: [st('retired')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, when: fierce, text: ['노인네라고 얕보는 건달들을 호통 한 번으로 주저앉혔다.', '행패 부리는 애송이의 팔을 비틀어 물러나게 했다.'], fx: [] },
      { lean: { peace: 1 }, when: calm, text: ['허세 부리는 젊은이들을 보며 조용히 웃었다.', '모인 사람들이 시끄러워지자 천천히 자리를 떴다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['나잇값 하라는 핀잔에도 높은 곳에 올라가 노래했다.', '귀가 시간도 잊고 젊은 사람들과 새벽까지 어울렸다.'], fx: [] },
      { lean: {}, text: ['늘 앉던 자리에 앉아 간단한 먹을거리를 샀다.', '먹을거리를 사서 오래 아는 이와 나누며 세상 돌아가는 이야기를 했다.'], fx: [{ op: 'money', add: -300 }] },
    ],
  },
  // ---------------- 감옥
  {
    id: 'm_prison_tray', when: [st('prisoner')], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { greed: 1 }, when: fierce, text: ['제 밥을 가로채려던 감방 덩치를 밀쳐 내고 빵을 되찾았다.', '사나운 눈으로 감방을 둘러보고 수프 건더기를 먼저 떴다.'], fx: [] },
      { lean: { peace: 1 }, text: ['열이 나서 앓는 옆자리 죄수에게 제 물과 빵 절반을 떼어 주었다.', '굶고 있는 어린 죄수에게 말없이 그릇을 밀어 주었다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { peace: 1 }, when: calm, text: ['배식 줄의 몸싸움을 피해 맨 끝에서 조용히 받았다.', '먹을 것을 탐내는 죄수들과 다투지 않고 구석에서 빵을 씹었다.'], fx: [] },
      { lean: {}, text: ['철창 밑으로 들어온 딱딱한 빵과 묽은 수프를 남김없이 먹었다.', '배식 종소리에 맞춰 그릇을 들고 줄을 섰다.'], fx: [] },
    ],
  },
  {
    id: 'm_prison_guard', when: [st('prisoner')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { freedom: 1 }, text: ['조롱하는 간수에게 침을 뱉고 철창을 흔들었다.', '무릎 꿇으라는 간수 앞에서 끝까지 두 발로 버텼다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: { ambition: 1 }, text: ['간수의 모욕을 삼키며 나가면 꼭 갚겠다고 이를 갈았다.', '얻어맞는 동안에도 간수의 열쇠 꾸러미와 교대 시간을 외웠다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: { justice: 1 }, text: ['죄수들을 제멋대로 괴롭히는 간수에게 큰 소리로 따졌다.', '약한 죄수를 때리는 간수 앞을 막아서고 대신 매를 맞았다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: {}, text: ['간수가 철창을 두드리며 시비를 걸었지만 고개를 숙이고 기다렸다.', '점호 시간에 간수 눈치를 보며 번호를 외쳤다.'], fx: [] },
    ],
  },
  {
    id: 'm_prison_workout', when: [st('prisoner')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['쇠사슬을 찬 채로 감방 바닥에서 매일 몸을 단련했다.', '밤마다 그림자를 상대로 대련하며 몸이 무뎌지지 않게 했다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['벽의 돌 틈과 환기구 바람을 살피며 감옥의 생김새를 머릿속에 그렸다.', '오래된 죄수들에게 감옥의 내력과 옛 탈옥 이야기를 물었다.'], fx: [] },
      { lean: { romance: 1 }, text: ['돌벽에 바다를 그려 놓고 다시 나갈 날을 꿈꿨다.', '돌벽에 손톱으로 가 본 섬들의 이름을 새겼다.'], fx: [] },
      { lean: {}, text: ['찬 돌바닥에 누워 천장에서 떨어지는 물방울을 셌다.', '감방 안을 이리저리 걸으며 굳은 몸을 풀었다.'], fx: [] },
    ],
  },
  {
    id: 'm_prison_quarry', when: [st('prisoner')], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['쓰러진 옆 감방 사람이 매를 맞지 않게 그 몫의 돌까지 날랐다.', '연장을 부러뜨렸다고 몰린 죄수 편에 서서 함께 벌을 받았다.'], fx: [{ op: 'hp', add: -4 }] },
      { lean: { dominion: 1 }, text: ['잔일을 떠넘기려는 죄수를 곡괭이 자루로 밀어내 입을 다물게 했다.', '채석장에서 가장 큰 바위를 혼자 깨뜨려 아무도 시비를 못 걸게 했다.'], fx: [] },
      { lean: { greed: 1 }, text: ['감시가 느슨한 틈에 채석장 그늘에 숨어 한나절 낮잠을 잤다.', '작업 구역을 슬쩍 벗어나 바닷바람 부는 절벽 끝을 구경했다.'], fx: [] },
      { lean: {}, text: ['족쇄를 찬 채 해 질 때까지 돌을 깨고 날랐다.', '종이 울리자 곡괭이를 내려놓고 줄지어 감방으로 돌아갔다.'], fx: [] },
    ],
  },
  {
    id: 'm_prison_rat', when: [st('prisoner')], weight: 7, cooldownYears: 2,
    outcomes: [
      { lean: { peace: 1 }, text: ['감방 구석에 오는 작은 쥐에게 매일 빵 부스러기를 남겨 주었다.', '다리를 다친 쥐에게 짚으로 잠자리를 만들어 주었다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['쥐가 드나드는 구멍을 따라가 감방 밑에 물길이 있다는 것을 알아냈다.', '쥐가 물고 오는 풀잎을 보고 바깥 계절을 짐작했다.'], fx: [] },
      { lean: { peace: 1 }, text: ['찍찍거리는 쥐를 말벗 삼아 마음을 가라앉혔다.', '쥐 한 마리와 마주 앉아 조용한 밤을 보냈다.'], fx: [] },
      { lean: {}, text: ['빵을 노리는 쥐를 발로 쫓아냈다.', '철창 사이로 지나가는 쥐를 멍하니 바라보았다.'], fx: [] },
    ],
  },
  {
    id: 'm_prison_newcomer', when: [st('prisoner')], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['새로 들어와 떠는 어린 죄수에게 담요 반을 덮어 주었다.', '처음 들어온 죄수에게 간수 눈 밖에 나지 않는 법을 일러 주었다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['새로 들어온 죄수에게 감방의 자리 순서를 똑똑히 가르쳤다.', '새로 온 죄수의 신발을 빼앗아 신었다.'], fx: [] },
      { lean: { inquiry: 1 }, text: ['새로 들어온 죄수에게 바깥 소식을 하나하나 캐물었다.', '새 죄수가 끌려온 사연을 듣고 요즘 바다의 형편을 짐작했다.'], fx: [] },
      { lean: {}, text: ['옆 감방에 새 죄수가 들어와 밤새 시끄러웠다.', '새로 들어온 죄수와 몇 마디 나누고 말았다.'], fx: [] },
    ],
  },

  // ======================================================== 나이 든 뒤 (45살부터)
  {
    id: 'm_old_ache', when: [old], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['쑤시는 무릎을 무시하고 아침 수련을 나갔다.', '허리가 결려도 무거운 물동이를 손수 날랐다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: { peace: 1 }, text: ['볕 좋은 날 툇마루에 앉아 하루를 쉬었다.', '아픈 무릎에 찜질을 하며 하루 종일 누워 지냈다.'], fx: [{ op: 'hp', add: 5 }] },
      { lean: {}, text: ['쑤시는 무릎에 침을 맞았다.', '의원에게 허리를 보이고 약을 지어 왔다.'], fx: [{ op: 'money', add: -2000 }, { op: 'hp', add: 10 }] },
    ],
  },
  {
    id: 'm_old_children', when: [old], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 0.4 }, text: ['동네 아이들에게 젊은 날의 바다 이야기를 들려주었다.', '동네 아이들에게 바다에서 본 별자리를 가르쳐 주었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['싸우는 아이들을 붙잡아 양쪽 말을 끝까지 들어 주었다.', '아이들 놀이에서 반칙한 쪽을 불러 차분히 타일렀다.'], fx: [] },
      { lean: {}, text: ['공을 주워 달라는 아이들의 부탁을 들어주었다.', '아이들이 던진 공에 맞고도 웃어 주었다.'], fx: [] },
    ],
  },

  // ======================================================== 저절로 지나가는 원작의 만남 (과제 10)
  // 한 인생에 한 번(cooldownYears 99). 결과마다 연표에 원작 표시를 남겨 엔딩의 「겹친 원작 순간」에 나온다.
  // 원작의 때와 장소: 원작이 시작되기 전은 자란 마을에서, 그 뒤는 그 바다에서.
  ...canonPassing(),

  // ======================================================== 다섯 고향 (4단계, minors-homes.ts)
  ...HOME_MINORS,
] as Minor[]).map(landlockedMinor);
