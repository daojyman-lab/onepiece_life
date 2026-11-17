// 깃발 아래의 길 (과제 8): 해군과 정부의 첩보 기관(CP). 로그타운에서 태어난 사람에게 열린다.
// 해군: 훈련소, 첫 임무, 진급, 분대, 상관의 부당한 명령, 해적을 놓아줄지, 동기의 죽음, 천룡인 앞에서, 탈영과 전향.
// CP: 잠입에서 뽑혀 감, 이름을 버림, 지워야 할 사람이 아는 사람일 때, 섬에 묻혀 산 몇 해, 떠남.
// 명령을 따르는 것이 늘 정의는 아니다. 해군의 문에도 야망 · 의리 · 패도가 있다.
// 계급(hero.rank)을 묻는 조건은 없으므로, 분대를 거느리는 자리(하사 이상)는 표시 'mnOfficer'로 센다
// (사관학교 입학과 진급의 문이 남긴다). 다른 처지로 건너가는 전환점에는 standingYears를 둔다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { age, at, sea, st } from './paths';
import type { Cond, Fx, Turning } from '../../core/types';

const D = V.value.door;
/** 분대를 거느리는 자리 (하사 이상) */
const officer: Cond = { c: 'flag', id: 'mnOfficer', has: true };
const years = (min: number): Cond => ({ c: 'standingYears', min });
/** 차례: 훈련소(또는 사관학교 입학) → 첫 임무 → 그 뒤의 일. 사관학교 입학의 문(paths.ts)도 mnBoot를 남긴다 */
const BOOT: Fx = { op: 'flag', id: 'mnBoot' };
const FIRST: Fx = { op: 'flag', id: 'mnFirst' };
/** 첫 임무를 치른 수병 */
const seasoned: Cond = { c: 'flag', id: 'mnFirst', has: true };
/** CP에 막 들어온 사람(cpNew)은 이름을 버리는 날(cp_nameless)을 먼저 맞는다. 다른 CP의 일은 그 뒤에 온다 */
const CP_NEW: Fx = { op: 'flag', id: 'cpNew' };
const cpSettled: Cond = { c: 'flag', id: 'cpNew', has: false };
/** 분대원의 관계 글은 모두 이 말로 시작한다. 해군은 떠돌이를 동료로 받지 않고, 분대장(mnOfficer)이 된 뒤 신병을 받아 키운다 (v4의 분대 스카우트) */
export const SQUAD = '분대원';
/** 해군을 떠나면 분대원은 따라오지 않는다: 동료에서 빠지고 아는 사람으로 남는다 */
const PART_SQUAD: Fx[] = [{ op: 'partCrew', prefix: SQUAD }];
const squadMember = (role: string, crewRole: 'vanguard' | 'support' | 'medic' | 'navigator' | 'cook', extra: Partial<Extract<Fx, { op: 'person' }>> = {}): Fx =>
  ({ op: 'person', kind: 'crew', relation: `${SQUAD} · ${role}`, role: crewRole, age: { younger: 5 }, ...extra });
/** 분대가 있는 분대장 */
const hasSquad: Cond[] = [officer];

export const MARINE: Turning[] = [
  // ---------------------------------------------------------------- 수병의 날들
  {
    id: 'mn_boot_camp', kind: 'door', when: at(st('marine'), age(15), { c: 'flag', id: 'mnBoot', has: false }),
    weight: 10, repeat: 'once', speaker: { relation: '훈련소 교관' },
    title: '갯벌의 훈련소', body: '훈련소의 첫 달. 교관이 신병들을 갯벌에 엎드리게 하고 해가 질 때까지 기게 한다. {name}의 옆에서 비쩍 마른 신병 하나가 진흙에 얼굴을 묻은 채 일어나지 못한다.',
    doors: [
      { label: '쓰러진 신병을 들쳐 업고 끝까지 긴다', hint: '둘 다 꼴찌로 들어와 저녁을 굶는다', values: { loyalty: D }, mark: 'fellowship',
        fx: [BOOT, { op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '훈련소 동기' },
             { op: 'log', text: '진흙투성이 동기를 업고 맨 마지막으로 들어왔다. 그날 밤 둘이서 빈 밥그릇을 나눠 핥았다.', weight: 'heavy' }] },
      { label: '돌아보지 않고 맨 앞으로 나선다', hint: '교관의 수첩에 이름이 오른다', values: { ambition: D },
        fx: [BOOT, { op: 'base', key: 'str', add: 1 }, { op: 'fame', add: 2 }, { op: 'flag', id: 'mnTopRecruit' }] },
      { label: '막사의 서열을 첫날 밤 주먹으로 정한다', hint: '신병들이 고개를 숙이지만 교관에게 찍힌다', values: { dominion: D },
        fx: [BOOT, { op: 'mastery', branch: 'fist', add: 6 }, { op: 'hp', add: -8 }, { op: 'hardship', add: 2 },
             { op: 'log', text: '막사의 우두머리 노릇을 하던 신병을 바닥에 눕혔다. 다음 날 교관은 {name}에게만 곱절의 갯벌을 주었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'mn_first_mission', kind: 'door', when: at(st('marine'), age(15), { c: 'flag', id: 'mnBoot', has: true }, { c: 'flag', id: 'mnFirst', has: false }),
    weight: 8, repeat: 'once', speaker: { relation: '분대장' },
    title: '털린 어촌', body: '첫 출동이다. 해적이 휩쓸고 간 어촌에 구호품을 내리고, 숲으로 달아난 해적 잔당을 찾으라는 명령이 떨어졌다. 무너진 집 앞에 노인들이 멍하니 앉아 있다.',
    doors: [
      { label: '앞장서 숲속의 잔당을 몰아낸다', hint: '공을 세우지만 칼에 베일 수 있다', values: { justice: D }, danger: true,
        fx: [FIRST, { op: 'fame', add: 8 }, { op: 'chance', p: 0.7, then: [{ op: 'hp', add: -8 }], else: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -18 }] }] },
      { label: '수색에서 빠져 노인들의 지붕을 고친다', hint: '공은 다른 분대에 돌아가고 분대장의 눈 밖에 난다', values: { romance: D },
        fx: [FIRST, { op: 'fame', add: -2 }, { op: 'person', kind: 'ally', relation: '어촌의 노인' },
             { op: 'log', text: '해 질 녘까지 무너진 지붕을 얹었다. 노인이 말린 생선 한 줄을 손에 쥐여 주었다.', weight: 'light' }] },
      { label: '잔당이 숨긴 궤짝을 슬쩍 챙긴다', hint: '주머니가 두둑해지지만 들키면 끝이다', values: { greed: D }, danger: true,
        fx: [FIRST, { op: 'chance', p: 0.8, then: [{ op: 'money', add: 45000 }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '궤짝을 챙긴 것이 들켰다. 첫 임무에서 제복을 벗고 영창에 갇혔다.', weight: 'heavy' }] }] },
    ],
  },
  {
    // v4 cr_marine_promo: 진급의 계기. 사양하는 문은 그 길을 닫는다
    id: 'mn_promotion', kind: 'door', when: at(st('marine'), age(17, 50), seasoned),
    weight: 6, repeat: { years: 4 }, max: 3, speaker: { relation: '지부의 대령' },
    title: '어려운 임무', body: '대령이 {name}을(를) 집무실로 부른다. 근해를 휘젓는 해적 선장 하나를 잡아 오라고, 해내면 계급장을 바꿔 주겠다고 한다.',
    doors: [
      { label: '임무를 맡는다', hint: '해내면 진급하고, 실패하면 크게 다친다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.65,
               then: [{ op: 'rank', add: 1 }, { op: 'flag', id: 'mnOfficer' }, { op: 'fame', add: 20 },
                      { op: 'log', text: '해적 선장을 묶어 끌고 왔다. 대령이 새 계급장을 직접 달아 주었다.', weight: 'heavy' }, { op: 'timeline', text: '해적 선장을 잡고 진급했다' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -30 }, { op: 'log', text: '해적 선장은 놓쳤고 {name}은(는) 들것에 실려 돌아왔다.', weight: 'heavy' }] }] },
      { label: '지금의 분대를 두고 갈 수 없다며 사양한다', hint: '진급의 제의는 다시 오지 않는다', values: { loyalty: D }, closes: true,
        fx: [{ op: 'fame', add: -3 }] },
      { label: '옆 분대가 잡은 해적을 제 공으로 보고한다', hint: '계급장은 바뀌지만 원한을 산다', values: { dominion: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'flag', id: 'mnOfficer' }, { op: 'fame', add: 10 }, { op: 'flag', id: 'stoleCredit' },
             { op: 'person', kind: 'enemy', relation: '공을 빼앗긴 장교' }] },
      { label: '대령의 책상에 두툼한 봉투를 올려 둔다', hint: '피 한 방울 흘리지 않고 계급장이 바뀐다', special: 'greed', when: [{ c: 'money', min: 40000 }], values: { greed: D },
        fx: [{ op: 'money', add: -40000 }, { op: 'rank', add: 1 }, { op: 'flag', id: 'mnOfficer' }, { op: 'flag', id: 'boughtRank' },
             { op: 'log', text: '봉투는 소리 없이 서랍 속으로 사라졌다. 다음 주, 새 계급장이 도착했다.', weight: 'heavy' }, { op: 'timeline', text: '돈으로 계급장을 샀다' }] },
    ],
  },
  {
    // v4 mn_soldier · mn_marksman · mn_medic · mn_navigator · mn_cook: 분대장이 되면 연병장에서 신병을 골라 분대로 데려온다
    id: 'mn_squad_pick', kind: 'door', when: at(st('marine'), officer, seasoned),
    weight: 7, repeat: { years: 2 }, max: 3, speaker: 'hero',
    title: '연병장의 신병들', body: '새 신병들이 연병장에 줄지어 섰다. 분대장은 저마다 쓸 만한 신병을 데려간다. 늦게까지 목검을 휘두르는 녀석, 사격장에서 표적 한가운데만 맞히는 녀석, 밤새 부상병의 붕대를 가는 견습 군의관이 눈에 들어온다.',
    doors: [
      { label: '목검의 신병을 돌격조로 데려온다', hint: '분대가 앞장서 공을 세우고, 앞장선 만큼 {name}도 다치기 쉽다', values: { ambition: D }, danger: true,
        fx: [squadMember('돌격병', 'vanguard'), { op: 'fame', add: 6 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -10 }] }] },
      { label: '사격장의 신병을 저격수로 데려온다', hint: '멀리서 분대를 받쳐 준다. 훈련에 탄값이 든다', values: { justice: D },
        fx: [squadMember('저격수', 'support'), { op: 'money', add: -5000 }] },
      { label: '견습 군의관을 데려온다', hint: '상처는 빨리 아물고, 몸을 사리는 분대라는 소리를 듣는다', values: { peace: D },
        fx: [squadMember('군의관', 'medic'), { op: 'hp', add: 15 }, { op: 'fame', add: -3 }] },
    ],
  },
  {
    // 싸움 밖에서 분대를 받치는 신병
    id: 'mn_squad_pick_2', kind: 'door', when: at(st('marine'), officer, seasoned),
    weight: 5, repeat: { years: 3 }, max: 2, speaker: 'hero',
    title: '연병장 밖의 신병들', body: '연병장에는 서지 않는 신병들도 있다. 폭풍 속에서 항로를 바로잡았다는 항해과 수병, 취사반에서 쫓겨날 만큼 손이 큰 요리병. 둘 다 다른 분대장들이 눈독을 들인다.',
    doors: [
      { label: '항해과 수병에게서 해류 읽는 법을 배우며 데려온다', hint: '바다를 보는 눈이 트이고, 그 수병을 노리던 분대장과 척을 진다', values: { inquiry: D },
        fx: [squadMember('항해 수병', 'navigator'), { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'rival', relation: '수병을 빼앗긴 분대장' }] },
      { label: '쫓겨난 요리병을 데려온다', hint: '분대의 밥이 달라진다. 다른 분대장들이 웃는다', values: { loyalty: D },
        fx: [squadMember('요리병', 'cook'), { op: 'hp', add: 10 }] },
    ],
  },
  {
    // 분대장이 신병을 키운다: 훈련의 방식이 분대의 색을 정한다
    id: 'mn_squad_drill', kind: 'door', when: at(st('marine'), ...hasSquad), needs: ['crew'],
    weight: 7, repeat: { years: 2 }, max: 5, speaker: 'hero',
    title: '분대 훈련', body: '{name}의 분대원들이 연병장에 모였다. 아직 총 쥐는 손이 어설픈 녀석도 있다. 다음 출동까지 한 철이 남았다.',
    doors: [
      { label: '해 뜨기 전부터 해 질 때까지 몰아붙인다', hint: '분대가 단단해진다. 원망하는 눈빛도 생긴다', values: { dominion: D },
        fx: [{ op: 'crewTrain', add: 3 }, { op: 'log', text: '분대원들이 연병장에 쓰러져 잠들었다. 다음 날 아무도 늦지 않았다.', weight: 'light' }] },
      { label: '하나하나 곁에 붙어 약점을 고쳐 준다', hint: '제 수련 시간이 줄어든다. 분대원들이 {name}을(를) 따른다', values: { inquiry: D },
        fx: [{ op: 'crewTrain', add: 2 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '밤마다 분대원 하나씩 붙잡고 자세를 고쳐 주었다.', weight: 'light' }] },
      { label: '해적 소탕에 실전으로 데려간다', hint: '빨리 큰다. 다치는 녀석이 나올지 모른다', values: { ambition: D }, danger: true,
        fx: [{ op: 'crewTrain', add: 4 }, { op: 'fame', add: 5 }, { op: 'chance', p: 0.35, then: [{ op: 'hp', add: -15 }, { op: 'log', text: '분대원 하나가 칼을 맞았다. 들것에 실려 가며 다음엔 안 맞는다고 웃었다.', weight: 'heavy' }] }] },
    ],
  },
  {
    // 첫 출동에서 얼어붙은 신병
    id: 'mn_rookie_froze', kind: 'door', when: at(st('marine'), ...hasSquad), needs: ['crew'],
    weight: 6, repeat: 'once', speaker: { relation: '얼어붙은 신병' },
    title: '얼어붙은 신병', body: '해적선에 오르던 순간 막내 분대원이 사다리에서 얼어붙었다. 덕분에 분대가 뒤에서 막혀 해적 둘을 놓쳤다. 막내는 연병장 구석에서 고개를 들지 못한다.',
    doors: [
      { label: '다음 출동에 막내를 맨 앞에 세운다', hint: '두려움은 부딪혀야 사라진다고 믿는다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'crewTrain', add: 2 }, { op: 'log', text: '막내가 맨 먼저 해적선에 뛰어올랐다. 다리는 떨리고 있었다.', weight: 'heavy' }],
          else: [{ op: 'hp', add: -10 }, { op: 'log', text: '막내는 또 얼어붙었다. 그 대신 {name}이(가) 칼을 맞았다.', weight: 'heavy' }] }] },
      { label: '제 첫 출동에서 떨던 이야기를 해 준다', hint: '막내가 고개를 든다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'crewTrain', add: 2 }] },
      { label: '보고서에 놓친 책임을 제 이름으로 적는다', hint: '막내는 무사하고 {name}의 공적이 깎인다', values: { justice: D },
        fx: [{ op: 'fame', add: -5 }, { op: 'crewTrain', add: 1 }] },
    ],
  },
  {
    // v4 namedCrew: 코비 · 헤르메포 · 타시기. 원작이 시작될 무렵 해군에 막 들어온 신병들
    id: 'mn_named_rookies', kind: 'door', when: at(st('marine'), ...hasSquad, age(17, 26)),
    weight: 6, repeat: 'once', speaker: 'hero',
    title: '눈에 띄는 신병들', body: '본부에서 온 신병들 가운데 셋이 눈에 띈다. 큰 목소리로 인사하는 분홍 머리 소년, 툴툴대면서도 제일 먼저 갑판을 닦는 턱이 긴 청년, 칼은 잘 쓰는데 안경을 자꾸 떨어뜨리는 여자 하사.',
    doors: [
      { label: '분홍 머리 소년을 분대로 데려온다', hint: '언젠가 크게 될 녀석이다. 지금은 겁이 많다', values: { freedom: D },
        fx: [squadMember('분홍 머리 신병', 'vanguard', { canon: 'coby' }), { op: 'timeline', text: '분홍 머리 신병 코비를 분대로 데려왔다', canon: 'coby' }] },
      { label: '턱이 긴 청년을 분대로 데려온다', hint: '버릇은 없지만 한번 따르면 끝까지 따른다', values: { loyalty: D },
        fx: [squadMember('턱이 긴 신병', 'vanguard', { canon: 'helmeppo' }), { op: 'timeline', text: '헤르메포를 분대로 데려왔다', canon: 'helmeppo' }] },
      { label: '안경 쓴 검사를 분대로 데려온다', hint: '명검을 모으는 버릇이 있다', values: { inquiry: D },
        fx: [squadMember('안경 쓴 검사', 'vanguard', { canon: 'tashigi' }), { op: 'timeline', text: '타시기를 분대로 데려왔다', canon: 'tashigi' }] },
    ],
  },
  {
    // 키운 분대원이 다른 부대의 장교로 뽑혀 간다
    id: 'mn_squad_graduate', kind: 'door', when: at(st('marine'), ...hasSquad, years(6)), needs: ['crew'],
    weight: 5, repeat: 'once', speaker: { relation: '다 자란 분대원' },
    title: '떠나는 분대원', body: '신병 때부터 키운 분대원들이 본부의 장교로 뽑혀 간다고 한다. 경례하는 손끝들이 떨린다. 붙잡으면 남겠다고 할 것이다.',
    doors: [
      { label: '등을 떠밀어 보낸다', hint: '분대는 빈다. 바다 곳곳에 {name}의 사람들이 생긴다', values: { loyalty: D },
        fx: [{ op: 'partCrew', prefix: `${SQUAD} · ` }, { op: 'fame', add: 8 }, { op: 'timeline', text: '키운 분대원들을 장교로 떠나보냈다' }] },
      { label: '본부에 말해 남게 한다', hint: '분대는 그대로다. 그 녀석들의 앞길을 막는다', values: { loyalty: D }, fx: [] },
    ],
  },
  {
    id: 'mn_unjust_order', kind: 'door', when: at(st('marine'), age(17, 50), seasoned),
    weight: 6, repeat: 'once', speaker: { relation: '지부장' },
    title: '불태우라는 명령', body: '해적을 숨겨 주었다는 의심을 받은 바닷가 마을. 지부장이 {name}에게 횃불을 건넨다. 마을을 모두 태워 본보기로 삼으라고 한다. 집집마다 아이들이 창밖을 내다본다.',
    doors: [
      { label: '명령대로 횃불을 던진다', hint: '지부장의 신임을 얻고, 그 밤의 불길을 평생 본다', values: { loyalty: D },
        fx: [{ op: 'fame', add: 10 }, { op: 'hardship', add: 6 }, { op: 'flag', id: 'burnedVillage' },
             { op: 'log', text: '불길이 마을을 삼켰다. {name}은(는) 끝까지 눈을 돌리지 않았다.', weight: 'heavy' }] },
      { label: '횃불을 내던지고 마을 사람들을 산으로 피신시킨다', hint: '군법회의에 넘겨질 수 있다', values: { justice: D }, mark: 'rebel', danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'rank', add: -1 }, { op: 'flag', id: 'mnDefied' }, { op: 'log', text: '마을은 살았다. {name}의 계급장은 한 줄 줄었다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '명령 불복으로 군법회의에 넘겨졌다. 마을 사람들이 영창 창살 밖에서 고개를 숙였다.', weight: 'heavy' },
                      { op: 'timeline', text: '마을을 태우라는 명령을 거부하고 갇혔다' }] }] },
      { label: '빈 창고에만 불을 놓고 보고서를 꾸민다', hint: '들키지 않으면 아무도 다치지 않는다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.7, then: [{ op: 'flag', id: 'mnDefied' }],
               else: [{ op: 'rank', add: -1 }, { op: 'hardship', add: 3 }, { op: 'log', text: '꾸민 보고서가 들통났다. 지부장은 {name}을(를) 외딴 초소로 쫓아냈다.', weight: 'heavy' }] }] },
    ],
  },
  {
    // v4 cs_corrupt · sm_nezumi를 하나로: 이름 있는 원작의 대령이 아니라 {island} 지부의 상관이다
    id: 'mn_corrupt_superior', kind: 'door', when: at(st('marine'), age(18, 50), seasoned),
    weight: 5, repeat: 'once', speaker: { relation: '뇌물 먹은 대령' },
    title: '썩은 장부', body: '{island} 지부 대령의 금고에서 해적들에게 받은 돈이 적힌 장부가 나왔다. 해적이 마을을 털어도 해군이 늦게 온 까닭이 거기 있었다. 대령이 문가에 서서 {name}을(를) 보고 있다.',
    doors: [
      { label: '장부를 본부에 올린다', hint: '대령은 물러나지만 그 패거리가 등을 노린다', values: { justice: D },
        fx: [{ op: 'fame', add: 10 }, { op: 'person', kind: 'enemy', relation: '원한을 품은 대령' },
             { op: 'chance', p: 0.4, then: [{ op: 'hardship', add: 3 }, { op: 'log', text: '본부는 대령을 물렸지만, 그 부관들이 {name}을(를) 가장 험한 순찰로만 돌렸다.', weight: 'light' }] }] },
      { label: '입을 다물고 몫을 받는다', hint: '돈은 생기고 해적은 계속 마을을 턴다', values: { greed: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'flag', id: 'mnBribed' }, { op: 'hardship', add: 2 }] },
      { label: '장부를 쥐고 대령을 부린다', hint: '지부가 {name}의 말을 듣게 되지만 적을 품고 산다', values: { dominion: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'flag', id: 'mnOfficer' }, { op: 'flag', id: 'mnLeverage' }, { op: 'person', kind: 'enemy', relation: '약점을 잡힌 대령' }] },
    ],
  },
  {
    id: 'mn_let_go', kind: 'door', when: at(st('marine'), age(17, 55), seasoned),
    weight: 5, repeat: { years: 5 }, max: 2, speaker: { relation: '붙잡힌 어린 해적' },
    title: '밧줄에 묶인 소년', body: '붙잡은 해적들 가운데 수염도 안 난 소년이 섞여 있다. 병든 할머니 약값을 벌려고 배에 올랐다며, 호송선에 실리면 다시는 못 볼 거라고 운다.',
    doors: [
      { label: '규정대로 호송선에 태운다', hint: '공적이 오르고 소년의 울음은 오래 남는다', values: { justice: D },
        fx: [{ op: 'fame', add: 6 }, { op: 'hardship', add: 1 }] },
      { label: '밤에 밧줄을 끊어 보내 준다', hint: '들키면 계급장이 날아간다', values: { romance: D }, danger: true,
        fx: [{ op: 'flag', id: 'letPiratesGo' }, { op: 'chance', p: 0.25, then: [{ op: 'rank', add: -1 }, { op: 'log', text: '해적 하나가 빈 것이 들켰다. 책임은 {name}에게 돌아왔다.', weight: 'heavy' }]}] },
      { label: '풀어 주는 대신 두목의 은신처를 불게 한다', hint: '큰 공을 세우고, 소년은 배신자로 산다', values: { ambition: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'person', kind: 'ally', relation: '해적 끄나풀' }] },
    ],
  },
  {
    id: 'mn_comrade_death', kind: 'door', when: at(st('marine'), age(17, 50), seasoned, years(2)),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '돌아오지 않은 동기', body: '토벌전에서 같은 해에 입대한 동기가 돌아오지 않았다. 갑판 위에 덮인 흰 천 아래로 낯익은 군화가 삐져나와 있다.',
    doors: [
      { label: '유품을 들고 동기의 고향을 찾아간다', hint: '가진 돈을 털어 두고 오고, 그 집의 울음을 듣는다', values: { justice: D },
        fx: [{ op: 'losePerson', relation: '훈련소 동기' }, { op: 'money', add: -20000 }, { op: 'hardship', add: 3 },
             { op: 'log', text: '동기의 고향 집에 군모와 모은 돈을 두고 왔다. 문간에서 노모가 끝내 말을 잇지 못했다.', weight: 'heavy' }] },
      { label: '동기를 쓰러뜨린 해적을 끝까지 쫓는다', hint: '몇 해가 걸려도 놓지 않는다. 몸이 먼저 상한다', values: { loyalty: D }, mark: 'obsession', danger: true,
        fx: [{ op: 'losePerson', relation: '훈련소 동기' }, { op: 'hp', add: -20 }, { op: 'fame', add: 15 }, { op: 'injury', severity: 'light' }, { op: 'timeline', text: '동기를 죽인 해적을 끝까지 쫓았다' }] },
      { label: '제복을 접어 관 위에 올리고 해군을 떠난다', hint: '바다의 싸움에서 손을 떼고 뭍으로 돌아간다', values: { peace: D },
        fx: [{ op: 'losePerson', relation: '훈련소 동기' }, { op: 'standing', to: 'civil' }, ...PART_SQUAD, { op: 'log', text: '동기의 관 위에 제복을 접어 올렸다. 다시는 입지 않았다.', weight: 'heavy' }] },
    ],
  },

  // ---------------------------------------------------------------- 분대장과 장교
  {
    id: 'mn_harbor_rule', kind: 'door', when: at(st('marine'), officer, age(19, 55), seasoned),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '말 없는 항구', body: '{name}이(가) 치안을 맡은 항구는 해적이 드나드는 곳이다. 주민들은 해적에게도 해군에게도 입을 열지 않는다. 지난밤 순찰병 둘이 골목에서 얻어맞았다.',
    doors: [
      { label: '해적 끄나풀 하나를 광장에 매달아 본보기로 삼는다', hint: '항구가 조용해지고, 주민들은 {name}을(를) 해적보다 무서워한다', values: { dominion: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'flag', id: 'feared' }, { op: 'person', kind: 'enemy', relation: '항구의 원한' }] },
      { label: '제복을 벗고 주민들의 일을 거든다', hint: '마음을 얻기까지 몇 해와 꽤 많은 돈이 든다', values: { romance: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'person', kind: 'ally', relation: '항구의 술집 주인' },
             { op: 'log', text: '몇 달 동안 술값을 냈다. 어느 날 술집 주인이 해적선의 입항 날짜를 쪽지로 건넸다.', weight: 'light' }] },
      { label: '밀수꾼과 손잡고 항구의 질서를 판다', hint: '항구는 조용하고 주머니는 불어난다', values: { greed: D }, 
        fx: [{ op: 'money', add: 60000 }, { op: 'flag', id: 'mnBribed' }, { op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'mn_storm_chase', kind: 'door', when: at(st('marine'), officer, age(19, 55), seasoned),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '폭풍 속의 추격', body: '쫓던 해적선이 폭풍 속에서 암초에 걸려 부서졌다. 바다에 떠 있는 해적 선원들이 살려 달라고 소리친다. 그 너머로 두목의 작은 배가 달아나고 있다.',
    doors: [
      { label: '배를 멈추고 해적 선원들을 끌어올린다', hint: '두목은 놓치고, 살린 자들은 감옥으로 간다', values: { loyalty: D },
        fx: [{ op: 'fame', add: 3 }, { op: 'log', text: '밤새 밧줄을 던져 열한 명을 건져 올렸다. 두목의 배는 수평선 너머로 사라졌다.', weight: 'light' }] },
      { label: '물에 뜬 자들을 두고 두목을 쫓는다', hint: '큰 공을 세우지만 뒤에 남긴 비명을 듣는다', values: { ambition: D },
        fx: [{ op: 'fame', add: 20 }, { op: 'hardship', add: 4 }] },
      { label: '폭풍 한가운데로 돛을 올려 둘 다 잡는다', hint: '배가 뒤집힐 수 있다', special: 'romance', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6, then: [{ op: 'fame', add: 25 }, { op: 'log', text: '폭풍을 가로질러 두목의 배를 들이받고, 돌아오는 길에 물에 뜬 자들까지 건졌다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -30 }, { op: 'injury', severity: 'heavy' }, { op: 'log', text: '군함의 돛대가 부러졌다. {name}은(는) 부러진 돛대에 깔렸다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'mn_transfer', kind: 'door', when: at(st('marine'), officer, age(20, 50), seasoned, sea('east')),
    weight: 5, repeat: 'once', speaker: { relation: '본부의 인사 장교' },
    title: '전출 명령서', body: '본부에서 명령서가 왔다. 위대한 항로 깊숙한 샤본디 제도의 주둔지로 옮기면 한 계급 올려 주겠다고 한다. 이스트 블루로는 쉽게 돌아올 수 없는 자리다.',
    doors: [
      { label: '명령서에 서명하고 위대한 항로로 간다', hint: '세상에서 가장 험한 바다를 보게 되고, 고향에서 아주 멀어진다', values: { romance: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
             { op: 'log', text: '군함을 몇 번 갈아탄 끝에 비눗방울이 떠오르는 섬에 내렸다. 거리에 해군과 해적과 노예 상인이 뒤섞여 있었다.', weight: 'heavy' },
             { op: 'timeline', text: '샤본디 제도의 주둔지로 전출되었다' }] },
      { label: '이스트 블루에 남아 {town}의 바다를 지킨다', hint: '진급은 멀어지고, 낯익은 얼굴들 곁에 남는다', values: { romance: D }, closes: true,
        fx: [{ op: 'fame', add: -2 }] },
    ],
  },
  {
    id: 'mn_rev_captive', kind: 'door', when: at(st('marine'), age(18, 55), seasoned, years(2)),
    weight: 4, repeat: 'once', speaker: { relation: '붙잡힌 혁명군' },
    title: '창살 너머의 혁명군', body: '{name}이(가) 지키는 영창에 혁명군 하나가 갇혔다. 밤마다 그 혁명군은 창살 너머로, 바다 건너 어느 왕국에서 굶어 죽은 사람들 이야기를 한다. 내일이면 본부로 넘겨진다.',
    doors: [
      { label: '심문해 혁명군의 은신처를 알아낸다', hint: '큰 공을 세우고, 끌려가던 포로의 눈빛을 잊지 못한다', values: { ambition: D },
        fx: [{ op: 'fame', add: 20 }, { op: 'rank', add: 1 }, { op: 'flag', id: 'mnOfficer' }, { op: 'hardship', add: 2 }] },
      { label: '포로의 이야기를 끝까지 듣고 적어 둔다', hint: '정부가 말하지 않는 바다를 알게 된다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'revSeed' }] },
      { label: '자물쇠를 풀고 그와 함께 달아난다', hint: '제복을 버리고 쫓기는 쪽에 선다', values: { justice: D },
        fx: [{ op: 'standing', to: 'revolution' }, ...PART_SQUAD, { op: 'flag', id: 'deserter' }, { op: 'person', kind: 'ally', relation: '영창에서 풀어 준 혁명군' },
             { op: 'timeline', text: '붙잡힌 혁명군을 풀어 주고 함께 달아났다' }] },
    ],
  },
  {
    // v4 sm_tenryu: 명령을 따르는 것이 늘 정의는 아닌 판
    id: 'mn_tenryu', kind: 'door', when: at(st('marine', 'cp'), age(18, 60), sea('sabaody'), seasoned, cpSettled),
    weight: 6, repeat: 'once', speaker: { relation: '천룡인' },
    title: '천룡인의 행차', body: '샤본디 제도를 지나는 천룡인의 호위를 맡았다. 길가에서 미처 무릎을 꿇지 못한 노인에게 천룡인이 총을 겨눈다. 호위대장은 앞만 보라고 이른다.',
    doors: [
      { label: '호위 대열을 지킨다', hint: '총성이 울리고, 호위 수당과 함께 그 소리를 가지고 산다', values: { loyalty: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'hardship', add: 6 },
             { op: 'log', text: '총성이 울렸다. 대열은 흐트러지지 않았다. {name}도 흐트러지지 않았다.', weight: 'heavy' }] },
      { label: '노인 앞을 막아선다', hint: '천룡인의 앞을 막은 자는 계급장을 잃거나 사슬에 묶인다', values: { justice: D }, mark: 'rebel', danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'rank', add: -2 }, { op: 'unflag', id: 'mnOfficer' }, { op: 'fame', add: 15 }, { op: 'flag', id: 'govEnemy' },
                      { op: 'log', text: '천룡인은 {name}의 얼굴에 침을 뱉고 지나갔다. 계급장 두 줄이 떨어졌고, 말단 수병들 사이에 그 이름이 돌았다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '천룡인의 앞을 막은 죄로 사슬에 묶였다.', weight: 'heavy' },
                      { op: 'timeline', text: '천룡인의 앞을 막아서고 갇혔다' }] }] },
      { label: '발을 헛디딘 척 넘어져 총구를 흐트러뜨린다', hint: '노인은 달아나고, {name}은(는) 호위대장에게 맞는다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'injury', severity: 'light' }, { op: 'hp', add: -12 }, { op: 'flag', id: 'savedFromNoble' }] },
    ],
  },
  {
    // v4 sm_impel: 호송하던 죄수가 거래를 걸어오는 판
    id: 'mn_impel_escort', kind: 'door', when: at(st('marine'), age(20, 60), seasoned, sea('sabaody'), years(2)),
    weight: 5, repeat: 'once', speaker: { relation: '호송되는 거물 해적' },
    title: '대감옥 호송선', body: '바다 밑 대감옥으로 가는 호송선. 사슬에 묶인 거물 해적이 {name}에게만 들리게 속삭인다. 사슬을 풀어 주면 묻어 둔 보물의 자리를 알려 주겠다고. 원하면 정부가 숨긴 이야기도 해 주겠다고.',
    doors: [
      { label: '거래를 물리치고 대감옥 문 앞까지 데려간다', hint: '공적이 오르고 해적은 저주를 퍼붓는다', values: { justice: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'rank', add: 1 }, { op: 'flag', id: 'mnOfficer' }, { op: 'person', kind: 'enemy', relation: '대감옥에 갇힌 해적' }] },
      { label: '정부가 숨긴 이야기만 듣고 입을 닫는다', hint: '들은 것이 알려지면 {name}도 갇힌다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'flag', id: 'heardSecret' }, { op: 'base', key: 'int', add: 1 },
             { op: 'chance', p: 0.15, then: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '죄수와 나눈 귓속말이 감옥장의 귀에 들어갔다. 호송하던 배에 실려 그대로 대감옥에 내렸다.', weight: 'heavy' }] }] },
      { label: '보물 자리를 듣고 거짓 약속을 한다', hint: '보물을 얻지만, 그 해적이 언젠가 나오면 끝이다', values: { greed: D }, 
        fx: [{ op: 'money', add: 120000 }, { op: 'person', kind: 'enemy', relation: '속아 넘어간 거물 해적' }] },
      { label: '사슬을 풀고 함께 호송선을 빼앗는다', hint: '해군의 배가 해적선이 된다', special: 'freedom', values: { freedom: D }, danger: true,
        fx: [{ op: 'standing', to: 'pirate' }, ...PART_SQUAD, { op: 'fame', add: 40 }, { op: 'hp', add: -15 }, { op: 'flag', id: 'escapee' },
             { op: 'log', text: '호송선의 깃발이 내려가고 해골 깃발이 올라갔다. 해군은 그날 {name}의 이름을 수배서에 올렸다.', weight: 'heavy' },
             { op: 'timeline', text: '호송하던 해적과 함께 호송선을 빼앗았다' }] },
    ],
  },
  {
    id: 'mn_desert', kind: 'door', when: at(st('marine'), age(18, 50), seasoned, years(3), { c: 'hardship', min: 4 }),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '밤 보초', body: '밤 보초를 서는 부두에 작은 배 하나가 묶여 있다. 밧줄 한 가닥만 풀면 아침 점호 전에 수평선 너머로 사라질 수 있다. 제복의 단추가 유난히 무겁다.',
    doors: [
      { label: '제복을 벗어 부두에 두고 노를 젓는다', hint: '탈영병으로 쫓기며 뭍의 삶을 새로 산다', values: { freedom: D },
        fx: [{ op: 'standing', to: 'civil' }, ...PART_SQUAD, { op: 'flag', id: 'deserter' }, { op: 'flag', id: 'wanted' },
             { op: 'log', text: '부두에 개어 둔 제복 위로 새벽 이슬이 내렸다. 그 무렵 {name}은(는) 이미 먼바다에 있었다.', weight: 'heavy' }] },
      { label: '쫓던 해적들의 배를 찾아가 몸을 맡긴다', hint: '어제의 적과 같은 깃발 아래 선다', values: { romance: D },
        fx: [{ op: 'standing', to: 'pirate' }, ...PART_SQUAD, { op: 'flag', id: 'deserter' }, { op: 'person', kind: 'crew', relation: '해군 출신을 받아 준 해적' },
             { op: 'timeline', text: '해군을 떠나 해적선에 올랐다' }] },
      { label: '밧줄에서 손을 떼고 아침까지 선다', hint: '한 해를 더 버틴다. 버티는 법이 몸에 밴다', values: { loyalty: D }, mark: 'unyielding',
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: -2 }] },
    ],
  },

  // ---------------------------------------------------------------- 원작의 동료와 상관 (지나가는 만남)
  {
    // 원작: 루피가 셸스 타운을 떠난 뒤 코비와 헤르메포는 해군에 들어가 가프 중장의 배에서 잡일부터 했다.
    // 그 이듬해(주인공 열여덟 무렵)부터는 본부에서 가프에게 따로 훈련받으므로 열일곱 한 해만 연다
    id: 'mn_coby', kind: 'door', when: at(st('marine'), age(17, 17), sea('east')),
    weight: 6, repeat: 'once', speaker: { canon: 'coby' },
    title: '잡일하는 두 신병', body: '보급차 들른 군함에서 분홍 머리 신병과 턱이 뾰족한 신병이 갑판을 닦고 있다. 분홍 머리는 언젠가 해군 대장이 되겠다고 말하고, 턱이 뾰족한 쪽은 한때 대령 집안의 도련님이었다고 수군거린다.',
    doors: [
      { label: '밤마다 분홍 머리의 대련 상대가 되어 준다', hint: '겁 많던 신병이 조금씩 단단해진다. {name}의 쉴 틈이 사라진다', values: { freedom: D },
        fx: [{ op: 'person', kind: 'ally', relation: '대련을 청하던 신병', canon: 'coby' }, { op: 'mastery', branch: 'fist', add: 5 }, { op: 'hp', add: -5 }] },
      { label: '대장이 되겠다는 꿈에 누가 먼저 닿나 내기를 건다', hint: '평생 견줄 이름이 하나 생긴다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'rival', relation: '먼저 대장이 되겠다던 신병', canon: 'coby' }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '도련님 신병에게 갑판 일을 곱절로 몰아준다', hint: '거들먹거리던 버릇이 꺾이고, 원한도 남는다', values: { dominion: D },
        fx: [{ op: 'person', kind: 'rival', relation: '얼차려를 받던 도련님 신병', canon: 'helmeppo' }, { op: 'fame', add: 2 }] },
    ],
  },
  {
    // 원작: 타시기는 스모커의 부하로 로그타운에 있다가 루피를 쫓아 위대한 항로로 간다 (주인공 열일곱 무렵)
    id: 'mn_tashigi', kind: 'door', when: at(st('marine'), age(15, 17), sea('east'), { c: 'island', is: ['로그타운'] }),
    weight: 6, repeat: 'once', speaker: { canon: 'tashigi' },
    title: '안경 쓴 상사', body: '로그타운 지부의 안경 쓴 여자 상사가 연병장에서 {name}을(를) 붙잡는다. 이름난 칼을 악당이 쥐고 있는 꼴은 못 본다며, 명검을 지닌 해적을 함께 잡으러 가자고 한다. 대령의 시가 연기가 창문 밖으로 흘러나온다.',
    doors: [
      { label: '목검을 들고 그녀의 대련 상대가 된다', hint: '칼 솜씨가 늘고, 매번 진다', needs: ['sword'], values: { ambition: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'person', kind: 'rival', relation: '대련하던 상사', canon: 'tashigi' }, { op: 'hp', add: -6 }] },
      { label: '명검을 지닌 해적의 은신처를 함께 뒤진다', hint: '해적을 잡으면 공이 오르고, 칼은 그녀가 거둔다', values: { justice: D }, danger: true,
        fx: [{ op: 'fame', add: 8 }, { op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '명검을 쫓던 상사', canon: 'tashigi' }] },
      { label: '칼의 이름과 내력을 함께 뒤적인다', hint: '지부 서고에서 밤을 새우고 다음 날 순찰에서 존다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '칼의 내력에 밝은 상사', canon: 'tashigi' }] },
    ],
  },

  // ---------------------------------------------------------------- CP로 가는 길과 CP의 처지
  {
    // v4 sm_baroque를 이름 없는 해적단으로: 잠입은 CP로 가는 길의 씨앗이다
    id: 'mn_undercover', kind: 'door', when: at(st('marine'), age(18, 45), seasoned, years(2)),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '석 달의 잠입', body: '해적단에 섞여 든 지 석 달. 내일 새벽이면 해군이 그 배를 덮친다. 그사이 {name}에게 술을 가르쳐 준 늙은 갑판장이 오늘 밤 고향 이야기를 하며 웃는다.',
    doors: [
      { label: '예정대로 새벽에 신호탄을 쏜다', hint: '잠입은 성공하고, 갑판장도 함께 묶인다', values: { justice: D },
        fx: [{ op: 'fame', add: 20 }, { op: 'flag', id: 'mnUndercover' }, { op: 'hardship', add: 3 },
             { op: 'log', text: '새벽 하늘에 붉은 신호탄이 올랐다. 묶여 가던 갑판장이 끝내 {name}을(를) 돌아보지 않았다.', weight: 'heavy' }] },
      { label: '갑판장에게만 밤사이 달아나라고 귀띔한다', hint: '빈자리가 들키면 {name}이(가) 의심받는다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'flag', id: 'mnUndercover' }, { op: 'fame', add: 10 },
             { op: 'chance', p: 0.3, then: [{ op: 'rank', add: -1 }, { op: 'log', text: '한 사람이 모자랐다. 보고서를 쓰는 {name}의 손이 떨렸다.', weight: 'light' }]}] },
      { label: '신호탄을 바다에 버리고 그 배를 차지한다', hint: '해적들의 우두머리가 되고, 해군에게 쫓긴다', special: 'dominion', values: { dominion: D }, danger: true,
        fx: [{ op: 'standing', to: 'pirate' }, ...PART_SQUAD, { op: 'flag', id: 'captain' }, { op: 'fame', add: 30 }, { op: 'person', kind: 'crew', relation: '잠입한 배의 갑판장' },
             { op: 'timeline', text: '잠입한 해적선을 차지하고 해적이 되었다' }] },
    ],
  },
  {
    id: 'cp_recruit', kind: 'door', when: at(st('marine'), age(20, 45), years(2), { c: 'flag', id: 'mnUndercover', has: true }),
    weight: 8, repeat: 'once', speaker: { relation: '얼굴 없는 정부 관리' },
    title: '잠입 보고서를 읽은 자', body: '계급장도 이름표도 없는 관리가 {name}의 잠입 보고서를 넘기며 웃는다. 이런 일을 평생 하는 곳이 있다고, 거기서는 해군이 볼 수 없는 것을 본다고 한다.',
    doors: [
      { label: '정부가 감춘 것을 보러 그 기관에 들어간다', hint: '제복을 벗고, 본 것은 무덤까지 가져간다', values: { inquiry: D },
        fx: [{ op: 'standing', to: 'cp' }, CP_NEW, ...PART_SQUAD, { op: 'master', name: '첩보 기관의 교관', branch: 'fist', cap: 4, years: 4, paid: false },
             { op: 'timeline', text: '정부의 첩보 기관에 들어갔다' }] },
      { label: '더 높은 자리를 조건으로 건다', hint: '기관에 들어가며 처음부터 위에 선다', values: { ambition: D },
        fx: [{ op: 'standing', to: 'cp' }, CP_NEW, ...PART_SQUAD, { op: 'rank', add: 1 }, { op: 'money', add: 30000 }, { op: 'timeline', text: '조건을 걸고 정부의 첩보 기관에 들어갔다' }] },
      { label: '함께 바다를 지켜 온 분대를 두고 갈 수 없다며 거절한다', hint: '관리는 다시 찾아오지 않는다', values: { loyalty: D }, closes: true, fx: [] },
    ],
  },
  {
    id: 'cp_nameless', kind: 'door', when: at(st('cp'), age(18), { c: 'flag', id: 'cpNew', has: true }),
    weight: 9, repeat: 'once', speaker: { relation: '첩보 기관의 교관' },
    title: '이름을 버리는 날', body: '기관의 첫날. 교관이 {name}의 이름과 태어난 곳이 적힌 서류를 난로 앞에 내민다. 오늘부터는 번호로 불린다고, {town}에 보내던 편지도 끝이라고 한다.',
    doors: [
      { label: '제 손으로 서류를 불에 던진다', hint: '기관에 온몸을 맡긴다. {town}에 두고 온 끈이 끊어진다', values: { loyalty: D },
        fx: [{ op: 'unflag', id: 'cpNew' }, { op: 'flag', id: 'cpNameless' }, { op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: 3 },
             { op: 'log', text: '불길 속에서 이름이 오그라들었다. 그날부터 {name}은(는) 번호로 불렸다.', weight: 'heavy' }] },
      { label: '태우기 전에 서류를 끝까지 읽는다', hint: '정부가 {name}에 대해 무엇을 아는지 보게 된다. 규율을 어긴 값을 치른다', values: { inquiry: D },
        fx: [{ op: 'unflag', id: 'cpNew' }, { op: 'hp', add: -10 }, { op: 'reveal' }, { op: 'flag', id: 'cpReadFile' },
             { op: 'log', text: '서류에는 {name}도 몰랐던 일들이 적혀 있었다. 교관의 매가 그 뒤를 따랐다.', weight: 'heavy' }] },
      { label: '불길 앞에서 {town}의 거리 이름을 하나씩 외운다', hint: '번호로 불려도 돌아갈 곳을 잊지 않는다. 교관이 그 버릇을 수상히 여긴다', values: { inquiry: D },
        fx: [{ op: 'unflag', id: 'cpNew' }, { op: 'flag', id: 'cpKeptName' }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'cp_known_target', kind: 'door', when: at(st('cp'), age(20, 60), cpSettled),
    weight: 6, repeat: 'once', speaker: { relation: '기관의 명령서' },
    title: '명령서의 이름', body: '내려온 명령서에 낯익은 이름이 있다. {town}에서 {name}에게 글을 가르쳐 준 늙은 책방 주인이다. 금지된 역사를 몰래 연구했다는 죄목이 적혀 있다.',
    doors: [
      { label: '명령대로 처리한다', hint: '기관의 신임을 얻고, {town}에 다시는 발을 들이지 못한다', values: { loyalty: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'fame', add: 20 }, { op: 'hardship', add: 8 },
             { op: 'log', text: '명령서의 이름 위에 줄이 그어졌다. 보고서에는 한 줄만 남았다.', weight: 'heavy' }, { op: 'timeline', text: '어릴 적 스승을 명령대로 지웠다' }] },
      { label: '죽은 것으로 꾸미고 먼 섬으로 빼돌린다', hint: '들키면 {name}이(가) 지워질 차례다', values: { romance: D }, danger: true,
        fx: [{ op: 'chance', p: 0.65, then: [{ op: 'flag', id: 'cpSparedTarget' }, { op: 'person', kind: 'ally', relation: '살려 보낸 책방 주인' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '꾸민 시체가 들통났다. 기관은 {name}을(를) 바다 밑 감옥으로 보냈다.', weight: 'heavy' }] }] },
      { label: '책방 주인이 지키던 연구를 먼저 읽는다', hint: '세상이 감춘 것을 알게 되고, 같은 죄를 짓게 된다', values: { inquiry: D }, danger: true,
        fx: [{ op: 'flag', id: 'readForbidden' }, { op: 'base', key: 'int', add: 2 },
             { op: 'chance', p: 0.3, then: [{ op: 'flag', id: 'govEnemy' }, { op: 'hardship', add: 4 }] }] },
    ],
  },
  {
    // 원작의 CP9처럼 한 섬에 몇 해를 이웃으로 묻혀 산다
    id: 'cp_long_cover', kind: 'door', when: at(st('cp'), age(22, 55), years(3), cpSettled),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '이웃으로 산 몇 해', body: '임무로 {island}에 묻혀 산 지 몇 해. 이웃들은 {name}을(를) 가게 일꾼으로 알고, 옆집 아이는 날마다 놀아 달라고 조른다. 오늘 임무가 끝났다는 전갈이 왔다.',
    doors: [
      { label: '이웃들 앞에서 가면을 벗고 떠난다', hint: '공을 인정받고, 섬 사람들의 얼굴이 굳는다', values: { ambition: D },
        fx: [{ op: 'fame', add: 15 }, { op: 'rank', add: 1 }, { op: 'hardship', add: 3 }] },
      { label: '거짓 보고서를 쓰고 이웃으로 남는다', hint: '기관을 등지고 {island}에서 조용히 늙어 간다. 기관은 배신자를 잊지 않는다', values: { peace: D }, danger: true,
        fx: [{ op: 'standing', to: 'settled' }, { op: 'flag', id: 'cpDefector' }, { op: 'flag', id: 'wanted' },
             { op: 'timeline', text: '첩보 기관을 등지고 {island}에 눌러살았다' }] },
      { label: '떠나기 전 이웃의 빚을 몰래 갚아 둔다', hint: '모은 돈이 사라지고, 아무도 누가 했는지 모른다', values: { peace: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'log', text: '떠나는 날 아침, 옆집 문틈에 빚 문서를 태운 재를 넣어 두었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'cp_erase_village', kind: 'door', when: at(st('cp'), age(22, 60), years(2), cpSettled),
    weight: 5, repeat: 'once', speaker: { relation: '기관의 장관' },
    title: '지도에서 지울 마을', body: '정부가 학자들이 숨어 사는 마을 하나를 지도에서 지우기로 했다. {name}이(가) 몇 달 동안 모은 주민 명단이 군함의 포격 순서가 된다. 명단 맨 아래에 {name}이(가) 글을 가르친 아이의 이름이 있다.',
    doors: [
      { label: '명단을 그대로 넘긴다', hint: '세상의 질서는 지켜지고, 마을은 지도에서 사라진다', values: { dominion: D },
        fx: [{ op: 'fame', add: 25 }, { op: 'rank', add: 1 }, { op: 'hardship', add: 8 }, { op: 'timeline', text: '학자들의 마을을 지운 명단을 넘겼다' }] },
      { label: '명단을 불태우고 혁명군에 마을의 위치를 알린다', hint: '마을 사람들이 배로 빠져나가고, {name}은(는) 기관에서 사라진다', values: { justice: D },
        fx: [{ op: 'standing', to: 'revolution' }, { op: 'flag', id: 'govEnemy' }, { op: 'flag', id: 'cpDefector' },
             { op: 'log', text: '포격이 시작되었을 때 마을은 비어 있었다. 그 밤 {name}은(는) 혁명군의 배에 있었다.', weight: 'heavy' },
             { op: 'timeline', text: '기관을 등지고 혁명군으로 건너갔다' }] },
      { label: '아이의 이름 한 줄만 지운다', hint: '하나는 살리고 나머지는 넘긴다. 빈 줄을 누가 보면 끝이다', values: { romance: D }, danger: true,
        fx: [{ op: 'hardship', add: 6 },
             { op: 'chance', p: 0.75, then: [{ op: 'person', kind: 'ally', relation: '명단에서 지운 아이' }],
               else: [{ op: 'standing', to: 'prisoner' }, { op: 'log', text: '지운 한 줄이 들통났다. 기관은 {name}을(를) 바다 밑 감옥으로 보냈다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'cp_way_out', kind: 'door', when: at(st('cp'), age(25, 60), years(4), cpSettled),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '나가는 문이 없는 곳', body: '기관에 들어온 지 여러 해. 나가는 길은 죽음뿐이라고들 한다. 오늘 밤 맡은 임무지는 마침 수평선 너머로 배가 끊이지 않는 큰 항구다.',
    doors: [
      { label: '죽은 것으로 꾸미고 항구의 군중 속으로 사라진다', hint: '새 이름으로 살지만, 기관은 시체를 찾을 때까지 쫓는다', values: { freedom: D }, danger: true,
        fx: [{ op: 'standing', to: 'civil' }, { op: 'flag', id: 'cpDefector' }, { op: 'flag', id: 'wanted' }, { op: 'money', add: -20000 },
             { op: 'log', text: '부두에 피 묻은 외투만 남았다. 같은 시각 {name}은(는) 낯선 이름으로 상선에 올랐다.', weight: 'heavy' }] },
      { label: '남아서 기관의 꼭대기를 노린다', hint: '더 위험한 임무와 더 높은 자리가 기다린다', values: { ambition: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'fame', add: 25 }, { op: 'hp', add: -10 }] },
      { label: '옛 부대로 돌려보내 달라고 청한다', hint: '받아들여질 수도, 입을 막으려 들 수도 있다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'standing', to: 'marine' }, BOOT, FIRST, { op: 'flag', id: 'mnOfficer' }, { op: 'log', text: '기관은 {name}을(를) 해군으로 돌려보냈다. 본 것을 말하면 어떻게 되는지도 함께 일러 주었다.', weight: 'heavy' }],
               else: [{ op: 'injury', severity: 'heavy' }, { op: 'hp', add: -30 }, { op: 'log', text: '청을 올린 다음 날 밤, 숙소에 손님이 찾아왔다. 겨우 살아남았다.', weight: 'heavy' }] }] },
    ],
  },
];
