// 원작 인물과의 만남. 고향 · 해역 · 나이 · 길에 맞춰 한 인생에 한 번씩 일어난다.
// 저절로 지나가는 만남(CANON_LIFE_EVENTS)과 고르는 만남(CANON_CHOICES) 두 가지.
import type { Choice, Condition, SeaId } from '../core/types';
import type { LifeEvent } from './lifeEvents';

const ONCE = 9999;   // 다시 일어나지 않는다
const age = (min?: number, max?: number): Condition => ({ c: 'age', min, max });
const place = (...is: string[]): Condition => ({ c: 'place', is });
const sea = (...is: SeaId[]): Condition => ({ c: 'sea', is });
const out: Condition = { c: 'route', is: ['pirate', 'marine', 'revolution'] };
const e = (x: LifeEvent) => x;

export const CANON_LIFE_EVENTS: LifeEvent[] = [
  // ---------------- 이스트 블루의 고향 마을
  e({ id: 'cn_shanks', when: [age(3, 9), place('후샤 마을')], weight: 20, cooldown: ONCE,
    text: ['마키노의 술집에서 빨간 머리의 해적 선장이 너털웃음을 터뜨렸다. 밀짚모자를 쓴 그 사내가 고기 한 점을 나눠 주며 "바다는 넓다"고 했다.'],
    effects: [{ op: 'base', key: 'wil', add: 1 }, { op: 'flag', id: 'met_shanks' }] }),
  e({ id: 'cn_dadan', when: [age(5, 12), place('고아 왕국 그레이 터미널', '후샤 마을')], weight: 12, cooldown: ONCE,
    text: ['코르보 산의 산적 다단 일가 앞을 지나다가 큰 소리로 혼이 났다. 무서웠지만, 나중에 감자를 하나 쥐여 주었다.'],
    effects: [{ op: 'base', key: 'vit', add: 0.5 }] }),
  e({ id: 'cn_helmeppo', when: [age(8, 15), place('셸스 타운')], weight: 15, cooldown: ONCE,
    text: ['해군 대령의 아들 헬메포가 개를 끌고 마을을 거들먹거리며 다녔다. 모두 고개를 숙였지만 너는 끝까지 노려봤다.'],
    effects: [{ op: 'base', key: 'wil', add: 0.8 }] }),
  e({ id: 'cn_usopp', when: [age(5, 15), place('시럽 마을')], weight: 18, cooldown: ONCE,
    text: ['"해적이 쳐들어온다!" 코가 긴 소년이 아침부터 마을을 뛰어다녔다. 오늘도 거짓말이었다. 그래도 왠지 웃음이 났다.'],
    effects: [{ op: 'base', key: 'luk', add: 0.8 }] }),
  e({ id: 'cn_bellemere', when: [age(3, 10), place('코코야시 마을')], weight: 18, cooldown: ONCE,
    text: ['귤 농장의 벨메르가 담배를 문 채 웃으며 귤을 한 아름 안겨 주었다. 주황 머리 여자아이가 해도를 그리며 따라왔다.'],
    effects: [{ op: 'hp', add: 6 }, { op: 'base', key: 'int', add: 0.5 }] }),
  e({ id: 'cn_kuina', when: [age(8, 13), place('시모츠키 마을')], weight: 20, cooldown: ONCE,
    text: ['코우시로 도장의 소녀 검사 쿠이나에게 대련을 청했다가 목검 한 번에 나가떨어졌다. 초록 머리 소년도 옆에서 이를 갈고 있었다.'],
    effects: [{ op: 'mastery', skill: 'focus', add: 4 }, { op: 'base', key: 'wil', add: 0.5 }] }),
  e({ id: 'cn_buggy', when: [age(10), sea('east'), out], weight: 6, cooldown: ONCE,
    text: ['오렌지 마을 근처에서 광대 분장의 해적 선장이 "누가 내 코를 보고 웃었어!"라며 대포를 쏘아 댔다. 웃지 않으려고 입술을 깨물었다.'],
    effects: [{ op: 'base', key: 'luk', add: 0.6 }] }),
  e({ id: 'cn_sanji', when: [age(14), sea('east')], weight: 7, cooldown: ONCE,
    text: ['해상 레스토랑 발라티에에서 금발의 요리사가 굶주린 손님에게 공짜로 볶음밥을 내주는 걸 봤다. 한 숟갈 얻어먹었는데 눈물이 날 만큼 맛있었다.'],
    effects: [{ op: 'hp', add: 10 }, { op: 'base', key: 'vit', add: 0.5 }] }),
  e({ id: 'cn_smoker_lt', when: [age(12), place('로그타운'), { c: 'route', is: ['none'] }], weight: 12, cooldown: ONCE,
    text: ['시가 두 개를 한꺼번에 문 해군 대령이 로그타운 광장을 지나갔다. 그가 지나간 자리엔 하얀 연기만 남았다.'],
    effects: [{ op: 'base', key: 'wil', add: 0.5 }] }),

  // ---------------- 바다에 나간 뒤
  e({ id: 'cn_laboon', when: [sea('gl_entry'), out], weight: 10, cooldown: ONCE,
    text: ['리버스 마운틴 출구에서 이마가 상처투성이인 거대한 고래가 붉은 대륙을 향해 울부짖었다. 등대지기 노인은 50년째 동료를 기다리는 거라고 했다.'],
    effects: [{ op: 'base', key: 'wil', add: 1 }] }),
  e({ id: 'cn_chopper', when: [sea('gl_entry'), out], weight: 8, cooldown: ONCE,
    text: ['드럼 왕국의 눈밭에서 파란 코의 작은 순록이 약초를 캐고 있었다. 말을 걸자 "기, 기쁘지 않거든!" 하며 춤을 추었다.'],
    effects: [{ op: 'base', key: 'luk', add: 0.6 }, { op: 'hp', add: 5 }] }),
  e({ id: 'cn_vivi', when: [sea('gl_first'), out], weight: 8, cooldown: ONCE,
    text: ['알라바스타의 모래바람 속에서 커다란 오리를 탄 푸른 머리 소녀가 지나갔다. 나라의 비를 되찾겠다고 했다.'],
    effects: [{ op: 'base', key: 'wil', add: 0.8 }] }),
  e({ id: 'cn_franky', when: [sea('gl_first'), out], weight: 8, cooldown: ONCE,
    text: ['워터 세븐 뒷골목에서 팬티 차림의 사이보그가 "슈퍼!"를 외치며 포즈를 잡았다. 그가 고쳐 준 배 난간은 전보다 튼튼했다.'],
    effects: [{ op: 'base', key: 'vit', add: 0.6 }] }),
  e({ id: 'cn_bonney', when: [sea('sabaody'), out], weight: 8, cooldown: ONCE,
    text: ['샤본디 제도의 식당에서 분홍 머리 여자가 피자 스무 판을 혼자 먹어 치웠다. 계산서를 보던 주인이 기절했다.'],
    effects: [{ op: 'base', key: 'luk', add: 0.6 }] }),
  e({ id: 'cn_shakky', when: [sea('sabaody'), out], weight: 8, cooldown: ONCE,
    text: ['샤키의 바가지 바에서 은발의 노인이 술잔을 기울이며 옛 선장 이야기를 했다. 눈빛만으로 등골이 서늘했다.'],
    effects: [{ op: 'base', key: 'wil', add: 1 }] }),
  e({ id: 'cn_jinbe', when: [sea('sabaody'), out], weight: 6, cooldown: ONCE,
    text: ['어인섬 해변에서 거대한 어인 무인이 아이들에게 어인 공수도의 정권 지르기를 가르치고 있었다. 바다가 함께 떨렸다.'],
    effects: [{ op: 'mastery', skill: 'focus', add: 3 }] }),
  e({ id: 'cn_colosseum', when: [sea('nw_first'), out], weight: 6, cooldown: ONCE,
    text: ['드레스로자의 콜로세움에서 장난감 병정이 한 다리로 싸우는 모습을 봤다. 어쩐지 슬픈 눈을 하고 있었다.'],
    effects: [{ op: 'base', key: 'wil', add: 0.6 }] }),
  e({ id: 'cn_wano', when: [sea('nw_late'), out], weight: 6, cooldown: ONCE,
    text: ['와노쿠니의 꽃의 도읍에서 커다란 털북숭이 무사가 어묵 냄비를 짊어지고 지나갔다. 사람들은 "오뎅 님"을 떠올리며 고개를 숙였다.'],
    effects: [{ op: 'base', key: 'wil', add: 0.8 }] }),
];

// ---------------- 고르는 만남
const c = (x: Choice) => x;
export const CANON_CHOICES: Choice[] = [
  c({ id: 'cc_ace_thugs', category: 'bond', when: [age(10, 15), place('후샤 마을', '고아 왕국 그레이 터미널')], weight: 30, repeat: 'once',
    speaker: { canon: '주근깨 소년 에이스', faction: 'civil', age: 13 },
    title: '주근깨 소년과 불량배', body: '그레이 터미널 입구에서 주근깨 소년이 덩치 큰 불량배 셋에게 둘러싸여 있다. 소년은 쇠파이프를 들고 웃고 있다. "난 에이스다. 끼어들 거면 빨리 해."',
    options: [
      { label: '등을 맞대고 같이 싸운다', hint: '힘과 정신이 오른다. 다칠 수 있다',
        effects: [{ op: 'log', text: '주근깨 소년 에이스와 함께 불량배들을 해치웠다. 소년은 "제법인데"라며 처음으로 웃었다.', type: 'good' },
          { op: 'base', key: 'str', add: 2 }, { op: 'base', key: 'wil', add: 1 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] },
          { op: 'person', add: { kind: 'ally', relation: '함께 싸운 친구 · 에이스', name: '포트거스 D. 에이스', gender: 'm', age: 13, bond: 60, faction: 'civil', canon: 'ace' } },
          { op: 'flag', id: 'met_ace' }] },
      { label: '돌을 던져 불량배의 시선을 끈다', hint: '머리를 쓴다. 지능과 운',
        effects: [{ op: 'log', text: '불량배가 돌아보는 순간 주근깨 소년 에이스의 쇠파이프가 날아들었다. "뭐야, 꽤 쓸 만하잖아."', type: 'good' },
          { op: 'base', key: 'int', add: 1 }, { op: 'base', key: 'luk', add: 1 }, { op: 'flag', id: 'met_ace' }] },
      { label: '못 본 척 지나간다', hint: '아무 일도 없다', effects: [{ op: 'log', text: '등 뒤로 비명과 웃음소리가 들렸다.', type: 'info' }] },
    ] }),
  c({ id: 'cc_ace_bar', category: 'bond', when: [age(17), { c: 'route', is: ['pirate', 'revolution'] }, { c: 'stage', min: 2, max: 3 }], weight: 6, repeat: 'once',
    speaker: { canon: '흰수염 해적단 2번대 대장 에이스', faction: 'pirate', age: 20 },
    title: '불주먹과 불량배', body: '{port}의 식당에서 흰수염 해적단 2번대 대장, 「불주먹」 에이스가 밥을 먹다 그대로 잠들었다. 그 틈에 불량배들이 그의 모자를 노린다.',
    options: [
      { label: '불량배를 막아선다', hint: '명성이 오른다',
        effects: [{ op: 'log', text: '깨어난 「불주먹」 에이스와 함께 불량배를 해치웠다. "동생이 신세 질 일이 있으면 잘 부탁한다." 그가 밥값까지 냈다.', type: 'good' },
          { op: 'fame', add: 8 }, { op: 'base', key: 'str', add: 1 }, { op: 'flag', id: 'met_ace' }] },
      { label: '모자를 지켜 두었다가 돌려준다', hint: '인연이 생긴다',
        effects: [{ op: 'log', text: '"고맙다!" 「불주먹」 에이스가 고개 숙여 인사했다. 예의 바른 해적이었다.', type: 'good' }, { op: 'base', key: 'luk', add: 2 }, { op: 'flag', id: 'met_ace' }] },
    ] }),
  c({ id: 'cc_tashigi_swords', category: 'bond', when: [age(14), { c: 'sea', is: ['east', 'gl_entry'] }], weight: 7, repeat: 'once',
    speaker: { canon: '해군 조장 타시기', faction: 'marine', age: 23, gender: 'f' },
    title: '무기점의 명검 토론', body: '로그타운의 무기점에서 안경 쓴 해군 여검사 타시기가 진열장을 들여다보며 혼잣말을 한다. "이건 양업물 「시구레」… 그리고 이 칼은 설마 와도 이치몬지?" 너와 눈이 마주쳤다.',
    options: [
      { label: '와도 이치몬지 이야기로 맞장구친다', hint: '검의 내력을 배운다. 검술 숙련',
        effects: [{ op: 'log', text: '해군 여검사 타시기와 대업물 21자루, 최상대업물 12자루 이야기로 해가 질 때까지 떠들었다. 타시기는 "명검을 악당 손에 두지 않겠다"고 했다.', type: 'good' },
          { op: 'mastery', skill: 'sword_cut', add: 8 }, { op: 'mastery', skill: 'sword_draw', add: 5 }, { op: 'base', key: 'int', add: 1 }] },
      { label: '"명검은 쓰는 사람이 만든다"고 반박한다', hint: '토론이 붙는다. 정신',
        effects: [{ op: 'log', text: '"칼이 사람을 고르는 거예요!" "아니, 사람이 칼을 키우는 거지." 결론은 나지 않았지만 둘 다 웃었다.', type: 'good' },
          { op: 'base', key: 'wil', add: 2 }] },
      { label: '가게 주인에게 값을 깎아 달라고 한다', hint: '무기를 싸게 산다',
        effects: [{ op: 'log', text: '해군 여검사 타시기가 옆에서 거들어 준 덕에 무명 검을 거의 공짜로 얻었다.', type: 'good' }, { op: 'item', id: 'sw1', count: 1 }] },
    ] }),
  c({ id: 'cc_luffy_meat', category: 'bond', when: [age(16), { c: 'sea', is: ['east', 'gl_entry'] }, out], weight: 6, repeat: 'once',
    speaker: { canon: '밀짚모자 소년', faction: 'pirate', age: 17 },
    title: '고기를 노리는 눈', body: '{port}의 노점에서 고기를 사 들자, 밀짚모자를 쓴 소년이 침을 흘리며 쳐다본다. 팔이 이상하게 길게 늘어나 고기 쪽으로 다가온다.',
    options: [
      { label: '반을 나눠 준다', hint: '좋은 일이 있을지도',
        effects: [{ op: 'log', text: '"고마워! 너 좋은 녀석이구나! 난 루피! 해적왕이 될 남자다!" 밀짚모자 소년은 시시싯 웃고는 바다로 뛰어갔다.', type: 'good' }, { op: 'base', key: 'luk', add: 3 }, { op: 'flag', id: 'met_luffy' }] },
      { label: '끝까지 지킨다', hint: '고기 쟁탈전',
        effects: [{ op: 'log', text: '고기를 사이에 두고 한바탕 난리가 났다. 결국 둘 다 노점 주인에게 쫓겨났다.', type: 'info' }, { op: 'base', key: 'spd', add: 1.5 }, { op: 'flag', id: 'met_luffy' }] },
    ] }),
  c({ id: 'cc_zoro_lost', category: 'bond', when: [age(16), { c: 'sea', is: ['east', 'gl_entry', 'gl_first'] }], weight: 5, repeat: 'once',
    speaker: { canon: '길 잃은 초록 머리 검객', faction: 'pirate', age: 19 },
    title: '길 잃은 검객', body: '칼 세 자루를 찬 초록 머리 검객이 같은 골목을 세 번째 지나간다. "…항구가 움직인 것 같은데."',
    options: [
      { label: '항구까지 데려다준다', hint: '답례로 한 수 배운다',
        effects: [{ op: 'log', text: '"신세 졌군. 롤로노아 조로다." 그가 칼 한 자루로 떨어지는 나뭇잎을 반으로 갈라 보였다. 그 한 칼이 눈에 오래 남았다.', type: 'good' }, { op: 'mastery', skill: 'focus', add: 6 }, { op: 'flag', id: 'met_zoro' }] },
      { label: '반대 방향을 알려 준다', hint: '장난을 친다',
        effects: [{ op: 'log', text: '알려 준 반대 방향으로 갔는데도 그는 결국 항구에 도착했다. 어떻게?', type: 'info' }, { op: 'base', key: 'luk', add: 1 }] },
    ] }),
  c({ id: 'cc_garp_fist', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', min: 1 }], weight: 5, repeat: 'once',
    speaker: { canon: '해군 중장 가프', faction: 'marine', age: 72 },
    title: '사랑의 주먹', body: '기지에 들른 해군 영웅 가프 중장이 센베를 씹으며 신병들을 둘러본다. "어디, 근성이 있나 보자."',
    options: [
      { label: '주먹을 맞고 버틴다', hint: '아프다. 체력과 정신이 크게 오른다',
        effects: [{ op: 'log', text: '"사랑의 주먹!" 정신이 아득했지만 쓰러지지 않았다. 가프가 껄껄 웃으며 센베 한 장을 쥐여 줬다.', type: 'good' }, { op: 'base', key: 'vit', add: 3 }, { op: 'base', key: 'wil', add: 2 }, { op: 'hp', add: -15 }] },
      { label: '센베를 얻어먹는다', hint: '운이 붙는다',
        effects: [{ op: 'log', text: '가프는 센베를 반쯤 먹다가 그대로 코를 골며 잠들었다.', type: 'info' }, { op: 'base', key: 'luk', add: 1 }] },
    ] }),
];
