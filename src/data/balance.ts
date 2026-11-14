// 수치 모음. 규칙 코드에 숫자를 직접 쓰지 않는다. 모두 출발값이며 대량 시뮬레이션으로 맞춘다.
import type { BranchId, StatKey, Tactic } from '../core/types';

export const B = {
  log: { max: 300 },
  clock: { speeds: { 1: 600, 2: 300, 4: 150 } as Record<number, number> },

  // ---- 시간 · 유년기
  childhood: { ages: [3, 6, 9], startTickAge: 10 },
  startYear: 1490,

  // ---- 자동 성장 (03 문서 4장)
  growth: {
    byAge: [
      { max: 15, rate: 0.5 }, { max: 30, rate: 0.6 }, { max: 45, rate: 0.35 }, { max: 59, rate: 0.15 }, { max: 999, rate: 0 },
    ],
    noFocusEach: 0.2 / 6,     // 주력이 없으면 여섯 능력치가 고르게 (월 0.2를 나눔)
    secondaryMult: 0.5,
    masterMult: 2,
    heavyInjuryMult: 0.5,
    split: {
      'martial.fist': { str: 0.5, vit: 0.3, spd: 0.2 },
      'martial.sword': { str: 0.4, spd: 0.4, wil: 0.2 },
      'martial.gun': { spd: 0.5, int: 0.3, luk: 0.2 },
      'haki.observation': { wil: 0.4, spd: 0.3, int: 0.3 },
      'haki.armament': { wil: 0.5, vit: 0.3, str: 0.2 },
      'haki.conqueror': { wil: 0.7, luk: 0.3 },
      'fruit': { int: 0.5, wil: 0.3, vit: 0.2 },
    } as Record<BranchId, Partial<Record<StatKey, number>>>,
    masteryPerMonth: 1.6,     // ÷ 기술 단계
    battleMastery: { routine: 0.5, elite: 2, winMult: 1.5 },
    eliteWinStat: 0.6,        // 강적을 이기면 오르는 능력치 (상대 힘 비율에 곱함)
  },

  // ---- 선택 (03 문서 5장)
  choice: { gapMin: 3, gapMax: 6, perYear: 3, fruitAskWithin: 6, retrainYears: 3 },

  // ---- 몸 (03 문서 7장)
  body: {
    injury: {
      light: { months: 2, statMult: 0.95 },
      heavy: { months: 6, statMult: 0.8 },
      scar: { amount: 3 },
      heavyToScarIfFight: 0.3,
      treatMult: 0.5,
    },
    illness: {
      yearly: 0.04, agePerYear: 0.005, ageFrom: 50, heavyInjuryAdd: 0.05,
      worsenEvery: 4, stage3DeathMonthly: 0.03, medicMult: 0.5,
    },
    aging: { from1: 46, rate1: 0.01, from2: 60, rate2: 0.03 },
    oldAge: { from: 60, k: 0.0015 },
    healthRecover: 4,         // 다치지 않았을 때 달마다 되찾는 건강
  },

  // ---- 돈 (03 문서 8장)
  money: {
    living: 300,              // × 해역 단계
    pirateIncome: 450,        // × 해역 단계. 해적 · 혁명군의 달마다 벌이 (약탈, 잡일)
    marineSalary: 900,        // × (계급+1) × 해역 단계
    pirateLoot: [800, 3000],  // × 해역 단계, 평소 교전 승리 때
    treatInjury: { light: 1000, heavy: 3000 },   // × 해역 단계
    treatIllness: 4000,      // × 해역 단계
    appraise: 5000,           // × 해역 단계
    fruitSell: [0, 20000, 60000, 150000, 400000, 1000000],   // 등급별
    loseMoneyPct: 0.2,
  },

  // ---- 전투 (04 문서)
  combat: {
    maxRounds: 20,
    hp: { base: 80, perVit: 8, healthFloor: 0.5 },
    sp: { base: 40, perWil: 4 },
    defPerVit: 0.6,
    initiativeRand: 10,
    basicRecover: 5,
    mastery: { min: 0.7, span: 0.6 },
    crit: { base: 0.05, perLuk: 0.001, mult: 1.5 },
    dodge: { base: 0.03, perSpd: 0.003, max: 0.25, perObs: 0.05, areaMult: 0.5 },
    logia: [0.25, 0.5, 0.75, 1],
    defenseK: 2,
    rand: [0.9, 1.1],
    bigPower: 2.0,
    tactic: {
      offense: { deal: 1.15, take: 1.15, cost: 1 },
      defense: { deal: 0.9, take: 0.8, cost: 1 },
      counter: { deal: 0.95, take: 1.0, cost: 1, counterDeal: 1.4 },
      endurance: { deal: 0.95, take: 0.95, cost: 0.7, lateRound: 10, lateDeal: 1.2 },
    } as Record<Tactic, { deal: number; take: number; cost: number; counterDeal?: number; lateRound?: number; lateDeal?: number }>,
    helperPower: 0.5, supportHelperPower: 0.7,
    medicEvery: 3, medicHeal: 0.15,
    restSp: 0.2,
    retreat: { base: 0.5, perSpd: 0.01, min: 0.2, max: 0.9 },
    drown: { hpBelow: 0.3, p: 0.2, navigatorP: 0.1 },
    seastoneSeal: 2,
    preview: { runs: 200, noiseBase: 15, noisePerInt: 0.1 },
    risk: { safe: 0.7, danger: 0.35 },
    deathP: { safe: 0, danger: 0.05, lethal: 0.25 },
    deathLukReduce: 0.003,
    nearDeathGateP: 0.15,
    result: {
      win: { light: 0.1 },
      retreat: { light: 0.3 },
      lose: { light: 0.5, heavy: 0.35, scar: 0.15 },
    },
    crewDeathLethal: 0.05,
    crewInjuryMonths: 4,
    routine: {
      chance: { pirate: 0.12, marine: 0.15, revolution: 0.12, none: 0.03 }, missionAdd: 0.05, loseLight: 0.4,
    },
    scout: { midInt: 30, fullInt: 60 },
  },

  // ---- 세계
  world: {
    missionsPerSea: 3,
    refillMonths: 6,
    bossRetryAskMonths: 12,
    fameBossMult: 1,
    rankFromBoss: 1,
    routeAge: 16,
  },

  // ---- 동료
  crew: { powerPerLevel: 6, levelEveryMonths: 12, maxLevel: 30 },
};
