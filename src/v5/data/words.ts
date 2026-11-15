// 화면에 나가는 이름과 말. 코어의 id를 사람이 읽는 말로 바꾼다.
import { BRANCH_NAMES } from '../../data/skills';
import { BRANCH_ID } from '../core/power';
import type { Injury } from '../../core/types';
import type { Branch, Lineage, LimbState, Standing, Wealth } from '../core/types';

export const WEALTH_NAME: Record<Wealth, string> = {
  poor: '가난한 집', common: '평범한 집', comfortable: '넉넉한 집', noble: '이름난 집안',
};

export const LINEAGE_NAME: Record<Lineage, string> = {
  orphan: '고아', commoner: '평민', marineFamily: '해군 가문', pirateChild: '해적의 자식', samurai: '무사 가문', outcast: '차별받는 핏줄',
};

export const BRANCH_NAME: Record<Branch, string> = Object.fromEntries(
  (Object.keys(BRANCH_ID) as Branch[]).map((b) => [b, BRANCH_NAMES[BRANCH_ID[b]]]),
) as Record<Branch, string>;

export const LIMB_STATE_WORD: Record<Exclude<LimbState, 'ok'>, string> = {
  lost: '잃었다', basic: '의수 · 의족을 달았다', superior: '원래보다 강한 것을 달았다',
};

/** 0~6단계를 부르는 말 (0은 빈 글자) */
export const TIER_WORD: string[] = ['', '입문', '수련', '숙련', '달인', '경지', '극의'];

/** 처지의 이름 (프로필과 시작 화면의 「진행 중」 줄) */
export const STANDING_NAME: Record<Standing, string> = {
  child: '아이', civil: '뭍사람', pirate: '해적', marine: '해군', revolution: '혁명군', bountyHunter: '현상금 사냥꾼',
  warlord: '칠무해', shipwright: '조선공', cp: '정부의 첩보원', settled: '뭍에 자리 잡은 사람', prisoner: '죄수', retired: '은퇴한 사람',
};

/** 다친 곳의 이름 */
export const INJURY_NAME: Record<Injury['severity'], string> = { light: '가벼운 부상', heavy: '무거운 부상', scar: '후유증' };

/** 병의 이름 (모르는 id는 '병') */
export const ILLNESS_NAME: Record<string, string> = { cough: '기침병', fever: '열병' };
