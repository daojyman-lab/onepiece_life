// 가치관 아홉 가지 (설계 3장). 점수는 화면에 내지 않고 말로만 드러낸다.
import type { Tactic } from '../../core/types';
import type { ValueId } from '../core/types';

export const VALUE_IDS: ValueId[] = ['justice', 'devotion', 'ambition', 'romance', 'inquiry', 'loyalty', 'freedom', 'dominion', 'peace'];

export const VALUE_NAME: Record<ValueId, string> = {
  justice: '정의', devotion: '헌신', ambition: '야망', romance: '낭만', inquiry: '탐구',
  loyalty: '의리', freedom: '자유', dominion: '패도', peace: '평온',
};

/** 문을 고른 뒤 뜨는 문장 */
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

/** 가치관이 싸움에서 기우는 전술 */
export const VALUE_TACTIC: Record<ValueId, Tactic> = {
  dominion: 'offense', ambition: 'offense',
  peace: 'defense', devotion: 'defense',
  loyalty: 'counter', justice: 'counter',
  romance: 'endurance', inquiry: 'endurance', freedom: 'endurance',
};
