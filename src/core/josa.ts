// 조사 고르기. 글 안의 「이(가) · 을(를) · 은(는) · 과(와) · (으)로 · (이)었 · (이)라 · (이)여」를
// 앞 글자의 받침에 맞춰 하나로 바꾼다. 이름처럼 미리 알 수 없는 낱말 뒤에 쓴다.

const TOKENS = /이\(가\)|가\(이\)|을\(를\)|를\(을\)|은\(는\)|는\(은\)|과\(와\)|와\(과\)|\(으\)로|\(이\)었|\(이\)라|\(이\)여|\(이\)다/g;
// 숫자를 읽을 때의 받침: 0 영 1 일 2 이 3 삼 4 사 5 오 6 육 7 칠 8 팔 9 구
const DIGIT_JONG = [21, 8, 0, 16, 0, 0, 1, 8, 8, 0];

/** 앞말의 받침: 0 없음, 8 ㄹ, 그 밖은 받침 있음. 알 수 없으면 null */
function jongBefore(text: string, at: number): number | null {
  let i = at - 1;
  while (i >= 0) {
    const ch = text[i];
    if (ch === '」' || ch === '』' || ch === '"' || ch === '\'' || ch === ']') { i--; continue; }
    if (ch === ')') {
      // 괄호 속 덧말은 건너뛰고 그 앞 낱말에 맞춘다: 시엘(인어족)이 → 시엘이
      let depth = 0;
      for (; i >= 0; i--) { if (text[i] === ')') depth++; else if (text[i] === '(' && --depth === 0) break; }
      i--;
      while (i >= 0 && text[i] === ' ') i--;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
    if (ch >= '0' && ch <= '9') return DIGIT_JONG[+ch];
    if (/[a-zA-Z]/.test(ch)) return /[lmnr]/i.test(ch) ? 4 : 0;
    return null;
  }
  return null;
}

export function josa(text: string): string {
  if (typeof text !== 'string' || !text.includes('(')) return text ?? '';
  return text.replace(TOKENS, (tok, at: number) => {
    const j = jongBefore(text, at);
    if (j === null) return tok;
    const has = j !== 0;
    switch (tok) {
      case '이(가)': case '가(이)': return has ? '이' : '가';
      case '을(를)': case '를(을)': return has ? '을' : '를';
      case '은(는)': case '는(은)': return has ? '은' : '는';
      case '과(와)': case '와(과)': return has ? '과' : '와';
      case '(으)로': return has && j !== 8 ? '으로' : '로';
      case '(이)었': return has ? '이었' : '였';
      case '(이)라': return has ? '이라' : '라';
      case '(이)여': return has ? '이여' : '여';
      case '(이)다': return has ? '이다' : '다';
      default: return tok;
    }
  });
}
