// tests/v5/wordNeeds.ts — 글이 전제하는 것(동료, 가족, 헤엄)을 낱말로 찾는 검사. content.test.ts와 content-12.test.ts가 함께 쓴다.
import type { Need } from '../../src/v5/core/types';

/** 낱말의 첫머리: 앞이 한글이 아니다 (받아들인다의 '아들', 쫓아내다의 '아내'를 거른다) */
const W = '(?<=^|[^가-힣])';
/** 글에 이 낱말이 나오면 이 필요가 적혀 있어야 한다 */
export const WORD_NEEDS: [RegExp, Need][] = [
  [new RegExp(`${W}동료(들)?(을|를|이|가|에게|와|과|의)`), 'crew'],
  [new RegExp(`${W}(아내|남편|배우자)`), 'spouse'],
  [new RegExp(`자식|(?<=^|[^가-힣]|큰|작은|막내|외동)(아들|딸(?![기깍꾹랑]))`), 'child'],
  [new RegExp(`동생|형제|${W}누이(?![다고며는던])|오빠|언니|누나`), 'sibling'],
  [/헤엄|(바다|물)(에|로) 뛰어|바다 밑으로|물속으로/, 'swim'],
];
