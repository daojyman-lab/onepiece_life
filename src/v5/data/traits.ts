import type { Mods } from '../../data/passives';
import type { Activity, Branch, Stats } from '../core/types';

export type TraitTrigger = 'meal' | 'value' | 'activity' | 'win' | 'trade' | 'recover' | 'crew' | 'loss' | 'master' | 'voyage';
export interface TraitEffects {
  mods?: Mods;
  mastery?: Partial<Record<Branch | 'all' | 'haki', number>>;
  stats?: Partial<Stats>;
  discount?: number; income?: number; healing?: number; injury?: number; illness?: number;
  oldAge?: number; coordination?: number; danger?: number;
  activity?: Partial<Record<Activity, number>>;
  chance?: number; bond?: number;
  condition?: 'sea' | 'home' | 'crew' | 'injured' | 'lowHp' | 'sword' | 'gun' | 'fist' | 'night' | 'underground' | 'day' | 'height' | 'prosthetic';
}
export interface TraitDef {
  id: string; name: string; desc: string; good: boolean; weight: number; born: boolean;
  effects: TraitEffects;
  earn?: { kind: TraitTrigger; key?: string; count: number };
  family?: string; rank?: number; excludes?: string[];
}

// 배율은 1 기준, 확률·할인은 소수 비율. 후천 특성은 서로 다른 행동의 누적으로 해금한다.
export const NEW_TRAITS: TraitDef[] = [
  { id: 'deckAcrobat', name: '갑판 곡예', desc: '바다 위 회피 +5%p', good: true, weight: 6, born: true, effects: { mods: { dodge: .05 }, condition: 'sea' } },
  { id: 'precisionShot', name: '정밀 사격', desc: '총 사용 시 치명타 +5%p', good: true, weight: 6, born: true, effects: { mods: { crit: .05 }, condition: 'gun' } },
  { id: 'nocturnal', name: '야행성', desc: '밤에 속도 +4', good: true, weight: 5, born: true, effects: { stats: { spd: 4 }, condition: 'night' }, excludes: ['nightBlind'] },
  { id: 'bigEater', name: '대식', desc: '최대 체력 +8%', good: true, weight: 7, born: true, effects: { mods: { hp: 1.08 } }, family: 'appetite', rank: 1 },
  { id: 'confinedAdaptation', name: '폐소 적응', desc: '지하에서 받는 피해 8% 감소', good: true, weight: 5, born: true, effects: { mods: { take: .92 }, condition: 'underground' }, excludes: ['claustrophobia'] },
  { id: 'prostheticAffinity', name: '의체 친화', desc: '의수·의족 착용 시 근력 +2, 체력 +2', good: true, weight: 5, born: true, effects: { stats: { str: 2, vit: 2 }, condition: 'prosthetic' } },
  { id: 'memory', name: '기억력', desc: '공부 활동 가중치 1.2배, 지능 +2', good: true, weight: 6, born: true, effects: { activity: { study: 1.2 }, stats: { int: 2 } } },
  { id: 'bloodScent', name: '피냄새', desc: '체력이 비어 갈수록 피해 증가, 최대 +15%', good: true, weight: 4, born: true, effects: { mods: { lowHpPower: .15 } } },
  { id: 'nightBlind', name: '야맹증', desc: '밤에 회피 −5%p', good: false, weight: 4, born: true, effects: { mods: { dodge: -.05 }, condition: 'night' }, excludes: ['nocturnal'] },
  { id: 'photosensitivity', name: '광과민', desc: '밝은 야외에서 회피 −3%p', good: false, weight: 4, born: true, effects: { mods: { dodge: -.03 }, condition: 'day' } },
  { id: 'orientation', name: '방향감각', desc: '항해 지침 판독 수준 +1, 항해 중 부상 위험 0.9배', good: true, weight: 6, born: true, effects: { danger: .9, condition: 'sea' }, excludes: ['lostWay'] },
  { id: 'lostWay', name: '길치', desc: '항해 지침 판독 수준 −1, 항해 중 부상 위험 1.15배', good: false, weight: 5, born: true, effects: { danger: 1.15, condition: 'sea' }, excludes: ['orientation'] },
  { id: 'balance', name: '균형감각', desc: '회피 +3%p', good: true, weight: 7, born: true, effects: { mods: { dodge: .03 } } },
  { id: 'acrophobia', name: '고소공포', desc: '하늘섬·높은 곳에서 속도 −2', good: false, weight: 4, born: true, effects: { stats: { spd: -2 }, condition: 'height' } },
  { id: 'breathControl', name: '호흡 조절', desc: '최대 기력 +12%', good: true, weight: 6, born: true, effects: { mods: { sp: 1.12 } } },
  { id: 'powderSense', name: '화약 감각', desc: '사격 숙련 1.15배', good: true, weight: 6, born: true, effects: { mastery: { gun: 1.15 } } },
  { id: 'dexterity', name: '손재주', desc: '일 활동 가중치 1.2배, 일 수입 1.05배', good: true, weight: 7, born: true, effects: { activity: { work: 1.2 }, income: 1.05 } },
  { id: 'tremor', name: '수전증', desc: '사격 숙련 0.85배, 체술 숙련 1.05배', good: false, weight: 4, born: true, effects: { mastery: { gun: .85, fist: 1.05 } } },
  { id: 'thrift', name: '절약', desc: '거래 비용 3% 할인', good: true, weight: 7, born: true, effects: { discount: .03 } },
  { id: 'vanity', name: '허영', desc: '거래 비용 5% 증가, 긍정적 유대 증가 1.05배', good: false, weight: 5, born: true, effects: { discount: -.05, bond: 1.05 } },
  { id: 'affinity', name: '친화력', desc: '긍정적 유대 증가 1.15배', good: true, weight: 7, born: true, effects: { bond: 1.15 } },
  { id: 'sharpTongue', name: '독설', desc: '긍정적 유대 증가 0.85배, 치명타 +2%p', good: false, weight: 5, born: true, effects: { bond: .85, mods: { crit: .02 } } },
  { id: 'suspicion', name: '의심병', desc: '긍정적 유대 증가 0.9배, 사망·부상 위험 0.95배', good: false, weight: 5, born: true, effects: { bond: .9, danger: .95 } },
  { id: 'optimism', name: '낙천', desc: '긍정적 HP 회복 1.1배', good: true, weight: 7, born: true, effects: { healing: 1.1 } },
  { id: 'pessimism', name: '비관', desc: '긍정적 HP 회복 0.9배, 방어율 +2%p', good: false, weight: 5, born: true, effects: { healing: .9, mods: { guard: .02 } } },
  { id: 'stubbornness', name: '고집', desc: '의지 +3, 모든 숙련 0.95배', good: false, weight: 5, born: true, effects: { stats: { wil: 3 }, mastery: { all: .95 } } },
  { id: 'cleanliness', name: '결벽', desc: '질병 확률 0.8배, 거래 비용 2% 증가', good: true, weight: 5, born: true, effects: { illness: .8, discount: -.02 } },
  { id: 'claustrophobia', name: '밀실공포', desc: '지하에서 주는 피해 8% 감소', good: false, weight: 4, born: true, effects: { mods: { dmg: .92 }, condition: 'underground' }, excludes: ['confinedAdaptation'] },
  { id: 'seaLegs', name: '뱃사람', desc: '바다 위 최대 기력 +10%', good: true, weight: 6, born: true, effects: { mods: { sp: 1.1 }, condition: 'sea' } },
  { id: 'ironFist', name: '쇠주먹', desc: '체술 사용 시 물리 피해 +8%', good: true, weight: 5, born: true, effects: { mods: { phys: 1.08 }, condition: 'fist' } },
  { id: 'bladeSense', name: '검감', desc: '검 사용 시 회피 +4%p', good: true, weight: 5, born: true, effects: { mods: { dodge: .04 }, condition: 'sword' } },
  { id: 'longReach', name: '긴팔', desc: '물리 피해 +4%', good: true, weight: 6, born: true, effects: { mods: { phys: 1.04 } } },
  { id: 'denseMuscle', name: '근육질', desc: '힘 +2, 속도 −1', good: true, weight: 6, born: true, effects: { stats: { str: 2, spd: -1 } } },
  { id: 'lightStep', name: '날렵함', desc: '속도 +2, 최대 체력 3% 감소', good: true, weight: 5, born: true, effects: { stats: { spd: 2 }, mods: { hp: .97 } } },
  { id: 'calmPulse', name: '평정', desc: '받아치기 피해 +10%', good: true, weight: 6, born: true, effects: { mods: { counter: .1 } } },
  { id: 'hotBlood', name: '혈기', desc: '첫 2합 피해 +10%, 받는 피해 +3%', good: true, weight: 6, born: true, effects: { mods: { opening: .1, take: 1.03 } } },
  { id: 'softHeart', name: '온정', desc: '긍정적 유대 증가 1.1배, 가족 활동 가중치 1.2배', good: true, weight: 7, born: true, effects: { bond: 1.1, activity: { family: 1.2 } } },
  { id: 'wanderlust', name: '방랑벽', desc: '방랑 활동 가중치 1.3배', good: true, weight: 6, born: true, effects: { activity: { roam: 1.3 } } },
  { id: 'bookworm', name: '독서광', desc: '지능 +3, 속도 −1', good: true, weight: 5, born: true, effects: { stats: { int: 3, spd: -1 } } },
  { id: 'workaholic', name: '일벌레', desc: '일 수입 1.1배, 휴식 활동 가중치 0.8배', good: true, weight: 6, born: true, effects: { income: 1.1, activity: { rest: .8 } } },
  { id: 'sleepyhead', name: '잠꾸러기', desc: '휴식 활동 가중치 1.3배, 일 수입 0.95배', good: false, weight: 5, born: true, effects: { activity: { rest: 1.3 }, income: .95 } },
  { id: 'frailSkin', name: '연피', desc: '받는 피해 +4%, 속도 +1', good: false, weight: 4, born: true, effects: { mods: { take: 1.04 }, stats: { spd: 1 } } },
  { id: 'thickSkin', name: '철피', desc: '받는 피해 4% 감소', good: true, weight: 6, born: true, effects: { mods: { take: .96 } } },
  { id: 'sensitiveEar', name: '청음', desc: '견문색 숙련 1.15배', good: true, weight: 5, born: true, effects: { mastery: { observation: 1.15 } } },
  { id: 'grip', name: '악력', desc: '검술 숙련 1.1배, 힘 +1', good: true, weight: 6, born: true, effects: { mastery: { sword: 1.1 }, stats: { str: 1 } } },
  { id: 'rubberMind', name: '기발함', desc: '열매 숙련 1.15배', good: true, weight: 4, born: true, effects: { mastery: { fruit: 1.15 } } },
  { id: 'kinglySpirit', name: '왕기', desc: '패왕색 숙련 1.15배, 의지 +1', good: true, weight: 2, born: true, effects: { mastery: { conqueror: 1.15 }, stats: { wil: 1 } } },
  { id: 'hardPalm', name: '굳은살', desc: '무장색 숙련 1.1배', good: true, weight: 6, born: true, effects: { mastery: { armament: 1.1 } } },
  { id: 'weakImmunity', name: '면역저하', desc: '질병 확률 1.25배', good: false, weight: 4, born: true, effects: { illness: 1.25 } },
  { id: 'quickMending', name: '재생력', desc: '긍정적 HP 회복 1.15배', good: true, weight: 5, born: true, effects: { healing: 1.15 } },
  { id: 'slowMending', name: '회복지연', desc: '부상 기간 1.2배', good: false, weight: 4, born: true, effects: { injury: 1.2 } },
  { id: 'longBreath', name: '장호흡', desc: '노환 확률 0.85배', good: true, weight: 4, born: true, effects: { oldAge: .85 } },
  { id: 'recklessness', name: '무모함', desc: '피해 +5%, 사망·부상 위험 1.15배', good: false, weight: 5, born: true, effects: { mods: { dmg: 1.05 }, danger: 1.15 } },
  { id: 'prudence', name: '신중함', desc: '사망·부상 위험 0.9배, 첫 2합 피해 −5%', good: true, weight: 6, born: true, effects: { danger: .9, mods: { opening: -.05 } } },
  { id: 'homesickness', name: '향수', desc: '고향에서 긍정적 HP 회복 1.2배', good: true, weight: 5, born: true, effects: { healing: 1.2, condition: 'home' } },
  { id: 'solitude', name: '고독벽', desc: '긍정적 유대 증가 0.8배, 모든 숙련 1.05배', good: false, weight: 4, born: true, effects: { bond: .8, mastery: { all: 1.05 } } },
  { id: 'stageFright', name: '소심함', desc: '첫 2합 피해 −8%, 회피 +2%p', good: false, weight: 5, born: true, effects: { mods: { opening: -.08, dodge: .02 } } },
  { id: 'boldness', name: '대담함', desc: '성공 판정 선택지 확률 +2%p', good: true, weight: 5, born: true, effects: { chance: .02 } },
  { id: 'frugality', name: '검약', desc: '일 수입 1.04배', good: true, weight: 6, born: true, effects: { income: 1.04 } },
  { id: 'tenderBones', name: '유연성', desc: '회피 +2%p, 부상 기간 3분의 2배', good: true, weight: 6, born: true, effects: { mods: { dodge: .02 }, injury: 2 / 3 } },
  { id: 'survivalInstinct', name: '생존본능', desc: '사망·부상 위험 0.8배', good: true, weight: 4, born: false, effects: { danger: .8 }, earn: { kind: 'recover', count: 3 } },
  { id: 'veteran', name: '노련', desc: '받아치기 피해 +15%', good: true, weight: 4, born: false, effects: { mods: { counter: .15 } }, earn: { kind: 'win', count: 5 } },
  { id: 'escort', name: '호위술', desc: '동료가 있을 때 받는 피해 10% 감소', good: true, weight: 4, born: false, effects: { mods: { take: .9 }, condition: 'crew' }, earn: { kind: 'crew', count: 3 } },
  { id: 'firstAid', name: '응급처치', desc: '긍정적 HP 회복 1.2배', good: true, weight: 4, born: false, effects: { healing: 1.2 }, earn: { kind: 'recover', count: 5 } },
  { id: 'adversity', name: '역경', desc: '부상 중 피해 +12%', good: true, weight: 3, born: false, effects: { mods: { dmg: 1.12 }, condition: 'injured' }, earn: { kind: 'loss', count: 3 } },
  { id: 'bargaining', name: '교섭', desc: '거래 비용 4% 할인', good: true, weight: 4, born: false, effects: { discount: .04 }, earn: { kind: 'trade', count: 3 } },
  { id: 'inheritance', name: '전승', desc: '모든 숙련 1.15배', good: true, weight: 3, born: false, effects: { mastery: { all: 1.15 } }, earn: { kind: 'master', count: 3 } },
  { id: 'notoriety', name: '악명', desc: '첫 2합 피해 +15%', good: true, weight: 3, born: false, effects: { mods: { opening: .15 } }, earn: { kind: 'value', key: 'dominion', count: 5 } },
  { id: 'justice', name: '정의', desc: '방어율 +5%p', good: true, weight: 4, born: false, effects: { mods: { guard: .05 } }, earn: { kind: 'value', key: 'justice', count: 3 } },
  { id: 'gourmand', name: '먹보', desc: '최대 체력 +16%', good: true, weight: 4, born: false, effects: { mods: { hp: 1.16 } }, earn: { kind: 'meal', count: 3 }, family: 'appetite', rank: 2 },
  { id: 'coordination', name: '협응', desc: '건강한 동료 전투력의 10%를 개인전에도 지원받는다. 개인 전투력의 20% 한도', good: true, weight: 4, born: false, effects: { coordination: .1 }, earn: { kind: 'value', key: 'loyalty', count: 3 } },
  { id: 'knowledge', name: '지식', desc: '치명타 확률 +5%p', good: true, weight: 4, born: false, effects: { mods: { crit: .05 } }, earn: { kind: 'value', key: 'inquiry', count: 3 } },
  { id: 'negotiator', name: '협상가', desc: '거래 비용 5% 할인', good: true, weight: 4, born: false, effects: { discount: .05 }, earn: { kind: 'trade', count: 5 }, family: 'trade', rank: 1 },
  { id: 'silverTongue', name: '달변가', desc: '거래 비용 10% 할인', good: true, weight: 3, born: false, effects: { discount: .1 }, earn: { kind: 'trade', count: 12 }, family: 'trade', rank: 2 },
  { id: 'navigator', name: '항해술', desc: '바다 위 피해 +8%', good: true, weight: 4, born: false, effects: { mods: { atSea: .08 } }, earn: { kind: 'voyage', count: 3 } },
  { id: 'seaVeteran', name: '해전술', desc: '바다 위 받는 피해 8% 감소', good: true, weight: 3, born: false, effects: { mods: { take: .92 }, condition: 'sea' }, earn: { kind: 'voyage', count: 8 } },
  { id: 'swordsman', name: '검리', desc: '검술 숙련 1.2배', good: true, weight: 4, born: false, effects: { mastery: { sword: 1.2 } }, earn: { kind: 'master', key: 'sword', count: 4 } },
  { id: 'marksman', name: '탄도학', desc: '사격 숙련 1.2배', good: true, weight: 4, born: false, effects: { mastery: { gun: 1.2 } }, earn: { kind: 'activity', key: 'study', count: 6 } },
  { id: 'boxer', name: '권법', desc: '체술 숙련 1.2배', good: true, weight: 4, born: false, effects: { mastery: { fist: 1.2 } }, earn: { kind: 'activity', key: 'train', count: 6 } },
  { id: 'ironWill', name: '강심', desc: '의지 +4', good: true, weight: 4, born: false, effects: { stats: { wil: 4 } }, earn: { kind: 'value', key: 'ambition', count: 4 } },
  { id: 'peacekeeper', name: '중재', desc: '긍정적 유대 증가 1.2배', good: true, weight: 4, born: false, effects: { bond: 1.2 }, earn: { kind: 'value', key: 'peace', count: 3 } },
  { id: 'freeSpirit', name: '자유혼', desc: '회피 +4%p', good: true, weight: 4, born: false, effects: { mods: { dodge: .04 } }, earn: { kind: 'value', key: 'freedom', count: 4 } },
  { id: 'romantic', name: '낭만', desc: '운 +4', good: true, weight: 4, born: false, effects: { stats: { luk: 4 } }, earn: { kind: 'value', key: 'romance', count: 4 } },
  { id: 'merchant', name: '상재', desc: '일 수입 1.15배', good: true, weight: 4, born: false, effects: { income: 1.15 }, earn: { kind: 'value', key: 'greed', count: 4 } },
  { id: 'drill', name: '단련', desc: '최대 체력 +10%', good: true, weight: 4, born: false, effects: { mods: { hp: 1.1 } }, earn: { kind: 'activity', key: 'train', count: 10 } },
  { id: 'scholar', name: '학구', desc: '지능 +4', good: true, weight: 4, born: false, effects: { stats: { int: 4 } }, earn: { kind: 'activity', key: 'study', count: 10 } },
  { id: 'artisan', name: '장인정신', desc: '일 수입 1.12배', good: true, weight: 4, born: false, effects: { income: 1.12 }, earn: { kind: 'activity', key: 'work', count: 8 } },
  { id: 'explorer', name: '탐험심', desc: '성공 판정 선택지 확률 +3%p', good: true, weight: 4, born: false, effects: { chance: .03 }, earn: { kind: 'activity', key: 'roam', count: 8 } },
  { id: 'familyBond', name: '가족애', desc: '긍정적 유대 증가 1.25배', good: true, weight: 4, born: false, effects: { bond: 1.25 }, earn: { kind: 'activity', key: 'family', count: 8 } },
  { id: 'convalescence', name: '섭생', desc: '질병 확률 0.75배', good: true, weight: 4, born: false, effects: { illness: .75 }, earn: { kind: 'activity', key: 'rest', count: 8 } },
  { id: 'rally', name: '재기', desc: '체력이 낮을 때 방어율 +10%p', good: true, weight: 3, born: false, effects: { mods: { guard: .1 }, condition: 'lowHp' }, earn: { kind: 'loss', count: 5 } },
  { id: 'seaWolf', name: '해전감각', desc: '바다 위 치명타 +6%p', good: true, weight: 3, born: false, effects: { mods: { crit: .06 }, condition: 'sea' }, earn: { kind: 'win', key: 'east', count: 5 } },
  { id: 'grandLine', name: '낙원경험', desc: '사망·부상 위험 0.85배', good: true, weight: 3, born: false, effects: { danger: .85 }, earn: { kind: 'win', key: 'gl_first', count: 5 } },
  { id: 'newWorld', name: '신세계경험', desc: '모든 피해 +8%', good: true, weight: 2, born: false, effects: { mods: { dmg: 1.08 } }, earn: { kind: 'win', key: 'nw_first', count: 5 } },
  { id: 'command', name: '통솔', desc: '건강한 동료 전투력의 15%를 개인전에도 지원받는다. 개인 전투력의 20% 한도', good: true, weight: 3, born: false, effects: { coordination: .15 }, earn: { kind: 'crew', count: 8 }, family: 'leadership', rank: 1 },
  { id: 'fleetCommand', name: '제독술', desc: '건강한 동료 전투력의 20%를 개인전에도 지원받는다. 개인 전투력의 20% 한도', good: true, weight: 2, born: false, effects: { coordination: .2 }, earn: { kind: 'crew', count: 15 }, family: 'leadership', rank: 2 },
  { id: 'hakiPractice', name: '기백', desc: '패기 숙련 1.2배', good: true, weight: 3, born: false, effects: { mastery: { haki: 1.2 } }, earn: { kind: 'master', count: 8 } },
  { id: 'endurance', name: '인내', desc: '부상 기간 3분의 2배', good: true, weight: 3, born: false, effects: { injury: 2 / 3 }, earn: { kind: 'recover', count: 10 } },
  { id: 'battleRead', name: '간파', desc: '치명타 +4%p, 회피 +2%p', good: true, weight: 3, born: false, effects: { mods: { crit: .04, dodge: .02 } }, earn: { kind: 'win', count: 12 } },
  { id: 'oceanWisdom', name: '해양지식', desc: '바다 위 성공 판정 선택지 확률 +5%p', good: true, weight: 3, born: false, effects: { chance: .05, condition: 'sea' }, earn: { kind: 'voyage', count: 12 } },
];
export const TRAIT_BY_ID = Object.fromEntries(NEW_TRAITS.map(t => [t.id, t])) as Record<string, TraitDef>;
