// 악마의 열매. 기술은 틀(FruitTemplate)에서 만들고, 열매는 이름과 순서만 갖는다.
// 원작에 등장한 자연산 열매와 별도 지역에서만 얻는 인조 스마일.
import type { Fruit, FruitTemplate } from '../core/types';

export const FRUIT_TEMPLATES: Record<string, FruitTemplate> = {
  strike: { id: 'strike', kind: 'attack', stat: 'int', power: 1.6, cost: 10, cooldown: 1, when: 'always', tags: [] },
  guard: { id: 'guard', kind: 'guard', stat: 'int', power: 0, cost: 10, cooldown: 3, when: 'afterEnemyBig', tags: [], effect: { type: 'guard', value: 0.6, turns: 1 } },
  bind: { id: 'bind', kind: 'support', stat: 'int', power: 0, cost: 16, cooldown: 4, when: 'opening', tags: ['bind'], effect: { type: 'bind', value: 0.6, turns: 1 } },
  burst: { id: 'burst', kind: 'attack', stat: 'int', power: 2.4, cost: 20, cooldown: 2, when: 'always', tags: ['area'] },
  heal: { id: 'heal', kind: 'support', stat: 'int', power: 0, cost: 18, cooldown: 4, when: 'hpBelow50', tags: ['heal'], effect: { type: 'heal', value: 0.25, turns: 0 } },
  form: { id: 'form', kind: 'passive', stat: 'str', power: 0, cost: 0, cooldown: 0, when: 'always', tags: ['transform'], effect: { type: 'buff', value: 0.15, turns: 0 } },
  finisher: { id: 'finisher', kind: 'attack', stat: 'int', power: 3.0, cost: 24, cooldown: 3, when: 'enemyHpBelow30', tags: [] },
  awaken: { id: 'awaken', kind: 'attack', stat: 'int', power: 3.8, cost: 40, cooldown: 4, when: 'always', tags: ['awaken', 'area'] },
};

export const TEMPLATE_SUFFIX: Record<string, string> = {
  strike: '일격', guard: '방벽', bind: '속박', burst: '폭발', heal: '재생', form: '변신', finisher: '결정타', awaken: '각성',
};

/** 등급별 트리 깊이 (기술 수) */
export const GRADE_DEPTH: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
export const GRADE_NAMES = ['', '쓰레기', '평범', '우수', '희귀', '전설'];
export const CLASS_NAMES = { paramecia: '초인계', zoan: '동물계', logia: '자연계' } as const;

type F = [id: string, name: string, cls: Fruit['cls'], grade: Fruit['grade'], theme: string, order: string, canon?: string];
// order: 기술 틀의 순서를 한 글자씩. s=strike g=guard b=bind u=burst h=heal f=form x=finisher a=awaken
const T: Record<string, string> = { s: 'strike', g: 'guard', b: 'bind', u: 'burst', h: 'heal', f: 'form', x: 'finisher', a: 'awaken' };

const RAW: F[] = [
  // 전설 (5)
  ['gura', '흔들흔들 열매', 'paramecia', 5, '진동', 'sguxba', 'whitebeard'],
  ['magu', '마그마마그마 열매', 'logia', 5, '마그마', 'suxgba', 'akainu'],
  ['yami', '어둠어둠 열매', 'logia', 5, '어둠', 'sbuxga', 'blackbeard'],
  ['nika', '사람사람 열매 환수종 모델 니카', 'zoan', 5, '해방', 'sfuxga', 'luffy'],
  // 희귀 (4)
  ['mera', '이글이글 열매', 'logia', 4, '불', 'suxga', 'ace'],
  ['goro', '번개번개 열매', 'logia', 4, '번개', 'suxba', 'enel'],
  ['hie', '얼음얼음 열매', 'logia', 4, '얼음', 'sbuxa', 'aokiji'],
  ['pika', '빛빛 열매', 'logia', 4, '빛', 'suxga', 'kizaru'],
  ['ope', '수술수술 열매', 'paramecia', 4, '공간', 'sbgxa', 'law'],
  ['ito', '실실 열매', 'paramecia', 4, '실', 'sbuxa', 'doflamingo'],
  ['tori_phoenix', '새새 열매 모델 불사조', 'zoan', 4, '재생의 불꽃', 'shfxa', 'marco'],
  // 우수 (3)
  ['suna', '모래모래 열매', 'logia', 3, '모래', 'subx', 'crocodile'],
  ['moku', '연기연기 열매', 'logia', 3, '연기', 'sbgu', 'smoker'],
  ['hana', '꽃꽃 열매', 'paramecia', 3, '꽃 피는 팔', 'sbux', 'robin'],
  ['neko_leo', '고양고양 열매 모델 레오파드', 'zoan', 3, '표범', 'sfux', 'lucci'],
  ['tori_falcon', '새새 열매 모델 팔콘', 'zoan', 3, '매', 'sfgu', 'pell'],
  ['bari', '배리어배리어 열매', 'paramecia', 3, '방벽', 'gsgx', 'bartolomeo'],
  ['doku', '독독 열매', 'paramecia', 3, '독', 'sbux', 'magellan'],
  ['numa', '늪늪 열매', 'logia', 3, '늪', 'sbgu', 'caribou'],
  // 평범 (2)
  ['bara', '동강동강 열매', 'paramecia', 2, '분리', 'sgu', 'buggy'],
  ['bomu', '폭탄폭탄 열매', 'paramecia', 2, '폭발', 'sux'],
  ['supa', '칼칼 열매', 'paramecia', 2, '칼날 몸', 'sgx'],
  ['doru', '촛농촛농 열매', 'paramecia', 2, '촛농', 'sgb'],
  ['awa', '거품거품 열매', 'paramecia', 2, '거품', 'sbu'],
  ['ushi_giraffe', '소소 열매 모델 기린', 'zoan', 2, '기린', 'sfx'],
  ['sube', '매끈매끈 열매', 'paramecia', 2, '미끄러짐', 'gsg'],
  ['buki', '무기무기 열매', 'paramecia', 2, '무기', 'sux'],
  // 쓰레기 (1)
  ['inu_dachs', '개개 열매 모델 닥스훈트', 'zoan', 1, '닥스훈트', 'f'],
  ['kusu', '녹슬녹슬 열매', 'paramecia', 1, '녹', 'sb'],
  ['kame', '거북거북 열매', 'zoan', 1, '거북', 'gf'],
  ['beta', '끈적끈적 열매', 'paramecia', 1, '끈적임', 'bs'],
];

// 원작에서 이름과 능력자가 확인된 열매. 보유자 id는 자연산 무작위 추첨 제한에 쓰지 않는다.
const MORE: F[] = [
  // 초인계: 이스트 블루 ~ 정상전쟁
  ['kilo', '킬로킬로 열매', 'paramecia', 2, '무게', 'sgu', 'mikita'],
  ['baku', '우걱우걱 열매', 'paramecia', 3, '섭취', 'sbu', 'wapol'],
  ['mane', '복사복사 열매', 'paramecia', 2, '변장', 'sbg', 'bonclay'],
  ['toge', '가시가시 열매', 'paramecia', 2, '가시', 'sgx', 'zala'],
  ['ori', '감옥감옥 열매', 'paramecia', 2, '감옥', 'bgs', 'hina'],
  ['bane', '용수철용수철 열매', 'paramecia', 3, '용수철', 'sux', 'bellamy'],
  ['noro', '느릿느릿 열매', 'paramecia', 3, '둔화', 'bsu', 'foxy'],
  ['doa', '문문 열매', 'paramecia', 3, '문', 'sgb', 'blueno'],
  ['beri', '구슬구슬 열매', 'paramecia', 2, '구슬', 'sgu', 'verygood'],
  ['shari', '바퀴바퀴 열매', 'paramecia', 2, '바퀴', 'sfx', 'sharinguru'],
  ['yomi', '부활부활 열매', 'paramecia', 4, '부활', 'hsgxa', 'brook'],
  ['kage', '그림자그림자 열매', 'paramecia', 4, '그림자', 'sbuxa', 'moria'],
  ['horo', '홀로홀로 열매', 'paramecia', 3, '유령', 'bsux', 'perona'],
  ['suke', '투명투명 열매', 'paramecia', 3, '투명', 'gsbx', 'shiryu'],
  ['nikyu', '도톰도톰 열매', 'paramecia', 4, '반발', 'sguxa', 'kuma'],
  ['jiki', '자기자기 열매', 'paramecia', 4, '자력', 'suxba', 'kid'],
  ['mero', '매료매료 열매', 'paramecia', 4, '매료', 'bsuxa', 'hancock'],
  ['mato', '표적표적 열매', 'paramecia', 2, '표적', 'sbx', 'vanderdecken'],
  ['horu', '호르몬호르몬 열매', 'paramecia', 4, '호르몬', 'hsgxa', 'ivankov'],
  ['choki', '가위가위 열매', 'paramecia', 3, '가위', 'sgbx', 'inazuma'],
  ['shiro', '성성 열매', 'paramecia', 4, '성채', 'gsbxa', 'bege'],
  ['wara', '짚짚 열매', 'paramecia', 3, '짚', 'bsgx', 'hawkins'],
  ['oto', '소리소리 열매', 'paramecia', 3, '소리', 'suxb', 'apoo'],
  ['woshu', '워슈워슈 열매', 'paramecia', 3, '세탁', 'sgbx', 'tsuru'],
  ['kira', '반짝반짝 열매', 'paramecia', 4, '다이아몬드', 'gsgxa', 'jozu'],
  ['poke', '포켓포켓 열매', 'paramecia', 2, '주머니', 'sgb', 'blamenco'],
  // 초인계: 드레스로자 ~ 에그헤드
  ['hobi', '호비호비 열매', 'paramecia', 5, '장난감', 'bsguxa', 'sugar'],
  ['nui', '누이누이 열매', 'paramecia', 3, '봉제', 'sbgx', 'leo'],
  ['chiyu', '치유치유 열매', 'paramecia', 4, '치유', 'hsgxa', 'mansherry'],
  ['giro', '기로기로 열매', 'paramecia', 3, '투시', 'sgbx', 'viola'],
  ['jake', '재킷재킷 열매', 'paramecia', 2, '재킷', 'fsg', 'kellyfunk'],
  ['hira', '펄럭펄럭 열매', 'paramecia', 3, '깃발', 'sgbx', 'diamante'],
  ['ato', '아트아트 열매', 'paramecia', 3, '예술', 'bsgu', 'giolla'],
  ['ton', '톤톤 열매', 'paramecia', 3, '무게', 'sugx', 'machvise'],
  ['sui', '헤엄헤엄 열매', 'paramecia', 3, '지면 유영', 'sgbx', 'senorpink'],
  ['guru', '빙글빙글 열매', 'paramecia', 2, '회전', 'sfx', 'buffalo'],
  ['pamu', '펑펑 열매', 'paramecia', 3, '파열', 'suxb', 'gladius'],
  ['ishi', '바위바위 열매', 'paramecia', 4, '바위', 'sguxa', 'pica'],
  ['nagi', '고요고요 열매', 'paramecia', 2, '정적', 'gsb', 'rosinante'],
  ['zushi', '쿠궁쿠궁 열매', 'paramecia', 5, '중력', 'sugxba', 'fujitora'],
  ['soru', '소울소울 열매', 'paramecia', 5, '영혼', 'sbuxga', 'bigmom'],
  ['mochi', '쫀득쫀득 열매', 'paramecia', 4, '떡', 'sguxa', 'katakuri'],
  ['bisu', '비스비스 열매', 'paramecia', 3, '비스킷', 'sgbx', 'cracker'],
  ['pero', '핥짝핥짝 열매', 'paramecia', 3, '사탕', 'sgbx', 'perospero'],
  ['mira', '미러미러 열매', 'paramecia', 3, '거울', 'gsbx', 'brulee'],
  ['memo', '메모메모 열매', 'paramecia', 3, '기억', 'bsgx', 'pudding'],
  ['shibo', '시보시보 열매', 'paramecia', 3, '착즙', 'shbx', 'smoothie'],
  ['buku', '부쿠부쿠 열매', 'paramecia', 3, '책', 'bsgx', 'montdor'],
  ['netsu', '네츠네츠 열매', 'paramecia', 3, '열', 'suxg', 'oven'],
  ['hoya', '호야호야 열매', 'paramecia', 3, '램프', 'suxb', 'daifuku'],
  ['kuku', '쿠쿠쿠쿠 열매', 'paramecia', 3, '요리', 'shbx', 'streusen'],
  ['bata', '버터버터 열매', 'paramecia', 2, '버터', 'bsg', 'galette'],
  ['kuri', '크리크리 열매', 'paramecia', 2, '크림', 'sbu', 'opera'],
  ['kibi', '경단경단 열매', 'paramecia', 3, '경단', 'bsgx', 'tama'],
  ['juku', '숙성숙성 열매', 'paramecia', 3, '숙성', 'sbgx', 'shinobu'],
  ['fude', '붓붓 열매', 'paramecia', 3, '그림', 'sbgx', 'kanjuro'],
  ['fuku', '옷옷 열매', 'paramecia', 2, '의복', 'sgb', 'kinemon'],
  ['toki', '토키토키 열매', 'paramecia', 5, '미래', 'sgbuxa', 'kozuki_toki'],
  ['toshi', '토시토시 열매', 'paramecia', 4, '나이', 'sbgxa', 'bonney'],
  ['gabu', '꿀꺽꿀꺽 열매', 'paramecia', 3, '술', 'suxb', 'vascoshot'],
  ['riki', '힘힘 열매', 'paramecia', 3, '괴력', 'sfxg', 'burgess'],
  ['wapu', '워프워프 열매', 'paramecia', 4, '순간이동', 'sgbxa', 'vanauger'],
  ['shiku', '병병 열매', 'paramecia', 3, '질병', 'sbux', 'docq'],
  ['nomi', '뇌뇌 열매', 'paramecia', 4, '지식', 'sbgxa', 'vegapunk'],
  ['shima', '섬섬 열매', 'paramecia', 4, '섬', 'sguxa', 'pizarro'],
  ['guni', '구뇨구뇨 열매', 'paramecia', 3, '찰흙', 'sbgx', 'grus'],
  ['deka', '데카데카 열매', 'paramecia', 4, '거대화', 'sfgxa', 'sanjuanwolf'],
  ['muchi', '무치무치 열매', 'paramecia', 3, '채찍', 'sbgx', 'kujyaku'],
  ['nori', '노리노리 열매', 'paramecia', 3, '탑승 조종', 'sgbx', 'bluegrass'],
  ['tsutsu', '츠츠츠츠 열매', 'paramecia', 3, '포격', 'sugx', 'urban'],
  // 자연계
  ['yuki', '눈눈 열매', 'logia', 3, '눈', 'sbux', 'monet'],
  ['gasu', '가스가스 열매', 'logia', 4, '가스', 'sbgxa', 'caesar'],
  ['mori', '숲숲 열매', 'logia', 5, '숲', 'sbhuxa', 'ryokugyu'],
  ['susu', '그을음그을음 열매', 'logia', 4, '그을음', 'sbuxa', 'karasu'],
  // 동물계와 고대종
  ['hito', '사람사람 열매', 'zoan', 2, '사람', 'fsg', 'chopper'],
  ['ushi_bison', '소소 열매 모델 들소', 'zoan', 2, '들소', 'fsx', 'dalton'],
  ['inu_wolf', '개개 열매 모델 늑대', 'zoan', 3, '늑대', 'fsux', 'jabra'],
  ['inu_jackal', '개개 열매 모델 재칼', 'zoan', 2, '재칼', 'fsx', 'chaka'],
  ['zou_elephant', '코끼리코끼리 열매', 'zoan', 3, '코끼리', 'fsux', 'funkfreed'],
  ['hebi_anaconda', '뱀뱀 열매 모델 아나콘다', 'zoan', 3, '아나콘다', 'fsbx', 'sandersonia'],
  ['hebi_kingcobra', '뱀뱀 열매 모델 킹코브라', 'zoan', 3, '킹코브라', 'fsux', 'marigold'],
  ['mushi_beetle', '벌레벌레 열매 모델 장수풍뎅이', 'zoan', 2, '장수풍뎅이', 'fsx', 'kabu'],
  ['mushi_hornet', '벌레벌레 열매 모델 말벌', 'zoan', 2, '말벌', 'fsx', 'bian'],
  ['sara_axolotl', '사라사라 열매 모델 아홀로틀', 'zoan', 2, '아홀로틀', 'fsx', 'smiley'],
  ['tori_albatross', '새새 열매 모델 알바트로스', 'zoan', 2, '알바트로스', 'fsx', 'morgans'],
  ['uma_horse', '말말 열매', 'zoan', 2, '말', 'fsx', 'pierre'],
  ['uma_pegasus', '말말 열매 환수종 모델 페가수스', 'zoan', 4, '페가수스', 'fsuxa', 'stronger'],
  ['inu_hound', '개개 열매 모델 사냥개', 'zoan', 2, '사냥개', 'fsx', 'hound'],
  ['rako_otter', '라코라코 열매', 'zoan', 2, '수달', 'fsx', 'ponsky'],
  ['ryu_allosaurus', '용용 열매 고대종 모델 알로사우루스', 'zoan', 4, '알로사우루스', 'fsuxa', 'drake'],
  ['ryu_spinosaurus', '용용 열매 고대종 모델 스피노사우루스', 'zoan', 4, '스피노사우루스', 'fsuxa', 'pageone'],
  ['ryu_pteranodon', '용용 열매 고대종 모델 프테라노돈', 'zoan', 4, '프테라노돈', 'fsuxa', 'king'],
  ['ryu_brachiosaurus', '용용 열매 고대종 모델 브라키오사우루스', 'zoan', 4, '브라키오사우루스', 'fsuxa', 'queen'],
  ['ryu_triceratops', '용용 열매 고대종 모델 트리케라톱스', 'zoan', 4, '트리케라톱스', 'fsuxa', 'sasaki'],
  ['ryu_pachy', '용용 열매 고대종 모델 파키케팔로사우루스', 'zoan', 4, '파키케팔로사우루스', 'fsuxa', 'ulti'],
  ['zou_mammoth', '코끼리코끼리 열매 고대종 모델 매머드', 'zoan', 4, '매머드', 'fsuxa', 'jack'],
  ['neko_saber', '고양고양 열매 고대종 모델 검치호', 'zoan', 4, '검치호', 'fsuxa', 'whoswho'],
  ['kumo_rosa', '거미거미 열매 고대종 모델 로사미갈레 그라우보겔리', 'zoan', 4, '고대 거미', 'fsbxa', 'blackmaria'],
  // 환수종
  ['uo_seiryu', '물고기물고기 열매 환수종 모델 청룡', 'zoan', 5, '청룡', 'fsuxba', 'kaido'],
  ['hito_daibutsu', '사람사람 열매 환수종 모델 대불', 'zoan', 5, '대불', 'fguxba', 'sengoku'],
  ['inu_kyubi', '개개 열매 환수종 모델 구미호', 'zoan', 4, '구미호', 'fsgxa', 'devon'],
  ['inu_okuchi', '개개 열매 환수종 모델 오오쿠치노마카미', 'zoan', 5, '신성한 늑대', 'fsuxba', 'yamato'],
  ['hebi_orochi', '뱀뱀 열매 환수종 모델 야마타노오로치', 'zoan', 4, '야마타노오로치', 'fsgxa', 'orochi'],
  ['hito_onyudo', '사람사람 열매 환수종 모델 오뉴도', 'zoan', 4, '오뉴도', 'fsgxa', 'onimaru'],
];

/** 스마일은 자연산 열매 추첨에서 제외하고 관련 섬에서만 별도 판정한다. */
const SMILE_RAW: F[] = [
  ['smile_gazelle', '가젤의 스마일', 'zoan', 2, '가젤', 'fs', 'gazelleman'],
  ['smile_lion', '사자의 스마일', 'zoan', 2, '사자', 'fs', 'holdem'],
  ['smile_horse', '말의 스마일', 'zoan', 2, '말', 'fs', 'speed'],
  ['smile_sheep', '양의 스마일', 'zoan', 2, '양', 'fs', 'sheepshead'],
  ['smile_squirrel', '다람쥐의 스마일', 'zoan', 2, '다람쥐', 'fs', 'ginrummy'],
  ['smile_elephant', '코끼리의 스마일', 'zoan', 2, '코끼리', 'fs', 'babanuki'],
  ['smile_monkey', '원숭이의 스마일', 'zoan', 2, '원숭이', 'fs', 'solitaire'],
  ['smile_scorpion', '전갈의 스마일', 'zoan', 2, '전갈', 'fs', 'daifugo'],
  ['smile_bat', '박쥐의 스마일', 'zoan', 2, '박쥐', 'fs', 'batman'],
  ['smile_hippo', '하마의 스마일', 'zoan', 2, '하마', 'fs', 'dobon'],
  ['smile_mouse', '쥐의 스마일', 'zoan', 2, '쥐', 'fs', 'mouseman'],
  ['smile_failed', '실패한 스마일', 'zoan', 1, '웃음', 'f'],
];
export const SMILE_FRUITS: Fruit[] = SMILE_RAW.map(([id, name, cls, grade, theme, order, canon]) => ({
  id, name, cls, grade, theme,
  skills: order.split('').slice(0, GRADE_DEPTH[grade]).map((ch) => ({ template: T[ch], name: `${theme} ${TEMPLATE_SUFFIX[T[ch]]}` })),
  canonUser: canon ?? null,
}));

export const NATURAL_FRUITS: Fruit[] = [...RAW, ...MORE].map(([id, name, cls, grade, theme, order, canon]) => ({
  id, name, cls, grade, theme,
  skills: order.split('').slice(0, GRADE_DEPTH[grade]).map((ch) => ({ template: T[ch], name: `${theme} ${TEMPLATE_SUFFIX[T[ch]]}` })),
  canonUser: canon ?? null,
}));

export const FRUITS: Fruit[] = [...NATURAL_FRUITS, ...SMILE_FRUITS];

export const FRUIT_BY_ID: Record<string, Fruit> = Object.fromEntries(FRUITS.map((f) => [f.id, f]));
export const RETIRED_FRUIT_IDS = new Set(['hanshu', 'setsu', 'zaza', 'musu', 'kan', 'hyo', 'zan', 'fuhyo']);

/** 감정 힌트. 감정 1·2·3회째에 차례로 나온다. 정확히 알려 주지는 않는다. */
export function fruitHints(f: Fruit): [string, string, string] {
  const cls = f.cls === 'logia' ? '몸이 무언가로 바뀌는 계통 같다 (자연계로 보임)'
    : f.cls === 'zoan' ? '짐승의 기운이 느껴진다 (동물계로 보임)' : '몸에 특이한 성질이 생길 것 같다 (초인계로 보임)';
  const lo = Math.max(1, f.grade - 1), hi = Math.min(5, f.grade + 1);
  const grade = `값어치는 ${GRADE_NAMES[lo]}에서 ${GRADE_NAMES[hi]} 사이로 보인다`;
  const theme = `껍질의 무늬가 「${f.theme}」을(를) 떠올리게 한다`;
  return [cls, grade, theme];
}
