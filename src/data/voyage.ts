// 항로 고르기 (통합 기획 7.4): 섬을 옮길 때 '안정한 뱃길 / 꿈을 좇는 뱃길 / 위험한 미지' 세 후보 중에서 고른다.
// 해군 · 정부 요원은 고르지 않는다: 배속 · 전근 명령으로 옮긴다 (core/year.ts voyage).
import { HOMETOWNS } from '../shared/data/births';
import { V } from './balance';
import type { Branch, Cond, Door, DreamId, HomeId } from '../core/types';

export type EntryGate = 'sky' | 'fishman' | 'wano' | 'zou';

export const entryPass = (gate: EntryGate) => `entryPass:${gate}`;
export const ZOU_CARD = 'zouVivreCard';
export const COATING_CONTACT = 'coatingContact';

export interface Environment {
  arrival?: { physical: number; recovery: number };
  climate?: { staminaDrain: number; trialGain: number; vitality: number; text: string };
  growthBonus?: Partial<Record<Branch, number>>;
  pressure?: { roamHp: number; combat: number; strength: number };
  localFights?: { multiplier: number; foes: readonly string[] };
  commerce?: { recovery: number; events: number };
}

interface IslandProfile {
  entryGate: EntryGate | null;
  envEffect?: Environment;
  nativeImmunity?: { home?: HomeId; flags?: readonly string[] };
}

const sky: IslandProfile = {
  entryGate: 'sky',
  envEffect: { arrival: { physical: 0.95, recovery: 0.6 }, growthBonus: { fist: 1.25, observation: 1.35, gun: 1.25 } },
  nativeImmunity: { home: 'sky', flags: [entryPass('sky')] },
};
const fishman: IslandProfile = {
  entryGate: 'fishman',
  envEffect: { pressure: { roamHp: 5, combat: 0.85, strength: 1 } },
  nativeImmunity: { home: 'fishman', flags: [entryPass('fishman')] },
};
const wano: IslandProfile = {
  entryGate: 'wano',
  envEffect: {
    growthBonus: { sword: 1.55, armament: 1.65 },
    localFights: { multiplier: 2, foes: ['떠돌이 낭인', '백수 해적단 잔당'] },
  },
  nativeImmunity: { home: 'wano', flags: [entryPass('wano')] },
};
const zou: IslandProfile = {
  entryGate: 'zou', envEffect: { growthBonus: { fist: 1.15 } }, nativeImmunity: { home: 'zou' },
};
const port: IslandProfile = { entryGate: null, envEffect: { commerce: { recovery: 1.25, events: 1.8 } } };

const climate = (text: string): IslandProfile => ({
  entryGate: null, envEffect: { climate: { staminaDrain: 5, trialGain: 2, vitality: 1, text } },
});
const homeProfiles = { sky, fishman, wano, zou, water7: port };

export const ISLAND_PROFILES: Partial<Record<string, IslandProfile>> = {
  ...Object.fromEntries(HOMETOWNS.flatMap(({ name, home }) => home === 'loguetown' ? [] : [[name, homeProfiles[home]]])),
  '스카이피아': sky,
  '어인섬': fishman,
  '와노쿠니': wano,
  '조': zou,
  '조우': zou,
  '모코모 공국': zou,
  '알라바스타 왕국': climate('한낮의 열기와 마른 모래바람 속에서 몸이 사막에 익었다.'),
  '드럼 왕국': climate('살을 에는 추위 속에서 몸이 설산의 날씨에 익었다.'),
  '로그타운': port,
  '워터 세븐': port,
};

export const gateOf = (island: string): EntryGate | null => ISLAND_PROFILES[island]?.entryGate ?? null;

type EntryOption = Pick<Door, 'label' | 'hint' | 'values' | 'danger' | 'when'>;
const money = (min: number): Cond[] => [{ c: 'money', min }];
const D = V.value.door;
export const ENTRY_COST = { highWest: 30000, coating: 20000, smuggler: 35000 };

export const ENTRY_GATES: Record<EntryGate, { title: string; body: string; options: readonly EntryOption[] }> = {
  sky: {
    title: '하늘섬으로 오르는 길',
    body: '자야 앞바다의 녹 업 스트림이 구름을 뚫고 솟는다. 서쪽의 정상 하이 웨스트로 가려면 길을 아는 뱃사공에게 값을 치러야 한다.',
    options: [
      { label: '녹 업 스트림을 탄다', hint: '항해사와 튼튼한 몸이 있으면 물기둥을 타고 오를 수 있다. 배가 부서질 수도 있다', danger: true, values: { freedom: D, romance: D, dominion: D } },
      { label: '하이 웨스트 안내선을 따른다', hint: '삼만 베리를 내고 하늘 바다에 이르는 완만한 길을 오른다', when: money(ENTRY_COST.highWest), values: { inquiry: D, ambition: D, peace: D } },
    ],
  },
  fishman: {
    title: '샤본디에서 심해로',
    body: '수면 아래 일만 미터까지 내려가려면 배에 코팅을 씌워야 한다. 선착장 너머로 심해 해류가 보인다.',
    options: [
      { label: '장인에게 코팅을 맡긴다', hint: '이만 베리를 내고 수압에 견디는 코팅을 입힌다', when: money(ENTRY_COST.coating), values: { peace: D, ambition: D } },
      { label: '인연이 있는 코팅 장인을 찾는다', hint: '장인이나 코팅 기술을 아는 동료에게 도움을 청한다', when: [{ c: 'entryContact', gate: 'fishman' }], values: { loyalty: D, inquiry: D } },
      { label: '값싼 임시 코팅으로 내려간다', hint: '급히 둘러씌운 층이 수압과 해왕류를 버틸지 모른다', danger: true, values: { greed: D, freedom: D } },
    ],
  },
  wano: {
    title: '와노쿠니의 폭포',
    body: '소용돌이가 배를 폭포 쪽으로 잡아끈다. 거대한 잉어가 물줄기를 거슬러 오르고, 해협의 밀수상이 통행증 값을 부른다.',
    options: [
      { label: '잉어에 줄을 걸어 폭포를 오른다', hint: '배가 뒤집히면 해안에 표류하고 선원들이 잠시 흩어진다', danger: true, values: { freedom: D, dominion: D, romance: D } },
      { label: '밀수선 통행증을 구한다', hint: '삼만 오천 베리를 내고 짐칸에 숨어 들어간다', when: money(ENTRY_COST.smuggler), values: { ambition: D, inquiry: D, peace: D } },
    ],
  },
  zou: {
    title: '안개 속의 즈니샤',
    body: '로그 포스는 아무것도 가리키지 않는다. 움직이는 섬을 발견해야 그 거대한 다리 위로 오를 수 있다.',
    options: [
      { label: '비블카드가 움직이는 쪽을 따른다', hint: '밍크족 인연에게 받은 조우행 조각으로 즈니샤를 찾는다', when: [{ c: 'entryContact', gate: 'zou' }], values: { loyalty: D, inquiry: D } },
      { label: '안개 속에서 발자국을 찾는다', hint: '해무에 막혀 돌아올 가능성이 크다', danger: true, values: { romance: D, freedom: D } },
    ],
  },
};

/** 섬의 위험(1 잔잔함 · 2 보통 · 3 험함). 적지 않은 섬은 2 */
export const ISLAND_DANGER: Record<string, 1 | 2 | 3> = {
  '후샤 마을': 1, '시럽 마을': 1, '코노미 제도': 1, '서쪽 등대섬': 1, '남쪽 산호초 항구': 1, '북쪽 상업 도시': 1,
  '해상 레스토랑 발라티에': 1, '일리시아 왕국': 1, '소르베 왕국': 1, '위스키 피크': 1, '워터 세븐': 1, '조': 1, '아마존 릴리': 1,
  '플레반스 옛터': 3, '스파이더 마일즈': 3, '마피아 항구': 3, '리틀 가든': 3, '드럼 왕국': 3, '에니에스 로비': 3,
  '스릴러 바크': 3, '펑크 해저드': 3, '홀케이크 아일랜드': 3, '와노쿠니': 3, '라프텔 근해': 3, '에그헤드': 3,
};

/** 꿈과 이어진 섬 */
export const DREAM_ISLANDS: Record<DreamId, readonly string[]> = {
  pirateKing: ['로그타운', '샤본디 제도', '라프텔 근해', '리버스 마운틴'],
  bestSword: ['로그타운', '스릴러 바크', '드레스로자', '와노쿠니', '리틀 가든'],
  bestFist: ['로그타운', '어인섬', '에니에스 로비', '와노쿠니'],
  bestShot: ['시럽 마을', '드레스로자', '샤본디 제도'],
  bestWeapon: ['로그타운', '워터 세븐', '와노쿠니', '드레스로자'],
  marineTop: ['로그타운', '에니에스 로비', '샤본디 제도', '시럽 마을'],
  changeWorld: ['알라바스타 왕국', '드레스로자', '소르베 왕국', '마피아 항구', '루브니르 왕국'],
  worldEnd: ['리버스 마운틴', '스카이피아', '엘바프', '라프텔 근해', '서쪽 등대섬'],
  truth: ['오하라 옛터', '자야', '스카이피아', '에그헤드', '엘바프', '플레반스 옛터'],
  treasure: ['자야', '스카이피아', '홀케이크 아일랜드', '마피아 항구', '북쪽 상업 도시'],
  peace: ['코노미 제도', '후샤 마을', '조', '어인섬', '바테리라', '워터 세븐'],
};

export const dangerOf = (island: string): 1 | 2 | 3 => ISLAND_DANGER[island] ?? 2;

/** 고른 뱃길의 효과 */
export const ROUTE = {
  calm: { hp: 10 },                              // 잔잔한 뱃길: 쉬어 간다
  dream: { wil: 1 },                             // 꿈을 좇는 뱃길: 마음이 단단해진다
  wild: { hp: -10, fame: 15, hardship: 2 },      // 험한 미지: 다치지만 이름이 난다
};
