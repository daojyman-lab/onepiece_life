// 바다의 날씨. 항해 중(core/passage.ts) 한 토막마다 그 해역의 표로 날씨를 굴린다.
// 연혁 보정(세계 정세)은 나중에 YEAR_WEATHER로 더한다.

export type Weather = 'clear' | 'tailwind' | 'fog' | 'storm' | 'calm' | 'anomaly';
export type SeaZone = 'blue' | 'paradise' | 'newWorld' | 'calmBelt';

/** 해역별 날씨 확률 (합 100) */
export const WEATHER_TABLE: Record<SeaZone, Record<Weather, number>> = {
  blue:     { clear: 50, tailwind: 25, fog: 10, storm: 10, calm: 5,   anomaly: 0 },
  paradise: { clear: 30, tailwind: 15, fog: 15, storm: 30, calm: 5,   anomaly: 5 },
  newWorld: { clear: 20, tailwind: 10, fog: 10, storm: 30, calm: 5,   anomaly: 25 },
  calmBelt: { clear: 0,  tailwind: 0,  fog: 0,  storm: 0,  calm: 100, anomaly: 0 },
};

/** v5의 SeaId를 해역으로 묶는다. 모르는 바다는 4개의 바다로 본다 */
export function zoneOf(sea: string): SeaZone {
  if (sea.startsWith('nw')) return 'newWorld';
  if (sea.startsWith('gl') || sea === 'sabaody') return 'paradise';
  return 'blue';
}

/** 칼름벨트를 건너야 닿는 섬 */
export const CALM_BELT_ISLANDS: readonly string[] = ['아마존 릴리', '루스카이나'];

/** 칼름벨트에서 한 토막마다 해왕류와 마주칠 확률 */
export const SEA_KING_CHANCE = 0.4;

/** 신세계 이상기후의 모습 (기록 문장만 다르다) */
export const ANOMALY_KINDS = ['바다 위로 번개비가 쏟아졌다', '불길이 이는 바다를 가로질렀다', '주먹만 한 우박이 갑판을 두드렸다'] as const;

/** 날씨마다 남는 기록 */
export const WEATHER_LINES: Record<Weather, readonly string[]> = {
  clear: ['바다가 잔잔해 돛을 펴고 순항했다.', '맑은 하늘 아래 물길을 따라 나아갔다.'],
  tailwind: ['순풍을 받아 배가 미끄러지듯 달렸다.', '바람이 등을 밀어 예정보다 빨리 나아갔다.'],
  fog: ['짙은 안개 속에서 뱃머리만 겨우 보였다.', '안개에 갇혀 종을 울리며 천천히 나아갔다.'],
  storm: ['하늘이 갑자기 어두워지더니 폭풍이 몰아쳤다.'],
  calm: ['바람 한 점 없는 바다에 배가 멈춰 섰다.', '돛이 축 늘어진 채 하루하루가 흘렀다.'],
  anomaly: ['신세계의 바다가 이빨을 드러냈다.'],
};

/** 날씨가 항해에 주는 힘. progress: 줄어드는 남은 토막 수 */
export const WEATHER_EFFECT: Record<Weather, { progress: number; hp: number }> = {
  clear:    { progress: 1, hp: 0 },
  tailwind: { progress: 2, hp: 0 },
  fog:      { progress: 1, hp: 0 },    // 길을 잃으면 한 토막 더 걸린다 (sail.ts)
  storm:    { progress: 0, hp: 0 },    // 뱃길에 따라 갈린다 (sail.ts STORM_BY_ROUTE)
  calm:     { progress: 0, hp: 0 },
  anomaly:  { progress: 1, hp: -15 },
};

/** 안개 · 이상기후에서 길을 잃을 확률 (항해 실력 0~3에 따라) */
export const DRIFT_CHANCE = [0.5, 0.3, 0.15, 0.05] as const;

/**
 * 연혁에 따른 날씨 보정 (해원력 → 해역 → 날씨 → 더할 확률). 아직 비워 둔다.
 * 예: { 1522: { newWorld: { storm: +10 } } }
 */
export const YEAR_WEATHER: Record<number, Partial<Record<SeaZone, Partial<Record<Weather, number>>>>> = {};
