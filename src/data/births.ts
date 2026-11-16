// 출생: 고향, 성씨, 종족, 가정환경.
// 고향은 원작 초반에 나오는 이스트 블루의 마을 8곳뿐이다 (2026-11-14 수정).
// 이스트 블루와 연이 없는 희귀한 성씨, 인간이 아닌 종족은 "고아"로 태어난다. 바다에서 떠내려왔거나 버려진 아이를 마을 사람이 거둔다.
import type { SeaId, Species, Stats } from '../core/types';

/** 고향 (v5의 HomeId와 같다) */
export type HomeKey = 'loguetown' | 'water7' | 'wano' | 'fishman' | 'sky' | 'zou';

export interface Hometown {
  name: string; home: HomeKey; sea: SeaId; text: string;
  households: { text: string; father?: 'marine' | 'pirate' }[];
  teachers: { label: string; hint: string; branch: 'martial.fist' | 'martial.sword' | 'martial.gun' }[];   // 10세에 배울 수 있는 곳
}

export const HOMETOWNS: Hometown[] = [
  { name: '후샤 마을', home: 'loguetown', sea: 'east', text: '고아 왕국 변두리, 풍차가 도는 작은 어촌',
    households: [{ text: '술집 단골 어부의 집' }, { text: '풍차 방앗간' }, { text: '촌장 댁 이웃' }, { text: '해군 영웅의 먼 친척 집', father: 'marine' }],
    teachers: [
      { label: '코르보 산 산적들에게 맨주먹 싸움을 배운다', hint: '체술 · 거칠지만 실전이다', branch: 'martial.fist' },
      { label: '숲의 사냥꾼에게 활 대신 총을 배운다', hint: '사격 · 짐승을 쫓으며 눈이 밝아진다', branch: 'martial.gun' },
      { label: '항구의 늙은 선원에게 칼 쓰는 법을 배운다', hint: '검술 · 배 위에서 쓰던 막칼', branch: 'martial.sword' },
    ] },
  { name: '고아 왕국 그레이 터미널', home: 'loguetown', sea: 'east', text: '왕국 성벽 밖의 쓰레기 산',
    households: [{ text: '쓰레기 산 판잣집' }, { text: '산적 일가의 이웃', father: 'pirate' }],
    teachers: [
      { label: '쓰레기 산 형들과 쇠파이프로 싸운다', hint: '검술 · 막대기도 칼이다', branch: 'martial.sword' },
      { label: '산적 일가에게 맨주먹을 배운다', hint: '체술 · 살아남는 싸움', branch: 'martial.fist' },
      { label: '고철로 만든 새총으로 새를 잡는다', hint: '사격 · 굶지 않으려면 맞혀야 한다', branch: 'martial.gun' },
    ] },
  { name: '셸스 타운', home: 'loguetown', sea: 'east', text: '해군 지부가 내려다보는 마을',
    households: [{ text: '해군 기지 하사관의 집', father: 'marine' }, { text: '마을 식당' }, { text: '어부의 집' }],
    teachers: [
      { label: '해군 기지 담장 너머로 사격 훈련을 훔쳐본다', hint: '사격 · 병사들의 자세를 따라 한다', branch: 'martial.gun' },
      { label: '기지 검술 교관에게 졸라서 배운다', hint: '검술 · 정석대로', branch: 'martial.sword' },
      { label: '마을 식당 요리사에게 발차기를 배운다', hint: '체술 · 손은 요리에 쓰라더라', branch: 'martial.fist' },
    ] },
  { name: '오렌지 마을', home: 'loguetown', sea: 'east', text: '애완동물 가게와 시장이 있는 항구 마을',
    households: [{ text: '애완동물 가게' }, { text: '시장 가판대 집' }, { text: '촌장 댁' }],
    teachers: [
      { label: '시장 경비대 아저씨에게 칼을 배운다', hint: '검술 · 마을을 지키는 칼', branch: 'martial.sword' },
      { label: '항구 짐꾼들과 씨름하며 몸을 단련한다', hint: '체술 · 힘이 붙는다', branch: 'martial.fist' },
    ] },
  { name: '시럽 마을', home: 'loguetown', sea: 'east', text: '언덕 위 저택이 있는 조용한 시골',
    households: [{ text: '저택 하인의 집' }, { text: '양치기 집안' }, { text: '마을 의사 댁' }, { text: '해적이 되어 떠난 아버지의 집', father: 'pirate' }],
    teachers: [
      { label: '언덕의 사냥꾼에게 저격을 배운다', hint: '사격 · 멀리서 정확하게', branch: 'martial.gun' },
      { label: '저택 경비병에게 칼을 배운다', hint: '검술 · 저택을 지키던 칼', branch: 'martial.sword' },
      { label: '양치기 형들과 들판에서 몸싸움을 한다', hint: '체술 · 하루 종일 뛰어다닌다', branch: 'martial.fist' },
    ] },
  { name: '코코야시 마을', home: 'loguetown', sea: 'east', text: '코노미 제도의 귤 농장 마을',
    households: [{ text: '귤 농장' }, { text: '주재소 경관의 집' }, { text: '어부의 집' }],
    teachers: [
      { label: '주재소 경관에게 총 쏘는 법을 배운다', hint: '사격 · 마을을 지키는 총', branch: 'martial.gun' },
      { label: '해군 출신이라는 귤 농장 주인에게 맨주먹을 배운다', hint: '체술 · 해군식 격투', branch: 'martial.fist' },
    ] },
  { name: '시모츠키 마을', home: 'loguetown', sea: 'east', text: '이름난 검술 도장이 있는 마을',
    households: [{ text: '검술 도장 문하생 집' }, { text: '대장간' }, { text: '쌀집' }],
    teachers: [
      { label: '코우시로 도장에 들어간다', hint: '검술 · 이스트 블루에서 이름난 도장', branch: 'martial.sword' },
      { label: '대장장이에게 망치질부터 배운다', hint: '체술 · 쇠를 두드리며 팔이 굵어진다', branch: 'martial.fist' },
    ] },
  { name: '로그타운', home: 'loguetown', sea: 'east', text: '해적왕이 태어나고 죽은 시작과 끝의 마을',
    households: [{ text: '선술집' }, { text: '무기점' }, { text: '항구 짐꾼의 집' }, { text: '해군 지부 근처 하숙집', father: 'marine' }],
    teachers: [
      { label: '해군 지부 사격장을 드나든다', hint: '사격 · 해군 지부의 표적', branch: 'martial.gun' },
      { label: '무기점 주인에게 칼 다루는 법을 배운다', hint: '검술 · 명검을 보는 눈도 생긴다', branch: 'martial.sword' },
      { label: '선술집 싸움꾼들 틈에서 주먹을 배운다', hint: '체술 · 술집 싸움은 실전이다', branch: 'martial.fist' },
    ] },
  // ---------------- 워터 세븐
  { name: '워터 세븐', home: 'water7', sea: 'gl_first', text: '물길이 거리를 가르는 조선의 도시',
    households: [{ text: '갈레라 컴퍼니 직공의 집' }, { text: '물길가 여관' }, { text: '시장 상인의 집' }],
    teachers: [
      { label: '조선소 직공들 틈에서 망치를 든다', hint: '체술 · 쇠못을 박으며 팔이 굵어진다', branch: 'martial.fist' },
      { label: '시장 경비대에게 칼을 배운다', hint: '검술 · 도시를 지키는 칼', branch: 'martial.sword' },
    ] },
  { name: '워터 세븐 뒷골목', home: 'water7', sea: 'gl_first', text: '스크랩 섬의 해체장과 판잣집',
    households: [{ text: '해체업자의 판잣집' }, { text: '고철상' }],
    teachers: [
      { label: '해체업자 형들과 주먹다짐을 한다', hint: '체술 · 뒷골목의 싸움', branch: 'martial.fist' },
      { label: '고철로 만든 총을 쏘아 본다', hint: '사격 · 쏠 때마다 터질 것 같다', branch: 'martial.gun' },
    ] },
  { name: '시프트 역', home: 'water7', sea: 'gl_first', text: '바다 열차의 첫 역이 있는 작은 섬. 인어 할머니가 역장이다',
    households: [{ text: '선로지기 집' }, { text: '역 앞 식당' }],
    teachers: [
      { label: '역무원 아저씨에게 총을 배운다', hint: '사격 · 열차를 지키는 총', branch: 'martial.gun' },
      { label: '선로를 따라 달리며 몸을 단련한다', hint: '체술 · 다리가 튼튼해진다', branch: 'martial.fist' },
    ] },
  // ---------------- 와노쿠니
  { name: '하나노미야코', home: 'wano', sea: 'nw_late', text: '쇼군의 성이 내려다보는 꽃의 도시',
    households: [{ text: '무사 집안' }, { text: '포목점' }, { text: '찻집' }],
    teachers: [
      { label: '도장에서 칼을 배운다', hint: '검술 · 와노의 칼', branch: 'martial.sword' },
      { label: '스모 도장에서 몸을 단련한다', hint: '체술 · 버티는 힘', branch: 'martial.fist' },
    ] },
  { name: '쿠리', home: 'wano', sea: 'nw_late', text: '한때 무법자들의 땅이었던 마을',
    households: [{ text: '농가' }, { text: '떠돌이 낭인의 집' }],
    teachers: [
      { label: '떠돌이 낭인에게 칼을 배운다', hint: '검술 · 이름 없는 칼', branch: 'martial.sword' },
      { label: '산짐승을 쫓으며 활 대신 총을 든다', hint: '사격 · 굶지 않으려면 맞혀야 한다', branch: 'martial.gun' },
    ] },
  { name: '에비스 마을', home: 'wano', sea: 'nw_late', text: '웃음밖에 남지 않은 가난한 마을',
    households: [{ text: '판잣집' }, { text: '부서진 공방' }],
    teachers: [
      { label: '마을의 늙은 무사에게 칼을 배운다', hint: '검술 · 칼날이 이 빠졌다', branch: 'martial.sword' },
      { label: '광산에서 돌아온 사내에게 맨주먹을 배운다', hint: '체술 · 살아남는 싸움', branch: 'martial.fist' },
    ] },
  // ---------------- 어인섬
  { name: '어인가', home: 'fishman', sea: 'sabaody', text: '어인섬의 버려진 뒷골목',
    households: [{ text: '뒷골목 판잣집' }, { text: '고기잡이 집' }],
    teachers: [
      { label: '뒷골목 형들에게 어인 가라테를 흉내 낸다', hint: '체술 · 물을 치는 주먹', branch: 'martial.fist' },
      { label: '버려진 작살을 주워 휘두른다', hint: '검술 · 작살도 칼이다', branch: 'martial.sword' },
    ] },
  { name: '류구 왕국', home: 'fishman', sea: 'sabaody', text: '거품 속 왕궁이 빛나는 바닷속 나라',
    households: [{ text: '근위병의 집' }, { text: '산호 세공 공방' }, { text: '인어 카페' }],
    teachers: [
      { label: '근위병에게 창 쓰는 법을 배운다', hint: '검술 · 왕궁의 창', branch: 'martial.sword' },
      { label: '어인 가라테 도장에 들어간다', hint: '체술 · 바다의 무술', branch: 'martial.fist' },
    ] },
  { name: '바다의 숲', home: 'fishman', sea: 'sabaody', text: '가라앉은 배들이 잠든 어인섬 끝자락',
    households: [{ text: '숲지기 오두막' }, { text: '난파선 고물상' }],
    teachers: [
      { label: '난파선의 녹슨 총을 닦아 쏜다', hint: '사격 · 물속에서는 안 나간다', branch: 'martial.gun' },
      { label: '숲지기에게 맨손으로 싸우는 법을 배운다', hint: '체술 · 조용한 싸움', branch: 'martial.fist' },
    ] },
  // ---------------- 하늘섬
  { name: '엔젤섬', home: 'sky', sea: 'gl_first', text: '흰 구름 바다에 뜬 하늘 사람들의 섬',
    households: [{ text: '다이얼 공방' }, { text: '구름 과일 농가' }, { text: '화이트베레 대원의 집' }],
    teachers: [
      { label: '화이트베레에게 봉술을 배운다', hint: '검술 · 하늘의 질서', branch: 'martial.sword' },
      { label: '충격 다이얼을 손에 쥐고 다룬다', hint: '체술 · 쳐 낸 힘을 되돌린다', branch: 'martial.fist' },
    ] },
  { name: '샨디아 마을', home: 'sky', sea: 'gl_first', text: '고향 땅을 되찾으려는 전사들의 숲',
    households: [{ text: '전사의 집' }, { text: '숲 속 오두막' }],
    teachers: [
      { label: '샨디아 전사에게 바주카를 배운다', hint: '사격 · 400년의 분노', branch: 'martial.gun' },
      { label: '숲에서 맨손으로 짐승과 싸운다', hint: '체술 · 거친 숲', branch: 'martial.fist' },
    ] },
  // ---------------- 조우
  { name: '쿠라우 도시', home: 'zou', sea: 'nw_first', text: '거대한 코끼리 등 위 밍크족의 도시',
    households: [{ text: '전사의 집' }, { text: '약초 가게' }, { text: '공작의 성 근처 집' }],
    teachers: [
      { label: '낮의 전사들에게 창을 배운다', hint: '검술 · 낮 왕의 창', branch: 'martial.sword' },
      { label: '전기를 두른 주먹을 배운다', hint: '체술 · 밍크족의 일렉트로', branch: 'martial.fist' },
    ] },
  { name: '고래숲', home: 'zou', sea: 'nw_first', text: '밤의 왕이 다스리는 깊은 숲',
    households: [{ text: '숲 속 오두막' }, { text: '나무 위 집' }],
    teachers: [
      { label: '밤의 전사들에게 칼을 배운다', hint: '검술 · 밤 왕의 칼', branch: 'martial.sword' },
      { label: '나뭇가지 사이를 뛰며 몸을 단련한다', hint: '체술 · 날렵해진다', branch: 'martial.fist' },
    ] },
];

export interface SurnameDef {
  name: string; d: boolean; gender: 'any' | 'm' | 'f'; species: Species;
  kind: 'common' | 'local' | 'rare';      // common 평범한 집안 · local 이스트 블루의 이름난 집안 · rare 고아로 태어난다
  homes?: string[];                        // 이 집안이 사는 고향 (local)
  home?: HomeKey;                          // 이 고향에서만 흔한 성 (common). 이런 성이 있는 고향은 그 성만 쓴다
  bonus: Partial<Stats>;
  traits: string[];
  lore: string;
  token?: string;                          // 고아일 때 품에 있던 물건
}

const common = (name: string, bonus: Partial<Stats>, lore: string, traits: string[] = []): SurnameDef =>
  ({ name, d: false, gender: 'any', species: 'human', kind: 'common', bonus, traits, lore });
const rare = (x: Omit<SurnameDef, 'kind'>): SurnameDef => ({ ...x, kind: 'rare' });
const homeCommon = (home: HomeKey, species: Species, name: string, bonus: Partial<Stats>, lore: string): SurnameDef =>
  ({ name, d: false, gender: 'any', species, kind: 'common', home, bonus, traits: [], lore });

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
  // ---------------- 고향마다 흔한 성 (워터 세븐은 이스트 블루와 같은 성을 쓴다)
  homeCommon('wano', 'human', '하타노', { str: 2, wil: 1 }, '대대로 칼을 벼려 온 대장장이 집안.'),
  homeCommon('wano', 'human', '야마부키', { int: 2, luk: 1 }, '꽃의 도시에서 포목을 파는 집안.'),
  homeCommon('wano', 'human', '쿠로가네', { str: 1, vit: 2 }, '광산에서 일해 온 집안.'),
  homeCommon('wano', 'human', '아사기리', { spd: 2, wil: 1 }, '산길에서 짐을 지고 다니는 집안.'),
  homeCommon('wano', 'human', '미나세', { wil: 2, int: 1 }, '논을 일구는 농사꾼 집안.'),
  homeCommon('fishman', 'fishman', '코랄', { str: 2, vit: 1 }, '산호를 캐는 어인 집안.'),
  homeCommon('fishman', 'fishman', '쿠로시오', { spd: 2, str: 1 }, '해류를 타고 짐을 나르는 집안.'),
  homeCommon('fishman', 'merfolk', '시렌', { spd: 2, luk: 1 }, '노래로 이름난 인어 집안.'),
  homeCommon('fishman', 'fishman', '노틸', { int: 2, vit: 1 }, '난파선을 뒤져 먹고사는 집안.'),
  homeCommon('sky', 'skypiean', '누베', { int: 2, luk: 1 }, '다이얼을 다듬어 온 장인 집안.'),
  homeCommon('sky', 'skypiean', '아이레', { spd: 2, wil: 1 }, '구름 위를 달리는 웨이버 집안.'),
  homeCommon('sky', 'skypiean', '하이엘', { wil: 2, vit: 1 }, '신의 섬을 지켜 온 신관의 먼 핏줄.'),
  homeCommon('zou', 'mink', '로포', { str: 2, spd: 1 }, '낮의 전사를 여럿 낸 집안.'),
  homeCommon('zou', 'mink', '펠리', { spd: 2, luk: 1 }, '밤 숲에서 사냥하는 집안.'),
  homeCommon('zou', 'mink', '브루', { vit: 2, int: 1 }, '약초를 길러 온 집안.'),
];

/** 성씨가 뽑힐 가중치. 평범한 집안이 가장 흔하다 */
export const SURNAME_WEIGHT: Record<SurnameDef['kind'], number> = { common: 3, local: 1.5, rare: 0.6 };

export const COMMON_SURNAMES = SURNAMES.filter((x) => x.kind === 'common' && !x.home).map((x) => x.name);
export const FIRST_NAMES = {
  m: ['루카', '에단', '카이', '리온', '테오', '하루', '진', '로이', '마테오', '빌리', '쇼', '라스', '토마', '닐', '오웬', '유리'],
  f: ['미라', '엘리', '나루', '세라', '리사', '카야', '루나', '노아', '히나', '소피', '레아', '이브'],
};
/** 고향마다 다른 이름 (없으면 FIRST_NAMES) */
export const HOME_FIRST_NAMES: Partial<Record<HomeKey, { m: string[]; f: string[] }>> = {
  wano: { m: ['겐조', '하야테', '신노스케', '타케루', '소지', '이오리', '고헤이'], f: ['오린', '오유키', '사요', '치요', '하루에', '미츠', '오센'] },
};
export const PARENT_NAMES = { m: ['가렛', '도널', '레온', '헨릭', '오웬', '바실', '로드'], f: ['마르타', '에바', '리타', '셀마', '노라', '한나', '이다'] };

export const SPECIES_NAMES: Record<Species, string> = {
  human: '인간', fishman: '어인족', merfolk: '인어족', mink: '밍크족', giant: '거인족', longarm: '수장족', longleg: '족장족',
  threeeye: '삼목족', tontatta: '소인족', skypiean: '하늘섬 주민', buccaneer: '버커니어족', lunarian: '루나리아족',
};

/** 평범한 집안에서 가끔 사람이 아닌 아이가 거둬진다. 이스트 블루에 없는 종족이라 고아가 된다 */
export const SPECIES_REROLL = {
  p: 0.12,
  // 버커니어족 · 루나리아족은 거의 남지 않은 종족이라 아주 드물다
  weights: [['fishman', 4], ['mink', 4], ['merfolk', 2], ['skypiean', 2], ['longarm', 2], ['longleg', 2], ['giant', 1], ['threeeye', 1], ['tontatta', 1], ['buccaneer', 0.6], ['lunarian', 0.3]] as [Species, number][],
};

export const SPECIES_BONUS: Partial<Record<Species, Partial<Stats>>> = {
  fishman: { str: 2, vit: 1 }, merfolk: { spd: 2, luk: 1 }, mink: { spd: 2 }, giant: { str: 3, vit: 3, spd: -2 },
  longarm: { spd: 1, luk: 1 }, longleg: { spd: 2 }, threeeye: { int: 1, wil: 2 }, tontatta: { spd: 3, str: 1, vit: -2 }, skypiean: { luk: 2 },
  buccaneer: { str: 4, vit: 3, spd: -1 }, lunarian: { vit: 3, wil: 2 },
};

export const ORPHAN_STORIES = [
  '{place} 바닷가에 작은 쪽배가 떠내려왔다. 안에는 갓난아이가 울고 있었다.',
  '폭풍이 지나간 아침, {place} 부두에 바구니 하나가 걸려 있었다.',
  '{place}에 들른 상선이 아이 하나를 내려놓고 떠났다.',
];
