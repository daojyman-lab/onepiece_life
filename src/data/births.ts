// 성씨, 종족, 출생지, 가문. v3.3.3의 성씨 18종을 옮겼다 (docs/01_기획/02_데이터_명세.md 1장).
// 위대한 항로 · 신세계 출생 인물의 출발점(S6)은 아직 정하지 않았다. 지금은 가장 가까운 1단계 바다에서 시작한다.
import type { SeaId, Species, Stats } from '../core/types';

export interface SurnameDef {
  name: string; d: boolean; gender: 'any' | 'm' | 'f'; species: Species;
  places: { place: string; sea: SeaId }[];
  bonus: Partial<Stats>;
  traits: string[];
  households: string[];
  lore: string;
}

export const SURNAMES: SurnameDef[] = [
  { name: '보아', d: false, gender: 'f', species: 'human', places: [{ place: '여인섬 아마존 릴리', sea: 'east' }], bonus: { str: 2, spd: 3, wil: 4 }, traits: [], households: ['구사 전사의 집', '뱀 사육사의 집'], lore: '여인섬의 강한 여전사 가문.' },
  { name: '몽키', d: true, gender: 'any', species: 'human', places: [{ place: '후샤 마을', sea: 'east' }, { place: '로그타운 외곽', sea: 'east' }], bonus: { str: 3, vit: 3, wil: 4, luk: 2 }, traits: ['conquerorSeed'], households: ['해군 영웅의 친척', '산적 마을 이웃'], lore: '시대를 뒤흔드는 이름.' },
  { name: '롤로노아', d: false, gender: 'any', species: 'human', places: [{ place: '시모츠키 마을', sea: 'east' }], bonus: { str: 3, spd: 2, wil: 3 }, traits: ['swordTalent'], households: ['검술 도장 문하생 집', '대장간'], lore: '검에 미친 핏줄.' },
  { name: '시모츠키', d: false, gender: 'any', species: 'human', places: [{ place: '시모츠키 마을', sea: 'east' }], bonus: { str: 3, spd: 3, wil: 3 }, traits: ['swordTalent'], households: ['도장 사범의 집', '와노쿠니 이주민 집'], lore: '와노쿠니에서 건너온 검객 가문.' },
  { name: '네펠타리', d: false, gender: 'any', species: 'human', places: [{ place: '알라바스타 근교', sea: 'south' }], bonus: { int: 3, wil: 4, luk: 2 }, traits: [], households: ['왕가의 먼 친척', '호위대 가문'], lore: '사막 왕국의 오래된 이름.' },
  { name: '빈스모크', d: false, gender: 'any', species: 'human', places: [{ place: '북쪽 상업 도시', sea: 'north' }], bonus: { str: 2, spd: 4, int: 2 }, traits: [], households: ['저먼 왕국 분가', '요리사의 집'], lore: '과학과 전쟁의 왕가.' },
  { name: '골', d: true, gender: 'any', species: 'human', places: [{ place: '로그타운', sea: 'east' }, { place: '바테리라', sea: 'south' }], bonus: { str: 3, wil: 5, luk: 3 }, traits: ['conquerorSeed'], households: ['외딴 바닷가 오두막', '이름을 숨긴 집'], lore: '세상이 두려워하는 이름.' },
  { name: '트라팔가', d: true, gender: 'any', species: 'human', places: [{ place: '플레반스 옛터', sea: 'north' }], bonus: { int: 5, spd: 2, luk: 3 }, traits: ['conquerorSeed', 'medicTalent'], households: ['의사 집안', '하얀 마을 생존자'], lore: '숨겨진 D의 이름.' },
  { name: '재규어', d: true, gender: 'any', species: 'giant', places: [{ place: '거인 정착지', sea: 'south' }], bonus: { str: 7, vit: 6, spd: -1 }, traits: ['conquerorSeed'], households: ['거인 전사의 집'], lore: '거대한 몸, 거대한 의지.' },
  { name: '피셔', d: false, gender: 'any', species: 'fishman', places: [{ place: '남쪽 산호초 항구', sea: 'south' }], bonus: { str: 4, vit: 4, spd: 3 }, traits: ['swimmer'], households: ['어인 공수도 도장', '어부의 집'], lore: '바다에서 태어난 영웅의 이름.' },
  { name: '호디', d: false, gender: 'any', species: 'fishman', places: [{ place: '남쪽 산호초 항구', sea: 'south' }], bonus: { str: 5, vit: 3 }, traits: ['swimmer'], households: ['어인가 뒷골목'], lore: '분노를 물려받은 이름.' },
  { name: '페드로', d: false, gender: 'any', species: 'mink', places: [{ place: '조 모코모 이주촌', sea: 'west' }], bonus: { spd: 5, luk: 3, str: 3 }, traits: [], households: ['밍크족 전사의 집'], lore: '코끼리 등 위의 나라에서 온 핏줄.' },
  { name: '레오', d: false, gender: 'any', species: 'human', places: [{ place: '서쪽 등대섬', sea: 'west' }], bonus: { spd: 6, str: 3, luk: 3 }, traits: [], households: ['작은 사람들의 이웃'], lore: '작지만 빠르다.' },
  { name: '돈키호테', d: false, gender: 'any', species: 'human', places: [{ place: '노스 블루 귀족 저택', sea: 'north' }], bonus: { wil: 4, int: 3, luk: 2 }, traits: ['conquerorSeed'], households: ['몰락한 천룡인의 집'], lore: '하늘에서 떨어진 가문.' },
  { name: '몽블랑', d: false, gender: 'any', species: 'human', places: [{ place: '루브니르 왕국', sea: 'north' }], bonus: { int: 3, vit: 3, luk: 4 }, traits: ['navigatorTalent'], households: ['탐험가 가문', '거짓말쟁이 소리 듣는 집'], lore: '황금향을 본 탐험가의 후손.' },
  { name: '코즈키', d: false, gender: 'any', species: 'human', places: [{ place: '와노쿠니 이주촌', sea: 'east' }], bonus: { str: 3, vit: 3, wil: 4 }, traits: ['swordTalent'], households: ['쇼군 가문의 먼 핏줄'], lore: '역사의 문자를 아는 가문.' },
  { name: '카포네', d: false, gender: 'any', species: 'human', places: [{ place: '마피아 항구', sea: 'west' }], bonus: { int: 3, wil: 3, luk: 2 }, traits: ['gunTalent'], households: ['패밀리의 집'], lore: '서쪽 바다의 마피아.' },
  { name: '와이퍼', d: false, gender: 'any', species: 'skypiean', places: [{ place: '샨도라 후예 마을', sea: 'west' }], bonus: { spd: 3, luk: 4, str: 2 }, traits: [], households: ['샨디아 전사의 집'], lore: '하늘섬에서 내려온 전사.' },
];

export const COMMON_SURNAMES = ['카스텔', '베른', '모리', '하르트', '로웰', '그란츠', '시엘', '도란', '포르테', '마린', '케일'];
export const FIRST_NAMES = {
  m: ['루카', '에단', '카이', '리온', '테오', '하루', '진', '로이', '세온', '도윤', '마테오', '빌리', '쇼', '라스'],
  f: ['미라', '엘리', '나루', '세라', '유나', '리사', '카야', '루나', '노아', '히나', '소피', '아린'],
};
export const PARENT_NAMES = { m: ['가렛', '도널', '레온', '헨릭', '오웬', '바실', '로드'], f: ['마르타', '에바', '리타', '셀마', '노라', '한나', '이다'] };

export const SPECIES_NAMES: Record<Species, string> = {
  human: '인간', fishman: '어인족', mink: '밍크족', giant: '거인족', longarm: '장수족', celestial: '천룡인', skypiean: '하늘섬 주민',
};

/** 인간 성씨 중 보호 성씨가 아니면 이 가중치로 종족을 다시 뽑는다 (42%) */
export const SPECIES_REROLL = { p: 0.42, weights: [['human', 35], ['fishman', 20], ['mink', 17], ['skypiean', 10], ['giant', 7], ['longarm', 3]] as [Species, number][] };
export const PROTECTED = ['몽키', '롤로노아', '네펠타리', '보아', '빈스모크', '돈키호테', '시모츠키', '코즈키', '몽블랑', '피셔'];

export const SPECIES_BONUS: Partial<Record<Species, Partial<Stats>>> = {
  fishman: { str: 2, vit: 1 }, mink: { spd: 2 }, giant: { str: 3, vit: 3, spd: -2 }, longarm: { spd: 1, luk: 1 }, skypiean: { luk: 2 },
};
