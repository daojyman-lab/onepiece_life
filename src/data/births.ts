// 출생: 고향, 성씨, 종족, 가정환경.
// 고향은 원작 초반에 나오는 이스트 블루의 마을 8곳뿐이다 (2026-11-14 수정).
// 이스트 블루와 연이 없는 희귀한 성씨, 인간이 아닌 종족은 "고아"로 태어난다. 바다에서 떠내려왔거나 버려진 아이를 마을 사람이 거둔다.
import type { SeaId, Species, Stats } from '../core/types';

export interface Hometown {
  name: string; sea: SeaId; text: string;
  households: { text: string; father?: 'marine' | 'pirate' }[];
}

export const HOMETOWNS: Hometown[] = [
  { name: '후샤 마을', sea: 'east', text: '고아 왕국 변두리, 풍차가 도는 작은 어촌',
    households: [{ text: '술집 단골 어부의 집' }, { text: '풍차 방앗간' }, { text: '촌장 댁 이웃' }, { text: '해군 영웅의 먼 친척 집', father: 'marine' }] },
  { name: '고아 왕국 그레이 터미널', sea: 'east', text: '왕국 성벽 밖의 쓰레기 산',
    households: [{ text: '쓰레기 산 판잣집' }, { text: '산적 일가의 이웃', father: 'pirate' }] },
  { name: '셸스 타운', sea: 'east', text: '해군 지부가 내려다보는 마을',
    households: [{ text: '해군 기지 하사관의 집', father: 'marine' }, { text: '마을 식당' }, { text: '어부의 집' }] },
  { name: '오렌지 마을', sea: 'east', text: '애완동물 가게와 시장이 있는 항구 마을',
    households: [{ text: '애완동물 가게' }, { text: '시장 가판대 집' }, { text: '촌장 댁' }] },
  { name: '시럽 마을', sea: 'east', text: '언덕 위 저택이 있는 조용한 시골',
    households: [{ text: '저택 하인의 집' }, { text: '양치기 집안' }, { text: '마을 의사 댁' }, { text: '해적이 되어 떠난 아버지의 집', father: 'pirate' }] },
  { name: '코코야시 마을', sea: 'east', text: '코노미 제도의 귤 농장 마을',
    households: [{ text: '귤 농장' }, { text: '주재소 경관의 집' }, { text: '어부의 집' }] },
  { name: '시모츠키 마을', sea: 'east', text: '이름난 검술 도장이 있는 마을',
    households: [{ text: '검술 도장 문하생 집' }, { text: '대장간' }, { text: '쌀집' }] },
  { name: '로그타운', sea: 'east', text: '해적왕이 태어나고 죽은 시작과 끝의 마을',
    households: [{ text: '선술집' }, { text: '무기점' }, { text: '항구 짐꾼의 집' }, { text: '해군 지부 근처 하숙집', father: 'marine' }] },
];

export interface SurnameDef {
  name: string; d: boolean; gender: 'any' | 'm' | 'f'; species: Species;
  kind: 'common' | 'local' | 'rare';      // common 평범한 집안 · local 이스트 블루의 이름난 집안 · rare 고아로 태어난다
  homes?: string[];                        // 이 집안이 사는 고향 (local)
  bonus: Partial<Stats>;
  traits: string[];
  lore: string;
  token?: string;                          // 고아일 때 품에 있던 물건
}

const common = (name: string, bonus: Partial<Stats>, lore: string, traits: string[] = []): SurnameDef =>
  ({ name, d: false, gender: 'any', species: 'human', kind: 'common', bonus, traits, lore });
const rare = (x: Omit<SurnameDef, 'kind'>): SurnameDef => ({ ...x, kind: 'rare' });

export const SURNAMES: SurnameDef[] = [
  // ---------------- 평범한 집안
  common('로웰', { vit: 2, str: 1 }, '대대로 바다에 그물을 던져 온 어부 집안.'),
  common('그란츠', { str: 2, vit: 1 }, '망치 소리가 끊이지 않는 대장장이 집안.'),
  common('시엘', { int: 2, wil: 1 }, '마을 사람들의 병을 돌봐 온 의사 집안.', ['medicTalent']),
  common('도란', { int: 1, luk: 2 }, '항구를 오가며 물건을 사고파는 상인 집안.'),
  common('하르트', { str: 1, int: 2 }, '배를 고치고 짓는 목수 집안.'),
  common('케일', { wil: 2, int: 1 }, '등대 불을 지켜 온 등대지기 집안.', ['navigatorTalent']),
  common('마린', { wil: 1, vit: 1, str: 1 }, '해군 하사관을 여럿 낸 집안.'),
  common('포르테', { luk: 2, spd: 1 }, '항구 선술집을 하는 집안. 뱃사람 소문이 모인다.'),
  common('베른', { vit: 2, wil: 1 }, '밭을 일구는 성실한 농부 집안.'),
  common('모리', { int: 3 }, '책에 파묻혀 사는 학자 집안.'),
  common('카스텔', { wil: 2, luk: 1 }, '이름만 남은 몰락한 귀족 집안.'),
  common('바르가', { str: 2, spd: 1 }, '아버지가 젊을 적 해적이었다는 소문이 도는 집안.'),
  common('오토', { spd: 2, luk: 1 }, '우편선을 모는 집안.'),
  common('하버', { str: 1, spd: 1, vit: 1 }, '부두에서 짐을 나르는 짐꾼 집안.'),
  common('스완', { spd: 2, int: 1 }, '사냥으로 먹고사는 집안.', ['gunTalent']),
  common('미르', { luk: 3 }, '귤 농사를 짓는 집안.'),
  common('노르', { wil: 2, str: 1 }, '산적과 어울려 산다는 수상한 집안.'),
  common('펠', { spd: 1, int: 1, luk: 1 }, '떠돌이 악단 출신이 정착한 집안.'),

  // ---------------- 이스트 블루의 이름난 집안
  { name: '몽키', d: true, gender: 'any', species: 'human', kind: 'local', homes: ['후샤 마을', '고아 왕국 그레이 터미널'], bonus: { str: 3, vit: 3, wil: 4, luk: 2 }, traits: ['conquerorSeed'], lore: '시대를 뒤흔드는 이름.' },
  { name: '롤로노아', d: false, gender: 'any', species: 'human', kind: 'local', homes: ['시모츠키 마을'], bonus: { str: 3, spd: 2, wil: 3 }, traits: ['swordTalent'], lore: '검에 미친 핏줄.' },
  { name: '시모츠키', d: false, gender: 'any', species: 'human', kind: 'local', homes: ['시모츠키 마을'], bonus: { str: 3, spd: 3, wil: 3 }, traits: ['swordTalent'], lore: '와노쿠니에서 건너와 도장을 연 검객 가문.' },
  { name: '골', d: true, gender: 'any', species: 'human', kind: 'local', homes: ['로그타운'], bonus: { str: 3, wil: 5, luk: 3 }, traits: ['conquerorSeed'], lore: '세상이 두려워하는 이름. 입 밖에 내지 않는다.' },

  // ---------------- 희귀한 성씨: 이스트 블루에서는 고아로 태어난다
  rare({ name: '보아', d: false, gender: 'f', species: 'human', bonus: { str: 2, spd: 3, wil: 4 }, traits: [], lore: '여인섬의 여전사 가문.', token: '뱀 비늘 모양 머리 장식' }),
  rare({ name: '네펠타리', d: false, gender: 'any', species: 'human', bonus: { int: 3, wil: 4, luk: 2 }, traits: [], lore: '사막 왕국의 오래된 왕가.', token: '왕가 문장이 새겨진 펜던트' }),
  rare({ name: '빈스모크', d: false, gender: 'any', species: 'human', bonus: { str: 2, spd: 4, int: 2 }, traits: [], lore: '과학과 전쟁의 왕가.', token: '숫자가 새겨진 은 팔찌' }),
  rare({ name: '트라팔가', d: true, gender: 'any', species: 'human', bonus: { int: 5, spd: 2, luk: 3 }, traits: ['conquerorSeed', 'medicTalent'], lore: '하얀 마을의 숨겨진 D.', token: '하얀 얼룩이 진 진찰 수첩' }),
  rare({ name: '재규어', d: true, gender: 'any', species: 'giant', bonus: { str: 7, vit: 6, spd: -1 }, traits: ['conquerorSeed'], lore: '거대한 몸, 거대한 의지.', token: '아이 몸만 한 투구' }),
  rare({ name: '피셔', d: false, gender: 'any', species: 'fishman', bonus: { str: 4, vit: 4, spd: 3 }, traits: ['swimmer'], lore: '어인섬 영웅의 이름.', token: '태양 문양의 문신' }),
  rare({ name: '호디', d: false, gender: 'any', species: 'fishman', bonus: { str: 5, vit: 3 }, traits: ['swimmer'], lore: '분노를 물려받은 어인의 이름.', token: '부러진 상어 이빨' }),
  rare({ name: '페드로', d: false, gender: 'any', species: 'mink', bonus: { spd: 5, luk: 3, str: 3 }, traits: [], lore: '코끼리 등 위의 나라에서 온 핏줄.', token: '코끼리 털로 짠 목걸이' }),
  rare({ name: '레오', d: false, gender: 'any', species: 'tontatta', bonus: { spd: 6, str: 3, luk: 3 }, traits: [], lore: '작은 사람들의 전사 가문.', token: '손톱만 한 바늘 검' }),
  rare({ name: '돈키호테', d: false, gender: 'any', species: 'human', bonus: { wil: 4, int: 3, luk: 2 }, traits: ['conquerorSeed'], lore: '하늘에서 떨어진 가문.', token: '분홍 깃털 한 묶음' }),
  rare({ name: '몽블랑', d: false, gender: 'any', species: 'human', bonus: { int: 3, vit: 3, luk: 4 }, traits: ['navigatorTalent'], lore: '황금향을 본 탐험가의 후손.', token: '금박 해도 조각' }),
  rare({ name: '코즈키', d: false, gender: 'any', species: 'human', bonus: { str: 3, vit: 3, wil: 4 }, traits: ['swordTalent'], lore: '역사의 문자를 아는 쇼군 가문.', token: '알 수 없는 문자가 새겨진 돌 조각' }),
  rare({ name: '카포네', d: false, gender: 'any', species: 'human', bonus: { int: 3, wil: 3, luk: 2 }, traits: ['gunTalent'], lore: '서쪽 바다의 마피아 패밀리.', token: '패밀리 문양의 반지' }),
  rare({ name: '와이퍼', d: false, gender: 'any', species: 'skypiean', bonus: { spd: 3, luk: 4, str: 2 }, traits: [], lore: '하늘섬에서 내려온 전사의 핏줄.', token: '소리 나는 조개껍데기' }),
  rare({ name: '포트거스', d: false, gender: 'any', species: 'human', bonus: { str: 3, wil: 3, luk: 2 }, traits: [], lore: '남쪽 바다 바테리라의 이름.', token: '주근깨 소녀가 그려진 낡은 사진' }),
  rare({ name: '니코', d: false, gender: 'any', species: 'human', bonus: { int: 5, wil: 2 }, traits: [], lore: '사라진 학자의 섬 오하라의 이름.', token: '불에 그을린 고서 한 장' }),
  rare({ name: '샬롯', d: false, gender: 'any', species: 'human', bonus: { str: 3, vit: 3, wil: 2 }, traits: [], lore: '과자 나라 여왕의 수많은 자식들.', token: '설탕 과자 모양 브로치' }),
  rare({ name: '유스타스', d: false, gender: 'any', species: 'human', bonus: { str: 4, wil: 3 }, traits: [], lore: '사우스 블루 뒷골목의 사나운 이름.', token: '녹슨 쇠붙이 목걸이' }),
  rare({ name: '쥬얼리', d: false, gender: 'f', species: 'human', bonus: { vit: 3, luk: 3, wil: 2 }, traits: [], lore: '먹성 좋은 남쪽 바다의 이름.', token: '보석 박힌 포크' }),
  rare({ name: '마셜', d: true, gender: 'm', species: 'human', bonus: { str: 3, vit: 4, luk: 3 }, traits: ['conquerorSeed'], lore: '어둠을 품은 D.', token: '반쯤 먹다 만 체리 파이 상자' }),
];

/** 성씨가 뽑힐 가중치. 평범한 집안이 가장 흔하다 */
export const SURNAME_WEIGHT: Record<SurnameDef['kind'], number> = { common: 3, local: 1.5, rare: 0.6 };

export const COMMON_SURNAMES = SURNAMES.filter((x) => x.kind === 'common').map((x) => x.name);
export const FIRST_NAMES = {
  m: ['루카', '에단', '카이', '리온', '테오', '하루', '진', '로이', '세온', '도윤', '마테오', '빌리', '쇼', '라스', '토마', '닐', '오웬', '유리'],
  f: ['미라', '엘리', '나루', '세라', '유나', '리사', '카야', '루나', '노아', '히나', '소피', '아린', '레아', '모아', '이브', '시아'],
};
export const PARENT_NAMES = { m: ['가렛', '도널', '레온', '헨릭', '오웬', '바실', '로드'], f: ['마르타', '에바', '리타', '셀마', '노라', '한나', '이다'] };

export const SPECIES_NAMES: Record<Species, string> = {
  human: '인간', fishman: '어인족', merfolk: '인어족', mink: '밍크족', giant: '거인족', longarm: '팔긴족', longleg: '다리긴족',
  threeeye: '삼목족', tontatta: '소인족', celestial: '천룡인', skypiean: '하늘섬 주민',
};

/** 평범한 집안에서 가끔 사람이 아닌 아이가 거둬진다. 이스트 블루에 없는 종족이라 고아가 된다 */
export const SPECIES_REROLL = {
  p: 0.12,
  weights: [['fishman', 4], ['mink', 4], ['merfolk', 2], ['skypiean', 2], ['longarm', 2], ['longleg', 2], ['giant', 1], ['threeeye', 1], ['tontatta', 1]] as [Species, number][],
};

export const SPECIES_BONUS: Partial<Record<Species, Partial<Stats>>> = {
  fishman: { str: 2, vit: 1 }, merfolk: { spd: 2, luk: 1 }, mink: { spd: 2 }, giant: { str: 3, vit: 3, spd: -2 },
  longarm: { spd: 1, luk: 1 }, longleg: { spd: 2 }, threeeye: { int: 1, wil: 2 }, tontatta: { spd: 3, str: 1, vit: -2 }, skypiean: { luk: 2 },
};

export const ORPHAN_STORIES = [
  '{place} 바닷가에 작은 쪽배가 떠내려왔다. 안에는 갓난아이가 울고 있었다.',
  '폭풍이 지나간 아침, {place} 부두에 바구니 하나가 걸려 있었다.',
  '{place}에 들른 상선이 아이 하나를 내려놓고 떠났다.',
];
