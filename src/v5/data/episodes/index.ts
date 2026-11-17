// 섬 장편 에피소드 모음 (v6.6). 섬마다 한 파일: 전환점(EP_*)과 새로 나오는 이름 있는 상대(FOES_*)
import { makeFoes } from './kit';
import { EP_LOGUETOWN, FOES_LOGUETOWN } from './loguetown';
import { EP_ALABASTA, FOES_ALABASTA } from './alabasta';
import { EP_SKYPIEA, FOES_SKYPIEA } from './skypiea';
import { EP_FISHMAN, FOES_FISHMAN } from './fishman';
import { EP_DRESSROSA, FOES_DRESSROSA } from './dressrosa';
import { EP_WANO, FOES_WANO } from './wano';

export const EPISODE_TURNINGS = [...EP_LOGUETOWN, ...EP_ALABASTA, ...EP_SKYPIEA, ...EP_FISHMAN, ...EP_DRESSROSA, ...EP_WANO];
export const EPISODE_FOE_DEFS = [...FOES_LOGUETOWN, ...FOES_ALABASTA, ...FOES_SKYPIEA, ...FOES_FISHMAN, ...FOES_DRESSROSA, ...FOES_WANO];
export const EPISODE_FOES = makeFoes(EPISODE_FOE_DEFS);
