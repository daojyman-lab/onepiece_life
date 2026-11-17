// 패시브: 주인공의 특성과 악마의 열매. 기술이 아니라 늘 걸려 있는 효과다 (2026-11-14 재설계).
// 전투 규칙은 core/combat/engine.ts가 Mods를 읽어 적용한다. 값만 여기서 고친다.
import type { Species, Stats } from '../core/types';
import { FRUITS } from './fruits';

export type Element = 'fire' | 'elec' | 'ice' | 'light' | 'magma' | 'dark' | 'poison' | 'sand' | 'smoke' | 'quake';
export const ELEMENT_NAMES: Record<Element, string> = {
  fire: '불', elec: '전기', ice: '얼음', light: '빛', magma: '마그마', dark: '어둠', poison: '독', sand: '모래', smoke: '연기', quake: '진동',
};

/** 전투에 걸리는 효과. 배율(× 1.3)은 1을 기준으로, 더하는 값(+0.1)은 0을 기준으로 적는다 */
export interface Mods {
  dmg?: number;              // 모든 공격 ×
  phys?: number;             // 열매 기술이 아닌 공격(무술 · 기본 공격) ×
  take?: number;             // 받는 피해 ×
  dodge?: number;            // 회피 +
  guard?: number;            // 받는 피해 −
  hp?: number;               // 최대 체력 ×
  stat?: Partial<Stats>;     // 능력치 ×
  element?: Element;         // 내 공격에 실리는 속성
  resist?: Partial<Record<Element, number>>;   // 그 속성의 공격을 받을 때 × (0이면 무효)
  proc?: { p: number; power: number; element?: Element; name: string };   // 공격 뒤 확률로 추가 공격
  regen?: number;            // 합마다 최대 체력의 % 회복
  drain?: number;            // 준 피해의 % 회복
  bindOnHit?: number;        // 맞히면 상대를 한 합 묶을 확률
  sealOnHit?: number;        // 맞히면 상대 열매를 한 합 봉인할 확률
  crit?: number;             // 치명타 확률 +
  critMult?: number;         // 치명타 배율 (기본 1.5)
  lowHpPower?: number;       // 체력이 비어 갈수록 피해 + (0이면 없음, 체력 0에 가까우면 +이 값)
  opening?: number;          // 첫 2합 피해 +
  lastStand?: boolean;       // 쓰러질 공격을 한 번 버틴다
  allyDown?: number;         // 우리 편이 쓰러지면 피해 +
  atSea?: number;            // 바다 위 전투 피해 +
  counter?: number;          // 받아치기(큰 기술 뒤) 기술 피해 +
  sp?: number;               // 최대 기력 ×
}

// ---------------------------------------------------------------- 주인공의 특성
export interface HeroTrait { id: string; name: string; desc: string; mods: Mods }

export const HERO_TRAITS: HeroTrait[] = [
  { id: 'bloodlust', name: '피냄새', desc: '체력이 떨어질수록 강해진다 (최대 피해 +60%)', mods: { lowHpPower: 0.6 } },
  { id: 'ironwall', name: '철벽', desc: '받는 피해 −12%', mods: { guard: 0.12 } },
  { id: 'firststrike', name: '선수필승', desc: '첫 2합 동안 피해 +40%', mods: { opening: 0.4 } },
  { id: 'tenacity', name: '불굴', desc: '쓰러질 공격을 한 번 버틴다 · 최대 체력 +5%', mods: { lastStand: true, hp: 1.05 } },
  { id: 'keeneye', name: '눈치', desc: '회피 +8%', mods: { dodge: 0.08 } },
  { id: 'gambler', name: '승부사', desc: '치명타 확률 +10%, 치명타 피해 1.8배', mods: { crit: 0.1, critMult: 1.8 } },
  { id: 'fighting', name: '투지', desc: '최대 기력 +30%, 피해 +5%', mods: { sp: 1.3, dmg: 1.05 } },
  { id: 'coolhead', name: '냉철', desc: '받아치기 기술 피해 +30%', mods: { counter: 0.3 } },
  { id: 'bighearted', name: '대식가', desc: '최대 체력 +20%', mods: { hp: 1.2 } },
  { id: 'comrade', name: '동료애', desc: '우리 편이 쓰러지면 피해 +30%', mods: { allyDown: 0.3 } },
  { id: 'seaborn', name: '바다 사나이', desc: '바다 위 전투 피해 +20%', mods: { atSea: 0.2 } },
  { id: 'brute', name: '괴력', desc: '힘 +12%', mods: { stat: { str: 1.12 } } },
  { id: 'swift', name: '날쌘돌이', desc: '속도 +12%', mods: { stat: { spd: 1.12 } } },
  { id: 'vampire', name: '집념', desc: '준 피해의 8%만큼 체력을 되찾는다', mods: { drain: 0.08 } },
];
export const HERO_TRAIT_BY_ID = Object.fromEntries(HERO_TRAITS.map((t) => [t.id, t])) as Record<string, HeroTrait>;

// ---------------------------------------------------------------- 악마의 열매
/** 열매의 패시브. awaken이 없으면 각성할 수 없다 (쓰레기 · 평범 등급) */
export interface FruitPassive { text: string; mods: Mods; awakenText?: string; awaken?: Mods }

export const FRUIT_PASSIVES: Record<string, FruitPassive> = {
  // 전설
  gura: { text: '공격할 때 25% 확률로 진동파(위력 1.5)가 터진다 · 피해 +25%', mods: { dmg: 1.25, proc: { p: 0.25, power: 1.5, element: 'quake', name: '진동파' } },
    awakenText: '공기와 바다를 깨뜨린다: 진동파 40% · 위력 2.2, 받는 피해 −10%', awaken: { dmg: 1.3, take: 0.9, proc: { p: 0.4, power: 2.2, element: 'quake', name: '대진동' } } },
  magu: { text: '공격에 마그마가 실린다 · 피해 +30% · 불 무효 · 20% 확률로 용암 주먹(1.4)', mods: { element: 'magma', dmg: 1.3, resist: { fire: 0 }, proc: { p: 0.2, power: 1.4, element: 'magma', name: '용암 주먹' } },
    awakenText: '대지를 녹인다: 피해 +45%, 용암 주먹 35% · 2.0', awaken: { element: 'magma', dmg: 1.45, resist: { fire: 0, magma: 0 }, proc: { p: 0.35, power: 2.0, element: 'magma', name: '유성화산' } } },
  yami: { text: '어둠이 모든 것을 끌어당긴다 · 준 피해 15% 흡수 · 맞히면 20% 확률로 상대 열매 봉인 · 받는 피해 +15%', mods: { element: 'dark', drain: 0.15, sealOnHit: 0.2, take: 1.15 },
    awakenText: '블랙홀: 흡수 25%, 봉인 35%, 받는 피해 +10%', awaken: { element: 'dark', drain: 0.25, sealOnHit: 0.35, take: 1.1, dmg: 1.15 } },
  nika: { text: '몸이 고무처럼 늘어난다 · 물리 공격 1.4배 · 전기 무효 · 합마다 체력 3% 회복', mods: { phys: 1.4, resist: { elec: 0 }, regen: 0.03 },
    awakenText: '해방의 전사: 물리 1.6배, 회피 +10%, 회복 5%, 맞히면 15% 확률로 상대를 고무처럼 묶는다', awaken: { phys: 1.6, resist: { elec: 0 }, regen: 0.05, dodge: 0.1, bindOnHit: 0.15 } },
  // 희귀
  mera: { text: '공격에 불이 실린다 · 피해 +20% · 불 무효 · 20% 확률로 화권(1.3)', mods: { element: 'fire', dmg: 1.2, resist: { fire: 0 }, proc: { p: 0.2, power: 1.3, element: 'fire', name: '화권' } },
    awakenText: '불바다: 피해 +30%, 화권 35% · 1.8', awaken: { element: 'fire', dmg: 1.3, resist: { fire: 0 }, proc: { p: 0.35, power: 1.8, element: 'fire', name: '염제' } } },
  goro: { text: '공격에 번개가 실린다 · 속도 +25% · 전기 무효 · 20% 확률로 방전(1.4)', mods: { element: 'elec', stat: { spd: 1.25 }, resist: { elec: 0 }, proc: { p: 0.2, power: 1.4, element: 'elec', name: '방전' }, crit: 0.05 },
    awakenText: '뇌신: 속도 +40%, 방전 35% · 2.0', awaken: { element: 'elec', stat: { spd: 1.4 }, resist: { elec: 0 }, proc: { p: 0.35, power: 2.0, element: 'elec', name: '천벌' }, crit: 0.08 } },
  hie: { text: '공격에 냉기가 실린다 · 맞히면 15% 확률로 얼려 묶는다 · 받는 피해 −8%', mods: { element: 'ice', bindOnHit: 0.15, guard: 0.08, resist: { ice: 0 } },
    awakenText: '빙하기: 얼려 묶기 30%, 받는 피해 −12%', awaken: { element: 'ice', bindOnHit: 0.3, guard: 0.12, resist: { ice: 0 } } },
  pika: { text: '빛의 속도 · 속도 +35% · 회피 +8%', mods: { element: 'light', stat: { spd: 1.35 }, dodge: 0.08 },
    awakenText: '광속 발차기: 속도 +50%, 회피 +12%, 치명타 +10%', awaken: { element: 'light', stat: { spd: 1.5 }, dodge: 0.12, crit: 0.1 } },
  ope: { text: '공간을 가른다 · 피해 +15% · 받는 피해 −10% · 15% 확률로 절단(1.6)', mods: { dmg: 1.15, take: 0.9, proc: { p: 0.15, power: 1.6, name: '절단' } },
    awakenText: '불로수술의 경지: 절단 30% · 2.4', awaken: { dmg: 1.2, take: 0.85, proc: { p: 0.3, power: 2.4, name: '감마 나이프' } } },
  ito: { text: '실로 엮는다 · 맞히면 15% 확률로 묶는다 · 20% 확률로 실 채찍(1.2)', mods: { bindOnHit: 0.15, proc: { p: 0.2, power: 1.2, name: '실 채찍' } },
    awakenText: '새장: 묶기 30%, 피해 +20%', awaken: { bindOnHit: 0.3, dmg: 1.2, proc: { p: 0.3, power: 1.5, name: '새장' } } },
  tori_phoenix: { text: '푸른 불꽃의 재생 · 합마다 체력 5% 회복', mods: { regen: 0.05 },
    awakenText: '불사조: 회복 9%, 받는 피해 −10%', awaken: { regen: 0.09, take: 0.9 } },
  // 우수
  suna: { text: '공격이 수분을 빼앗는다 · 준 피해 10% 흡수 · 모래 무효', mods: { element: 'sand', drain: 0.1, resist: { sand: 0 } },
    awakenText: '사막의 왕: 흡수 20%, 25% 확률로 모래 폭풍(1.6)', awaken: { element: 'sand', drain: 0.2, resist: { sand: 0 }, proc: { p: 0.25, power: 1.6, element: 'sand', name: '모래 폭풍' } } },
  moku: { text: '연기로 감싼다 · 맞히면 15% 확률로 묶는다 · 회피 +5%', mods: { element: 'smoke', bindOnHit: 0.15, dodge: 0.05 },
    awakenText: '흰 사냥꾼: 묶기 25%, 회피 +8%', awaken: { element: 'smoke', bindOnHit: 0.25, dodge: 0.08 } },
  hana: { text: '어디서든 팔이 피어난다 · 25% 확률로 추가 타격(1.0)', mods: { proc: { p: 0.25, power: 1.0, name: '꽃 피는 팔' } },
    awakenText: '거대한 꽃: 추가 타격 40% · 1.6', awaken: { proc: { p: 0.4, power: 1.6, name: '거대 꽃' }, bindOnHit: 0.1 } },
  neko_leo: { text: '표범으로 변한다 · 힘 +30%, 속도 +15%', mods: { stat: { str: 1.3, spd: 1.15 } },
    awakenText: '육식의 극의: 힘 +50%, 속도 +25%, 최대 체력 +10%', awaken: { stat: { str: 1.5, spd: 1.25 }, hp: 1.1 } },
  tori_falcon: { text: '매로 변한다 · 속도 +30%, 회피 +6%', mods: { stat: { spd: 1.3 }, dodge: 0.06 },
    awakenText: '하늘의 수호자: 속도 +45%, 회피 +10%', awaken: { stat: { spd: 1.45 }, dodge: 0.1 } },
  bari: { text: '배리어 · 받는 피해 −18%', mods: { guard: 0.18 },
    awakenText: '배리어 크래시: 받는 피해 −28%, 15% 확률로 배리어 들이받기(1.2)', awaken: { guard: 0.28, proc: { p: 0.15, power: 1.2, name: '배리어 크래시' } } },
  doku: { text: '독이 스민다 · 25% 확률로 독(0.8) · 독 무효', mods: { element: 'poison', resist: { poison: 0 }, proc: { p: 0.25, power: 0.8, element: 'poison', name: '독' } },
    awakenText: '지옥의 심판: 독 40% · 1.4', awaken: { element: 'poison', resist: { poison: 0 }, proc: { p: 0.4, power: 1.4, element: 'poison', name: '베놈 데몬' } } },
  numa: { text: '늪이 삼킨다 · 준 피해 8% 흡수 · 받는 피해 −8%', mods: { drain: 0.08, take: 0.92 },
    awakenText: '끝없는 늪: 흡수 15%, 받는 피해 −12%', awaken: { drain: 0.15, take: 0.88 } },
  // 평범
  bara: { text: '몸이 분리된다 · 회피 +10%', mods: { dodge: 0.1 } },
  bomu: { text: '몸이 폭탄 · 15% 확률로 폭발(1.2) · 받는 피해 +5%', mods: { proc: { p: 0.15, power: 1.2, element: 'fire', name: '폭발' }, take: 1.05 } },
  supa: { text: '온몸이 칼날 · 물리 공격 1.15배 · 받는 피해 −5%', mods: { phys: 1.15, guard: 0.05 } },
  doru: { text: '촛농 갑옷 · 받는 피해 −10%', mods: { guard: 0.1 } },
  awa: { text: '미끄러운 거품 · 맞히면 10% 확률로 상대가 미끄러져 묶인다', mods: { bindOnHit: 0.1 } },
  ushi_giraffe: { text: '기린으로 변한다 · 힘 +15%, 체력 +10%', mods: { stat: { str: 1.15, vit: 1.1 } } },
  sube: { text: '매끈한 몸 · 회피 +12%', mods: { dodge: 0.12 } },
  buki: { text: '몸이 무기 · 물리 공격 1.12배', mods: { phys: 1.12 } },
  // 쓰레기
  inu_dachs: { text: '닥스훈트가 된다 · 체력 +8% · 귀엽다', mods: { stat: { vit: 1.08 } } },
  kusu: { text: '녹슬게 한다 · 10% 확률로 녹(0.6)', mods: { proc: { p: 0.1, power: 0.6, name: '녹' } } },
  kame: { text: '등껍질 · 받는 피해 −6%', mods: { guard: 0.06 } },
  beta: { text: '끈적끈적 · 맞히면 6% 확률로 묶는다', mods: { bindOnHit: 0.06 } },
};

// 새 원작 열매는 계통과 능력 주제에 맞는 기본 전투 효과를 갖는다.
// 기존의 개별 패시브가 있으면 그 효과를 우선한다.
for (const fruit of FRUITS) {
  if (FRUIT_PASSIVES[fruit.id]) continue;
  if (fruit.id === 'smile_failed') {
    FRUIT_PASSIVES[fruit.id] = { text: '능력은 얻지 못하고 웃음만 남는다. 헤엄칠 수 없다', mods: {} };
  } else if (fruit.id.startsWith('smile_')) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme}의 힘 · 힘과 속도 +8%`, mods: { stat: { str: 1.08, spd: 1.08 } } };
  } else if (fruit.cls === 'zoan') {
    const str = 1 + fruit.grade * 0.06, vit = 1 + fruit.grade * 0.04;
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} 변신 · 힘 +${Math.round((str - 1) * 100)}%, 체력 +${Math.round((vit - 1) * 100)}%`, mods: { stat: { str, vit } } };
  } else if (fruit.cls === 'logia') {
    const dmg = 1 + fruit.grade * 0.04, take = 1 - fruit.grade * 0.02;
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme}의 몸 · 피해 +${Math.round((dmg - 1) * 100)}%, 받는 피해 −${Math.round((1 - take) * 100)}%`, mods: { dmg, take } };
  } else if (/부활|호르몬|착즙|치유/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 합마다 체력 ${fruit.grade}% 회복`, mods: { regen: fruit.grade / 100 } };
  } else if (/둔화|감옥|표적|정적|기억|매료|장난감|봉제/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 적중 시 ${fruit.grade * 4}% 확률로 묶기`, mods: { bindOnHit: fruit.grade * 0.04 } };
  } else if (/성채|문|거울|바위|다이아몬드|재킷|주머니|의복|세탁/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 받는 피해 ${fruit.grade * 4}% 감소`, mods: { guard: fruit.grade * 0.04 } };
  } else if (/투명|변장|투시|미래|나이|지식|순간이동/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 회피 +${fruit.grade * 3}%, 치명타 +${fruit.grade * 2}%`, mods: { dodge: fruit.grade * 0.03, crit: fruit.grade * 0.02 } };
  } else if (/무게|중력|거대화/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 힘 +${fruit.grade * 6}%`, mods: { stat: { str: 1 + fruit.grade * 0.06 } } };
  } else if (/영혼/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 준 피해의 ${fruit.grade * 3}% 회복`, mods: { drain: fruit.grade * 0.03 } };
  } else if (/요리/.test(fruit.theme)) {
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 최대 체력 +${fruit.grade * 5}%`, mods: { hp: 1 + fruit.grade * 0.05 } };
  } else {
    const dmg = 1 + fruit.grade * 0.04;
    FRUIT_PASSIVES[fruit.id] = { text: `${fruit.theme} · 피해 +${Math.round((dmg - 1) * 100)}%`, mods: { dmg } };
  }
}

// ---------------------------------------------------------------- 종족
/** 종족마다 타고나는 패시브. 원작에서 그 종족이 보여 준 특징을 옮겼다 */
export interface SpeciesPassive { name: string; desc: string; who?: string; mods: Mods }
export const SPECIES_PASSIVES: Record<Species, SpeciesPassive | null> = {
  human: null,
  fishman: { name: '어인의 힘', desc: '인간의 열 배 힘 · 물리 공격 1.15배 · 바다 위 전투 피해 +15%', who: '징베, 아론', mods: { phys: 1.15, atSea: 0.15 } },
  merfolk: { name: '물고기 꼬리', desc: '바다 위 전투 피해 +20% · 회피 +5%', who: '시라호시, 케이미', mods: { atSea: 0.2, dodge: 0.05 } },
  mink: { name: '일렉트로', desc: '15% 확률로 전기를 실은 추가 타격(0.8) · 속도 +5%', who: '페드로, 캐럿', mods: { proc: { p: 0.15, power: 0.8, element: 'elec', name: '일렉트로' }, stat: { spd: 1.05 } } },
  giant: { name: '거인의 몸', desc: '최대 체력 1.3배 · 물리 공격 1.1배 · 회피 −5%', who: '동리, 브로기', mods: { hp: 1.3, phys: 1.1, dodge: -0.05 } },
  longarm: { name: '긴 팔', desc: '팔 마디가 하나 더 있다 · 첫 2합 피해 +20%', who: '스크래치멘 아푸', mods: { opening: 0.2 } },
  longleg: { name: '긴 다리', desc: '다리가 길다 · 속도 +10% · 회피 +4%', mods: { stat: { spd: 1.1 }, dodge: 0.04 } },
  threeeye: { name: '세 번째 눈', desc: '이마의 눈 · 회피 +6% · 치명타 +3%', who: '샬롯 푸딩', mods: { dodge: 0.06, crit: 0.03 } },
  tontatta: { name: '초고속 소인', desc: '작고 빠르다 · 회피 +10% · 속도 +10% · 최대 체력 0.85배', who: '레오, 맨셰리', mods: { dodge: 0.1, stat: { spd: 1.1 }, hp: 0.85 } },
  skypiean: { name: '하늘섬 날개', desc: '작은 날개 · 회피 +5% · 운이 좋다', who: '와이퍼, 코니스', mods: { dodge: 0.05, crit: 0.02 } },
  buccaneer: { name: '괴력', desc: '거인에 가까운 몸 · 힘 1.25배 · 최대 체력 1.15배', who: '바솔로뮤 쿠마', mods: { stat: { str: 1.25 }, hp: 1.15 } },
  lunarian: { name: '발화', desc: '등에 불이 붙는다 · 공격에 불이 실리고 불 무효 · 받는 피해 −15% · 10% 확률로 불꽃(1.0)', who: '화재의 킹', mods: { element: 'fire', resist: { fire: 0 }, guard: 0.15, proc: { p: 0.1, power: 1.0, element: 'fire', name: '불꽃' } } },
};
