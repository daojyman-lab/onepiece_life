// 엔딩 자료의 문장들 (설계 5.8). 가치관 점수(숫자)는 어디에도 쓰지 않는다.
// 자리표시: {name} 신문에서는 성까지 쓴 이름, 원작 인물의 한마디에서는 이름만. {town} 고향 마을, {age} 말로 쓴 나이(「예순여덟 살」),
// {bounty} 현상금(공적), {title} {door} 전환점과 문, {surname} 숨은 성.
import type { Standing } from '../core/types';

export const PERSONA_NONE = '무엇을 좇았는지 끝내 알 수 없는 사람이었다.';
/** 정신적 강점이 하나도 없을 때의 뒤 구절 */
export const PERSONA_PLAIN = '그렇게 한 생을 건넜다';

/** 이름이 알려지지 않은 인생: 고향의 소문 한 줄 */
export const RUMOR = '{town}의 누군가는 가끔 그 이름을 떠올린다.';
/** 이름이 알려진 인생: 신문 1면. 처지에 맞는 것이 없으면 default */
export const HEADLINE: Partial<Record<Standing, string>> & { default: string } = {
  pirate: '「현상금 {bounty}베리의 해적 {name}, {age}로 바다에 잠들다」',
  warlord: '「칠무해 {name}, {age}로 잠들다. 현상금 {bounty}베리의 옛 이름」',
  marine: '「공적 {bounty}베리의 해군 {name}, {age}로 잠들다」',
  cp: '「존재하지 않는 기관의 {name}, {age}로 잠들다」',
  revolution: '「혁명군 {name}, {age}로 잠들다. 정부가 건 현상금 {bounty}베리」',
  bountyHunter: '「현상금 사냥꾼 {name}, {age}로 잠들다」',
  default: '「{town} 출신 {name}, {age}로 잠들다. 바다가 그 이름을 기억한다」',
};

export const UNCHOSEN_LINE = "{age}, {title}: '{door}'을(를) 고르지 않았다.";
export const SECRET_LINE = '당신의 진짜 성은 {surname}(이)었다.';

/** 원작 인물이 주인공을 어떻게 기억하는지. 유대가 낮으면 low, 높으면 high. {name}은 주인공의 이름 */
export interface CanonWords { low: string; high: string }
export const CANON_WORDS: Record<string, CanonWords> = {
  smoker: {
    low: '{name}? 이름은 기억난다. 그 이상은 모르겠군.',
    high: '연기 너머로 봐도 곧은 녀석이었다. {name}은(는) 제 길을 끝까지 걸었지.',
  },
  dragon: {
    low: '폭풍 속에서 한 번 마주친 얼굴이다. 그 뒤로는 소식을 듣지 못했다.',
    high: '{name}은(는) 세상이 바뀌는 바람 속에 있었다. 그걸로 충분하다.',
  },
  iceburg: {
    low: '우리 회사에 있던 사람이었나. 장부를 뒤져 봐야겠군.',
    high: '{name}이(가) 손본 배는 아직도 물 위에 떠 있다. 좋은 목수였다.',
  },
  luffy: {
    low: '{name}? 누구였더라… 아, 고기 나눠 준 녀석인가!',
    high: '{name}? 좋은 녀석이었어! 같이 모험한 거, 엄청 재밌었다고!',
  },
};
/** 표에 없는 원작 인물 */
export const CANON_WORDS_DEFAULT: CanonWords = {
  low: '{name}? 그런 사람도 있었지.',
  high: '{name}과(와) 함께한 날들을 잊지 않겠다.',
};
