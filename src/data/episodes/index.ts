// 섬 장편 에피소드 모음 (v6.6). 섬마다 한 파일: 전환점(EP_*)과 새로 나오는 이름 있는 상대(FOES_*)
import { makeFoes } from './kit';
import type { Cond, SeaId, Turning } from '../../core/types';
import { EP_LOGUETOWN, FOES_LOGUETOWN } from './loguetown';
import { EP_ALABASTA, FOES_ALABASTA } from './alabasta';
import { EP_SKYPIEA, FOES_SKYPIEA } from './skypiea';
import { EP_FISHMAN, FOES_FISHMAN } from './fishman';
import { EP_DRESSROSA, FOES_DRESSROSA } from './dressrosa';
import { EP_WANO, FOES_WANO } from './wano';

/**
 * 에피소드의 모든 장면에 그 섬 · 바다 조건을 단다 (이어지는 장면도). 섬에 있는 동안만 이어지고,
 * 이름 있는 상대는 제 바다에서만 나오며(paths.test), 바다에 닿지 않는 고향의 규칙(homes.test)과도 맞는다.
 * 원작 인물이 말하는 장면에 나이 조건이 없으면 열 살 이상을 단다.
 */
function anchor(list: Turning[], sea: SeaId, islands: string[]): Turning[] {
  return list.map((t) => {
    const when: Cond[] = [...t.when];
    if (!when.some((c) => c.c === 'island' && !c.not)) when.push({ c: 'island', is: islands });
    if (!when.some((c) => c.c === 'sea')) when.push({ c: 'sea', is: [sea] });
    if (typeof t.speaker === 'object' && 'canon' in t.speaker && !when.some((c) => c.c === 'age')) when.push({ c: 'age', min: 10 });
    return { ...t, when };
  });
}

export const EPISODE_TURNINGS = [
  ...anchor(EP_LOGUETOWN, 'east', ['로그타운']),
  ...anchor(EP_ALABASTA, 'gl_first', ['알라바스타 왕국']),
  ...anchor(EP_SKYPIEA, 'gl_first', ['스카이피아', '엔젤섬', '샨디아 마을']),
  ...anchor(EP_FISHMAN, 'sabaody', ['어인섬', '어인가', '류구 왕국', '바다의 숲']),
  ...anchor(EP_DRESSROSA, 'nw_first', ['드레스로자']),
  ...anchor(EP_WANO, 'nw_late', ['와노쿠니', '하나노미야코', '쿠리', '에비스 마을']),
];
export const EPISODE_FOE_DEFS = [...FOES_LOGUETOWN, ...FOES_ALABASTA, ...FOES_SKYPIEA, ...FOES_FISHMAN, ...FOES_DRESSROSA, ...FOES_WANO];
export const EPISODE_FOES = makeFoes(EPISODE_FOE_DEFS);
