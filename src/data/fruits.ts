// 악마의 열매. 기술은 틀(FruitTemplate)에서 만들고, 열매는 이름과 순서만 갖는다.
// v4.0.0 첫 마일스톤은 40종. 기획 목표는 100여 종이다 (docs/04_구현/구현_메모.md).
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
  ['nika', '사람사람 열매 모델 니카', 'zoan', 5, '해방', 'sfuxga', 'luffy'],
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
  ['gomu', '고무고무 열매', 'paramecia', 3, '고무', 'sgux'],
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
  ['hanshu', '반사반사 열매', 'paramecia', 2, '반사', 'gsx'],
  ['setsu', '접합접합 열매', 'paramecia', 2, '접합', 'shs'],
  ['zaza', '자자 열매 모델 산토끼', 'zoan', 2, '산토끼', 'sfs'],
  // 쓰레기 (1)
  ['inu_dachs', '개개 열매 모델 닥스훈트', 'zoan', 1, '닥스훈트', 'f'],
  ['kusu', '녹슬녹슬 열매', 'paramecia', 1, '녹', 'sb'],
  ['musu', '매듭매듭 열매', 'paramecia', 1, '매듭', 'b'],
  ['kan', '완충완충 열매', 'paramecia', 1, '완충', 'g'],
  ['hyo', '표식표식 열매', 'paramecia', 1, '표식', 's'],
  ['zan', '잔향잔향 열매', 'paramecia', 1, '잔향', 'sg'],
  ['fuhyo', '부표부표 열매', 'paramecia', 1, '부표', 'g'],
  ['kame', '거북거북 열매', 'zoan', 1, '거북', 'gf'],
  ['beta', '끈적끈적 열매', 'paramecia', 1, '끈적임', 'bs'],
];

export const FRUITS: Fruit[] = RAW.map(([id, name, cls, grade, theme, order, canon]) => ({
  id, name, cls, grade, theme,
  skills: order.split('').slice(0, GRADE_DEPTH[grade]).map((ch) => ({ template: T[ch], name: `${theme} ${TEMPLATE_SUFFIX[T[ch]]}` })),
  canonUser: canon ?? null,
}));

export const FRUIT_BY_ID: Record<string, Fruit> = Object.fromEntries(FRUITS.map((f) => [f.id, f]));

/** 감정 힌트. 감정 1·2·3회째에 차례로 나온다. 정확히 알려 주지는 않는다. */
export function fruitHints(f: Fruit): [string, string, string] {
  const cls = f.cls === 'logia' ? '몸이 무언가로 바뀌는 계통 같다 (자연계로 보임)'
    : f.cls === 'zoan' ? '짐승의 기운이 느껴진다 (동물계로 보임)' : '몸에 특이한 성질이 생길 것 같다 (초인계로 보임)';
  const lo = Math.max(1, f.grade - 1), hi = Math.min(5, f.grade + 1);
  const grade = `값어치는 ${GRADE_NAMES[lo]}에서 ${GRADE_NAMES[hi]} 사이로 보인다`;
  const theme = `껍질의 무늬가 「${f.theme}」을(를) 떠올리게 한다`;
  return [cls, grade, theme];
}
