// 동료의 이명. 성격(data/crewTraits.ts)과 병과에 어울리는 것에서 뽑아, 이름만 봐도 어떤 사람인지 알게 한다.
// 한 배 안에서는 겹치지 않는다 (core/people.ts).
import type { CrewRole, Species } from '../core/types';

export const TRAIT_EPITHETS: Record<string, string[]> = {
  hot: ['불도저', '성난 황소', '화약고', '붉은 주먹', '폭주 기관차', '돌격대장', '불꽃 머리'],
  careful: ['돌다리', '그림자 걸음', '두 번 보는', '조심성', '철벽 수비', '경계의 눈'],
  loyal: ['충견', '등 맡기는', '맹세의', '끝까지', '의리의 사나이', '방패막이'],
  glutton: ['밑 빠진 위장', '고기 사냥꾼', '먹보 대장', '포식자', '큰 배', '한 솥'],
  braggart: ['허풍선', '나팔수', '백전백승(자칭)', '큰소리', '거짓말쟁이 영웅', '팔만 용사'],
  coward: ['줄행랑', '꽁무니', '덜덜이', '살아남는', '바람처럼', '도망의 달인'],
  cold: ['얼음 눈', '무표정', '칼날 혀', '냉혈', '새벽 서리', '침묵의'],
  optimist: ['해바라기', '웃는 얼굴', '내일은 맑음', '꺾이지 않는', '태양', '콧노래'],
  drinker: ['술통', '취권', '럼주', '말술', '새벽 해장', '주정뱅이 신'],
  romantic: ['장미', '사랑꾼', '달빛 세레나데', '꽃다발', '눈물의 시인', '백마 탄'],
  prankster: ['장난꾸러기', '방울', '도깨비', '뒤통수', '말썽쟁이', '새총 꼬마'],
  stoic: ['묵검', '바위', '말없는', '외길', '고요한 칼', '수도승'],
};

export const ROLE_EPITHETS: Record<CrewRole, string[]> = {
  vanguard: ['선봉', '철갑 주먹', '쇠망치', '무쇠 다리', '돌파'],
  support: ['백발백중', '매의 눈', '저 너머', '한 발', '바람 읽는'],
  medic: ['약상자', '흰 가운', '살리는 손', '붕대 감는', '기적의 손'],
  navigator: ['해도', '바람 읽는 눈', '별자리', '나침반', '구름 박사'],
  cook: ['국자', '불맛', '한 그릇', '바다 요리사', '칼질의 달인'],
  shipwright: ['망치', '대패', '용골', '못 박는', '배 고치는 손'],
};

/** 종족에 어울리는 이명 (그 종족이면 가끔 이것에서 뽑는다) */
export const SPECIES_EPITHETS: Partial<Record<Species, string[]>> = {
  fishman: ['심해', '상어 이빨', '물살 가르는', '바다 주먹'],
  merfolk: ['물결', '진주', '바다 노래'],
  mink: ['번개 발톱', '보름달', '털북숭이'],
  giant: ['산', '거목', '하늘 지붕'],
  longarm: ['긴 팔', '닿는 손'],
  longleg: ['긴 다리', '성큼'],
  threeeye: ['세 번째 눈', '꿰뚫는 눈'],
  tontatta: ['꼬마 거인', '번개 발'],
  skypiean: ['구름 위', '하늘 날개'],
  buccaneer: ['무쇠 어깨', '괴력'],
  lunarian: ['검은 날개', '불꽃 등'],
};

/** 동료로 만날 수 있는 종족의 비중 (인간이 대부분, 드문 종족은 아주 드물다) */
export const CREW_SPECIES_WEIGHTS: [Species, number][] = [
  ['human', 64], ['fishman', 8], ['mink', 7], ['longarm', 4], ['longleg', 4], ['merfolk', 3], ['skypiean', 3],
  ['giant', 2], ['tontatta', 2], ['threeeye', 1.5], ['buccaneer', 0.8], ['lunarian', 0.3],
];
