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
];

export const TURNINGS: Turning[] = GROUPS.flat();
export const TURNING_BY_ID: Record<string, Turning> = Object.fromEntries(TURNINGS.map((t) => [t.id, t]));
