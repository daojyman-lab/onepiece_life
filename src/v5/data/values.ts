// 가치관 아홉 가지 (설계 3장). 점수는 화면에 내지 않고 말로만 드러낸다.
import type { Tactic } from '../../core/types';
import type { ValueId } from '../core/types';

export const VALUE_IDS: ValueId[] = ['justice', 'devotion', 'ambition', 'romance', 'inquiry', 'loyalty', 'freedom', 'dominion', 'peace'];

export const VALUE_NAME: Record<ValueId, string> = {
  justice: '정의', devotion: '헌신', ambition: '야망', romance: '낭만', inquiry: '탐구',
  loyalty: '의리', freedom: '자유', dominion: '패도', peace: '평온',
};

/** 문을 고른 뒤 뜨는 문장: 아직 깊지 않거나 이미 깊을 때 (가벼운 줄) */
export const VALUE_LEAN: Record<ValueId, string> = {
  justice: '정의 쪽으로 마음이 기울었다.',
  devotion: '헌신 쪽으로 마음이 기울었다.',
  ambition: '야망 쪽으로 마음이 기울었다.',
  romance: '낭만 쪽으로 마음이 기울었다.',
  inquiry: '탐구 쪽으로 마음이 기울었다.',
  loyalty: '의리 쪽으로 마음이 기울었다.',
  freedom: '자유 쪽으로 마음이 기울었다.',
  dominion: '패도 쪽으로 마음이 기울었다.',
  peace: '평온 쪽으로 마음이 기울었다.',
};

/** 문을 고른 뒤 뜨는 문장: 이번 선택으로 깊어지는 선(V.value.deep)을 넘었을 때 (무거운 줄) */
export const VALUE_DEEPEN: Record<ValueId, string> = {
  justice: '정의가 깊어졌다.',
  devotion: '헌신이 깊어졌다.',
  ambition: '야망이 깊어졌다.',
  romance: '낭만이 깊어졌다.',
  inquiry: '탐구가 깊어졌다.',
  loyalty: '의리가 깊어졌다.',
  freedom: '자유가 깊어졌다.',
  dominion: '패도가 깊어졌다.',
  peace: '평온이 깊어졌다.',
};

/** 엔딩의 "어떤 사람이었나" 앞 구절. 한두 개를 이어 "~ 살았고"로 맺는다. 가치관 이름이 들어간다 */
export const VALUE_PERSONA: Record<ValueId, string> = {
  justice: '정의를 좇아',
  devotion: '헌신으로 남을 돌보며',
  ambition: '야망을 품고',
  romance: '낭만을 따라',
  inquiry: '탐구에 몸을 바쳐',
  loyalty: '의리를 지키며',
  freedom: '자유를 찾아',
  dominion: '패도를 걸으며',
  peace: '평온을 바라며',
};

/** 가치관이 싸움에서 기우는 전술 */
export const VALUE_TACTIC: Record<ValueId, Tactic> = {
  dominion: 'offense', ambition: 'offense',
  peace: 'defense', devotion: 'defense',
  loyalty: 'counter', justice: 'counter',
  romance: 'endurance', inquiry: 'endurance', freedom: 'endurance',
};
