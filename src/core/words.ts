// 나이를 말로: 화면(ui/view/words.ts가 다시 내보낸다)과 엔딩 자료가 함께 쓴다.

const ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
/** "살" 없이 셀 때의 끝자리: 하나, 둘, 셋, 넷 */
const ONES_BARE = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];

/** 0 → '갓난아기', 3 → '세 살', 20 → '스무 살', 21 → '스물한 살'. 100 이상은 숫자로 '100살' */
export function ageWord(n: number): string {
  if (n === 0) return '갓난아기';
  if (n < 1 || n >= 100) return `${n}살`;
  const t = Math.floor(n / 10), o = n % 10;
  const word = n === 20 ? '스무' : TENS[t] + ONES[o];
  return `${word} 살`;
}

/** "살" 없이 나이만: 3 → '셋', 20 → '스물', 42 → '마흔둘', 68 → '예순여덟'. 1 아래나 100 이상은 숫자로 */
export function ageShort(n: number): string {
  if (n < 1 || n >= 100) return String(n);
  return TENS[Math.floor(n / 10)] + ONES_BARE[n % 10];
}
