// 화면에 나가는 이름과 말. 코어의 id를 사람이 읽는 말로 바꾼다.
import { BRANCH_NAMES } from '../../data/skills';
import { BRANCH_ID } from '../core/power';
import type { Injury } from '../../core/types';
import type { Branch, Lineage, LimbState, Standing, ValueId, Wealth } from '../core/types';

export const WEALTH_NAME: Record<Wealth, string> = {
  poor: '가난한 집', common: '평범한 집', comfortable: '넉넉한 집', noble: '이름난 집안',
};

export const LINEAGE_NAME: Record<Lineage, string> = {
  orphan: '고아', commoner: '평민', marineFamily: '해군 가문', pirateChild: '해적의 자식', samurai: '무사 가문', outcast: '차별받는 핏줄',
};

export const BRANCH_NAME: Record<Branch, string> = Object.fromEntries(
  (Object.keys(BRANCH_ID) as Branch[]).map((b) => [b, b === 'sword' ? '무기술' : BRANCH_NAMES[BRANCH_ID[b]]]),
) as Record<Branch, string>;

export const LIMB_STATE_WORD: Record<Exclude<LimbState, 'ok'>, string> = {
  lost: '잃었다', basic: '의수 · 의족을 달았다', superior: '원래보다 강한 것을 달았다',
};

/** 0~6단계를 부르는 말 (0은 빈 글자) */
export const TIER_WORD: string[] = ['', '입문', '수련', '숙련', '달인', '경지', '극의'];

/** 처지의 이름 (프로필과 시작 화면의 「진행 중」 줄) */
export const STANDING_NAME: Record<Standing, string> = {
  child: '아이', civil: '뭍사람', pirate: '해적', marine: '해군', revolution: '혁명군', bountyHunter: '현상금 사냥꾼',
  warlord: '칠무해', shipwright: '조선공', cp: '정부의 첩보원', settled: '뭍에 자리 잡은 사람', prisoner: '죄수', retired: '은퇴한 사람',
};

/** 다친 곳의 이름 */
export const INJURY_NAME: Record<Injury['severity'], string> = { light: '가벼운 부상', heavy: '무거운 부상', scar: '후유증' };

/** 병의 이름 (모르는 id는 '병') */
export const ILLNESS_NAME: Record<string, string> = { cough: '기침병', fever: '열병' };

/**
 * 사람의 관계(Person.relation) 가운데 가족의 갈래. 사건 데이터가 이 갈래의 사람을 만들 때는 이 낱말만 쓴다
 * (needs.ts가 이 낱말로 배우자 · 자식 · 형제 · 부모를 센다. tests/v5/content.test.ts가 확인한다).
 */
export const RELATION_KIND: Record<'spouse' | 'child' | 'sibling' | 'parent', string[]> = {
  spouse: ['배우자', '아내', '남편'],
  child: ['자식', '아들', '딸'],
  sibling: ['형', '누나', '오빠', '언니', '남동생', '여동생'],
  parent: ['아버지', '어머니'],
};

/** 처지 앞에 붙는 가치관의 말 (가장 높은 가치관) */
export const VALUE_ADJ: Record<ValueId, string> = {
  justice: '정의로운', greed: '탐욕스러운', ambition: '야망 있는', romance: '낭만적인', inquiry: '탐구심 많은',
  loyalty: '의리 있는', freedom: '자유로운', dominion: '패도를 걷는', peace: '온화한',
};
/** 해적의 이름값(명성)에 따른 이름: [이 명성 미만이면, 이름]. 맨 처음(신참)에는 가치관의 말을 붙이지 않는다 */
export const PIRATE_TITLES: readonly [number, string][] = [[30, '신참 해적'], [150, '이름난 해적'], [400, '악명 높은 해적']];
export const PIRATE_TOP_TITLE = '바다를 뒤흔드는 대해적';
/** 해군의 자리: 분대를 거느리기 전은 병사, 분대장(mnOfficer)부터 부사관, 계급 marineOfficerRank부터 장교 */
export const MARINE_TITLES = { soldier: '해군 병사', nco: '해군 부사관', officer: '해군 장교' } as const;
export const MARINE_OFFICER_RANK = 3;

/** 전투력(power5)을 말로: 이 값 미만이면 그 말. 기준은 이름 있는 상대의 힘 (알비다 100 · 아론 240 · 크로커다일 770 · 도플라밍고 2600 · 아카이누 5700) */
export const POWER_WORDS: readonly [number, string][] = [
  [100, '동네 싸움꾼'], [240, '이스트 블루의 해적 선장급'], [770, '이스트 블루를 휘어잡을 만한 급'],
  [2600, '위대한 항로에서 이름난 급'], [5700, '신세계에서 버틸 만한 급'],
];
/** 전투 등급: 종합 전투력이 이 값 미만이면 그 등급 (나 · 동료 · 상대가 같은 잣대) */
export const GRADES: readonly [number, string][] = [[60, 'F'], [100, 'E'], [240, 'D'], [500, 'C'], [770, 'B'], [1500, 'A'], [2600, 'S'], [5700, 'SS']];
export const GRADE_TOP = 'SSS';
export const POWER_TOP = '대장 · 사황과 겨룰 만한 급';
