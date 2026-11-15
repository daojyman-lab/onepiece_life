// 모든 전환점. 파일 하나가 한 묶음이다. 묶음을 더하려면 아래 목록에 한 줄을 보탠다.
import type { Turning } from '../../core/types';
import { CHILDHOOD } from './childhood';
import { FORTUNES } from './fortunes';
import { MISFORTUNES } from './misfortunes';
import { MOMENTS } from './moments';
import { PATHS } from './paths';
import { PEOPLE } from './people';
import { TOWNS } from './towns';
import { PIRATE } from './pirate';
import { HUNTER } from './hunter';
import { MARINE } from './marine';
import { REVOLUTION } from './revolution';
import { LAND } from './land';
import { LIFE } from './life';
import { CANON_EAST } from './canon';
import { CANON_SEA } from './canon-2';
import { SEA_LEAVE, SEA_RETURN } from './sea';
import { SEA_GRAND_LINE, SEA_NEW_WORLD } from './sea-2';

const GROUPS: Turning[][] = [
  CHILDHOOD,
  FORTUNES,
  MISFORTUNES,
  MOMENTS,
  PATHS,
  PEOPLE,
  TOWNS,
  PIRATE,
  HUNTER,
  MARINE,
  REVOLUTION,
  LAND,
  LIFE,
  CANON_EAST,
  CANON_SEA,
  SEA_LEAVE,
  SEA_RETURN,
  SEA_GRAND_LINE,
  SEA_NEW_WORLD,
];

export const TURNINGS: Turning[] = GROUPS.flat();
export const TURNING_BY_ID: Record<string, Turning> = Object.fromEntries(TURNINGS.map((t) => [t.id, t]));
