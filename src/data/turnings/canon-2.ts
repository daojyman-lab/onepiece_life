// 원작과 겹치는 순간 (과제 10) 둘째: 위대한 항로와 신세계, 그리고 해군 · 혁명군 쪽의 만남.
// 원작의 때: 알라바스타는 주인공이 열일곱, 워터 세븐은 열여덟, 샤본디와 정상결전은 열아홉 무렵. 두 해 뒤 신세계.
// 주인공은 원작의 결말을 바꾸지 않는다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { SEAFARING, age, at, sea, st } from './paths';
import type { Turning } from '../../core/types';

const D = V.value.door;
const dock = (...is: string[]) => at({ c: 'ashore' }, { c: 'island', is });

export const CANON_SEA: Turning[] = [
  // ---------------------------------------------------------------- 위대한 항로
  {
    // v4 cc_zoro_lost
    id: 'cn_zoro_lost', kind: 'door', when: at(age(17, 24), st(...SEAFARING, 'civil'), sea('east', 'gl_entry', 'gl_first')),
    weight: 5, repeat: 'once', speaker: { canon: 'zoro' },
    title: '세 번째 지나가는 검객', body: '{island}의 같은 골목을 칼 세 자루를 찬 초록 머리 검객이 세 번째 지나간다. 이번에는 {name} 앞에서 멈추더니, 항구가 어느 쪽이냐고 퉁명스럽게 묻는다. 항구는 그가 걸어온 쪽이다.',
    doors: [
      { label: '길 대신 한 판 겨루자고 청한다', hint: '목숨까지는 아니어도 크게 베일 수 있다. 세상에서 가장 강해지겠다는 검이다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'mastery', branch: 'sword', add: 12 }, { op: 'person', kind: 'rival', relation: '길을 잃은 검객', canon: 'zoro' },
             { op: 'chance', p: 0.3, then: [{ op: "log", text: "검객의 세 자루 칼이 동시에 번뜩였다. 비틀거리는 팔에서 피가 흘러 손잡이를 놓쳤다.", weight: "light" }, { op: 'injury', severity: 'light' }] , else: [{ op: "log", text: "검객은 칼등으로 승부를 끝냈다. 상처를 누르는 사이 그가 또 엉뚱한 골목으로 걸어갔다.", weight: "light" }]}] },
      { label: '항구까지 직접 데려다준다', hint: '반나절이 걸린다. 그 사이 검객은 두 번 다른 골목으로 새려 한다', values: { romance: D },
        fx: [{ op: "log", text: "항구 표지판을 두 번 지나치려는 검객을 붙잡아 부두까지 데려갔다. 그는 배에 오르며 짧게 고맙다고 했다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '항구까지 데려다준 검객', canon: 'zoro' }] },
      { label: '정반대 쪽을 가리켜 준다', hint: '검객은 고맙다며 성큼성큼 걸어간다. 다시는 마주치지 않기를 빈다', values: { freedom: D },
        fx: [{ op: "log", text: "검객은 알려 준 반대편 골목으로 씩씩하게 사라졌다. 잠시 뒤 익숙한 발소리가 다시 등 뒤에서 들렸다.", weight: "light" }, { op: 'flag', id: 'misledZoro' }, { op: 'timeline', text: '길 잃은 검객에게 엉뚱한 길을 알려 주었다', canon: 'zoro' }] },
    ],
  },
  {
    // v4 cc_ace_bar
    id: 'cn_ace_bar', kind: 'door', when: at(age(17, 18), st(...SEAFARING, 'civil', 'shipwright', 'settled'), sea('gl_entry', 'gl_first'), ...dock('드럼 왕국', '알라바스타 왕국')),
    weight: 15, repeat: 'once', speaker: { canon: 'ace' },
    title: '밥 먹다 잠든 사내', body: '{island}의 식당에서 등에 해골 문신을 한 사내가 밥을 먹다 그대로 접시에 얼굴을 묻고 잠들었다. 흰수염 해적단의 2번대 대장이라는 수군거림이 돈다. 불량배 셋이 그의 모자와 돈주머니로 손을 뻗는다.',
    recall: [
      { when: [{ c: 'choiceAgo', turning: 'cn_ace_thugs', door: 0 }], text: '고개를 옆으로 돌리는 순간 뺨의 주근깨가 보였다. 그레이 터미널에서 불량배들을 쫓고 고깃덩이를 반 뜯어 던져 주던 바로 그 얼굴이었다.' },
      { when: [{ c: 'person', relation: '주근깨 소년', has: true }], text: '어릴 적 산적들을 불러 불량배들을 쫓던 날, 저 주근깨 소년과 흙먼지 속에서 눈이 마주쳤다. 주근깨는 그때 그대로였다.' },
      { when: [{ c: 'choiceAgo', turning: 'cn_ace_thugs', door: 2 }], text: '주근깨를 보고서야 알아보았다. 그레이 터미널에서 이 소년의 싸움을 두고 내기를 걸었다가 차가운 눈총을 받은 적이 있다.' },
    ],
    doors: [
      { label: '모자를 지켜 주고 깨어난 사내와 밥을 나눈다', hint: '불량배들을 먼저 막아야 한다. 사내의 팔꿈치 옆에는 빈자리가 하나 있다', meal: true, values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 8 }, { op: 'person', kind: 'ally', relation: '불주먹의 사내', canon: 'ace' },
             { op: 'flag', id: 'ateWithAce' },
             { op: 'log', text: '깨어난 에이스가 검지 하나로 식은 수프를 데우고 고기를 반씩 나눴다. “우리 배에선 마르코랑 죠즈 사이에 앉으면 뼈도 안 남거든.” 주방장이 모자에 계산서를 꽂아 돌려주자 에이스가 웃다가 수프에 코를 박았다.', weight: 'heavy' }] },
      { label: '소란을 틈타 사내의 돈주머니를 먼저 챙긴다', hint: '불의 주먹이 깨어나면 끝이다', values: { greed: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "불량배들이 뒤엉킨 틈에 돈주머니를 빼내 식당 뒷문으로 빠져나왔다. 사내는 접시에서 고개도 들지 않았다.", weight: "light" }, { op: 'money', add: 45000 }],
               else: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'light' }, { op: 'person', kind: 'rival', relation: '돈주머니를 지킨 불주먹', canon: 'ace' },
                      { op: 'log', text: '손끝이 주머니에 닿는 순간 식당 안이 불길로 가득 찼다.', weight: 'heavy' }] }] },
      { label: '엮이지 않고 밥값을 치르고 나간다', hint: '등 뒤에서 식탁이 부서지는 소리가 난다', values: { peace: D },
        fx: [{ op: "log", text: "계산을 마치고 문을 닫자 뒤에서 의자 부서지는 소리와 불량배들의 비명이 이어졌다.", weight: "light" }, { op: 'timeline', text: '불주먹의 사내가 잠든 식당에서 조용히 나왔다', canon: 'ace' }] },
    ],
  },
  {
    id: 'cn_chopper_drum', kind: 'door', when: at(age(12, 17), st('child', ...SEAFARING, 'civil'), sea('gl_entry'), ...dock('드럼 왕국')),
    weight: 5, repeat: 'once', speaker: { canon: 'chopper' },
    title: '눈밭의 파란 코', body: '드럼 왕국 산자락에서 분홍 모자에 뿔이 달린 순록이 약초를 캐고 있었다. 발소리가 나자 나무 뒤로 숨었다. 얼굴만 가렸고 몸통이 통째로 나와 있었다. “거기, 그 버섯은 내려놔! 그건 배가 아파지는 거야!” 들키는 것보다 환자가 생기는 게 더 무서운 모양이었다.',
    doors: [
      { label: '못 본 척 등을 돌리고 앉아 약초 캐는 걸 돕는다', hint: '해 질 때까지 말없이 캔다. 순록이 조금씩 다가온다', values: { peace: D },
        fx: [{ op: "log", text: "말없이 약초를 골라 바구니에 담자 순록이 나무 뒤에서 나왔다. 돌아갈 때는 상처에 바를 약까지 쥐여 주었다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '파란 코의 의사', canon: 'chopper' }, { op: 'hp', add: 10 }] },
      { label: '앓던 곳을 보여 주고 진찰을 청한다', hint: '산꼭대기 성의 늙은 의사에게 데려간다. 약값이 비싸다', values: { inquiry: D },
        fx: [{ op: "log", text: "순록이 산꼭대기 성으로 길을 열었다. 늙은 의사는 약값을 받아 들고 환부를 살폈고, 순록은 처치가 끝날 때까지 곁을 지켰다.", weight: "light" }, { op: 'money', add: -15000 }, { op: 'hp', add: 30 }, { op: 'person', kind: 'ally', relation: '진찰해 준 파란 코의 의사', canon: 'chopper' }] },
      { label: '괴물이라며 소리치는 마을 사냥꾼들을 막아선다', hint: '사냥꾼들과 맞붙는다. 순록은 그 틈에 달아난다', values: { justice: D }, danger: true,
        fx: [{ op: "log", text: "사냥꾼의 활을 밀쳐 내는 사이 어깨를 다쳤다. 순록은 숲으로 달아났다가 발자국을 따라 돌아와 상처를 살폈다.", weight: "light" }, { op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '지켜 준 파란 코의 순록', canon: 'chopper' }] },
    ],
  },
  {
    // 알라바스타 내전. 비비가 반란군을 멈추려 한다
    id: 'cn_vivi_rebellion', kind: 'door', when: at(age(17, 19), st(...SEAFARING, 'civil'), sea('gl_first')),
    weight: 6, repeat: 'once', speaker: { canon: 'vivi' },
    title: '멈춰 달라는 왕녀', body: '알라바스타의 수도 앞에서 반란군과 왕국군이 마주 섰다. 비는 세 해째 내리지 않았다. 푸른 머리의 왕녀가 두 군대 사이로 달려가며 멈춰 달라고 외치지만, 포성에 묻힌다. 그녀가 {name}을(를) 보고 손을 뻗는다.',
    doors: [
      { label: '왕녀와 함께 시계탑으로 달린다', hint: '광장을 날려 버릴 포탄이 숨겨져 있다고 한다. 포탄에 휘말릴 수 있다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 10 }, { op: 'person', kind: 'ally', relation: '사막의 왕녀', canon: 'vivi' },
             { op: 'log', text: '시계탑 위에서 포탄이 하늘로 날아가 터졌다. 그날 오후, 세 해 만에 비가 내렸다.', weight: 'heavy' }] },
      { label: '반란군 진영으로 가서 무기를 내리라고 외친다', hint: '성난 군중이 귀를 기울일지 모른다. 짓밟힐 수도 있다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "앞줄의 병사가 먼저 창을 내렸고, 왕녀의 목소리가 그 틈으로 퍼졌다. 두 군대 사이에 잠깐 침묵이 흘렀다.", weight: "light" }, { op: 'fame', add: 6 }, { op: 'person', kind: 'ally', relation: '외침을 들어 준 왕녀', canon: 'vivi' }],
               else: [{ op: "log", text: "성난 반란군이 밀려오며 외침은 포성에 묻혔다. 군홧발에 짓밟힌 채 왕녀가 건너편에서 손을 뻗는 것을 보았다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'injury', severity: 'light' }] }] },
      { label: '부상자들을 사막 밖 오아시스로 실어 나른다', hint: '싸움의 결말은 보지 못한다. 몇 사람은 산다', values: { loyalty: D },
        fx: [{ op: "log", text: "부상자들을 실은 수레가 오아시스에 닿았을 때 물동이와 붕대를 든 사람들이 달려 나왔다. 수도의 포성은 여전히 들렸다.", weight: "light" }, { op: 'hp', add: -10 }, { op: 'timeline', text: '알라바스타 내전의 날, 부상자들을 오아시스로 실어 날랐다', canon: 'vivi' }] },
    ],
  },
  {
    id: 'cn_franky_backstreet', kind: 'door', when: at(age(14, 18), st('child', ...SEAFARING, 'shipwright', 'civil'), sea('gl_first'), ...dock('워터 세븐', '워터 세븐 뒷골목')),
    weight: 5, repeat: 'once', speaker: { canon: 'franky' },
    title: '뒷골목의 해체업자', body: '워터 세븐의 해체장에서 팬티 바람의 사내가 제 배를 열었다. 배꼽 안쪽 냉장고에 콜라병이 딱 세 개 들어갔다. 병마개가 튀자 쇠팔에서 바람이 터져 나와 선체를 덮은 톱밥을 싹 걷어냈다. 프랑키가 두 팔을 붙여 별을 만들었다. 뒤에 서 있던 인부들 눈썹에도 톱밥이 수북했다.',
    doors: [
      { label: '배를 맡기고 고쳐 달라고 한다', hint: '수리비 대신 콜라 상자를 요구한다. 배가 이상하게 튼튼해진다', values: { romance: D }, needs: ['ship'],
        fx: [{ op: 'repairShip', mark: 'plating' }, { op: "log", text: "프랑키가 콜라 상자를 받아 들고 선체에 철판을 덧댔다. 수리한 배를 두드려 보더니 이제 파도 좀 맞아도 버티겠다고 웃었다.", weight: "light" }, { op: 'money', add: -10000 }, { op: 'person', kind: 'ally', relation: '배를 고쳐 준 해체업자', canon: 'franky' }, { op: 'flag', id: 'frankyShip' }] },
      { label: '해체업자 일가의 일을 거들며 배 짓는 법을 배운다', hint: '고철 더미 속에서 몇 달을 산다. 손이 거칠어진다', values: { inquiry: D },
        fx: [{ op: 'log', text: '고철 더미에서 부품을 골라 프랑키와 배수 펌프를 고쳤다. 마지막으로 건넨 콜라를 프랑키가 기계에 부었다. 꾸르륵, 딸꾹, 콸콸! 물벼락을 맞은 두목은 머리를 쓸어 올리며 “수퍼!” 하고 외쳤다.', weight: 'light' }, { op: 'flag', id: 'learnedColaPump' }, { op: 'base', key: 'int', add: 1 }, { op: 'base', key: 'str', add: 1 }, { op: 'person', kind: 'ally', relation: '뒷골목의 두목', canon: 'franky' }] },
      { label: '배를 노리는 해체업자 졸개들을 쫓아낸다', hint: '두목이 웃으며 나선다. 거칠게 한 판 붙는다', values: { dominion: D }, danger: true,
        fx: [{ op: "log", text: "졸개들과 주먹을 주고받다 프랑키가 뛰어들었다. 그는 코피를 닦는 {name}을(를) 보고 제법이라며 웃었다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'mastery', branch: 'fist', add: 8 }, { op: 'person', kind: 'rival', relation: '한 판 붙은 해체업자', canon: 'franky' }] },
    ],
  },
  {
    // 정상결전. 해적 쪽이면 흰수염의 편에 설지, 해군이면 그 바다에 설지
    id: 'cn_whitebeard_war', kind: 'door', when: at(age(19, 20), st(...SEAFARING), sea('gl_first', 'sabaody')),
    weight: 6, repeat: 'once', speaker: { canon: 'whitebeard' },
    title: '정상결전', body: '해군 본부가 불주먹의 처형을 알렸다. 흰수염이 식구라 부르는 해적들을 모두 이끌고 마린포드로 간다. 영상 전보벌레가 비춘 만 한가운데로 고래 머리 뱃머리가 솟았다. “그라라라라!” 화면 밖에서도 사람들이 고개를 들어 그 큰 얼굴을 찾았다.',
    recall: [{ when: [{ c: 'flag', id: 'ateWithAce', has: true }], text: '처형대 위에서 고개를 든 사람은 한 식탁에서 고기를 먹었던 에이스다. 모자에 계산서가 들었다며 웃던 그와 같은 얼굴인데, 오늘은 모자를 쓰지 않았다.' }],
    doors: [
      { label: '배를 몰아 마린포드로 간다', hint: '세계에서 가장 큰 싸움이다. 살아 돌아올지 모른다', values: { loyalty: D }, danger: true, when: [{ c: 'standing', is: ['pirate', 'revolution', 'warlord'] }],
        fx: [{ op: 'hp', add: -35 }, { op: 'fame', add: 40 }, { op: 'person', kind: 'ally', relation: '세상을 흔든 늙은 선장', canon: 'whitebeard' },
             { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'heavy' }, { op: 'log', text: '빙판 위에서 날아온 포탄 파편이 몸에 깊이 박혔다. 동료의 어깨를 빌려서야 만을 빠져나왔다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '포탄이 갑판을 부쉈지만 쓰러진 동료를 부축해 만 바깥까지 걸어 나왔다. 온몸이 멍들어 있었다.', weight: 'light' }] },
             { op: 'log', text: '빙판이 된 만에서 끝까지 버텼다. 늙은 선장은 선 채로 숨을 거두었다. 그 등에는 도망친 상처가 하나도 없었다.', weight: 'heavy' },
             { op: 'timeline', text: '정상결전에 뛰어들었다' }] },
      { label: '해군의 대열에 서서 만을 지킨다', hint: '명령을 따라 해적들과 싸운다. 무엇을 지키는지 보게 된다', values: { justice: D }, danger: true, when: [{ c: 'standing', is: ['marine', 'cp'] }],
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 25 }, { op: 'chance', p: 0.25,
               then: [{ op: 'injury', severity: 'heavy' }, { op: 'log', text: '만을 지키던 대열에 포탄이 떨어졌다. 의무병이 깊은 상처를 싸매고 후방으로 실어 날랐다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '포탄이 떨어진 자리를 지나며 대열을 끝까지 지켰다. 전투가 멎은 뒤에야 다리에 힘이 풀렸다.', weight: 'light' }] },
             { op: 'log', text: '포성 속에서 분홍 머리의 해군이 멈춰 달라고 외쳤다. 전쟁은 그 목소리와 함께 멎었다.', weight: 'heavy' },
             { op: 'timeline', text: '정상결전에서 해군의 대열에 섰다' }] },
      { label: '영상 전전충 앞에서 끝까지 지켜본다', hint: '아무것도 할 수 없다. 시대가 바뀌는 것을 본다', values: { inquiry: D },
        fx: [{ op: "log", text: "영상 전전충 속에서 늙은 선장이 쓰러졌다. 거리의 구경꾼들이 말을 잃었고, 전쟁이 끝난 뒤에도 그 자리를 떠나지 못했다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: 2 }] },
    ],
  },
  // ---------------------------------------------------------------- 해군 · 혁명군 쪽의 만남
  {
    // v4 cc_garp_fist
    id: 'cn_garp_fist', kind: 'door', when: at(age(16, 30), st('marine'), { c: 'flag', id: 'mnFirst', has: true }),
    weight: 5, repeat: 'once', speaker: { canon: 'garp' },
    title: '영웅의 시찰', body: '해군 영웅 가프 중장이 지부에 들러 신병들을 한 줄로 세웠다. 센베이를 씹으며 하나씩 주먹을 먹인다. 쓰러지지 않은 사람은 {name} 하나다. 영웅이 이 녀석은 자기가 데려가겠다고 한다.',
    doors: [
      { label: '영웅을 따라 본부로 간다', hint: '날마다 주먹을 맞으며 단련한다. 몸이 남아나지 않는다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: "log", text: "본부에 도착한 첫날부터 가프의 주먹이 날아왔다. 멍든 채 훈련장을 돌자 그는 센베이를 씹으며 내일도 나오라고 했다.", weight: "light" }, { op: 'master', name: '가프 중장', branch: 'fist', cap: 5, years: 4, paid: false }, { op: 'person', kind: 'ally', relation: '주먹의 스승', canon: 'garp' }, { op: 'hp', add: -15 },
             { op: 'timeline', text: '해군 영웅을 따라 본부로 갔다' }] },
      { label: '지금의 분대와 상관 곁에 남겠다고 한다', hint: '영웅은 껄껄 웃고 다시 묻지 않는다', values: { loyalty: D }, closes: true,
        fx: [{ op: "log", text: "가프는 분대원들을 둘러보고 껄껄 웃었다. 군함이 떠날 때도 {name}은(는) 같은 사람들과 같은 초소를 지켰다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '웃어넘긴 해군 영웅', canon: 'garp' }] },
    ],
  },
  {
    // 코비는 두 해 뒤 해군 대령이 되어 있다
    id: 'cn_coby_colonel', kind: 'door', when: at(age(20, 30), st('marine', 'pirate', 'bountyHunter', 'revolution'), sea('sabaody', 'nw_first', 'nw_late', 'gl_first')),
    weight: 4, repeat: 'once', speaker: { canon: 'coby' },
    title: '분홍 머리의 대령', body: '{island} 항구에 해군의 군함이 닿았다. 갑판에서 내려오는 분홍 머리의 젊은 대령은, 몇 해 전 겁에 질려 있던 얼굴과 같은 사람이다. 대령이 {name}을(를) 알아보고 걸음을 멈춘다.',
    doors: [
      { label: '반갑게 손을 흔든다', hint: '대령은 웃는다. 처지가 달라도 인사는 할 수 있다', values: { loyalty: D },
        fx: [{ op: "log", text: "코비가 갑판에서 내려와 손을 맞잡았다. 군복은 달라졌지만 예전의 얼굴로 안부를 물었다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '분홍 머리의 대령', canon: 'coby' }] },
      { label: '해군이라면 등을 보일 수 없다며 칼을 뽑는다', hint: '대령도 칼을 뽑는다. 겁쟁이 소년은 이제 없다', values: { dominion: D }, danger: true, when: [{ c: 'standing', is: ['pirate', 'revolution'] }],
        fx: [{ op: "log", text: "항구에서 칼이 맞부딪쳤다. 코비는 한 발도 물러서지 않았고, 서로 피 묻은 칼을 거둘 때쯤 구경꾼들이 이름을 외쳤다.", weight: "light" }, { op: 'hp', add: -25 }, { op: 'fame', add: 10 }, { op: 'person', kind: 'rival', relation: '칼을 맞댄 분홍 머리 대령', canon: 'coby' }] },
      { label: '세상에서 본 부당한 일들을 털어놓는다', hint: '대령은 끝까지 듣고 수첩에 적는다. 해군 안에도 바꾸려는 사람이 있다', values: { justice: D },
        fx: [{ op: "log", text: "코비는 말을 끊지 않고 수첩을 채웠다. 헤어질 때 그 사건들을 직접 살피겠다고 약속했다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }, { op: 'person', kind: 'ally', relation: '이야기를 들어 준 대령', canon: 'coby' }] },
    ],
  },
  {
    // 사보는 혁명군의 참모총장이 되어 있다
    id: 'cn_sabo_chief', kind: 'door', when: at(age(19, 32), st('revolution'), { c: 'standingYears', min: 1 }),
    weight: 5, repeat: 'once', speaker: { canon: 'sabo' },
    title: '모자를 쓴 참모총장', body: '혁명군 기지에 참모총장이 왔다. 얼굴 한쪽에 화상 자국이 있고, 모자를 비스듬히 쓴 사내다. 그가 {name}의 보고서를 펼치며, 다음 작전은 위험하지만 꼭 맡기고 싶다고 한다.',
    doors: [
      { label: '작전을 맡는다', hint: '왕국 하나가 걸린 일이다. 살아 돌아오면 이름이 오른다', values: { justice: D }, danger: true,
        fx: [{ op: "log", text: "작전이 끝난 뒤 부상자들을 데리고 돌아왔다. 사보는 구겨진 보고서를 받아 들고 살아 돌아온 사람들의 이름부터 확인했다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'fame', add: 20 }, { op: 'person', kind: 'ally', relation: '모자를 쓴 참모총장', canon: 'sabo' }] },
      { label: '같은 고향 바다 이야기를 꺼낸다', hint: '참모총장은 잃어버린 기억 너머를 더듬는다. 작전은 다른 사람에게 간다', values: { romance: D },
        fx: [{ op: "log", text: "고향 바다의 냄새를 이야기하자 사보가 잠시 말을 멈췄다. 그는 어렴풋한 기억을 적어 두고 다른 동지에게 작전을 맡겼다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '고향 바다 이야기를 나눈 참모총장', canon: 'sabo' }, { op: 'flag', id: 'saboTalk' }] },
      { label: '작전의 허점을 짚고 다시 짜자고 한다', hint: '참모총장이 눈을 빛낸다. 며칠 밤을 지도 앞에서 보낸다', values: { inquiry: D },
        fx: [{ op: "log", text: "지도의 빈틈을 메우느라 등불이 여러 번 꺼졌다. 사보는 고친 동선을 대원들에게 펼쳐 보이며 함께 만든 계획이라고 소개했다.", weight: "light" }, { op: 'base', key: 'int', add: 1 }, { op: 'fame', add: 8 }, { op: 'person', kind: 'ally', relation: '작전을 함께 짠 참모총장', canon: 'sabo' }] },
    ],
  },
  // ---------------------------------------------------------------- 샤본디 너머와 신세계
  {
    id: 'cn_jinbe_island', kind: 'door', when: at(age(18, 35), st(...SEAFARING, 'civil'), sea('sabaody', 'nw_first')),
    weight: 5, repeat: 'once', speaker: { canon: 'jinbe' },
    title: '바다 밑의 무인', body: '어인섬의 해변에서 고래상어 어인 무인이 아이들에게 정권 지르기를 가르치고 있다. 인간을 처음 보는 아이 하나가 {name}을(를) 보고 무인의 다리 뒤로 숨는다. 무인이 웃으며 손짓한다.',
    doors: [
      { label: '아이들 틈에 서서 함께 정권을 지른다', hint: '물을 다루는 무술의 첫걸음을 배운다. 아이들이 인간도 괜찮다고 수군거린다', values: { peace: D },
        fx: [{ op: "log", text: "징베가 주먹이 닿기 전 물결의 움직임을 보라고 했다. 숨던 아이도 곁에 서서 손바닥을 고쳐 잡아 주었다.", weight: "light" }, { op: 'mastery', branch: 'fist', add: 10 }, { op: 'person', kind: 'ally', relation: '바다 밑의 무인', canon: 'jinbe' }] },
      { label: '인간과 어인 사이의 묵은 이야기를 묻는다', hint: '무인은 오래 말한다. 노예의 낙인 이야기도 나온다', values: { inquiry: D },
        fx: [{ op: "log", text: "징베는 오래된 차별과 노예의 낙인을 차분히 들려주었다. 숨었던 아이가 다가와 인간도 그 이야기를 듣느냐고 물었다.", weight: "light" }, { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '이야기를 들려준 무인', canon: 'jinbe' }] },
      { label: '무인에게 한 판 청한다', hint: '바다의 협객이라 불리는 사람이다. 크게 내던져진다', values: { ambition: D }, danger: true,
        fx: [{ op: "log", text: "징베의 손바닥이 닿자 몸이 물 위로 날아갔다. 모래밭에서 일어나자 그는 다시 자세를 잡아 보라고 했다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'mastery', branch: 'fist', add: 14 }, { op: 'person', kind: 'rival', relation: '한 판 받아 준 무인', canon: 'jinbe' }] },
    ],
  },
  {
    // 펑크 해저드의 아이들
    id: 'cn_law_punk', kind: 'door', when: at(age(20, 30), st(...SEAFARING), sea('nw_first')),
    weight: 4, repeat: 'once', speaker: { canon: 'law' },
    title: '얼음과 불의 섬의 외과의', body: '펑크 해저드의 연구소에서 몸집이 커진 아이들이 쇠창살 안에서 울고 있다. 큰 칼을 멘 외과의가 창살 앞에서 차갑게 말한다. 아이들의 피에서 약을 빼야 하는데, 손이 모자란다고.',
    doors: [
      { label: '외과의를 도와 아이들의 약을 뺀다', hint: '연구소의 경비가 몰려온다. 아이들이 하나씩 잠든다', values: { peace: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '죽음의 외과의', canon: 'law' },
             { op: 'log', text: '마지막 아이가 잠든 뒤, 외과의는 고맙다는 말 없이 모자를 눌러썼다.', weight: 'heavy' }] },
      { label: '연구소의 장부를 빼내 바깥에 알린다', hint: '정부의 실험이 드러난다. 그만큼 쫓긴다', values: { justice: D },
        fx: [{ op: "log", text: "장부를 품고 연구소를 빠져나오자 경비들이 뒤쫓았다. 로는 기록을 받아 아이들의 이름과 실험 내역을 확인했다.", weight: "light" }, { op: 'fame', add: 10 }, { op: 'flag', id: 'govEnemy' }, { op: 'person', kind: 'ally', relation: '장부를 받아 간 외과의', canon: 'law' }] },
      { label: '외과의와 손잡고 연구소의 약을 빼돌려 판다', hint: '큰돈이 된다. 아이들은 남의 손에 맡긴다', values: { greed: D },
        fx: [{ op: "log", text: "약병을 팔아 돈을 나누는 동안 아이들의 울음은 연구소 안에 남았다. 로는 돈을 세는 손을 보고 얼굴을 굳혔다.", weight: "light" }, { op: 'money', add: 90000 }, { op: 'hardship', add: 3 }, { op: 'person', kind: 'rival', relation: '눈살을 찌푸린 외과의', canon: 'law' }] },
    ],
  },
  {
    // 정상결전 뒤, 해적의 시대를 뒤흔든 사황의 빈자리
    id: 'cn_whitebeard_grave', kind: 'door', when: at(age(20, 40), st(...SEAFARING, 'civil'), sea('nw_first', 'nw_late')),
    weight: 3, repeat: 'once', speaker: { canon: 'whitebeard' },
    title: '이름 없는 섬의 무덤', body: '신세계의 이름 없는 섬, 언덕 위에 거대한 언월도가 꽂힌 무덤이 있다. 흰수염의 무덤이다. 붉은 머리 선장이 묻었다는 말이 돈다. 그 둘레의 섬들은 이제 지켜 주는 깃발이 없다.',
    doors: [
      { label: '무덤 앞에 술 한 병을 따른다', hint: '그 바다를 산 사람에게 인사한다', values: { romance: D },
        fx: [{ op: "log", text: "언월도 아래로 술이 스며들었다. 바람에 깃발 자락이 흔들리고, 언덕을 내려올 때까지 병은 비어 있었다.", weight: "light" }, { op: 'base', key: 'wil', add: 1 }, { op: 'timeline', text: '흰수염의 무덤에 술을 따랐다', canon: 'whitebeard' }] },
      { label: '깃발이 사라진 섬들을 지키겠다고 나선다', hint: '노리는 해적들이 몰려온다. 힘이 모자라면 무너진다', values: { peace: D }, danger: true,
        fx: [{ op: "log", text: "깃발 없는 첫 섬에 배를 대자 약탈하러 온 해적들과 맞붙었다. 주민들이 문을 열고 부상자를 안으로 옮겼다.", weight: "light" }, { op: 'hp', add: -25 }, { op: 'fame', add: 20 }, { op: 'flag', id: 'guardian' }] },
      { label: '주인 없는 섬들을 제 깃발 아래 둔다', hint: '빈자리를 먼저 차지한다. 다른 해적들과 부딪친다', values: { dominion: D }, danger: true, when: [{ c: 'standing', is: ['pirate', 'warlord'] }],
        fx: [{ op: "log", text: "제 깃발을 세우자 항구의 해적선들이 물러나지 않았다. 거친 싸움 끝에 섬의 부두가 새 세력의 첫 거점이 되었다.", weight: "light" }, { op: 'hp', add: -20 }, { op: 'fame', add: 30 }, { op: 'flag', id: 'territory' }] },
    ],
  },
];

